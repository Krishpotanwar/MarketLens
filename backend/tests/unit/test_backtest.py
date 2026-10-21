from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
import unittest
from zoneinfo import ZoneInfo

from bazaar_drishti.data.normalizer import NormalizedBar
from bazaar_drishti.research.backtest import (
    BacktestResult,
    SimulationConfig,
    simulate_sma_strategy,
)
from bazaar_drishti.research.baselines import (
    BaselineResult,
    simulate_buy_and_hold_baseline,
    simulate_cash_baseline,
)
from bazaar_drishti.research.costs import FeeSchedule

IST = ZoneInfo("Asia/Kolkata")


class SMABacktestTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fees = FeeSchedule()
        self.config = SimulationConfig(
            starting_capital_inr=Decimal("100000.00"),
            fast_window=2,  # fast test windows
            slow_window=4,
            slippage_bps=Decimal("5.0"),
        )

    def _generate_synthetic_session(
        self, session_date: date, prices: list[Decimal]
    ) -> list[NormalizedBar]:
        bars: list[NormalizedBar] = []
        cur_ist = datetime(
            session_date.year, session_date.month, session_date.day, 9, 15, tzinfo=IST
        )
        for i, price in enumerate(prices):
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
                    high=price + Decimal("1.0"),
                    low=price - Decimal("1.0"),
                    close=price,
                    volume=1000,
                )
            )
            cur_ist = bar_end_ist
        return bars

    def _complete_session(self, prices: list[Decimal]) -> list[NormalizedBar]:
        completed_prices = prices + [prices[-1]] * (75 - len(prices))
        return self._generate_synthetic_session(date(2030, 1, 7), completed_prices)

    def test_sma_execution_and_reconciliation(self) -> None:
        # Prices that cause SMA fast crossover above slow, then flatten before session end
        # Fast=2, slow=4
        prices = [
            Decimal("100"),
            Decimal("100"),
            Decimal("100"),
            Decimal("100"),  # bar 3: fast=100, slow=100
            Decimal(
                "110"
            ),  # bar 4: fast=105, slow=102.5 -> BUY signal at close of bar 4!
            Decimal("112"),  # bar 5: fills at OPEN of bar 5 (price 112)
            Decimal("115"),  # bar 6: holding
            Decimal("105"),  # bar 7: fast drops -> SELL signal or session close exit
            Decimal("100"),  # bar 8: exit fill
        ]
        bars = self._complete_session(prices)
        result = simulate_sma_strategy(bars, self.config, self.fees)

        self.assertIsInstance(result, BacktestResult)
        # Check trades
        if result.trades:
            for trade in result.trades:
                # Assert mathematical reconciliation:
                # gross - itemized charges - slippage = net
                itemized = (
                    trade.brokerage_inr
                    + trade.exchange_charges_inr
                    + trade.sebi_charges_inr
                    + trade.stt_inr
                    + trade.stamp_duty_inr
                    + trade.gst_inr
                )
                self.assertEqual(
                    trade.net_pnl_inr,
                    trade.gross_pnl_inr - itemized - trade.slippage_inr,
                )

        # Baseline comparisons
        cash_res = simulate_cash_baseline(bars, self.config.starting_capital_inr)
        self.assertEqual(cash_res.net_pnl_inr, Decimal("0.00"))

        bh_res = simulate_buy_and_hold_baseline(bars, self.config, self.fees)
        self.assertIsInstance(bh_res, BaselineResult)

    def test_next_bar_fill_and_never_carry_overnight(self) -> None:
        # Enter on the next bar, then hold until the final 15:25 bar.
        prices = [Decimal("100")] * 4 + [Decimal("110"), Decimal("112")]
        prices.extend([Decimal("112")] * (75 - len(prices)))
        bars = self._generate_synthetic_session(date(2030, 1, 7), prices)
        result = simulate_sma_strategy(bars, self.config, self.fees)

        self.assertEqual(len(result.trades), 1)
        self.assertEqual(result.trades[0].entry_time_ist.time(), time(9, 40))
        self.assertEqual(result.trades[0].exit_time_ist.time(), time(15, 25))
        for trade in result.trades:
            self.assertEqual(trade.entry_time_ist.date(), trade.exit_time_ist.date())

    def test_missing_immediate_next_bar_does_not_fill_signal(self) -> None:
        prices = [Decimal("100")] * 4 + [Decimal("110"), Decimal("112")]
        prices.extend([Decimal("112")] * (75 - len(prices)))
        bars = self._generate_synthetic_session(date(2030, 1, 7), prices)
        bars.pop(5)  # Missing 09:40 bar after the 09:35 signal.

        result = simulate_sma_strategy(bars, self.config, self.fees)
        self.assertEqual(result.trades, [])

    def test_incomplete_session_is_rejected(self) -> None:
        bars = self._complete_session([Decimal("100")] * 75)
        bars.pop()
        with self.assertRaisesRegex(ValueError, "Session .* is incomplete"):
            simulate_sma_strategy(bars, self.config, self.fees)

    def test_equity_curve_marks_open_position_to_market(self) -> None:
        prices = [
            Decimal("100"),
            Decimal("100"),
            Decimal("100"),
            Decimal("100"),
            Decimal("110"),
            Decimal("112"),
            Decimal("90"),
        ]
        prices.extend([Decimal("90")] * (75 - len(prices)))
        bars = self._generate_synthetic_session(date(2030, 1, 7), prices)

        result = simulate_sma_strategy(bars, self.config, self.fees)
        open_loss_point = next(
            point
            for point in result.equity_curve
            if point.timestamp_ist.time() == time(9, 50)
        )
        self.assertLess(open_loss_point.equity_inr, self.config.starting_capital_inr)
        self.assertGreater(open_loss_point.drawdown_percent, Decimal("0.00"))

    def test_buy_and_hold_carries_capital_between_sessions(self) -> None:
        no_fees = FeeSchedule(
            brokerage_percent=Decimal("0"),
            brokerage_flat_cap=Decimal("0"),
            exchange_turnover_percent=Decimal("0"),
            sebi_turnover_percent=Decimal("0"),
            stt_sell_percent=Decimal("0"),
            stamp_duty_buy_percent=Decimal("0"),
            gst_percent=Decimal("0"),
        )
        config = SimulationConfig(
            starting_capital_inr=Decimal("100000.00"),
            slippage_bps=Decimal("0"),
        )
        session_prices = [Decimal("100")] * 74 + [Decimal("110")]
        bars = self._generate_synthetic_session(date(2030, 1, 7), session_prices)
        bars.extend(self._generate_synthetic_session(date(2030, 1, 8), session_prices))

        result = simulate_buy_and_hold_baseline(bars, config, no_fees)
        self.assertEqual(result.net_pnl_inr, Decimal("21000.00"))
        self.assertEqual(result.ending_capital_inr, Decimal("121000.00"))


if __name__ == "__main__":
    unittest.main()
