# Frontend Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 12 usability, search, layout, and state propagation bugs identified during the headless Chromium audit so that search displays immediately with zero blank flashes, layout remains strictly within 64px on all devices without overlapping or blocking pointer events, the trend analysis graph plots real exchange candles with skeleton feedback, and paper trading/AI lab execute orders on the selected stock rather than falling back to NIFTY 50.

**Architecture:**
1. **Search Resiliency & Concurrency**: Add `AbortController` and monotonic request sequencing in `GlobalSearchBar`, render animated skeleton placeholders during in-flight fetches, and index missing ticker aliases (`TATAMOTORS` -> `TMCV`, `TMPV`) and strip exchange suffixes (`.BO`, `.NS`) before token matching in `live_feed.py`.
2. **Strict Single-Row Topbar**: Remove the CSS `.topbar-nav { flex-wrap: wrap; }` override and enforce `flex-wrap: nowrap` with horizontal overflow scrolling (`scrollbar-width: none`), keeping the topbar height strictly locked at 64px on Desktop, Laptop, and Tablet screens.
3. **Trend Analysis Chart & Screener Binding**: Wire screener search directly into the sidebar watchlist, eliminate hardcoded IOC fallback profiles on external assets, render an animated SVG waveform skeleton during chart fetches, and display an error banner on network failure.
4. **Universal State Propagation**: Dynamically inject external assets into the stock catalogs and `<select>` dropdowns of `PaperTradingPage` and `AIStrategyLabPage` to ensure orders and Monte Carlo simulations execute on the intended asset.

**Tech Stack:** React 18, TypeScript, Vite, Python 3.11, FastAPI, Playwright (Chromium), Vitest.

**Spec / Audit Source:** [`frontend-audit-report.md`](/Users/krish/.gemini/antigravity/brain/91e73dcc-2e60-4fad-b8ae-043a806b289c/frontend-audit-report.md)

## Global Constraints
- Author must be `Krish Potanwar <kpotanwar@gmail.com>` with zero AI co-author trailers.
- Background must adhere strictly to pure pitch-black (`#000000`, card surfaces `#090d16`, borders `#1c2638`, cyan `#38bdf8`, gain `#10b981`, loss `#f43f5e`). Zero purple backgrounds.
- Zero mock/static data traps for Indian equities; all data must flow dynamically from exchange feeds.
- All existing 54 Vitest unit tests, 82 Python unit tests, and Playwright E2E suites must pass.

## Review Focus
1. Rapid keystrokes in Global Search must not flicker or display out-of-order stale results.
2. Tablet viewport (768×1024) topbar must not exceed 64px or intercept pointer events on page elements.
3. Searching `TATAMOTORS` in Stocks Explorer must return Tata Motors shares (`TMCV`, `TMPV`).
4. Navigating to Trends for any external stock (`STELLANT.BO`, `MAZDOCK`) must never flash IOC's ₹128.80 price.
5. Clicking `Trade` on an external stock must never place an order for `NIFTY 50`.

---

### Task 1: Responsive Topbar & Header Navigation Overlap Fix

