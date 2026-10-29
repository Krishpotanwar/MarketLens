"""Indian cash-equity transaction cost modeling; the rates live in backend/data/fee_schedule.json."""

from __future__ import annotations

import json
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

PAISE = Decimal("0.01")

# One rate file for the whole project. web/src/data/feeSchedule.json mirrors it for the browser
# bundle, and a unit test fails if the two ever differ.
_RATES = json.loads(
    (Path(__file__).resolve().parents[3] / "data" / "fee_schedule.json").read_text(),
    parse_float=Decimal,
)
_MIS = "MIS"


def _round_inr(amount: Decimal) -> Decimal:
    """Round to 2 decimal places (paise) with ROUND_HALF_UP."""
    return amount.quantize(PAISE, rounding=ROUND_HALF_UP)


@dataclass(frozen=True, slots=True)
class FeeSchedule:
    """Intraday (MIS) rates read from fee_schedule.json; its status field says they are unverified."""

    # shortcut: rates are unverified and undated; replace with a sourced schedule before any scored run.

    schedule_id: str = f"{_RATES['schedule_id']}-{_MIS}"
    brokerage_percent: Decimal = Decimal(_RATES["brokerage"][_MIS]["percent"])
    brokerage_flat_cap: Decimal = Decimal(_RATES["brokerage"][_MIS]["cap"])
    exchange_turnover_percent: Decimal = Decimal(_RATES["exchange_txn"])
    sebi_turnover_percent: Decimal = Decimal(_RATES["sebi_turnover"])
    stt_sell_percent: Decimal = Decimal(_RATES["stt"][_MIS]["sell"])
    stamp_duty_buy_percent: Decimal = Decimal(_RATES["stamp_duty_buy"][_MIS])
    gst_percent: Decimal = Decimal(_RATES["gst"])


@dataclass(frozen=True, slots=True)
class TransactionCosts:
    """Itemized transaction costs for a single fill or round-trip trade."""

    brokerage_inr: Decimal
    exchange_charges_inr: Decimal
    sebi_charges_inr: Decimal
    stt_inr: Decimal
    stamp_duty_inr: Decimal
    gst_inr: Decimal
    total_charges_inr: Decimal

    def __add__(self, other: TransactionCosts) -> TransactionCosts:
        return TransactionCosts(
            brokerage_inr=self.brokerage_inr + other.brokerage_inr,
            exchange_charges_inr=self.exchange_charges_inr + other.exchange_charges_inr,
            sebi_charges_inr=self.sebi_charges_inr + other.sebi_charges_inr,
            stt_inr=self.stt_inr + other.stt_inr,
            stamp_duty_inr=self.stamp_duty_inr + other.stamp_duty_inr,
            gst_inr=self.gst_inr + other.gst_inr,
            total_charges_inr=self.total_charges_inr + other.total_charges_inr,
        )


def calculate_transaction_costs(
    notional: Decimal, *, is_buy: bool, fees: FeeSchedule
) -> TransactionCosts:
    """Calculate itemized and rounded transaction costs on trade turnover."""
    # Brokerage: min(cap, notional * brokerage_percent)
    raw_brokerage = notional * fees.brokerage_percent
    brokerage = _round_inr(min(fees.brokerage_flat_cap, raw_brokerage))

    # Exchange turnover charge
    exchange = _round_inr(notional * fees.exchange_turnover_percent)

    # SEBI turnover charge
    sebi = _round_inr(notional * fees.sebi_turnover_percent)

    # Stamp duty: buy side only
    stamp = (
        _round_inr(notional * fees.stamp_duty_buy_percent)
        if is_buy
        else Decimal("0.00")
    )

    # STT: sell side only for intraday equity
    stt = (
        _round_inr(notional * fees.stt_sell_percent) if not is_buy else Decimal("0.00")
    )

    # GST: 18% on (brokerage + exchange + sebi)
    gst_base = brokerage + exchange + sebi
    gst = _round_inr(gst_base * fees.gst_percent)

    total = brokerage + exchange + sebi + stamp + stt + gst

    return TransactionCosts(
        brokerage_inr=brokerage,
        exchange_charges_inr=exchange,
        sebi_charges_inr=sebi,
        stt_inr=stt,
        stamp_duty_inr=stamp,
        gst_inr=gst,
        total_charges_inr=total,
    )
