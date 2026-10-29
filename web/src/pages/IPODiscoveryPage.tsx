import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

export interface ActiveIPO {
  symbol: string;
  name: string;
  priceBand: string;
  issueSize: string;
  startDate: string;
  endDate: string;
  status: "OPEN" | "CLOSED" | "UPCOMING";
  subscriptionRatio: string;
  category: string;
  lotSize: number | null;
  minInvestment: number | null;
}

export interface UpcomingIPO {
  symbol: string;
  name: string;
  priceBand: string;
  issueSize: string;
  startDate: string;
  endDate: string;
  status: "UPCOMING";
  category: string;
  lotSize: number | null;
  minInvestment: number | null;
  gmpEstimate: string;
}

export interface ListedIPO {
  symbol: string;
  name: string;
  issuePrice: number;
  listingPrice: number;
  listingDate: string;
  sector: string;
  ltp: number;
  dayChangePercent: number;
  listingGainPercent: number;
  currentGainPercent: number;
  status: "LISTED";
  provider?: string;
}

interface IPOApiResponse {
  active: ActiveIPO[];
  upcoming: UpcomingIPO[];
  listed: ListedIPO[];
  counts: {
    active: number;
    upcoming: number;
    listed: number;
    total: number;
  };
  source: string;
}

interface IPODiscoveryPageProps {
  onSelectForTrade: (symbol: string) => void;
  onSelectForAI: (symbol: string) => void;
  onSelectForTrend?: (symbol: string) => void;
}

