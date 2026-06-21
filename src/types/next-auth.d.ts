import type { DefaultSession } from 'next-auth'

// Augment NextAuth's types so `session.user.id` / `workspaceId` and the matching
// JWT fields are typed everywhere we read them.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      workspaceId: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    workspaceId?: string
  }
}
