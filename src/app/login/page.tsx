import Link from 'next/link'
import { googleEnabled } from '@/auth.config'
import { LoginForm } from '@/components/LoginForm'

export const metadata = {
  title: 'Sign in · Recall',
}

export default function LoginPage() {
  return (
    <div className='font-sans-ui min-h-screen grid lg:grid-cols-2' style={{ background: '#FAFAF9' }}>
      {/* Fonts (runtime-loaded to keep the build network-free) */}
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      <link
        href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opt,wght@0,16,400;0,16,500;1,16,400&display=swap'
        rel='stylesheet'
      />

      {/* Brand panel — a recalled answer, the product in one frame */}
      <aside className='relative hidden lg:flex flex-col justify-between p-12 overflow-hidden' style={{ background: '#0D0D12' }}>
        <Link href='/' className='flex items-center gap-2.5 relative z-10'>
          <img src='/logo.svg' alt='Recall' className='w-8 h-8 rounded-lg' />
          <span className='text-white font-semibold tracking-tight text-[15px]'>Recall</span>
        </Link>

        <div className='relative z-10 max-w-md'>
          <div className='font-mono-ui text-[11px] tracking-[0.2em] uppercase text-[#7A72D6] mb-4'>
            recalled · just now
          </div>
          <p className='font-display text-[26px] leading-snug text-zinc-100'>
            “We agreed to <span className='italic' style={{ color: '#7A72D6' }}>ship the billing rewrite</span> before Q3, with Priya owning the migration.”
          </p>
          <div className='mt-5 flex flex-wrap gap-2'>
            {['Pricing sync · May 14', 'Eng standup · May 16'].map(s => (
              <span key={s} className='font-mono-ui text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-zinc-400'>
                {s}
              </span>
            ))}
          </div>
        </div>

        <p className='relative z-10 font-mono-ui text-[11px] text-zinc-600'>
          Your team's institutional memory.
        </p>

        {/* ambient gradient */}
        <div
          className='pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full blur-3xl opacity-40'
          style={{ background: 'radial-gradient(circle, #534AB7, transparent 70%)' }}
        />
        <div
          className='pointer-events-none absolute top-10 -left-20 w-72 h-72 rounded-full blur-3xl opacity-20'
          style={{ background: 'radial-gradient(circle, #1D9E75, transparent 70%)' }}
        />
      </aside>

      {/* Form panel */}
      <main className='flex items-center justify-center p-6 sm:p-12'>
        <div className='w-full max-w-sm'>
          <Link href='/' className='lg:hidden flex items-center gap-2.5 mb-10'>
            <img src='/logo.svg' alt='Recall' className='w-8 h-8 rounded-lg' />
            <span className='font-semibold tracking-tight text-[15px] text-zinc-900'>Recall</span>
          </Link>
          <LoginForm googleEnabled={googleEnabled} />
        </div>
      </main>
    </div>
  )
}
