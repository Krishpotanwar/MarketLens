from datetime import date, datetime, timezone
from decimal import Decimal
import unittest
from zoneinfo import ZoneInfo

from bazaar_drishti.acquisition.protocol import (
    RetryPolicy,
    RightsGate,
    RightsGateBlockedError,
)
from bazaar_drishti.data.normalizer import (
    DataValidationError,
    DuplicateBarError,
    GapDetectedError,
    InvalidOHLCVError,
    SessionBoundsError,
    normalize_and_validate_bars,
)

IST = ZoneInfo("Asia/Kolkata")


class RightsGateTests(unittest.TestCase):
    def test_blocks_real_market_data_when_unapproved(self) -> None:
        gate = RightsGate(
            academic_research_approved=False, public_display_approved=False
        )
        with self.assertRaises(RightsGateBlockedError):
            gate.enforce(synthetic=False)

    def test_allows_synthetic_mode_without_real_data_rights(self) -> None:
        gate = RightsGate(
            academic_research_approved=False, public_display_approved=False
        )
        self.assertTrue(gate.enforce(synthetic=True))

    def test_allows_real_mode_when_all_rights_approved(self) -> None:
        gate = RightsGate(
            api_access_approved=True,
            academic_research_approved=True,
            storage_approved=True,
            public_display_approved=True,
            derived_output_approved=True,
            export_approved=True,
            license_reference="LIC-2026-NSE-001",
            attribution="Data supplied under LIC-2026-NSE-001",
            qualified_review_reference="review-2026-001",
        )
        self.assertTrue(gate.enforce(synthetic=False))
        self.assertTrue(gate.enforce_publication(synthetic=False))

    def test_blocks_real_mode_without_license_reference(self) -> None:
        gate = RightsGate(
            api_access_approved=True,
            academic_research_approved=True,
            storage_approved=True,
        )
        with self.assertRaises(RightsGateBlockedError):
            gate.enforce(synthetic=False)

    def test_blocks_publication_without_separate_output_approvals(self) -> None:
        gate = RightsGate(
            api_access_approved=True,
            academic_research_approved=True,
            storage_approved=True,
            license_reference="LIC-2026-NSE-001",
        )
        with self.assertRaises(RightsGateBlockedError):
            gate.enforce_publication(synthetic=False)

    def test_rights_approvals_must_be_booleans(self) -> None:
        with self.assertRaises(ValueError):
            RightsGate(api_access_approved="false")  # type: ignore[arg-type]


class AcquisitionRetryTests(unittest.TestCase):
    def test_bounded_retry_succeeds_after_transient_error(self) -> None:
        attempts = 0

        def flaky_call() -> bytes:
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise ConnectionError("Transient network failure")
            return b'{"bars": []}'

        policy = RetryPolicy(max_retries=3, backoff_base_seconds=0.001)
        result = policy.execute(flaky_call)
        self.assertEqual(result.raw_bytes, b'{"bars": []}')
        self.assertEqual(attempts, 3)
        self.assertTrue(result.raw_sha256)

    def test_bounded_retry_fails_when_exhausted(self) -> None:
        def failing_call() -> bytes:
            raise ConnectionError("Permanent failure")

        policy = RetryPolicy(max_retries=2, backoff_base_seconds=0.001)
        with self.assertRaises(ConnectionError):
            policy.execute(failing_call)

    def test_does_not_retry_permanent_errors(self) -> None:
        attempts = 0

        def invalid_request() -> bytes:
            nonlocal attempts
            attempts += 1
            raise ValueError("Provider rejected the request")

        with self.assertRaises(ValueError):
            RetryPolicy(max_retries=3, backoff_base_seconds=0.001).execute(
                invalid_request
            )
        self.assertEqual(attempts, 1)


