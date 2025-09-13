import { expect, test } from "@playwright/test"

test("comment demo works", async ({ page }) => {
  const consoleMessages: string[] = []
  page.on("console", (msg) => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`)
  })

  await page.goto("/comments")
  await expect(page.locator("h1")).toContainText("Comments")

  console.log("Console messages during page load:", consoleMessages)

  await page.waitForSelector("#comments-list li")
  const jsEnabled = await page.evaluate(() => {
    return typeof window !== "undefined" && typeof document !== "undefined"
  })
  expect(jsEnabled).toBe(true)

  const htmxScriptLoaded = await page.locator('script[src="/public/htmx.min.js"]').count() > 0
  expect(htmxScriptLoaded).toBe(true)

  await page.waitForFunction(() => typeof window.htmx !== "undefined")

  const htmxLoaded = await page.evaluate(() => typeof window.htmx !== "undefined")
  expect(htmxLoaded).toBe(true)

  try {
    await page.waitForSelector("#comments-list li", { timeout: 10000 })
  } catch {
    console.log("hx-trigger='load' did not populate comments list within timeout")
    await page.evaluate(() => {
      const element = document.querySelector("#comments-list")
      if (element && window.htmx) {
        ;(window.htmx as any).trigger(element, "load")
      }
    })
    await page.waitForSelector("#comments-list li", { timeout: 5000 })
  }
  // await page.waitForSelector("#comments-list li")

  console.log("Console messages during page load:", consoleMessages)

  const testAuthor = "Test User"
  const testBody = "This is a test comment for optimistic replacement"
  await page.fill("#author", testAuthor)
  await page.fill("#body", testBody)

  // Simulate network delays to test optimistic updates
  await page.route("**/partials/comments", async (route, request) => {
    if (request.method() === "POST") {
      await new Promise((res) => setTimeout(res, 100))
    }
    await route.continue()
  })
  await page.click('button[type="submit"]')

  const optimisticComment = page.locator(".comment--optimistic")
  await expect(optimisticComment.locator('[data-field="author"]')).toContainText(testAuthor)
  await expect(optimisticComment.locator('[data-field="body"]')).toContainText(testBody)
  await expect(optimisticComment.locator('[data-field="time"]')).toContainText("(sending…)")
  await page.waitForSelector(".comment--optimistic", { state: "detached" })

  const commentsList = page.locator("#comments-list")
  const firstComment = commentsList.locator("li").first()
  await expect(firstComment.locator('[data-field="author"]')).toContainText(testAuthor)
  await expect(firstComment.locator('[data-field="body"]')).toContainText(testBody)
  await expect(firstComment.locator('[data-field="time"]')).not.toContainText("(sending…)")
})
