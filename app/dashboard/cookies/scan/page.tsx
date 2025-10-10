'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cookieScanSchema, type CookieScanInput } from '@/lib/schemas';
import { Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedCookie {
  id: string;
  name: string;
  domain: string;
  category: 'necessary' | 'functional' | 'analytics' | 'advertising';
  expiry: string;
  description: string;
}

// Mock cookie data
const mockCookies: ScannedCookie[] = [
  { id: '1', name: '_ga', domain: '.example.com', category: 'analytics', expiry: '2 years', description: 'Google Analytics tracking cookie' },
  { id: '2', name: '_gid', domain: '.example.com', category: 'analytics', expiry: '24 hours', description: 'Google Analytics session cookie' },
  { id: '3', name: 'session_id', domain: 'example.com', category: 'necessary', expiry: 'Session', description: 'Session identification cookie' },
  { id: '4', name: '_fbp', domain: '.example.com', category: 'advertising', expiry: '3 months', description: 'Facebook Pixel tracking cookie' },
  { id: '5', name: 'preferences', domain: 'example.com', category: 'functional', expiry: '1 year', description: 'User preferences cookie' },
];

const categoryColors = {
  necessary: 'bg-green-100 text-green-800',
  functional: 'bg-blue-100 text-blue-800',
  analytics: 'bg-yellow-100 text-yellow-800',
  advertising: 'bg-red-100 text-red-800',
};

export default function CookieScanPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCookies, setScannedCookies] = useState<ScannedCookie[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CookieScanInput>({
    resolver: zodResolver(cookieScanSchema),
    defaultValues: { scanDepth: 'medium' },
  });

  const onSubmit = async (data: CookieScanInput) => {
    setIsScanning(true);
    setScanComplete(false);

    try {
      // Simulate scanning delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would call an API endpoint
      setScannedCookies(mockCookies);
      setScanComplete(true);
      toast.success(`Found ${mockCookies.length} cookies on ${data.url}`);
    } catch (error) {
      toast.error('Failed to scan website');
    } finally {
      setIsScanning(false);
    }
  };

  const getCategoryCount = (category: string) => {
    return scannedCookies.filter((cookie) => cookie.category === category).length;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cookie Scanner</h1>
        <p className="text-gray-600 mt-2">
          Scan your website to discover and classify all cookies automatically
        </p>
      </div>

      {/* Scan Form */}
      <Card>
        <CardHeader>
          <CardTitle>Scan Website</CardTitle>
          <CardDescription>Enter your website URL to begin scanning for cookies</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  {...register('url')}
                  type="url"
                  label="Website URL"
                  placeholder="https://example.com"
                  error={errors.url?.message}
                  disabled={isScanning}
                  required
                />
              </div>
              <div>
                <Select
                  {...register('scanDepth')}
                  label="Scan Depth"
                  options={[
                    { value: 'shallow', label: 'Shallow (Homepage only)' },
                    { value: 'medium', label: 'Medium (5 pages)' },
                    { value: 'deep', label: 'Deep (Full site)' },
                  ]}
                  error={errors.scanDepth?.message}
                  disabled={isScanning}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={isScanning} size="lg">
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Scan Website
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanComplete && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scannedCookies.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Necessary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCategoryCount('necessary')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCategoryCount('analytics')}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Advertising</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCategoryCount('advertising')}</div>
              </CardContent>
            </Card>
          </div>

          {/* Cookies Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detected Cookies</CardTitle>
              <CardDescription>
                Review and manage the cookies found on your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cookie Name</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedCookies.map((cookie) => (
                    <TableRow key={cookie.id}>
                      <TableCell className="font-medium">{cookie.name}</TableCell>
                      <TableCell className="text-gray-600">{cookie.domain}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            categoryColors[cookie.category]
                          }`}
                        >
                          {cookie.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">{cookie.expiry}</TableCell>
                      <TableCell className="text-gray-600 text-sm">{cookie.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="outline">Export Results</Button>
            <Button>Generate Consent Banner</Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!scanComplete && !isScanning && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No scan results yet</h3>
              <p className="mt-2 text-sm text-gray-600">
                Enter a website URL above and click "Scan Website" to discover cookies
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
