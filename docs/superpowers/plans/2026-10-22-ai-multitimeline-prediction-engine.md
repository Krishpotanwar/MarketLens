# Indian Market AI Prediction & Multi-Timeline Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an institutional-grade Indian Market AI Prediction & Multi-Timeline Simulator that combines real-time Indian news ingestion, corporate strategy deconstruction, multi-scenario timeline branching (Bull, Base, Bear, Black-Swan), a 1,000-path Monte Carlo probability fan chart with 95%/99% VaR, and a friction-aware paper trading bridge.

**Architecture:** A decoupled, type-safe client-first quantitative simulator. Uses a unified AI Gateway supporting Groq Cloud (Llama-3.3-70B / DeepSeek-R1), Google Gemini Flash, xAI Grok, and a zero-config offline mathematical fallback. Simulation outputs branch into 4 timeline scenarios feeding a Geometric Brownian Motion + jump-diffusion Monte Carlo engine rendered on pitch-black canvas with 1-click paper execution under SEBI statutory fee rules.

**Tech Stack:** React 19, TypeScript, Vitest, Canvas/SVG, FastAPI backend, Vite 8, pure CSS variables (`#000000` pitch black).

**Spec:** `/Users/krish/.gemini/antigravity/brain/91e73dcc-2e60-4fad-b8ae-043a806b289c/ai-strategy-multitimeline-spec.md`

---

## Global Constraints

- Background must strictly remain pitch-black (`#000000`) with no purple backgrounds or accents.
- All git commits must be authored strictly by `Krish Potanwar <kpotanwar@gmail.com>` with zero AI agent co-authors.
- Never present gross returns without accounting for Indian statutory frictions (STT, Exchange fees, SEBI turnover fees, Stamp duty, 18% GST).
- Model outputs are probabilistic distributions with explicit thesis invalidation conditions, not deterministic price promises.
- Maintain 0 antipattern findings in `web/` under `impeccable detect`.

## Review Focus

1. **Empty / Missing API Key Handling:** When no user API key is provided, the engine must gracefully fall back to the built-in offline mathematical & heuristic simulation without erroring or blocking the UI.
2. **Monte Carlo Numerical Stability:** Path generations must never produce `NaN`, `Infinity`, or negative stock prices; zero division or zero volatility edge cases must be safely guarded.
3. **Probability Normalization:** Timeline branch probabilities (Bull, Base, Bear, Black-Swan) must strictly sum to 100% across all market regimes.
4. **Interactive News Sandbox Ergonomics:** User-pasted earnings reports or concall transcripts must be sanitized, trimmed, and parsed safely without crashing the prompt builder or UI.
5. **Execution Bridge Barrier Alignment:** Stop-loss and take-profit orders sent to the paper blotter must match the active timeline's quantitative invalidation levels and include statutory cost estimates.

---

## File Structure

- `web/src/types/aiSimulation.ts` — Data models for news, corporate strategy, multi-timelines, Monte Carlo paths, and AI provider configurations.
- `web/src/data/indianNewsFeeds.ts` — Curated Indian equity news items and quarterly corporate announcement fixtures across NSE multi-cap stocks.
- `web/src/utils/monteCarlo.ts` — High-performance Geometric Brownian Motion + jump-diffusion simulation generating 1,000 paths and percentile ribbons.
- `web/src/utils/monteCarlo.test.ts` — Comprehensive unit test suite for Monte Carlo simulations.
- `web/src/utils/timelineEngine.ts` — Branching scenario engine mapping technical indicators and corporate sentiment to 4 timeline states.
- `web/src/utils/timelineEngine.test.ts` — Unit test suite verifying probability normalization and invalidation level logic.
- `web/src/services/aiGateway.ts` — Streaming AI provider gateway (Groq, Gemini, Grok, Offline Heuristic) with Indian financial prompt engineering.
- `web/src/services/aiGateway.test.ts` — Unit tests for prompt construction and fallback execution.
- `web/src/components/MonteCarloFanChart.tsx` — Canvas/SVG chart visualizing 1,000 paths with 80% CI, median, and 95%/99% VaR bands.
- `web/src/components/TimelineBranchingTree.tsx` — Interactive branching tree displaying Bull, Base, Bear, and Black-Swan timelines.
- `web/src/components/CorporateStrategyCard.tsx` — 4-pillar breakdown (Capex Guidance, Margins, Moat, Tail Risks).
- `web/src/pages/AIStrategyLabPage.tsx` — Unified AI Strategy Lab page integrating news ingestion, sandbox, branching tree, Monte Carlo chart, and paper trade execution.

---

### Task 1: Type Definitions & Data Models

