'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isSignup = mode === 'signup'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'Could not create account')
          setLoading(false)
          return
        }
      }

      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) {
        setError(isSignup ? 'Account created, but sign-in failed. Try logging in.' : 'Wrong email or password')
        setLoading(false)
        return
      }
      router.push('/app')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className='w-full max-w-sm'>
      <div className='mb-8'>
        <div className='font-mono-ui text-[11px] tracking-[0.2em] uppercase text-[#534AB7] mb-3'>
          {isSignup ? 'New workspace' : 'Welcome back'}
        </div>
        <h1 className='font-display text-[34px] leading-[1.1] text-zinc-900'>
          {isSignup ? (
            <>Start your <span className='italic' style={{ color: '#534AB7' }}>memory</span>.</>
          ) : (
            <>Sign in to <span className='italic' style={{ color: '#534AB7' }}>recall</span>.</>
          )}
        </h1>
      </div>

      {googleEnabled && (
        <>
          <button
            type='button'
            onClick={() => signIn('google', { callbackUrl: '/app' })}
            className='w-full flex items-center justify-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors'
          >
            <GoogleMark />
            Continue with Google
          </button>
          <div className='flex items-center gap-3 my-5'>
            <span className='h-px flex-1 bg-zinc-200' />
            <span className='font-mono-ui text-[10px] uppercase tracking-widest text-zinc-400'>or</span>
            <span className='h-px flex-1 bg-zinc-200' />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className='space-y-3.5'>
        {isSignup && (
          <Field label='Name' htmlFor='name'>
            <input
              id='name'
              type='text'
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='Ada Lovelace'
              className='recall-input'
            />
          </Field>
        )}
        <Field label='Email' htmlFor='email'>
          <input
            id='email'
            type='email'
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder='you@team.com'
            className='recall-input'
          />
        </Field>
        <Field label='Password' htmlFor='password'>
          <input
            id='password'
            type='password'
            required
            minLength={isSignup ? 8 : undefined}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
            className='recall-input'
          />
        </Field>

        {error && (
          <p className='font-mono-ui text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2'>
            {error}
          </p>
        )}

        <button
          type='submit'
          disabled={loading}
          className='w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60'
          style={{ background: '#534AB7' }}
        >
          {loading ? 'One moment…' : isSignup ? 'Create workspace' : 'Sign in'}
        </button>
      </form>

      <p className='mt-6 text-sm text-zinc-500'>
        {isSignup ? 'Already have a workspace? ' : "Don't have an account? "}
        <button
          type='button'
          onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError('') }}
          className='font-medium text-[#534AB7] hover:underline'
        >
          {isSignup ? 'Sign in' : 'Create one'}
        </button>
      </p>

      <style>{`
        .recall-input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e4e4e7;
          background: #fff;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
          color: #18181b;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .recall-input::placeholder { color: #a1a1aa; }
        .recall-input:focus {
          outline: none;
          border-color: #534AB7;
          box-shadow: 0 0 0 3px rgba(83, 74, 183, 0.12);
        }
      `}</style>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className='block'>
      <span className='font-mono-ui block text-[11px] uppercase tracking-wider text-zinc-500 mb-1.5'>{label}</span>
      {children}
    </label>
  )
}

function GoogleMark() {
  return (
    <svg width='16' height='16' viewBox='0 0 18 18' aria-hidden>
      <path fill='#4285F4' d='M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z' />
      <path fill='#34A853' d='M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z' />
      <path fill='#FBBC05' d='M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z' />
      <path fill='#EA4335' d='M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z' />
    </svg>
  )
}
