import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle2, ArrowRight, Zap, Star, Crown, Search, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'Pricing - Consently',
  description: 'Transparent pricing for DPDPA 2023 compliance. Choose the plan that fits your needs.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Navigation */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Consently</span>
            </Link>
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
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white mb-6 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-4 w-4 mr-2" />
              Flexible Cookie Scanning Plans
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose your cookie scanning depth. All plans include DPDPA 2023 compliance features, multi-language support, and automated consent management.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="relative border-2 border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white flex items-center justify-center shadow-lg">
                    <Zap className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold">Free</CardTitle>
                <CardDescription className="text-base">Perfect for getting started</CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900">₹0</span>
                  <span className="text-gray-600 text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 flex items-center">
                    <Search className="h-4 w-4 mr-2 text-gray-600" />
                    Quick Scan - Homepage only
                  </p>
                </div>
                <Link href="/signup">
                  <Button variant="outline" className="w-full mb-6 text-base py-6">
                    Get Started Free
                  </Button>
                </Link>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Homepage cookie scanning</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Up to 5,000 consents/month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Basic cookie consent banner</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">DPDPA consent management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Automatic cookie classification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Email support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 border-blue-600 shadow-2xl scale-105 bg-gradient-to-b from-blue-50 to-white">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  Most Popular
                </span>
              </div>
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg">
                    <Star className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold">Premium</CardTitle>
                <CardDescription className="text-base">Best for growing businesses</CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900">₹999</span>
                  <span className="text-gray-600 text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm font-semibold text-blue-600 flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Standard Scan - Top 10 URLs
                  </p>
                </div>
                <Link href="/signup">
                  <Button className="w-full mb-6 text-base py-6 shadow-lg shadow-blue-500/30">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Top 10 most important URLs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Up to 50,000 consents/month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Advanced cookie analytics dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Custom banner branding & colors</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">All 22 Indian languages</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Priority email support (24h response)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Export reports (CSV/JSON/PDF)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Scan history (last 50 scans)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative border-2 border-purple-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                    <Crown className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold">Enterprise</CardTitle>
                <CardDescription className="text-base">For large-scale deployments</CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900">₹2,499</span>
                  <span className="text-gray-600 text-lg">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-sm font-semibold text-purple-600 flex items-center">
                    <Search className="h-4 w-4 mr-2" />
                    Deep Crawl - 50+ pages
                  </p>
                </div>
                <Link href="/signup">
                  <Button variant="outline" className="w-full mb-6 text-base py-6 border-purple-600 text-purple-600 hover:bg-purple-50">
                    Get Started
                  </Button>
                </Link>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 font-medium">Entire website scan (50+ pages)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Unlimited consents & page views</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Advanced compliance reporting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">99.9% uptime SLA guarantee</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Custom API integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">24/7 phone & email support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">White-label options available</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Unlimited scan history</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Cookie Scanning Features Comparison */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Detailed Feature Comparison
              </h2>
              <p className="text-xl text-gray-600">See exactly what's included in each plan</p>
            </div>
            <Card className="max-w-5xl mx-auto shadow-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <tr className="border-b-2 border-blue-200">
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Feature</th>
                        <th className="text-center py-4 px-6 font-bold text-gray-900">Free</th>
                        <th className="text-center py-4 px-6 font-bold text-blue-600">Premium</th>
                        <th className="text-center py-4 px-6 font-bold text-purple-600">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Cookie Scan Depth</td>
                        <td className="text-center py-4 px-6 text-gray-600">Homepage only</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">Top 10 URLs</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">Entire website (50+ pages)</td>
                      </tr>
                      <tr className="border-b bg-blue-50/30 hover:bg-blue-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Monthly Consents</td>
                        <td className="text-center py-4 px-6 text-gray-600">5,000</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">50,000</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">Unlimited</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Automatic Cookie Classification</td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                      </tr>
                      <tr className="border-b bg-blue-50/30 hover:bg-blue-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Compliance Score & Insights</td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Export Reports</td>
                        <td className="text-center py-4 px-6 text-gray-600">CSV only</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">CSV, JSON, PDF</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">All + Custom</td>
                      </tr>
                      <tr className="border-b bg-blue-50/30 hover:bg-blue-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Scan History</td>
                        <td className="text-center py-4 px-6 text-gray-600">Last 5 scans</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">Last 50 scans</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">Unlimited</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Auto Banner Generation</td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                      </tr>
                      <tr className="border-b bg-blue-50/30 hover:bg-blue-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Multi-language Support</td>
                        <td className="text-center py-4 px-6 text-gray-600">Basic</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">22 Languages</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">22 Languages</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Custom Branding</td>
                        <td className="text-center py-4 px-6 text-gray-400">—</td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                        <td className="text-center py-4 px-6"><CheckCircle2 className="h-5 w-5 text-green-500 inline" /></td>
                      </tr>
                      <tr className="border-b bg-blue-50/30 hover:bg-blue-50">
                        <td className="py-4 px-6 font-medium text-gray-900">Priority Support</td>
                        <td className="text-center py-4 px-6 text-gray-400">—</td>
                        <td className="text-center py-4 px-6 text-gray-600">24h response</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">24/7 dedicated</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">SLA & Uptime Guarantee</td>
                        <td className="text-center py-4 px-6 text-gray-400">—</td>
                        <td className="text-center py-4 px-6 text-gray-400">—</td>
                        <td className="text-center py-4 px-6 text-gray-900 font-medium">99.9%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I upgrade or downgrade my plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my consent limit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  If you exceed your plan's consent limit, you'll be notified via email. You can either upgrade your plan or purchase additional consent capacity.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! All plans come with a 14-day free trial. No credit card required to get started.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We accept all major credit/debit cards, UPI, and net banking through our secure payment gateway.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your free 14-day trial today. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-blue-600">
              Start Free Trial
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
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-bold text-white">Consently</span>
              </Link>
              <p className="text-sm">DPDPA 2023 compliant consent management for Indian businesses.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/#features" className="hover:text-white transition-colors">
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
