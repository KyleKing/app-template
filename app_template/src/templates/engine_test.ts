import { renderTemplate } from "@/templates/engine.ts"
import { assertEquals } from "@std/assert"

Deno.test("renderTemplate - renders simple template", async () => {
  const pathTemplate = "./src/templates/layouts/test-template.vto"
  const testTemplate = "Hello {{ name }}!"
  await Deno.writeTextFile(pathTemplate, testTemplate)

  try {
    const result = await renderTemplate("layouts/test-template.vto", { name: "World" })
    assertEquals(result, "Hello World!")
  } finally {
    await Deno.remove(pathTemplate)
  }
})

Deno.test("renderTemplate - handles complex data structures", async () => {
  const pathTemplate = "./src/templates/layouts/test-complex.vto"
  const testTemplate = "{{ for item of items }}{{ item.name }}: {{ item.value }}\n{{ /for }}"
  await Deno.writeTextFile(pathTemplate, testTemplate)

  try {
    const result = await renderTemplate("layouts/test-complex.vto", {
      items: [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ],
    })
    assertEquals(result, "A: 1\nB: 2")
  } finally {
    await Deno.remove(pathTemplate)
  }
})

Deno.test("renderTemplate - handles conditional rendering", async () => {
  const pathTemplate = "./src/templates/layouts/test-conditional.vto"
  const testTemplate = "{{ if show }}Visible{{ else }}Hidden{{ /if }}"
  await Deno.writeTextFile(pathTemplate, testTemplate)

  try {
    const result1 = await renderTemplate("layouts/test-conditional.vto", { show: true })
    assertEquals(result1, "Visible")

    const result2 = await renderTemplate("layouts/test-conditional.vto", { show: false })
    assertEquals(result2, "Hidden")
  } finally {
    await Deno.remove(pathTemplate)
  }
})
