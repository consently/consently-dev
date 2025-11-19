'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityStats {
  activityId: string;
  activityName: string;
  industry: string;
  totalConsents: number;
  acceptedCount: number;
  rejectedCount: number;
  partialCount: number;
  acceptanceRate: number;
  rejectionRate: number;
  partialRate: number;
  isActive: boolean;
}

interface ActivityLevelAnalyticsProps {
  widgetId?: string;
  startDate?: string;
  endDate?: string;
  showTopOnly?: boolean;
  maxItems?: number;
}

export function ActivityLevelAnalytics({ 
  widgetId, 
  startDate, 
  endDate, 
  showTopOnly = false,
  maxItems = 10 
}: ActivityLevelAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [activityStats, setActivityStats] = useState<ActivityStats[]>([]);
  const [summary, setSummary] = useState<{
    totalActivities: number;
    totalConsents: number;
    avgAcceptanceRate: number;
    topActivities: ActivityStats[];
    bottomActivities: ActivityStats[];
  } | null>(null);

  useEffect(() => {
    fetchActivityAnalytics();
  }, [widgetId, startDate, endDate]);

  const fetchActivityAnalytics = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (widgetId) params.append('widgetId', widgetId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('sortBy', 'acceptanceRate');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/dpdpa/analytics/activity-level?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity analytics');
      }

      const result = await response.json();
      setActivityStats(result.data || []);
      setSummary(result.summary || null);
    } catch (error) {
      console.error('Error fetching activity analytics:', error);
      toast.error('Failed to load activity analytics');
    } finally {
      setLoading(false);
    }
  };

  const displayedActivities = showTopOnly && summary?.topActivities 
    ? summary.topActivities.slice(0, maxItems)
    : activityStats.filter(a => a.totalConsents > 0).slice(0, maxItems);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity-Level Analytics
          </CardTitle>
          <CardDescription>Consent rates by processing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity-Level Analytics
            </CardTitle>
            <CardDescription>Consent rates by processing activity</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchActivityAnalytics}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalActivities}</div>
              <div className="text-sm text-gray-600">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalConsents.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Consents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.avgAcceptanceRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg Acceptance Rate</div>
            </div>
          </div>
        )}

        {/* Activity List */}
        <div className="space-y-3">
          {displayedActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No consent data available for activities yet</p>
            </div>
          ) : (
            displayedActivities.map((activity) => (
              <div
                key={activity.activityId}
                className="p-4 border rounded-lg hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{activity.activityName}</h4>
                      {activity.isActive ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{activity.industry}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {activity.acceptanceRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Acceptance Rate</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 h-6 bg-gray-100 rounded-full overflow-hidden">
                    {activity.acceptedCount > 0 && (
                      <div
                        className="bg-green-500 h-full flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${activity.acceptanceRate}%` }}
                      >
                        {activity.acceptanceRate > 10 && `${activity.acceptanceRate.toFixed(0)}%`}
                      </div>
                    )}
                    {activity.partialCount > 0 && (
                      <div
                        className="bg-yellow-500 h-full flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${activity.partialRate}%` }}
                      >
                        {activity.partialRate > 10 && `${activity.partialRate.toFixed(0)}%`}
                      </div>
                    )}
                    {activity.rejectedCount > 0 && (
                      <div
                        className="bg-red-500 h-full flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${activity.rejectionRate}%` }}
                      >
                        {activity.rejectionRate > 10 && `${activity.rejectionRate.toFixed(0)}%`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-gray-900">{activity.totalConsents}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-700 flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {activity.acceptedCount}
                    </div>
                    <div className="text-green-600">Accepted</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-bold text-yellow-700">{activity.partialCount}</div>
                    <div className="text-yellow-600">Partial</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-bold text-red-700 flex items-center justify-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {activity.rejectedCount}
                    </div>
                    <div className="text-red-600">Rejected</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Top & Bottom Activities Summary */}
        {summary && !showTopOnly && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Top Performers</h4>
              </div>
              <div className="space-y-2">
                {summary.topActivities.slice(0, 3).map((activity, index) => (
                  <div key={activity.activityId} className="flex items-center justify-between text-sm">
                    <span className="text-green-800">
                      {index + 1}. {activity.activityName}
                    </span>
                    <span className="font-semibold text-green-700">
                      {activity.acceptanceRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Needs Improvement</h4>
              </div>
              <div className="space-y-2">
                {summary.bottomActivities.slice(0, 3).map((activity, index) => (
                  <div key={activity.activityId} className="flex items-center justify-between text-sm">
                    <span className="text-red-800">
                      {index + 1}. {activity.activityName}
                    </span>
                    <span className="font-semibold text-red-700">
                      {activity.acceptanceRate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

