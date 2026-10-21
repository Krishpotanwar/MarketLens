> **Superseded:** This GitNexus planning snapshot is retained for history. Use the current [PRD](../product/PRD.md), [TRD](../architecture/TRD.md), [research brief](../research/2026-10-21-research-brief.md), and [implementation plan](2026-10-21-bazaar-drishti-implementation-plan.md). Earlier package and regulatory references in this file may be stale or incorrect.

# बाज़ार-दृष्टि (Bazaar Drishti) Research Dashboard Implementation Plan — Historical Snapshot

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Work one checked task at a time; do not publish real market data before the rights and publication gates in this plan pass.

**Goal:** Build a public, no-sign-up, read-only dashboard that lets the user and professor inspect an auditable NSE cash-equity intraday paper study, after-cost P&L, and a historical ML forecast evaluated against a baseline.

**Architecture:** A private/offline Python research build validates rights-cleared bars, simulates one fixed strategy, evaluates one interpretable forecast, and emits an immutable run bundle. A controlled publisher imports permitted run outputs into PostgreSQL; a read-only FastAPI API serves them to a React/TypeScript dashboard. Until data and output rights are documented, the public demo uses clearly labeled synthetic data.

**Tech Stack:** Python, pandas/NumPy/scikit-learn, FastAPI, PostgreSQL, React/TypeScript, Vite, TradingView Lightweight Charts 5.x, pytest, Vitest/React Testing Library, Playwright, GitHub Actions. Version candidates checked on 2026-10-21: Python 3.14.8, Node.js 24.22.0 LTS, React 19.3, FastAPI 0.156.8, PostgreSQL 18.6; pin compatible releases at implementation time and prefer Python 3.14 only if all required numerical-library wheels and the chosen host support it.

**Spec:** docs/designs/pulsequant-research-lab.md

## Global Constraints

- The user chose one public shared dashboard for multiple viewers, with no accounts, sign-ups, per-user state, or user-specific data.
- First study: one predeclared NSE cash-equity symbol; five-minute bars if rights-cleared data and the professor’s rubric support them; one 20/50-bar SMA rule; one 30-minute logistic-regression direction forecast and training-window base-rate comparison.
- Long only, one position at a time, cash capped, no leverage, no shorts, no derivatives, no live feeds, no live orders, no personalized advice, no promised or fabricated profit.
- The strategy signal uses a completed bar and fills no earlier than the next bar open; close positions before the session ends and never carry overnight.
- Publish only immutable, versioned research runs with data fingerprint, code revision, parameters, costs, fill assumptions, test window, and forecast records.
- Report positive, zero, or negative P&L exactly as measured. Never optimize or select a displayed run to force a positive result.
- Obtain written rights for research computation and external display/redistribution of derived outputs; raw market bars are excluded from the first release. If those rights are unclear, keep real-market results private and use labeled synthetic public fixtures. Adding raw-bar display later requires a separate scope and rights review.
- The public API is GET-only; its database identity is SELECT-only. Publishing credentials stay off the browser and outside the read API.
- Preserve all unrelated existing worktree changes. This plan adds no application source, migrations, tests, or deployment configuration until execution begins.
- Do not execute the future test suite as part of this planning task.

> **GitNexus Engineering Plan**
> Task: Plan a greenfield, public read-only Indian equity intraday research dashboard with an auditable after-cost backtest and interpretable baseline-compared ML forecast.
> GitNexus evidence comes from the standalone `bazaar-drishti` index for this repository: 17 file nodes and 0 process flows. No parent-worktree digest is included because the user explicitly limited scope to this folder.

## 1. Objective

Create a professor-ready dashboard that turns the current PulseQuant proposal into a reproducible research experiment. The main result is an honest after-cost P&L report; the companion view shows a 30-minute direction model, what drove each historical prediction, and whether it beat a training-only base-rate forecast. The product is a shared public read-only dashboard, not a multi-tenant service.

[verified] The existing proposal’s ₹51,503 / 30-session figure is assumption-driven and inconsistent with its gross-P&L arithmetic; it is not observed strategy performance. [verified] The evidence audit recalculates the example gross result as ₹1,01,100 under the proposal’s own hypothetical assumptions, still before slippage and execution complications. [inferred] PulseQuant should therefore make honest measurement and reproducibility its success condition; a positive number is welcome only if the locked method produces it.

## 2. Current Behaviour

- [verified] This folder is now a separate Git repository on an unborn `main` branch; it has no commit yet. Its current project notes and plan are untracked. The former parent repository and its unrelated worktree state are outside this plan's scope.
- [verified] PulseQuant currently exists as a coursework proposal and research notes under Dav Sem 5, including nemo.md and knowledge-graph/raw/00–06. No PulseQuant runtime, app, market dataset, or test suite exists in Dav Sem 5.
- [verified] The approved design is docs/designs/pulsequant-research-lab.md. It selects a hosted React/API/PostgreSQL dashboard without accounts and narrows the first study to one NSE cash-equity symbol and five-minute bars, subject to the course rubric and rights.
- [inferred] This plan narrows the design’s source-bar/candlestick display option: the first release shows derived performance and forecast charts only. Add public source bars only if the course requires them and the data agreement expressly permits display.
- [verified] The user’s nemo.md findings identify an unsupported assumed win rate, conflicting gross/net arithmetic and barrier definitions, zero exit slippage, and missing execution/capital constraints in the proposal.
- [inferred] The application and research pipeline are greenfield. There are no existing PulseQuant callers, API consumers, data loader, model, deployment, or test fixtures to preserve.
- [verified] The repository root has no TODOS.md. The accepted hosted scope exceeds the normal eight-file smell threshold; that tradeoff was raised during the architecture choice. The user reaffirmed a hosted dashboard without accounts, so the plan retains that scope without further expansion.

## 3. Relevant Architecture

[verified] The coursework notes and this plan are inside the standalone `Dav Sem 5` repository. The approved design remains at `docs/designs/pulsequant-research-lab.md` in the former parent workspace, outside this repository, and is an external reference. [graph] The standalone `bazaar-drishti` GitNexus index contains 17 file nodes and 0 process flows. No whole-parent graph totals are used as folder facts.

[inferred] Keep the new product isolated in Dav Sem 5/pulsequant so its Python and Node dependencies, tests, environment, and CI do not change other monorepo projects. Use a single published-run contract shared by the offline producer, controlled publisher, API, and web client. Publish immutable run IDs; use an explicit active-run pointer or deployment configuration to promote/roll back without mutating historical run contents.

~~~text
Rights-cleared input OR synthetic fixture
             |
             v
Offline Python build: validate -> features -> backtest + forecast -> metrics
             |
             v
Immutable run bundle + manifest + validation report
             |
       gated publisher
             v
PostgreSQL published tables <--- SELECT-only FastAPI API <--- React dashboard
             |                                           Overview / Forecast / Receipt
             +---- prior run retained for rollback
~~~

[inferred] Keep model fitting and simulation out of web request handling. Do not add job queues, live streaming, user data, or a generic strategy plug-in framework for the first study. The product is a research publication pipeline with a read-only viewer.

## 4. GitNexus Findings

- [graph] GitNexus now registers this standalone repository as `bazaar-drishti`, at `/Users/krish/Desktop/study/project/Dav Sem 5`.
- [graph] Queries against this repository's own index returned 17 `File` nodes and 0 `Process` nodes. The indexed files are project notes, plan, README, and generated knowledge-graph artifacts; no PulseQuant application source appears in the indexed file list.
- [verified] GitNexus indexed the working tree with no commit yet; its reported commit is `unknown`. The index status is up to date for the current worktree.
- [verified] The user supplied April 16 whole-repository graph counts; those figures are not treated as folder-level evidence.
- [inferred] There are no existing PulseQuant symbols or direct dependents to modify within the scoped graph. No code edits are proposed.

## 5. Statement-Level PDG Findings

[verified] No existing PulseQuant function, class, route, or data path exists to slice. No source-level PDG analysis was run because there is no central implementation symbol. This is an explicit no-PDG-layer-for-this-feature finding, not an inference that future code is safe.

[inferred] During implementation, before changing any shared existing application symbol, the executor must run GitNexus impact and inspect callers. PulseQuant’s first implementation should remain confined to its new subdirectory. Run detect_changes({scope: "all"}) before any eventual commit and resolve partial or truncated results instead of treating them as clean.

## 6. Proposed Changes

### Product requirements (PRD)

**Audience and job:** The user and professor open one public URL, inspect how a result was produced, and download or reproduce the research receipt. No visitor account or sign-up is needed. The site is shared and read-only.

