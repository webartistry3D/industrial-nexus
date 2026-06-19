import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Industrial Nexus — Keeping Industry Moving',
  description:
    'Industrial Nexus is a B2B logistics execution platform for manufacturers, distributors, warehouses, and industrial suppliers across the Lagos–Ogun industrial corridor.',
  keywords: [
    'industrial logistics',
    'B2B logistics',
    'supply chain',
    'fleet management',
    'warehouse logistics',
    'Lagos Ogun industrial corridor',
    'real-time tracking',
    'proof of delivery',
  ],
  authors: [{ name: 'Industrial Nexus' }],
  openGraph: {
    title: 'Industrial Nexus — Keeping Industry Moving',
    description:
      'Operational infrastructure for industrial logistics. Real-time visibility, intelligent dispatching, and operational discipline.',
    type: 'website',
    locale: 'en_NG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Industrial Nexus — Keeping Industry Moving',
    description:
      'Operational infrastructure for industrial logistics.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
