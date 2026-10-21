# Bazaar Drishti research brief

**Checked:** 2026-10-21  
**Status:** planning evidence; recheck rules, contracts, versions, and costs before implementation and release.  
**Interpretation of “Wall Street project”:** the `Wall Street Terminal Replica Plan — Module Mapping (P0→P2)` in the historical [`nemo.md`](../../nemo.md), especially its Market Monitor, Charting Pane, Liquidity Heatmap, News Tape, Options Wall, FII/DII flow, paper blotter, and risk modules.

## Findings and product decisions

| Research finding | What Bazaar Drishti takes from it | What stays out of the first release |
|---|---|---|
| Bloomberg describes a professional workflow combining data, research, charts, monitors/alerts, portfolio analytics, news, collaboration, and execution. | Clear workspace hierarchy, compact run monitor, drill-down charts, traceable research and a usable receipt. Use the workflow pattern, not Bloomberg branding or data. | Proprietary data, messaging network, execution, multi-asset workspace, and a feature-for-feature replica. [Bloomberg Terminal](https://bloomberg.com/professional/solution/bloomberg-terminal/) |
| Bookmap’s heatmap visualizes resting order-book liquidity across prices and time, alongside executed-volume marks and depth context. | Keep a future research question for historical depth visualization; explain that order-book liquidity differs from a candle/volume chart. | No “liquidity heatmap” or absorption detector from OHLCV. Such a view needs an appropriately licensed depth/trade feed and a separate validation plan. [Bookmap feature description](https://bookmap.com/en/features) |
| NSE’s policy says the agreement controls permitted use, handling, dissemination and redistribution; its research data list distinguishes data available for research from restricted data. | Default the public run to synthetic observations. Require evidence for internal computation, raw-data retention, derived outputs, display, redistribution, and attribution separately. | No assumption that a public URL, downloaded file, broker API, academic project, or “derived” metric is automatically licensed for public display. [NSE policy](https://www.nseindia.com/static/market-data/nse-data-policy), [research-data list](https://nsearchives.nseindia.com/web/sites/default/files/inline-files/Data%20list%20under%20NSE%20Data%20Sharing%20Policy%20for%20Research%20and%20Analysis_20250728.pdf) |
| NSE’s research list names daily security OHLC/volume reports and separate chargeable voluminous/tick data; it does not establish a public 5-minute OHLC API license for this project. | Select a documented, rights-cleared historical-data API before the real-data experiment. Make one server-side/offline API call adapter the DAV ingestion deliverable. | No scraping undocumented endpoints, putting vendor credentials in browser code, or publishing provider responses without contract review. |
| SEBI’s public Research Analysts Regulations and FAQ govern a changing market context. A security-specific probability view may still need qualified review even with no “buy/sell” label. | Keep real-security outputs behind a publication review gate. Use synthetic labels in the default public demo and describe forecasts as historical model outputs. | No legal conclusion from this document, no advice language, no price target, and no claim that a disclaimer alone resolves classification. [SEBI RA Regulations, last amended Nov. 25, 2025](https://www.sebi.gov.in/legal/regulations/nov-2025/securities-and-exchange-board-of-india-research-analysts-regulations-2014-last-amended-on-november-25-2025-_98248.html), [SEBI RA FAQ, Feb. 2026](https://www.sebi.gov.in/sebi_data/attachdocs/feb-2026/1770375507051.pdf) |
| SEBI’s API-algorithm framework is relevant if the product later routes orders through broker APIs. | Preserve the paper-only boundary and require a new legal/engineering review before any order-entry scope. | Broker login, order routing, live execution, and API algo claims. [SEBI retail algo circular](https://www.sebi.gov.in/legal/circulars/feb-2025/safer-participation-of-retail-investors-in-algorithmic-trading_91614.html), [timeline extension](https://www.sebi.gov.in/sebi_data/attachdocs/sep-2025/1759232056254.pdf) |

## Scope-specific market evidence

- SEBI’s FY23 cash-segment intraday study is population-level context, not a forecast of this strategy. Do not use it as proof that this project will lose or win. [Study](https://www.sebi.gov.in/reports-and-statistics/research/jul-2024/study-analysis-of-intraday-trading-by-individuals-in-equity-cash-segment_84946.html)
- The earlier PulseQuant proposal’s win-rate slider, profit curve, and cost examples are hypotheses or illustrations. They are not run results. The [`nemo.md`](../../nemo.md) audit is retained as historical critique, not an authoritative source for current charges, rules, or package versions.
- NSE’s published levy table was updated on 2026-04-17. It lists statutory rates, but it is not a complete broker contract note. Brokerage, exchange/IPFT fees, GST bases, rounding, and transaction-date rules must be versioned from the chosen broker and exchange sources. [NSE statutory levies](https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies), [NSE circular FA/73061](https://nsearchives.nseindia.com/content/circulars/FA73061.pdf)

## Stack snapshot and rationale

These are upstream release candidates checked on 2026-10-21, not permanent pins. The implementation must resolve compatible exact versions, create lockfiles, build cleanly, and review security advisories at that time.

| Layer | Candidate | Why this fit | Current-source note |
|---|---|---|---|
| Python runtime | CPython 3.14.8 | Python 3.15.0 is the newer feature series in this snapshot, but NumPy 2.5.4 lists support only through Python 3.14 and the selected scientific stack must move together. Choose the newest patch in the proven 3.14 line rather than the newest interpreter in isolation. | [Python 3.14.8](https://www.python.org/downloads/release/python-3148/), [Python version list](https://www.python.org/doc/versions/), [NumPy releases](https://numpy.org/news/) |
| Research/data | NumPy 2.5.4, pandas 3.0.6, scikit-learn 1.9.1 | Enough for bar validation, deterministic features, logistic regression, probability metrics, and bootstrap summaries; no GPU, deep learning, or sentiment model is justified for one study. | [NumPy](https://numpy.org/news/), [pandas 3.0.6](https://pandas.pydata.org/pandas-docs/stable/whatsnew/v3.0.6.html), [scikit-learn release notes](https://scikit-learn.org/stable/whats_new/v1.9.html) |
| Python API | FastAPI 0.156.4 | Typed, bounded read endpoints and an OpenAPI contract for the TypeScript client. | [FastAPI release notes](https://fastapi.tiangolo.com/release-notes/) |
| Web runtime/build | Node.js 24.22.0 LTS, React 19.3, TypeScript, Vite 8.3.4 | Static client is sufficient for a no-account public report; Vite keeps SSR/server-component infrastructure out of the MVP. | [Node 24.22.0 LTS](https://nodejs.org/en/blog/release/v24.22.0), [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), [Vite releases](https://github.com/vitejs/vite/releases) |
| Database | PostgreSQL 18.6 stable | Transactional publication of immutable run records and bounded reads. Do not select the PostgreSQL 19 release candidate for a first production deployment. | [PostgreSQL release notes](https://www.postgresql.org/docs/current/release.html) |
| Charts | TradingView Lightweight Charts 5.2.1 | Purpose-fit time-series and performance visuals. Keep source bars hidden unless the license allows display; include required attribution/license notices. | [Lightweight Charts release notes](https://tradingview.github.io/lightweight-charts/docs/release-notes) |
| Motion and styling | CSS design tokens, small CSS transitions, `prefers-reduced-motion` | A restrained, stable research instrument needs no animation framework. | Follow [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and validate keyboard, contrast, focus, and reduced motion. |
| Package control | `uv.lock`, `web/package-lock.json` | Reproducible installs; exact patch pins are finalized only after a clean supported-platform build. | Record lockfile versions and build environment in each run receipt. |

### Corrections to the earlier draft

1. The old draft named FastAPI `0.156.8`; the release notes available at this research date show `0.156.4`. The new docs use the verified value as a snapshot and require a fresh pin at implementation.
2. The old draft cited SEBI Research Analysts rules “last amended October 10, 2026.” The official page found in this review is last amended November 25, 2025; the February 2026 FAQ is the newer operating reference located. The October 2026 claim is removed.
3. PostgreSQL 19 is a release candidate as of this snapshot. Use stable PostgreSQL 18.6, not a pre-release major version.
4. The earlier product list promoted live order-book, sentiment/news, options-chain, and broker features as P0. Those are separate data-rights, accuracy, security, and regulatory projects; they are not P0 for this paper study.

## Evaluation research translated into controls

- Use chronological, session-aware folds. Scikit-learn’s `TimeSeriesSplit` prevents future-to-past leakage and supports a sample `gap`, but assumes equally spaced samples. NSE sessions include closures and missing bars, so build and inspect custom session-grouped splits; purge labels whose forward windows overlap boundaries. [TimeSeriesSplit docs](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html)
- Compare the logistic model with a training-only base-rate model. Report sample count and class balance. Use log loss and Brier score as proper probabilistic scores; Brier is not a calibration-only measure. Show a reliability plot only with its bin counts. [Calibration guide](https://scikit-learn.org/stable/modules/calibration.html)
- Pre-register one simple study. Record every tried variant and keep a final untouched test window. Multiple experiments create selection bias; read the probability-of-backtest-overfitting literature before adding parameter search. [Bailey et al., PBO paper](https://www.risk.net/journal-of-computational-finance/2471206/the-probability-of-backtest-overfitting), [Deflated Sharpe Ratio](https://doi.org/10.3905/jpm.2014.40.5.094)
- Signal performance and execution-model fidelity are different. OHLCV does not reveal queue position, resting liquidity, market impact, or whether a limit order filled. Label slippage cases as sensitivity assumptions until calibrated with licensed quote/trade records.

## Reading route

Read for controls, not recipes. No book establishes an edge or guarantees profit.

1. **Falsification and data mining:** David Aronson, *Evidence-Based Technical Analysis* ([Wiley](https://www.wiley.com/en-ie/Evidence%2BBased%2BTechnical%2BAnalysis%3A%2BApplying%2Bthe%2BScientific%2BMethod%2Band%2BStatistical%2BInference%2Bto%2BTrading%2BSignals-p-9781118160589)). Output: a preregistered hypothesis and list of prohibited post-hoc changes.
2. **Execution and market structure:** Larry Harris, *Trading and Exchanges* ([Oxford University Press](https://academic.oup.com/book/52292)). Output: a written bar-fill assumption and explanation of what OHLCV cannot model.
3. **Forecasts, risk, and implementation:** Robert Carver, *Systematic Trading* ([Harriman House](https://harriman.house/books/systematic-trading/)). Output: separate forecast, sizing, and execution decisions.
4. **Forecasting and statistical learning:** Hyndman & Athanasopoulos, *Forecasting: Principles and Practice* ([free online](https://otexts.com/fpp3/)); James et al., *An Introduction to Statistical Learning with Applications in Python* ([free online](https://www.statlearning.com/)). Output: baseline and chronological evaluation notes.
5. **Financial ML and validation:** Marcos López de Prado, *Advances in Financial Machine Learning* ([Wiley](https://www.wiley.com/en-gb/advances-in-financial-machine-learning-p-9781119482086)); Bailey et al., PBO paper (link above). Read after the basic experiment exists; output: a leakage and selection-bias checklist.
6. **Later electives:** Robert Pardo, *The Evaluation and Optimization of Trading Strategies* ([Wiley](https://www.wiley.com/en-gb/the-evaluation-and-optimization-of-trading-strategies-2nd-edition-p-9781118045053)); Joel Hasbrouck, *Empirical Market Microstructure* ([Oxford](https://academic.oup.com/book/52241)); Richard Grinold & Ronald Kahn, *Active Portfolio Management* ([McGraw Hill](https://www.mheducation.com/highered/mhp/product/active-portfolio-management-quantitative-approach-producing-superior-returns-selecting-superior-returns-controlling-risk.html)); Ernest Chan, *Quantitative Trading* ([Wiley](https://www.wiley.com/en-ca/quantitative-trading-how-to-build-your-own-algorithmic-trading-business-revised-edition-2nd-edition-p-9781394428229)). These are advanced follow-ups, not MVP dependencies.

## Limits

- No publicly accessible, project-specific license for five-minute NSE OHLCV was verified in this review. A human must obtain and retain the actual agreement before real-data computation or publication.
- The app has no provider, broker, data dates, instrument, or virtual capital selected yet. Those are gated decisions, not hidden defaults.
- Official product pages describe vendor capabilities; they are not independent evidence of trading performance or endorsement.
- Package versions and rules are snapshots. Recheck upstream pages at dependency lock, before public data publication, and immediately before release.
