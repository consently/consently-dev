'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const status = searchParams.get('status');
  const returnUrl = searchParams.get('returnUrl');

  const handleContinue = () => {
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Age Verification Complete
          </h2>

          <p className="text-gray-600 mb-2">
            Your age has been successfully verified using DigiLocker.
          </p>
        </div>

        {/* What happened - explicit transparency */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-green-900 mb-3">
            What was verified:
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Your age eligibility was confirmed via DigiLocker</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No date of birth or personal documents were stored</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Only a yes/no age result was shared with the website</span>
            </li>
          </ul>
        </div>

        {/* What was NOT done - critical for trust */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-amber-900 mb-3">
            What has NOT happened yet:
          </h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex items-start">
              <svg className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>No data processing consent was given</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>You still need to review and accept privacy preferences</span>
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>No cookies or tracking has been enabled</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3 pt-2">
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Continue to Website
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About This Verification
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                This age verification is required under India's Digital Personal Data Protection Act, 2023 (DPDPA).
                It helps websites apply the correct privacy settings based on your age group.
                You can review or change your privacy preferences at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && sessionId && (
          <div className="p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-700">
              <strong>Session ID:</strong> {sessionId}
            </p>
            {status && (
              <p className="text-xs font-mono text-gray-700 mt-1">
                <strong>Status:</strong> {status}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgeVerificationCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
