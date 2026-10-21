export type PageTab = "trends" | "paper" | "overview" | "forecast" | "receipt";

interface HeaderProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  synthetic?: boolean | null;
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

export function Header({
  currentTab,
  onSelectTab,
  synthetic = true,
  darkMode = true,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab("trends");
          }}
          aria-label="MarketLens home"
        >
          <span className="wordmark-icon" aria-hidden="true">ML</span>
          <span>MarketLens</span>
        </a>
        <nav className="topbar-nav" aria-label="Main Navigation">
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
        <p className={`data-badge ${synthetic === null ? "empty" : ""}`} role="status">
          <span aria-hidden="true" />
          {synthetic === null ? "No active run" : synthetic ? "Synthetic data" : "Licensed data"}
        </p>
      </div>
    </header>
  );
}
