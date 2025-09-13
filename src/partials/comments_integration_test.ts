import { app } from "@/app.ts"
import { assertEquals, assertStringIncludes } from "@std/assert"
import { spy } from "@std/testing/mock"
import { z } from "zod"

const logEntrySchema = z.object({
  timestamp: z.string().datetime(),
  level: z.enum(["trace", "debug", "info", "warning", "error", "fatal"]),
  category: z.array(z.string()),
  message: z.array(z.string()),
  method: z.string(),
  path: z.string(),
  requestId: z.string().uuid(),
  url: z.string(),
  contentType: z.unknown(),
  // PLANNED: requestSize: z.string(),
  status: z.number(),
  duration: z.number(),
  responseContentType: z.string(),
})

async function captureStdout(testFn: () => Promise<void>): Promise<string[]> {
  const consoleLogSpy = spy(console, "info")

  await testFn()

  const capturedLogs = consoleLogSpy.calls.map((call) =>
    call.args.map((arg: unknown) => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" ")
  )
  consoleLogSpy.restore()

  return capturedLogs
}

function validateLogs(logs: string[]) {
  if (logs.length !== 1) {
    throw new Error(`More than one log matched: ${logs}`)
  }
  const [logLine] = logs
  const logEntry = JSON.parse(logLine)
  const validation = logEntrySchema.safeParse(logEntry)
  if (!validation.success) {
    throw new Error(`Log validation failed: ${validation.error.message}`)
  }
}

Deno.test("GET /public/shared/commentShape.js returns module with cache headers", async () => {
  const logs = await captureStdout(async () => {
    const res = await app.fetch(new Request("http://localhost/public/shared/commentShape.js"))
    await res.text() // Prevent file handler leaks

    assertEquals(res.status, 200)
    assertEquals(res.headers.get("Content-Type"), "text/javascript; charset=utf-8")
  })
  validateLogs(logs)
})

Deno.test("POST /partials/comments adds comment and echoes tempId attribute", async () => {
  const logs = await captureStdout(async () => {
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
  validateLogs(logs)
})
