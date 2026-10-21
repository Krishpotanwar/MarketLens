import { useCallback, useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface SearchResultItem {
  symbol: string;
  name: string;
  sector: string;
  marketCapCategory: string;
  ltp: number;
  change: number;
  change_percent: number;
  provider?: string;
}

const TRENDING_STOCKS: SearchResultItem[] = [
  {
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    sector: "Energy & Retail",
    marketCapCategory: "Large Cap",
    ltp: 2985.4,
    change: 32.5,
    change_percent: 1.1,
  },
  {
    symbol: "ZOMATO",
    name: "Zomato Ltd (Eternal)",
    sector: "Consumer Tech",
    marketCapCategory: "Large Cap",
    ltp: 264.8,
    change: 4.8,
    change_percent: 1.85,
  },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services Ltd",
    sector: "Information Tech",
    marketCapCategory: "Large Cap",
    ltp: 4120.0,
    change: -18.4,
    change_percent: -0.44,
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank Ltd",
    sector: "Banking",
    marketCapCategory: "Large Cap",
    ltp: 1680.5,
    change: 14.2,
    change_percent: 0.85,
  },
  {
    symbol: "DIXON",
    name: "Dixon Technologies Ltd",
    sector: "Electronics Manufacturing",
    marketCapCategory: "Mid Cap",
    ltp: 12450.0,
    change: 280.0,
    change_percent: 2.3,
  },
  {
    symbol: "SUZLON",
    name: "Suzlon Energy Ltd",
    sector: "Renewable Energy",
    marketCapCategory: "Mid Cap",
    ltp: 68.4,
    change: 2.1,
    change_percent: 3.17,
  },
];

interface GlobalSearchBarProps {
  onSelectStock: (symbol: string, action: "trade" | "ai" | "trends" | "stocks") => void;
}

export function GlobalSearchBar({ onSelectStock }: GlobalSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>(TRENDING_STOCKS);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Ctrl+K or Cmd+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Debounced search query
  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults(TRENDING_STOCKS);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/market/search?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        const apiResults = data.results || [];
        if (apiResults.length > 0) {
          setResults(apiResults);
        } else {
          // Heuristic fallback matching local symbols
          const filtered = TRENDING_STOCKS.filter(
            (s) =>
              s.symbol.toLowerCase().includes(trimmed.toLowerCase()) ||
              s.name.toLowerCase().includes(trimmed.toLowerCase()) ||
              s.sector.toLowerCase().includes(trimmed.toLowerCase())
          );
          setResults(filtered);
        }
      }
    } catch {
      // Local fallback on network error
      const filtered = TRENDING_STOCKS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(trimmed.toLowerCase()) ||
          s.name.toLowerCase().includes(trimmed.toLowerCase())
      );
      setResults(filtered);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setResults(TRENDING_STOCKS);
      return;
    }
    const timer = setTimeout(() => {
      performSearch(query);
    }, 220);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  function handleAction(symbol: string, action: "trade" | "ai" | "trends" | "stocks") {
    setIsOpen(false);
    setQuery("");
    onSelectStock(symbol, action);
  }

  return (
    <div className="global-search-container" ref={containerRef}>
      <div
        className={`global-search-bar ${isOpen ? "active" : ""}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <span className="global-search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          className="global-search-input"
          placeholder="Search stocks, mutual funds, indices..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          aria-label="Universal stock search (like Groww / Angel One)"
        />
        {query ? (
          <button
            type="button"
            className="global-search-clear"
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search query"
          >
            ✕
          </button>
        ) : (
          <kbd className="global-search-shortcut" title="Press Ctrl+K or Cmd+K to search">
            ⌘K
          </kbd>
        )}
      </div>

      {isOpen && (
        <div
          className="global-search-dropdown"
          role="dialog"
          aria-label="Stock Search Results"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="global-search-header">
            <span>{query ? `Results for "${query}"` : "Trending on NSE & BSE"}</span>
            {isSearching && <span className="global-search-loading">Searching live...</span>}
            <span className="global-search-hint">Press Esc to exit</span>
          </div>

          <div className="global-search-list">
            {results.length === 0 ? (
              <div className="global-search-empty">
                No Indian equities or indices found matching "{query}". Try searching by ticker like
                RELIANCE, ZOMATO, TATASTEEL, or DIXON.
              </div>
            ) : (
              results.map((item) => {
                const isPositive = item.change >= 0;
                return (
                  <div
                    key={item.symbol}
                    className="global-search-item"
                    onMouseDown={() => handleAction(item.symbol, "stocks")}
                    onClick={() => handleAction(item.symbol, "stocks")}
                  >
                    <div className="global-search-item-main">
                      <div className="global-search-item-symbol-row">
                        <span className="global-search-item-symbol">{item.symbol}</span>
                        <span className="global-search-item-cap">{item.marketCapCategory || "NSE"}</span>
                        <span className="global-search-item-sector">{item.sector}</span>
                      </div>
                      <span className="global-search-item-name">{item.name}</span>
                    </div>

                    <div className="global-search-item-right">
                      <div className="global-search-item-price-col">
                        <span className="global-search-item-price">
                          ₹{item.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`global-search-item-change ${isPositive ? "gain" : "loss"}`}>
                          {isPositive ? "+" : ""}
                          {item.change_percent.toFixed(2)}%
                        </span>
                      </div>

                      <div className="global-search-actions">
                        <button
                          type="button"
                          className="search-action-btn search-trade-btn"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleAction(item.symbol, "trade");
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item.symbol, "trade");
                          }}
                          title={`Place paper trade for ${item.symbol}`}
                        >
                          ⚡ Trade
                        </button>
                        <button
                          type="button"
                          className="search-action-btn search-ai-btn"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleAction(item.symbol, "ai");
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item.symbol, "ai");
                          }}
                          title={`Run AI Strategy Lab analysis for ${item.symbol}`}
                        >
                          🤖 AI
                        </button>
                        <button
                          type="button"
                          className="search-action-btn search-trend-btn"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleAction(item.symbol, "trends");
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(item.symbol, "trends");
                          }}
                          title={`View trend analysis for ${item.symbol}`}
                        >
                          📈 Trend
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
