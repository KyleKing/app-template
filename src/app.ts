import { configure, getConsoleSink, getLogger } from "@logtape/logtape"
import { Hono } from "hono"
import { serveStatic } from "hono/deno"
import { api } from "@/api.ts"
import { commentsRouter } from "@/partials/commentsRouter.ts"
import { renderPage } from "@/templates/helpers.ts"
import { handleApiError } from "@/utils/errorHandler.ts"
import { getEnvConfig } from "@/utils/env.ts"
import { MAX_AUTHOR_LEN, MAX_BODY_LEN } from "~/commentShape.ts"
import { dirname, join } from "@std/path"
import { extendLogContext, getLogContext, initializeContext } from "@/logContext.ts"

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
          ...(getLogContext() || {}),
        }
        return JSON.stringify(logEntry)
      },
    }),
  },
  loggers: [
    { category: ["app"], sinks: ["console"], lowestLevel: getEnvConfig().LOG_LEVEL },
    { category: ["logtape", "meta"], sinks: ["console"], lowestLevel: "warning" },
  ],
})

const app = new Hono()
const logger = getLogger(["app"])

app.use("*", async (c, next) => {
  const startTime = Date.now()

  await initializeContext(
    async () => {
      extendLogContext({
        host: c.req.header("Host"),
        ipAddress: c.req.header("X-Forwarded-For"),
        method: c.req.method,
        path: c.req.path,
        referer: c.req.header("Referer"),
        requestId: crypto.randomUUID(),
        url: c.req.url,
        contentType: c.req.header("Content-Type"),
      })

      await next()

      const uptime = Math.floor(Deno.osUptime() * 1000) // ms
      const memoryUsage = Deno.memoryUsage()
      const systemMemory = Deno.systemMemoryInfo()

      extendLogContext({
        status: c.res.status,
        duration: Date.now() - startTime,
        responseSize: c.res.headers.get("Content-Length"),
        uptime,
        memoryUsage: {
          rss: memoryUsage.rss,
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
        },
        systemMemory: {
          total: systemMemory.total,
          free: systemMemory.free,
          available: systemMemory.available,
        },
        responseContentType: c.res.headers.get("Content-Type"),
      })

      if (c.res.status >= 500) {
        logger.error("Request completed")
      } else if (c.res.status >= 400) {
        logger.warning("Request completed")
      } else {
        logger.info("Request completed")
      }
    },
  )
})

app.onError((err, c) => {
  return handleApiError(err, c, { message: "Request error" })
})

app.route("/iapi", api)
app.route("/partials", commentsRouter)

app.get("/comments", async (c) => {
  try {
    return await renderPage("pages/comments.vto", { MAX_AUTHOR_LEN, MAX_BODY_LEN }, "Comments", c)
  } catch (error) {
    return handleApiError(error, c, { message: "Error rendering comments page", responseType: "html" })
  }
})

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
    // PLANNED: Revisit support of compression: https://docs.deno.com/deploy/api/compression
    // precompressed: true,
    root: "./",
  }),
)

export { app }
