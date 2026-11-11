// Usage: node scripts/migrate-to-node.ts [project-dir]. Exits 1 while call sites remain that need a manual fix.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const SKIPPED_DIRS = new Set([".git", "coverage", "dist", "node_modules", "public"])

const SPECIFIERS: Record<string, string> = {
  "@std/path": "node:path",
  "hono/deno": "@hono/node-server/serve-static",
  "vento/mod.ts": "ventojs",
}

const PREFIXES: Array<[string, string]> = [["@/", "#src/"], ["~/", "#shared/"]]

const ASSERT_RENAMES: Record<string, string> = {
  assert: "assert.ok",
  assertEquals: "assert.deepEqual",
  assertMatch: "assert.match",
  assertNotEquals: "assert.notDeepEqual",
  assertNotMatch: "assert.doesNotMatch",
  assertStrictEquals: "assert.equal",
}
const ASSERT_STRING_INCLUDES = "assertStringIncludes"

const SPECIFIER_PATTERN = /(\bfrom\s*|\bimport\s*\(?\s*)(["'])([^"'\n]+)\2/g
const ASSERT_IMPORT_PATTERN = /import\s*\{([^}]*)\}\s*from\s*["']@std\/assert["']\n?/g

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) yield* walk(join(dir, entry.name))
    } else if (entry.name.endsWith(".ts")) {
      yield join(dir, entry.name)
    }
  }
}

function withExtension(specifier: string, file: string): string {
  const target = resolve(dirname(file), specifier)
  if (/\.[cm]?[jt]s$/.test(specifier)) return specifier
  if (existsSync(`${target}.ts`)) return `${specifier}.ts`
  if (existsSync(target) && statSync(target).isDirectory() && existsSync(join(target, "index.ts"))) {
    return `${specifier.replace(/\/$/, "")}/index.ts`
  }
  return specifier
}

function rewriteSpecifier(specifier: string, file: string): string {
  if (SPECIFIERS[specifier]) return SPECIFIERS[specifier]
  for (const [from, to] of PREFIXES) {
    if (specifier.startsWith(from)) return to + specifier.slice(from.length)
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) return withExtension(specifier, file)
  return specifier
}

function closingParen(source: string, open: number): number {
  let depth = 0
  for (let i = open; i < source.length; i++) {
    const ch = source[i]
    if (ch === "\"" || ch === "'" || ch === "`") {
      for (i++; i < source.length && source[i] !== ch; i++) if (source[i] === "\\") i++
    } else if (ch === "(" || ch === "[" || ch === "{") depth++
    else if (ch === ")" || ch === "]" || ch === "}") {
      if (--depth === 0) return i
    }
  }
  return -1
}

function splitArguments(args: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < args.length; i++) {
    const ch = args[i]
    if (ch === "\"" || ch === "'" || ch === "`") {
      for (i++; i < args.length && args[i] !== ch; i++) if (args[i] === "\\") i++
    } else if (ch === "(" || ch === "[" || ch === "{") depth++
    else if (ch === ")" || ch === "]" || ch === "}") depth--
    else if (ch === "," && depth === 0) {
      parts.push(args.slice(start, i).trim())
      start = i + 1
    }
  }
  const last = args.slice(start).trim()
  if (last) parts.push(last)
  return parts
}

function rewriteStringIncludes(source: string): string {
  const pattern = new RegExp(`(?<![\\w.$])${ASSERT_STRING_INCLUDES}\\(`, "g")
  let result = ""
  let cursor = 0
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    const open = match.index + match[0].length - 1
    const close = closingParen(source, open)
    if (close === -1) break
    const [actual, expected, message] = splitArguments(source.slice(open + 1, close))
    const receiver = /^[\w$.]+$/.test(actual) ? actual : `(${actual})`
    const condition = `${receiver}.includes(${expected})`
    result += `${source.slice(cursor, match.index)}assert.ok(${[condition, message].filter(Boolean).join(", ")})`
    cursor = close + 1
    pattern.lastIndex = cursor
  }
  return result + source.slice(cursor)
}

function rewriteAssertions(source: string): string {
  let imported = false
  let leftover = ""
  let next = source.replace(ASSERT_IMPORT_PATTERN, (_, names: string) => {
    const wanted = names.split(",").map((n) => n.trim()).filter(Boolean)
    const supported = wanted.filter((n) => n in ASSERT_RENAMES || n === ASSERT_STRING_INCLUDES)
    if (supported.length) imported = true
    const unsupported = wanted.filter((n) => !supported.includes(n))
    if (unsupported.length) leftover = `import { ${unsupported.join(", ")} } from "@std/assert"\n`
    return `${supported.length ? "import assert from \"node:assert/strict\"\n" : ""}${leftover}`
  })
  if (!imported) return next
  next = rewriteStringIncludes(next)
  for (const [name, replacement] of Object.entries(ASSERT_RENAMES)) {
    next = next.replace(new RegExp(`(?<![\\w.$])${name}\\(`, "g"), `${replacement}(`)
  }
  return next
}

function rewriteTests(source: string): string {
  const next = source.replace(/(?<![\w.$])Deno\.test\(\s*(?=["'`])/g, (call) => call.replace("Deno.test", "test"))
  if (next === source || /import[^;\n]*\btest\b[^;\n]*from/.test(next)) return next
  return `import { test } from "node:test"\n${next}`
}

function migrate(source: string, file: string): string {
  const rewritten = source.replace(
    SPECIFIER_PATTERN,
    (_, lead: string, quote: string, specifier: string) =>
      `${lead}${quote}${rewriteSpecifier(specifier, file)}${quote}`,
  )
  return rewriteTests(rewriteAssertions(rewritten))
}

const LEFTOVER_PATTERNS = [/\bDeno\./, /["'](?:@std\/|jsr:|npm:|https?:\/\/)[^"']*["']/]

function leftovers(source: string, file: string): string[] {
  return source.split("\n").flatMap((line, index) =>
    LEFTOVER_PATTERNS.some((pattern) => pattern.test(line)) ? [`${file}:${index + 1}: ${line.trim()}`] : []
  )
}

const root = resolve(process.argv[2] ?? ".")
const changed: string[] = []
const remaining: string[] = []

for (const file of walk(root)) {
  const original = readFileSync(file, "utf8")
  const migrated = migrate(original, file)
  if (migrated !== original) {
    writeFileSync(file, migrated)
    changed.push(file)
  }
  remaining.push(...leftovers(migrated, file))
}

console.log(`Rewrote ${changed.length} files`)
for (const file of changed) console.log(`  ${file}`)
if (remaining.length) {
  console.log(`\n${remaining.length} call sites need a manual fix:`)
  for (const line of remaining) console.log(`  ${line}`)
  process.exit(1)
}
