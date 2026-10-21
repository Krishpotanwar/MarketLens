import hashlib
import json
import unittest

from bazaar_drishti.synthetic import build_fixture, validate_fixture

EXPECTED_BARS_SHA256 = (
    "9e232063a896d744fea0637387b87f64031a1a91464f05176038d41e804806fd"
)


class SyntheticFixtureTests(unittest.TestCase):
    def test_fixture_build_is_deterministic_and_clearly_synthetic(self) -> None:
        bars, manifest_bytes, row_count = build_fixture()
        second_bars, second_manifest, second_row_count = build_fixture()
        manifest = json.loads(manifest_bytes)

        self.assertEqual(row_count, 224)
        self.assertEqual(second_row_count, row_count)
        self.assertEqual(bars, second_bars)
        self.assertEqual(manifest_bytes, second_manifest)
        self.assertEqual(hashlib.sha256(bars).hexdigest(), EXPECTED_BARS_SHA256)
        self.assertEqual(manifest["bars_file_sha256"], EXPECTED_BARS_SHA256)
        self.assertTrue(manifest["synthetic"])
        self.assertEqual(manifest["data_label"], "synthetic")
        self.assertIsNone(manifest["security_identity"])
        self.assertEqual(validate_fixture(bars, manifest_bytes), 224)

    def test_fixture_validator_rejects_a_mismatched_fingerprint(self) -> None:
        bars, manifest_bytes, _ = build_fixture()
        manifest = json.loads(manifest_bytes)
        manifest["bars_file_sha256"] = "0" * 64

        with self.assertRaises(ValueError):
            validate_fixture(bars, json.dumps(manifest).encode("utf-8"))

    def test_fixture_validator_rejects_a_synthetic_label_mismatch(self) -> None:
        bars, manifest_bytes, _ = build_fixture()
        manifest = json.loads(manifest_bytes)
        manifest["synthetic"] = False

        with self.assertRaises(ValueError):
            validate_fixture(bars, json.dumps(manifest).encode("utf-8"))

    def test_persisted_fixture_files_match_contract(self) -> None:
        from bazaar_drishti.synthetic import DEFAULT_OUTPUT

        bars_path = DEFAULT_OUTPUT / "bars.csv"
        manifest_path = DEFAULT_OUTPUT / "manifest.json"
        self.assertTrue(bars_path.exists())
        self.assertTrue(manifest_path.exists())

        bars = bars_path.read_bytes()
        manifest_bytes = manifest_path.read_bytes()
        row_count = validate_fixture(bars, manifest_bytes)
        self.assertEqual(row_count, 224)
        self.assertEqual(hashlib.sha256(bars).hexdigest(), EXPECTED_BARS_SHA256)


if __name__ == "__main__":
    unittest.main()