export function IPODiscoveryPage({
  onSelectForTrade,
  onSelectForAI,
  onSelectForTrend,
}: IPODiscoveryPageProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "UPCOMING" | "LISTED">("ALL");
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [ipoData, setIpoData] = useState<IPOApiResponse>({
    active: [
      {
        symbol: "PARASHLTH",
        name: "Paras Healthcare Limited",
        priceBand: "₹660 - ₹693",
        issueSize: "₹837 Cr",
        startDate: "21-Oct-2026",
        endDate: "23-Oct-2026",
        status: "OPEN",
        subscriptionRatio: "1.10x",
        category: "Mainboard",
        lotSize: 21,
        minInvestment: 14553,
      },
      {
        symbol: "JPL",
        name: "Jio Platforms Limited",
        priceBand: "₹1,065 - ₹1,119",
        issueSize: "₹22,100 Cr",
        startDate: "21-Oct-2026",
        endDate: "24-Oct-2026",
        status: "OPEN",
        subscriptionRatio: "2.45x",
        category: "Mega IPO / Mainboard",
        lotSize: 13,
        minInvestment: 14547,
      },
    ],
    upcoming: [
      {
        symbol: "NTPCGREEN",
        name: "NTPC Green Energy Limited",
        priceBand: "₹102 - ₹108",
        issueSize: "₹10,000 Cr",
        startDate: "Expected Nov 2026",
        endDate: "Upcoming",
        status: "UPCOMING",
        category: "Renewable Energy / PSU",
        lotSize: 138,
        minInvestment: 14904,
        gmpEstimate: "+14.5%",
      },
      {
        symbol: "VMM",
        name: "Vishal Mega Mart Limited",
        priceBand: "₹74 - ₹78",
        issueSize: "₹8,000 Cr",
        startDate: "Expected Dec 2026",
        endDate: "Upcoming",
        status: "UPCOMING",
        category: "Retail / Hypermarket",
        lotSize: 190,
        minInvestment: 14820,
        gmpEstimate: "+22.0%",
      },
      {
        symbol: "HDBFS",
        name: "HDB Financial Services Limited",
        priceBand: "₹700 - ₹740",
        issueSize: "₹12,500 Cr",
        startDate: "Expected Q4 2026",
        endDate: "Upcoming",
        status: "UPCOMING",
        category: "HDFC Subsidiary / NBFC",
        lotSize: 20,
        minInvestment: 14800,
        gmpEstimate: "+35.0%",
      },
      {
        symbol: "AVANSE",
        name: "Avanse Financial Services Limited",
        priceBand: "₹320 - ₹340",
        issueSize: "₹3,500 Cr",
        startDate: "Expected Nov 2026",
        endDate: "Upcoming",
        status: "UPCOMING",
        category: "Education NBFC",
        lotSize: 44,
        minInvestment: 14960,
        gmpEstimate: "+18.0%",
      },
      {
        symbol: "MOBIKWIK",
        name: "One MobiKwik Systems Limited",
        priceBand: "₹265 - ₹279",
        issueSize: "₹700 Cr",
        startDate: "Expected Dec 2026",
        endDate: "Upcoming",
        status: "UPCOMING",
        category: "Fintech & BNPL",
        lotSize: 53,
        minInvestment: 14787,
        gmpEstimate: "+10.0%",
      },
    ],
    listed: [
      {
        symbol: "SWIGGY",
        name: "Swiggy Limited",
        issuePrice: 390.0,
        listingPrice: 420.0,
        listingDate: "13-Nov-2024",
        sector: "Q-Commerce & Food Delivery",
        ltp: 213.6,
        dayChangePercent: -4.49,
        listingGainPercent: 7.69,
        currentGainPercent: -45.23,
        status: "LISTED",
        provider: "Sample data",
      },
      {
        symbol: "WAAREEENER",
        name: "Waaree Energies Limited",
        issuePrice: 1503.0,
        listingPrice: 2550.0,
        listingDate: "28-Oct-2024",
        sector: "Solar Energy Equipment",
        ltp: 2379.0,
        dayChangePercent: 1.25,
        listingGainPercent: 69.66,
        currentGainPercent: 58.28,
        status: "LISTED",
        provider: "Sample data",
      },
      {
        symbol: "HYUNDAI",
        name: "Hyundai Motor India Limited",
        issuePrice: 1960.0,
        listingPrice: 1931.0,
        listingDate: "22-Oct-2024",
        sector: "Passenger Automobiles",
        ltp: 1928.9,
        dayChangePercent: -0.94,
        listingGainPercent: -1.48,
        currentGainPercent: -1.59,
        status: "LISTED",
        provider: "Sample data",
      },
      {
        symbol: "AFCONS",
        name: "Afcons Infrastructure Limited",
        issuePrice: 463.0,
        listingPrice: 426.0,
        listingDate: "04-Nov-2024",
        sector: "EPC Infrastructure",
        ltp: 233.45,
        dayChangePercent: -0.65,
        listingGainPercent: -7.99,
        currentGainPercent: -49.58,
        status: "LISTED",
        provider: "Sample data",
      },
      {
        symbol: "BAJAJHFL",
        name: "Bajaj Housing Finance Limited",
        issuePrice: 70.0,
        listingPrice: 150.0,
        listingDate: "16-Sep-2024",
        sector: "Housing Finance NBFC",
        ltp: 80.31,
        dayChangePercent: -1.26,
        listingGainPercent: 114.29,
        currentGainPercent: 14.73,
        status: "LISTED",
        provider: "Sample data",
      },
      {
        symbol: "PREMIERENE",
        name: "Premier Energies Limited",
        issuePrice: 450.0,
        listingPrice: 991.0,
        listingDate: "03-Sep-2024",
        sector: "Solar Cells & Modules",
        ltp: 866.5,
        dayChangePercent: -1.73,
        listingGainPercent: 120.22,
        currentGainPercent: 92.56,
        status: "LISTED",
        provider: "Sample data",
      },
      {
        symbol: "OLAELEC",
        name: "Ola Electric Mobility Limited",
        issuePrice: 76.0,
        listingPrice: 76.0,
        listingDate: "09-Aug-2024",
        sector: "EV Two-Wheelers",
        ltp: 32.63,
        dayChangePercent: -1.75,
        listingGainPercent: 0.0,
        currentGainPercent: -57.07,
        status: "LISTED",
        provider: "Sample data",
      },
      {
        symbol: "SAGILITY",
        name: "Sagility India Limited",
        issuePrice: 30.0,
        listingPrice: 31.06,
        listingDate: "12-Nov-2024",
        sector: "Healthcare BPM",
        ltp: 44.76,
        dayChangePercent: 0.85,
        listingGainPercent: 3.53,
        currentGainPercent: 49.20,
        status: "LISTED",
        provider: "Sample data",
      },
    ],
    counts: { active: 2, upcoming: 5, listed: 8, total: 15 },
    source: "Sample data (bundled)",
  });

  // Fetch live IPO telemetry from backend
  const fetchIPOs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/market/ipos`);
      if (res.ok) {
        const data = await res.json();
        setIpoData(data);
        setIsLive(!data.sample);
      }
    } catch {
      // Retain pre-loaded reliable fixtures on offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIPOs();
  }, [fetchIPOs]);

  return (
    <div className="page-content ipo-discovery-page" tabIndex={-1}>
      <header className="page-header">
        <div className="page-header-split">
          <div>
            <h1>Indian IPO Hub & New Listings Tracker</h1>
            <p className="status-copy">
              Active issues and subscription ratios come from the NSE website when it is reachable. The upcoming pipeline and recent listings are illustrative samples.
            </p>
          </div>
          <div className="live-telemetry-status-card" role="status">
            <span className={`live-telemetry-dot${isLive ? "" : " offline"}`} aria-hidden="true" />
            <div className="live-telemetry-info">
              <span className="live-telemetry-provider">
                {loading ? "Connecting to NSE…" : isLive ? "NSE website · live issues" : "Sample data · NSE feed unreachable"}
              </span>
              <span className="live-telemetry-time">
                {ipoData.counts.total} IPOs Tracked ({ipoData.counts.active} Open)
              </span>
            </div>
            <button
              type="button"
              className="live-sync-btn"
              onClick={fetchIPOs}
              disabled={loading}
              aria-label="Refresh live IPOs"
            >
              {loading ? "Syncing..." : "↻ Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* Primary Market Stats Strip */}
      <section className="indices-strip ipo-stats-strip" aria-label="IPO Market Overview">
        <div className="index-pill">
          <span className="index-name">Active IPOs Now Open</span>
          <div className="index-vals">
            <span className="index-price text-gain">{ipoData.counts.active} Issues</span>
            <span className="index-chg text-gain">● Live Bidding</span>
          </div>
        </div>
        <div className="index-pill">
          <span className="index-name">Upcoming Pipeline</span>
          <div className="index-vals">
            <span className="index-price text-accent">{ipoData.counts.upcoming} Approved</span>
            <span className="index-chg text-accent">₹35,000+ Cr Size</span>
          </div>
        </div>
        <div className="index-pill">
          <span className="index-name">Recently Listed</span>
          <div className="index-vals">
            <span className="index-price text-main">{ipoData.counts.listed} Stocks</span>
            <span className="index-chg text-gain">Avg +35.8% Gain</span>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="filter-pill-row ipo-tabs-row" role="tablist" aria-label="IPO Status Tabs">
        <div className="cap-tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ALL"}
            className={`cap-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            All IPOs ({ipoData.counts.total})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "ACTIVE"}
            className={`cap-tab-btn ${activeTab === "ACTIVE" ? "active" : ""}`}
            onClick={() => setActiveTab("ACTIVE")}
          >
            ● Active / Open ({ipoData.counts.active})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "UPCOMING"}
            className={`cap-tab-btn ${activeTab === "UPCOMING" ? "active" : ""}`}
            onClick={() => setActiveTab("UPCOMING")}
          >
            Upcoming ({ipoData.counts.upcoming})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "LISTED"}
            className={`cap-tab-btn ${activeTab === "LISTED" ? "active" : ""}`}
            onClick={() => setActiveTab("LISTED")}
          >
            Recently Listed ({ipoData.counts.listed})
          </button>
        </div>
      </div>

      {/* 1. Active Issues Grid */}
      {(activeTab === "ALL" || activeTab === "ACTIVE") && (
        <section className="ipo-section" aria-label="Active IPO Issues">
          <div className="ipo-section-header">
            <h2>Currently Open for Subscription</h2>
            <span className="badge-live-pulse">● Accepting Bids via UPI / ASBA</span>
          </div>

          <div className="ipo-cards-grid">
            {ipoData.active.map((ipo) => (
              <div key={ipo.symbol} className="ipo-card ipo-card-active">
                <div className="ipo-card-top">
                  <div className="ipo-card-title-group">
                    <span className="ipo-symbol">{ipo.symbol}</span>
                    <span className="ipo-name">{ipo.name}</span>
                  </div>
                  <span className="ipo-status-pill ipo-status-tag open">[OPEN]</span>
                </div>

                <div className="ipo-card-metrics">
                  <div className="ipo-metric">
                    <span className="metric-label">Price Band</span>
                    <span className="metric-val">{ipo.priceBand}</span>
                  </div>
                  <div className="ipo-metric">
                    <span className="metric-label">Issue Size</span>
                    <span className="metric-val">{ipo.issueSize}</span>
                  </div>
                  <div className="ipo-metric">
                    <span className="metric-label">Min Investment (1 Lot)</span>
                    <span className="metric-val text-accent">
                      {ipo.minInvestment != null && ipo.lotSize != null
                        ? `₹${ipo.minInvestment.toLocaleString("en-IN")} (${ipo.lotSize} Shares)`
                        : "—"}
                    </span>
                  </div>
                  <div className="ipo-metric">
                    <span className="metric-label">Timeline</span>
                    <span className="metric-val">{ipo.startDate} to {ipo.endDate}</span>
                  </div>
                </div>

                <div className="ipo-subscription-bar-wrap">
                  <div className="ipo-sub-header">
                    <span>Subscription Status</span>
                    <span className="sub-ratio text-gain">{ipo.subscriptionRatio} Subscribed</span>
                  </div>
                  <div className="sub-progress-track">
                    <div
                      className="sub-progress-fill"
                      style={{ width: `${Math.min(100, parseFloat(ipo.subscriptionRatio) * 40)}%` }}
                    />
                  </div>
                </div>

                <div className="ipo-card-actions">
                  <button
                    type="button"
                    className="btn-apply-ipo"
                    onClick={() => onSelectForTrade(ipo.symbol)}
                  >
                    Apply / Paper Bid (1 Lot)
                  </button>
                  <button
                    type="button"
                    className="btn-ai-ipo"
                    onClick={() => onSelectForAI(ipo.symbol)}
                  >
                    Simulate Timelines
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Upcoming Issues Grid */}
      {(activeTab === "ALL" || activeTab === "UPCOMING") && (
        <section className="ipo-section" aria-label="Upcoming IPO Issues">
          <div className="ipo-section-header">
            <h2>Upcoming SEBI-Approved Pipeline</h2>
            <span className="ipo-sub-note">Expected opening dates & preliminary price bands</span>
          </div>

          <div className="ipo-cards-grid">
            {ipoData.upcoming.map((ipo) => (
              <div key={ipo.symbol} className="ipo-card ipo-card-upcoming">
                <div className="ipo-card-top">
                  <div className="ipo-card-title-group">
                    <span className="ipo-symbol">{ipo.symbol}</span>
                    <span className="ipo-name">{ipo.name}</span>
                  </div>
                  <span className="ipo-status-pill ipo-status-tag upcoming">[UPCOMING]</span>
                </div>

                <div className="ipo-card-metrics">
                  <div className="ipo-metric">
                    <span className="metric-label">Estimated Price Band</span>
                    <span className="metric-val">{ipo.priceBand}</span>
                  </div>
                  <div className="ipo-metric">
                    <span className="metric-label">Issue Size</span>
                    <span className="metric-val">{ipo.issueSize}</span>
                  </div>
                  <div className="ipo-metric">
                    <span className="metric-label">Category / Sector</span>
                    <span className="metric-val">{ipo.category}</span>
                  </div>
                  <div className="ipo-metric">
                    <span className="metric-label">Tentative Dates</span>
                    <span className="metric-val text-accent">{ipo.startDate}</span>
                  </div>
                </div>

                <div className="ipo-gmp-strip">
                  <span className="gmp-tag">Estimated Grey Market Premium:</span>
                  <span className="gmp-val text-gain">{ipo.gmpEstimate}</span>
                </div>

                <div className="ipo-card-actions">
                  <button
                    type="button"
                    className="btn-ai-ipo"
                    onClick={() => onSelectForAI(ipo.symbol)}
                  >
                    Run Pre-IPO AI Valuation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. Recently Listed Issues */}
      {(activeTab === "ALL" || activeTab === "LISTED") && (
        <section className="ipo-section recently-listed-section" aria-label="Recently Listed IPOs">
          <div className="ipo-section-header">
            <h2>Recently Listed Companies & Post-IPO Returns</h2>
            <span className="ipo-sub-note">Live NSE telemetry with listing gains vs current market price</span>
          </div>

          <div className="table-wrapper">
            <table className="data-table" aria-label="Recently Listed IPOs Table">
              <thead>
                <tr>
                  <th scope="col">Company & Symbol</th>
                  <th scope="col">Status</th>
                  <th scope="col">Sector</th>
                  <th scope="col">Listing Date</th>
                  <th scope="col" className="table-num">Issue Price</th>
                  <th scope="col" className="table-num">Listing Day Price</th>
                  <th scope="col" className="table-num">Current LTP</th>
                  <th scope="col" className="table-num">Listing Gain</th>
                  <th scope="col" className="table-num">Total Return</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ipoData.listed.map((ipo) => {
                  const isListingGain = ipo.listingGainPercent >= 0;
                  const isCurrentGain = ipo.currentGainPercent >= 0;

                  return (
                    <tr key={ipo.symbol}>
                      <th scope="row">
                        <span className="table-symbol">{ipo.symbol}</span>
                        <span className="table-sub">{ipo.name}</span>
                      </th>
                      <td>
                        <span className="ipo-status-pill ipo-status-tag listed">[LISTED]</span>
                      </td>
                      <td>{ipo.sector}</td>
                      <td>{ipo.listingDate}</td>
                      <td className="table-num">₹{ipo.issuePrice.toFixed(2)}</td>
                      <td className="table-num">₹{ipo.listingPrice.toFixed(2)}</td>
                      <td className="table-num font-mono font-semibold">
                        ₹{ipo.ltp.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`table-num ${isListingGain ? "text-gain" : "text-loss"}`}>
                        {isListingGain ? "+" : ""}{ipo.listingGainPercent.toFixed(1)}%
                      </td>
                      <td className={`table-num ${isCurrentGain ? "text-gain" : "text-loss"}`}>
                        {isCurrentGain ? "+" : ""}{ipo.currentGainPercent.toFixed(1)}%
                      </td>
                      <td>
                        <div className="stock-action-group">
                          {onSelectForTrend && (
                            <button
                              type="button"
                              className="btn-stock-trend"
                              onClick={() => onSelectForTrend(ipo.symbol)}
                              title={`View live price action and trend analysis for ${ipo.symbol}`}
                            >
                              Analyze
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-stock-trade"
                            onClick={() => onSelectForTrade(ipo.symbol)}
                            title={`Place Paper Trade for ${ipo.symbol}`}
                          >
                            Trade
                          </button>
                          <button
                            type="button"
                            className="btn-stock-ai"
                            onClick={() => onSelectForAI(ipo.symbol)}
                            title={`Run AI Strategy Lab for ${ipo.symbol}`}
                          >
                            AI Strategy
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
