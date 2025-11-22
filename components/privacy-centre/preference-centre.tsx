'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  History,
} from 'lucide-react';
import { EmailLinkCard } from './email-link-card';

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
  const [preferences, setPreferences] = useState<Record<string, 'accepted' | 'rejected' | 'withdrawn'>>({});
  const [originalStatus, setOriginalStatus] = useState<Record<string, 'accepted' | 'rejected' | 'withdrawn'>>({});
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, [visitorId, widgetId]);

  const fetchPreferences = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/privacy-centre/preferences?visitorId=${visitorId}&widgetId=${widgetId}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch preferences');
      }

      const data = await response.json();
      setActivities(data.data.activities || []);
      setWidgetName(data.data.widgetName || '');
      setDomain(data.data.domain || '');

      // Initialize preferences state - keep original status for proper revocation handling
      const prefs: Record<string, 'accepted' | 'rejected' | 'withdrawn'> = {};
      const origStatus: Record<string, 'accepted' | 'rejected' | 'withdrawn'> = {};
      data.data.activities?.forEach((activity: Activity) => {
        // Store original status from database
        origStatus[activity.id] = activity.consentStatus;
        // For UI, treat 'withdrawn' as 'rejected' (toggle OFF state)
        prefs[activity.id] = activity.consentStatus === 'withdrawn' ? 'rejected' : activity.consentStatus;
      });
      setPreferences(prefs);
      setOriginalStatus(origStatus);

      // Log for debugging
      console.log('[Preference Centre] Loaded preferences:', {
        originalStatuses: origStatus,
        currentPreferences: prefs
      });

      if (showRefreshing) {
        toast.success('Preferences refreshed');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePreferenceChange = (activityId: string, isAccepted: boolean) => {
    setPreferences((prev) => {
      // Determine the correct status based on:
      // 1. If toggling ON -> 'accepted'
      // 2. If toggling OFF and was previously 'accepted' -> 'withdrawn' (revocation)
      // 3. If toggling OFF and was never accepted -> 'rejected'
      let newStatus: 'accepted' | 'rejected' | 'withdrawn';

      if (isAccepted) {
        newStatus = 'accepted';
      } else {
        // Toggling OFF - check if it was previously accepted
        const wasAccepted = originalStatus[activityId] === 'accepted' || prev[activityId] === 'accepted';
        newStatus = wasAccepted ? 'withdrawn' : 'rejected';
        console.log(`[Preference Centre] Activity ${activityId}: wasAccepted=${wasAccepted}, newStatus=${newStatus}`);
      }

      const updated = {
        ...prev,
        [activityId]: newStatus,
      };

      console.log(`[Preference Centre] Updated preferences for ${activityId}:`, {
        old: prev[activityId],
        new: newStatus,
        isAccepted,
        allPrefs: updated
      });

      return updated;
    });
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);

      const preferencesArray = Object.entries(preferences).map(([activityId, consentStatus]) => ({
        activityId,
        consentStatus,
      }));

      if (preferencesArray.length === 0) {
        toast.error('No preferences to save');
        return;
      }

      // Log preferences being saved for debugging
      console.log('[Preference Centre] Saving preferences:', preferencesArray);

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
            deviceType: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          },
        }),
      });

      const result = await response.json();

      console.log('[Preference Centre] Save response:', result);

      // Handle 207 Multi-Status (partial success) and other error cases
      if (response.status === 207) {
        // Partial success - some preferences saved, some failed
        if (result.successCount > 0) {
          const errorMessages = result.details?.map((d: any) =>
            `${d.activityId}: ${d.message || d.hint || 'Unknown error'}`
          ).join('; ') || 'Unknown error';
          toast.warning('Some preferences could not be saved', {
            description: `Saved ${result.successCount}, failed ${result.errorCount}. ${errorMessages}`,
            duration: 7000,
          });
          // Still refresh to show what was saved
          await fetchPreferences();
          return;
        } else {
          // All failed - show detailed error messages
          console.error('[Preference Centre] All preferences failed to save:', result.details);
          console.error('[Preference Centre] Full error response:', result);
          console.error('[Preference Centre] Full error details (stringified):', JSON.stringify(result.details, null, 2));

          const errorMessages = result.details?.map((d: any) => {
            const parts = [];
            if (d.activityId) parts.push(`Activity: ${d.activityId.substring(0, 8)}...`);
            if (d.message) parts.push(`Error: ${d.message}`);
            if (d.hint) parts.push(`Hint: ${d.hint}`);
            if (d.code) parts.push(`Code: ${d.code}`);
            if (d.details) parts.push(`Details: ${typeof d.details === 'string' ? d.details : JSON.stringify(d.details)}`);
            return parts.length > 0 ? parts.join(' | ') : 'Unknown error';
          }).join('\n') || 'Unknown error';

          console.error('[Preference Centre] Formatted error messages:', errorMessages);

          toast.error('Failed to save preferences', {
            description: errorMessages.length > 200 ? errorMessages.substring(0, 200) + '...' : errorMessages,
            duration: 10000,
          });

          // Also log to console for debugging
          console.error('[Preference Centre] Error summary:', {
            errorCount: result.errorCount,
            successCount: result.successCount,
            details: result.details,
            fullResponse: result
          });

          return;
        }
      }

      if (!response.ok) {
        const errorMessage = result.error || 'Failed to save preferences';
        const errorDetails = result.details || result.message || '';
        console.error('[Preference Centre] Save error:', result);
        throw new Error(errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage);
      }

      toast.success('Preferences saved successfully', {
        description: 'Your privacy choices have been applied immediately',
        duration: 3000,
      });

      // Update originalStatus to reflect the new saved state
      setOriginalStatus((prev) => {
        const updated = { ...prev };
        Object.entries(preferences).forEach(([activityId, status]) => {
          updated[activityId] = status;
        });
        console.log('[Preference Centre] Updated originalStatus after save:', updated);
        return updated;
      });

      await fetchPreferences(); // Refresh to get updated timestamps
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Helper: save a provided map of preferences directly (avoid state race)
  const savePreferencesDirect = async (prefMap: Record<string, 'accepted' | 'rejected' | 'withdrawn'>, action?: 'accept_all' | 'reject_all') => {
    try {
      setSaving(true);
      const preferencesArray = Object.entries(prefMap).map(([activityId, consentStatus]) => ({
        activityId,
        consentStatus,
      }));
      if (preferencesArray.length === 0) {
        toast.error('No preferences to save');
        return;
      }

      // Use bulk API for accept_all/reject_all actions (more efficient)
      const useBulkAPI = action === 'accept_all' || action === 'reject_all';

      console.log('[Preference Centre] Saving (direct) preferences:', preferencesArray, useBulkAPI ? `(bulk: ${action})` : '');

      const endpoint = useBulkAPI ? '/api/privacy-centre/preferences/bulk' : '/api/privacy-centre/preferences';
      const method = useBulkAPI ? 'POST' : 'PATCH';
      const body = useBulkAPI ? {
        visitorId,
        widgetId,
        action,
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          deviceType: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        },
      } : {
        visitorId,
        widgetId,
        preferences: preferencesArray,
        metadata: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          deviceType: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
        },
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 207) {
        throw new Error(result.error || 'Failed to save preferences');
      }
      if (response.status === 207) {
        toast.warning('Some preferences could not be saved', {
          description: `Saved ${result.successCount ?? 0}, failed ${result.errorCount ?? 0}.`,
        });
      } else {
        toast.success('Preferences saved successfully', {
          description: 'Your privacy choices have been applied immediately',
          duration: 3000,
        });
      }
      // Update UI state and refresh
      setPreferences(prefMap);
      await fetchPreferences(true);
    } catch (error) {
      console.error('Error saving (direct) preferences:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptAll = async () => {
    const allAccepted: Record<string, 'accepted' | 'rejected' | 'withdrawn'> = {};
    activities.forEach((activity) => {
      allAccepted[activity.id] = 'accepted';
    });
    await savePreferencesDirect(allAccepted, 'accept_all');
  };

  const handleRejectAll = async () => {
    const allRejected: Record<string, 'accepted' | 'rejected' | 'withdrawn'> = {};
    activities.forEach((activity) => {
      // If previously accepted, mark as withdrawn; otherwise rejected
      const wasAccepted = originalStatus[activity.id] === 'accepted' || preferences[activity.id] === 'accepted';
      allRejected[activity.id] = wasAccepted ? 'withdrawn' : 'rejected';
    });
    await savePreferencesDirect(allRejected, 'reject_all');
  };

  const handleDownloadHistory = async (format: 'csv' | 'pdf') => {
    try {
      setDownloading(true);
      const response = await fetch(
        `/api/privacy-centre/preferences/history?visitorId=${visitorId}&widgetId=${widgetId}&format=${format}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download history');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent-history-${visitorId}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.success(`History downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading history:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to download history');
    } finally {
      setDownloading(false);
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
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-3/4"></div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl animate-pulse shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto relative">
      {/* Modern Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-white to-blue-50/50 border border-blue-100 rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                Manage Your Consent Preferences
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Take control of your data with <span className="font-semibold text-blue-700">{widgetName || domain}</span>.
                Update your preferences anytime to match your privacy needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Visitor ID Card */}
      <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        <CardContent className="p-5 md:p-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center shadow-md flex-shrink-0">
              <Lock className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                Your Secure Visitor ID
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-4 leading-relaxed">
                This unique identifier lets you manage your preferences securely. Bookmark this page for easy access.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                <div className="flex-1 relative group">
                  <code className="block text-xs md:text-sm bg-white/80 backdrop-blur-sm px-3 md:px-4 py-3 rounded-xl border-2 border-blue-200 font-mono text-gray-900 break-all select-all shadow-sm hover:shadow-md transition-shadow">
                    {visitorId}
                  </code>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(visitorId);
                        toast.success('Visitor ID copied!');
                      } else {
                        // Fallback for older browsers
                        const textarea = document.createElement('textarea');
                        textarea.value = visitorId;
                        textarea.style.position = 'fixed';
                        textarea.style.opacity = '0';
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                        toast.success('Visitor ID copied!');
                      }
                    } catch (error) {
                      console.error('Failed to copy visitor ID:', error);
                      toast.error('Failed to copy. Please select and copy manually.');
                    }
                  }}
                  className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy ID
                </Button>
              </div>
              <details className="text-xs md:text-sm text-gray-600 group">
                <summary className="cursor-pointer font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1 w-fit">
                  <span>View direct link</span>
                  <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-2 p-3 bg-white/60 rounded-lg border border-blue-200">
                  <a
                    href={`${typeof window !== 'undefined' ? window.location.origin : ''}/privacy-centre/${widgetId}?visitorId=${visitorId}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline break-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {typeof window !== 'undefined' ? window.location.origin : ''}/privacy-centre/{widgetId}?visitorId={visitorId}
                  </a>
                </div>
              </details>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Linking Card - Only show after consent has been given */}
      {activities.some(activity => 
        activity.consentStatus === 'accepted' || activity.consentGivenAt !== null
      ) && (
        <EmailLinkCard
          visitorId={visitorId}
          widgetId={widgetId}
          onVerified={() => fetchPreferences(true)}
        />
      )}

      {/* Modern Action Bar */}
      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAcceptAll}
              size="sm"
              disabled={loading || activities.length === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept All
            </Button>
            <Button
              onClick={handleRejectAll}
              size="sm"
              variant="outline"
              disabled={loading || activities.length === 0}
              className="border-2 border-gray-300 hover:bg-gray-100 text-gray-700 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 mr-2" />
              Reject All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => fetchPreferences(true)}
              variant="outline"
              size="sm"
              disabled={refreshing || loading}
              className="border-gray-300 text-xs md:text-sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Button
              onClick={() => handleDownloadHistory('csv')}
              variant="outline"
              size="sm"
              disabled={downloading || loading}
              className="border-gray-300 text-xs md:text-sm hidden sm:inline-flex"
            >
              <History className={`h-4 w-4 mr-2 ${downloading ? 'animate-pulse' : ''}`} />
              {downloading ? 'Downloading...' : 'Export History'}
            </Button>
            <Button
              onClick={() => handleDownloadHistory('csv')}
              variant="outline"
              size="sm"
              disabled={downloading || loading}
              className="border-gray-300 text-xs sm:hidden"
            >
              <Download className={`h-4 w-4 ${downloading ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center mb-6">
              <Shield className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Activities Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">There are no processing activities configured for this service at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:gap-6">
          {activities.map((activity) => {
            const isExpanded = expandedActivities.has(activity.id);
            // Check if preference is 'accepted' - 'withdrawn' and 'rejected' both mean toggle is OFF
            const currentPreference = preferences[activity.id];
            const isAccepted = currentPreference === 'accepted';

            // Debug log to help troubleshoot
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Preference Centre] Activity ${activity.id} render:`, {
                currentPreference,
                isAccepted,
                originalStatus: originalStatus[activity.id]
              });
            }

            return (
              <Card
                key={activity.id}
                className={`border-0 shadow-lg transition-all duration-300 overflow-hidden hover:shadow-xl ${isAccepted
                    ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 ring-2 ring-green-200'
                    : 'bg-gradient-to-br from-white to-gray-50 hover:from-blue-50/30'
                  }`}
              >
                <CardHeader className="pb-4 md:pb-5">
                  <div className="flex items-start justify-between gap-3 md:gap-4">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <Switch
                            key={`switch-${activity.id}-${currentPreference}`}
                            checked={isAccepted}
                            disabled={saving}
                            onCheckedChange={(checked) => {
                              console.log(`[Preference Centre] Switch toggled for ${activity.id}:`, {
                                checked,
                                currentPreference,
                                willBecome: checked ? 'accepted' : (originalStatus[activity.id] === 'accepted' ? 'withdrawn' : 'rejected')
                              });
                              handlePreferenceChange(activity.id, checked);
                            }}
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600 disabled:opacity-50"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-2">
                            <CardTitle className="text-base md:text-xl font-bold text-gray-900 break-words">
                              {activity.name}
                            </CardTitle>
                            {isAccepted && (
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 flex-shrink-0">
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs bg-white/80 backdrop-blur-sm border-gray-300 flex-shrink-0">
                                {activity.industry}
                              </Badge>
                              {activity.consentGivenAt && (
                                <span className="text-xs text-gray-600 flex items-center gap-1 flex-shrink-0">
                                  <Clock className="h-3 w-3" />
                                  {new Date(activity.lastUpdated || activity.consentGivenAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Purpose Summary */}
                      {(activity.purposes || []).length > 0 && (
                        <div className="ml-12 md:ml-14 mt-4">
                          <p className="font-semibold text-gray-700 mb-2 text-xs md:text-sm flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Data Processing Purposes
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(activity.purposes || []).map((purpose) => (
                              <Badge
                                key={purpose.id}
                                variant="secondary"
                                className="text-xs bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 break-words hover:from-blue-200 hover:to-indigo-200 transition-colors"
                              >
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
                      disabled={loading}
                      className="flex-shrink-0 hover:bg-white/80 rounded-xl disabled:opacity-50"
                      title={isExpanded ? 'Hide details' : 'Show details'}
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {/* Expanded Details */}
                {isExpanded && (
                  <CardContent className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm pt-5 md:pt-6">
                    <div className="space-y-5 md:space-y-6 text-sm">
                      {/* Purposes Detail */}
                      {(activity.purposes || []).map((purpose) => (
                        <div key={purpose.id} className="relative bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-200/50 rounded-xl p-4 md:p-5 hover:shadow-md transition-shadow">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-xl"></div>
                          <h4 className="font-bold text-gray-900 mb-2 text-base">{purpose.purposeName}</h4>
                          {purpose.description && (
                            <p className="text-gray-700 mb-3 leading-relaxed">{purpose.description}</p>
                          )}
                          <div className="flex items-center gap-2 mb-3 bg-white/60 rounded-lg px-3 py-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-700 text-xs md:text-sm">
                              Legal Basis: <span className="font-semibold text-blue-700">{purpose.legalBasis}</span>
                            </span>
                          </div>
                          {(purpose.dataCategories || []).length > 0 && (
                            <div className="mt-3">
                              <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <Database className="h-4 w-4 text-indigo-600" />
                                Data Categories & Retention
                              </p>
                              <div className="space-y-2">
                                {(purpose.dataCategories || []).map((category, idx) => (
                                  <div key={idx} className="flex items-start gap-2 bg-white/60 rounded-lg p-2 text-xs md:text-sm">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                                    <span className="text-gray-700">
                                      <span className="font-medium">{category.name}</span>
                                      <span className="text-gray-500"> • {category.retentionPeriod}</span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Data Sources & Recipients */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {(activity.dataSources || []).length > 0 && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-4">
                            <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <Database className="h-4 w-4 text-purple-600" />
                              Data Sources
                            </p>
                            <div className="space-y-2">
                              {(activity.dataSources || []).map((source, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs md:text-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                                  <span className="text-gray-700">{source}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(activity.dataRecipients || []).length > 0 && (
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 rounded-xl p-4">
                            <p className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4 text-orange-600" />
                              Data Recipients
                            </p>
                            <div className="space-y-2">
                              {(activity.dataRecipients || []).map((recipient, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-xs md:text-sm">
                                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></div>
                                  <span className="text-gray-700">{recipient}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expiry Info */}
                      {activity.expiresAt && (
                        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 md:p-4">
                          <div className="flex h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center flex-shrink-0">
                            <Clock className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-amber-900">Consent Expiration</p>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(activity.expiresAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
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

      {/* Save Button - Sticky on mobile */}
      {activities.length > 0 && (
        <div className="sticky bottom-4 md:static">
          <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-4 md:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">Ready to save your preferences?</h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-0.5">Your choices will be applied immediately</p>
                </div>
              </div>
              <Button
                onClick={handleSavePreferences}
                disabled={saving || loading || activities.length === 0}
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all text-sm md:text-base h-12 md:h-14 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
