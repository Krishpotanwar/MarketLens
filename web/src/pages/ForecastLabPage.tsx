import type { RunMetadataResponse } from "../types/api";

interface ForecastLabPageProps {
  runData: RunMetadataResponse | null;
  loading: boolean;
}

export function ForecastLabPage({ runData, loading }: ForecastLabPageProps) {
  if (loading) {
    return (
      <section className="intro" aria-busy="true">
        <p className="eyebrow">Forecast Lab</p>
        <h1>Loading forecast evaluation...</h1>
      </section>
    );
  }

  if (!runData) {
    return (
      <section className="intro">
        <p className="eyebrow">Forecast Lab</p>
        <h1>No forecast data available</h1>
        <p className="status-copy">Run a verified study to inspect historical probability predictions.</p>
      </section>
    );
  }

  const m = runData.metrics;

  return (
    <div className="page-content" tabIndex={-1}>
      <section className="intro" aria-labelledby="forecast-title">
        <p className="eyebrow">
          Evaluation Split: <span>Chronological session holdout</span>
        </p>
        <h1 id="forecast-title">Forecast Lab & Calibration</h1>
        <p className="status-copy">
          The final test sessions are held out from fitting. This prototype has no professor-approved forecast method or result.
        </p>
      </section>

      <section className="stats-grid" aria-label="Forecast Verification Metrics">
        <div className="stat-card">
          <p className="stat-label">Brier Score</p>
          <p className="stat-value">{m.brier_score ?? "—"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Log Loss</p>
          <p className="stat-value">{m.log_loss ?? "—"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Balanced Accuracy</p>
          <p className="stat-value">{m.balanced_accuracy ? `${(parseFloat(m.balanced_accuracy) * 100).toFixed(1)}%` : "—"}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Evaluated Forecasts</p>
          <p className="stat-value">{m.forecast_count}</p>
        </div>
      </section>

      <section className="section-block" aria-labelledby="method-heading">
        <h2 id="method-heading">Causal Feature Engineering</h2>
        <div className="table-wrapper">
          <table className="data-table" aria-label="Causal Feature Definitions">
            <thead>
              <tr>
                <th scope="col">Feature Code</th>
                <th scope="col">Lookback</th>
                <th scope="col">Formula & Cutoff Semantics</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">ret_1</th>
                <td>1 bar (5 min)</td>
                <td>(Close[t] - Close[t-1]) / Close[t-1]</td>
              </tr>
              <tr>
                <th scope="row">ret_3</th>
                <td>3 bars (15 min)</td>
                <td>(Close[t] - Close[t-3]) / Close[t-3]</td>
              </tr>
              <tr>
                <th scope="row">ret_6</th>
                <td>6 bars (30 min)</td>
                <td>(Close[t] - Close[t-6]) / Close[t-6]</td>
              </tr>
              <tr>
                <th scope="row">dist_sma20</th>
                <td>20 bars</td>
                <td>(Close[t] - SMA20[t]) / SMA20[t]</td>
              </tr>
              <tr>
                <th scope="row">dist_sma50</th>
                <td>50 bars</td>
                <td>(Close[t] - SMA50[t]) / SMA50[t]</td>
              </tr>
              <tr>
                <th scope="row">vol_20</th>
                <td>20 bars</td>
                <td>Realized return standard deviation over trailing 20 bars</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
