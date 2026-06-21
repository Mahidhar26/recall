'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/app', label: 'Overview', icon: '▣' },
  { href: '/app/chat', label: 'Ask anything', icon: '○' },
  { href: '/app/actions', label: 'Action items', icon: '✓' },
  { href: '/app/decisions', label: 'Decisions log', icon: '⚖' },
]

interface SidebarUser {
  name: string | null
  email: string | null
  image: string | null
}

export function Sidebar({
  user,
  signOutAction,
}: {
  user: SidebarUser
  signOutAction: () => Promise<void>
}) {
  const path = usePathname()
  const initial = (user.name ?? user.email ?? '?').trim().charAt(0).toUpperCase()

  return (
    <aside className='w-56 shrink-0 flex flex-col' style={{ background: '#0D0D12' }}>
      <Link href='/app' className='px-5 py-4 flex items-center gap-2.5 border-b border-white/[0.06]'>
        <img src='/logo.svg' alt='Recall' className='w-8 h-8 rounded-lg' />
        <span className='text-white font-semibold tracking-tight text-[15px]'>Recall</span>
      </Link>

      <nav className='flex-1 px-2 py-3 space-y-0.5'>
        {nav.map(n => {
          const active = n.href === '/app' ? path === '/app' : path.startsWith(n.href)
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 pl-3 pr-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 border-l-2 ${
                active
                  ? 'border-[#7A72D6] bg-white/[0.08] text-white'
                  : 'border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
              }`}
            >
              <span className='text-[15px] leading-none opacity-80'>{n.icon}</span>
              {n.label}
            </Link>
          )
        })}
      </nav>

      <div className='px-3 py-3 border-t border-white/[0.06]'>
        <div className='flex items-center gap-2.5 px-2 py-1.5'>
          {user.image ? (
            <img src={user.image} alt='' className='w-7 h-7 rounded-full object-cover' />
          ) : (
            <span
              className='w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold text-white'
              style={{ background: '#534AB7' }}
            >
              {initial}
            </span>
          )}
          <div className='min-w-0 flex-1'>
            <div className='text-[12px] font-medium text-zinc-200 truncate'>
              {user.name ?? 'Member'}
            </div>
            <div className='text-[11px] text-zinc-500 truncate'>{user.email}</div>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type='submit'
            className='mt-1 w-full text-left px-2 py-1.5 rounded-md text-[12px] font-medium text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300 transition-colors'
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
