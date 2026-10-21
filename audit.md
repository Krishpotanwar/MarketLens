# MarketLens / Bazaar Drishti — Full Codebase Audit

**Date:** 2026-10-24
**Auditor:** independent re-audit (post `nemo.md` claim-check, post `glm.md` feasibility verdict)
**Scope:** every tracked source file, docs, configs, CI, plus on-machine verification runs
**Repo state at audit time:** branch `main` @ `b542ccb`, 2 commits ahead of `origin/main` (unpushed), **4 files with uncommitted WIP (+367/−63)** — a parallel agent is mid-flight editing `live_feed.py`, `app.py`, `test_api.py`, `StocksExplorerPage.tsx` (search endpoint work).

---

## 1. What this repo actually is (the uncomfortable truth)

Two different products live here and they contradict each other:

| Layer | Built by | Built when | Goal | Honesty |
|---|---|---|---|---|
| **A. Research platform** (`backend/`, `docs/`, `db/`, research frontend pages) | Oct-21 build ("Bazaar Drishti" / MarketLens) | 15 commits, logbook-tracked | Synthetic-first, professor-auditable, fail-closed, rights-gated | High — deliberately self-limiting |
| **B. Retail terminal surface** (Stocks Explorer, Paper Trading, AI Strategy Lab, Mutual Funds pages, live-feed "market" endpoints) | Oct-22…24 agents | 12 commits, no PRD amendment | Groww/Bloomberg-style dashboard | **Low — presentation outruns the data** |

The PRD (`docs/product/PRD.md:45-49`) lists as **non-goals**: live quotes, WebSockets/SSE, market orders, broker accounts, news feeds, FinBERT, options analytics, profit promises. Commit `8f9f308` ("live NSE telemetry"), `7846d32` ("live paper trading terminal") and `eb11644` directly violate that contract without amending the PRD. Layer A says "we refuse to lie"; layer B lies by default because its data is hardcoded.

---

## 2. What is genuinely solid (verified on this machine)

- **Research core is excellent.** I re-ran `unittest` in `backend/.venv`: **65/66 tests pass** (the 1 failure is the API test module failing to import `fastapi` — the venv is stale, see F6; not a code defect).
- `normalizer.py` — strict OHLCV invariants, session-grid enforcement, no silent forward-fill.
- `research/backtest.py` — `gross − itemized charges − slippage = net` enforced at row *and* schema level (`schemas.py:205-215`); next-eligible-bar-open fill; forced flat; gap-aware adjacency check (backtest.py:131-135).
- `research/forecast.py` — chronological session split, purge at boundaries, train-only standardization, causal features, exact additive logit decomposition invariant.
- `bundle/` — validator reconciles every trade against metrics; SQLite publisher has immutability triggers (`BEFORE UPDATE/DELETE → RAISE ABORT`, publisher.py:139-159) mirroring the PostgreSQL migration (`db/migrations/001_published_runs.sql:96-121`).
- `RightsGate` fail-closed design (no real-data path exists at all — intentional and respected).
- CI workflow is well-shaped: backend lint/mypy/tests + web typecheck/test/build with frozen lockfiles (`.github/workflows/ci.yml`).

---

## 3. Verified defects (file:line evidence)

### F1 — Three mutually contradictory fee models in one repo (worst finding)

| Component | Exchange txn charge | Stamp duty | STT | Brokerage CNC | Source/Date |
|---|---|---|---|---|---|
| backend `research/costs.py:25,28` | 0.00297% | 0.003% buy | 0.025% sell only | always min(₹20, 0.03%) | "illustrative and undated" (admits it, line 20) |
| frontend `web/src/types/paper.ts:103,109` | **0.00345%** | **0.015% buy** (delivery rate applied to *all* products) | 0.1% both legs for CNC, else 0.025% sell | ₹0 | comment-only, undated |
| **Actual NSE (verified 2026-10-23 research, w.e.f. 1 Mar 2026, NSE/FA/73061)** | **0.00307%** | 0.003% delivery-buy / 0.0006% intraday-sell* | 0.025% intraday sell / 0.1% delivery both legs | — | circular |
|  |  |  |  |  |  |

