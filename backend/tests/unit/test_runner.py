import json
import unittest
from decimal import Decimal

from bazaar_drishti.bundle.validator import validate_run_bundle
from bazaar_drishti.research.runner import FIXTURE_DIR, run_synthetic_study

PLACEHOLDERS = {c * 64 for c in "abc"}


class SyntheticRunTests(unittest.TestCase):
    def setUp(self) -> None:
        self.bundle = run_synthetic_study()

    def test_numbers_come_from_the_engine(self) -> None:
        # Zero-drift random walk: SMA 20/50 never crosses and the model has no skill.
        m = self.bundle.metrics
        self.assertEqual((m.trade_count, m.net_pnl_inr), (0, Decimal("0.00")))
        self.assertEqual((m.forecast_count, m.brier_score), (69, Decimal("0.5370")))

    def test_fingerprints_are_computed_not_placeholders(self) -> None:
        manifest = self.bundle.manifest
        fixture = json.loads((FIXTURE_DIR / "manifest.json").read_text())
        self.assertEqual(manifest.bars_sha256, fixture["bars_file_sha256"])
        for digest in (manifest.config_sha256, self.bundle.forecasts[0].model_sha256):
            self.assertRegex(digest, r"[0-9a-f]{64}\Z")
            self.assertNotIn(digest, PLACEHOLDERS)
        self.assertNotEqual(manifest.code_revision, "git-main")

    def test_run_is_deterministic_and_passes_the_validator(self) -> None:
        again = run_synthetic_study()
        self.assertEqual(
            self.bundle.manifest.config_sha256, again.manifest.config_sha256
        )
        self.assertEqual(
            self.bundle.forecasts[0].model_sha256, again.forecasts[0].model_sha256
        )
        self.assertEqual(self.bundle.metrics, again.metrics)
        self.assertTrue(validate_run_bundle(self.bundle).is_valid)


if __name__ == "__main__":
    unittest.main()
