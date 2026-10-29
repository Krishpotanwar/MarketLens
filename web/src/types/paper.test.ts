import { describe, expect, it } from "vitest";
import rates from "../data/feeSchedule.json";
import { calculateIndianCharges } from "./paper";

const paise = (n: number) => Math.round(n * 100) / 100;
const statutory = (c: ReturnType<typeof calculateIndianCharges>) => paise(c.totalCharges - c.slippage);

describe("calculateIndianCharges", () => {
  it("matches the backend: a ₹1,00,000 intraday round trip costs ₹82.44 in statutory charges", () => {
    const buy = calculateIndianCharges("BUY", "MIS", 1000, 100);
    const sell = calculateIndianCharges("SELL", "MIS", 1000, 100);
    expect(paise(statutory(buy) + statutory(sell))).toBe(82.44);
    expect(paise(buy.slippage + sell.slippage)).toBe(100); // 5 bps per leg, kept apart from statutory
  });

  it("applies the delivery stamp rate to CNC only", () => {
    expect(calculateIndianCharges("BUY", "CNC", 1000, 100).stampDuty).toBe(15);
    expect(calculateIndianCharges("BUY", "MIS", 1000, 100).stampDuty).toBe(3);
    expect(calculateIndianCharges("SELL", "MIS", 1000, 100).stampDuty).toBe(0);
  });

  it("takes the exchange rate from the shared schedule file", () => {
    const { exchangeCharges } = calculateIndianCharges("BUY", "MIS", 1000, 100);
    expect(exchangeCharges).toBe(paise(100000 * rates.exchange_txn));
  });
});
