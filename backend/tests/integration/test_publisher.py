from datetime import date, datetime, timezone
from decimal import Decimal
import sqlite3
import unittest
from zoneinfo import ZoneInfo

from bazaar_drishti.bundle.builder import build_run_bundle
from bazaar_drishti.bundle.publisher import Publisher
from bazaar_drishti.bundle.validator import BundleValidationError, validate_run_bundle
from bazaar_drishti.research.backtest import EquityPoint
from bazaar_drishti.schemas import ForecastRow, RunManifest, RunMetrics, TradeRow

IST = ZoneInfo("Asia/Kolkata")


class BundleAndPublisherTests(unittest.TestCase):
    def setUp(self) -> None:
        self.run_id = "run-2030-001"
        self.manifest = RunManifest(
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

        self.trade = TradeRow(
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

        self.metrics = RunMetrics(
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

        self.forecast = ForecastRow(
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

        self.equity_points = [
            EquityPoint(
                timestamp_utc=datetime(2030, 1, 7, 4, tzinfo=timezone.utc),
                timestamp_ist=datetime(2030, 1, 7, 9, 30, tzinfo=IST),
                equity_inr=Decimal("1000.00"),
                drawdown_percent=Decimal("0.00"),
            ),
            EquityPoint(
                timestamp_utc=datetime(2030, 1, 7, 4, 30, tzinfo=timezone.utc),
                timestamp_ist=datetime(2030, 1, 7, 10, 0, tzinfo=IST),
                equity_inr=Decimal("1047.90"),
                drawdown_percent=Decimal("0.00"),
            ),
        ]

    def test_bundle_build_and_validation(self) -> None:
        bundle = build_run_bundle(
            manifest=self.manifest,
            metrics=self.metrics,
            trades=[self.trade],
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        report = validate_run_bundle(bundle)
        self.assertTrue(report.is_valid)
        self.assertEqual(len(report.errors), 0)

    def test_bundle_validation_rejects_run_id_mismatch(self) -> None:
        from dataclasses import replace

        bad_metrics = replace(self.metrics, run_id="different-run-id")
        bundle = build_run_bundle(
            manifest=self.manifest,
            metrics=bad_metrics,
            trades=[self.trade],
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        with self.assertRaises(BundleValidationError):
            validate_run_bundle(bundle)

    def test_bundle_validation_blocks_real_data_without_integrated_rights_evidence(
        self,
    ) -> None:
        from dataclasses import replace

        real_manifest = replace(
            self.manifest, synthetic=False, data_label="licensed-real"
        )
        bundle = build_run_bundle(
            manifest=real_manifest,
            metrics=self.metrics,
            trades=[self.trade],
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        with self.assertRaisesRegex(BundleValidationError, "C1 rights"):
            validate_run_bundle(bundle)

    def test_bundle_validation_rejects_metrics_that_disagree_with_trades(self) -> None:
        from dataclasses import replace

        bad_trade = replace(
            self.trade,
            exit_price_inr=Decimal("106.00"),
            gross_pnl_inr=Decimal("60.00"),
            net_pnl_inr=Decimal("57.90"),
        )
        bundle = build_run_bundle(
            manifest=self.manifest,
            metrics=self.metrics,
            trades=[bad_trade],
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        with self.assertRaises(BundleValidationError):
            validate_run_bundle(bundle)

    def test_bundle_validation_rejects_trade_and_forecast_count_mismatch(self) -> None:
        from dataclasses import replace

        bad_metrics = replace(self.metrics, trade_count=0, forecast_count=2)
        bundle = build_run_bundle(
            manifest=self.manifest,
            metrics=bad_metrics,
            trades=[self.trade],
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        with self.assertRaises(BundleValidationError):
            validate_run_bundle(bundle)

    def test_bundle_validation_rejects_metrics_without_trades(self) -> None:
        bundle = build_run_bundle(
            manifest=self.manifest,
            metrics=self.metrics,
            trades=[],
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        with self.assertRaises(BundleValidationError):
            validate_run_bundle(bundle)

    def test_run_bundle_copies_artifact_lists_to_immutable_tuples(self) -> None:
        trades = [self.trade]
        bundle = build_run_bundle(
            manifest=self.manifest,
            metrics=self.metrics,
            trades=trades,
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        trades.clear()
        self.assertEqual(bundle.trades, (self.trade,))

    def test_publisher_transactional_publish_and_pointer_update(self) -> None:
        bundle = build_run_bundle(
            manifest=self.manifest,
            metrics=self.metrics,
            trades=[self.trade],
            forecasts=[self.forecast],
            equity_curve=self.equity_points,
            contributions=[],
        )
        conn = sqlite3.connect(":memory:")
        try:
            publisher = Publisher(conn)
            publisher.initialize_schema()

            # Publish
            publisher.publish_run(bundle)
            self.assertEqual(publisher.get_active_run_id(), self.run_id)
            with self.assertRaises(KeyError):
                publisher.set_active_run("missing-run")
            self.assertEqual(publisher.get_active_run_id(), self.run_id)

            # Retrieve published run
            pub_manifest = publisher.get_manifest(self.run_id)
            self.assertEqual(pub_manifest.run_id, self.run_id)
            self.assertTrue(pub_manifest.synthetic)
            row = conn.execute(
                "SELECT evaluation_split FROM forecast_records WHERE run_id = ?",
                (self.run_id,),
            ).fetchone()
            self.assertEqual(row[0], "test")

            self.assertEqual(publisher.get_active_run_id(), self.run_id)
            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute(
                    "UPDATE trade_ledger SET net_pnl_inr = '0.00' WHERE run_id = ?",
                    (self.run_id,),
                )
        finally:
            conn.close()

    def test_failed_publish_rolls_back_and_keeps_previous_run_active(self) -> None:
        from dataclasses import replace

        conn = sqlite3.connect(":memory:")
        try:
            publisher = Publisher(conn)
            publisher.initialize_schema()
            prior = build_run_bundle(
                manifest=self.manifest,
                metrics=self.metrics,
                trades=[self.trade],
                forecasts=[self.forecast],
                equity_curve=self.equity_points,
                contributions=[],
            )
            publisher.publish_run(prior)

            next_run_id = "run-2030-002"
            new_bundle = build_run_bundle(
                manifest=replace(self.manifest, run_id=next_run_id),
                metrics=replace(self.metrics, run_id=next_run_id),
                trades=[replace(self.trade, run_id=next_run_id)],
                forecasts=[replace(self.forecast, run_id=next_run_id)],
                equity_curve=self.equity_points,
                contributions=[],
            )
            conn.execute(
                """
                CREATE TRIGGER reject_new_forecasts BEFORE INSERT ON forecast_records
                WHEN NEW.run_id = 'run-2030-002'
                BEGIN SELECT RAISE(ABORT, 'injected publish failure'); END
                """
            )
            with self.assertRaises(sqlite3.IntegrityError):
                publisher.publish_run(new_bundle)

            self.assertEqual(publisher.get_active_run_id(), self.run_id)
            with self.assertRaises(KeyError):
                publisher.get_manifest(next_run_id)
            self.assertEqual(
                conn.execute(
                    "SELECT COUNT(*) FROM trade_ledger WHERE run_id = ?", (next_run_id,)
                ).fetchone()[0],
                0,
            )
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
