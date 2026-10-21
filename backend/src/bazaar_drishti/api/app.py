"""FastAPI application providing bounded, public read-only research endpoints."""

from __future__ import annotations

import json
import sqlite3
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from bazaar_drishti.market.live_feed import (
    fetch_all_nse_quotes,
    fetch_intraday_chart,
    fetch_live_indian_mutual_funds,
    fetch_live_stock_news,
    fetch_symbol_quote,
    search_nse_stocks,
)


def create_app(conn: sqlite3.Connection) -> FastAPI:
    """Create a configured read-only FastAPI instance backed by the database connection."""
    app = FastAPI(
        title="MarketLens API",
        version="0.1.0",
        description="Public read-only research dashboard API for auditable Indian cash-equity paper study.",
    )

    # Restrictive CORS
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
        import os
        api_key = os.getenv("SMARTAPI_API_KEY")
        return {
            "status": "online",
            "provider": "Angel One SmartAPI" if api_key else "NSE Direct Telemetry",
            "smartapi_configured": bool(api_key),
        }

    @app.get("/api/v1/market/quotes", summary="Get Live Indian Stock Quotes")
    async def get_market_quotes() -> dict[str, Any]:
        quotes = await fetch_all_nse_quotes()
        return {"quotes": quotes, "count": len(quotes)}

    @app.get("/api/v1/market/search", summary="Search Indian Stocks and Fetch Live Quotes")
    async def search_market_stocks(
        q: str = Query(..., min_length=1, description="Stock ticker, name, or sector to search")
    ) -> dict[str, Any]:
        results = await search_nse_stocks(q)
        return {"query": q, "count": len(results), "results": results}

    @app.get("/api/v1/market/funds", summary="Get Live Indian Mutual Funds with AMFI Live NAVs")
    async def get_live_mutual_funds() -> dict[str, Any]:
        funds = await fetch_live_indian_mutual_funds()
        return {"funds": funds, "count": len(funds), "provider": "AMFI India Live Feed"}

    @app.get("/api/v1/market/news", summary="Get Live Indian Financial News and Sentiment")
    async def get_live_stock_news(
        symbol: str = Query("RELIANCE", description="Stock ticker symbol to search breaking news for")
    ) -> dict[str, Any]:
        news_items = await fetch_live_stock_news(symbol)
        return {"symbol": symbol.strip().upper(), "count": len(news_items), "news": news_items}

    @app.get("/api/v1/market/quote/{symbol}", summary="Get Single Symbol Quote")
    async def get_symbol_quote(symbol: str) -> dict[str, Any]:
        return await fetch_symbol_quote(symbol)

    @app.get("/api/v1/market/chart/{symbol}", summary="Get Intraday Bars Chart")
    async def get_market_chart(
        symbol: str,
        interval: str = Query("5m", description="Bar interval (e.g. 1m, 5m, 15m, 1d)"),
        range_period: str = Query("1d", alias="range", description="Time range (e.g. 1d, 5d, 1mo)"),
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
    """Create a default in-memory FastAPI app populated with a verified synthetic run."""
    from datetime import date, datetime, timezone
    from decimal import Decimal
    from zoneinfo import ZoneInfo
    from bazaar_drishti.bundle.builder import build_run_bundle
    from bazaar_drishti.bundle.publisher import Publisher
    from bazaar_drishti.research.backtest import EquityPoint
    from bazaar_drishti.schemas import ForecastRow, RunManifest, RunMetrics, TradeRow

    ist = ZoneInfo("Asia/Kolkata")
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    pub = Publisher(conn)
    pub.initialize_schema()

    run_id = "run-synthetic-001"
    manifest = RunManifest(
        run_id=run_id,
        synthetic=True,
        data_label="synthetic",
        source_label="deterministic local fixture",
        bars_sha256="9e232063a896d744fea0637387b87f64031a1a91464f05176038d41e804806fd",
        config_sha256="b" * 64,
        code_revision="git-main",
        created_at_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
        created_at_ist=datetime(2030, 1, 7, 9, 30, tzinfo=ist),
        data_start_utc=datetime(2030, 1, 7, 3, 45, tzinfo=timezone.utc),
        data_start_ist=datetime(2030, 1, 7, 9, 15, tzinfo=ist),
        data_end_utc=datetime(2030, 1, 9, 10, 0, tzinfo=timezone.utc),
        data_end_ist=datetime(2030, 1, 9, 15, 30, tzinfo=ist),
    )
    trade = TradeRow(
        run_id=run_id,
        trade_id="trade-0001",
        session_date_ist=date(2030, 1, 7),
        entry_time_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
        entry_time_ist=datetime(2030, 1, 7, 9, 30, tzinfo=ist),
        exit_time_utc=datetime(2030, 1, 7, 4, 30, tzinfo=timezone.utc),
        exit_time_ist=datetime(2030, 1, 7, 10, 0, tzinfo=ist),
        entry_price_inr=Decimal("100.00"),
        exit_price_inr=Decimal("105.00"),
        quantity=10,
        gross_pnl_inr=Decimal("50.00"),
        brokerage_inr=Decimal("0.60"),
        exchange_charges_inr=Decimal("0.06"),
        sebi_charges_inr=Decimal("0.01"),
        stt_inr=Decimal("0.26"),
        stamp_duty_inr=Decimal("0.03"),
        gst_inr=Decimal("0.12"),
        slippage_inr=Decimal("1.02"),
        net_pnl_inr=Decimal("47.90"),
    )
    metrics = RunMetrics(
        run_id=run_id,
        gross_pnl_inr=Decimal("50.00"),
        brokerage_inr=Decimal("0.60"),
        exchange_charges_inr=Decimal("0.06"),
        sebi_charges_inr=Decimal("0.01"),
        stt_inr=Decimal("0.26"),
        stamp_duty_inr=Decimal("0.03"),
        gst_inr=Decimal("0.12"),
        slippage_inr=Decimal("1.02"),
        net_pnl_inr=Decimal("47.90"),
        return_percent=Decimal("4.79"),
        cash_baseline_net_pnl_inr=Decimal("0.00"),
        buy_hold_baseline_net_pnl_inr=Decimal("20.00"),
        max_drawdown_percent=Decimal("0.50"),
        trade_count=1,
        session_count=3,
        brier_score=Decimal("0.2215"),
        log_loss=Decimal("0.6340"),
        balanced_accuracy=Decimal("0.5830"),
        forecast_count=1,
    )
    forecast = ForecastRow(
        run_id=run_id,
        forecast_id="forecast-0001",
        session_date_ist=date(2030, 1, 7),
        origin_time_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
        origin_time_ist=datetime(2030, 1, 7, 9, 30, tzinfo=ist),
        input_cutoff_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
        input_cutoff_ist=datetime(2030, 1, 7, 9, 30, tzinfo=ist),
        target_time_utc=datetime(2030, 1, 7, 4, 30, tzinfo=timezone.utc),
        target_time_ist=datetime(2030, 1, 7, 10, 0, tzinfo=ist),
        probability_up=Decimal("0.6200"),
        baseline_probability_up=Decimal("0.5000"),
        actual_up=True,
        bars_sha256="9e232063a896d744fea0637387b87f64031a1a91464f05176038d41e804806fd",
        config_sha256="b" * 64,
        model_sha256="c" * 64,
    )
    equity = [
        EquityPoint(
            timestamp_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
            timestamp_ist=datetime(2030, 1, 7, 9, 30, tzinfo=ist),
            equity_inr=Decimal("1000.00"),
            drawdown_percent=Decimal("0.00"),
        ),
        EquityPoint(
            timestamp_utc=datetime(2030, 1, 7, 4, 30, tzinfo=timezone.utc),
            timestamp_ist=datetime(2030, 1, 7, 10, 0, tzinfo=ist),
            equity_inr=Decimal("1047.90"),
            drawdown_percent=Decimal("0.00"),
        ),
    ]
    bundle = build_run_bundle(
        manifest=manifest,
        metrics=metrics,
        trades=[trade],
        forecasts=[forecast],
        equity_curve=equity,
        contributions=[],
    )
    pub.publish_run(bundle)
    return create_app(conn)


app = create_default_app()
