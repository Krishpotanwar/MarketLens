# Bazaar Drishti Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax. Do not publish real market data before the rights and publication gates pass.

**Goal:** Build a professor-ready, public, read-only dashboard for one reproducible after-cost Indian cash-equity paper study and a separate baseline-compared historical forecast.

**Architecture:** A private Python build calls one documented, rights-cleared historical-data API or uses the synthetic fixture; validates and scores one fixed experiment; and emits an immutable run bundle. A gated publisher writes approved run data to PostgreSQL; a GET-only FastAPI service and React client display a public-safe summary, forecast lab, and run receipt.

**Tech Stack:** CPython 3.14.8, NumPy 2.5.4, pandas 3.0.6, scikit-learn 1.9.1, FastAPI 0.156.4, PostgreSQL 18.6, React 19.3, TypeScript, Vite 8.3.4, Node.js 24.22.0 LTS, TradingView Lightweight Charts 5.2.1; verify compatible current patches and lock them before implementation.

**Spec:** [PRD](../product/PRD.md), [TRD](../architecture/TRD.md), [data rights gates](../compliance/MARKET-DATA-AND-PUBLICATION.md)

## Global Constraints

- Public shared report, no account creation, no user-specific state, and read-only visitor API.
- Synthetic data is the public default until written rights for research use and exact derived-output publication are recorded.
- Long-only one-position SMA strategy, one NSE cash symbol, five-minute bars, no leverage/shorts/derivatives/overnight/live orders.
- Completed-bar signal fills no earlier than the next eligible bar open; missing bars and session boundaries never create invented fills.
- Strategy and forecast are separate experiments; forecasts never control orders or position sizing.
- Report measured positive, zero, or negative outcomes; do not optimize the displayed result or promise profit.
- Never publish raw market bars or a real security-specific forecast until source terms, output rights, and qualified review pass.
- Keep data/API credentials and publisher write access off the browser; the API database identity is SELECT-only.
- Preserve the standalone repo and unrelated files. Synthetic-only implementation may proceed while C0/C1 are unresolved; do not calculate or publish strategy results until their method and rights gates pass.
- Follow [Checkpoints](../project/CHECKPOINTS.md) and log experiments using the [logbook template](../project/LOGBOOK-TEMPLATE.md).

## Review Focus

1. **Timestamp, session, gap, and corporate-action inputs:** invalid/naive/duplicate/out-of-session bars fail or quarantine; no OHLC forward-fill.
2. **Next-bar fill and forced-flat boundary:** no trade uses a bar before its signal; missing next bar means no fill; close before session end without overnight carry.
3. **Fees, rounding, and slippage changes:** fee schedule has transaction dates and source; each component reconciles; assumed slippage is labeled sensitivity only.
4. **Overlapping forecast labels and session/fold boundaries:** targets never cross a close or split; preprocessing sees training only; the final test stays untouched.
5. **Synthetic/real rights state and public output:** every page/export shows the correct label; invalid or unlicensed runs cannot become active.

---

## Implementation Sequence

Real-data acquisition and scoring wait for C0/C1 evidence. Synthetic-only scaffold work can proceed while those decisions are open; do not score strategy or forecast outcomes until the method is reviewed.

### Task 1 — Lock course method and data/publication rights

**Files:** `docs/compliance/MARKET-DATA-AND-PUBLICATION.md`, `docs/product/PRD.md`, `config/study.example.yaml` (future).

- [ ] Record professor rubric, prospective-vs-historical requirement, selected instrument, period, starting capital, sizing rule, and fee convention; mark unresolved values rather than inventing them.
- [ ] Record the provider/product and verify terms for API access, research computation, storage, derived output, public display, exports, and attribution.
- [ ] If any real-data/public-output right is unresolved, freeze the public fixture to synthetic mode and record the gate as blocked for real data only.
- [ ] Write the approved study config and have the professor review its hypothesis, split, baselines, and outcomes.

**Deliverable:** a versioned study protocol plus a rights record or an explicit synthetic-only decision. **Check:** each required item is linked in the rights checklist; no unsupported instrument/capital appears.

### Task 2 — Create isolated app scaffold and synthetic contract

**Files:** `backend/pyproject.toml`, `backend/src/bazaar_drishti/`, `backend/tests/`, `web/package.json`, `web/src/`, `data/fixtures/synthetic/`, CI config.

- [x] Create the Python workspace with a supported Python range and no third-party dependencies for the fixture slice; add the locked React/Vite web shell.
- [x] Define and enforce the versioned synthetic CSV/manifest contract, including explicit synthetic labeling and artifact fingerprint checks.
- [x] Define versioned `StudyConfig`, `RunManifest`, `TradeRow`, `ForecastRow`, and `RunMetrics` schemas with explicit UTC/IST fields and `synthetic` flag.
- [x] Generate a deterministic, labeled synthetic five-minute fixture with fixed seed, synthetic session templates, a documented gap case, and no real security identity.
- [x] Write contract and fixture tests for schema validation, deterministic hashes, and synthetic labeling.
- [x] Run backend lint/type/test commands (ruff, mypy, unittest) and web typecheck/test/build from clean lockfiles.

