# Quantitative Finance & Stock Prediction Reference Guide

> **Target Audience:** Autonomous Agents, Quantitative Researchers, and Full-Stack Engineers working on Bazaar Drishti / MarketLens.  
> **Last Updated:** October 2026  
> **Core Tenet:** Evidence before assertions. Model outputs are probabilistic hypotheses subject to statutory friction, slippage, and non-stationarity—never deterministic money machines.

---

## 1. User-Submitted Repositories (Analysis & Verdicts)

### 1.1 `shirosaidev/stocksight`
* **Repository:** [shirosaidev/stocksight](https://github.com/shirosaidev/stocksight)
* **Architecture:** Python, Elasticsearch, Kibana, NLTK, VADER, TextBlob, Scrapy/Tweepy.
* **Core Concept:** Real-time sentiment ingestion pipeline. Streams news headlines and social media posts into an Elasticsearch index, applies sentiment scoring (VADER + lexicon), and visualizes sentiment shifts against price volatility in Kibana dashboards.
* **Strengths:** 
  - Decoupled event streaming and document storage architecture.
  - Good template for tracking sudden shifts in news volume/chatter before and after earnings announcements.
* **Limitations & Pitfalls:**
  - Standard VADER is trained on social media text, not financial jargon; it misclassifies terms like "gross margin compressed" or "credit downgrade" as neutral/mild.
  - Social media sentiment is vulnerable to bot swarms, pump-and-dump noise, and survivorship bias.
* **Utility for MarketLens:** Ingesting RSS feeds (Moneycontrol, Economic Times, NSE corporate announcements) and passing text to finance-calibrated models rather than raw VADER.

---

### 1.2 `achillesrasquinha/bulbea`
* **Repository:** [achillesrasquinha/bulbea](https://github.com/achillesrasquinha/bulbea)
* **Architecture:** Python, TensorFlow/Keras, Pandas, Matplotlib.
* **Core Concept:** Deep learning library designed as a high-level wrapper around RNNs and LSTMs for stock time series prediction and technical indicator charting (e.g., Bollinger Bands).
* **Strengths:** Clean, accessible API for quick sequential model prototyping.
* **Limitations & Pitfalls:**
  - Trains standard sequential models on raw close prices rather than stationary log-returns or fractional differentiation, leading to classic "lagged replica" outputs ($y_{t+1} \approx y_t$).
  - Ignores transaction costs, broker commissions, and execution slippage.
* **Utility for MarketLens:** Historical benchmark reference for recurrent neural networks; avoid using raw price levels as prediction targets.

---

### 1.3 `LastAncientOne/Stock_Analysis_For_Quant`
* **Repository:** [LastAncientOne/Stock_Analysis_For_Quant](https://github.com/LastAncientOne/Stock_Analysis_For_Quant)
* **Architecture:** Multi-language quantitative encyclopedia (Python, R, Excel, MATLAB, Tableau, Power BI).
* **Core Concept:** Exhaustive toolkit covering traditional quantitative finance methods: technical indicators, statistical arbitrage, portfolio optimization (Markowitz Mean-Variance, Black-Litterman), Monte Carlo simulations, and event studies.
* **Strengths:** 
  - Immense breadth of reference implementations across multiple platforms.
  - Clear mathematical formulations for volatility modeling, risk metrics (Value at Risk, Conditional VaR), and factor betas.
* **Limitations & Pitfalls:**
  - Highly fragmented code snippets without unified end-to-end backtesting or execution pipelines.
* **Utility for MarketLens:** Excellent mathematical and statistical reference for portfolio metrics, drawdowns, and multi-timeline Monte Carlo paths.

---

### 1.4 `robertmartin8/MachineLearningStocks`
* **Repository:** [robertmartin8/MachineLearningStocks](https://github.com/robertmartin8/MachineLearningStocks)
* **Architecture:** Python, Scikit-learn, Pandas, Yahoo Finance.
* **Core Concept:** Supervised machine learning applied to fundamental financial ratios (P/E ratio, Price-to-Book, Debt-to-Equity, Enterprise Value) to predict which stocks will outperform an index (e.g., S&P 500) over a multi-month/multi-year horizon.
* **Strengths:**
  - Focuses on the right time horizon: fundamental data and multi-month holding periods where economic signals actually have explanatory power over random market microstructure noise.
  - Explores outperformance classification instead of arbitrary point-in-time penny predictions.
* **Limitations & Pitfalls:**
  - Requires Point-in-Time (PIT) financial statement data to prevent lookahead bias (historical datasets often backfill revised earnings rather than what was known on the filing date).
* **Utility for MarketLens:** Ideal architectural pattern for the Multi-Cap Indian Stocks screener and Long-Term Fundamentals valuation module.

---

### 1.5 `LastAncientOne/Deep_Learning_Machine_Learning_Stock`
* **Repository:** [LastAncientOne/Deep_Learning_Machine_Learning_Stock](https://github.com/LastAncientOne/Deep_Learning_Machine_Learning_Stock)
* **Architecture:** Jupyter Notebooks, Keras/PyTorch, Scikit-learn.
* **Core Concept:** Comparative experimentation with neural architectures (Dense, CNN-1D, LSTM, GRU, Bidirectional LSTMs, Transformers) applied to financial time series.
* **Strengths:** Great exploratory walkthrough showing the evolution of deep learning applied to OHLCV features and technical indicators.
* **Limitations & Pitfalls:** High risk of backtest overfitting (PBO) when tuning dozens of hyperparameters on small historical windows without out-of-sample purging and embargoing.
* **Utility for MarketLens:** Educational reference for neural feature transformation and baseline comparison against regularized linear models (Logistic/Ridge/Lasso).

---

### 1.6 `JordiCorbilla/stock-prediction-deep-neural-learning`
* **Repository:** [JordiCorbilla/stock-prediction-deep-neural-learning](https://github.com/JordiCorbilla/stock-prediction-deep-neural-learning)
* **Architecture:** Python, TensorFlow 2.x, Plotly, Pandas.
* **Core Concept:** Rigorous deep learning forecasting laboratory comparing multi-task LSTM architectures against standard naive baselines (e.g., persistence model $P_{t+1} = P_t$).
* **Strengths:**
  - Explicitly measures skill relative to naive random walk forecasts using Relative RMSE / Out-of-Sample R² rather than misleading train-set $R^2$.
  - Models price delta, trend residuals, and directional classification simultaneously.
  - Incorporates transaction cost awareness into trading simulation.
* **Limitations & Pitfalls:** Does not account for Indian statutory fee schedules (STT, Stamp Duty, GST, Exchange turnover).
* **Utility for MarketLens:** Best-in-class deep learning engineering baseline to adopt when comparing custom models against the naive benchmark.

---

## 2. Top-Tier Quantitative & AI Ecosystems

| Repository | Organization | Primary Focus | Best Use in MarketLens |
|---|---|---|---|
| [`microsoft/qlib`](https://github.com/microsoft/qlib) | Microsoft Research | AI-oriented quantitative investment platform (Alpha mining, GBDT, Transformer, rolling validation) | Institutional model benchmarking, cross-sectional ranking, feature store architecture |
| [`AI4Finance-Foundation/FinGPT`](https://github.com/AI4Finance-Foundation/FinGPT) | AI4Finance | Open-source Financial LLMs, LoRA instruction tuning, financial sentiment, forecaster agents | News headline analysis, event sentiment extraction, scenario reasoning |
| [`AI4Finance-Foundation/FinRL`](https://github.com/AI4Finance-Foundation/FinRL) | AI4Finance | Deep Reinforcement Learning for trading (PPO, SAC, DDPG, TD3) | Agent decision policies, dynamic capital allocation |
| [`OpenBB-finance/OpenBB`](https://github.com/OpenBB-finance/OpenBB) | OpenBB | Modular investment research terminal and standardized financial data connectors | Terminal UI/UX layout, macro data ingestion patterns |
| [`QuantConnect/Lean`](https://github.com/QuantConnect/Lean) | QuantConnect | Modular, event-driven multi-asset algorithmic trading engine | Rigorous separation of fee models, slippage models, and fill timing |
| [`ranaroussi/yfinance`](https://github.com/ranaroussi/yfinance) | Community | Yahoo Finance market data scraping client | Historical fallback data for global indices and multi-decade charts |
| [`jugaad-data`](https://github.com/jugaad-py/jugaad-data) | Jugaad | Python client for downloading historical NSE/BSE stock and index data, derivatives | Clean local historical Indian dataset generation for offline backtests |

---

## 3. Essential Quantitative Research Literature & Blogs

### 3.1 Foundational Textbooks
1. **Marcos López de Prado — *Advances in Financial Machine Learning* (Wiley, 2018):**
   - **Triple Barrier Method:** Defines trade outcomes by profit-take barrier, stop-loss barrier, and vertical time horizon, replacing artificial fixed-time horizon returns.
   - **Purged & Embargoed Cross-Validation:** Eliminates serial correlation and lookahead leakage between training and validation folds in financial time series.
   - **Deflated Sharpe Ratio (DSR) & PBO:** Measures the probability that an impressive backtest is merely the outcome of multiple hypothesis testing rather than true alpha.
2. **David Aronson — *Evidence-Based Technical Analysis* (Wiley, 2007):**
   - Demolishes unscientific chart pattern lore. Demonstrates why data mining biases lead traders to mistake random variance for predictable edge without rigorous Monte Carlo permutation tests (White's Reality Check).
3. **Larry Harris — *Trading and Exchanges: Market Microstructure for Practitioners* (Oxford University Press, 2003):**
   - Details how liquidity providers, informed traders, and noise traders interact; explains bid-ask spread mechanics, order book dynamics, and why retail market orders suffer adverse selection.
4. **Robert Carver — *Systematic Trading* (Harriman House, 2015):**
   - Decouples three distinct systems: Signal Forecasting (continuous, scaled), Position Sizing (volatility-adjusted risk targeting), and Execution (order routing and rebalancing speed limits).

### 3.2 High-Value Quantitative Research Blogs
* **QuantStart (quantstart.com):** Deep-dive tutorials on event-driven backtesting, statistical arbitrage, cointegration tests, and GARCH volatility forecasting in Python.
* **Rob Carver’s Systematic Money (systematicmoney.org):** Practical insights from a former hedge fund head on real-world portfolio sizing, managing drawdown emotions, and avoiding complexity traps.
* **Ernie Chan’s Quantitative Trading Blog (epchan.blogspot.com):** Pragmatic strategies on mean-reversion, machine learning caveats, and tail-risk hedging.
* **SEBI Research Reports (sebi.gov.in):** Official empirical studies on Indian markets (e.g., FY23/FY24 analyses showing >90% of individual derivative/intraday equity traders incur net losses due to transaction frictions).

---

## 4. Multi-Timeline Simulation & AI Strategy Architecture

To fulfill the user's vision of an AI engine that reads Indian market news, understands corporate strategies, and simulates multiple timeline possibilities, the architecture must avoid single-point price hallucination. Instead, it must follow an **Event-Driven Multi-Scenario Branching Engine**:

```
                       [ Incoming Indian News / Filings / Macro ]
                                          │
                                          ▼
                       [ Event Extraction & Classification ]
                   (FinBERT / Free LLM: Groq / Gemini / Grok)
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                ▼                         ▼                         ▼
      [ Timeline A: Bull ]      [ Timeline B: Base ]      [ Timeline C: Bear ]
      - Catalysts: Earnings beat - Catalysts: In-line guidance - Catalysts: Margin hit / NPA
      - Probability: 30%        - Probability: 50%        - Probability: 20%
      - Target Range: +4% to +8%- Target Range: -1% to +2%- Target Range: -5% to -10%
      - Strategic Invalidation  - Strategic Invalidation  - Strategic Invalidation
                └─────────────────────────┬─────────────────────────┘
                                          ▼
                          [ Monte Carlo Paths & Risk Fan ]
                           (1,000 geometric Brownian /
                            jump-diffusion trajectories)
                                          │
                                          ▼
                       [ Actionable Paper Trading Bridge ]
                   - Automated Stop-Loss & Target Barriers
                   - Statutory Cost Reconciliation (SEBI/NSE)
                   - SHA-256 Audit Run Receipt
```

### 4.1 Free / Open AI Model Integration Options
1. **Groq Cloud (Free Tier):** Ultra-fast Llama-3.3-70B / Mixtral-8x7b inference (~300–800 tokens/sec), ideal for streaming chain-of-thought financial reasoning without latency.
2. **Google Gemini Flash (Free Tier):** Generous rate limits, large context window (1M tokens) capable of ingesting entire quarterly conference call transcripts and SEBI disclosure PDFs.
3. **Local HuggingFace FinBERT (`ProsusAI/finbert`):** Zero-cost, 100% offline, specialized for financial headline sentiment polarity (positive, negative, neutral).
4. **xAI Grok API:** Powerful reasoning for contrarian, unconventional thesis generation when configured with user API keys.

---

## 5. Core Guardrails for Future Agent Implementations

1. **Zero-Cost Illusion Prohibition:** Never present gross returns without deducting full NSE statutory levies (STT, Exchange Transaction Charges, SEBI Turnover Fee, IPFT, Stamp Duty, and 18% GST on brokerage + charges).
2. **Lookahead Bias Defense:** Features calculated at time $T$ must strictly consume information available before or at time $T$. No future data leakage in rolling averages or split boundaries.
3. **Execution Realism:** Market orders assume the next bar's open or volume-weighted execution price with modeled slippage, never the current bar's close without latency buffer.
4. **Probabilistic Outputs:** Model outputs must be framed as scenario distributions with stated invalidation conditions, not deterministic guarantees.
