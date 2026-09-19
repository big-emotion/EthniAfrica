import { defineConfig } from "@playwright/test";

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "search-feed-visual-proof.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],
  outputDir: "test-results/search-feed-visual",
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 430, height: 800 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    colorScheme: "light",
    locale: "fr-FR",
    timezoneId: "Africa/Dakar",
    reducedMotion: "reduce",
    serviceWorkers: "block",
    launchOptions: {
      args: ["--force-color-profile=srgb"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "search-feed-parity",
    },
  ],
  webServer: {
    command: `python3 -m http.server ${port} --bind 127.0.0.1`,
    url: `${baseURL}/docs/design/mockups/search-feed/Mande.dc.html`,
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
