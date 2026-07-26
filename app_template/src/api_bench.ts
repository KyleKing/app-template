import { app } from "@/app.ts"

Deno.bench("API /healthz endpoint", async () => {
  const response = await app.request("http://localhost/iapi/healthz")
  await response.json()
})
