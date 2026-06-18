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
      <body className="bg-gray-100">
        <AuthProvider>
          <DriverNavWrapper>
            {children}
          </DriverNavWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
