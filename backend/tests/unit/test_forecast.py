from datetime import date, datetime, timedelta, timezone
from dataclasses import replace
from decimal import Decimal
import unittest
from zoneinfo import ZoneInfo

from bazaar_drishti.data.normalizer import NormalizedBar
from bazaar_drishti.research.forecast import (
    ForecastEvaluation,
    compute_causal_features,
    evaluate_chronological_forecast,
)
from bazaar_drishti.research.metrics import (
    calculate_brier_score,
    calculate_balanced_accuracy,
    calculate_log_loss,
    calculate_reliability_bins,
)

IST = ZoneInfo("Asia/Kolkata")


class ForecastEvaluationTests(unittest.TestCase):
    def _create_bars(self, session_date: date, count: int = 75) -> list[NormalizedBar]:
        bars: list[NormalizedBar] = []
        cur_ist = datetime(
            session_date.year, session_date.month, session_date.day, 9, 15, tzinfo=IST
        )
        price = Decimal("100.00")
        for i in range(count):
            price += Decimal("0.10") if i % 2 == 0 else Decimal("-0.05")
            bar_start_utc = cur_ist.astimezone(timezone.utc)
            bar_end_ist = cur_ist + timedelta(minutes=5)
            bar_end_utc = bar_end_ist.astimezone(timezone.utc)
            bars.append(
                NormalizedBar(
                    symbol="SYNTH",
                    session_date_ist=session_date,
                    bar_start_utc=bar_start_utc,
                    bar_start_ist=cur_ist,
                    bar_end_utc=bar_end_utc,
                    bar_end_ist=bar_end_ist,
                    open=price,
                    high=price + Decimal("0.5"),
                    low=price - Decimal("0.5"),
                    close=price,
                    volume=1000,
                )
            )
            cur_ist = bar_end_ist
        return bars

    def test_causal_features_do_not_leak_future_data(self) -> None:
        bars = self._create_bars(date(2030, 1, 7), 60)
        features_full = compute_causal_features(bars)

        # Truncate bars and verify earlier rows match identically
        features_sub = compute_causal_features(bars[:40])
        self.assertEqual(len(features_sub), 40)
        for i in range(40):
            self.assertEqual(features_full[i], features_sub[i])

    def test_default_fingerprints_are_computed_not_placeholders(self) -> None:
        bars = [
            b for day in range(7, 12) for b in self._create_bars(date(2030, 1, day), 75)
        ]
        row = evaluate_chronological_forecast(bars).forecast_rows[0]
        for digest in (row.bars_sha256, row.config_sha256, row.model_sha256):
            self.assertNotIn(digest, {c * 64 for c in "abc"})
        again = evaluate_chronological_forecast(bars).forecast_rows[0]
        self.assertEqual(row.model_sha256, again.model_sha256)

    def test_labels_never_cross_session_boundaries(self) -> None:
        all_bars = [
            bar
            for day in range(7, 12)
            for bar in self._create_bars(date(2030, 1, day), 75)
        ]

        eval_res = evaluate_chronological_forecast(all_bars)
        self.assertIsInstance(eval_res, ForecastEvaluation)
        self.assertEqual(
            {row.session_date_ist for row in eval_res.forecast_rows},
            {date(2030, 1, 11)},
        )
        self.assertEqual(
            eval_res.test_positive_count + eval_res.test_negative_count,
            len(eval_res.forecast_rows),
        )

        # For every forecast row, target must be in the same session as origin
        for row in eval_res.forecast_rows:
            self.assertEqual(row.origin_time_ist.date(), row.target_time_ist.date())
            self.assertEqual(row.evaluation_split, "test")
            self.assertEqual(row.input_cutoff_ist, row.origin_time_ist)
            self.assertEqual(
                row.target_time_ist - row.origin_time_ist, timedelta(minutes=30)
            )

    def test_no_test_session_reports_metrics_as_unavailable(self) -> None:
        bars = self._create_bars(date(2030, 1, 7), 75)
        result = evaluate_chronological_forecast(bars)
        self.assertEqual(result.forecast_rows, [])
        self.assertIsNone(result.brier_score)
        self.assertIsNone(result.log_loss)
        self.assertIsNone(result.balanced_accuracy)

    def test_forecast_horizon_stays_thirty_minutes_across_missing_bars(self) -> None:
        bars = [
            bar
            for day in range(7, 11)
            for bar in self._create_bars(date(2030, 1, day), 75)
        ]
        test_session = self._create_bars(date(2030, 1, 11), 75)
        bars.extend(test_session[:4] + test_session[5:])

        result = evaluate_chronological_forecast(bars)
        self.assertTrue(result.forecast_rows)
        self.assertTrue(
            all(
                row.target_time_utc - row.origin_time_utc == timedelta(minutes=30)
                for row in result.forecast_rows
            )
        )

    def test_future_test_row_does_not_change_earlier_prediction(self) -> None:
        bars = [
            bar
            for day in range(7, 12)
            for bar in self._create_bars(date(2030, 1, day), 75)
        ]
        original = evaluate_chronological_forecast(bars)
        future_bar = bars[-1]
        bars[-1] = replace(
            future_bar,
            close=future_bar.close + Decimal("10.00"),
            high=future_bar.high + Decimal("10.00"),
        )
        perturbed = evaluate_chronological_forecast(bars)
        self.assertEqual(
            original.forecast_rows[0].probability_up,
            perturbed.forecast_rows[0].probability_up,
        )

    def test_contributions_sum_to_model_logit(self) -> None:
        bars_day1 = self._create_bars(date(2030, 1, 7), 75)
        bars_day2 = self._create_bars(date(2030, 1, 8), 75)
        bars_day3 = self._create_bars(date(2030, 1, 9), 75)
        all_bars = bars_day1 + bars_day2 + bars_day3

        eval_res = evaluate_chronological_forecast(all_bars)
        self.assertTrue(eval_res.contributions)
        for c in eval_res.contributions:
            calculated_logit = c.intercept + sum(c.feature_contributions.values())
            self.assertAlmostEqual(
                float(c.total_logit), float(calculated_logit), places=4
            )


