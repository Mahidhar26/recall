import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Recall — Meeting Memory',
  description: 'Your team\'s institutional memory',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='flex h-screen bg-gray-50'>
        <Sidebar />
        <main className='flex-1 overflow-auto'>{children}</main>
      </body>
    </html>
  )
}

function Sidebar() {
  const nav = [
    { href: '/', label: 'Overview', icon: '▣' },
    { href: '/chat', label: 'Ask anything', icon: '○' },
    { href: '/actions', label: 'Action items', icon: '✓' },
    { href: '/decisions', label: 'Decisions log', icon: '⚖' },
  ]
  return (
    <aside className='w-52 bg-white border-r border-gray-200 flex flex-col'>
      <div className='p-4 border-b border-gray-200 font-semibold text-purple-700'>Recall</div>
      <nav className='flex-1 p-2 space-y-1'>
        {nav.map(n => (
          <Link key={n.href} href={n.href}
            className='flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900'>
            <span>{n.icon}</span> {n.label}
          </Link>
        ))}
      </nav>
      <div className='p-3 border-t border-gray-200 text-xs text-gray-400'>H0 Hackathon · Track 2</div>
    </aside>
  )
}
