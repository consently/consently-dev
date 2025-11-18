'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Cookie,
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
  Settings,
  FileSearch,
} from 'lucide-react';
import { toast } from 'sonner';

interface CookieStats {
  totalConsents: number;
  acceptedCount: number;
  rejectedCount: number;
  partialCount: number;
  revokedCount: number;
  acceptanceRate: number;
  uniqueVisitors: number;
  last7Days: {
    consents: number;
    change: number;
  };
}

interface RecentConsent {
  id: string;
  timestamp: string;
  status: 'accepted' | 'rejected' | 'partial' | 'revoked';
  deviceType: string;
  ipAddress?: string;
}

export default function CookieConsentOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CookieStats | null>(null);
  const [recentConsents, setRecentConsents] = useState<RecentConsent[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch consent records from existing API
      const recordsRes = await fetch('/api/consent/records?limit=100');

      let totalConsents = 0;
      let acceptedCount = 0;
      let rejectedCount = 0;
      let partialCount = 0;
      let revokedCount = 0;
      let uniqueVisitors = 0;
      let recentConsentsList: RecentConsent[] = [];

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json();
        const records = recordsData.data || [];

        totalConsents = records.length;
        acceptedCount = records.filter((r: any) => r.status === 'accepted').length;
        rejectedCount = records.filter((r: any) => r.status === 'rejected').length;
        partialCount = records.filter((r: any) => r.status === 'partial').length;
        revokedCount = records.filter((r: any) => r.status === 'revoked').length;
        uniqueVisitors = new Set(records.map((r: any) => r.tokenized_email)).size;

        recentConsentsList = records.slice(0, 5).map((r: any) => ({
          id: r.id,
          timestamp: r.created_at,
          status: r.status,
          deviceType: r.device_type || 'Desktop',
          ipAddress: r.ip_address,
        }));
      }

      const acceptanceRate = totalConsents > 0 ? (acceptedCount / totalConsents) * 100 : 0;

      setStats({
        totalConsents,
        acceptedCount,
        rejectedCount,
        partialCount,
        revokedCount,
        acceptanceRate,
        uniqueVisitors,
        last7Days: { consents: 0, change: 0 },
      });

      setRecentConsents(recentConsentsList);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
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
          <p className="mt-4 text-gray-600">Loading cookie consent overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Cookie Consent Overview</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Comprehensive overview of your cookie consent management
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <Button variant="outline" onClick={fetchDashboardData} size="sm" className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Link href="/dashboard/reports" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">View Reports</span>
              <span className="sm:hidden">Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>

      {/* Quick Actions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Cookie className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-900 mb-2 sm:mb-3 text-sm sm:text-base">Quick Actions</h3>
              <div className="grid gap-2 sm:gap-3 grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/cookies/scan" className="min-w-0">
                  <Button variant="outline" size="sm" className="w-full bg-white text-xs sm:text-sm">
                    <FileSearch className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Scan Cookies</span>
                    <span className="sm:hidden truncate">Scan</span>
                  </Button>
                </Link>
                <Link href="/dashboard/cookies/widget" className="min-w-0">
                  <Button variant="outline" size="sm" className="w-full bg-white text-xs sm:text-sm">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Widget Settings</span>
                    <span className="sm:hidden truncate">Widget</span>
                  </Button>
                </Link>
                <Link href="/dashboard/cookies/records" className="min-w-0">
                  <Button variant="outline" size="sm" className="w-full bg-white text-xs sm:text-sm">
                    <FileSearch className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">View Records</span>
                    <span className="sm:hidden truncate">Records</span>
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full bg-white text-xs sm:text-sm">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">Export Report</span>
                  <span className="sm:hidden truncate">Export</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent Breakdown and Recent Activity */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Consent Breakdown */}
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
                    <p className="text-sm text-amber-700">Some cookies accepted</p>
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
            </div>
          </CardContent>
        </Card>

        {/* Recent Consent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Consent Activity</CardTitle>
                <CardDescription>Latest consent decisions</CardDescription>
              </div>
              <Link href="/dashboard/cookies/records">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentConsents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No recent consent activity
              </div>
            ) : (
              <div className="space-y-3">
                {recentConsents.map((consent) => (
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
    </div>
  );
}
