import { useEffect, useState } from "react";
import { Header, type PageTab } from "./components/Header";
import { Footer } from "./components/Footer";
import { OverviewPage } from "./pages/OverviewPage";
import { ForecastLabPage } from "./pages/ForecastLabPage";
import { RunReceiptPage } from "./pages/RunReceiptPage";
import { TrendAnalysisPage } from "./pages/TrendAnalysisPage";
import { PaperTradingPage } from "./pages/PaperTradingPage";
import { StocksExplorerPage } from "./pages/StocksExplorerPage";
import { MutualFundsPage } from "./pages/MutualFundsPage";
import { AIStrategyLabPage } from "./pages/AIStrategyLabPage";
import type { RunMetadataResponse } from "./types/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [currentTab, setCurrentTab] = useState<PageTab>("overview");
  const [runData, setRunData] = useState<RunMetadataResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [tradeSelectedSymbol, setTradeSelectedSymbol] = useState("RELIANCE");

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!API_BASE && typeof window !== "undefined" && window.location.hostname !== "localhost") {
        return;
      }
      setLoading(true);
      try {
        const curRes = await fetch(`${API_BASE}/api/v1/runs/current`);
        if (!curRes.ok) return;
        const curJson = await curRes.json();
        const runRes = await fetch(`${API_BASE}/api/v1/runs/${curJson.run_id}`);
        if (!runRes.ok) return;
        const fullData: RunMetadataResponse = await runRes.json();
        if (!cancelled) setRunData(fullData);
      } catch {
        // Fallback gracefully on network error or offline mode
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelectForTrend(symbol: string) {
    setTradeSelectedSymbol(symbol);
    setCurrentTab("trends");
  }

  function handleSelectForTrade(symbol: string) {
    setTradeSelectedSymbol(symbol);
    setCurrentTab("paper");
  }

  function handleExecuteAITrade(symbol: string) {
    setTradeSelectedSymbol(symbol);
    setCurrentTab("paper");
  }

  return (
    <div className={`page-shell ${darkMode ? "dark-terminal" : "light-desk"}`}>
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        synthetic={runData ? runData.synthetic : null}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
      />

      <main id="main-content">
        {currentTab === "stocks" && (
          <StocksExplorerPage
            onSelectForTrend={handleSelectForTrend}
            onSelectForTrade={handleSelectForTrade}
          />
        )}
        {currentTab === "funds" && <MutualFundsPage />}
        {currentTab === "ai-strategy" && (
          <AIStrategyLabPage onExecuteAITrade={handleExecuteAITrade} />
        )}
        {currentTab === "trends" && (
          <TrendAnalysisPage onSelectForTrade={handleSelectForTrade} />
        )}
        {currentTab === "paper" && (
          <PaperTradingPage initialSymbol={tradeSelectedSymbol} />
        )}
        {currentTab === "overview" && (
          <OverviewPage runData={runData} loading={loading} />
        )}
        {currentTab === "forecast" && (
          <ForecastLabPage runData={runData} loading={loading} />
        )}
        {currentTab === "receipt" && (
          <RunReceiptPage runData={runData} loading={loading} />
        )}
      </main>

      <Footer />
    </div>
  );
}