\* stamp fractional rate differs by product; the frontend's blanket 0.015% overstates intraday stamp duty ~25×.

Consequences: any rupee figure shown in Paper Trading **cannot reconcile** with any backend-ledger figure. PRD PR-03 ("recompute the displayed headline from ledger totals; reconcile…") is violated by design. Fix = one sourced, dated, shared fee-schedule module + pinned tests.

### F2 — `live_feed.py` mislabels, fabricates, and hides

- Data is fetched from **undocumented Yahoo Finance endpoints** (`live_feed.py:48,120`) but advertised as `"provider": "Angel One SmartAPI"` whenever `SMARTAPI_API_KEY` exists (`app.py:55`, `live_feed.py:76`) — the API key is **never used to fetch anything** (it exists only for the label). This breaches the C1 gate rule "never scrape undocumented sources" and the PRD truth principle — mislabeled provenance is exactly what the rights gate exists to prevent.
- Fetch failure → **fabricated live-looking quote** (`ltp: 2500.0, change: +0.40%`, `live_feed.py:88-101`, marked only `status: "fixture"`). PRD PR-10 requires fail-closed with an explicit unavailable state, not a price that looks real.
- `except Exception: pass` twice (`live_feed.py:80-81,164-165`): zero logging, zero retry/backoff, silent stalls.
- `SMARTAPI_API_KEY` is captured once at import (`live_feed.py:16`) and again per-request via `os.getenv` in `app.py:52` — two different lifetimes, one stale.

### F3 — The public demo receipt contains fake fingerprints

`create_default_app()` (`app.py:365-373`) publishes `config_sha256 = "b"*64`, `model_sha256 = "c"*64`, `code_revision = "git-main"`. Every visitor hitting `/api/v1/runs/current` on a fresh deploy reads a receipt whose provenance hashes are placeholders — a direct violation of "trace every headline" (PRD principle 2). The fixture's real SHA-256 (`9e2320…806fd`, documented in LOGBOOK Entry 001) is correctly reused, but config/model must be computed, not invented.

### F4 — README overclaims vs code (4 lies)

`README.md:12` "Date-Effective Statutory Cost Accounting" — `costs.py:20` literally says "not date-effective or source-verified".
`README.md:15` "transactional PostgreSQL publishing" — publisher is **SQLite-only**; the Postgres migration has no consumer (LOGBOOK Entry 013 admits this).
`README.md:16` "WCAG 2.2 AA compliant" — never audited; the SEO unit's source review found counter-evidence (clickable `div` rows, radiogroup without checked state, icon-only buttons — `marketlens-audit/ACTION-PLAN.md` Phase 2.4).
`README.md:73-88` "100% clean" suites — **cannot run on this machine**: backend `.venv` lacks `fastapi` (Python 3.13 venv for a 3.14 project), and `web/node_modules` is Darwin-ARM64, so `tsc` and `vitest` crash here (verified: rolldown binding error). Verification claims come from *other* machines.

### F5 — Runtime matrix is incoherent

| Artifact | Python |
|---|---|
| `backend/pyproject.toml:5` | `>=3.14,<3.15` (hard floor) |
| CI (`ci.yml:22`) | 3.14 ✓ |
| `render.yaml:8` (`PYTHON_VERSION`) | **3.12.8** — below the declared floor |
| `backend/.venv` (this machine) | 3.13, deps missing |

Deploy config would install nothing from pyproject's floor; the root `main.py` path-hack makes 3.12 *probably* work, but "probably" is not the standard this project set for itself. Also three dependency declarations disagree: root `requirements.txt` (fastapi≥0.115 + pydantic≥2.8) vs `backend/requirements.txt` (identical) vs `backend/pyproject.toml` (fastapi≥0.156.8, pydantic absent). Pick one source of truth (pyproject + uv.lock) and make Render/CI/heredocs consume it.

