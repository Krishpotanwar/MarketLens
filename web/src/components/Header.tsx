import { GlobalSearchBar } from "./GlobalSearchBar";

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
  return (
    <header className="topbar">
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
      </div>

      {onSelectStock && (
        <div className="topbar-center">
          <GlobalSearchBar onSelectStock={onSelectStock} />
        </div>
      )}

      <div className="topbar-nav-wrapper">
        <nav className="topbar-nav" aria-label="Main Navigation">
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
            Trends & Signals
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

      <div className="topbar-right">
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
        <p className="data-badge live" role="status" title="Real-time Indian Exchange Telemetry Feed Active">
          <span aria-hidden="true" />
          Live Feed <span className="badge-exchange-tag">(NSE/BSE)</span>
        </p>
      </div>
    </header>
  );
}
