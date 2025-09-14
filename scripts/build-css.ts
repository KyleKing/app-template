import { join } from "@std/path"

const stylesDir = join(Deno.cwd(), "styles")
const publicDir = join(Deno.cwd(), "public")

async function buildCss({ minify = false }) {
  const files = [
    "tokens.css",
    "base.css",
    "components/nav.css",
    "components/comment.css",
  ]

  let css = ""
  for (const file of files) {
    const path = join(stylesDir, file)
    const content = await Deno.readTextFile(path)
    css += `${content}\n`
  }

  const outPath = join(publicDir, "styles.min.css")
  if (minify) {
    // Simple minification: remove comments, extra whitespace
    css = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*{\s*/g, "{").replace(/\s*}\s*/g, "}")
      .replace(/\s*;\s*/g, ";").replace(/;\s*}/g, "}").trim()
  }

  await Deno.writeTextFile(outPath, css.trim())
  console.log(`CSS built${minify ? " (minified)" : ""} to ${outPath}`)
}

await buildCss({ minify: Deno.args.includes("--minify") })
