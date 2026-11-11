import { serve } from "@hono/node-server"
import { app } from "#src/app.ts"
import { getEnvConfig } from "#src/utils/env.ts"

const config = getEnvConfig()

serve({ fetch: app.fetch, port: config.PORT, hostname: config.HOST }, ({ address, port }) => {
  console.log(`Server listening at http://${address}:${port}`)
  console.log(`Environment: ${config.NODE_ENV}`)
  console.log(`Log level: ${config.LOG_LEVEL}`)
})
