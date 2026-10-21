# PulseQuant — Full Project Audit & News-Alpha Feasibility Verdict

**Audit date:** 2026-10-24
**Scope:** Everything in `Dav Sem 5/` — the Gemini blueprint (`Upgrading-GitHub-DAV-Projects.md`), the evidence-audit knowledge graph (6 docs + graph output), plus fresh 2026 web research on whether news → stock-direction prediction can actually produce profit.
**Mode:** Research audit only. No code written.
**Companion file:** `nemo.md` (claim-by-claim fact-check report — read that for the arithmetic corrections)

---

## 0. Executive Summary — My Honest Opinion

1. **As an engineering/DAV project: strong (8/10).** The stack (FastAPI + DuckDB + FinBERT + Lightweight Charts v5 + React 19), the econometric discipline (ADF → Granger → FDR correction, no raw-price causality), and the Bookmap-style Level-2 heatmap are genuinely above typical student work and above most GitHub repos in this class.
2. **As a money-making machine today: not yet (3/10).** The profit projection (₹51,503 / 30 days) rests on an assumed 62% win rate with internal contradictions (₹67,800 gross vs. the mathematically implied ₹1,01,100), a barrier definition that fails the project's own tax filter, no margin cap, no exit logic, and under-modeled slippage. Details in `nemo.md`.
3. **Your actual question — "can news analysis predict stock up/down and make profit?" — the 2026 evidence says: yes, but only at a multi-hour-to-multi-day horizon, in a portfolio, with event-type filtering and brutal cost accounting. Not intraday scalping.** Fast news is priced within seconds by microsecond-class algorithms (published research: latency-arbitrage races last 5–10 microseconds). The exploitable residual is *under-reaction drift* — documented for 60 years (post-earnings-announcement drift, Ball & Brown 1968) and repeatedly replicated including with modern LLMs — strongest in smaller stocks and after negative news.
4. **India-specific evidence is mixed and that is the most important finding of this audit:** one NSE study (100 large caps, 2014–2018) concludes NSE large-caps are roughly *efficient* around earnings announcements; an earlier study (2002–2017) finds PEAD persists. Drift lives in the less-attended corners: mid-caps, official NSE corporate filings (order wins, capex, auditor resignations, stake sales), and stocks with no analyst coverage.
5. **Verdict: the algorithm is achievable as a research artifact, "actually earning profit" is achievable in principle and unproven by definition until you run the validation protocol.** The correct posture is: build the terminal (that part is solid), point it at *slow-diffusing company news*, hold hours-to-days (not 45 minutes), trade a portfolio of events (not single-stock bets), and gate real money behind the 30-day paper protocol the project itself proposes. Below is the full audit and the exact evidence.

---

## 1. Project Audit — Scorecard

| Dimension | Grade | Key finding | Severity |
|---|---|---|---|
| A. Architecture & stack | A− | Modern, verified-current APIs (FastAPI SSE, LC v5 `addSeries`, DuckDB ASOF). Two stale facts (Kite Connect ₹2,000 → actual ₹500; NSE txn charges pre-Mar-2026) | Low |
| B. Data layer | B | Binance/crypto + Finnhub solid; **Indian mid-cap news coverage is the weak link**; NSE filings/BSE/Moneycontrol RSS named but unvalidated | Medium |
| C. Statistical engine | A− | ADF → differencing → Granger with FDR correction is correct practice. But Granger ≠ causality ≠ tradable edge; column-order trap correctly flagged | Medium |
| D. Sentiment engine | B + | FinBERT verified SOTA on Financial PhraseBank (~95% sentence classification). **But sentence-classification accuracy ≠ return predictability** — crypto short-horizon study found FinBERT F1 as low as 17–27% for *next-move direction* | High |
| E. Alpha model | C+ | OBI + Kalman + VWAP + VIX filter is plausible microstructure work. But the 62% win-rate gate conflates *direction probability* with *barrier-touch probability* — the central logical flaw | High |
| F. Execution & paper trader | C | Realistic Indian tax engine (verified current FY26–27), but: no margin cap, no exit logic (no barrier-touch/take-profit, no vertical expiry, no 15:15 square-off), entry slippage 0.02% vs. real 0.05–0.10%/side | High |
| G. Risk & portfolio layer | C+ | Monte Carlo VaR/CVaR/Cholesky engine is textbook-solid (with Student-t fat-tail toggle — good). But risk layer is *reporting* only; not wired into position sizing beyond 1%-risk-per-trade | Medium |
| H. Compliance | C | Angel One static-IP mandate (1 Apr 2026) omitted; TOPS 10-OPS order cap omitted; market/IOC orders prohibited for algos under new NSE retail-algo framework — all must enter the design | High |
| I. Academic (DAV rubric) fit | A | Live ingestion + cleaning pipeline + diagnostics drawer + causality suite + interactivity = strong rubric coverage; Replay mode solves the "dead demo" problem | Low |
| J. Test & validation discipline | B | The project *itself* proposes the right gates (walk-forward, embargo, 30-day paper, PF>1.45, DD<3.5%, retention>65%) — none executed yet | Medium |

