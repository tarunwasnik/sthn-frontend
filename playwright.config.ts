import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  globalSetup: "./e2e/global-setup.mjs",
  use: { browserName: "chromium", channel: "chrome", headless: true, trace: "retain-on-failure", launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] } },
});
