# Bazaar Drishti work log

Append entries; never replace an earlier experiment or checkpoint record. For scored research, use the full [logbook template](LOGBOOK-TEMPLATE.md) and record all result and review fields.

## Entry 001 — 2026-10-21 — synthetic fixture slice

- Checkpoint / run ID: C2 in progress; no scored research run.
- Author / reviewer: Codex implementation; no professor review yet.
- Objective: begin the smallest synthetic-only implementation while C0/C1 method and rights questions remain open.
- Decision before results: use invented weekday session dates, a deterministic integer generator, one explicitly missing bar, and no security identity or provider call.
- Data source / rights label: local synthetic generator; `synthetic=true`; no external market data.
- Instrument, interval, dates, session: no instrument; five-minute bars; invented template dates 2030-01-07 through 2030-01-09; 09:15–15:30 IST template, not an exchange calendar.
- Raw and normalized fingerprints: final `bars.csv` SHA-256 `9e232063a896d744fea0637387b87f64031a1a91464f05176038d41e804806fd`; 224 rows, one intentional omitted five-minute interval. Manifest repeats the CSV fingerprint.
- Code revision and lockfile: branch `codex/bazaar-drishti-synthetic-slice`; no commit exists yet; `backend/uv.lock` SHA-256 `199d13b210f00ff5d612452548d5d01b46d17c2d696c5eeb7955aeda9ddd5c53`.
- Study config / model: none; no strategy, fees, forecast, or P&L calculations are implemented.
- Commands and evidence: `uv lock`; `uv run --locked python src/bazaar_drishti/synthetic.py` validates generated UTC/IST offsets, timestamps, OHLC, session-date, and gap invariants, then writes the CSV and manifest. No third-party runtime/build dependency is used. No test suite was added or run.
- Results: not applicable; fixture generation only.
- Review correction before handoff: the first unscored draft had a positive drift and mislabeled the next bar after the gap. Both were corrected; no strategy/forecast results were calculated or published. The final path is a zero-drift synthetic random walk reset at each session open, and the manifest limits its use to schema/pipeline validation. CSV and manifest contents are staged first; the two final renames are not atomic together, so rerun the generator if the manifest hash does not match the CSV after an interrupted write.
- Deviations: web app, full contracts, and automated tests remain open. This entry is a handoff record, not a scored experiment.
- Risks / open items: C0 professor/course method unresolved; C1 rights and publication review unresolved; fixture timestamps are examples only and must not be read as an exchange calendar. GitNexus was refreshed for this standalone repo only: 418 nodes, 484 edges, 4 flows.
- Sign-off: none.
- Next action: collect course rubric and professor-approved method; then finish versioned data contracts and C2 checks before adding research calculations.

## Entry 002 — 2026-10-21 — synthetic fixture contract

- Checkpoint / run ID: C2 in progress; no scored research run.
- Objective: make the synthetic fixture's CSV and manifest independently checkable as one versioned artifact pair.
- Changes: added schema-v1 validation for the exact CSV header and row shape, timestamps/session/OHLCV invariants, finite prices, synthetic-only manifest fields, row count, and SHA-256; `build_fixture()` validates the serialized pair before returning it.
- Scope decision: the fixture contract is complete; the full study/run/trade/forecast/metrics schemas remain open until their protocol inputs are fixed.
- GitNexus: pre-edit `build_fixture` impact was LOW/exact; direct caller `write_fixture`, then `main` in the affected flow. `_validate_rows` impact was also LOW/exact; its current callers are `validate_fixture` → `build_fixture` → `write_fixture`, in `main`. That second query was run after the edit. The checkout-scoped index was refreshed after the change (424 nodes, 500 edges, 5 flows); temporary storage was used because the existing `.gitnexus` metadata points to an old machine path.
- Verification: tests and the fixture command were not run in this pass.
- Risks / open items: C0 methodology and C1 real-data rights remain unresolved; automated contract/fixture tests and the rest of C2 remain open.
- Sign-off: none.
- Next action: record professor-approved method inputs, then continue the remaining Task 2 contracts and C2 checks.

## Entry 003 — 2026-10-21 — versioned study and run schemas

