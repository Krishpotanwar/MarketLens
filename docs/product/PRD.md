# Product requirements — Bazaar Drishti

**Status:** planning baseline  
**Version:** 1.0  
**Date:** 2026-10-21  
**Former working name:** PulseQuant

## 1. Product summary

Bazaar Drishti is a public, no-account research dashboard for the user and their professor. It presents one reproducible Indian cash-equity paper study, shows net performance after modeled costs, compares it with simple baselines, and gives a transparent historical forecast evaluation. Visitors can inspect a run receipt that explains data, timing, assumptions, fees, code, and limitations.

The project demonstrates data acquisition through a documented external data API, analysis, and visualization. The first public run uses synthetic data unless the exact historical market-data rights and public-output review are approved.

## 2. Problem and audience

The existing PulseQuant proposal includes assumed win rates and profit widgets that are not supported by an auditable run. The user needs a professor-ready DAV project that makes data quality, analysis choices, and visual interpretation clear.

**Primary audience:** the project owner and a professor reviewing the experiment.  
**Primary job:** “Show me exactly how this result was produced, what it cost, how uncertain it is, and what the model knew at each prediction time.”

No customer/business demand, monetization, or retail-trader workflow is being tested.

## 3. Product principles

1. **Truth before a green number:** report measured positive, zero, or negative results; never choose a display run to make P&L positive.
2. **Trace every headline:** each displayed performance value must resolve to a versioned run, ledger rows, formula, and cost schedule.
3. **Separate market prediction from strategy P&L:** the forecast does not control trades, sizing, or the simulated strategy.
4. **Label synthetic data everywhere:** synthetic examples are not NSE observations and cannot be confused with real results.
5. **Explain the instrument, not a trade:** no buy/sell/hold instruction, personal advice, live order, or profit promise.
6. **Default to least data:** no accounts, user portfolios, visitor submissions, raw-bar publication, or nonessential tracking.

## 4. Goals and non-goals

### Goals

- Give the professor one public URL that opens without an account.
- Make the ingestion API call, cleaning rules, experiment, costs, and chart data inspectable.
- Produce a deterministic after-cost ledger and compare the same period against cash/no-trade and intraday buy-and-hold.
- Evaluate one modest interpretable forecast against a training-only base-rate baseline.
- Show an institutional-quality, restrained workspace that is legible on a laptop and keyboard accessible.
- Keep a public synthetic demo usable while market-data or publication rights are unresolved.

### Non-goals for the first release

- Live quotes, WebSockets/SSE, market orders, broker accounts, order routing, or real-money trading.
- User accounts, watchlists, saved portfolios, uploads, social features, leaderboards, or multi-tenancy.
- L2 order-book heatmaps, order-flow/absorption claims, news feeds, FinBERT, Granger claims, options analytics, FII/DII signals, or a multi-asset risk engine.
- A general strategy marketplace, parameter optimizer, or a claim that the chosen SMA rule has alpha.
- A feature-for-feature Bloomberg Terminal or Bookmap replica.

## 5. MVP research contract

The following are the fixed design defaults. The professor must approve the actual instrument, dates, virtual capital, and rubric before the first scored run; no symbol or capital is silently assumed.

- One NSE-listed cash-equity symbol and five-minute OHLCV bars, when a documented source and rights allow them.
- One long-only, one-position-at-a-time 20/50 SMA crossover, with no overnight holding, leverage, shorting, or derivatives.
- A signal uses only a completed bar and fills no earlier than the next eligible bar open. Ambiguous session boundary, missing-next-bar, and forced-flat cases are explicitly handled.
- Compare identical sessions and capital against no-trade cash and same-session buy-and-hold.
- A separate six-bar (30-minute) close-to-close binary direction experiment using logistic regression and causal lagged features. The training-fold positive-class base rate is the baseline.
- Chronological, complete-session train/validation/final-test split; preprocessing fits on training only. Purge labels that overlap fold/session boundaries. The test window remains untouched until configuration is locked.
- Historical predictions are marked `simulated_replay`, with origin, input cutoff, target time, model/data fingerprints, and later recorded build time. They are not presented as live-captured forecasts.
- Show score, counts, class balance, calibration view when counts support it, and uncertainty/limitations. No “AI explains the market” prose.

The exact target equation, cost schedule, starting amount, dates, fees, and exclusion rules live in a versioned study config and run receipt.

## 6. User journeys and pages

### Overview — “What happened?”

The visitor sees the active run and whether it is synthetic or rights-cleared real data; net P&L in INR and percent; gross P&L; costs and slippage separately; cash and intraday buy-and-hold comparison; equity curve; drawdown; trade count; sessions; data-quality summary; and a clear sample-size limitation.

