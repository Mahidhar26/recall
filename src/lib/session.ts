import { auth } from '@/auth'

export interface RequestScope {
  userId: string
  workspaceId: string
}

// Shared guard for API routes. Reads the JWT session (the workspace id is
// embedded in the token, so this is a cookie read — no DB round-trip). Returns
// null when unauthenticated; callers should respond 401.
export async function requireWorkspace(): Promise<RequestScope | null> {
  const session = await auth()
  if (!session?.user?.id || !session.user.workspaceId) return null
  return { userId: session.user.id, workspaceId: session.user.workspaceId }
}
