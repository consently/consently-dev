import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/ui/footer';
import { ScrollingBanner } from '@/components/ui/scrolling-banner';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  FileText,
  Database,
  Layers,
  Users,
  Search,
  Target,
  Briefcase,
  FileCheck,
  Trash2,
  AlertCircle,
  Award,
  Wrench,
  GraduationCap,
  Sparkles,
  Star,
  Crown,
} from 'lucide-react';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consulting Offerings - Consently | DPDP + Consent Management Services',
  description: 'End-to-end DPDP compliance consulting services. We don\'t just give you a consent tool — we make your entire business DPDP-compliant end-to-end.',
  keywords: [
    'DPDP consulting',
    'DPDP compliance services',
    'consent management consulting',
    'data protection consulting India',
    'DPDPA consulting',
    'privacy compliance consulting',
    'data lifecycle mapping',
    'consent architecture design',
  ],
  openGraph: {
    title: 'Consulting Offerings - Consently | DPDP Compliance Services',
    description: 'End-to-end DPDP compliance consulting services. Purpose mapping, data lifecycle mapping, consent architecture design, and more.',
    type: 'website',
  },
};

const consultingServices = [
  {
    id: 1,
    title: 'Purpose Mapping Workshop',
    icon: <Target className="h-6 w-6" />,
    description: 'We identify every place where your business collects personal data and map each to a clear, DPDP-compliant purpose.',
    deliverables: [
      'Full-purpose inventory list',
      'Purpose-to-page mapping',
      'Department-to-purpose mapping',
      'Legal basis for each purpose',
      'Purpose wording for notices',
      'Configuration of purposes inside your Consent Manager',
    ],
    pricing: {
      smb: '₹15,000',
      mid: '₹30,000',
      enterprise: '₹75,000–₹2,00,000',
    },
  },
  {
    id: 2,
    title: 'Data Lifecycle Mapping (End-to-End Data Journey)',
    icon: <Database className="h-6 w-6" />,
    description: 'We map your entire data flow: how personal data is collected, stored, processed, shared, retained, and deleted across your organization.',
    deliverables: [
      'Data flow diagram',
      'Data collection points',
      'Data storage inventory',
      'Internal sharing map',
      'External sharing map',
      'Retention schedule',
      'Deletion workflows',
    ],
    pricing: {
      smb: '₹20,000',
      mid: '₹50,000',
      enterprise: '₹1,00,000–₹3,00,000',
    },
  },
  {
    id: 3,
    title: 'Consent Architecture Design (Most Important)',
    icon: <Layers className="h-6 w-6" />,
    description: 'We design a fully DPDP-compliant consent architecture for your business.',
    includes: [
      'Identifying all pages/forms needing consent',
      'Designing granular purpose-level consent',
      'Creating modular consent notices',
      'Defining consent flows',
      'Withdrawal flows',
      'Expiry/re-consent logic',
      'Scalability and API architecture',
    ],
    deliverables: [
      'Architecture document',
      'Flowcharts',
      'Consent rules setup',
      'Implementation checklist',
    ],
    pricing: {
      smb: '₹25,000',
      mid: '₹60,000',
      enterprise: '₹1,50,000–₹3,00,000',
    },
  },
  {
    id: 4,
    title: 'Privacy Notice & Consent Notice Drafting',
    icon: <FileText className="h-6 w-6" />,
    description: 'We write all legally compliant notices required under DPDP.',
    deliverables: [
      'Privacy Policy (DPDP-compliant)',
      'Consent Notices (page-specific):',
      '  • Contact Us',
      '  • Career Page',
      '  • Marketing',
      '  • Analytics',
      '  • Customer Support',
      '  • E-commerce Checkout',
      '  • Vendor Onboarding',
    ],
    pricing: {
      perNotice: '₹3,000',
      completeSet: '₹20,000',
      fullPolicy: '₹15,000–₹50,000',
    },
  },
  {
    id: 5,
    title: 'Data Processing Inventory & Vendor Assessment',
    icon: <Briefcase className="h-6 w-6" />,
    description: 'We identify all tools, software, vendors, and partners that receive personal data, and we assess them for DPDP compliance.',
    deliverables: [
      'Vendor list',
      'Vendor risk assessment',
      'Data sharing mapping',
      'Model contract clauses',
      'DPDP-compliant processing agreements',
    ],
    pricing: {
      smb: '₹20,000',
      mid: '₹40,000',
      enterprise: '₹1,00,000–₹2,00,000',
    },
  },
  {
    id: 6,
    title: 'Data Retention & Deletion Framework',
    icon: <Trash2 className="h-6 w-6" />,
    description: 'We help you define how long each type of personal data should be kept and set up deletion or archiving workflows.',
    deliverables: [
      'Retention schedule',
      'Retention-policy document',
      'Auto-deletion workflows',
      'High-risk data flagging',
      'Consent withdrawal deletion rules',
    ],
    pricing: {
      smb: '₹10,000',
      mid: '₹25,000',
      enterprise: '₹75,000–₹1,50,000',
    },
  },
  {
    id: 7,
    title: 'DPDP Gap Assessment (Mini-Audit)',
    icon: <AlertCircle className="h-6 w-6" />,
    description: 'We review your current practices and identify gaps against DPDP compliance.',
    deliverables: [
      'Gap analysis report',
      'High-risk issues',
      'Remediation recommendations',
      'Priority matrix',
      'Action plan',
    ],
    pricing: {
      smb: '₹25,000',
      mid: '₹50,000',
      enterprise: '₹1,50,000–₹3,00,000',
    },
  },
  {
    id: 8,
    title: 'DPDP Readiness Certification (Premium)',
    icon: <Award className="h-6 w-6" />,
    description: 'Once your business becomes compliant, we issue a DPDP Readiness Certificate (not a government certificate, but recognized as a best-practice compliance certification).',
    includes: [
      'Review of purpose mapping',
      'Consent flows',
      'Notices',
      'Data lifecycle audit',
      'Security hygiene check',
    ],
    pricing: {
      smb: '₹15,000',
      mid: '₹40,000',
      enterprise: '₹1,00,000',
    },
  },
  {
    id: 9,
    title: 'Implementation Support (Technical + Legal Combined)',
    icon: <Wrench className="h-6 w-6" />,
    description: 'We help your tech team configure the Consent Manager, including custom workflows, event triggers, and API connections.',
    deliverables: [
      'Setup assistance',
      'QA testing',
      'Implementation documentation',
      'Weekly check-ins',
    ],
    pricing: {
      hourly: '₹1,500/hr',
      monthly: '₹30,000–₹1,00,000',
    },
  },
  {
    id: 10,
    title: 'Employee Training & Awareness Programs',
    icon: <GraduationCap className="h-6 w-6" />,
    description: 'DPDP requires internal teams to be aware of obligations.',
    deliverables: [
      'Live Zoom training',
      'Recording',
      'Training deck',
      'Knowledge check',
      'Implementation SOP',
    ],
    pricing: {
      single: '₹7,500',
      pack: '₹20,000',
      enterprise: '₹50,000–₹1,00,000',
    },
  },
];

