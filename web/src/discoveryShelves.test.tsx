import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StocksExplorerPage } from "./pages/StocksExplorerPage";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Discovery Shelves and Filter Controls Tests", () => {
  it("renders Top Gainers, Top Losers, and Most Active shelves with colored shelf card variants", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage
        onSelectForTrend={() => {}}
        onSelectForTrade={() => {}}
      />
    );
    expect(html).toContain("shelf-card-gainers");
    expect(html).toContain("shelf-card-losers");
    expect(html).toContain("shelf-card-active");
    expect(html).toContain("Top Gainers");
    expect(html).toContain("Top Losers");
    expect(html).toContain("Most Active");
  });

  it("defines top accent borders for the three shelves in styles.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/styles.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toMatch(/\.shelf-card-gainers\s*\{[^}]*border-top:\s*2px solid/);
    expect(css).toMatch(/\.shelf-card-losers\s*\{[^}]*border-top:\s*2px solid/);
    expect(css).toMatch(/\.shelf-card-active\s*\{[^}]*border-top:\s*2px solid/);
  });

  it("renders search input, exchange tabs, and market cap tabs", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage
        onSelectForTrend={() => {}}
        onSelectForTrade={() => {}}
      />
    );
    expect(html).toContain("search-input");
    expect(html).toContain("All Exchanges (13,109+)");
    expect(html).toContain("NSE Listed (2,611)");
    expect(html).toContain("BSE Listed (10,498)");
    expect(html).toContain("All Caps");
    expect(html).toContain("Large Cap");
    expect(html).toContain("Mid Cap");
    expect(html).toContain("Small Cap");
  });
});