**Pages:**
1. **Overview:** selected run status; net P&L in INR and percent; same-period cash/no-trade and intraday buy-and-hold baselines; equity curve; drawdown; trade count; cost and slippage breakdown; data span and sample limitations.
2. **Forecast lab:** six-bar/30-minute forecast timeline, logistic-regression probability vs training-fold base rate, Brier score, log loss, balanced accuracy, counts, reliability chart, and deterministic per-row feature contribution to log-odds. Label every result as historical replay; it is not a forecast captured live before the outcome or a recommendation.
3. **Run receipt:** data source and permission label; bar fingerprint and missing-bar summary; instrument and corporate-action policy; code revision; strategy/model version and parameters; chronological split dates; fee-schedule version; fill/slippage scenario; exclusions; environment/created-at timestamp; exportable machine-readable manifest and ledger.

**Acceptance requirements:**
- The hosted dashboard works without account creation and exposes no write endpoint.
- The audience can trace every displayed P&L value to a versioned trade ledger and fee calculation.
- Forecasts preserve origin time, input cutoff, model version, data fingerprint, and historical-replay kind; the realized label is appended separately.
- The model explanation is deterministic: for each standardized input feature, show the fitted coefficient-times-feature contribution to log-odds, plus the model intercept. Do not generate natural-language claims about why a market moved.
- Empty, insufficient-sample, and failed-run states are explicit. No result is represented by a positive placeholder.
- A synthetic demo is visibly labeled on every page, chart, and export; it cannot be mistaken for NSE observations.

### Research protocol and knowledge dump

[assumed] Lock the initial instrument, dates, virtual starting capital, provider, and professor’s rubric before the first scored run. The instrument and capital have not been confirmed; put the chosen values in a versioned study config and include the confirmation in the receipt.

**Data rules**
- One NSE-listed cash-equity symbol, five-minute OHLCV, India Standard Time session calendar, no options/futures/indices in the first scored run.
- Validate schema, unique increasing timestamps, timezone conversion, OHLC consistency, positive prices, volume bounds, duplicate rows, gaps, and corporate-action adjustment policy. Never silently forward-fill missing OHLC bars.
- Keep vendor raw files read-only. Record provider, acquisition timestamp, license reference, source-file SHA-256, normalized-row count, date range, adjustment method, and exclusions. Do not commit licensed data unless the agreement expressly permits it.
- The data provider is a release-blocking choice. Provider documentation about endpoint retention or rate limits does not grant redistribution rights. Check the actual agreement for research/non-display computation, public display of bars, and derived-output redistribution.

**Fixed experiment**
- Candidate paper strategy: 20/50 simple moving-average crossover. Use only completed five-minute bars; a signal at close t can fill no earlier than open t+1. Enter long on an upward cross and exit on downward cross at the next bar open. Force flat at the open of the final regular-session bar; make the exit decision no later than the preceding completed bar close, and reject ambiguous bar labeling instead of inventing a fill. Apply slippage and charges to the forced exit. Do not carry overnight or enter if the next eligible bar is absent.
- Use one position at a time and a versioned cash cap. No leverage or shorting. Show the exact starting virtual capital and share-sizing rule; the default amount remains an assumption until the professor approves it.
- Compare against no-trade cash and intraday buy-and-hold on identical sessions and charges. The forecast is a separate research experiment and does not control orders or sizing.
- Forecast target: sign of the six-bar forward close-to-close return (30 minutes). Fixed initial features: 1-, 3-, and 6-bar lagged returns; distance to the 20- and 50-bar SMA; and trailing 20-bar volatility. Fit any scaler only on the training fold. Fit logistic regression on the training fold and compare it with a class-probability baseline computed only from that same training fold.
- Explain one prediction using model-faithful coefficient contributions, not an LLM explanation. Do not add FinBERT, news, sentiment, Granger tests, deep learning, or hyperparameter search to this slice.
- Chronologically split complete sessions 60% train / 20% validation / 20% final test. Exclude forecast labels whose six-bar target window crosses a session or split boundary, and apply a six-bar purge wherever target windows overlap. Fit preprocessing/model only on the allowed past. Lock all rules before evaluating the untouched final test. Do not tune on the test set.
- Store each historical prediction with kind=simulated_replay, origin_time, recorded_at (the actual later build time), input_data_cutoff, target_time, data_fingerprint, model_version, p_up, baseline_p_up, and explanation contributions. Never label it as prospectively logged. Append realized outcomes and evaluation records separately.
- Score with Brier score, log loss, and balanced accuracy; show sample count and class balance. Use five predeclared equal-width probability bins and show a bin only at 20+ predictions. If the final test has fewer than 100 complete sessions, do not claim a bootstrap interval.
- For eligible tests, use a 95% percentile moving-block bootstrap of contiguous five-session blocks, 2,000 replicates. Put block size, replicate count, split dates, bin edges, seed, and sample counts in the run manifest. The 100-session threshold and five-session block length are conservative design choices, not statistically universal truths; report the actual sample size and sensitivity.
- Report four per-side slippage scenarios: 0, 5, 10, and 20 basis points. These are sensitivity scenarios only, not measured execution quality. OHLCV bars cannot establish queue position or quote-level fills.

**Net P&L and dated India cost inputs**
- Compute cash flows from simulated shares and entry/exit fill prices, then itemize brokerage, NSE transaction/IPFT charge, SEBI turnover fee, STT, stamp duty, and GST using the dated schedule. Apply each charge to its correct side/notional and broker basis; reconcile rounding to the chosen broker’s contract-note convention.
- As researched on 2026-10-21, NSE’s current reference page lists cash intraday STT at 0.025% on the seller, non-delivery stamp duty at 0.003% on the buyer, SEBI turnover fee at ₹10/crore on each buy/sell transaction, and broker-services GST at 18%. NSE circular FA/73061 sets cash-market exchange plus IPFT member outflow at ₹307/crore each side effective 2026-03-01. Verify the selected broker’s customer charge treatment and contract-note rounding before encoding; brokerage varies by broker. Futures/options rates are out of scope. SEBI’s FY23 cash-intraday study reported that about seven in ten individual traders lost money; this is broad population context only, not a test or forecast of PulseQuant’s results.
- Store an effective_from/effective_to fee schedule and its source URL with each run; historical runs use the fee schedule effective on the simulated transaction date if available. A current schedule cannot be silently applied to older dates.
- Net result = gross realized trading P&L minus all itemized charges and modeled slippage. Show gross and net separately, but headline net. Never infer expected future P&L from a widget default win rate.

**Knowledge transfer and books**
This is a curated learning map for the selected research scope, not a claim to list every book ever published. Read in this order; extract a one-page note and a PulseQuant control/check after each section. None of these books proves PulseQuant has alpha.

1. **Evidence and falsification:** David Aronson, Evidence-Based Technical Analysis — pre-register a rule, avoid data mining, distinguish a discovered pattern from evidence. This is the strongest starting point for the unsupported 62% assumption.
2. **Market mechanics:** Larry Harris, Trading and Exchanges — orders, liquidity, spreads, brokers, and transaction costs. Translate market mechanics into explicit fill limitations.
3. **System design and risk:** Robert Carver, Systematic Trading — keep forecasts, position sizing, costs, and portfolio decisions separate; cap risk and trading frequency. Add Carver, Smart Portfolios only after the single-rule study.
4. **Forecasting and ML foundations:** Hyndman and Athanasopoulos, Forecasting: Principles and Practice (free online); James, Witten, Hastie, Tibshirani, and Taylor, An Introduction to Statistical Learning with Python (free online); Ruey Tsay, Analysis of Financial Time Series. Learn simple baselines, chronological evaluation, classification metrics, and calibration before complex models.
5. **Backtest integrity and multiple testing:** Marcos López de Prado, Advances in Financial Machine Learning; Robert Pardo, The Evaluation and Optimization of Trading Strategies. Read after the baseline experiment exists; understand leakage, selection bias, and why a single tuned test is not validation.
6. **Microstructure and execution:** Joel Hasbrouck, Empirical Market Microstructure; Perry Kaufman, Trading Systems and Methods. Useful for later execution research; OHLCV alone cannot estimate queue-aware fills.
7. **Portfolio and implementation context (later):** Richard Grinold and Ronald Kahn, Active Portfolio Management; Ernest Chan, Quantitative Trading (Revised 2nd Edition). These are references, not prescriptions for a first intraday signal.

