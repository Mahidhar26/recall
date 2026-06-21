'use client'
import { CmdKModal } from '@/components/CmdKModal'

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <main className='flex-1 overflow-auto'>
      {children}
      <CmdKModal />
    </main>
  )
}