class BarNormalizationTests(unittest.TestCase):
    def _valid_bar(self, **overrides: object) -> dict[str, object]:
        base: dict[str, object] = {
            "symbol": "SYNTH-NIFTY",
            "timestamp_utc": "2030-01-07T03:45:00Z",
            "open": "100.0",
            "high": "105.0",
            "low": "99.0",
            "close": "103.0",
            "volume": 1000,
        }
        base.update(overrides)
        return base

    def test_normalizes_valid_bar_to_canonical_timestamps(self) -> None:
        bars = [self._valid_bar()]
        normalized = normalize_and_validate_bars(bars)
        self.assertEqual(len(normalized), 1)
        bar = normalized[0]
        self.assertEqual(bar.symbol, "SYNTH-NIFTY")
        self.assertEqual(bar.session_date_ist, date(2030, 1, 7))
        self.assertEqual(
            bar.bar_start_utc, datetime(2030, 1, 7, 3, 45, tzinfo=timezone.utc)
        )
        self.assertEqual(bar.bar_start_ist, datetime(2030, 1, 7, 9, 15, tzinfo=IST))
        self.assertEqual(bar.open, Decimal("100.0"))
        self.assertEqual(bar.high, Decimal("105.0"))
        self.assertEqual(bar.low, Decimal("99.0"))
        self.assertEqual(bar.close, Decimal("103.0"))
        self.assertEqual(bar.volume, 1000)

    def test_rejects_duplicate_timestamps(self) -> None:
        bars = [self._valid_bar(), self._valid_bar()]
        with self.assertRaises(DuplicateBarError):
            normalize_and_validate_bars(bars)

    def test_rejects_non_monotonic_timestamps(self) -> None:
        bar1 = self._valid_bar(timestamp_utc="2030-01-07T04:00:00Z")
        bar2 = self._valid_bar(timestamp_utc="2030-01-07T03:45:00Z")
        with self.assertRaises(DataValidationError):
            normalize_and_validate_bars([bar1, bar2])

    def test_rejects_invalid_ohlc_relationships(self) -> None:
        # High lower than Open
        with self.assertRaises(InvalidOHLCVError):
            normalize_and_validate_bars([self._valid_bar(high="95.0", open="100.0")])

        # Low higher than Close
        with self.assertRaises(InvalidOHLCVError):
            normalize_and_validate_bars([self._valid_bar(low="104.0", close="103.0")])

        # Non-positive price
        with self.assertRaises(InvalidOHLCVError):
            normalize_and_validate_bars([self._valid_bar(low="0.0")])

        # Negative volume
        with self.assertRaises(InvalidOHLCVError):
            normalize_and_validate_bars([self._valid_bar(volume=-10)])

    def test_rejects_out_of_session_bars(self) -> None:
        # 09:10 IST is before market open 09:15
        out_of_session = self._valid_bar(timestamp_utc="2030-01-07T03:40:00Z")
        with self.assertRaises(SessionBoundsError):
            normalize_and_validate_bars([out_of_session])

        # 15:35 IST is after market close 15:30
        after_session = self._valid_bar(timestamp_utc="2030-01-07T10:05:00Z")
        with self.assertRaises(SessionBoundsError):
            normalize_and_validate_bars([after_session])

        # A 15:29 start would end after the regular session.
        off_grid_close = self._valid_bar(timestamp_utc="2030-01-07T09:59:00Z")
        with self.assertRaises(SessionBoundsError):
            normalize_and_validate_bars([off_grid_close])

    def test_rejects_non_finite_prices(self) -> None:
        with self.assertRaises(InvalidOHLCVError):
            normalize_and_validate_bars([self._valid_bar(high="Infinity")])

    def test_rejects_fractional_volume(self) -> None:
        with self.assertRaises(InvalidOHLCVError):
            normalize_and_validate_bars([self._valid_bar(volume=1.5)])

    def test_rejects_mixed_symbols(self) -> None:
        first = self._valid_bar()
        second = self._valid_bar(symbol="OTHER", timestamp_utc="2030-01-07T03:50:00Z")
        with self.assertRaises(DataValidationError):
            normalize_and_validate_bars([first, second])

    def test_rejects_missing_or_blank_symbol(self) -> None:
        with self.assertRaises(DataValidationError):
            normalize_and_validate_bars([self._valid_bar(symbol=None)])
        with self.assertRaises(DataValidationError):
            normalize_and_validate_bars([self._valid_bar(symbol="  ")])

    def test_detects_and_flags_missing_intra_session_bars(self) -> None:
        bar1 = self._valid_bar(timestamp_utc="2030-01-07T03:45:00Z")  # 09:15 IST
        bar2 = self._valid_bar(
            timestamp_utc="2030-01-07T03:55:00Z"
        )  # 09:25 IST (skipped 09:20!)
        with self.assertRaises(GapDetectedError):
            normalize_and_validate_bars([bar1, bar2], allow_gaps=False)

        # When allow_gaps=True, it validates without forward-filling
        res = normalize_and_validate_bars([bar1, bar2], allow_gaps=True)
        self.assertEqual(len(res), 2)


if __name__ == "__main__":
    unittest.main()
