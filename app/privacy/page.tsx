import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Consently",
  description: "Learn how Consently collects, uses, protects, and discloses your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-500 text-lg">Last Updated: December 02, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white shadow-lg rounded-2xl border border-slate-100 p-8 md:p-12">
          <div className="prose prose-slate prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Introduction
              </h2>
              <p className="text-slate-600 leading-relaxed">
                This Privacy Policy outlines how Consently (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, utilizes, protects, and discloses your personal data when you engage with our website (www.consently.in), our platform, or our suite of compliance and consent management services (collectively, the &quot;Services&quot;).
              </p>
              <p className="text-slate-600 leading-relaxed mt-4">
                By accessing or using Consently, you acknowledge that you have read this policy and agree to the data practices described herein. Our commitment to your privacy is built on transparency, security, and the minimization of data collection to what is strictly necessary.
              </p>
            </section>

            {/* Section 1 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                1. Information We Collect
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                To provide a seamless consent management and compliance experience, we collect specific categories of data. We categorize this information into data you provide to us directly, data we collect automatically, and data received from third parties.
              </p>

              {/* A. Information You Provide */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">A. Information You Provide</h3>
                <p className="text-slate-600 mb-4">
                  We collect information that you voluntarily share with us to establish your account and utilize our Services:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-700">Account & Registration Data:</strong>
                      <span className="text-slate-600"> When you register your organization on Consently, we collect details such as your full name, company name, business email address, phone number, job title, and secure authentication credentials (hashed passwords).</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-700">Support & Communications:</strong>
                      <span className="text-slate-600"> If you contact us for technical support or sales inquiries, we collect your contact details and the content of your messages to resolve your queries effectively.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-700">Billing Information:</strong>
                      <span className="text-slate-600"> For paid subscriptions, we collect billing addresses and transaction details. Note: We do not store credit card information on our servers; this is handled securely by our payment processing partners.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-700">Platform Data:</strong>
                      <span className="text-slate-600"> As a consent management tool, you may input data regarding your own users, data mappings, or compliance preferences. While Consently processes this data, you remain the Data Controller, and we act as the Data Processor.</span>
                    </div>
                  </li>
          </ul>
              </div>

              {/* B. Information Collected Automatically */}
              <div className="bg-slate-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">B. Information Collected Automatically</h3>
                <p className="text-slate-600 mb-4">
                  When you navigate our platform, we use technical means to ensure security and improve performance:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-700">Device Telemetry:</strong>
                      <span className="text-slate-600"> IP address, browser type, operating system, device identifiers (MAC/IMEI), and approximate location based on IP.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-700">Usage Logs:</strong>
                      <span className="text-slate-600"> Data regarding how you interact with the dashboard, including click paths, time spent on modules, feature usage, and error logs.</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <strong className="text-slate-700">Cookies & Pixels:</strong>
                      <span className="text-slate-600"> We use cookies to authenticate sessions, remember user preferences, and analyze platform performance. You can control these via your browser settings.</span>
                    </div>
                  </li>
          </ul>
              </div>

              {/* C. Information from Third Parties */}
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">C. Information from Third Parties</h3>
                <p className="text-slate-600">
                  We may receive business contact data from partners, lead generation tools, or public professional sources (like LinkedIn) to validate business profiles or facilitate integrations you have requested.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                2. How We Use Your Information
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We use the data we collect for specific, legitimate business purposes:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-violet-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-slate-700">Core Service Delivery:</strong>
                    <span className="text-slate-600"> To authenticate your access, manage your consent logs, and execute the compliance features you have subscribed to.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-violet-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-slate-700">Platform Optimization:</strong>
                    <span className="text-slate-600"> To analyze usage patterns (analytics) which helps us debug issues and develop new features.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-violet-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-slate-700">Communication:</strong>
                    <span className="text-slate-600"> To send you transactional emails (invoices, password resets) and important product updates.</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-2 h-2 bg-violet-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <div>
                    <strong className="text-slate-700">Security & Compliance:</strong>
                    <span className="text-slate-600"> To detect unauthorized access, prevent fraud, and comply with legal obligations under the DPDP Act, 2023, and GDPR.</span>
                  </div>
                </li>
          </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                3. Disclosure of Personal Information
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                We do not sell your data. We share data only when necessary to provide our Services or when required by law.
              </p>
              
              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left py-4 px-6 font-semibold text-slate-700 border-b border-slate-200">Recipient Category</th>
                      <th className="text-left py-4 px-6 font-semibold text-slate-700 border-b border-slate-200">Purpose of Sharing</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700 font-medium">Service Providers</td>
                      <td className="py-4 px-6 text-slate-600">Hosting (Cloud), Data Storage, Analytics, and Customer Support tools. All vendors are vetted for security compliance.</td>
                    </tr>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <td className="py-4 px-6 text-slate-700 font-medium">Legal Authorities</td>
                      <td className="py-4 px-6 text-slate-600">We may disclose data if compelled by a subpoena, court order, or to prevent fraud/harm to Consently or its users.</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-4 px-6 text-slate-700 font-medium">Business Transfers</td>
                      <td className="py-4 px-6 text-slate-600">In the event of a merger, acquisition, or asset sale, user data may be transferred as a business asset under strict confidentiality.</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-slate-700 font-medium">Affiliates</td>
                      <td className="py-4 px-6 text-slate-600">Shared with group companies for internal administration and operational support.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                4. Legal Basis for Processing
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                In compliance with the Digital Personal Data Protection Act, 2023 (India) and the GDPR, we process your data based on:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">Consent</h4>
                  <p className="text-blue-800 text-sm">When you explicitly agree to us processing your data (e.g., marketing newsletters).</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <h4 className="font-semibold text-emerald-900 mb-2">Contractual Necessity</h4>
                  <p className="text-emerald-800 text-sm">To fulfill our Terms of Service obligations to you (e.g., providing the software).</p>
                </div>
                <div className="bg-violet-50 rounded-xl p-5 border border-violet-100">
                  <h4 className="font-semibold text-violet-900 mb-2">Legitimate Interest</h4>
                  <p className="text-violet-800 text-sm">For fraud detection, security, and product improvement.</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                  <h4 className="font-semibold text-amber-900 mb-2">Legal Obligation</h4>
                  <p className="text-amber-800 text-sm">When we are required by statutory authorities to retain or disclose data.</p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                5. Your Rights and Controls
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We believe you should have full control over your data. Depending on your jurisdiction, you have the following rights:
              </p>
              <div className="space-y-3">
                <div className="flex items-start p-4 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-slate-700">Right to Access:</strong>
                    <span className="text-slate-600"> Request a copy of the personal data we hold about you.</span>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-slate-700">Right to Correction:</strong>
                    <span className="text-slate-600"> Update or rectify inaccurate or incomplete data.</span>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-slate-700">Right to Erasure (Right to be Forgotten):</strong>
                    <span className="text-slate-600"> Request deletion of your data, subject to legal retention requirements.</span>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-slate-700">Right to Withdraw Consent:</strong>
                    <span className="text-slate-600"> You may withdraw consent for specific processing activities (like marketing) at any time.</span>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="text-slate-700">Right to Grievance Redressal:</strong>
                    <span className="text-slate-600"> You have the right to file a complaint regarding our data practices.</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 mt-4">
                To exercise any of these rights, please contact our Data Protection Officer (details below).
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                6. Data Security
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Consently employs enterprise-grade security measures to protect your information.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold mb-2">Encryption</h4>
                  <p className="text-slate-300 text-sm">All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).</p>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold mb-2">Access Control</h4>
                  <p className="text-slate-300 text-sm">Strict Role-Based Access Control (RBAC) and Multi-Factor Authentication (MFA).</p>
                </div>
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h4 className="font-semibold mb-2">Audits</h4>
                  <p className="text-slate-300 text-sm">Regular vulnerability assessments and compliance with ISO 27001 / SOC 2 frameworks.</p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                7. International Data Transfers
              </h2>
              <p className="text-slate-600 leading-relaxed">
                As a modern SaaS platform, we may process data on servers located outside your country of residence (e.g., AWS/Azure servers in appropriate regions). We ensure these transfers comply with the DPDP Act and GDPR by utilizing Standard Contractual Clauses (SCCs) and ensuring the destination country has adequate data protection standards.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-10">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                8. Data Retention
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We retain your personal data only for as long as is necessary to fulfill the purposes for which it was collected, including satisfying any legal, accounting, or reporting requirements. Once the retention period expires, your data is securely deleted or anonymized.
              </p>
            </section>

            {/* Section 9 - Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                9. Contact Us
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                We take your privacy concerns seriously. If you have questions about this policy, wish to exercise your rights, or have a grievance, please contact our dedicated privacy team.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Data Protection Officer (DPO)
                  </h4>
                  <p className="text-blue-800">
                    <strong>Name:</strong> Sushant Aggarwal<br />
                    <strong>Email:</strong>{" "}
                    <a href="mailto:dpo@consently.in" className="underline hover:no-underline">
                      dpo@consently.in
                    </a>
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                  <h4 className="font-semibold text-emerald-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Grievance Officer
                  </h4>
                  <p className="text-emerald-800">
                    <strong>Email:</strong>{" "}
                    <a href="mailto:grievance@consently.in" className="underline hover:no-underline">
                      grievance@consently.in
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-slate-100 rounded-xl p-6">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address
                </h4>
                <p className="text-slate-600">
                  Consently (Localo Technologies)<br />
                  Delhi, India
                </p>
              </div>

              <p className="text-slate-500 text-sm mt-6 italic">
                If we are unable to resolve your concern, you have the right to approach the Data Protection Board of India (or the relevant supervisory authority in your jurisdiction).
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
