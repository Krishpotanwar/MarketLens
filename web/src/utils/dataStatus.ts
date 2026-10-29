/**
 * How pages describe their prices. A price is live only when the backend says so; anything else
 * is sample data bundled with the app and must be labelled that way, never as "live".
 */
export const OFFLINE_LABEL = "Offline · sample prices, not live";
/** From first paint until the feed answers: no live price yet, but not a claim that the feed is down. */
export const CONNECTING_LABEL = "Connecting to market feed…";

export interface FeedQuote {
  ltp?: number | null;
  status?: string;
  provider?: string;
}

/** A quote is usable only when it carries a real price. */
export const isUsableQuote = (q: FeedQuote | null | undefined): boolean =>
  !!q && typeof q.ltp === "number" && q.ltp > 0 && q.status !== "unavailable";

/** "₹1,234.50", or an em dash when there is no price (never an invented one). */
export const priceText = (n: number | null | undefined, digits = 2): string =>
  typeof n === "number" && Number.isFinite(n)
    ? `₹${n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
    : "—";

/** Index level for headers and strips: "—" offline or unknown, never a bundled sample value. */
export function indexText(
  stocks: Array<{ symbol: string; ltp: number; changePercent: number }>,
  symbol: string,
  offline: boolean
): string {
  const s = stocks.find((x) => x.symbol === symbol);
  if (offline || !s) return "—";
  const level = s.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${level} (${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(2)}%)`;
}

/** Chip text for a feed, derived from the quotes the backend just returned. */
export function feedLabel(quotes: FeedQuote[]): string {
  const usable = quotes.filter(isUsableQuote);
  if (usable.length === 0) return OFFLINE_LABEL;
  const provider = usable[0].provider ?? "Yahoo Finance (unofficial)";
  return usable.some((q) => q.status === "live") ? `Live · ${provider}` : `Stale · last good prices · ${provider}`;
}

/** True whenever there is no live price to show: offline, or not answered yet. */
export const isOffline = (label: string): boolean => label === OFFLINE_LABEL || label === CONNECTING_LABEL;
