'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Download, TrendingUp, Users, Globe, Monitor, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useReportsAnalytics } from '@/hooks/useReportsAnalytics';
import { ConsentTrendsChart } from '@/components/reports/ConsentTrendsChart';
import { DeviceBreakdownChart } from '@/components/reports/DeviceBreakdownChart';
import { GeographicDistributionChart } from '@/components/reports/GeographicDistributionChart';
import { ConsentRateByCountryChart } from '@/components/reports/ConsentRateByCountryChart';
import type { DateRangeOption, ExportFormat } from '@/types/reports';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRangeOption>('30');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);

  const { data, loading, error, refetch } = useReportsAnalytics(dateRange);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/reports/analytics?dateRange=${dateRange}&format=${exportFormat}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (exportFormat === 'json') {
        const jsonData = await response.json();
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consent-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (exportFormat === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consent-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else if (exportFormat === 'pdf') {
        // PDF export would require a backend service like Puppeteer or a PDF library
        alert('PDF export is not yet implemented. Please use CSV or JSON format.');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate comparison metrics (mock for now, could be enhanced with previous period data)
  const calculateChange = (current: number) => {
    // For demo purposes, showing a positive trend
    const change = ((Math.random() * 20) - 5).toFixed(1);
    return parseFloat(change);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into your consent management data
          </p>
        </div>
        <div className="flex gap-4">
          <Select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            options={[
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
              { value: 'pdf', label: 'PDF (Coming Soon)' },
            ]}
          />
          <Button onClick={handleExport} disabled={isExporting || loading || !!error}>
            {isExporting ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                  { value: 'all', label: 'All time' },
                ]}
              />
            </div>
            {error && (
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Failed to load analytics data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      {!loading && !error && data && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Consents</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalConsents.toLocaleString()}</div>
              <p className={`text-xs mt-1 ${
                calculateChange(data.summary.totalConsents) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateChange(data.summary.totalConsents) > 0 ? '↑' : '↓'} {Math.abs(calculateChange(data.summary.totalConsents))}% vs last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Consent Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.consentRate.toFixed(1)}%</div>
              <p className={`text-xs mt-1 ${
                calculateChange(data.summary.consentRate) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateChange(data.summary.consentRate) > 0 ? '↑' : '↓'} {Math.abs(calculateChange(data.summary.consentRate)).toFixed(1)}% vs last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Countries</CardTitle>
              <Globe className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.geographicData.length}</div>
              <p className="text-xs text-gray-600 mt-1">Active regions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Devices</CardTitle>
              <Monitor className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.deviceData.length}</div>
              <p className="text-xs text-gray-600 mt-1">Device types tracked</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Consent Trends */}
      {!loading && !error && data && (
        <ConsentTrendsChart data={data.trendData} />
      )}

      {!loading && !error && data && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Device Breakdown */}
          <DeviceBreakdownChart data={data.deviceData} />

          {/* Geographic Distribution */}
          <GeographicDistributionChart data={data.geographicData} />
        </div>
      )}

      {/* Comparison Chart */}
      {!loading && !error && data && (
        <ConsentRateByCountryChart data={data.geographicData} />
      )}
    </div>
  );
}
