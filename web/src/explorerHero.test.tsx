import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StocksExplorerPage } from "./pages/StocksExplorerPage";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Explorer Hero and Indices Strip Component & Style Tests", () => {
  it("renders the hero title with an emerald highlighted 'Explorer' span", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage
        onSelectForTrend={() => {}}
        onSelectForTrade={() => {}}
      />
    );
    expect(html).toContain("hero-explorer-highlight");
    expect(html).toContain("Explorer</span>");
  });

  it("defines the .hero-explorer-highlight styling with emerald color in styles.css", () => {
    const cssPath = path.resolve(process.cwd(), "src/styles.css");
    const css = fs.readFileSync(cssPath, "utf-8");
    expect(css).toMatch(/\.hero-explorer-highlight\s*\{[^}]*color:\s*var\(--accent-emerald/);
  });

  it("renders the live telemetry status card and refresh button", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage
        onSelectForTrend={() => {}}
        onSelectForTrade={() => {}}
      />
    );
    expect(html).toContain("live-telemetry-status-card");
    expect(html).toContain("live-sync-btn");
  });

  it("renders all 5 major indices pills", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage
        onSelectForTrend={() => {}}
        onSelectForTrade={() => {}}
      />
    );
    expect(html).toContain("NIFTY 50");
    expect(html).toContain("SENSEX");
    expect(html).toContain("BANK NIFTY");
    expect(html).toContain("NIFTY IT");
    expect(html).toContain("NIFTY AUTO");
  });
});
