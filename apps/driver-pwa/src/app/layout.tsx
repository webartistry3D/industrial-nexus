import { AuthProvider } from '@/hooks/useAuth';
import { DriverNavWrapper } from '@/components/driver-nav-wrapper';
import './globals.css';

export const metadata = {
  title: 'Industrial Nexus - Driver',
  description: 'Driver mobile app for industrial deliveries',
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
      <body className="bg-gray-100 font-sans">
        <AuthProvider>
          <DriverNavWrapper>
            {children}
          </DriverNavWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
