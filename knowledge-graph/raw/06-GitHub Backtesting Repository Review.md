---
title: GitHub Backtesting Repository Review
type: codebase_research
captured_at: 2026-10-21
contributor: Codex
---

# GitHub Backtesting Repository Review

## Scope

Reviewed public READMEs, documentation, source files, or licenses from six established projects on 21 October 2026. This is a targeted engineering review, not a random sample of GitHub stock-prediction repositories and not a measure of how common any flaw is. The source document's claim that “99%” of such repositories share specified defects has no sample, method, or citation and remains unsupported.

No repository in this review demonstrates that PulseQuant has a profitable NSE strategy. Code structure, issue activity, tests, stars, sample equity curves, and backtest features are not independent proof of net trading returns.

## Research engines and backtesting controls

### `kernc/backtesting.py`

- Useful as a small Python OHLC research baseline. Its README example explicitly sets `commission=.002`; the displayed SMA-on-GOOG result is +589.35% versus +703.46% buy-and-hold over that sample, a useful reminder to benchmark the strategy.
- In the source, market orders fill at the next bar's open by default unless `trade_on_close=True`. That timing assumption must match the strategy's actual decision timing; minute-bar signals cannot assume a fill at the same bar's close without justification.
- The README example is illustrative, not evidence that the framework's strategy or any NSE strategy is profitable.
- Sources: [README at inspected commit](https://github.com/kernc/backtesting.py/blob/d9b511b02c93b00fb454d51e3a7e011653e41b6d/README.md); [order semantics in source](https://github.com/kernc/backtesting.py/blob/d356b21140e55b649104c01e0fe9afaa71dd2e1b/backtesting/backtesting.py).

### `QuantConnect/Lean`

- LEAN separates equity fill models, fee models, and slippage models, which is a useful architecture for testing PulseQuant's current hard-coded friction assumptions.
- Its equity fill-model comments explicitly acknowledge that OHLC data cannot establish queue position or whether a limit order would fill after a price gap; the default model must make a liquidity assumption. Constant fees and constant-percentage slippage are model choices, not calibrated Indian-market truth.
- Use its separation of concerns as an engineering reference, then supply validated NSE/broker-specific inputs and compare against real fills. Do not import default models as Indian execution evidence.
- Sources: [equity fill model](https://github.com/QuantConnect/Lean/blob/7965d45e2e727fa30eca398cf5a934df9e165c2f/Common/Orders/Fills/EquityFillModel.cs), [constant fee model](https://github.com/QuantConnect/Lean/blob/962e5e515e379a13a7fdc593553146316c2180fb/Common/Orders/Fees/ConstantFeeModel.cs), and [constant slippage model](https://github.com/QuantConnect/Lean/blob/ab77d772878443c57c32ca690935d7720bc5d15d/Common/Orders/Slippage/ConstantSlippageModel.cs).

### `freqtrade/freqtrade`

- This is a crypto trading bot and backtesting platform, not an NSE equity implementation. Its docs say backtests use historical OHLCV and include default exchange fees; fees can be overridden. The docs also warn that dynamic pairlists use current conditions and do not make historical pair membership reproducible.
- Its `lookahead-analysis` command runs sliced comparisons to detect indicator/signal changes caused by future data. Its `recursive-analysis` checks indicator values across startup-window lengths, but the docs caution that it compares only final-row indicator values and does not determine their effect on entries or exits.
- These are strong validation ideas for a separate PulseQuant test harness; they do not replace India-specific fill simulation or independently validate any reported returns.
- Sources: [backtesting documentation](https://github.com/freqtrade/freqtrade/blob/c47de396df0f891f6ebea19322703b4fa27d62fc/docs/backtesting.md), [lookahead analysis](https://github.com/freqtrade/freqtrade/blob/ab0b72a412675b7161f34babed63ded43def4cb1/docs/lookahead-analysis.md), and [recursive analysis](https://github.com/freqtrade/freqtrade/blob/5ae05687737f3b4c714317bdea951a114e20c7b8/docs/recursive-analysis.md).

### `polakowo/vectorbt`

- Its community edition is a vectorized research and simulation toolkit; its README describes fee, drawdown, trade, and portfolio analytics.
- The checked `LICENSE.md` states Apache 2.0 with the Commons Clause, which withholds the right to sell the software or a product/service whose value derives substantially from it. Review licensing with counsel before basing a paid PulseQuant feature on this edition; do not assume the word “open source” means unrestricted commercial use.
- Source: [repository README](https://github.com/polakowo/vectorbt/blob/f7a22ea5e7501b714fffa2afbd2079a029cd13c4/README.md) and [license at inspected commit](https://github.com/polakowo/vectorbt/blob/1ecf7675862c3caede8c26bed7150c6c41036d45/LICENSE.md).

## Broker SDKs are execution plumbing

- [`zerodha/pykiteconnect`](https://github.com/zerodha/pykiteconnect/blob/c0ea6ec4ae1b92504d6ede293dc3c103b3717bed/README.md) is Zerodha's official Python client for Kite Connect APIs, including REST and WebSocket integration. The client is not an alpha strategy or historical fill simulator.
- [`angel-one/smartapi-python`](https://github.com/angel-one/smartapi-python/blob/0bf1b15a5b21f23ff06998762399b1815a445da7/README.md) is Angel One's Python API client and demonstrates authentication and order calls. Its sample does not validate strategy performance; production execution also needs current broker/exchange compliance and static-IP requirements checked separately.

## Findings to carry into PulseQuant

1. Benchmark every strategy against buy-and-hold and a no-trade baseline over matching periods.
2. Make fill time, order type, queue/liquidity assumptions, charges, and slippage explicit and configurable from sourced market rules—not a single optimistic constant.
3. Run lookahead and indicator-warmup checks; keep a final untouched holdout and log every strategy variant tried.
4. Export reproducible trade-level outputs and compare paper fills with actual quotes/fills before treating performance claims as evidence.
5. These repositories are useful implementation references. None answers the commercial question of whether users will pay for PulseQuant.