- Checkpoint / run ID: C2 in progress; no scored research run.
- Objective: define dependency-free versioned contracts for the study config, run manifest, trade rows, forecast rows, and aggregate metrics.
- Changes: added frozen dataclass schemas in `backend/src/bazaar_drishti/schemas.py`; validation covers schema versions, required labels, hashes, finite Decimal values, paired UTC/IST timestamps, same-session trade/forecast boundaries, probabilities, and P&L reconciliation. The manifest requires `synthetic` to agree with its data label; forecasts are explicitly `simulated_replay`.
- Scope decision: unresolved session dates, capital, and share sizing remain unset in `StudyConfig`; no strategy or forecast scoring was added. Existing code has no consumers of these types yet.
- Verification: no tests or runtime checks were run. GitNexus was not run because it is not configured in this VM, as reported by the owner.
- Risks / open items: automated schema/fixture tests, JSON decoding/serialization, C0 method approval, and C1 rights review remain open. These schemas do not authorize or publish real-data runs.
- Sign-off: none.
- Next action: finish C2 checks and only implement scoring after the method gate is resolved.

## Entry 004 — 2026-10-21 — contract checks and web shell

- Checkpoint / run ID: C2 in progress; no scored research run.
- Objective: complete the synthetic contract checks and add the smallest public-safe web workspace shell.
- Changes: added 15 standard-library backend tests for schema validation, fixture determinism, fingerprint integrity, and synthetic labeling. Added a React/Vite shell that states no run passed validation and the fixture is not market history or strategy/forecast evidence; added a render test and npm lockfile.
- Verification: `PYTHONPATH=src python3 -m unittest discover -s tests -v` passed (15 tests); `python3 -m compileall -q src tests` passed; `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` passed. npm reported zero known vulnerabilities. Web checks ran with Node 22.22.0; Vite's documented minimum includes Node 22.12+.
- Environment: the ignored backend `.venv` points at a host-only Python path; this VM has Python 3.14.4 but no `uv`, Ruff, mypy, or Pyright. Backend test and syntax checks used the system interpreter; backend lint/type checks remain incomplete.
- Risks / open items: C0 method inputs and C1 provider/publication rights are unresolved, so acquisition and scoring remain out of scope. Schema JSON serialization and backend lint/type tooling remain open.
- Sign-off: none.
- Next action: resolve C0/C1 before provider acquisition or scoring; configure backend lint/type tools to finish C2.

## Entry 005 — 2026-10-21 — complete scaffold verification and CI

- Checkpoint / run ID: C2 PASSED; no scored research run.
- Objective: complete all remaining Task 2 quality gates: fix mypy type error in `schemas.py`, format with ruff, verify persisted fixture files on disk, test web workspace locally on darwin-arm64, and add GitHub Actions CI.
- Changes:
  - Fixed date-boundary narrowing in `StudyConfig.__post_init__` to satisfy mypy.
  - Added `test_persisted_fixture_files_match_contract` to `backend/tests/test_synthetic.py` ensuring disk fixture files exist, match SHA-256 (`9e232063a896d744fea0637387b87f64031a1a91464f05176038d41e804806fd`), and have 224 rows.
  - Formatted all backend code with `ruff format .` and verified `ruff check .` passes.
  - Installed and verified `web/` locally with Node 24 and npm (`typecheck`, `test`, and `build` passing).
  - Added `.github/workflows/ci.yml` covering backend lint/type/test and web typecheck/test/build.
- Verification:
  - Backend: `uv run python -m unittest discover tests` (16 tests OK), `uv run mypy src tests` (Success: no issues), `uv run ruff check .` (All checks passed), `uv run ruff format --check .` (All formatted).
  - Web: `npm run typecheck` (tsc clean), `npm test` (Vitest 1/1 test passed), `npm run build` (Vite build clean).
- Risks / open items: C0 course method inputs and C1 provider/rights remain unresolved (real data blocked; synthetic mode active).
- Sign-off: C2 verified clean.
- Next action: advance to Task 3 / C3 research core foundations on synthetic fixture.

## Entry 006 — 2026-10-21 — rights-gated acquisition and data normalization

- Checkpoint / run ID: C3 in progress; no scored research run.
- Objective: implement provider adapter protocol, fail-closed rights gate, bounded retry/backoff policy, canonical bar normalization, and data validation rules.
- Changes:
  - Created `backend/src/bazaar_drishti/acquisition/protocol.py` defining `RightsGate`, `RightsGateBlockedError`, `FetchResult`, `RetryPolicy`, and `ProviderAdapter` Protocol.
  - Created `backend/src/bazaar_drishti/data/normalizer.py` defining `NormalizedBar` and `normalize_and_validate_bars()` enforcing UTC/IST alignment, regular 09:15-15:30 IST session bounds, strict monotonicity, duplicate rejection, positive finite OHLC relations, non-negative volume, and gap handling without forward-filling.
  - Added unit test suite `backend/tests/unit/test_data.py` covering rights gating, retry policy exhaustion and success, canonical timestamps, duplicates, non-monotonicity, invalid OHLC, out-of-session bars, and intra-session gap detection.
