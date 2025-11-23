'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';
import { Shield, CheckCircle2, ArrowRight, Cookie, Lock, Globe, Zap } from 'lucide-react';

export default function CookieConsentGuide() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2">
                            <Shield className="h-7 w-7 text-blue-600" />
                            <span className="text-xl font-bold text-gray-900">Consently</span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link href="/signup">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="py-16 sm:py-24 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-blue-100 text-blue-700 mb-6 font-medium">
                        <Cookie className="h-4 w-4 mr-2" />
                        Comprehensive Guide
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Everything You Need to Know About <span className="text-blue-600">Cookie Consent</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        Understand the regulations, why it matters for your business, and how to implement it correctly with Consently.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-lg prose-blue mx-auto">
                        <h2>What is Cookie Consent?</h2>
                        <p>
                            Cookie consent is the legal requirement to obtain permission from website visitors before storing or retrieving information on their devices using cookies or similar tracking technologies. This is a fundamental aspect of modern privacy laws like GDPR, ePrivacy Directive, and India's DPDPA.
                        </p>

                        <h3>Why is it Important?</h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <span><strong>Legal Compliance:</strong> Avoid hefty fines and legal action from data protection authorities.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <span><strong>User Trust:</strong> Transparency about data collection builds trust with your audience.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <span><strong>Brand Reputation:</strong> Demonstrate your commitment to user privacy and data ethics.</span>
                            </li>
                        </ul>

                        <h2>How Consently Handles Cookie Consent</h2>
                        <p>
                            Consently simplifies the complex process of cookie compliance into an automated, set-and-forget solution.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 my-8 not-prose">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Zap className="h-8 w-8 text-blue-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Automated Scanning</h4>
                                <p className="text-gray-600 text-sm">
                                    Our crawler scans your website to identify and categorize every cookie automatically.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Globe className="h-8 w-8 text-green-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Geo-Targeting</h4>
                                <p className="text-gray-600 text-sm">
                                    Show the right banner to the right user based on their location and local laws.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Lock className="h-8 w-8 text-purple-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Auto-Blocking</h4>
                                <p className="text-gray-600 text-sm">
                                    Automatically block non-essential cookies until the user gives explicit consent.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Shield className="h-8 w-8 text-orange-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Consent Records</h4>
                                <p className="text-gray-600 text-sm">
                                    Maintain a secure audit trail of all user consents for compliance proof.
                                </p>
                            </div>
                        </div>

                        <h2>Implementation Steps</h2>
                        <ol>
                            <li>
                                <strong>Sign Up:</strong> Create your Consently account and add your website domain.
                            </li>
                            <li>
                                <strong>Scan:</strong> Run an initial scan to detect all cookies currently in use.
                            </li>
                            <li>
                                <strong>Configure:</strong> Customize your banner design and consent settings.
                            </li>
                            <li>
                                <strong>Embed:</strong> Add the generated one-line script to your website's header.
                            </li>
                        </ol>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 my-8 rounded-r-lg not-prose">
                            <h4 className="text-lg font-bold text-blue-900 mb-2">Ready to get compliant?</h4>
                            <p className="text-blue-800 mb-4">
                                Start your free trial today and get your website compliant in under 5 minutes.
                            </p>
                            <Link href="/signup">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
