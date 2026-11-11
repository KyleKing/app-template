import assert from "node:assert/strict"
import { rm, writeFile } from "node:fs/promises"
import { test } from "node:test"
import { renderPage } from "#src/templates/helpers.ts"

// Mock Context
class MockContext {
  html(html: string) {
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
}

test("renderPage - renders page with layout", async () => {
  // Create test page template
  const pageTemplatePath = "./src/templates/pages/test-page.vto"
  const pageContent = "<h1>{{ title }}</h1><p>{{ content }}</p>"

  await writeFile(pageTemplatePath, pageContent)

  try {
    const c = new MockContext()
    const response = await renderPage(
      "pages/test-page.vto",
      { content: "Hello World", title: "Test Page" },
      "Test Page",
      c as any,
    )

    assert.equal(response.status, 200)
    const html = await response.text()
    assert.equal(html.includes("Test Page"), true)
    assert.equal(html.includes("Hello World"), true)
  } finally {
    await rm(pageTemplatePath)
  }
})

test("renderPage - handles empty data", async () => {
  // Create test page template
  const pageTemplatePath = "./src/templates/pages/test-empty.vto"
  const pageContent = "<div>Empty page</div>"

  await writeFile(pageTemplatePath, pageContent)

  try {
    const c = new MockContext()
    const response = await renderPage("pages/test-empty.vto", {}, "Empty", c as any)

    assert.equal(response.status, 200)
    const html = await response.text()
    assert.equal(html.includes("<div>Empty page</div>"), true)
  } finally {
    await rm(pageTemplatePath)
  }
})

test("renderPage - handles non-existent template", async () => {
  const c = new MockContext()
  try {
    await renderPage("pages/non-existent.vto", {}, "Test", c as any)
    // Should not reach here
    assert.equal(true, false, "Expected error for non-existent template")
  } catch (error) {
    // Expected to throw
    const err = error as Error
    assert.equal(err.message.includes("ENOENT") || err.message.includes("no such file"), true)
  }
})
