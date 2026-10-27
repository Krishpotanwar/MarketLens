# Natural Developer Workstation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely redesign the MarketLens frontend from generic AI-template tropes (radial dot grid, neon glows, bubble pills) into an authentic, institutional developer workstation (Bloomberg Launchpad / Linear / GitHub Dark style) with flat dark slates, tabular monospace digits, and disciplined data-first layout.

**Architecture:** Establish a central design token system in `styles.css` with natural developer neutral surfaces (`#0d1117`, `#161b22`, `#30363d`), strip the `.dot-background` canvas entirely, replace the header with an integrated 44px command strip + 34px workspace sub-navigation bar, and polish all tables, charts, screener lists, and blotters to utilize monospace tabular figures and 1px hairline rules.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest 5, Playwright, Vanilla CSS Design Tokens, SVG Data Visualizations.

**Spec:** `docs/superpowers/specs/2026-10-27-natural-developer-workstation-redesign.md`

## Global Constraints

- Never use neon cyan (`#00f0ff`), electric purple (`#a855f7`), or glowing drop shadows (`box-shadow: 0 0 ...`).
- Never render radial background dot grids or canvas dots (`.dot-background` is completely removed).
- Over 95% of screen pixels must be neutral dark tones (`#0d1117`, `#161b22`, `#21262d`).
- Directional green (`#3fb950`) and red (`#f85149`) are strictly confined to delta values and change indicators.
- Every financial price, quantity, percentage, volume, P&L, timestamp, and order book figure must use monospace tabular numbers (`font-variant-numeric: tabular-nums`).
- All 58 Vitest unit tests and 11 Playwright E2E tests must pass with zero errors.
- Headless Chromium multi-viewport audit must pass across 1440x900, 1280x720, and 768x1024 with 0 horizontal overflows and 0 console errors.

## Review Focus

1. **Header Layout & Navigation Overflow:** Verify the top command bar stays strictly 44px and the tab bar 34px without wrapping or overlapping across Desktop, Laptop, and Tablet viewports.
2. **Chart Crosshair & Tooltip Tracking:** Confirm that SVG crosshair mouse tracking in `TrendAnalysisPage` does not drift or clip when zooming or switching timeframes.
3. **Table & Numerical Alignment:** Ensure all numeric columns in Stocks Explorer, IPOs, and Paper Trading are right-aligned and vertically stack with tabular monospace figures.
4. **Search Command & Hotkey `⌘K`:** Confirm Global Search opens immediately via mouse click or keyboard shortcut without clipping viewport edges.
5. **DOM Test ID & Accessibility Stability:** Ensure existing test selectors (`.global-search-input`, `.data-table`, `.trend-svg`, `.btn-stock-trend`, `.tax-slip-block`, etc.) remain fully functional.

---

### Task 1: Token Architecture, Surface Resets & Dot Grid Elimination

**Files:**
- Modify: `web/src/styles.css:1-120`
- Modify: `web/src/App.tsx:70-110`
- Test: `web/src/App.test.tsx`

**Interfaces:**
- Consumes: Existing CSS variable definitions.
- Produces: Workstation design tokens (`--bg-ground`, `--bg-surface`, `--bg-subtle`, `--border-default`, `--border-muted`, `--text-primary`, `--text-secondary`, `--accent-blue`, `--trade-gain`, `--trade-loss`, `--font-interface`, `--font-figures`).

- [ ] **Step 1: Write test asserting dot grid canvas is removed and root terminal tokens are applied**

Add test in `web/src/App.test.tsx`:
```tsx
it("renders without dot-background canvas class", () => {
  const { container } = render(<App />);
  expect(container.querySelector(".dot-background")).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web test src/App.test.tsx`
Expected: FAIL if `.dot-background` is present in DOM.

- [ ] **Step 3: Update `styles.css` token definitions and remove `.dot-background` in `App.tsx`**

