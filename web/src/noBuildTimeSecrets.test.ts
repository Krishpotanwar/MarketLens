import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

// Vite compiles every VITE_* variable into the public bundle. An AI provider key read from one would
// ship to every visitor and be sent from their browsers, so a key may only be typed into the app.
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });
}

describe("build-time secrets", () => {
  it("no shipped source reads an AI API key from a VITE_* variable", () => {
    const offenders = sources(path.resolve(process.cwd(), "src")).filter((file) =>
      /VITE_[A-Z_]*API_KEY/.test(fs.readFileSync(file, "utf-8"))
    );
    expect(offenders).toEqual([]);
  });
});
