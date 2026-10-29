"""FastAPI application providing bounded, public read-only research endpoints."""

from __future__ import annotations

import json
import sqlite3
from typing import Annotated, Any, Literal

from fastapi import FastAPI, HTTPException, Path, Query
from fastapi.middleware.cors import CORSMiddleware

from bazaar_drishti.market.live_feed import (
    PROVIDER,
    fetch_all_nse_quotes,
    fetch_intraday_chart,
    fetch_live_indian_ipos,
    fetch_live_indian_mutual_funds,
    fetch_live_stock_news,
    fetch_symbol_quote,
    get_all_indian_stocks_paginated,
    search_nse_stocks,
)

# Allow-lists for values that are spliced into upstream URLs: anything else is a 422.
SYMBOL_PATTERN = r"^[A-Za-z0-9&^._ -]{1,32}$"
Symbol = Annotated[str, Path(pattern=SYMBOL_PATTERN)]
Interval = Literal[
    "1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"
]
Range = Literal["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]


def create_app(conn: sqlite3.Connection) -> FastAPI:
    """Create a configured read-only FastAPI instance backed by the database connection."""
    app = FastAPI(
        title="MarketLens API",
        version="0.1.0",
        description="Public read-only research dashboard API for auditable Indian cash-equity paper study.",
    )

    # Public read-only API: any origin may GET; the other methods are not allowed.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )

    @app.get("/", summary="Root Welcome & Service Status")
    def root() -> dict[str, Any]:
        return {
            "service": "MarketLens API",
            "status": "online",
            "health": "/healthz",
            "documentation": "/docs",
            "active_run": "/api/v1/runs/current",
        }

    @app.get("/healthz", summary="Process Health Check")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/v1/market/status", summary="Market Feed Provider Status")
    def get_market_status() -> dict[str, Any]:
        return {"status": "online", "provider": PROVIDER}

    @app.get("/api/v1/market/quotes", summary="Get Live Indian Stock Quotes")
    async def get_market_quotes() -> dict[str, Any]:
        quotes = await fetch_all_nse_quotes()
        return {"quotes": quotes, "count": len(quotes)}

    @app.get(
        "/api/v1/market/search", summary="Search Indian Stocks and Fetch Live Quotes"
    )
    async def search_market_stocks(
        q: str = Query(
            ..., min_length=1, description="Stock ticker, name, or sector to search"
        ),
    ) -> dict[str, Any]:
        results = await search_nse_stocks(q)
        return {"query": q, "count": len(results), "results": results}

    @app.get(
        "/api/v1/market/stocks/all",
        summary="Get All Listed Indian Stocks with Pagination, Exchanges, and Search",
    )
    async def get_all_stocks(
        page: int = Query(1, ge=1, description="Page number"),
        limit: int = Query(50, ge=1, le=200, description="Items per page"),
        exchange: str = Query("ALL", description="Filter by exchange: ALL, NSE, BSE"),
        cap: str = Query(
            "ALL", description="Filter by cap: ALL, Large Cap, Mid Cap, Small Cap"
        ),
        q: str = Query(
            "",
            description="Search ticker or company name across all 13,000+ Indian stocks",
        ),
    ) -> dict[str, Any]:
        return await get_all_indian_stocks_paginated(page, limit, exchange, cap, q)

    @app.get(
        "/api/v1/market/ipos",
        summary="Get Live Indian IPOs (Active, Upcoming, and Recently Listed)",
    )
    async def get_indian_ipos() -> dict[str, Any]:
        return await fetch_live_indian_ipos()

    @app.get(
        "/api/v1/market/funds",
        summary="Get Live Indian Mutual Funds with AMFI Live NAVs",
    )
    async def get_live_mutual_funds() -> dict[str, Any]:
        funds = await fetch_live_indian_mutual_funds()
        return {
            "funds": funds,
            "count": len(funds),
            "provider": "mfapi.in (AMFI NAV data)",
        }

    @app.get(
        "/api/v1/market/news", summary="Get Live Indian Financial News and Sentiment"
    )
    async def get_live_stock_news(
        symbol: str = Query(
            "RELIANCE",
            pattern=SYMBOL_PATTERN,
            description="Stock ticker symbol to search breaking news for",
        ),
    ) -> dict[str, Any]:
        news_items = await fetch_live_stock_news(symbol)
        return {
            "symbol": symbol.strip().upper(),
            "count": len(news_items),
            "news": news_items,
        }

    @app.get("/api/v1/market/quote/{symbol}", summary="Get Single Symbol Quote")
    async def get_symbol_quote(symbol: Symbol) -> dict[str, Any]:
        return await fetch_symbol_quote(symbol)

    @app.get("/api/v1/market/chart/{symbol}", summary="Get Intraday Bars Chart")
    async def get_market_chart(
        symbol: Symbol,
        interval: Interval = Query("5m", description="Bar interval"),
        range_period: Range = Query("1d", alias="range", description="Time range"),
    ) -> dict[str, Any]:
        return await fetch_intraday_chart(symbol, interval, range_period)

    @app.get("/api/v1/runs/current", summary="Get Active Run Summary")
    def get_current_run() -> dict[str, Any]:
        cur = conn.execute(
            "SELECT active_run_id FROM active_run_pointer WHERE singleton_id = 1"
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=404, detail="No active run currently published"
            )
        run_id = row[0]

        cur = conn.execute(
            """
            SELECT run_id, synthetic, data_label, source_label, created_at_utc,
                   data_start_utc, data_end_utc
            FROM published_runs WHERE run_id = ?
            """,
            (run_id,),
        )
        run_row = cur.fetchone()
        if not run_row:
            raise HTTPException(
                status_code=404, detail=f"Active run {run_id} not found"
            )

        return {
            "run_id": run_row[0],
            "synthetic": bool(run_row[1]),
            "data_label": run_row[2],
            "source_label": run_row[3],
            "created_at_utc": run_row[4],
            "data_start_utc": run_row[5],
            "data_end_utc": run_row[6],
        }

    @app.get("/api/v1/runs/{run_id}", summary="Get Run Metadata and Metrics")
    def get_run_metadata(run_id: str) -> dict[str, Any]:
        cur = conn.execute(
            """
            SELECT run_id, synthetic, data_label, source_label, bars_sha256,
                   config_sha256, code_revision, created_at_utc, data_start_utc, data_end_utc
            FROM published_runs WHERE run_id = ?
            """,
            (run_id,),
        )
        run_row = cur.fetchone()
        if not run_row:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

        cur = conn.execute(
            """
            SELECT gross_pnl_inr, brokerage_inr, exchange_charges_inr,
                   sebi_charges_inr, stt_inr, stamp_duty_inr, gst_inr,
                   slippage_inr, net_pnl_inr, return_percent, cash_baseline_net_pnl_inr,
                   buy_hold_baseline_net_pnl_inr, max_drawdown_percent, trade_count,
                   session_count, brier_score, log_loss, balanced_accuracy, forecast_count
            FROM run_metrics WHERE run_id = ?
            """,
            (run_id,),
        )
        met_row = cur.fetchone()

        metrics_dict: dict[str, Any] = {}
        if met_row:
            metrics_dict = {
                "gross_pnl_inr": met_row[0],
                "brokerage_inr": met_row[1],
                "exchange_charges_inr": met_row[2],
                "sebi_charges_inr": met_row[3],
                "stt_inr": met_row[4],
                "stamp_duty_inr": met_row[5],
                "gst_inr": met_row[6],
                "slippage_inr": met_row[7],
                "net_pnl_inr": met_row[8],
                "return_percent": met_row[9],
                "cash_baseline_net_pnl_inr": met_row[10],
                "buy_hold_baseline_net_pnl_inr": met_row[11],
                "max_drawdown_percent": met_row[12],
                "trade_count": met_row[13],
                "session_count": met_row[14],
                "brier_score": met_row[15],
                "log_loss": met_row[16],
                "balanced_accuracy": met_row[17],
                "forecast_count": met_row[18],
            }

        return {
            "run_id": run_row[0],
            "synthetic": bool(run_row[1]),
            "data_label": run_row[2],
            "source_label": run_row[3],
            "bars_sha256": run_row[4],
            "config_sha256": run_row[5],
            "code_revision": run_row[6],
            "created_at_utc": run_row[7],
            "data_start_utc": run_row[8],
            "data_end_utc": run_row[9],
            "metrics": metrics_dict,
        }

    @app.get("/api/v1/runs/{run_id}/equity", summary="Get Equity Points")
    def get_equity_points(
        run_id: str, limit: int = Query(default=1000, ge=1, le=5000)
    ) -> dict[str, Any]:
        cur = conn.execute(
            """
            SELECT timestamp_utc, timestamp_ist, equity_inr, drawdown_percent
            FROM equity_points WHERE run_id = ?
            ORDER BY timestamp_utc ASC LIMIT ?
            """,
            (run_id, limit),
        )
        rows = cur.fetchall()
        points = [
            {
                "timestamp_utc": r[0],
                "timestamp_ist": r[1],
                "equity_inr": r[2],
                "drawdown_percent": r[3],
            }
            for r in rows
        ]
        return {"run_id": run_id, "points": points}

    @app.get("/api/v1/runs/{run_id}/trades", summary="Get Trades Keyset Paginated")
    def get_trades(
        run_id: str,
        limit: int = Query(default=20, ge=1, le=100),
        cursor: str | None = Query(default=None),
    ) -> dict[str, Any]:
        params: list[Any] = [run_id]
        cursor_clause = ""
        if cursor:
            cursor_clause = "AND trade_id > ?"
            params.append(cursor)
        params.append(limit + 1)

        query = f"""
            SELECT trade_id, session_date_ist, entry_time_utc, entry_time_ist,
                   exit_time_utc, exit_time_ist, entry_price_inr, exit_price_inr,
                   quantity, gross_pnl_inr, brokerage_inr, exchange_charges_inr,
                   sebi_charges_inr, stt_inr, stamp_duty_inr, gst_inr,
                   slippage_inr, net_pnl_inr
            FROM trade_ledger
            WHERE run_id = ? {cursor_clause}
            ORDER BY trade_id ASC LIMIT ?
        """
        cur = conn.execute(query, tuple(params))
        rows = cur.fetchall()

        has_more = len(rows) > limit
        result_rows = rows[:limit]
        next_cursor = result_rows[-1][0] if has_more and result_rows else None

        trades = [
            {
                "trade_id": r[0],
                "session_date_ist": r[1],
                "entry_time_utc": r[2],
                "entry_time_ist": r[3],
                "exit_time_utc": r[4],
                "exit_time_ist": r[5],
                "entry_price_inr": r[6],
                "exit_price_inr": r[7],
                "quantity": r[8],
                "gross_pnl_inr": r[9],
                "brokerage_inr": r[10],
                "exchange_charges_inr": r[11],
                "sebi_charges_inr": r[12],
                "stt_inr": r[13],
                "stamp_duty_inr": r[14],
                "gst_inr": r[15],
                "slippage_inr": r[16],
                "net_pnl_inr": r[17],
            }
            for r in result_rows
        ]
        return {"run_id": run_id, "trades": trades, "next_cursor": next_cursor}

    @app.get(
        "/api/v1/runs/{run_id}/forecasts", summary="Get Forecasts Keyset Paginated"
    )
    def get_forecasts(
        run_id: str,
        limit: int = Query(default=20, ge=1, le=100),
        cursor: str | None = Query(default=None),
    ) -> dict[str, Any]:
        params: list[Any] = [run_id]
        cursor_clause = ""
        if cursor:
            cursor_clause = "AND forecast_id > ?"
            params.append(cursor)
        params.append(limit + 1)

        query = f"""
            SELECT forecast_id, session_date_ist, origin_time_utc, origin_time_ist,
                   input_cutoff_utc, input_cutoff_ist, target_time_utc, target_time_ist,
                   probability_up, baseline_probability_up, actual_up, evaluation_split
            FROM forecast_records
            WHERE run_id = ? {cursor_clause}
            ORDER BY forecast_id ASC LIMIT ?
        """
        cur = conn.execute(query, tuple(params))
        rows = cur.fetchall()

        has_more = len(rows) > limit
        result_rows = rows[:limit]
        next_cursor = result_rows[-1][0] if has_more and result_rows else None

        forecasts = [
            {
                "forecast_id": r[0],
                "session_date_ist": r[1],
                "origin_time_utc": r[2],
                "origin_time_ist": r[3],
                "input_cutoff_utc": r[4],
                "input_cutoff_ist": r[5],
                "target_time_utc": r[6],
                "target_time_ist": r[7],
                "probability_up": r[8],
                "baseline_probability_up": r[9],
                "actual_up": bool(r[10]) if r[10] is not None else None,
                "evaluation_split": r[11],
            }
            for r in result_rows
        ]
        return {"run_id": run_id, "forecasts": forecasts, "next_cursor": next_cursor}

    @app.get("/api/v1/runs/{run_id}/receipt", summary="Get Public-Safe Run Receipt")
    def get_receipt(run_id: str) -> dict[str, Any]:
        cur = conn.execute(
            """
            SELECT run_id, synthetic, data_label, source_label, bars_sha256,
                   config_sha256, code_revision, created_at_utc, data_start_utc,
                   data_end_utc, manifest_json
            FROM published_runs WHERE run_id = ?
            """,
            (run_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

        manifest_data = json.loads(row[10])
        return {
            "run_id": row[0],
            "synthetic": bool(row[1]),
            "data_label": row[2],
            "source_label": row[3],
            "bars_sha256": row[4],
            "config_sha256": row[5],
            "code_revision": row[6],
            "created_at_utc": row[7],
            "data_start_utc": row[8],
            "data_end_utc": row[9],
            "manifest": manifest_data,
            "methodology": "Completed-bar 20/50 SMA crossover with next-bar open fill, intraday forced flatten.",
            "limitations": [
                "Zero overnight exposure modeled",
                "Assumed slippage is sensitivity parameter only",
                "Synthetic fixture does not represent real exchange market history",
            ],
        }

    return app


def create_default_app() -> FastAPI:
    """Public app: an in-memory store holding the run the engine computes from the shipped fixture."""
    from bazaar_drishti.bundle.publisher import Publisher
    from bazaar_drishti.research.runner import run_synthetic_study

    conn = sqlite3.connect(":memory:", check_same_thread=False)
    publisher = Publisher(conn)
    publisher.initialize_schema()
    publisher.publish_run(run_synthetic_study())
    return create_app(conn)


app = create_default_app()
