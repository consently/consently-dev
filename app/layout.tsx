import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConsentlyCookieWidget from "@/components/cookie/ConsentlyCookieWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Consently - DPDPA 2023 Compliance Platform",
  description: "Enterprise-grade consent management and DPDPA 2023 compliance for Indian businesses",
  keywords: ["DPDPA", "consent management", "privacy", "compliance", "India"],
  authors: [{ name: "Consently" }],
  openGraph: {
    title: "Consently - DPDPA 2023 Compliance Platform",
    description: "Enterprise-grade consent management and DPDPA 2023 compliance for Indian businesses",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize error tracking (Sentry) on app load
  if (typeof window !== 'undefined') {
    import('@/lib/error-tracking').then(({ initErrorTracking }) => {
      initErrorTracking();
    }).catch(() => {
      // Error tracking not available, continue without it
    });
  }

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        {children}
        <ConsentlyCookieWidget />
      </body>
    </html>
  );
}
