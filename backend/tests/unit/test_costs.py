from decimal import Decimal
import unittest

from bazaar_drishti.research.costs import FeeSchedule, calculate_transaction_costs


class TransactionCostsTests(unittest.TestCase):
    def setUp(self) -> None:
        self.fees = FeeSchedule(
            brokerage_percent=Decimal("0.0003"),  # 0.03% capped at 20
            brokerage_flat_cap=Decimal("20.00"),
            exchange_turnover_percent=Decimal("0.0000297"),  # 0.00297%
            sebi_turnover_percent=Decimal("0.000001"),  # 0.0001%
            stt_sell_percent=Decimal("0.00025"),  # 0.025% on sell
            stamp_duty_buy_percent=Decimal("0.00003"),  # 0.003% on buy
            gst_percent=Decimal("0.18"),  # 18% on (brokerage + exchange + sebi)
        )

    def test_buy_side_cost_calculation(self) -> None:
        notional = Decimal("100000.00")
        costs = calculate_transaction_costs(
            notional=notional, is_buy=True, fees=self.fees
        )

        # Brokerage: 0.03% of 100k = 30 -> capped at 20.00
        self.assertEqual(costs.brokerage_inr, Decimal("20.00"))
        # Exchange: 2.97
        self.assertEqual(costs.exchange_charges_inr, Decimal("2.97"))
        # SEBI: 0.10
        self.assertEqual(costs.sebi_charges_inr, Decimal("0.10"))
        # Stamp duty: 3.00 on buy
        self.assertEqual(costs.stamp_duty_inr, Decimal("3.00"))
        # STT: 0 on buy
        self.assertEqual(costs.stt_inr, Decimal("0.00"))
        # GST: 18% of (20.00 + 2.97 + 0.10 = 23.07) = 4.15
        self.assertEqual(costs.gst_inr, Decimal("4.15"))
        # Total
        expected_total = (
            costs.brokerage_inr
            + costs.exchange_charges_inr
            + costs.sebi_charges_inr
            + costs.stamp_duty_inr
            + costs.stt_inr
            + costs.gst_inr
        )
        self.assertEqual(costs.total_charges_inr, expected_total)

    def test_sell_side_cost_calculation(self) -> None:
        notional = Decimal("100000.00")
        costs = calculate_transaction_costs(
            notional=notional, is_buy=False, fees=self.fees
        )

        # STT applies on sell: 0.025% of 100k = 25.00
        self.assertEqual(costs.stt_inr, Decimal("25.00"))
        # Stamp duty: 0 on sell
        self.assertEqual(costs.stamp_duty_inr, Decimal("0.00"))
        expected_total = (
            costs.brokerage_inr
            + costs.exchange_charges_inr
            + costs.sebi_charges_inr
            + costs.stamp_duty_inr
            + costs.stt_inr
            + costs.gst_inr
        )
        self.assertEqual(costs.total_charges_inr, expected_total)

    def test_round_trip_reconciles_cleanly(self) -> None:
        buy_notional = Decimal("50000.00")
        sell_notional = Decimal("51000.00")
        buy_costs = calculate_transaction_costs(
            buy_notional, is_buy=True, fees=self.fees
        )
        sell_costs = calculate_transaction_costs(
            sell_notional, is_buy=False, fees=self.fees
        )

        total_fees = buy_costs + sell_costs
        self.assertEqual(
            total_fees.total_charges_inr,
            buy_costs.total_charges_inr + sell_costs.total_charges_inr,
        )


if __name__ == "__main__":
    unittest.main()
