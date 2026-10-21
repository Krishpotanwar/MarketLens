# Technical requirements — Bazaar Drishti

**Status:** implementation in progress — synthetic fixture and contract scaffolding  
**Date:** 2026-10-21  
**Product requirements:** [PRD](../product/PRD.md)  
**Current research and versions:** [research brief](../research/2026-10-21-research-brief.md)

## 1. Architecture

The system is a private research builder plus a public read-only report service:

```text
rights-cleared documented API ─┐
                               ├─> offline Python build -> validated immutable run bundle
synthetic fixture ─────────────┘                              |
                                                             v
                                                   controlled publisher
                                                             |
                                                             v
                                              PostgreSQL published-run tables
                                                             |
                                  GET-only FastAPI <──────────┘
                                       |
                                       v
                              React/TypeScript web client
```

The live browser never calls a market-data provider. The provider call runs in the private acquisition/build step so credentials, source data and provider terms stay outside browser code. Until rights are verified, the public site reads a synthetic run only.

The initial deployment should serve the static Vite build and FastAPI API from one origin, with managed PostgreSQL behind them. Select the hosting vendor only after budget, region, backup, and free-tier terms are confirmed. No account system or user-specific state exists.

## 2. Stack snapshot

Candidate versions verified on 2026-10-21; final exact pins belong in lockfiles and must be rebuilt on supported targets before implementation is called stable.

| Area | Candidate | Constraint |
|---|---|---|
| Runtime | CPython 3.14.8 | Python 3.15.0 is newer, but the chosen NumPy line currently supports Python through 3.14; verify wheels/build image in CI before pinning. Use standard CPython, not free-threaded mode initially. |
| Data/ML | NumPy 2.5.4, pandas 3.0.6, scikit-learn 1.9.1 | No GPU, deep learning, LLM, sentiment, causal-discovery, or distributed compute dependency for one fixed study. |
| Python environment | `pyproject.toml` + `uv.lock` | Reproducible locked environment; record Python/package versions in each run. |
| API | FastAPI 0.156.4 + Pydantic 2 compatible | Typed bounded GET routes; use generated OpenAPI as the API contract. |
| Frontend | React 19.3, TypeScript, Vite 8.3.4, Node.js 24.22.0 LTS | Static client, same-origin API. Avoid SSR/server actions for the no-account report. |
| Charts | `lightweight-charts` 5.2.1 | Use for equity/performance and forecast plots. Apply license notices and attribution. Do not display protected market bars without rights. |
| Database | PostgreSQL 18.6 | Use stable 18.x. PostgreSQL 19 is a pre-release in this snapshot. |
| Tests/quality | pytest, Vitest, React Testing Library, Playwright, Ruff, TypeScript strict mode | Pin compatible stable versions in lockfiles; no coverage target substitutes for correct financial assertions. |
| Styling/motion | CSS variables and component styles | Small motion only; support `prefers-reduced-motion`. No animation framework is required. |

## 3. Repository layout

```text
docs/                         PRD, TRD, research, checkpoints, runbook
config/study.example.yaml     reviewed, versioned study parameters (no secrets)
data/fixtures/synthetic/      small, deterministic, clearly synthetic fixture
db/migrations/                ordered SQL schema migrations
backend/pyproject.toml        Python project configuration and lock
backend/src/bazaar_drishti/
  acquisition/                one documented provider adapter; no scraping
  data/                       normalization and quality checks
  research/                   features, costs, simulation, forecast, metrics
  bundle/                     manifest, ledger, validation, publish command
  api/                        FastAPI GET routes and response schemas
backend/tests/                unit and PostgreSQL/API integration tests
web/                          Vite/React/TypeScript client and lockfile
.github/workflows/            lint, typecheck, tests, build, dependency/security review
```

The initial implementation is synthetic-only until the method and rights checkpoints pass. The fixture generator and versioned Python study/run record schemas are under `backend/src/bazaar_drishti/`; they do not acquire real data or calculate trading results. The web shell shows the no-validated-run state and makes no result claims. Schema JSON serialization/deserialization remains future work. No real dataset is checked into Git by default.

## 4. Data ingestion and normalization

### Provider adapter

- Implement one provider interface after written rights and the professor’s rubric identify the source. Use the provider’s documented API, authentication, throttling, pagination, and error semantics.
- The adapter makes a bounded request for the configured symbol/date range and writes source responses to an access-controlled, non-Git location.
- Keep API secrets in the operator environment/secret store. Never include them in the Vite build, response body, logs, exception text, or receipt.
- Record provider/API product, acquisition timestamp, request window, dataset hash, provider revision if available, and license reference.
- Do not retry forever. Apply finite timeouts, bounded retries with backoff for transient errors, and fail the run on permission, schema, or quota errors.
- If a provider has no documented right for use, no real-data adapter is enabled; the synthetic fixture remains the fallback.

