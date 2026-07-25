export interface CommentInput {
  author: string
  body: string
}

export interface Comment extends CommentInput {
  id: string
  createdAt: Date
  optimistic?: boolean
}

// PLANNED: Replace with SQLite or other persistent store
const comments: Comment[] = [
  {
    id: crypto.randomUUID(),
    author: "Anonymous Hog",
    body: `<span>Has anyone seen the new Posthog site? <a href="https://posthog.com" /></span>`,
    createdAt: new Date(Date.now() - (1000 * 60 * 8)),
  },
  {
    id: crypto.randomUUID(),
    author: "Post the Most",
    body: `<span>Yes! I just saw it too. Super cool: <a href="https://posthog.com/spicy.mov" /></span>`,
    createdAt: new Date(Date.now() - (1000 * 60 * 3)),
  },
]

export function listComments(): Comment[] {
  // newest first
  return [...comments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function addComment(input: CommentInput): Comment {
  const comment: Comment = { id: crypto.randomUUID(), createdAt: new Date(), ...input }
  comments.push(comment)
  return comment
}

export function getComment(id: string): Comment | undefined {
  return comments.find((c) => c.id === id)
}

export function deleteComment(id: string): boolean {
  const index = comments.findIndex((c) => c.id === id)
  if (index === -1) return false
  comments.splice(index, 1)
  return true
}

export function countComments(): number {
  return comments.length
}
