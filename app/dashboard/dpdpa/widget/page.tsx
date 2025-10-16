'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Code, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Eye,
  Shield,
  Plus,
  ExternalLink,
  Globe,
  Palette
} from 'lucide-react';
import { toast } from 'sonner';

interface ProcessingActivity {
  id: string;
  activity_name: string;
  purpose: string;
  industry: string;
  data_attributes: string[];
  retention_period: string;
}

interface WidgetConfig {
  widgetId?: string;
  name: string;
  domain: string;
  position: string;
  layout: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
  };
  title: string;
  message: string;
  acceptButtonText: string;
  rejectButtonText: string;
  customizeButtonText: string;
  selectedActivities: string[];
  autoShow: boolean;
  showAfterDelay: number;
  consentDuration: number;
  respectDNT: boolean;
  requireExplicitConsent: boolean;
  showDataSubjectsRights: boolean;
  showBranding: boolean;
  isActive: boolean;
  language: string;
}

export default function DPDPAWidgetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [config, setConfig] = useState<WidgetConfig>({
    name: 'My DPDPA Widget',
    domain: '',
    position: 'modal',
    layout: 'modal',
    theme: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderRadius: 12
    },
    title: 'Your Data Privacy Rights',
    message: 'We process your personal data with your consent. Please review the activities below and choose your preferences.',
    acceptButtonText: 'Accept All',
    rejectButtonText: 'Reject All',
    customizeButtonText: 'Manage Preferences',
    selectedActivities: [],
    autoShow: true,
    showAfterDelay: 1000,
    consentDuration: 365,
    respectDNT: false,
    requireExplicitConsent: true,
    showDataSubjectsRights: true,
    showBranding: true,
    isActive: true,
    language: 'en'
  });
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch processing activities
      const activitiesRes = await fetch('/api/dpdpa/activities');
      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.data || []);
      }

      // Fetch existing widget config
      const configRes = await fetch('/api/dpdpa/widget-config');
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.data && configData.data.length > 0) {
          // Use the first config (in production, you might want to support multiple configs)
          const existingConfig = configData.data[0];
          setConfig({
            widgetId: existingConfig.widget_id,
            name: existingConfig.name,
            domain: existingConfig.domain,
            position: existingConfig.position,
            layout: existingConfig.layout,
            theme: existingConfig.theme,
            title: existingConfig.title,
            message: existingConfig.message,
            acceptButtonText: existingConfig.accept_button_text,
            rejectButtonText: existingConfig.reject_button_text,
            customizeButtonText: existingConfig.customize_button_text,
            selectedActivities: existingConfig.selected_activities || [],
            autoShow: existingConfig.auto_show,
            showAfterDelay: existingConfig.show_after_delay,
            consentDuration: existingConfig.consent_duration,
            respectDNT: existingConfig.respect_dnt,
            requireExplicitConsent: existingConfig.require_explicit_consent,
            showDataSubjectsRights: existingConfig.show_data_subjects_rights,
            showBranding: existingConfig.show_branding,
            isActive: existingConfig.is_active
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.domain) {
      toast.error('Please enter a domain');
      return;
    }

    if (config.selectedActivities.length === 0) {
      toast.error('Please select at least one processing activity');
      return;
    }

    setSaving(true);

    try {
      const method = config.widgetId ? 'PUT' : 'POST';
      const body = config.widgetId 
        ? { widgetId: config.widgetId, ...config }
        : config;

      const response = await fetch('/api/dpdpa/widget-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      if (data.widgetId && !config.widgetId) {
        setConfig(prev => ({ ...prev, widgetId: data.widgetId }));
      }

      toast.success('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleActivityToggle = (activityId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedActivities: prev.selectedActivities.includes(activityId)
        ? prev.selectedActivities.filter(id => id !== activityId)
        : [...prev.selectedActivities, activityId]
    }));
  };

  const getEmbedCode = () => {
    if (!config.widgetId) return '';
    const baseUrl = window.location.origin;
    return `<!-- Consently DPDPA Widget -->\n<script src="${baseUrl}/dpdpa-widget.js" data-dpdpa-widget-id="${config.widgetId}"></script>`;
  };

  const copyEmbedCode = () => {
    const code = getEmbedCode();
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    toast.success('Embed code copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DPDPA Consent Widget</h1>
          <p className="text-gray-600 mt-2">
            Configure your DPDPA 2023 compliant consent widget to collect granular user consent
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Settings
              </CardTitle>
              <CardDescription>Configure basic widget settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Widget Name
                </label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="My DPDPA Widget"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain <span className="text-red-500">*</span>
                </label>
                <Input
                  value={config.domain}
                  onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                  placeholder="example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The domain where this widget will be deployed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <Input
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="Your Data Privacy Rights"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <Textarea
                  value={config.message}
                  onChange={(e) => setConfig({ ...config, message: e.target.value })}
                  placeholder="We process your personal data..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    Widget Language
                  </div>
                </label>
                <Select
                  value={config.language}
                  onChange={(e) => setConfig({ ...config, language: e.target.value })}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'hi', label: 'हिन्दी (Hindi)' },
                    { value: 'bn', label: 'বাংলা (Bengali)' },
                    { value: 'ta', label: 'தமிழ் (Tamil)' },
                    { value: 'te', label: 'తెలుగు (Telugu)' },
                    { value: 'mr', label: 'मराठी (Marathi)' },
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Display language for consent widget text
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Processing Activities Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Select Processing Activities
              </CardTitle>
              <CardDescription>
                Choose which processing activities to display in the widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No processing activities found</p>
                  <Button variant="outline" asChild>
                    <a href="/dashboard/dpdpa/activities">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Activities
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        config.selectedActivities.includes(activity.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleActivityToggle(activity.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={config.selectedActivities.includes(activity.id)}
                          onChange={() => handleActivityToggle(activity.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {activity.activity_name}
                            </h4>
                            <Badge variant="secondary">{activity.industry}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{activity.purpose}</p>
                          <div className="flex flex-wrap gap-1">
                            {activity.data_attributes.slice(0, 3).map((attr, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 bg-gray-100 rounded"
                              >
                                {attr}
                              </span>
                            ))}
                            {activity.data_attributes.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                +{activity.data_attributes.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the widget appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <Input
                    type="color"
                    value={config.theme.primaryColor}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        theme: { ...config.theme, primaryColor: e.target.value }
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background
                  </label>
                  <Input
                    type="color"
                    value={config.theme.backgroundColor}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        theme: { ...config.theme, backgroundColor: e.target.value }
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <Input
                    type="color"
                    value={config.theme.textColor}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        theme: { ...config.theme, textColor: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accept Button Text
                  </label>
                  <Input
                    value={config.acceptButtonText}
                    onChange={(e) =>
                      setConfig({ ...config, acceptButtonText: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reject Button Text
                  </label>
                  <Input
                    value={config.rejectButtonText}
                    onChange={(e) =>
                      setConfig({ ...config, rejectButtonText: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Radius
                  </label>
                  <Input
                    type="number"
                    value={config.theme.borderRadius}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        theme: { ...config.theme, borderRadius: parseInt(e.target.value) || 12 }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Behavior Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Behavior Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto Show Widget</p>
                  <p className="text-sm text-gray-500">Show widget automatically on page load</p>
                </div>
                <Checkbox
                  checked={config.autoShow}
                  onChange={(e) =>
                    setConfig({ ...config, autoShow: e.target.checked })
                  }
                />
              </div>

              {config.autoShow && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Show After Delay (ms)
                  </label>
                  <Input
                    type="number"
                    value={config.showAfterDelay}
                    onChange={(e) =>
                      setConfig({ ...config, showAfterDelay: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consent Duration (days)
                </label>
                <Input
                  type="number"
                  value={config.consentDuration}
                  onChange={(e) =>
                    setConfig({ ...config, consentDuration: parseInt(e.target.value) || 365 })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Data Subject Rights</p>
                  <p className="text-sm text-gray-500">Display DPDPA rights information</p>
                </div>
                <Checkbox
                  checked={config.showDataSubjectsRights}
                  onChange={(e) =>
                    setConfig({ ...config, showDataSubjectsRights: e.target.checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Respect Do Not Track</p>
                  <p className="text-sm text-gray-500">Honor browser DNT settings</p>
                </div>
                <Checkbox
                  checked={config.respectDNT}
                  onChange={(e) =>
                    setConfig({ ...config, respectDNT: e.target.checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Integration Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Integration Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.widgetId ? (
                <>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                    <pre>{getEmbedCode()}</pre>
                  </div>
                  <Button onClick={copyEmbedCode} className="w-full" variant="outline">
                    {copySuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Add this code just before the closing &lt;/body&gt; tag on your website
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Save your configuration to get the embed code
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <Badge variant={config.isActive ? 'default' : 'secondary'}>
                  {config.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Activities</span>
                <Badge>{config.selectedActivities.length}</Badge>
              </div>
              {config.widgetId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Widget ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {config.widgetId.slice(0, 12)}...
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/docs/dpdpa-widget"
                target="_blank"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                Documentation
              </a>
              <a
                href="/dashboard/dpdpa/activities"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Settings className="h-4 w-4" />
                Manage Activities
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
