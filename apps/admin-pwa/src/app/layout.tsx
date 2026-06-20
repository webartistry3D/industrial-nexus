import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-provider'
import { NavWrapper } from '@/components/nav-wrapper'

export const metadata: Metadata = {
  title: 'Industrial Nexus - Admin Control Tower',
  description: 'Real-time logistics operations dashboard',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50" suppressHydrationWarning>
        <AuthProvider>
          <NavWrapper>
            {children}
          </NavWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