### F6 — Verification chain has a hole

- CI has **never been observed green** (CHECKPOINTS C2: "A GitHub Actions run is unconfirmed; this checkout has no Git remote" — remote now exists, still 2 unpushed commits, no run evidence).
- Local repro is broken (F4 above). A repo whose headline claim is *reproducibility* must pass from clean clone on a fresh machine.

### F7 — Fabricated "AI/indicator" surface

`web/src/types/paper.ts:48-82`: every stock gets `predictedProbabilityUp`, `brierCalibration`, `signalStrength: "STRONG_BUY"…`, `causalFeatures: {momentum, volumeSurge, …}` — **all hardcoded fixture values** (pages never call the backend `forecasts` endpoint, the only fetch in `web/src` is `App.tsx:32-35`). Per PRD copy rule (§9): no buy/sell instructions, no "AI-powered alpha" prose. Violated ~everywhere in the retail layer. The Oct-24 corrective plan (`docs/superpowers/plans/2026-10-24-dynamic-market-universe.md:43-49`) documents the same diagnosis itself — it just has not been executed.

### F8 — Deployment shape is a demo, not a product

`create_default_app()` → SQLite `:memory:`, single hardcoded run, no persistence decision (plan line 49 flags this), `render.yaml` defines no storage, no `/robots.txt`, no sitemap, single-SPA-shell SEO (SEO audit §Technical: 38/100). Fine for a professor link; broken if anyone indexes it.

---

## 4. Complete "what we are missing" list

**Missing infrastructure (backend):**
1. A **real provider adapter** — `acquisition/protocol.py` defines `ProviderAdapter` + `RightsGate`, zero concrete implementations exist (no SmartAPI, no AMFI, no NSE).
2. A **runner that actually produces a scored run**: nothing in the repo wires `data/fixtures/synthetic/bars.csv` → normalizer → backtest → forecast → builder → validator → Publisher → sqlite file → app mount. Today the API serves only the hardcoded `create_default_app()` bundle. This is the single highest-leverage missing script.
3. **Dated fee schedule** with source links + effective dates + tests (see F1).
4. **Market calendar** (weekends accidentally OK in fixture; no NSE holiday table), **corporate actions** (splits/bonuses distort OHLC permanently), **instrument metadata** (exchange, segment, tick size, lot).
5. **Margin / sizing model** — `backtest.py:230-231` goes all-in every session (`quantity = int(capital // price)`); no diversification, no risk cap, long-only only.
6. **Retry/backoff + logging** in the acquisition path (the generic `RetryPolicy` exists in protocol.py but has no wired consumer).