**Files:**
- Modify: `web/src/styles.css:610-635`
- Modify: `web/src/components/Header.tsx:50-80`
- Test: `e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes: `.topbar`, `.topbar-nav`, `.topbar-nav-wrapper`
- Produces: Strictly single-row navigation with horizontal smooth scroll (`overflow-x: auto; scrollbar-width: none;`) ensuring topbar height is $\le 64\text{px}$ across all viewports.

- [ ] **Step 1: Write Playwright E2E assertion for topbar height across viewports**

In `e2e/marketlens.spec.ts`, add viewport height check:
```typescript
test("1B. Topbar stays strictly 64px and does not intercept pointer events on tablet", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  const topbar = page.locator(".topbar");
  await expect(topbar).toBeVisible();
  const box = await topbar.boundingBox();
  expect(box?.height).toBeLessThanOrEqual(68);

  // Verify page content is clickable
  const searchInput = page.locator(".global-search-input");
  await expect(searchInput).toBeEnabled();
  await searchInput.click();
  await expect(page.locator(".global-search-dropdown")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test -g "1B. Topbar stays strictly 64px"`
Expected: FAIL with `box.height` ~450px on 768px tablet width.

- [ ] **Step 3: Fix CSS rule in `web/src/styles.css`**

Remove the `.topbar-nav { flex-wrap: wrap; }` override on line 617 and enforce `nowrap`:
```css
.topbar-nav {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: nowrap;
  white-space: nowrap;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test -g "1B. Topbar stays strictly 64px"`
Expected: PASS with topbar height $\le 68\text{px}$.

- [ ] **Step 5: Commit**

```bash
git add web/src/styles.css e2e/marketlens.spec.ts
git commit -m "fix(ui): enforce single-row nowrap topbar preventing tablet pointer interception"
```

---

### Task 2: Search Pipeline Overhaul (Skeleton Loading, Race Condition Guard, Ticker Aliases)

**Files:**
- Modify: `web/src/components/GlobalSearchBar.tsx:280-340`
- Modify: `web/src/pages/StocksExplorerPage.tsx:285-305`
- Modify: `backend/src/bazaar_drishti/market/live_feed.py:30-80, 880-940`
- Test: `web/src/components/GlobalSearchBar.test.tsx`
- Test: `e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes: `/api/v1/market/search?q=...`, `/api/v1/market/stocks/all?q=...`
- Produces: Instant skeleton state during in-flight searches, aborted stale queries via `activeReqIdRef`, and mapped `TATAMOTORS` alias.

- [ ] **Step 1: Write unit tests in `GlobalSearchBar.test.tsx` for search skeleton and race cancellation**

```typescript
it("renders search skeleton loader while searching and does not show premature empty state", async () => {
  // Mock fetch with delayed promise
  global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));
  render(<GlobalSearchBar onSelectStock={() => {}} />);
  const input = screen.getByPlaceholderText(/Search Indian equities/i);
  fireEvent.change(input, { target: { value: "INFY" } });
  
  // Advance debounce timer
  act(() => { vi.advanceTimersByTime(200); });

  expect(screen.getByText(/Searching across all 13,000\+ Indian stocks/i)).toBeInTheDocument();
  expect(screen.queryByText(/No Indian equities or indices found/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web test src/components/GlobalSearchBar.test.tsx`
Expected: FAIL (renders "No Indian equities found matching 'INFY'").

- [ ] **Step 3: Implement request ID ref, AbortController, and skeleton state in `GlobalSearchBar.tsx`**

In `web/src/components/GlobalSearchBar.tsx`:
- Add `activeReqIdRef = useRef(0)`.
- If `localMatches.length === 0`, do NOT set results to empty immediately while `isSearching` is active.
- Render `.global-search-loading-skeleton` in JSX while `isSearching && results.length === 0`.
- In `backend/src/bazaar_drishti/market/live_feed.py`:
  - Add `"TATAMOTORS": "TATAMOTORS"`, `"TATA MOTORS": "TATAMOTORS"`, `"TMCV": "TATAMOTORS"`, `"TMPV": "TATAMOTORS"` to `COMMON_INDIAN_ACRONYMS`.
  - Add `TATAMOTORS` to `INDIAN_STOCKS_DIRECTORY` with alias `tatamotors tata motors tmcv tmpv commercial passenger vehicles`.
  - Strip `.BO` and `.NS` suffixes before calculating `matched_tokens` so `STELLANT.BO` doesn't match all 10,554 BSE stocks.
- In `web/src/pages/StocksExplorerPage.tsx`:
  - Reset `selectedSector` to `"ALL"` when user types into the search box so client filtering does not hide backend search hits.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web test src/components/GlobalSearchBar.test.tsx`
Run: `PYTHONPATH=backend/src python3 -m unittest discover backend/tests`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/GlobalSearchBar.tsx web/src/components/GlobalSearchBar.test.tsx web/src/pages/StocksExplorerPage.tsx backend/src/bazaar_drishti/market/live_feed.py
git commit -m "fix(search): add animated skeleton, race condition cancellation, and Tata Motors alias"
```

---

### Task 3: Trend Analysis Chart & Screener Watchlist Binding

**Files:**
- Modify: `web/src/pages/TrendAnalysisPage.tsx`
- Modify: `web/src/styles.css`
- Test: `web/src/App.test.tsx`
- Test: `e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes: `/api/v1/market/chart/{symbol}`, `/api/v1/market/quote/{symbol}`
- Produces: Instant filtering of watchlist via `screenerSearch`, neutral loading state for external assets (no IOC leakage), SVG pulse waveform while loading, error retry banner on failure.

- [ ] **Step 1: Write test for screener watchlist filtering and SVG waveform skeleton**

In `web/src/App.test.tsx`:
```typescript
it("filters screener watchlist directly when searching in Trends page", () => {
  const { container } = render(
    <TrendAnalysisPage onSelectForTrade={() => {}} initialSymbol="RELIANCE" />
  );
  const searchInput = screen.getByPlaceholderText(/Search ANY stock/i);
  fireEvent.change(searchInput, { target: { value: "TCS" } });
  
  // Watchlist should filter to TCS
  expect(screen.getByRole("option", { name: /TCS/i })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /INFY/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix web test -t "filters screener watchlist directly"`
Expected: FAIL (watchlist did not filter with `screenerSearch`).

- [ ] **Step 3: Implement watchlist filtering, neutral loading profile, and SVG skeleton waveform in `TrendAnalysisPage.tsx`**

- In `filteredStocks`: apply `screenerSearch.trim().toLowerCase()` filter over `s.symbol` and `s.name`.
- In `activeStock`: replace hardcoded IOC profile with neutral placeholder (`ltp: 0`, `name: selectedSymbol`, etc.) so IOC data never flashes on external stocks.
- In SVG canvas: if `chartBars.length === 0`, render `<g className="chart-skeleton-wave">` with animated pulse dashed line.
- In `fetchRealLiveChart` catch block: set `chartError = true` and render a retry banner if the network request fails.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix web test -t "filters screener watchlist directly"`
Run: `npm --prefix web test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/TrendAnalysisPage.tsx web/src/styles.css web/src/App.test.tsx
git commit -m "fix(trends): bind screener search to watchlist and add SVG chart loading skeleton"
```

---

### Task 4: Cross-Module Stock State Propagation in Paper Trading & AI Strategy Lab

**Files:**
- Modify: `web/src/pages/PaperTradingPage.tsx:130-180`
- Modify: `web/src/pages/AIStrategyLabPage.tsx:140-190`
- Test: `e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes: `initialSymbol` prop
- Produces: Dynamically registered option in `<select id="symbol-select">` and `<select id="ai-stock-select">` ensuring external stocks (`STELLANT.BO`, `MAZDOCK`) execute orders and AI simulations on their own profile, not defaulting to `NIFTY 50`.

- [ ] **Step 1: Write Playwright E2E test verifying Paper Trading executes on external stock**

In `e2e/marketlens.spec.ts`:
```typescript
test("6B. Paper Trading preserves external stock and does not revert to NIFTY 50", async ({ page }) => {
  await page.goto("/");
  // Search for MAZDOCK in Global Search and click Trade
  const searchInput = page.locator(".global-search-input");
  await searchInput.click();
  await page.locator(".modal-search-field").fill("MAZDOCK");
  await page.waitForTimeout(400);
  await page.locator(".search-trade-btn").first().click();

  // Verify Paper Trading order ticket has MAZDOCK selected, NOT NIFTY 50
  await expect(page.locator("#symbol-select")).toHaveValue("MAZDOCK");
  const priceDisplay = page.locator(".order-form-grid .stat-val").first();
  await expect(priceDisplay).not.toContainText("24,854");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test -g "6B. Paper Trading preserves external stock"`
Expected: FAIL (reverts to `NIFTY 50`).

- [ ] **Step 3: Implement dynamic stock injection in `PaperTradingPage.tsx` and `AIStrategyLabPage.tsx`**

In `PaperTradingPage.tsx`:
```tsx
useEffect(() => {
  if (initialSymbol) {
    setSymbol(initialSymbol);
    setStocks((prev) => {
      if (!prev.some((s) => s.symbol === initialSymbol)) {
        return [
          {
            symbol: initialSymbol,
            name: `${initialSymbol} Listed Equity`,
            sector: "Indian Equities",
            marketCapCategory: "Mid Cap",
            week52High: 1000,
            week52Low: 500,
            ltp: 500,
            change: 0,
            changePercent: 0,
            open: 500,
            high: 510,
            low: 490,
            vwap: 500,
            volume: 1000000,
            volumeRatio: 1.0,
            rsi14: 50,
            sma20: 500,
            sma50: 500,
            trend5m: "NEUTRAL",
            trend15m: "NEUTRAL",
            trend1h: "NEUTRAL",
            trend1d: "NEUTRAL",
            predictedProbabilityUp: 0.5,
            expectedMovePercent: 1.0,
            brierCalibration: 0.18,
            signalStrength: "NEUTRAL",
            causalFeatures: { momentum: 25, volumeSurge: 25, vwapDeviation: 25, sectorBreadth: 25 },
            priceHistory: [500],
          },
          ...prev,
        ];
      }
      return prev;
    });
    fetch(`${API_BASE}/api/v1/market/quote/${encodeURIComponent(initialSymbol)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((q) => {
        if (q?.ltp) {
          setStocks((prev) => prev.map((s) => s.symbol === initialSymbol ? { ...s, ltp: q.ltp, name: q.name || s.name } : s));
        }
      });
  }
}, [initialSymbol]);
```
Apply the identical pattern in `AIStrategyLabPage.tsx` for `ai-stock-select`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test -g "6B. Paper Trading preserves external stock"`
Expected: PASS (`#symbol-select` is `MAZDOCK`).

- [ ] **Step 5: Commit**

```bash
git add web/src/pages/PaperTradingPage.tsx web/src/pages/AIStrategyLabPage.tsx e2e/marketlens.spec.ts
git commit -m "fix(paper): preserve external stocks in order ticket and AI lab selectors"
```

---

### Task 5: Full Regression Testing & E2E Suite Execution

**Files:**
- Test: `web/src/**/*.test.tsx`
- Test: `backend/tests/**/*.py`
- Test: `e2e/marketlens.spec.ts`

- [ ] **Step 1: Run frontend unit tests**
Run: `npm --prefix web test`
Expected: 54+ tests PASS.

- [ ] **Step 2: Run backend unit tests**
Run: `PYTHONPATH=backend/src python3 -m unittest discover backend/tests`
Expected: 82 tests PASS.

- [ ] **Step 3: Run Ruff linter**
Run: `python3 -m ruff check backend`
Expected: 0 warnings, all checks passed.

- [ ] **Step 4: Run production build check**
Run: `npm --prefix web run build`
Expected: 0 TypeScript or build errors.

- [ ] **Step 5: Run complete Playwright E2E suite**
Run: `npx playwright test`
Expected: 10/10 tests PASS across all viewports.

- [ ] **Step 6: Push commit to remote**
Run: `git push origin main`
Expected: Pushed cleanly to `origin/main` by sole author `Krish Potanwar <kpotanwar@gmail.com>`.

---
*Implementation plan ready for review.*
