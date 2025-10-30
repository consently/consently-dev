'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface WidgetStats {
  widget: {
    id: string;
    domain: string;
    createdAt: string;
  };
  overview: {
    totalConsents: number;
    acceptedCount: number;
    rejectedCount: number;
    partialCount: number;
    revokedCount: number;
    acceptanceRate: number;
    uniqueVisitors: number;
  };
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  languageBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  timeSeriesData: Record<string, { accepted: number; rejected: number; partial: number }>;
  recentConsents: Array<{
    id: string;
    status: string;
    timestamp: string;
    deviceType: string;
    ipAddress: string;
    country: string;
    browser: string;
  }>;
}

export default function CookieWidgetStatsPage() {
  const params = useParams();
  const widgetId = params.widgetId as string;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WidgetStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, [widgetId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cookies/widget-stats/${widgetId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      setStats(result.data);
    } catch (error) {
      console.error('Error fetching widget stats:', error);
      toast.error('Failed to load widget statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'revoked':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'partial':
      case 'revoked':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading widget statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Widget Statistics</h1>
          <p className="text-gray-600 mt-2">Widget not found or access denied</p>
        </div>
      </div>
    );
  }

  // Transform data for charts
  const deviceChartData = Object.entries(stats.deviceBreakdown).map(([name, value]) => ({ name, value }));
  const browserChartData = Object.entries(stats.browserBreakdown).map(([name, value]) => ({ name, value }));
  const countryChartData = Object.entries(stats.countryBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));
  
  const timeSeriesChartData = Object.entries(stats.timeSeriesData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      accepted: data.accepted,
      rejected: data.rejected,
      partial: data.partial,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cookie Widget Statistics</h1>
          <p className="text-gray-600 mt-2">
            Detailed analytics for widget: <span className="font-mono text-blue-600">{stats.widget.domain}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Consents</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stats.overview.totalConsents.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.uniqueVisitors.toLocaleString()} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Acceptance Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.overview.acceptanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.acceptedCount.toLocaleString()} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Rejections</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.overview.rejectedCount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.partialCount} partial, {stats.overview.revokedCount} revoked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Widget ID</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono text-gray-900 truncate" title={stats.widget.id}>
              {stats.widget.id}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Created: {new Date(stats.widget.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Consent Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Consent Trends</CardTitle>
            <CardDescription>Daily consent decisions over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888" 
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accepted" stroke="#10b981" strokeWidth={2} name="Accepted" />
                  <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
                  <Line type="monotone" dataKey="partial" stroke="#f59e0b" strokeWidth={2} name="Partial" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>Consents by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deviceChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No device data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Distribution</CardTitle>
            <CardDescription>Consents by browser</CardDescription>
          </CardHeader>
          <CardContent>
            {browserChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={browserChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No browser data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>Top 10 countries by consent volume</CardDescription>
          </CardHeader>
          <CardContent>
            {countryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={countryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#888" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No country data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Consent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Consent Activity</CardTitle>
          <CardDescription>Latest consent decisions for this widget</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentConsents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No recent consent activity
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentConsents.map((consent) => (
                <div
                  key={consent.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {consent.deviceType === 'Mobile' || consent.deviceType === 'Tablet' ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${getStatusColor(consent.status)} border text-xs`}>
                          {getStatusIcon(consent.status)}
                          <span className="ml-1">{consent.status}</span>
                        </Badge>
                        {consent.country && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {consent.country}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {consent.browser}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">{consent.ipAddress}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(consent.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(consent.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
