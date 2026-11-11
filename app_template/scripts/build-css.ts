import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { join, relative } from "node:path"

const stylesDir = join(process.cwd(), "styles")
const publicDir = join(process.cwd(), "public")

// Cascade order: tokens define the custom properties everything else reads, base sets the
// element defaults, then components layer on top. Anything unlisted is appended alphabetically
// so a new `styles/components/*.css` is picked up without editing this script.
const leadingFiles = ["tokens.css", "base.css"]

async function collectStyles(): Promise<string[]> {
  const found: string[] = []
  for (const entry of await readdir(stylesDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const nested of await readdir(join(stylesDir, entry.name), { withFileTypes: true })) {
        if (nested.isFile() && nested.name.endsWith(".css")) {
          found.push(join(entry.name, nested.name))
        }
      }
    } else if (entry.isFile() && entry.name.endsWith(".css")) {
      found.push(entry.name)
    }
  }

  const leading = leadingFiles.filter((name) => found.includes(name))
  const rest = found.filter((name) => !leading.includes(name)).sort()
  return [...leading, ...rest]
}

async function buildCss({ minify = false }) {
  const files = await collectStyles()

  let css = ""
  for (const file of files) {
    const path = join(stylesDir, file)
    const content = await readFile(path, "utf8")
    css += `${content}\n`
  }

  if (minify) {
    // Simple minification: remove comments, extra whitespace
    css = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*{\s*/g, "{").replace(/\s*}\s*/g, "}")
      .replace(/\s*;\s*/g, ";").replace(/;\s*}/g, "}").trim()
  }

  await mkdir(publicDir, { recursive: true })
  const outPath = join(publicDir, "styles.min.css")
  await writeFile(outPath, css.trim())
  console.log(
    `CSS built${minify ? " (minified)" : ""} from ${files.length} files to ${relative(process.cwd(), outPath)}`,
  )
}

await buildCss({ minify: process.argv.includes("--minify") })
