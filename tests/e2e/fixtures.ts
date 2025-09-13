import { expect, test as base } from "@playwright/test"

// Collect Browser (Console) logs to prevent errors and assist when debugging test failures
type Fixtures = {
  consoleMessages: string[] // All
  consoleErrors: string[] // Errors Only
  cssCoverage: number // Percent of CSS used (*Chromium only)
}

export const test = base.extend<Fixtures>({
  consoleMessages: async ({ page }, use) => {
    const messages: string[] = []
    const handler = (msg: any) => {
      messages.push(`${msg.type()}: ${msg.text()}`)
    }
    page.on("console", handler)
    await use(messages)
    page.off("console", handler)
  },
  consoleErrors: async ({ consoleMessages }, use) => {
    const errors = consoleMessages.filter((m) => m.startsWith("error:"))
    await use(errors)
  },
  cssCoverage: [async ({ page, browserName }, use) => {
    // Only supported in Chromium via CDP
    if (browserName !== "chromium") {
      await use(0)
      return
    }

    // Capture usage with 'Chrome DevTools Protocol' (CDP)
    const client = await (page.context() as any).newCDPSession(page)
    await client.send("DOM.enable")
    await client.send("CSS.enable")
    await client.send("CSS.startRuleUsageTracking")
    await use(0)
    const { ruleUsage } = await client.send("CSS.stopRuleUsageTracking")

    let usedBytes = 0
    let totalBytes = 0
    for (const usage of ruleUsage as any[]) {
      const len = usage.endOffset - usage.startOffset
      totalBytes += len
      if (usage.used) usedBytes += len
    }
    const percent = totalBytes ? (usedBytes / totalBytes) * 100 : 0
    console.log(`[css-coverage] ${percent.toFixed(2)}% used (${usedBytes}/${totalBytes} chars)`)
    expect(percent).toBeGreaterThanOrEqual(90)
  }, { auto: true }],
})

test.afterEach(async ({ consoleErrors, consoleMessages }) => {
  const testFailed = test.info().status !== test.info().expectedStatus
  if (testFailed || consoleErrors.length) {
    console.log("--- Browser Console Messages ---")
    for (const msg of consoleMessages) console.log(msg)
    console.log("--------------------------------")
  }
  expect(consoleErrors).toHaveLength(0)
})

export { expect }
