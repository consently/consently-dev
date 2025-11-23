'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/ui/footer';
import { Shield, CheckCircle2, ArrowRight, FileText, Users, Lock, Globe } from 'lucide-react';

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
                            The Digital Personal Data Protection Act (DPDPA) 2023 is India's comprehensive data privacy law. It governs how digital personal data is processed, recognizing both the rights of individuals (Data Principals) to protect their personal data and the need to process such data for lawful purposes.
                        </p>

                        <h3>Key Requirements</h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <span><strong>Notice & Consent:</strong> Provide clear notice and obtain free, specific, informed, unconditional, and unambiguous consent.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <span><strong>Data Principal Rights:</strong> Respect rights to access, correction, erasure, and grievance redressal.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                                <span><strong>Data Fiduciary Duties:</strong> Implement security safeguards, report breaches, and erase data when no longer needed.</span>
                            </li>
                        </ul>

                        <h2>How Consently Simplifies DPDPA</h2>
                        <p>
                            Consently provides a purpose-built platform to handle the unique requirements of the Indian market and DPDPA regulations.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 my-8 not-prose">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Globe className="h-8 w-8 text-blue-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Multilingual Support</h4>
                                <p className="text-gray-600 text-sm">
                                    Native support for 22 Indian languages to ensure your consent notices are understood by everyone.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <FileText className="h-8 w-8 text-purple-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Consent Manager</h4>
                                <p className="text-gray-600 text-sm">
                                    Granular consent management for different processing activities and purposes.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Users className="h-8 w-8 text-green-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Rights Automation</h4>
                                <p className="text-gray-600 text-sm">
                                    Automated workflows to handle Data Principal requests for access, correction, and erasure.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <Lock className="h-8 w-8 text-orange-600 mb-4" />
                                <h4 className="text-lg font-bold mb-2">Security First</h4>
                                <p className="text-gray-600 text-sm">
                                    Enterprise-grade security with encryption and tokenization to protect personal data.
                                </p>
                            </div>
                        </div>

                        <h2>Getting Compliant</h2>
                        <ol>
                            <li>
                                <strong>Identify Data:</strong> Map out what personal data you collect and why.
                            </li>
                            <li>
                                <strong>Update Notices:</strong> Ensure your privacy notices are clear and available in local languages.
                            </li>
                            <li>
                                <strong>Implement Consent:</strong> Use Consently to gather and manage valid consent.
                            </li>
                            <li>
                                <strong>Train Staff:</strong> Educate your team on their responsibilities under the new law.
                            </li>
                        </ol>

                        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 my-8 rounded-r-lg not-prose">
                            <h4 className="text-lg font-bold text-purple-900 mb-2">Don't risk non-compliance</h4>
                            <p className="text-purple-800 mb-4">
                                Penalties under DPDPA can reach up to ₹250 Crore. Secure your business with Consently today.
                            </p>
                            <Link href="/signup">
                                <Button className="bg-purple-600 hover:bg-purple-700">
                                    Start Compliance Journey <ArrowRight className="ml-2 h-4 w-4" />
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
