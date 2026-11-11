import assert from "node:assert/strict"
import { rm, writeFile } from "node:fs/promises"
import { test } from "node:test"
import { renderTemplate } from "#src/templates/engine.ts"

test("renderTemplate - renders simple template", async () => {
  const pathTemplate = "./src/templates/layouts/test-template.vto"
  const testTemplate = "Hello {{ name }}!"
  await writeFile(pathTemplate, testTemplate)

  try {
    const result = await renderTemplate("layouts/test-template.vto", { name: "World" })
    assert.equal(result, "Hello World!")
  } finally {
    await rm(pathTemplate)
  }
})

test("renderTemplate - handles complex data structures", async () => {
  const pathTemplate = "./src/templates/layouts/test-complex.vto"
  const testTemplate = "{{ for item of items }}{{ item.name }}: {{ item.value }}\n{{ /for }}"
  await writeFile(pathTemplate, testTemplate)

  try {
    const result = await renderTemplate("layouts/test-complex.vto", {
      items: [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ],
    })
    assert.equal(result, "A: 1\nB: 2")
  } finally {
    await rm(pathTemplate)
  }
})

test("renderTemplate - handles conditional rendering", async () => {
  const pathTemplate = "./src/templates/layouts/test-conditional.vto"
  const testTemplate = "{{ if show }}Visible{{ else }}Hidden{{ /if }}"
  await writeFile(pathTemplate, testTemplate)

  try {
    const result1 = await renderTemplate("layouts/test-conditional.vto", { show: true })
    assert.equal(result1, "Visible")

    const result2 = await renderTemplate("layouts/test-conditional.vto", { show: false })
    assert.equal(result2, "Hidden")
  } finally {
    await rm(pathTemplate)
  }
})
