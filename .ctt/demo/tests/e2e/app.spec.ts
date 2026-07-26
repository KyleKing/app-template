import { expect, test } from "./fixtures.ts"

test("home page renders", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("h1").first()).toBeVisible()
  const htmxLoaded = await page.evaluate(() => typeof window.htmx !== "undefined")
  expect(htmxLoaded).toBe(true)
})
