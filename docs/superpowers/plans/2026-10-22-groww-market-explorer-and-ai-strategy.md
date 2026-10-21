# Groww-Style Market Explorer & Hybrid AI Strategy Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Groww-style Indian stock and mutual fund discovery platform with an interactive SIP calculator and a Hybrid AI Strategy Lab featuring Grok-style reasoning and seamless paper trading execution.

**Architecture:** A static, high-density React/TypeScript interface backed by the FastAPI market service. Expands market data models with multi-cap Indian stocks and top-tier mutual funds. Implements an AI Strategy reasoning engine that synthesizes technical indicators and custom user prompts into calibrated directional trade setups with one-click paper trade execution.

**Tech Stack:** React 19.3, TypeScript, Vite 8.3.4, Vitest, FastAPI, CSS Design Tokens (Dark Terminal / Light Desk).

**Spec:** [`groww-and-ai-strategy-spec.md`](file:///Users/krish/.gemini/antigravity/brain/91e73dcc-2e60-4fad-b8ae-043a806b289c/groww-and-ai-strategy-spec.md)

## Global Constraints

- Never add AI agent co-authors in git commits (sole author: Krish Potanwar <kpotanwar@gmail.com>).
- Preserve existing academic research backtest endpoints (`/api/v1/runs/current`, `/api/v1/runs/{run_id}`) without regressions.
- Enforce `font-variant-numeric: tabular-nums` for all financial figures, NAVs, prices, and percentages.
- Avoid overused AI fonts and generic UI slop; maintain 0 findings under `impeccable detect`.
- All tests (Vitest + Python unittest) must pass cleanly after each task.

## Review Focus

1. **Search & Filter Robustness**: Search input must handle case-insensitivity, symbol vs company name matching, and empty search results gracefully.
2. **SIP Compound Interest Math**: Calculation of $M = P \times \frac{(1+i)^n - 1}{i} \times (1+i)$ must handle zero and extreme rates without non-finite / NaN values.
3. **AI Strategy Reasoning Fallback**: If no external API key is provided, the AI Strategy Lab must produce deterministic, mathematically sound reasoning and trade setups without breaking or showing empty states.
4. **Paper Trade Bridge Cohesion**: Clicking "Execute AI Trade" or "Trade in Paper Terminal" must carry symbol, side, and target prices cleanly into the Paper Trading Terminal.
5. **Theme Consistency**: All new shelves, fund cards, sliders, and AI reasoning blocks must render seamlessly in both Dark Terminal and Light Desk modes.

---

### Task 1: Market Data Models & Mutual Funds Data Store

**Files:**
- Create: `web/src/types/funds.ts`
- Create: `web/src/data/mutualFundsData.ts`
- Modify: `web/src/data/indianMarketData.ts`
- Test: `web/src/App.test.tsx`

- [ ] Define `MutualFundInfo`, `SIPCalculationResult`, and market cap categories in `web/src/types/funds.ts`.
- [ ] Create `calculateSIP` helper function in `web/src/types/funds.ts` with compound interest formula and validation.
- [ ] Populate `web/src/data/mutualFundsData.ts` with top Indian funds (Parag Parikh Flexi Cap, Quant Small Cap, Nippon India Growth, UTI Nifty 50 Index, Mirae Asset Large Cap, SBI Bluechip, HDFC Mid-Cap).
- [ ] Expand `web/src/data/indianMarketData.ts` with 20+ multi-cap equities (Zomato, Tata Steel, L&T, SBI, Bajaj Finance, Sun Pharma, Adani Enterprises, etc.) and `marketCapCategory` tags.
- [ ] Write unit tests in `web/src/App.test.tsx` verifying SIP calculation math and data store integrity.
- [ ] Run `npm --prefix web test -- --run` to ensure all tests pass.
- [ ] Commit changes.

---

### Task 2: Groww-Style Indian Stocks Explorer Page

**Files:**
- Create: `web/src/pages/StocksExplorerPage.tsx`
- Modify: `web/src/App.test.tsx`

- [ ] Build `StocksExplorerPage` with:
  - Market Indices banner (`NIFTY 50`, `SENSEX`, `BANK NIFTY`, `NIFTY IT`, `NIFTY AUTO`, `NIFTY PHARMA`).
  - Discovery shelves: **Top Gainers**, **Top Losers**, and **Most Active by Volume**.
  - Interactive search bar with instant autocomplete.
  - Market Cap tabs: All, Large Cap, Mid Cap, Small Cap, plus Sector filter chips.
  - Company cards/table displaying LTP, Day Change (₹ and %), 52-Week High/Low, and action buttons.
  - Bridges to "Analyze Signals" and "Paper Trade".
- [ ] Write Vitest test cases in `web/src/App.test.tsx` testing search, cap filtering, and shelf rendering.
- [ ] Run `npm --prefix web test -- --run` to verify tests pass.
- [ ] Commit changes.

---

### Task 3: Indian Mutual Funds Explorer & Interactive SIP Calculator Page

**Files:**
- Create: `web/src/pages/MutualFundsPage.tsx`
- Modify: `web/src/App.test.tsx`

- [ ] Build `MutualFundsPage` with:
  - Fund category filter (All, Flexi Cap, Small Cap, Large Cap, Index Funds, ELSS).
  - Mutual fund cards showing Fund Name, Category, Risk Rating, NAV (₹), AUM (₹ Cr), Expense Ratio, and 1Y / 3Y / 5Y CAGR returns.
  - Interactive SIP Calculator:
    - Sliders for Monthly Investment (₹500 - ₹1,00,000), Expected Annual Return (8% - 25%), and Investment Period (1 - 30 Years).
    - Summary tiles: Total Invested, Estimated Returns, Total Maturity Wealth.
    - Visual wealth ratio bar comparing principal vs interest growth.
- [ ] Add test cases in `web/src/App.test.tsx` for mutual funds listing and SIP calculator interaction.
- [ ] Run `npm --prefix web test -- --run` to verify tests pass.
- [ ] Commit changes.

---

### Task 4: Hybrid AI Strategy Lab & Grok Reasoning Sandbox Page

**Files:**
- Create: `web/src/pages/AIStrategyLabPage.tsx`
- Modify: `web/src/App.test.tsx`

- [ ] Build `AIStrategyLabPage` with:
  - Stock selector (from our Indian equities list).
  - Strategy preset selector:
    - *Trend Following Crossover (20/50 SMA)*
    - *Mean Reversion RSI Pullback (RSI < 35)*
    - *Breakout Momentum (Volume Surge > 1.8x)*
    - *Custom Strategy Prompt Sandbox* (free-form textarea for user strategy instructions).
  - Grok / LLM Reasoning Engine:
    - Directional prediction badge (`BULLISH` / `BEARISH` / `NEUTRAL`).
    - Probability confidence score ($P(\text{Up})$ e.g. 78%).
    - Actionable trade setup: Entry Price, Stop Loss, Target Price, Risk-Reward ratio.
    - Strategy Chain-of-Thought reasoning box explaining the technical and causal factors.
    - Optional xAI / OpenAI API Key input (persisted in `localStorage`).
  - "Execute AI Trade in Paper Terminal" action button.
- [ ] Write Vitest tests in `web/src/App.test.tsx` for AI strategy generation and trade setup calculations.
- [ ] Run `npm --prefix web test -- --run` to verify tests pass.
- [ ] Commit changes.

---

### Task 5: Global Navigation Integration & Impeccable Polish

**Files:**
- Modify: `web/src/components/Header.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/styles.css`
- Modify: `PRODUCT.md`

- [ ] Add `stocks`, `funds`, and `ai-strategy` to `PageTab` in `web/src/components/Header.tsx`.
- [ ] Wire up new pages in `web/src/App.tsx` with seamless tab switching and trade execution bridging.
- [ ] Add styles for discovery shelves, mutual fund cards, SIP sliders, and AI strategy reasoning panels in `web/src/styles.css`.
- [ ] Update `PRODUCT.md` with the new capabilities.
- [ ] Run `/Users/krish/.agents/skills/impeccable/scripts/impeccable detect --json` to ensure 0 antipatterns.
- [ ] Run full test suites: `npm --prefix web test -- --run` and `python3 -m unittest discover -s backend/tests`.
- [ ] Run production build `npm --prefix web run build`.
- [ ] Commit and push all changes to GitHub `origin/main`.
