'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Menu,
  X,
  Briefcase,
  Target,
  Users,
} from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">Consently</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              <Link href="/consulting" className="relative inline-flex items-center">
                <Button variant="ghost" size="sm" className="text-sm">Consulting</Button>
                <Badge className="absolute -top-0.5 -right-0.5 h-4 px-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md shadow-blue-500/20">
                  NEW
                </Badge>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm">Login</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-sm">Get Started</Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col space-y-2">
                <Link href="/consulting" onClick={() => setMobileMenuOpen(false)} className="relative inline-flex items-center w-full">
                  <Button variant="ghost" className="w-full justify-start text-left">
                    Consulting Services
                  </Button>
                  <Badge className="ml-auto h-4 px-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md shadow-blue-500/20">
                    NEW
                  </Badge>
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-left">
                    Login
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

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
              DPDPA 2023 Compliant
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight leading-tight px-4">
              Consent Management
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Made Simple for India
              </span>
            </h1>
            <p className="text-base sm:text-xl lg:text-2xl text-gray-600 mb-6 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4">
              Complete DPDPA 2023 compliance platform with automated cookie scanning.
              Scan, classify, and manage your entire website in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
            </div>
            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 px-4">
              <span className="flex items-center">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 text-green-500 flex-shrink-0" />
                No credit card required
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 text-green-500 flex-shrink-0" />
                1 month free trial
              </span>
              <span className="flex items-center">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 text-green-500 flex-shrink-0" />
                Cancel anytime
              </span>
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
                <Link href="/pricing">
                  <Button size="lg" variant="secondary" className="text-blue-600 w-full sm:w-auto">
                    Learn More
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
    <div className="group p-5 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-gray-200 bg-white hover:shadow-2xl hover:border-transparent transition-all duration-300 hover:-translate-y-1 active:scale-[0.98]">
      <div className={`h-12 w-12 sm:h-14 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

