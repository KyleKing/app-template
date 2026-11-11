// Usage: node scripts/migrate-to-node.ts [project-dir]. Exits 1 while call sites remain that need a manual fix.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"

const SCANNED_FILE = /\.(?:md|ts|vto)$/
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
const ASSERT_THROWS = { assertRejects: "assert.rejects", assertThrows: "assert.throws" }
const BDD_NAMES = new Set(["afterEach", "beforeEach", "describe", "it"])

const SPECIFIER_PATTERN = /(\bfrom\s*|\bimport\s*\(?\s*)(["'])([^"'\n]+)\2/g
const ASSERT_IMPORT_PATTERN = /import\s*\{([^}]*)\}\s*from\s*["']@std\/assert["']\n?/g
const BDD_IMPORT_PATTERN = /(import\s*\{([^}]*)\}\s*from\s*)["']@std\/testing\/bdd["']/g
const NODE_TEST_IMPORT_PATTERN = /import\s*\{([^}]*)\}\s*from\s*"node:test"/
const DENO_COMMANDS = [[/\bdeno task ([\w:-]+)/g, "pnpm $1"], [/\bdeno install\b/g, "pnpm install"]] as const

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRS.has(entry.name)) yield* walk(join(dir, entry.name))
    } else if (SCANNED_FILE.test(entry.name)) {
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
    if (ch === '"' || ch === "'" || ch === "`") {
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
    if (ch === '"' || ch === "'" || ch === "`") {
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

function rewriteThrows(source: string, name: keyof typeof ASSERT_THROWS): { source: string; kept: boolean } {
  const pattern = new RegExp(`(?<![\\w.$])${name}\\(`, "g")
  let result = ""
  let cursor = 0
  let kept = false
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    const open = match.index + match[0].length - 1
    const close = closingParen(source, open)
    if (close === -1) break
    if (splitArguments(source.slice(open + 1, close)).length > 2) {
      kept = true
      continue
    }
    result += `${source.slice(cursor, match.index)}${ASSERT_THROWS[name]}(`
    cursor = open + 1
  }
  return { source: result + source.slice(cursor), kept }
}

function rewriteAssertions(source: string): string {
  if (source.search(ASSERT_IMPORT_PATTERN) === -1) return source
  let next = rewriteStringIncludes(source)
  const keptNames: string[] = []
  for (const name of Object.keys(ASSERT_THROWS) as Array<keyof typeof ASSERT_THROWS>) {
    const result = rewriteThrows(next, name)
    next = result.source
    if (result.kept) keptNames.push(name)
  }
  for (const [name, replacement] of Object.entries(ASSERT_RENAMES)) {
    next = next.replace(new RegExp(`(?<![\\w.$])${name}\\(`, "g"), `${replacement}(`)
  }
  return next.replace(ASSERT_IMPORT_PATTERN, (_, names: string) => {
    const wanted = names.split(",").map((n) => n.trim()).filter(Boolean)
    const known = [...Object.keys(ASSERT_RENAMES), ASSERT_STRING_INCLUDES, ...Object.keys(ASSERT_THROWS)]
    const leftover = wanted.filter((n) => !known.includes(n) || keptNames.includes(n))
    const converted = wanted.length > leftover.length
    return `${converted ? 'import assert from "node:assert/strict"\n' : ""}${
      leftover.length ? `import { ${leftover.join(", ")} } from "@std/assert"\n` : ""
    }`
  })
}

function rewriteTests(source: string): string {
  const next = source.replace(/(?<![\w.$])Deno\.test\(\s*(?=["'`])/g, (call) => call.replace("Deno.test", "test"))
  if (next === source) return next
  const existing = NODE_TEST_IMPORT_PATTERN.exec(next)
  if (existing) {
    const names = existing[1].split(",").map((n) => n.trim()).filter(Boolean)
    if (names.includes("test")) return next
    return next.replace(NODE_TEST_IMPORT_PATTERN, `import { ${[...names, "test"].sort().join(", ")} } from "node:test"`)
  }
  if (/import[^;\n]*\btest\b[^;\n]*from/.test(next)) return next
  return `import { test } from "node:test"\n${next}`
}

function migrateText(source: string): string {
  return DENO_COMMANDS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), source)
}

function migrate(source: string, file: string): string {
  const rewritten = source
    .replace(BDD_IMPORT_PATTERN, (statement, lead: string, names: string) => {
      const wanted = names.split(",").map((n) => n.trim()).filter(Boolean)
      return wanted.every((n) => BDD_NAMES.has(n)) ? `${lead}"node:test"` : statement
    })
    .replace(
      SPECIFIER_PATTERN,
      (_, lead: string, quote: string, specifier: string) =>
        `${lead}${quote}${rewriteSpecifier(specifier, file)}${quote}`,
    )
  return rewriteTests(rewriteAssertions(rewritten))
}

const REMOTE_SPECIFIER = /^(?:@std\/|jsr:|npm:|https?:\/\/)/

const NON_ERASABLE = [
  /^\s*(?:export\s+)?(?:declare\s+)?(?:const\s+)?enum\s/,
  /^\s*(?:export\s+)?(?:declare\s+)?namespace\s/,
]
const PARAMETER_PROPERTY = /\bconstructor\s*\(([^)]*)\)/g
const PARAMETER_MODIFIER = /\b(?:public|private|protected|readonly)\s+[\w$]+/

function nonErasableLines(source: string): Set<number> {
  const lines = new Set<number>()
  source.split("\n").forEach((line, index) => {
    if (NON_ERASABLE.some((pattern) => pattern.test(line))) lines.add(index + 1)
  })
  for (const match of source.matchAll(PARAMETER_PROPERTY)) {
    if (PARAMETER_MODIFIER.test(match[1])) lines.add(source.slice(0, match.index).split("\n").length)
  }
  return lines
}

function leftovers(source: string, file: string): string[] {
  const unerasable = file.endsWith(".ts") ? nonErasableLines(source) : new Set<number>()
  return source.split("\n").flatMap((line, index) => {
    const remote = [...line.matchAll(SPECIFIER_PATTERN)].some((match) => REMOTE_SPECIFIER.test(match[3]))
    const flagged = remote || /\bdeno\b/i.test(line) || unerasable.has(index + 1)
    return flagged ? [`${relative(root, file)}:${index + 1}: ${line.trim()}`] : []
  })
}

const root = resolve(process.argv[2] ?? ".")
const changed: string[] = []
const remaining: string[] = []

for (const file of walk(root)) {
  const original = readFileSync(file, "utf8")
  const migrated = migrateText(file.endsWith(".ts") ? migrate(original, file) : original)
  if (migrated !== original) {
    writeFileSync(file, migrated)
    changed.push(file)
  }
  remaining.push(...leftovers(migrated, file))
}

console.log(`Rewrote ${changed.length} files`)
for (const file of changed) console.log(`  ${relative(root, file)}`)
if (remaining.length) {
  console.log(`\n${remaining.length} call sites need a manual fix:`)
  for (const line of remaining) console.log(`  ${line}`)
  process.exit(1)
}
