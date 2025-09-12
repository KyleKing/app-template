import { escapeHtml, generateTempId, MAX_AUTHOR_LEN, MAX_BODY_LEN, shapeCommentInput } from "~/commentShape.ts"
import { assert, assertEquals, assertStringIncludes } from "@std/assert"

Deno.test("shapeCommentInput - trims text", () => {
  const author = "Tame Impala"
  const body = "Remember Me"
  const input = { author: `   ${author}   `, body: `  ${body}  ` }
  const result = shapeCommentInput(input)

  assertEquals(result.author, author)
  assertEquals(result.body, body)
  assertEquals(result.tempId, undefined)
})

Deno.test("shapeCommentInput - max length", () => {
  const longAuthor = "A".repeat(MAX_AUTHOR_LEN + 10)
  const longBody = "B".repeat(MAX_BODY_LEN + 10)
  const result = shapeCommentInput({ author: longAuthor, body: longBody })

  assertEquals(result.author.length, MAX_AUTHOR_LEN)
  assertEquals(result.body.length, MAX_BODY_LEN)
})

Deno.test("shapeCommentInput - defaults", () => {
  const defAuthor = "Anon"

  assertEquals(shapeCommentInput({ author: "   ", body: "test" }).author, defAuthor)
  assertEquals(shapeCommentInput({ body: "test" }).author, defAuthor)
  assertEquals(shapeCommentInput({ body: "  " }).body, "")
})

Deno.test("shapeCommentInput - tempId", () => {
  assertEquals(shapeCommentInput({ author: "A", body: "B", tempId: 123 }).tempId, "123")
  assertEquals(shapeCommentInput({ author: "A", body: "B", tempId: "xyz" }).tempId, "xyz")
})

Deno.test("generateTempId - works", () => {
  const id = generateTempId()

  assert(id.startsWith("temp-"))
  assert(typeof id === "string")
  assert(id.length > 5)
})

Deno.test("escapeHtml - escapes", () => {
  assertEquals(escapeHtml('<div>&"'), "&lt;div&gt;&amp;&quot;")
  assertEquals(escapeHtml("no special"), "no special")
})
