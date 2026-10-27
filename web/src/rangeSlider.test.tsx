import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StocksExplorerPage } from "./pages/StocksExplorerPage";
import * as fs from "node:fs";
import * as path from "node:path";

describe("52-Week Range Slider and High-Contrast Action Buttons Tests", () => {
  it("renders range-fill inside the 52-week range track for listed stocks", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage
        onSelectForTrend={() => {}}
        onSelectForTrade={() => {}}
      />
    );
    expect(html).toContain("range-fill");
    expect(html).toContain("range-indicator");
    expect(html).toContain("btn-stock-trend");
    expect(html).toContain("btn-stock-trade");
  });

  it("defines range-fill gradient and high-contrast action button styles in styles.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/styles.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toMatch(/\.range-fill\s*\{[^}]*background:\s*linear-gradient/);
    expect(css).toMatch(/\.btn-stock-trade\s*\{[^}]*background:\s*(#10b981|var\(--accent-emerald\))/);
  });
});
