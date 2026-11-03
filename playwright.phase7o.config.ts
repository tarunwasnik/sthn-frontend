import { defineConfig } from "@playwright/test";

const origin = process.env.STHN_PHASE7O_FRONTEND_ORIGIN;
const apiOrigin = process.env.STHN_PHASE7O_API_ORIGIN;

const loopback = /^http:\/\/127\.0\.0\.1:\d+$/;
if (process.env.STHN_PHASE7O_E2E !== "true" || !origin || !apiOrigin || !loopback.test(origin) || !loopback.test(apiOrigin)) {
  throw new Error("Phase 7O requires explicit isolated loopback frontend and API origins.");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "phase7o-isolated.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  timeout: 45_000,
  outputDir: "test-results/phase7o-isolated",
  preserveOutput: "always",
  use: {
    browserName: "chromium",
    channel: "chrome",
    // Headed mode is opt-in for checkout interaction diagnostics; CI remains headless.
    headless: process.env.STHN_PHASE7O_HEADED !== "true",
    baseURL: origin,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
