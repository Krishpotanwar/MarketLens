import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StocksExplorerPage, WeekRangeBar } from "./pages/StocksExplorerPage";
import * as fs from "node:fs";
import * as path from "node:path";

describe("52-Week Range Slider and High-Contrast Action Buttons Tests", () => {
  it("draws range-fill and range-indicator from a real 52-week range, and a dash without one", () => {
    const bar = renderToStaticMarkup(<WeekRangeBar ltp={150} low={100} high={200} />);
    expect(bar).toContain("range-fill");
    expect(bar).toContain("range-indicator");
    expect(bar).toContain("width:50%"); // 150 sits halfway between 100 and 200
    expect(renderToStaticMarkup(<WeekRangeBar ltp={null} low={100} high={200} />)).toBe("—");
    expect(renderToStaticMarkup(<WeekRangeBar ltp={150} />)).toBe("—");
  });

  it("lists stocks with their action buttons even before any price has arrived", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage onSelectForTrend={() => {}} onSelectForTrade={() => {}} />
    );
    expect(html).toContain("btn-stock-trend");
    expect(html).toContain("btn-stock-trade");
    expect(html).not.toContain("range-fill"); // no invented range under a name with no price
  });

  it("defines range-fill gradient and high-contrast action button styles in styles.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/styles.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toMatch(/\.range-fill\s*\{[^}]*background:\s*linear-gradient/);
    expect(css).toMatch(/\.btn-stock-trade\s*\{[^}]*background:\s*(#10b981|var\(--accent-emerald\))/);
  });
});