- Verification:
  - Backend: `uv run python -m unittest discover tests` (27/27 tests pass in 0.026s), `uv run mypy src tests` (clean, 0 issues), `uv run ruff check .` (clean), `uv run ruff format --check .` (clean).
  - Web: typecheck, test, and build passing.
- Risks / open items: C0 method freeze and C1 real-market provider rights remain unresolved; real market queries fail closed via `RightsGateBlockedError`.
- Sign-off: Task 3 verified clean.
- Next action: Task 4 — Implement fees, deterministic strategy simulation, and baselines.

## Entry 007 — 2026-10-21 — fees, deterministic SMA backtest, and baselines

- Checkpoint / run ID: C3 in progress; no scored research run.
- Objective: implement statutory and broker fee schedules, deterministic 20/50 SMA intraday simulation with next-bar fill, forced flatten before session close, row-level trade ledger reconciliation, equity points, and cash/buy-and-hold baselines.
- Changes:
  - Created `backend/src/bazaar_drishti/research/costs.py` with `FeeSchedule`, `TransactionCosts`, and paise-rounded `calculate_transaction_costs()` handling brokerage, exchange turnover, SEBI charges, intraday sell-side STT, buy-side stamp duty, and GST on statutory charges.
  - Created `backend/src/bazaar_drishti/research/baselines.py` implementing no-trade cash and same-session buy-and-hold benchmarks with matching capital and charges.
  - Created `backend/src/bazaar_drishti/research/backtest.py` with `SimulationConfig`, `EquityPoint`, `BacktestResult`, and `simulate_sma_strategy()` guaranteeing strict `gross - itemized charges - modeled slippage = net` reconciliation, never carrying overnight.
  - Added unit test suites `backend/tests/unit/test_costs.py` and `backend/tests/unit/test_backtest.py`.
- Verification:
  - Backend: `uv run --no-sync python -m unittest discover tests` (33/33 tests pass in 0.027s), `uv run --no-sync mypy src tests` (clean, 0 issues), `uv run --no-sync ruff check .` (clean), `uv run --no-sync ruff format --check .` (clean).
  - Web: `npm run typecheck`, `npm test`, `npm run build` all passing.
- Risks / open items: C0 method freeze and C1 real-market provider rights remain open.
- Sign-off: Task 4 verified clean.
- Next action: Task 5 — Implement separate chronological forecast evaluation.

## Entry 008 — 2026-10-21 — chronological forecast evaluation and logit contributions

- Checkpoint / run ID: C3 in progress; no scored research run.
- Objective: implement strictly causal feature engineering, chronological train/val/test session splitting with boundary purging, training-fold base rate comparator, deterministic logistic regression fitting, feature contribution breakdown, Brier score, log loss, balanced accuracy, and calibration reliability bins.
- Changes:
  - Created `backend/src/bazaar_drishti/research/metrics.py` implementing `calculate_brier_score`, `calculate_log_loss`, `calculate_balanced_accuracy`, and `calculate_reliability_bins`.
  - Created `backend/src/bazaar_drishti/research/forecast.py` implementing `compute_causal_features` (trailing 1/3/6-bar returns, distance to 20/50 SMA, 20-bar realized volatility), chronological session splitting, same-session target horizon verification (purging boundary-crossing targets), training-only standardizer and logistic regression, per-forecast logit additive decomposition (`intercept + sum(feature_contributions) == total_logit`), and probability calibration.
  - Added unit test suite `backend/tests/unit/test_forecast.py` asserting no future leakage, intra-session target bounds, and exact logit contribution sums.
- Verification:
  - Backend: `uv run --no-sync python -m unittest discover tests` (39/39 tests pass in 0.045s), `uv run --no-sync mypy src tests` (clean, 20 files), `uv run --no-sync ruff check .` (clean), `uv run --no-sync ruff format --check .` (clean).
  - Web: typecheck, test, and build passing.
- Risks / open items: C0 method freeze and C1 real-market provider rights remain open.
- Sign-off: Task 5 verified clean.
- Next action: Task 6 — Validate immutable bundles and publish transactionally.

## Entry 009 — 2026-10-21 — immutable bundles, PostgreSQL schema, and transactional publishing

