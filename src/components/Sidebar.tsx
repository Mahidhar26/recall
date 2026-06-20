'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', label: 'Overview', icon: '▣' },
  { href: '/chat', label: 'Ask anything', icon: '○' },
  { href: '/actions', label: 'Action items', icon: '✓' },
  { href: '/decisions', label: 'Decisions log', icon: '⚖' },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className='w-56 shrink-0 flex flex-col' style={{ background: '#0D0D12' }}>
      <div className='px-5 py-4 flex items-center gap-2.5 border-b border-white/[0.06]'>
        <span className='text-white font-semibold tracking-tight text-[15px]'>Recall</span>
        <span className='text-[10px] px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 font-medium leading-none'>beta</span>
      </div>

      <nav className='flex-1 px-2 py-3 space-y-0.5'>
        {nav.map(n => {
          const active = path === n.href
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 pl-3 pr-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 border-l-2 ${
                active
                  ? 'border-violet-400 bg-white/[0.08] text-white'
                  : 'border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300'
              }`}
            >
              <span className='text-[15px] leading-none opacity-80'>{n.icon}</span>
              {n.label}
            </Link>
          )
        })}
      </nav>

      <div className='px-5 py-3 border-t border-white/[0.06] text-[11px] text-zinc-700 tracking-wide'>
        H0 Hackathon · Track 2
      </div>
    </aside>
  )
}
