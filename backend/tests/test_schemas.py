from dataclasses import replace
from datetime import date, datetime, timezone
from decimal import Decimal
import json
import unittest
from zoneinfo import ZoneInfo

from bazaar_drishti import schemas
from bazaar_drishti.schemas import (
    ForecastRow,
    RunManifest,
    RunMetrics,
    StudyConfig,
    TradeRow,
)

IST = ZoneInfo("Asia/Kolkata")


def _manifest(**changes: object) -> RunManifest:
    values: dict[str, object] = {
        "run_id": "run-001",
        "synthetic": True,
        "data_label": "synthetic",
        "source_label": "deterministic local fixture",
        "bars_sha256": "a" * 64,
        "config_sha256": "b" * 64,
        "code_revision": "working-tree",
        "created_at_utc": datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
        "created_at_ist": datetime(2030, 1, 7, 9, 30, tzinfo=IST),
        "data_start_utc": datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
        "data_start_ist": datetime(2030, 1, 7, 9, 30, tzinfo=IST),
        "data_end_utc": datetime(2030, 1, 7, 4, 5, tzinfo=timezone.utc),
        "data_end_ist": datetime(2030, 1, 7, 9, 35, tzinfo=IST),
    }
    values.update(changes)
    return RunManifest(**values)  # type: ignore[arg-type]


def _trade(**changes: object) -> TradeRow:
    values: dict[str, object] = {
        "run_id": "run-001",
        "trade_id": "trade-001",
        "session_date_ist": date(2030, 1, 7),
        "entry_time_utc": datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
        "entry_time_ist": datetime(2030, 1, 7, 9, 30, tzinfo=IST),
        "exit_time_utc": datetime(2030, 1, 7, 4, 5, tzinfo=timezone.utc),
        "exit_time_ist": datetime(2030, 1, 7, 9, 35, tzinfo=IST),
        "entry_price_inr": Decimal("1000.00"),
        "exit_price_inr": Decimal("1001.00"),
        "quantity": 2,
        "gross_pnl_inr": Decimal("2.00"),
        "brokerage_inr": Decimal("0.10"),
        "exchange_charges_inr": Decimal("0.05"),
        "sebi_charges_inr": Decimal("0.01"),
        "stt_inr": Decimal("0.04"),
        "stamp_duty_inr": Decimal("0.02"),
        "gst_inr": Decimal("0.03"),
        "slippage_inr": Decimal("0.20"),
        "net_pnl_inr": Decimal("1.55"),
    }
    values.update(changes)
    return TradeRow(**values)  # type: ignore[arg-type]


def _forecast(**changes: object) -> ForecastRow:
    values: dict[str, object] = {
        "run_id": "run-001",
        "forecast_id": "forecast-001",
        "session_date_ist": date(2030, 1, 7),
        "origin_time_utc": datetime(2030, 1, 7, 4, 15, tzinfo=timezone.utc),
        "origin_time_ist": datetime(2030, 1, 7, 9, 45, tzinfo=IST),
        "input_cutoff_utc": datetime(2030, 1, 7, 4, 15, tzinfo=timezone.utc),
        "input_cutoff_ist": datetime(2030, 1, 7, 9, 45, tzinfo=IST),
        "target_time_utc": datetime(2030, 1, 7, 4, 45, tzinfo=timezone.utc),
        "target_time_ist": datetime(2030, 1, 7, 10, 15, tzinfo=IST),
        "probability_up": Decimal("0.60"),
        "baseline_probability_up": Decimal("0.50"),
        "actual_up": None,
        "bars_sha256": "a" * 64,
        "config_sha256": "b" * 64,
        "model_sha256": "c" * 64,
    }
    values.update(changes)
    return ForecastRow(**values)  # type: ignore[arg-type]


