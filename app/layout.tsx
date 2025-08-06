import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/use-auth'
import Navigation from '@/components/navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nutrition Snap - Track Your Meals',
  description: 'A privacy-first nutrition tracking app for Sri Lankan cuisine',
  manifest: '/manifest.json',
  themeColor: '#4CAF50',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nutrition Snap" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
          <Navigation />
        </AuthProvider>
      </body>
    </html>
  )
}
