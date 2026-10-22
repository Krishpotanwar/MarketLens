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

  it("contains accessible label for universal search", () => {
    const markup = renderToStaticMarkup(<GlobalSearchBar onSelectStock={() => {}} />);
    expect(markup).toContain('aria-label="Universal stock search (like Groww / Angel One)"');
  });

  it("contains keyboard accessibility and search trigger structure", () => {
    const markup = renderToStaticMarkup(<GlobalSearchBar onSelectStock={() => {}} />);
    expect(markup).toContain('class="global-search-input"');
    expect(markup).toContain('class="global-search-shortcut"');
  });
});
