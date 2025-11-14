import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
