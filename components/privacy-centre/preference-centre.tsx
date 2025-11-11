'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Check,
  X,
  Info,
  Download,
  RefreshCw,
  Shield,
  Clock,
  Database,
  Users,
  Copy,
} from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  industry: string;
  purposes: Array<{
    id: string;
    purposeName: string;
    description: string;
    legalBasis: string;
    dataCategories: Array<{
      name: string;
      retentionPeriod: string;
    }>;
  }>;
  dataSources: string[];
  dataRecipients: string[];
  consentStatus: 'accepted' | 'rejected' | 'withdrawn';
  consentGivenAt: string | null;
  lastUpdated: string | null;
  expiresAt: string | null;
}

interface PreferenceCentreProps {
  visitorId: string;
  widgetId: string;
}

export function PreferenceCentre({ visitorId, widgetId }: PreferenceCentreProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [widgetName, setWidgetName] = useState('');
  const [domain, setDomain] = useState('');
  const [preferences, setPreferences] = useState<Record<string, 'accepted' | 'rejected'>>({});
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPreferences();
  }, [visitorId, widgetId]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/privacy-centre/preferences?visitorId=${visitorId}&widgetId=${widgetId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setActivities(data.data.activities || []);
      setWidgetName(data.data.widgetName || '');
      setDomain(data.data.domain || '');

      // Initialize preferences state
      const prefs: Record<string, 'accepted' | 'rejected'> = {};
      data.data.activities?.forEach((activity: Activity) => {
        prefs[activity.id] = activity.consentStatus === 'withdrawn' ? 'rejected' : activity.consentStatus;
      });
      setPreferences(prefs);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (activityId: string, newStatus: 'accepted' | 'rejected') => {
    setPreferences((prev) => ({
      ...prev,
      [activityId]: newStatus,
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);

      const preferencesArray = Object.entries(preferences).map(([activityId, consentStatus]) => ({
        activityId,
        consentStatus,
      }));

      const response = await fetch('/api/privacy-centre/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          widgetId,
          preferences: preferencesArray,
          metadata: {
            userAgent: navigator.userAgent,
            language: navigator.language,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Preferences saved successfully');
      await fetchPreferences(); // Refresh to get updated timestamps
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptAll = () => {
    const allAccepted: Record<string, 'accepted' | 'rejected'> = {};
    activities.forEach((activity) => {
      allAccepted[activity.id] = 'accepted';
    });
    setPreferences(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected: Record<string, 'accepted' | 'rejected'> = {};
    activities.forEach((activity) => {
      allRejected[activity.id] = 'rejected';
    });
    setPreferences(allRejected);
  };

  const handleDownloadHistory = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(
        `/api/privacy-centre/preferences/history?visitorId=${visitorId}&widgetId=${widgetId}&format=${format}`
      );

      if (!response.ok) {
        throw new Error('Failed to download history');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent-history-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`History downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading history:', error);
      toast.error('Failed to download history');
    }
  };

  const toggleActivityExpanded = (activityId: string) => {
    setExpandedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-3xl font-bold text-gray-900">Manage Your Consent Preferences</h2>
        <p className="text-gray-600 mt-2 text-base">
          Update your consent preferences for <span className="font-semibold">{widgetName || domain}</span>. You can change these at any time.
        </p>
      </div>

      {/* Visitor ID Display */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                Your Visitor ID
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Save this ID to access your preferences later. You can bookmark this page or use this ID to access the Preference Centre.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="flex-1 min-w-[200px] text-xs bg-white px-3 py-2.5 rounded-md border border-blue-200 font-mono text-gray-900 break-all select-all shadow-sm">
                  {visitorId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(visitorId);
                    toast.success('Visitor ID copied to clipboard!');
                  }}
                  className="flex-shrink-0 bg-white hover:bg-gray-50"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 break-words">
                <span className="font-medium">Direct link:</span>{' '}
                <a 
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/privacy-centre/${widgetId}?visitorId=${visitorId}`}
                  className="text-blue-600 hover:text-blue-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {typeof window !== 'undefined' ? window.location.origin : ''}/privacy-centre/{widgetId}?visitorId={visitorId}
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2.5 pb-2">
        <Button onClick={handleAcceptAll} variant="outline" size="sm" className="bg-white hover:bg-green-50 border-green-200 text-green-700">
          <Check className="h-4 w-4 mr-2" />
          Accept All
        </Button>
        <Button onClick={handleRejectAll} variant="outline" size="sm" className="bg-white hover:bg-red-50 border-red-200 text-red-700">
          <X className="h-4 w-4 mr-2" />
          Reject All
        </Button>
        <Button onClick={fetchPreferences} variant="outline" size="sm" className="bg-white">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={() => handleDownloadHistory('csv')} variant="outline" size="sm" className="bg-white">
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
        <Button onClick={() => handleDownloadHistory('pdf')} variant="outline" size="sm" className="bg-white">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
            <p className="text-gray-600">There are no processing activities configured for this service.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const isExpanded = expandedActivities.has(activity.id);
            const isAccepted = preferences[activity.id] === 'accepted';

            return (
              <Card
                key={activity.id}
                className={`border-2 transition-all ${
                  isAccepted
                    ? 'border-green-200 bg-green-50/30'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isAccepted}
                          onCheckedChange={(checked) =>
                            handlePreferenceChange(activity.id, checked ? 'accepted' : 'rejected')
                          }
                          className="mt-1.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-semibold text-gray-900 mb-2">{activity.name}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {activity.industry}
                            </Badge>
                            {activity.consentGivenAt && (
                              <span className="text-xs text-gray-500">
                                Last updated: {new Date(activity.lastUpdated || activity.consentGivenAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Purpose Summary */}
                      {(activity.purposes || []).length > 0 && (
                        <div className="ml-9 mt-3 text-sm">
                          <p className="font-medium text-gray-700 mb-2">Purposes:</p>
                          <div className="flex flex-wrap gap-2">
                            {(activity.purposes || []).map((purpose) => (
                              <Badge key={purpose.id} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {purpose.purposeName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActivityExpanded(activity.id)}
                      className="flex-shrink-0"
                      title={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Expanded Details */}
                {isExpanded && (
                  <CardContent className="border-t bg-gray-50 pt-4">
                    <div className="space-y-4 text-sm">
                      {/* Purposes Detail */}
                      {(activity.purposes || []).map((purpose) => (
                        <div key={purpose.id} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-gray-900 mb-1">{purpose.purposeName}</h4>
                          {purpose.description && (
                            <p className="text-gray-600 mb-2">{purpose.description}</p>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">
                              Legal Basis: <span className="font-medium">{purpose.legalBasis}</span>
                            </span>
                          </div>
                          {(purpose.dataCategories || []).length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Data Categories & Retention:
                              </p>
                              <ul className="list-disc list-inside text-gray-600 ml-6">
                                {(purpose.dataCategories || []).map((category, idx) => (
                                  <li key={idx}>
                                    {category.name} - <span className="text-gray-500">{category.retentionPeriod}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Data Sources & Recipients */}
                      <div className="grid md:grid-cols-2 gap-4 pt-3 border-t">
                        {(activity.dataSources || []).length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 mb-2">Data Sources:</p>
                            <ul className="list-disc list-inside text-gray-600">
                              {(activity.dataSources || []).map((source, idx) => (
                                <li key={idx}>{source}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {(activity.dataRecipients || []).length > 0 && (
                          <div>
                            <p className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Data Recipients:
                            </p>
                            <ul className="list-disc list-inside text-gray-600">
                              {(activity.dataRecipients || []).map((recipient, idx) => (
                                <li key={idx}>{recipient}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Expiry Info */}
                      {activity.expiresAt && (
                        <div className="flex items-center gap-2 text-gray-600 pt-3 border-t">
                          <Clock className="h-4 w-4" />
                          <span>
                            Consent expires on: {new Date(activity.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      {activities.length > 0 && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button onClick={handleSavePreferences} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
