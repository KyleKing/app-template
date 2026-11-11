import { test } from "node:test"
import { app } from "#src/app.ts"
import assert from "node:assert/strict"

test("Home page echoes the path parameter", async () => {
  const response = await app.request("http://localhost/Home")
  const html = await response.text()

  assert.deepEqual(response.status, 200)
  assert.ok(html.includes("Hello Home!"))
})

test("Home page escapes dangerous characters", async () => {
  const response = await app.request("http://localhost/%3Cscript%3Ealert%28%27xss%27%29%3C%255cscript%3E")
  const html = await response.text()

  assert.deepEqual(response.status, 200)
  assert.ok(html.includes("&lt;script&gt;"))
  assert.deepEqual(html.includes("<script>alert("), false)
})

test("Comments page renders", async () => {
  const response = await app.request("http://localhost/comments")
  const html = await response.text()

  assert.deepEqual(response.status, 200)
  assert.ok(html.includes(`id="comments-demo"`))
})