**Deliverable:** a cleanly building scaffold and public-safe synthetic fixture. **Check:** repeated fixture builds have identical fingerprint; no provider secret or real market data is included. Current status and verification limits are in the [work log](../project/LOGBOOK.md).

### Task 3 — Implement rights-gated API acquisition and data validation

**Files:** `backend/src/bazaar_drishti/acquisition/`, `backend/src/bazaar_drishti/data/`, `backend/tests/unit/test_data.py`, `docs/research/data-source-record.md` (future).

- [ ] Define one provider adapter protocol around a selected provider's documented request, pagination, limits, timestamps, and errors; the current type is only an unconnected protocol stub.
- [ ] Implement adapter-level timeout, transient-only retry/backoff, and raw-response hashing for an approved API; retry/backoff and hashing exist, but no provider or safe timeout exists yet.
- [ ] Normalize bars to canonical timestamps/session date and validate ordering, duplicates, finite prices, five-minute grid, one symbol, integral volume, gaps, corporate actions, and session bounds; corporate-action checks remain open.
- [ ] Add tests for malformed dates, duplicates, gaps, invalid OHLC, missing next bar, unauthorized mode, rate-limit response, and network timeout; only a subset is covered and no provider exists for the last cases.
- [ ] Fail the real-data build when rights state is absent or provider schema changes; the rights gate is not wired to a provider/build, and schema-drift handling is open. Synthetic fixture remains available.

**Deliverable:** traceable external API acquisition and fail-closed normalized data. **Check:** `pytest backend/tests/unit/test_data.py -q` passes when implemented; fixture and acquired-source hashes appear in the run record.

### Task 4 — Implement fees, deterministic strategy simulation, and baselines

**Files:** `backend/src/bazaar_drishti/research/costs.py`, `backtest.py`, `baselines.py`, `backend/tests/unit/test_costs.py`, `test_backtest.py`.

- [ ] Implement date-effective, sourced fee schedule inputs with per-side brokerage, exchange/IPFT, SEBI, STT, stamp, GST base, and documented rounding; current fixed rates are illustrative and unverified.
- [x] Implement 20/50 SMA signals on completed bars and next-eligible-open fills; flatten before close and never carry overnight.
- [x] Create row-level cash/fee/slippage ledger and equity points; assert `gross - itemized charges - modeled slippage = net` under the saved rounding rule.
- [x] Implement no-trade cash and same-session buy-and-hold on matching sessions and charges.
- [ ] Test gap/limit boundaries, forced-flat fees, zero trades, insufficient capital, missing bars, out-of-session bars, and 0/5/10/20 bps sensitivity scenarios; missing cases remain.
- [ ] Recompute all headline metrics from the ledger; reject non-finite totals and inconsistent baselines; trade aggregates now reconcile, but baseline consistency and invalid direct inputs remain open.

**Deliverable:** deterministic, reconciled after-cost report on synthetic fixture. **Check:** `pytest backend/tests/unit/test_costs.py backend/tests/unit/test_backtest.py -q` passes when implemented.

### Task 5 — Implement separate chronological forecast evaluation

**Files:** `backend/src/bazaar_drishti/research/forecast.py`, `metrics.py`, `backend/tests/unit/test_forecast.py`.

- [x] Create six-bar same-session target and fixed causal features; store feature cutoff and target timestamps.
- [x] Build complete-session chronological train/validation/test windows and purge any label spanning a session/fold boundary.
- [x] Fit preprocessing and logistic regression only on training; calculate the base-rate comparator only from the same training fold.
- [ ] Store historical predictions as `simulated_replay`, then append outcomes after prediction generation; forecasts are labeled replay, but prediction and outcome generation are not separate steps.
- [ ] Compute Brier score, log loss, balanced accuracy, class counts, and reliability-bin counts; empty scores are unavailable and one-class balanced accuracy is unavailable, but the minimum sample rule is not predeclared.
- [x] Test future-row perturbations do not change earlier features/predictions, labels never cross a boundary, and contributions sum to the model logit.

**Deliverable:** reproducible model report that cannot train on its final test. **Check:** `pytest backend/tests/unit/test_forecast.py -q` passes when implemented.

### Task 6 — Validate immutable bundles and publish transactionally

**Files:** `backend/src/bazaar_drishti/bundle/`, `db/migrations/001_published_runs.sql`, `backend/tests/integration/test_publisher.py`.

