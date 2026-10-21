from datetime import date, datetime, timezone
from decimal import Decimal
import sqlite3
import unittest
from zoneinfo import ZoneInfo

from fastapi.testclient import TestClient

from bazaar_drishti.api.app import create_app
from bazaar_drishti.bundle.builder import build_run_bundle
from bazaar_drishti.bundle.publisher import Publisher
from bazaar_drishti.research.backtest import EquityPoint
from bazaar_drishti.schemas import ForecastRow, RunManifest, RunMetrics, TradeRow

IST = ZoneInfo("Asia/Kolkata")


class ApiEndpointsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.conn = sqlite3.connect(":memory:", check_same_thread=False)
        self.publisher = Publisher(self.conn)
        self.publisher.initialize_schema()

        self.run_id = "run-api-001"
        manifest = RunManifest(
            run_id=self.run_id,
            synthetic=True,
            data_label="synthetic",
            source_label="deterministic local fixture",
            bars_sha256="a" * 64,
            config_sha256="b" * 64,
            code_revision="git-test",
            created_at_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
            created_at_ist=datetime(2030, 1, 7, 9, 30, tzinfo=IST),
            data_start_utc=datetime(2030, 1, 7, 3, 45, tzinfo=timezone.utc),
            data_start_ist=datetime(2030, 1, 7, 9, 15, tzinfo=IST),
            data_end_utc=datetime(2030, 1, 7, 10, 0, tzinfo=timezone.utc),
            data_end_ist=datetime(2030, 1, 7, 15, 30, tzinfo=IST),
        )
        trade = TradeRow(
            run_id=self.run_id,
            trade_id="trade-0001",
            session_date_ist=date(2030, 1, 7),
            entry_time_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
            entry_time_ist=datetime(2030, 1, 7, 9, 30, tzinfo=IST),
            exit_time_utc=datetime(2030, 1, 7, 4, 30, tzinfo=timezone.utc),
            exit_time_ist=datetime(2030, 1, 7, 10, 0, tzinfo=IST),
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
            run_id=self.run_id,
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
            session_count=1,
            brier_score=Decimal("0.2000"),
            log_loss=Decimal("0.6000"),
            balanced_accuracy=Decimal("0.6500"),
            forecast_count=1,
        )
        forecast = ForecastRow(
            run_id=self.run_id,
            forecast_id="forecast-0001",
            session_date_ist=date(2030, 1, 7),
            origin_time_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
            origin_time_ist=datetime(2030, 1, 7, 9, 30, tzinfo=IST),
            input_cutoff_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
            input_cutoff_ist=datetime(2030, 1, 7, 9, 30, tzinfo=IST),
            target_time_utc=datetime(2030, 1, 7, 4, 30, tzinfo=timezone.utc),
            target_time_ist=datetime(2030, 1, 7, 10, 0, tzinfo=IST),
            probability_up=Decimal("0.6200"),
            baseline_probability_up=Decimal("0.5000"),
            actual_up=True,
            bars_sha256="a" * 64,
            config_sha256="b" * 64,
            model_sha256="c" * 64,
        )
        equity = [
            EquityPoint(
                timestamp_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
                timestamp_ist=datetime(2030, 1, 7, 9, 30, tzinfo=IST),
                equity_inr=Decimal("1000.00"),
                drawdown_percent=Decimal("0.00"),
            )
        ]
        bundle = build_run_bundle(
            manifest=manifest,
            metrics=metrics,
            trades=[trade],
            forecasts=[forecast],
            equity_curve=equity,
            contributions=[],
        )
        self.publisher.publish_run(bundle)

        app = create_app(self.conn)
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.conn.close()

    def test_root(self) -> None:
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["service"], "MarketLens API")
        self.assertEqual(data["status"], "online")

    def test_healthz(self) -> None:
        resp = self.client.get("/healthz")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), {"status": "ok"})

    def test_get_symbol_quote(self) -> None:
        resp = self.client.get("/api/v1/market/quote/RELIANCE")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["symbol"], "RELIANCE")
        self.assertIn("ltp", data)
        self.assertIn("change", data)

    def test_search_market_stocks(self) -> None:
        resp = self.client.get("/api/v1/market/search?q=TATA")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["query"], "TATA")
        self.assertIn("results", data)
        self.assertGreater(data["count"], 0)

    def test_get_market_chart(self) -> None:
        resp = self.client.get("/api/v1/market/chart/TCS?interval=5m&range=1d")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["symbol"], "TCS")
        self.assertIn("bars", data)

    def test_get_current_run(self) -> None:
        resp = self.client.get("/api/v1/runs/current")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["run_id"], self.run_id)
        self.assertTrue(data["synthetic"])
        self.assertEqual(data["data_label"], "synthetic")

    def test_get_run_metadata(self) -> None:
        resp = self.client.get(f"/api/v1/runs/{self.run_id}")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["metrics"]["net_pnl_inr"], "47.90")

    def test_get_trades_paginated(self) -> None:
        resp = self.client.get(f"/api/v1/runs/{self.run_id}/trades?limit=10")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data["trades"]), 1)
        self.assertEqual(data["trades"][0]["trade_id"], "trade-0001")

    def test_get_forecasts_paginated(self) -> None:
        resp = self.client.get(f"/api/v1/runs/{self.run_id}/forecasts?limit=10")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data["forecasts"]), 1)
        self.assertEqual(data["forecasts"][0]["probability_up"], "0.6200")
        self.assertEqual(data["forecasts"][0]["evaluation_split"], "test")

    def test_get_receipt(self) -> None:
        resp = self.client.get(f"/api/v1/runs/{self.run_id}/receipt")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["synthetic"])
        self.assertEqual(data["bars_sha256"], "a" * 64)

    def test_mutation_methods_rejected(self) -> None:
        resp = self.client.post("/api/v1/runs/current", json={})
        self.assertEqual(resp.status_code, 405)

        resp2 = self.client.delete(f"/api/v1/runs/{self.run_id}")
        self.assertEqual(resp2.status_code, 405)

    def test_unknown_run_returns_404(self) -> None:
        resp = self.client.get("/api/v1/runs/non-existent-run")
        self.assertEqual(resp.status_code, 404)

    def test_pagination_limits_must_be_positive(self) -> None:
        for endpoint in (
            f"/api/v1/runs/{self.run_id}/equity",
            f"/api/v1/runs/{self.run_id}/trades",
            f"/api/v1/runs/{self.run_id}/forecasts",
        ):
            with self.subTest(endpoint=endpoint):
                response = self.client.get(endpoint, params={"limit": 0})
                self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
