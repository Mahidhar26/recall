import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

// Next.js 16 proxy (the renamed middleware convention). Uses the edge-safe
// config — no pg/bcrypt — to gate routes via the `authorized` callback.
export default NextAuth(authConfig).auth

export const config = {
  // Gate the app shell; bounce logged-in users off /login. API routes
  // (including /api/auth/*) self-protect and are intentionally excluded.
  matcher: ['/app/:path*', '/login'],
}
