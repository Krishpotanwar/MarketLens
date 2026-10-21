# Graph Report - /Users/krish/Desktop/study/project/Dav Sem 5/knowledge-graph/raw  (2026-10-21)

## Corpus Check
- Corpus is ~2,749 words - fits in a single context window. You may not need a graph.

## Summary
- 119 nodes · 160 edges · 19 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Repository Findings|Repository Findings]]
- [[_COMMUNITY_Signal Validation|Signal Validation]]
- [[_COMMUNITY_SEBI Trading Outcomes|SEBI Trading Outcomes]]
- [[_COMMUNITY_PulseQuant Audit|PulseQuant Audit]]
- [[_COMMUNITY_Execution and Market Structure|Execution and Market Structure]]
- [[_COMMUNITY_Execution Friction Models|Execution Friction Models]]
- [[_COMMUNITY_Freqtrade Validation|Freqtrade Validation]]
- [[_COMMUNITY_Portfolio Design|Portfolio Design]]
- [[_COMMUNITY_Financial ML Validation|Financial ML Validation]]
- [[_COMMUNITY_Minute Bar Timing|Minute Bar Timing]]
- [[_COMMUNITY_Charting API|Charting API]]
- [[_COMMUNITY_NSE Transaction Charges|NSE Transaction Charges]]
- [[_COMMUNITY_Static IP Compliance|Static IP Compliance]]
- [[_COMMUNITY_DuckDB Tuning|DuckDB Tuning]]
- [[_COMMUNITY_Server-Sent Events|Server-Sent Events]]
- [[_COMMUNITY_Granger Testing|Granger Testing]]
- [[_COMMUNITY_SmartAPI Market Data|SmartAPI Market Data]]
- [[_COMMUNITY_SmartAPI Fees|SmartAPI Fees]]
- [[_COMMUNITY_ASOF Joins|ASOF Joins]]

