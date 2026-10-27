# MarketLens Natural Developer Workstation Redesign Specification

**Date:** 2026-10-27  
**Status:** Approved for Implementation Planning  
**Target:** Frontend redesign (`web/src`)  
**Design Authority:** `taste-skill` v2 (Anti-Slop / `design-taste-frontend`), `impeccable`, and Real Developer Engineering Standards  

---

## 1. Context & Motivation

MarketLens currently suffers from visual clichés common in generic AI-generated prototypes:
- An overused radial dot matrix background grid (`.dot-background`).
- Fluorescent cyan and purple neon glows, heavy colored drop shadows, and oversized pill-shaped controls.
- Uneven spatial hierarchy, where chrome competes with core financial data.

The user and their team have explicitly rejected these AI-generated tropes in favor of an **authentic, natural developer aesthetic** modeled after professional financial workstations (Bloomberg Launchpad, TradingView, Linear, and GitHub Dark).

---

## 2. Design Principles & Anti-Slop Rules

1. **Color Goes on Data, Not Chrome:**
   - Over 95% of the visual surface consists of neutral dark slates and charcoals.
   - Polarity hues (emerald `#3fb950` for gains, crimson `#f85149` for losses) are strictly confined to numerical deltas and change indicators.
   - Primary numbers, stock names, and labels never carry polarity colors.

2. **Total Elimination of Dot Canvas & Neon Glows:**
   - The `.dot-background` grid and all radial-gradient dot patterns are completely removed.
   - All `box-shadow` glows are stripped; surface elevation is represented exclusively through 1-step tone shifts and crisp 1px solid borders.

