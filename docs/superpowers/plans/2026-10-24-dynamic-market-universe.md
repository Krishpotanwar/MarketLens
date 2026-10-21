# Dynamic Indian Market Universe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace invented market facts with server-sourced Angel One equity data and AMFI mutual-fund NAVs, then make every dependent page consume those sources honestly.

**Architecture:** Keep provider credentials and source calls in FastAPI. Load the equity universe from Angel One’s instrument master, request bounded quotes and candles, and load all published AMFI schemes and NAV history. Expose typed, paginated data endpoints to the React app; calculate derived values only from source observations. Reuse the existing chronological forecast and simulation code after real historical data is available.

**Tech Stack:** Existing FastAPI + `httpx`, existing SQLite integration pending a persistent-store decision, React 19 + TypeScript + Vite, existing Vitest and Python test setup. No new dependency is planned.

**Spec:** [`PRD.md`](../../product/PRD.md), [`TRD.md`](../../architecture/TRD.md), [`MARKET-DATA-AND-PUBLICATION.md`](../../compliance/MARKET-DATA-AND-PUBLICATION.md), [`2026-10-21-research-brief.md`](../../research/2026-10-21-research-brief.md), and [`direction.json`](../../../.taste-skill/marketlens-app/direction.json). This plan records the requested Market Explorer extension to the PRD’s synthetic-only MVP; the existing rights gate and research integrity rules still apply.

## Global Constraints

- Treat the equity universe as cash-equity instruments in the configured Angel One exchange segments; do not claim this includes every Indian company or every security.
- Treat the AMFI NAV listing as the source of the mutual-fund scheme universe; show only fields AMFI or another approved source actually supplies.
- Remove hardcoded market facts from production UI paths: ticker/value fixtures, index values, fund lists, sector/capitalization labels, fake signals, and default RELIANCE selection.
- Provider failures must produce an unavailable or explicitly stale state; never substitute the current `₹2,500` fixture or describe Yahoo data as SmartAPI.
- Keep `SMARTAPI_API_KEY` and any login credentials on the server. Do not return secrets, authorization headers, or provider payloads to the browser or logs.
- Every quote/NAV carries provider, observation date/time, fetch time, and freshness status where the source supports them.
- Do not infer sectors, market-cap bands, AUM, expense ratios, risk ratings, holdings, or 1/3/5-year returns without a valid source and adequate history.
- Keep the paper research run, synthetic fixture, immutable receipt, and publication `RightsGate`; real data never silently replaces a synthetic run.
- Keep the app read-only with respect to brokers. Paper trading remains a simulation and cannot submit SmartAPI orders.
- Forecasts are evaluated research outputs, not buy/sell instructions or promised outcomes. No Grok/LLM fine-tuning or claimed prediction accuracy in this scope.
- Preserve the existing data-terminal direction: dense, accessible tables, tabular financial figures, source timestamps, and restrained status colors.

## Review Focus

1. Missing/expired SmartAPI authentication shows a clear unavailable state and no invented prices; pin this in provider tests.
2. Rate limits, partial batches, and unknown symbols do not drop the whole universe or label stale values as live; pin per-item outcomes in API tests.
3. Market closure and delayed source timestamps are visible; pin quote freshness rules in API/UI tests.
4. Missing fund history never produces a fabricated CAGR or total-return claim; pin sparse-history and scheme-plan cases in AMFI tests.
5. Insufficient history never produces an AI probability or strategy signal; pin forecast empty-sample behavior in analysis/UI tests.

---

## Reverse-Engineering Notes

The reference is a workflow pattern, not a pixel-for-pixel clone. Bloomberg’s public product description centers on security monitors, research, data, charts, news, portfolio analytics, and configurable alerts. Bookmap’s defining view is historical and current order-book liquidity with executed volume and replay. This project’s credible workflow is: **market monitor → instrument/fund detail → source-backed analysis → paper ledger → reproducible receipt**. The existing dark data-terminal direction fits that workflow.

Do not add a Bookmap-style historical heatmap from OHLCV or a current depth snapshot. It requires recorded order-book updates over time and a source that permits collection and display. News, options, FII/DII flows, and live execution also need separate sources and reviews.

