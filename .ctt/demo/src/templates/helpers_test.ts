import { renderPage } from "@/templates/helpers.ts"
import { assertEquals } from "@std/assert"

// Mock Context
class MockContext {
  html(html: string) {
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
}

Deno.test("renderPage - renders page with layout", async () => {
  // Create test page template
  const pageTemplatePath = "./src/templates/pages/test-page.vto"
  const pageContent = "<h1>{{ title }}</h1><p>{{ content }}</p>"

  await Deno.writeTextFile(pageTemplatePath, pageContent)

  try {
    const c = new MockContext()
    const response = await renderPage(
      "pages/test-page.vto",
      { content: "Hello World", title: "Test Page" },
      "Test Page",
      c as any,
    )

    assertEquals(response.status, 200)
    const html = await response.text()
    assertEquals(html.includes("Test Page"), true)
    assertEquals(html.includes("Hello World"), true)
  } finally {
    await Deno.remove(pageTemplatePath)
  }
})

Deno.test("renderPage - handles empty data", async () => {
  // Create test page template
  const pageTemplatePath = "./src/templates/pages/test-empty.vto"
  const pageContent = "<div>Empty page</div>"

  await Deno.writeTextFile(pageTemplatePath, pageContent)

  try {
    const c = new MockContext()
    const response = await renderPage("pages/test-empty.vto", {}, "Empty", c as any)

    assertEquals(response.status, 200)
    const html = await response.text()
    assertEquals(html.includes("<div>Empty page</div>"), true)
  } finally {
    await Deno.remove(pageTemplatePath)
  }
})

Deno.test("renderPage - handles non-existent template", async () => {
  const c = new MockContext()
  try {
    await renderPage("pages/non-existent.vto", {}, "Test", c as any)
    // Should not reach here
    assertEquals(true, false, "Expected error for non-existent template")
  } catch (error) {
    // Expected to throw
    const err = error as Error
    assertEquals(err.message.includes("ENOENT") || err.message.includes("no such file"), true)
  }
})
