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
      command: "cd backend && PYTHONPATH=src /opt/anaconda3/bin/uvicorn bazaar_drishti.api.app:app --port 8000",
      port: 8000,
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
    {
      command: "npm --prefix web run dev -- --port 5173",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
