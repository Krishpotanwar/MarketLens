import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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

interface ListedStockItem {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | string;
  sector: string;
  marketCapCategory: string;
  series?: string;
  listingDate?: string;
  isin?: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
  week52High?: number;
  week52Low?: number;
}

export function StocksExplorerPage({
  onSelectForTrend,
  onSelectForTrade,
  initialSearchQuery = "",
}: StocksExplorerPageProps) {
  // Shelves state (top gainers/losers/active)
  const [shelvesStocks, setShelvesStocks] = useState<StockTrendInfo[]>(INITIAL_INDIAN_STOCKS);

  // Paginated master catalog state (13,109+ Indian equities)
  const [stocks, setStocks] = useState<ListedStockItem[]>(
    INITIAL_INDIAN_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.symbol.endsWith(".BO") ? "BSE" : "NSE",
      sector: s.sector,
      marketCapCategory: s.marketCapCategory || "Mid Cap",
      series: "EQ",
      ltp: s.ltp,
      change: s.change,
      changePercent: s.changePercent,
      volume: s.volume,
      week52High: s.week52High,
      week52Low: s.week52Low,
    }))
  );

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedExchange, setSelectedExchange] = useState<string>("ALL");
  const [selectedCap, setSelectedCap] = useState<string>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(263);
  const [totalCount, setTotalCount] = useState<number>(13109);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [liveProvider, setLiveProvider] = useState<string>("NSE/BSE Master Telemetry");
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const isInitialMount = useRef(true);
  const activeRequestIdRef = useRef(0);

  const [indices, setIndices] = useState<IndexTapeItem[]>([
    { name: "NIFTY 50", val: "24,854.20", chg: "+0.58%", positive: true },
    { name: "SENSEX", val: "81,420.50", chg: "+0.62%", positive: true },
    { name: "BANK NIFTY", val: "51,340.80", chg: "+0.76%", positive: true },
    { name: "NIFTY IT", val: "42,180.20", chg: "+1.15%", positive: true },
    { name: "NIFTY AUTO", val: "25,640.10", chg: "+2.10%", positive: true },
  ]);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setSelectedSector("ALL");
      setPage(1);
    }
  }, [initialSearchQuery]);

  // Fetch live market quotes for indices and discovery shelves
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
          setLastSyncTime(
            new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );

          // Update indices
          setIndices((prev) =>
            prev.map((idx) => {
              const match = quotes.find((q) => q.symbol === idx.name);
              if (match) {
                return {
                  name: idx.name,
                  val: match.ltp.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  chg: `${match.change_percent >= 0 ? "+" : ""}${match.change_percent.toFixed(2)}%`,
                  positive: match.change_percent >= 0,
                };
              }
              return idx;
            })
          );

          // Update shelves with live quotes
          setShelvesStocks((prev) =>
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

  // Fetch paginated stock catalog from master API (13,109+ Indian equities)
  const fetchStockCatalog = useCallback(
    async (
      targetPage: number,
      targetExchange: string,
      targetCap: string,
      queryStr: string
    ) => {
      const reqId = ++activeRequestIdRef.current;
      setIsLoadingCatalog(true);
      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          limit: "50",
          exchange: targetExchange,
          cap: targetCap,
          q: queryStr.trim(),
        });

        const res = await fetch(`${API_BASE}/api/v1/market/stocks/all?${params.toString()}`);
        if (reqId !== activeRequestIdRef.current) return;

        if (res.ok) {
          const data = await res.json();
          if (reqId !== activeRequestIdRef.current) return;

          if (Array.isArray(data.stocks) && data.stocks.length > 0) {
            setStocks(
              data.stocks.map((item: any) => ({
                symbol: item.symbol,
                name: item.name,
                exchange: item.exchange || (item.symbol.endsWith(".BO") ? "BSE" : "NSE"),
                sector: item.sector || "Indian Equities",
                marketCapCategory: item.marketCapCategory || "Mid Cap",
                series: item.series || "EQ",
                listingDate: item.listingDate || "",
                isin: item.isin || "",
                ltp: item.ltp || 100.0,
                change: item.change || 0.0,
                changePercent: item.changePercent || 0.0,
                volume: item.volume || 0,
                week52High: (item.ltp || 100) * 1.3,
                week52Low: (item.ltp || 100) * 0.75,
              }))
            );
            setTotalCount(data.total || 0);
            setTotalPages(data.totalPages || Math.ceil((data.total || 1) / 50));
            setPage(data.page || targetPage);
          } else if (queryStr.trim()) {
            // No results for this query
            setStocks([]);
            setTotalCount(0);
            setTotalPages(1);
          }
        }
      } catch {
        // Fallback to initial stocks on network error
      } finally {
        if (reqId === activeRequestIdRef.current) {
          setIsLoadingCatalog(false);
        }
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchLiveMarketQuotes();
    const interval = setInterval(fetchLiveMarketQuotes, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveMarketQuotes]);

  // Debounced search and filter triggers
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchStockCatalog(1, selectedExchange, selectedCap, searchQuery);
      return;
    }

    const timer = setTimeout(() => {
      fetchStockCatalog(page, selectedExchange, selectedCap, searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchStockCatalog, page, selectedExchange, selectedCap, searchQuery]);

  // Reset page to 1 when filters or search change
  const handleExchangeChange = (ex: string) => {
    setSelectedExchange(ex);
    setPage(1);
  };

  const handleCapChange = (cap: string) => {
    setSelectedCap(cap);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
    if (val.trim()) {
      setSelectedSector("ALL");
    }
  };

  // Discovery shelves
  const topGainers = useMemo(() => {
    return [...shelvesStocks]
      .filter((s) => s.marketCapCategory !== "Index" && s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 4);
  }, [shelvesStocks]);

  const topLosers = useMemo(() => {
    return [...shelvesStocks]
      .filter((s) => s.marketCapCategory !== "Index" && s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 3);
  }, [shelvesStocks]);

  const mostActive = useMemo(() => {
    return [...shelvesStocks]
      .filter((s) => s.marketCapCategory !== "Index")
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 4);
  }, [shelvesStocks]);

  // Client-side sector filtering
  const visibleStocks = useMemo(() => {
    if (selectedSector === "ALL") return stocks;
    return stocks.filter((s) =>
      s.sector.toLowerCase().includes(selectedSector.toLowerCase())
    );
  }, [stocks, selectedSector]);

  const sectors = [
    "ALL",
    "Banking",
    "Information Tech",
    "Automobile",
    "Energy",
    "Defence",
    "Consumer Tech",
    "Retail",
    "Capital Markets",
    "Railway",
  ];

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <div className="page-header-split">
          <div>
            <h1>Indian Stocks & Market Explorer</h1>
            <p className="status-copy">
              Explore all 13,000+ listed Indian companies across NSE and BSE with live quotes, official exchange masters, top market shelves, and one-click paper trade execution.
            </p>
          </div>
          <div className="live-telemetry-status-card" role="status">
            <span className="live-telemetry-dot" aria-hidden="true" />
            <div className="live-telemetry-info">
              <span className="live-telemetry-provider">{liveProvider}</span>
              {lastSyncTime && (
                <span className="live-telemetry-time">Synced at {lastSyncTime}</span>
              )}
            </div>
            <button
              type="button"
              className="live-sync-btn"
              onClick={() => {
                fetchLiveMarketQuotes();
                fetchStockCatalog(page, selectedExchange, selectedCap, searchQuery);
              }}
              disabled={isLiveLoading || isLoadingCatalog}
              aria-label="Refresh live quotes"
            >
              {isLiveLoading || isLoadingCatalog ? "Syncing..." : "↻ Refresh"}
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

      {/* Discovery Shelves - Visible during broad discovery, auto-collapses during targeted search */}
      {!searchQuery.trim() && (
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
                    <span className="shelf-pct text-gain">
                      +{stock.changePercent.toFixed(2)}%
                    </span>
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
                    <span className="shelf-pct text-loss">
                      {stock.changePercent.toFixed(2)}%
                    </span>
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
                    <span className="shelf-company">
                      {(stock.volume / 1000000).toFixed(1)}M Vol
                    </span>
                  </div>
                  <div className="shelf-price-col">
                    <span className="shelf-ltp">₹{stock.ltp.toFixed(2)}</span>
                    <span
                      className={`shelf-pct ${stock.change >= 0 ? "text-gain" : "text-loss"}`}
                    >
                      {stock.change >= 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Explorer Controls: Search & Market Cap & Exchange Tabs */}
      <section className="explorer-controls-panel" aria-label="Stock Search and Filtering">
        <div className="search-box">
          <input
            type="search"
            placeholder="Search ANY Indian stock symbol or company (e.g. Zomato, Dixon, Mazgaon Dock, Stellant, Suzlon)..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
            aria-label="Search Indian stocks"
          />
          {isLoadingCatalog && (
            <span className="search-live-status-pill">Loading catalog...</span>
          )}
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => handleSearchChange("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Exchange Filter Row */}
        <div className="exchange-filter-row" role="tablist" aria-label="Exchange Selection">
          {[
            { id: "ALL", label: "All Exchanges (13,109+)" },
            { id: "NSE", label: "NSE Listed (2,611)" },
            { id: "BSE", label: "BSE Listed (10,498)" },
          ].map((ex) => (
            <button
              key={ex.id}
              type="button"
              role="tab"
              aria-selected={selectedExchange === ex.id}
              className={`exchange-tab-btn ${selectedExchange === ex.id ? "active" : ""}`}
              onClick={() => handleExchangeChange(ex.id)}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Cap and Sector Filter Row */}
        <div className="filter-pill-row">
          <div className="cap-tabs" role="tablist" aria-label="Market Cap Filter">
            {["ALL", "Large Cap", "Mid Cap", "Small Cap"].map((cap) => (
              <button
                key={cap}
                type="button"
                role="tab"
                aria-selected={selectedCap === cap}
                className={`cap-tab-btn ${selectedCap === cap ? "active" : ""}`}
                onClick={() => handleCapChange(cap)}
              >
                {cap === "ALL" ? "All Caps" : cap}
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

          <div className="catalog-total-counter">
            Showing {visibleStocks.length} of {totalCount.toLocaleString("en-IN")} Indian Equities
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
                <th scope="col">Exchange</th>
                <th scope="col">Category</th>
                <th scope="col">Sector</th>
                <th scope="col">Market Price (LTP)</th>
                <th scope="col">Day Change</th>
                <th scope="col">52-Week Range</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCatalog && searchQuery.trim() ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`loading-${i}`} className="table-row-skeleton">
                    <td colSpan={8} className="skeleton-cell">
                      <div className="skeleton-line-thick" style={{ width: "25%", height: "14px", marginBottom: "6px" }} />
                      <div className="skeleton-line-thin" style={{ width: "50%", height: "11px" }} />
                    </td>
                  </tr>
                ))
              ) : visibleStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    {`No Indian stocks found matching "${searchQuery}".`}
                  </td>
                </tr>
              ) : (
                visibleStocks.map((stock) => {
                  const isPositive = stock.change >= 0;
                  const high52 = stock.week52High || stock.ltp * 1.25;
                  const low52 = stock.week52Low || stock.ltp * 0.75;
                  const rangePct = Math.min(
                    100,
                    Math.max(0, ((stock.ltp - low52) / (high52 - low52 || 1)) * 100)
                  );

                  return (
                    <tr key={`${stock.exchange}-${stock.symbol}`}>
                      <th scope="row">
                        <span className="table-symbol">{stock.symbol}</span>
                        <span className="table-sub">{stock.name}</span>
                      </th>
                      <td>
                        <span
                          className={
                            stock.exchange === "NSE"
                              ? "exchange-badge-nse"
                              : "exchange-badge-bse"
                          }
                        >
                          {stock.exchange}
                        </span>
                      </td>
                      <td>
                        <span className="cap-badge">
                          {stock.marketCapCategory || "Mid Cap"}
                        </span>
                      </td>
                      <td>{stock.sector}</td>
                      <td>
                        ₹{stock.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className={isPositive ? "text-gain" : "text-loss"}>
                        {isPositive ? "+" : ""}₹{stock.change.toFixed(2)} (
                        {isPositive ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%)
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <nav className="pagination-bar" aria-label="Stock directory pages">
            <div className="pagination-info">
              Page <strong>{page}</strong> of <strong>{totalPages.toLocaleString("en-IN")}</strong>{" "}
              <span className="text-muted">
                ({((page - 1) * 50 + 1).toLocaleString("en-IN")} -{" "}
                {Math.min(page * 50, totalCount).toLocaleString("en-IN")} of{" "}
                {totalCount.toLocaleString("en-IN")})
              </span>
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage(1)}
                disabled={page <= 1 || isLoadingCatalog}
                aria-label="First page"
              >
                « First
              </button>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingCatalog}
                aria-label="Previous page"
              >
                ‹ Prev
              </button>

              <span className="pagination-current-pill">
                Page {page}
              </span>

              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoadingCatalog}
                aria-label="Next page"
              >
                Next ›
              </button>
              <button
                type="button"
                className="pagination-btn"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || isLoadingCatalog}
                aria-label="Last page"
              >
                Last »
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}
