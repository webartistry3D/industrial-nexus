import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/hooks/useAuth'
import { NavWrapper } from '@/components/nav-wrapper'
import { ScrollToTop } from '@/components/scroll-to-top'
import { OrientationLock } from '@/components/orientation-lock'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Industrial Nexus - Client Portal',
  description: 'Track your industrial shipments in real-time',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IN Client',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`} suppressHydrationWarning>
        <OrientationLock />
        <AuthProvider>
          <ScrollToTop />
          <NavWrapper>
            {children}
          </NavWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