def _metrics(**changes: object) -> RunMetrics:
    values: dict[str, object] = {
        "run_id": "run-001",
        "gross_pnl_inr": Decimal("2.00"),
        "brokerage_inr": Decimal("0.10"),
        "exchange_charges_inr": Decimal("0.05"),
        "sebi_charges_inr": Decimal("0.01"),
        "stt_inr": Decimal("0.04"),
        "stamp_duty_inr": Decimal("0.02"),
        "gst_inr": Decimal("0.03"),
        "slippage_inr": Decimal("0.20"),
        "net_pnl_inr": Decimal("1.55"),
        "return_percent": Decimal("0.155"),
        "cash_baseline_net_pnl_inr": Decimal("0.00"),
        "buy_hold_baseline_net_pnl_inr": Decimal("1.00"),
        "max_drawdown_percent": Decimal("0.50"),
        "trade_count": 1,
        "session_count": 1,
        "brier_score": Decimal("0.25"),
        "log_loss": Decimal("0.69"),
        "balanced_accuracy": Decimal("0.50"),
        "forecast_count": 1,
    }
    values.update(changes)
    return RunMetrics(**values)  # type: ignore[arg-type]


class StudyConfigTests(unittest.TestCase):
    def test_unresolved_study_inputs_remain_empty_and_synthetic(self) -> None:
        config = StudyConfig(study_id="study-v1")

        self.assertTrue(config.synthetic)
        self.assertIsNone(config.starting_capital_inr)
        self.assertIsNone(config.share_sizing_rule)
        self.assertIsNone(config.first_session_date_ist)

    def test_rejects_incomplete_session_date_range(self) -> None:
        with self.assertRaises(ValueError):
            StudyConfig(study_id="study-v1", first_session_date_ist=date(2030, 1, 7))


class RunManifestTests(unittest.TestCase):
    def test_accepts_matching_utc_ist_and_synthetic_labels(self) -> None:
        self.assertEqual(_manifest().data_label, "synthetic")

    def test_rejects_real_label_marked_synthetic(self) -> None:
        with self.assertRaises(ValueError):
            _manifest(data_label="licensed historical data")

    def test_rejects_mismatched_utc_ist_instants(self) -> None:
        with self.assertRaises(ValueError):
            _manifest(created_at_ist=datetime(2030, 1, 7, 9, 31, tzinfo=IST))


class TradeRowTests(unittest.TestCase):
    def test_accepts_reconciled_long_trade(self) -> None:
        self.assertEqual(_trade().net_pnl_inr, Decimal("1.55"))

    def test_rejects_net_pnl_that_does_not_reconcile(self) -> None:
        with self.assertRaises(ValueError):
            replace(_trade(), net_pnl_inr=Decimal("1.56"))


class ForecastRowTests(unittest.TestCase):
    def test_accepts_unresolved_outcome_for_historical_replay(self) -> None:
        self.assertIsNone(_forecast().actual_up)

    def test_rejects_target_outside_origin_session(self) -> None:
        with self.assertRaises(ValueError):
            replace(
                _forecast(),
                target_time_utc=datetime(2030, 1, 8, 4, 45, tzinfo=timezone.utc),
                target_time_ist=datetime(2030, 1, 8, 10, 15, tzinfo=IST),
            )

    def test_rejects_probability_above_one(self) -> None:
        with self.assertRaises(ValueError):
            replace(_forecast(), probability_up=Decimal("1.01"))


class RunMetricsTests(unittest.TestCase):
    def test_accepts_reconciled_metrics(self) -> None:
        self.assertEqual(_metrics().net_pnl_inr, Decimal("1.55"))

    def test_rejects_net_total_that_does_not_reconcile(self) -> None:
        with self.assertRaises(ValueError):
            replace(_metrics(), net_pnl_inr=Decimal("1.56"))


class SchemaSerializationTests(unittest.TestCase):
    def test_serializes_exact_money_and_timezone_offsets(self) -> None:
        if not hasattr(schemas, "schema_to_json"):
            self.fail("schemas.schema_to_json is missing")

        payload = json.loads(schemas.schema_to_json(_trade()))

        self.assertEqual(payload["net_pnl_inr"], "1.55")
        self.assertEqual(payload["session_date_ist"], "2030-01-07")
        self.assertEqual(payload["entry_time_ist"], "2030-01-07T09:30:00+05:30")
        self.assertEqual(payload["schema_version"], "bazaar-drishti.trade-row.v1")


if __name__ == "__main__":
    unittest.main()
