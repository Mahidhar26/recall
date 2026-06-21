import Link from 'next/link'

export const metadata = {
  title: 'Recall — Your team\'s institutional memory',
  description: 'Recall turns meeting transcripts into searchable institutional memory. Ask anything, get cited answers, never lose a decision again.',
}

const INK = '#0D0D12'
const PURPLE = '#534AB7'
const TEAL = '#1D9E75'

export default function LandingPage() {
  return (
    <div className='font-sans-ui text-zinc-800' style={{ background: '#FAFAF9' }}>
      {/* Fonts — runtime-loaded so the build needs no network */}
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      <link
        href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opt,wght@0,16,400;0,16,500;0,16,600;1,16,400;1,16,500&display=swap'
        rel='stylesheet'
      />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className='sticky top-0 z-40 border-b border-zinc-200/70 backdrop-blur-md' style={{ background: 'rgba(250,250,249,0.8)' }}>
        <nav className='mx-auto max-w-6xl px-6 h-16 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2.5'>
            <img src='/logo.svg' alt='Recall' className='w-8 h-8 rounded-lg' />
            <span className='font-semibold tracking-tight text-[15px] text-zinc-900'>Recall</span>
          </Link>
          <div className='hidden md:flex items-center gap-8 font-mono-ui text-[12px] uppercase tracking-wider text-zinc-500'>
            <a href='#features' className='hover:text-zinc-900 transition-colors'>Features</a>
            <a href='#how' className='hover:text-zinc-900 transition-colors'>How it works</a>
            <a href='#pricing' className='hover:text-zinc-900 transition-colors'>Pricing</a>
          </div>
          <div className='flex items-center gap-2'>
            <Link href='/login' className='text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-2 transition-colors'>
              Sign in
            </Link>
            <Link href='/login' className='text-sm font-semibold text-white rounded-lg px-4 py-2 transition-opacity hover:opacity-90' style={{ background: PURPLE }}>
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className='relative overflow-hidden'>
        <div className='mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24'>
          <div className='recall-fade-up max-w-3xl'>
            <div className='font-mono-ui text-[12px] tracking-[0.2em] uppercase mb-6' style={{ color: PURPLE }}>
              Institutional memory for teams
            </div>
            <h1 className='font-display text-[44px] sm:text-[64px] leading-[1.05] tracking-[-0.02em] text-zinc-900'>
              Every meeting,<br />
              still <span className='italic' style={{ color: PURPLE }}>answerable</span> months later.
            </h1>
            <p className='mt-6 text-lg leading-relaxed text-zinc-600 max-w-xl'>
              Recall reads your transcripts and turns them into searchable memory.
              Ask a question in plain language and get an answer — with the exact
              meeting and date it came from.
            </p>
            <div className='mt-8 flex flex-wrap items-center gap-3'>
              <Link href='/login' className='text-sm font-semibold text-white rounded-lg px-5 py-3 transition-opacity hover:opacity-90' style={{ background: PURPLE }}>
                Start your workspace — free
              </Link>
              <a href='#how' className='text-sm font-semibold text-zinc-700 rounded-lg px-5 py-3 border border-zinc-300 hover:border-zinc-400 transition-colors'>
                See how it works
              </a>
            </div>
          </div>

          {/* Signature: the Recall bar */}
          <div className='recall-fade-up mt-14 max-w-2xl' style={{ animationDelay: '0.12s' }}>
            <RecallBar />
          </div>
        </div>

        {/* ambient brand glow */}
        <div className='pointer-events-none absolute -top-24 right-0 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-[0.15]' style={{ background: `radial-gradient(circle, ${PURPLE}, transparent 70%)` }} />
        <div className='pointer-events-none absolute top-40 -left-32 w-96 h-96 rounded-full blur-3xl opacity-[0.10]' style={{ background: `radial-gradient(circle, ${TEAL}, transparent 70%)` }} />
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section id='features' className='border-t border-zinc-200'>
        <div className='mx-auto max-w-6xl px-6 py-20 sm:py-28'>
          <SectionHead eyebrow='What it does' title={<>From transcript to <span className='italic' style={{ color: PURPLE }}>institutional memory</span>.</>} />
          <div className='mt-14 grid gap-px sm:grid-cols-2 bg-zinc-200 border border-zinc-200 rounded-2xl overflow-hidden'>
            {FEATURES.map(f => (
              <div key={f.tag} className='bg-[#FAFAF9] p-8 sm:p-9'>
                <div className='font-mono-ui text-[11px] uppercase tracking-[0.18em] mb-4' style={{ color: f.accent }}>
                  {f.tag}
                </div>
                <h3 className='font-display text-[24px] leading-snug text-zinc-900'>{f.title}</h3>
                <p className='mt-3 text-[15px] leading-relaxed text-zinc-600'>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────── */}
      <section id='how' className='border-t border-zinc-200' style={{ background: '#fff' }}>
        <div className='mx-auto max-w-6xl px-6 py-20 sm:py-28'>
          <SectionHead eyebrow='How it works' title={<>Three steps from talk to <span className='italic' style={{ color: TEAL }}>recall</span>.</>} />
          <div className='mt-14 grid gap-10 md:grid-cols-3'>
            {STEPS.map(s => (
              <div key={s.n} className='relative'>
                <div className='font-display text-[56px] leading-none text-zinc-200'>{s.n}</div>
                <h3 className='mt-3 font-display text-[22px] text-zinc-900'>{s.title}</h3>
                <p className='mt-2.5 text-[15px] leading-relaxed text-zinc-600'>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────── */}
      <section id='pricing' className='border-t border-zinc-200'>
        <div className='mx-auto max-w-6xl px-6 py-20 sm:py-28'>
          <SectionHead eyebrow='Pricing' title={<>Start free. Grow when your <span className='italic' style={{ color: PURPLE }}>memory</span> does.</>} />
          <div className='mt-14 grid gap-6 md:grid-cols-2 max-w-3xl'>
            <PriceCard
              plan='Free'
              price='$0'
              cadence='forever'
              blurb='For individuals turning their own meetings into memory.'
              features={['Up to 25 meetings', 'Ask-anything RAG chat', 'Auto-extracted action items', 'Decisions log']}
              cta='Start free'
              highlighted={false}
            />
            <PriceCard
              plan='Pro'
              price='$19'
              cadence='per user / month'
              blurb='For teams who never want to lose a decision again.'
              features={['Unlimited meetings', 'Shared team workspace', 'Priority extraction models', 'Export & integrations']}
              cta='Start Pro trial'
              highlighted
            />
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────── */}
      <section className='border-t border-zinc-200'>
        <div className='mx-auto max-w-6xl px-6 py-24'>
          <div className='relative overflow-hidden rounded-3xl px-8 py-16 sm:px-16 sm:py-20' style={{ background: INK }}>
            <div className='relative z-10 max-w-xl'>
              <h2 className='font-display text-[34px] sm:text-[42px] leading-tight text-white'>
                Stop re-asking what was already <span className='italic' style={{ color: '#7A72D6' }}>decided</span>.
              </h2>
              <p className='mt-4 text-zinc-400 text-[15px] leading-relaxed'>
                Upload your first transcript and ask it anything in under a minute.
              </p>
              <Link href='/login' className='mt-8 inline-block text-sm font-semibold text-white rounded-lg px-6 py-3 transition-opacity hover:opacity-90' style={{ background: PURPLE }}>
                Create your workspace
              </Link>
            </div>
            <div className='pointer-events-none absolute -bottom-24 -right-16 w-96 h-96 rounded-full blur-3xl opacity-40' style={{ background: `radial-gradient(circle, ${PURPLE}, transparent 70%)` }} />
            <div className='pointer-events-none absolute -top-20 right-1/3 w-72 h-72 rounded-full blur-3xl opacity-20' style={{ background: `radial-gradient(circle, ${TEAL}, transparent 70%)` }} />
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className='border-t border-zinc-200'>
        <div className='mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4'>
          <div className='flex items-center gap-2.5'>
            <img src='/logo.svg' alt='Recall' className='w-7 h-7 rounded-lg' />
            <span className='font-semibold tracking-tight text-[14px] text-zinc-900'>Recall</span>
          </div>
          <p className='font-mono-ui text-[11px] uppercase tracking-wider text-zinc-400'>
            H0 Hackathon · Track 2 · AWS + Vercel
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ── The signature element ─────────────────────────────────── */
function RecallBar() {
  return (
    <div className='rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_60px_-20px_rgba(13,13,18,0.18)] overflow-hidden'>
      <div className='flex items-center gap-3 px-5 py-4 border-b border-zinc-100'>
        <span className='font-mono-ui text-zinc-400 text-sm'>⌘</span>
        <span className='text-[15px] text-zinc-800 recall-caret'>
          What did we decide about the billing rewrite?
        </span>
      </div>
      <div className='px-5 py-5'>
        <div className='font-mono-ui text-[10px] uppercase tracking-[0.18em] text-zinc-400 mb-2'>Recalled answer</div>
        <p className='text-[15px] leading-relaxed text-zinc-700'>
          The team agreed to <strong className='text-zinc-900'>ship the billing rewrite before Q3</strong>,
          with <strong className='text-zinc-900'>Priya owning the migration</strong> and a staged rollout behind a feature flag.
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          {['Pricing sync · May 14', 'Eng standup · May 16'].map(s => (
            <span key={s} className='font-mono-ui text-[11px] px-2.5 py-1 rounded-full' style={{ background: '#F4F3FB', color: '#453C9E' }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: React.ReactNode }) {
  return (
    <div className='max-w-2xl'>
      <div className='font-mono-ui text-[12px] tracking-[0.2em] uppercase text-zinc-400 mb-4'>{eyebrow}</div>
      <h2 className='font-display text-[34px] sm:text-[44px] leading-[1.08] tracking-[-0.02em] text-zinc-900'>{title}</h2>
    </div>
  )
}

function PriceCard({
  plan, price, cadence, blurb, features, cta, highlighted,
}: {
  plan: string; price: string; cadence: string; blurb: string
  features: string[]; cta: string; highlighted: boolean
}) {
  return (
    <div
      className='rounded-2xl border p-8 flex flex-col'
      style={highlighted ? { borderColor: PURPLE, background: '#fff', boxShadow: `0 24px 60px -28px rgba(83,74,183,0.45)` } : { borderColor: '#e4e4e7', background: '#fff' }}
    >
      <div className='flex items-baseline justify-between'>
        <span className='font-mono-ui text-[12px] uppercase tracking-[0.18em]' style={{ color: highlighted ? PURPLE : '#71717a' }}>{plan}</span>
        {highlighted && (
          <span className='font-mono-ui text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full text-white' style={{ background: PURPLE }}>Popular</span>
        )}
      </div>
      <div className='mt-4 flex items-baseline gap-1.5'>
        <span className='font-display text-[40px] leading-none text-zinc-900'>{price}</span>
        <span className='text-[13px] text-zinc-500'>{cadence}</span>
      </div>
      <p className='mt-3 text-[14px] leading-relaxed text-zinc-600'>{blurb}</p>
      <ul className='mt-6 space-y-2.5 flex-1'>
        {features.map(f => (
          <li key={f} className='flex items-start gap-2.5 text-[14px] text-zinc-700'>
            <span className='mt-0.5' style={{ color: TEAL }}>✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href='/login'
        className='mt-7 text-center text-sm font-semibold rounded-lg px-5 py-3 transition-opacity hover:opacity-90'
        style={highlighted ? { background: PURPLE, color: '#fff' } : { background: '#fff', color: '#18181b', border: '1px solid #d4d4d8' }}
      >
        {cta}
      </Link>
    </div>
  )
}

const FEATURES = [
  {
    tag: 'Ask anything',
    accent: PURPLE,
    title: 'Cited answers, not search results',
    body: 'Ask in plain language. Recall reads across every transcript and answers with the meeting and date each claim came from — so you can trust it.',
  },
  {
    tag: 'Action items',
    accent: TEAL,
    title: 'Owners and dates, captured for you',
    body: 'Every commitment gets pulled out automatically — task, owner, due date — and tracked from to-do to done across all your meetings.',
  },
  {
    tag: 'Decisions log',
    accent: PURPLE,
    title: 'A permanent record of what was decided',
    body: 'The choices a team makes are the easiest things to forget. Recall keeps a searchable log of every decision and the reasoning behind it.',
  },
  {
    tag: 'Any transcript',
    accent: TEAL,
    title: 'Drop in .txt, .vtt, or .pdf',
    body: 'Upload exports from Zoom, Notion, or anywhere else. Recall chunks, embeds, and indexes them into your private workspace in seconds.',
  },
]

const STEPS = [
  { n: '01', title: 'Upload', body: 'Drop in a transcript from any meeting. Recall parses txt, vtt, and pdf in seconds.' },
  { n: '02', title: 'Index', body: 'It splits the conversation, embeds every passage, and extracts decisions and action items.' },
  { n: '03', title: 'Recall', body: 'Ask anything across your meetings and get a cited answer — or browse decisions and tasks.' },
]
