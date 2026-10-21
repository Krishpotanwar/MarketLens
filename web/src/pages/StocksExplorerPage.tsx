import { useMemo, useState } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import type { StockTrendInfo } from "../types/paper";

interface StocksExplorerPageProps {
  onSelectForTrend: (symbol: string) => void;
  onSelectForTrade: (symbol: string) => void;
}

export function StocksExplorerPage({
  onSelectForTrend,
  onSelectForTrade,
}: StocksExplorerPageProps) {
  const [stocks] = useState<StockTrendInfo[]>(INITIAL_INDIAN_STOCKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCap, setSelectedCap] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  const indices = [
    { name: "NIFTY 50", val: "24,854.20", chg: "+0.58%", positive: true },
    { name: "SENSEX", val: "81,420.50", chg: "+0.62%", positive: true },
    { name: "BANK NIFTY", val: "51,340.80", chg: "+0.76%", positive: true },
    { name: "NIFTY IT", val: "42,180.20", chg: "+1.15%", positive: true },
    { name: "NIFTY AUTO", val: "25,640.10", chg: "+2.10%", positive: true },
  ];

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
        <h1>Indian Stocks & Market Explorer</h1>
        <p className="status-copy">
          Explore all NSE/BSE equities across Large, Mid, and Small-cap categories with live pricing, top market shelves, and one-click paper trade execution.
        </p>
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
            placeholder="Search company, symbol, or sector (e.g. Zomato, Reliance, Banking)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search Indian stocks"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
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
