import { Hono } from "hono"
import { addComment, listComments } from "@/partials/commentsStore.ts"
import { renderTemplate } from "@/templates/engine.ts"
import { handleApiError } from "@/utils/errorHandler.ts"
import { shapeCommentInput } from "~/commentShape.ts"

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
    const { author, body, tempId } = shapeCommentInput(form)
    if (!body) {
      return c.text("Comment body required", 400)
    }
    const comment = addComment({ author, body })
    let html = await renderTemplate("partials/commentItem.vto", { comment })
    if (tempId) {
      html = html.replace('<li class="comment"', `<li class="comment" data-temp-id="${tempId}"`)
    }
    return c.html(html)
  } catch (error) {
    return handleApiError(error, c, { message: "Failed to add comment", responseType: "html" })
  }
})
