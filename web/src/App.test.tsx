import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";
import { OverviewPage } from "./pages/OverviewPage";
import { ForecastLabPage } from "./pages/ForecastLabPage";
import { RunReceiptPage } from "./pages/RunReceiptPage";
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
  it("renders the default app without unpublished results", () => {
    const markup = renderToStaticMarkup(<App />);
    expect(markup).toContain("No active run");
    expect(markup).toContain("No validated run available");
    expect(markup).not.toContain("₹837.91");
    expect(markup).not.toContain("SEBI RA compliant");
    expect(markup).toContain("Bazaar Drishti");
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
});
