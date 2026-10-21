"""Generate a deterministic, clearly synthetic five-minute OHLCV fixture."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import tempfile
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from zoneinfo import ZoneInfo

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = REPOSITORY_ROOT / "data" / "fixtures" / "synthetic"
SCHEMA_VERSION = "bazaar-drishti.synthetic-bars.v1"
GENERATOR_VERSION = "0.1.0"
SEED = 0xBADA2026
MASK_32 = 0xFFFFFFFF
IST = ZoneInfo("Asia/Kolkata")
INTERVAL = timedelta(minutes=5)
SESSION_OPEN = time(9, 15)
BARS_PER_SESSION = 75
SESSION_DATES = (date(2030, 1, 7), date(2030, 1, 8), date(2030, 1, 9))
GAP_SESSION_INDEX = 1
GAP_BAR_INDEX = 32
CSV_FIELDS = (
    "session_date_ist",
    "bar_start_utc",
    "bar_start_ist",
    "bar_end_utc",
    "bar_end_ist",
    "open",
    "high",
    "low",
    "close",
    "volume",
)


def _next_word(state: int) -> tuple[int, int]:
    """Return the next fixed-width xorshift32 state and its value."""
    state ^= (state << 13) & MASK_32
    state ^= state >> 17
    state ^= (state << 5) & MASK_32
    state &= MASK_32
    return state, state


def _price(paise: int) -> str:
    return f"{Decimal(paise) / Decimal(100):.2f}"


def _utc_text(value: datetime) -> str:
    return (
        value.astimezone(timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z")
    )


def _make_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    state = SEED

    for session_index, session_date in enumerate(SESSION_DATES):
        if session_date.weekday() >= 5:
            raise ValueError(
                f"Synthetic session template must use weekdays: {session_date}"
            )

        session_start = datetime.combine(session_date, SESSION_OPEN, tzinfo=IST)
        previous_close_paise = 100_000
        for bar_index in range(BARS_PER_SESSION):
            state, move_word = _next_word(state)
            state, upper_word = _next_word(state)
            state, lower_word = _next_word(state)
            state, volume_word = _next_word(state)

            open_paise = previous_close_paise
            close_paise = open_paise + move_word % 81 - 40
            high_paise = max(open_paise, close_paise) + 1 + upper_word % 36
            low_paise = min(open_paise, close_paise) - 1 - lower_word % 36
            start_ist = session_start + bar_index * INTERVAL
            end_ist = start_ist + INTERVAL
            previous_close_paise = close_paise

            if (session_index, bar_index) == (GAP_SESSION_INDEX, GAP_BAR_INDEX):
                continue

            rows.append(
                {
                    "session_date_ist": session_date.isoformat(),
                    "bar_start_utc": _utc_text(start_ist),
                    "bar_start_ist": start_ist.isoformat(timespec="seconds"),
                    "bar_end_utc": _utc_text(end_ist),
                    "bar_end_ist": end_ist.isoformat(timespec="seconds"),
                    "open": _price(open_paise),
                    "high": _price(high_paise),
                    "low": _price(low_paise),
                    "close": _price(close_paise),
                    "volume": str(250 + volume_word % 4_751),
                }
            )

    return rows


def _expected_start_times() -> list[str]:
    expected: list[str] = []
    for session_index, session_date in enumerate(SESSION_DATES):
        session_start = datetime.combine(session_date, SESSION_OPEN, tzinfo=IST)
        for bar_index in range(BARS_PER_SESSION):
            if (session_index, bar_index) == (GAP_SESSION_INDEX, GAP_BAR_INDEX):
                continue
            expected.append(_utc_text(session_start + bar_index * INTERVAL))
    return expected


def _manifest_metadata() -> dict[str, object]:
    gap_start = (
        datetime.combine(SESSION_DATES[GAP_SESSION_INDEX], SESSION_OPEN, tzinfo=IST)
        + GAP_BAR_INDEX * INTERVAL
    )
    return {
        "schema_version": SCHEMA_VERSION,
        "generator_version": GENERATOR_VERSION,
        "data_label": "synthetic",
        "synthetic": True,
        "security_identity": None,
        "source": "deterministic local generator; no external data",
        "seed": SEED,
        "random_generator": "xorshift32",
        "price_process": "zero-drift synthetic random walk; each session resets to 1000.00",
        "intended_use": "schema and pipeline validation only; not strategy or forecast evidence",
        "interval_minutes": 5,
        "timezone": "Asia/Kolkata",
        "price_unit": "INR synthetic units; not exchange prices",
        "session_template": {
            "open_ist": SESSION_OPEN.isoformat(timespec="minutes"),
            "close_ist": (
                datetime.combine(date.min, SESSION_OPEN) + BARS_PER_SESSION * INTERVAL
            )
            .time()
            .isoformat(timespec="minutes"),
            "calendar": "invented weekday template; not an exchange calendar",
            "dates_ist": [value.isoformat() for value in SESSION_DATES],
            "expected_bars_per_session": BARS_PER_SESSION,
        },
        "documented_gap": {
            "session_date_ist": SESSION_DATES[GAP_SESSION_INDEX].isoformat(),
            "missing_start_ist": gap_start.isoformat(timespec="seconds"),
            "missing_end_ist": (gap_start + INTERVAL).isoformat(timespec="seconds"),
            "next_bar_start_ist": (gap_start + INTERVAL).isoformat(timespec="seconds"),
            "reason": "intentional fixture gap; no bar is filled or inferred",
        },
    }


def _validate_rows(rows: list[dict[str, str]]) -> None:
    expected_times = _expected_start_times()
    actual_times = [row["bar_start_utc"] for row in rows]
    if actual_times != expected_times:
        raise ValueError(
            "Fixture timestamps are out of order or the documented gap changed"
        )

    for row in rows:
        start_utc = datetime.fromisoformat(row["bar_start_utc"].replace("Z", "+00:00"))
        end_utc = datetime.fromisoformat(row["bar_end_utc"].replace("Z", "+00:00"))
        start_ist = datetime.fromisoformat(row["bar_start_ist"])
        end_ist = datetime.fromisoformat(row["bar_end_ist"])
        if (
            start_utc.tzinfo is None
            or end_utc.tzinfo is None
            or start_ist.tzinfo is None
            or end_ist.tzinfo is None
        ):
            raise ValueError("Fixture timestamps must include timezone offsets")
        if start_utc.utcoffset() != timedelta(0) or end_utc.utcoffset() != timedelta(0):
            raise ValueError("UTC timestamp fields must use a zero offset")
        ist_offset = timedelta(hours=5, minutes=30)
        if start_ist.utcoffset() != ist_offset or end_ist.utcoffset() != ist_offset:
            raise ValueError("IST timestamp fields must use the Asia/Kolkata offset")
        if start_utc.astimezone(IST) != start_ist or end_utc.astimezone(IST) != end_ist:
            raise ValueError("UTC and IST timestamps do not describe the same instant")
        if start_ist.date().isoformat() != row["session_date_ist"]:
            raise ValueError("IST session date does not match the bar timestamp")
        if end_utc - start_utc != INTERVAL:
            raise ValueError("Every fixture bar must span exactly five minutes")

        opening, high, low, close = (
            Decimal(row[field]) for field in ("open", "high", "low", "close")
        )
        if (
            not all(value.is_finite() for value in (opening, high, low, close))
            or low <= 0
            or not (low <= opening <= high and low <= close <= high)
        ):
            raise ValueError("Fixture OHLC values are invalid")
        if int(row["volume"]) < 0:
            raise ValueError("Fixture volume cannot be negative")


def validate_fixture(bars: bytes, manifest_bytes: bytes) -> int:
    """Validate a serialized synthetic bars/manifest pair against schema v1."""
    try:
        reader = csv.DictReader(io.StringIO(bars.decode("utf-8"), newline=""))
    except UnicodeDecodeError as exc:
        raise ValueError("Fixture bars must be UTF-8 CSV") from exc
    if tuple(reader.fieldnames or ()) != CSV_FIELDS:
        raise ValueError("Fixture CSV header does not match the schema")

    rows = list(reader)
    if any(
        set(row) != set(CSV_FIELDS)
        or any(not isinstance(value, str) or not value for value in row.values())
        for row in rows
    ):
        raise ValueError("Fixture CSV rows must contain every schema field")
    _validate_rows(rows)

    try:
        manifest = json.loads(manifest_bytes.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Fixture manifest must be UTF-8 JSON") from exc
    if not isinstance(manifest, dict):
        raise ValueError("Fixture manifest must be a JSON object")
    if manifest.get("schema_version") != SCHEMA_VERSION:
        raise ValueError("Fixture manifest has an unsupported schema version")
    expected_metadata = _manifest_metadata()
    if manifest.get("synthetic") is not True or any(
        key not in manifest or manifest[key] != value
        for key, value in expected_metadata.items()
    ):
        raise ValueError(
            "Fixture manifest does not match the synthetic schema metadata"
        )
    if manifest.get("row_count") != len(rows):
        raise ValueError("Fixture manifest row count does not match bars.csv")
    if manifest.get("bars_file_sha256") != hashlib.sha256(bars).hexdigest():
        raise ValueError("Fixture manifest hash does not match bars.csv")
    return len(rows)


def _csv_bytes(rows: list[dict[str, str]]) -> bytes:
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=CSV_FIELDS, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue().encode("utf-8")


def build_fixture() -> tuple[bytes, bytes, int]:
    """Build validated CSV and manifest bytes without external data or dependencies."""
    rows = _make_rows()
    bars = _csv_bytes(rows)

    manifest = {
        **_manifest_metadata(),
        "row_count": len(rows),
        "bars_file_sha256": hashlib.sha256(bars).hexdigest(),
    }
    manifest_bytes = (
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    ).encode("utf-8")
    return bars, manifest_bytes, validate_fixture(bars, manifest_bytes)


def write_fixture(output_dir: Path) -> tuple[Path, Path, str, int]:
    bars, manifest, row_count = build_fixture()
    output_dir.mkdir(parents=True, exist_ok=True)
    bars_path = output_dir / "bars.csv"
    manifest_path = output_dir / "manifest.json"
    with tempfile.TemporaryDirectory(
        prefix=".bazaar-drishti-", dir=output_dir
    ) as staging_name:
        staging_dir = Path(staging_name)
        staged_bars = staging_dir / "bars.csv"
        staged_manifest = staging_dir / "manifest.json"
        staged_bars.write_bytes(bars)
        staged_manifest.write_bytes(manifest)
        # shortcut: the two replacements are not atomic together; use a versioned directory for concurrent readers.
        staged_bars.replace(bars_path)
        staged_manifest.replace(manifest_path)
    return bars_path, manifest_path, hashlib.sha256(bars).hexdigest(), row_count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="directory for bars.csv and manifest.json",
    )
    args = parser.parse_args()

    bars_path, manifest_path, fingerprint, row_count = write_fixture(args.output)
    print(f"Wrote {row_count} synthetic bars to {bars_path}")
    print(f"Manifest: {manifest_path}")
    print(f"bars.csv SHA-256: {fingerprint}")


if __name__ == "__main__":
    main()
