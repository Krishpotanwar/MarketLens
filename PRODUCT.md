# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Indian equity traders, retail investors, and quantitative finance students analyzing NSE/BSE stock trends to forecast market direction and practice profitable execution risk-free through paper trading.

## Product Purpose
MarketLens provides an institutional-grade research and simulation terminal for Indian stock markets. It enables users to analyze trend momentum, evaluate calibrated predictive signals, and execute simulated paper trades that accurately account for real-world transaction costs (STT, GST, SEBI charges, brokerage, and slippage).

## Positioning
Unlike commercial apps that gamify trading or hide friction with zero-cost illusions, MarketLens emphasizes mathematical rigor, causal trend features, probabilistic calibration (Brier scores, log-loss), and exact Indian regulatory fee reconciliation.

## Operating Context
Active trading desks and web browsers used during Indian market sessions (09:15–15:30 IST) and post-market strategy debriefs. Accommodates both auditable historical run reviews and live interactive paper trade simulations.

## Capabilities and Constraints
- Groww-style Indian stock explorer across Large, Mid, and Small-cap equities with search, sectoral filters, indices tape, and discovery shelves (Top Gainers, Top Losers, Most Active).
- Indian mutual funds explorer with category filtering (Flexi Cap, Small Cap, Large Cap, Index Funds, ELSS) and interactive compound SIP wealth calculator.
- Hybrid AI Strategy Lab with strategy presets (20/50 SMA Crossover, RSI Dip Pullback, Breakout Momentum), custom prompt rules sandbox, Grok-style chain-of-thought rationale, and one-click trade execution.
- Trend and momentum analysis for key Indian equities (Nifty 50, Bluechips).
- Directional probability forecast lab with causal feature attribution.
- Live interactive paper trading terminal with virtual capital (₹10,00,000 starting cash), order book, position management, and trade execution.
- Real-time Indian statutory tax and charge ledger (STT 0.1%, Brokerage ₹20 cap, Exchange charges, GST 18%, Stamp Duty 0.015%, SEBI fees).
- Full compatibility with the published FastAPI backend API (`/api/v1/runs/current`, `/api/v1/runs/{run_id}`).

## Brand Commitments
- Name: MarketLens (wordmark: ML).
- Tone: Rigorous, serene, institutional, disciplined. Avoid flashy hype or deceptive "guaranteed profit" claims.
- Color & Typography: High-contrast, legible financial typography, disciplined olive/sage/slate tones, explicit status badges.

## Evidence on Hand
- Deterministic synthetic verification runs and historical backtest fixtures in the backend repository.
- Fully tested statutory cost calculation engine adhering to NSE cash-equity delivery/intraday schedules.
- Live backend API deployed on Render (`https://marketlens-87wo.onrender.com`).

## Product Principles
1. Transparent Friction: Every simulated trade must deduct realistic Indian statutory charges and slippage.
2. Calibrated Signals: Predictions must display confidence intervals and historical accuracy, not raw binary tips.
3. Operational Clarity: Crucial trading metrics (net P&L, drawdowns, open risk) must be visible at a glance.
4. Rigorous Auditing: Strategy receipts and SHA-256 data fingerprints preserve academic integrity.
