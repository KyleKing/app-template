import { getLogger } from "@logtape/logtape"
import type { Context } from "hono"

export interface ErrorContext {
  [key: string]: any
}

export interface ApiErrorOptions {
  message?: string
  statusCode?: number
  context?: ErrorContext
  responseType?: "html" | "json" | "text"
}

export function handleApiError(
  error: unknown,
  c: Context,
  options: ApiErrorOptions = {},
): Response {
  const err = error as Error

  const {
    message = "An error occurred",
    statusCode = 500,
    context = {},
    responseType = c.req.path.startsWith("/iapi/") ? "json" : "html",
  } = options

  const logger = getLogger(["app"])
  logger.error(message, {
    error: { name: err.name, message: err.message, stack: err.stack },
    request: { method: c.req.method, path: c.req.path },
    ...context,
  })

  if (responseType === "json") {
    return c.json({ error: message, details: err.message }, statusCode as any)
  }
  if (responseType === "text") {
    return c.text(`${message}: ${err.message}`, statusCode as any)
  }
  const html = `<div class="error"><h1>Error</h1><p>${err.message}</p></div>`
  return c.html(html, statusCode as any)
}
