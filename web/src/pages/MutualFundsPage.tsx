import { useMemo, useState } from "react";
import { TOP_INDIAN_MUTUAL_FUNDS } from "../data/mutualFundsData";
import { calculateSIP, type FundCategory } from "../types/funds";

export function MutualFundsPage() {
  const [funds] = useState(TOP_INDIAN_MUTUAL_FUNDS);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // SIP Calculator State
  const [monthlyAmount, setMonthlyAmount] = useState<number>(10000);
  const [returnRate, setReturnRate] = useState<number>(15);
  const [years, setYears] = useState<number>(10);

  const categories: string[] = [
    "ALL",
    "Flexi Cap",
    "Small Cap",
    "Large Cap",
    "Index Funds",
    "ELSS Tax Saver",
  ];

  const filteredFunds = useMemo(() => {
    return funds.filter((f) => {
      const matchesCategory =
        selectedCategory === "ALL" || f.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.fundHouse.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [funds, selectedCategory, searchQuery]);

  // Compute SIP result
  const sipResult = useMemo(() => {
    return calculateSIP(monthlyAmount, returnRate, years);
  }, [monthlyAmount, returnRate, years]);

  const investedPct =
    sipResult.totalMaturityValue > 0
      ? (sipResult.totalInvestedAmount / sipResult.totalMaturityValue) * 100
      : 50;
  const returnsPct = 100 - investedPct;

  return (
    <div className="page-content" tabIndex={-1}>
      <header className="page-header">
        <h1>Indian Mutual Funds & SIP Studio</h1>
        <p className="status-copy">
          Explore top-performing Indian mutual funds across Flexi Cap, Small Cap, and Index categories with verified CAGR returns, AUM, and an interactive wealth compound calculator.
        </p>
      </header>

      {/* Interactive SIP Compound Calculator Card */}
      <section className="sip-calculator-section" aria-label="SIP Wealth Calculator">
        <div className="sip-header">
          <div>
            <h2 className="sip-title">Systematic Investment Plan (SIP) Calculator</h2>
            <p className="sip-sub">Project wealth growth through disciplined Indian equity compounding</p>
          </div>
          <div className="sip-multiplier-badge">
            <span className="mult-label">Wealth Growth</span>
            <span className="mult-val text-gain">{sipResult.wealthGainMultiplier}x</span>
          </div>
        </div>

        <div className="sip-calculator-grid">
          {/* Controls Column */}
          <div className="sip-controls">
            {/* Monthly Investment Slider */}
            <div className="sip-slider-group">
              <div className="slider-label-row">
                <label htmlFor="sip-monthly-input">Monthly Investment</label>
                <span className="slider-val-tag">₹{monthlyAmount.toLocaleString("en-IN")}</span>
              </div>
              <input
                id="sip-monthly-input"
                type="range"
                min="500"
                max="100000"
                step="500"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                className="range-slider"
              />
              <div className="quick-chips-row">
                {[2000, 5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`sip-chip ${monthlyAmount === amt ? "active" : ""}`}
                    onClick={() => setMonthlyAmount(amt)}
                  >
                    ₹{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Return Rate Slider */}
            <div className="sip-slider-group">
              <div className="slider-label-row">
                <label htmlFor="sip-rate-input">Expected Annual Return (CAGR)</label>
                <span className="slider-val-tag">{returnRate}%</span>
              </div>
              <input
                id="sip-rate-input"
                type="range"
                min="8"
                max="25"
                step="0.5"
                value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="range-slider"
              />
              <div className="quick-chips-row">
                {[
                  { r: 12, label: "12% Large Cap" },
                  { r: 15, label: "15% Flexi Cap" },
                  { r: 18, label: "18% Small Cap" },
                  { r: 21, label: "21% Aggressive" },
                ].map((preset) => (
                  <button
                    key={preset.r}
                    type="button"
                    className={`sip-chip ${returnRate === preset.r ? "active" : ""}`}
                    onClick={() => setReturnRate(preset.r)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Period Slider */}
            <div className="sip-slider-group">
              <div className="slider-label-row">
                <label htmlFor="sip-years-input">Investment Horizon</label>
                <span className="slider-val-tag">{years} Years ({years * 12} Months)</span>
              </div>
              <input
                id="sip-years-input"
                type="range"
                min="1"
                max="30"
                step="1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="range-slider"
              />
              <div className="quick-chips-row">
                {[3, 5, 10, 15, 20].map((y) => (
                  <button
                    key={y}
                    type="button"
                    className={`sip-chip ${years === y ? "active" : ""}`}
                    onClick={() => setYears(y)}
                  >
                    {y} Years
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Column */}
          <div className="sip-results-card">
            <span className="sip-card-title">Projected Maturity Corpus</span>
            <div className="maturity-total-block">
              <span className="maturity-num">₹{sipResult.totalMaturityValue.toLocaleString("en-IN")}</span>
              <span className="maturity-sub">at age {years} years</span>
            </div>

            {/* Wealth Breakdown Bar */}
            <div className="wealth-ratio-bar-wrap" aria-label="Invested vs Returns proportion">
              <div className="wealth-bar-fill-invested" style={{ width: `${investedPct}%` }} />
              <div className="wealth-bar-fill-returns" style={{ width: `${returnsPct}%` }} />
            </div>

            <div className="sip-stat-items">
              <div className="sip-stat-item">
                <div className="sip-dot dot-invested" />
                <div className="sip-stat-text">
                  <span className="stat-name">Total Amount Invested</span>
                  <span className="stat-fig">₹{sipResult.totalInvestedAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="sip-stat-item">
                <div className="sip-dot dot-returns" />
                <div className="sip-stat-text">
                  <span className="stat-name">Estimated Wealth Returns</span>
                  <span className="stat-fig text-gain">₹{sipResult.estimatedReturnsAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter & Search Bar */}
      <section className="funds-control-bar" aria-label="Mutual Fund Categories">
        <div className="filter-bar" role="toolbar" aria-label="Category Selection">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>

        <div className="fund-search-wrap">
          <input
            type="search"
            placeholder="Search funds or fund houses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Search mutual funds"
          />
        </div>
      </section>

      {/* Funds Grid */}
      <section className="funds-grid-section" aria-label="Indian Mutual Funds List">
        <div className="funds-cards-grid">
          {filteredFunds.map((fund) => (
            <div key={fund.id} className="fund-card">
              <div className="fund-card-top">
                <div className="fund-meta-left">
                  <span className="fund-category-tag">{fund.category}</span>
                  <span className="fund-house">{fund.fundHouse}</span>
                  <h3 className="fund-name">{fund.name}</h3>
                </div>
                <div className="fund-rating-badge">
                  {"★".repeat(fund.rating)}
                  <span className="rating-num">{fund.rating}.0</span>
                </div>
              </div>

              <div className="fund-nav-row">
                <div className="nav-col">
                  <span className="card-stat-label">Current NAV</span>
                  <span className="card-nav-val">₹{fund.nav.toFixed(2)}</span>
                </div>
                <div className="returns-highlight">
                  <span className="card-stat-label">3Y CAGR</span>
                  <span className="cagr-val text-gain">+{fund.cagr3y.toFixed(1)}%</span>
                </div>
              </div>

              <div className="fund-details-grid">
                <div className="detail-item">
                  <span className="detail-lbl">1Y Return</span>
                  <span className="detail-val text-gain">+{fund.cagr1y.toFixed(1)}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-lbl">5Y CAGR</span>
                  <span className="detail-val text-gain">+{fund.cagr5y.toFixed(1)}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-lbl">AUM (₹ Cr)</span>
                  <span className="detail-val">₹{fund.aumCr.toLocaleString("en-IN")}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-lbl">Expense Ratio</span>
                  <span className="detail-val">{fund.expenseRatio}%</span>
                </div>
              </div>

              <div className="fund-card-footer">
                <span className="min-sip-tag">Min SIP: ₹{fund.minSipAmount}</span>
                <span className="fund-risk-tag">{fund.risk} Risk</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
