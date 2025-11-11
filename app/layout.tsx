import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.consently.in'
  ),
  title: {
    default: 'Consently - DPDPA 2023 Consent Manager',
    template: '%s | Consently',
  },
  description:
    'DPDPA 2023 compliant consent management platform for Indian businesses. Automate cookie consent, data processing consent, and compliance reporting with 22 Indian languages support.',
  keywords: [
    'DPDPA 2023',
    'consent management',
    'cookie consent',
    'data protection',
    'India',
    'compliance',
    'Digital Personal Data Protection Act',
    'cookie scanner',
    'privacy compliance',
    'Indian languages',
  ],
  authors: [{ name: 'Consently' }],
  creator: 'Consently',
  publisher: 'Consently',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.consently.in',
    siteName: 'Consently',
    title: 'Consently - DPDPA 2023 Consent Manager',
    description:
      'Complete DPDPA 2023 compliance platform with automated cookie scanning. Scan, classify, and manage your entire website in minutes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Consently - DPDPA 2023 Consent Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Consently - DPDPA 2023 Consent Manager',
    description:
      'DPDPA 2023 compliant consent management for Indian businesses. Automated cookie scanning, 22 Indian languages support.',
    images: ['/og-image.png'],
    creator: '@consently',
  },
  verification: {
    google: 'ADD_YOUR_GOOGLE_VERIFICATION_CODE',
    // yandex: 'ADD_IF_NEEDED',
    // bing: 'ADD_IF_NEEDED',
  },
  category: 'technology',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  alternates: {
    canonical: 'https://www.consently.in',
    types: {
      'application/rss+xml': [{ url: '/blog/rss.xml', title: 'Consently Blog RSS' }],
    },
  },
  other: {
    'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://www.consently.in/widget.js"
          data-consently-id="cnsty_mhnhhg68_map2kra3v"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
