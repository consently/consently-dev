'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Ban
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface EmailVerificationMetrics {
  overview: {
    totalOtpSent: number;
    totalVerified: number;
    totalFailed: number;
    totalSkipped: number;
    totalRateLimited: number;
    verificationRate: number;
    skipRate: number;
    averageTimeToVerifySeconds: number;
  };
  timeSeries: Array<{
    date: string;
    otpSent: number;
    verified: number;
    failed: number;
    skipped: number;
    rateLimited: number;
  }>;
  byWidget: Array<{
    widgetId: string;
    widgetName: string;
    otpSent: number;
    verified: number;
    verificationRate: number;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    visitorId: string;
    createdAt: string;
    metadata: any;
  }>;
}

interface AnalyticsResponse {
  success: boolean;
  data?: EmailVerificationMetrics;
  error?: string;
  meta?: {
    startDate: string;
    endDate: string;
    days: number;
    widgetId: string;
  };
}

export default function EmailVerificationAnalyticsPage() {
  const [data, setData] = useState<EmailVerificationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>('30');
  const [selectedWidget, setSelectedWidget] = useState<string>('all');
  const [widgets, setWidgets] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: 'All Widgets' },
  ]);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        days: dateRange,
      });

      if (selectedWidget !== 'all') {
        params.append('widgetId', selectedWidget);
      }

      const response = await fetch(`/api/analytics/email-verification?${params.toString()}`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch analytics data';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result: AnalyticsResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }

      if (!result.data) {
        throw new Error('No data returned from analytics API');
      }

      setData(result.data);

      // Update widgets dropdown if not already populated
      if (widgets.length === 1 && result.data.byWidget.length > 0) {
        const widgetOptions = [
          { value: 'all', label: 'All Widgets' },
          ...result.data.byWidget.map(w => ({
            value: w.widgetId,
            label: w.widgetName || w.widgetId,
          })),
        ];
        setWidgets(widgetOptions);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
      toast.error('Failed to load analytics', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedWidget]);

  const formatEventType = (type: string): string => {
    const formatted: Record<string, string> = {
      otp_sent: 'OTP Sent',
      otp_verified: 'Verified',
      otp_failed: 'Failed',
      otp_skipped: 'Skipped',
      rate_limited: 'Rate Limited',
    };
    return formatted[type] || type;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'otp_sent':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'otp_verified':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'otp_failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'otp_skipped':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rate_limited':
        return <Ban className="h-4 w-4 text-orange-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatSeconds = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Verification Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor email verification performance and user engagement
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <label className="text-sm font-medium text-gray-700">Date Range:</label>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                ]}
              />
            </div>
            {widgets.length > 1 && (
              <div className="flex items-center gap-4 flex-1">
                <label className="text-sm font-medium text-gray-700">Widget:</label>
                <Select
                  value={selectedWidget}
                  onChange={(e) => setSelectedWidget(e.target.value)}
                  options={widgets}
                />
              </div>
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
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      )}

      {/* Overview Metrics */}
      {!loading && !error && data && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">OTPs Sent</CardTitle>
                <Mail className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalOtpSent.toLocaleString()}</div>
                <p className="text-xs text-gray-600 mt-1">
                  Total verification attempts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.overview.totalVerified.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {data.overview.verificationRate.toFixed(1)}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Skipped</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {data.overview.totalSkipped.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {data.overview.skipRate.toFixed(1)}% skip rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg. Time</CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatSeconds(data.overview.averageTimeToVerifySeconds)}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  To complete verification
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Metrics */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Failed Attempts</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.overview.totalFailed.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Invalid or expired codes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Rate Limited</CardTitle>
                <Ban className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {data.overview.totalRateLimited.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Blocked requests
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {data.overview.totalOtpSent > 0
                    ? (((data.overview.totalVerified) / data.overview.totalOtpSent) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Successfully verified
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="otpSent" 
                    stroke="#3b82f6" 
                    name="OTP Sent"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="verified" 
                    stroke="#10b981" 
                    name="Verified"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="#ef4444" 
                    name="Failed"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="skipped" 
                    stroke="#f59e0b" 
                    name="Skipped"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* By Widget Breakdown */}
          {data.byWidget.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance by Widget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="border-b-2 border-gray-200 bg-gray-50">
                      <tr>
                        <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">
                          Widget Name
                        </th>
                        <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">
                          OTPs Sent
                        </th>
                        <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">
                          Verified
                        </th>
                        <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">
                          Verification Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byWidget.map((widget) => (
                        <tr key={widget.widgetId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 align-middle">
                            <div className="font-medium text-gray-900">{widget.widgetName}</div>
                            <div className="text-xs text-gray-500 font-mono">{widget.widgetId}</div>
                          </td>
                          <td className="p-3 align-middle text-gray-900">
                            {widget.otpSent.toLocaleString()}
                          </td>
                          <td className="p-3 align-middle text-green-600 font-medium">
                            {widget.verified.toLocaleString()}
                          </td>
                          <td className="p-3 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${Math.min(widget.verificationRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {widget.verificationRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentEvents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No recent events</p>
                ) : (
                  data.recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        {getEventIcon(event.eventType)}
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {formatEventType(event.eventType)}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            Visitor: {event.visitorId.substring(0, 16)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600">
                          {format(new Date(event.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(event.createdAt), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
