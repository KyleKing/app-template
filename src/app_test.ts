import { assertEquals } from "@std/assert"
import { app } from "@/app.ts"

interface AppTestParams {
  name: string
  url: string
  method: string
  headers?: Record<string, string>
  expectedStatus: number
  expectedContent?: string
}

interface RequestOptions {
  method: string
  headers?: Record<string, string>
}

function runAppTest(params: AppTestParams) {
  Deno.test(params.name, async () => {
    const requestOptions: RequestOptions = { method: params.method }
    if (params.headers) {
      requestOptions.headers = params.headers
    }

    const response = await app.request(params.url, requestOptions)
    const responseText = await response.text() // prevent leaks even if not tested

    assertEquals(response.status, params.expectedStatus)
    if (params.expectedContent) {
      assertEquals(responseText, params.expectedContent)
    }
  })
}

const appTestCases = [
  {
    name: "Home page - GET success",
    url: "http://localhost/",
    method: "GET",
    expectedStatus: 200,
    // TODO: Check for default characters!
  },
  {
    name: "Home page with dangerous characters - should be sanitized",
    url: "http://localhost/%3Cscript%3Ealert%28%27xss%27%29%3C%255cscript%3E",
    method: "GET",
    expectedStatus: 200,
    // TODO: Check for escaped characters!
  },
  {
    name: "Static Files - Get Success",
    url: "http://localhost/public/styles.css",
    method: "GET",
    expectedStatus: 200,
  },
  {
    name: "Static Files - Not Found",
    url: "http://localhost/public/secret_config.pkl",
    method: "GET",
    expectedStatus: 404,
  },
  {
    name: "API - Not Found",
    url: "http://localhost/iapi/insecure-login",
    method: "GET",
    expectedStatus: 404,
  },
  {
    name: "API - Incorrect Method to Get-Only Route",
    url: "http://localhost/iapi/healthz",
    method: "POST",
    expectedStatus: 404,
  },
]

for (const testCase of appTestCases) {
  runAppTest(testCase)
}
