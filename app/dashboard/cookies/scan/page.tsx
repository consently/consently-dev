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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [scanProgress, setScanProgress] = useState<string>('');
  const [scannedCookies, setScannedCookies] = useState<ScannedCookie[]>([]);
  const [scanComplete, setScanComplete] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingBanner, setIsGeneratingBanner] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scanMetrics, setScanMetrics] = useState<{
    pagesScanned: number;
    complianceScore: number;
    thirdPartyCount: number;
    firstPartyCount: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CookieScanInput>({
    resolver: zodResolver(cookieScanSchema),
    defaultValues: { scanDepth: 'medium' },
  });

  // Load scan history on mount
  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = async () => {
    try {
      const response = await fetch('/api/cookies/scan-enhanced?limit=5');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.scans) {
          setScanHistory(result.scans);
        }
      }
    } catch (error) {
      console.error('Failed to load scan history:', error);
    }
  };

  const onSubmit = async (data: CookieScanInput) => {
    setIsScanning(true);
    setScanComplete(false);
    setScanProgress('Initializing scan...');
    setScanMetrics(null);

    try {
      setScanProgress(`Scanning ${data.url} with ${data.scanDepth} depth...`);
      
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

      setScanProgress('Processing results...');

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
      
      // Set metrics from API response
      setScanMetrics({
        pagesScanned: result.data.pagesScanned || 1,
        complianceScore: result.data.complianceScore || 0,
        thirdPartyCount: result.data.thirdPartyCount || 0,
        firstPartyCount: result.data.firstPartyCount || 0,
      });
      
      setScanComplete(true);
      setScanProgress('');
      toast.success(`Found ${cookies.length} cookies`);
      
      // Reload scan history
      loadScanHistory();
    } catch (error) {
      console.error('Scan error:', error);
      setScanProgress('');
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
   * Export to PDF format with proper formatting
   */
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(31, 41, 55); // gray-900
      doc.text('Cookie Scan Report', pageWidth / 2, 20, { align: 'center' });
      
      // Add scan details
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99); // gray-600
      doc.text(`Website: ${scannedUrl}`, 14, 35);
      doc.text(`Scan Date: ${new Date().toLocaleString()}`, 14, 42);
      doc.text(`Total Cookies: ${scannedCookies.length}`, 14, 49);
      
      if (scanMetrics) {
        doc.text(`Compliance Score: ${scanMetrics.complianceScore}%`, 14, 56);
      }
      
      // Add category summary
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Cookie Categories', 14, 75);
      
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const categorySummary = [
        `Necessary: ${getCategoryCount('necessary')}`,
        `Functional: ${getCategoryCount('functional')}`,
        `Analytics: ${getCategoryCount('analytics')}`,
        `Advertising: ${getCategoryCount('advertising')}`
      ];
      categorySummary.forEach((text, index) => {
        doc.text(text, 14, 85 + (index * 7));
      });
      
      // Add cookies table
      const tableData = scannedCookies.map(cookie => [
        cookie.name,
        cookie.domain,
        cookie.category,
        cookie.expiry,
        cookie.description.substring(0, 50) + (cookie.description.length > 50 ? '...' : '')
      ]);
      
      autoTable(doc, {
        startY: 115,
        head: [['Cookie Name', 'Domain', 'Category', 'Expiry', 'Description']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [59, 130, 246], // blue-600
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [31, 41, 55] // gray-900
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251] // gray-50
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 60 }
        },
        margin: { top: 10, left: 14, right: 14 },
      });
      
      // Add footer with compliance note
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      if (finalY < doc.internal.pageSize.getHeight() - 40) {
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(
          'This report was generated by Consently - DPDPA 2023 Consent Manager',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        );
        doc.text(
          `Generated on ${new Date().toLocaleString()}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 15,
          { align: 'center' }
        );
      }
      
      // Save the PDF
      const filename = `cookie-scan-${scannedUrl.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
      doc.save(filename);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
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
      // Prepare banner configuration based on scan results using new API format
      const categoriesFound = getCategoriesUsed();
      const bannerConfig = {
        name: `Cookie Banner for ${new URL(scannedUrl).hostname}`,
        description: `Generated from cookie scan of ${scannedUrl}`,
        layout: 'modal',
        position: 'bottom',
        
        // Theme configuration
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          backgroundColor: '#ffffff',
          textColor: '#1f2937',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          borderRadius: 8,
          boxShadow: true
        },
        
        // Content
        title: 'We value your privacy',
        message: `This website uses cookies to enhance your experience. We have detected ${scannedCookies.length} cookies across ${categoriesFound.length} categories. Please review and customize your preferences.`,
        privacyPolicyUrl: '',
        privacyPolicyText: 'Privacy Policy',
        
        // Button configurations
        acceptButton: {
          text: 'Accept All',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 'semibold'
        },
        rejectButton: {
          text: 'Reject All',
          backgroundColor: '#ffffff',
          textColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 'medium'
        },
        settingsButton: {
          text: 'Cookie Settings',
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 'normal'
        },
        
        // Behavior settings
        showRejectButton: true,
        showSettingsButton: true,
        autoShow: true,
        showAfterDelay: 0,
        respectDNT: false,
        blockContent: false,
        zIndex: 9999,
        
        // Status
        is_active: true,
        is_default: false
      };

      console.log('Sending banner configuration:', bannerConfig);

      // Save banner configuration using the new API
      const response = await fetch('/api/cookies/banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bannerConfig),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Banner API Error:', {
          status: response.status,
          statusText: response.statusText,
          result: result
        });
        
        // Show detailed error message if available
        let errorMessage = 'Failed to create banner configuration';
        if (result.error) {
          errorMessage = result.error;
        }
        if (result.details && Array.isArray(result.details)) {
          const detailsText = result.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
          errorMessage += `. Details: ${detailsText}`;
        }
        
        throw new Error(errorMessage);
      }

      toast.success('Consent banner generated successfully!');
      
      // Navigate to templates page to view/edit the banner
      setTimeout(() => {
        router.push('/dashboard/cookies/templates');
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scan Website</CardTitle>
              <CardDescription>Enter your website URL to begin scanning for cookies</CardDescription>
            </div>
            {scanHistory.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'Show'} History ({scanHistory.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Scan History */}
          {showHistory && scanHistory.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Scans</h4>
              <div className="space-y-2">
                {scanHistory.slice(0, 5).map((scan) => (
                  <div 
                    key={scan.scanId} 
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{scan.url}</div>
                      <div className="text-xs text-gray-500">
                        {scan.cookiesFound || 0} cookies • {scan.depth} • 
                        {new Date(scan.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xs">
                      {scan.status === 'completed' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">✓ Complete</span>
                      )}
                      {scan.status === 'running' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">⟳ Running</span>
                      )}
                      {scan.status === 'failed' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">✗ Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

            {/* Scan Progress Indicator */}
            {isScanning && scanProgress && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">{scanProgress}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    This may take a few moments depending on the website size...
                  </p>
                </div>
              </div>
            )}

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Cookies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scannedCookies.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Detected cookies
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Necessary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCategoryCount('necessary')}</div>
                <p className="text-xs text-gray-500 mt-1">Required cookies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCategoryCount('analytics')}</div>
                <p className="text-xs text-gray-500 mt-1">Tracking cookies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Advertising</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCategoryCount('advertising')}</div>
                <p className="text-xs text-gray-500 mt-1">Marketing cookies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scanMetrics?.complianceScore || 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {scanMetrics && scanMetrics.complianceScore >= 80 ? 'Good' : 
                   scanMetrics && scanMetrics.complianceScore >= 60 ? 'Fair' : 'Needs work'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          {scanMetrics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scan Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">First-party cookies:</span>
                    <span className="ml-2 font-semibold">{scanMetrics.firstPartyCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Third-party cookies:</span>
                    <span className="ml-2 font-semibold">{scanMetrics.thirdPartyCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Scanned URL:</span>
                    <span className="ml-2 font-semibold text-blue-600 truncate">{scannedUrl}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              <Button 
                variant="outline" 
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </>
                )}
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
