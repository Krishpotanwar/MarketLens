
export type PageTab = "overview" | "forecast" | "receipt";

interface HeaderProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  synthetic?: boolean | null;
}

export function Header({ currentTab, onSelectTab, synthetic = true }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <a className="wordmark" href="#" onClick={(e) => { e.preventDefault(); onSelectTab("overview"); }} aria-label="Bazaar Drishti home">
          <span className="wordmark-icon" aria-hidden="true">BD</span>
          <span>Bazaar Drishti</span>
        </a>
        <nav className="topbar-nav" aria-label="Main Navigation">
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

      <p className={`data-badge ${synthetic === null ? "empty" : ""}`} role="status">
        <span aria-hidden="true" />
        {synthetic === null ? "No active run" : synthetic ? "Synthetic data" : "Licensed data"}
      </p>
    </header>
  );
}
