import assert from "node:assert/strict"
import { test } from "node:test"
import type { Context } from "hono"
import { handleApiError } from "#src/utils/errorHandler.ts"

// Mock Context
class MockContext {
  req: {
    path: string
    method: string
  }

  constructor(path = "/iapi/test") {
    this.req = {
      path,
      method: "GET",
    }
  }

  json(data: unknown, status: number) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  }

  text(text: string, status: number) {
    return new Response(text, { status })
  }

  html(html: string, status: number) {
    return new Response(html, {
      status,
      headers: { "Content-Type": "text/html" },
    })
  }
}

test("handleApiError - JSON response for API paths", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/iapi/test")

  const response = handleApiError(error, c as unknown as Context, {
    message: "Custom message",
    statusCode: 400,
  })

  assert.equal(response.status, 400)
  const data = await response.json()
  assert.equal(data.error, "Custom message")
  assert.equal(data.details, "Test error")
})

test("handleApiError - HTML response for non-API paths", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/page")

  const response = handleApiError(error, c as unknown as Context, {
    message: "Custom message",
    statusCode: 500,
  })

  assert.equal(response.status, 500)
  const html = await response.text()
  assert.equal(html.includes("Error"), true)
  assert.equal(html.includes("Test error"), true)
})

test("handleApiError - Text response type", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/iapi/test")

  const response = handleApiError(error, c as unknown as Context, {
    message: "Custom message",
    statusCode: 404,
    responseType: "text",
  })

  assert.equal(response.status, 404)
  const text = await response.text()
  assert.equal(text, "Custom message: Test error")
})

test("handleApiError - Default values", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/iapi/test")

  const response = handleApiError(error, c as unknown as Context)

  assert.equal(response.status, 500)
  const data = await response.json()
  assert.equal(data.error, "An error occurred")
  assert.equal(data.details, "Test error")
})
