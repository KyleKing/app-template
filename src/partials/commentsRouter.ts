import { Hono } from "hono"
import { addComment, listComments } from "@/partials/commentsStore.ts"
import { renderTemplate } from "@/templates/engine.ts"
import { handleApiError } from "@/utils/errorHandler.ts"

export const commentsRouter = new Hono()

commentsRouter.get("/comments", async (c) => {
  try {
    const comments = listComments()
    const html = await renderTemplate("partials/commentList.vto", { comments })
    return c.html(html)
  } catch (error) {
    return handleApiError(error, c, { message: "Failed to load comments", responseType: "html" })
  }
})

commentsRouter.post("/comments", async (c) => {
  try {
    const form = await c.req.parseBody()
    const author = (form["author"] || "").toString().slice(0, 32).trim() || "Anon"
    const body = (form["body"] || "").toString().slice(0, 280).trim()
    if (!body) {
      return c.text("Comment body required", 400)
    }
    const comment = addComment({ author: author, body: body })
    const html = await renderTemplate("partials/commentItem.vto", { comment })
    return c.html(html)
  } catch (error) {
    return handleApiError(error, c, { message: "Failed to add comment", responseType: "html" })
  }
})
