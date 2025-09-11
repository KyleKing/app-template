import { configure, getConsoleSink, getLogger, withContext } from "@logtape/logtape"
import { Hono } from "hono"
import { serveStatic } from "hono/serve-static"
import { AsyncLocalStorage } from "node:async_hooks"
import { dirname, join } from "node:path"
import { api } from "@/api.ts"
import { renderTemplate } from "@/templates/engine.ts"
import { renderPage } from "@/templates/helpers.ts"
import { handleApiError } from "@/utils/errorHandler.ts"
import { getEnvConfig } from "@/utils/env.ts"
import path from "node:path"

const __dirname = dirname(new URL(import.meta.url).pathname)
const publicRoot = join(__dirname, "../../public")

await configure({
  sinks: {
    console: getConsoleSink({
      formatter: (record) => {
        const logEntry = {
          timestamp: new Date(record.timestamp).toISOString(),
          level: record.level,
          category: record.category,
          message: record.message,
          ...record.properties,
        }
        return JSON.stringify(logEntry)
      },
    }),
  },
  loggers: [
    { category: ["app"], sinks: ["console"], lowestLevel: getEnvConfig().LOG_LEVEL },
    { category: ["logtape", "meta"], sinks: ["console"], lowestLevel: "warning" },
  ],
  contextLocalStorage: new AsyncLocalStorage(),
})

const app = new Hono()
const logger = getLogger(["app"])

app.use("*", async (c, next) => {
  const startTime = Date.now()

  await withContext(
    {
      host: c.req.header("Host"),
      ipAddress: c.req.header("X-Forwarded-For"),
      method: c.req.method,
      path: c.req.path,
      referer: c.req.header("Referer"),
      requestId: crypto.randomUUID(),
      url: c.req.url,
      contentType: c.req.header("Content-Type"),
    },
    async () => {
      await next()

      const uptime = Math.floor(Deno.osUptime() * 1000) // ms
      const ctx = {
        status: c.res.status,
        duration: Date.now() - startTime,
        responseSize: c.res.headers.get("Content-Length"),
        uptime,
      }
      if (c.res.status >= 500) {
        logger.error("Request completed", ctx)
      } else if (c.res.status >= 400) {
        logger.warning("Request completed", ctx)
      } else {
        logger.info("Request completed", ctx)
      }
    },
  )
})

app.onError((err, c) => {
  return handleApiError(err, c, { message: "Request error" })
})

app.route("/iapi", api)

app.get("/:name?", async (c) => {
  try {
    // Demonstration endpoint
    const { name } = c.req.param()
    const data = { name: name || "..." }
    return await renderPage("pages/home.vto", data, data.name, c)
  } catch (error) {
    return handleApiError(error, c, { message: "Error rendering home page", responseType: "html" })
  }
})

app.get(
  "/public/*",
  serveStatic({
    getContent: async (pth) => {
      try {
        const cleanPath = path.join("./public", path.basename(pth))
        const content = await Deno.readFile(cleanPath)
        return new Response(content)
      } catch {
        return null
      }
    },
    precompressed: true,
    root: "./public",
  }),
)
// app.get("/public/*", async (c) => {
//   try {
//     const filePath = `.${c.req.path}`
//     const content = await Deno.readFile(filePath)
//
//     const ext = filePath.split(".").pop()?.toLowerCase()
//     let contentType = "application/octet-stream"
//     switch (ext) {
//       case "js":
//       case "mjs":
//         contentType = "text/javascript"
//         break
//       case "css":
//         contentType = "text/css"
//         break
//       case "json":
//       case "map":
//         contentType = "application/json"
//         break
//       case "svg":
//         contentType = "image/svg+xml"
//         break
//     }
//
//     return c.body(content, 200, { "Content-Type": contentType })
//   } catch (_error) {
//     return c.text("File not found", 404)
//   }
// })

export { app }