Replace root CSS variables in `web/src/styles.css` with:
```css
:root {
  --bg-ground: #0d1117;
  --bg-surface: #161b22;
  --bg-subtle: #21262d;
  --border-default: #30363d;
  --border-muted: #21262d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-tertiary: #6e7681;
  --accent-blue: #388bfd;
  --accent-blue-subtle: rgba(56, 139, 253, 0.12);
  --trade-gain: #3fb950;
  --trade-gain-subtle: #122c1b;
  --trade-loss: #f85149;
  --trade-loss-subtle: #331518;
  --font-interface: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-figures: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
```
Remove `.dot-background` wrapper div in `web/src/App.tsx` and ensure `body` has flat `background: var(--bg-ground);`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web test src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/styles.css web/src/App.tsx web/src/App.test.tsx
git commit --author="Krish Potanwar <kpotanwar@gmail.com>" -m "feat(design): implement natural developer tokens and eliminate dot canvas"
```

---

### Task 2: Workstation Top Command Bar & Sub-Navigation Shell

**Files:**
- Modify: `web/src/App.tsx:75-160`
- Modify: `web/src/components/GlobalSearchBar.tsx:180-260`
- Modify: `web/src/styles.css:200-380`
- Test: `web/src/components/GlobalSearchBar.test.tsx`
- Test: `web/src/App.test.tsx`

**Interfaces:**
- Consumes: Natural developer tokens from Task 1.
- Produces: 44px `.command-bar` + 34px `.workstation-nav`, persistent indices ribbon, `⌘K` search trigger, cash blotter.

- [ ] **Step 1: Write test asserting command bar structure and active tab 2px bottom line**

In `web/src/App.test.tsx`:
```tsx
it("renders 44px command header and active tab indicator", () => {
  render(<App />);
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByText(/MarketLens/i)).toBeInTheDocument();
  expect(screen.getByText(/Live/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify initial state**

Run: `npm --prefix web test src/App.test.tsx`
Expected: Verify assertion behavior.

- [ ] **Step 3: Implement 44px command bar and 34px flat text tab navigation**

In `web/src/App.tsx`:
1. Render `.command-bar` with:
   - Wordmark: `MarketLens` + `.badge-live-pulse` (`● Live NSE/BSE`).
   - Indices tape: NIFTY 50 and SENSEX with monospace percentage changes.
   - Global Search command button with `⌘K` badge.
   - Virtual cash blotter (`₹10,00,000`).
2. Render `.workstation-nav` with flat text tabs:
   - Active tab carries `.active` with 2px solid bottom line in `#388bfd`.
   - Remove all bubble pill backgrounds.
3. In `GlobalSearchBar.tsx`, adapt trigger button to 30px compact command input.

- [ ] **Step 4: Run unit tests**

Run: `npm --prefix web test`
Expected: All 58 unit tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/App.tsx web/src/components/GlobalSearchBar.tsx web/src/styles.css web/src/App.test.tsx
git commit --author="Krish Potanwar <kpotanwar@gmail.com>" -m "feat(shell): implement 44px command bar and utilitarian tab strip"
```

---

### Task 3: High-Density Data Tables & Screener Sidebar Overhaul

**Files:**
- Modify: `web/src/pages/StocksExplorerPage.tsx:280-450`
- Modify: `web/src/pages/TrendAnalysisPage.tsx:680-770`
- Modify: `web/src/styles.css:400-650`
- Test: `e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes: Shell tokens and font definitions.
- Produces: 36px table rows (`.data-table tbody tr`), right-aligned tabular figures (`.table-num`), 280px flat screener panel (`.screener-panel`), flat button groups (`.stock-action-group`).

- [ ] **Step 1: Write E2E assertion verifying table numbers are right-aligned monospace**

Verify that in `e2e/marketlens.spec.ts`:
Table cells displaying LTP and change percentages have tabular numeric styling and right alignment.

- [ ] **Step 2: Run Playwright test on Stocks Explorer**

Run: `npx playwright test -g "Groww-Style Indian Stocks Explorer"`
Expected: PASS or check baseline.

- [ ] **Step 3: Restyle data tables and screener sidebar in `styles.css`**

1. Set `.data-table` to:
   - Row height: 36px.
   - Header: 32px height, uppercase slate text (`#8b949e`), 11px font size, 1px bottom border (`#30363d`).
   - Cells: Left-align text columns, right-align price/quantity/percent columns using `font-family: var(--font-figures); font-variant-numeric: tabular-nums;`.
   - Zebra striping removed; hover row background `#161b22`.
2. Restyle `.screener-panel` in `TrendAnalysisPage.tsx`:
   - Flat 280px panel with 1px border.
   - Screener rows: 32px height, active row highlighted with `#21262d` background and 2px left border.
   - Action buttons: `.btn-stock-trend`, `.btn-stock-trade`, `.btn-stock-ai` styled as flat button groups with 1px borders (`#30363d`).

- [ ] **Step 4: Run unit and E2E verification**

Run: `npm --prefix web test && npx playwright test -g "Groww-Style Indian Stocks Explorer"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/StocksExplorerPage.tsx web/src/pages/TrendAnalysisPage.tsx web/src/styles.css
git commit --author="Krish Potanwar <kpotanwar@gmail.com>" -m "feat(tables): redesign high-density financial tables and screener sidebar"
```

---

### Task 4: Interactive Price Chart & Monospace Tooltip Polishing

**Files:**
- Modify: `web/src/pages/TrendAnalysisPage.tsx:320-420, 780-920`
- Modify: `web/src/styles.css:660-800`
- Test: `e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes: Normalized SVG coordinates and timeframe state.
- Produces: Clean `#388bfd` price stroke, subtle area gradient, flat volume histogram, 1px dashed crosshair, and tabular tooltip card.

- [ ] **Step 1: Verify timeframe and chart rendering tests**

Run: `npx playwright test -g "Search for IOCL and Plot Real Live Exchange Chart"`
Expected: PASS

- [ ] **Step 2: Update chart presentation and styling**

In `web/src/pages/TrendAnalysisPage.tsx` and `web/src/styles.css`:
1. Set SVG price polyline stroke to `#388bfd` (1.5px width) and gradient fill to `rgba(56, 139, 253, 0.06)`.
2. Set volume rects to `#21262d` with directional tints (`#3fb950` / `#f85149`).
3. Set crosshair vertical/horizontal line to 1px dashed `#8b949e`.
4. Style `.chart-hover-tooltip`:
   - Background `#161b22`, border `1px solid #30363d`, text `#e6edf3`.
   - Display Open, High, Low, Close, and Volume in `--font-figures` with tabular nums.
5. Timeframe buttons (`1D`, `5D`, `1M`, `1Y`): Flat text buttons with crisp outline on active.

- [ ] **Step 3: Run Playwright test for chart hover and timeframes**

Run: `npx playwright test -g "Search for IOCL and Plot Real Live Exchange Chart"`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/TrendAnalysisPage.tsx web/src/styles.css
git commit --author="Krish Potanwar <kpotanwar@gmail.com>" -m "feat(charts): polish interactive SVG chart with developer blue and tabular tooltip"
```

---

### Task 5: IPO Hub, Mutual Funds, AI Strategy Lab & Paper Trading Terminal Overhaul

**Files:**
- Modify: `web/src/pages/IPODiscoveryPage.tsx`
- Modify: `web/src/pages/MutualFundsPage.tsx`
- Modify: `web/src/pages/AIStrategyLabPage.tsx`
- Modify: `web/src/pages/PaperTradingPage.tsx`
- Modify: `web/src/styles.css:800-1400`
- Test: `e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes: Natural developer tokens across all secondary tabs.
- Produces: Flat IPO cards, AMFI SIP studio ledger, empirical AI strategy simulation tree, SEBI statutory fee blotter.

- [ ] **Step 1: Run baseline E2E test across secondary pages**

Run: `npx playwright test -g "Indian New IPOs Hub|Indian Mutual Funds|AI Strategy Lab|Paper Trading Terminal"`
Expected: PASS

- [ ] **Step 2: Overhaul secondary page card and panel layouts in `styles.css`**

1. `IPODiscoveryPage.tsx`:
   - Replace pill badges with clean status tags (`[OPEN]`, `[UPCOMING]`, `[LISTED]`).
   - Flat cards with 1px borders (`#30363d`).
2. `MutualFundsPage.tsx`:
   - Clean fund cards with expense ratio, AUM, and 3Y CAGR in tabular figures.
   - SIP calculator sliders with clean numeric inputs.
3. `AIStrategyLabPage.tsx`:
   - Remove sci-fi glowing boxes; use institutional research container styling.
   - Monte Carlo fan chart and scenario tree rendered with muted neutral strokes.
4. `PaperTradingPage.tsx`:
   - SEBI statutory ledger itemized in a clean tabular card (`STT`, `Brokerage`, `SEBI`, `GST`, `Stamp Duty`).
   - Order ticket with crisp Buy/Sell toggle and monospace quantity/price inputs.

- [ ] **Step 3: Run complete E2E test suite**

Run: `npx playwright test`
Expected: All 11 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add web/src/pages/IPODiscoveryPage.tsx web/src/pages/MutualFundsPage.tsx web/src/pages/AIStrategyLabPage.tsx web/src/pages/PaperTradingPage.tsx web/src/styles.css
git commit --author="Krish Potanwar <kpotanwar@gmail.com>" -m "feat(views): overhaul IPO, Mutual Funds, AI Lab, and Paper Trading blotter"
```

---

### Task 6: Full Verification, Multi-Viewport Audit & CI Pass

**Files:**
- Modify: `web/audit_browser.mjs` (if viewport adjustments needed)
- Test: Unit tests (`web` and `backend`)
- Test: Playwright E2E (`e2e/marketlens.spec.ts`)
- Test: Multi-viewport audit (`web/audit_browser.mjs`)

**Interfaces:**
- Consumes: Complete redesigned application.
- Produces: 100% green verification artifacts across all viewports and CI.

- [ ] **Step 1: Run frontend unit tests and typecheck**

Run: `npm --prefix web test && npm --prefix web run build`
Expected: 58 unit tests PASS, 0 TypeScript errors, clean bundle.

- [ ] **Step 2: Run backend unit tests, mypy, and ruff**

Run: `python3 -m unittest discover -s backend/tests -p "test_*.py" && cd backend && ruff check . && ruff format --check . && PYTHONPATH=src /opt/anaconda3/bin/mypy src tests`
Expected: 82 tests PASS, ruff clean, mypy clean.

- [ ] **Step 3: Run Playwright E2E test suite**

Run: `npx playwright test`
Expected: 11 tests PASS in < 15s.

- [ ] **Step 4: Run Headless Chromium Multi-Viewport Audit**

Run: `node web/audit_browser.mjs`
Expected: 0 console errors, 0 console warnings, 0 page errors, 0 horizontal overflows across Desktop, Laptop, and Tablet viewports.

- [ ] **Step 5: Commit and push**

```bash
git add .
git commit --author="Krish Potanwar <kpotanwar@gmail.com>" -m "chore(audit): verify complete natural developer redesign across all viewports"
git push origin main
```
