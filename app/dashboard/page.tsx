'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Cookie Consent Overview
    router.replace('/dashboard/cookies');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
