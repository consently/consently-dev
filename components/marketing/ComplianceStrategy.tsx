import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, Cog, FileText, Users } from 'lucide-react';

export function ComplianceStrategy() {
    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    <div>
                        <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-blue-50 text-blue-700 font-medium mb-6">
                            <Clock className="h-4 w-4 mr-2" />
                            3-Month Compliance Roadmap
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                            How Consently Helps You Achieve Compliance in <span className="text-blue-600">3 Months</span>
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Don't navigate the complexities of specific sectors alone. Our unique <strong>Consulting + Tools</strong> combo
                            provides the most comprehensive path to compliance. We combine legal expertise
                            with the <strong>best consent management platform in India</strong> to ensure you are audit-ready.
                        </p>

                        <div className="space-y-6 mb-10">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Cog className="h-5 w-5 text-green-700" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Automate Technical Compliance</h3>
                                    <p className="text-gray-600">
                                        Use our tools to <strong>automate cookie scanning</strong> for DPDPA, manage consent preferences,
                                        and maintain digital audit trails without manual effort.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Users className="h-5 w-5 text-purple-700" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">Expert Consulting Support</h3>
                                    <p className="text-gray-600">
                                        Our experts help interpret <strong>GDPR vs DPDPA</strong> nuances, map your data flows,
                                        and design policy frameworks tailored to your sector.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link href="/consulting">
                            <Button size="lg" className="text-lg px-8 py-6 shadow-xl shadow-blue-500/20">
                                Start Your 3-Month Plan
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-3xl transform rotate-3 scale-105 opacity-50" />
                        <div className="relative bg-white border border-gray-100 rounded-2xl shadow-xl p-8 sm:p-10">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Your Road to Compliance</h3>

                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">

                                {/* Month 1 */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <span className="text-blue-600 font-bold">1</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-gray-900">Month 1: Assessment</div>
                                        </div>
                                        <div className="text-gray-600 text-sm">Gap analysis, Data mapping, and installing Consently tracking pixels.</div>
                                    </div>
                                </div>

                                {/* Month 2 */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-purple-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <span className="text-purple-600 font-bold">2</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-gray-900">Month 2: Implementation</div>
                                        </div>
                                        <div className="text-gray-600 text-sm">Configuration of consent banners, policy drafting, and technical integration.</div>
                                    </div>
                                </div>

                                {/* Month 3 */}
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-green-500 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <span className="text-green-600 font-bold">3</span>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-gray-50 shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 mb-1">
                                            <div className="font-bold text-gray-900">Month 3: Assurance</div>
                                        </div>
                                        <div className="text-gray-600 text-sm">Staff training, mock audits, and full Go-Live certification.</div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