**Files:**
- Create: `web/src/types/aiSimulation.ts`

- [ ] **Step 1: Write type definitions for AI simulation**
  Define `IndianNewsItem`, `CorporateStrategyDeconstruction`, `TimelineScenario`, `MultiTimelineResult`, `MonteCarloPathSummary`, `MonteCarloSimulationResult`, `AIEngineProvider`, and `AIGatewayRequest`.
- [ ] **Step 2: Verify TypeScript compilation**
  Run `npm --prefix web run build` to ensure types compile cleanly.
- [ ] **Step 3: Commit**
  Stage `web/src/types/aiSimulation.ts` and commit: `feat(ai): define data models for multi-timeline simulation and corporate strategy`.

---

### Task 2: Curated Indian Financial News & Corporate Filings Data

**Files:**
- Create: `web/src/data/indianNewsFeeds.ts`

- [ ] **Step 1: Create structured Indian market news and concall presets**
  Populate realistic news feeds and corporate disclosure transcripts for major Indian equities (Reliance Industries, TCS, HDFC Bank, Infosys, Zomato, Tata Steel, Dixon Technologies, Suzlon, etc.) categorized by source (Moneycontrol, Economic Times, LiveMint, NSE Announcements).
- [ ] **Step 2: Verify data integrity in test**
  Ensure each preset stock has at least 2 relevant news items and 1 quarterly concall/filing snippet.
- [ ] **Step 3: Commit**
  Stage `web/src/data/indianNewsFeeds.ts` and commit: `feat(data): add curated Indian stock news feeds and corporate filings`.

---

### Task 3: Monte Carlo Jump-Diffusion Simulation Engine & Tests

**Files:**
- Create: `web/src/utils/monteCarlo.ts`
- Create: `web/src/utils/monteCarlo.test.ts`

- [ ] **Step 1: Write failing unit test for Monte Carlo generator**
  Test generating 1,000 paths, calculating 5th, 10th, 50th, 90th, and 95th percentiles, ensuring prices stay positive, handling zero volatility, and computing Value-at-Risk (VaR).
- [ ] **Step 2: Run test to confirm failure**
  Run `npm --prefix web test src/utils/monteCarlo.test.ts`.
- [ ] **Step 3: Implement `runMonteCarloSimulation`**
  Implement Geometric Brownian Motion with jump-diffusion:
  $$\Delta S_t = S_t \cdot (\mu \Delta t + \sigma \sqrt{\Delta t} Z_t + J_t)$$
  Compute percentiles across step intervals and return structured summary statistics.
- [ ] **Step 4: Verify test passes**
  Run `npm --prefix web test src/utils/monteCarlo.test.ts`.
- [ ] **Step 5: Commit**
  Stage `web/src/utils/monteCarlo.ts` and `web/src/utils/monteCarlo.test.ts` and commit: `feat(quant): implement Monte Carlo jump-diffusion simulation engine with VaR`.

---

### Task 4: Multi-Timeline Scenario Branching Engine & Tests

**Files:**
- Create: `web/src/utils/timelineEngine.ts`
- Create: `web/src/utils/timelineEngine.test.ts`

- [ ] **Step 1: Write failing unit test for timeline branching**
  Test generation of Bull, Base, Bear, and Black-Swan scenarios, verifying:
  - Probabilities sum to 1.0 (100%).
  - Invalidation conditions are mathematically defined below/above entry prices.
  - Risk-to-reward ratio is calculated with SEBI statutory fees.
- [ ] **Step 2: Run test to confirm failure**
  Run `npm --prefix web test src/utils/timelineEngine.test.ts`.
- [ ] **Step 3: Implement `generateTimelineScenarios`**
  Implement algorithmic scenario calculation based on stock technicals (LTP, SMA20, SMA50, RSI, VWAP) combined with corporate event signals.
- [ ] **Step 4: Verify test passes**
  Run `npm --prefix web test src/utils/timelineEngine.test.ts`.
- [ ] **Step 5: Commit**
  Stage `web/src/utils/timelineEngine.ts` and `web/src/utils/timelineEngine.test.ts` and commit: `feat(ai): implement multi-timeline scenario branching engine`.

---

### Task 5: Unified AI Gateway & Streaming Reasoning

**Files:**
- Create: `web/src/services/aiGateway.ts`
- Create: `web/src/services/aiGateway.test.ts`

- [ ] **Step 1: Write failing unit test for AI gateway prompt & fallback**
  Verify that `generateAIStrategyAnalysis` formats Indian market prompt correctly, handles missing API keys gracefully via offline fallback, and correctly parses structured response.