### Normalized bars

Canonical internal columns: `symbol`, `session_date` (Asia/Kolkata), `timestamp_utc`, `open`, `high`, `low`, `close`, `volume`, `source_sequence`/provider row id where available, and `adjustment_status`.

Reject or quarantine:

- Naive or ambiguous timestamps, duplicate keys, non-monotonic order, invalid timezone conversion, or bars outside the configured regular session.
- Non-positive prices, impossible OHLC relationships, negative volume, malformed records, or undocumented corporate-action adjustments.
- Unexpected missing bars, session-crossing bars, or a target horizon that crosses a market close or split boundary.

Never silently forward-fill OHLCV. Store gaps/exclusions in the run receipt. Raw inputs stay immutable; normalized data receives a deterministic fingerprint.

## 5. Experiment and calculations

### Strategy simulation

- One locked 20/50 SMA crossover on completed five-minute bars; long-only, one position at a time, fixed starting virtual capital and quantity sizing in `study.yaml`.
- Decide on completed close `t`; earliest fill is the next eligible bar open `t+1`. If that bar does not exist, do not invent a fill.
- Flatten before session close using a documented prior-bar decision and next-open fill; never carry overnight. Validate session bar labels against the provider calendar.
- Calculate share cash flows at fill prices. Apply dated brokerage/exchange/IPFT/SEBI/STT/stamp/GST components and the documented slippage scenario to the correct notional/side. Keep each component, input rate, effective period, source, and rounding rule explicit.
- Run 0/5/10/20 bps per-side slippage as sensitivity cases only; never call these calibrated estimates. Include exit and forced-flat costs.
- Run the same sessions/capital/fee schedule for no-trade cash and same-session buy-and-hold.
- Headline net = gross realized P&L − charges − modeled slippage. Preserve both gross and net; reconcile ledger and aggregate exactly to the chosen rounding rule.

### Forecast experiment

- Target: whether close at origin `t+6` is above close at origin `t`, with both within the same regular session; six five-minute bars represent 30 minutes. Encode ties/invalid labels consistently and store the rule in `study.yaml`.
- Fixed causal features: trailing 1/3/6-bar returns, distance to trailing 20/50-bar SMA, and trailing 20-bar realized volatility. Exclude current/future data beyond the input cutoff.
- Fit imputation/scaling and logistic regression on training only. Baseline probability is the training-fold positive-label rate; no test-fold prevalence is used to construct it.
- Split by complete sessions in chronological order (initial 60/20/20 train/validation/test proposal), purge every label whose forward window crosses a session/fold boundary, and keep final test untouched after validation. If the data length cannot support the split, stop and report insufficient sample.
- Save historical forecasts as `simulated_replay`; store origin, input cutoff, target, model/config/data fingerprints, probability, baseline probability, and standardized feature contributions. Append realized outcomes to a separate record after scoring.
- Report Brier score, log loss, balanced accuracy, confusion counts, class base rate, and reliability bins with sample counts. Do not call Brier a calibration-only measure. Do not display bins below a predeclared minimum count.
- Any bootstrap interval is exploratory and predeclared: contiguous-session/block method, block length, repetitions, seed, and sample threshold appear in the manifest. If there are too few independent sessions, omit the interval and say why; the threshold is a study design choice, not a universal rule.
- Per-row explanation is coefficient × standardized feature plus intercept. It explains the fitted logistic logit, not why a price moved.

## 6. Immutable run bundle and publication

Every candidate run produces a directory/bundle with:

- `manifest.json`: schema version, `run_id`, `synthetic`, source/license label, data hash, code revision, config hash, software lock versions, symbol/bar/session span, build timestamp, timezone policy, exclusions, fee schedule id, slippage scenario, split dates, model/strategy versions, and rights/review state.
- `metrics.json`: gross/net P&L, return, costs by type, drawdown, trades/sessions, baseline comparisons, forecast scores, counts, uncertainty status, and limitations.
- `trades.csv`/JSONL and `equity.csv`/JSONL: row-level ledger and equity curve.
- `forecasts.csv`/JSONL: point-in-time replay records and deterministic contributions; outcomes stored separately or appended only after evaluation.
- `validation.json`: data checks, arithmetic reconciliation, schema version, and any reasons the run cannot publish.

Validation rejects missing hashes, unapproved real-data rights state, non-finite values, ledger mismatch, overlapping split labels, impossible timestamps, missing synthetic labels, unknown fee schedule, or configuration drift.

The publisher runs as an operator-controlled command with a write credential, checks the bundle and rights gate, then inserts all run rows and updates the active-run pointer in one transaction. Published run content is immutable. Rollback changes only the pointer; it never rewrites a historical run. Keep the publisher credential separate from the API.

## 7. Database and API contract

### Database

