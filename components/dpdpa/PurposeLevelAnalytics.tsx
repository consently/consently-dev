'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Target, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface PurposeStats {
  activityId: string;
  activityName: string;
  purposeId: string;
  purposeName: string;
  legalBasis: string;
  totalRecords: number;
  acceptedCount: number;
  rejectedCount: number;
  consentRate: number;
  rejectionRate: number;
  industry: string;
}

interface ActivityBreakdown {
  activityId: string;
  activityName: string;
  purposeCount: number;
  avgConsentRate: number;
  avgRejectionRate: number;
  purposes: {
    purposeId: string;
    purposeName: string;
    consentRate: number;
    rejectionRate: number;
    acceptedCount: number;
    rejectedCount: number;
    totalRecords: number;
  }[];
}

interface PurposeLevelAnalyticsProps {
  widgetId?: string;
  activityId?: string;
  startDate?: string;
  endDate?: string;
  showTopOnly?: boolean;
  maxItems?: number;
}

export function PurposeLevelAnalytics({
  widgetId,
  activityId,
  startDate,
  endDate,
  showTopOnly = false,
  maxItems = 10
}: PurposeLevelAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [purposeStats, setPurposeStats] = useState<PurposeStats[]>([]);
  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<{
    totalPurposes: number;
    totalRecords: number;
    totalAccepted: number;
    totalRejected: number;
    avgConsentRate: number;
    avgRejectionRate: number;
    topPurposes: PurposeStats[];
    bottomPurposes: PurposeStats[];
    mostRejectedPurposes: PurposeStats[];
  } | null>(null);

  useEffect(() => {
    fetchPurposeAnalytics();
  }, [widgetId, activityId, startDate, endDate]);

  const fetchPurposeAnalytics = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (widgetId) params.append('widgetId', widgetId);
      if (activityId) params.append('activityId', activityId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('sortBy', 'consentRate');

      const response = await fetch(`/api/dpdpa/analytics/purpose-level?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch purpose analytics');
      }

      const result = await response.json();
      setPurposeStats(result.data || []);
      setActivityBreakdown(result.activityBreakdown || []);
      setSummary(result.summary || null);
      
      // Expand first activity by default
      if (result.activityBreakdown?.length > 0) {
        setExpandedActivities(new Set([result.activityBreakdown[0].activityId]));
      }
    } catch (error) {
      console.error('Error fetching purpose analytics:', error);
      toast.error('Failed to load purpose analytics');
    } finally {
      setLoading(false);
    }
  };

  const toggleActivity = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const getLegalBasisColor = (legalBasis: string) => {
    switch (legalBasis) {
      case 'consent':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'contract':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'legal-obligation':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legitimate-interest':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Purpose-Level Analytics
          </CardTitle>
          <CardDescription>Consent rates by processing purpose</CardDescription>
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
              <Target className="h-5 w-5" />
              Purpose-Level Analytics
            </CardTitle>
            <CardDescription>Consent rates by processing purpose</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchPurposeAnalytics}
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalPurposes}</div>
              <div className="text-sm text-gray-600">Total Purposes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalRecords.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.totalAccepted.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.totalRejected.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Rejected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.avgConsentRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg Acceptance Rate</div>
            </div>
          </div>
        )}

        {/* Activity Breakdown with Purposes */}
        <div className="space-y-3">
          {activityBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No purpose-level data available yet</p>
              <p className="text-sm mt-2">Purpose-level tracking will appear here once visitors interact with your widget</p>
            </div>
          ) : (
            activityBreakdown.map((activity) => (
              <div key={activity.activityId} className="border rounded-lg overflow-hidden">
                {/* Activity Header */}
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleActivity(activity.activityId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {expandedActivities.has(activity.activityId) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{activity.activityName}</h4>
                        <p className="text-sm text-gray-600">{activity.purposeCount} purposes tracked</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {activity.avgConsentRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Accept Rate</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            {activity.avgRejectionRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Reject Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purpose List (Collapsible) */}
                {expandedActivities.has(activity.activityId) && (
                  <div className="p-4 space-y-3 bg-white">
                    {activity.purposes.map((purpose) => (
                      <div
                        key={purpose.purposeId}
                        className="p-3 border rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{purpose.purposeName}</h5>
                            <p className="text-xs text-gray-500 mt-1">
                              {purpose.totalRecords} records • {purpose.acceptedCount} accepted • {purpose.rejectedCount} rejected
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-600">
                                  {purpose.consentRate.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">Accept</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-red-600">
                                  {purpose.rejectionRate.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-500">Reject</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Dual Progress Bar */}
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 transition-all duration-300"
                            style={{ width: `${purpose.consentRate}%` }}
                            title={`Accepted: ${purpose.consentRate.toFixed(1)}%`}
                          />
                          <div
                            className="bg-red-500 transition-all duration-300"
                            style={{ width: `${purpose.rejectionRate}%` }}
                            title={`Rejected: ${purpose.rejectionRate.toFixed(1)}%`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Top & Bottom Purposes Summary */}
        {summary && !showTopOnly && summary.topPurposes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Top Purposes</h4>
              </div>
              <div className="space-y-2">
                {summary.topPurposes.slice(0, 3).map((purpose, index) => (
                  <div key={purpose.purposeId} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-green-800 font-medium">
                        {index + 1}. {purpose.purposeName}
                      </span>
                      <span className="font-semibold text-green-700">
                        {purpose.consentRate.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-green-600">{purpose.activityName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {purpose.acceptedCount} accepted, {purpose.rejectedCount} rejected
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-orange-900">Lowest Acceptance</h4>
              </div>
              <div className="space-y-2">
                {summary.bottomPurposes.slice(0, 3).map((purpose, index) => (
                  <div key={purpose.purposeId} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-orange-800 font-medium">
                        {index + 1}. {purpose.purposeName}
                      </span>
                      <span className="font-semibold text-orange-700">
                        {purpose.consentRate.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-orange-600">{purpose.activityName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {purpose.acceptedCount} accepted, {purpose.rejectedCount} rejected
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h4 className="font-semibold text-red-900">Most Rejected</h4>
              </div>
              <div className="space-y-2">
                {summary.mostRejectedPurposes && summary.mostRejectedPurposes.length > 0 ? (
                  summary.mostRejectedPurposes.slice(0, 3).map((purpose, index) => (
                    <div key={purpose.purposeId} className="text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-800 font-medium">
                          {index + 1}. {purpose.purposeName}
                        </span>
                        <span className="font-semibold text-red-700">
                          {purpose.rejectionRate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-red-600">{purpose.activityName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {purpose.acceptedCount} accepted, {purpose.rejectedCount} rejected
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No rejected purposes yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Legal Basis Legend */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-gray-700 mb-2">Legal Basis Types:</p>
          <div className="flex flex-wrap gap-2">
            <Badge className={getLegalBasisColor('consent')}>Consent</Badge>
            <Badge className={getLegalBasisColor('contract')}>Contract</Badge>
            <Badge className={getLegalBasisColor('legal-obligation')}>Legal Obligation</Badge>
            <Badge className={getLegalBasisColor('legitimate-interest')}>Legitimate Interest</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