## God Nodes (most connected - your core abstractions)
1. `PulseQuant Evidence Audit` - 28 edges
2. `GitHub Backtesting Repository Review` - 17 edges
3. `SEBI study of individual traders in the equity derivatives segment for FY25–FY26, published 20 August 2026` - 13 edges
4. `SEBI Indian Trading Outcomes` - 9 edges
5. `PulseQuant NSE strategy and product under evaluation; none of the reviewed repositories establishes its profitability or commercial demand` - 7 edges
6. `Advances in Financial Machine Learning — Marcos López de Prado` - 6 edges
7. `Evidence-Based Technical Analysis: Applying the Scientific Method and Statistical Inference to Trading Signals — David R. Aronson` - 6 edges
8. `Trading and Exchanges: Market Microstructure for Practitioners — Larry Harris` - 6 edges
9. `PulseQuant Indian intraday strategy under evaluation; the SEBI study does not estimate its performance` - 6 edges
10. `kernc/backtesting.py: small Python OHLC research baseline` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Trading and Exchanges: Market Microstructure for Practitioners — Larry Harris` --conceptually_related_to--> `Unresolved mismatch between code ATR barriers and widget +0.85% / −0.50% barriers`  [INFERRED]
  raw/02-Trading and Exchanges.md → raw/00-PulseQuant Evidence Audit.md
- `Advances in Financial Machine Learning — Marcos López de Prado` --rationale_for--> `Latency, sentiment accuracy, Granger significance, data cleanliness, frame rate, and performance claims lack supporting run logs or tests`  [INFERRED]
  raw/04-Advances in Financial Machine Learning.md → raw/00-PulseQuant Evidence Audit.md
- `Advances in Financial Machine Learning — Marcos López de Prado` --conceptually_related_to--> `Profitability gate: reconcile barriers and execution, include costs/slippage, prevent leakage, and report reproducible holdout or walk-forward results`  [INFERRED]
  raw/04-Advances in Financial Machine Learning.md → raw/00-PulseQuant Evidence Audit.md
- `Run lookahead and indicator-warmup checks, keep a final untouched holdout, and log every strategy variant tried` --conceptually_related_to--> `Point-in-time data, leakage control, and reproducible holdout protocol for financial ML experiments`  [INFERRED]
  raw/06-GitHub Backtesting Repository Review.md → raw/04-Advances in Financial Machine Learning.md
- `Benchmark every strategy against buy-and-hold and a no-trade baseline over matching periods` --conceptually_related_to--> `Define a falsifiable signal test, record variants, separate development from validation, estimate uncertainty, and include costs`  [INFERRED]
  raw/06-GitHub Backtesting Repository Review.md → raw/01-Evidence-Based Technical Analysis.md

## Communities

### Community 0 - "Repository Findings"
Cohesion: 0.14
Nodes (21): Production broker execution requires current broker/exchange compliance and static-IP requirements to be checked separately, Broker SDKs provide execution/API plumbing; samples do not establish alpha, historical fill simulation, or strategy performance, Reviewed repositories do not answer whether users will pay for PulseQuant, Review vectorbt community-edition licensing before using it in a paid feature; do not assume an open-source label means unrestricted commercial use, Make fill time, order type, queue/liquidity assumptions, fees, and slippage explicit; source India-specific inputs instead of assuming optimistic constants, Run lookahead and indicator-warmup checks, keep a final untouched holdout, and log every strategy variant tried, GitHub Backtesting Repository Review, PulseQuant NSE strategy and product under evaluation; none of the reviewed repositories establishes its profitability or commercial demand (+13 more)

### Community 1 - "Signal Validation"
Cohesion: 0.18
Nodes (17): Hypothetical 62% win rate: widget default, not established by reproducible evidence, No reproducible strategy, trade log, or out-of-sample results establish a trading edge, Evidence-Based Technical Analysis: Applying the Scientific Method and Statistical Inference to Trading Signals — David R. Aronson, Define a falsifiable signal test, record variants, separate development from validation, estimate uncertainty, and include costs, Wiley publisher record, Scientific-method and statistical-inference testing of trading rules, including data-mining risk, Compare after-cost results with simple baselines and a no-trade/cash baseline over untouched periods, FY23 cash-intraday and FY25–FY26 derivatives results cover distinct segments, populations, and periods and should not be conflated (+9 more)

### Community 2 - "SEBI Trading Outcomes"
Cohesion: 0.17
Nodes (12): SEBI attributes 99% of gross profits in FPI and proprietary-trader categories to algo entities; this category observation is not causal proof that algorithms make retail strategies profitable, Do not present the 99% algo-profit statistic as a recipe; it describes FPI/proprietary categories, not a controlled retail algo-versus-manual comparison, Individuals paid about ₹25,000 crore in transaction costs in each of FY25 and FY26 and roughly ₹1 lakh crore cumulatively over FY22–FY26; brokerage was nearly half of five-year costs, SEBI study of individual traders in the equity derivatives segment for FY25–FY26, published 20 August 2026, SEBI FY25–FY26 equity-derivatives study landing page, SEBI FY25–FY26 equity-derivatives study report PDF, FY25 comparison figures were revised after broker sample expansion from 13 to 15, Aggregate individual net losses were ₹91,685 crore in FY26 (+4 more)

### Community 3 - "PulseQuant Audit"
Cohesion: 0.24
Nodes (10): Unresolved mismatch between code ATR barriers and widget +0.85% / −0.50% barriers, Brokerage and statutory charge schedules vary by broker; one fee table is not exact for all brokers, Product demand, willingness to pay, pricing, and revenue are not established for PulseQuant, PulseQuant Evidence Audit, Hypothetical gross P&L ₹1,01,100 over 120 trades if 62% win rate and stated barriers held, ₹51,503 is an assumption-driven projection, not observed or demonstrated profitability, Source claim of ₹2,000/month for Kite Connect is stale: Zerodha lists Connect at ₹500/month and Personal as free, Claim that every serious Indian quant uses a named vendor is unsupported (+2 more)

### Community 4 - "Execution and Market Structure"
Cohesion: 0.2
Nodes (10): Trading and Exchanges: Market Microstructure for Practitioners — Larry Harris, Order types, queue priority, liquidity, fill rules, quoted spreads, and realized slippage affect execution results, Orders, order-driven markets, brokers, liquidity, bid/ask spreads, transaction costs, and performance evaluation, Oxford University Press publisher record, kernc/backtesting.py: small Python OHLC research baseline, README example sets commission=.002 and reports SMA-on-GOOG +589.35% versus +703.46% buy-and-hold over that sample; illustrative only, Market orders fill at the next bar open by default unless trade_on_close=True; timing must match actual decision timing, backtesting.py README at inspected commit (+2 more)

### Community 5 - "Execution Friction Models"
Cohesion: 0.29
Nodes (8): Guessed 0.05%-0.10% per-side slippage and typical win rates are assumptions, not sourced market-wide facts, Default liquidity, constant-fee, and constant-percentage-slippage assumptions are model choices, not calibrated Indian-market truth, QuantConnect LEAN: backtesting framework with separated equity fill, fee, and slippage models, LEAN separates equity fill models, fee models, and slippage models; this is a useful testing architecture reference, LEAN constant fee model at inspected commit, LEAN equity fill model at inspected commit, LEAN equity-fill comments state OHLC data cannot establish queue position or whether a limit order fills after a price gap, LEAN constant slippage model at inspected commit

### Community 6 - "Freqtrade Validation"
Cohesion: 0.29
Nodes (8): Dynamic pairlists using current conditions do not make historical pair membership reproducible, freqtrade/freqtrade: crypto trading bot and historical OHLCV backtesting platform, Freqtrade docs state backtests use historical OHLCV and include default exchange fees, which can be overridden, Freqtrade backtesting documentation, Freqtrade lookahead-analysis documentation, Freqtrade recursive-analysis documentation, Freqtrade lookahead-analysis uses sliced comparisons to detect indicator/signal changes caused by future data, Freqtrade recursive-analysis compares final-row indicator values across startup windows and does not determine their effect on entries/exits

### Community 7 - "Portfolio Design"
Cohesion: 0.4
Nodes (5): Profitability gate: reconcile barriers and execution, include costs/slippage, prevent leakage, and report reproducible holdout or walk-forward results, Systematic Trading: A Unique New Method for Designing Trading and Investing Systems — Robert Carver, Keep forecast, risk, allocation, and implementation decisions distinct; size positions against volatility and available capital, Harriman House publisher record, Rule design, fitting, portfolio allocation, forecasts, volatility targeting, position sizing, and trading costs

### Community 8 - "Financial ML Validation"
Cohesion: 0.4
Nodes (5): Latency, sentiment accuracy, Granger significance, data cleanliness, frame rate, and performance claims lack supporting run logs or tests, Advances in Financial Machine Learning — Marcos López de Prado, Financial ML methods for structuring financial data, research, and backtesting while addressing false positives, Point-in-time data, leakage control, and reproducible holdout protocol for financial ML experiments, Wiley publisher record

### Community 9 - "Minute Bar Timing"
Cohesion: 0.67
Nodes (3): bar-start cutoff is conservative for leakage but may omit same-minute information, DuckDB time functions documentation, time_bucket truncates to minute start, but SQL comment calls it bar close; event cutoff may omit valid same-minute information

### Community 10 - "Charting API"
Cohesion: 0.67
Nodes (3): Lightweight Charts v5 migration guide, Lightweight Charts panes guide, Lightweight Charts v5 uses addSeries and supports multi-pane charts

### Community 11 - "NSE Transaction Charges"
Cohesion: 0.67
Nodes (3): Income Tax Department Budget 2026 FAQ, NSE Circular NSE/FA/73061, NSE transaction charges revised effective 1 March 2026: cash 0.00307%, futures 0.00183%, options premium 0.03553%

### Community 12 - "Static IP Compliance"
Cohesion: 1.0
Nodes (2): Angel One exchange regulations notice, Angel One API order execution requires a registered static IP from 1 April 2026

### Community 13 - "DuckDB Tuning"
Cohesion: 1.0
Nodes (2): DuckDB configuration documentation, ASOF loop join threshold 128 is a user override; documented current default is 64

### Community 14 - "Server-Sent Events"
Cohesion: 1.0
Nodes (2): FastAPI SSE supports yielded events using EventSourceResponse, FastAPI SSE reference

### Community 15 - "Granger Testing"
Cohesion: 1.0
Nodes (2): Statsmodels Granger test checks whether column two predicts column one; it does not establish structural causality, Statsmodels Granger causality test reference

### Community 16 - "SmartAPI Market Data"
Cohesion: 1.0
Nodes (2): Angel One SmartAPI docs state one-minute history, live open interest, and best-five market depth are supported, Angel One SmartAPI documentation

### Community 17 - "SmartAPI Fees"
Cohesion: 1.0
Nodes (2): Angel One SmartAPI FAQ, Angel One FAQ states SmartAPI has no subscription fee

### Community 18 - "ASOF Joins"
Cohesion: 1.0
Nodes (2): DuckDB ASOF JOIN matches each left row to the nearest preceding right-side row, DuckDB ASOF JOIN documentation

## Knowledge Gaps
- **47 isolated node(s):** `Financial ML methods for structuring financial data, research, and backtesting while addressing false positives`, `Wiley publisher record`, `Rule design, fitting, portfolio allocation, forecasts, volatility targeting, position sizing, and trading costs`, `Keep forecast, risk, allocation, and implementation decisions distinct; size positions against volatility and available capital`, `Harriman House publisher record` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Static IP Compliance`** (2 nodes): `Angel One exchange regulations notice`, `Angel One API order execution requires a registered static IP from 1 April 2026`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DuckDB Tuning`** (2 nodes): `DuckDB configuration documentation`, `ASOF loop join threshold 128 is a user override; documented current default is 64`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Server-Sent Events`** (2 nodes): `FastAPI SSE supports yielded events using EventSourceResponse`, `FastAPI SSE reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Granger Testing`** (2 nodes): `Statsmodels Granger test checks whether column two predicts column one; it does not establish structural causality`, `Statsmodels Granger causality test reference`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SmartAPI Market Data`** (2 nodes): `Angel One SmartAPI docs state one-minute history, live open interest, and best-five market depth are supported`, `Angel One SmartAPI documentation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SmartAPI Fees`** (2 nodes): `Angel One SmartAPI FAQ`, `Angel One FAQ states SmartAPI has no subscription fee`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ASOF Joins`** (2 nodes): `DuckDB ASOF JOIN matches each left row to the nearest preceding right-side row`, `DuckDB ASOF JOIN documentation`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PulseQuant Evidence Audit` connect `PulseQuant Audit` to `Signal Validation`, `Execution and Market Structure`, `Execution Friction Models`, `Portfolio Design`, `Financial ML Validation`, `Minute Bar Timing`, `Charting API`, `NSE Transaction Charges`, `Static IP Compliance`, `DuckDB Tuning`, `Server-Sent Events`, `Granger Testing`, `SmartAPI Market Data`, `SmartAPI Fees`, `ASOF Joins`?**
  _High betweenness centrality (0.620) - this node is a cross-community bridge._
- **Why does `GitHub Backtesting Repository Review` connect `Repository Findings` to `Execution and Market Structure`, `Execution Friction Models`, `Freqtrade Validation`?**
  _High betweenness centrality (0.301) - this node is a cross-community bridge._
- **Why does `Product demand, willingness to pay, pricing, and revenue are not established for PulseQuant` connect `PulseQuant Audit` to `Repository Findings`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **What connects `Financial ML methods for structuring financial data, research, and backtesting while addressing false positives`, `Wiley publisher record`, `Rule design, fitting, portfolio allocation, forecasts, volatility targeting, position sizing, and trading costs` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Repository Findings` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._