**Further research topics to capture in the project knowledge notes:** hypothesis registry of every tried variant; point-in-time feature availability; label overlap and purging; corporate actions and survivorship bias; base-rate and buy-and-hold baselines; broker-specific contract notes; spread vs slippage vs market impact; calibration vs discrimination; multiple testing and false discoveries; sample size/uncertainty; paper-vs-live fill gap; data licenses and public-media review. The existing notes in Dav Sem 5/knowledge-graph/raw/00–06 already cover the initial evidence audit, four core books, SEBI context, and backtesting-repository lessons; link to them rather than duplicating their full text in implementation.

Publisher / maintained book sources:
- Aronson, Evidence-Based Technical Analysis — https://www.wiley.com/en-ie/Evidence%2BBased%2BTechnical%2BAnalysis%3A%2BApplying%2Bthe%2BScientific%2BMethod%2Band%2BStatistical%2BInference%2Bto%2BTrading%2BSignals-p-9781118160589
- Harris, Trading and Exchanges — https://academic.oup.com/book/52292
- Carver, Systematic Trading — https://harriman.house/books/systematic-trading/
- Carver, Smart Portfolios — https://www.harriman-house.com/smart-portfolios
- Tsay, Analysis of Financial Time Series — https://www.wiley.com/en-us/shop/general-introductory-statistics/analysis-of-financial-time-series-3rd-edition-p-9780470414354
- Hyndman and Athanasopoulos, Forecasting: Principles and Practice — https://otexts.com/fpp3/
- James et al., An Introduction to Statistical Learning with Python — https://www.statlearning.com/home
- López de Prado, Advances in Financial Machine Learning — https://www.wiley.com/en-gb/advances-in-financial-machine-learning-p-9781119482086
- Pardo, The Evaluation and Optimization of Trading Strategies, 2nd ed. — https://www.wiley.com/en-gb/the-evaluation-and-optimization-of-trading-strategies-2nd-edition-p-9781118045053
- Hasbrouck, Empirical Market Microstructure — https://academic.oup.com/book/52241
- Kaufman, Trading Systems and Methods, 6th ed. — https://www.wiley.com/en-us/Trading%2BSystems%2Band%2BMethods%2C%2B6th%2BEdition-p-9781119605393
- Grinold and Kahn, Active Portfolio Management, 2nd ed. — https://www.mheducation.com/highered/mhp/product/active-portfolio-management-quantitative-approach-producing-superior-returns-selecting-superior-returns-controlling-risk.html
- Chan, Quantitative Trading, Revised 2nd ed. — https://www.wiley.com/en-ca/quantitative-trading-how-to-build-your-own-algorithmic-trading-business-revised-edition-2nd-edition-p-9781394428229

**Technical requirements (TRD)**
- Isolated root: Dav Sem 5/pulsequant with Python research package, FastAPI service, React client, database migrations, synthetic fixture, configuration, and CI/deployment docs.
- One canonical Python/Pydantic run schema defines the API through FastAPI OpenAPI; generate TypeScript client contracts from OpenAPI in CI and fail if generated output drifts. Keep the published run manifest, trade ledger, forecast ledger, metrics, fee schedule, validation report, and provenance versioned together.
- Store timestamps in UTC in persistence and include explicit exchange timezone/session date in research data; display India dates in IST. Reject naive timestamps at input.
- No runtime data vendor token in the browser, HTML, source map, or public API. Prefer no runtime provider credential at all: acquisition is a controlled offline step.
- API only exposes bounded reads for current run, run metadata, equity points, paged trades, paged forecasts, and receipt/manifest fields permitted by license. Do not expose raw bars in the first release. Reject unbounded pagination, unknown run IDs, invalid date ranges, and unknown filters.
- PostgreSQL schema uses immutable run-scoped records and separate fee-schedule versions. The API DB role has SELECT on published tables only. A separate publisher/migration owner writes through a private path; no public POST/PUT/PATCH/DELETE.
- Same-origin hosting preferred. If web and API use separate origins, allow only the exact production web origin. Add HTTPS, secure headers, content security policy, strict input validation, parameterized queries, and public API rate limits.
- Charts include a keyboard-accessible data table/summary, textual units, legend, labeled sample limits, and non-color cues. Target WCAG 2.2 AA for the dashboard. Show currency with INR formatting and timezone with IST.
- Cap a published run at 100,000 five-minute bars; paginate all detailed rows. Provisional targets: API p95 <1 second for run-summary queries and dashboard usable <3 seconds on standard broadband; measure on a representative host before release.
- Pin dependencies in uv.lock and the chosen Node lockfile. Validate Python/scikit-learn/NumPy/SciPy wheel support and host buildpacks before locking Python 3.14.8. React 19.3 and FastAPI 0.156.8 are current as of 2026-10-21, but do not upgrade blindly during the project.
- Use TradingView Lightweight Charts 5.x only with required attribution and license compliance. Review all library license terms and OSS notices before public deployment.

**Data rights, publication, and security gates**
- NSE’s policy states redistribution depends on the relevant agreement; the non-display policy covers algorithmic/internal analysis use and separately addresses external redistribution of derived data. This release displays derived research outputs and excludes source bars, so obtain explicit written permission for computation and the exact public derived-output display. A vendor API response or request-window limit is not proof of such rights. If raw bars are added later, obtain separate permission before changing scope.
- Treat the hosted URL as public media. Before publishing a security-specific model result, review the current SEBI Research Analysts regulations and current guidance with a qualified compliance/legal reviewer. The current October 10, 2026 RA regulations and February 2026 FAQ are sources for review, not a conclusion about the project’s legal status. No legal exemption is assumed.
- Synthetic data is the public fallback until gates pass. Persist a synthetic=true marker, UI banner, and downloadable receipt label. Refuse public promotion of a real run without license evidence and compliance sign-off.
- Use no account system and collect no personal data. Keep production secrets in the host secret store; use a read-only DB identity for the API, least-privilege publishing credential, dependency scanning, security headers, and logs that exclude secrets/provider tokens.

### What already exists

- Dav Sem 5/Upgrading-GitHub-DAV-Projects.md: original concept and profit widgets; use it as historical context only, not as tested behavior or evidence.
- Dav Sem 5/nemo.md: evidence critique and latest research notes; reuse as a checklist and avoid copying its unsupported strategy claims into code.
- Dav Sem 5/knowledge-graph/README.md and raw/00–06: evidence audit, four-book starter set, SEBI context, and backtesting-engine review; cite and extend these notes only when necessary.
- docs/designs/pulsequant-research-lab.md: approved user decisions and first-slice boundaries; implement that scope.
- No code, data provider integration, test harness, API, dashboard, migrations, or deployment flow exists for PulseQuant. Do not rebuild the research notes as runtime features.

### NOT in scope

- Live market data, WebSocket/SSE, order entry, broker authentication, static-IP API execution, or real-money trading — unnecessary for a historical paper study and increases data, security, and regulatory obligations.
- Options, futures, leverage, shorting, L2/order-book imbalance, news sentiment, FinBERT, Granger “causality,” Kalman filters, VWAP regimes, and multi-factor optimization — separate hypotheses with separate datasets and risk.
- Public sign-ups, accounts, multi-tenancy, user uploads, saved personal portfolios, or a leaderboard — user chose one shared read-only dashboard. Public source-bar/candlestick delivery is also excluded from the first release because the stated goal is an after-cost report and forecast dashboard; reconsider only if the professor requires it and written data rights cover it.
- Claims that PulseQuant is profitable, expected to earn a return, or that another backtesting repository proves an edge — unsupported and misleading.
- User-specific advice, buy/sell/hold instructions, alerts, paid services, commercialization, or any conclusion about the site’s regulatory classification.
- Multi-symbol universe, optimized strategy search, and a general plugin/backtest framework — lock one small experiment before considering expansions.
- Broker API selection and hosting vendor selection are deferred decisions, not permission to add live broker features.

### Files and planned module responsibilities

All paths below are new under Dav Sem 5/pulsequant; there are no existing PulseQuant symbols to modify.

