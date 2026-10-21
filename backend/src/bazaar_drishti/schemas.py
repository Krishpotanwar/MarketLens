"""Versioned, dependency-free contracts for study and run artifacts."""

from __future__ import annotations

import re
import json
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")
_SHA256 = re.compile(r"[0-9a-f]{64}\Z")

STUDY_CONFIG_SCHEMA = "bazaar-drishti.study-config.v1"
RUN_MANIFEST_SCHEMA = "bazaar-drishti.run-manifest.v1"
TRADE_ROW_SCHEMA = "bazaar-drishti.trade-row.v1"
FORECAST_ROW_SCHEMA = "bazaar-drishti.forecast-row.v2"
RUN_METRICS_SCHEMA = "bazaar-drishti.run-metrics.v1"


def _text(value: str, field: str) -> None:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")


def _date(value: date | None, field: str) -> None:
    if value is not None and (
        not isinstance(value, date) or isinstance(value, datetime)
    ):
        raise ValueError(f"{field} must be an IST calendar date")


def _decimal(value: Decimal, field: str, *, minimum: Decimal | None = None) -> None:
    if not isinstance(value, Decimal) or not value.is_finite():
        raise ValueError(f"{field} must be a finite Decimal")
    if minimum is not None and value < minimum:
        raise ValueError(f"{field} must be at least {minimum}")


def _datetime_pair(utc: datetime, ist: datetime, field: str) -> None:
    if not isinstance(utc, datetime) or not isinstance(ist, datetime):
        raise ValueError(f"{field} timestamps must be datetimes")
    if utc.tzinfo is None or utc.utcoffset() != timedelta(0):
        raise ValueError(f"{field}_utc must have a zero UTC offset")
    if ist.tzinfo is None or ist.utcoffset() != timedelta(hours=5, minutes=30):
        raise ValueError(f"{field}_ist must have the Asia/Kolkata offset")
    if utc.astimezone(IST) != ist:
        raise ValueError(f"{field}_utc and {field}_ist must represent the same instant")


def _schema_version(value: str, expected: str) -> None:
    if value != expected:
        raise ValueError(f"schema_version must be {expected}")


def _sha256(value: str, field: str) -> None:
    if not isinstance(value, str) or _SHA256.fullmatch(value) is None:
        raise ValueError(f"{field} must be a lowercase SHA-256 fingerprint")


@dataclass(frozen=True, slots=True)
class StudyConfig:
    study_id: str
    synthetic: bool = True
    interval_minutes: int = 5
    first_session_date_ist: date | None = None
    last_session_date_ist: date | None = None
    starting_capital_inr: Decimal | None = None
    share_sizing_rule: str | None = None
    schema_version: str = STUDY_CONFIG_SCHEMA

    def __post_init__(self) -> None:
        _schema_version(self.schema_version, STUDY_CONFIG_SCHEMA)
        _text(self.study_id, "study_id")
        if type(self.synthetic) is not bool:
            raise ValueError("synthetic must be a boolean")
        if type(self.interval_minutes) is not int or self.interval_minutes <= 0:
            raise ValueError("interval_minutes must be a positive integer")
        _date(self.first_session_date_ist, "first_session_date_ist")
        _date(self.last_session_date_ist, "last_session_date_ist")
        if (self.first_session_date_ist is None) != (
            self.last_session_date_ist is None
        ):
            raise ValueError(
                "study session date bounds must both be set or both be omitted"
            )
        if (
            self.first_session_date_ist is not None
            and self.last_session_date_ist is not None
            and self.first_session_date_ist > self.last_session_date_ist
        ):
            raise ValueError(
                "first_session_date_ist must not follow last_session_date_ist"
            )
        if self.starting_capital_inr is not None:
            _decimal(
                self.starting_capital_inr,
                "starting_capital_inr",
                minimum=Decimal("0.01"),
            )
        if self.share_sizing_rule is not None:
            _text(self.share_sizing_rule, "share_sizing_rule")


@dataclass(frozen=True, slots=True)
class RunManifest:
    run_id: str
    synthetic: bool
    data_label: str
    source_label: str
    bars_sha256: str
    config_sha256: str
    code_revision: str
    created_at_utc: datetime
    created_at_ist: datetime
    data_start_utc: datetime
    data_start_ist: datetime
    data_end_utc: datetime
    data_end_ist: datetime
    schema_version: str = RUN_MANIFEST_SCHEMA

    def __post_init__(self) -> None:
        _schema_version(self.schema_version, RUN_MANIFEST_SCHEMA)
        for field in ("run_id", "data_label", "source_label", "code_revision"):
            _text(getattr(self, field), field)
        if type(self.synthetic) is not bool:
            raise ValueError("synthetic must be a boolean")
        if self.synthetic != (self.data_label == "synthetic"):
            raise ValueError("synthetic must match the manifest data_label")
        _sha256(self.bars_sha256, "bars_sha256")
        _sha256(self.config_sha256, "config_sha256")
        _datetime_pair(self.created_at_utc, self.created_at_ist, "created_at")
        _datetime_pair(self.data_start_utc, self.data_start_ist, "data_start")
        _datetime_pair(self.data_end_utc, self.data_end_ist, "data_end")
        if self.data_start_utc >= self.data_end_utc:
            raise ValueError("manifest data start must precede data end")