Current implementation facts verified in source:

- `backend/src/bazaar_drishti/market/live_feed.py` keeps a ten-entry symbol map, fetches Yahoo Finance, labels the response SmartAPI when an API key exists, and returns a fabricated quote on failure.
- `backend/src/bazaar_drishti/api/app.py` exposes market status, quote, and chart routes, but status checks only whether `SMARTAPI_API_KEY` exists.
- `StocksExplorerPage`, `TrendAnalysisPage`, `AIStrategyLabPage`, `PaperTradingPage`, and `MutualFundsPage` consume static fixture arrays. Stock pages also contain fixed index/sector data; `App.tsx` defaults the selected instrument to RELIANCE.
- AI strategy outputs are currently calculated from those fixtures in the browser. The backend already has a chronological logistic forecast evaluator and an SMA simulation engine that can be reused after valid bars are available.
- `render.yaml` declares no persistent data service, and `create_default_app()` initializes SQLite in memory. Multi-year fund history and repeatable market history therefore require a storage decision before they can be promised.
- Check the live `git status` and diff immediately before implementation; this worktree changed during planning, so preserve any user edits present then.

## Scope and Data Contract

### Equity explorer

- Import the provider’s instrument master and filter to supported cash-equity segments. Add search, exchange/symbol identification, paginated universe results, and quotes for the visible page.
- Build gainers, losers, and most-active shelves from a complete, timestamped provider snapshot. Do not derive global shelves from only the visible page. If a full-universe snapshot is not available yet, omit the shelves and say why.
- Show quote fields only when returned by SmartAPI. Treat sector, market-cap classification, and financial fundamentals as unavailable until an approved metadata provider is selected.
- Keep “company” search based on provider instrument metadata; do not promise legal company names if the instrument master provides only trading symbols.

### Mutual funds

- Load the full AMFI scheme/NAV listing, not a handpicked list. Show scheme code/name, latest NAV, NAV date, and source freshness.
- Store and validate NAV observations before showing date-based growth. NAV change is not total return for IDCW schemes; do not label it CAGR unless the source supports a comparable total-return calculation and the selected plan/option is identified.
- AUM, holdings, expense ratio, risk rating, category, and other Groww-style fields need another approved source. Hide those fields until such a source is chosen; never retain fixture values.
- Keep the SIP calculator as an illustrative user-input calculation. Make the assumed return explicit and separate it from the selected fund’s measured history.

### Forecasts and strategies

- Remove fixture-derived forecast probabilities, target/stop prices, “institutional participation,” and unsupported calibration claims.
- Reuse `normalize_and_validate_bars`, `evaluate_chronological_forecast`, `compute_causal_features`, `simulate_sma_strategy`, and the existing cost/receipt path. Keep chronological train/validation/test evaluation and provenance.
- Accept user-provided strategies as explicit, versioned rules/configurations for paper simulation. The exact strategies are an input to a later review; do not let an LLM invent executable rules or tune on the final test period.
- A language model may be considered later for plain-language explanation of already validated outputs. Do not fine-tune one to predict stock prices as part of this plan.

## Interfaces

Keep current routes working until their callers and tests have migrated. Add these bounded, read-only contracts:

- `GET /api/v1/market/status` → provider, configured/authenticated state, latest instrument refresh, latest quote refresh, and non-sensitive error status.
- `GET /api/v1/market/instruments?exchange=&query=&cursor=&limit=` → provider instruments and `next_cursor`.
- `GET /api/v1/market/quotes?symbols=` → one bounded batch of quotes, per-symbol errors, source timestamps, and freshness. Enforce current provider request limits server-side.
- `GET /api/v1/market/chart/{symbol}?exchange=&interval=&from=&to=` → validated OHLCV bars with the source and time range.
- `GET /api/v1/funds/schemes?query=&category=&cursor=&limit=` → paginated AMFI schemes and latest NAV/date.
- `GET /api/v1/funds/schemes/{scheme_code}/history?from=&to=` → bounded NAV history and source/date coverage.

