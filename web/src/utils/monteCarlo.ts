/**
 * Monte Carlo Jump-Diffusion Simulation Engine
 *
 * Implements Geometric Brownian Motion with Merton-style jump-diffusion for
 * equity price trajectory modeling, confidence ribbon generation,
 * and parametric/historical Value at Risk (VaR 95% & 99%) quantification.
 */

import type {
  MonteCarloPercentileRibbon,
  MonteCarloSimulationResult,
} from "../types/aiSimulation";

export interface MonteCarloSimulationOptions {
  symbol?: string;
  currentPrice: number;
  simulatedDays?: number;
  days?: number;
  totalPaths?: number;
  paths?: number;
  annualDrift?: number; // Annualized expected return mu (e.g. 0.12 for 12%)
  annualVolatility?: number; // Annualized volatility sigma (e.g. 0.20 for 20%)
  jumpIntensity?: number; // Expected jumps per year lambda (e.g. 0.05)
  jumpMean?: number; // Mean jump magnitude mu_j (e.g. -0.01)
  jumpStdDev?: number; // Standard deviation of jump magnitude sigma_j (e.g. 0.04)
  tradingDaysPerYear?: number; // Standard Indian market trading days (default: 252)
  randomFn?: () => number; // Optional PRNG for deterministic testing
}

/**
 * Box-Muller transform to generate standard normal variates Z ~ N(0, 1)
 */
export function generateStandardNormal(randomFn: () => number = Math.random): number {
  let u1 = 0;
  let u2 = 0;
  // Guard against 0 to prevent log(0) = -Infinity
  while (u1 <= 1e-15) {
    u1 = randomFn();
  }
  while (u2 <= 1e-15) {
    u2 = randomFn();
  }
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Calculates quantile values with linear interpolation on sorted arrays
 */
export function calculatePercentile(
  sortedValues: number[] | Float64Array,
  percentile: number
): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  if (n === 1) return sortedValues[0];

  const clampedP = Math.max(0, Math.min(1, percentile));
  const index = (n - 1) * clampedP;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  const fraction = index - lowerIndex;
  return (
    sortedValues[lowerIndex] * (1 - fraction) +
    sortedValues[upperIndex] * fraction
  );
}

/**
 * Runs a Monte Carlo Jump-Diffusion simulation generating percentile ribbons and risk metrics.
 *
 * Discretization formula:
 *   ΔS_t = S_t * (mu * Δt + sigma * sqrt(Δt) * Z_t + Jump_t)
 */
