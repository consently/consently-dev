import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/ui/footer';
import { Shield, Target, Users, Heart } from 'lucide-react';

export const metadata = {
  title: 'About Us - Consently',
  description: 'Learn about Consently and our mission to make DPDPA 2023 compliance simple for Indian businesses.',
};

export default function AboutPage() {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              About Consently
            </h1>
            <p className="text-xl text-gray-600">
              Making DPDPA 2023 compliance simple, transparent, and accessible for every Indian business.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardContent className="p-8">
                <Target className="h-12 w-12 text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                <p className="text-gray-600">
                  To empower Indian businesses of all sizes to achieve and maintain DPDPA 2023 compliance 
                  through intuitive, automated, and affordable consent management solutions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <Heart className="h-12 w-12 text-blue-600 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h2>
                <p className="text-gray-600">
                  A future where data privacy is not a burden but a standard practice, where businesses 
                  and consumers trust each other, and compliance is seamless and transparent.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Story */}
          <Card className="mb-16">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Consently was born out of the need for a comprehensive, India-focused consent management 
                  platform following the Digital Personal Data Protection Act (DPDPA) 2023.
                </p>
                <p>
                  We recognized that while global solutions exist, Indian businesses needed a platform that 
                  understands the unique requirements of DPDPA 2023, supports 22 Indian languages, and offers 
                  solutions that work for businesses of all sizes—from startups to enterprises.
                </p>
                <p>
                  Our team combines expertise in data privacy law, software engineering, and user experience 
                  design to create a solution that's both powerful and easy to use.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Privacy First</h3>
                <p className="text-gray-600">
                  We practice what we preach. Your data security and privacy are our top priorities.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Customer Success</h3>
                <p className="text-gray-600">
                  Your success is our success. We're committed to helping you achieve compliance.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Transparency</h3>
                <p className="text-gray-600">
                  No hidden costs, no surprises. We believe in honest communication and clear value.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-blue-600 border-blue-600">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-blue-100 mb-6">
                Join hundreds of Indian businesses achieving DPDPA 2023 compliance with Consently.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Claim Your Free Month
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
