import { renderPage } from "@/templates/helpers.ts"
import { handleApiError } from "@/utils/errorHandler.ts"
import type { Hono } from "hono"

/**
 * Register the application's page routes.
 *
 * The template seeds this file once and never overwrites it, so project-specific routes
 * and their supporting routers belong here rather than in `app.ts`.
 */
export function registerRoutes(app: Hono) {
  app.get("/", async (c) => {
    try {
      return await renderPage("pages/home.vto", {}, "Home", c)
    } catch (error) {
      return handleApiError(error, c, { message: "Error rendering home page", responseType: "html" })
    }
  })
}