| Path | Responsibility |
|---|---|
| pyproject.toml, uv.lock | Python package/dependency lock and pytest config |
| config/study.yaml | Frozen instrument, virtual capital, bar frequency, fees, strategy, features, horizons, split dates and bootstrap seed |
| src/pulsequant/contracts.py | Pydantic contracts for run manifest, bar, fee schedule, trade, forecast, metrics, validation report |
| src/pulsequant/data.py | Load authorized CSV/Parquet; normalize timezone; validate bar series and log gaps/exclusions |
| src/pulsequant/costs.py | Effective-dated cash-equity charges and deterministic scenario slippage |
| src/pulsequant/backtest.py | Single-position cash-capped SMA simulation and trade ledger |
| src/pulsequant/forecast.py | Point-in-time features, fold fit, baseline, Brier/log-loss/balanced accuracy, explanation contributions |
| src/pulsequant/uncertainty.py | Fixed moving-block bootstrap with eligibility checks |
| src/pulsequant/report.py | Build and validate immutable run bundle and machine-readable receipt |
| data/synthetic/demo_5m.csv | Clearly synthetic fixture only; never market data |
| tests/unit/test_data.py, test_costs.py, test_backtest.py, test_forecast.py, test_uncertainty.py, test_report.py | Calculation, validation, leak, and schema cases |
| services/api/pyproject.toml, services/api/src/api/main.py | FastAPI app and GET-only route wiring |
| services/api/src/api/queries.py | Bounded SELECT queries and pagination |
| services/api/tests/test_api.py | Auth-free read behavior, validation, errors, and DB privilege expectations |
| db/migrations/001_published_runs.sql | Run, fee schedule, trade, forecast, metrics and active-run schema |
| db/seeds/synthetic_demo.sql | Labeled synthetic published run |
| web/package.json, web/tsconfig.json, web/vite.config.ts | Client tooling, build, lint/test scripts |
| web/src/api/client.ts, web/src/contracts.ts (generated from FastAPI OpenAPI) | Typed read API client and shared response shapes |
| web/src/pages/Overview.tsx, ForecastLab.tsx, RunReceipt.tsx | Three product pages |
| web/src/components/EquityCurve.tsx, TradeTable.tsx, ForecastChart.tsx, DataStatus.tsx | Reusable chart/table/status views with accessible alternatives |
| web/src/App.tsx, web/src/main.tsx | Page shell, navigation, status/error states |
| web/tests/*.test.tsx | UI empty/error/accessibility and data rendering cases |
| e2e/dashboard.spec.ts | One browser journey plus public-demo states |
| .github/workflows/pulsequant.yml | CI: locks, unit/API/UI/e2e checks, build, no automatic real-run promotion |
| deploy/Dockerfile, deploy/compose.yaml, deploy/README.md | Repeatable local/container deployment and provider-specific launch notes after provider decision |
| docs/data-rights-checklist.md, docs/research-protocol.md, docs/runbook.md | Rights gate, experiment protocol, deploy/rollback instructions |

This is a deliberately complete inventory for a new full-stack project. It exceeds eight new files because the user chose a hosted dashboard and the research, API, database, UI, and public delivery have separate responsibilities. Reduce duplication in implementation: one shared contract, one config, one current run, one API, one service; do not create a framework of abstractions.

## 7. Implementation Sequence

Do not start execution until the user reviews this plan. Future tasks are ordered by dependencies. The user may ask to execute task-by-task; this plan itself creates no code.

### Task 1 — Confirm study, data rights, and publication gates

**Files:** docs/data-rights-checklist.md, docs/research-protocol.md, config/study.yaml (created in Task 2).
**Interfaces:** record provider/license and whether research computation and derived output display/redistribution are permitted; raw bars are excluded from this release; record professor rubric, symbol, date range, starting capital, broker schedule, and publication reviewer.
- [ ] Ask professor which symbol/frequency, result format, and retrospective replay are acceptable.
- [ ] Obtain the written provider terms or university agreement and preserve the exact permitted uses and contact/approval record.
- [ ] Select a broker schedule for brokerage and rounding; compare a hand-calculated round trip with an official contract-note/charges calculator.
- [ ] Record initial capital, symbol, session dates, timezone, corporate-action policy, and all model/strategy choices before looking at final-test results.
- [ ] Keep the public real-data gate closed until data-use and public-analysis reviews are documented; if either is unavailable, proceed only with synthetic data.

### Task 2 — Create isolated app scaffold and checks

**Files:** Dav Sem 5/pulsequant/pyproject.toml, uv.lock, config/study.yaml, src/pulsequant/__init__.py, tests/, web/package.json, web lockfile, web/vite.config.ts, web/tsconfig.json, .github/workflows/pulsequant.yml.
**Interfaces:** one config schema; CI runs Python and frontend checks without importing another monorepo project.
- [ ] Create the isolated Python package and web client directories under Dav Sem 5/pulsequant.
- [ ] Pin compatible runtime versions and dependencies; verify Python numerical wheels and deployment support before selecting 3.14.8.
- [ ] Add pytest and Vitest/React Testing Library test commands, lint, type-check, and production-build scripts.
- [ ] Add CI with pinned lockfile installation and separate Python/frontend jobs; do not enable deployment or market-data secrets yet.
- [ ] Add a CI smoke test that imports the empty Python package and builds the empty client; leave tests unexecuted during this planning task.

### Task 3 — Define shared run contracts and provenance

**Files:** src/pulsequant/contracts.py, web/src/contracts.ts, docs/research-protocol.md, tests/unit/test_report.py.
**Produces:** immutable RunManifest; Bar; FeeSchedule; TradeRecord; ForecastRecord; OutcomeRecord; MetricBundle; ValidationReport.
- [ ] Define required IDs, UTC timestamps, IST session date, data fingerprint, source/license note, model and strategy versions, split boundaries, parameter hash, fee version, slippage scenario, and synthetic marker.
- [ ] Keep historical forecast records immutable and store realized outcome/evaluation separately; require kind=simulated_replay for this first retrospective mode.
- [ ] Add contract tests for missing fields, naive datetimes, invalid values, duplicate IDs, record mutation, and JSON round-trip stability.
- [ ] Ensure browser contracts expose no vendor credential, local filesystem path, or restricted raw-data field.

### Task 4 — Validate data and create synthetic demo input

**Files:** src/pulsequant/data.py, data/synthetic/demo_5m.csv, tests/unit/test_data.py.
**Produces:** normalized Bar rows plus DataQualitySummary and exclusions.
- [ ] Implement strict OHLCV schema, symbol consistency, UTC parsing, unique/increasing timestamps, positive prices, high/low consistency, volume bounds, session calendar, gap counts, and duplicate detection.
- [ ] Reject silent forward fill, future timestamps, unlicensed real files, and invalid corporate-action metadata.
- [ ] Generate deterministic obviously artificial bars for UI and unit tests; embed synthetic identity in every resulting run.
- [ ] Test valid series, empty input, malformed rows, duplicates, out-of-order bars, timezone ambiguity, impossible OHLC, missing bars, and synthetic marker propagation.

### Task 5 — Implement dated costs and trade simulation

**Files:** src/pulsequant/costs.py, src/pulsequant/backtest.py, tests/unit/test_costs.py, tests/unit/test_backtest.py.
**Interfaces:** calculate_charges(side, notional, schedule) -> ChargeBreakdown; run_sma_backtest(bars, config, schedule, slippage_bps) -> BacktestResult.
- [ ] Implement effective-dated fees with explicit transaction side and per-charge base; use Decimal or integer paise for money and documented contract-note rounding.
- [ ] Add NSE cash reference fee values researched for 2026 with source/effective dates, but do not assert they match an unselected broker’s brokerage or exact contract-note result.
- [ ] Test buy/sell tax-side asymmetry, fee cutover dates, brokerage minimum/percentage rules once chosen, rounding, zero/negative notional rejection, and unknown fee dates.
- [ ] Implement completed-bar signal and next-bar-open fill, 20/50 SMA, one long position, cash cap, no leverage, opposite-cross exit, forced intraday flat, missing-next-bar exclusion, and no overnight state.
- [ ] Compare strategy, no-trade cash, and same-session buy-and-hold using identical dates and cost/slippage rules.
- [ ] Reconcile every trade cash movement and charge line to the ending equity and net P&L within one paise.

### Task 6 — Implement interpretable forecast evaluation and uncertainty

**Files:** src/pulsequant/forecast.py, src/pulsequant/uncertainty.py, tests/unit/test_forecast.py, tests/unit/test_uncertainty.py.
**Interfaces:** build_features(bars) -> FeatureRows; evaluate_forecasts(rows, split_config, seed) -> ForecastResult; block_bootstrap(values, block_sessions, replicates, seed) -> Interval | InsufficientSample.
- [ ] Compute only the preregistered lag returns, SMA distances, and trailing volatility from information available at each origin.
- [ ] Build chronological full-session train/validation/test partitions, purge overlapping six-bar labels, and keep the final test untouched after choices are locked.
- [ ] Fit scaling and logistic regression within each training fold. Compute the base-rate baseline from those same training labels.
- [ ] Store per-forecast probability and coefficient × standardized-feature contributions on the log-odds scale; store baseline forecast independently.
- [ ] Score Brier, log loss, balanced accuracy, class counts, and five fixed reliability bins; mark small bins insufficient.
- [ ] Bootstrap contiguous five-session blocks with 2,000 replicates only when at least 100 eligible test sessions exist; otherwise emit an explicit insufficient-sample result.
- [ ] Test future-feature leakage, overlapping labels across splits, scaler leakage, constant-class folds, missing features, calibration bin counts, deterministic seed, and insufficient sample behavior.

### Task 7 — Build immutable report bundle and validator

**Files:** src/pulsequant/report.py, tests/unit/test_report.py, docs/research-protocol.md.
**Produces:** a complete run bundle with manifest.json, metrics.json, equity_curve.json, trades.parquet/json, forecasts.parquet/json, data_quality.json, and validation.json.
- [ ] Build the bundle only from validated contracts and a fixed configuration; hash source inputs and output artifacts.
- [ ] Add cross-artifact validation: matching run IDs/fingerprints, ordered times, fee and fill config, forecast origins before target, outcome immutability, and ledger-to-equity reconciliation.
- [ ] Block publishable status on validation failure, missing data-rights evidence for real data, or missing publication review.
- [ ] Include split dates, comparison baselines, model version, source links, sample size, uncertainty rule, and all exclusions in the receipt.
- [ ] Add deterministic replay test: same locked synthetic data/config/seed yields byte-stable canonical result fields and identical P&L/metrics.

### Task 8 — Create database schema and controlled publisher

**Files:** db/migrations/001_published_runs.sql, db/seeds/synthetic_demo.sql, services/publisher/pyproject.toml, services/publisher/src/publisher/import_run.py, services/publisher/tests/test_import.py.
**Interfaces:** import_run(bundle_path, publish_policy) -> PublishedRun; transactional insert of immutable run rows and optional active-run pointer.
- [ ] Create run metadata, fee schedule, equity point, trade, forecast, outcome, and active-run tables with foreign keys, uniqueness, and indexes for run/date pagination.
- [ ] Make published run contents immutable by API design and database permissions; keep the active pointer separately updateable by the publisher only.
- [ ] Add a transaction that validates the run receipt, inserts all records atomically, and changes the active pointer only after the run is complete and approved.
- [ ] Create distinct database roles: schema/migration owner, private publisher writer, and runtime API SELECT-only identity.
- [ ] Test duplicate run import, partial failure rollback, invalid rights metadata, active-run rollback, pagination indexes, and API-role write denial.
- [ ] Seed only synthetic fixture data at first.

### Task 9 — Build bounded read-only API

**Files:** services/api/pyproject.toml, services/api/src/api/main.py, services/api/src/api/queries.py, services/api/tests/test_api.py.
**Routes:** GET /api/v1/runs/current; GET /api/v1/runs/{run_id}; GET /api/v1/runs/{run_id}/equity; GET /api/v1/runs/{run_id}/trades?cursor=&limit=; GET /api/v1/runs/{run_id}/forecasts?cursor=&limit=; GET /api/v1/runs/{run_id}/receipt.
- [ ] Define Pydantic responses from the canonical run contract and bounded query parameters with stable cursor pagination and a maximum page size. Generate web/src/contracts.ts from FastAPI OpenAPI; CI checks the generated file is current.
- [ ] Return explicit 404 for missing runs, 422 for invalid ranges/limits, and 503 with a stable public error shape when the read database is unavailable.
- [ ] Ensure every query is parameterized, run-scoped, and SELECT-only; do not expose raw bars in this release and verify the permitted derived fields before publication.
- [ ] Add rate limiting and same-origin policy at the edge; allow only the deployed web origin if cross-origin is required.
- [ ] Test all routes, no-run state, invalid input, nonexistent run, pagination boundaries, query DB failure, synthetic label and rights filtering, absence of a raw-bars route, and an attempted write method returning 405.

### Task 10 — Implement the three-page dashboard

**Files:** web/src/api/client.ts, web/src/App.tsx, web/src/main.tsx, web/src/pages/Overview.tsx, web/src/pages/ForecastLab.tsx, web/src/pages/RunReceipt.tsx, web/src/components/EquityCurve.tsx, TradeTable.tsx, ForecastChart.tsx, DataStatus.tsx, web/tests/*.test.tsx.
- [ ] Build typed read-only client calls for the API route contract; handle loading, empty, timeout, and server-error states with retry where safe.
- [ ] Show headline net result, comparable baselines, costs, drawdown, sample/date range, data status, and synthetic/rights labels on Overview.
- [ ] Show forecast-vs-base-rate metrics, reliability counts, deterministic feature contributions, simulated-replay labels, and insufficient-sample states on Forecast Lab.
- [ ] Show data lineage, schedule, code/config hashes, split dates, assumptions, exclusions, run status, and an export link on Run Receipt.
- [ ] Add chart summaries and data tables, keyboard navigation, screen-reader names, visible units, color-independent state indicators, and INR/IST formatting.
- [ ] Test zero trades, negative/zero/positive headline values, missing data, partial metric availability, large paged ledgers, network timeout, 404/503, and accessible chart alternatives.

### Task 11 — End-to-end release, hosting, and rollback

**Files:** e2e/dashboard.spec.ts, .github/workflows/pulsequant.yml, deploy/Dockerfile, deploy/compose.yaml, deploy/README.md, docs/runbook.md.
- [ ] Package the API and client reproducibly; run PostgreSQL in local dev/CI and document the chosen public host, TLS, secrets, backup, and estimated recurring cost before deployment.
- [ ] Add Playwright journey: open public URL without login -> inspect Overview -> inspect Forecast -> open Receipt -> export run manifest; assert the synthetic banner when synthetic fixture is active.
- [ ] CI runs unit, API/database integration, frontend, browser, type, lint, lockfile, and production build checks; never auto-promote a real-market run.
- [ ] Require an explicit release checklist for research and derived-output rights, compliance review, fee schedule, run validation, API read-only permissions, secret scan, and synthetic label. Keep raw bars out of this release.
- [ ] Publish first as a synthetic demo if gates remain open. Keep a previous known-good run and a rollback action for API/database deployment.
- [ ] Measure API p95 and page usable-time targets on the actual selected host; record the result and provider cost.

### Checkpoints and stop conditions

| Checkpoint | Pass condition | Stop if |
|---|---|---|
| P0 — study agreed | Professor accepts symbol/frequency/report; capital and dates are recorded | Rubric conflicts with the proposed study |
| P1 — rights reviewed | Written terms cover intended computation and public output, or synthetic-only mode is chosen | Source or derived display rights are unclear |
| P2 — synthetic vertical slice | Synthetic bars produce validated net ledger, forecast receipt, API response, and dashboard | Ledger does not reconcile or data is mislabeled |
| P3 — methodology frozen | Feature, strategy, split, costs, fills, and final holdout are versioned before scoring | Any test-set-driven rule changes occur |
| P4 — real-data research build | Licensed bars pass validation; result is reproducible and after cost | Contract, history, corporate actions, or cost inputs fail |
| P5 — publication review | Written public-data and public-analysis review is recorded | Reviewer cannot clear exact public output |
| P6 — hosted demo | Public URL loads without signup; API is read-only; CI and rollback work | Secrets, unauthorized data, or write access is exposed |

### Parallelization

| Workstream | Modules touched | Depends on |
|---|---|---|
| A. Data/research engine (Tasks 3–7) | src/pulsequant, tests/unit, docs/research-protocol.md | P0/P1 and shared contract |
| B. API/database (Tasks 8–9) | db, services/publisher, services/api | Shared run contract and sample bundle from Task 7 |
| C. Dashboard (Task 10) | web | OpenAPI contract and synthetic responses |
| D. Deployment/e2e (Task 11) | e2e, .github/workflows, deploy, docs/runbook.md | A–C; host choice and gates |

Parallel lanes: Lane A runs Tasks 3–7 sequentially within the research package. After Task 7 freezes the run contract and fixture, Lane B (Tasks 8–9) and Lane C (Task 10) can run in parallel in separate directories. Lane D (Task 11) starts only after B and C integrate. Tasks that touch contracts or migrations stay single-owner; the main conflict risk is simultaneous changes to generated API types or schema version. Launch A after P0/P1; launch B and C after the contract/fixture gate; finish with D. The deployment provider choice remains a gate.

## 8. Test Strategy

This repository has no PulseQuant test framework or executable test command. Tests below are requirements for implementation; none were run for this planning task. The current plan gives each arithmetic, data, model, persistence, route, and user-visible branch a named test location and explicit input-to-outcome case.

**Unit tests**
- Data: bad schema, duplicate/out-of-order timestamps, invalid timezone, malformed OHLC, gaps, empty file, unlicensed real-data input, and synthetic identity.
- Fees/accounting: buyer/seller asymmetry, effective-date change, broker-specific minimum, GST basis, monetary rounding, zero-sized trade, slippage sensitivity, and exact ledger reconciliation.
- Backtest: no signal, crossover, next-bar-open execution, no next bar, end-of-session forced close, no overnight positions, cash cap, insufficient cash, and identical benchmark dates.
- Forecast: future feature rejected; six-bar label cannot cross a split; scaler/model fit only on training folds; one-class fold; missing feature; immutable simulated origin; deterministic contribution explanation; baseline-only fit.
- Uncertainty: fewer than 100 sessions returns insufficient; valid 5-session block resampling has deterministic output for fixed seed; bins below 20 are suppressed.
- Run contract: invalid or inconsistent artifact bundle blocks publication.
- DB/API: transaction rollback; duplicates; private writer only; read role cannot mutate; bad cursor/limit; missing run; 503.
- UI/E2E: no run, synthetic label, negative/zero/positive measured outcome, data/method receipt, network failure, keyboard/table alternative, and no-login end-to-end journey.

**Coverage diagram (planned, not current coverage)**

~~~text
CODE PATHS                                               USER FLOWS
[NEW] rights/data gate                                   [NEW] synthetic demo
  ├─ allowed terms -> derived-output publish                 ├─ open URL without signup
  ├─ ambiguous terms -> block real publish                  ├─ see synthetic label
  └─ synthetic-only -> fixture path                         └─ navigate Overview/Forecast/Receipt
[NEW] bar validator                                       [NEW] inspect a result
  ├─ valid -> normalized bars                                ├─ compare net P&L and baselines
  ├─ gaps/invalid -> exclusions or reject                     ├─ inspect costs and drawdown
  └─ duplicate/time/price error -> reject                     └─ export receipt
[NEW] fee + simulator                                     [NEW] read API
  ├─ long entry/exit -> itemized ledger                       ├─ page trade/forecast rows
  ├─ next bar absent -> exclude                                ├─ invalid query -> clear 422
  ├─ cash cap -> size/reject                                   └─ DB unavailable -> clear retry state
  └─ end of day -> flat/no overnight
[NEW] fold + forecast + uncertainty                       [NEW] forecast explanation
  ├─ valid folds -> score model and baseline                    ├─ show probability and baseline
  ├─ leakage/split violation -> fail run                         ├─ show deterministic contributions
  ├─ small sample -> mark insufficient                           └─ label historical replay
  └─ test-set tuning -> block publication
[NEW] publisher + API                                      [E2E] public research workflow
  ├─ transaction success -> immutable run                          ├─ load public home
  ├─ failure -> rollback                                           ├─ inspect all three pages
  ├─ API write -> 405 / DB deny                                    ├─ API timeout/error handling
  └─ missing run -> 404/empty state                                 └─ no auth, no write control

COVERAGE NOW: 0 implemented PulseQuant paths; 0 existing PulseQuant tests.
PLANNED COVERAGE: every listed branch has a named future unit/API/UI/E2E case.
E2E-worthy: public no-login journey, DB/API/browser integration, rollback smoke.
LLM eval: none; the forecast is a deterministic scikit-learn model, not a generative model.
~~~

## 9. Risk and Impact Analysis

### Engineering review by area

| Review area | Findings | Plan response |
|---|---|---|
| Architecture | Greenfield hosted design is larger than a local notebook, but the user chose the hosted multi-viewer dashboard. Real data cannot safely reach a public site without source and derived-output rights. | Keep one offline build, one publisher, one read API, one shared dashboard; synthetic public demo is the default until rights and review pass. |
| Code quality | No current PulseQuant code exists to assess for duplication, error handling, or existing diagrams. | Start with one run contract and one experiment config; do not generalize strategies or add generic frameworks. |
| Tests | No code or test harness exists, so current coverage is zero. | Every future branch/error case is named in §8 and the end-to-end flow is included. |
| Performance | No measured request or render latency exists. Workload is bounded to one published study and 100,000 bars. | Paginate details, index run-scoped queries, chart summary first; measure p95 and page time on chosen host before release. |

### Realistic failure modes

| Code path | Production failure | Test | Error handling / user-visible outcome |
|---|---|---|---|
| Data rights gate | Provider terms allow private computation but prohibit redistribution of derived results | rights-gate test refuses real-run promotion when permission fields are absent | Publisher blocks promotion; public stays synthetic with explicit label |
| Bar validation | DST/naive timestamp or duplicate interval shifts an intraday signal | invalid timezone/duplicate fixtures | Run fails with row-level validation summary; no silent repair |
| Cost calculation | Wrong effective date or GST base understates charges and overstates net result | dated fee boundary and contract-note reconciliation | Validation fails closed; run is not publishable |
| Backtest | Same-bar close fill introduces look-ahead or final bar stays open overnight | next-bar and session-close unit cases | Reject trade path and mark run invalid; receipt shows forced close rule |
| Forecast fit | Feature or label leaks into validation/test or class baseline sees future data | leakage and fold-boundary tests | Run validation blocks result; dashboard has no valid score |
| Bootstrap | Too few independent sessions makes confidence interval look precise | insufficient-sample threshold test | Display “insufficient sample” and count, no interval |
| Bundle publisher | One database insert fails mid-run | transactional rollback integration test | No partial run or active pointer change; operator receives run ID/error |
| API | PostgreSQL timeout or query fails | API 503 integration test | Stable error code and retry message; never substitute fake P&L |
| Public route | Malformed page size enables large query or memory spike | request-boundary tests and max-page test | 422 or rate-limited response, no unbounded query |
| Browser | API unavailable while page loads | Playwright network failure | Clear stale/unavailable state and retry; no silent zero |
| Deployment | Secret enters static bundle or source map | CI secret scan and deployed asset scan | Release blocked; rotate if exposed, remove artifact |
| Public run | Unsupported real market data is served to every viewer | promotion gate / staged smoke test | Real run promotion denied; synthetic-only public fallback |

No critical gap is accepted by design: each failure above has a required test and a visible block/error path. Those tests remain unimplemented until execution begins.

### Impact, migrations, and operations

- [graph] No PulseQuant code symbol or caller is indexed; [inferred] new files under Dav Sem 5/pulsequant have no in-repo PulseQuant consumer until this app is built.
- [inferred] Cross-module integration risk is highest at the run contract. Keep a version field, validate producer output before import, and make API payloads read the stored schema version.
- [inferred] PostgreSQL migration rollback must preserve prior immutable runs. The active pointer changes only after a complete transaction; previous run remains available.
- [inferred] Do not expose licensed raw data in logs, source maps, public errors, examples, downloadable fixtures, or charts. Raw bars are excluded from this release.
- [inferred] If API becomes unavailable, site should show an explicit unavailable state; never cache a prior headline as current without displaying its run ID and timestamp.
- Performance is not yet measured. Limits and provisional targets are in the TRD; capacity conclusions wait for a deployed representative dataset and host.

## 10. Files Expected to Change

Only the final generated plan is intended to be written during this planning activity. The implementation file map above is prospective; none of those application paths is created now.

| File | Symbols | Reason |
|---|---|---|
| docs/designs/pulsequant-research-lab.md | no source symbols; approved design | User-approved decision source; unchanged in this plan session |
| Dav Sem 5/docs/plans/2026-10-21-gitnexus-plan-pulsequant-paper-trading-mvp.md | none | This scoped plan artifact; no application files are created now |
| Dav Sem 5/pulsequant/** (future) | all new | New isolated research lab, read API, dashboard, database, tests, and deployment |

## 11. Reusable Implementation Context

The user directed GitNexus scope to `Dav Sem 5/` and asked not to inspect the parent project as a whole. This folder is now an independent Git root and has its own GitNexus index. The repository has no initial commit, so no schema-2 Git provenance snapshot is claimed. The graph receipt below records only the standalone `bazaar-drishti` index; the whole-parent digest remains null.

~~~yaml
implementation_context:
  task_summary: "Build a public, no-account, read-only NSE cash intraday research dashboard with immutable after-cost paper P&L, a baseline-compared interpretable 30-minute forecast, synthetic default data, and explicit rights/publication gates."
  acceptance_criteria:
    - "Same-period strategy, cash/no-trade, and intraday buy-and-hold after-cost comparisons."
    - "Trade-level cash and fee reconciliation; explicit fill, slippage, fee version, and limitations."
    - "Forecast metrics and deterministic feature contributions compared with a training-only base-rate baseline."
    - "Historical predictions labeled simulated_replay with origin/cutoff and separately appended outcomes."
    - "Public dashboard works without sign-up; API GET-only and database role SELECT-only."
    - "No real output publicly promoted without written data/output rights and compliance review."
    - "Synthetic demo is labeled on every page and exported receipt."
  evidence_provenance:
    status: "not generated; standalone repository has no initial commit"
    requested_scope: "Dav Sem 5/"
    gitnexus_repo_alias: "bazaar-drishti"
    gitnexus_file_nodes: 17
    gitnexus_process_flows: 0
    whole_parent_worktree_digest: null
  primary_symbols: []
  related_symbols: []
  execution_path:
    - "Load rights-cleared data or synthetic fixture."
    - "Validate bars, timestamps, gaps, and provenance."
    - "Run fixed after-cost backtest and train-only baseline comparison."
    - "Build leakage-controlled historical forecasts, metrics, and explanations."
    - "Emit and validate immutable versioned run bundle."
    - "Privileged publisher imports complete approved run."
    - "Read-only API returns bounded run-scoped records."
    - "React dashboard renders overview, forecast lab, and run receipt."
  pdg_constraints: []
  architectural_patterns:
    - pattern: "Offline computation publishes immutable run artifacts; API serves published output only."
      example_location: "Greenfield pattern; no existing PulseQuant implementation"
      usage_guidance: "Never fit a model or execute a backtest inside an HTTP request."
    - pattern: "Public client read-only, API database role SELECT-only."
      example_location: "Greenfield security boundary"
      usage_guidance: "Keep publisher and migration credentials outside the public API and browser."
  files_to_modify:
    - file: "Dav Sem 5/pulsequant/src/pulsequant/data.py"
      symbols: []
      intended_change: "Normalize, validate, and fingerprint authorized or synthetic bars."
    - file: "Dav Sem 5/pulsequant/src/pulsequant/costs.py"
      symbols: []
      intended_change: "Calculate effective-dated cash charges and slippage scenarios."
    - file: "Dav Sem 5/pulsequant/src/pulsequant/backtest.py"
      symbols: []
      intended_change: "Simulate the fixed 20/50 SMA rule with next-bar fills and cash limits."
    - file: "Dav Sem 5/pulsequant/src/pulsequant/forecast.py"
      symbols: []
      intended_change: "Fit chronological-fold logistic regression and training-rate baseline; produce deterministic contributions."
    - file: "Dav Sem 5/pulsequant/services/api/src/api/main.py"
      symbols: []
      intended_change: "Expose only bounded GET reads for published runs."
    - file: "Dav Sem 5/pulsequant/web/src/pages/Overview.tsx"
      symbols: []
      intended_change: "Display after-cost results, benchmarks, costs, drawdown, and data status."
    - file: "Dav Sem 5/pulsequant/web/src/pages/ForecastLab.tsx"
      symbols: []
      intended_change: "Display forecast metrics, baseline, simulated replay label, and contributions."
    - file: "Dav Sem 5/pulsequant/web/src/pages/RunReceipt.tsx"
      symbols: []
      intended_change: "Expose run provenance and assumptions."
  tests:
    - file: "Dav Sem 5/pulsequant/tests/unit/test_data.py"
      scenarios:
        - "Duplicate or out-of-order bar -> reject with deterministic validation error."
        - "Gap -> count and record exclusion; do not forward-fill."
    - file: "Dav Sem 5/pulsequant/tests/unit/test_costs.py"
      scenarios:
        - "Cash intraday buy/sell -> charge each levy on the correct side and effective date."
        - "Unknown fee date -> refuse publishable result."
    - file: "Dav Sem 5/pulsequant/tests/unit/test_backtest.py"
      scenarios:
        - "Signal at close t -> fill no earlier than open t+1."
        - "Final session -> force flat; no overnight position."
        - "Cash insufficient -> reject/size down according to frozen rule."
    - file: "Dav Sem 5/pulsequant/tests/unit/test_forecast.py"
      scenarios:
        - "Feature uses information later than origin -> fail validation."
        - "Train/validation/test boundary -> purge overlapping six-bar label."
        - "Contribution sum equals model logit with intercept."
    - file: "Dav Sem 5/pulsequant/services/api/tests/test_api.py"
      scenarios:
        - "Invalid page size -> 422; page size above cap cannot run query."
        - "Database timeout -> stable 503 response."
        - "Write verb -> 405; database role has no write permission."
    - file: "Dav Sem 5/pulsequant/e2e/dashboard.spec.ts"
      scenarios:
        - "No login -> browse synthetic run, view three pages, export receipt."
        - "API unavailable -> readable error; never show zero as a result."
  verification_commands: []
  risks:
    - "Data/output license could block public real-market charts."
    - "Public security-specific output requires current compliance review; plan makes no legal conclusion."
    - "Broker fees and contract-note rounding depend on the selected provider."
    - "Five-minute OHLCV cannot validate realistic queue-aware fills."
    - "A single symbol and short history may not support a stable performance claim."
  assumptions:
    - "Use one NSE cash symbol and five-minute bars only if professor and data rights allow; verify written rubric and agreement."
    - "Use ₹1,00,000 as an illustrative starting capital only if the professor approves; otherwise record the chosen amount in the versioned config."
    - "Python 3.14.8 is conditional on numerical stack wheels and deployment support; check at lockfile creation."
    - "Use a deterministic logistic regression rather than generative AI; confirm the model explanation view matches the professor rubric."
  open_questions:
    - "Which instrument and historical date range are accepted and available under rights-cleared data?"
    - "Which broker fee schedule and contract-note rounding define exact customer charges?"
    - "What starting virtual capital should be displayed?"
    - "Which public hosting provider and cost ceiling should be used?"
    - "Who will review public security-specific output for current SEBI requirements?"
    - "Does the course rubric require prospective rather than retrospective forecasting?"
  avoid:
    - "Do not repeat full repository discovery; this is a greenfield module with no PulseQuant graph flow."
    - "Do not present the assumed 62% win rate, ₹51,503, or any guessed profit as a result."
    - "Do not publish real derived results before written rights cover the exact computation and display; raw bars stay out of scope."
    - "Do not add accounts, user uploads, live trading, derivatives, news/LLM, multi-symbol tests, or strategy optimization."
    - "Do not modify unrelated dirty worktree files."
~~~

## 12. Assumptions and Open Questions

### Assumptions to verify before execution

- [assumed] Professor accepts one symbol, five-minute bars, 30-minute horizon, after-cost P&L, baseline comparisons, and a retrospective replay. Verify in writing at checkpoint P0.
- [assumed] The user will choose a fixed virtual starting capital; ₹1,00,000 is an illustrative candidate only, not an expected return. Confirm before any scored run.
- [assumed] A licensed historical provider or university agreement can permit research computation and public display of derived results. Verify the actual contract; raw bars remain excluded, and if derived-output rights are unclear, publish synthetic data only.
- [assumed] The current broker’s fee schedule can be encoded with effective dates and checked against a contract note. Choose broker and exact brokerage before a real-data result.
- [assumed] The deployment host supports Python API + static client + PostgreSQL within the course budget. Confirm provider and recurring cost before infrastructure implementation.
- [assumed] The professor accepts a deterministic logistic-regression explanation view as the requested AI forecast. No LLM-generated prose is included.
- [assumed] Public review can be obtained for the exact security-specific charts and copy. Do not infer legal classification or an academic exemption.

### Open questions

1. What symbol, start/end dates, and virtual capital should the study use?
2. Which provider or academic agreement grants research computation and derived-output redistribution/display rights?
3. Which broker schedule and contract-note convention define brokerage and rounding?
4. Which host and maximum monthly cost are acceptable?
5. What methodology/report format does the professor require, and does the course accept retrospective simulated replay or require prospective forecasts recorded before outcomes?
6. Who can give qualified publication/compliance review against current SEBI rules before the URL is public?

### Deferred follow-ups

- Prospective forecast logging may become a separate milestone only after a reliable daily data process and rights-cleared archive exist.
- A second instrument, second timeframe, or any new signal requires a new preregistered hypothesis and untouched evaluation period.
- Quote/tick execution calibration requires licensed quotes/trades and a separately validated fill model.
- Reassess package versions, NSE/broker charges, data rights, public-market rules, and host costs immediately before deployment; the 2026-10-21 research snapshot is not permanent.

## 13. Definition of Done

- User and professor can open the hosted dashboard without accounts; a public synthetic demo exists even if real-market permissions do not.
- The selected study choices and virtual capital are fixed, versioned, and visible in the run receipt.
- Every real dataset has written research-use rights; derived outputs are displayed publicly only where the exact rights permit. Raw bars remain absent from this release.
- Every public security-specific result has a recorded, qualified compliance/publication review; no legal conclusion is claimed by this plan.
- A research run is immutable, deterministic given inputs/config/code, and carries source fingerprints, code revision, fee schedule, fills, slippage, split dates, versions, and exclusions.
- Backtest cash flows, statutory charges, brokerage, GST, and slippage reconcile to net P&L at the documented rounding precision; cash, no-trade, and intraday buy-and-hold use the same sessions and costs.
- Forecasts are historical simulated replays, use only information available at their origin, are evaluated on chronological train/validation/test windows with overlap purge, and are compared with a training-fold base-rate forecast.
- Forecast scores, sample counts, calibration insufficiency, and any eligible uncertainty interval are displayed accurately; per-prediction explanations sum to the model’s logit within tolerance.
- The public UI displays the measured result even when it is negative or zero and never manufactures or selects a positive-looking paper result.
- Every endpoint is bounded GET-only, every API database credential is SELECT-only, no secrets appear in browser assets, and the public app collects no account or portfolio data.
- Unit, database/API, UI, and browser tests cover the future paths and error states listed in §8; CI passes; deployment and rollback runbooks are usable; host latency and cost targets are measured.
- Real-data promotion is disabled until the P1 and P5 gates are documented; previous immutable run remains available for rollback.

### Research sources checked 2026-10-21

- NSE Data Sharing & Usage Policy, updated 2025-12-11: https://www.nseindia.com/static/market-data/nse-data-policy
- NSE Policy for Non-Display Usage of Market Data: https://nsearchives.nseindia.com/web/sites/default/files/inline-files/Non_Display_Policy.pdf
- NSE cash transaction/IPFT circular FA/73061, effective 2026-03-01: https://nsearchives.nseindia.com/content/circulars/FA73061.pdf
- NSE statutory levies page, updated 2026-04-17: https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies
- SEBI equity-cash intraday study (FY23) and press release: https://www.sebi.gov.in/reports-and-statistics/research/jul-2024/study-analysis-of-intraday-trading-by-individuals-in-equity-cash-segment_84946.html ; https://www.sebi.gov.in/media-and-notifications/press-releases/jul-2024/sebi-study-finds-that-7-out-of-10-individual-intraday-traders-in-equity-cash-segment-make-losses_84948.html
- SEBI RA Regulations, last amended 2026-10-10: https://www.sebi.gov.in/legal/regulations/oct-2026/securities-and-exchange-board-of-india-research-analysts-regulations-2014-last-amended-on-october-10-2026-_105294.html
- SEBI RA FAQ 2026: https://www.sebi.gov.in/sebi_data/attachdocs/feb-2026/1770375507051.pdf
- scikit-learn TimeSeriesSplit chronological gap parameter: https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html
- Forecasting: Principles and Practice, accuracy/evaluation: https://otexts.com/fpp3/toolbox.html
- Python 3.14.8 release: https://www.python.org/downloads/release/python-3148/
- Node 24.22.0 LTS: https://nodejs.org/en/blog/release/v24.22.0
- React 19.3: https://react.dev/blog/2026/09/09/react-19-3
- FastAPI 0.156.8 release notes: https://fastapi.tiangolo.com/release-notes/
- PostgreSQL version support/current minor releases: https://www.postgresql.org/support/versioning/
- TradingView Lightweight Charts documentation: https://tradingview.github.io/lightweight-charts/
- Probabilistic Sharpe Ratio / Deflated Sharpe Ratio: https://doi.org/10.3905/jpm.2014.40.5.094
- Probability of Backtest Overfitting: https://doi.org/10.21314/jcf.2016.322

## Implementation Tasks

Synthesized from this review; P1 blocks real-data publishing, P2 completes the dashboard, and P3 remains follow-up work.

- [ ] **T1 (P1, human: ~1 day / agent: ~2 hours)** — Rights and study protocol — confirm rubric, data use, cost schedule, symbol, and capital.
  - Surfaced by: Architecture review — public display of market and derived data is contract-dependent.
  - Files: Dav Sem 5/pulsequant/docs/data-rights-checklist.md, docs/research-protocol.md, config/study.yaml.
  - Verify: Written permissions recorded or synthetic-only mode documented.
- [ ] **T2 (P1, human: ~3 days / agent: ~1 day)** — Research integrity core — data validation, dated costs, backtest, forecast, uncertainty, and bundle checks.
  - Surfaced by: Nemo evidence audit and Test review — original profit widget is not reproducible and has untested leakage/cost paths.
  - Files: src/pulsequant/*.py, tests/unit/*.py.
  - Verify: pytest for the isolated research package passes; cash ledger and forecasts reconcile against deterministic fixtures.
- [ ] **T3 (P1, human: ~2 days / agent: ~1 day)** — Immutable publication boundary — transactional publisher and SELECT-only API identity.
  - Surfaced by: Architecture and security review — public read access must not imply data-writing credentials.
  - Files: db/migrations/001_published_runs.sql, services/publisher/, services/api/.
  - Verify: PostgreSQL integration tests prove atomic rollback and denied writes; all HTTP mutations return 405.
- [ ] **T4 (P2, human: ~3 days / agent: ~1 day)** — Three-page visualization — Overview, Forecast Lab, and Run Receipt with accessible alternatives.
  - Surfaced by: Product requirements and Test review — professor needs inspectable outcomes and model explanation, including empty/error states.
  - Files: web/src/pages/, web/src/components/, web/tests/.
  - Verify: Vitest and Playwright synthetic-demo journey passes without sign-up.
- [ ] **T5 (P1, human: ~1 day / agent: ~3 hours)** — Controlled hosting and release — provider choice, TLS, secrets, review gate, CI, and rollback.
  - Surfaced by: Distribution and security review — public distribution is part of the deliverable and can leak restricted data or credentials.
  - Files: .github/workflows/pulsequant.yml, deploy/, docs/runbook.md, e2e/dashboard.spec.ts.
  - Verify: staging deployment passes smoke, secret scan, rights checklist, compliance review, and rollback rehearsal.
- [ ] **T6 (P3, human: ~1 week / agent: ~2 days)** — Prospective forecast capture — record true pre-outcome forecasts after a reliable rights-cleared data process exists.
  - Surfaced by: Deferred follow-up — historical replay must not be represented as live forecasting.
  - Files: future separate design; no implementation paths selected.
  - Verify: all prospective timestamps precede target outcomes and a forward-only paper log is independently audited.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | /plan-ceo-review | Scope & strategy | 0 in this plan session | Not run | Not requested |
| Codex Review | /codex review | Independent 2nd opinion | 0 this session | Skipped | Running under Codex; prior Office Hours cold read is summarized in the approved design |
| Eng Review | /plan-eng-review | Architecture & tests (required) | 1 | Issues open | 2 plan-stage gates: data/output rights and public-analysis review |
| Design Review | /plan-design-review | UI/UX gaps | 0 in this plan session | Not run | UI is planned; no implementation to inspect |
| DX Review | /plan-devex-review | Developer experience gaps | 0 in this plan session | Not run | No developer runtime exists yet |

- **VERDICT:** Eng review completed for planning; do not publish real-market output until data-rights and public-analysis gates pass. The public synthetic demo can proceed.
- **CODEX:** [running under Codex — nested codex passes skipped; set GSTACK_FORCE_CODEX_REVIEW=1 to force]
- **UNRESOLVED DECISIONS:**
  - Which historical provider/agreement authorizes research computation and public redistribution/display of derived outputs?
  - Which qualified reviewer will clear the exact public security-specific analysis under current SEBI requirements?
  - Which instrument/date range and virtual starting capital does the professor approve?
  - Which broker fee schedule and contract-note rounding will define charges?
  - Which hosting provider and recurring cost ceiling should the project use?
  - What methodology/report format and forecast timing does the course require; will it accept explicitly labeled retrospective simulated forecasts?
