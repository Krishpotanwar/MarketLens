import { useCallback, useEffect, useState } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import type { StockTrendInfo } from "../types/paper";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface TrendAnalysisPageProps {
  onSelectForTrade: (symbol: string) => void;
  initialSymbol?: string;
}

export function TrendAnalysisPage({ onSelectForTrade, initialSymbol }: TrendAnalysisPageProps) {
  const [stocks, setStocks] = useState<StockTrendInfo[]>(INITIAL_INDIAN_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol || "RELIANCE");
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [liveProvider, setLiveProvider] = useState<string>("Connecting to NSE...");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol);
    }
  }, [initialSymbol]);

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
      setLiveProvider("Offline Baseline");
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveQuotes]);

  const activeStock = stocks.find((s) => s.symbol === selectedSymbol) ?? stocks[0];

  const sectors = ["ALL", "Index", "Information Tech", "Private Banking", "Automobile", "Energy & Conglomerate"];

  const filteredStocks = sectorFilter === "ALL" 
    ? stocks 
    : stocks.filter((s) => s.sector.includes(sectorFilter));

  const advances = stocks.filter((s) => s.change >= 0).length;
  const declines = stocks.filter((s) => s.change < 0).length;

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <div className="page-header-split">
          <div>
            <h1>Indian Stock Market Trends & Signals</h1>
            <p className="status-copy">
              Real-time algorithmic trend screening and causal directional forecasts across NSE/BSE cash equities. Calibrated for paper trading validation.
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

      {/* Market Breadth & Session Banner */}
      <section className="market-breadth-strip" aria-label="NSE Market Breadth">
        <div className="breadth-item">
          <span className="breadth-label">NSE Session</span>
          <span className="breadth-val status-live">09:15 - 15:30 IST</span>
        </div>
        <div className="breadth-item">
          <span className="breadth-label">Nifty 50</span>
          <span className="breadth-val text-gain">24,854.20 (+0.58%)</span>
        </div>
        <div className="breadth-item">
          <span className="breadth-label">Bank Nifty</span>
          <span className="breadth-val text-gain">51,340.80 (+0.76%)</span>
        </div>
        <div className="breadth-item">
          <span className="breadth-label">Market Breadth</span>
          <span className="breadth-val">
            <span className="text-gain">{advances} Adv</span> / <span className="text-loss">{declines} Dec</span>
          </span>
        </div>
      </section>

      {/* Sector filter tags */}
      <div className="filter-bar" role="toolbar" aria-label="Sector Filter">
        {sectors.map((sec) => (
          <button
            key={sec}
            type="button"
            className={`filter-btn ${sectorFilter === sec ? "active" : ""}`}
            onClick={() => setSectorFilter(sec)}
          >
            {sec}
          </button>
        ))}
      </div>

      <div className="trend-workspace-grid">
        {/* Left Column: Stock Screener & Watchlist */}
        <section className="screener-panel" aria-label="Watchlist & Screener">
          <h2 className="panel-title">NSE Liquid Equities</h2>
          <div className="screener-list" role="listbox">
            {filteredStocks.map((stock) => {
              const isSelected = stock.symbol === activeStock.symbol;
              const isPositive = stock.change >= 0;
              return (
                <button
                  key={stock.symbol}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`screener-row ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                >
                  <div className="screener-left">
                    <span className="screener-sym">{stock.symbol}</span>
                    <span className="screener-name">{stock.name}</span>
                  </div>
                  <div className="screener-right">
                    <span className="screener-ltp">₹{stock.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <span className={`screener-chg ${isPositive ? "text-gain" : "text-loss"}`}>
                      {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Column: Deep-Dive Trend Matrix & Prediction Studio */}
        <section className="analysis-panel" aria-label="Stock Trend Analysis">
          <div className="analysis-header">
            <div>
              <div className="symbol-row">
                <h2>{activeStock.symbol}</h2>
                <span className="sector-tag">{activeStock.sector}</span>
              </div>
              <p className="stock-subtitle">{activeStock.name}</p>
            </div>

            <div className="price-badge-block">
              <span className="active-ltp">₹{activeStock.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              <span className={`active-chg ${activeStock.change >= 0 ? "text-gain" : "text-loss"}`}>
                {activeStock.change >= 0 ? "+" : ""}₹{activeStock.change.toFixed(2)} ({activeStock.change >= 0 ? "+" : ""}{activeStock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Key Intraday Stats */}
          <div className="mini-stats-grid">
            <div className="mini-stat">
              <span className="stat-label">Day Open</span>
              <span className="stat-val">₹{activeStock.open.toFixed(2)}</span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Day High</span>
              <span className="stat-val">₹{activeStock.high.toFixed(2)}</span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Day Low</span>
              <span className="stat-val">₹{activeStock.low.toFixed(2)}</span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">VWAP</span>
              <span className="stat-val">₹{activeStock.vwap.toFixed(2)}</span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">RSI (14)</span>
              <span className={`stat-val ${activeStock.rsi14 > 70 ? "text-loss" : activeStock.rsi14 < 35 ? "text-gain" : ""}`}>
                {activeStock.rsi14.toFixed(1)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Volume Ratio</span>
              <span className="stat-val text-accent">{activeStock.volumeRatio}x avg</span>
            </div>
          </div>

          {/* SVG Price Chart */}
          <div className="chart-wrapper" aria-label="Intraday Trend Chart">
            <div className="chart-header">
              <span className="chart-title">Intraday 30-Period Trend & SMA Overlay</span>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot dot-price" /> Price</span>
                <span className="legend-item"><span className="legend-dot dot-sma20" /> 20 SMA</span>
                <span className="legend-item"><span className="legend-dot dot-sma50" /> 50 SMA</span>
              </div>
            </div>
            <svg className="trend-svg" viewBox="0 0 600 160" preserveAspectRatio="none">
              {/* Dynamic SVG polyline based on priceHistory */}
              {(() => {
                const prices = activeStock.priceHistory;
                const min = Math.min(...prices) * 0.998;
                const max = Math.max(...prices) * 1.002;
                const range = max - min || 1;
                const points = prices
                  .map((p, i) => {
                    const x = (i / (prices.length - 1)) * 580 + 10;
                    const y = 145 - ((p - min) / range) * 130;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(" ");

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke={activeStock.change >= 0 ? "#10b981" : "#ef4444"}
                      strokeWidth="2.5"
                      points={points}
                    />
                    {/* SMA 20 baseline line */}
                    <line
                      x1="10"
                      y1="75"
                      x2="590"
                      y2="75"
                      stroke="#f59e0b"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                    />
                    {/* SMA 50 baseline line */}
                    <line
                      x1="10"
                      y1="95"
                      x2="590"
                      y2="95"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Multi-Timeframe Matrix */}
          <div className="timeframe-matrix-block">
            <h3>Multi-Timeframe Trend Structure</h3>
            <div className="timeframe-grid">
              <div className="tf-card">
                <span className="tf-label">5-Min (Scalp)</span>
                <span className={`tf-pill status-${activeStock.trend5m.toLowerCase()}`}>
                  {activeStock.trend5m}
                </span>
              </div>
              <div className="tf-card">
                <span className="tf-label">15-Min (Intraday)</span>
                <span className={`tf-pill status-${activeStock.trend15m.toLowerCase()}`}>
                  {activeStock.trend15m}
                </span>
              </div>
              <div className="tf-card">
                <span className="tf-label">1-Hour (Swing)</span>
                <span className={`tf-pill status-${activeStock.trend1h.toLowerCase()}`}>
                  {activeStock.trend1h}
                </span>
              </div>
              <div className="tf-card">
                <span className="tf-label">Daily (Macro)</span>
                <span className={`tf-pill status-${activeStock.trend1d.toLowerCase()}`}>
                  {activeStock.trend1d}
                </span>
              </div>
            </div>
          </div>

          {/* Directional Prediction & Profit Forecasting Studio */}
          <div className="prediction-studio-block">
            <div className="prediction-head">
              <h3>Calibrated Directional Prediction</h3>
              <span className={`signal-badge badge-${activeStock.signalStrength.toLowerCase()}`}>
                {activeStock.signalStrength.replace("_", " ")}
              </span>
            </div>

            <div className="prediction-stats-row">
              <div className="pred-stat">
                <span className="pred-label">Upward Probability</span>
                <span className="pred-val text-accent">{(activeStock.predictedProbabilityUp * 100).toFixed(0)}%</span>
              </div>
              <div className="pred-stat">
                <span className="pred-label">Expected Next-Session Move</span>
                <span className={`pred-val ${activeStock.expectedMovePercent >= 0 ? "text-gain" : "text-loss"}`}>
                  {activeStock.expectedMovePercent >= 0 ? "+" : ""}{activeStock.expectedMovePercent.toFixed(2)}%
                </span>
              </div>
              <div className="pred-stat">
                <span className="pred-label">Brier Calibration Score</span>
                <span className="pred-val">{activeStock.brierCalibration.toFixed(3)}</span>
              </div>
            </div>

            <div className="causal-waterfall">
              <span className="causal-title">Causal Feature Contribution to Signal</span>
              <div className="causal-bar-row">
                <span className="bar-tag">Price Momentum</span>
                <div className="bar-track">
                  <div className="bar-fill fill-mom" style={{ width: `${activeStock.causalFeatures.momentum}%` }} />
                </div>
                <span className="bar-pct">+{activeStock.causalFeatures.momentum}%</span>
              </div>
              <div className="causal-bar-row">
                <span className="bar-tag">Volume Surge</span>
                <div className="bar-track">
                  <div className="bar-fill fill-vol" style={{ width: `${activeStock.causalFeatures.volumeSurge}%` }} />
                </div>
                <span className="bar-pct">+{activeStock.causalFeatures.volumeSurge}%</span>
              </div>
              <div className="causal-bar-row">
                <span className="bar-tag">VWAP Deviation</span>
                <div className="bar-track">
                  <div className="bar-fill fill-vwap" style={{ width: `${activeStock.causalFeatures.vwapDeviation}%` }} />
                </div>
                <span className="bar-pct">+{activeStock.causalFeatures.vwapDeviation}%</span>
              </div>
              <div className="causal-bar-row">
                <span className="bar-tag">Sector Breadth</span>
                <div className="bar-track">
                  <div className="bar-fill fill-sec" style={{ width: `${activeStock.causalFeatures.sectorBreadth}%` }} />
                </div>
                <span className="bar-pct">+{activeStock.causalFeatures.sectorBreadth}%</span>
              </div>
            </div>

            {/* Simulated Action */}
            <div className="trade-action-cta">
              <button
                type="button"
                className="btn-paper-trade"
                onClick={() => onSelectForTrade(activeStock.symbol)}
              >
                Test Signal in Paper Trading Terminal &rarr;
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
