'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function DigiLockerTestPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<any>(null);
  const [debug, setDebug] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get callback params
  const callbackCode = searchParams.get('code');
  const callbackState = searchParams.get('state');
  const callbackError = searchParams.get('error');
  const callbackErrorDesc = searchParams.get('error_description');
  const verified = searchParams.get('verified');
  const isAdult = searchParams.get('isAdult');

  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        // Fetch config
        const configRes = await fetch('/api/digilocker/config');
        const configData = await configRes.json();
        setConfig(configData);

        // Fetch debug info
        const debugRes = await fetch('/api/digilocker/debug');
        const debugData = await debugRes.json();
        setDebug(debugData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch diagnostics');
      } finally {
        setLoading(false);
      }
    }

    fetchDiagnostics();
  }, []);

  const handleVerify = () => {
    window.location.href = '/api/digilocker/init?redirect_to=/test/digilocker';
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-4">DigiLocker Test Page</h1>
        <p>Loading diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔐 DigiLocker Integration Test</h1>

        {/* Callback Status */}
        {(callbackCode || callbackError || verified) && (
          <div className={`mb-6 p-4 rounded-lg ${callbackError ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300'} border`}>
            <h2 className="font-bold mb-2">
              {callbackError ? '❌ Callback Error' : verified ? '✅ Verification Success' : '📥 Callback Received'}
            </h2>
            <div className="space-y-1 text-sm font-mono">
              {callbackCode && <p><strong>Code:</strong> {callbackCode.substring(0, 20)}...</p>}
              {callbackState && <p><strong>State:</strong> {callbackState.substring(0, 20)}...</p>}
              {callbackError && <p><strong>Error:</strong> {callbackError}</p>}
              {callbackErrorDesc && <p><strong>Description:</strong> {decodeURIComponent(callbackErrorDesc)}</p>}
              {verified && <p><strong>Verified:</strong> {verified}</p>}
              {isAdult && <p><strong>Is Adult:</strong> {isAdult}</p>}
            </div>
          </div>
        )}

        {/* Configuration Status */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>DigiLocker Configured:</span>
              <span className={config?.configured ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                {config?.configured ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Environment:</span>
              <span className="font-mono">{config?.env || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span>Issuer ID:</span>
              <span className="font-mono">{config?.issuerId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {debug && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostics</h2>
            
            {/* Common Issues */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Common Issues Check:</h3>
              <ul className="space-y-1 text-sm">
                <li className={debug.commonIssues?.missingClientId ? 'text-red-600' : 'text-green-600'}>
                  {debug.commonIssues?.missingClientId ? '❌' : '✅'} Client ID configured
                </li>
                <li className={debug.commonIssues?.missingClientSecret ? 'text-red-600' : 'text-green-600'}>
                  {debug.commonIssues?.missingClientSecret ? '❌' : '✅'} Client Secret configured
                </li>
                <li className={debug.commonIssues?.missingRedirectUri ? 'text-red-600' : 'text-green-600'}>
                  {debug.commonIssues?.missingRedirectUri ? '❌' : '✅'} Redirect URI configured
                </li>
                <li className={debug.commonIssues?.redisNotConfigured ? 'text-red-600' : 'text-green-600'}>
                  {debug.commonIssues?.redisNotConfigured ? '❌' : '✅'} Redis connected
                </li>
                <li className={debug.redirectUriCheck?.matches ? 'text-green-600' : 'text-yellow-600'}>
                  {debug.redirectUriCheck?.matches ? '✅' : '⚠️'} Redirect URI matches current origin
                </li>
              </ul>
            </div>

            {/* Redirect URI Check */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Redirect URI Check:</h3>
              <div className="text-sm font-mono bg-gray-100 p-3 rounded">
                <p><strong>Configured:</strong> {debug.redirectUriCheck?.configured}</p>
                <p><strong>Expected:</strong> {debug.redirectUriCheck?.expectedFromRequest}</p>
                <p className={debug.redirectUriCheck?.matches ? 'text-green-600' : 'text-yellow-600'}>
                  {debug.redirectUriCheck?.note}
                </p>
              </div>
            </div>

            {/* Raw Debug Data */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-blue-600">View Raw Debug Data</summary>
              <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(debug, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Test Button */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test OAuth Flow</h2>
          <button
            onClick={handleVerify}
            disabled={!config?.configured}
            className={`px-6 py-3 rounded-lg font-medium ${
              config?.configured
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {config?.configured ? 'Start DigiLocker Verification' : 'DigiLocker Not Configured'}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            This will redirect you to DigiLocker for authentication.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Help */}
        <div className="mt-8 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Troubleshooting Tips:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET, and DIGILOCKER_REDIRECT_URI are set in your environment</li>
            <li>The redirect URI must exactly match what's registered in the DigiLocker Partner Portal</li>
            <li>Redis must be configured for state storage (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)</li>
            <li>Check server logs for detailed error messages during the OAuth flow</li>
            <li>If you see &quot;Missing code or state&quot;, DigiLocker may be returning an error instead of success</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
