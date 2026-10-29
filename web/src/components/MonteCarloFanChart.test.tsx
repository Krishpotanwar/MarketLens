import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { MonteCarloSimulationResult } from "../types/aiSimulation";
import { MonteCarloFanChart } from "./MonteCarloFanChart";

// valueAtRisk*Percent are percentage losses (10 means a 10% loss), exactly as runMonteCarloSimulation returns them.
const result: MonteCarloSimulationResult = {
  symbol: "TEST",
  currentPrice: 1000,
  simulatedDays: 2,
  totalPaths: 500,
  ribbons: [
    { day: 1, p5: 960, p10: 970, p50: 1000, p90: 1030, p95: 1040 },
    { day: 2, p5: 900, p10: 940, p50: 1000, p90: 1060, p95: 1100 },
  ],
  valueAtRisk95Percent: 10,
  valueAtRisk99Percent: 15,
  medianTerminalPrice: 1000,
  probabilityProfit: 0.5,
};

describe("MonteCarloFanChart value-at-risk cards", () => {
  const html = renderToStaticMarkup(<MonteCarloFanChart result={result} />);

  it("shows the price floor and the percentage loss, not a percentage printed as rupees", () => {
    expect(html).toContain("₹900.00"); // 1000 x (1 - 10%)
    expect(html).toContain("-10.00% tail loss floor");
    expect(html).toContain("₹850.00"); // 1000 x (1 - 15%)
    expect(html).toContain("-15.00% extreme shock");
  });

  it("never reports a near-total loss for a 10% value-at-risk", () => {
    expect(html).not.toMatch(/-9\d\.\d\d%/);
  });

  it("states the same limits in the screen-reader summary", () => {
    expect(html).toContain("95% VaR loss limit 10.00% (price floor ₹900.00)");
    expect(html).toContain("99% VaR tail limit 15.00% (price floor ₹850.00)");
  });
});

describe("MonteCarloFanChart assumptions", () => {
  it("never calls its drift and volatility calibrated; it shows the page's own note, or says they are assumptions", () => {
    const note = "drift +14%/yr assumed · volatility 38% measured from 1Y closes";
    const withNote = renderToStaticMarkup(<MonteCarloFanChart result={result} assumptions={note} />);
    expect(withNote).toContain(note);
    expect(withNote).not.toMatch(/calibrated/i);
    const without = renderToStaticMarkup(<MonteCarloFanChart result={result} />);
    expect(without).toContain("drift and volatility are assumptions");
    expect(without).not.toMatch(/calibrated/i);
  });
});
