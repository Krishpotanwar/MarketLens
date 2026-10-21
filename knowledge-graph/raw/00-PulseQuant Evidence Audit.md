---
title: PulseQuant Evidence Audit
type: research_audit
captured_at: 2026-10-16
contributor: Codex
---

# PulseQuant Evidence Audit

## Scope

The source file is [`Upgrading-GitHub-DAV-Projects.md`](../../Upgrading-GitHub-DAV-Projects.md). This audit checks claims about an Indian intraday trading strategy and paper-trading profit. It does not audit every proposed UI or software implementation detail, and it does not test code or market data.

## What the document supports

- The document itself acknowledges that ₹51,503 is an assumption-driven projection and that it has no backtest demonstrating an edge.
- The 62% win rate is a widget default. The source provides no reproducible strategy, trade log, or out-of-sample results establishing that rate.
- It also names an unresolved mismatch between its code's ATR-based barriers and the widget's +0.85% / −0.50% barriers.
- The document does not establish customer demand, willingness to pay, pricing, or revenue for PulseQuant as a product.

## Cross-checks and corrected arithmetic

At ₹2,50,000 notional, a +0.85% winner is ₹2,125 and a −0.50% loser is ₹1,250. If the assumed 62% win rate were true across 120 trades, expected gross P&L would be:

`120 × (0.62 × ₹2,125 − 0.38 × ₹1,250) = ₹1,01,100`

That does not match the document's ₹67,800 gross projection. This is a formula check of hypothetical inputs, not observed profitability.

The document uses older NSE transaction rates: 0.00297% cash, 0.00173% futures, and 0.03503% options premium. NSE's circular revised these to 0.00307%, 0.00183%, and 0.03553%, respectively, effective 1 March 2026 ([NSE circular NSE/FA/73061](https://nsearchives.nseindia.com/content/circulars/FA73061.pdf)). The current [Zerodha charges schedule](https://zerodha.com/charges/) lists those rates and broker-specific brokerage, STT, stamp duty, and GST. The document's 0.05% futures and 0.15% options STT revisions from 1 April 2026 agree with the [Income Tax Department's Budget 2026 FAQ](https://www.incometaxindia.gov.in/documents/20117/15766092/FAQs-Budget-2026.pdf/ff3d0e10-88a0-b11f-3c27-b58375974227?download=true&t=1770036575267&version=1.0). Brokerage differs by broker, so one fee table is not exact for Zerodha, Angel One, and Dhan simultaneously.

The infrastructure table is partly confirmed and partly stale: Angel One's [official SmartAPI docs](https://smartapi.angelone.in/docs) document one-minute history, live open interest, and best-five market depth, and its [FAQ](https://smartapi.angelone.in/faq) says the API has no subscription fee. However, Angel One now requires a registered static IP for API order execution from 1 April 2026 ([official notice](https://smartapi.angelone.in/exchange-regulations)); the source doc omits this condition. Its claim that Zerodha Kite Connect costs ₹2,000/month is stale against Zerodha's current schedule, which lists Connect at ₹500/month and Personal as free. “Every serious Indian quant uses it” is an unsupported generalization.

For scale, using Zerodha's current NSE equity-intraday schedule, ₹2,50,000 buy and ₹2,50,000 sell notional gives approximately ₹136.40 in round-trip statutory charges and brokerage: ₹40 brokerage, ₹63 STT, ₹15.35 NSE transaction charge, ₹0.50 SEBI fee, ₹7.50 stamp duty, and ₹10.05 GST. At 120 trades that is ₹16,368, leaving ₹84,732 from the hypothetical ₹1,01,100 gross before slippage, rejected/partial fills, and other execution effects. This calculation is specific to these assumptions and this broker; confirm against the contract note or calculator before using it in a simulator.

The previous `₹135.81` round-trip fee in the source used an outdated NSE cash transaction charge. The current rate increases the estimate to about ₹136.40 for this example. Statutory fees still do not estimate slippage or market impact.

## Claims that remain unverified

Several implementation references do check out as API facts: [DuckDB ASOF JOIN](https://duckdb.org/docs/current/guides/sql_features/asof_join) matches each left row to the nearest preceding right-side row, and the documented `asof_loop_join_threshold = 128` is a user override (the current default is 64, per [DuckDB configuration](https://duckdb.org/docs/lts/configuration/overview)); [Lightweight Charts v5](https://tradingview.github.io/lightweight-charts/docs/migrations/from-v4-to-v5) uses `addSeries`, and [multi-pane charts](https://tradingview.github.io/lightweight-charts/tutorials/how_to/panes) are supported; [FastAPI SSE](https://fastapi.tiangolo.com/reference/sse/) supports yielded events using `EventSourceResponse`; and [statsmodels' Granger test](https://www.statsmodels.org/stable/generated/statsmodels.tsa.stattools.grangercausalitytests.html) tests whether column two Granger-predicts column one. That last test is not proof of structural causality.

One timing comment does not match its SQL: `time_bucket(INTERVAL '1 minute', event_ts)` truncates to the bucket start ([DuckDB time functions](https://duckdb.org/docs/current/sql/functions/date)), but the note calls the result a bar-close timestamp. Its later `bar_ts >= event_ts` condition therefore includes events known by the minute's start, not all events known by its close. This is conservative for leakage but may omit valid same-minute information. The API documentation does not validate the document's latency or chart-frame-rate targets.

The source describes latency, sentiment accuracy, Granger significance, market-data cleanliness, chart frame rate, and performance thresholds without linking the underlying run logs, data, test code, or primary sources. Treat those as unverified design notes, not measured results. It also calls the guessed 0.05%–0.10% per-side slippage “realistic” and cites “typical” win rates without sources; these are assumptions, not market-wide facts. Granger predictive tests also do not establish a causal mechanism or a tradable net edge.

## Decision gate

Before treating the strategy as profitable, reconcile one barrier definition and one execution model, use broker/exchange-specific costs, account for slippage and partial fills, prevent look-ahead/data leakage, and report a reproducible walk-forward or untouched holdout result. Paper trading can check operational behavior; it cannot establish live profitability by itself. Do not promote the hypothetical ₹51,503 as an earned or expected return.

## Related books

- [[01-Evidence-Based Technical Analysis|Evidence-Based Technical Analysis]] targets the unsupported signal-performance claim.
- [[02-Trading and Exchanges|Trading and Exchanges]] targets the execution and cost assumptions.
- [[03-Systematic Trading|Systematic Trading]] targets position sizing and portfolio-level risk.
- [[04-Advances in Financial Machine Learning|Advances in Financial Machine Learning]] is relevant to the document's proposed financial ML and backtesting methods, once a baseline experiment is reproducible.
