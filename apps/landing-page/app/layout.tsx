import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Industrial Nexus — Keeping Industry Moving",
  description:
    "A specialized B2B logistics execution platform for manufacturers and industrial suppliers across the Lagos–Ogun industrial corridor. Real-time tracking, Weight Watch validation, and operational discipline.",
  keywords: [
    "industrial logistics Nigeria",
    "B2B logistics Lagos",
    "supply chain platform",
    "logistics execution",
    "Lagos Ogun corridor",
  ],
  openGraph: {
    title: "Industrial Nexus — Keeping Industry Moving",
    description:
      "Operational infrastructure for industrial logistics. Move critical consumables with precision.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Industrial Nexus — Keeping Industry Moving",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
      <body style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
