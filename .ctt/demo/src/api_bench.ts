import { Bench } from "tinybench"
import { app } from "#src/app.ts"

const bench = new Bench()

bench.add("API /healthz endpoint", async () => {
  const response = await app.request("http://localhost/iapi/healthz")
  await response.json()
})

await bench.run()
console.table(bench.table())
