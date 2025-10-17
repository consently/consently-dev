'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Globe, 
  Monitor, 
  Smartphone, 
  TrendingUp, 
  Users, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface WidgetStats {
  widgetInfo: {
    widgetId: string;
    name: string;
    domain: string;
    isActive: boolean;
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
  breakdown: {
    devices: Record<string, number>;
    browsers: Record<string, number>;
    countries: Record<string, number>;
    languages: Record<string, number>;
  };
  timeSeries: Array<{ date: string; accepted: number; rejected: number; partial: number }>;
  activities: Array<{
    activityId: string;
    name: string;
    purpose: string;
    industry: string;
    accepted: number;
    rejected: number;
    total: number;
    acceptanceRate: number;
  }>;
}

export default function WidgetStatsPage() {
  const params = useParams();
  const widgetId = params.widgetId as string;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WidgetStats | null>(null);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, [widgetId, range]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dpdpa/widget-stats/${widgetId}?range=${range}`);
      if (!response.ok) {
        throw new Error('Failed to fetch widget stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching widget stats:', error);
      toast.error('Failed to load widget statistics');
    } finally {
      setLoading(false);
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
      <div className="text-center py-12">
        <p className="text-gray-600">No statistics found for this widget</p>
        <Link href="/dashboard/dpdpa/widget">
          <Button className="mt-4">Back to Widgets</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dpdpa/widget">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{stats.widgetInfo.name}</h1>
              <Badge variant={stats.widgetInfo.isActive ? 'default' : 'secondary'}>
                {stats.widgetInfo.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {stats.widgetInfo.domain}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(stats.widgetInfo.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={range === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange('7d')}
          >
            7 Days
          </Button>
          <Button
            variant={range === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange('30d')}
          >
            30 Days
          </Button>
          <Button
            variant={range === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange('90d')}
          >
            90 Days
          </Button>
          <Button
            variant={range === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Consents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.totalConsents}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.uniqueVisitors} unique visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.overview.acceptanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.acceptedCount} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overview.rejectedCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.partialCount} partial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revoked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.overview.revokedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Withdrawn consents</p>
          </CardContent>
        </Card>
      </div>

      {/* Device & Browser Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              Device Breakdown
            </CardTitle>
            <CardDescription>Consents by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.breakdown.devices).map(([device, count]) => {
                const percentage = stats.overview.totalConsents > 0 
                  ? ((count / stats.overview.totalConsents) * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {device === 'Mobile' && <Smartphone className="h-4 w-4 text-gray-600" />}
                      {device === 'Desktop' && <Monitor className="h-4 w-4 text-gray-600" />}
                      <span className="text-sm font-medium text-gray-900">{device}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-indigo-600" />
              Browser Breakdown
            </CardTitle>
            <CardDescription>Consents by browser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.breakdown.browsers)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([browser, count]) => {
                  const percentage = stats.overview.totalConsents > 0 
                    ? ((count / stats.overview.totalConsents) * 100).toFixed(1) 
                    : 0;
                  return (
                    <div key={browser} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{browser}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            Geographic Distribution
          </CardTitle>
          <CardDescription>Consents by country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(stats.breakdown.countries)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 12)
              .map(([country, count]) => {
                const percentage = stats.overview.totalConsents > 0 
                  ? ((count / stats.overview.totalConsents) * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">{country}</span>
                    <Badge variant="secondary">{count} ({percentage}%)</Badge>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Activity Performance
          </CardTitle>
          <CardDescription>Acceptance rates by processing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.activities.map((activity) => (
              <div
                key={activity.activityId}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link href={`/dashboard/dpdpa/activity-stats/${activity.activityId}`}>
                      <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                        {activity.name}
                      </h4>
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{activity.purpose}</p>
                    <Badge variant="secondary" className="mt-2">{activity.industry}</Badge>
                  </div>
                  <Badge
                    className={`${
                      activity.acceptanceRate >= 75
                        ? 'bg-green-100 text-green-800'
                        : activity.acceptanceRate >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {activity.acceptanceRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {activity.accepted} accepted
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {activity.rejected} rejected
                    </span>
                  </div>
                  <span className="text-gray-600">{activity.total} total responses</span>
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      activity.acceptanceRate >= 75
                        ? 'bg-green-500'
                        : activity.acceptanceRate >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${activity.acceptanceRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Series Chart Placeholder */}
      {stats.timeSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Consent Trend
            </CardTitle>
            <CardDescription>Daily consent activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Total days tracked: {stats.timeSeries.length}</p>
              <p className="mt-2">
                Latest: {stats.timeSeries[stats.timeSeries.length - 1]?.date} - 
                {' '}Accepted: {stats.timeSeries[stats.timeSeries.length - 1]?.accepted},
                {' '}Rejected: {stats.timeSeries[stats.timeSeries.length - 1]?.rejected}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