- Checkpoint / run ID: C4 in progress; no scored research run.
- Objective: implement immutable bundle creation, strict validation (reconciling trade P&L and aggregate metrics, synthetic labeling, and id matching), PostgreSQL migration for immutable run records, and atomic transactional publishing with active run pointer and rollback.
- Changes:
  - Created `db/migrations/001_published_runs.sql` with fixed-precision `NUMERIC(14, 2)`, run-scoped immutable rows, keyset pagination indexes on trades and forecasts, and `active_run_pointer`.
  - Created `backend/src/bazaar_drishti/bundle/builder.py` assembling `RunBundle`.
  - Created `backend/src/bazaar_drishti/bundle/validator.py` with `validate_run_bundle()` verifying arithmetic reconciliation, synthetic labels, and run ID consistency.
  - Created `backend/src/bazaar_drishti/bundle/publisher.py` with atomic single-transaction ingestion and pointer swap.
  - Added integration test suite `backend/tests/integration/test_publisher.py` covering validation rejection and transactional publishing.
- Verification:
  - Backend: `uv run --no-sync python -m unittest discover tests` (42/42 tests pass in 0.050s), `uv run --no-sync mypy src tests` (clean, 26 files), `uv run --no-sync ruff check .` (clean), `uv run --no-sync ruff format --check .` (clean).
  - Web: `pnpm run typecheck` (tsc clean), `pnpm test` (vitest clean), `pnpm run build` (vite build clean in 192ms).
- Risks / open items: C0 method freeze and C1 real-market provider rights remain open.
- Sign-off: Task 6 verified clean.
- Next action: Task 7 — Expose bounded read-only FastAPI endpoints.

## Entry 010 — 2026-10-21 — bounded read-only FastAPI endpoints and TypeScript contracts

- Checkpoint / run ID: C4 PASSED; no scored research run.
- Objective: implement GET-only FastAPI application with active run summary, metadata, bounded equity curve, keyset-paginated trades and forecasts, health check, public-safe receipt, and generated TypeScript types.
- Changes:
  - Added `fastapi` and `httpx` to backend dependencies.
  - Created `backend/src/bazaar_drishti/api/app.py` with routes `GET /healthz`, `GET /api/v1/runs/current`, `GET /api/v1/runs/{run_id}`, `GET /api/v1/runs/{run_id}/equity`, `GET /api/v1/runs/{run_id}/trades`, `GET /api/v1/runs/{run_id}/forecasts`, and `GET /api/v1/runs/{run_id}/receipt`.
  - Enforced GET-only constraints (POST/PUT/DELETE return 405 Method Not Allowed), query pagination caps, 404 handling on unknown runs, and exclusion of raw market data or internal credentials.
  - Added unit test suite `backend/tests/api/test_api.py` covering all routes, pagination, caps, 404 and 405 status codes.
  - Generated matching TypeScript interfaces in `web/src/types/api.ts`.
- Verification:
  - Backend: `uv run --no-sync python -m unittest discover tests` (50/50 tests pass in 0.164s), `uv run --no-sync mypy src tests` (clean, 30 files), `uv run --no-sync ruff check .` (clean), `uv run --no-sync ruff format --check .` (clean).
  - Web: `pnpm run typecheck` (clean, 0 errors).
- Risks / open items: C0 method freeze and C1 real-market provider rights remain open.
- Sign-off: Task 7 verified clean.
- Next action: Task 8 — Build Overview, Forecast Lab, and Run Receipt UI.

## Entry 012 — 2026-10-21 — release rehearsal, end-to-end quality hardening, and operational readiness

- Checkpoint / run ID: C6 PASSED, C7 PASSED (synthetic public release); C0 & C1 remain BLOCKED for real market data.
- Objective: complete end-to-end test suite reconciliation, format and type verification across backend and web client, publish operational runbook for atomic pointer swap and rollback, and verify release readiness in synthetic-only mode.
- Changes:
  - Fixed `test_publisher.py` trade ledger invariant reconciliation test (`bad_trade` satisfies internal `TradeRow` arithmetic while triggering bundle-level disagreement).
  - Formatted and cleaned all backend modules using `ruff format` and `ruff check` (30 source files formatted and linted).
  - Verified operational procedures in `docs/project/RUNBOOK.md` for environment configuration, atomic promotion, SELECT-only read replica database roles, and rollback.
- Verification:
  - Backend: `uv run --no-sync ruff check .` (All checks passed!), `uv run --no-sync ruff format --check .` (30 files already formatted), `uv run --no-sync mypy src tests` (Success: no issues found in 30 source files), `uv run --no-sync python -m unittest discover -s tests` (Ran 72 tests in 0.195s, all passed).
  - Web: `pnpm run typecheck` (tsc clean, 0 errors), `pnpm test` (vitest 4/4 tests pass in 114ms), `pnpm run build` (production build clean in 78ms).
- Risks / open items: Real market data remains strictly gated until C0 and C1 approvals are granted.
- Sign-off: Task 9 verified clean. Release rehearsal and quality suite complete.

