'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Cookie,
  Lock,
  Settings,
  BarChart3,
  Megaphone,
  Users,
  Zap,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react';

interface CookieData {
  name: string;
  domain: string;
  host?: string;
  expiry: string;
  purpose?: string;
  provider?: string;
  isThirdParty?: boolean;
}

interface CookieCategory {
  [key: string]: CookieData[];
}

interface CookieDetailsProps {
  widgetId: string;
  domain: string;
}

const categoryInfo = {
  necessary: {
    icon: Lock,
    name: 'Necessary Cookies',
    description: 'Essential for the website to function properly',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    alwaysOn: true,
  },
  functional: {
    icon: Settings,
    name: 'Functional Cookies',
    description: 'Enable enhanced functionality and personalization',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    alwaysOn: false,
  },
  analytics: {
    icon: BarChart3,
    name: 'Analytics Cookies',
    description: 'Help us understand how visitors interact with our site',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    alwaysOn: false,
  },
  advertising: {
    icon: Megaphone,
    name: 'Marketing Cookies',
    description: 'Used to deliver personalized advertisements',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    alwaysOn: false,
  },
  social: {
    icon: Users,
    name: 'Social Media Cookies',
    description: 'Enable social media features and sharing',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    alwaysOn: false,
  },
  preferences: {
    icon: Zap,
    name: 'Preference Cookies',
    description: 'Remember your settings and preferences',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    alwaysOn: false,
  },
};

export function CookieDetails({ widgetId, domain }: CookieDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [cookieData, setCookieData] = useState<{
    domain: string;
    categories: CookieCategory;
    lastScanned: string | null;
    totalCookies: number;
  } | null>(null);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['necessary']));
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCookieData();
  }, [widgetId]);

  const fetchCookieData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cookies/domain-cookies?widgetId=${widgetId}`);
      const result = await response.json();

      if (result.success) {
        setCookieData(result.data);
        
        // Try to load saved preferences from backend first
        let savedPrefs: Record<string, boolean> = {};
        try {
          const prefResponse = await fetch(`/api/cookies/preferences?widgetId=${widgetId}`);
          if (prefResponse.ok) {
            const prefResult = await prefResponse.json();
            savedPrefs = prefResult.data.preferences || {};
          }
        } catch (error) {
          console.log('Could not load preferences from backend');
        }
        
        // If no backend preferences, try localStorage
        if (Object.keys(savedPrefs).length === 0) {
          const localPrefs = localStorage.getItem(`consently_cookie_preferences_${widgetId}`);
          if (localPrefs) {
            savedPrefs = JSON.parse(localPrefs);
          }
        }
        
        // Initialize preferences - use saved if available, otherwise enable all by default except advertising
        const initialPrefs: Record<string, boolean> = {};
        Object.keys(result.data.categories).forEach(category => {
          if (savedPrefs.hasOwnProperty(category)) {
            initialPrefs[category] = savedPrefs[category];
          } else {
            initialPrefs[category] = category !== 'advertising';
          }
        });
        setPreferences(initialPrefs);
      } else {
        throw new Error(result.error || 'Failed to load cookie data');
      }
    } catch (error) {
      console.error('Error fetching cookie data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load cookie data');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (category: string, enabled: boolean) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    setPreferences(prev => ({ ...prev, [category]: enabled }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      
      // Save to localStorage for widget to access
      localStorage.setItem(`consently_cookie_preferences_${widgetId}`, JSON.stringify(preferences));
      
      // Also save to backend if user is authenticated
      try {
        const response = await fetch(`/api/cookies/preferences?widgetId=${widgetId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            widgetId,
            preferences,
          }),
        });
        
        if (response.ok) {
          console.log('Cookie preferences synced to backend');
        } else {
          console.log('Could not sync to backend, saved locally only');
        }
      } catch (error) {
        console.log('Backend sync failed, preferences saved locally');
      }
      
      toast.success('Cookie preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptAll = () => {
    const allPrefs: Record<string, boolean> = {};
    Object.keys(cookieData?.categories || {}).forEach(category => {
      allPrefs[category] = true;
    });
    setPreferences(allPrefs);
  };

  const handleRejectAll = () => {
    const allPrefs: Record<string, boolean> = {};
    Object.keys(cookieData?.categories || {}).forEach(category => {
      allPrefs[category] = category === 'necessary'; // Keep necessary enabled
    });
    setPreferences(allPrefs);
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const filteredCategories = cookieData?.categories ? Object.entries(cookieData.categories).filter(([category, cookies]) => {
    if (cookies.length === 0) return false;
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const info = categoryInfo[category as keyof typeof categoryInfo];
    
    // Search in category name and description
    if (info.name.toLowerCase().includes(searchLower) || 
        info.description.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in cookie names and domains
    return cookies.some(cookie => 
      cookie.name.toLowerCase().includes(searchLower) ||
      (cookie.domain || cookie.host || '').toLowerCase().includes(searchLower) ||
      (cookie.purpose || '').toLowerCase().includes(searchLower)
    );
  }) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading cookie details...</span>
      </div>
    );
  }

  if (!cookieData) {
    return (
      <Card className="p-8 text-center">
        <Cookie className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cookie Data Available</h3>
        <p className="text-gray-600 mb-4">Unable to load cookie information at this time.</p>
        <Button onClick={fetchCookieData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookie Preferences
              </CardTitle>
              <CardDescription>
                {domain} • {cookieData.totalCookies} cookies found
                {cookieData.lastScanned && ` • Scanned ${new Date(cookieData.lastScanned).toLocaleDateString()}`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCookieData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            We use cookies to enhance your experience, analyze site traffic, and personalize content. 
            You can choose which categories of cookies you allow. Learn more in our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>.
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search cookies by name, domain, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Categories */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cookies Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No cookies match your search criteria.' : 'No cookies have been scanned for this website yet.'}
            </p>
          </Card>
        ) : (
          filteredCategories.map(([category, cookies]) => {
            const info = categoryInfo[category as keyof typeof categoryInfo];
            const Icon = info.icon;
            const isExpanded = expandedCategories.has(category);
            const isEnabled = preferences[category] ?? false;

            return (
              <Card key={category} className={`overflow-hidden ${info.borderColor} border`}>
                <div
                  className={`p-4 cursor-pointer transition-colors ${
                    isExpanded ? info.bgColor : 'bg-white'
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Icon className={`h-6 w-6 ${info.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{info.name}</h3>
                          {info.alwaysOn && (
                            <Badge variant="secondary" className="text-xs">
                              Always Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 font-medium">{cookies.length} cookies</span>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => {
                          handlePreferenceChange(category, checked);
                        }}
                        disabled={info.alwaysOn}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="space-y-2">
                      {cookies.map((cookie, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 text-sm">{cookie.name}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="text-gray-400">Host:</span> {cookie.domain || cookie.host}
                                {cookie.isThirdParty && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    Third-party
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 text-right">
                              <span className="text-gray-400">Expires:</span>
                              <br />
                              {cookie.expiry || 'Session'}
                            </div>
                          </div>
                          {cookie.purpose && (
                            <div className="text-xs text-gray-600 mt-2">
                              <span className="text-gray-400">Purpose:</span> {cookie.purpose}
                            </div>
                          )}
                          {cookie.provider && (
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="text-gray-400">Provider:</span> {cookie.provider}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleRejectAll}>
              <X className="h-4 w-4 mr-2" />
              Reject All
            </Button>
            <Button variant="outline" onClick={handleAcceptAll}>
              <Check className="h-4 w-4 mr-2" />
              Accept All
            </Button>
            <Button onClick={handleSavePreferences} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
