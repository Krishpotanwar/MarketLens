import type { RunMetadataResponse } from "../types/api";

interface RunReceiptPageProps {
  runData: RunMetadataResponse | null;
  loading: boolean;
}

export function RunReceiptPage({ runData, loading }: RunReceiptPageProps) {
  if (loading) {
    return (
      <section className="intro" aria-busy="true">
        <p className="eyebrow">Run Receipt</p>
        <h1>Loading audit receipt...</h1>
      </section>
    );
  }

  if (!runData) {
    return (
      <section className="intro">
        <p className="eyebrow">Run Receipt</p>
        <h1>No receipt available</h1>
        <p className="status-copy">Run has not been validated or published.</p>
      </section>
    );
  }

  const downloadReceipt = () => {
    const blob = new Blob([JSON.stringify(runData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${runData.run_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content" tabIndex={-1}>
      <section className="intro" aria-labelledby="receipt-title">
        <p className="eyebrow">
          Audit Certificate: <span>{runData.run_id}</span>
        </p>
        <h1 id="receipt-title">Run Receipt & Provenance</h1>
        <p className="status-copy">
          Cryptographic hashes, data rights status, and reproducible execution contract.
        </p>
      </section>

      <section className="section-block" aria-labelledby="provenance-heading">
        <div className="receipt-actions">
          <h2 id="provenance-heading">Artifact Provenance</h2>
          <button type="button" className="action-button" onClick={downloadReceipt}>
            Download JSON Receipt
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table" aria-label="Artifact Fingerprints">
            <thead>
              <tr>
                <th scope="col">Property</th>
                <th scope="col">Recorded Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Run ID</th>
                <td><code>{runData.run_id}</code></td>
              </tr>
              <tr>
                <th scope="row">Data Rights Classification</th>
                <td>
                  <strong>{runData.synthetic ? "SYNTHETIC FIXTURE" : "NON-SYNTHETIC — RIGHTS REVIEW REQUIRED"}</strong> (
                  {runData.data_label})
                </td>
              </tr>
              <tr>
                <th scope="row">Bars SHA-256</th>
                <td><code>{runData.bars_sha256}</code></td>
              </tr>
              <tr>
                <th scope="row">Config SHA-256</th>
                <td><code>{runData.config_sha256}</code></td>
              </tr>
              <tr>
                <th scope="row">Code Revision</th>
                <td><code>{runData.code_revision}</code></td>
              </tr>
              <tr>
                <th scope="row">Build Timestamp (UTC)</th>
                <td>{runData.created_at_utc}</td>
              </tr>
              <tr>
                <th scope="row">Observation Span</th>
                <td>{runData.data_start_utc} to {runData.data_end_utc}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="section-block" aria-labelledby="limitations-heading">
        <h2 id="limitations-heading">Prototype Status & Limitations</h2>
        <ul className="limitations-list">
          <li><strong>Data rights:</strong> No provider license or qualified publication review is recorded; only synthetic data may be used.</li>
          <li><strong>Fee assumptions:</strong> Fixed rates are illustrative, undated, and unverified.</li>
          <li><strong>Research status:</strong> Course methodology is awaiting review. This prototype is not approved for decision-making or public research claims.</li>
        </ul>
      </section>
    </div>
  );
}
