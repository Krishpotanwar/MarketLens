---
title: SEBI Indian Trading Outcomes
type: regulatory_research
captured_at: 2026-10-21
contributor: Codex
---

# SEBI Indian Trading Outcomes

## Scope and reading

This note adds independent Indian-market base-rate evidence to the PulseQuant audit. It does not estimate the performance of PulseQuant's strategy. The equity-derivatives (EDS) study covers FY25–FY26 and was published by SEBI's Department of Economic and Policy Analysis on 20 August 2026. SEBI's report defines individual traders to include retail and HNI participants and notes that FY25 comparison figures were revised after expanding its broker sample from 13 to 15. See the [official landing page](https://www.sebi.gov.in/reports-and-statistics/research/aug-2026/study-profitability-of-individual-traders-in-the-equity-derivatives-segment-fy25-fy26-_103835.html) and the [91-page report PDF](https://www.sebi.gov.in/sebi_data/attachdocs/aug-2026/1787233506209.pdf).

## Findings from the FY25–FY26 equity-derivatives study

- 87.7% of individuals were net-loss makers in FY26, down from 90.9% in FY25. Aggregate individual net losses were ₹91,685 crore in FY26.
- Loss incidence differed by product: 87.7% for options traders and 66.0% for futures traders. Options accounted for 92% of aggregate individual losses.
- The average loss among FY26 loss-makers was ₹1.47 lakh; the average profit among profit-makers was ₹1.22 lakh. The report says about 23% of traders accounted for nearly 90% of losses.
- Individuals paid about ₹25,000 crore in transaction costs in each of FY25 and FY26, and roughly ₹1 lakh crore cumulatively over FY22–FY26. Brokerage represented nearly half of those five-year costs.
- The report attributes 99% of gross profits in the FPI and proprietary-trader categories to “algo entities.” This is a category-level observation, not a causal demonstration that algorithmic trading makes a retail strategy profitable.

These figures establish a difficult market base rate, not impossibility. They do not test a particular signal or imply that a vetted strategy must lose. They do mean a claimed 62% win rate needs direct, reproducible, after-cost evidence rather than a generic market narrative.

## Cash intraday evidence

SEBI's separate [FY23 equity-cash intraday study](https://www.sebi.gov.in/reports-and-statistics/research/jul-2024/study-analysis-of-intraday-trading-by-individuals-in-equity-cash-segment_84946.html) found that more than 70% of individual intraday traders incurred net losses. The associated [official press release](https://www.sebi.gov.in/media-and-notifications/press-releases/jul-2024/sebi-study-finds-that-7-out-of-10-individual-intraday-traders-in-equity-cash-segment-make-losses_84948.html) dates the result to FY23. This covers cash intraday, unlike the more recent FY26 derivatives study; keep the populations and periods distinct.

## Implications for PulseQuant

1. Treat the 62% slider default and 30-day rupee curve as hypotheses only. They are not made credible by a market-wide statistic or another project's backtest.
2. Compare net performance against simple baselines and a no-trade/cash baseline over untouched periods. Include the exact broker/exchange charges, spread, fills, and slippage in each result.
3. Report uncertainty and the full distribution of trader outcomes, not just an average or a win rate. SEBI's results show losses and costs are concentrated and frequency-sensitive.
4. Do not present the “99% algo profits” statistic as a recipe. It describes profits by FPI/proprietary categories, not a controlled comparison of retail algorithm users versus manual traders.

## References

- SEBI, [Profitability of Individual Traders in the Equity Derivatives Segment (FY25–FY26)](https://www.sebi.gov.in/reports-and-statistics/research/aug-2026/study-profitability-of-individual-traders-in-the-equity-derivatives-segment-fy25-fy26-_103835.html), 20 August 2026.
- SEBI, [Analysis of Intraday Trading by Individuals in Equity Cash Segment](https://www.sebi.gov.in/reports-and-statistics/research/jul-2024/study-analysis-of-intraday-trading-by-individuals-in-equity-cash-segment_84946.html), 24 July 2024.
