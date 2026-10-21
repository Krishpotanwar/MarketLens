import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const [selectedCap, setSelectedCap] = useState<string>("ALL");
  const [results, setResults] = useState<SearchResultItem[]>(TRENDING_STOCKS);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Ctrl+K or Cmd+K to open search modal, Esc to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        modalInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

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
    }, 200);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  function handleAction(symbol: string, action: "trade" | "ai" | "trends" | "stocks") {
    setIsOpen(false);
    setQuery("");
    onSelectStock(symbol, action);
  }

  const filteredResults = useMemo(() => {
    if (selectedCap === "ALL") return results;
    return results.filter((r) => r.marketCapCategory === selectedCap);
  }, [results, selectedCap]);

  return (
    <div className="global-search-container">
      {/* Sleek Header Trigger Bar (Groww & Angel One Style) */}
      <div
        className={`global-search-bar ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setIsOpen(true);
          }
        }}
        aria-label="Universal stock search (like Groww / Angel One)"
      >
        <span className="global-search-icon" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          readOnly
          className="global-search-input"
          placeholder="Search stocks, mutual funds, indices..."
          value={query}
          tabIndex={-1}
          aria-label="Universal stock search input"
        />
        <kbd className="global-search-shortcut" title="Press Ctrl+K or Cmd+K to search">
          ⌘K
        </kbd>
      </div>

      {/* Institutional Command Palette Modal Backdrop */}
      {isOpen && (
        <div
          className="global-search-backdrop"
          onClick={() => setIsOpen(false)}
          role="presentation"
        >
          <div
            className="global-search-modal global-search-dropdown"
            role="dialog"
            aria-modal="true"
            aria-label="Stock Search Results"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Input Row */}
            <div className="modal-search-input-row">
              <span className="modal-search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                ref={modalInputRef}
                type="text"
                className="modal-search-field"
                placeholder="Search ANY Indian stock symbol or company (e.g. Zomato, Reliance, Dixon, TCS)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Universal stock search (like Groww / Angel One)"
              />
              {query && (
                <button
                  type="button"
                  className="modal-search-clear-btn"
                  onClick={() => setQuery("")}
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
              <kbd className="modal-esc-key" onClick={() => setIsOpen(false)} title="Close (Esc)">
                ESC
              </kbd>
            </div>

            {/* Quick Filter Categories Bar */}
            <div className="global-search-header">
              <div className="modal-category-pills">
                {["ALL", "Large Cap", "Mid Cap", "Small Cap"].map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    className={`modal-filter-pill ${selectedCap === cap ? "active" : ""}`}
                    onClick={() => setSelectedCap(cap)}
                  >
                    {cap === "ALL" ? "All Equities" : cap}
                  </button>
                ))}
              </div>
              <div className="modal-header-right">
                {isSearching ? (
                  <span className="global-search-loading">Searching live...</span>
                ) : (
                  <span className="modal-results-count">
                    {query ? `Results for "${query}"` : "Trending on NSE & BSE"}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Results List */}
            <div className="global-search-list">
              {filteredResults.length === 0 ? (
                <div className="global-search-empty">
                  No Indian equities or indices found matching "{query}". Try searching by ticker like
                  RELIANCE, ZOMATO, TATASTEEL, or DIXON.
                </div>
              ) : (
                filteredResults.map((item) => {
                  const isPositive = item.change >= 0;
                  return (
                    <div
                      key={item.symbol}
                      className="global-search-item"
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

            {/* Modal Legend Footer */}
            <div className="modal-search-footer">
              <div className="footer-keys">
                <span><kbd>↵</kbd> Explore Stock</span>
                <span><kbd>⚡ Trade</kbd> Paper Trading</span>
                <span><kbd>🤖 AI</kbd> Timeline Simulation</span>
              </div>
              <span className="footer-telemetry-tag">● Live AMFI / NSE Telemetry</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
