'use client';

import Link from 'next/link';
import { Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
          <Shield className="h-10 w-10 text-blue-600" />
          <span className="text-3xl font-bold text-gray-900">Consently</span>
        </Link>

        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">
            We encountered an issue while signing you in. This could be due to:
          </p>

          <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>An expired or invalid authentication link</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>A configuration issue with the OAuth provider</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">•</span>
              <span>A network connectivity problem</span>
            </li>
          </ul>

          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="w-full">
                Create New Account
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            If this problem persists, please contact{' '}
            <a href="mailto:support@consently.in" className="text-blue-600 hover:underline">
              support@consently.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

