"""Benchmark baselines for research comparison."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from bazaar_drishti.data.normalizer import NormalizedBar
from bazaar_drishti.research.costs import FeeSchedule, calculate_transaction_costs

PAISE = Decimal("0.01")


def _round_inr(amount: Decimal) -> Decimal:
    return amount.quantize(PAISE, rounding=ROUND_HALF_UP)


@dataclass(frozen=True, slots=True)
class BaselineResult:
    """Benchmark performance metrics."""

    strategy_name: str
    starting_capital_inr: Decimal
    gross_pnl_inr: Decimal
    total_charges_inr: Decimal
    slippage_inr: Decimal
    net_pnl_inr: Decimal
    ending_capital_inr: Decimal


def simulate_cash_baseline(
    bars: list[NormalizedBar], starting_capital_inr: Decimal
) -> BaselineResult:
    """Cash baseline: 0 trades, capital preserved."""
    return BaselineResult(
        strategy_name="cash",
        starting_capital_inr=starting_capital_inr,
        gross_pnl_inr=Decimal("0.00"),
        total_charges_inr=Decimal("0.00"),
        slippage_inr=Decimal("0.00"),
        net_pnl_inr=Decimal("0.00"),
        ending_capital_inr=starting_capital_inr,
    )


def simulate_buy_and_hold_baseline(
    bars: list[NormalizedBar], config: Any, fees: FeeSchedule
) -> BaselineResult:
    """Same-session buy-and-hold baseline: enters open, flattens close for each session."""
    if not bars:
        return simulate_cash_baseline([], config.starting_capital_inr)

    # Group bars by session
    sessions: dict[date, list[NormalizedBar]] = {}
    for bar in bars:
        sessions.setdefault(bar.session_date_ist, []).append(bar)

    total_gross = Decimal("0.00")
    total_charges = Decimal("0.00")
    total_slippage = Decimal("0.00")
    total_net = Decimal("0.00")
    current_capital = config.starting_capital_inr

    slippage_bps = getattr(config, "slippage_bps", Decimal("0.0"))
    slippage_multiplier = slippage_bps / Decimal("10000.0")

    for session_bars in sessions.values():
        if len(session_bars) < 2:
            continue
        first_bar = session_bars[0]
        last_bar = session_bars[-1]

        entry_price = first_bar.open
        exit_price = last_bar.close

        quantity = int(current_capital // entry_price)
        if quantity <= 0:
            continue

        buy_notional = Decimal(quantity) * entry_price
        sell_notional = Decimal(quantity) * exit_price

        gross = _round_inr(sell_notional - buy_notional)
        buy_costs = calculate_transaction_costs(buy_notional, is_buy=True, fees=fees)
        sell_costs = calculate_transaction_costs(sell_notional, is_buy=False, fees=fees)
        session_charges = buy_costs.total_charges_inr + sell_costs.total_charges_inr

        buy_slippage = _round_inr(buy_notional * slippage_multiplier)
        sell_slippage = _round_inr(sell_notional * slippage_multiplier)
        session_slippage = buy_slippage + sell_slippage

        total_gross += gross
        total_charges += session_charges
        total_slippage += session_slippage
        session_net = _round_inr(gross - session_charges - session_slippage)
        total_net += session_net
        current_capital += session_net

    net = _round_inr(total_net)

    return BaselineResult(
        strategy_name="buy_and_hold",
        starting_capital_inr=config.starting_capital_inr,
        gross_pnl_inr=_round_inr(total_gross),
        total_charges_inr=_round_inr(total_charges),
        slippage_inr=_round_inr(total_slippage),
        net_pnl_inr=net,
        ending_capital_inr=_round_inr(current_capital),
    )
