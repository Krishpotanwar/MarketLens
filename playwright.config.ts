import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30 * 1000,
  expect: {
    timeout: 6000,
  },
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  webServer: [
    {
      // The real API against a fake of every upstream: no test depends on Yahoo, NSE or mfapi being reachable.
      command: "cd backend && uv run python ../e2e/fake_upstream.py 8000",
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: "npm --prefix web run dev -- --port 5173",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