@dataclass(frozen=True, slots=True)
class TradeRow:
    run_id: str
    trade_id: str
    session_date_ist: date
    entry_time_utc: datetime
    entry_time_ist: datetime
    exit_time_utc: datetime
    exit_time_ist: datetime
    entry_price_inr: Decimal
    exit_price_inr: Decimal
    quantity: int
    gross_pnl_inr: Decimal
    brokerage_inr: Decimal
    exchange_charges_inr: Decimal
    sebi_charges_inr: Decimal
    stt_inr: Decimal
    stamp_duty_inr: Decimal
    gst_inr: Decimal
    slippage_inr: Decimal
    net_pnl_inr: Decimal
    schema_version: str = TRADE_ROW_SCHEMA

    def __post_init__(self) -> None:
        _schema_version(self.schema_version, TRADE_ROW_SCHEMA)
        _text(self.run_id, "run_id")
        _text(self.trade_id, "trade_id")
        _date(self.session_date_ist, "session_date_ist")
        _datetime_pair(self.entry_time_utc, self.entry_time_ist, "entry_time")
        _datetime_pair(self.exit_time_utc, self.exit_time_ist, "exit_time")
        if self.entry_time_utc >= self.exit_time_utc:
            raise ValueError("trade entry must precede exit")
        if (
            self.entry_time_ist.date() != self.session_date_ist
            or self.exit_time_ist.date() != self.session_date_ist
        ):
            raise ValueError("trade timestamps must belong to session_date_ist")
        _decimal(self.entry_price_inr, "entry_price_inr", minimum=Decimal("0.01"))
        _decimal(self.exit_price_inr, "exit_price_inr", minimum=Decimal("0.01"))
        if type(self.quantity) is not int or self.quantity <= 0:
            raise ValueError("quantity must be a positive integer")
        charges = (
            self.brokerage_inr,
            self.exchange_charges_inr,
            self.sebi_charges_inr,
            self.stt_inr,
            self.stamp_duty_inr,
            self.gst_inr,
            self.slippage_inr,
        )
        for field, value in zip(
            (
                "brokerage_inr",
                "exchange_charges_inr",
                "sebi_charges_inr",
                "stt_inr",
                "stamp_duty_inr",
                "gst_inr",
                "slippage_inr",
            ),
            charges,
        ):
            _decimal(value, field, minimum=Decimal(0))
        _decimal(self.gross_pnl_inr, "gross_pnl_inr")
        _decimal(self.net_pnl_inr, "net_pnl_inr")
        if (
            self.gross_pnl_inr
            != (self.exit_price_inr - self.entry_price_inr) * self.quantity
        ):
            raise ValueError(
                "gross_pnl_inr must match the long-only entry/exit cash flow"
            )
        if self.net_pnl_inr != self.gross_pnl_inr - sum(charges):
            raise ValueError(
                "net_pnl_inr must equal gross P&L less itemized charges and slippage"
            )


@dataclass(frozen=True, slots=True)
class ForecastRow:
    run_id: str
    forecast_id: str
    session_date_ist: date
    origin_time_utc: datetime
    origin_time_ist: datetime
    input_cutoff_utc: datetime
    input_cutoff_ist: datetime
    target_time_utc: datetime
    target_time_ist: datetime
    probability_up: Decimal
    baseline_probability_up: Decimal
    actual_up: bool | None
    bars_sha256: str
    config_sha256: str
    model_sha256: str
    evaluation_split: str = "test"
    forecast_type: str = "simulated_replay"
    schema_version: str = FORECAST_ROW_SCHEMA

    def __post_init__(self) -> None:
        _schema_version(self.schema_version, FORECAST_ROW_SCHEMA)
        _text(self.run_id, "run_id")
        _text(self.forecast_id, "forecast_id")
        _date(self.session_date_ist, "session_date_ist")
        _datetime_pair(self.origin_time_utc, self.origin_time_ist, "origin_time")
        _datetime_pair(self.input_cutoff_utc, self.input_cutoff_ist, "input_cutoff")
        _datetime_pair(self.target_time_utc, self.target_time_ist, "target_time")
        if (
            self.input_cutoff_utc > self.origin_time_utc
            or self.origin_time_utc >= self.target_time_utc
        ):
            raise ValueError(
                "forecast cutoff, origin, and target times are out of order"
            )
        if any(
            value.date() != self.session_date_ist
            for value in (
                self.origin_time_ist,
                self.input_cutoff_ist,
                self.target_time_ist,
            )
        ):
            raise ValueError("forecast timestamps must remain within session_date_ist")
        for field in ("probability_up", "baseline_probability_up"):
            _decimal(getattr(self, field), field, minimum=Decimal(0))
            if getattr(self, field) > 1:
                raise ValueError(f"{field} must be at most 1")
        if self.actual_up is not None and type(self.actual_up) is not bool:
            raise ValueError("actual_up must be a boolean or None")
        if self.evaluation_split not in {"validation", "test"}:
            raise ValueError("evaluation_split must be validation or test")
        if self.forecast_type != "simulated_replay":
            raise ValueError("forecast_type must be simulated_replay")
        for field in ("bars_sha256", "config_sha256", "model_sha256"):
            _sha256(getattr(self, field), field)


