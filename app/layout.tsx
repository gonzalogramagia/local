import './global.css'
import ShortcutFloater from './components/ShortcutFloater'
import DailyTasks from './components/DailyTasks'
import Countdown from './components/Countdown'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const baseUrl = 'https://home.gonzalogramagia.com'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Local Storage',
    template: '%s | Local',
  },
  description: 'Herramienta para crear notas en localhost.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Local',
    description: 'Herramienta para crear notas en localhost.',
    url: baseUrl,
    siteName: 'Local',
    locale: 'es_ES',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes) => classes.filter(Boolean).join(' ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={cx(
        'text-black bg-white dark:text-white dark:bg-black',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <body className="antialiased" cz-shortcut-listen="true">
        <ShortcutFloater />
        <DailyTasks />
        <Countdown />
        {children}
      </body>
    </html>
  )
}
