import { execFileSync } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { build } from "esbuild"

const { name } = JSON.parse(await readFile("package.json", "utf8"))
const seaConfig = "dist/sea-config.json"

await mkdir("dist", { recursive: true })
await build({
  entryPoints: ["scripts/app-server.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node26",
  outfile: "dist/bundle.mjs",
})
await writeFile(
  seaConfig,
  JSON.stringify({
    main: "dist/bundle.mjs",
    mainFormat: "module",
    output: `dist/${name}`,
    execArgv: ["--permission", "--allow-fs-read=.", "--allow-net"],
    disableExperimentalSEAWarning: true,
  }),
)
execFileSync(process.execPath, ["--build-sea", seaConfig], { stdio: "inherit" })
// macOS kills a binary whose signature the injected blob invalidated
if (process.platform === "darwin") {
  execFileSync("codesign", ["--force", "--sign", "-", `dist/${name}`], { stdio: "inherit" })
}
