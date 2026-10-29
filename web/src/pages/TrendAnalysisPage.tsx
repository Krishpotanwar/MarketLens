import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_INDIAN_STOCKS } from "../data/indianMarketData";
import type { StockTrendInfo } from "../types/paper";
import { CONNECTING_LABEL, feedLabel, indexText, isOffline, OFFLINE_LABEL, priceText } from "../utils/dataStatus";
import { chartTrend, rsi14 } from "../utils/indicators";

const API_BASE = import.meta.env.VITE_API_URL || "";

interface TrendAnalysisPageProps {
  onSelectForTrade: (symbol: string) => void;
  onSelectForAI?: (symbol: string) => void;
  initialSymbol?: string;
  initialScreenerSearch?: string;
}

interface ChartBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartMeta {
  currency?: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  longName?: string;
  provider?: string;
}

export function TrendAnalysisPage({
  onSelectForTrade,
  onSelectForAI,
  initialSymbol,
  initialScreenerSearch = "",
}: TrendAnalysisPageProps) {
  const [stocks, setStocks] = useState<StockTrendInfo[]>(INITIAL_INDIAN_STOCKS);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    initialSymbol?.trim().toUpperCase() || "RELIANCE"
  );
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");
  const [liveProvider, setLiveProvider] = useState<string>(CONNECTING_LABEL);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [isLiveLoading, setIsLiveLoading] = useState(false);

  // Timeframe state: 1D (5m), 5D (15m), 1M (1h), 1Y (1d)
  const [timeframe, setTimeframe] = useState<"1D" | "5D" | "1M" | "1Y">("1D");
  const [chartBars, setChartBars] = useState<ChartBar[]>([]);
  const [chartMeta, setChartMeta] = useState<ChartMeta | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Search input in screener sidebar for ANY Indian stock
  const [screenerSearch, setScreenerSearch] = useState(initialScreenerSearch);
  const [searchResults, setSearchResults] = useState<
    Array<{
      symbol: string;
      name: string;
      sector: string;
      ltp: number | null;
      change?: number | null;
      change_percent?: number | null;
      volume?: number | null;
    }>
  >([]);
  const [isSearchingScreener, setIsSearchingScreener] = useState(false);

  const activeReqIdRef = useRef(0);

  useEffect(() => {
    if (initialSymbol) {
      setSelectedSymbol(initialSymbol.trim().toUpperCase());
    }
  }, [initialSymbol]);

  // Map acronyms like IOCL -> IOC
  const normalizedSymbol = useMemo(() => {
    const s = selectedSymbol.trim().toUpperCase();
    if (s === "IOCL") return "IOC";
    if (s === "HPCL") return "HINDPETRO";
    if (s === "SBI") return "SBIN";
    if (s === "HDFC") return "HDFCBANK";
    if (s === "ICICI") return "ICICIBANK";
    if (s === "KOTAK") return "KOTAKBANK";
    if (s === "AXIS") return "AXISBANK";
    if (s === "RIL") return "RELIANCE";
    if (s === "L&T") return "LT";
    if (s === "MM") return "M&M";
    if (s === "ZUDIO") return "TRENT";
    if (s === "BLINKIT") return "ZOMATO";
    if (s === "MAZGAON" || s === "MAZAGON") return "MAZDOCK";
    return s;
  }, [selectedSymbol]);

  // Find active stock in local list or build dynamic fallback
  const activeStock = useMemo(() => {
    const found = stocks.find(
      (s) => s.symbol === normalizedSymbol || s.symbol === selectedSymbol
    );
    if (found) return found;

    if (normalizedSymbol === "IOC") {
      return {
        symbol: "IOC",
        name: "Indian Oil Corporation Limited",
        sector: "Energy & Petrochemicals",
        marketCapCategory: "Large Cap" as const,
        week52High: 188.96,
        week52Low: 124.92,
        ltp: 128.8,
        change: -0.85,
        changePercent: -0.65,
        open: 129.0,
        high: 129.02,
        low: 127.75,
        vwap: 128.4,
        volume: 13700000,
        volumeRatio: 1.15,
        rsi14: 42.6,
        sma20: 131.5,
        sma50: 138.2,
        trend5m: "BEARISH" as const,
        trend15m: "BEARISH" as const,
        trend1h: "NEUTRAL" as const,
        trend1d: "BEARISH" as const,
        priceHistory: [129.5, 129.2, 128.8, 128.8],
      };
    }

    // Neutral profile for external assets preventing IOC metric leakage
    return {
      symbol: normalizedSymbol,
      name: `${normalizedSymbol} (NSE Listed)`,
      sector: "Indian Equities",
      marketCapCategory: "Mid Cap" as const,
      week52High: 0,
      week52Low: 0,
      ltp: 0,
      change: 0,
      changePercent: 0,
      open: 0,
      high: 0,
      low: 0,
      vwap: 0,
      volume: 0,
      volumeRatio: 1.0,
      rsi14: 50.0,
      sma20: 0,
      sma50: 0,
      trend5m: "NEUTRAL" as const,
      trend15m: "NEUTRAL" as const,
      trend1h: "NEUTRAL" as const,
      trend1d: "NEUTRAL" as const,
      priceHistory: [0],
    };
  }, [stocks, normalizedSymbol, selectedSymbol]);

  // Fetch live market quotes for watchlist
  const fetchLiveQuotes = useCallback(async () => {
    setIsLiveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/market/quotes`);
      if (!res.ok) setLiveProvider(OFFLINE_LABEL);
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

        setLiveProvider(feedLabel(quotes));
        if (quotes.length > 0) {
          setLastSyncTime(
            new Date().toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );

          setStocks((prev) =>
            prev.map((s) => {
              const match = quotes.find(
                (q) => q.symbol === s.symbol || (s.symbol === "IOC" && q.symbol === "IOCL")
              );
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
      setLiveProvider(OFFLINE_LABEL);
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // Fetch real live intraday chart bars and deep quote from exchange
  const fetchRealLiveChart = useCallback(
    async (sym: string, tf: "1D" | "5D" | "1M" | "1Y") => {
      const reqId = ++activeReqIdRef.current;
      setIsChartLoading(true);

      const paramsMap = {
        "1D": { interval: "5m", range: "1d" },
        "5D": { interval: "15m", range: "5d" },
        "1M": { interval: "60m", range: "1mo" },
        "1Y": { interval: "1d", range: "1y" },
      };
      const { interval, range } = paramsMap[tf];

      setIsChartLoading(true);
      setChartError(false);
      try {
        const [chartRes, quoteRes] = await Promise.all([
          fetch(
            `${API_BASE}/api/v1/market/chart/${encodeURIComponent(sym)}?interval=${interval}&range=${range}`
          ),
          fetch(`${API_BASE}/api/v1/market/quote/${encodeURIComponent(sym)}`),
        ]);

        if (reqId !== activeReqIdRef.current) return;

        let liveQuoteData: any = null;
        if (quoteRes.ok) {
          liveQuoteData = await quoteRes.json();
          if (liveQuoteData && liveQuoteData.ltp > 0) {
            setStocks((prev) => {
              const exists = prev.some((s) => s.symbol === liveQuoteData.symbol);
              if (exists) {
                return prev.map((s) =>
                  s.symbol === liveQuoteData.symbol
                    ? {
                        ...s,
                        name: liveQuoteData.name || s.name,
                        ltp: liveQuoteData.ltp,
                        change: liveQuoteData.change,
                        changePercent: liveQuoteData.change_percent,
                        open: liveQuoteData.open || s.open,
                        high: liveQuoteData.high || s.high,
                        low: liveQuoteData.low || s.low,
                        week52High: liveQuoteData.week52_high || s.week52High,
                        week52Low: liveQuoteData.week52_low || s.week52Low,
                        volume: liveQuoteData.volume || s.volume,
                      }
                    : s
                );
              } else {
                return [
                  {
                    symbol: liveQuoteData.symbol,
                    name: liveQuoteData.name || `${liveQuoteData.symbol} Listed`,
                    sector: "Indian Equities",
                    marketCapCategory: "Mid Cap" as const,
                    week52High: liveQuoteData.week52_high ?? 0,
                    week52Low: liveQuoteData.week52_low ?? 0,
                    ltp: liveQuoteData.ltp,
                    change: liveQuoteData.change,
                    changePercent: liveQuoteData.change_percent,
                    open: liveQuoteData.open ?? 0,
                    high: liveQuoteData.high ?? 0,
                    low: liveQuoteData.low ?? 0,
                    volume: liveQuoteData.volume ?? 0,
                    // Not shown: RSI, SMAs and trend are computed from the chart bars. The feed has no values for these.
                    vwap: 0,
                    volumeRatio: 0,
                    rsi14: 0,
                    sma20: 0,
                    sma50: 0,
                    trend5m: "NEUTRAL",
                    trend15m: "NEUTRAL",
                    trend1h: "NEUTRAL",
                    trend1d: "NEUTRAL",
                    priceHistory: [],
                  },
                  ...prev,
                ];
              }
            });
          }
        }

        if (chartRes.ok) {
          const chartData = await chartRes.json();
          if (reqId !== activeReqIdRef.current) return;

          if (Array.isArray(chartData.bars) && chartData.bars.length > 0) {
            setChartBars(chartData.bars);
            setChartMeta(chartData.meta || null);
          } else {
            // No price history from the feed: say so. A line drawn up from the last price is not a chart.
            setChartBars([]);
            setChartMeta(null);
            setChartError(true);
          }
        } else {
          setChartBars([]); // never leave the previous symbol's candles under this symbol's name
          setChartMeta(null);
          setChartError(true);
        }
      } catch {
        if (reqId === activeReqIdRef.current) {
          setChartError(true);
        }
      } finally {
        if (reqId === activeReqIdRef.current) {
          setIsChartLoading(false);
        }
      }
    },
    [activeStock.ltp]
  );

  // Trigger chart fetch when symbol or timeframe changes
  useEffect(() => {
    fetchRealLiveChart(normalizedSymbol, timeframe);
    const interval = setInterval(() => {
      fetchRealLiveChart(normalizedSymbol, timeframe);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRealLiveChart, normalizedSymbol, timeframe]);

  // Initial quotes
  useEffect(() => {
    fetchLiveQuotes();
    const interval = setInterval(fetchLiveQuotes, 15000);
    return () => clearInterval(interval);
  }, [fetchLiveQuotes]);

  // Screener live search for ANY Indian stock
  useEffect(() => {
    const q = screenerSearch.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearchingScreener(false);
      return;
    }

    let isMounted = true;
    setIsSearchingScreener(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/market/search?q=${encodeURIComponent(q)}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsSearchingScreener(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [screenerSearch]);

  const sectors = [
    "ALL",
    "Index",
    "Energy & Petrochemicals",
    "Information Tech",
    "Banking",
    "Defence",
    "Automobile",
  ];

  const filteredStocks = useMemo(() => {
    let list = stocks;
    if (sectorFilter !== "ALL") {
      list = list.filter((s) => s.sector.toLowerCase().includes(sectorFilter.toLowerCase()));
    }
    const q = screenerSearch.trim().toLowerCase();
    if (q) {
      const qBare = q.replace(/\.(bo|ns)$/, "");
      const acronymMap: Record<string, string> = {
        iocl: "ioc",
        ioc: "ioc",
        hpcl: "hindpetro",
        sbi: "sbin",
        sbin: "sbin",
        hdfc: "hdfcbank",
        icici: "icicibank",
        ril: "reliance",
        "l&t": "lt",
        lt: "lt",
        zudio: "trent",
        westside: "trent",
        blinkit: "zomato",
        eternal: "zomato",
        mazgaon: "mazdock",
        mazagon: "mazdock",
        stellant: "stellant.bo",
        tatamotors: "tatamotors",
        tmcv: "tatamotors",
        tmpv: "tatamotors",
      };
      const targetSym = acronymMap[q] || acronymMap[qBare];

      list = list.filter((s) => {
        const sym = s.symbol.toLowerCase();
        const symBare = sym.replace(/\.(bo|ns)$/, "");
        const name = s.name.toLowerCase();
        const alias = (s.aliases || "").toLowerCase();

        if (targetSym && (sym === targetSym || symBare === targetSym)) return true;
        if (sym === q || symBare === qBare) return true;
        if (sym.includes(qBare)) return true;
        if (name.includes(qBare)) return true;
        if (alias.includes(qBare)) return true;
        return false;
      });
    }
    return list;
  }, [stocks, sectorFilter, screenerSearch]);

  // Combined watchlist including any live search hits
  const combinedScreenerStocks = useMemo(() => {
    if (searchResults.length === 0) return filteredStocks;
    const existing = new Set(filteredStocks.map((s) => s.symbol.toUpperCase()));
    const extra: StockTrendInfo[] = [];
    for (const sr of searchResults) {
      const symUpper = sr.symbol.toUpperCase();
      if (!existing.has(symUpper)) {
        existing.add(symUpper);
        extra.push({
          symbol: sr.symbol,
          name: sr.name,
          sector: sr.sector || "Indian Equities",
          marketCapCategory: "Mid Cap",
          ltp: sr.ltp ?? 0,
          change: sr.change ?? 0,
          changePercent: sr.change_percent ?? 0,
          open: 0,
          high: 0,
          low: 0,
          vwap: 0,
          volume: sr.volume ?? 0,
          volumeRatio: 0,
          rsi14: 0,
          sma20: 0,
          sma50: 0,
          trend5m: "NEUTRAL",
          trend15m: "NEUTRAL",
          trend1h: "NEUTRAL",
          trend1d: "NEUTRAL",
          priceHistory: [],
        });
      }
    }
    return [...filteredStocks, ...extra];
  }, [filteredStocks, searchResults]);

  const advances = stocks.filter((s) => s.change >= 0).length;
  const declines = stocks.filter((s) => s.change < 0).length;

  // Chart computation metrics
  // Indicators come from the bars on screen; null (shown as "—") until there are enough of them.
  const barCloses = useMemo(() => chartBars.map((b) => b.close), [chartBars]);
  const rsi = useMemo(() => rsi14(barCloses), [barCloses]);
  const trend = useMemo(() => chartTrend(barCloses), [barCloses]);

  const chartDataSummary = useMemo(() => {
    if (chartBars.length === 0) {
      return {
        points: "",
        minPrice: 0,
        maxPrice: 100,
        span: 100,
        sma20Points: "",
        sma50Points: "",
        prevCloseY: 80,
        prevCloseVal: 0,
        isPositive: activeStock.change >= 0,
      };
    }

    const closes = chartBars.map((b) => b.close);
    const prevCloseVal = chartMeta?.chartPreviousClose || closes[0];
    const minVal = Math.min(...closes, prevCloseVal) * 0.998;
    const maxVal = Math.max(...closes, prevCloseVal) * 1.002;
    const span = maxVal - minVal || 1;

    // SVG coordinates: 700 width, 160 height for price area (y: 15 to 145)
    const getX = (i: number) => (i / Math.max(1, chartBars.length - 1)) * 620 + 15;
    const getY = (val: number) => 145 - ((val - minVal) / span) * 130;

    const points = chartBars.map((b, i) => `${getX(i).toFixed(1)},${getY(b.close).toFixed(1)}`).join(" ");

    // SMA 20 Overlay points
    const sma20Points = chartBars
      .map((_, i) => {
        if (i < 5) return null;
        const windowSlice = closes.slice(Math.max(0, i - 19), i + 1);
        const avg = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
        return `${getX(i).toFixed(1)},${getY(avg).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");

    // SMA 50 Overlay points
    const sma50Points = chartBars
      .map((_, i) => {
        if (i < 10) return null;
        const windowSlice = closes.slice(Math.max(0, i - 49), i + 1);
        const avg = windowSlice.reduce((a, b) => a + b, 0) / windowSlice.length;
        return `${getX(i).toFixed(1)},${getY(avg).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");

    const prevCloseY = getY(prevCloseVal);
    const lastClose = closes[closes.length - 1];
    const isPositive = lastClose >= prevCloseVal;

    return {
      points,
      minPrice: minVal,
      maxPrice: maxVal,
      span,
      sma20Points,
      sma50Points,
      prevCloseY,
      prevCloseVal,
      isPositive,
      getX,
      getY,
    };
  }, [chartBars, chartMeta, activeStock.change]);

  // Max volume for volume histogram
  const maxVolume = useMemo(() => {
    return Math.max(1, ...chartBars.map((b) => b.volume));
  }, [chartBars]);

  // Hovered bar info
  const hoveredBar = useMemo(() => {
    if (hoverIndex === null || hoverIndex < 0 || hoverIndex >= chartBars.length) return null;
    return chartBars[hoverIndex];
  }, [hoverIndex, chartBars]);

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <div className="page-header-split">
          <div>
            <h1>Indian Stock Market Trends & Signals</h1>
            <p className="status-copy">
              Exchange candlestick charts (1D to 1Y) with SMA overlays and RSI readouts computed from the candles, for NSE & BSE listed equities. Prices come from an unofficial Yahoo Finance feed and may be delayed.
            </p>
          </div>
          <div className="live-telemetry-status-card" role="status">
            <span className={`live-telemetry-dot${isOffline(liveProvider) && !chartMeta?.provider ? " offline" : ""}`} aria-hidden="true" />
            <div className="live-telemetry-info">
              <span className="live-telemetry-provider">
                {chartMeta?.provider || liveProvider}
              </span>
              {lastSyncTime && (
                <span className="live-telemetry-time">Live feed synced at {lastSyncTime}</span>
              )}
            </div>
            <button
              type="button"
              className="live-sync-btn"
              onClick={() => {
                fetchLiveQuotes();
                fetchRealLiveChart(normalizedSymbol, timeframe);
              }}
              disabled={isLiveLoading || isChartLoading}
              aria-label="Refresh live quotes"
            >
              {isLiveLoading || isChartLoading ? "Syncing..." : "↻ Refresh Live Feed"}
            </button>
          </div>
        </div>
      </header>

      {/* Market Breadth Strip */}
      <section className="market-breadth-strip" aria-label="NSE Market Breadth">
        <div className="breadth-item">
          <span className="breadth-label">NSE Session</span>
          <span className="breadth-val status-live">09:15 - 15:30 IST</span>
        </div>
        <div className="breadth-item">
          <span className="breadth-label">Nifty 50</span>
          <span className="breadth-val">{indexText(stocks, "NIFTY 50", isOffline(liveProvider))}</span>
        </div>
        <div className="breadth-item">
          <span className="breadth-label">Bank Nifty</span>
          <span className="breadth-val">{indexText(stocks, "BANKNIFTY", isOffline(liveProvider))}</span>
        </div>
        <div className="breadth-item">
          <span className="breadth-label">Active Stock</span>
          <span className="breadth-val text-accent">
            {activeStock.symbol} (₹{activeStock.ltp.toFixed(2)})
          </span>
        </div>
        <div className="breadth-item">
          <span className="breadth-label">Market Breadth</span>
          <span className="breadth-val">
            <span className="text-gain">{advances} Adv</span> /{" "}
            <span className="text-loss">{declines} Dec</span>
          </span>
        </div>
      </section>

      {/* Sector Filter Bar */}
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
        {/* Left Column: Screener & Search Panel */}
        <section className="screener-panel" aria-label="Watchlist & Screener">
          <div className="screener-header-row">
            <h2 className="panel-title">NSE Liquid Equities</h2>
            <span className="screener-count">{combinedScreenerStocks.length} Stocks</span>
          </div>

          {/* Quick Search inside Screener */}
          <div className="screener-search-box">
            <input
              type="search"
              placeholder="Search ANY stock (e.g. IOC, IOCL, Mazdock)..."
              value={screenerSearch}
              onChange={(e) => setScreenerSearch(e.target.value)}
              className="screener-search-input"
              aria-label="Search stock in screener"
            />
            {isSearchingScreener && <span className="search-live-status-pill">Searching...</span>}
          </div>

          {/* Search suggestions dropdown if query is present */}
          {searchResults.length > 0 && (
            <div className="screener-search-dropdown" role="listbox">
              <span className="dropdown-label">Search Results:</span>
              {searchResults.map((sr) => (
                <button
                  key={sr.symbol}
                  type="button"
                  className="screener-search-result-btn"
                  onClick={() => {
                    setSelectedSymbol(sr.symbol);
                    setScreenerSearch("");
                    setSearchResults([]);
                  }}
                >
                  <div className="search-res-info">
                    <strong>{sr.symbol}</strong>
                    <span className="search-res-name">{sr.name}</span>
                  </div>
                  <span className="search-res-price">{priceText(sr.ltp)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="screener-list" role="listbox" aria-label="Stock screener">
            {combinedScreenerStocks.map((stock) => {
              const isSelected =
                stock.symbol === activeStock.symbol ||
                stock.symbol === selectedSymbol ||
                (stock.symbol === "IOC" && selectedSymbol === "IOCL");
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
                    <span className="screener-ltp table-num">
                      {stock.ltp > 0 ? `₹${stock.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                    </span>
                    <span className={`screener-chg table-num ${isPositive ? "text-gain" : "text-loss"}`}>
                      {stock.ltp > 0 ? `${isPositive ? "+" : ""}${stock.changePercent.toFixed(2)}%` : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Column: Live Chart & Deep-Dive Trend Matrix */}
        <section className="analysis-panel" aria-label="Stock Trend Analysis">
          <div className="analysis-header">
            <div>
              <div className="symbol-row">
                <h2>{activeStock.symbol}</h2>
                <span className="exchange-badge-nse">{activeStock.symbol.endsWith(".BO") ? "BSE" : "NSE"}</span>
                <span className="sector-tag">{activeStock.sector}</span>
              </div>
              <p className="stock-subtitle">{activeStock.name}</p>
            </div>

            <div className="price-badge-block">
              <span className="active-ltp">
                ₹{activeStock.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`active-chg ${activeStock.change >= 0 ? "text-gain" : "text-loss"}`}
              >
                {activeStock.change >= 0 ? "+" : ""}₹{activeStock.change.toFixed(2)} (
                {activeStock.change >= 0 ? "+" : ""}
                {activeStock.changePercent.toFixed(2)}%)
              </span>
            </div>

            <div className="stock-action-group">
              <button
                type="button"
                className="btn-stock-trade"
                onClick={() => onSelectForTrade(activeStock.symbol)}
              >
                Trade
              </button>
              {onSelectForAI && (
                <button
                  type="button"
                  className="btn-stock-ai"
                  onClick={() => onSelectForAI(activeStock.symbol)}
                >
                  AI Strategy
                </button>
              )}
            </div>
          </div>

          {/* Interactive Live Graph Header: Timeframes & Legend */}
          <div className="chart-wrapper" aria-label="Live Exchange Candlestick Chart">
            <div className="chart-header">
              <div className="chart-title-group">
                <span className="chart-title">
                  Live Exchange Price Action ({timeframe}) — {activeStock.symbol}
                </span>
                {isChartLoading && (
                  <span className="chart-live-pulse">Updating live candles...</span>
                )}
              </div>

              {/* Timeframe Selector (1D, 5D, 1M, 1Y) */}
              <div className="chart-timeframe-selector" role="tablist" aria-label="Timeframe">
                {(["1D", "5D", "1M", "1Y"] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    role="tab"
                    aria-selected={timeframe === tf}
                    className={`tf-btn ${timeframe === tf ? "active" : ""}`}
                    onClick={() => {
                      setTimeframe(tf);
                      setHoverIndex(null);
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-dot dot-price" /> Price
                </span>
                <span className="legend-item">
                  <span className="legend-dot dot-sma20" /> 20 SMA
                </span>
                <span className="legend-item">
                  <span className="legend-dot dot-sma50" /> 50 SMA
                </span>
                <span className="legend-item">
                  <span className="legend-dot dot-prev" /> Prev Close
                </span>
              </div>
            </div>

            {/* Hover Tooltip Overlay */}
            {hoveredBar ? (
              <div className="chart-hover-tooltip" role="status">
                <span className="hover-time">
                  {new Date(hoveredBar.timestamp * 1000).toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="hover-price">₹{hoveredBar.close.toFixed(2)}</span>
                <span className="hover-sub">
                  O: ₹{hoveredBar.open.toFixed(2)} | H: ₹{hoveredBar.high.toFixed(2)} | L: ₹
                  {hoveredBar.low.toFixed(2)} | C: ₹{hoveredBar.close.toFixed(2)} | Vol:{" "}
                  {(hoveredBar.volume / 1000).toFixed(1)}k
                </span>
              </div>
            ) : chartBars.length > 0 ? (
              <div className="chart-hover-tooltip chart-hover-tooltip-idle" role="status">
                <span className="hover-time">
                  {new Date(chartBars[chartBars.length - 1].timestamp * 1000).toLocaleString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="hover-price">
                  ₹{chartBars[chartBars.length - 1].close.toFixed(2)}
                </span>
                <span className="hover-sub">
                  O: ₹{chartBars[chartBars.length - 1].open.toFixed(2)} | H: ₹
                  {chartBars[chartBars.length - 1].high.toFixed(2)} | L: ₹
                  {chartBars[chartBars.length - 1].low.toFixed(2)} | C: ₹
                  {chartBars[chartBars.length - 1].close.toFixed(2)} | Vol:{" "}
                  {(chartBars[chartBars.length - 1].volume / 1000).toFixed(1)}k
                </span>
              </div>
            ) : null}

            {/* Chart Error Banner */}
            {chartError && (
              <div className="chart-error-banner" role="alert">
                <span>No live price history for {activeStock.symbol} from the market feed.</span>
                <button
                  type="button"
                  className="chart-retry-btn"
                  onClick={() => fetchRealLiveChart(normalizedSymbol, timeframe)}
                >
                  ↻ Retry
                </button>
              </div>
            )}

            {/* Live SVG Price & Volume Chart */}
            <svg
              className="trend-svg"
              viewBox="0 0 700 210"
              preserveAspectRatio="none"
              onMouseMove={(e) => {
                if (chartBars.length === 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                if (rect.width <= 0) return;
                const xPos = e.clientX - rect.left;
                const svgX = (xPos / rect.width) * 700;
                const ratio = Math.max(0, Math.min(1, (svgX - 15) / 620));
                const idx = Math.max(
                  0,
                  Math.min(chartBars.length - 1, Math.round(ratio * (chartBars.length - 1)))
                );
                setHoverIndex(idx);
              }}
              onMouseEnter={(e) => {
                if (chartBars.length === 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                if (rect.width <= 0) return;
                const xPos = e.clientX - rect.left;
                const svgX = (xPos / rect.width) * 700;
                const ratio = Math.max(0, Math.min(1, (svgX - 15) / 620));
                const idx = Math.max(
                  0,
                  Math.min(chartBars.length - 1, Math.round(ratio * (chartBars.length - 1)))
                );
                setHoverIndex(idx);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#388bfd" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#388bfd" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#388bfd" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#388bfd" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#388bfd" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#388bfd" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Waveform Skeleton Loader when Chart Bars is Empty */}
              {chartBars.length === 0 && (
                <g className="chart-skeleton-wave">
                  <path
                    d="M 15 110 Q 90 70, 175 115 T 335 100 T 495 125 T 635 95"
                    fill="none"
                    stroke="#21262d"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="skeleton-wave-line"
                  />
                  <text
                    x="325"
                    y="115"
                    textAnchor="middle"
                    fill="#6e7681"
                    fontSize="12"
                    fontFamily="var(--font-interface)"
                  >
                    Loading live exchange candles from BSE/NSE...
                  </text>
                </g>
              )}

              {/* Previous Close Horizontal Baseline */}
              {chartDataSummary.prevCloseVal > 0 && (
                <g className="prev-close-line-group">
                  <line
                    x1="15"
                    y1={chartDataSummary.prevCloseY}
                    x2="635"
                    y2={chartDataSummary.prevCloseY}
                    stroke="#30363d"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="640"
                    y={chartDataSummary.prevCloseY + 4}
                    fill="#8b949e"
                    fontSize="10"
                    fontFamily="var(--font-figures)"
                  >
                    ₹{chartDataSummary.prevCloseVal.toFixed(1)}
                  </text>
                </g>
              )}

              {/* Area Gradient Under Price Line */}
              {chartBars.length > 1 && (
                <polygon
                  fill="url(#priceGradient)"
                  points={`15,165 ${chartDataSummary.points} 635,165`}
                />
              )}

              {/* Real Live Price Line */}
              {chartDataSummary.points && (
                <polyline
                  fill="none"
                  stroke="#388bfd"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={chartDataSummary.points}
                />
              )}

              {/* 20 SMA Overlay */}
              {chartDataSummary.sma20Points && (
                <polyline
                  fill="none"
                  stroke="#d29922"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                  points={chartDataSummary.sma20Points}
                />
              )}

              {/* 50 SMA Overlay */}
              {chartDataSummary.sma50Points && (
                <polyline
                  fill="none"
                  stroke="#58a6ff"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  points={chartDataSummary.sma50Points}
                />
              )}

              {/* Volume Bars at Bottom (y: 175 to 205) */}
              {chartBars.map((b, i) => {
                const x = (i / Math.max(1, chartBars.length - 1)) * 620 + 15;
                const vHeight = Math.max(2, (b.volume / maxVolume) * 28);
                const isGreen = b.close >= b.open;
                const isHovered = hoverIndex === i;
                return (
                  <g key={`${b.timestamp}-${i}`} className="volume-bar-item">
                    {/* Flat muted base bar */}
                    <rect
                      x={x - 1.5}
                      y={205 - vHeight}
                      width={3}
                      height={vHeight}
                      fill="#21262d"
                    />
                    {/* Directional tint overlay */}
                    <rect
                      x={x - 1.5}
                      y={205 - vHeight}
                      width={3}
                      height={vHeight}
                      fill={isGreen ? "#3fb950" : "#f85149"}
                      opacity={isHovered ? 0.9 : 0.55}
                    />
                  </g>
                );
              })}

              {/* Hover Cursor Guideline and Indicator Point */}
              {hoverIndex !== null && chartBars[hoverIndex] && (
                <g className="hover-cursor-group">
                  {/* Vertical Crosshair Line: 1px dashed #8b949e */}
                  <line
                    x1={(hoverIndex / Math.max(1, chartBars.length - 1)) * 620 + 15}
                    y1="15"
                    x2={(hoverIndex / Math.max(1, chartBars.length - 1)) * 620 + 15}
                    y2="205"
                    stroke="#8b949e"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Horizontal Crosshair Line: 1px dashed #8b949e */}
                  <line
                    x1="15"
                    y1={chartDataSummary.getY?.(chartBars[hoverIndex].close) ?? 80}
                    x2="635"
                    y2={chartDataSummary.getY?.(chartBars[hoverIndex].close) ?? 80}
                    stroke="#8b949e"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* Indicator Point at Intersection */}
                  <circle
                    cx={(hoverIndex / Math.max(1, chartBars.length - 1)) * 620 + 15}
                    cy={chartDataSummary.getY?.(chartBars[hoverIndex].close) ?? 80}
                    r="3.5"
                    fill="#388bfd"
                    stroke="#0d1117"
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Key Intraday Stats Grid from Live Telemetry */}
          <div className="mini-stats-grid">
            <div className="mini-stat">
              <span className="stat-label">Day Open</span>
              <span className="stat-val">
                {priceText(activeStock.open > 0 ? activeStock.open : null)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Day High</span>
              <span className="stat-val">
                {priceText(activeStock.high > 0 ? activeStock.high : null)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Day Low</span>
              <span className="stat-val">
                {priceText(activeStock.low > 0 ? activeStock.low : null)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">52-Week High</span>
              <span className="stat-val">
                {priceText(chartMeta?.fiftyTwoWeekHigh || activeStock.week52High || null)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">52-Week Low</span>
              <span className="stat-val">
                {priceText(chartMeta?.fiftyTwoWeekLow || activeStock.week52Low || null)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">RSI (14)</span>
              <span className={`stat-val ${rsi === null ? "" : rsi > 70 ? "text-loss" : rsi < 35 ? "text-gain" : ""}`}>
                {rsi === null ? "—" : rsi.toFixed(1)}
              </span>
            </div>
            <div className="mini-stat">
              <span className="stat-label">Volume</span>
              <span className="stat-val text-accent">
                {activeStock.volume ? `${(activeStock.volume / 1000000).toFixed(2)}M` : "—"}
              </span>
            </div>
          </div>

          {/* Trend of the chart on screen: last close against its 20/50 SMAs. One series supports one verdict. */}
          <div className="timeframe-matrix-block">
            <h3>Trend on this chart</h3>
            <div className="timeframe-grid">
              <div className="tf-card">
                <span className="tf-label">Last close vs 20/50 SMA ({timeframe})</span>
                <span className={`tf-pill status-${(trend ?? "neutral").toLowerCase()}`}>{trend ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs. No per-stock forecast is shown: nothing here is evaluated. */}
          <div className="prediction-studio-block">
            <div className="prediction-head">
              <h3>Signals</h3>
            </div>
            <p className="status-copy">
              MarketLens publishes no per-stock forecast. The only evaluated forecast is the research run in
              Forecast Lab, scored against a base-rate baseline. Use the AI Strategy Lab to explore scenarios.
            </p>

            {/* Simulated Actions: Paper Trade & AI Strategy Lab */}
            <div className="trend-action-button-row">
              <button
                type="button"
                className="btn-paper-trade"
                onClick={() => onSelectForTrade(activeStock.symbol)}
              >
                ⚡ Test Signal in Paper Trading Terminal &rarr;
              </button>
              {onSelectForAI && (
                <button
                  type="button"
                  className="btn-ai-strategy-cta"
                  onClick={() => onSelectForAI(activeStock.symbol)}
                >
                  🤖 Run Institutional AI Strategy on {activeStock.symbol} &rarr;
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
