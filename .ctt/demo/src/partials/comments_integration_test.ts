import { mock, test } from "node:test"
import { app } from "#src/app.ts"
import assert from "node:assert/strict"
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
  contentType: z.unknown().optional(),
  // PLANNED: requestSize: z.string(),
  status: z.number(),
  duration: z.number(),
  responseContentType: z.string(),
})

async function captureStdout(testFn: () => Promise<void>): Promise<string[]> {
  const consoleLogSpy = mock.method(console, "info")

  await testFn()

  const capturedLogs = consoleLogSpy.mock.calls.map((call) =>
    call.arguments.map((arg: unknown) => typeof arg === "string" ? arg : JSON.stringify(arg)).join(" ")
  )
  consoleLogSpy.mock.restore()

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

test("GET /public/shared/commentShape.js returns module with cache headers", async () => {
  const logs = await captureStdout(async () => {
    const res = await app.fetch(new Request("http://localhost/public/shared/commentShape.js"))
    await res.text() // Prevent file handler leaks

    assert.deepEqual(res.status, 200)
    assert.deepEqual(res.headers.get("Content-Type"), "text/javascript; charset=utf-8")
  })
  validateLogs(logs)
})

test("POST /partials/comments adds comment and echoes tempId attribute", async () => {
  const logs = await captureStdout(async () => {
    const form = new FormData()
    form.set("author", "Tester")
    form.set("body", "Integration Comment")
    form.set("tempId", "temp-abc123")

    const req = new Request("http://localhost/partials/comments", { method: "POST", body: form })
    const res = await app.fetch(req)
    const html = await res.text()

    assert.deepEqual(res.status, 200)
    assert.ok(html.includes('data-temp-id="temp-abc123"'))
    assert.ok(html.includes("Integration Comment"))
  })
  validateLogs(logs)
})