Use stable scheme codes and exchange + provider token identity internally; do not treat a ticker string alone as globally unique. Quote and NAV response values must be nullable when the source has no value, not replaced with zero or a fixture.

## Files and Responsibilities

- Create `backend/src/bazaar_drishti/market/smartapi.py`: SmartAPI authentication, instrument master parsing, bounded quote batches, and historical candles.
- Create `backend/src/bazaar_drishti/market/amfi.py`: AMFI latest NAV and history parsing/normalization.
- Create `backend/src/bazaar_drishti/market/history_store.py` only after the Render persistence choice is confirmed: deduplicated instrument/NAV history with source timestamps and bounded queries.
- Modify `backend/src/bazaar_drishti/market/live_feed.py`: keep compatibility wrappers while removing Yahoo and fake fallbacks.
- Modify `backend/src/bazaar_drishti/api/app.py`: truthful status, validation, pagination, upstream error mapping, and new read-only endpoints.
- Modify `backend/tests/api/test_api.py`; add focused provider/history tests under `backend/tests/unit/` using test-only response fixtures.
- Create `web/src/api/market.ts` for typed fetches and request/error handling; extend `web/src/types/api.ts` with source-backed instrument, quote, NAV, and status types.
- Modify `web/src/App.tsx`, `web/src/pages/StocksExplorerPage.tsx`, `web/src/pages/MutualFundsPage.tsx`, `web/src/pages/TrendAnalysisPage.tsx`, `web/src/pages/AIStrategyLabPage.tsx`, and `web/src/pages/PaperTradingPage.tsx` to share provider-backed selections and honest loading/empty/stale/error states.
- Modify `web/src/types/paper.ts` only as needed to remove fixture-only signals and represent unavailable source values safely.
- Delete `web/src/data/indianMarketData.ts` and `web/src/data/mutualFundsData.ts` only after `rg` confirms no production callers remain; test data belongs in test files.
- Update `docs/product/PRD.md`, `docs/architecture/TRD.md`, and `docs/compliance/MARKET-DATA-AND-PUBLICATION.md` to distinguish the new explorer from the synthetic published research run.
- Change `render.yaml` only if deployment inspection confirms an approved persistent store or scheduled refresh is needed; do not add a paid resource without an explicit budget decision.

## Implementation Tasks

### Task 1: Confirm deployment, authentication, and publication boundaries

**Files:** `docs/product/PRD.md`, `docs/architecture/TRD.md`, `docs/compliance/MARKET-DATA-AND-PUBLICATION.md`, optionally `render.yaml`.

- [ ] Record the SmartAPI authentication inputs the backend already has by checking Render variable names only; never print values. The API key alone may not establish the authenticated market-data session.
- [ ] Confirm permitted research, storage/cache, and public display for the Angel One account and the exact AMFI-derived outputs. Keep public real-data responses behind the existing rights decision.
- [ ] Check whether Render already has a persistent database/disk. If not, ask for a storage/budget decision before adding one. Until then, support latest quote/NAV only and do not promise multi-year return history or model forecasts.
- [ ] Update product docs so the market explorer is an explicit extension while the academic run remains synthetic until its own publication gate passes.
- [ ] Record the accepted universe definition and unsupported fields; do not silently claim all companies or Groww feature parity.

**Deliverable:** an approved server configuration and field/source matrix. No keys or raw licensed data are added to Git.

### Task 2: Replace the equity provider path

**Files:** create `backend/src/bazaar_drishti/market/smartapi.py`; modify `backend/src/bazaar_drishti/market/live_feed.py`; add `backend/tests/unit/test_smartapi.py`.

- [ ] Write provider tests for instrument-master parsing, quote normalization, partial batch failure, invalid symbols, expired auth, rate-limit responses, and empty candles.
- [ ] Implement the documented server-side authentication/session using configured Render secrets and finite timeouts.
- [ ] Load/refresh instruments from the provider master and retain exchange + token + trading symbol identity; filter to the agreed cash-equity segments.
- [ ] Request quotes in provider-bounded batches with pacing and bounded caching. Mark cached results stale with their original source timestamp.
- [ ] Fetch historical candles through SmartAPI and validate timestamp, OHLC, volume, and exchange identity with the existing bar normalizer.
- [ ] Keep `fetch_symbol_quote`, `fetch_all_nse_quotes`, and `fetch_intraday_chart` as compatibility wrappers until API callers are migrated; remove Yahoo requests and the deterministic quote fallback.
- [ ] Run the focused Python tests and existing API tests.

