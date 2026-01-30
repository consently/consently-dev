/**
 * DigiLocker Age Verification Help Page
 *
 * Comprehensive FAQ and explanation for users and website owners about
 * DigiLocker age verification, PAN/KYC requirements, and guardian consent.
 */

import React from 'react';
import { Metadata } from 'next';
import {
  ShieldCheck,
  Lock,
  Users,
  HelpCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'DigiLocker Age Verification Help | Consently',
  description: 'Understanding DigiLocker age verification, PAN/KYC requirements, and guardian consent under DPDPA 2023',
};

export default function DigiLockerHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <ShieldCheck className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            DigiLocker Age Verification Help
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Understanding government-backed age verification under DPDPA 2023
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-8 space-y-8">
            {/* What is DigiLocker */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-blue-600" />
                What is DigiLocker?
              </h2>
              <div className="prose prose-blue max-w-none text-gray-700">
                <p>
                  <strong>DigiLocker</strong> is India's official digital documents storage and verification
                  service, operated by the Ministry of Electronics and Information Technology (MeitY).
                </p>
                <p>
                  It allows citizens to store and share verified digital documents (Aadhaar, PAN, Driving License, etc.)
                  securely with government-backed authentication.
                </p>
                <p className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
                  <strong>For age verification:</strong> DigiLocker provides privacy-preserving verification
                  where only your age (not your date of birth) is shared with websites.
                </p>
              </div>
            </section>

            {/* Why PAN is Asked */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <HelpCircle className="h-6 w-6 mr-2 text-amber-600" />
                Why is DigiLocker asking for my PAN?
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  If you see a screen saying:
                </p>
                <div className="bg-gray-100 p-4 rounded font-mono text-sm border border-gray-300">
                  "Age Verification and Guardian Consent application needs more details to verify your identity..."
                </div>
                <p>
                  <strong>This is EXPECTED behavior and NOT an error.</strong>
                </p>

                <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-3">Why this happens:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span>
                        DigiLocker is <strong>upgrading your account's assurance level</strong> to meet
                        DPDPA 2023 requirements for age verification and guardian consent
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span>
                        PAN is used to <strong>strengthen your identity verification</strong> (linking PAN to Aadhaar)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span>
                        This is required <strong>only once</strong> per DigiLocker account
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-amber-600 mr-2">•</span>
                      <span>
                        After completion, future age verifications will be <strong>seamless</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200 mt-4">
                  <h3 className="font-semibold text-green-900 mb-3">Privacy guarantee:</h3>
                  <ul className="space-y-2 text-green-800">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>
                        Your PAN is <strong>only shared with DigiLocker</strong> (government service), not with websites
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>
                        Your date of birth (DOB) is <strong>never stored</strong> by websites
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>
                        Only your verified age (e.g., "18") is shared with the requesting website
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>
                        DigiLocker is a <strong>government-backed secure service</strong> with data protection
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Guardian Consent */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-2 text-purple-600" />
                Guardian Consent for Minors
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Under <strong>DPDPA 2023 (Digital Personal Data Protection Act)</strong>, websites must obtain
                  <strong> verifiable parental consent</strong> before processing data of users under 18.
                </p>

                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3">How guardian consent works:</h3>
                  <ol className="space-y-3">
                    <li className="flex items-start">
                      <span className="font-bold text-purple-600 mr-3">1.</span>
                      <span>
                        <strong>Minor verifies age via DigiLocker</strong> - System detects age &lt; 18
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-purple-600 mr-3">2.</span>
                      <span>
                        <strong>Guardian email is requested</strong> - Minor provides parent/guardian email
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-purple-600 mr-3">3.</span>
                      <span>
                        <strong>Guardian receives verification link</strong> - Email sent with consent request
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-purple-600 mr-3">4.</span>
                      <span>
                        <strong>Guardian verifies identity via DigiLocker</strong> - Must be ≥18 years old
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-purple-600 mr-3">5.</span>
                      <span>
                        <strong>Guardian approves or rejects</strong> - Decision is recorded
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-bold text-purple-600 mr-3">6.</span>
                      <span>
                        <strong>Minor can proceed (if approved)</strong> - Consent valid for configured period
                      </span>
                    </li>
                  </ol>
                </div>

                <p className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
                  <strong>Note:</strong> Guardian's PAN may also be requested during their verification.
                  This is the same profile assurance process as described above.
                </p>
              </div>
            </section>

            {/* Troubleshooting */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Troubleshooting Common Issues
              </h2>
              <div className="space-y-4">
                <details className="bg-gray-50 p-4 rounded border border-gray-200">
                  <summary className="font-semibold cursor-pointer text-gray-900">
                    "PAN/Aadhaar details don't match the issuer's records"
                  </summary>
                  <div className="mt-3 text-gray-700 space-y-2">
                    <p>This means your PAN and Aadhaar are not linked in the government database.</p>
                    <p><strong>Solution:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Visit the Income Tax e-filing portal to link PAN-Aadhaar</li>
                      <li>Or provide correct PAN details matching your Aadhaar name</li>
                      <li>Wait 24-48 hours for database sync, then retry verification</li>
                    </ul>
                  </div>
                </details>

                <details className="bg-gray-50 p-4 rounded border border-gray-200">
                  <summary className="font-semibold cursor-pointer text-gray-900">
                    "I don't have a PAN card"
                  </summary>
                  <div className="mt-3 text-gray-700 space-y-2">
                    <p>
                      If you don't have a PAN card, DigiLocker may offer alternative verification methods
                      (Aadhaar-only, Driving License, etc.) depending on your account state.
                    </p>
                    <p>
                      Contact DigiLocker support at <a href="https://digilocker.gov.in" className="text-blue-600 underline">digilocker.gov.in</a>
                    </p>
                  </div>
                </details>

                <details className="bg-gray-50 p-4 rounded border border-gray-200">
                  <summary className="font-semibold cursor-pointer text-gray-900">
                    "Verification failed or redirected to error page"
                  </summary>
                  <div className="mt-3 text-gray-700 space-y-2">
                    <p><strong>Common causes:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Session expired (verification must complete within 1 hour)</li>
                      <li>Browser blocked cookies/popups</li>
                      <li>Network interruption during redirect</li>
                    </ul>
                    <p><strong>Solution:</strong> Return to the website and start age verification again.</p>
                  </div>
                </details>

                <details className="bg-gray-50 p-4 rounded border border-gray-200">
                  <summary className="font-semibold cursor-pointer text-gray-900">
                    "Is my data safe?"
                  </summary>
                  <div className="mt-3 text-gray-700 space-y-2">
                    <p><strong>Yes.</strong> DigiLocker is a government-backed service with strong data protection:</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>Your documents are stored securely with government-grade encryption</li>
                      <li>Websites only receive your age, not your DOB or documents</li>
                      <li>You control what information is shared</li>
                      <li>DigiLocker complies with IT Act, 2000 and DPDPA 2023</li>
                    </ul>
                    <p>
                      Learn more at{' '}
                      <a href="https://www.digilocker.gov.in/about" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                        digilocker.gov.in/about
                      </a>
                    </p>
                  </div>
                </details>
              </div>
            </section>

            {/* For Website Owners */}
            <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                For Website Owners
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  If you're implementing DigiLocker age verification on your website using Consently:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>
                    <strong>Inform users</strong> that PAN/KYC screens are expected (use the DigiLockerVerificationNotice component)
                  </li>
                  <li>
                    <strong>Link to this help page</strong> from your age verification flow
                  </li>
                  <li>
                    <strong>Test in sandbox mode</strong> before going live
                  </li>
                  <li>
                    <strong>Configure guardian consent</strong> if your audience includes minors
                  </li>
                  <li>
                    <strong>Review DPDPA 2023 compliance</strong> requirements for your industry
                  </li>
                </ul>
                <p className="mt-4">
                  <a
                    href="/dashboard/dpdpa/widget"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Configure your DPDPA widget →
                  </a>
                </p>
              </div>
            </section>

            {/* Contact Support */}
            <section className="text-center border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Still have questions?
              </h2>
              <p className="text-gray-600 mb-4">
                Contact Consently support or visit DigiLocker help resources
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="/contact"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Contact Consently Support
                </a>
                <a
                  href="https://www.digilocker.gov.in/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  DigiLocker Help
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
