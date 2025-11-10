'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Briefcase, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ConsentlyWidget from '@/components/dpdpa/ConsentlyWidget';

export default function CareersPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    coverLetter: '',
  });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Create mailto link with form data
    const subject = encodeURIComponent(`Career Application: ${formData.position} - ${formData.name}`);
    const body = encodeURIComponent(`
Application Details:
-------------------
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Position: ${formData.position}
${formData.coverLetter ? `\nCover Letter:\n${formData.coverLetter}` : ''}

Please attach your resume to this email.

---
This application was submitted through the Consently careers page.
    `.trim());

    const mailtoLink = `mailto:hello@consently.in?subject=${subject}&body=${body}`;
    
    // Open Gmail/email client
    window.location.href = mailtoLink;
    
    toast.success('Opening your email client. Please attach your resume and send!');
    
    // Reset form after a delay
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        coverLetter: '',
      });
      (e.target as HTMLFormElement).reset();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <ConsentlyWidget widgetId="dpdpa_mhnhpimc_atq70ak" />
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-6">
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Join the Consently Team
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
              Help us build the future of privacy compliance in India. We're looking for talented individuals who are passionate about data protection and technology.
            </p>
            <p className="text-lg text-blue-600 font-semibold">
              ⚠️ We are hiring for limited positions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle>Why Work at Consently?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Work on cutting-edge privacy technology</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Make a real impact on Indian businesses</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Collaborative and inclusive work culture</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Competitive compensation and benefits</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Remote-friendly work environment</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">Software Engineer</h3>
                    <p className="text-sm text-gray-600">Full-time • Remote/On-site</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">Product Designer</h3>
                    <p className="text-sm text-gray-600">Full-time • Remote</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">Sales & Marketing</h3>
                    <p className="text-sm text-gray-600">Full-time • Remote</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Don't see a role that fits? We're always looking for great talent. Apply below!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Application</CardTitle>
              <CardDescription>
                Fill out the form below and click submit to open your email client. Please attach your resume to the email before sending.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    name="name"
                    label="Full Name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    type="email"
                    name="email"
                    label="Email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    type="tel"
                    name="phone"
                    label="Phone Number"
                    placeholder="+91 1234567890"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    type="text"
                    name="position"
                    label="Position Applied For"
                    placeholder="e.g., Software Engineer"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Letter (Optional)
                  </label>
                  <Textarea
                    name="coverLetter"
                    placeholder="Tell us why you're interested in joining Consently..."
                    rows={5}
                    value={formData.coverLetter}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Note:</strong> After clicking submit, your email client (Gmail, Outlook, etc.) will open with a pre-filled email. 
                    <strong className="text-blue-600"> Please attach your resume</strong> to the email before sending it to hello@consently.in
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Opening Email...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Open Email Client & Attach Resume
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
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
                <li>
                  <Link href="/careers" className="hover:text-white transition-colors">
                    Careers
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

