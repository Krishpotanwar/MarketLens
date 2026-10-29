import { describe, expect, it } from "vitest";
import { annualVolatility, chartTrend, rsi14, sma, vwap } from "./indicators";

// Classic Wilder sample closes; the reference RSI values come from an independent implementation.
const closes = [
  44.3389, 44.0902, 44.1497, 43.6124, 44.3278, 44.8264, 45.0955, 45.4245, 45.8433, 46.0826, 45.8931, 46.0328,
  45.614, 46.282, 46.282, 46.0028, 46.0328, 46.4116, 46.2222, 45.6439,
];
const run = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));

describe("indicators", () => {
  it("rsi14 matches the Wilder reference: 70.53 at the 15th close, 57.97 at the 20th", () => {
    expect(rsi14(closes.slice(0, 15))).toBeCloseTo(70.53, 2);
    expect(rsi14(closes)).toBeCloseTo(57.97, 2);
  });

  it("rsi14 is null until it has 14 price changes, 100 when nothing fell and 0 when nothing rose", () => {
    expect(rsi14(closes.slice(0, 14))).toBeNull();
    expect(rsi14(run(20, (i) => i + 1))).toBe(100);
    expect(rsi14(run(20, (i) => 20 - i))).toBe(0);
  });

  it("sma averages the last n closes and is null when there are fewer", () => {
    expect(sma([1, 2, 3, 4], 2)).toBe(3.5);
    expect(sma([1, 2, 3], 4)).toBeNull();
  });

  it("chartTrend reads the last close against the 20 and 50 SMAs, and says nothing on short data", () => {
    expect(chartTrend(run(60, (i) => 100 + i))).toBe("BULLISH");
    expect(chartTrend(run(60, (i) => 160 - i))).toBe("BEARISH");
    expect(chartTrend(run(60, () => 100))).toBe("NEUTRAL");
    expect(chartTrend(run(19, () => 100))).toBeNull();
  });

  it("vwap weights each bar's typical price (high+low+close)/3 by its volume, over the last n bars", () => {
    const bars = [
      { high: 12, low: 8, close: 10, volume: 100 }, // typical price 10
      { high: 24, low: 16, close: 20, volume: 300 }, // typical price 20
    ];
    expect(vwap(bars, 2)).toBeCloseTo((10 * 100 + 20 * 300) / 400, 6);
    expect(vwap(bars, 1)).toBeCloseTo(20, 6);
  });

  it("vwap is null without enough bars or without any volume", () => {
    expect(vwap([], 20)).toBeNull();
    expect(vwap([{ high: 1, low: 1, close: 1, volume: 1 }], 2)).toBeNull();
    expect(vwap([{ high: 1, low: 1, close: 1, volume: 0 }], 1)).toBeNull();
  });

  it("annualVolatility is the sample stdev of log returns times sqrt(252), and 0 for a flat series", () => {
    expect(annualVolatility(run(30, () => 100))).toBe(0);
    let price = 100;
    const wobble = [price, ...run(40, (i) => (price *= Math.exp(i % 2 === 0 ? 0.01 : -0.01)))];
    expect(annualVolatility(wobble)).toBeCloseTo(0.16077, 4);
  });

  it("annualVolatility is null on short or non-positive data", () => {
    expect(annualVolatility(run(20, () => 100))).toBeNull();
    expect(annualVolatility(run(30, (i) => (i === 5 ? 0 : 100)))).toBeNull();
  });
});
