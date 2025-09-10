import { app } from "@/app.ts"
import { getEnvConfig, validateEnvConfig } from "@/utils/env.ts"

const config = getEnvConfig()
validateEnvConfig(config)

Deno.serve({
  port: config.PORT,
  hostname: config.HOST,
  onListen: ({ hostname, port }) => {
    console.log(`Server listening at http://${hostname}:${port}`)
    console.log(`Environment: ${config.NODE_ENV}`)
    console.log(`Log level: ${config.LOG_LEVEL}`)
  },
}, app.fetch)
