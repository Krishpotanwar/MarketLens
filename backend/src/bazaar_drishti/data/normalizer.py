"""Normalize and validate raw intraday bars to canonical representation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
INTERVAL = timedelta(minutes=5)
SESSION_OPEN = time(9, 15)
SESSION_CLOSE = time(15, 30)


class DataValidationError(ValueError):
    """Base error for data validation failures."""


class DuplicateBarError(DataValidationError):
    """Raised when duplicate timestamps are encountered."""


class InvalidOHLCVError(DataValidationError):
    """Raised when OHLCV relationships or values are invalid."""


class SessionBoundsError(DataValidationError):
    """Raised when bars fall outside regular exchange trading session."""


class GapDetectedError(DataValidationError):
    """Raised when an unhandled gap occurs within a trading session."""


@dataclass(frozen=True, slots=True)
class NormalizedBar:
    """Canonical five-minute bar."""

    symbol: str
    session_date_ist: date
    bar_start_utc: datetime
    bar_start_ist: datetime
    bar_end_utc: datetime
    bar_end_ist: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int


def _parse_timestamp(val: Any) -> datetime:
    if isinstance(val, datetime):
        dt = val
    elif isinstance(val, str):
        if val.endswith("Z"):
            val = val[:-1] + "+00:00"
        dt = datetime.fromisoformat(val)
    else:
        raise DataValidationError(f"Unsupported timestamp type: {type(val)}")

    if dt.tzinfo is None:
        raise DataValidationError("Naive timestamps are not permitted")
    return dt.astimezone(timezone.utc)


def normalize_and_validate_bars(
    raw_bars: list[dict[str, Any]], *, allow_gaps: bool = True
) -> list[NormalizedBar]:
    """Normalize raw bar records to canonical NormalizedBar format.

    Enforces strict temporal order, regular session boundaries (09:15-15:30 IST),
    finite positive OHLC relationships, non-negative volume, and gap checks.
    Never silently forward-fills missing bars.
    """
    if not raw_bars:
        return []

    normalized: list[NormalizedBar] = []
    seen_timestamps: set[datetime] = set()
    prev_bar_start_utc: datetime | None = None
    prev_session_date: date | None = None
    dataset_symbol: str | None = None

    for raw in raw_bars:
        raw_symbol = raw.get("symbol")
        if not isinstance(raw_symbol, str) or not raw_symbol.strip():
            raise DataValidationError("Symbol must be a non-empty string")
        symbol = raw_symbol.strip()
        if dataset_symbol is None:
            dataset_symbol = symbol
        elif symbol != dataset_symbol:
            raise DataValidationError("A normalized dataset must contain one symbol")
        start_utc = _parse_timestamp(raw["timestamp_utc"])

        if start_utc in seen_timestamps:
            raise DuplicateBarError(
                f"Duplicate bar timestamp encountered: {start_utc.isoformat()}"
            )
        seen_timestamps.add(start_utc)

        if prev_bar_start_utc is not None and start_utc <= prev_bar_start_utc:
            raise DataValidationError(
                f"Non-monotonic timestamps: {start_utc.isoformat()} <= {prev_bar_start_utc.isoformat()}"
            )

        start_ist = start_utc.astimezone(IST)
        session_date_ist = start_ist.date()
        bar_time_ist = start_ist.time()

        # Regular session check: 09:15 to 15:25 inclusive start time
        if bar_time_ist < SESSION_OPEN or bar_time_ist >= SESSION_CLOSE:
            raise SessionBoundsError(
                f"Bar time {bar_time_ist} outside regular session [{SESSION_OPEN}, {SESSION_CLOSE})"
            )
        minutes_from_open = (bar_time_ist.hour * 60 + bar_time_ist.minute) - (
            SESSION_OPEN.hour * 60 + SESSION_OPEN.minute
        )
        if (
            minutes_from_open % 5 != 0
            or bar_time_ist.second != 0
            or bar_time_ist.microsecond != 0
        ):
            raise SessionBoundsError(
                f"Bar time {bar_time_ist} is not on the five-minute session grid"
            )

        end_utc = start_utc + INTERVAL
        end_ist = start_ist + INTERVAL

        # Check intra-session gap
        if prev_bar_start_utc is not None and session_date_ist == prev_session_date:
            gap = start_utc - prev_bar_start_utc
            if gap > INTERVAL and not allow_gaps:
                raise GapDetectedError(
                    f"Intra-session gap detected: {prev_bar_start_utc.isoformat()} to {start_utc.isoformat()} ({gap})"
                )

        # Parse prices
        try:
            open_p = Decimal(str(raw["open"]))
            high_p = Decimal(str(raw["high"]))
            low_p = Decimal(str(raw["low"]))
            close_p = Decimal(str(raw["close"]))
            volume_value = Decimal(str(raw["volume"]))
        except (InvalidOperation, ValueError, TypeError) as exc:
            raise InvalidOHLCVError(f"Malformed numerical OHLCV values: {exc}") from exc

        # OHLC validation
        if not all(p.is_finite() for p in (open_p, high_p, low_p, close_p)):
            raise InvalidOHLCVError("Prices must be finite")
        if open_p <= 0 or high_p <= 0 or low_p <= 0 or close_p <= 0:
            raise InvalidOHLCVError("Prices must be strictly positive")
        if (
            not volume_value.is_finite()
            or volume_value != volume_value.to_integral_value()
        ):
            raise InvalidOHLCVError("Volume must be a finite integer")
        volume = int(volume_value)
        if volume < 0:
            raise InvalidOHLCVError("Volume must be non-negative")
        if high_p < low_p:
            raise InvalidOHLCVError(f"High ({high_p}) is lower than Low ({low_p})")
        if open_p < low_p or open_p > high_p:
            raise InvalidOHLCVError(
                f"Open ({open_p}) outside [Low ({low_p}), High ({high_p})]"
            )
        if close_p < low_p or close_p > high_p:
            raise InvalidOHLCVError(
                f"Close ({close_p}) outside [Low ({low_p}), High ({high_p})]"
            )

        normalized.append(
            NormalizedBar(
                symbol=symbol,
                session_date_ist=session_date_ist,
                bar_start_utc=start_utc,
                bar_start_ist=start_ist,
                bar_end_utc=end_utc,
                bar_end_ist=end_ist,
                open=open_p,
                high=high_p,
                low=low_p,
                close=close_p,
                volume=volume,
            )
        )
        prev_bar_start_utc = start_utc
        prev_session_date = session_date_ist

    return normalized
