import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/ui/footer';
import { ScrollingBanner } from '@/components/ui/scrolling-banner';
import { Shield, CheckCircle2, ArrowRight, Zap, Star, Crown, Search, Sparkles, Gift, Rocket, Calendar } from 'lucide-react';

export const metadata = {
  title: 'Pricing - Consently',
  description: 'Pre-launch offer: Get 1 month free trial. DPDPA 2023 compliance made simple for Indian businesses.',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <ScrollingBanner />
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
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-6 shadow-lg shadow-blue-500/20">
              <Rocket className="h-4 w-4 mr-2" />
              Pre-Launch Special Offer
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Start Your Journey to DPDPA Compliance
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're launching soon! Join our pre-launch program and get <span className="font-bold text-blue-600">1 month free trial</span> on all plans. Experience full DPDPA 2023 compliance features, multi-language support, and automated consent management.
            </p>
          </div>

          {/* Pre-Launch Offer Card */}
          <div className="max-w-4xl mx-auto">
            <Card className="relative border-2 border-blue-500 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-blue-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              
              <CardHeader className="relative z-10 pb-8 text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-6 shadow-xl mx-auto">
                  <Gift className="h-10 w-10" />
                </div>
                <CardTitle className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                  Pre-Launch Special Offer
                </CardTitle>
                <CardDescription className="text-xl text-gray-600 mb-6">
                  Get <span className="font-bold text-blue-600 text-2xl">1 Month Free Trial</span> on All Plans
                </CardDescription>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
                  <Calendar className="h-4 w-4" />
                  <span>Limited time offer for early adopters</span>
                </div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What's Included</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Full Platform Access</h4>
                        <p className="text-sm text-gray-600">Experience all features across all plans</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">DPDPA Compliance Tools</h4>
                        <p className="text-sm text-gray-600">Complete consent management solution</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">22 Indian Languages</h4>
                        <p className="text-sm text-gray-600">Multi-language support included</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Priority Support</h4>
                        <p className="text-sm text-gray-600">Dedicated support during trial</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-600 mb-6 text-lg">
                    Pricing details will be revealed soon. Join now to secure your spot and get 1 month free!
                  </p>
                  <Link href="/signup">
                    <Button size="lg" className="text-lg px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 text-white">
                      Claim Your Free Month
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <p className="text-sm text-gray-500 mt-4">
                    No credit card required • Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Overview */}
          <div className="mt-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need for DPDPA Compliance
              </h2>
              <p className="text-xl text-gray-600">Comprehensive features included in all plans</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="border-2 border-gray-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-4">
                    <Search className="h-6 w-6" />
                  </div>
                  <CardTitle>Automated Cookie Scanning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Scan from homepage to entire website. Automatically classify cookies and generate compliance reports.</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6" />
                  </div>
                  <CardTitle>DPDPA Consent Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Complete consent handling with pre-loaded templates for various industries and use cases.</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <CardTitle>22 Indian Languages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Support for all Schedule 8 languages with auto-generated consent banners.</p>
                </CardContent>
              </Card>
            </div>
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
                <CardTitle className="text-lg">What's the pre-launch offer?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We're offering <strong>1 month free trial</strong> to all early adopters who sign up during our pre-launch period. This gives you full access to explore all features before we reveal our pricing.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">When will pricing be available?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We're finalizing our pricing structure and will announce it soon. Early adopters who join now will be grandfathered into special pricing when we launch.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do I need a credit card to start?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  No credit card required! Sign up now and enjoy your free month. We'll notify you before your trial ends.
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
            Claim your <strong className="text-white">1 month free trial</strong> today. No credit card required.
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
