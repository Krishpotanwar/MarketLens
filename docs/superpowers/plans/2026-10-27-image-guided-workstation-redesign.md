# Image-Guided Workstation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MarketLens frontend into a high-fidelity glassmorphic institutional terminal faithful to `reference.png` and `backgroundimg.png`, followed by a comprehensive real-user headless browser audit that only notes down problems found.

**Architecture:** Integrate the Dalal Street / BSE night skyline background asset (`backgroundimg.png`) into the global page shell with a contrast-preserving gradient overlay. Elevate UI elements (navbars, hero header, telemetry card, indices pills, discovery shelves, search/filter controls, and data tables) to glassmorphism (`backdrop-filter: blur(12px)`, semi-transparent dark slate backgrounds `rgba(11, 17, 28, 0.8)`, and subtle borders `rgba(48, 64, 88, 0.5)`). Enhance the 52-week range slider with filled range gradient tracks and dedicated high-contrast action buttons (`Analyze`, `Trade`).

**Tech Stack:** React 18, TypeScript, Vite, CSS Custom Properties / Modern CSS, Playwright / Headless Chromium.

**Spec:** Visual design specifications extracted from `reference.png` and `backgroundimg.png`, plus user directive: *"test the whole website like a real user would only note down the problems"*.

## Global Constraints

- Preserve all 58 existing web vitest tests, 82 backend unit tests, and TypeScript strict compilation (`npm --prefix web run build`).
- Git commit author must strictly be `Krish Potanwar <kpotanwar@gmail.com>`.
- In the final testing phase, do not prematurely patch new issues during the audit: strictly record and catalog all real-user problems discovered.
- Maintain WCAG AA/AAA legibility across all text rendered over the background imagery.

## Review Focus

1. Text illegibility against the photographic BSE / Bull background image without adequate backdrop blur and gradient overlay.
2. 52-week slider track positioning math edge cases (0% or 100% clamping, `high === low` zero-division prevention).
3. Mobile and narrow viewport responsiveness (ensuring shelves, index pills, and table horizontal scrolling behave properly without horizontal blowout).
4. Contrast and active states for filter tabs (NSE, BSE, Market Cap, Sector) in glassmorphism theme.
5. Action button clicks (`Analyze`, `Trade`, `AI Lab`) maintaining smooth navigation routing.

---

### Task 1: Background Asset Integration & Glassmorphic Surface Foundations

**Files:**
- Create: `web/public/backgroundimg.png` (already copied from root)
- Modify: `web/src/styles.css:1-135`
- Test: `web/tests/glassmorphism.test.ts`

- [ ] **Step 1: Write a unit test verifying glassmorphic surface tokens and background declarations**
  Create `web/tests/glassmorphism.test.ts` to assert that CSS tokens for glassmorphism surfaces (`--bg-glass-card`, `--backdrop-blur`, etc.) exist and are properly structured.
- [ ] **Step 2: Run test to verify it fails**
  Run `npm --prefix web test web/tests/glassmorphism.test.ts` to confirm failing assertions.
- [ ] **Step 3: Update `styles.css` with background and glassmorphic variables**
  Configure `body` and `.page-shell` to serve `backgroundimg.png` with `center top fixed; background-size: cover;` and an atmospheric darkening overlay `linear-gradient(180deg, rgba(7, 10, 18, 0.78) 0%, rgba(7, 10, 18, 0.88) 100%)`.
  Define glassmorphic tokens: `--bg-glass-card: rgba(11, 17, 28, 0.78);`, `--bg-glass-table: rgba(11, 17, 28, 0.85);`, `--border-glass: rgba(48, 64, 88, 0.5);`, `--backdrop-blur: blur(12px);`.
- [ ] **Step 4: Run test to verify it passes**
  Run `npm --prefix web test web/tests/glassmorphism.test.ts` and verify 100% pass.
- [ ] **Step 5: Commit changes**
  Commit with `git commit -m "style(theme): integrate background image and glassmorphic surface tokens"`.

---

### Task 2: Explorer Hero, Telemetry Card & Indices Strip Redesign

**Files:**
- Modify: `web/src/pages/StocksExplorerPage.tsx:320-370`
- Modify: `web/src/styles.css:2420-2475`
- Test: `web/tests/explorerHero.test.tsx`

- [ ] **Step 1: Write unit tests for Hero "Explorer" highlight and indices glass styling**
  Assert that the word "Explorer" renders inside an accent highlight span (`hero-explorer-highlight`) and indices strip renders the 5 major indices pills with proper tabular figures.
- [ ] **Step 2: Run test to confirm it fails**
  Run `npm --prefix web test web/tests/explorerHero.test.tsx`.
- [ ] **Step 3: Update `StocksExplorerPage.tsx` and `styles.css`**
  - Render `<h1>Indian Stocks & Market <span className="hero-explorer-highlight">Explorer</span></h1>`.
  - Style `.hero-explorer-highlight` with emerald color `#10b981` matching `reference.png`.
  - Style `.live-telemetry-status-card` with glassmorphic background, subtle border, live emerald glowing dot, and crisp refresh button.
  - Style `.indices-strip` and `.index-pill` with semi-transparent glass cards, blur filter, subtle borders, and bold tabular price/change metrics.
