# PulseQuant historical research graph

> This is a captured research snapshot, not the current project specification. Technical versions, market-data rights, charges, and regulations must be rechecked against the current [Bazaar Drishti research brief](../docs/research/2026-10-21-research-brief.md) and official sources before use.

This is a source-checked reading list for evaluating PulseQuant's claimed Indian intraday trading edge. It is aimed at after-cost trading performance; it does not establish that a paid analytics product has customer demand or a viable business model.

The Graphify source notes are in [`raw/`](raw/). Open the [interactive graph](graphify-out/graph.html), [graph report](graphify-out/GRAPH_REPORT.md), or [raw graph data](graphify-out/graph.json).

Read in this order:

1. [[01-Evidence-Based Technical Analysis|Evidence-Based Technical Analysis]] — test whether the signal survives statistical scrutiny and out-of-sample evaluation.
2. [[02-Trading and Exchanges|Trading and Exchanges]] — model orders, spreads, liquidity, execution, and transaction costs.
3. [[03-Systematic Trading|Systematic Trading]] — connect forecasts to risk sizing, portfolios, and implementation costs.
4. [[04-Advances in Financial Machine Learning|Advances in Financial Machine Learning]] — advanced methods for financial ML and backtest-overfitting controls; read after a reproducible baseline exists.

The audit is in [[00-PulseQuant Evidence Audit|PulseQuant Evidence Audit]]. Its key conclusion is that the source document's 62% win rate is an assumption, and its displayed 30-day profit does not follow from that win rate and the stated barriers. None of these books can create a profitable signal; they help test, execute, and size one if evidence supports it.

## Additional evidence

- [[05-SEBI Indian Trading Outcomes|SEBI Indian Trading Outcomes]] adds current FY25–FY26 equity-derivatives results and the FY23 cash intraday study. These are market base rates, not evidence about PulseQuant's own strategy.
- [[06-GitHub Backtesting Repository Review|GitHub Backtesting Repository Review]] reviews six relevant public repositories for research controls, fill/cost assumptions, broker integration, and license constraints. None supplies independently validated NSE returns.
