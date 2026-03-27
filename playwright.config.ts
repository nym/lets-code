import { defineConfig, devices } from "@playwright/test";

const port = process.env.E2E_PORT || "3001";
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "just build && just start",
    url: baseURL,
    reuseExistingServer: false,
    env: {
      DANGEROUSLY_RELAX_CSP: "false",
      PORT: port,
    },
  },
});
