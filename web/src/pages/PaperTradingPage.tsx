import { useCallback, useEffect, useState } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import {
  calculateIndianCharges,
  type OrderSide,
  type OrderType,
  type PaperPosition,
  type PaperTradeRecord,
  type ProductType,
  type StockTrendInfo,
} from "../types/paper";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface PaperTradingPageProps {
  initialSymbol?: string;
}

const STORAGE_KEY_POSITIONS = "marketlens_paper_positions";
const STORAGE_KEY_TRADES = "marketlens_paper_trades";
const STORAGE_KEY_CASH = "marketlens_paper_cash";
const INITIAL_CASH = 1000000; // 10 Lakhs INR

export function PaperTradingPage({ initialSymbol = "RELIANCE" }: PaperTradingPageProps) {
  const isCurated = INITIAL_INDIAN_STOCKS.some((s) => s.symbol === initialSymbol);
  const initialStock = INITIAL_INDIAN_STOCKS.find((s) => s.symbol === initialSymbol);

  const [stocks, setStocks] = useState<StockTrendInfo[]>(() => {
    if (initialSymbol && !isCurated) {
      return [
        {
          symbol: initialSymbol,
          name: `${initialSymbol} Listed Equity`,
          sector: "Indian Equities",
          marketCapCategory: "Mid Cap",
          week52High: 1000,
          week52Low: 500,
          ltp: 500,
          change: 0,
          changePercent: 0,
          open: 500,
          high: 510,
          low: 490,
          vwap: 500,
          volume: 1000000,
          volumeRatio: 1.0,
          rsi14: 50,
          sma20: 500,
          sma50: 500,
          trend5m: "NEUTRAL",
          trend15m: "NEUTRAL",
          trend1h: "NEUTRAL",
          trend1d: "NEUTRAL",
          predictedProbabilityUp: 0.5,
          expectedMovePercent: 1.0,
          brierCalibration: 0.18,
          signalStrength: "NEUTRAL",
          causalFeatures: {
            momentum: 25,
            volumeSurge: 25,
            vwapDeviation: 25,
            sectorBreadth: 25,
          },
          priceHistory: [500],
        },
        ...INITIAL_INDIAN_STOCKS,
      ];
    }
    return INITIAL_INDIAN_STOCKS;
  });
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<OrderSide>("BUY");
  const [product, setProduct] = useState<ProductType>("CNC");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(() => (initialStock ? initialStock.ltp : 500));
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(() => !isCurated && !!initialSymbol);
  const [liveProvider, setLiveProvider] = useState<string>("NSE Live Telemetry");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  useEffect(() => {
    if (initialSymbol) {
      setSymbol(initialSymbol);
      const curated = INITIAL_INDIAN_STOCKS.find((s) => s.symbol === initialSymbol);
      if (curated) {
        setLimitPrice(curated.ltp);
        setIsQuoteLoading(false);
      } else {
        setIsQuoteLoading(true);
      }

      setStocks((prev) => {
        if (!prev.some((s) => s.symbol === initialSymbol)) {
          return [
            {
              symbol: initialSymbol,
              name: `${initialSymbol} Listed Equity`,
              sector: "Indian Equities",
              marketCapCategory: "Mid Cap",
              week52High: 1000,
              week52Low: 500,
              ltp: 500,
              change: 0,
              changePercent: 0,
              open: 500,
              high: 510,
              low: 490,
              vwap: 500,
              volume: 1000000,
              volumeRatio: 1.0,
              rsi14: 50,
              sma20: 500,
              sma50: 500,
              trend5m: "NEUTRAL",
              trend15m: "NEUTRAL",
              trend1h: "NEUTRAL",
              trend1d: "NEUTRAL",
              predictedProbabilityUp: 0.5,
              expectedMovePercent: 1.0,
              brierCalibration: 0.18,
              signalStrength: "NEUTRAL",
              causalFeatures: {
                momentum: 25,
                volumeSurge: 25,
                vwapDeviation: 25,
                sectorBreadth: 25,
              },
              priceHistory: [500],
            },
            ...prev,
          ];
        }
        return prev;
      });

      fetch(`${API_BASE}/api/v1/market/quote/${encodeURIComponent(initialSymbol)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((q) => {
          if (q?.ltp) {
            setLimitPrice(q.ltp);
            setStocks((prev) =>
              prev.map((s) =>
                s.symbol === initialSymbol
                  ? {
                      ...s,
                      ltp: q.ltp,
                      name: q.name || s.name,
                      change: q.change || 0,
                      changePercent: q.change_percent || 0,
                    }
                  : s
              )
            );
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsQuoteLoading(false);
        });
    }
  }, [initialSymbol]);

  // Sync live quotes from backend telemetry
  const fetchLiveQuotes = useCallback(async () => {
    setIsLiveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/market/quotes`);
      if (res.ok) {
        const data = await res.json();
        const quotes: Array<{
          symbol: string;
          ltp: number;
          change: number;
          change_percent: number;
          volume: number;
          provider?: string;
        }> = data.quotes || [];

        if (quotes.length > 0) {
          setLiveProvider(quotes[0].provider || "NSE Live Telemetry");
          setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

          setStocks((prev) =>
            prev.map((s) => {
              const match = quotes.find((q) => q.symbol === s.symbol);
              if (match && match.ltp > 0) {
                return {
                  ...s,
                  ltp: match.ltp,
                  change: match.change,
                  changePercent: match.change_percent,
                  volume: match.volume > 0 ? match.volume : s.volume,
                };
              }
              return s;
            })
          );
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveQuotes]);

  // Portfolio State (persisted in localStorage)
  const [cashBalance, setCashBalance] = useState<number>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return INITIAL_CASH;
    const saved = localStorage.getItem(STORAGE_KEY_CASH);
    return saved ? parseFloat(saved) : INITIAL_CASH;
  });

  const [positions, setPositions] = useState<PaperPosition[]>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEY_POSITIONS);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [tradeHistory, setTradeHistory] = useState<PaperTradeRecord[]>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return [];
    const saved = localStorage.getItem(STORAGE_KEY_TRADES);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const [notice, setNotice] = useState<string | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_CASH, cashBalance.toString());
    }
  }, [cashBalance]);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));
    }
  }, [positions]);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_TRADES, JSON.stringify(tradeHistory));
    }
  }, [tradeHistory]);

  const activeStock = stocks.find((s) => s.symbol === symbol) ?? stocks[0];
  const effectivePrice = orderType === "MARKET" ? activeStock.ltp : limitPrice;

  // Real-time calculation of charges for the order form
  const charges = calculateIndianCharges(side, product, effectivePrice, quantity);

  // Total Open Positions Value and Unrealized P&L
  let openPositionsMarketValue = 0;
  let totalUnrealizedPnl = 0;

  const enrichedPositions: PaperPosition[] = positions.map((pos) => {
    const currentStock = stocks.find((s) => s.symbol === pos.symbol);
    const ltp = currentStock ? currentStock.ltp : pos.avgEntryPrice;
    const diff = (ltp - pos.avgEntryPrice) * (pos.side === "BUY" ? 1 : -1);
    const posUnrealized = diff * pos.quantity;
    const posUnrealizedPct = ((ltp - pos.avgEntryPrice) / pos.avgEntryPrice) * 100 * (pos.side === "BUY" ? 1 : -1);

    const posValue = ltp * pos.quantity;
    openPositionsMarketValue += posValue;
    totalUnrealizedPnl += posUnrealized;

    return {
      ...pos,
      currentLtp: ltp,
      unrealizedPnl: posUnrealized,
      unrealizedPnlPercent: posUnrealizedPct,
    };
  });

  const totalPortfolioValue = cashBalance + openPositionsMarketValue;
  const totalRealizedPnl = tradeHistory.reduce((acc, t) => acc + t.netPnl, 0);
  const totalTaxesPaid = tradeHistory.reduce((acc, t) => acc + t.totalCharges, 0);
  const winningTrades = tradeHistory.filter((t) => t.netPnl > 0).length;
  const winRate = tradeHistory.length > 0 ? (winningTrades / tradeHistory.length) * 100 : 0;

  function handleExecuteOrder(e: React.FormEvent) {
    e.preventDefault();
    if (isQuoteLoading) {
      setNotice("Order blocked: Still syncing live price from exchange feed.");
      return;
    }
    if (quantity <= 0) {
      setNotice("Order rejected: Quantity must be at least 1.");
      return;
    }

    if (side === "BUY") {
      if (charges.netEffectiveAmount > cashBalance) {
        setNotice(`Insufficient funds. Required: ₹${charges.netEffectiveAmount.toFixed(2)}, Available: ₹${cashBalance.toFixed(2)}.`);
        return;
      }

      // Deduct cash (turnover + charges)
      setCashBalance((prev) => prev - charges.netEffectiveAmount);

      // Add position
      const newPos: PaperPosition = {
        id: `pos-${Date.now()}`,
        symbol: activeStock.symbol,
        side: "BUY",
        product,
        quantity,
        avgEntryPrice: effectivePrice,
        currentLtp: activeStock.ltp,
        unrealizedPnl: 0,
        unrealizedPnlPercent: 0,
        entryTimestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        totalEntryCharges: charges.totalCharges,
      };

      setPositions((prev) => [newPos, ...prev]);
      setNotice(`Executed BUY of ${quantity} ${activeStock.symbol} @ ₹${effectivePrice.toFixed(2)}. Statutory taxes deducted: ₹${charges.totalCharges.toFixed(2)}.`);
    } else {
      // Selling
      const existingPosIndex = positions.findIndex((p) => p.symbol === activeStock.symbol);
      if (existingPosIndex === -1 && product === "CNC") {
        setNotice(`Order rejected: Cannot sell delivery shares of ${activeStock.symbol} without holding them.`);
        return;
      }

      if (existingPosIndex !== -1) {
        // Exit existing holding
        handleExitPosition(positions[existingPosIndex].id);
      } else {
        // Intraday short sell
        setCashBalance((prev) => prev + (charges.turnover - charges.totalCharges));
        const newPos: PaperPosition = {
          id: `pos-${Date.now()}`,
          symbol: activeStock.symbol,
          side: "SELL",
          product: "MIS",
          quantity,
          avgEntryPrice: effectivePrice,
          currentLtp: activeStock.ltp,
          unrealizedPnl: 0,
          unrealizedPnlPercent: 0,
          entryTimestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          totalEntryCharges: charges.totalCharges,
        };
        setPositions((prev) => [newPos, ...prev]);
        setNotice(`Executed SHORT SELL of ${quantity} ${activeStock.symbol} @ ₹${effectivePrice.toFixed(2)}.`);
      }
    }
  }

  function handleExitPosition(posId: string) {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;

    const currentStock = stocks.find((s) => s.symbol === pos.symbol);
    const exitPrice = currentStock ? currentStock.ltp : pos.avgEntryPrice;
    const exitCharges = calculateIndianCharges(pos.side === "BUY" ? "SELL" : "BUY", pos.product, exitPrice, pos.quantity);

    const grossPnl = (exitPrice - pos.avgEntryPrice) * pos.quantity * (pos.side === "BUY" ? 1 : -1);
    const totalCharges = pos.totalEntryCharges + exitCharges.totalCharges;
    const netPnl = grossPnl - totalCharges;
    const netReturnPercent = (netPnl / (pos.avgEntryPrice * pos.quantity)) * 100;

    // Return capital to cash balance: (turnover - exit charges)
    if (pos.side === "BUY") {
      setCashBalance((prev) => prev + (exitCharges.turnover - exitCharges.totalCharges));
    } else {
      // For short: net settlement
      setCashBalance((prev) => prev + netPnl);
    }

    // Record trade
    const record: PaperTradeRecord = {
      id: `trade-${Date.now()}`,
      symbol: pos.symbol,
      side: pos.side,
      product: pos.product,
      quantity: pos.quantity,
      entryPrice: pos.avgEntryPrice,
      exitPrice,
      entryTimestamp: pos.entryTimestamp,
      exitTimestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      grossPnl,
      totalCharges,
      netPnl,
      netReturnPercent,
    };

    setTradeHistory((prev) => [record, ...prev]);
    setPositions((prev) => prev.filter((p) => p.id !== posId));
    setNotice(`Squared off ${pos.symbol} position. Net Realized P&L: ₹${netPnl.toFixed(2)} (after ₹${totalCharges.toFixed(2)} total statutory costs).`);
  }

  function handleResetAccount() {
    if (window.confirm("Are you sure you want to reset your paper trading account to ₹10,00,000? All active positions and logs will be cleared.")) {
      setCashBalance(INITIAL_CASH);
      setPositions([]);
      setTradeHistory([]);
      localStorage.removeItem(STORAGE_KEY_CASH);
      localStorage.removeItem(STORAGE_KEY_POSITIONS);
      localStorage.removeItem(STORAGE_KEY_TRADES);
      setNotice("Account reset to ₹10,00,000 virtual capital.");
    }
  }

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <div className="page-header-split">
          <div>
            <h1>Indian Stock Paper Trading Terminal</h1>
            <p className="status-copy">
              Real-time virtual order execution for NSE equities with live statutory taxes (STT, GST, SEBI, Stamp Duty, Brokerage) and execution slippage deduction.
            </p>
          </div>
          <div className="live-telemetry-status-card" role="status">
            <span className="live-telemetry-dot" aria-hidden="true" />
            <div className="live-telemetry-info">
              <span className="live-telemetry-provider">{liveProvider}</span>
              {lastSyncTime && <span className="live-telemetry-time">Synced at {lastSyncTime}</span>}
            </div>
            <button
              type="button"
              className="live-sync-btn"
              onClick={fetchLiveQuotes}
              disabled={isLiveLoading}
              aria-label="Refresh live quotes"
            >
              {isLiveLoading ? "Syncing..." : "↻ Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* Portfolio Performance Banner */}
      <section className="portfolio-banner" aria-label="Paper Portfolio Summary">
        <div className="banner-item">
          <span className="banner-label">Total Portfolio Value</span>
          <span className="banner-val highlight-val font-mono">₹{totalPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Available Cash</span>
          <span className="banner-val font-mono">₹{cashBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Open Unrealized P&L</span>
          <span className={`banner-val font-mono ${totalUnrealizedPnl >= 0 ? "text-gain" : "text-loss"}`}>
            {totalUnrealizedPnl >= 0 ? "+" : ""}₹{totalUnrealizedPnl.toFixed(2)}
          </span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Realized Net P&L</span>
          <span className={`banner-val font-mono ${totalRealizedPnl >= 0 ? "text-gain" : "text-loss"}`}>
            {totalRealizedPnl >= 0 ? "+" : ""}₹{totalRealizedPnl.toFixed(2)}
          </span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Win Rate</span>
          <span className="banner-val text-accent font-mono">{winRate.toFixed(1)}% ({tradeHistory.length} trades)</span>
        </div>
        <div className="banner-item">
          <span className="banner-label">Total Statutory Taxes Paid</span>
          <span className="banner-val text-muted font-mono">₹{totalTaxesPaid.toFixed(2)}</span>
        </div>
        <div className="banner-item reset-col">
          <button type="button" className="btn-reset-account" onClick={handleResetAccount}>
            Reset Account (₹10L)
          </button>
        </div>
      </section>

      {notice && (
        <div className="notice-banner" role="alert">
          <span>{notice}</span>
          <button type="button" className="btn-close-notice" onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <div className="terminal-workspace-grid">
        {/* Left Column: Order Ticket */}
        <section className="order-ticket-panel" aria-label="Order Placement Ticket">
          <h2 className="panel-title">Order Placement Ticket</h2>
          <form onSubmit={handleExecuteOrder} className="order-form">
            <div className="form-group">
              <label htmlFor="symbol-select">Symbol (NSE)</label>
              <select
                id="symbol-select"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  const st = stocks.find((s) => s.symbol === e.target.value);
                  if (st) setLimitPrice(st.ltp);
                }}
              >
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} (₹{s.ltp.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="side-toggle-group" role="radiogroup" aria-label="Order Side">
              <button
                type="button"
                className={`btn-side btn-buy ${side === "BUY" ? "active" : ""}`}
                onClick={() => setSide("BUY")}
              >
                BUY / LONG
              </button>
              <button
                type="button"
                className={`btn-side btn-sell ${side === "SELL" ? "active" : ""}`}
                onClick={() => setSide("SELL")}
              >
                SELL / SHORT
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="product-select">Product</label>
                <select
                  id="product-select"
                  value={product}
                  onChange={(e) => setProduct(e.target.value as ProductType)}
                >
                  <option value="CNC">Delivery (CNC)</option>
                  <option value="MIS">Intraday (MIS)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="type-select">Type</label>
                <select
                  id="type-select"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                >
                  <option value="MARKET">Market</option>
                  <option value="LIMIT">Limit</option>
                </select>
              </div>
            </div>

            {orderType === "LIMIT" && (
              <div className="form-group">
                <label htmlFor="limit-price-input">Limit Price (INR)</label>
                <input
                  id="limit-price-input"
                  type="number"
                  step="0.05"
                  className="font-mono"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            <div className="form-group">
              <div className="qty-head">
                <label htmlFor="qty-input">Quantity (Shares)</label>
                <div className="quick-qty-group">
                  <button type="button" onClick={() => setQuantity(10)}>10</button>
                  <button type="button" onClick={() => setQuantity(50)}>50</button>
                  <button type="button" onClick={() => setQuantity(100)}>100</button>
                  <button
                    type="button"
                    onClick={() => {
                      const maxShares = Math.floor(cashBalance / effectivePrice);
                      if (maxShares > 0) setQuantity(maxShares);
                    }}
                  >
                    Max
                  </button>
                </div>
              </div>
              <input
                id="qty-input"
                type="number"
                min="1"
                step="1"
                className="font-mono"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </div>

            {/* Live Statutory Tax Ledger Preview */}
            <div className="tax-slip-block" aria-label="Statutory Tax Breakdown">
              <div className="tax-slip-head">
                <span>Indian Statutory Charges Breakdown</span>
                <span className="tax-regime">SEBI / NSE Schedule</span>
              </div>
              <div className="slip-row">
                <span>Gross Turnover</span>
                <span className="font-mono">₹{charges.turnover.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="slip-row">
                <span>Brokerage</span>
                <span className="font-mono">₹{charges.brokerage.toFixed(2)}</span>
              </div>
              <div className="slip-row">
                <span>STT / CTT ({product === "CNC" ? "0.1%" : "0.025%"})</span>
                <span className="font-mono">₹{charges.stt.toFixed(2)}</span>
              </div>
              <div className="slip-row">
                <span>Exchange Txn Charges (0.00345%)</span>
                <span className="font-mono">₹{charges.exchangeCharges.toFixed(2)}</span>
              </div>
              <div className="slip-row">
                <span>Stamp Duty (0.015% Buy)</span>
                <span className="font-mono">₹{charges.stampDuty.toFixed(2)}</span>
              </div>
              <div className="slip-row">
                <span>SEBI Fee (₹10/Cr)</span>
                <span className="font-mono">₹{charges.sebiCharges.toFixed(2)}</span>
              </div>
              <div className="slip-row">
                <span>GST (18% on fees)</span>
                <span className="font-mono">₹{charges.gst.toFixed(2)}</span>
              </div>
              <div className="slip-row">
                <span>Simulated Slippage (0.05%)</span>
                <span className="font-mono">₹{charges.slippage.toFixed(2)}</span>
              </div>
              <div className="slip-row total-tax-row">
                <span>Total Statutory Deductions</span>
                <span className="text-loss font-mono">₹{charges.totalCharges.toFixed(2)}</span>
              </div>
              <div className="slip-row net-amount-row">
                <span>{side === "BUY" ? "Net Capital Required" : "Net Proceeds Receivable"}</span>
                <span className="highlight-val font-mono">₹{charges.netEffectiveAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-submit-order ${side === "BUY" ? "btn-submit-buy" : "btn-submit-sell"}`}
              disabled={isQuoteLoading}
            >
              {isQuoteLoading
                ? "Syncing Live Price..."
                : `Execute ${side} Order (${quantity} ${symbol})`}
            </button>
          </form>
        </section>

        {/* Right Column: Active Positions & Trade History */}
        <section className="portfolio-tables-panel" aria-label="Positions and Trades">
          {/* Active Positions */}
          <div className="section-block">
            <h2 className="panel-title">Active Open Positions ({enrichedPositions.length})</h2>
            <div className="table-wrapper">
              <table className="data-table" aria-label="Open Positions">
                <thead>
                  <tr>
                    <th scope="col">Symbol</th>
                    <th scope="col">Side</th>
                    <th scope="col" className="table-num">Qty</th>
                    <th scope="col" className="table-num">Entry Price</th>
                    <th scope="col" className="table-num">LTP</th>
                    <th scope="col" className="table-num">Market Value</th>
                    <th scope="col" className="table-num">Unrealized P&L</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedPositions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-table-cell">
                        No active open positions. Execute a paper order to start testing.
                      </td>
                    </tr>
                  ) : (
                    enrichedPositions.map((pos) => {
                      const isGain = pos.unrealizedPnl >= 0;
                      return (
                        <tr key={pos.id}>
                          <th scope="row">
                            <span className="table-symbol">{pos.symbol}</span>
                            <span className="table-sub">{pos.product}</span>
                          </th>
                          <td>
                            <span className={`pill-side ${pos.side === "BUY" ? "pill-buy" : "pill-sell"}`}>
                              {pos.side}
                            </span>
                          </td>
                          <td className="table-num font-mono">{pos.quantity}</td>
                          <td className="table-num font-mono">₹{pos.avgEntryPrice.toFixed(2)}</td>
                          <td className="table-num font-mono">₹{pos.currentLtp.toFixed(2)}</td>
                          <td className="table-num font-mono">₹{(pos.currentLtp * pos.quantity).toFixed(2)}</td>
                          <td className={`table-num font-mono ${isGain ? "text-gain" : "text-loss"}`}>
                            {isGain ? "+" : ""}₹{pos.unrealizedPnl.toFixed(2)} ({isGain ? "+" : ""}{pos.unrealizedPnlPercent.toFixed(2)}%)
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-exit-pos"
                              onClick={() => handleExitPosition(pos.id)}
                            >
                              Square Off
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Closed Trade History Ledger */}
          <div className="section-block">
            <h2 className="panel-title">Trade History & Statutory Audit ({tradeHistory.length})</h2>
            <div className="table-wrapper">
              <table className="data-table" aria-label="Trade History">
                <thead>
                  <tr>
                    <th scope="col">Symbol</th>
                    <th scope="col">Side</th>
                    <th scope="col" className="table-num">Qty</th>
                    <th scope="col">Entry & Exit</th>
                    <th scope="col" className="table-num">Gross P&L</th>
                    <th scope="col" className="table-num">Taxes & Charges</th>
                    <th scope="col" className="table-num">Net Realized P&L</th>
                    <th scope="col" className="table-num">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-table-cell">
                        No closed paper trades recorded yet.
                      </td>
                    </tr>
                  ) : (
                    tradeHistory.map((t) => {
                      const isGain = t.netPnl >= 0;
                      return (
                        <tr key={t.id}>
                          <th scope="row">{t.symbol}</th>
                          <td>{t.side} ({t.product})</td>
                          <td className="table-num font-mono">{t.quantity}</td>
                          <td>
                            <div className="font-mono">₹{t.entryPrice.toFixed(2)} &rarr; ₹{t.exitPrice.toFixed(2)}</div>
                            <span className="table-sub">{t.entryTimestamp} - {t.exitTimestamp}</span>
                          </td>
                          <td className="table-num font-mono">₹{t.grossPnl.toFixed(2)}</td>
                          <td className="table-num font-mono text-muted">₹{t.totalCharges.toFixed(2)}</td>
                          <td className={`table-num font-mono highlight-cell ${isGain ? "text-gain" : "text-loss"}`}>
                            {isGain ? "+" : ""}₹{t.netPnl.toFixed(2)}
                          </td>
                          <td className={`table-num font-mono ${isGain ? "text-gain" : "text-loss"}`}>
                            {isGain ? "+" : ""}{t.netReturnPercent.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
