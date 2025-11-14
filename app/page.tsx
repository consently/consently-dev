import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';
import { ScrollingBanner } from '@/components/ui/scrolling-banner';
import {
  Shield,
  Lock,
  FileCheck,
  BarChart3,
  Globe,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Search,
  Zap,
  FileText,
  Database,
  Layers,
} from 'lucide-react';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consently - DPDPA 2023 Compliance Platform | 1 Month Free Trial',
  description: 'Start your DPDPA 2023 compliance journey with Consently. Get 1 month free trial - no credit card required. Automated cookie scanning, consent management, 22 Indian languages support, and compliance reporting for Indian businesses.',
  keywords: [
    'DPDPA 2023',
    'DPDPA compliance',
    'consent management India',
    'cookie consent India',
    'data protection India',
    'privacy compliance',
    'free trial',
    'no credit card',
    'DPDPA consent manager',
    'cookie scanner India',
    'privacy compliance platform',
    'data protection act India',
    'consent management system',
    'DPDPA 2023 platform',
    'Indian data protection',
    'privacy preference centre',
    'data subject rights',
    'DPDPA compliance software',
  ],
  openGraph: {
    title: 'Consently - DPDPA 2023 Compliance Platform | 1 Month Free Trial',
    description: 'Start your DPDPA 2023 compliance journey with Consently. Get 1 month free trial - no credit card required. Automated cookie scanning, consent management, and compliance reporting.',
    type: 'website',
    url: 'https://www.consently.in',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Consently - DPDPA 2023 Compliance Platform | 1 Month Free Trial',
    description: 'Start your DPDPA 2023 compliance journey with Consently. Get 1 month free trial - no credit card required.',
  },
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Consently',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      name: 'Pre-Launch Offer - 1 Month Free Trial',
      description: 'Pre-launch special: Get 1 month free trial on all plans. No credit card required.',
      availability: 'https://schema.org/InStock',
      url: 'https://www.consently.in/signup',
    },
    description:
      'DPDPA 2023 compliant consent management platform for Indian businesses. Pre-launch offer: 1 month free trial - no credit card required. Automate cookie consent, data processing consent, and compliance reporting.',
    url: 'https://www.consently.in',
    inLanguage: ['en', 'hi'],
    featureList: [
      'Automated Cookie Scanning',
      'DPDPA Consent Handling',
      '22 Indian Languages Support',
      'Real-time Analytics',
      'Audit Trail & Reports',
      '1 Month Free Trial',
      'No Credit Card Required',
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollingBanner />
      {/* Navigation */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Consently</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[50%] top-0 h-[800px] w-[800px] -translate-x-[30%] rounded-full bg-gradient-to-tr from-blue-100 via-blue-50 to-transparent opacity-40 blur-3xl" />
          <div className="absolute right-[20%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-purple-100 via-pink-50 to-transparent opacity-30 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white mb-6 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-4 w-4 mr-2" />
              DPDPA 2023 Compliant
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              Consent Management
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Made Simple for India
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Complete DPDPA 2023 compliance platform with automated cookie scanning.
              Scan, classify, and manage your entire website in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-6 flex-wrap">
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                1 month free trial
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                Cancel anytime
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Scanning Highlight */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-white/20 backdrop-blur-sm mb-6">
                  <Zap className="h-4 w-4 mr-2" />
                  Automated Cookie Scanning
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Scan Your Entire Website for Cookies
                </h2>
                <p className="text-xl text-blue-50 mb-8 leading-relaxed">
                  From quick homepage scans to deep crawls of 50+ pages, discover all cookies across your site automatically. Get instant compliance reports and auto-generated consent banners.
                </p>
                <Link href="/pricing">
                  <Button size="lg" variant="secondary" className="text-blue-600">
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Search className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Quick Scan</h3>
                  <p className="text-blue-100">Homepage analysis • Perfect for getting started</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <BarChart3 className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Standard Scan</h3>
                  <p className="text-blue-100">Top 10 URLs • Best for growing businesses</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Globe className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Deep Crawl</h3>
                  <p className="text-blue-100">50+ pages • For large-scale deployments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need for Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Comprehensive tools built for Indian businesses</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Automated Cookie Scanning"
              description="Scan from homepage to entire website. Automatically classify cookies and generate compliance reports in seconds."
              gradient="from-blue-500 to-blue-600"
            />
            <FeatureCard
              icon={<FileCheck className="h-6 w-6" />}
              title="DPDPA Consent Handling"
              description="Manage data processing activities with pre-loaded templates for e-commerce, banking, healthcare, and more."
              gradient="from-purple-500 to-purple-600"
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Real-time Dashboards"
              description="Track consent metrics, device types, and compliance status with detailed analytics and reports."
              gradient="from-pink-500 to-pink-600"
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="Privacy by Design"
              description="Email tokenization, data minimization, and end-to-end encryption for maximum security."
              gradient="from-indigo-500 to-indigo-600"
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="22 Indian Languages"
              description="Support for all Schedule 8 languages and regional variations with auto-generated consent banners."
              gradient="from-cyan-500 to-cyan-600"
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="Audit Trail & Reports"
              description="Complete audit logs with timestamps, IP addresses, and exportable compliance reports (CSV/JSON/PDF)."
              gradient="from-green-500 to-green-600"
            />
          </div>
        </div>
      </section>

      {/* DPDPA Compliance Highlight */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-3xl p-12 text-white shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-white/20 backdrop-blur-sm mb-6">
                  <Shield className="h-4 w-4 mr-2" />
                  DPDPA 2023 Compliance
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Complete Data Protection Compliance
                </h2>
                <p className="text-xl text-blue-50 mb-8 leading-relaxed">
                  Comprehensive DPDPA 2023 compliance platform with industry templates, granular consent management, data subject rights handling, and complete audit trails. Get started in minutes with pre-loaded templates.
                </p>
                <Link href="/pricing">
                  <Button size="lg" variant="secondary" className="text-blue-600">
                    Learn More
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <FileText className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Industry Templates</h3>
                  <p className="text-blue-100">8+ pre-loaded templates • E-commerce, Banking, Healthcare & more</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Database className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Consent Management</h3>
                  <p className="text-blue-100">Granular per-activity tracking • Complete audit trails & reports</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <CheckCircle2 className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Data Subject Rights</h3>
                  <p className="text-blue-100">Access, Correction, Erasure • Automated workflows & tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Launch Offer Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-6 shadow-lg shadow-blue-500/20 animate-pulse">
              <Sparkles className="h-4 w-4 mr-2" />
              Pre-Launch Special Offer
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get Started with 1 Month Free
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join our pre-launch program and experience full DPDPA 2023 compliance features. Pricing details coming soon - early adopters get special rates!
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-200 p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white mb-4 shadow-lg">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  What You Get During Your Free Month
                </h3>
                <p className="text-lg text-gray-600">
                  Full access to all features across all plans
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Automated Cookie Scanning</h4>
                    <p className="text-sm text-gray-600">From homepage to entire website</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">DPDPA Consent Management</h4>
                    <p className="text-sm text-gray-600">Complete compliance solution</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">22 Indian Languages</h4>
                    <p className="text-sm text-gray-600">Multi-language support</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Priority Support</h4>
                    <p className="text-sm text-gray-600">Dedicated assistance during trial</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-12 py-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl shadow-blue-500/30">
                    Claim Your Free Month
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Achieve DPDPA Compliance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of Indian businesses ensuring data protection compliance. Get <strong className="text-white">1 month free</strong> during our pre-launch!
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-blue-600">
              Claim Your Free Month
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group p-8 rounded-2xl border border-gray-200 bg-white hover:shadow-2xl hover:border-transparent transition-all duration-300 hover:-translate-y-1">
      <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

