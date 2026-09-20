import { defineConfig } from "@playwright/test";

import { CONSENT_STORAGE_KEY, DEFAULT_PREFERENCES } from "./src/lib/consent";

const port = 3111;
const baseURL = `http://localhost:${port}`;

const returningReaderConsent = {
  cookies: [],
  origins: [
    {
      origin: baseURL,
      localStorage: [
        {
          name: CONSENT_STORAGE_KEY,
          value: JSON.stringify({
            hasConsented: true,
            preferences: DEFAULT_PREFERENCES,
            consentDate: new Date().toISOString(),
          }),
        },
      ],
    },
  ],
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: "search-feed-responsive.spec.ts",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "on-failure" }]],
  outputDir: "test-results/search-feed-responsive",
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
    storageState: returningReaderConsent,
    launchOptions: {
      args: ["--force-color-profile=srgb"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "search-feed-responsive" }],
  webServer: {
    command: `node e2e/support/search-feed-dev-server.mjs ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
