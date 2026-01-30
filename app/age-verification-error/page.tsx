'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'unknown_error';
  const message = searchParams.get('message') || 'An error occurred during age verification';

  const errorMessages: Record<string, { title: string; description: string; action: string; showHelpLink?: boolean }> = {
    oauth_error: {
      title: 'Authentication Error',
      description: 'There was an error authenticating with DigiLocker. This could be due to incorrect credentials or permission issues.',
      action: 'Please try again or contact support if the issue persists.',
      showHelpLink: true,
    },
    missing_state: {
      title: 'Security Error',
      description: 'Required security parameter is missing from the verification request.',
      action: 'Please start the verification process again.',
    },
    invalid_state: {
      title: 'Invalid Session',
      description: 'Your verification session is invalid or has expired.',
      action: 'Please start a new verification session.',
    },
    session_expired: {
      title: 'Session Expired',
      description: 'Your verification session has expired. Age verification sessions are valid for 1 hour.',
      action: 'Please start a new verification process.',
    },
    missing_code: {
      title: 'Missing Authorization',
      description: 'Required authorization code is missing from the callback.',
      action: 'Please try the verification process again.',
    },
    verification_failed: {
      title: 'Verification Failed',
      description: message || 'Unable to verify your age using DigiLocker.',
      action: 'Please ensure you have a valid DigiLocker account and try again.',
      showHelpLink: true,
    },
    pan_mismatch: {
      title: 'PAN/Aadhaar Mismatch',
      description: 'Your PAN and Aadhaar details don\'t match in the government database. This is required for DigiLocker age verification.',
      action: 'Please link your PAN with Aadhaar on the Income Tax e-filing portal, wait 24-48 hours, and try again.',
      showHelpLink: true,
    },
    kyc_incomplete: {
      title: 'KYC Verification Required',
      description: 'DigiLocker requires additional identity verification (PAN/Aadhaar linking) for age verification.',
      action: 'Complete the KYC process in DigiLocker and try again. This is a one-time requirement.',
      showHelpLink: true,
    },
    user_cancelled: {
      title: 'Verification Cancelled',
      description: 'You cancelled the DigiLocker verification process.',
      action: 'Return to the website and start age verification again when ready.',
    },
    internal_error: {
      title: 'Technical Error',
      description: message || 'An unexpected error occurred during verification.',
      action: 'Please try again later or contact support.',
      showHelpLink: true,
    },
  };

  const errorInfo = errorMessages[error] || errorMessages.internal_error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {errorInfo.title}
          </h2>

          <p className="text-gray-600 mb-2">
            {errorInfo.description}
          </p>

          <p className="text-sm text-gray-500 mb-8">
            {errorInfo.action}
          </p>

          {/* Help Link for specific errors */}
          {errorInfo.showHelpLink && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Having trouble with DigiLocker verification?</strong>
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Learn more about why DigiLocker asks for PAN/KYC details and how to complete verification.
              </p>
              <Link
                href="/help/digilocker-age-verification"
                className="inline-flex items-center mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View DigiLocker Help Guide →
              </Link>
            </div>
          )}

          {/* Error Details (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs font-mono text-gray-700">
                <strong>Error Code:</strong> {error}
              </p>
              {message && (
                <p className="text-xs font-mono text-gray-700 mt-1">
                  <strong>Message:</strong> {message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Go Back
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/contact"
            className="text-center text-sm text-blue-600 hover:text-blue-500"
          >
            Need help? Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AgeVerificationErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
