import vento from "vento/mod.ts"
import { autoTrim } from "@/utils/autoTrim.ts"

// Docs: https://vento.js.org/configuration
export const engine = vento({ autoescape: true })

export async function renderTemplate(name: string, data: Record<string, unknown> = {}) {
  const template = await engine.load(`./src/templates/${name}`)
  const result = await template(data)
  return autoTrim(result.content)
}
