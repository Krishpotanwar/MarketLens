import { describe, expect, it } from "vitest";
import {
  calculatePercentile,
  generateStandardNormal,
  runMonteCarloSimulation,
} from "./monteCarlo";

describe("Monte Carlo Jump-Diffusion Simulation Engine", () => {
  describe("runMonteCarloSimulation with default parameters", () => {
    it("generates 1,000 paths over 30 days without NaNs or negative numbers", () => {
      const result = runMonteCarloSimulation({
        symbol: "RELIANCE",
        currentPrice: 1000,
        simulatedDays: 30,
        totalPaths: 1000,
      });

      expect(result.symbol).toBe("RELIANCE");
      expect(result.currentPrice).toBe(1000);
      expect(result.simulatedDays).toBe(30);
      expect(result.totalPaths).toBe(1000);

      // Ribbons array has 31 items (day 0 through 30)
      expect(result.ribbons).toHaveLength(31);

      // Day 0 must anchor to currentPrice across all percentiles
      const dayZero = result.ribbons[0];
      expect(dayZero.day).toBe(0);
      expect(dayZero.p5).toBe(1000);
      expect(dayZero.p10).toBe(1000);
      expect(dayZero.p50).toBe(1000);
      expect(dayZero.p90).toBe(1000);
      expect(dayZero.p95).toBe(1000);

      // Verify every day step maintains valid positive numbers and percentile ordering
      result.ribbons.forEach((ribbon, index) => {
        expect(ribbon.day).toBe(index);

        expect(Number.isFinite(ribbon.p5)).toBe(true);
        expect(Number.isFinite(ribbon.p10)).toBe(true);
        expect(Number.isFinite(ribbon.p50)).toBe(true);
        expect(Number.isFinite(ribbon.p90)).toBe(true);
        expect(Number.isFinite(ribbon.p95)).toBe(true);

        expect(ribbon.p5).toBeGreaterThan(0);
        expect(ribbon.p10).toBeGreaterThan(0);
        expect(ribbon.p50).toBeGreaterThan(0);
        expect(ribbon.p90).toBeGreaterThan(0);
        expect(ribbon.p95).toBeGreaterThan(0);

        // Percentile ordering holds for every day: p5 <= p10 <= p50 <= p90 <= p95
        expect(ribbon.p5).toBeLessThanOrEqual(ribbon.p10);
        expect(ribbon.p10).toBeLessThanOrEqual(ribbon.p50);
        expect(ribbon.p50).toBeLessThanOrEqual(ribbon.p90);
        expect(ribbon.p90).toBeLessThanOrEqual(ribbon.p95);
      });

      // Asserts Value at Risk (VaR 95% and 99%) calculated and positive
      expect(Number.isFinite(result.valueAtRisk95Percent)).toBe(true);
      expect(Number.isNaN(result.valueAtRisk95Percent)).toBe(false);
      expect(result.valueAtRisk95Percent).toBeGreaterThan(0);

      expect(Number.isFinite(result.valueAtRisk99Percent)).toBe(true);
      expect(Number.isNaN(result.valueAtRisk99Percent)).toBe(false);
      expect(result.valueAtRisk99Percent).toBeGreaterThan(0);

      expect(result.valueAtRisk99Percent).toBeGreaterThanOrEqual(result.valueAtRisk95Percent);

      // Asserts probability of profit in [0, 1]
      expect(Number.isFinite(result.probabilityProfit)).toBe(true);
      expect(result.probabilityProfit).toBeGreaterThanOrEqual(0);
      expect(result.probabilityProfit).toBeLessThanOrEqual(1);

      // Median terminal price is positive and finite
      expect(Number.isFinite(result.medianTerminalPrice)).toBe(true);
      expect(result.medianTerminalPrice).toBeGreaterThan(0);
      expect(result.medianTerminalPrice).toBe(result.ribbons[30].p50);
    });

    it("supports shorthand invocation with currentPrice number only", () => {
      const result = runMonteCarloSimulation(1000);

      expect(result.currentPrice).toBe(1000);
      expect(result.simulatedDays).toBe(30);
      expect(result.totalPaths).toBe(1000);
      expect(result.ribbons).toHaveLength(31);
      expect(result.probabilityProfit).toBeGreaterThanOrEqual(0);
      expect(result.probabilityProfit).toBeLessThanOrEqual(1);
    });
  });

  describe("Linear interpolation quantile calculations", () => {
    it("interpolates percentiles accurately on sorted arrays", () => {
      const sample = [10, 20, 30, 40, 50];

      expect(calculatePercentile(sample, 0.0)).toBe(10);
      expect(calculatePercentile(sample, 0.5)).toBe(30);
      expect(calculatePercentile(sample, 1.0)).toBe(50);
      expect(calculatePercentile(sample, 0.25)).toBe(20);
      expect(calculatePercentile(sample, 0.75)).toBe(40);
    });

    it("handles edge cases: single element or empty arrays", () => {
      expect(calculatePercentile([42], 0.5)).toBe(42);
      expect(calculatePercentile([], 0.5)).toBe(0);
    });
  });

  describe("Gaussian random variate generator (Box-Muller)", () => {
    it("generates finite standard normal variates with mean ~0 and std dev ~1", () => {
      const N = 5000;
      let sum = 0;
      let sumSq = 0;

      for (let i = 0; i < N; i++) {
        const z = generateStandardNormal();
        expect(Number.isFinite(z)).toBe(true);
        expect(Number.isNaN(z)).toBe(false);
        sum += z;
        sumSq += z * z;
      }

      const mean = sum / N;
      const variance = sumSq / N - mean * mean;

      // Statistical bounds for N = 5000 standard normals
      expect(mean).toBeGreaterThan(-0.15);
      expect(mean).toBeLessThan(0.15);
      expect(variance).toBeGreaterThan(0.85);
      expect(variance).toBeLessThan(1.15);
    });
  });

  describe("Edge cases & numerical guards", () => {
    it("handles zero volatility (deterministic drift)", () => {
      const S0 = 1000;
      const days = 30;
      const drift = 0.12; // 12% annualized return
      const tradingDays = 252;
      const dt = 1 / tradingDays;

      const result = runMonteCarloSimulation({
        currentPrice: S0,
        simulatedDays: days,
        totalPaths: 500,
        annualVolatility: 0,
        annualDrift: drift,
        jumpIntensity: 0,
      });

      expect(result.ribbons).toHaveLength(days + 1);

      // In deterministic drift, all percentiles on each day must be identical
      result.ribbons.forEach((ribbon, day) => {
        const expectedPrice = S0 * Math.pow(1 + drift * dt, day);
        expect(ribbon.p5).toBeCloseTo(expectedPrice, 1);
        expect(ribbon.p10).toBeCloseTo(expectedPrice, 1);
        expect(ribbon.p50).toBeCloseTo(expectedPrice, 1);
        expect(ribbon.p90).toBeCloseTo(expectedPrice, 1);
        expect(ribbon.p95).toBeCloseTo(expectedPrice, 1);
      });

      // VaR with positive deterministic drift should be 0 (no loss possible)
      expect(result.valueAtRisk95Percent).toBe(0);
      expect(result.valueAtRisk99Percent).toBe(0);
      expect(result.probabilityProfit).toBe(1);
    });

    it("guards against zero or negative currentPrice without throwing or NaNs", () => {
      const zeroResult = runMonteCarloSimulation({
        currentPrice: 0,
        simulatedDays: 10,
        totalPaths: 100,
      });

      expect(zeroResult.currentPrice).toBe(0);
      expect(zeroResult.ribbons).toHaveLength(11);
      zeroResult.ribbons.forEach((r) => {
        expect(r.p5).toBe(0);
        expect(r.p95).toBe(0);
      });
      expect(zeroResult.valueAtRisk95Percent).toBe(0);
      expect(zeroResult.probabilityProfit).toBe(0);

      const negativeResult = runMonteCarloSimulation({
        currentPrice: -500,
        simulatedDays: 5,
        totalPaths: 100,
      });
      expect(negativeResult.valueAtRisk95Percent).toBe(0);
      expect(Number.isNaN(negativeResult.valueAtRisk95Percent)).toBe(false);
    });

    it("is reproducible when injected with a pseudo-random generator", () => {
      // Linear congruential generator (LCG) for deterministic tests
      const createLcg = (seed = 123456789) => {
        let s = seed;
        return () => {
          s = (s * 1664525 + 1013904223) % 4294967296;
          return s / 4294967296;
        };
      };

      const result1 = runMonteCarloSimulation({
        currentPrice: 1500,
        simulatedDays: 15,
        totalPaths: 200,
        randomFn: createLcg(42),
      });

      const result2 = runMonteCarloSimulation({
        currentPrice: 1500,
        simulatedDays: 15,
        totalPaths: 200,
        randomFn: createLcg(42),
      });

      expect(result1.ribbons).toEqual(result2.ribbons);
      expect(result1.valueAtRisk95Percent).toBe(result2.valueAtRisk95Percent);
      expect(result1.probabilityProfit).toBe(result2.probabilityProfit);
      expect(result1.medianTerminalPrice).toBe(result2.medianTerminalPrice);
    });
  });
});
