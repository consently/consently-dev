'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cookieScanSchema, type CookieScanInput } from '@/lib/schemas';
import { Search, Loader2, CheckCircle, AlertCircle, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedCookie {
  id: string;
  name: string;
  domain: string;
  category: 'necessary' | 'functional' | 'analytics' | 'advertising';
  expiry: string;
  description: string;
}


const categoryColors = {
  necessary: 'bg-green-100 text-green-800',
  functional: 'bg-blue-100 text-blue-800',
  analytics: 'bg-yellow-100 text-yellow-800',
  advertising: 'bg-red-100 text-red-800',
};

export default function CookieScanPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCookies, setScannedCookies] = useState<ScannedCookie[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);

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
      // Call the real API endpoint
      const response = await fetch('/api/cookies/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: data.url,
          scanDepth: data.scanDepth,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to scan website');
      }

      // Map API response to component state
      const cookies: ScannedCookie[] = result.data.cookies.map((cookie: any) => ({
        id: cookie.id,
        name: cookie.name,
        domain: cookie.domain,
        category: cookie.category,
        expiry: cookie.expiry,
        description: cookie.description,
      }));

      setScannedCookies(cookies);
      setScannedUrl(data.url);
      setScanComplete(true);
      toast.success(`Found ${cookies.length} cookies on ${data.url}`);
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scan website');
    } finally {
      setIsScanning(false);
    }
  };

  const getCategoryCount = (category: string) => {
    return scannedCookies.filter((cookie) => cookie.category === category).length;
  };

  /**
   * Export scan results to multiple formats
   */
  const handleExport = async (format: 'csv' | 'json' | 'pdf' = 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'csv') {
        exportToCSV();
      } else if (format === 'json') {
        exportToJSON();
      } else if (format === 'pdf') {
        await exportToPDF();
      }
      toast.success(`Exported ${scannedCookies.length} cookies to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export to CSV format
   */
  const exportToCSV = () => {
    const headers = ['Cookie Name', 'Domain', 'Category', 'Expiry', 'Description', 'Purpose', 'Provider'];
    const rows = scannedCookies.map(cookie => [
      cookie.name,
      cookie.domain,
      cookie.category,
      cookie.expiry,
      cookie.description || '',
      (cookie as any).purpose || '',
      (cookie as any).provider || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, `cookie-scan-${scannedUrl}-${Date.now()}.csv`, 'text/csv');
  };

  /**
   * Export to JSON format
   */
  const exportToJSON = () => {
    const exportData = {
      scan_date: new Date().toISOString(),
      website_url: scannedUrl,
      total_cookies: scannedCookies.length,
      categories: {
        necessary: getCategoryCount('necessary'),
        functional: getCategoryCount('functional'),
        analytics: getCategoryCount('analytics'),
        advertising: getCategoryCount('advertising'),
      },
      cookies: scannedCookies,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, `cookie-scan-${scannedUrl}-${Date.now()}.json`, 'application/json');
  };

  /**
   * Export to PDF format (placeholder - would need a PDF library)
   */
  const exportToPDF = async () => {
    // For production, integrate with a PDF library like jsPDF or use a server-side solution
    toast.info('PDF export coming soon! Using CSV for now.');
    exportToCSV();
  };

  /**
   * Helper to download file
   */
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Generate consent banner with detected cookies
   */
  const handleGenerateBanner = async () => {
    setIsGeneratingBanner(true);
    try {
      // Prepare banner configuration based on scan results
      const bannerConfig = {
        website_url: scannedUrl,
        template: 'modal', // Default template
        position: 'bottom',
        primaryColor: '#3b82f6',
        textColor: '#1f2937',
        backgroundColor: '#ffffff',
        title: 'We value your privacy',
        message: `This website uses cookies to enhance your experience. We have detected ${scannedCookies.length} cookies across ${Object.keys(getCategoriesUsed()).length} categories.`,
        acceptText: 'Accept All',
        rejectText: 'Reject All',
        settingsText: 'Cookie Settings',
        categories: getCategoriesUsed(),
        cookies: scannedCookies.map(cookie => ({
          name: cookie.name,
          category: cookie.category,
          description: cookie.description,
        })),
      };

      // Save banner configuration
      const response = await fetch('/api/cookies/banner-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerConfig),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate banner');
      }

      toast.success('Consent banner generated successfully!');
      
      // Navigate to widget settings page after a brief delay
      setTimeout(() => {
        router.push('/dashboard/cookies/widget');
      }, 1500);

    } catch (error) {
      console.error('Banner generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate banner');
    } finally {
      setIsGeneratingBanner(false);
    }
  };

  /**
   * Get unique categories used in scan
   */
  const getCategoriesUsed = () => {
    const categories = new Set(scannedCookies.map(cookie => cookie.category));
    return Array.from(categories);
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
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleExport('csv')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('json')}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            </div>
            <Button 
              onClick={handleGenerateBanner}
              disabled={isGeneratingBanner}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isGeneratingBanner ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Consent Banner
                </>
              )}
            </Button>
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
