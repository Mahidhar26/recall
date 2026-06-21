import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import PostgresAdapter from '@auth/pg-adapter'
import bcrypt from 'bcryptjs'
import { pool } from '@/lib/db'
import { authConfig } from './auth.config'
import { getOrCreateWorkspace } from '@/lib/workspace'

// Full NextAuth instance — Node runtime only (uses pg + bcrypt). Imported by
// the route handler, API routes (via auth()), and server components.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PostgresAdapter(pool),
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null
        const email = String(creds.email).toLowerCase()
        const { rows } = await pool.query(
          'SELECT id, name, email, image, password_hash FROM users WHERE email = $1',
          [email]
        )
        const user = rows[0]
        if (!user?.password_hash) return null
        const ok = await bcrypt.compare(String(creds.password), user.password_hash)
        if (!ok) return null
        return { id: user.id, name: user.name, email: user.email, image: user.image }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // On sign-in, stamp the user id, then resolve (or lazily create, e.g. for
      // first-time Google users) their workspace and cache it on the token.
      if (user?.id) token.userId = user.id
      if (token.userId && !token.workspaceId) {
        const ws = await getOrCreateWorkspace(token.userId as string)
        token.workspaceId = ws.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string
        session.user.workspaceId = token.workspaceId as string
      }
      return session
    },
  },
})
