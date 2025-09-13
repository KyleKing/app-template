import { app } from "@/app.ts"
import { assertEquals } from "@std/assert"

interface TestParams {
  name: string
  url: string
  method: string
  body?: unknown
  headers?: Record<string, string>
  expectedStatus: number
  expectedContent?: string
}

interface RequestOptions {
  method: string
  headers?: Record<string, string>
  body?: string
}

function runAppTest(params: TestParams) {
  Deno.test(params.name, async () => {
    const requestOptions: RequestOptions = { method: params.method }
    if (params.headers) {
      requestOptions.headers = params.headers
    }
    if (params.body !== undefined) {
      requestOptions.body = typeof params.body === "string" ? params.body : JSON.stringify(params.body)
    }

    const response = await app.request(params.url, requestOptions)

    assertEquals(response.status, params.expectedStatus)
    if (params.expectedContent) {
      const responseText = await response.text()
      const hr = `\n'''\n`
      assertEquals(
        responseText,
        params.expectedContent,
        `Error: expectedContent does not match:${hr}${responseText}${hr}${hr}${params.expectedContent}${hr}`,
      )
    }
  })
}

const appTestCases = [
  {
    name: "Not Found",
    url: "http://localhost/iapi/not-found",
    method: "GET",
    expectedStatus: 404,
  },
  {
    name: "API Health - GET success",
    url: "http://localhost/iapi/healthz",
    method: "GET",
    expectedStatus: 200,
    expectedContent: `{"healthy":true}`,
  },
]

for (const testCase of appTestCases) {
  runAppTest(testCase)
}
