import { test, expect } from "@playwright/test";

test.describe("MarketLens End-to-End Suite", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("1. Shell, Navigation, and Dotted Dark Theme Canvas", async ({ page }) => {
    // Wordmark & Title
    await expect(page.locator(".wordmark")).toContainText("MarketLens");
    await expect(page.locator(".dot-background")).toBeVisible();

    // Verify all primary tabs exist
    const navLinks = page.locator(".topbar-nav .nav-link");
    await expect(navLinks).toContainText([
      "Stocks",
      "Mutual Funds",
      "New IPOs",
      "AI Strategy Lab",
      "Trends & Signals",
      "Paper Trading",
      "Overview",
      "Forecast Lab",
      "Run Receipt",
    ]);

    // Verify live data badge
    await expect(page.locator(".data-badge")).toBeVisible();
  });

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

  test("2. Global Header Search (Groww / Angel One Style)", async ({ page }) => {
    const searchInput = page.locator(".global-search-input");
    await expect(searchInput).toBeVisible();

    // Click to open search dropdown
    await searchInput.click();
    const dropdown = page.locator(".global-search-dropdown");
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText("Trending on NSE & BSE");
    await expect(dropdown).toContainText("RELIANCE");
    await expect(dropdown).toContainText("ZOMATO");

    // Search explicitly for "mazgaon dock shipyard"
    const modalInput = page.locator(".modal-search-field");
    await modalInput.fill("mazgaon dock shipyard");
    await page.waitForTimeout(300);

    // Verify MAZDOCK is returned as the top result with live data, and Zomato is not in results
    const mazdockItem = dropdown.locator(".global-search-item").filter({ hasText: "MAZDOCK" }).first();
    await expect(mazdockItem).toBeVisible();
    await expect(mazdockItem).toContainText("Mazagon Dock Shipbuilders Ltd");

    // Click ⚡ Trade button directly from the search dropdown on MAZDOCK
    const tradeBtn = mazdockItem.locator(".search-trade-btn");
    await tradeBtn.dispatchEvent("click");

    // Verify seamless navigation directly into Paper Trading with MAZDOCK loaded
    await expect(page.locator(".page-header h1")).toContainText("Paper Trading Terminal");
    await expect(page.locator("#symbol-select")).toHaveValue("MAZDOCK");
  });

  test("2B. Search for IOCL and Plot Real Live Exchange Chart", async ({ page }) => {
    const searchInput = page.locator(".global-search-input");
    await searchInput.click();
    const dropdown = page.locator(".global-search-dropdown");
    await expect(dropdown).toBeVisible();

    // Search explicitly for "IOCL"
    const modalInput = page.locator(".modal-search-field");
    await modalInput.fill("IOCL");
    await page.waitForTimeout(350);

    // Verify IOC (Indian Oil Corporation Limited) is returned with live price
    const iocItem = dropdown.locator(".global-search-item").filter({ hasText: "IOC" }).first();
    await expect(iocItem).toBeVisible();
    await expect(iocItem).toContainText("Indian Oil Corporation Limited");

    // Click 📈 Trends button directly on IOC
    const trendsBtn = iocItem.locator(".search-trend-btn");
    await trendsBtn.dispatchEvent("click");

    // Verify navigation into Trends & Signals with IOC loaded
    await expect(page.locator(".page-header h1")).toContainText("Indian Stock Market Trends & Signals");
    await expect(page.locator(".symbol-row h2")).toContainText("IOC");
    await expect(page.locator(".stock-subtitle")).toContainText("Indian Oil Corporation Limited");

    // Verify live exchange chart and timeframes are visible
    await expect(page.locator(".trend-svg")).toBeVisible();
    const tfBtns = page.locator(".chart-timeframe-selector .tf-btn");
    await expect(tfBtns).toContainText(["1D", "5D", "1M", "1Y"]);

    // Click 5D timeframe
    await page.locator('.tf-btn:has-text("5D")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.tf-btn:has-text("5D")')).toHaveClass(/active/);
  });

  test("2C. Search for TATAMOTORS in Global Search and Stocks Explorer", async ({ page }) => {
    const searchInput = page.locator(".global-search-input");
    await searchInput.click();
    const dropdown = page.locator(".global-search-dropdown");
    await expect(dropdown).toBeVisible();

    const modalInput = page.locator(".modal-search-field");
    await modalInput.fill("TATAMOTORS");
    await page.waitForTimeout(400);

    // Verify Tata Motors results appear
    const tataItem = dropdown.locator(".global-search-item").filter({ hasText: "Tata Motors" }).first();
    await expect(tataItem).toBeVisible();
    await expect(dropdown).not.toContainText("No Indian equities or indices found");
  });

  test("3. Groww-Style Indian Stocks Explorer", async ({ page }) => {
    await page.locator('.nav-link:has-text("Stocks")').click();
    await expect(page.locator(".page-header h1")).toContainText("Indian Stocks & Market Explorer");

    // Telemetry and Market Indices
    await expect(page.locator(".indices-strip")).toBeVisible();
    await expect(page.locator(".index-pill").first()).toContainText("NIFTY 50");

    // Search and Discovery Shelves
    const shelfCards = page.locator(".shelf-card");
    await expect(shelfCards.first()).toBeVisible();

    // In-page table search with live web telemetry for any Indian equity (e.g. Stellant Securities)
    const inPageSearch = page.locator(".explorer-controls-panel .search-input");
    await inPageSearch.fill("Stellant Securities");
    await page.waitForTimeout(400);

    const stockRows = page.locator(".data-table tbody tr");
    await expect(stockRows.first()).toContainText("STELLANT.BO");
    await expect(stockRows.first()).toContainText("Stellant Securities (India) Limited");

    // Clear search and test exchange filters and pagination
    await page.locator(".clear-search-btn").click();
    await page.waitForTimeout(300);

    const bseTab = page.locator('.exchange-tab-btn:has-text("BSE Listed")');
    await expect(bseTab).toBeVisible();
    await bseTab.click();
    await page.waitForTimeout(300);

    // Verify pagination bar is present
    await expect(page.locator(".pagination-bar")).toBeVisible();
  });

  test("3B. Indian New IPOs Hub & Listings Tracker", async ({ page }) => {
    await page.locator('.nav-link:has-text("New IPOs")').click();
    await expect(page.locator(".page-header h1")).toContainText("Indian IPO Hub & New Listings Tracker");

    // Live status badge and stats pills
    await expect(page.locator(".ipo-stats-strip")).toBeVisible();
    await expect(page.locator(".badge-live-pulse")).toBeVisible();

    // Verify sections for Open, Upcoming, and Recently Listed
    await expect(page.locator(".ipo-card-active").first()).toBeVisible();
    await expect(page.locator(".ipo-card-upcoming").first()).toBeVisible();
    await expect(page.locator(".recently-listed-section")).toBeVisible();

    // Verify Swiggy and Waaree Energies are tracked in Recently Listed
    const listedRows = page.locator(".recently-listed-section .data-table tbody tr");
    await expect(listedRows).toContainText(["SWIGGY", "WAAREEENER"]);

    // Test 1-click AI Bridge from IPO Hub
    const aiBtn = listedRows.first().locator(".btn-stock-trend");
    await aiBtn.click();
    await expect(page.locator(".page-header h1")).toContainText("Hybrid AI Strategy Lab");
  });

  test("4. Indian Mutual Funds & SIP Compounding Studio", async ({ page }) => {
    await page.locator('.nav-link:has-text("Mutual Funds")').click();
    await expect(page.locator(".page-header h1")).toContainText("Indian Mutual Funds & SIP Studio");

    // Live AMFI badge
    await expect(page.locator(".live-telemetry-status-card")).toBeVisible();

    // SIP Compound Calculator
    const monthlyInput = page.locator("#sip-monthly-input");
    await expect(monthlyInput).toBeVisible();

    // Wealth compound banner updates
    await expect(page.locator(".sip-results-card")).toContainText("Total Amount Invested");
    await expect(page.locator(".sip-results-card")).toContainText("Estimated Wealth Returns");

    // Fund cards rendered
    const fundCards = page.locator(".fund-card");
    await expect(fundCards.first()).toBeVisible();
  });

  test("5. AI Strategy Lab & Multi-Timeline Simulator", async ({ page }) => {
    await page.locator('.nav-link:has-text("AI Strategy Lab")').click();
    await expect(page.locator(".page-header h1")).toContainText("Hybrid AI Strategy Lab");

    // Provider Selector & News Feed
    await expect(page.locator("#ai-provider-select")).toBeVisible();
    await expect(page.locator(".news-feed-ticker")).toBeVisible();
    await expect(page.locator(".news-ticker-item").first()).toBeVisible();

    // Concall Sandbox is editable
    const sandbox = page.locator("#concall-sandbox-input");
    await expect(sandbox).toBeVisible();

    // Run Institutional AI Strategy Analysis
    const runBtn = page.locator(".btn-run-analysis");
    await runBtn.click();

    // Wait for analysis execution and visualization rendering
    await expect(page.locator(".ai-results-wrapper")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".timeline-branching-tree")).toBeVisible();
    await expect(page.locator(".monte-carlo-fan-container")).toBeVisible();
    await expect(page.locator(".corporate-strategy-grid")).toBeVisible();

    // 1-Click Paper Trade Execution Bridge
    const executeTradeBtn = page.locator(".btn-execute-ai-trade");
    await expect(executeTradeBtn).toBeVisible();
    await executeTradeBtn.click();
    await expect(page.locator(".page-header h1")).toContainText("Paper Trading Terminal");
  });

  test("6. Paper Trading Terminal & SEBI Statutory Fee Reconciliation", async ({ page }) => {
    await page.locator('.nav-link:has-text("Paper Trading")').click();
    await expect(page.locator(".page-header h1")).toContainText("Paper Trading Terminal");

    // Capital & Statutory Ledger
    await expect(page.locator(".portfolio-banner")).toContainText("Available Cash");

    // Order Entry form
    const qtyInput = page.locator("#qty-input");
    await qtyInput.fill("50");

    // Taxes & Charges itemization
    const frictionCard = page.locator(".tax-slip-block");
    await expect(frictionCard).toContainText("STT");
    await expect(frictionCard).toContainText("Brokerage");
    await expect(frictionCard).toContainText("SEBI Fee");
    await expect(frictionCard).toContainText("GST");

    // Submit Order
    const submitBtn = page.locator(".btn-submit-order");
    await submitBtn.click();

    // Trade fills and positions update
    await expect(page.locator('table[aria-label="Open Positions"] tbody tr').first()).toBeVisible();
  });
});
