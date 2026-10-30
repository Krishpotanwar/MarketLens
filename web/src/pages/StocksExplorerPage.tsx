import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import { CONNECTING_LABEL, feedLabel, isOffline, isUsableQuote, OFFLINE_LABEL, priceText } from "../utils/dataStatus";
import { API_BASE } from "../utils/apiBase";

/** The 52-week range bar: a real range, or a dash. Never a range worked out from the price. */
export function WeekRangeBar({ ltp, low, high }: { ltp?: number | null; low?: number; high?: number }) {
  if (ltp == null || low == null || high == null) return <>—</>;
  const pct = Math.min(100, Math.max(0, ((ltp - low) / (high - low || 1)) * 100));
  return (
    <div className="range-bar-cell">
      <span className="range-label">₹{low.toFixed(0)}</span>
      <div className="range-track">
        <div className="range-fill" style={{ width: `${pct}%` }} />
        <div className="range-indicator" style={{ left: `${pct}%` }} />
      </div>
      <span className="range-label">₹{high.toFixed(0)}</span>
    </div>
  );
}

interface StocksExplorerPageProps {
  onSelectForTrend: (symbol: string) => void;
  onSelectForTrade: (symbol: string) => void;
  onSelectForAI?: (symbol: string) => void;
  initialSearchQuery?: string;
}

interface IndexTapeItem {
  name: string;
  val: string;
  chg: string;
  positive: boolean;
}

/** A shelf row: only ever built from a live quote. */
interface ShelfStock {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
}
const SHELF_EMPTY = "Live movers appear when the market feed is available.";

// Index strip: real quotes only. "—" until the feed answers, and again whenever it does not.
const NO_INDEX_DATA: IndexTapeItem[] = ["NIFTY 50", "SENSEX", "BANK NIFTY", "NIFTY IT", "NIFTY AUTO"].map(
  (name) => ({ name, val: "—", chg: "", positive: true })
);
const sameIndex = (a: string, b: string) => a.replace(/\s+/g, "").toUpperCase() === b.replace(/\s+/g, "").toUpperCase();

// The backend prices the first 20 rows of a browse page, so a page is 20 rows: none shows "—" while the feed is up.
const PAGE_SIZE = 20;

interface ListedStockItem {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | string;
  sector: string;
  marketCapCategory: string;
  series?: string;
  listingDate?: string;
  isin?: string;
  ltp: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  week52High?: number;
  week52Low?: number;
}

