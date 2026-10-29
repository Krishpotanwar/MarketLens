/**
 * Indicators computed from the price bars the chart actually drew.
 * Null means "not enough data": show "—", never a default such as RSI 50.
 */

export type Trend = "BULLISH" | "BEARISH" | "NEUTRAL";

/** Simple moving average of the last `n` closes. */
export function sma(closes: number[], n: number): number | null {
  if (closes.length < n) return null;
  return closes.slice(-n).reduce((a, b) => a + b, 0) / n;
}

/** Wilder's RSI(14). Needs 14 price changes, so 15 closes. */
export function rsi14(closes: number[]): number | null {
  const n = 14;
  if (closes.length < n + 1) return null;
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  let gain = 0;
  let loss = 0;
  for (const x of changes.slice(0, n)) {
    if (x > 0) gain += x;
    else loss -= x;
  }
  gain /= n;
  loss /= n;
  for (const x of changes.slice(n)) {
    gain = (gain * (n - 1) + Math.max(x, 0)) / n;
    loss = (loss * (n - 1) + Math.max(-x, 0)) / n;
  }
  return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
}

/** One trend label for the chart on screen: last close against the 20 SMA, and the 50 SMA once there are 50 bars. */
export function chartTrend(closes: number[]): Trend | null {
  const s20 = sma(closes, 20);
  if (s20 === null) return null;
  const last = closes[closes.length - 1];
  const s50 = sma(closes, 50);
  if (s50 === null) return last > s20 ? "BULLISH" : last < s20 ? "BEARISH" : "NEUTRAL";
  return last > s20 && s20 > s50 ? "BULLISH" : last < s20 && s20 < s50 ? "BEARISH" : "NEUTRAL";
}

export interface Bar {
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Volume-weighted average of the typical price (high + low + close) / 3 over the last `n` bars. */
export function vwap(bars: Bar[], n: number): number | null {
  if (bars.length < n) return null;
  const tail = bars.slice(-n);
  const volume = tail.reduce((a, b) => a + b.volume, 0);
  if (!(volume > 0)) return null;
  return tail.reduce((a, b) => a + ((b.high + b.low + b.close) / 3) * b.volume, 0) / volume;
}

/** Annualised volatility: sample standard deviation of daily log returns times sqrt(252). Needs 21 closes. */
export function annualVolatility(closes: number[]): number | null {
  if (closes.length < 21 || closes.some((c) => !(c > 0))) return null;
  const returns = closes.slice(1).map((c, i) => Math.log(c / closes[i]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}
