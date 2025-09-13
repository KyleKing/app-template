export const MAX_AUTHOR_LEN = 32
export const MAX_BODY_LEN = 280

export interface ShapedCommentInput {
  author: string
  body: string
  tempId?: string
}

function pick(source: unknown, key: string): unknown {
  if (source && typeof (source as any).get === "function") { // is FormData
    try {
      return (source as any).get(key)
    } catch {
      return undefined
    }
  }
  if (source && typeof source === "object") {
    return (source as any)[key]
  }
  return undefined
}

export function shapeCommentInput(source: unknown): ShapedCommentInput {
  const rawAuthor = (pick(source, "author") ?? "").toString()
  const rawBody = (pick(source, "body") ?? "").toString()
  const rawTempId = pick(source, "tempId")

  const author = rawAuthor.trim().slice(0, MAX_AUTHOR_LEN) || "Anon"
  const body = rawBody.trim().slice(0, MAX_BODY_LEN)
  const tempId = rawTempId ? rawTempId.toString() : undefined

  return { author, body, tempId }
}

export function generateTempId(): string {
  return `temp-${Math.random().toString(36).slice(2)}`
}

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c))
}
