import { autoTrim } from "@/utils/autoTrim.ts"
import { assertEquals } from "@std/assert"

Deno.test("autoTrim removes extra blank lines and left indentation", () => {
  const input = "   <div>\n\n\n    <p>test</p>\n\n</div>"
  const expected = "<div>\n<p>test</p>\n</div>"
  assertEquals(autoTrim(input), expected)
})
