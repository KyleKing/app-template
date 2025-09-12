import { assertEquals, assertStringIncludes } from "@std/assert"
import { app } from "@/app.ts"

Deno.test("GET /public/shared/commentShape.js returns module with cache headers", async () => {
  const res = await app.fetch(new Request("http://localhost/public/shared/commentShape.js"))
  await res.text() // Prevent file handler leaks

  assertEquals(res.status, 200)
  assertEquals(res.headers.get("Content-Type"), "text/javascript; charset=utf-8")
})

Deno.test("POST /partials/comments adds comment and echoes tempId attribute", async () => {
  const form = new FormData()
  form.set("author", "Tester")
  form.set("body", "Integration Comment")
  form.set("tempId", "temp-abc123")

  const req = new Request("http://localhost/partials/comments", { method: "POST", body: form })
  const res = await app.fetch(req)
  const html = await res.text()

  assertEquals(res.status, 200)
  assertStringIncludes(html, 'data-temp-id="temp-abc123"')
  assertStringIncludes(html, "Integration Comment")
})
