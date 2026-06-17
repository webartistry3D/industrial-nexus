import { AuthProvider } from '@/hooks/useAuth';
import { NavWrapper } from '@/components/nav-wrapper';
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
          <NavWrapper>
            {children}
          </NavWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
