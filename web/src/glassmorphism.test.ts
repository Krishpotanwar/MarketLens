import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Glassmorphism and Background Theme Tokens", () => {
  const cssPath = path.resolve(process.cwd(), "src/styles.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("declares backgroundimg.png in body or page-shell background", () => {
    expect(cssContent).toMatch(/backgroundimg\.png/);
  });

  it("keeps active tabs readable in the light theme: white text over translucent blue vanishes on a light page", () => {
    for (const selector of [".nav-link.active", ".tf-btn.active", ".sip-chip.active", ".preset-btn.active", ".btn-stock-trend:hover"]) {
      const escaped = selector.replace(/\./g, "\\.");
      const rule = new RegExp(`\\.page-shell\\.light-desk ${escaped}[^{]*\\{[^}]*color:\\s*var\\(--accent-blue-strong\\)`);
      expect(cssContent, selector).toMatch(rule);
    }
  });

  it("defines glassmorphism tokens for cards and tables", () => {
    expect(cssContent).toMatch(/--bg-glass-card:/);
    expect(cssContent).toMatch(/--bg-glass-table:/);
    expect(cssContent).toMatch(/--border-glass:/);
    expect(cssContent).toMatch(/--backdrop-blur:/);
  });
});
