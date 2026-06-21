import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

// Edge-safe NextAuth config. This is the ONLY config imported by middleware,
// so it must not pull in `pg`, `bcryptjs`, or the database adapter — none of
// those run in the Edge runtime. The Credentials provider (which needs bcrypt
// + pg) is added separately in `auth.ts`, which runs on the Node runtime.

const providers = []

// Google is optional — only register it when both secrets are present so the
// app boots cleanly without Google OAuth configured.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const googleEnabled = providers.length > 0

export const authConfig = {
  providers,
  // Credentials provider forces JWT sessions in NextAuth v5; this also keeps
  // session checks edge-friendly (cookie read, no DB round-trip).
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    // Runs in middleware to gate routes. Return false → redirect to signIn.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnApp = nextUrl.pathname.startsWith('/app')

      if (isOnApp) return isLoggedIn
      // Send already-authenticated users away from the login page.
      if (isLoggedIn && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/app', nextUrl))
      }
      return true
    },
  },
} satisfies NextAuthConfig