### Task 3: Add all AMFI schemes and honest NAV history

**Files:** create `backend/src/bazaar_drishti/market/amfi.py`; create `backend/src/bazaar_drishti/market/history_store.py` only if Task 1 confirms persistence; add `backend/tests/unit/test_amfi.py`.

- [ ] Test latest-file parsing, scheme-code stability, duplicate dates, invalid NAV rows, missing values, and sparse history.
- [ ] Load the complete AMFI NAV listing and normalize scheme code/name, NAV, NAV date, and source timestamp.
- [ ] Load bounded historical windows using AMFI’s supported download path and its current request limits; do not scrape fund pages.
- [ ] If persistence is approved, deduplicate scheme/date observations and retain source provenance under the approved retention terms. If not, return only the latest NAV and history coverage `unavailable`.
- [ ] Calculate historical growth only from valid, comparable observations. Suppress unsupported IDCW total-return claims and missing 1/3/5-year values.
- [ ] Run the focused Python tests.

### Task 4: Publish bounded source-backed API contracts

**Files:** modify `backend/src/bazaar_drishti/api/app.py`; modify `backend/tests/api/test_api.py`.

- [ ] Test pagination, query filtering, exchange validation, quote batch bounds, malformed dates, unknown instruments/schemes, provider errors, and source freshness.
- [ ] Implement the interfaces above and keep responses read-only and bounded.
- [ ] Make `/api/v1/market/status` reflect actual authentication and last successful update, not key presence alone.
- [ ] Preserve existing route behavior or add compatibility aliases until all current callers are migrated.
- [ ] Ensure upstream credentials and raw provider exceptions never appear in responses/logs.
- [ ] Run focused API tests and the full backend test suite.

### Task 5: Make stocks and funds pages fully data-driven

**Files:** create `web/src/api/market.ts`; modify `web/src/types/api.ts`, `web/src/App.tsx`, `web/src/pages/StocksExplorerPage.tsx`, `web/src/pages/MutualFundsPage.tsx`, and `web/src/App.test.tsx`.

- [ ] Add typed fetch helpers for pagination and provider states; handle HTTP errors and cancellation without blanking unrelated pages.
- [ ] Replace the stock fixture with paginated instrument search and visible-page quotes. Derive gainers/losers/most-active only from a completed universe snapshot; otherwise render a clear unavailable state.
- [ ] Replace hardcoded indices, sectors, and cap labels with provider data when available; remove controls that lack sourced classifications.
- [ ] Replace the seven-fund fixture with the full AMFI listing, latest NAV/date, and history-backed metrics where available. Remove unsupported AUM, expense, rating, and CAGR copy rather than filling it with invented values.
- [ ] Keep SIP projections as user-selected assumptions, explicitly separate from historical fund performance.
- [ ] Remove the default RELIANCE selection. Empty selection stays empty until the user chooses a provider instrument.
- [ ] Add accessible loading, no-results, stale, not-configured, and retry states using the existing data-terminal design direction.
- [ ] Test pagination/search and each source state with mocked API responses; run the existing frontend tests and typecheck.

### Task 6: Remove fixture-derived signals from dependent pages

**Files:** modify `web/src/App.tsx`, `web/src/pages/TrendAnalysisPage.tsx`, `web/src/pages/AIStrategyLabPage.tsx`, `web/src/pages/PaperTradingPage.tsx`, `web/src/types/paper.ts`, and `web/src/App.test.tsx`.

