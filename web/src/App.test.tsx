import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";
import { OverviewPage } from "./pages/OverviewPage";
import { ForecastLabPage } from "./pages/ForecastLabPage";
import { RunReceiptPage } from "./pages/RunReceiptPage";
import { TrendAnalysisPage } from "./pages/TrendAnalysisPage";
import { PaperTradingPage } from "./pages/PaperTradingPage";
import { StocksExplorerPage } from "./pages/StocksExplorerPage";
import { MutualFundsPage } from "./pages/MutualFundsPage";
import { AIStrategyLabPage } from "./pages/AIStrategyLabPage";
import { IPODiscoveryPage } from "./pages/IPODiscoveryPage";
import { calculateIndianCharges } from "./types/paper";
import { calculateSIP } from "./types/funds";
import { TOP_INDIAN_MUTUAL_FUNDS } from "./data/mutualFundsData";
import { INITIAL_INDIAN_STOCKS } from "./data/indianMarketData";
import type { RunMetadataResponse } from "./types/api";

const mockRun: RunMetadataResponse = {
  run_id: "run-test-001",
  synthetic: true,
  data_label: "synthetic",
  source_label: "deterministic local fixture",
  bars_sha256: "9e232063a896d744fea0637387b87f64031a1a91464f05176038d41e804806fd",
  config_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  code_revision: "git-test",
  created_at_utc: "2030-01-07T04:00:00Z",
  data_start_utc: "2030-01-07T03:45:00Z",
  data_end_utc: "2030-01-09T10:00:00Z",
  metrics: {
    gross_pnl_inr: "1250.00",
    brokerage_inr: "120.00",
    exchange_charges_inr: "11.88",
    sebi_charges_inr: "0.40",
    stt_inr: "50.00",
    stamp_duty_inr: "6.00",
    gst_inr: "23.81",
    slippage_inr: "200.00",
    net_pnl_inr: "837.91",
    return_percent: "0.84",
    cash_baseline_net_pnl_inr: "0.00",
    buy_hold_baseline_net_pnl_inr: "450.00",
    max_drawdown_percent: "1.25",
    trade_count: 6,
    session_count: 3,
    brier_score: "0.2215",
    log_loss: "0.6340",
    balanced_accuracy: "0.5830",
    forecast_count: 207,
  },
};

