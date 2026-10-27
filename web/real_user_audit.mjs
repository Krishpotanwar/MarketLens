import { chromium } from "playwright";
import fs from "fs";

const BASE_URL = "http://localhost:5173";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runRealUserAudit() {
  const problems = [];

  function recordProblem(category, severity, pageName, viewport, description, details = null) {
    const item = { category, severity, pageName, viewport, description, details };
    problems.push(item);
    console.log(`[PROBLEM FOUND] [${severity.toUpperCase()}] [${pageName} @ ${viewport}]: ${description}`);
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "Desktop (1440x900)", width: 1440, height: 900 },
    { name: "Laptop (1280x800)", width: 1280, height: 800 },
    { name: "Tablet (768x1024)", width: 768, height: 1024 },
    { name: "Mobile (375x812)", width: 375, height: 812 },
  ];

  for (const vp of viewports) {
    console.log(`\n============================================================`);
    console.log(`Simulating Real Human User on Viewport: ${vp.name}`);
    console.log(`============================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    // Listeners for errors and broken requests
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        recordProblem("Console Error", "medium", page.url(), vp.name, msg.text(), { location: msg.location() });
      }
    });

    page.on("pageerror", (err) => {
      recordProblem("Runtime Crash", "critical", page.url(), vp.name, err.message, { stack: err.stack });
    });

    page.on("requestfailed", (req) => {
      recordProblem("Network Failure", "high", page.url(), vp.name, `HTTP request failed: ${req.method()} ${req.url()}`, {
        error: req.failure()?.errorText,
      });
    });

    // Helper: Check horizontal overflow
    async function checkHorizontalOverflow(pageName) {
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        return { hasOverflow: docWidth > winWidth + 1, docWidth, winWidth };
      });
      if (overflow.hasOverflow) {
        recordProblem(
          "Visual Overflow",
          "high",
          pageName,
          vp.name,
          `Horizontal scroll leak detected: document width (${overflow.docWidth}px) exceeds window width (${overflow.winWidth}px)`
        );
      }
    }

    // --- STEP 1: HOME / STOCKS EXPLORER ---
    console.log(`--> [${vp.name}] Visiting Home (Stocks Explorer)...`);
    try {
      await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 15000 });
      await sleep(1000);
      await checkHorizontalOverflow("Stocks Explorer");

      // Verify hero header highlight
      const heroHighlight = await page.$(".hero-explorer-highlight");
      if (!heroHighlight) {
        recordProblem("UI Element Missing", "medium", "Stocks Explorer", vp.name, "Hero .hero-explorer-highlight element was not found in DOM");
      }

      // Check indices pills
      const indices = await page.$$(".index-pill");
      if (indices.length < 5) {
        recordProblem("Data Incomplete", "medium", "Stocks Explorer", vp.name, `Expected at least 5 indices pills, found ${indices.length}`);
      }

      // Real user clicks Refresh Telemetry button
      const syncBtn = await page.$(".live-sync-btn");
      if (syncBtn) {
        await syncBtn.click();
        await sleep(600);
      } else {
        recordProblem("Interactive Control Missing", "high", "Stocks Explorer", vp.name, "Live sync/refresh button missing from telemetry card");
      }

      // Real user searches for a stock
      const searchInput = await page.$(".search-input");
      if (searchInput) {
        await searchInput.fill("Tata");
        await sleep(500);
        await searchInput.fill("XYZABCDEF12345");
        await page.waitForSelector(".empty-table-cell", { timeout: 3000 }).catch(() => null);
        // Verify empty state text appears
        const emptyCell = await page.$(".empty-table-cell");
        if (!emptyCell) {
          recordProblem("Empty State Missing", "low", "Stocks Explorer", vp.name, "Empty state notice not shown when searching nonexistent query");
        }
        // Click clear search button
        const clearBtn = await page.$(".clear-search-btn");
        if (clearBtn) {
          await clearBtn.click();
          await sleep(400);
        } else {
          recordProblem("UX Inconvenience", "low", "Stocks Explorer", vp.name, "Clear search button not rendered during search");
        }
      }

      // Real user tests exchange tabs
      const bseTab = await page.$('button[role="tab"]:has-text("BSE")');
      if (bseTab) {
        await bseTab.click();
        await sleep(400);
      }
      const nseTab = await page.$('button[role="tab"]:has-text("NSE")');
      if (nseTab) {
        await nseTab.click();
        await sleep(400);
      }
      const allExTab = await page.$('button[role="tab"]:has-text("All Exchanges")');
      if (allExTab) {
        await allExTab.click();
        await sleep(400);
      }

      // Real user checks 52-week slider in first table row
      const firstRowTrack = await page.$(".range-track");
      if (firstRowTrack) {
        const fill = await page.$(".range-fill");
        const indicator = await page.$(".range-indicator");
        if (!fill || !indicator) {
          recordProblem("Visual Glitch", "medium", "Stocks Explorer", vp.name, "52-week range track missing fill or indicator thumb in table row");
        }
      }

      // Real user clicks 'Analyze' on first stock row to navigate to Trends
      const firstAnalyzeBtn = await page.$(".btn-stock-trend");
      if (firstAnalyzeBtn) {
        await firstAnalyzeBtn.click();
        await sleep(1000);
      } else {
        recordProblem("Navigation Failure", "high", "Stocks Explorer", vp.name, "No Analyze button found on stock table row");
      }
    } catch (err) {
      recordProblem("Interaction Error", "high", "Stocks Explorer", vp.name, `Failed during Stocks Explorer interaction: ${err.message}`);
    }

    // --- STEP 2: TRENDS & SIGNALS ---
    console.log(`--> [${vp.name}] Testing Trends & Signals...`);
    try {
      await page.goto(`${BASE_URL}`, { waitUntil: "networkidle" });
      const trendsNav = await page.$('a.nav-link:has-text("Trends"), button.nav-link:has-text("Trends")');
      if (trendsNav) {
        await trendsNav.click();
        await sleep(1000);
      }
      await checkHorizontalOverflow("Trends & Signals");

      // Check SVG interactive chart
      const chartSvg = await page.$("svg.trend-chart-svg, svg");
      if (!chartSvg) {
        recordProblem("Visual Element Missing", "high", "Trends & Signals", vp.name, "Interactive stock chart SVG was not found");
      }

      // Click timeframe buttons
      const tfButtons = await page.$$(".timeframe-pill, .tf-btn, button:has-text('1M'), button:has-text('1Y')");
      if (tfButtons.length > 0) {
        await tfButtons[0].click();
        await sleep(300);
      }

      // Search in screener
      const screenerSearch = await page.$(".screener-search-input");
      if (screenerSearch) {
        await screenerSearch.fill("INFY");
        await sleep(400);
      }
    } catch (err) {
      recordProblem("Interaction Error", "high", "Trends & Signals", vp.name, `Failed during Trends interaction: ${err.message}`);
    }

    // --- STEP 3: NEW IPOS ---
    console.log(`--> [${vp.name}] Testing New IPOs...`);
    try {
      const ipoNav = await page.$('a.nav-link:has-text("IPO"), button.nav-link:has-text("IPO")');
      if (ipoNav) {
        await ipoNav.click();
        await sleep(1000);
        await checkHorizontalOverflow("New IPOs");

        // Click IPO category tabs
        const ipoTabs = await page.$$(".ipo-tab-btn, button[role='tab']");
        for (const tab of ipoTabs.slice(0, 3)) {
          await tab.click();
          await sleep(300);
        }
      } else {
        recordProblem("Navigation Failure", "high", "New IPOs", vp.name, "IPO tab navigation link missing from top workstation nav");
      }
    } catch (err) {
      recordProblem("Interaction Error", "high", "New IPOs", vp.name, `Failed during IPOs interaction: ${err.message}`);
    }

    // --- STEP 4: MUTUAL FUNDS ---
    console.log(`--> [${vp.name}] Testing Mutual Funds & SIP Calculator...`);
    try {
      const mfNav = await page.$('a.nav-link:has-text("Mutual"), button.nav-link:has-text("Mutual")');
      if (mfNav) {
        await mfNav.click();
        await sleep(1000);
        await checkHorizontalOverflow("Mutual Funds");

        // Test SIP slider or inputs if present
        const sipInput = await page.$("input[type='range'], input[type='number']");
        if (sipInput) {
          await sipInput.fill("10000");
          await sleep(300);
        }
      } else {
        recordProblem("Navigation Failure", "high", "Mutual Funds", vp.name, "Mutual Funds navigation link missing");
      }
    } catch (err) {
      recordProblem("Interaction Error", "high", "Mutual Funds", vp.name, `Failed during Mutual Funds interaction: ${err.message}`);
    }

    // --- STEP 5: AI STRATEGY LAB ---
    console.log(`--> [${vp.name}] Testing AI Strategy Lab...`);
    try {
      const aiNav = await page.$('a.nav-link:has-text("AI Strategy"), button.nav-link:has-text("AI Strategy")');
      if (aiNav) {
        await aiNav.click();
        await sleep(1000);
        await checkHorizontalOverflow("AI Strategy Lab");

        // Check timeline buttons
        const timelinePills = await page.$$(".timeline-nav-pill, .timeline-btn");
        for (const pill of timelinePills.slice(0, 2)) {
          await pill.click();
          await sleep(300);
        }

        // Check execution bridge button
        const bridgeBtn = await page.$(".trade-executed-pill, .btn-execute-paper, button:has-text('Execute')");
        if (bridgeBtn) {
          await bridgeBtn.click();
          await sleep(500);
        }
      } else {
        recordProblem("Navigation Failure", "high", "AI Strategy Lab", vp.name, "AI Strategy Lab navigation link missing");
      }
    } catch (err) {
      recordProblem("Interaction Error", "high", "AI Strategy Lab", vp.name, `Failed during AI Strategy Lab interaction: ${err.message}`);
    }

    // --- STEP 6: PAPER TRADING ---
    console.log(`--> [${vp.name}] Testing Paper Trading Terminal...`);
    try {
      const paperNav = await page.$('a.nav-link:has-text("Paper Trading"), button.nav-link:has-text("Paper Trading")');
      if (paperNav) {
        await paperNav.click();
        await sleep(1000);
        await checkHorizontalOverflow("Paper Trading");

        // Real user inspects balance card
        const balance = await page.$eval(".capital-metric, .stat-val, .banner-val", (el) => el.textContent).catch(() => null);
        if (!balance) {
          recordProblem("Financial Data Missing", "medium", "Paper Trading", vp.name, "Account virtual capital metric not found on blotter");
        }

        // Real user enters quantity and executes an order
        const qtyInput = await page.$("input[type='number'], .order-qty-input");
        if (qtyInput) {
          await qtyInput.fill("10");
          await sleep(300);
          const submitOrderBtn = await page.$("button[type='submit'], .btn-submit-order, button:has-text('Place Order')");
          if (submitOrderBtn) {
            await submitOrderBtn.click();
            await sleep(600);
          }
        }
      } else {
        recordProblem("Navigation Failure", "high", "Paper Trading", vp.name, "Paper Trading navigation link missing");
      }
    } catch (err) {
      recordProblem("Interaction Error", "high", "Paper Trading", vp.name, `Failed during Paper Trading interaction: ${err.message}`);
    }

    await context.close();
  }

  await browser.close();

  // Save audit results to JSON
  fs.writeFileSync("web/real_user_audit_results.json", JSON.stringify(problems, null, 2));

  console.log(`\n============================================================`);
  console.log(`AUDIT COMPLETE: Found ${problems.length} total problems.`);
  console.log(`Results saved to web/real_user_audit_results.json`);
  console.log(`============================================================`);
  return problems;
}

runRealUserAudit().catch((err) => {
  console.error("FATAL AUDIT ERROR:", err);
  process.exit(1);
});
