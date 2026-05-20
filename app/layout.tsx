import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'EKSU Health Center - Appointment Booking',
  description: 'Modern appointment booking system for EKSU Health Center',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9ff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1f3a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'font-sans text-sm',
            style: {
              background: '#FFFFFF',
              color: '#1A1A2E',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: { primary: '#0B5E3C', secondary: '#FFFFFF' },
              style: { borderLeft: '4px solid #0B5E3C' }
            },
            error: {
              iconTheme: { primary: '#C0392B', secondary: '#FFFFFF' },
              style: { borderLeft: '4px solid #C0392B' }
            }
          }}
        />
        <Analytics />
      </body>
    </html>
  )
}
