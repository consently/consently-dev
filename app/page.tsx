import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';
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
} from 'lucide-react';

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Consently',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        name: 'Free Plan',
      },
      {
        '@type': 'Offer',
        price: '999',
        priceCurrency: 'INR',
        name: 'Premium Plan',
      },
      {
        '@type': 'Offer',
        price: '2499',
        priceCurrency: 'INR',
        name: 'Enterprise Plan',
      },
    ],
    description:
      'DPDPA 2023 compliant consent management platform for Indian businesses. Automate cookie consent, data processing consent, and compliance reporting.',
    url: 'https://www.consently.in',
    inLanguage: ['en', 'hi'],
    featureList: [
      'Automated Cookie Scanning',
      'DPDPA Consent Handling',
      '22 Indian Languages Support',
      'Real-time Analytics',
      'Audit Trail & Reports',
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navigation */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Consently</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/blog">
                <Button variant="ghost" className="hidden sm:flex">Blog</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" className="hidden sm:flex">Pricing</Button>
              </Link>
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
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                  View Pricing
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
                14-day free trial
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
                    See Scanning Plans
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Search className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Quick Scan</h3>
                  <p className="text-blue-100">Homepage analysis • Free forever</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <BarChart3 className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Standard Scan</h3>
                  <p className="text-blue-100">Top 10 URLs • Premium plan at ₹999/mo</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <Globe className="h-8 w-8 mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Deep Crawl</h3>
                  <p className="text-blue-100">50+ pages • Enterprise at ₹2,499/mo</p>
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

      {/* Pricing Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">Choose the cookie scanning depth that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              name="Free"
              price="₹0"
              period="/month"
              scanType="Quick Scan - Homepage only"
              features={[
                'Up to 5,000 consents/month',
                'Basic cookie consent banner',
                'DPDPA consent management',
                'Email support',
              ]}
            />
            <PricingCard
              name="Premium"
              price="₹999"
              period="/month"
              scanType="Standard Scan - Top 10 URLs"
              features={[
                'Up to 50,000 consents/month',
                'Custom banner branding',
                '22 Indian languages',
                'Priority support',
              ]}
              popular
            />
            <PricingCard
              name="Enterprise"
              price="₹2,499"
              period="/month"
              scanType="Deep Crawl - 50+ pages"
              features={[
                'Unlimited consents',
                'Dedicated account manager',
                'SLA guarantees',
                'Custom integrations',
              ]}
            />
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
              View detailed comparison
              <ArrowRight className="ml-2 h-4 w-4" />
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
            Join hundreds of Indian businesses ensuring data protection compliance
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-blue-600">
              Start Your Free Trial
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

function PricingCard({
  name,
  price,
  period,
  scanType,
  features,
  popular,
}: {
  name: string;
  price: string;
  period: string;
  scanType: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-2xl border-2 ${
        popular 
          ? 'border-blue-600 shadow-2xl scale-105 bg-gradient-to-b from-blue-50 to-white' 
          : 'border-gray-200 bg-white hover:shadow-xl'
      } relative transition-all duration-300`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-5xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600 text-lg">{period}</span>
      </div>
      <div className="mb-6 pb-6 border-b border-gray-200">
        <p className="text-sm font-medium text-blue-600 flex items-center">
          <Search className="h-4 w-4 mr-2" />
          {scanType}
        </p>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="/signup">
        <Button 
          className={`w-full text-base py-6 ${
            popular ? 'shadow-lg shadow-blue-500/30' : ''
          }`} 
          variant={popular ? 'default' : 'outline'}
        >
          Get Started
        </Button>
      </Link>
    </div>
  );
}
