'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';

// Dynamic import for heavy component
const PrivacyCentre = dynamic(
  () => import('@/components/privacy-centre/privacy-centre').then(mod => ({ default: mod.PrivacyCentre })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Privacy Centre</h2>
            <p className="text-gray-600">Please wait...</p>
          </CardContent>
        </Card>
      </div>
    ),
    ssr: false
  }
);

// Generate UUID without external dependency
function generateVisitorId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


function PrivacyCentreContent() {
  const params = useParams();
  const widgetId = params.widgetId as string;

  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Add timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.error('Privacy Centre initialization timeout');
        setError('Loading timeout. Please refresh the page.');
        setLoading(false);
      }
    }, 15000); // 15 second timeout (increased from 10s)

    initializeVisitor().then(() => {
      if (isMounted && timeoutId) {
        clearTimeout(timeoutId);
      }
    }).catch((err) => {
      console.error('Error in initializeVisitor:', err);
      if (isMounted) {
        setError(err?.message || 'Failed to initialize Privacy Centre. Please refresh the page.');
        setLoading(false);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [widgetId]);

  const initializeVisitor = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Check URL parameter first (for direct links) - use window.location to avoid Suspense issues
      let urlVisitorId: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          urlVisitorId = urlParams.get('visitorId');
        } catch (e) {
          console.warn('Failed to parse URL params:', e);
        }
      }

      if (urlVisitorId) {
        // Store in localStorage for future visits (both formats for compatibility)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`consently_visitor_${widgetId}`, urlVisitorId);
            // Also sync to widget's consent ID format if it's a valid consent ID
            try {
              const consentData = localStorage.getItem('consently_consent_id');
              if (!consentData || JSON.parse(consentData)?.value !== urlVisitorId) {
                // Store in widget format for synchronization
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 365 * 10);
                localStorage.setItem('consently_consent_id', JSON.stringify({
                  value: urlVisitorId,
                  expiresAt: expiresAt.toISOString()
                }));
              }
            } catch (e) {
              // Ignore errors in sync attempt
              console.warn('Failed to sync consent ID:', e);
            }
          } catch (e) {
            console.error('Failed to store visitor ID in localStorage:', e);
          }
        }
        setVisitorId(urlVisitorId);
        setLoading(false);
        return;
      }

      // Check localStorage for existing visitor ID (Privacy Centre format)
      let storedVisitorId: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          storedVisitorId = localStorage.getItem(`consently_visitor_${widgetId}`);
        } catch (e) {
          console.warn('Failed to read from localStorage:', e);
        }
      }

      // Fallback: Check widget's consent ID format for synchronization
      if (!storedVisitorId && typeof window !== 'undefined') {
        try {
          const consentData = localStorage.getItem('consently_consent_id');
          if (consentData) {
            const parsed = JSON.parse(consentData);
            const expiresAt = new Date(parsed.expiresAt);
            if (expiresAt > new Date() && parsed.value) {
              storedVisitorId = parsed.value;
              // Sync to Privacy Centre format
              localStorage.setItem(`consently_visitor_${widgetId}`, storedVisitorId);
            }
          }
        } catch (e) {
          // Ignore errors, continue to generate new ID
          console.warn('Failed to read consent ID from localStorage:', e);
        }
      }

      if (storedVisitorId) {
        setVisitorId(storedVisitorId);
        setLoading(false);
        return;
      }

      // Generate new visitor ID
      const newVisitorId = generateVisitorId();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`consently_visitor_${widgetId}`, newVisitorId);
          // Also store in widget format for synchronization
          try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 365 * 10);
            localStorage.setItem('consently_consent_id', JSON.stringify({
              value: newVisitorId,
              expiresAt: expiresAt.toISOString()
            }));
          } catch (e) {
            // Ignore errors, continue
            console.warn('Failed to store consent ID:', e);
          }
        } catch (e) {
          console.error('Failed to store new visitor ID:', e);
        }
      }
      setVisitorId(newVisitorId);
      setLoading(false);
    } catch (err: any) {
      console.error('Error initializing visitor:', err);
      setError(err?.message || 'Failed to initialize Privacy Centre. Please enable cookies and try again.');
      setLoading(false);
      throw err; // Re-throw so the useEffect can catch it
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Privacy Centre</h2>
            <p className="text-gray-600">Please wait while we prepare your privacy dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={initializeVisitor}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!visitorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Visitor ID Required</h2>
            <p className="text-gray-600 mb-6">
              Unable to load Privacy Centre. Please ensure cookies are enabled.
            </p>
            <Button onClick={initializeVisitor}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PrivacyCentre visitorId={visitorId} widgetId={widgetId} />;
}

export default function PrivacyCentrePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
          <Card className="w-full max-w-md">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Privacy Centre</h2>
              <p className="text-gray-600">Please wait while we prepare your privacy dashboard...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PrivacyCentreContent />
    </Suspense>
  );
}
