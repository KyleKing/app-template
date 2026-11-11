import { mkdir, readdir, readFile, watch, writeFile } from "node:fs/promises"
import { join } from "node:path"
import ts from "typescript"

const sharedDir = join(process.cwd(), "shared")
const outDir = join(process.cwd(), "public", "shared")

// Every `shared/*.ts` module is isomorphic by convention and shipped to the browser, so the
// list is derived rather than maintained. Tests and benchmarks stay server-side.
async function collectClientFiles(): Promise<string[]> {
  const files: string[] = []
  for (const entry of await readdir(sharedDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) continue
    if (entry.name.endsWith("_test.ts") || entry.name.endsWith("_bench.ts")) continue
    files.push(entry.name)
  }
  return files.sort()
}

async function buildClient() {
  await mkdir(outDir, { recursive: true })

  for (const tsFile of await collectClientFiles()) {
    const source = await readFile(join(sharedDir, tsFile), "utf8")
    const { outputText } = ts.transpileModule(source, {
      fileName: tsFile,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        rewriteRelativeImportExtensions: true,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: true,
      },
    })
    await writeFile(join(outDir, tsFile.replace(/\.ts$/, ".js")), outputText)
  }
}

if (process.argv.includes("--watch")) {
  console.log("Watching for changes...")

  for await (const event of watch(sharedDir)) {
    if (event.eventType === "change") {
      console.log(`File changed: ${event.filename}`)
      await buildClient()
    }
  }
} else {
  await buildClient()
}
