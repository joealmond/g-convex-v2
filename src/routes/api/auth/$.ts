import { createFileRoute } from '@tanstack/react-router'
import { handler } from '@/lib/auth-server'

/**
 * Auth catch-all route for Better Auth
 *
 * Uses server.handlers to intercept /api/auth/* requests and forward
 * them to the Better Auth handler (proxied to Convex).
 * This avoids CORS issues by keeping auth requests on the same origin.
 */
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
    },
  },
})
