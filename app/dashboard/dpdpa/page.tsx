'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Globe,
  Monitor,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface DashboardStats {
  totalConsents: number;
  acceptedCount: number;
  rejectedCount: number;
  partialCount: number;
  revokedCount: number;
  acceptanceRate: number;
  uniqueVisitors: number;
  totalActivities: number;
  activeWidgets: number;
  last7Days: {
    consents: number;
    change: number;
  };
}

interface ActivityCard {
  id: string;
  name: string;
  purpose: string;
  acceptanceRate: number;
  totalResponses: number;
  status: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
}

interface RecentConsent {
  id: string;
  timestamp: string;
  status: 'accepted' | 'rejected' | 'partial' | 'revoked';
  deviceType: string;
  country: string;
  ipAddress?: string;
}

export default function DPDPADashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activityCards, setActivityCards] = useState<ActivityCard[]>([]);
  const [recentConsents, setRecentConsents] = useState<RecentConsent[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch comprehensive dashboard data
      const [statsRes, activitiesRes, widgetsRes, consentsRes] = await Promise.all([
        fetch('/api/dpdpa/dashboard-stats'),
        fetch('/api/dpdpa/activities'),
        fetch('/api/dpdpa/widget-config'),
        fetch('/api/dpdpa/consent-record?limit=10'),
      ]);

      // Process stats
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || statsData);
      }

      // Process activities for cards
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        const activities = activitiesData.data || [];
        
        // Transform activities into cards with mock analytics
        const cards: ActivityCard[] = activities.slice(0, 6).map((activity: any) => {
          const acceptanceRate = 50 + Math.random() * 40; // Mock: 50-90%
          const totalResponses = Math.floor(Math.random() * 500) + 100;
          
          return {
            id: activity.id,
            name: activity.activity_name,
            purpose: activity.purpose,
            acceptanceRate,
            totalResponses,
            status: acceptanceRate >= 75 ? 'high' : acceptanceRate >= 50 ? 'medium' : 'low',
            trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.3 ? 'stable' : 'down',
          };
        });
        setActivityCards(cards);
      }

      // Process recent consents
      if (consentsRes.ok) {
        const consentsData = await consentsRes.json();
        const consents = consentsData.data || [];
        setRecentConsents(consents.slice(0, 5).map((c: any) => ({
          id: c.id,
          timestamp: c.consent_timestamp || c.created_at,
          status: c.consent_status || c.status,
          deviceType: c.device_type || 'desktop',
          country: c.country || 'Unknown',
          ipAddress: c.ip_address,
        })));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'high' | 'medium' | 'low') => {
    switch (status) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getConsentStatusColor = (status: string) => {
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
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DPDPA Consent Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading your comprehensive consent overview...</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DPDPA Consent Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive overview of your DPDPA 2023 compliance and consent management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/dpdpa/analytics">
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </Link>
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
              {stats?.totalConsents.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              {stats?.last7Days.change || 0}% from last week
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
              {stats?.acceptanceRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.acceptedCount || 0} accepted consents
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
              {stats?.rejectedCount || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.partialCount || 0} partial, {stats?.revokedCount || 0} revoked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Activities</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalActivities || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.activeWidgets || 0} active widgets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Color-Coded Activity Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Processing Activities Overview</CardTitle>
              <CardDescription>
                Acceptance rates and performance by activity
              </CardDescription>
            </div>
            <Link href="/dashboard/dpdpa/activities">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {activityCards.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
              <p className="text-gray-600 mb-6">
                Create processing activities to start tracking consent
              </p>
              <Link href="/dashboard/dpdpa/activities">
                <Button>Create Activity</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activityCards.map((activity) => (
                <div
                  key={activity.id}
                  className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                    activity.status === 'high'
                      ? 'border-green-200 bg-green-50/30'
                      : activity.status === 'medium'
                      ? 'border-yellow-200 bg-yellow-50/30'
                      : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{activity.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-2">{activity.purpose}</p>
                    </div>
                    {getTrendIcon(activity.trend)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Acceptance Rate</span>
                      <Badge className={`${getStatusColor(activity.status)} border`}>
                        {activity.acceptanceRate.toFixed(1)}%
                      </Badge>
                    </div>

                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full rounded-full ${
                          activity.status === 'high'
                            ? 'bg-green-500'
                            : activity.status === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${activity.acceptanceRate}%` }}
                      />
                    </div>

                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>{activity.totalResponses} responses</span>
                      {activity.status === 'low' && (
                        <span className="text-red-600 font-medium">Needs attention</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consent vs Revocation Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Consent Breakdown</CardTitle>
            <CardDescription>Distribution of consent decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">Accepted</p>
                    <p className="text-sm text-green-700">Full consent granted</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-900">{stats?.acceptedCount || 0}</p>
                  <p className="text-xs text-green-700">
                    {stats?.totalConsents 
                      ? ((stats.acceptedCount / stats.totalConsents) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Partial</p>
                    <p className="text-sm text-amber-700">Some activities accepted</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-900">{stats?.partialCount || 0}</p>
                  <p className="text-xs text-amber-700">
                    {stats?.totalConsents
                      ? ((stats.partialCount / stats.totalConsents) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Rejected</p>
                    <p className="text-sm text-red-700">Consent denied</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-900">{stats?.rejectedCount || 0}</p>
                  <p className="text-xs text-red-700">
                    {stats?.totalConsents
                      ? ((stats.rejectedCount / stats.totalConsents) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="font-semibold text-orange-900">Revoked</p>
                    <p className="text-sm text-orange-700">Consent withdrawn</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-900">{stats?.revokedCount || 0}</p>
                  <p className="text-xs text-orange-700">
                    {stats?.totalConsents
                      ? ((stats.revokedCount / stats.totalConsents) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Consent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Consent Activity</CardTitle>
                <CardDescription>Latest consent decisions with details</CardDescription>
              </div>
              <Link href="/dashboard/dpdpa/records">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentConsents.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent consent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConsents.map((consent) => (
                  <div
                    key={consent.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getDeviceIcon(consent.deviceType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${getConsentStatusColor(consent.status)} border text-xs`}>
                            {getStatusIcon(consent.status)}
                            <span className="ml-1">{consent.status}</span>
                          </Badge>
                          {consent.country && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {consent.country}
                            </span>
                          )}
                        </div>
                        {consent.ipAddress && (
                          <p className="text-xs text-gray-500 font-mono">{consent.ipAddress}</p>
                        )}
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

      {/* Quick Actions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Activity className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Actions</h3>
              <div className="grid gap-3 md:grid-cols-3">
                <Link href="/dashboard/dpdpa/widget">
                  <Button variant="outline" className="w-full bg-white">
                    Configure Widget
                  </Button>
                </Link>
                <Link href="/dashboard/dpdpa/integration">
                  <Button variant="outline" className="w-full bg-white">
                    Get Embed Code
                  </Button>
                </Link>
                <Link href="/dashboard/dpdpa/analytics">
                  <Button variant="outline" className="w-full bg-white">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
