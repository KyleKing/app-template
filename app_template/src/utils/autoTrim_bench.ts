import { Bench } from "tinybench"
import { autoTrim } from "#src/utils/autoTrim.ts"

const bench = new Bench()

bench.add("autoTrim - large HTML", () => {
  const html = Array.from({ length: 100 }, (_, i) => `
    <div class="item-${i}">
      <h2>Item ${i}</h2>
          <p>This is paragraph ${i} with some content that needs trimming.      </p>


      <span>    Additional text ${i}</span>

    </div>
  `).join("\n")
  autoTrim(html)
})

bench.add("autoTrim - already clean HTML", () => {
  const html = "<div><h1>Title</h1><p>Content</p></div>"
  autoTrim(html)
})

await bench.run()
console.table(bench.table())
