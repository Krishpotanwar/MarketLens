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

  it("first paint says connecting, not offline, until the feed has answered", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage onSelectForTrend={() => {}} onSelectForTrade={() => {}} />
    );
    const chip = html.match(/live-telemetry-provider">([^<]*)</)?.[1] ?? "";
    expect(chip).toMatch(/connecting/i);
    expect(chip).not.toMatch(/offline/i);
  });

  it("shows no price on first paint: shelves wait for live quotes and bundled rows carry names only", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage onSelectForTrend={() => {}} onSelectForTrade={() => {}} />
    );
    expect(html).toContain("Live movers appear when the market feed is available");
    expect(html).not.toMatch(/shelf-ltp/); // no shelf row, so no shelf price
    expect(html).not.toMatch(/table-price">₹/); // every table price cell is a dash until a live quote lands
  });

  it("never seeds the index strip with invented levels", () => {
    const html = renderToStaticMarkup(
      <StocksExplorerPage onSelectForTrend={() => {}} onSelectForTrade={() => {}} />
    );
    // First paint, before any quote arrives (and the whole time the feed is down). The table below
    // may hold bundled sample rows; the page labels those "sample prices". The strip never may.
    const strip = html.match(/<section class="indices-strip"[\s\S]*?<\/section>/)?.[0] ?? "";
    expect(strip).toContain("NIFTY AUTO");
    expect(strip).toContain("—");
    for (const invented of ["24,854.20", "81,420.50", "51,340.80", "42,180.20", "25,640.10"]) {
      expect(strip).not.toContain(invented);
    }
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
