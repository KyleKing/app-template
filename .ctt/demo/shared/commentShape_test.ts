import { test } from "node:test"
import assert from "node:assert/strict"
import { escapeHtml, generateTempId, MAX_AUTHOR_LEN, MAX_BODY_LEN, shapeCommentInput } from "#shared/commentShape.ts"

test("shapeCommentInput - trims text", () => {
  const author = "Tame Impala"
  const body = "Remember Me"
  const input = { author: `   ${author}   `, body: `  ${body}  ` }
  const result = shapeCommentInput(input)

  assert.deepEqual(result.author, author)
  assert.deepEqual(result.body, body)
  assert.deepEqual(result.tempId, undefined)
})

test("shapeCommentInput - max length", () => {
  const longAuthor = "A".repeat(MAX_AUTHOR_LEN + 10)
  const longBody = "B".repeat(MAX_BODY_LEN + 10)
  const result = shapeCommentInput({ author: longAuthor, body: longBody })

  assert.deepEqual(result.author.length, MAX_AUTHOR_LEN)
  assert.deepEqual(result.body.length, MAX_BODY_LEN)
})

test("shapeCommentInput - defaults", () => {
  const defAuthor = "Anon"

  assert.deepEqual(shapeCommentInput({ author: "   ", body: "test" }).author, defAuthor)
  assert.deepEqual(shapeCommentInput({ body: "test" }).author, defAuthor)
  assert.deepEqual(shapeCommentInput({ body: "  " }).body, "")
})

test("shapeCommentInput - tempId", () => {
  assert.deepEqual(shapeCommentInput({ author: "A", body: "B", tempId: 123 }).tempId, "123")
  assert.deepEqual(shapeCommentInput({ author: "A", body: "B", tempId: "xyz" }).tempId, "xyz")
})

test("generateTempId - works", () => {
  const id = generateTempId()

  assert.ok(id.startsWith("temp-"))
  assert.ok(typeof id === "string")
  assert.ok(id.length > 5)
})

test("escapeHtml - escapes", () => {
  assert.deepEqual(escapeHtml('<div>&"'), "&lt;div&gt;&amp;&quot;")
  assert.deepEqual(escapeHtml("no special"), "no special")
})