- [ ] **Step 4: Run test to verify it passes**
  Run `npm --prefix web test web/tests/explorerHero.test.tsx` and verify passing.
- [ ] **Step 5: Commit changes**
  Commit with `git commit -m "feat(explorer): update hero emerald accent, telemetry card, and indices pills"`.

---

### Task 3: Discovery Shelves & Controls Matching Visual Reference

**Files:**
- Modify: `web/src/pages/StocksExplorerPage.tsx:370-550`
- Modify: `web/src/styles.css:2470-2650`
- Test: `web/tests/discoveryShelves.test.tsx`

- [ ] **Step 1: Write unit test verifying shelf headers, accents, and filter pill active states**
  Test top gainers shelf, top losers shelf, and most active shelf headers, colored top accents, and exchange filter buttons (`All Exchanges`, `NSE Listed`, `BSE Listed`).
- [ ] **Step 2: Run test to verify failure**
  Run `npm --prefix web test web/tests/discoveryShelves.test.tsx`.
- [ ] **Step 3: Implement exact styles in `styles.css` and `StocksExplorerPage.tsx`**
  - Add top accent borders: Top Gainers (`border-top: 2px solid #10b981`), Top Losers (`border-top: 2px solid #ef4444`), Most Active (`border-top: 2px solid #0ea5e9`).
  - Add glassmorphic row backgrounds for items inside shelves with smooth hover effect.
  - Style search input with glassmorphism, subtle border, and clear button.
  - Style exchange tab buttons and market cap tab buttons with dark translucent backgrounds and active border highlights.
- [ ] **Step 4: Run test to verify it passes**
  Run `npm --prefix web test web/tests/discoveryShelves.test.tsx`.
- [ ] **Step 5: Commit changes**
  Commit with `git commit -m "feat(shelves): apply visual reference styling to discovery shelves and filter controls"`.

---

### Task 4: 52-Week Range Slider & High-Contrast Table Action Buttons

**Files:**
- Modify: `web/src/pages/StocksExplorerPage.tsx:580-670`
- Modify: `web/src/styles.css:2660-2740`
- Test: `web/tests/rangeSlider.test.tsx`

- [ ] **Step 1: Write unit tests for 52-week slider filled track and action button classes**
  Verify range percentage computation, progress bar fill, and action button classes (`btn-stock-trend` for Analyze, `btn-stock-trade` for Trade).
- [ ] **Step 2: Run test to verify failure**
  Run `npm --prefix web test web/tests/rangeSlider.test.tsx`.
- [ ] **Step 3: Update `StocksExplorerPage.tsx` and `styles.css`**
  - Render progress fill within `.range-track`: `<div className="range-fill" style={{ width: `${rangePct}%` }} />` and thumb indicator `<div className="range-indicator" style={{ left: `${rangePct}%` }} />`.
  - Style `.btn-stock-trend` (Analyze) with blue accent outline `border: 1px solid rgba(56, 139, 253, 0.6); color: #388bfd; background: rgba(56, 139, 253, 0.1);`.
  - Style `.btn-stock-trade` (Trade) with solid emerald fill `background: #10b981; color: #ffffff; font-weight: 600; border: 1px solid #10b981;`.
  - Style table wrapper with `background: rgba(11, 17, 28, 0.85); backdrop-filter: blur(14px); border: 1px solid rgba(48, 64, 88, 0.5); border-radius: 8px;`.
- [ ] **Step 4: Run test to verify it passes**
  Run `npm --prefix web test web/tests/rangeSlider.test.tsx`.
- [ ] **Step 5: Commit changes**
  Commit with `git commit -m "feat(table): enhance 52-week range slider with filled track and high-contrast action buttons"`.

---

### Task 5: Full Headless Chromium Real-User Audit & Problem Cataloging

**Files:**
- Create: `web/real_user_audit.mjs`
- Test: Headless Chromium end-to-end user navigation across all 6 pages at 1280px, 768px, and 375px viewports.
- Output: Problem Catalog documented in artifact and chat response (per user directive: *"only note down the problems"*).

- [ ] **Step 1: Write headless Chromium audit script mimicking real human user behavior**
  Create `web/real_user_audit.mjs` using Playwright / Puppeteer to:
  - Visit Home / Stocks Explorer, scroll page, search for "Tata", "Zomato", "Reliance", click exchange tabs, click "Analyze" button, click "Trade" button.
  - Visit Trends & Signals, inspect SVG chart, change intervals, test crosshair tooltip.
  - Visit New IPOs, inspect subscription badges and cards.
  - Visit Mutual Funds, test category filters and returns sorting.
  - Visit AI Strategy Lab, test multi-timeline tabs and confidence score cards.
  - Visit Paper Trading, inspect blotter, positions table, place paper order.
  - Capture all console errors, unhandled rejections, visual clipping / horizontal overflows, layout shifts, or broken buttons.
- [ ] **Step 2: Execute real-user audit script across all viewports**
  Run `node web/real_user_audit.mjs`.
- [ ] **Step 3: Collect and compile all discovered issues into a structured problem list**
  Per user's explicit directive: **"after this test the whole website like a real user would only note down the problems"**. Do NOT fix them first; compile and present the complete problem catalog.
