import { commentsRouter } from "@/partials/commentsRouter.ts"
import { renderPage } from "@/templates/helpers.ts"
import { handleApiError } from "@/utils/errorHandler.ts"
import type { Hono } from "hono"
import { MAX_AUTHOR_LEN, MAX_BODY_LEN } from "~/commentShape.ts"

export function registerRoutes(app: Hono) {
  app.route("/partials", commentsRouter)

  app.get("/comments", async (c) => {
    try {
      return await renderPage("pages/comments.vto", { MAX_AUTHOR_LEN, MAX_BODY_LEN }, "Comments", c)
    } catch (error) {
      return handleApiError(error, c, { message: "Error rendering comments page", responseType: "html" })
    }
  })

  // The optional parameter is echoed back into the page to demonstrate Vento's autoescaping
  app.get("/:name?", async (c) => {
    try {
      const { name } = c.req.param()
      const data = { name: name || "..." }
      return await renderPage("pages/home.vto", data, data.name, c)
    } catch (error) {
      return handleApiError(error, c, { message: "Error rendering home page", responseType: "html" })
    }
  })
}