describe("research dashboard shell and pages", () => {
  it("renders without dot-background canvas class", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).not.toContain("dot-background");
  });

  it("renders 44px command header and active tab indicator", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain('role="banner"');
    expect(markup).toMatch(/MarketLens/i);
    expect(markup).toMatch(/Live/i);
    expect(markup).toContain("command-bar");
    expect(markup).toContain("workstation-nav");
    expect(markup).toContain("NIFTY 50");
    expect(markup).toContain("SENSEX");
    expect(markup).toContain("₹10,00,000");
  });

  it("renders the default app with live market feed and stocks explorer", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("Live Feed");
    expect(markup).toContain("Indian Stocks &amp; Market");
    expect(markup).toContain("hero-explorer-highlight");
    expect(markup).not.toContain("₹837.91");
    expect(markup).not.toContain("SEBI RA compliant");
    expect(markup).toContain("MarketLens");
    expect(markup).toContain("Trends &amp; Signals");
    expect(markup).toContain("Paper Trading");
    expect(markup).toContain("Overview");
    expect(markup).toContain("Forecast Lab");
    expect(markup).toContain("Run Receipt");
  });

  it("renders overview page with reconciled net P&L and itemized statutory costs", () => {
    const markup = renderToStaticMarkup(<OverviewPage runData={mockRun} loading={false} />);
    expect(markup).toContain("₹837.91");
    expect(markup).toContain("0.84%");
    expect(markup).toContain("Baseline Comparison");
    expect(markup).toContain("Itemized Cost Reconciliation");
    expect(markup).toContain("not sourced or date-effective");
    expect(markup).toContain("Securities Transaction Tax (STT)");
    expect(markup).toContain("-₹50.00");
  });

  it("renders forecast lab page with scores and causal feature definitions", () => {
    const markup = renderToStaticMarkup(<ForecastLabPage runData={mockRun} loading={false} />);
    expect(markup).toContain("Forecast Lab &amp; Calibration");
    expect(markup).toContain("0.2215"); // Brier score
    expect(markup).toContain("58.3%"); // Balanced accuracy
    expect(markup).toContain("dist_sma20");
    expect(markup).toContain("vol_20");
  });

  it("renders run receipt page with cryptographic fingerprints and academic notice", () => {
    const markup = renderToStaticMarkup(<RunReceiptPage runData={mockRun} loading={false} />);
    expect(markup).toContain("run-test-001");
    expect(markup).toContain("SYNTHETIC FIXTURE");
    expect(markup).toContain("9e232063a896d744fea0637387b87f64031a1a91464f05176038d41e804806fd");
    expect(markup).toContain("Prototype Status &amp; Limitations");
  });

  it("renders Indian stock trends page with NSE screener and prediction studio", () => {
    const markup = renderToStaticMarkup(<TrendAnalysisPage onSelectForTrade={() => {}} />);
    expect(markup).toContain("Indian Stock Market Trends &amp; Signals");
    expect(markup).toContain("NSE Liquid Equities");
    expect(markup).toContain("NIFTY 50");
    expect(markup).toContain("RELIANCE");
    expect(markup).toContain("TCS");
    expect(markup).toContain("Multi-Timeframe Trend Structure");
    expect(markup).toContain("Calibrated Directional Prediction");
    expect(markup).toContain("Test Signal in Paper Trading Terminal");
  });

  it("renders real live exchange graph and resolves IOCL to Indian Oil Corporation Limited", () => {
    const markup = renderToStaticMarkup(
      <TrendAnalysisPage onSelectForTrade={() => {}} initialSymbol="IOCL" />
    );
    expect(markup).toContain("IOC");
    expect(markup).toContain("Indian Oil Corporation Limited");
    expect(markup).toContain("Live Exchange Price Action");
    expect(markup).toContain("1D");
    expect(markup).toContain("5D");
    expect(markup).toContain("1M");
    expect(markup).toContain("1Y");
    expect(markup).toContain("Prev Close");
  });

  it("renders paper trading terminal with virtual capital and statutory tax ledger", () => {
    const markup = renderToStaticMarkup(<PaperTradingPage initialSymbol="RELIANCE" />);
    expect(markup).toContain("Indian Stock Paper Trading Terminal");
    expect(markup).toContain("Total Portfolio Value");
    expect(markup).toContain("₹10,00,000.00");
    expect(markup).toContain("Order Placement Ticket");
    expect(markup).toContain("Indian Statutory Charges Breakdown");
    expect(markup).toContain("Active Open Positions");
    expect(markup).toContain("Trade History &amp; Statutory Audit");
  });

  it("calculates realistic Indian statutory taxes and charges according to SEBI/NSE schedule", () => {
    // Delivery BUY of 10 shares of RELIANCE @ ₹2950 (Turnover: ₹29,500)
    const delBuy = calculateIndianCharges("BUY", "CNC", 2950, 10);
    expect(delBuy.turnover).toBe(29500);
    expect(delBuy.brokerage).toBe(0); // Zero for delivery
    expect(delBuy.stt).toBeCloseTo(29.5, 2); // 0.1% on delivery buy
    expect(delBuy.stampDuty).toBeCloseTo(4.425, 2); // 0.015% on buy
    expect(delBuy.totalCharges).toBeGreaterThan(0);
    expect(delBuy.netEffectiveAmount).toBeGreaterThan(delBuy.turnover); // Capital required = turnover + charges

    // Intraday SELL of 100 shares of INFY @ ₹1750 (Turnover: ₹175,000)
    const intraSell = calculateIndianCharges("SELL", "MIS", 1750, 100);
    expect(intraSell.turnover).toBe(175000);
    expect(intraSell.brokerage).toBe(20); // Capped at ₹20
    expect(intraSell.stt).toBeCloseTo(43.75, 2); // 0.025% on intraday sell
    expect(intraSell.stampDuty).toBe(0); // No stamp duty on sell
    expect(intraSell.netEffectiveAmount).toBeLessThan(intraSell.turnover); // Net receivable = turnover - charges
  });

  it("calculates accurate SIP compound wealth and supports mutual fund models", () => {
    // ₹10,000/mo for 10 years at 12% annual return
    const sip = calculateSIP(10000, 12, 10);
    expect(sip.totalInvestedAmount).toBe(1200000);
    expect(sip.totalMaturityValue).toBeGreaterThan(2300000);
    expect(sip.estimatedReturnsAmount).toBeGreaterThan(1100000);
    expect(sip.wealthGainMultiplier).toBeGreaterThan(1.9);

    // Mutual Funds data
    expect(TOP_INDIAN_MUTUAL_FUNDS.length).toBeGreaterThanOrEqual(7);
    const ppfas = TOP_INDIAN_MUTUAL_FUNDS.find((f) => f.id === "ppfas-flexi");
    expect(ppfas).toBeDefined();
    expect(ppfas?.category).toBe("Flexi Cap");

    // Multi-cap stocks data
    const midCaps = INITIAL_INDIAN_STOCKS.filter((s) => s.marketCapCategory === "Mid Cap");
    expect(midCaps.length).toBeGreaterThan(0);
    expect(midCaps.some((s) => s.symbol === "DIXON")).toBe(true);
  });

  it("renders Groww-style Indian stocks explorer with indices and discovery shelves", () => {
    const markup = renderToStaticMarkup(
      <StocksExplorerPage onSelectForTrend={() => {}} onSelectForTrade={() => {}} />
    );
    expect(markup).toContain("Indian Stocks &amp; Market");
    expect(markup).toContain("hero-explorer-highlight");
    expect(markup).toContain("NIFTY 50");
    expect(markup).toContain("SENSEX");
    expect(markup).toContain("Top Gainers");
    expect(markup).toContain("Top Losers");
    expect(markup).toContain("Most Active");
    expect(markup).toContain("ZOMATO");
    expect(markup).toContain("DIXON");
    expect(markup).toContain("Search ANY Indian stock");
    expect(markup).toContain("All Exchanges (13,109+)");
    expect(markup).toContain("NSE Listed (2,611)");
    expect(markup).toContain("BSE Listed (10,498)");
    expect(markup).toContain("Page <strong>1</strong> of <strong>263</strong>");
  });

  it("renders Indian IPO Discovery Hub with active, upcoming, and recently listed IPOs", () => {
    const markup = renderToStaticMarkup(
      <IPODiscoveryPage onSelectForAI={() => {}} onSelectForTrade={() => {}} />
    );
    expect(markup).toContain("Indian IPO Hub &amp; New Listings Tracker");
    expect(markup).toContain("Currently Open for Subscription");
    expect(markup).toContain("Upcoming SEBI-Approved Pipeline");
    expect(markup).toContain("Recently Listed Companies &amp; Post-IPO Returns");
    expect(markup).toContain("NTPC Green Energy Limited");
    expect(markup).toContain("Swiggy Limited");
    expect(markup).toContain("Waaree Energies Limited");
  });

  it("renders Indian mutual funds explorer with interactive SIP calculator", () => {
    const markup = renderToStaticMarkup(<MutualFundsPage />);
    expect(markup).toContain("Indian Mutual Funds &amp; SIP Studio");
    expect(markup).toContain("Systematic Investment Plan (SIP) Calculator");
    expect(markup).toContain("Projected Maturity Corpus");
    expect(markup).toContain("Parag Parikh Flexi Cap Fund");
    expect(markup).toContain("Quant Small Cap Fund");
    expect(markup).toContain("UTI Nifty 50 Index Fund");
    expect(markup).toContain("Min SIP:");
  });

  it("renders Hybrid AI Strategy Lab with multi-timeline simulation, news ticker, and concall sandbox", () => {
    const markup = renderToStaticMarkup(<AIStrategyLabPage onExecuteAITrade={() => {}} />);
    expect(markup).toContain("Hybrid AI Strategy Lab");
    expect(markup).toContain("Target Indian Equity (NSE)");
    expect(markup).toContain("AI Reasoning Engine");
    expect(markup).toContain("Indian News Feed &amp; Sentiment Ticker");
    expect(markup).toContain("Earnings Concall &amp; Filings Sandbox");
    expect(markup).toContain("Strategy Rules &amp; Prompt Sandbox");
    expect(markup).toContain("Run AI Analysis on");
  });

  it("filters screener watchlist directly when searching in Trends page", () => {
    const markup = renderToStaticMarkup(
      <TrendAnalysisPage onSelectForTrade={() => {}} initialSymbol="RELIANCE" initialScreenerSearch="TCS" />
    );
    expect(markup).toContain("TCS");
    expect(markup).not.toContain("INFY");
    expect(markup).toContain("chart-skeleton-wave");
  });

  it("guards paper trading order ticket with loading state for external stock before live quote resolves", () => {
    const markup = renderToStaticMarkup(
      <PaperTradingPage initialSymbol="UNKNOWN_CORP" />
    );
    expect(markup).toContain("Syncing Live Price...");
    expect(markup).toContain("disabled");
  });
});
