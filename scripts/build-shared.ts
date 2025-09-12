import { copy } from "node:fs/promises"
import { join } from "node:path"
import { transpile } from "@x/emit/mod.ts"

const clientFiles = ["commentShape.ts"]

async function buildClient() {
  const outDir = join(Deno.cwd(), "public", "shared")
  await Deno.mkdir(outDir, { recursive: true })

  for (const tsFile of clientFiles) {
    const jsFile = tsFile.replace(".ts", ".js")
    const tsPath = join(Deno.cwd(), "shared", tsFile)
    const jsPath = join(outDir, jsFile)

    const tsUrl = new URL(tsPath, import.meta.url)
    const result = await transpile(tsUrl)
    const jsContent = result.get(tsUrl.href)
    if (!jsContent) throw new Error("Failed to transpile JS file")

    await Deno.writeTextFile(jsPath, jsContent)
  }
}

if (Deno.args.includes("--watch")) {
  console.log("Watching for changes...")

  const watcher = Deno.watchFs(
    clientFiles.map((file) => join(Deno.cwd(), file)),
  )

  for await (const event of watcher) {
    if (event.kind === "modify") {
      console.log(`File changed: ${event.paths[0]}`)
      await buildClient()
    }
  }
} else {
  await buildClient()
}