- [ ] Emit manifest, metrics, ledger, forecast rows, equity points, exclusions, hashes, and validation report for each run; exclusions and bundled validation reports are not represented.
- [ ] Reject unknown schema, unapproved real-data rights, synthetic label mismatch, missing fee/version hashes, arithmetic mismatch, or invalid split provenance; ledger/counts/splits are checked and all real publication is blocked, but rights evidence and fee provenance are not integrated.
- [ ] Create and verify versioned PostgreSQL tables with fixed-precision money, UTC time, run-scoped immutable rows, and indexed keyset pagination; migration exists, but PostgreSQL tools/service are unavailable in this VM.
- [ ] Publish one validated run through PostgreSQL in one transaction; current publisher is SQLite-only, though the SQLite prototype now tests rollback and immutable artifact rows.
- [ ] Test denied writes through the API database role, PostgreSQL rollback, and immutable existing run content; the API role and PostgreSQL integration environment are unavailable.

**Deliverable:** safely publishable synthetic bundle and auditable promotion/rollback. **Check:** PostgreSQL integration tests pass against an ephemeral test database when implemented.

### Task 7 — Expose bounded read-only FastAPI endpoints

**Files:** `backend/src/bazaar_drishti/api/`, `backend/tests/api/`, generated TypeScript OpenAPI types.

- [x] Implement prototype `GET /api/v1/runs/current`, run metadata, bounded equity points, keyset-paged trades/forecasts, public-safe receipt, and health endpoint; it remains backed by SQLite and is not wired to PostgreSQL.
- [ ] Add response schemas and caps for date range, pagination, filter allow-list, unknown run, and payload size; positive pagination limits are enforced, while date filters and response-size rules remain open.
- [ ] Configure API database identity as SELECT-only and same-origin release configuration; mutation methods return 405, but there is no least-privilege database identity or release config.
- [ ] Generate frontend types from OpenAPI in CI and fail on uncommitted schema drift; `web/src/types/api.ts` is handwritten.
- [ ] Test no source bar or secret fields appear in JSON and verify API-role write denial; only route-level mutation rejection and basic endpoint tests exist.

**Deliverable:** API serves only a validated published run. **Check:** API contract/integration suite passes and OpenAPI type generation is clean when implemented.

### Task 8 — Build Overview, Forecast Lab, and Run Receipt UI

**Files:** `web/src/pages/`, `web/src/components/`, `web/src/styles/`, `web/tests/`.

- [ ] Implement navigation and a shared run-status/synthetic badge from one API run ID; navigation exists, but the app has no API data connection.
- [ ] Build Overview with net P&L, baselines, costs, equity/drawdown, and session/sample context; static pages exist, but there is no active run or equity chart.
- [ ] Build Forecast Lab with target horizon, base-rate comparison, score/count cards, reliability chart, and deterministic contribution table; cards/feature descriptions exist, but no reliability or contribution data is wired.
- [ ] Build Run Receipt/Method with data/right status, fingerprint, configuration, split/cost/fill assumptions, limitations, and permitted export; page is static and its copy still needs qualified review.
- [ ] Add loading/no-run/stale/failure/insufficient-data states; no-run/loading exist, but stale, request-failure, and insufficient-sample states are missing.
- [ ] Add keyboard/screen-reader semantics, text tables for charts, units/labels, contrast, visible focus, and reduced-motion behavior; semantic tables exist, full accessibility checks do not.
- [ ] Test the user journey on the synthetic fixture and verify chart totals against API values; current tests render components only, with no browser/API journey.

**Deliverable:** professor can audit an entire synthetic run without an account. **Check:** Vitest/component suite and browser journey pass when implemented.

### Task 9 — Harden, review, deploy, and rehearse release

**Files:** CI workflows, deployment files, `docs/project/RUNBOOK.md`, release evidence.

- [ ] Build and deploy a staging version on an approved same-origin host; no deployment target or secret store is configured.
- [ ] Run accessibility, secret/dependency, API permission, and browser-smoke reviews; these were not run in this VM.
- [ ] Measure response and load targets on a representative fixture; no load target or service deployment exists.
- [ ] Confirm public copy, source rights, allowed outputs, attribution, qualified review, raw-data exclusion, and rollback target; C0/C1 remain open.
- [ ] Rehearse run promotion and rollback against PostgreSQL; only the SQLite prototype has an injected rollback test.
- [ ] Promote a synthetic or real run only after its applicable C0/C1 and C7 release gates pass; no run is approved for publication.

**Deliverable:** public synthetic dashboard or rights-cleared real report, with reproducible release receipt and rollback path.

## Future execution and commits

The plan itself does not create code or a commit. Before a future commit, run scoped GitNexus `detect_changes({scope: "all"})` from this repository and resolve partial/truncated output; review the diff and ensure the index covers only the Bazaar Drishti root.
