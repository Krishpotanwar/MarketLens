import rates from "../data/feeSchedule.json";

export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type ProductType = "CNC" | "MIS"; // CNC: Cash Delivery, MIS: Intraday

export interface StatutoryCharges {
  turnover: number;
  brokerage: number;
  stt: number;
  exchangeCharges: number;
  sebiCharges: number;
  stampDuty: number;
  gst: number;
  slippage: number;
  totalCharges: number;
  netEffectiveAmount: number;
}

export interface PaperPosition {
  id: string;
  symbol: string;
  side: OrderSide;
  product: ProductType;
  quantity: number;
  avgEntryPrice: number;
  currentLtp: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  entryTimestamp: string;
  totalEntryCharges: number;
}

export interface PaperTradeRecord {
  id: string;
  symbol: string;
  side: OrderSide;
  product: ProductType;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryTimestamp: string;
  exitTimestamp: string;
  grossPnl: number;
  totalCharges: number;
  netPnl: number;
  netReturnPercent: number;
  note?: string;
}

export interface StockTrendInfo {
  symbol: string;
  name: string;
  sector: string;
  aliases?: string;
  marketCapCategory?: "Large Cap" | "Mid Cap" | "Small Cap" | "Index";
  week52High?: number;
  week52Low?: number;
  ltp: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  vwap: number;
  volume: number;
  volumeRatio: number; // vs 20-period avg
  rsi14: number;
  sma20: number;
  sma50: number;
  trend5m: "BULLISH" | "BEARISH" | "NEUTRAL";
  trend15m: "BULLISH" | "BEARISH" | "NEUTRAL";
  trend1h: "BULLISH" | "BEARISH" | "NEUTRAL";
  trend1d: "BULLISH" | "BEARISH" | "NEUTRAL";
  priceHistory: number[]; // 24-30 points
}

/** "0.00297%"-style label, so UI copy can never disagree with the schedule it prices from. */
export const ratePct = (rate: number) => `${Number((rate * 100).toFixed(5))}%`;
export const FEE_RATES = rates;

const paise = (n: number) => Math.round(n * 100) / 100;

/**
 * Prices one order leg from the shared schedule (src/data/feeSchedule.json, mirrored from
 * backend/data/fee_schedule.json). Each component rounds to the paisa, as the backend ledger does,
 * so web and backend reconcile to the same rupee figure.
 */
export function calculateIndianCharges(
  side: OrderSide,
  product: ProductType,
  price: number,
  quantity: number
): StatutoryCharges {
  const turnover = price * quantity;
  const isBuy = side === "BUY";
  const brokerage = paise(Math.min(rates.brokerage[product].cap, turnover * rates.brokerage[product].percent));
  const stt = paise(turnover * rates.stt[product][isBuy ? "buy" : "sell"]);
  const exchangeCharges = paise(turnover * rates.exchange_txn);
  const sebiCharges = paise(turnover * rates.sebi_turnover);
  const stampDuty = isBuy ? paise(turnover * rates.stamp_duty_buy[product]) : 0;
  const gst = paise((brokerage + exchangeCharges + sebiCharges) * rates.gst);
  const slippage = paise((turnover * rates.slippage_bps) / 10000);

  const totalCharges = paise(brokerage + stt + exchangeCharges + sebiCharges + stampDuty + gst + slippage);
  const netEffectiveAmount = isBuy ? turnover + totalCharges : turnover - totalCharges;

  return {
    turnover,
    brokerage,
    stt,
    exchangeCharges,
    sebiCharges,
    stampDuty,
    gst,
    slippage,
    totalCharges,
    netEffectiveAmount,
  };
}
