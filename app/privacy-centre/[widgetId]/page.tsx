'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { PrivacyCentre } from '@/components/privacy-centre/privacy-centre';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

function PrivacyCentreContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const widgetId = params.widgetId as string;
  
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeVisitor();
  }, [widgetId]);

  const initializeVisitor = () => {
    try {
      setLoading(true);

      // Check URL parameter first (for direct links)
      const urlVisitorId = searchParams?.get('visitorId');
      
      if (urlVisitorId) {
        // Store in localStorage for future visits (both formats for compatibility)
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
        }
        setVisitorId(urlVisitorId);
        setLoading(false);
        return;
      }

      // Check localStorage for existing visitor ID (Privacy Centre format)
      let storedVisitorId = localStorage.getItem(`consently_visitor_${widgetId}`);
      
      // Fallback: Check widget's consent ID format for synchronization
      if (!storedVisitorId) {
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
        }
      }
      
      if (storedVisitorId) {
        setVisitorId(storedVisitorId);
        setLoading(false);
        return;
      }

      // Generate new visitor ID
      const newVisitorId = uuidv4();
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
      }
      setVisitorId(newVisitorId);
      setLoading(false);
    } catch (err) {
      console.error('Error initializing visitor:', err);
      setError('Failed to initialize Privacy Centre. Please enable cookies and try again.');
      setLoading(false);
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