const packages = [
  {
    id: 1,
    name: 'Essential DPDP Compliance Pack',
    price: '₹49,999',
    icon: <Star className="h-8 w-8" />,
    features: [
      'Purpose mapping',
      'Basic data lifecycle',
      '3 consent notices',
      'Privacy policy review',
      'Consent Manager setup',
    ],
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    id: 2,
    name: 'Advanced DPDP Compliance Pack',
    price: '₹1,49,999',
    icon: <Sparkles className="h-8 w-8" />,
    features: [
      'Full-purpose mapping',
      'Full data lifecycle',
      'All consent notices',
      'Privacy policy rewrite',
      'Vendor mapping',
      'Retention schedule',
      'DPDP gap assessment',
      'Consent architecture design',
    ],
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    id: 3,
    name: 'Enterprise Compliance Suit',
    price: '₹3,00,000–₹6,00,000',
    icon: <Crown className="h-8 w-8" />,
    features: [
      'All items in Advanced pack',
      'Full implementation',
      '10–20 vendor assessments',
      'Employee training',
      'Dedicated consultant',
      'DPDP readiness certificate',
      'Quarterly audits',
    ],
    gradient: 'from-amber-500 to-amber-600',
  },
];

export default function ConsultingPage() {
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
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-6 shadow-lg shadow-blue-500/20 relative">
              <Briefcase className="h-4 w-4 mr-2" />
              Professional Consulting Services
              <Badge className="ml-2 h-4 px-1.5 text-[10px] bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-md shadow-blue-500/20">
                NEW
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Consulting Offerings for
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                DPDP + Consent Management
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We don't just give you a consent tool — we make your entire business DPDP-compliant end-to-end.
            </p>
          </div>
        </div>
      </section>

      {/* Positioning Statement */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <p className="text-xl sm:text-2xl text-white text-center font-semibold leading-relaxed">
              "We don't just give you a consent tool — we make your entire business DPDP-compliant end-to-end."
            </p>
          </div>
        </div>
      </section>

      {/* Consulting Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Consulting Services
            </h2>
            <p className="text-xl text-gray-600">Comprehensive DPDP compliance solutions tailored to your business</p>
          </div>

          <div className="space-y-8">
            {consultingServices.map((service) => (
              <Card key={service.id} className="border-2 border-gray-200 hover:shadow-xl transition-all">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${
                      service.id === 3 ? 'from-purple-500 to-purple-600' :
                      service.id === 8 ? 'from-amber-500 to-amber-600' :
                      'from-blue-500 to-blue-600'
                    } text-white flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                          <CardDescription className="text-base">{service.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      {service.includes && (
                        <>
                          <h4 className="font-semibold text-gray-900 mb-3">Includes:</h4>
                          <ul className="space-y-2 mb-4">
                            {service.includes.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-600">
                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {service.deliverables && service.deliverables.length > 0 && (
                        <>
                          <h4 className="font-semibold text-gray-900 mb-3">Deliverables:</h4>
                          <ul className="space-y-2">
                            {service.deliverables.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-600">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4">Pricing:</h4>
                      <div className="space-y-3">
                        {service.pricing.smb && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">SMB:</span>
                            <span className="font-bold text-gray-900">{service.pricing.smb}</span>
                          </div>
                        )}
                        {service.pricing.mid && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Mid-size:</span>
                            <span className="font-bold text-gray-900">{service.pricing.mid}</span>
                          </div>
                        )}
                        {service.pricing.enterprise && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Enterprise:</span>
                            <span className="font-bold text-gray-900">{service.pricing.enterprise}</span>
                          </div>
                        )}
                        {service.pricing.perNotice && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Per Notice:</span>
                            <span className="font-bold text-gray-900">{service.pricing.perNotice}</span>
                          </div>
                        )}
                        {service.pricing.completeSet && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Complete Set (6–8 notices):</span>
                            <span className="font-bold text-gray-900">{service.pricing.completeSet}</span>
                          </div>
                        )}
                        {service.pricing.fullPolicy && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Full privacy policy rewrite:</span>
                            <span className="font-bold text-gray-900">{service.pricing.fullPolicy}</span>
                          </div>
                        )}
                        {service.pricing.hourly && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Hourly:</span>
                            <span className="font-bold text-gray-900">{service.pricing.hourly}</span>
                          </div>
                        )}
                        {service.pricing.monthly && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Monthly retainers:</span>
                            <span className="font-bold text-gray-900">{service.pricing.monthly}</span>
                          </div>
                        )}
                        {service.pricing.single && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Single session:</span>
                            <span className="font-bold text-gray-900">{service.pricing.single}</span>
                          </div>
                        )}
                        {service.pricing.pack && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">3-session pack:</span>
                            <span className="font-bold text-gray-900">{service.pricing.pack}</span>
                          </div>
                        )}
                        {service.pricing.enterprise && service.id === 10 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Enterprise onsite:</span>
                            <span className="font-bold text-gray-900">{service.pricing.enterprise}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Packaged Offerings */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white mb-6 shadow-lg shadow-green-500/20">
              <Sparkles className="h-4 w-4 mr-2" />
              High-Conversion Packages
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Packaged Offerings
            </h2>
            <p className="text-xl text-gray-600">Complete compliance solutions at bundled pricing</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border-2 border-gray-200 hover:shadow-2xl transition-all relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${pkg.gradient} opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
                <CardHeader className="relative z-10">
                  <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${pkg.gradient} text-white flex items-center justify-center mb-4 shadow-lg`}>
                    {pkg.icon}
                  </div>
                  <CardTitle className="text-2xl mb-2">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900 mt-4">{pkg.price}</div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <ul className="space-y-3">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link href="/contact">
                      <Button className={`w-full bg-gradient-to-r ${pkg.gradient} hover:opacity-90 text-white`}>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Achieve Full DPDP Compliance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Let our expert consultants guide you through every step of your compliance journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="text-blue-600">
                Contact Us for Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

