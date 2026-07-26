import { app } from "@/app.ts"
import { getEnvConfig } from "@/utils/env.ts"

const config = getEnvConfig()

Deno.serve({
  port: config.PORT,
  hostname: config.HOST,
  onListen: ({ hostname, port }) => {
    console.log(`Server listening at http://${hostname}:${port}`)
    console.log(`Environment: ${config.NODE_ENV}`)
    console.log(`Log level: ${config.LOG_LEVEL}`)
  },
}, app.fetch)
