import { api } from "@/api.ts"
import { extendLogContext, getLogContext, initializeContext } from "@/logContext.ts"
import { commentsRouter } from "@/partials/commentsRouter.ts"
import { renderPage } from "@/templates/helpers.ts"
import { getEnvConfig } from "@/utils/env.ts"
import { handleApiError } from "@/utils/errorHandler.ts"
import { configure, getConsoleSink, getLogger } from "@logtape/logtape"
import { Hono } from "hono"
import { serveStatic } from "hono/deno"
import { MAX_AUTHOR_LEN, MAX_BODY_LEN } from "~/commentShape.ts"

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

// Security headers middleware
app.use("*", async (c, next) => {
  await next()
  c.res.headers.set("X-Content-Type-Options", "nosniff")
  c.res.headers.set("X-Frame-Options", "DENY")
  c.res.headers.set("X-XSS-Protection", "1; mode=block")
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  c.res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'",
  )
})

// Logging middleware
app.use("*", async (c, next) => {
  const startTime = performance.now()

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
        userAgent: c.req.header("User-Agent"),
        acceptLanguage: c.req.header("Accept-Language"),
        origin: c.req.header("Origin"),
        xForwardedProto: c.req.header("X-Forwarded-Proto"),
        requestSize: c.req.header("Content-Length"),
      })

      await next()

      extendLogContext({
        status: c.res.status,
        duration: performance.now() - startTime,
        // PLANNED: responseSize: c.res.headers.get("Content-Length"),
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
    onFound: (_path, c) => {
      // Cache static assets for 1 year (immutable for hashed assets)
      c.header("Cache-Control", "public, max-age=31536000, immutable")
    },
  }),
)

export { app }
