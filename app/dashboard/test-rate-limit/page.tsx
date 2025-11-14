'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  requestNumber: number;
  success: boolean;
  status: number;
  data: any;
  headers: Record<string, string>;
  timestamp: string;
}

export default function RateLimitTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [requestCount, setRequestCount] = useState(15);

  const runTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    const newResults: TestResult[] = [];
    
    // Send rapid requests
    for (let i = 1; i <= requestCount; i++) {
      try {
        const startTime = Date.now();
        const response = await fetch('/api/test-rate-limit');
        const endTime = Date.now();
        
        const data = await response.json();
        const headers: Record<string, string> = {};
        
        // Extract rate limit headers
        response.headers.forEach((value, key) => {
          if (key.toLowerCase().startsWith('x-ratelimit') || key.toLowerCase() === 'retry-after') {
            headers[key] = value;
          }
        });
        
        newResults.push({
          requestNumber: i,
          success: response.ok,
          status: response.status,
          data,
          headers,
          timestamp: new Date().toISOString(),
        });
        
        setResults([...newResults]);
        
        // Small delay to see progress
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        newResults.push({
          requestNumber: i,
          success: false,
          status: 0,
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
          headers: {},
          timestamp: new Date().toISOString(),
        });
        setResults([...newResults]);
      }
    }
    
    setIsRunning(false);
    
    // Show summary
    const successCount = newResults.filter(r => r.success && r.status === 200).length;
    const rateLimitedCount = newResults.filter(r => r.status === 429).length;
    const errorCount = newResults.filter(r => !r.success && r.status !== 429).length;
    
    toast.success(`Test completed!`, {
      description: `${successCount} successful, ${rateLimitedCount} rate limited, ${errorCount} errors`,
      duration: 5000,
    });
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.status === 200) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (result.status === 429) {
      return <XCircle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (result: TestResult) => {
    if (result.status === 200) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Success</span>;
    } else if (result.status === 429) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Rate Limited</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Error</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rate Limiting Test</h1>
        <p className="text-gray-600 mt-2">
          Test the rate limiting middleware by sending rapid API requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            The test endpoint allows 10 requests per minute. Send more than 10 requests to see rate limiting in action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Requests
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={requestCount}
                onChange={(e) => setRequestCount(parseInt(e.target.value) || 15)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              />
            </div>
            <div className="pt-6">
              <Button
                onClick={runTest}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Test
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Endpoint Information</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>URL:</strong> <code className="bg-blue-100 px-1 rounded">/api/test-rate-limit</code></li>
              <li><strong>Method:</strong> GET</li>
              <li><strong>Rate Limit:</strong> 10 requests per minute</li>
              <li><strong>Expected Behavior:</strong> First 10 requests succeed (200), subsequent requests return 429 (Too Many Requests)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {results.length} request{results.length !== 1 ? 's' : ''} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.requestNumber}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result)}
                      <span className="font-medium">Request #{result.requestNumber}</span>
                      {getStatusBadge(result)}
                    </div>
                    <span className="text-xs text-gray-500">
                      Status: {result.status}
                    </span>
                  </div>

                  {result.headers['X-RateLimit-Limit'] && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                      <div>
                        <strong>Limit:</strong> {result.headers['X-RateLimit-Limit']} |{' '}
                        <strong>Remaining:</strong> {result.headers['X-RateLimit-Remaining']}
                      </div>
                      {result.headers['Retry-After'] && (
                        <div>
                          <strong>Retry After:</strong> {result.headers['Retry-After']} seconds
                        </div>
                      )}
                    </div>
                  )}

                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>

            {results.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Successful</div>
                    <div className="text-2xl font-bold text-green-600">
                      {results.filter(r => r.success && r.status === 200).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Rate Limited</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {results.filter(r => r.status === 429).length}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Errors</div>
                    <div className="text-2xl font-bold text-red-600">
                      {results.filter(r => !r.success && r.status !== 429).length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

