import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";
import ConsentlyCookieWidget from "@/components/cookie/ConsentlyCookieWidget";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SkipLink } from "@/components/ui/SkipLink";
// Suppress console output in production (client-side)
import '@/lib/console-suppress';

const GA_TRACKING_ID = "G-T3M4ZEDZF7";

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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      {/* Google Analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}');
        `}
      </Script>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="consently-theme"
        >
          <SkipLink />
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          <ConsentlyCookieWidget />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
