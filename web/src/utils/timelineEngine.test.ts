import { describe, it, expect } from "vitest";
import rates from "../data/feeSchedule.json";
import {
  generateTimelineScenarios,
  calculateStatutoryFriction,
  calculateStatutoryFrictionPercent,
} from "./timelineEngine";

describe("timelineEngine", () => {
  describe("generateTimelineScenarios - Bullish Setup", () => {
    const bullishInput = {
      symbol: "RELIANCE",
      ltp: 2950,
      sma20: 2920,
      sma50: 2860,
      rsi: 62,
      vwap: 2930,
      sentimentScore: 0.6,
      newsHeadline: "Reliance Jio Posts 12% Net Profit Surge on Tariff Revisions",
    };

    it("generates exactly 4 scenarios: BULL, BASE, BEAR, BLACK_SWAN", () => {
      const result = generateTimelineScenarios(bullishInput);
      expect(result.timelines).toHaveLength(4);
      const ids = result.timelines.map((t) => t.id);
      expect(ids).toEqual(["BULL", "BASE", "BEAR", "BLACK_SWAN"]);
    });

    it("ensures scenario probabilities strictly sum to 100% within 0.01 tolerance", () => {
      const result = generateTimelineScenarios(bullishInput);
      const totalProb = result.timelines.reduce(
        (sum, t) => sum + t.probabilityPercent,
        0
      );
      expect(Math.abs(totalProb - 100)).toBeLessThanOrEqual(0.01);
    });

    it("elevates BULL probability above BEAR under bullish technicals & sentiment", () => {
      const result = generateTimelineScenarios(bullishInput);
      const bull = result.timelines.find((t) => t.id === "BULL")!;
      const bear = result.timelines.find((t) => t.id === "BEAR")!;
      expect(bull.probabilityPercent).toBeGreaterThan(bear.probabilityPercent);
      expect(bull.probabilityPercent).toBeGreaterThanOrEqual(30);
    });

    it("orients BULL target above LTP and stop loss below LTP", () => {
      const result = generateTimelineScenarios(bullishInput);
      const bull = result.timelines.find((t) => t.id === "BULL")!;
      expect(bull.targetPrice).toBeGreaterThan(bullishInput.ltp);
      expect(bull.stopLossPrice).toBeLessThan(bullishInput.ltp);
      expect(bull.stopLossPrice).toBeGreaterThan(0);
    });

    it("orients BEAR target below LTP and stop loss above LTP (short/reversal bias)", () => {
      const result = generateTimelineScenarios(bullishInput);
      const bear = result.timelines.find((t) => t.id === "BEAR")!;
      expect(bear.targetPrice).toBeLessThan(bullishInput.ltp);
      expect(bear.stopLossPrice).toBeGreaterThan(bullishInput.ltp);
    });

    it("populates corporate strategy deconstruction with non-empty guidance, margins, moat, and tail risks", () => {
      const result = generateTimelineScenarios(bullishInput);
      const { strategyDeconstruction } = result;

      expect(strategyDeconstruction).toBeDefined();
      expect(strategyDeconstruction.managementGuidance.length).toBeGreaterThan(0);
      expect(strategyDeconstruction.marginOutlook.trim().length).toBeGreaterThan(0);
      expect(strategyDeconstruction.competitiveMoat.trim().length).toBeGreaterThan(0);
      expect(strategyDeconstruction.tailRisks.length).toBeGreaterThan(0);
      expect(strategyDeconstruction.keyCatalysts.length).toBeGreaterThan(0);
    });

    it("includes valid invalidation condition referencing structural levels", () => {
      const result = generateTimelineScenarios(bullishInput);
      for (const timeline of result.timelines) {
        expect(timeline.invalidationCondition.trim().length).toBeGreaterThan(5);
      }
      const bull = result.timelines.find((t) => t.id === "BULL")!;
      expect(
        bull.invalidationCondition.toLowerCase().includes("vwap") ||
        bull.invalidationCondition.toLowerCase().includes("sma") ||
        bull.invalidationCondition.toLowerCase().includes("support")
      ).toBe(true);
    });

    it("attaches realistic statutory friction percent to all scenarios", () => {
      const result = generateTimelineScenarios(bullishInput);
      for (const timeline of result.timelines) {
        expect(timeline.estimatedFrictionPercent).toBeGreaterThan(0.05);
        expect(timeline.estimatedFrictionPercent).toBeLessThan(1.0);
      }
    });
  });

  describe("generateTimelineScenarios - Bearish & Neutral Setups", () => {
    it("elevates BEAR probability above BULL under bearish technicals & negative sentiment", () => {
      const bearishInput = {
        symbol: "HDFCBANK",
        ltp: 1650,
        sma20: 1670,
        sma50: 1710,
        rsi: 38,
        vwap: 1665,
        sentimentScore: -0.65,
        newsHeadline: "RBI Draft Guidelines Propose Higher Runoff Factors",
      };

      const result = generateTimelineScenarios(bearishInput);
      const bull = result.timelines.find((t) => t.id === "BULL")!;
      const bear = result.timelines.find((t) => t.id === "BEAR")!;

      expect(bear.probabilityPercent).toBeGreaterThan(bull.probabilityPercent);
      const totalProb = result.timelines.reduce(
        (sum, t) => sum + t.probabilityPercent,
        0
      );
      expect(Math.abs(totalProb - 100)).toBeLessThanOrEqual(0.01);
    });

    it("maintains BASE as predominant scenario when market is balanced/neutral", () => {
      const neutralInput = {
        symbol: "TCS",
        ltp: 4100,
        sma20: 4102,
        sma50: 4098,
        rsi: 50,
        vwap: 4100,
        sentimentScore: 0.0,
      };

      const result = generateTimelineScenarios(neutralInput);
      const base = result.timelines.find((t) => t.id === "BASE")!;
      const bull = result.timelines.find((t) => t.id === "BULL")!;
      const bear = result.timelines.find((t) => t.id === "BEAR")!;

      expect(base.probabilityPercent).toBeGreaterThanOrEqual(bull.probabilityPercent);
      expect(base.probabilityPercent).toBeGreaterThanOrEqual(bear.probabilityPercent);
      const totalProb = result.timelines.reduce(
        (sum, t) => sum + t.probabilityPercent,
        0
      );
      expect(Math.abs(totalProb - 100)).toBeLessThanOrEqual(0.01);
    });

    it("handles unknown symbol cleanly with heuristic corporate deconstruction", () => {
      const customInput = {
        symbol: "CUSTOMTECH",
        ltp: 750,
        sma20: 740,
        sma50: 720,
        rsi: 55,
        vwap: 745,
      };

      const result = generateTimelineScenarios(customInput);
      expect(result.symbol).toBe("CUSTOMTECH");
      expect(result.currentPrice).toBe(750);
      expect(result.strategyDeconstruction.competitiveMoat.length).toBeGreaterThan(0);
      expect(result.strategyDeconstruction.managementGuidance.length).toBeGreaterThan(0);
      const totalProb = result.timelines.reduce(
        (sum, t) => sum + t.probabilityPercent,
        0
      );
      expect(Math.abs(totalProb - 100)).toBeLessThanOrEqual(0.01);
    });
  });

  describe("calculateStatutoryFriction", () => {
    it("prices one delivery buy leg from the shared schedule (brokerage ₹0, STT 0.1%, GST 18%, Stamp duty 0.015%)", () => {
      const turnover = 50000;
      const charges = calculateStatutoryFriction(turnover);

      // Brokerage: ₹0 on delivery, the same as the paper terminal charges
      expect(charges.brokerage).toBe(0);

      // STT: 0.1% of turnover = 50 INR
      expect(charges.stt).toBeCloseTo(50, 2);

      // Stamp duty: 0.015% = 7.5 INR
      expect(charges.stampDuty).toBeCloseTo(7.5, 2);

      // Exchange + SEBI turnover charge, from the shared schedule (each rounded to the paisa)
      expect(charges.exchangeAndSebi).toBeCloseTo(turnover * (rates.exchange_txn + rates.sebi_turnover), 1);

      // GST: 18% of (Brokerage + Exchange & SEBI)
      const expectedGst = (charges.brokerage + charges.exchangeAndSebi) * 0.18;
      expect(charges.gst).toBeCloseTo(expectedGst, 1);

      // Total charges must be sum of all components
      const expectedTotal =
        charges.brokerage +
        charges.stt +
        charges.stampDuty +
        charges.exchangeAndSebi +
        charges.gst;
      expect(charges.totalCharges).toBeCloseTo(expectedTotal, 2);

      // Friction percent must be (total / turnover) * 100
      const frictionPercent = calculateStatutoryFrictionPercent(turnover);
      expect(frictionPercent).toBeCloseTo((charges.totalCharges / turnover) * 100, 3);
      expect(frictionPercent).toBeGreaterThan(0.1);
      expect(frictionPercent).toBeLessThan(0.3);
    });
  });
});