**Missing frontend:**
7. **URL routes** — all 8 pages switch on React state; no deep links, no per-page titles/canonicals (SEO audit finding #3).
8. **Forecast Lab record view** — backend has paginated `/forecasts` with cutoff/target/actuals; the UI shows only aggregates.
9. **Truthful run-connection** for Overview/Receipt (they use the API; five other pages never do).
10. Accessibility fixes (keyboard rows, radio semantics, icon buttons), any E2E test.

**Missing news/AI thesis (your original ask, still 0% real):**
11. `indianNewsFeeds.ts` is fixture-only (last commit). Per the executed plan file, the whole AI stack is **planned, not built**: `utils/monteCarlo.ts`, `timelineEngine.ts`, `services/aiGateway.ts`, `MonteCarloFanChart.tsx`, `TimelineBranchingTree.tsx`, `CorporateStrategyCard.tsx` — none exist in the tree.
12. The plan's spec lives at a Mac-only path (`/Users/krish/.gemini/antigravity/brain/…`) — not in the repo; unreproducible for future agents.
13. Nothing connects to the real outcome path defined in `glm.md` (EOD-to-multi-day news event portfolio, NSE filings ingestion, FinBERT/LLM ensemble, after-cost walk-forward). No backend news pipeline exists at all.

**Missing process/housekeeping:**
14. PRD needs a v2 or the retail pages need removal — currently 8 PRD non-goals are violated by committed features.
15. Untracked clutter uma decision: `claude-seo/` (an entire unrelated SEO project), `.claude-flow/`, `marketlens-audit/`, plus gitignored-but-on-disk `web_root`, `web_old2`, `web_dist_root`, `web_node_modules_root*`, `backend/tests_root/` (duplicate test tree). Ignored or delete — don't leave future agents guessing.
16. Uncommitted WIP present at audit time (the search endpoint) — commit or stash before the next agent touches the same files.

---

## 5. Scorecard

| Area | Score | Reason |
|---|---|---|
| Backend research core (schemas, backtest, forecast, bundle, publisher) | **9/10** | Genuinely rigorous, tested, invariant-enforced |
| Backend integrity/claims (fees, demo hashes, provider labels) | **3/10** | Undated fee numbers ×3, fake fingerprints, Yahoo-as-SmartAPI |
| API surface | 7/10 | GET-only, bounded, good shape |
| Research UI (Overview/Forecast/Receipt) | 5/10 | Works when a run exists; no record view; light a11y debt |
| Retail UI (Explorer/Paper/AI Lab/Funds) | **2/10** | Static fixtures presented as live/verified/quantified |
| Deployment & verification chain | 2/10 | Never-green CI, unreachable local checks, runtime matrix chaos |
| News → prediction thesis (ultimate goal) | 0/10 | Fixture news, zero pipeline |
| Overall honesty-weighted | **5/10** | Strong skeleton, dishonest skin |

---

## 6. Priority queue (build order)

**P0 — Stop lying (1 session)**
1. One shared fee-schedule module (`backend` owns it; frontend imports a generated artifact or a mirrored constant with a CI drift-check test). Source: NSE circular NSE/FA/73061 + BSE notice 20260331-7 with effective dates; add dated rate rows (pre/post 1-Mar-2026 and pre/post 1-Apr-2026).
2. `live_feed.py`: relabel provider truthfully (`"provider": "yahoo-undocumented"` or drop the endpoints until a real adapter lands); delete the ₹2,500 fabricated fallback → return explicit `unavailable` state; log errors; lazy-read env.
3. Compute `config_sha256`/`model_sha256` in the runner; drop placeholders from `create_default_app()`.
4. README truth sweep; push to origin and confirm CI green (this also closes C2).
5. Commit/stash the WIP.

**P1 — Close the loop (1–2 sessions)**
6. `scripts/build_run.py`: fixture → normalize → simulate → forecast → bundle → validate → publish to a file-backed SQLite → mount in `main.py`. This turns the demo into a real, traceable run — the receipts finally point at computed hashes.
7. Route the 5 retail pages through PRD v2 (or strip their pretense: label all fixture data as "illustrative mock", kill STRONG_BUY language everywhere).

**P2 — Real data path (the pending plan)**
8. Execute `2026-10-24-dynamic-market-universe.md` as written (SmartAPI adapter + AMFI + honesty rules). It is already well-specified; don't re-plan.

**P3 — News thesis (the differentiator, per glm.md)**
9. NSE corporate-filing ingestion → event classifier → FinBERT/LLM ensemble → EOD-to-3-day event portfolio backtest with the same after-cost discipline the research core already has. The unique asset this repo offers is the ledger discipline — the news thesis should reuse it.

---

## 7. Bottom line

The Oct-21 research platform is 90% real and close to professor-ready; the Oct-22…24 trading surface is 90% fake and the two layers **share exactly one financial model — fees — which currently contradicts itself in three places**. The fastest credible path is P0 (truth fixes) + F6 (push & observed CI run) — everything else builds on top.
