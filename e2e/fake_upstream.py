"""Serve the real API against a deterministic fake of every upstream it calls.

e2e must not depend on Yahoo, NSE or mfapi being reachable. Run from the repo root:
    python e2e/fake_upstream.py [port] [--down]

--down makes every upstream call fail, as in a real outage.
"""

import sys
import time
import zlib
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend" / "src"))

import httpx  # noqa: E402
import uvicorn  # noqa: E402

from bazaar_drishti.api.app import app  # noqa: E402

FEED_DOWN = "--down" in sys.argv
STEPS = {"1m": 60, "5m": 300, "15m": 900, "30m": 1800, "60m": 3600, "1h": 3600}


class Reply:
    status_code = 200

    def __init__(self, payload: object = None, text: str = "") -> None:
        self._payload, self.text = payload, text

    def json(self) -> object:
        return self._payload


def price_of(sym: str) -> float:
    return round(50 + (zlib.crc32(sym.encode()) % 450000) / 100, 2)


def chart(sym: str, interval: str) -> dict:
    seed = zlib.crc32(sym.encode())
    price = price_of(sym)
    prev = round(price / (1 + ((seed >> 8) % 600 - 300) / 10000), 2)
    step, n, now = STEPS.get(interval, 86400), 60, int(time.time())
    closes = [
        round(
            prev
            + (price - prev) * i / (n - 1)
            + ((i * 7 + seed) % 11 - 5) * price / 4000,
            2,
        )
        for i in range(n - 1)
    ] + [price]
    return {
        "chart": {
            "result": [
                {
                    "meta": {
                        "currency": "INR",
                        "regularMarketPrice": price,
                        "chartPreviousClose": prev,
                        "regularMarketDayHigh": round(max(price, prev) * 1.01, 2),
                        "regularMarketDayLow": round(min(price, prev) * 0.99, 2),
                        "fiftyTwoWeekHigh": round(price * 1.25, 2),
                        "fiftyTwoWeekLow": round(price * 0.7, 2),
                        "regularMarketVolume": 1_000_000 + seed % 9_000_000,
                        "regularMarketTime": now,
                        "longName": "Indian Oil Corporation Limited"
                        if sym.startswith("IOC")
                        else f"{sym.split('.')[0].title()} Limited",
                    },
                    "timestamp": [now - (n - i) * step for i in range(n)],
                    "indicators": {
                        "quote": [
                            {
                                "open": [prev, *closes[:-1]],
                                "high": [round(c * 1.002, 2) for c in closes],
                                "low": [round(c * 0.998, 2) for c in closes],
                                "close": closes,
                                "volume": [1000 + i * 10 for i in range(n)],
                            }
                        ]
                    },
                }
            ]
        }
    }


def funds(code: int) -> dict:
    latest, growth = 50 + code % 400, 1.15 ** (1 / 250)
    rows = [
        {"date": "27-10-2026", "nav": f"{latest / growth**i:.5f}"} for i in range(1300)
    ]
    return {"meta": {"scheme_code": code}, "data": rows}


def news(sym: str) -> str:
    heads = [
        f"{sym} shares surge as profit growth beats estimates",
        f"{sym} faces regulatory probe",
    ]
    items = "".join(
        f"<item><title>{h}</title><link>https://example.test/{i}</link>"
        f"<pubDate>Tue, 27 Oct 2026 04:00:00 GMT</pubDate><source>Fixture Wire</source></item>"
        for i, h in enumerate(heads)
    )
    return f"<rss><channel>{items}</channel></rss>"


def respond(url: str) -> Reply:
    u = urlparse(url)
    q = parse_qs(u.query)
    if u.path.startswith("/v8/finance/chart/"):
        return Reply(
            chart(
                unquote(u.path.rsplit("/", 1)[1]).upper(), q.get("interval", ["1d"])[0]
            )
        )
    if u.path == "/v1/finance/search":
        stellant = "stellant" in q.get("q", [""])[0].lower()
        hit = {
            "symbol": "STELLANT.BO",
            "longname": "Stellant Securities (India) Limited",
        }
        return Reply({"quotes": [hit] if stellant else []})
    if u.path == "/api/ipo-current-issue":
        return Reply(
            [
                {
                    "symbol": "E2EIPO",
                    "companyName": "E2E Fixture Industries Limited",
                    "issuePrice": "Rs.100 to Rs.105",
                    "issueSize": "500",
                    "issueStartDate": "27-Oct-2026",
                    "issueEndDate": "29-Oct-2026",
                    "noOfTime": "1.5",
                }
            ]
        )
    if u.hostname == "api.mfapi.in":
        return Reply(funds(int(u.path.rsplit("/", 1)[1])))
    if u.hostname == "news.google.com":
        return Reply(text=news(q["q"][0].split("+")[0]))
    return Reply({})  # e.g. the nseindia.com cookie-priming GET


class FakeClient:
    def __init__(self, *args: object, **kwargs: object) -> None:
        pass

    async def __aenter__(self) -> "FakeClient":
        return self

    async def __aexit__(self, *exc: object) -> bool:
        return False

    async def get(self, url: str, **kwargs: object) -> Reply:
        if FEED_DOWN:
            raise httpx.ConnectError("feed down")
        return respond(url)


if __name__ == "__main__":
    ports = [a for a in sys.argv[1:] if not a.startswith("--")]
    httpx.AsyncClient = FakeClient  # type: ignore[misc]
    uvicorn.run(app, host="127.0.0.1", port=int(ports[0]) if ports else 8000)
