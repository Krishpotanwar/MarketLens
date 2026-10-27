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
  predictedProbabilityUp: number; // 0.0 - 1.0
  expectedMovePercent: number;
  brierCalibration: number;
  signalStrength: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  causalFeatures: {
    momentum: number; // % contribution
    volumeSurge: number;
    vwapDeviation: number;
    sectorBreadth: number;
  };
  priceHistory: number[]; // 24-30 points
}

export function calculateIndianCharges(
  side: OrderSide,
  product: ProductType,
  price: number,
  quantity: number
): StatutoryCharges {
  const turnover = price * quantity;
  // Brokerage: ₹0 for Delivery, flat ₹20 or 0.03% for Intraday (whichever lower)
  const brokerage = product === "CNC" ? 0 : Math.min(20, turnover * 0.0003);

  // STT: 0.1% on Delivery (both buy and sell), 0.025% on Intraday Sell only
  let stt = 0;
  if (product === "CNC") {
    stt = turnover * 0.001;
  } else if (side === "SELL") {
    stt = turnover * 0.00025;
  }

  // NSE Exchange transaction charges: 0.00345%
  const exchangeCharges = turnover * 0.0000345;

  // SEBI turnover charges: ₹10 per crore = 0.0001%
  const sebiCharges = turnover * 0.000001;

  // Stamp duty: 0.015% on BUY orders only
  const stampDuty = side === "BUY" ? turnover * 0.00015 : 0;

  // GST: 18% on (Brokerage + Exchange Charges + SEBI charges)
  const gst = (brokerage + exchangeCharges + sebiCharges) * 0.18;

  // Slippage: 0.05% realistic cash-market fill friction
  const slippage = turnover * 0.0005;

  const totalCharges = brokerage + stt + exchangeCharges + sebiCharges + stampDuty + gst + slippage;
  const netEffectiveAmount = side === "BUY" ? turnover + totalCharges : turnover - totalCharges;

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
