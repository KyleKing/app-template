import { expect, test } from "./fixtures.ts"

test("comment demo works", async ({ page, browserName }) => {
  await page.goto("/comments")
  await expect(page.locator("h1")).toContainText("Comments")

  const htmxLoaded = await page.evaluate(() => typeof window.htmx !== "undefined")
  expect(htmxLoaded).toBe(true)

  await page.waitForSelector("#comments-list li")

  const testAuthor = "Test User"
  const testBody = `This is a comment from ${browserName} to test optimistic replacement!`
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

  const optimisticComment = page.locator(".c-comment--optimistic")
  await expect(optimisticComment.locator('[data-field="author"]')).toContainText(testAuthor)
  await expect(optimisticComment.locator('[data-field="body"]')).toContainText(testBody)
  await expect(optimisticComment.locator('[data-field="time"]')).toContainText("(sending…)")
  await page.waitForSelector(".c-comment--optimistic", { state: "detached" })

  if (browserName === "firefox") { // Deterministically generate with `deno task test:e2e --project=firefox`
    await page.setViewportSize({ width: 800, height: 1000 })
    await page.screenshot({ path: ".github/screenshots/comments-sending.png" })
  }

  const commentsList = page.locator("#comments-list")
  const firstComment = commentsList.locator("li").first()
  await expect(firstComment.locator('[data-field="author"]')).toContainText(testAuthor)
  await expect(firstComment.locator('[data-field="body"]')).toContainText(testBody)
  await expect(firstComment.locator('[data-field="time"]')).not.toContainText("(sending…)")
})
