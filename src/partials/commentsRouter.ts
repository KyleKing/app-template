import { extendLogContext } from "@/logContext.ts"
import { addComment, countComments, deleteComment, listComments } from "@/partials/commentsStore.ts"
import { renderTemplate } from "@/templates/engine.ts"
import { handleApiError } from "@/utils/errorHandler.ts"
import { Hono } from "hono"
import { shapeCommentInput } from "~/commentShape.ts"

export const commentsRouter = new Hono()

commentsRouter.get("/comments", async (c) => {
  try {
    const comments = listComments()
    extendLogContext({
      operation: "list_comments",
      resourceCount: comments.length,
    })
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

    extendLogContext({
      operation: "create_comment",
      resourceId: comment.id,
      commentLength: body.length,
      authorLength: author.length,
      tempId: tempId || null,
    })

    let itemHtml = await renderTemplate("partials/commentItem.vto", { comment })
    if (tempId) {
      itemHtml = itemHtml.replace('<li class="c-comment"', `<li class="c-comment" data-temp-id="${tempId}"`)
    }
    const countHtml = await renderTemplate("partials/commentsCount.vto", { count: countComments() })

    c.header("HX-Trigger", JSON.stringify({ "comment-added": { author } }))
    return c.html(itemHtml + countHtml)
  } catch (error) {
    return handleApiError(error, c, { message: "Failed to add comment", responseType: "html" })
  }
})

commentsRouter.delete("/comments/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const removed = deleteComment(id)
    if (!removed) {
      return c.text("Comment not found", 404)
    }

    extendLogContext({ operation: "delete_comment", resourceId: id })

    const countHtml = await renderTemplate("partials/commentsCount.vto", { count: countComments() })
    return c.html(countHtml)
  } catch (error) {
    return handleApiError(error, c, { message: "Failed to delete comment", responseType: "html" })
  }
})