export function runMonteCarloSimulation(
  priceOrOptions: number | MonteCarloSimulationOptions,
  maybeOptions?: Partial<MonteCarloSimulationOptions>
): MonteCarloSimulationResult {
  const options: MonteCarloSimulationOptions =
    typeof priceOrOptions === "number"
      ? { currentPrice: priceOrOptions, ...maybeOptions }
      : priceOrOptions;

  const symbol = options.symbol || "EQUITY";
  const currentPrice = options.currentPrice;
  const days = Math.max(0, Math.round(options.simulatedDays ?? options.days ?? 30));
  const paths = Math.max(1, Math.round(options.totalPaths ?? options.paths ?? 1000));
  const annualDrift = options.annualDrift ?? 0.12;
  const annualVolatility = options.annualVolatility ?? 0.2;
  // If volatility is zero and jump intensity not explicitly passed, disable jumps for deterministic drift
  const jumpIntensity =
    options.annualVolatility === 0 && options.jumpIntensity === undefined
      ? 0
      : (options.jumpIntensity ?? 0.05);
  const jumpMean = options.jumpMean ?? -0.01;
  const jumpStdDev = options.jumpStdDev ?? 0.04;
  const tradingDaysPerYear =
    options.tradingDaysPerYear && options.tradingDaysPerYear > 0
      ? options.tradingDaysPerYear
      : 252;
  const randomFn = options.randomFn ?? Math.random;

  // Zero-division and non-positive price guards
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
    const emptyRibbons: MonteCarloPercentileRibbon[] = Array.from(
      { length: days + 1 },
      (_, i) => ({
        day: i,
        p5: 0,
        p10: 0,
        p50: 0,
        p90: 0,
        p95: 0,
      })
    );
    return {
      symbol,
      currentPrice: Math.max(0, currentPrice || 0),
      simulatedDays: days,
      totalPaths: paths,
      ribbons: emptyRibbons,
      valueAtRisk95Percent: 0,
      valueAtRisk99Percent: 0,
      medianTerminalPrice: 0,
      probabilityProfit: 0,
    };
  }

  const dt = 1 / tradingDaysPerYear;
  const sqrtDt = Math.sqrt(dt);
  const jumpProbability =
    jumpIntensity > 0
      ? Math.min(1, Math.max(0, 1 - Math.exp(-jumpIntensity * dt)))
      : 0;

  // Track price paths across steps
  const pathPrices = new Float64Array(paths);
  for (let i = 0; i < paths; i++) {
    pathPrices[i] = currentPrice;
  }

  const ribbons: MonteCarloPercentileRibbon[] = [];

  // Day 0 ribbon
  ribbons.push({
    day: 0,
    p5: currentPrice,
    p10: currentPrice,
    p50: currentPrice,
    p90: currentPrice,
    p95: currentPrice,
  });

  // Evolve paths step-by-step
  for (let d = 1; d <= days; d++) {
    for (let p = 0; p < paths; p++) {
      const s = pathPrices[p];

      let jump = 0;
      if (jumpProbability > 0 && randomFn() < jumpProbability) {
        const jumpZ = generateStandardNormal(randomFn);
        jump = jumpMean + jumpStdDev * jumpZ;
      }

      const diffusionZ =
        annualVolatility > 0 ? generateStandardNormal(randomFn) : 0;
      const deltaS =
        s * (annualDrift * dt + annualVolatility * sqrtDt * diffusionZ + jump);
      let nextS = s + deltaS;

      // Ensure price stays strictly positive and finite
      if (!Number.isFinite(nextS) || nextS < 0.01) {
        nextS = 0.01;
      }
      pathPrices[p] = nextS;
    }

    // Sort prices to compute quantile ribbons
    const sorted = Array.from(pathPrices).sort((a, b) => a - b);
    const p5Raw = calculatePercentile(sorted, 0.05);
    const p10Raw = Math.max(p5Raw, calculatePercentile(sorted, 0.1));
    const p50Raw = Math.max(p10Raw, calculatePercentile(sorted, 0.5));
    const p90Raw = Math.max(p50Raw, calculatePercentile(sorted, 0.9));
    const p95Raw = Math.max(p90Raw, calculatePercentile(sorted, 0.95));

    const p5 = Number(p5Raw.toFixed(2));
    const p10 = Math.max(p5, Number(p10Raw.toFixed(2)));
    const p50 = Math.max(p10, Number(p50Raw.toFixed(2)));
    const p90 = Math.max(p50, Number(p90Raw.toFixed(2)));
    const p95 = Math.max(p90, Number(p95Raw.toFixed(2)));

    ribbons.push({
      day: d,
      p5,
      p10,
      p50,
      p90,
      p95,
    });
  }

  // Calculate terminal metrics
  const terminalSortedPrices = Array.from(pathPrices).sort((a, b) => a - b);
  const terminalReturns = terminalSortedPrices.map(
    (price) => (price - currentPrice) / currentPrice
  );

  const q05Return = calculatePercentile(terminalReturns, 0.05);
  const q01Return = calculatePercentile(terminalReturns, 0.01);

  // Value at Risk is defined as the positive loss percentage at the confidence level
  const rawVar95 = Math.max(0, -q05Return * 100);
  const rawVar99 = Math.max(rawVar95, -q01Return * 100);

  const valueAtRisk95Percent = Number(rawVar95.toFixed(2));
  const valueAtRisk99Percent = Math.max(
    valueAtRisk95Percent,
    Number(rawVar99.toFixed(2))
  );

  const medianTerminalPrice = ribbons[ribbons.length - 1].p50;

  let profitCount = 0;
  for (let i = 0; i < paths; i++) {
    if (pathPrices[i] > currentPrice) {
      profitCount++;
    }
  }
  const probabilityProfit = Number((profitCount / paths).toFixed(4));

  return {
    symbol,
    currentPrice,
    simulatedDays: days,
    totalPaths: paths,
    ribbons,
    valueAtRisk95Percent,
    valueAtRisk99Percent,
    medianTerminalPrice,
    probabilityProfit,
  };
}
