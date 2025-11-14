'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Download, TrendingUp, Users, Globe, Monitor, AlertCircle, RefreshCw, UserCheck, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useReportsAnalytics } from '@/hooks/useReportsAnalytics';
import { ConsentTrendsChart } from '@/components/reports/ConsentTrendsChart';
import { DeviceBreakdownChart } from '@/components/reports/DeviceBreakdownChart';
import { GeographicDistributionChart } from '@/components/reports/GeographicDistributionChart';
import { ConsentRateByCountryChart } from '@/components/reports/ConsentRateByCountryChart';
import { HourlyPatternChart } from '@/components/reports/HourlyPatternChart';
import { DayOfWeekChart } from '@/components/reports/DayOfWeekChart';
import { BrowserBreakdownChart } from '@/components/reports/BrowserBreakdownChart';
import { OSBreakdownChart } from '@/components/reports/OSBreakdownChart';
import { ConversionFunnelChart } from '@/components/reports/ConversionFunnelChart';
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
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errorData.error || 'Export failed');
      }

      const timestamp = format(new Date(), 'yyyy-MM-dd');
      let filename = `consent-report-${timestamp}`;
      let blob: Blob;

      if (exportFormat === 'json') {
        const jsonData = await response.json();
        blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        filename += '.json';
      } else if (exportFormat === 'csv') {
        blob = await response.blob();
        filename += '.csv';
      } else if (exportFormat === 'pdf') {
        blob = await response.blob();
        filename += '.pdf';
      } else {
        throw new Error('Unsupported export format');
      }

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Report exported successfully as ${exportFormat.toUpperCase()}`, {
        description: `File: ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to export report';
      toast.error('Export Failed', {
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate comparison metrics from previous period data
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return 0;
    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(1));
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
              { value: 'pdf', label: 'PDF' },
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

      {/* Key Metrics - Enhanced */}
      {!loading && !error && data && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Consents</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalConsents.toLocaleString()}</div>
                {data.previousPeriod && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    calculateChange(data.summary.totalConsents, data.previousPeriod.totalConsents) > 0 
                      ? 'text-green-600' 
                      : calculateChange(data.summary.totalConsents, data.previousPeriod.totalConsents) < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {calculateChange(data.summary.totalConsents, data.previousPeriod.totalConsents) > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : calculateChange(data.summary.totalConsents, data.previousPeriod.totalConsents) < 0 ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : null}
                    {Math.abs(calculateChange(data.summary.totalConsents, data.previousPeriod.totalConsents))}% vs last period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Consent Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.summary.consentRate.toFixed(1)}%</div>
                {data.previousPeriod && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    calculateChange(data.summary.consentRate, data.previousPeriod.consentRate) > 0 
                      ? 'text-green-600' 
                      : calculateChange(data.summary.consentRate, data.previousPeriod.consentRate) < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {calculateChange(data.summary.consentRate, data.previousPeriod.consentRate) > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : calculateChange(data.summary.consentRate, data.previousPeriod.consentRate) < 0 ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : null}
                    {Math.abs(calculateChange(data.summary.consentRate, data.previousPeriod.consentRate)).toFixed(1)}% vs last period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Unique Visitors</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.uniqueVisitors.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {data.summary.returnVisitors} return visitors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Denial Rate</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{data.summary.denialRate.toFixed(1)}%</div>
                <p className="text-xs text-gray-600 mt-1">
                  {data.summary.deniedConsents.toLocaleString()} denied
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Partial Consents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{data.summary.partialConsents.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {data.summary.totalConsents > 0 
                    ? ((data.summary.partialConsents / data.summary.totalConsents) * 100).toFixed(1) 
                    : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Revocations</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{data.summary.withdrawnConsents.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {data.summary.revocationRate.toFixed(1)}% revocation rate
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

          {/* Conversion Funnel */}
          {data.conversionFunnel && (
            <ConversionFunnelChart data={data.conversionFunnel} />
          )}
        </>
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

      {/* Time-Based Analytics */}
      {!loading && !error && data && data.hourlyData && data.hourlyData.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <HourlyPatternChart data={data.hourlyData} />
          <DayOfWeekChart data={data.dayOfWeekData} />
        </div>
      )}

      {/* Browser & OS Breakdown */}
      {!loading && !error && data && (
        <div className="grid gap-6 lg:grid-cols-2">
          {data.browserData && data.browserData.length > 0 && (
            <BrowserBreakdownChart data={data.browserData} />
          )}
          {data.osData && data.osData.length > 0 && (
            <OSBreakdownChart data={data.osData} />
          )}
        </div>
      )}

      {/* Comparison Chart */}
      {!loading && !error && data && (
        <ConsentRateByCountryChart data={data.geographicData} />
      )}
    </div>
  );
}