@dataclass(frozen=True, slots=True)
class RunMetrics:
    run_id: str
    gross_pnl_inr: Decimal
    brokerage_inr: Decimal
    exchange_charges_inr: Decimal
    sebi_charges_inr: Decimal
    stt_inr: Decimal
    stamp_duty_inr: Decimal
    gst_inr: Decimal
    slippage_inr: Decimal
    net_pnl_inr: Decimal
    return_percent: Decimal | None
    cash_baseline_net_pnl_inr: Decimal
    buy_hold_baseline_net_pnl_inr: Decimal
    max_drawdown_percent: Decimal
    trade_count: int
    session_count: int
    brier_score: Decimal | None = None
    log_loss: Decimal | None = None
    balanced_accuracy: Decimal | None = None
    forecast_count: int = 0
    schema_version: str = RUN_METRICS_SCHEMA

    def __post_init__(self) -> None:
        _schema_version(self.schema_version, RUN_METRICS_SCHEMA)
        _text(self.run_id, "run_id")
        money_fields = (
            "gross_pnl_inr",
            "brokerage_inr",
            "exchange_charges_inr",
            "sebi_charges_inr",
            "stt_inr",
            "stamp_duty_inr",
            "gst_inr",
            "slippage_inr",
            "net_pnl_inr",
            "cash_baseline_net_pnl_inr",
            "buy_hold_baseline_net_pnl_inr",
        )
        cost_fields = (
            "brokerage_inr",
            "exchange_charges_inr",
            "sebi_charges_inr",
            "stt_inr",
            "stamp_duty_inr",
            "gst_inr",
            "slippage_inr",
        )
        for field in money_fields:
            _decimal(
                getattr(self, field),
                field,
                minimum=Decimal(0) if field in cost_fields else None,
            )
        costs = sum(getattr(self, field) for field in cost_fields)
        if self.net_pnl_inr != self.gross_pnl_inr - costs:
            raise ValueError(
                "net_pnl_inr must equal gross P&L less itemized costs and slippage"
            )
        if self.return_percent is not None:
            _decimal(self.return_percent, "return_percent")
        _decimal(self.max_drawdown_percent, "max_drawdown_percent", minimum=Decimal(0))
        if type(self.trade_count) is not int or self.trade_count < 0:
            raise ValueError("trade_count must be a non-negative integer")
        if type(self.session_count) is not int or self.session_count < 0:
            raise ValueError("session_count must be a non-negative integer")
        if type(self.forecast_count) is not int or self.forecast_count < 0:
            raise ValueError("forecast_count must be a non-negative integer")
        score_fields = ("brier_score", "log_loss", "balanced_accuracy")
        for field in score_fields:
            value = getattr(self, field)
            if value is not None:
                _decimal(value, field, minimum=Decimal(0))
        if self.brier_score is not None and self.brier_score > 1:
            raise ValueError("brier_score must be at most 1")
        if self.balanced_accuracy is not None and self.balanced_accuracy > 1:
            raise ValueError("balanced_accuracy must be at most 1")
        if self.forecast_count == 0 and any(
            getattr(self, field) is not None for field in score_fields
        ):
            raise ValueError("forecast scores require at least one forecast")


SchemaRecord = StudyConfig | RunManifest | TradeRow | ForecastRow | RunMetrics


def _json_value(value: object) -> str:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    raise TypeError(f"unsupported schema value: {type(value).__name__}")


def schema_to_json(record: SchemaRecord) -> str:
    """Serialize a validated schema record with exact money and timezone offsets."""
    return json.dumps(
        asdict(record),
        default=_json_value,
        sort_keys=True,
        separators=(",", ":"),
    )
