'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

type PageState =
  | 'loading'
  | 'consent_details'
  | 'redirecting'
  | 'guardian_verified'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'error';

interface ConsentDetails {
  status: string;
  relationship: string;
  minorAge: number;
  guardianVerified: boolean;
  expiresAt: string;
  consentGivenAt: string | null;
}

interface VerifyResponse {
  success: boolean;
  guardianVerified: boolean;
  guardianAge?: number;
  guardianSessionId?: string;
  redirectUrl?: string;
  minorAge?: number;
  domain?: string;
  readyForApproval?: boolean;
  message?: string;
  mockMode?: boolean;
  error?: string;
}

function VerifyGuardianContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const guardianSession = searchParams.get('guardian_session');
  const ageVerificationStatus = searchParams.get('age_verification_status');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [consentDetails, setConsentDetails] = useState<ConsentDetails | null>(null);
  const [guardianAge, setGuardianAge] = useState<number | null>(null);
  const [guardianSessionId, setGuardianSessionId] = useState<string | null>(guardianSession);
  const [domain, setDomain] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resultMessage, setResultMessage] = useState<string>('');

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setPageState('error');
  }, []);

  // Fetch consent details on initial load
  useEffect(() => {
    if (!token) {
      showError('Missing verification token. Please use the link from your email.');
      return;
    }

    async function fetchConsentDetails() {
      try {
        const res = await fetch(
          `/api/dpdpa/age-verification/guardian-consent?token=${encodeURIComponent(token!)}`
        );
        const data = await res.json();

        if (!res.ok) {
          showError(data.error || 'Failed to load consent details.');
          return;
        }

        if (data.status === 'expired') {
          showError('This consent request has expired. Please ask the minor to request a new one.');
          return;
        }

        if (data.status === 'approved') {
          setResultMessage('Guardian consent has already been approved.');
          setPageState('approved');
          return;
        }

        if (data.status === 'rejected') {
          setResultMessage('Guardian consent has been rejected.');
          setPageState('rejected');
          return;
        }

        setConsentDetails(data);

        // Check if returning from DigiLocker with a verified guardian session
        if (guardianSession && ageVerificationStatus === 'verified') {
          // Clean up URL params
          const url = new URL(window.location.href);
          url.searchParams.delete('age_verification_session');
          url.searchParams.delete('age_verification_status');
          window.history.replaceState({}, '', url.toString());

          // Fetch guardian verification status
          await checkGuardianVerification();
        } else {
          setPageState('consent_details');
        }
      } catch {
        showError('Unable to connect to the server. Please try again.');
      }
    }

    async function checkGuardianVerification() {
      try {
        const res = await fetch('/api/dpdpa/age-verification/guardian-consent/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data: VerifyResponse = await res.json();

        if (data.guardianVerified && data.readyForApproval) {
          setGuardianAge(data.guardianAge ?? null);
          setDomain(data.domain || '');
          setPageState('guardian_verified');
        } else {
          setPageState('consent_details');
        }
      } catch {
        setPageState('consent_details');
      }
    }

    fetchConsentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleVerifyIdentity() {
    if (!token) return;
    setPageState('redirecting');

    try {
      const res = await fetch('/api/dpdpa/age-verification/guardian-consent/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data: VerifyResponse = await res.json();

      if (!res.ok || !data.success) {
        showError(data.error || 'Failed to initiate verification.');
        return;
      }

      if (data.guardianVerified && data.readyForApproval) {
        setGuardianAge(data.guardianAge ?? null);
        setDomain(data.domain || '');
        setGuardianSessionId(data.guardianSessionId ?? null);
        setPageState('guardian_verified');
        return;
      }

      if (data.redirectUrl) {
        setGuardianSessionId(data.guardianSessionId ?? null);
        window.location.href = data.redirectUrl;
      } else {
        showError('Failed to get DigiLocker redirect URL.');
      }
    } catch {
      showError('Unable to connect to the server. Please try again.');
    }
  }

  async function handleAction(action: 'approve' | 'reject') {
    if (!token || !guardianSessionId) return;
    setPageState('processing');

    try {
      const res = await fetch('/api/dpdpa/age-verification/guardian-consent/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, guardianSessionId, action }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(data.error || `Failed to ${action} consent.`);
        return;
      }

      setResultMessage(data.message || '');
      setPageState(action === 'approve' ? 'approved' : 'rejected');
    } catch {
      showError('Unable to connect to the server. Please try again.');
    }
  }

  // Loading state
  if (pageState === 'loading' || pageState === 'redirecting' || pageState === 'processing') {
    const loadingMessage =
      pageState === 'redirecting'
        ? 'Redirecting to DigiLocker...'
        : pageState === 'processing'
          ? 'Processing your response...'
          : 'Loading consent details...';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Unable to Proceed</h2>
            <p className="text-gray-600 mb-8">{errorMessage}</p>
          </div>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Approved state
  if (pageState === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Consent Approved</h2>
            <p className="text-gray-600 mb-2">
              {resultMessage || 'Guardian consent has been approved. The minor can now proceed with data consent.'}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              You can safely close this page.
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Only your age was verified. Your personal details remain private in your DigiLocker account.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => window.close()}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // Rejected state
  if (pageState === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
              <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Consent Rejected</h2>
            <p className="text-gray-600 mb-8">
              {resultMessage || 'Guardian consent has been rejected. The minor will not be able to proceed with data consent.'}
            </p>
          </div>
          <button
            onClick={() => window.close()}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  // Guardian verified - show approve/reject
  if (pageState === 'guardian_verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Identity Verified</h2>
            <p className="text-gray-600 mb-6">
              Your identity has been verified via DigiLocker.
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Consent Request Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Minor&apos;s Age</span>
                <span className="text-sm font-medium text-gray-900">{consentDetails?.minorAge ?? 'Unknown'}</span>
              </div>
              {guardianAge && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Your Verified Age</span>
                  <span className="text-sm font-medium text-gray-900">{guardianAge}</span>
                </div>
              )}
              {domain && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Website</span>
                  <span className="text-sm font-medium text-gray-900">{domain}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Relationship</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{consentDetails?.relationship}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              By approving, you consent to the data processing activities described on the website for this minor, as required under DPDPA 2023, Section 9.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => handleAction('approve')}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve Consent
            </button>
            <button
              onClick={() => handleAction('reject')}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Consent
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Consent details - initial view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-6">
            <svg className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Guardian Consent Required</h2>
          <p className="text-gray-600 mb-6">
            A minor needs your approval to consent to data processing under DPDPA 2023.
          </p>
        </div>

        {/* Details Card */}
        {consentDetails && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Request Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Minor&apos;s Age</span>
                <span className="text-sm font-medium text-gray-900">{consentDetails.minorAge ?? 'Verified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Relationship</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{consentDetails.relationship}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Expires</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(consentDetails.expiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You will need to verify your identity using DigiLocker (government-backed verification).
                Only your age will be checked &mdash; your personal details will not be stored.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleVerifyIdentity}
          className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Verify Identity with DigiLocker
        </button>
      </div>
    </div>
  );
}

export default function VerifyGuardianPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      }
    >
      <VerifyGuardianContent />
    </Suspense>
  );
}
