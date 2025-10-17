'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Palette,
  Sparkles,
  Info,
  Play,
  FileCode,
  Zap,
  RefreshCw,
  BarChart3
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
  customTranslations?: {
    [languageCode: string]: {
      title?: string;
      message?: string;
      acceptButtonText?: string;
      rejectButtonText?: string;
      [key: string]: any;
    };
  };
}

export default function DPDPAWidgetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    language: 'en',
    customTranslations: {}
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedLanguagesForTranslation, setSelectedLanguagesForTranslation] = useState<string[]>([]);

  const themePresets = [
    { name: 'Default Blue', primaryColor: '#3b82f6', backgroundColor: '#ffffff', textColor: '#1f2937' },
    { name: 'Professional Dark', primaryColor: '#6366f1', backgroundColor: '#1f2937', textColor: '#f9fafb' },
    { name: 'Modern Purple', primaryColor: '#8b5cf6', backgroundColor: '#faf5ff', textColor: '#581c87' },
    { name: 'Fresh Green', primaryColor: '#10b981', backgroundColor: '#ffffff', textColor: '#064e3b' },
    { name: 'Elegant Rose', primaryColor: '#f43f5e', backgroundColor: '#fff1f2', textColor: '#881337' },
  ];

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
            isActive: existingConfig.is_active,
            language: existingConfig.language || 'en',
            customTranslations: existingConfig.custom_translations || {}
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

  const applyThemePreset = (preset: typeof themePresets[0]) => {
    setConfig({
      ...config,
      theme: {
        ...config.theme,
        primaryColor: preset.primaryColor,
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor
      }
    });
    toast.success(`Applied ${preset.name} theme`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="relative animate-spin h-12 w-12 text-blue-600" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Loading your consent configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/50">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-30"></div>
        <div className="relative px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    DPDPA Consent Widget
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={config.isActive ? 'default' : 'secondary'} className="shadow-sm">
                      <span className={`w-2 h-2 rounded-full mr-1.5 ${config.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></span>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {config.widgetId && (
                      <Badge variant="outline" className="shadow-sm">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 max-w-2xl leading-relaxed">
                Configure your DPDPA 2023 compliant consent widget to collect granular user consent.
                Customize appearance, behavior, and processing activities to match your requirements.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {config.widgetId && (
                <>
                  <Link href={`/dashboard/dpdpa/widget-stats/${config.widgetId}`}>
                    <Button 
                      variant="outline"
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Stats
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPreview(!showPreview)}
                    className="shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {showPreview ? 'Hide' : 'Preview'}
                  </Button>
                </>
              )}
              <Button 
                onClick={handleSave} 
                disabled={saving}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
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
          </div>
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Settings */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
                Basic Settings
              </CardTitle>
              <CardDescription>Configure basic widget settings and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Widget Name
                </label>
                <Input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  placeholder="My DPDPA Widget"
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Internal name for identification
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Domain <span className="text-red-500">*</span>
                </label>
                <Input
                  value={config.domain}
                  onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                  placeholder="example.com"
                  className="transition-all focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  The domain where this widget will be deployed (without https://)
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Title
                </label>
                <Input
                  value={config.title}
                  onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  placeholder="Your Data Privacy Rights"
                  className="transition-all focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Users can select their language in the widget itself
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Message
                </label>
                <Textarea
                  value={config.message}
                  onChange={(e) => setConfig({ ...config, message: e.target.value })}
                  placeholder="We process your personal data with your consent. Please review the activities below..."
                  rows={4}
                  className="transition-all focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500">
                  {config.message.length} characters
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Processing Activities Selection */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Shield className="h-5 w-5 text-indigo-600" />
                    </div>
                    Select Processing Activities
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Choose which processing activities to display in the widget
                  </CardDescription>
                </div>
                {config.selectedActivities.length > 0 && (
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    {config.selectedActivities.length} selected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Shield className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Processing Activities</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Create processing activities to start collecting consent from your users
                  </p>
                  <Button variant="default" asChild className="shadow-lg">
                    <a href="/dashboard/dpdpa/activities">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Activity
                    </a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`group relative border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 ${
                        config.selectedActivities.includes(activity.id)
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-md scale-[1.02]'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm hover:scale-[1.01]'
                      }`}
                      onClick={() => handleActivityToggle(activity.id)}
                    >
                      {config.selectedActivities.includes(activity.id) && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="h-5 w-5 text-indigo-600" />
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5">
                          <Checkbox
                            checked={config.selectedActivities.includes(activity.id)}
                            onChange={() => handleActivityToggle(activity.id)}
                            className="h-5 w-5"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-base">
                              {activity.activity_name}
                            </h4>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {activity.industry}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">{activity.purpose}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {activity.data_attributes.slice(0, 4).map((attr, i) => (
                              <span
                                key={i}
                                className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-md font-medium text-gray-700"
                              >
                                {attr}
                              </span>
                            ))}
                            {activity.data_attributes.length > 4 && (
                              <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-md font-medium text-gray-700">
                                +{activity.data_attributes.length - 4} more
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
          <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Palette className="h-5 w-5 text-purple-600" />
                </div>
                Appearance & Theme
              </CardTitle>
              <CardDescription>Customize colors, text, and visual styling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Theme Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Quick Themes
                  </div>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyThemePreset(preset)}
                      className="group relative p-3 border-2 border-gray-200 rounded-xl hover:border-indigo-300 transition-all hover:shadow-md"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-6 h-6 rounded-full shadow-sm" 
                          style={{ backgroundColor: preset.primaryColor }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded border" 
                          style={{ backgroundColor: preset.backgroundColor }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: preset.textColor }}
                        ></div>
                      </div>
                      <p className="text-xs font-medium text-gray-700 text-left group-hover:text-indigo-600 transition-colors">
                        {preset.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              {/* Color Customization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Custom Colors
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 font-medium">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.theme.primaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, primaryColor: e.target.value }
                          })
                        }
                        className="h-12 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config.theme.primaryColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, primaryColor: e.target.value }
                          })
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 font-medium">Background</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.theme.backgroundColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, backgroundColor: e.target.value }
                          })
                        }
                        className="h-12 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config.theme.backgroundColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, backgroundColor: e.target.value }
                          })
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-gray-600 font-medium">Text Color</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={config.theme.textColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, textColor: e.target.value }
                          })
                        }
                        className="h-12 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={config.theme.textColor}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            theme: { ...config.theme, textColor: e.target.value }
                          })
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Button Text & Styling */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Accept Button Text</label>
                  <Input
                    value={config.acceptButtonText}
                    onChange={(e) =>
                      setConfig({ ...config, acceptButtonText: e.target.value })
                    }
                    className="transition-all focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Reject Button Text</label>
                  <Input
                    value={config.rejectButtonText}
                    onChange={(e) =>
                      setConfig({ ...config, rejectButtonText: e.target.value })
                    }
                    className="transition-all focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Border Radius: {config.theme.borderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={config.theme.borderRadius}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      theme: { ...config.theme, borderRadius: parseInt(e.target.value) }
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Sharp</span>
                  <span>Rounded</span>
                </div>
              </div>

              {/* Live Preview - Updated to match new widget design */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-3">LIVE PREVIEW</p>
                <div 
                  className="shadow-2xl max-w-md mx-auto overflow-hidden"
                  style={{
                    backgroundColor: config.theme.backgroundColor,
                    color: config.theme.textColor,
                    borderRadius: `${config.theme.borderRadius}px`
                  }}
                >
                  {/* Header */}
                  <div className="p-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: config.theme.primaryColor }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                          </svg>
                        </div>
                        <span className="font-bold text-sm">Consent Manager</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="text-xs px-2 py-1 border rounded-lg flex items-center gap-1" style={{ borderColor: '#e5e7eb' }}>
                          <Globe className="h-3 w-3" />
                          {config.language === 'hi' ? 'हिंदी' : config.language === 'ta' ? 'தமிழ்' : 'English'}
                        </button>
                      </div>
                    </div>
                    <div 
                      className="text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
                      style={{ backgroundColor: '#e0e7ff', color: '#1e3a8a' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#10b981' }}></span>
                      Fully compliant with DPDPA 2023
                    </div>
                  </div>

                  {/* Requirements Box */}
                  <div className="p-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="text-xs font-semibold text-blue-900 mb-2">
                        DPDPA 2023 requires you to read and download the privacy notice
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span>Scroll down to read the privacy notice</span>
                      </div>
                    </div>

                    {/* Privacy Notice Preview */}
                    <div className="border rounded-lg p-3 mb-3 bg-white" style={{ maxHeight: '120px', overflow: 'hidden', position: 'relative' }}>
                      <h4 className="text-xs font-bold mb-1">Privacy Notice</h4>
                      <p className="text-xs opacity-70 mb-2">We process your personal data in compliance with DPDPA 2023...</p>
                      <div className="text-xs opacity-50">1. Data Collection</div>
                      <div className="text-xs opacity-50">2. Processing Purposes</div>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-3">
                      <button
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: config.theme.primaryColor }}
                      >
                        Download Privacy Notice
                      </button>
                      <button
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        Proceed to Consent
                      </button>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                      <p className="text-xs text-red-600">⚠ Please complete both requirements to proceed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Behavior Settings */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                Behavior Settings
              </CardTitle>
              <CardDescription>Configure how the widget behaves and appears to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-3">
                  <Play className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">Auto Show Widget</p>
                    <p className="text-sm text-gray-600">Automatically display widget when users visit</p>
                  </div>
                </div>
                <Checkbox
                  checked={config.autoShow}
                  onChange={(e) =>
                    setConfig({ ...config, autoShow: e.target.checked })
                  }
                  className="h-5 w-5"
                />
              </div>

              {config.autoShow && (
                <div className="space-y-2 pl-4 border-l-2 border-green-300">
                  <label className="block text-sm font-medium text-gray-700">
                    Show After Delay: {config.showAfterDelay}ms
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={config.showAfterDelay}
                    onChange={(e) =>
                      setConfig({ ...config, showAfterDelay: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Instant</span>
                    <span>5 seconds</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Consent Duration: {config.consentDuration} days
                </label>
                <input
                  type="range"
                  min="30"
                  max="730"
                  step="30"
                  value={config.consentDuration}
                  onChange={(e) =>
                    setConfig({ ...config, consentDuration: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 month</span>
                  <span>2 years</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Show Data Subject Rights</p>
                      <p className="text-sm text-gray-600">Display DPDPA 2023 rights information</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={config.showDataSubjectsRights}
                    onChange={(e) =>
                      setConfig({ ...config, showDataSubjectsRights: e.target.checked })
                    }
                    className="h-5 w-5"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Respect Do Not Track</p>
                      <p className="text-sm text-gray-600">Honor browser DNT settings</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={config.respectDNT}
                    onChange={(e) =>
                      setConfig({ ...config, respectDNT: e.target.checked })
                    }
                    className="h-5 w-5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optional Custom Translations */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader className="border-b border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <span>Custom Translations</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">Optional</Badge>
                  </CardTitle>
                  <CardDescription className="text-purple-900/70 mt-2">
                    Add your own translated content - completely flexible and optional
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-white border border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Info className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Your Choice, Your Format</h4>
                    <p className="text-sm text-gray-600">
                      Add translations for any language you need. Use your own wording and style. 
                      Leave fields empty to use our defaults. No limitations!
                    </p>
                  </div>
                </div>
              </div>

              {selectedLanguagesForTranslation.length === 0 ? (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-purple-100 rounded-full">
                      <Globe className="h-10 w-10 text-purple-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Languages Added Yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Click below to add custom translations for Indian languages
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedLanguagesForTranslation.map((lang) => (
                    <div key={lang} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-gray-900 flex items-center gap-3">
                          <span className="text-2xl">
                            {lang === 'hi' ? '🇮🇳' : lang === 'pa' ? '🇮🇳' : lang === 'te' ? '🇮🇳' : '🇮🇳'}
                          </span>
                          <span>
                            {lang === 'hi' ? 'Hindi (हिंदी)' : 
                             lang === 'pa' ? 'Punjabi (ਪੰਜਾਬੀ)' :
                             lang === 'te' ? 'Telugu (తెలుగు)' :
                             'Tamil (தமிழ்)'}
                          </span>
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLanguagesForTranslation(selectedLanguagesForTranslation.filter(l => l !== lang));
                            const newTranslations = { ...config.customTranslations };
                            delete newTranslations[lang];
                            setConfig({ ...config, customTranslations: newTranslations });
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Custom Title</label>
                          <Input
                            value={config.customTranslations?.[lang]?.title || ''}
                            onChange={(e) => setConfig({
                              ...config,
                              customTranslations: {
                                ...config.customTranslations,
                                [lang]: {
                                  ...config.customTranslations?.[lang],
                                  title: e.target.value
                                }
                              }
                            })}
                            placeholder="Leave empty for default"
                            className="transition-all focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Custom Message</label>
                          <Textarea
                            value={config.customTranslations?.[lang]?.message || ''}
                            onChange={(e) => setConfig({
                              ...config,
                              customTranslations: {
                                ...config.customTranslations,
                                [lang]: {
                                  ...config.customTranslations?.[lang],
                                  message: e.target.value
                                }
                              }
                            })}
                            placeholder="Leave empty for default"
                            rows={3}
                            className="resize-none transition-all focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Accept Button</label>
                            <Input
                              value={config.customTranslations?.[lang]?.acceptButtonText || ''}
                              onChange={(e) => setConfig({
                                ...config,
                                customTranslations: {
                                  ...config.customTranslations,
                                  [lang]: {
                                    ...config.customTranslations?.[lang],
                                    acceptButtonText: e.target.value
                                  }
                                }
                              })}
                              placeholder="Default"
                              className="transition-all focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Reject Button</label>
                            <Input
                              value={config.customTranslations?.[lang]?.rejectButtonText || ''}
                              onChange={(e) => setConfig({
                                ...config,
                                customTranslations: {
                                  ...config.customTranslations,
                                  [lang]: {
                                    ...config.customTranslations?.[lang],
                                    rejectButtonText: e.target.value
                                  }
                                }
                              })}
                              placeholder="Default"
                              className="transition-all focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {['hi', 'pa', 'te', 'ta'].filter(lang => !selectedLanguagesForTranslation.includes(lang)).map((lang) => (
                  <Button
                    key={lang}
                    variant="outline"
                    onClick={() => setSelectedLanguagesForTranslation([...selectedLanguagesForTranslation, lang])}
                    className="flex-1 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add {lang === 'hi' ? 'Hindi' : lang === 'pa' ? 'Punjabi' : lang === 'te' ? 'Telugu' : 'Tamil'}
                  </Button>
                ))}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-900">
                  <strong>✨ Tip:</strong> Empty fields will use our default translations automatically. 
                  You have complete freedom to customize only what you need!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Integration Code */}
          <Card className="shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="border-b border-blue-200">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FileCode className="h-5 w-5 text-white" />
                </div>
                <span>Integration Code</span>
              </CardTitle>
              <CardDescription className="text-blue-900/70">
                Add this to your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {config.widgetId ? (
                <>
                  <div className="relative group">
                    <div className="bg-gray-900 text-gray-100 p-5 rounded-xl text-xs font-mono overflow-x-auto border border-gray-700 shadow-inner">
                      <pre className="leading-relaxed">{getEmbedCode()}</pre>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                        HTML
                      </Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={copyEmbedCode} 
                    className="w-full shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Embed Code
                      </>
                    )}
                  </Button>
                  <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900 flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Paste this code just before the closing <code className="bg-white px-1 rounded">&lt;/body&gt;</code> tag on your website to activate the widget.</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-gray-200 rounded-full">
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">No Widget ID Yet</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Save your configuration first to generate the embed code
                  </p>
                  <Button onClick={handleSave} variant="default" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    Save Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status & Info */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-gray-600" />
                Status & Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-semibold text-gray-900">Status</span>
                </div>
                <Badge variant={config.isActive ? 'default' : 'secondary'} className="shadow-sm">
                  {config.isActive ? '✓ Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-900">Activities</span>
                </div>
                <Badge className="bg-blue-600 shadow-sm">{config.selectedActivities.length}</Badge>
              </div>
              {config.widgetId && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Widget ID</span>
                    <Badge variant="outline" className="text-xs">UUID</Badge>
                  </div>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-purple-200 block overflow-x-auto">
                    {config.widgetId}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DPDPA Compliance Features */}
          <Card className="shadow-sm border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="border-b border-green-200">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span>DPDPA 2023 Features</span>
              </CardTitle>
              <CardDescription className="text-green-900/70">
                Built-in compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Privacy Notice Display</h4>
                    <p className="text-xs text-gray-600 mt-1">Users must scroll through and read the complete privacy notice before proceeding</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Mandatory Download</h4>
                    <p className="text-xs text-gray-600 mt-1">Privacy notice must be downloaded before consent can be provided</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Multi-Language Support</h4>
                    <p className="text-xs text-gray-600 mt-1">Users can select their preferred language (English, Hindi, Punjabi, Telugu, Tamil). You can optionally provide your own custom translations.</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-start gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Granular Consent</h4>
                    <p className="text-xs text-gray-600 mt-1">Individual accept/reject options for each processing activity</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-600 rounded-lg p-3 text-white">
                <p className="text-xs font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  All requirements automatically enforced
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-gray-600" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <a
                href="/docs/dpdpa-widget"
                target="_blank"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Documentation</span>
                </div>
                <Badge variant="secondary" className="text-xs">Guide</Badge>
              </a>
              <a
                href="/dashboard/dpdpa/activities"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Settings className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Manage Activities</span>
                </div>
                <Badge variant="secondary" className="text-xs">Settings</Badge>
              </a>
              <a
                href="/dashboard/dpdpa/records"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <FileCode className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Consent Records</span>
                </div>
                <Badge variant="secondary" className="text-xs">View</Badge>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
