import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5173";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAudit() {
  const auditResults = {
    viewportsAudited: [],
    consoleErrors: [],
    consoleWarns: [],
    pageErrors: [],
    failedRequests: [],
    networkTimings: [],
    searchTests: {},
    stocksExplorerTests: {},
    trendsPageTests: {},
    navigationTests: {},
    uiOverlaps: [],
    layoutGlitches: [],
  };

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: "Desktop 1440x900", width: 1440, height: 900 },
    { name: "Laptop 1280x720", width: 1280, height: 720 },
    { name: "Tablet 768x1024", width: 768, height: 1024 },
  ];

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`Starting Audit on Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);
    auditResults.viewportsAudited.push(vp.name);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    // Listeners
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      if (type === "error") {
        auditResults.consoleErrors.push({ vp: vp.name, text, location });
        console.error(`[Console ERROR] [${vp.name}] ${text}`);
      } else if (type === "warning" || type === "warn") {
        auditResults.consoleWarns.push({ vp: vp.name, text, location });
        console.warn(`[Console WARN] [${vp.name}] ${text}`);
      }
    });

    page.on("pageerror", (err) => {
      auditResults.pageErrors.push({ vp: vp.name, message: err.message, stack: err.stack });
      console.error(`[PAGE UNHANDLED EXCEPTION] [${vp.name}] ${err.message}`);
    });

    page.on("requestfailed", (req) => {
      const failure = req.failure();
      const item = {
        vp: vp.name,
        url: req.url(),
        method: req.method(),
        errorText: failure ? failure.errorText : "unknown",
      };
      auditResults.failedRequests.push(item);
      console.error(`[REQUEST FAILED] [${vp.name}] ${req.method()} ${req.url()} - ${item.errorText}`);
    });

    // Track request timings
    const requestStarts = new Map();
    page.on("request", (req) => {
      if (req.url().includes("/api/")) {
        requestStarts.set(req.url(), Date.now());
      }
    });
    page.on("response", (res) => {
      if (res.url().includes("/api/")) {
        const start = requestStarts.get(res.url());
        const duration = start ? Date.now() - start : null;
        auditResults.networkTimings.push({
          vp: vp.name,
          url: res.url(),
          status: res.status(),
          durationMs: duration,
        });
      }
    });

    // 1. Initial Page Load
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await sleep(1000);

    // Check Header bounding box and navigation pills
    console.log(`Inspecting Header layout in ${vp.name}...`);
    const headerInspection = await page.evaluate(() => {
      const topbar = document.querySelector(".topbar");
      const left = document.querySelector(".topbar-left");
      const center = document.querySelector(".topbar-center");
      const navWrap = document.querySelector(".topbar-nav-wrapper");
      const nav = document.querySelector(".topbar-nav");
      const right = document.querySelector(".topbar-right");

      const topbarRect = topbar?.getBoundingClientRect();
      const leftRect = left?.getBoundingClientRect();
      const centerRect = center?.getBoundingClientRect();
      const navWrapRect = navWrap?.getBoundingClientRect();
      const rightRect = right?.getBoundingClientRect();

      const navButtons = Array.from(document.querySelectorAll(".topbar-nav .nav-link")).map((b) => {
        const r = b.getBoundingClientRect();
        return { text: b.textContent?.trim(), rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height } };
      });

      // Detect wrap in navButtons
      const rows = [];
      let currentRowTop = null;
      let currentRow = [];
      navButtons.forEach((nb) => {
        if (currentRowTop === null || Math.abs(nb.rect.top - currentRowTop) > 4) {
          if (currentRow.length > 0) rows.push(currentRow);
          currentRow = [nb.text];
          currentRowTop = nb.rect.top;
        } else {
          currentRow.push(nb.text);
        }
      });
      if (currentRow.length > 0) rows.push(currentRow);

      // Check overlaps
      const overlaps = [];
      const blocks = [
        { name: "left", rect: leftRect },
        { name: "center", rect: centerRect },
        { name: "navWrap", rect: navWrapRect },
        { name: "right", rect: rightRect },
      ].filter((b) => b.rect && b.rect.width > 0);

      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
          const a = blocks[i].rect;
          const b = blocks[j].rect;
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
            overlaps.push({ a: blocks[i].name, b: blocks[j].name, aRect: a, bRect: b });
          }
        }
      }

      return {
        topbarHeight: topbarRect?.height,
        navWrapHeight: navWrapRect?.height,
        navRowsCount: rows.length,
        navRows: rows,
        overlaps,
        topbarRect,
        centerRect,
      };
    });

    console.log(`Header layout (${vp.name}): Topbar height=${headerInspection.topbarHeight}px, Nav rows count=${headerInspection.navRowsCount}`);
    if (headerInspection.navRowsCount > 1) {
      console.warn(`[UI GLITCH] Header navigation wrapped into ${headerInspection.navRowsCount} rows in ${vp.name}:`, headerInspection.navRows);
      auditResults.layoutGlitches.push({
        vp: vp.name,
        component: "Header Navigation",
        issue: `Nav links wrap into ${headerInspection.navRowsCount} vertical rows`,
        rows: headerInspection.navRows,
        topbarHeight: headerInspection.topbarHeight,
      });
    }
    if (headerInspection.overlaps.length > 0) {
      console.warn(`[UI OVERLAP] Header block overlap in ${vp.name}:`, headerInspection.overlaps);
      auditResults.uiOverlaps.push({ vp: vp.name, component: "Header Blocks", overlaps: headerInspection.overlaps });
    }

    // 2. Header Global Search Bar Testing
    console.log(`\n--- Auditing Header Global Search Bar (${vp.name}) ---`);
    const searchQueriesToTest = ["IOCL", "IOC", "ZOMATO", "MAZDOCK", "TATAMOTORS"];

    for (const query of searchQueriesToTest) {
      console.log(`Testing Global Search for: "${query}"...`);
      // Click global search input
      await page.click(".global-search-input");
      await sleep(300);

      // Verify modal is open
      const modalExists = await page.$(".global-search-backdrop");
      if (!modalExists) {
        console.error(`[SEARCH BUG] Search modal backdrop failed to open for "${query}"!`);
      }

      // Check modal bounding box and viewport clipping
      const modalClip = await page.evaluate(() => {
        const modal = document.querySelector(".global-search-modal");
        if (!modal) return null;
        const r = modal.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
          windowW: window.innerWidth,
          windowH: window.innerHeight,
          clipsRight: r.right > window.innerWidth,
          clipsBottom: r.bottom > window.innerHeight,
        };
      });

      if (modalClip && (modalClip.clipsRight || modalClip.clipsBottom)) {
        console.warn(`[UI CLIPPING] Search modal clips viewport in ${vp.name}:`, modalClip);
        auditResults.uiOverlaps.push({ vp: vp.name, component: "Search Modal", issue: "Clips viewport boundary", modalClip });
      }

      // Type query into modal search input
      const modalInput = await page.$(".modal-search-field");
      if (modalInput) {
        await modalInput.fill("");
        // Measure time until results render
        const typeStart = Date.now();
        await modalInput.fill(query);

        // Wait up to 5 seconds for results to populate
        let count = 0;
        let emptyMsg = null;
        let renderedItems = [];

        for (let attempt = 0; attempt < 25; attempt++) {
          await sleep(200);
          const state = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll(".global-search-item"));
            const empty = document.querySelector(".global-search-empty");
            const loading = document.querySelector(".global-search-loading");
            return {
              count: items.length,
              emptyText: empty ? empty.textContent?.trim() : null,
              isLoading: !!loading,
              firstFew: items.slice(0, 3).map((it) => ({
                sym: it.querySelector(".global-search-item-symbol")?.textContent?.trim(),
                name: it.querySelector(".global-search-item-name")?.textContent?.trim(),
                price: it.querySelector(".global-search-item-price")?.textContent?.trim(),
              })),
            };
          });

          if (!state.isLoading && (state.count > 0 || state.emptyText)) {
            count = state.count;
            emptyMsg = state.emptyText;
            renderedItems = state.firstFew;
            break;
          }
        }

        const elapsedMs = Date.now() - typeStart;
        console.log(`Global Search result for "${query}" (elapsed: ${elapsedMs}ms): count=${count}, empty="${emptyMsg || "none"}"`);
        if (renderedItems.length > 0) {
          console.log(`  Top hits:`, renderedItems.map((h) => `${h.sym} - ${h.name} (${h.price})`));
        }

        auditResults.searchTests[`${vp.name}_${query}`] = {
          query,
          count,
          emptyMsg,
          elapsedMs,
          topHits: renderedItems,
        };

        if (count === 0) {
          console.error(`[SEARCH DEFECT] Global Search returned EMPTY for "${query}"! Message: "${emptyMsg}"`);
        }
      }

      // Close modal by pressing Escape
      await page.keyboard.press("Escape");
      await sleep(300);
    }

    // 3. Stocks Explorer Page Testing
    console.log(`\n--- Auditing Stocks Explorer Page (${vp.name}) ---`);
    // Click Stocks nav link
    await page.click('.topbar-nav .nav-link:text-is("Stocks")');
    await sleep(1000);

    const stocksExplorerQueries = ["IOCL", "IOC", "mazgaon", "stellant", "TATAMOTORS"];
    for (const q of stocksExplorerQueries) {
      console.log(`Testing Stocks Explorer search for: "${q}"...`);
      const searchBox = await page.$('.explorer-controls-panel .search-input');
      if (searchBox) {
        await searchBox.fill("");
        await sleep(200);
        const searchStart = Date.now();
        await searchBox.fill(q);

        // Wait up to 5 seconds for catalog to update
        let rowCount = 0;
        let emptyText = null;
        let firstRow = null;
        let hasSpinner = false;

        for (let attempt = 0; attempt < 25; attempt++) {
          await sleep(200);
          const state = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll(".stocks-table-section tbody tr"));
            const emptyCell = document.querySelector(".empty-table-cell");
            const spinner = document.querySelector(".search-live-status-pill");
            return {
              rowCount: rows.length,
              emptyText: emptyCell ? emptyCell.textContent?.trim() : null,
              firstRow: rows[0] ? rows[0].textContent?.replace(/\s+/g, " ").trim() : null,
              hasSpinner: !!spinner,
            };
          });

          if (!state.hasSpinner && (state.rowCount > 0 || state.emptyText)) {
            rowCount = state.rowCount;
            emptyText = state.emptyText;
            firstRow = state.firstRow;
            hasSpinner = state.hasSpinner;
            break;
          }
        }

        const elapsedMs = Date.now() - searchStart;
        console.log(`Stocks Explorer "${q}" (elapsed: ${elapsedMs}ms): rows=${rowCount}, emptyText="${emptyText || "none"}"`);
        if (firstRow) {
          console.log(`  First row: ${firstRow.slice(0, 80)}...`);
        }

        auditResults.stocksExplorerTests[`${vp.name}_${q}`] = {
          query: q,
          rowCount,
          emptyText,
          firstRow,
          elapsedMs,
        };

        if (rowCount === 1 && emptyText) {
          console.warn(`[STOCKS EXPLORER NO RESULTS] Table empty for query "${q}": "${emptyText}"`);
        }
      }
    }

    // Clear search on Stocks Explorer
    const clearBtn = await page.$(".clear-search-btn");
    if (clearBtn) {
      await clearBtn.click();
      await sleep(1000);
    }

    // Check Table layout and horizontal overflow
    const tableOverflow = await page.evaluate(() => {
      const tableWrapper = document.querySelector(".table-wrapper");
      const table = document.querySelector(".data-table");
      const pagination = document.querySelector(".pagination-bar");
      if (!tableWrapper || !table) return null;
      return {
        wrapperW: tableWrapper.clientWidth,
        tableW: table.scrollWidth,
        hasHorizontalScroll: table.scrollWidth > tableWrapper.clientWidth,
        paginationW: pagination ? pagination.clientWidth : null,
      };
    });
    console.log(`Stocks Table overflow check (${vp.name}):`, tableOverflow);
    if (tableOverflow?.hasHorizontalScroll) {
      console.log(`Table has scroll container (expected for wide tabular data on smaller viewports)`);
    }

    // Test clicking "Analyze" button on a stock row
    console.log(`Testing "Analyze" action on a stock row...`);
    const analyzeBtn = await page.$(".btn-stock-trend");
    if (analyzeBtn) {
      // Get the stock symbol in that row
      const stockRowSym = await page.$eval(".stocks-table-section tbody tr:first-child .table-symbol", (el) => el.textContent?.trim()).catch(() => "unknown");
      console.log(`Clicking "Analyze" for first stock: ${stockRowSym}...`);
      await analyzeBtn.click();
      await sleep(1500);

      // Check which tab became active
      const activeTab = await page.$eval(".topbar-nav .nav-link.active", (el) => el.textContent?.trim()).catch(() => "none");
      // Check active stock in Trends page
      const trendStockTitle = await page.$eval(".symbol-row h2", (el) => el.textContent?.trim()).catch(() => "none");
      console.log(`After clicking Analyze: activeTab="${activeTab}", Trends page stock="${trendStockTitle}"`);

      if (trendStockTitle !== stockRowSym) {
        console.error(`[TREND NAVIGATION BUG] Expected Trend page to load "${stockRowSym}", but loaded "${trendStockTitle}"!`);
        auditResults.layoutGlitches.push({
          vp: vp.name,
          component: "Stocks to Trends Navigation",
          expectedStock: stockRowSym,
          actualStock: trendStockTitle,
        });
      }
    }

    // 4. Auditing Trend Analysis Page Deeply
    console.log(`\n--- Auditing Trend Analysis Page (${vp.name}) ---`);
    // Ensure we are on Trends tab
    await page.click('.topbar-nav .nav-link:text-is("Trends & Signals")');
    await sleep(1000);

    // Test Screener Search inside Trends page
    console.log(`Testing Screener search on Trends page...`);
    const screenerInput = await page.$(".screener-search-input");
    if (screenerInput) {
      for (const sq of ["IOCL", "IOC", "ZOMATO", "MAZDOCK"]) {
        await screenerInput.fill("");
        await screenerInput.fill(sq);
        await sleep(800); // allow API call

        const screenerRes = await page.evaluate((searchTerm) => {
          const dropdown = document.querySelector(".screener-search-dropdown");
          const results = Array.from(document.querySelectorAll(".screener-search-result-btn"));
          const rows = Array.from(document.querySelectorAll(".screener-row"));
          return {
            query: searchTerm,
            hasDropdown: !!dropdown,
            resultCount: results.length,
            screenerRowsCount: rows.length,
            items: results.length > 0
              ? results.map((r) => r.textContent?.replace(/\s+/g, " ").trim())
              : rows.map((r) => r.textContent?.replace(/\s+/g, " ").trim()),
          };
        }, sq);

        console.log(`Trend Screener "${sq}": dropdown=${screenerRes.hasDropdown}, results count=${screenerRes.resultCount}, watchlist rows=${screenerRes.screenerRowsCount}`);
        if (screenerRes.items.length > 0) {
          console.log(`  Results:`, screenerRes.items.slice(0, 3));
        } else {
          console.warn(`[TREND SCREENER EMPTY] No results for screener search "${sq}"`);
        }
        auditResults.trendsPageTests[`${vp.name}_screener_${sq}`] = screenerRes;
      }

      // Test clicking a search result in screener dropdown
      console.log(`Clicking search result in Trend screener...`);
      const firstResultBtn = await page.$(".screener-search-result-btn");
      if (firstResultBtn) {
        const btnText = await firstResultBtn.textContent();
        console.log(`Clicking screener result: "${btnText?.trim().slice(0, 40)}"`);
        await firstResultBtn.click();
        await sleep(1500);

        const currentActive = await page.$eval(".symbol-row h2", (el) => el.textContent?.trim()).catch(() => "none");
        console.log(`Active stock title after screener click: "${currentActive}"`);
      }
    }

    // Inspect Chart Controls & UI Overlap in Trends
    console.log(`Inspecting Trend Chart controls layout in ${vp.name}...`);
    const trendControlsLayout = await page.evaluate(() => {
      const chartHeader = document.querySelector(".chart-header");
      const titleGroup = document.querySelector(".chart-title-group");
      const tfSelector = document.querySelector(".chart-timeframe-selector");
      const legend = document.querySelector(".chart-legend");
      const tfBtns = Array.from(document.querySelectorAll(".tf-btn"));
      const svg = document.querySelector(".trend-svg");

      const headerRect = chartHeader?.getBoundingClientRect();
      const titleRect = titleGroup?.getBoundingClientRect();
      const tfRect = tfSelector?.getBoundingClientRect();
      const legendRect = legend?.getBoundingClientRect();
      const svgRect = svg?.getBoundingClientRect();

      // Check overlap between titleGroup, tfSelector, and legend
      const overlaps = [];
      const parts = [
        { name: "titleGroup", r: titleRect },
        { name: "tfSelector", r: tfRect },
        { name: "legend", r: legendRect },
      ].filter((p) => p.r && p.r.width > 0);

      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const a = parts[i].r;
          const b = parts[j].r;
          if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) {
            overlaps.push({ a: parts[i].name, b: parts[j].name, aRect: a, bRect: b });
          }
        }
      }

      return {
        headerH: headerRect?.height,
        tfBtnCount: tfBtns.length,
        hasSvg: !!svg,
        svgRect,
        overlaps,
      };
    });

    console.log(`Trend Chart layout (${vp.name}): headerH=${trendControlsLayout.headerH}px, hasSvg=${trendControlsLayout.hasSvg}`);
    if (trendControlsLayout.overlaps.length > 0) {
      console.warn(`[UI OVERLAP] Trend chart header controls overlap in ${vp.name}:`, trendControlsLayout.overlaps);
      auditResults.uiOverlaps.push({ vp: vp.name, component: "Trend Chart Header", overlaps: trendControlsLayout.overlaps });
    }

    // Test Timeframe switching: 1D, 5D, 1M, 1Y
    console.log(`Testing Timeframe buttons (1D, 5D, 1M, 1Y)...`);
    for (const tf of ["1D", "5D", "1M", "1Y"]) {
      const btn = await page.$(`.tf-btn:text-is("${tf}")`);
      if (btn) {
        await btn.click();
        await sleep(1000);
        const polylinePoints = await page.$eval(".trend-svg polyline", (el) => el.getAttribute("points")?.length || 0).catch(() => 0);
        console.log(`Timeframe "${tf}": polyline rendered with ${polylinePoints} characters of points`);
        if (polylinePoints === 0) {
          console.warn(`[CHART WARNING] Polyline points empty for timeframe ${tf}`);
        }
      }
    }

    // Test SVG hover crosshair
    console.log(`Testing SVG chart hover crosshair...`);
    const svgEl = await page.$(".trend-svg");
    if (svgEl) {
      await svgEl.scrollIntoViewIfNeeded();
      await sleep(300);
      const box = await svgEl.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
        await sleep(400);
        const tooltip = await page.$eval(".chart-hover-tooltip", (el) => ({
          visible: !!el,
          text: el.textContent?.replace(/\s+/g, " ").trim(),
        })).catch(() => ({ visible: false, text: null }));
        console.log(`Hover tooltip: visible=${tooltip.visible}, text="${tooltip.text || "none"}"`);
        if (!tooltip.visible) {
          console.warn(`[CHART BUG] Hover tooltip not visible when hovering SVG chart!`);
        }
      }
    }

    // 5. Cross-Page Navigation Audit
    console.log(`\n--- Cross-Page Navigation Audit (${vp.name}) ---`);
    const tabs = [
      "Stocks",
      "Mutual Funds",
      "New IPOs",
      "AI Strategy Lab",
      "Trends & Signals",
      "Paper Trading",
      "Overview",
      "Forecast Lab",
      "Run Receipt",
    ];

    for (const tab of tabs) {
      console.log(`Navigating to tab: "${tab}"...`);
      const btn = await page.$(`.topbar-nav .nav-link:text-is("${tab}")`);
      if (btn) {
        await btn.click();
        await sleep(800);

        // Check horizontal overflow
        const overflow = await page.evaluate((tabName) => {
          const bodyW = document.body.clientWidth;
          const scrollW = document.documentElement.scrollWidth;
          return {
            tab: tabName,
            scrollW,
            bodyW,
            overflowX: scrollW > bodyW + 1,
            diff: scrollW - bodyW,
          };
        }, tab);

        if (overflow.overflowX) {
          console.warn(`[HORIZONTAL OVERFLOW] Tab "${tab}" in ${vp.name} causes document overflow of ${overflow.diff}px!`);
          auditResults.layoutGlitches.push({
            vp: vp.name,
            tab,
            issue: `Document horizontal overflow (${overflow.diff}px)`,
          });
        }
      }
    }

    await context.close();
  }

  await browser.close();

  // Save audit results
  const outPath = path.resolve("./audit_raw_results.json");
  fs.writeFileSync(outPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n======================================================`);
  console.log(`Full Audit Complete! Results saved to: ${outPath}`);
  console.log(`======================================================\n`);
}

runAudit().catch((err) => {
  console.error("Audit script crashed:", err);
  process.exit(1);
});
