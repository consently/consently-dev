import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/ui/footer';
import { ScrollingBanner } from '@/components/ui/scrolling-banner';
import { HeroCarousel, ProductShowcase } from '@/components/ui/product-showcase';
import { Navigation } from '@/components/ui/navigation';
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
  Briefcase,
  Target,
  Users,
  Cookie,
  X,
} from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

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
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollingBanner />
      <Navigation />

      {/* Hero Section */}

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-20 lg:py-32">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[50%] top-0 h-[800px] w-[800px] -translate-x-[30%] rounded-full bg-gradient-to-tr from-blue-100 via-blue-50 to-transparent opacity-40 blur-3xl" />
          <div className="absolute right-[20%] top-[20%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-purple-100 via-pink-50 to-transparent opacity-30 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white mb-4 sm:mb-6 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              DPDPA Rules 2025 Compliant
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight px-4">
              Consent Management
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Made Simple for India
              </span>
            </h1>
            <p className="text-base sm:text-xl lg:text-2xl text-gray-600 mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed px-4">
              Stay compliant, avoid penalties, and build user trust — without writing a single line of code.
            </p>

            {/* 4 Key USP Badges */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-6 sm:mb-10 px-4 max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-md hover:shadow-lg transition-all">
                <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-gray-900">Cookie consent + DPDPA consent + Data Principal Requests Manager</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl shadow-md hover:shadow-lg transition-all">
                <Globe className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-gray-900">22 Indian languages - Built for Bharat</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl shadow-md hover:shadow-lg transition-all">
                <Zap className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-gray-900">1 day setup</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl shadow-md hover:shadow-lg transition-all">
                <Briefcase className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-gray-900">Consulting support</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-sm sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  <span className="hidden sm:inline">🚀 Start 1-Month Free Trial — No Credit Card Required</span>
                  <span className="sm:hidden">Start Free Trial — No Card Required</span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-4">
              <span className="flex items-center font-medium">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 text-green-500 flex-shrink-0" />
                Instant setup — live in 5 minutes
              </span>
              <span className="flex items-center font-medium">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 text-green-500 flex-shrink-0" />
                Full access to all features
              </span>
            </div>

            {/* Product Preview - Real Dashboard Screenshots Carousel */}
            <div className="mt-8 sm:mt-12 px-4 max-w-6xl mx-auto">
              <HeroCarousel />
              {/* Feature Tags */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center text-xs">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium shadow-sm">📊 Real-time Analytics</span>
                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full font-medium shadow-sm">🔍 Cookie Scanner</span>
                <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-medium shadow-sm">🗣️ 22 Languages</span>
                <span className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full font-medium shadow-sm">📝 Audit Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Scanning Highlight */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-white shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
              <div>
                <div className="inline-flex items-center rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm bg-white/20 backdrop-blur-sm mb-4 sm:mb-6">
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Automated Cookie Scanning
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
                  Scan Your Entire Website for Cookies
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-blue-50 mb-6 sm:mb-8 leading-relaxed">
                  From quick homepage scans to deep crawls of 50+ pages, discover all cookies across your site automatically. Get instant compliance reports and auto-generated consent banners.
                </p>
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="text-blue-600 w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <Search className="h-6 w-6 sm:h-8 sm:w-8 mb-2 sm:mb-3" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Quick Scan</h3>
                  <p className="text-sm sm:text-base text-blue-100">Homepage analysis • Perfect for getting started</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mb-2 sm:mb-3" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Standard Scan</h3>
                  <p className="text-sm sm:text-base text-blue-100">Top 10 URLs • Best for growing businesses</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <Globe className="h-6 w-6 sm:h-8 sm:w-8 mb-2 sm:mb-3" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Deep Crawl</h3>
                  <p className="text-sm sm:text-base text-blue-100">50+ pages • For large-scale deployments</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guide Banners */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/guides/cookie-consent" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all border border-blue-100">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors" />
              <div className="relative z-10">
                <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 mb-4">
                  <Cookie className="h-3 w-3 mr-1.5" />
                  Guide
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  Complete Guide to Cookie Consent
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Learn everything about cookie compliance, scanning, and categorization.
                </p>
                <div className="flex items-center text-blue-600 font-medium text-sm">
                  Read Guide <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/guides/dpdpa-consent" className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all border border-purple-100">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-50 group-hover:bg-purple-100 transition-colors" />
              <div className="relative z-10">
                <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-purple-100 text-purple-700 mb-4">
                  <Shield className="h-3 w-3 mr-1.5" />
                  Guide
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                  Mastering DPDPA Compliance
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Understand your obligations under India's new data protection law.
                </p>
                <div className="flex items-center text-purple-600 font-medium text-sm">
                  Read Guide <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              Everything You Need for Compliance
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">Comprehensive tools built for Indian businesses</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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

      {/* Product Gallery Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-6 shadow-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              See It In Action
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Explore the Platform
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Browse through our features by category — cookie consent, DPDPA compliance, and analytics
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <ProductShowcase />
          </div>
        </div>
      </section>

      {/* Comparison Chart Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why Choose Consently?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              The ONLY DPDP-Compliant consent tool that supports 22 Indian languages
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-2xl shadow-xl overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="py-4 px-6 text-left font-bold text-base sm:text-lg">Feature</th>
                  <th className="py-4 px-6 text-center font-bold text-base sm:text-lg bg-gradient-to-r from-blue-700 to-purple-700">
                    <div className="flex flex-col items-center">
                      <span>Consently</span>
                      <Badge className="mt-2 bg-yellow-400 text-yellow-900 border-0">BEST</Badge>
                    </div>
                  </th>
                  <th className="py-4 px-6 text-center font-bold text-base sm:text-lg">CookieYes</th>
                  <th className="py-4 px-6 text-center font-bold text-base sm:text-lg">OneTrust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-900">DPDP 2023 Compliant</td>
                  <td className="py-4 px-6 text-center bg-blue-50">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-6 w-6 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-6 w-6 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-900">22 Indian Languages</td>
                  <td className="py-4 px-6 text-center bg-blue-50">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-6 w-6 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-6 w-6 text-red-500 mx-auto" />
                  </td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-900">Automated Cookie Scan</td>
                  <td className="py-4 px-6 text-center bg-blue-50">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center text-gray-600">Partial</td>
                  <td className="py-4 px-6 text-center text-gray-600">Partial</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-900">Setup Time</td>
                  <td className="py-4 px-6 text-center bg-blue-50">
                    <div className="font-bold text-blue-600">5 mins</div>
                  </td>
                  <td className="py-4 px-6 text-center text-gray-600">30 mins</td>
                  <td className="py-4 px-6 text-center text-gray-600">2+ hours</td>
                </tr>
                <tr className="hover:bg-blue-50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-gray-900">Audit Reports</td>
                  <td className="py-4 px-6 text-center bg-blue-50">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <X className="h-6 w-6 text-red-500 mx-auto" />
                  </td>
                  <td className="py-4 px-6 text-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg shadow-blue-500/30">
                Choose Consently — Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      null

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
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="text-blue-600">
                    Get Started Free
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

      {/* Customer Success Story / Testimonial */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Growing Businesses
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              See how companies are achieving DPDP compliance effortlessly
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-100 hover:border-blue-300 transition-all hover:-translate-y-1">
              <div className="flex items-start gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "We replaced CookieYes and saved 70% on costs while achieving full DPDP compliance.
                The 22-language support is a game-changer for our pan-India audience."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div>
                  <div className="font-bold text-gray-900">Sanjay Kumar</div>
                  <div className="text-sm text-gray-600">CTO, E-commerce Platform</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-purple-100 hover:border-purple-300 transition-all hover:-translate-y-1">
              <div className="flex items-start gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "Setup took literally 5 minutes. The automated cookie scanner found trackers
                we didn't even know existed. Best investment for compliance."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  P
                </div>
                <div>
                  <div className="font-bold text-gray-900">Priya Sharma</div>
                  <div className="text-sm text-gray-600">Founder, SaaS Startup</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-green-100 hover:border-green-300 transition-all hover:-translate-y-1">
              <div className="flex items-start gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xl">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                "Finally, a consent management solution that understands Indian regulations.
                The audit reports saved us during our compliance review."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                  R
                </div>
                <div>
                  <div className="font-bold text-gray-900">Rajesh Patel</div>
                  <div className="text-sm text-gray-600">VP Legal, Fintech Company</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 sm:mt-16">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                1000+
              </div>
              <div className="text-gray-600 text-sm sm:text-base">Active Websites</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                10M+
              </div>
              <div className="text-gray-600 text-sm sm:text-base">Consents Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                22
              </div>
              <div className="text-gray-600 text-sm sm:text-base">Languages Supported</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                5 min
              </div>
              <div className="text-gray-600 text-sm sm:text-base">Average Setup Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Built with Security & Privacy at the Core
            </h2>
            <p className="text-gray-600">Enterprise-grade security trusted by businesses across India</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg border-2 border-transparent hover:border-blue-200 transition-all">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">256-bit SSL</h3>
              <p className="text-xs text-gray-600">Bank-grade encryption</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg border-2 border-transparent hover:border-green-200 transition-all">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">DPDP 2023</h3>
              <p className="text-xs text-gray-600">Fully compliant</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg border-2 border-transparent hover:border-purple-200 transition-all">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Data Residency</h3>
              <p className="text-xs text-gray-600">India-hosted servers</p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-lg border-2 border-transparent hover:border-orange-200 transition-all">
              <div className="flex justify-center mb-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">99.9% Uptime</h3>
              <p className="text-xs text-gray-600">Always available</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              <Lock className="inline h-4 w-4 mr-1" />
              Your data is encrypted, tokenized, and never shared with third parties
            </p>
          </div>
        </div>
      </section>

      {/* Consulting Services Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white mb-6 shadow-lg shadow-blue-500/20">
              <Briefcase className="h-4 w-4 mr-2" />
              <span className="font-semibold">NEW</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Professional Consulting Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              End-to-end DPDP compliance consulting. We don't just give you a consent tool — we make your entire business DPDP-compliant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-4 shadow-lg">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Purpose Mapping</h3>
              <p className="text-gray-600 mb-4">Identify every place where your business collects personal data and map each to a clear, DPDP-compliant purpose.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center mb-4 shadow-lg">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Consent Architecture</h3>
              <p className="text-gray-600 mb-4">Design a fully DPDP-compliant consent architecture with granular purpose-level consent and withdrawal flows.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Compliance</h3>
              <p className="text-gray-600 mb-4">From gap assessment to implementation support, we guide you through every step of your compliance journey.</p>
            </div>
          </div>

          <div className="text-center">
            <Link href="/consulting">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30">
                Explore Consulting Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Everything you need to know about Consently
            </p>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border-2 border-blue-100 hover:border-blue-300 transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                <span className="text-blue-600 flex-shrink-0">Q:</span>
                Is Consently really DPDP 2023 compliant?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                <strong>A:</strong> Yes! Consently is built specifically for the Digital Personal Data Protection Act (DPDP) 2023.
                We handle all requirements including granular consent, purpose-specific data collection, data subject rights,
                and complete audit trails. Our platform is updated continuously to stay compliant with the latest regulations.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border-2 border-purple-100 hover:border-purple-300 transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                <span className="text-purple-600 flex-shrink-0">Q:</span>
                How long does implementation take?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                <strong>A:</strong> Most customers are live in under 5 minutes! Simply sign up, run a cookie scan on your website,
                customize your consent banner, and add one line of code to your site. Our automated scanner does the heavy lifting,
                and you can start collecting compliant consent immediately.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border-2 border-green-100 hover:border-green-300 transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                <span className="text-green-600 flex-shrink-0">Q:</span>
                What happens after the 1-month free trial?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                <strong>A:</strong> After your free month, you only pay ₹0.01 per consent recorded—no fixed monthly fees,
                no plan lock-in. If you collect 10,000 consents in a month, you pay only ₹100. If you collect 0 consents,
                you pay ₹0. Cancel anytime with zero penalties.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border-2 border-orange-100 hover:border-orange-300 transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                <span className="text-orange-600 flex-shrink-0">Q:</span>
                Do I need technical knowledge to set this up?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                <strong>A:</strong> No! Consently is designed for non-technical users. Our automated cookie scanner analyzes your
                website and generates a ready-to-use consent banner. You just copy one line of JavaScript code and paste it into
                your website. We provide step-by-step guides and priority support during your trial.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-6 border-2 border-pink-100 hover:border-pink-300 transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                <span className="text-pink-600 flex-shrink-0">Q:</span>
                Which Indian languages are supported?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                <strong>A:</strong> All 22 Schedule 8 languages: Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada,
                Malayalam, Odia, Punjabi, Assamese, Maithili, Sanskrit, Santali, Kashmiri, Nepali, Konkani, Sindhi, Dogri, Manipuri,
                and Bodo. Your consent banners automatically adapt based on user location and browser language preferences.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 border-2 border-indigo-100 hover:border-indigo-300 transition-all">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-start gap-2">
                <span className="text-indigo-600 flex-shrink-0">Q:</span>
                Can I use Consently on multiple websites?
              </h3>
              <p className="text-gray-700 leading-relaxed pl-6">
                <strong>A:</strong> Yes! There's no limit on the number of domains or websites. You pay only for actual consents
                recorded, regardless of how many websites you manage. Perfect for agencies managing multiple clients or businesses
                with multiple web properties.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">Still have questions?</p>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-blue-600 border-2 border-blue-600 hover:bg-blue-50">
                Contact Our Team
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
            Join 1000+ Indian businesses ensuring data protection compliance. Get <strong className="text-white">1 month free</strong> during our pre-launch!
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
    <div className="group p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-200 bg-white hover:shadow-2xl hover:border-transparent transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]">
      <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

