'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2, User, Calendar, Lock, ExternalLink, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { features } from '@/lib/env';

// Types
interface VerificationStatus {
  verified: boolean;
  isAdult: boolean | null;
  age: number | null;
  name: string | null;
  consentValid: boolean;
  consentValidTill: string | null;
  verifiedAt: string | null;
}

interface VerificationResult {
  verified: boolean;
  isAdult: boolean;
  age: number;
  name: string;
}

// Loading skeleton
function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading verification status...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error display component
function ErrorDisplay({ 
  error, 
  description, 
  onRetry 
}: { 
  error: string; 
  description?: string;
  onRetry?: () => void;
}) {
  const errorMessages: Record<string, { title: string; message: string; action: string }> = {
    access_denied: {
      title: 'Verification Declined',
      message: 'You chose not to share your information with DigiLocker.',
      action: 'You can try again or use an alternative verification method.',
    },
    session_expired: {
      title: 'Session Expired',
      message: 'Your verification session has expired.',
      action: 'Please try again. Verification sessions are valid for 10 minutes.',
    },
    invalid_grant: {
      title: 'Session Expired',
      message: 'Your verification session is no longer valid.',
      action: 'Please start a new verification.',
    },
    init_failed: {
      title: 'Initialization Failed',
      message: 'We could not start the verification process.',
      action: 'Please try again or contact support if the problem persists.',
    },
    server_error: {
      title: 'Server Error',
      message: 'An unexpected error occurred during verification.',
      action: 'Please try again or contact support if the problem persists.',
    },
    configuration_error: {
      title: 'Configuration Error',
      message: 'DigiLocker integration is not properly configured.',
      action: 'Please contact support to resolve this issue.',
    },
  };

  const errorInfo = errorMessages[error] || {
    title: 'Verification Failed',
    message: description || 'An error occurred during verification.',
    action: 'Please try again or contact support.',
  };

  return (
    <Alert variant="destructive" className="mb-6">
      <XCircle className="h-4 w-4" />
      <AlertTitle>{errorInfo.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">{errorInfo.message}</p>
        <p className="text-sm text-red-600/80">{errorInfo.action}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Success display component
function SuccessDisplay({ result }: { result: VerificationResult }) {
  return (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Verification Successful!</AlertTitle>
      <AlertDescription className="mt-2 text-green-700">
        <p className="mb-2">
          Hello <strong>{result.name}</strong>, your age has been verified through DigiLocker.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Age: <strong>{result.age} years</strong></span>
          </div>
          <Badge variant={result.isAdult ? 'default' : 'secondary'}>
            {result.isAdult ? 'Adult (18+)' : 'Minor (<18)'}
          </Badge>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Verified status card
function VerifiedStatusCard({ status }: { status: VerificationStatus }) {
  const daysUntilExpiry = status.consentValidTill 
    ? Math.ceil((new Date(status.consentValidTill).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card className="border-green-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-800">Verified</CardTitle>
              <CardDescription>Your age has been verified</CardDescription>
            </div>
          </div>
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{status.name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Age</p>
            <p className="font-medium">{status.age} years</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Status</p>
            <Badge variant={status.isAdult ? 'default' : 'secondary'}>
              {status.isAdult ? 'Adult (18+)' : 'Minor (<18)'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Verified On</p>
            <p className="font-medium">
              {status.verifiedAt 
                ? new Date(status.verifiedAt).toLocaleDateString('en-IN')
                : 'N/A'}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Consent Validity</span>
            <span className={daysUntilExpiry < 7 ? 'text-orange-600 font-medium' : 'text-green-600'}>
              {daysUntilExpiry} days remaining
            </span>
          </div>
          <Progress 
            value={Math.max(0, Math.min(100, (daysUntilExpiry / 31) * 100))} 
            className="h-2"
          />
          {daysUntilExpiry < 7 && (
            <p className="text-xs text-orange-600">
              Your consent will expire soon. Please re-verify to continue.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => window.location.href = '/api/digilocker/init'}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Re-verify with DigiLocker
        </Button>
      </CardFooter>
    </Card>
  );
}

// Unverified status card
function UnverifiedStatusCard({ isConfigured }: { isConfigured: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Shield className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <CardTitle>Not Verified</CardTitle>
            <CardDescription>Complete age verification to continue</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConfigured && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Not Configured</AlertTitle>
            <AlertDescription>
              DigiLocker integration is not configured. Please contact support.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">Secure Verification</p>
              <p className="text-sm text-gray-500">Your data is securely verified through DigiLocker</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">Privacy Protected</p>
              <p className="text-sm text-gray-500">Only your age status is shared, not personal documents</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">31-Day Consent</p>
              <p className="text-sm text-gray-500">Your consent is valid for 31 days</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          disabled={!isConfigured}
          onClick={() => window.location.href = '/api/digilocker/init'}
        >
          <Shield className="h-4 w-4 mr-2" />
          Verify with DigiLocker
        </Button>
      </CardFooter>
    </Card>
  );
}

// How it works section
function HowItWorksSection() {
  const steps = [
    {
      icon: User,
      title: 'Login to DigiLocker',
      description: 'You\'ll be redirected to DigiLocker to securely login with your credentials.',
    },
    {
      icon: Lock,
      title: 'Grant Consent',
      description: 'Review and approve the request to share your profile information (Name, DOB, Gender).',
    },
    {
      icon: CheckCircle,
      title: 'Age Verification',
      description: 'We calculate your age from your verified DOB and determine if you\'re 18+.',
    },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">How It Works</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <step.icon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{step.title}</p>
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main content component
function AgeVerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  
  // Get query params
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const verified = searchParams.get('verified') === 'true';
  const isAdult = searchParams.get('isAdult') === 'true';
  const age = parseInt(searchParams.get('age') || '0');
  const name = searchParams.get('name');

  // Check if DigiLocker is configured
  const isConfigured = features.digilocker;

  // Fetch verification status
  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle successful verification from callback
  useEffect(() => {
    if (verified && age > 0 && name) {
      setShowSuccess(true);
      setVerificationResult({
        verified: true,
        isAdult,
        age,
        name: decodeURIComponent(name),
      });
      
      // Refresh status after a moment
      setTimeout(() => fetchStatus(), 1000);
      
      // Clear query params
      router.replace('/age-verification');
      
      // Show toast
      toast.success('Age verification completed successfully!');
    }
  }, [verified, isAdult, age, name]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/digilocker/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.href = '/api/digilocker/init';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading verification status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Age Verification</h1>
          <p className="text-gray-600 mt-2">
            Verify your age securely through DigiLocker
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Badge variant="outline" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Bank-grade Security
            </Badge>
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              DigiLocker Official
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <ErrorDisplay 
            error={error} 
            description={errorDescription || undefined}
            onRetry={handleRetry}
          />
        )}

        {/* Success Display */}
        {showSuccess && verificationResult && (
          <SuccessDisplay result={verificationResult} />
        )}

        {/* Status Card */}
        {status?.verified ? (
          <VerifiedStatusCard status={status} />
        ) : (
          <UnverifiedStatusCard isConfigured={isConfigured} />
        )}

        {/* How It Works */}
        <HowItWorksSection />

        {/* Info Section */}
        <Card className="mt-8 bg-blue-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">About DigiLocker</p>
                <p className="text-sm text-blue-700 mt-1">
                  DigiLocker is a government of India initiative under the Digital India program. 
                  It provides a secure digital platform for storage and sharing of documents. 
                  Your data is never stored on our servers - only the verification result is recorded.
                </p>
                <a 
                  href="https://www.digilocker.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  Learn more about DigiLocker
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-8 border-dashed">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500 space-y-2">
              <p>DigiLocker Configured: {isConfigured ? 'Yes' : 'No'}</p>
              <p>User Verified: {status?.verified ? 'Yes' : 'No'}</p>
              <p>Consent Valid: {status?.consentValid ? 'Yes' : 'No'}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Main page with suspense boundary
export default function AgeVerificationPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AgeVerificationContent />
    </Suspense>
  );
}
