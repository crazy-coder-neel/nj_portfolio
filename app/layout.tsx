import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Neelay Joshi',
  icons: {
    icon: [
      { url: '/nj-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/nj-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: { url: '/nj-icon-180.png', sizes: '180x180', type: 'image/png' },
  },
  description: 'Neelay Joshi, Computer Engineering student at VJTI Mumbai. Explore AI/ML and full-stack projects, hackathon achievements, developer-community leadership, and internship experience.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#05070B',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && process.env.VERCEL === '1' && <Analytics />}</body></html>
}
