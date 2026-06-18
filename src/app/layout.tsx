import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import ServiceWorkerRegistrar from '@/components/ui/ServiceWorkerRegistrar'
import { ToastProvider } from '@/components/notifications/ToastProvider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Clara — Intelligence Artificielle',
  description: 'Clara est une intelligence artificielle pédagogique, humaine et inspirante. Elle écoute, conseille, enseigne et accompagne.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Clara',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Clara" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ServiceWorkerRegistrar />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
