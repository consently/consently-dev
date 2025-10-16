'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  CheckCircle,
  XCircle,
  Activity,
  Download,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ConsentRecord {
  id: string;
  consent_status: 'accepted' | 'rejected' | 'partial';
  accepted_activities: string[];
  rejected_activities: string[];
  device_type: string;
  country: string;
  consent_timestamp: string;
}

interface ActivityStat {
  activity_id: string;
  activity_name: string;
  acceptance_count: number;
  rejection_count: number;
  acceptance_rate: number;
}

interface WidgetStats {
  total_consents: number;
  accepted_count: number;
  rejected_count: number;
  partial_count: number;
  acceptance_rate: number;
  unique_visitors: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [widgetId, setWidgetId] = useState<string>('');
  const [widgets, setWidgets] = useState<any[]>([]);
  const [stats, setStats] = useState<WidgetStats | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [recentConsents, setRecentConsents] = useState<ConsentRecord[]>([]);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all

  useEffect(() => {
    fetchWidgets();
  }, []);

  useEffect(() => {
    if (widgetId) {
      fetchAnalytics();
    }
  }, [widgetId, dateRange]);

  const fetchWidgets = async () => {
    try {
      const response = await fetch('/api/dpdpa/widget-config');
      if (response.ok) {
        const data = await response.json();
        setWidgets(data.data || []);
        if (data.data && data.data.length > 0) {
          setWidgetId(data.data[0].widget_id);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching widgets:', error);
      toast.error('Failed to load widgets');
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dpdpa/analytics?widgetId=${widgetId}&range=${dateRange}`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setActivityStats(data.activityStats || []);
        setRecentConsents(data.recentConsents || []);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({
      stats,
      activityStats,
      recentConsents,
      exportedAt: new Date().toISOString()
    }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consent-analytics-${widgetId}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics data exported successfully');
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
      default:
        return <Monitor className="h-4 w-4" />;
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (widgets.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consent Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track consent rates and activity acceptance metrics
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Widget Configuration Found</h3>
            <p className="text-gray-600 mb-6">
              Create a widget configuration to start tracking consent analytics
            </p>
            <Button onClick={() => window.location.href = '/dashboard/dpdpa/widget'}>
              Configure Widget
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Consent Analytics</h1>
          <p className="text-gray-600 mt-2">
            Track consent rates, activity acceptance, and visitor behavior
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Widget Selector & Date Range */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Widget</label>
              <Select
                value={widgetId}
                onChange={(e) => setWidgetId(e.target.value)}
              >
                {widgets.map((widget) => (
                  <option key={widget.widget_id} value={widget.widget_id}>
                    {widget.name} - {widget.domain}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Time Period</label>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && !stats ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Consents</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats?.total_consents || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.unique_visitors || 0} unique visitors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Acceptance Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.acceptance_rate?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.accepted_count || 0} accepted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats?.rejected_count || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.total_consents ? ((stats.rejected_count / stats.total_consents) * 100).toFixed(1) : 0}% rejection rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Partial Consent</CardTitle>
                  <Activity className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{stats?.partial_count || 0}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.total_consents ? ((stats.partial_count / stats.total_consents) * 100).toFixed(1) : 0}% partial
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Acceptance Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Acceptance Rates</CardTitle>
              <CardDescription>
                How visitors respond to each processing activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityStats.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No activity data available yet</p>
                  <p className="text-sm text-gray-500 mt-1">Data will appear after visitors interact with your widget</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityStats.map((activity) => (
                    <div key={activity.activity_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{activity.activity_name}</h4>
                          <p className="text-sm text-gray-500">
                            {activity.acceptance_count + activity.rejection_count} total responses
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {activity.acceptance_rate.toFixed(1)}%
                          </div>
                          <p className="text-xs text-gray-500">acceptance rate</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-green-500 flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${activity.acceptance_rate}%` }}
                        >
                          {activity.acceptance_rate > 10 && (
                            <span className="text-xs font-medium text-white">
                              {activity.acceptance_count} accepted
                            </span>
                          )}
                        </div>
                        <div 
                          className="absolute top-0 h-full bg-red-500 flex items-center justify-start pl-2 transition-all"
                          style={{ 
                            left: `${activity.acceptance_rate}%`,
                            width: `${100 - activity.acceptance_rate}%` 
                          }}
                        >
                          {(100 - activity.acceptance_rate) > 10 && (
                            <span className="text-xs font-medium text-white">
                              {activity.rejection_count} rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Consent Records */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Consent Activity</CardTitle>
              <CardDescription>
                Latest consent decisions from visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentConsents.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No consent records yet</p>
                  <p className="text-sm text-gray-500 mt-1">Records will appear after visitors interact with your widget</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConsents.map((consent) => (
                    <div key={consent.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(consent.device_type)}
                          <span className="text-xs text-gray-500">{consent.device_type || 'Unknown'}</span>
                        </div>
                        
                        <Badge className={`${getStatusColor(consent.consent_status)} border`}>
                          {consent.consent_status}
                        </Badge>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {consent.accepted_activities.length} accepted
                          <XCircle className="h-4 w-4 text-red-600 ml-2" />
                          {consent.rejected_activities.length} rejected
                        </div>

                        {consent.country && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Globe className="h-3 w-3" />
                            {consent.country}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {new Date(consent.consent_timestamp).toLocaleDateString()} {new Date(consent.consent_timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Analytics Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• High acceptance rates indicate clear value communication</li>
                    <li>• Partial consent is normal - respect user choices</li>
                    <li>• Monitor device types to optimize mobile experience</li>
                    <li>• Export data regularly for compliance documentation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