**Overall: A-grade coursework with a C-grade trading thesis bolted on. The engineering survives; the profitability claim does not — yet.**

### 1.1 Defects that must be fixed before any ₹ number is believable
1. Barrier reconciliation — pick either ATR-based or %-based barriers; recompute the 2.5× tax filter against that exact definition (current config rejects ~everything or admits luck).
2. Add exit logic (touch targets, 45-min vertical expiry, 15:15 IST square-off).
3. Margin/capital cap (open notional ≤ 5× MIS buying power).
4. Slippage model: 0.05–0.10%/side + gap-through fill rules at stops.
5. Replace the 0.62 win-rate constant with a measured, walk-forward, after-cost number.
6. Compliance layer: static IP, OPS caps, prohibited order types.

---

## 2. The Central Question: Can News Predict Up/Down and Make Profit?

### 2.1 What happens in the first seconds (the race you cannot win)
- Price adjustment to corporate news begins **within seconds** of publication (ScienceDirect study on corporate-news-to-price speed); algorithmic traders monitor news/tweets/social sources around the clock and trade automatically (Journal of Financial Research, 2025, on post-hours HFT reaction; volatility moves within *fractions of a second*).
- Latency-arbitrage "races" on modern exchanges last **5–10 microseconds**, occur ~once per minute per symbol, consume ~20% of volume, and are won by 6 firms taking >80% of wins; ~$5B/year at stake globally (Aquilina–Budish–O'Neill, *Quarterly Journal of Economics*, 2021).
- Meaningful return correlations **break down at milliseconds** (Budish et al., QJE 2015): the fast, mechanical edge is *structurally* unavailable to a retail Python/backend stack — especially from off-exchange infrastructure (your latency will be tens of milliseconds through a retail WebSocket; the race is over before your tick arrives).

**Conclusion on intraday news scalping: no. This is the one strategy class where your project currently puts its energy (45-minute barriers, 1-minute bars, per-stock Granger gate). It is the wrong battlefield.**

### 2.2 What the evidence says about the slower horizon (the race you can plausibly join)
- **Heston & Sinha (Federal Reserve Board FEDS 2016, 900K+ news stories):** news predicts returns for 1–2 days only; *weekly* news buckets predict up to a quarter; **positive news is priced fast, negative news has a long delayed reaction**, with the delayed response clustering around subsequent earnings. → This is the shape of retail-viable news alpha: short, delayed, asymmetric.
- **Chan (2003, JFE; "Stock Price Reaction to News and No-News"):** post-news **drift** exists, strongest **after bad news**, strongest **in smaller stocks**, persists for months; most bad-news drift happens in *following months*, not instantly. →_under-reaction is real and size-dependent.
- **PEAD literature (Ball & Brown 1968 → present):** one of the most replicated anomalies in finance; modern ML/LLM studies (ACM ICAIF 2023; *Information Systems Research* 2025 multitask transformer) show earnings-call text materially improves drift prediction (2–3× larger daily alpha than surprise-only models).
- **LLM-sentiment trading studies (2024–2026):** OPT/GPT-class models beat lexicons and FinBERT on *return prediction* over 965K US news articles (WASSA 2024: strategy Sharpe 3.05 vs 1.23 for dictionary); a June 2026 evaluation covering ~973K tradable news items shows LLM-sentiment daily long-short portfolios remained strongly profitable **after 5 bps transaction costs** through Jan 2026. → The signal-quality bar your project sets (FinBERT) is beaten by modern LLMs; upgrading the scorer is an evidence-backed improvement, not fashion.
- **Cautionary counter-evidence:** the same literature's short-horizon tests are brutal — FinBERT-class models achieved F1 of 17–27% on *short-term direction* tasks in a 2025 crypto study; sentiment strength does not automatically transfer to next-tick direction. And an arXiv 2026 paper documents rapid **alpha decay from algorithmic homogenization** — every published signal gets arbitraged faster each year.

### 2.3 The India-specific evidence (this decides where to point the algorithm)
- **PEAD in NSE large caps (2014–2018, 100 firms):** concluded the Indian market behaves roughly *efficiently* around earnings announcements for large caps; superior returns not consistently derivable.
- **PEAD in India 2002–2017 (SCIRP):** drift persists statistically over a 64-day window after earnings surprises, controlling for beta, size, P/B, illiquidity, idiosyncratic vol.
- **Synthesis:** the drift that survives in India is concentrated where attention and analyst coverage are thin — **mid-caps, low-coverage names, and especially *slow-diffusing official disclosures*** (order wins, capex, auditor resignations, stake sales, quarterly results filed through NSE corporate-filings, which most retail participants read hours-to-days late, if at all). Your project's "News Source Mismatch" section already identified exactly this — that instinct is correct and the academic record supports it.
- Regulator base rate to keep taped to the wall: **87.7% of individual equity-derivatives traders were net-loss makers in FY26** with ₹91,685 crore aggregate net losses (SEBI, 20 Aug 2026 — verified against the primary PDF); FY23 cash-intraday study: >70% net-loss makers. Whatever we build must be able to *demonstrate*, not assume, that it is in the profitable minority.

### 2.4 Answering your exact framing — "news happening around the world for that company"
- **Company-specific news** (order win, auditor exit, results guidance, buyback, regulatory issue) maps 1:1 to that stock and is the strongest, cleanest signal for a direction model. This is the core signal.
- **Global news** (Fed decisions, oil, US CPI, geopolitics) moves *all* Indian stocks together — it is a **risk regime overlay**, not a single-stock direction signal. Your existing India-VIX / Nifty-beta filter is the right way to consume global news: as a *gate on position size*, not an entry signal.
- A working design therefore has two layers: (1) company-news → conditional direction estimate; (2) global/market state → position-size multiplier & kill-switch. The blueprint already contains both; they are just aimed at the wrong horizon.

---

## 3. Feasibility Verdict by Horizon

| Horizon | Can news → direction → profit? | Evidence basis |
|---|---|---|
| Seconds–minutes (react to headline) | **No** | Microsecond latency races; price starts moving within seconds of publication |
| Intraday (15–45 min barriers) | **Marginal-to-No** at retail latency/costs; needs HFT-class microstructure edge you don't have; India intraday costs are already 13.6 bps round-trip statutory (0.054% of notional) before slippage | Crypto/short-horizon FinBERT F1 17–27%; your own breakeven math (48.5–55.9% win rate needed with realistic slippage) |
| **End-of-day to multi-day drift (the sweet spot)** | **Plausible — the frequency where treatment is a coin-flip or better** | Heston & Sinha (1–2 day prediction), Chan (size/bad-news drift), PEAD replication studies, LLM-sentiment portfolios profitable after 5bps costs (US daily rebalanced); needs Indian replication |
| Week-to-month (fundamental drift) | **Yes in principle; slow capital velocity; not what the project is built for** | Quarterly PEAD (60-day window), India 2002–2017 study |

**Therefore: the achievable algorithm is an event-driven drift portfolio, not an intraday predictor.** Concretely: NSE filings + classified event types + FinBERT/LLM scoring → end-of-day or overnight-to-3-day holding → equal-risk-sized basket of 5–20 concurrent event positions (diversifies single-event noise, converts single-stock gambles into a statistically measurable asset) → strict total-cost accounting → walk-forward + 30-day paper gate.

### 3.1 The uncomfortable statistics your project must confront
- To *prove* a 55% edge over 50% at 95% confidence requires on the order of **hundreds of trades** — months of a daily-horizon event portfolio (this is an argument for the portfolio/multi-event design, which accumulates samples faster than one-symbol intraday scalping).
- 95% CI on an observed 62% win rate over 120 trades is roughly ±9 points — a month of "success" proves almost nothing yet. The honest KPI milestone is: a full earnings-season's worth of NSE filings (≈ 500+ quarterly results events alone in Oct/Jan) — not 120 cherry-picked intraday scalps.

---

## 4. Design Delta: What to Keep, Change, and Kill (Blueprint → Method)

| Existing element | Verdict | Reason |
|---|---|---|
| FastAPI + SSE + DuckDB + Polars ingestion | **Keep** | Verified current; correct data plane for both horizons |
| ASOF JOIN alignment (preceding-only) | **Keep** | Correct anti-lookahead construction per DuckDB docs |
| FinBERT scorer | **Keep, then upgrade** | Sentence classification ~95% (PhraseBank) but add LLM scorer (GPT-class/OPT-style) in the ensemble; evidence shows LLM > FinBERT for *return* prediction (WASSA 2024; 2026 evaluation) |
| Granger-gated sentiment weighting | **Keep as filter, demote as driver** | Granger = predictive association; fine as a gate for *whether* news matters for a symbol, not as the alpha engine |
| ADF → log-returns discipline, FDR correction | **Keep** | Textbook-correct under-reaction-era practice |
| **45-minute intraday barriers as the profit engine** | **Kill/replace** | Wrong horizon per the latency-race evidence; that race is won in microseconds, and India intraday costs + SEBI FY26 base rates make this the most-crowded losing ground |
| Event-type classifier on NSE filings (order win / capex / auditor exit / stake sale / results) | **Promote to core** | Slow-diffusing official disclosures; matches drift literature; your blueprint already gestures at it — make it the heart of the strategy |
| Multi-day triple-barrier (1–3 day vertical, wide ATR daily barriers) on a **basket** of events | **Promote to core** | This is where the under-reaction alpha actually lives; holding days amortizes India costs (₹135–. Intraday 13.6bps → per-day drag shrinks ~5× on a 5-day hold |
| India VIX/Nifty/global-news regime gate | **Keep** | Global news = risk-size multiplier, not entry signal |
| Monte Carlo VaR/CVaR panel | **Keep** | Presentation + risk-reporting strength |
| Bookmap-style Level-2 heatmap | **Keep** | Great unique UI differentiator; also *research value* — visible confirmation of absorption/iceberg behavior around filed events |
| "62% win rate" projection & ₹51,503 headline | **Kill** | Assumption, arithmetically contradicted (see nemo.md) — replace with measured walk-forward results as the only reporting basis |
| Compliance: static IP, TOPS/OPS limits, prohibited order types | **Add** | 1 Apr 2026 Angel One mandate; NSE retail-algo framework — would otherwise brick any live deployment |

### 4.1 If built this way, what does "profit" plausibly look like?
- Honest expected performance envelope for a *working* India event-drift system (given all frictions): positive expectancy after all costs, net profit retention >65% of gross, and *win rate plausibly in the 52–58% range at roughly 1:1.2 reward:risk* — i.e., single-digit-percent monthly in good months, flat-to-negative months common, never the +62% fantasy.
- The realistic sequence that makes this claim *fair*: backtest → walk-forward → 30-day live paper gate (the exact gates already written in the blueprint) → then small real capital. Anything short of that is the 87.7%, by definition.

---

## 5. Final Verdicts (Direct Answers)

**Q: Is the project good?**
Yes as a DAV engineering showcase (top-decile student work), with named defects to fix before it's deployable; the *profitability narrative* inside it is currently fiction until the validation protocol is run.

**Q: Can we build an algorithm that analyzes world + company news and predicts direction?**
Yes — a direction-estimation model is buildable at the **daily-to-few-day horizon**: company-specific filings/news scored with FinBERT+LLM ensemble, event-type classified, gated by market regime. Evidence across 60 years of finance research and 2024–2026 LLM studies supports drift at exactly this horizon, *with the strongest effects in small/mid caps and after negative news*.

**Q: Can that prediction be turned into "actually earning profit"?**
**In principle yes; in current status unproven.** The three make-or-break conditions:
1. Trade the **slow horizon** (EOD–3 days), never the fast race (microseconds-to-seconds — unwinnable).
2. Use a **basket/portfolio** of event positions so the edge becomes statistically measurable (hundreds of samples, not 120 correlated scalps).
3. Let **measured, after-cost, walk-forward + 30-day paper results** — not assumptions — be the only source of any profit claim.

If those three hold and the measured numbers clear the blueprint's own gates (net profit factor >1.45, max drawdown <3.5%, retention >65%), you have an algorithm that earns. If they don't, the same terminal is still a top-tier DAV project that tells the truth.

---

## 6. Source Register (fresh 2026 verification for this report)

**Regulatory / Indian**
- SEBI PR No.50/2026 + FY25–FY26 EDS profitability PDFs (20 Aug 2026) — 87.7% loss-makers; ₹91,685Cr; 92% of losses from options; 99% of FPI/prop profits from algo entities
- SEBI FY23 intraday cash study (Jul 2024) — >70% loss-makers
- NSE circular NSE/FA/73061 (27 Feb 2026) — txn charges 0.00307/0.00183/0.03553% w.e.f. 1 Mar 2026
- BSE Notice 20260331-7 / NSE & MSE circulars (31 Mar 2026) — STT futures 0.05%, options 0.15% w.e.f. 1 Apr 2026
- Angel One SmartAPI exchange-regulations page & forum — static IP mandatory 1 Apr 2026; TOPS 10 OPS; market/IOC prohibited for algos
- Zerodha support + zerodha.com/products/api — Kite Connect ₹500/month; Personal free; Oct 2026 brokerage-credit scheme

**Market-speed / microstructure**
- Aquilina, Budish & O'Neill, *Quantifying the HFT "Arms Race,"* QJE 2021 (races 5–10 μs; ~20% of volume; ~$5B/yr)
- Budish, Cramton & Shim, *Frequent Batch Auctions,* QJE 2015 (correlations breakdown at ms scale)
- ScienceDirect corporate-news speed study — price adjustment begins seconds after publication
- Journal of Financial Research (2025) on after-hours HFT reaction — liquidity/vol move in fractions of a second post-tweet/news
- arXiv 2026 "AI-Driven Alpha Decay" — algorithmic homogenization accelerating signal decay

**News→returns / LLM evidence**
- Heston & Sinha, *News versus Sentiment,* FEDS 2016 — daily news predicts 1–2 days; weekly predicts a quarter; negative news drifts long
- Chan, *Stock Price Reaction to News and No-News,* JFE 2003 — post-news drift, strongest small-cap/bad-news, months-long
- Ball & Brown (1968) PEAD lineage; *ISR* 2025 multitask transformer PEAD study (2–3× daily alpha vs surprise-only)
- Kirtac & Germano, WASSA 2024 — OPT/GPT-class sentiment beats FinBERT/lexicon; Sharpe 3.05 daily-rebalanced strategy
- ACL EvalEval June 2026, ~973K tradable news items — LLM long-short portfolios profitable after 5bps costs through Jan 2026
- Counter-evidence: 2025 crypto study — FinBERT F1 17–27% on short-term direction; Berkeley MIDS capstone 2025 (FinBERT+GPT-4o-mini daily selection)
- India PEAD: Gupta & Dhusia (2021, large-cap NSE — efficient/weak drift) vs SCIRP 2018/2021 (2002–2017 drift persists, 64-day window)

---

*End of audit. No code written; research only.*

**Companion file:** `nemo.md` — claim-level fact-check and arithmetic corrections.