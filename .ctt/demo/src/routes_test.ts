import { app } from "@/app.ts"
import { assertEquals, assertStringIncludes } from "@std/assert"

Deno.test("Home page echoes the path parameter", async () => {
  const response = await app.request("http://localhost/Home")
  const html = await response.text()

  assertEquals(response.status, 200)
  assertStringIncludes(html, "Hello Home!")
})

Deno.test("Home page escapes dangerous characters", async () => {
  const response = await app.request("http://localhost/%3Cscript%3Ealert%28%27xss%27%29%3C%255cscript%3E")
  const html = await response.text()

  assertEquals(response.status, 200)
  assertStringIncludes(html, "&lt;script&gt;")
  assertEquals(html.includes("<script>alert("), false)
})

Deno.test("Comments page renders", async () => {
  const response = await app.request("http://localhost/comments")
  const html = await response.text()

  assertEquals(response.status, 200)
  assertStringIncludes(html, `id="comments-demo"`)
})