3. **Utilitarian Tabular Figures:**
   - All numeric financial telemetry (prices, quantities, P&L, timestamps, percentages, volume, and order books) renders in monospace tabular figures (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`) with CSS `font-variant-numeric: tabular-nums`.
   - Numbers align strictly right-justified in tables to allow effortless vertical comparison.

4. **Honest, Unadorned Controls:**
   - Buttons are flat, matte rectangular controls with subtle 1px borders (`#30363d`) and calm hover feedback (`#30363d` background).
   - Navigation tabs use simple text with a crisp 2px solid bottom accent underline (`#388bfd`) flush with the divider rule, replacing rounded bubble pills.

---

## 3. Design Token Architecture (`styles.css`)

```css
:root {
  /* Real Human Engineering Surfaces (Linear / GitHub Dark style) */
  --bg-ground: #0d1117;          /* Calm, flat dark ground (no dot patterns, no glows) */
  --bg-surface: #161b22;         /* 1 tone step up for panels and cards */
  --bg-subtle: #21262d;          /* Inputs, active hovers, search fields */
  --border-default: #30363d;     /* Crisp, razor-thin 1px solid border */
  --border-muted: #21262d;       /* Internal table row dividers */

  /* Honest Typography */
  --text-primary: #e6edf3;       /* Crisp, readable off-white (no blinding #fff glare) */
  --text-secondary: #8b949e;     /* Calm slate-gray for column labels and headers */
  --text-tertiary: #6e7681;      /* Timestamps, ISINs, subtle metadata */

  /* Natural Developer Blue (Used strictly for focus rings & active tab indicator) */
  --accent-blue: #388bfd;        /* Traditional engineer blue (like GitHub / VS Code) */
  --accent-blue-subtle: rgba(56, 139, 253, 0.12);

  /* Realistic Exchange Polarity (Muted, honest numbers — no radioactive neons) */
  --trade-gain: #3fb950;         /* Natural exchange green for positive delta */
  --trade-gain-subtle: #122c1b;  /* Subtle dark tint for gain pill background */
  --trade-loss: #f85149;         /* Natural exchange red for negative delta */
  --trade-loss-subtle: #331518;  /* Subtle dark tint for loss pill background */

  /* Type Families */
  --font-interface: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-figures: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
```

---

## 4. Workstation Shell & Command Bar (`App.tsx`)

### 4.1 Header Command Bar (44px Fixed Height)
The top header provides dense, accessible controls without overwhelming the viewport:
- **Left**: Minimalist wordmark `MarketLens` + compact telemetry pill `● Live (NSE/BSE)`.
- **Center**: Real-time indices strip displaying NIFTY 50 and SENSEX with monospace tabular numbers and subtle polarity indicators.
- **Right**:
  - Global Search Command Trigger: 30px compact button with magnifying glass and `⌘K` keyboard shortcut badge.
  - Virtual Capital Ledger: Monospace available cash indicator (`₹10,00,000`).

### 4.2 Workspace Navigation Sub-Bar (34px Fixed Height)
- Positioned immediately beneath the command bar, anchored on a 1px border rule (`#30363d`).
- Flat text links for all 9 workspace tabs:
  1. `Stocks`
  2. `Trends & Signals`
  3. `New IPOs`
  4. `Mutual Funds`
  5. `AI Strategy Lab`
  6. `Paper Trading`
  7. `Overview`
  8. `Forecast Lab`
  9. `Run Receipt`
- **Active Tab Indicator**: Marked by a solid 2px `#388bfd` line flush on the bottom boundary of the tab bar.

---

## 5. Screen Specifications

### 5.1 Global Search Modal (`GlobalSearchBar.tsx`)
- Command modal styled with `--bg-surface` (`#161b22`) and a crisp `--border-default` (`#30363d`).
- High-density search result rows (40px pitch) with ticker, company name, exchange tag (`NSE`/`BSE`), and live price.
- Quick action buttons on hover: `📈 Trends` (routes to Trends & Signals) and `⚡ Trade` (routes to Paper Trading).

### 5.2 Stocks Explorer (`StocksExplorerPage.tsx`)
- **Table Density**: 36px row height with 1px border dividers (`#21262d`), zero zebra striping.
- **Column Alignment**: Symbol, name, exchange, and sector left-aligned; LTP, Change %, 52W High/Low, and Volume right-aligned in `--font-figures`.
- **Utilitarian Action Controls**: Compact button group with flat 1px borders (`📈 Analyze`, `⚡ Trade`, `🤖 AI`).
- **Pagination & Filters**: Flat buttons with clean active outlines (`BSE Listed`, `NSE Listed`, `Mid Cap`, etc.).

### 5.3 Trends & Signals (`TrendAnalysisPage.tsx`)
- **Screener Sidebar (280px)**: Flat panel with quick search input and clean 32px stock list rows. Active selection highlighted with a subtle `#21262d` background and a 2px left border.
- **Interactive SVG Chart**:
  - Main price line: Clean engineer-blue stroke (`#388bfd`, 1.5px width) with an understated subtle gradient fill (`rgba(56, 139, 253, 0.06)`).
  - Crosshair: 1px dashed hairline following the cursor with zero coordinate jitter.
  - Tooltip: Minimalist slate card (`#161b22`, border `#30363d`) rendering date, price, open, high, low, and volume in tabular figures.
  - Volume Histogram: Flat muted bars (`#21262d` base, directional highlights `#3fb950` / `#f85149`).
  - Timeframe Bar: Compact text buttons (`1D`, `5D`, `1M`, `1Y`) where the selected timeframe has a clean active outline.

### 5.4 New IPOs Hub (`IPODiscoveryPage.tsx`)
- Structured tabular lists and clean cards for Open, Upcoming, and Recently Listed IPOs.
- Clear metadata: Price band, lot size, listing date, GMP, and listing gain.
- Action group on listed IPOs: `📈 Analyze` (Trends), `⚡ Trade` (Paper Trading), `🤖 AI` (AI Strategy Lab).

### 5.5 Mutual Funds & SIP Studio (`MutualFundsPage.tsx`)
- Institutional AMFI telemetry cards with category filters (Equity, Debt, Hybrid, Index).
- Utilitarian SIP wealth calculator with clean numeric input sliders and a transparent breakdown of principal vs expected returns.

### 5.6 AI Strategy Lab (`AIStrategyLabPage.tsx`)
- Replaces generic sci-fi badges with an empirical research terminal layout.
- Clear parameter controls for technical indicators (SMA crossovers, RSI thresholds, volatility bands).
- Multi-scenario branching tree and Monte Carlo distribution fan chart styled in natural engineering neutrals.

### 5.7 Paper Trading Terminal (`PaperTradingPage.tsx`)
- Utilitarian order ticket supporting Market and Limit orders.
- Full Indian statutory fee itemization (STT, Brokerage ₹20 cap, Exchange Turnover, SEBI fees, GST 18%, Stamp Duty).
- Open positions blotter with real-time mark-to-market P&L.

---

## 6. Responsive Viewport Constraints

- **Desktop (1440x900)**: Full-width dual-pane and tabular layouts, 0px horizontal document scroll.
- **Laptop (1280x720)**: Compact spacing, topbar strictly 44px + 34px, 0px horizontal document scroll.
- **Tablet (768x1024)**: Responsive column wrapping, wide data tables housed in dedicated horizontal scroll containers with visible pagination, 0px document overflow.

---

## 7. Verification & Testing Strategy

1. **Frontend Unit Tests**: Run `npm --prefix web test` (vitest) to ensure all 58 component tests pass without regression.
2. **TypeScript & Build**: Run `tsc --noEmit && vite build` to guarantee zero type errors and clean production bundling.
3. **Playwright E2E Tests**: Run `npx playwright test` to verify all 11 end-to-end user journeys pass.
4. **Headless Chromium Multi-Viewport Audit**: Run `node web/audit_browser.mjs` across Desktop (1440x900), Laptop (1280x720), and Tablet (768x1024) to ensure:
   - 0 console errors
   - 0 console warnings
   - 0 page errors
   - 0 document horizontal overflows
   - Proper SVG crosshair and tooltip tracking
5. **Backend Verification**: Confirm all 82 Python unittests, ruff checks, and mypy type checks remain 100% green.