export function StocksExplorerPage({
  onSelectForTrend,
  onSelectForTrade,
  onSelectForAI,
  initialSearchQuery = "",
}: StocksExplorerPageProps) {
  // Shelves state (top gainers/losers/active)
  // Built from live quotes only; empty (with a note) while connecting or offline.
  const [shelvesStocks, setShelvesStocks] = useState<ShelfStock[]>([]);

  // Paginated master catalog state (13,109+ Indian equities)
  const [stocks, setStocks] = useState<ListedStockItem[]>(
    INITIAL_INDIAN_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.symbol.endsWith(".BO") ? "BSE" : "NSE",
      sector: s.sector,
      marketCapCategory: s.marketCapCategory || "Mid Cap",
      series: "EQ",
      ltp: null, // the bundled list is a symbol directory: a price shows only once a live quote lands
      change: null,
      changePercent: null,
      volume: null,
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
  const [liveProvider, setLiveProvider] = useState<string>(CONNECTING_LABEL);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const isInitialMount = useRef(true);
  const activeRequestIdRef = useRef(0);

  const [indices, setIndices] = useState<IndexTapeItem[]>(NO_INDEX_DATA);

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
      if (!res.ok) {
        setLiveProvider(OFFLINE_LABEL);
        setIndices(NO_INDEX_DATA);
        setShelvesStocks([]);
      }
      if (res.ok) {
        const data = await res.json();
        const quotes: Array<{
          symbol: string;
          ltp: number;
          change: number;
          change_percent: number;
          volume: number;
          name?: string;
          yahoo_symbol?: string;
          status?: string;
          provider?: string;
        }> = data.quotes || [];

        setLiveProvider(feedLabel(quotes));
        if (quotes.length === 0) setIndices(NO_INDEX_DATA);
        if (quotes.length > 0) {
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
              const match = quotes.find((q) => sameIndex(q.symbol, idx.name));
              if (match && match.ltp > 0) {
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
              return { ...idx, val: "—", chg: "" };
            })
          );

          // Shelves: live stock quotes only (indices have their own strip)
          setShelvesStocks(
            quotes
              .filter((q) => isUsableQuote(q) && !q.yahoo_symbol?.startsWith("^"))
              .map((q) => ({
                symbol: q.symbol,
                name: q.name || q.symbol,
                ltp: q.ltp,
                change: q.change,
                changePercent: q.change_percent,
                volume: q.volume ?? 0,
              }))
          );
        }
      }
    } catch {
      setLiveProvider(OFFLINE_LABEL);
      setIndices(NO_INDEX_DATA);
      setShelvesStocks([]);
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
          limit: String(PAGE_SIZE),
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
                sector: item.sector || "Unclassified",
                marketCapCategory: item.marketCapCategory || "Unclassified",
                series: item.series || "EQ",
                listingDate: item.listingDate || "",
                isin: item.isin || "",
                ltp: item.ltp ?? null,
                change: item.change ?? null,
                changePercent: item.changePercent ?? null,
                volume: item.volume ?? null,
                week52High: item.week52High ?? undefined,
                week52Low: item.week52Low ?? undefined,
              }))
            );
            setTotalCount(data.total || 0);
            setTotalPages(data.totalPages || Math.ceil((data.total || 1) / PAGE_SIZE));
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
    }, 150);

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
      .filter((s) => s.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 4);
  }, [shelvesStocks]);

  const topLosers = useMemo(() => {
    return [...shelvesStocks]
      .filter((s) => s.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 3);
  }, [shelvesStocks]);

  const mostActive = useMemo(() => {
    return [...shelvesStocks]
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
            <h1>Indian Stocks & Market <span className="hero-explorer-highlight">Explorer</span></h1>
            <p className="status-copy">
              Explore all 13,000+ listed Indian companies across NSE and BSE with live quotes, official exchange masters, top market shelves, and one-click paper trade execution.
            </p>
          </div>
          <div className="live-telemetry-status-card" role="status">
            <span className={`live-telemetry-dot${isOffline(liveProvider) ? " offline" : ""}`} aria-hidden="true" />
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
          <div className="shelf-card shelf-card-gainers">
            <div className="shelf-head">
              <span className="shelf-title text-gain">Top Gainers</span>
              <span className="shelf-sub">Today's leaders</span>
            </div>
            <div className="shelf-items">
              {topGainers.length === 0 && <p className="shelf-empty">{SHELF_EMPTY}</p>}
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
                    <span className="shelf-ltp table-num">₹{stock.ltp.toFixed(2)}</span>
                    <span className="shelf-pct text-gain table-num">
                      +{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers Shelf */}
          <div className="shelf-card shelf-card-losers">
            <div className="shelf-head">
              <span className="shelf-title text-loss">Top Losers</span>
              <span className="shelf-sub">Pullback setups</span>
            </div>
            <div className="shelf-items">
              {topLosers.length === 0 && <p className="shelf-empty">{SHELF_EMPTY}</p>}
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
                    <span className="shelf-ltp table-num">₹{stock.ltp.toFixed(2)}</span>
                    <span className="shelf-pct text-loss table-num">
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Active Volume Shelf */}
          <div className="shelf-card shelf-card-active">
            <div className="shelf-head">
              <span className="shelf-title text-accent">Most Active</span>
              <span className="shelf-sub">Highest daily turnover</span>
            </div>
            <div className="shelf-items">
              {mostActive.length === 0 && <p className="shelf-empty">{SHELF_EMPTY}</p>}
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
                    <span className="shelf-ltp table-num">₹{stock.ltp.toFixed(2)}</span>
                    <span
                      className={`shelf-pct ${stock.change >= 0 ? "text-gain" : "text-loss"} table-num`}
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
                <th scope="col" className="table-num">Market Price (LTP)</th>
                <th scope="col" className="table-num">Day Change</th>
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
                  const isPositive = (stock.change ?? 0) >= 0;

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
                      <td className="table-num table-price">
                        {priceText(stock.ltp)}
                      </td>
                      <td className={`table-num table-change ${isPositive ? "text-gain" : "text-loss"}`}>
                        {stock.change == null || stock.changePercent == null
                          ? "—"
                          : `${isPositive ? "+" : ""}₹${stock.change.toFixed(2)} (${isPositive ? "+" : ""}${stock.changePercent.toFixed(2)}%)`}
                      </td>
                      <td>
                        <WeekRangeBar ltp={stock.ltp} low={stock.week52Low} high={stock.week52High} />
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
                          {onSelectForAI && (
                            <button
                              type="button"
                              className="btn-stock-ai"
                              onClick={() => onSelectForAI(stock.symbol)}
                            >
                              AI Lab
                            </button>
                          )}
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
                ({((page - 1) * PAGE_SIZE + 1).toLocaleString("en-IN")} -{" "}
                {Math.min(page * PAGE_SIZE, totalCount).toLocaleString("en-IN")} of{" "}
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
