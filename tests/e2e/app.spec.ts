import { expect, test } from "./fixtures.ts"

test("navigation works", async ({ page, browserName }) => {
  await page.goto("/")

  await page.click("text=Alert")
  await expect(page).toHaveURL(/.+xss.+/)
  await expect(page.locator("h1").first()).toContainText("xss")

  if (browserName === "firefox") {
    await page.setViewportSize({ width: 800, height: 600 })
    await page.screenshot({ path: ".github/screenshots/home-xss.png" })
  }
})
