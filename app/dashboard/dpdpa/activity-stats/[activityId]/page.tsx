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
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Shield,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityStats {
  activityInfo: {
    activityId: string;
    name: string;
    purpose: string;
    industry: string;
    dataAttributes: string[];
    retentionPeriod: string;
    isActive: boolean;
    createdAt: string;
  };
  overview: {
    totalResponses: number;
    acceptedCount: number;
    rejectedCount: number;
    acceptanceRate: number;
    widgetCount: number;
  };
  breakdown: {
    countries: Array<{
      country: string;
      accepted: number;
      rejected: number;
      total: number;
      acceptanceRate: number;
    }>;
    devices: Array<{
      device: string;
      accepted: number;
      rejected: number;
      total: number;
      acceptanceRate: number;
    }>;
  };
  timeSeries: Array<{ date: string; accepted: number; rejected: number }>;
  widgets: Array<{
    widgetId: string;
    widgetName: string;
    domain: string;
    accepted: number;
    rejected: number;
    total: number;
    acceptanceRate: number;
  }>;
}

export default function ActivityStatsPage() {
  const params = useParams();
  const activityId = params.activityId as string;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [range, setRange] = useState('30d');

  useEffect(() => {
    fetchStats();
  }, [activityId, range]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dpdpa/activity-stats/${activityId}?range=${range}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch activity stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load activity statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading activity statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No statistics found for this activity</p>
        <Link href="/dashboard/dpdpa/activities">
          <Button className="mt-4">Back to Activities</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dpdpa/activities">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{stats.activityInfo.name}</h1>
              <Badge variant={stats.activityInfo.isActive ? 'default' : 'secondary'}>
                {stats.activityInfo.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-700">
                {stats.activityInfo.industry}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">{stats.activityInfo.purpose}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(stats.activityInfo.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Retention: {stats.activityInfo.retentionPeriod}
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

      {/* Data Attributes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Data Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.activityInfo.dataAttributes.map((attr, i) => (
              <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                {attr}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.totalResponses}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across {stats.overview.widgetCount} widget{stats.overview.widgetCount !== 1 ? 's' : ''}
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
            <CardTitle className="text-sm font-medium text-gray-600">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.overview.acceptedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Users granted consent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overview.rejectedCount}</div>
            <p className="text-xs text-gray-500 mt-1">Users denied consent</p>
          </CardContent>
        </Card>
      </div>

      {/* Widget Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Performance by Widget
          </CardTitle>
          <CardDescription>How this activity performs across different widgets</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.widgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No widget data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.widgets.map((widget) => (
                <div
                  key={widget.widgetId}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Link href={`/dashboard/dpdpa/widget-stats/${widget.widgetId}`}>
                        <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {widget.widgetName}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="h-3 w-3 text-gray-500" />
                        <p className="text-sm text-gray-600">{widget.domain}</p>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        widget.acceptanceRate >= 75
                          ? 'bg-green-100 text-green-800'
                          : widget.acceptanceRate >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {widget.acceptanceRate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {widget.accepted} accepted
                      </span>
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        {widget.rejected} rejected
                      </span>
                    </div>
                    <span className="text-gray-600">{widget.total} total</span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        widget.acceptanceRate >= 75
                          ? 'bg-green-500'
                          : widget.acceptanceRate >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${widget.acceptanceRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geographic & Device Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Acceptance by country</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.breakdown.countries.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">No geographic data available</p>
            ) : (
              <div className="space-y-3">
                {stats.breakdown.countries
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 10)
                  .map((country) => (
                    <div key={country.country} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{country.country}</span>
                          <Badge
                            variant="secondary"
                            className={`${
                              country.acceptanceRate >= 75
                                ? 'bg-green-100 text-green-800'
                                : country.acceptanceRate >= 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {country.acceptanceRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="text-green-600">{country.accepted} ✓</span>
                          <span className="text-red-600">{country.rejected} ✗</span>
                          <span className="text-gray-500">({country.total} total)</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              Device Distribution
            </CardTitle>
            <CardDescription>Acceptance by device type</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.breakdown.devices.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-4">No device data available</p>
            ) : (
              <div className="space-y-3">
                {stats.breakdown.devices
                  .sort((a, b) => b.total - a.total)
                  .map((device) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {device.device === 'Mobile' && <Smartphone className="h-4 w-4 text-gray-600" />}
                            {device.device === 'Desktop' && <Monitor className="h-4 w-4 text-gray-600" />}
                            <span className="text-sm font-medium text-gray-900">{device.device}</span>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`${
                              device.acceptanceRate >= 75
                                ? 'bg-green-100 text-green-800'
                                : device.acceptanceRate >= 50
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {device.acceptanceRate.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="text-green-600">{device.accepted} ✓</span>
                          <span className="text-red-600">{device.rejected} ✗</span>
                          <span className="text-gray-500">({device.total} total)</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart Placeholder */}
      {stats.timeSeries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Acceptance Trend
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
