import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GlobalSearchBar } from "./GlobalSearchBar";

describe("GlobalSearchBar Component", () => {
  it("renders search input with placeholder and hotkey shortcut", () => {
    const markup = renderToStaticMarkup(<GlobalSearchBar onSelectStock={() => {}} />);
    expect(markup).toContain("Search stocks, mutual funds, indices...");
    expect(markup).toContain("⌘K");
    expect(markup).toContain("global-search-container");
    expect(markup).toContain("global-search-bar");
  });

  it("renders compact 30px command input trigger with shortcut", () => {
    const markup = renderToStaticMarkup(<GlobalSearchBar onSelectStock={() => {}} />);
    expect(markup).toContain("compact-trigger");
    expect(markup).toContain("global-search-bar");
    expect(markup).toContain("⌘K");
  });

  it("exposes one named control, not a button role wrapping an input", () => {
    const markup = renderToStaticMarkup(<GlobalSearchBar onSelectStock={() => {}} />);
    expect(markup).toContain('aria-label="Universal stock search (like Groww / Angel One)"');
    // axe `nested-interactive`: an interactive wrapper may not contain the real input
    expect(markup).not.toContain('role="button"');
    expect(markup).not.toContain('tabindex="0"');
  });

  it("names the real price source in its footer, not an exchange feed it does not use", () => {
    const markup = renderToStaticMarkup(
      <GlobalSearchBar onSelectStock={() => {}} initialOpen={true} initialQuery="" />
    );
    expect(markup).toContain("Yahoo Finance (unofficial)");
    expect(markup).not.toMatch(/AMFI|NSE Telemetry/);
  });

  it("contains keyboard accessibility and search trigger structure", () => {
    const markup = renderToStaticMarkup(<GlobalSearchBar onSelectStock={() => {}} />);
    expect(markup).toContain('class="global-search-input"');
    expect(markup).toContain('class="global-search-shortcut"');
  });

  it("renders search skeleton loader while searching and does not show premature empty state", () => {
    const markup = renderToStaticMarkup(
      <GlobalSearchBar onSelectStock={() => {}} initialOpen={true} initialSearching={true} initialQuery="BAJFINANCE" />
    );
    expect(markup).toContain("global-search-loading-skeleton");
    expect(markup).toContain("Searching across all 13,000+ Indian stocks");
    expect(markup).not.toContain("No Indian equities or indices found");
  });

  it("immediately renders trending stocks and aborts search when query is cleared", () => {
    const markup = renderToStaticMarkup(
      <GlobalSearchBar onSelectStock={() => {}} initialOpen={true} initialSearching={false} initialQuery="" />
    );
    expect(markup).toContain("Trending on NSE &amp; BSE");
    expect(markup).toContain("RELIANCE");
    expect(markup).not.toContain("global-search-loading-skeleton");
  });
});
