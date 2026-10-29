import asyncio
import time
import unittest
from unittest.mock import patch

from bazaar_drishti.market import live_feed
from bazaar_drishti.market.live_feed import (
    PROVIDER,
    fetch_all_nse_quotes,
    fetch_symbol_quote,
    get_all_indian_stocks_paginated,
    resolve_yahoo_symbol,
    search_nse_stocks,
)
from support import Reply, upstream

YAHOO = {
    "chart": {
        "result": [
            {
                "meta": {
                    "regularMarketPrice": 123.45,
                    "chartPreviousClose": 120.0,
                    "longName": "Test Ltd",
                    "regularMarketVolume": 10,
                }
            }
        ]
    }
}


class QuoteHonestyTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        live_feed._QUOTE_CACHE.clear()

    async def test_upstream_failure_is_unavailable_not_a_made_up_price(self) -> None:
        with upstream(None):
            quote = await fetch_symbol_quote("RELIANCE")
        self.assertEqual((quote["status"], quote["ltp"]), ("unavailable", None))

    async def test_live_quote_names_its_real_source(self) -> None:
        with upstream(YAHOO):
            quote = await fetch_symbol_quote("RELIANCE")
        self.assertEqual(
            (quote["status"], quote["provider"], quote["ltp"]),
            ("live", PROVIDER, 123.45),
        )
        self.assertNotIn("SmartAPI", PROVIDER)

    async def test_52_week_range_is_not_invented(self) -> None:
        with upstream(YAHOO):  # this payload carries no fiftyTwoWeek fields
            quote = await fetch_symbol_quote("RELIANCE")
        self.assertEqual((quote["week52_high"], quote["week52_low"]), (None, None))

    async def test_expired_cache_is_marked_stale_when_refresh_fails(self) -> None:
        with upstream(YAHOO):
            await fetch_symbol_quote("RELIANCE")
        _, cached = live_feed._QUOTE_CACHE["RELIANCE"]
        live_feed._QUOTE_CACHE["RELIANCE"] = (0.0, cached)  # long expired
        with upstream(None):
            quote = await fetch_symbol_quote("RELIANCE")
        self.assertEqual((quote["status"], quote["ltp"]), ("stale", 123.45))

    async def test_upstream_failure_is_logged_not_swallowed(self) -> None:
        with upstream(None), self.assertLogs(live_feed.logger, level="WARNING"):
            await fetch_symbol_quote("RELIANCE")

    async def test_routine_network_failure_is_one_line_not_a_traceback(self) -> None:
        with upstream(None), self.assertLogs(live_feed.logger, level="WARNING") as logs:
            await fetch_symbol_quote("RELIANCE")
        self.assertTrue(all(r.exc_info is None for r in logs.records))
        self.assertIn("ConnectError", logs.output[0])

    async def test_quote_list_covers_every_index_the_ui_shows(self) -> None:
        # The explorer strip shows five indices; any without a feed would have to be invented.
        with upstream(YAHOO):
            symbols = {q["symbol"] for q in await fetch_all_nse_quotes()}
        wanted = {"NIFTY 50", "SENSEX", "BANKNIFTY", "NIFTY IT", "NIFTY AUTO"}
        self.assertLessEqual(wanted, symbols)

    async def test_quote_list_omits_unavailable_symbols(self) -> None:
        with upstream(None):
            self.assertEqual(await fetch_all_nse_quotes(), [])

    async def test_stock_pages_never_invent_a_price(self) -> None:
        with upstream(None):
            page = await get_all_indian_stocks_paginated(1, 50, "ALL", "ALL", "")
        self.assertEqual(len(page["stocks"]), 50)  # rows 21-50 get no quote at all
        for item in page["stocks"]:
            self.assertEqual((item["ltp"], item["status"]), (None, "unavailable"))


class ResolverTests(unittest.TestCase):
    def test_tata_motors_tickers_resolve_to_symbols_yahoo_still_serves(self) -> None:
        # Yahoo 404s TATAMOTORS.NS since the 2025 demerger; TMPV.NS and TMCV.NS are the live listings.
        self.assertEqual(resolve_yahoo_symbol("TMCV"), "TMCV.NS")
        self.assertEqual(resolve_yahoo_symbol("TMPV"), "TMPV.NS")
        for legacy in ("TATAMOTORS", "TATA MOTORS", "TML"):
            self.assertEqual(resolve_yahoo_symbol(legacy), "TMPV.NS", legacy)


def slow_upstream(search_delay: float = 0.0, chart_delay: float = 0.0):
    """Like upstream(YAHOO), but Yahoo's search and chart endpoints take as long as asked."""

    class _Client:
        def __init__(self, *args, **kwargs) -> None:
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc) -> bool:
            return False

        async def get(self, url, *args, **kwargs):
            if "/v1/finance/search" in url:
                await asyncio.sleep(search_delay)
                return Reply({"quotes": []})
            await asyncio.sleep(chart_delay)
            return Reply(YAHOO)

    return patch.object(live_feed.httpx, "AsyncClient", _Client)


class SearchBudgetTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        live_feed._QUOTE_CACHE.clear()

    async def test_slow_live_search_cannot_stall_directory_results(self) -> None:
        with (
            slow_upstream(search_delay=2.0),
            patch.object(live_feed, "WEB_SEARCH_BUDGET_SECONDS", 0.05, create=True),
        ):
            started = time.monotonic()
            results = await search_nse_stocks("infosys")
        self.assertLess(time.monotonic() - started, 1.0)
        self.assertIn("INFY", {r["symbol"] for r in results})

    async def test_slow_quote_is_bounded_but_still_warms_the_cache(self) -> None:
        with (
            slow_upstream(chart_delay=0.6),
            patch.object(live_feed, "QUOTE_BUDGET_SECONDS", 0.05, create=True),
        ):
            started = time.monotonic()
            results = await search_nse_stocks("infosys")
            elapsed = time.monotonic() - started
            await asyncio.sleep(0.8)  # let the abandoned-for-now fetches finish
        self.assertLess(elapsed, 0.4)
        self.assertEqual({r["status"] for r in results}, {"unavailable"})
        self.assertIn("INFY", live_feed._QUOTE_CACHE)  # the fetch was not thrown away


if __name__ == "__main__":
    unittest.main()
