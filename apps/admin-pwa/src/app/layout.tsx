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
