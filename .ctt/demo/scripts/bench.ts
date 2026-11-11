import { glob } from "node:fs/promises"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

for await (const file of glob("{src,shared}/**/*_bench.ts")) {
  console.log(`\n${file}`)
  await import(pathToFileURL(resolve(file)).href)
}
