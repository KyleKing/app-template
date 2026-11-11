import assert from "node:assert/strict"
import { test } from "node:test"
import { autoTrim } from "#src/utils/autoTrim.ts"

test("autoTrim removes extra blank lines and left indentation", () => {
  const input = "   <div>\n\n\n    <p>test</p>\n\n</div>"
  const expected = "<div>\n<p>test</p>\n</div>"
  assert.equal(autoTrim(input), expected)
})