### Forecast lab — “Did the forecast add information?”

The visitor can inspect historical-replay probabilities against the training-only base rate; Brier score, log loss, balanced accuracy, counts, class balance, reliability bins with counts, and deterministic feature contributions. The interface labels the target horizon, information cutoff, split, and forecast type. Empty or insufficient samples are shown honestly.

### Run receipt — “Can I reproduce it?”

The visitor can read or download a permitted manifest and trade ledger containing source/license label, data fingerprint, instrument, time span, bars, gap/corporate-action handling, study configuration, code revision, fee schedule, fill/slippage assumptions, split dates, software lock, generation time, exclusions, metrics, and limitations. The public receipt omits raw bars and confidential provider fields unless explicitly allowed.

### Method and data status

Shared methodology explains the experiment, formulas, baseline definitions, synthetic-data meaning, rights state, and change history. No claim is hidden in a tooltip alone.

## 7. Functional requirements

| ID | Requirement | Acceptance evidence |
|---|---|---|
| PR-01 | Public dashboard works without sign-up and is read-only. | A new visitor opens the URL; API exposes only bounded GET routes; no account or mutation flow exists. |
| PR-02 | Clearly identify the active run and synthetic/real status. | Every page, chart, and export carries a visible status and run ID. |
| PR-03 | Show net performance and itemized costs. | Recompute the displayed headline from ledger totals; reconcile gross, costs, slippage, and net to the documented rounding tolerance. |
| PR-04 | Compare with same-period baselines. | Cash/no-trade and intraday buy-and-hold use the identical eligible sessions, fees, and capital rules. |
| PR-05 | Show a provenance-backed trade ledger. | Each row contains entry/exit times and prices, quantity, gross cash flow, each fee, slippage, and net P&L. |
| PR-06 | Show the forecast and baseline fairly. | Every forecast has cutoff/target timestamps and the forecast metrics use the untouched chronological test set. |
| PR-07 | Explain model output deterministically. | Per-feature standardized `coefficient × feature` contributions plus intercept sum to the saved model logit within numerical tolerance. |
| PR-08 | Explain data and method. | Receipt has source/rights label, fingerprint, assumptions, software, split, exclusions, and limitations. |
| PR-09 | Present synthetic data safely. | Fixture marks `synthetic=true`; no synthetic price or result is labeled NSE or actual performance. |
| PR-10 | Fail closed on rights or validation failures. | Invalid/unlicensed real run cannot be promoted; UI shows no stale positive placeholder. |
| PR-11 | Make visual information accessible. | Keyboard-operable controls, visible focus, text alternatives/data tables, labeled units, contrast, non-color cues, and reduced-motion behavior. |

## 8. Success measures

Success is measured by research integrity and reviewability, not by a positive backtest.

- 100% of displayed P&L totals reconcile to the published ledger and versioned charge schedule.
- 100% of forecasts identify the point-in-time cutoff, target, model and data fingerprint.
- A professor can identify whether a run is synthetic, how costs are calculated, and the final test dates without asking the author.
- Rights gate prevents every real-data run without evidence and review.
- Visitors need no account; the interface remains usable on desktop and mobile widths.
- No private key, raw licensed bars, or write credential is exposed in browser assets or public responses.

## 9. States and copy rules

- **No approved run:** “No run has passed validation. The demo remains synthetic.”
- **Synthetic run:** visible “SYNTHETIC DATA — not market history” banner on all pages and exports.
- **Rights-cleared historical run:** show provider/license label only to the extent the agreement allows; avoid exposing contract details.
- **Insufficient evidence:** show counts and “not enough observations for a reliable comparison”; omit unsupported intervals/calibration bins.
- **Failed or stale data:** do not silently show the last run as current; identify the last successful run and its date.
- **Negative or zero result:** display exactly as measured with the same visual emphasis as a positive result.
- Never use “guaranteed,” “AI-powered alpha,” “profitable,” “beats the market,” or individualized trade calls.

## 10. Open product decisions

- Professor’s rubric and whether the study must be prospective rather than a historical replay.
- Instrument, sample dates, virtual starting capital, and share-sizing rule.
- Provider/API and actual rights for data acquisition, research use, public derived outputs, and exports.
- Broker fee schedule and contract-note rounding if broker-specific charges are modeled.
- Deployment host, region, and monthly cost ceiling.
- Qualified review of public security-specific analysis and copy.

Until these are resolved, use synthetic data, neutral defaults, and explicit “assumption” labels.
