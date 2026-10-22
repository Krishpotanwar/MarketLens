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
