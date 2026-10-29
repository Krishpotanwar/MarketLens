import json
import unittest
from decimal import Decimal
from pathlib import Path

from bazaar_drishti.research.costs import FeeSchedule, calculate_transaction_costs

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "backend" / "data" / "fee_schedule.json"
WEB_MIRROR = ROOT / "web" / "src" / "data" / "feeSchedule.json"


class FeeScheduleTests(unittest.TestCase):
    def test_web_copy_is_identical_to_the_backend_source(self) -> None:
        # The browser bundle cannot read backend/data, so web keeps a mirror. Drift fails CI.
        self.assertEqual(
            json.loads(SOURCE.read_text()), json.loads(WEB_MIRROR.read_text())
        )

    def test_engine_defaults_come_from_the_source_file(self) -> None:
        rates = json.loads(SOURCE.read_text(), parse_float=Decimal)
        fees = FeeSchedule()
        self.assertEqual(fees.exchange_turnover_percent, rates["exchange_txn"])
        self.assertEqual(fees.sebi_turnover_percent, rates["sebi_turnover"])
        self.assertEqual(fees.gst_percent, rates["gst"])
        self.assertEqual(fees.brokerage_percent, rates["brokerage"]["MIS"]["percent"])
        self.assertEqual(fees.brokerage_flat_cap, rates["brokerage"]["MIS"]["cap"])
        self.assertEqual(fees.stt_sell_percent, rates["stt"]["MIS"]["sell"])
        self.assertEqual(fees.stamp_duty_buy_percent, rates["stamp_duty_buy"]["MIS"])

    def test_one_lakh_intraday_round_trip_costs_82_44(self) -> None:
        # The figure quoted in the README and the presentation; the web app must match it.
        fees, lakh = FeeSchedule(), Decimal("100000")
        round_trip = calculate_transaction_costs(
            lakh, is_buy=True, fees=fees
        ) + calculate_transaction_costs(lakh, is_buy=False, fees=fees)
        self.assertEqual(round_trip.total_charges_inr, Decimal("82.44"))


if __name__ == "__main__":
    unittest.main()
