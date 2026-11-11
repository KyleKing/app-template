import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

const script = join(import.meta.dirname, "migrate-to-node.ts")

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "migrate-"))
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return dir
}

test("rewrites imports, tests, and assertions, then reports what is left", () => {
  const dir = project({
    "src/util.ts": "export const x = 1\n",
    "src/util_test.ts": [
      'import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert"',
      'import { describe, it } from "@std/testing/bdd"',
      'import { join } from "@std/path"',
      'import { x } from "./util"',
      'import { y } from "~/shared.ts"',
      'import { app } from "@/app.ts"',
      "",
      'Deno.test("x", () => {',
      "  assertEquals(x, 1)",
      '  assertStringIncludes(join("a", "b"), "a", "msg, with comma")',
      "  assertThrows(() => Deno.cwd())",
      '  assertThrows(() => Deno.cwd(), Error, "msg")',
      "})",
      "",
    ].join("\n"),
    "src/ticket.ts":
      "export enum Status {\n  Open,\n}\nexport class Ticket {\n  constructor(public id: number) {}\n}\n",
    "README.md": "Run `deno task dev` after `deno install`, or `deno run x.ts`\n",
  })
  try {
    const result = spawnSync(process.execPath, [script, dir], { encoding: "utf8" })
    assert.equal(result.status, 1)
    assert.match(result.stdout, /src\/util_test\.ts:\d+: import \{ assertThrows \} from "@std\/assert"/)
    assert.match(result.stdout, /src\/util_test\.ts:\d+: assertThrows\(\(\) => Deno\.cwd\(\), Error, "msg"\)/)
    assert.match(result.stdout, /README\.md:1: Run `pnpm dev` after `pnpm install`, or `deno run x\.ts`/)
    assert.match(result.stdout, /src\/ticket\.ts:1: export enum Status \{/)
    assert.match(result.stdout, /src\/ticket\.ts:5: constructor\(public id: number\) \{\}/)

    assert.equal(
      readFileSync(join(dir, "src/util_test.ts"), "utf8"),
      [
        'import assert from "node:assert/strict"',
        'import { assertThrows } from "@std/assert"',
        'import { describe, it, test } from "node:test"',
        'import { join } from "node:path"',
        'import { x } from "./util.ts"',
        'import { y } from "#shared/shared.ts"',
        'import { app } from "#src/app.ts"',
        "",
        'test("x", () => {',
        "  assert.deepEqual(x, 1)",
        '  assert.ok((join("a", "b")).includes("a"), "msg, with comma")',
        "  assert.throws(() => Deno.cwd())",
        '  assertThrows(() => Deno.cwd(), Error, "msg")',
        "})",
        "",
      ].join("\n"),
    )
  } finally {
    rmSync(dir, { recursive: true })
  }
})
