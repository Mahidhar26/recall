import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'
import { Sidebar } from '@/components/Sidebar'
import { ClientShell } from '@/components/ClientShell'

// Authenticated shell for every /app/* route. Middleware already gates these,
// but we re-check here (defense in depth) and pull the user for the sidebar.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/login' })
  }

  return (
    <div className='flex h-screen' style={{ background: '#FAFAF9' }}>
      <Sidebar
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          image: session.user.image ?? null,
        }}
        signOutAction={handleSignOut}
      />
      <ClientShell>{children}</ClientShell>
    </div>
  )
}
