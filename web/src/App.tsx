import { useState } from "react";
import { Header, type PageTab } from "./components/Header";
import { Footer } from "./components/Footer";
import { OverviewPage } from "./pages/OverviewPage";
import { ForecastLabPage } from "./pages/ForecastLabPage";
import { RunReceiptPage } from "./pages/RunReceiptPage";

export default function App() {
  const [currentTab, setCurrentTab] = useState<PageTab>("overview");
  const runData = null;
  const loading = false;

  return (
    <div className="page-shell">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        synthetic={null}
      />

      <main id="main-content">
        {currentTab === "overview" && <OverviewPage runData={runData} loading={loading} />}
        {currentTab === "forecast" && <ForecastLabPage runData={runData} loading={loading} />}
        {currentTab === "receipt" && <RunReceiptPage runData={runData} loading={loading} />}
      </main>

      <Footer />
    </div>
  );
}
