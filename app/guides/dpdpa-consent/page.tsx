'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';
import { Shield, CheckCircle2, ArrowRight, FileText, Users, Lock, Globe, Zap } from 'lucide-react';

export default function DpdpaConsentGuide() {
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
            <section className="py-16 sm:py-24 bg-gradient-to-b from-purple-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-purple-100 text-purple-700 mb-6 font-medium">
                        <Shield className="h-4 w-4 mr-2" />
                        Compliance Guide
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Mastering <span className="text-purple-600">DPDPA 2023</span> Compliance
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        A complete guide to India's Digital Personal Data Protection Act and how to ensure your business is compliant.
                    </p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-lg prose-purple mx-auto">
                        <h2>What is DPDPA 2023?</h2>
                        <p>
                            The Digital Personal Data Protection Act (DPDPA) 2023 is India's comprehensive data privacy law. It mandates that businesses obtain free, specific, informed, unconditional, and unambiguous consent from users before processing their personal data.
                        </p>

                        <h2>The New Standard: Verified Consent</h2>
                        <p>
                            Consently has introduced a secure, email-first verification flow to ensure the highest standard of compliance and user trust. We've moved away from manual IDs to a seamless <strong>Email & OTP</strong> system.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 my-8 not-prose">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Lock className="h-8 w-8 text-blue-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Secure Verification</h4>
                                <p className="text-gray-600 text-sm">
                                    Users verify their identity via Email OTP, linking their consent preferences securely to their verified email address.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Zap className="h-8 w-8 text-purple-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Smart Pre-fill</h4>
                                <p className="text-gray-600 text-sm">
                                    The widget automatically detects email addresses from form submissions on your site to pre-fill the verification field.
                                </p>
                            </div>
                        </div>

                        <h2>Implementation Guide</h2>

                        <h3>Step 1: Configure Your Widget</h3>
                        <p>
                            In your dashboard, select the processing activities relevant to your business. Ensure you've enabled the "Smart Email Pre-fill" option in the behavior settings for the best user experience.
                        </p>

                        <h3>Step 2: Embed the Code</h3>
                        <p>
                            Add the following script tag to your website's footer. You can optionally pass the user's email if they are already logged in.
                        </p>

                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto not-prose mb-6">
                            <pre><code>{`<!-- Consently DPDPA Widget -->
<script src="https://www.consently.in/dpdpa-widget.js" 
        data-dpdpa-widget-id="YOUR_WIDGET_ID"
        data-dpdpa-email="{{user_email}}"> <!-- Optional -->
</script>`}</code></pre>
                        </div>

                        <h3>Step 3: The User Experience</h3>
                        <ol>
                            <li>
                                <strong>Consent Notice:</strong> Users see a clear notice of your processing activities.
                            </li>
                            <li>
                                <strong>Secure This Consent:</strong> Users can enter their email (or have it pre-filled) in the "Secure This Consent" section.
                            </li>
                            <li>
                                <strong>OTP Verification:</strong> A one-time password is sent to their email. Upon verification, a stable <strong>Consent ID</strong> is generated and linked to their email.
                            </li>
                            <li>
                                <strong>Preferences Saved:</strong> A premium glassmorphism notification confirms their choices are saved and offers a downloadable receipt.
                            </li>
                        </ol>

                        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 my-8 rounded-r-lg not-prose">
                            <h4 className="text-lg font-bold text-purple-900 mb-2">Ready to upgrade?</h4>
                            <p className="text-purple-800 mb-4">
                                Ensure your compliance is future-proof with our verified consent flow.
                            </p>
                            <Link href="/dashboard/dpdpa/widget">
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    Go to Widget Settings <ArrowRight className="ml-2 h-4 w-4" />
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
