import { defineConfig, devices } from "@playwright/test"

const PORT = "8081"
const BASE_URL = `http://localhost:${PORT}`

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!Deno.env.get("CI"),
  /* Retry on CI only */
  retries: Deno.env.get("CI") ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: Deno.env.get("CI") ? 1 : undefined,

  timeout: 5_000,
  expect: { timeout: 1_000 },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: "playwright-report",
      },
    ],
  ],
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "iphone",
      use: { ...devices["iPhone 14"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `PORT=${PORT} deno task dev`,
    url: BASE_URL,
    reuseExistingServer: !Deno.env.get("CI"),
  },
})
