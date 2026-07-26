import { Hono } from "hono"

export const api = new Hono()

api.get("/healthz", async (c) => {
  return c.json({ healthy: true })
})
