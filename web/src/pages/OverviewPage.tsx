import type { RunMetadataResponse } from "../types/api";

interface OverviewPageProps {
  runData: RunMetadataResponse | null;
  loading: boolean;
}

export function OverviewPage({ runData, loading }: OverviewPageProps) {
  if (loading) {
    return (
      <section className="intro" aria-busy="true">
        <p className="eyebrow">Overview</p>
        <h1>Loading run metrics...</h1>
      </section>
    );
  }

  if (!runData) {
    return (
      <section className="intro">
        <p className="eyebrow">Overview</p>
        <h1>No validated run available</h1>
        <p className="status-copy">Publish a verified study run to view performance metrics.</p>
      </section>
    );
  }

  const m = runData.metrics;

  return (
    <div className="page-content" tabIndex={-1}>
      <section className="intro" aria-labelledby="overview-title">
        <p className="eyebrow">
          Run ID: <span>{runData.run_id}</span>
        </p>
        <h1 id="overview-title">Strategy Overview & Performance</h1>
        <p className="status-copy">
          Prototype only. Fee assumptions are undated and unverified; no strategy result is approved.
        </p>
      </section>

      <section className="stats-grid" aria-label="Key Performance Indicators">
        <div className="stat-card">
          <p className="stat-label">Net Realized P&L</p>
          <p className="stat-value">₹{m.net_pnl_inr}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Return</p>
          <p className="stat-value">{m.return_percent ? `${m.return_percent}%` : "—"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Max Drawdown</p>
          <p className="stat-value">{m.max_drawdown_percent}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Trades</p>
          <p className="stat-value">{m.trade_count}</p>
        </div>
      </section>

      <section className="section-block" aria-labelledby="benchmarks-heading">
        <h2 id="benchmarks-heading">Baseline Comparison</h2>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Baseline Comparisons">
            <thead>
              <tr>
                <th scope="col">Strategy / Baseline</th>
                <th scope="col">Net P&L (INR)</th>
                <th scope="col">Charges (INR)</th>
                <th scope="col">Slippage (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">20/50 SMA Strategy</th>
                <td>₹{m.net_pnl_inr}</td>
                <td>
                  ₹
                  {(
                    parseFloat(m.brokerage_inr) +
                    parseFloat(m.exchange_charges_inr) +
                    parseFloat(m.sebi_charges_inr) +
                    parseFloat(m.stt_inr) +
                    parseFloat(m.stamp_duty_inr) +
                    parseFloat(m.gst_inr)
                  ).toFixed(2)}
                </td>
                <td>₹{m.slippage_inr}</td>
              </tr>
              <tr>
                <th scope="row">No-Trade Cash Baseline</th>
                <td>₹{m.cash_baseline_net_pnl_inr}</td>
                <td>₹0.00</td>
                <td>₹0.00</td>
              </tr>
              <tr>
                <th scope="row">Same-Session Buy & Hold</th>
                <td>₹{m.buy_hold_baseline_net_pnl_inr}</td>
                <td>Included</td>
                <td>Included</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-block" aria-labelledby="costs-heading">
        <h2 id="costs-heading">Itemized Cost Reconciliation</h2>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Transaction Costs Breakdown">
            <thead>
              <tr>
                <th scope="col">Charge Component</th>
                <th scope="col">Amount (INR)</th>
                <th scope="col">Assumption Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Gross Realized P&L</th>
                <td>₹{m.gross_pnl_inr}</td>
                <td>Trade exit notional - entry notional</td>
              </tr>
              <tr>
                <th scope="row">Brokerage</th>
                <td>-₹{m.brokerage_inr}</td>
                <td>Fixed prototype assumption; not sourced or date-effective</td>
              </tr>
              <tr>
                <th scope="row">Exchange Turnover Charge</th>
                <td>-₹{m.exchange_charges_inr}</td>
                <td>Not verified against a dated exchange tariff</td>
              </tr>
              <tr>
                <th scope="row">SEBI Turnover Fee</th>
                <td>-₹{m.sebi_charges_inr}</td>
                <td>Not verified against a dated SEBI schedule</td>
              </tr>
              <tr>
                <th scope="row">Securities Transaction Tax (STT)</th>
                <td>-₹{m.stt_inr}</td>
                <td>Not verified against a dated tax schedule</td>
              </tr>
              <tr>
                <th scope="row">Stamp Duty</th>
                <td>-₹{m.stamp_duty_inr}</td>
                <td>Not verified against a dated tax schedule</td>
              </tr>
              <tr>
                <th scope="row">Goods & Services Tax (GST)</th>
                <td>-₹{m.gst_inr}</td>
                <td>Prototype formula; rate and source not verified</td>
              </tr>
              <tr>
                <th scope="row">Modeled Slippage</th>
                <td>-₹{m.slippage_inr}</td>
                <td>Configured basis points sensitivity</td>
              </tr>
              <tr className="highlight-row">
                <th scope="row">Net Realized P&L</th>
                <td>₹{m.net_pnl_inr}</td>
                <td>Reconciled exact total</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
