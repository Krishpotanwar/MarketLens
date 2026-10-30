import { Fragment, useEffect, useState } from "react";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { isUsableQuote } from "../utils/dataStatus";
import { getMarketSessionStatus, type MarketStatus } from "../utils/marketHours";
import { API_BASE } from "../utils/apiBase";

export type PageTab =
  | "stocks"
  | "funds"
  | "ipos"
  | "ai-strategy"
  | "trends"
  | "paper"
  | "overview"
  | "forecast"
  | "receipt";

interface HeaderProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  synthetic?: boolean | null;
  darkMode?: boolean;
  onToggleTheme?: () => void;
  onSelectStock?: (symbol: string, action: "trade" | "ai" | "trends" | "stocks") => void;
}

export function Header({
  currentTab,
  onSelectTab,
  synthetic: _synthetic = true,
  darkMode = true,
  onToggleTheme,
  onSelectStock,
}: HeaderProps) {
  const [marketStatus, setMarketStatus] = useState<MarketStatus>(() =>
    getMarketSessionStatus(new Date())
  );

  useEffect(() => {
    const update = () => setMarketStatus(getMarketSessionStatus(new Date()));
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Index tape: real quotes only. Offline it shows "—", never a bundled sample level.
  const [tape, setTape] = useState<Record<string, { ltp: number; pct: number }>>({});
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/market/quotes`);
        if (!res.ok) throw new Error(`quotes ${res.status}`);
        const data = await res.json();
        const next: Record<string, { ltp: number; pct: number }> = {};
        for (const q of data.quotes ?? []) {
          if (isUsableQuote(q)) {
            const sym = q.symbol;
            const norm = sym.replace(/\s+/g, "").toUpperCase();
            next[sym] = { ltp: q.ltp, pct: q.change_percent ?? 0 };
            next[norm] = { ltp: q.ltp, pct: q.change_percent ?? 0 };
            if (norm === "NIFTY50") next["NIFTY 50"] = { ltp: q.ltp, pct: q.change_percent ?? 0 };
            if (norm === "BANKNIFTY") next["BANK NIFTY"] = { ltp: q.ltp, pct: q.change_percent ?? 0 };
          }
        }
        if (alive) setTape(next);
      } catch {
        if (alive) setTape({});
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <header className="workstation-shell" role="banner">
      {/* 44px Top Command Bar */}
      <div className="topbar command-bar">
        <div className="topbar-left">
          <a
            className="wordmark"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab("stocks");
            }}
            aria-label="MarketLens home"
          >
            <span className="wordmark-icon" aria-hidden="true">ML</span>
            <span>MarketLens</span>
          </a>
          <span
            className={`data-badge ${marketStatus.isOpen ? "live" : "closed"}`}
            role="status"
            title={`Exchange Session: ${marketStatus.message} (${marketStatus.istTimeFormatted})`}
          >
            <span className="live-dot" aria-hidden="true">●</span>
            <span>{marketStatus.isOpen ? "Market Open" : "Market Closed"}</span>
            <span className="badge-exchange-tag">(NSE/BSE)</span>
          </span>
        </div>

        <div className="topbar-center command-bar-indices">
          <div className="indices-ribbon" role="region" aria-label="Market Indices Ribbon">
            {["NIFTY 50", "SENSEX"].map((name, i) => {
              const q = tape[name] || tape[name.replace(/\s+/g, "").toUpperCase()];
              return (
                <Fragment key={name}>
                  {i > 0 && <span className="index-tape-divider" aria-hidden="true">|</span>}
                  <div className="index-tape-item">
                    <span className="index-tape-name">{name}</span>
                    <span className="index-tape-price">
                      {q ? q.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                    </span>
                    {q && (
                      <span className={`index-tape-change ${q.pct >= 0 ? "gain" : "loss"}`}>
                        {q.pct >= 0 ? "+" : ""}
                        {q.pct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>

        <div className="topbar-right">
          {onSelectStock && (
            <div className="command-search-wrap">
              <GlobalSearchBar onSelectStock={onSelectStock} activeTab={currentTab} />
            </div>
          )}
          <div className="cash-blotter" title="Virtual Capital Available">
            <span className="cash-blotter-label">CASH:</span>
            <span className="cash-blotter-value">₹10,00,000</span>
          </div>
          {onToggleTheme && (
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
            >
              {darkMode ? "Light Desk" : "Dark Terminal"}
            </button>
          )}
        </div>
      </div>

      {/* 34px Sub-Navigation Tab Strip */}
      <div className="topbar-nav-wrapper workstation-nav-wrapper">
        <nav className="topbar-nav workstation-nav" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link ${currentTab === "stocks" ? "active" : ""}`}
            onClick={() => onSelectTab("stocks")}
            aria-current={currentTab === "stocks" ? "page" : undefined}
          >
            Stocks
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "funds" ? "active" : ""}`}
            onClick={() => onSelectTab("funds")}
            aria-current={currentTab === "funds" ? "page" : undefined}
          >
            Mutual Funds
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "ipos" ? "active" : ""}`}
            onClick={() => onSelectTab("ipos")}
            aria-current={currentTab === "ipos" ? "page" : undefined}
          >
            New IPOs
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "ai-strategy" ? "active" : ""}`}
            onClick={() => onSelectTab("ai-strategy")}
            aria-current={currentTab === "ai-strategy" ? "page" : undefined}
          >
            AI Strategy Lab
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "trends" ? "active" : ""}`}
            onClick={() => onSelectTab("trends")}
            aria-current={currentTab === "trends" ? "page" : undefined}
          >
            Trends &amp; Signals
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "paper" ? "active" : ""}`}
            onClick={() => onSelectTab("paper")}
            aria-current={currentTab === "paper" ? "page" : undefined}
          >
            Paper Trading
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "overview" ? "active" : ""}`}
            onClick={() => onSelectTab("overview")}
            aria-current={currentTab === "overview" ? "page" : undefined}
          >
            Overview
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "forecast" ? "active" : ""}`}
            onClick={() => onSelectTab("forecast")}
            aria-current={currentTab === "forecast" ? "page" : undefined}
          >
            Forecast Lab
          </button>
          <button
            type="button"
            className={`nav-link ${currentTab === "receipt" ? "active" : ""}`}
            onClick={() => onSelectTab("receipt")}
            aria-current={currentTab === "receipt" ? "page" : undefined}
          >
            Run Receipt
          </button>
        </nav>
      </div>
    </header>
  );
}