- [ ] Pass the selected exchange + symbol through navigation instead of assuming RELIANCE.
- [ ] Drive current price, day values, and charts from the quote/candle API. Derive RSI/SMA/VWAP only when enough actual bars exist; label timeframe and source time.
- [ ] Remove hardcoded breadth, sector lists, trend labels, confidence probabilities, expected moves, targets, stop prices, and fake reasoning text.
- [ ] Replace the browser’s simulated AI result with an evaluated backend result using the existing chronological forecast path. Show metrics, training/test dates, sample counts, model/data fingerprints, and limitations; return “insufficient history” when appropriate.
- [ ] Keep paper trading local/simulated, but use a fresh provider quote for market-price defaults and reject simulation actions when no valid price is available. Do not route orders to Angel One.
- [ ] Keep existing strategy simulator as the initial strategy. Add user strategies only as explicit configurations once the user supplies their rules; do not tune against the final test period.
- [ ] Add focused UI tests for missing/stale quotes and insufficient history; run frontend tests/typecheck.

### Task 7: Remove production market fixtures and reconcile copy

**Files:** `web/src/data/indianMarketData.ts`, `web/src/data/mutualFundsData.ts`, `docs/product/PRD.md`, `docs/architecture/TRD.md`, `docs/compliance/MARKET-DATA-AND-PUBLICATION.md`.

- [ ] Search all repository callers of both fixture modules; move only required deterministic samples into tests.
- [ ] Delete production fixture modules once no production import remains.
- [ ] Replace “live,” “verified,” “top performing,” “all NSE/BSE,” and prediction claims with wording supported by actual source fields and timestamps.
- [ ] Confirm synthetic research results still show their synthetic label and remain governed by the existing publication gate.
- [ ] Review the complete diff for preserved user edits, secret exposure, fixture references, and unsupported data claims.

## Acceptance Criteria

- No production market screen imports `INITIAL_INDIAN_STOCKS` or `TOP_INDIAN_MUTUAL_FUNDS`.
- No market endpoint can return a fabricated quote when auth/provider calls fail.
- The stock catalog and AMFI catalog are sourced from their provider universes and are paginated; coverage and `as_of` are visible.
- Every displayed quote/NAV is traceable to a provider response and observation timestamp.
- Global movers are computed only from a complete source snapshot.
- Unsupported market-cap, sector, fund metadata, or returns fields are absent or explicitly unavailable.
- Trend/AI pages show no probability or signal without real bars and a valid evaluation; the existing paper-study receipt remains reproducible.
- No real order is sent to Angel One; no secret appears in the client bundle/API response.
- The app remains usable when either provider is unavailable and distinguishes latest-only data from persistent history.

## Assumptions and Open Questions

- The user’s Render API key exists, but the current code and repository configuration do not prove the full SmartAPI login/session credentials are configured. Implementation must check names/presence without reading or printing secret values.
- The current Render service definition declares neither persistent market-data storage nor a scheduled job. A durable storage/budget choice is required for retained NAV history and reliable cross-deploy growth metrics.
- SmartAPI/AMFI access does not automatically grant public redistribution or unrestricted caching. Public real-data display remains gated on the actual account terms and approved output scope.
- SmartAPI instrument master and AMFI NAV files do not, by themselves, guarantee every field the Groww UI offers. A separate approved metadata provider is still needed for fundamentals, market cap, sector, holdings, AUM, and expense ratios.
- The exact strategies the user intends to supply are not yet specified. This plan wires verified data and the existing research engine; adding each rule requires a later strategy spec.

## Self-Review and Handoff

This plan covers the path from source authentication through frontend callers and cleanup, requires a fresh diff review before edits, and does not claim source coverage or AI accuracy the providers do not support. The main implementation gate is persistent storage plus the SmartAPI authentication inputs. No app code, tests, Render settings, or secrets were changed while writing this plan.

Review this plan first. If it matches the goal, implementation should proceed natively in this workspace, one task at a time. Do not begin provider calls or enable public real-data output until Task 1’s source, storage, and publication decisions are recorded.

## Research References

- [Bloomberg Terminal product workflow](https://bloomberg.com/professional/solution/bloomberg-terminal/)
- [Bookmap features](https://bookmap.com/en/features)
- [Bookmap heatmap documentation](https://bookmap.com/knowledgebase/docs/KB-SettingUpAndOperating-HeatmapMainChart)
- [Angel One SmartAPI documentation](https://smartapi.angelone.in/docs)
- [AMFI NAV portal](https://www.amfiindia.com/net-asset-value/)
