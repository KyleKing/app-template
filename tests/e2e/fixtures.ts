import { expect, test as base } from "@playwright/test"

// Collect Browser (Console) logs to prevent errors and assist when debugging test failures
type Fixtures = {
  consoleMessages: string[] // All
  consoleErrors: string[] // Errors Only
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