- [ ] **Step 2: Run test to confirm failure**
  Run `npm --prefix web test src/services/aiGateway.test.ts`.
- [ ] **Step 3: Implement `aiGateway.ts`**
  Support Groq Cloud (Llama-3.3-70b-versatile, DeepSeek-R1), Google Gemini Flash, xAI Grok, and Offline Fallback. Include prompt engineering specifically tuned for Indian markets (capex, FII/DII flow, RBI policy, margins, SEBI disclosures).
- [ ] **Step 4: Verify test passes**
  Run `npm --prefix web test src/services/aiGateway.test.ts`.
- [ ] **Step 5: Commit**
  Stage `web/src/services/aiGateway.ts` and `web/src/services/aiGateway.test.ts` and commit: `feat(ai): implement streaming AI gateway for Groq, Gemini, and Grok`.

---

### Task 6: Visual UI Components (Monte Carlo Fan Chart, Timeline Tree, Corporate Strategy Card)

**Files:**
- Create: `web/src/components/MonteCarloFanChart.tsx`
- Create: `web/src/components/TimelineBranchingTree.tsx`
- Create: `web/src/components/CorporateStrategyCard.tsx`

- [ ] **Step 1: Implement `MonteCarloFanChart.tsx`**
  Build SVG/Canvas fan chart visualizing 1,000 price paths:
  - 80% confidence interval fill (teal tint on pitch black).
  - Median expected trajectory line.
  - 95% and 99% Value-at-Risk danger line.
  - Take-profit and stop-loss markers.
  - High-DPR rendering with tooltip readouts.
- [ ] **Step 2: Implement `TimelineBranchingTree.tsx`**
  Interactive card grid/tree for the 4 timeline states (Bull, Base, Bear, Black-Swan) with probabilities, catalysts, and invalidation criteria. Clicking a timeline selects it for paper trade execution.
- [ ] **Step 3: Implement `CorporateStrategyCard.tsx`**
  Structured presentation of Management Guidance, Margin Dynamics, Competitive Moat, and Key Risk Red Flags.
- [ ] **Step 4: Commit**
  Stage components and commit: `feat(ui): add Monte Carlo fan chart, timeline branching tree, and strategy card`.

---

### Task 7: AI Strategy Lab Page Integration & Paper Trade Bridge

**Files:**
- Modify: `web/src/pages/AIStrategyLabPage.tsx`
- Modify: `web/src/styles.css`

- [ ] **Step 1: Integrate News Ingestion & Interactive Concall Sandbox**
  Add live Indian news ticker and expandable text sandbox for pasting company filings/concalls.
- [ ] **Step 2: Integrate AI Provider Selector & Key Management**
  Add dropdown for Groq (free), Gemini (free), xAI Grok, or Offline Heuristic with secure local key storage.
- [ ] **Step 3: Mount Timeline Branching Tree & Monte Carlo Fan Chart**
  Render the 4 timeline scenarios and the 1,000-path simulation fan when analysis is run.
- [ ] **Step 4: Wire One-Click Paper Trading Bridge**
  Connect selected timeline's entry, stop-loss, and target directly into `onExecuteAITrade` with SEBI statutory fee display.
- [ ] **Step 5: Add styling in `web/src/styles.css`**
  Ensure all new elements adhere to pitch-black theme (`#000000`), clear typography, high contrast, and 0 antipatterns.
- [ ] **Step 6: Commit**
  Stage changes and commit: `feat(ui): integrate multi-timeline simulation, news sandbox, and Monte Carlo fan in AI Strategy Lab`.

---

### Task 8: End-to-End Verification & Test Suite

**Files:**
- Modify: `web/src/App.test.tsx`

- [ ] **Step 1: Update frontend integration tests**
  Add test assertions verifying AI Strategy Lab renders the new timeline simulator and news sandbox without crashing.
- [ ] **Step 2: Run all frontend tests**
  Run `npm --prefix web test` and confirm all tests pass.
- [ ] **Step 3: Run frontend production build**
  Run `npm --prefix web run build` (`tsc --noEmit && vite build`) and confirm 0 errors.
- [ ] **Step 4: Run backend tests**
  Run `PYTHONPATH=. /opt/anaconda3/bin/pytest backend/tests/` and confirm 77/77 tests pass.
- [ ] **Step 5: Run impeccable design audit**
  Run `/Users/krish/.agents/skills/impeccable/scripts/impeccable detect` and verify 0 antipatterns in `web/`.
- [ ] **Step 6: Final Commit & Push**
  Verify git log author is strictly `Krish Potanwar <kpotanwar@gmail.com>` with no AI co-authors, commit, and push to `origin/main`.
