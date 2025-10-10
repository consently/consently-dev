import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Lock,
  FileCheck,
  BarChart3,
  Globe,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full px-4 py-1 text-sm bg-blue-100 text-blue-700 mb-6">
              <Shield className="h-4 w-4 mr-2" />
              DPDPA 2023 Compliant
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Consent Management
              <br />
              <span className="text-blue-600">Made Simple for India</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Complete DPDPA 2023 compliance platform. Automate cookie consent, data processing
              consent, and compliance reporting with ease.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Compliance
            </h2>
            <p className="text-xl text-gray-600">Comprehensive tools built for Indian businesses</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Cookie Consent Management"
              description="Scan, classify, and manage cookies automatically. Generate compliant consent banners in 22 Indian languages."
            />
            <FeatureCard
              icon={<FileCheck className="h-6 w-6" />}
              title="DPDPA Consent Handling"
              description="Manage data processing activities with pre-loaded templates for e-commerce, banking, healthcare, and more."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Real-time Dashboards"
              description="Track consent metrics, device types, and compliance status with detailed analytics and reports."
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="Privacy by Design"
              description="Email tokenization, data minimization, and end-to-end encryption for maximum security."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Multi-language Support"
              description="Support for 22 Indian languages including Schedule 8 languages and regional variations."
            />
            <FeatureCard
              icon={<CheckCircle2 className="h-6 w-6" />}
              title="Audit Trail & Reports"
              description="Complete audit logs with timestamps, IP addresses, and exportable compliance reports."
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Small"
              price="₹999"
              period="/month"
              features={[
                'Up to 10,000 consents/month',
                'Cookie & DPDPA consent',
                'Basic analytics',
                'Email support',
              ]}
            />
            <PricingCard
              name="Medium"
              price="₹2,499"
              period="/month"
              features={[
                'Up to 100,000 consents/month',
                'Advanced analytics',
                'Priority support',
                'Custom branding',
              ]}
              popular
            />
            <PricingCard
              name="Enterprise"
              price="Custom"
              period=""
              features={[
                'Unlimited consents',
                'Dedicated support',
                'SLA guarantees',
                'Custom integration',
              ]}
            />
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

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-bold text-white">Consently</span>
              </div>
              <p className="text-sm">DPDPA 2023 compliant consent management for Indian businesses.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2025 Consently. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-blue-100 bg-white hover:shadow-lg transition-shadow">
      <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  popular,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`p-8 rounded-xl border ${
        popular ? 'border-blue-600 shadow-lg scale-105' : 'border-gray-200'
      } bg-white relative`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="/signup">
        <Button className="w-full" variant={popular ? 'default' : 'outline'}>
          Get Started
        </Button>
      </Link>
    </div>
  );
}
