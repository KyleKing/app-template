import { assertEquals } from "@std/assert"
import { handleApiError } from "@/utils/errorHandler.ts"

// Mock Context
class MockContext {
  req: {
    path: string
    method: string
  }

  constructor(path: string = "/iapi/test") {
    this.req = {
      path,
      method: "GET",
    }
  }

  json(data: any, status: number) {
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

Deno.test("handleApiError - JSON response for API paths", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/iapi/test")

  const response = handleApiError(error, c as any, {
    message: "Custom message",
    statusCode: 400,
  })

  assertEquals(response.status, 400)
  const data = await response.json()
  assertEquals(data.error, "Custom message")
  assertEquals(data.details, "Test error")
})

Deno.test("handleApiError - HTML response for non-API paths", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/page")

  const response = handleApiError(error, c as any, {
    message: "Custom message",
    statusCode: 500,
  })

  assertEquals(response.status, 500)
  const html = await response.text()
  assertEquals(html.includes("Error"), true)
  assertEquals(html.includes("Test error"), true)
})

Deno.test("handleApiError - Text response type", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/iapi/test")

  const response = handleApiError(error, c as any, {
    message: "Custom message",
    statusCode: 404,
    responseType: "text",
  })

  assertEquals(response.status, 404)
  const text = await response.text()
  assertEquals(text, "Custom message: Test error")
})

Deno.test("handleApiError - Default values", async () => {
  const error = new Error("Test error")
  const c = new MockContext("/iapi/test")

  const response = handleApiError(error, c as any)

  assertEquals(response.status, 500)
  const data = await response.json()
  assertEquals(data.error, "An error occurred")
  assertEquals(data.details, "Test error")
})
