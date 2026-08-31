import { defineConfig, devices } from "@playwright/test";

const PORT_BACKEND = 4011;
const PORT_FRONT = 5173;

const CI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: CI ? 2 : 0,
  reporter: CI ? [["html", { open: "never" }], ["list"]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT_FRONT}`,
    timezoneId: "UTC",
    locale: "ru-RU",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm --prefix ../server start",
      url: `http://localhost:${PORT_BACKEND}/api/v1/event-types`,
      reuseExistingServer: !CI,
      env: { ...process.env, TZ: "UTC", PORT: String(PORT_BACKEND) },
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm --prefix ../web run dev",
      url: `http://localhost:${PORT_FRONT}`,
      reuseExistingServer: !CI,
      env: { ...process.env, TZ: "UTC", VITE_PROXY_TARGET: `http://localhost:${PORT_BACKEND}` },
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
