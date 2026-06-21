import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { ClientShell } from '@/components/ClientShell'

export const metadata = {
  title: 'Recall — Meeting Memory',
  description: "Your team's institutional memory",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='flex h-screen' style={{ background: '#FAFAF9' }}>
        <Sidebar />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  )
}
