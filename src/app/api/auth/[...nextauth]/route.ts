import { handlers } from '@/auth'

// Catches all /api/auth/* routes (signin, callback, signout, session, ...).
export const { GET, POST } = handlers