class MetricsTests(unittest.TestCase):
    def test_loss_metrics_reject_missing_or_mismatched_forecasts(self) -> None:
        with self.assertRaises(ValueError):
            calculate_brier_score([], [])
        with self.assertRaises(ValueError):
            calculate_log_loss([], [])
        with self.assertRaises(ValueError):
            calculate_brier_score([Decimal("0.5")], [])

    def test_balanced_accuracy_is_unavailable_for_one_class(self) -> None:
        score = calculate_balanced_accuracy(
            [Decimal("0.8"), Decimal("0.2")], [True, True]
        )
        self.assertIsNone(score)

    def test_brier_score_calculation(self) -> None:
        # Perfect predictions
        probs = [Decimal("1.0"), Decimal("0.0")]
        actuals = [True, False]
        self.assertEqual(calculate_brier_score(probs, actuals), Decimal("0.0000"))

        # Inverted predictions
        probs = [Decimal("0.0"), Decimal("1.0")]
        actuals = [True, False]
        self.assertEqual(calculate_brier_score(probs, actuals), Decimal("1.0000"))

    def test_log_loss_calculation(self) -> None:
        probs = [Decimal("0.5"), Decimal("0.5")]
        actuals = [True, False]
        loss = calculate_log_loss(probs, actuals)
        self.assertAlmostEqual(float(loss), 0.6931, places=3)

    def test_reliability_bins(self) -> None:
        probs = [Decimal("0.15"), Decimal("0.18"), Decimal("0.85")]
        actuals = [False, False, True]
        bins = calculate_reliability_bins(probs, actuals, num_bins=5)
        self.assertTrue(len(bins) > 0)


if __name__ == "__main__":
    unittest.main()
