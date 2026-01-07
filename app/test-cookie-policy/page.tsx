'use client';

import { CookiePolicyGenerator } from '@/components/cookie/CookiePolicyGenerator';

// Test data with real cookie structure
const testCookies = [
  {
    id: '1',
    name: '_ga',
    domain: '.google.com',
    category: 'analytics' as const,
    expiry: '2 years',
    description: 'Google Analytics cookie for tracking user interactions'
  },
  {
    id: '2',
    name: '_gid',
    domain: '.google.com',
    category: 'analytics' as const,
    expiry: '24 hours',
    description: 'Google Analytics cookie for group behavior tracking'
  },
  {
    id: '3',
    name: 'session_id',
    domain: 'localhost',
    category: 'necessary' as const,
    expiry: 'Session',
    description: 'Maintains user session state'
  },
  {
    id: '4',
    name: 'user_preferences',
    domain: 'localhost',
    category: 'functional' as const,
    expiry: '30 days',
    description: 'Stores user interface preferences'
  },
  {
    id: '5',
    name: 'ad_token',
    domain: '.doubleclick.net',
    category: 'advertising' as const,
    expiry: '90 days',
    description: 'Used for ad serving and personalization'
  }
];

export default function TestCookiePolicyPage() {
  return (
    <div className="container mx-auto py-8">
      <CookiePolicyGenerator
        scannedCookies={testCookies}
        scannedUrl="https://example.com"
        onClose={() => console.log('Closed')}
      />
    </div>
  );
}