- Tables: `research_runs`, `run_metrics`, `equity_points`, `trade_ledger`, `forecast_records`, `forecast_outcomes`, and `fee_schedule_versions`.
- Primary keys are scoped to a run. Add indexes for `run_id`, event time, and stable pagination keys.
- Store money in fixed-precision `NUMERIC` or integer paise with a documented rounding convention; never binary float for stored currency totals.
- Persist timestamps in UTC and retain explicit IST session date.
- Store the public-safe manifest in JSONB plus normalized fields required for queries. Do not store restricted raw bars in public tables.
- The FastAPI database identity has `SELECT` privileges only on published tables. The migration/publisher identity is private and separate.

### Read-only endpoints

- `GET /api/v1/runs/current` — active run summary and data label.
- `GET /api/v1/runs/{run_id}` — run metadata and state.
- `GET /api/v1/runs/{run_id}/equity` — bounded range of equity/drawdown points.
- `GET /api/v1/runs/{run_id}/trades?cursor=&limit=` — stable keyset-paginated ledger rows.
- `GET /api/v1/runs/{run_id}/forecasts?cursor=&limit=` — historical forecasts and permitted explanation fields.
- `GET /api/v1/runs/{run_id}/receipt` — public-safe manifest, methodology, and limitations.
- `GET /healthz` — non-sensitive process health; never expose connection strings, secret values, or detailed stack traces.

Use FastAPI OpenAPI as the schema source and generate TypeScript types during CI. Reject unknown run IDs, invalid date windows, oversized limits, and unsupported filters. No `POST`, `PUT`, `PATCH`, or `DELETE` endpoint exists. Same-origin deployment is preferred; if origins differ, allow only the exact production client origin.

## 8. Frontend and interaction

- Pages: Overview, Forecast Lab, Run Receipt/Method.
- Fetch only the current published run and bounded data; provide loading, empty, stale, failed, and retry states.
- Use the same run ID and `synthetic` badge in navigation, chart labels, exports, and accessible text.
- Main plots: equity vs cash/buy-and-hold, drawdown, fee/slippage breakdown, probability/reliability. No public source OHLC chart until rights permit.
- Use tabular numbers, INR/IST units, clear axes, legends, textual summaries/tables, non-color status cues, keyboard navigation, visible focus, and reduced motion.
- Animation is limited to short state transitions and loading feedback. Do not pulse prices as if live. Honor `prefers-reduced-motion`.
- Target WCAG 2.2 AA; verify with keyboard and screen reader checks plus automated scans. Automated checks do not establish full conformance.

## 9. Security, privacy, and operations

- No visitor authentication or personal profile exists, so do not collect names, emails, portfolios, or free-form visitor data.
- Keep production DB credentials, provider keys, and publisher write credentials server-side. Read API cannot publish. Add secret scanning and dependency/security review in CI.
- Use HTTPS, secure headers, restrictive Content Security Policy, server-side validation, parameterized SQL, bounded pagination, payload limits, request rate limits, and safe errors.
- Avoid third-party analytics by default. Operational logs contain request path/status/duration and run id only; redact authorization headers, query credentials, and provider payloads.
- Back up PostgreSQL and rehearse restore before real-data publication. Health endpoint and deploy rollback must be documented.
- Host budget/region/retention are open. Do not choose a paid plan or promise 24/7 availability before provider pricing and course needs are confirmed.

## 10. Quality and acceptance gates

### Test layers to implement

- Unit: timestamp/session parsing, OHLC validation, gap and corporate-action policies, fee calculation/rounding, next-bar fills, forced-flat behavior, baseline alignment, label purging, model contributions, and bundle validation.
- Property/regression: ledger identity `gross - fees - slippage = net`, no negative cash unless explicitly allowed, no trade before signal, no forecast input after cutoff, deterministic bundle from fixed fixture/config/code.
- Integration: PostgreSQL transaction atomicity, immutable published rows, active-pointer rollback, API read-only database permissions, bounded pages, invalid-run handling.
- UI: synthetic/real badge on all pages, no placeholder returns, empty/error states, keyboard/focus/reduced motion, receipt values matching API.
- End-to-end: fresh browser reaches public synthetic demo without sign-up, inspects forecast and run receipt, downloads permitted export, and sees no live-trading controls.

### Provisional runtime targets

- Summary/receipt API p95 < 1 second and bounded detail page p95 < 1.5 seconds at the expected single-classroom audience; measure on the chosen host.
- First meaningful dashboard content < 3 seconds on representative broadband and mid-range laptop; lazy-load large detail pages.
- Cap first real run input at 100,000 five-minute bars; paginate all row-level detail. Revisit only if a licensed multi-symbol study is approved.
- CI must build from lockfiles, pass linters/type checks/unit/integration/browser tests, check secret/dependency issues, and validate deployment artifact before promotion.

These are provisional engineering targets, not measured claims.
