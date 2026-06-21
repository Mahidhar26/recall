import './globals.css'

export const metadata = {
  title: 'Recall — Meeting Memory',
  description: "Your team's institutional memory",
}

// Root layout is intentionally minimal: the public landing page and /login own
// their full-height layout, while the authenticated shell (sidebar + scroll
// container) lives in src/app/app/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body style={{ background: '#FAFAF9' }}>{children}</body>
    </html>
  )
}
