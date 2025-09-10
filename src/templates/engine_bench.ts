import { assertEquals } from "@std/assert"
import { renderTemplate } from "@/templates/engine.ts"

Deno.bench("Template Engine - render template with large dataset", async () => {
  const pathTemplate = "./src/templates/layouts/bench-complex.vto"
  const benchTemplate = `
  <div class="items">
    {{ for item of items }}
    <div class="item-{{ item.id }}">
      <h2>{{ item.name }}</h2>
      <p>{{ item.description }}</p>
      <div class="tags">
        {{ for tag of item.tags }}
        <span class="tag">{{ tag }}</span>
        {{ /for }}
      </div>
      <div class="metadata">
        <p>Created: {{ item.metadata.created }}</p>
        <p>Updated: {{ item.metadata.updated }}</p>
        <p>Views: {{ item.metadata.views }}</p>
      </div>
    </div>
    {{ /for }}
  </div>
`
  await Deno.writeTextFile(pathTemplate, benchTemplate)
  const data = {
    items: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `This is a description for item ${i} with some additional text to make it longer`,
      tags: [`tag${i}`, `category${i % 10}`, `type${i % 5}`],
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        views: Math.floor(Math.random() * 10000),
      },
    })),
  }

  try {
    const result = await renderTemplate("layouts/bench-complex.vto", data)

    assertEquals(typeof result, "string", `${result}`)
    assertEquals(result.includes("<h2>Item 999</h2>"), true, `${result}`)
    assertEquals(result.includes("<p>This is a description for item 101 with "), true, `${result}`)
  } finally {
    await Deno.remove(pathTemplate)
  }
})
