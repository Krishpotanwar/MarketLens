import { useEffect, useMemo, useState, useCallback } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import type { StockTrendInfo } from "../types/paper";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface StocksExplorerPageProps {
  onSelectForTrend: (symbol: string) => void;
  onSelectForTrade: (symbol: string) => void;
  initialSearchQuery?: string;
}

interface IndexTapeItem {
  name: string;
  val: string;
  chg: string;
  positive: boolean;
}

export function StocksExplorerPage({
  onSelectForTrend,
  onSelectForTrade,
  initialSearchQuery = "",
}: StocksExplorerPageProps) {
  const [stocks, setStocks] = useState<StockTrendInfo[]>(INITIAL_INDIAN_STOCKS);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [selectedCap, setSelectedCap] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveProvider, setLiveProvider] = useState<string>("Connecting...");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  const [indices, setIndices] = useState<IndexTapeItem[]>([
    { name: "NIFTY 50", val: "24,854.20", chg: "+0.58%", positive: true },
    { name: "SENSEX", val: "81,420.50", chg: "+0.62%", positive: true },
    { name: "BANK NIFTY", val: "51,340.80", chg: "+0.76%", positive: true },
    { name: "NIFTY IT", val: "42,180.20", chg: "+1.15%", positive: true },
    { name: "NIFTY AUTO", val: "25,640.10", chg: "+2.10%", positive: true },
  ]);

  // Fetch live market quotes from backend telemetry
  const fetchLiveMarketQuotes = useCallback(async () => {
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
          const providerName = quotes[0].provider || "NSE Telemetry (Live)";
          setLiveProvider(providerName);
          setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

          // Update indices
          setIndices((prev) =>
            prev.map((idx) => {
              const match = quotes.find((q) => q.symbol === idx.name);
              if (match) {
                return {
                  name: idx.name,
                  val: match.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                  chg: `${match.change_percent >= 0 ? "+" : ""}${match.change_percent.toFixed(2)}%`,
                  positive: match.change_percent >= 0,
                };
              }
              return idx;
            })
          );

          // Update stocks list with live quotes
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
      setLiveProvider("Offline Heuristic Baseline");
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // Run live quote fetch on mount
  useEffect(() => {
    fetchLiveMarketQuotes();
    const interval = setInterval(fetchLiveMarketQuotes, 15000); // Poll live quotes every 15s
    return () => clearInterval(interval);
  }, [fetchLiveMarketQuotes]);

  // Dynamic live search when user queries any stock symbol or name
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) return;

    let isMounted = true;
    setIsSearchingLive(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/market/search?q=${encodeURIComponent(q)}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const results: Array<{
            symbol: string;
            name: string;
            sector: string;
            marketCapCategory: string;
            ltp: number;
            change: number;
            change_percent: number;
            volume: number;
          }> = data.results || [];

          if (results.length > 0) {
            setStocks((prev) => {
              const existingMap = new Map(prev.map((item) => [item.symbol, item]));
              for (const r of results) {
                if (existingMap.has(r.symbol)) {
                  const curr = existingMap.get(r.symbol)!;
                  existingMap.set(r.symbol, {
                    ...curr,
                    ltp: r.ltp > 0 ? r.ltp : curr.ltp,
                    change: r.change,
                    changePercent: r.change_percent,
                    volume: r.volume > 0 ? r.volume : curr.volume,
                  });
                } else {
                  // Add discovered stock dynamically with default technical setup
                  const capCategory = (
                    r.marketCapCategory === "Large Cap" ||
                    r.marketCapCategory === "Mid Cap" ||
                    r.marketCapCategory === "Small Cap" ||
                    r.marketCapCategory === "Index"
                  ) ? r.marketCapCategory : "Mid Cap";

                  existingMap.set(r.symbol, {
                    symbol: r.symbol,
                    name: r.name,
                    sector: r.sector,
                    marketCapCategory: capCategory,
                    week52High: r.ltp * 1.35,
                    week52Low: r.ltp * 0.75,
                    ltp: r.ltp,
                    change: r.change,
                    changePercent: r.change_percent,
                    open: r.ltp - r.change,
                    high: r.ltp * 1.015,
                    low: r.ltp * 0.985,
                    vwap: r.ltp,
                    volume: r.volume || 1500000,
                    volumeRatio: 1.15,
                    rsi14: 54.2,
                    sma20: r.ltp * 0.985,
                    sma50: r.ltp * 0.965,
                    trend5m: r.change >= 0 ? "BULLISH" : "BEARISH",
                    trend15m: r.change >= 0 ? "BULLISH" : "BEARISH",
                    trend1h: r.change >= 0 ? "BULLISH" : "BEARISH",
                    trend1d: r.change >= 0 ? "BULLISH" : "BEARISH",
                    predictedProbabilityUp: r.change >= 0 ? 0.65 : 0.42,
                    expectedMovePercent: Math.abs(r.change_percent) || 1.25,
                    brierCalibration: 0.18,
                    signalStrength: r.change >= 0 ? "BUY" : "NEUTRAL",
                    causalFeatures: { momentum: 30, volumeSurge: 25, vwapDeviation: 20, sectorBreadth: 25 },
                    priceHistory: [r.ltp * 0.98, r.ltp * 0.99, r.ltp, r.ltp],
                  });
                }
              }
              return Array.from(existingMap.values());
            });
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsSearchingLive(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Discovery shelves
  const topGainers = useMemo(() => {
    return [...stocks]
      .filter((s) => s.marketCapCategory !== "Index" && s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 4);
  }, [stocks]);

  const topLosers = useMemo(() => {
    return [...stocks]
      .filter((s) => s.marketCapCategory !== "Index" && s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 3);
  }, [stocks]);

  const mostActive = useMemo(() => {
    return [...stocks]
      .filter((s) => s.marketCapCategory !== "Index")
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 4);
  }, [stocks]);

  // Filtered List
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch =
        searchQuery === "" ||
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCap =
        selectedCap === "ALL" || stock.marketCapCategory === selectedCap;

      const matchesSector =
        selectedSector === "ALL" || stock.sector.includes(selectedSector);

      return matchesSearch && matchesCap && matchesSector;
    });
  }, [stocks, searchQuery, selectedCap, selectedSector]);

  const sectors = [
    "ALL",
    "Banking",
    "Information Tech",
    "Automobile",
    "Energy",
    "Consumer Tech",
    "Capital Markets",
  ];

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <div className="page-header-split">
          <div>
            <h1>Indian Stocks & Market Explorer</h1>
            <p className="status-copy">
              Explore all NSE/BSE equities across Large, Mid, and Small-cap categories with live pricing, top market shelves, and one-click paper trade execution.
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
              onClick={fetchLiveMarketQuotes}
              disabled={isLiveLoading}
              aria-label="Refresh live quotes"
            >
              {isLiveLoading ? "Syncing..." : "↻ Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* Indices Bar */}
      <section className="indices-strip" aria-label="Major Indian Indices">
        {indices.map((idx) => (
          <div key={idx.name} className="index-pill">
            <span className="index-name">{idx.name}</span>
            <div className="index-vals">
              <span className="index-price">{idx.val}</span>
              <span className={`index-chg ${idx.positive ? "text-gain" : "text-loss"}`}>
                {idx.chg}
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Discovery Shelves */}
      <section className="discovery-shelves-grid" aria-label="Market Shelves">
        {/* Top Gainers Shelf */}
        <div className="shelf-card">
          <div className="shelf-head">
            <span className="shelf-title text-gain">Top Gainers</span>
            <span className="shelf-sub">Today's leaders</span>
          </div>
          <div className="shelf-items">
            {topGainers.map((stock) => (
              <div
                key={stock.symbol}
                className="shelf-row"
                onClick={() => onSelectForTrend(stock.symbol)}
                role="button"
                tabIndex={0}
              >
                <div className="shelf-sym-col">
                  <span className="shelf-sym">{stock.symbol}</span>
                  <span className="shelf-company">{stock.name}</span>
                </div>
                <div className="shelf-price-col">
                  <span className="shelf-ltp">₹{stock.ltp.toFixed(2)}</span>
                  <span className="shelf-pct text-gain">+{stock.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers Shelf */}
        <div className="shelf-card">
          <div className="shelf-head">
            <span className="shelf-title text-loss">Top Losers</span>
            <span className="shelf-sub">Pullback setups</span>
          </div>
          <div className="shelf-items">
            {topLosers.map((stock) => (
              <div
                key={stock.symbol}
                className="shelf-row"
                onClick={() => onSelectForTrend(stock.symbol)}
                role="button"
                tabIndex={0}
              >
                <div className="shelf-sym-col">
                  <span className="shelf-sym">{stock.symbol}</span>
                  <span className="shelf-company">{stock.name}</span>
                </div>
                <div className="shelf-price-col">
                  <span className="shelf-ltp">₹{stock.ltp.toFixed(2)}</span>
                  <span className="shelf-pct text-loss">{stock.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Active Volume Shelf */}
        <div className="shelf-card">
          <div className="shelf-head">
            <span className="shelf-title text-accent">Most Active</span>
            <span className="shelf-sub">Highest daily turnover</span>
          </div>
          <div className="shelf-items">
            {mostActive.map((stock) => (
              <div
                key={stock.symbol}
                className="shelf-row"
                onClick={() => onSelectForTrend(stock.symbol)}
                role="button"
                tabIndex={0}
              >
                <div className="shelf-sym-col">
                  <span className="shelf-sym">{stock.symbol}</span>
                  <span className="shelf-company">{(stock.volume / 1000000).toFixed(1)}M Vol</span>
                </div>
                <div className="shelf-price-col">
                  <span className="shelf-ltp">₹{stock.ltp.toFixed(2)}</span>
                  <span className={`shelf-pct ${stock.change >= 0 ? "text-gain" : "text-loss"}`}>
                    {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explorer Controls: Search & Market Cap Tabs */}
      <section className="explorer-controls-panel" aria-label="Stock Search and Filtering">
        <div className="search-box">
          <input
            type="search"
            placeholder="Search ANY Indian stock symbol or company (e.g. Zomato, Dixon, Suzlon, Paytm, Tata Steel)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search Indian stocks"
          />
          {isSearchingLive && <span className="search-live-status-pill">Searching live...</span>}
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-pill-row">
          <div className="cap-tabs" role="tablist" aria-label="Market Cap Filter">
            {["ALL", "Large Cap", "Mid Cap", "Index"].map((cap) => (
              <button
                key={cap}
                type="button"
                role="tab"
                aria-selected={selectedCap === cap}
                className={`cap-tab-btn ${selectedCap === cap ? "active" : ""}`}
                onClick={() => setSelectedCap(cap)}
              >
                {cap === "ALL" ? "All Equities" : cap}
              </button>
            ))}
          </div>

          <div className="sector-dropdown-wrap">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="sector-select"
              aria-label="Filter by sector"
            >
              {sectors.map((sec) => (
                <option key={sec} value={sec}>
                  {sec === "ALL" ? "All Sectors" : sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Stocks Table */}
      <section className="stocks-table-section" aria-label="Indian Equities Directory">
        <div className="table-wrapper">
          <table className="data-table" aria-label="Stocks Directory">
            <thead>
              <tr>
                <th scope="col">Company & Symbol</th>
                <th scope="col">Category</th>
                <th scope="col">Sector</th>
                <th scope="col">Market Price (LTP)</th>
                <th scope="col">Day Change</th>
                <th scope="col">52-Week Range</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    No Indian stocks found matching "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  const high52 = stock.week52High || stock.high * 1.1;
                  const low52 = stock.week52Low || stock.low * 0.9;
                  const rangePct = Math.min(
                    100,
                    Math.max(0, ((stock.ltp - low52) / (high52 - low52 || 1)) * 100)
                  );

                  return (
                    <tr key={stock.symbol}>
                      <th scope="row">
                        <span className="table-symbol">{stock.symbol}</span>
                        <span className="table-sub">{stock.name}</span>
                      </th>
                      <td>
                        <span className="cap-badge">
                          {stock.marketCapCategory || "Large Cap"}
                        </span>
                      </td>
                      <td>{stock.sector}</td>
                      <td>₹{stock.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className={isPositive ? "text-gain" : "text-loss"}>
                        {isPositive ? "+" : ""}₹{stock.change.toFixed(2)} ({isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%)
                      </td>
                      <td>
                        <div className="range-bar-cell">
                          <span className="range-label">₹{low52.toFixed(0)}</span>
                          <div className="range-track">
                            <div
                              className="range-indicator"
                              style={{ left: `${rangePct}%` }}
                            />
                          </div>
                          <span className="range-label">₹{high52.toFixed(0)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="stock-action-group">
                          <button
                            type="button"
                            className="btn-stock-trend"
                            onClick={() => onSelectForTrend(stock.symbol)}
                          >
                            Analyze
                          </button>
                          <button
                            type="button"
                            className="btn-stock-trade"
                            onClick={() => onSelectForTrade(stock.symbol)}
                          >
                            Trade
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
