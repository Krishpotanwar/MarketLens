"""Deterministic intraday strategy backtesting engine and trade ledger."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from zoneinfo import ZoneInfo

from bazaar_drishti.data.normalizer import INTERVAL, SESSION_CLOSE, NormalizedBar
from bazaar_drishti.research.costs import FeeSchedule, calculate_transaction_costs
from bazaar_drishti.schemas import TradeRow

IST = ZoneInfo("Asia/Kolkata")
PAISE = Decimal("0.01")


def _round_inr(amount: Decimal) -> Decimal:
    return amount.quantize(PAISE, rounding=ROUND_HALF_UP)


@dataclass(frozen=True, slots=True)
class SimulationConfig:
    """Strategy backtest simulation parameters."""

    starting_capital_inr: Decimal = Decimal("100000.00")
    fast_window: int = 20
    slow_window: int = 50
    slippage_bps: Decimal = Decimal("5.0")  # 5 basis points sensitivity case


@dataclass(frozen=True, slots=True)
class EquityPoint:
    timestamp_utc: datetime
    timestamp_ist: datetime
    equity_inr: Decimal
    drawdown_percent: Decimal


@dataclass(frozen=True, slots=True)
class BacktestResult:
    """Complete simulation results with itemized ledger and metrics."""

    run_id: str
    starting_capital_inr: Decimal
    ending_capital_inr: Decimal
    gross_pnl_inr: Decimal
    total_charges_inr: Decimal
    slippage_inr: Decimal
    net_pnl_inr: Decimal
    return_percent: Decimal
    max_drawdown_percent: Decimal
    trades: list[TradeRow]
    equity_curve: list[EquityPoint]


def simulate_sma_strategy(
    bars: list[NormalizedBar],
    config: SimulationConfig,
    fees: FeeSchedule,
    *,
    run_id: str = "run-001",
) -> BacktestResult:
    """Simulate 20/50 SMA crossover with next-bar open fills and intraday forced flatten."""
    if not bars:
        return BacktestResult(
            run_id=run_id,
            starting_capital_inr=config.starting_capital_inr,
            ending_capital_inr=config.starting_capital_inr,
            gross_pnl_inr=Decimal("0.00"),
            total_charges_inr=Decimal("0.00"),
            slippage_inr=Decimal("0.00"),
            net_pnl_inr=Decimal("0.00"),
            return_percent=Decimal("0.00"),
            max_drawdown_percent=Decimal("0.00"),
            trades=[],
            equity_curve=[],
        )

    # Group by session
    sessions: dict[date, list[NormalizedBar]] = {}
    for bar in bars:
        sessions.setdefault(bar.session_date_ist, []).append(bar)

    trades: list[TradeRow] = []
    trade_counter = 1
    slippage_multiplier = config.slippage_bps / Decimal("10000.0")

    current_capital = config.starting_capital_inr
    equity_curve: list[EquityPoint] = []
    peak_equity = current_capital

    for session_date, session_bars in sessions.items():
        n = len(session_bars)
        if session_bars[-1].bar_end_ist.time() != SESSION_CLOSE:
            raise ValueError(
                f"Session {session_date} is incomplete; final five-minute bar must end at {SESSION_CLOSE}"
            )
        if n < 2:
            continue

        # Compute rolling SMAs
        closes = [b.close for b in session_bars]
        fast_sma: list[Decimal | None] = []
        slow_sma: list[Decimal | None] = []

        for i in range(n):
            if i + 1 >= config.fast_window:
                w_fast = closes[i + 1 - config.fast_window : i + 1]
                fast_sma.append(sum(w_fast) / Decimal(config.fast_window))
            else:
                fast_sma.append(None)

            if i + 1 >= config.slow_window:
                w_slow = closes[i + 1 - config.slow_window : i + 1]
                slow_sma.append(sum(w_slow) / Decimal(config.slow_window))
            else:
                slow_sma.append(None)

        in_position = False
        entry_bar: NormalizedBar | None = None
        entry_price: Decimal | None = None
        quantity = 0
        entry_charges = Decimal("0.00")
        entry_slippage = Decimal("0.00")

        # Iterate bars
        for i in range(n):
            current_bar = session_bars[i]
            is_session_end = current_bar.bar_end_ist.time() == SESSION_CLOSE
            has_immediate_previous = (
                i > 0
                and current_bar.bar_start_utc
                == session_bars[i - 1].bar_start_utc + INTERVAL
            )

            if in_position:
                assert entry_bar is not None and entry_price is not None
                exit_signal = False

                if is_session_end:
                    exit_signal = True
                elif has_immediate_previous:
                    prev_f = fast_sma[i - 1]
                    prev_s = slow_sma[i - 1]
                    if prev_f is not None and prev_s is not None and prev_f < prev_s:
                        exit_signal = True

                if exit_signal:
                    exit_price = current_bar.open
                    buy_notional = Decimal(quantity) * entry_price
                    sell_notional = Decimal(quantity) * exit_price

                    gross_pnl = _round_inr(sell_notional - buy_notional)
                    buy_costs = calculate_transaction_costs(
                        buy_notional, is_buy=True, fees=fees
                    )
                    sell_costs = calculate_transaction_costs(
                        sell_notional, is_buy=False, fees=fees
                    )

                    brokerage = buy_costs.brokerage_inr + sell_costs.brokerage_inr
                    exchange = (
                        buy_costs.exchange_charges_inr + sell_costs.exchange_charges_inr
                    )
                    sebi = buy_costs.sebi_charges_inr + sell_costs.sebi_charges_inr
                    stt = buy_costs.stt_inr + sell_costs.stt_inr
                    stamp = buy_costs.stamp_duty_inr + sell_costs.stamp_duty_inr
                    gst = buy_costs.gst_inr + sell_costs.gst_inr
                    itemized_charges = brokerage + exchange + sebi + stt + stamp + gst

                    buy_slippage = _round_inr(buy_notional * slippage_multiplier)
                    sell_slippage = _round_inr(sell_notional * slippage_multiplier)
                    total_slippage = buy_slippage + sell_slippage

                    net_pnl = _round_inr(gross_pnl - itemized_charges - total_slippage)

                    trades.append(
                        TradeRow(
                            run_id=run_id,
                            trade_id=f"trade-{trade_counter:04d}",
                            session_date_ist=session_date,
                            entry_time_utc=entry_bar.bar_start_utc,
                            entry_time_ist=entry_bar.bar_start_ist,
                            exit_time_utc=current_bar.bar_start_utc,
                            exit_time_ist=current_bar.bar_start_ist,
                            entry_price_inr=entry_price,
                            exit_price_inr=exit_price,
                            quantity=quantity,
                            gross_pnl_inr=gross_pnl,
                            brokerage_inr=brokerage,
                            exchange_charges_inr=exchange,
                            sebi_charges_inr=sebi,
                            stt_inr=stt,
                            stamp_duty_inr=stamp,
                            gst_inr=gst,
                            slippage_inr=total_slippage,
                            net_pnl_inr=net_pnl,
                        )
                    )
                    trade_counter += 1
                    current_capital += net_pnl
                    if current_capital > peak_equity:
                        peak_equity = current_capital

                    in_position = False
                    entry_bar = None
                    entry_price = None
                    quantity = 0
                    entry_charges = Decimal("0.00")
                    entry_slippage = Decimal("0.00")

            else:
                # Not in position: check for buy signal on previous bar
                if not is_session_end and has_immediate_previous:
                    prev_fast = fast_sma[i - 1]
                    prev_slow = slow_sma[i - 1]
                    prev_prev_fast = fast_sma[i - 2] if i > 1 else None
                    prev_prev_slow = slow_sma[i - 2] if i > 1 else None

                    if (
                        prev_fast is not None
                        and prev_slow is not None
                        and prev_prev_fast is not None
                        and prev_prev_slow is not None
                    ):
                        # Golden cross
                        if prev_prev_fast <= prev_prev_slow and prev_fast > prev_slow:
                            entry_price = current_bar.open
                            quantity = int(current_capital // entry_price)
                            if quantity > 0:
                                in_position = True
                                entry_bar = current_bar
                                entry_notional = Decimal(quantity) * entry_price
                                entry_charges = calculate_transaction_costs(
                                    entry_notional, is_buy=True, fees=fees
                                ).total_charges_inr
                                entry_slippage = _round_inr(
                                    entry_notional * slippage_multiplier
                                )

            equity = current_capital
            if in_position:
                assert entry_price is not None
                equity += Decimal(quantity) * (current_bar.close - entry_price)
                equity -= entry_charges + entry_slippage
            if equity > peak_equity:
                peak_equity = equity
            drawdown = (
                _round_inr((peak_equity - equity) / peak_equity * Decimal("100.0"))
                if peak_equity > 0
                else Decimal("0.00")
            )
            equity_curve.append(
                EquityPoint(
                    timestamp_utc=current_bar.bar_end_utc,
                    timestamp_ist=current_bar.bar_end_ist,
                    equity_inr=_round_inr(equity),
                    drawdown_percent=drawdown,
                )
            )

    # Recompute metrics from ledger
    total_gross = sum((t.gross_pnl_inr for t in trades), Decimal("0.00"))
    total_charges = sum(
        (
            t.brokerage_inr
            + t.exchange_charges_inr
            + t.sebi_charges_inr
            + t.stt_inr
            + t.stamp_duty_inr
            + t.gst_inr
            for t in trades
        ),
        Decimal("0.00"),
    )
    total_slippage = sum((t.slippage_inr for t in trades), Decimal("0.00"))
    total_net = sum((t.net_pnl_inr for t in trades), Decimal("0.00"))

    return_pct = (
        _round_inr(total_net / config.starting_capital_inr * Decimal("100.0"))
        if config.starting_capital_inr > 0
        else Decimal("0.00")
    )

    max_dd = Decimal("0.00")
    running_peak = config.starting_capital_inr
    for pt in equity_curve:
        if pt.equity_inr > running_peak:
            running_peak = pt.equity_inr
        dd = (
            (running_peak - pt.equity_inr) / running_peak * Decimal("100.0")
            if running_peak > 0
            else Decimal("0.00")
        )
        if dd > max_dd:
            max_dd = dd

    return BacktestResult(
        run_id=run_id,
        starting_capital_inr=config.starting_capital_inr,
        ending_capital_inr=_round_inr(current_capital),
        gross_pnl_inr=_round_inr(total_gross),
        total_charges_inr=_round_inr(total_charges),
        slippage_inr=_round_inr(total_slippage),
        net_pnl_inr=_round_inr(total_net),
        return_percent=return_pct,
        max_drawdown_percent=_round_inr(max_dd),
        trades=trades,
        equity_curve=equity_curve,
    )
