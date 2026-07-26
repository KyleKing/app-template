import { join } from "@std/path"
import { transpile } from "@deno/emit"

const sharedDir = join(Deno.cwd(), "shared")
const outDir = join(Deno.cwd(), "public", "shared")

// Every `shared/*.ts` module is isomorphic by convention and shipped to the browser, so the
// list is derived rather than maintained. Tests and benchmarks stay server-side.
async function collectClientFiles(): Promise<string[]> {
  const files: string[] = []
  for await (const entry of Deno.readDir(sharedDir)) {
    if (!entry.isFile || !entry.name.endsWith(".ts")) continue
    if (entry.name.endsWith("_test.ts") || entry.name.endsWith("_bench.ts")) continue
    files.push(entry.name)
  }
  return files.sort()
}

async function buildClient() {
  await Deno.mkdir(outDir, { recursive: true })

  for (const tsFile of await collectClientFiles()) {
    const jsFile = tsFile.replace(".ts", ".js")
    const tsPath = join(sharedDir, tsFile)
    const jsPath = join(outDir, jsFile)

    const tsUrl = new URL(tsPath, import.meta.url)
    const result = await transpile(tsUrl)
    const jsContent = result.get(tsUrl.href)
    if (!jsContent) throw new Error(`Failed to transpile ${tsFile}`)

    await Deno.writeTextFile(jsPath, jsContent)
  }
}

if (Deno.args.includes("--watch")) {
  console.log("Watching for changes...")

  const watcher = Deno.watchFs(sharedDir)

  for await (const event of watcher) {
    if (event.kind === "modify") {
      console.log(`File changed: ${event.paths[0]}`)
      await buildClient()
    }
  }
} else {
  await buildClient()
}
