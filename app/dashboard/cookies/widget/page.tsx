'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Code, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Save,
  Eye,
  Shield,
  Globe,
  Timer,
  Zap,
  Lock,
  Cookie
} from 'lucide-react';

const COOKIE_CATEGORIES = [
  {
    id: 'necessary',
    name: 'Necessary',
    description: 'Essential cookies required for website functionality',
    required: true
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Cookies that help us understand how visitors interact with the website',
    required: false
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Cookies used to deliver targeted advertising',
    required: false
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description: 'Cookies that remember your preferences and settings',
    required: false
  },
  {
    id: 'social',
    name: 'Social Media',
    description: 'Cookies from social media platforms for sharing content',
    required: false
  }
];

const BEHAVIOR_OPTIONS = [
  { id: 'explicit', name: 'Explicit Consent', description: 'Require user action before any tracking' },
  { id: 'optout', name: 'Opt-Out', description: 'Track by default, allow users to opt out (not GDPR recommended)' }
];

type WidgetConfig = {
  widgetId: string;
  domain: string;
  categories: string[];
  behavior: string;
  consentDuration: number;
  showBrandingLink: boolean;
  blockScripts: boolean;
  respectDNT: boolean;
  gdprApplies: boolean;
  autoBlock: string[];
};

export default function CookieWidgetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>({
    widgetId: '',
    domain: '',
    categories: ['necessary'],
    behavior: 'explicit',
    consentDuration: 365,
    showBrandingLink: true,
    blockScripts: true,
    respectDNT: false,
    gdprApplies: true,
    autoBlock: []
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/cookies/widget-config');
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else if (response.status === 404) {
        // No config exists yet, generate a new widget ID
        const newWidgetId = 'cnsty_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
        setConfig(prev => ({ ...prev, widgetId: newWidgetId }));
      } else {
        setError('Failed to load configuration');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setError('Network error while loading configuration');
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const validateConfig = () => {
    const errors: string[] = [];
    
    if (!config.domain?.trim()) {
      errors.push('Domain is required');
    }
    
    if (config.domain && !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(config.domain)) {
      errors.push('Please enter a valid domain (e.g., example.com)');
    }
    
    if (config.consentDuration < 1 || config.consentDuration > 365) {
      errors.push('Consent duration must be between 1 and 365 days');
    }
    
    if (config.categories.length === 0) {
      errors.push('At least one category must be selected');
    }
    
    return errors;
  };

  const handleSave = async () => {
    // Validate configuration
    const validationErrors = validateConfig();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/cookies/widget-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setSaved(true);
      setError(null);
      
      // Show success message for longer
      setTimeout(() => setSaved(false), 5000);
    } catch (error) {
      console.error('Error saving config:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save configuration';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getEmbedCode = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
    return `<!-- Consently Cookie Consent Widget -->
<script src="${origin}/widget.js" data-consently-id="${config.widgetId}" async></script>`;
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(getEmbedCode());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      setError('Failed to copy code to clipboard');
    }
  };

  const handleDownloadConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'consently-config.json';
    link.click();
  };

  if (loading && !config.widgetId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading widget configuration...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up your cookie consent widget</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cookie Widget Configuration</h1>
        <p className="text-gray-600 mt-2">Configure your cookie consent widget for GDPR & DPDPA compliance</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">Configuration Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {saved && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900">Configuration Saved!</h3>
              <p className="mt-1 text-sm text-green-700">Your widget settings have been updated successfully.</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleSave} 
          disabled={saving || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="mr-2 h-4 w-4" />
          {previewMode ? 'Hide' : 'Show'} Preview
        </Button>
      </div>

      {/* Live Preview */}
      {previewMode && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>See how your cookie banner will appear to visitors</CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Preview Mode</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
              {/* Mock Browser Window */}
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                {/* Browser Chrome */}
                <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 border-b">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
                    https://{config.domain || 'your-website.com'}
                  </div>
                </div>
                
                {/* Website Content (Mock) */}
                <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Your Website Content</p>
                  </div>
                </div>
                
                {/* Cookie Banner Preview */}
                <div className="relative">
                  <div className="bg-white border-t-2 border-gray-200 p-6 shadow-lg">
                    <div className="max-w-4xl mx-auto">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            🍪 We value your privacy
                          </h3>
                          <p className="text-sm text-gray-700">
                            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                            By clicking "Accept All", you consent to our use of cookies.
                          </p>
                          {config.categories.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {config.categories.map((cat) => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Accept All
                          </button>
                          <button className="px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                            Reject All
                          </button>
                          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                            Cookie Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Preview Information</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p>• <strong>Domain:</strong> {config.domain || 'Not set'}</p>
                      <p>• <strong>Behavior:</strong> {config.behavior === 'explicit' ? 'Explicit Consent' : 'Opt-Out'}</p>
                      <p>• <strong>Consent Duration:</strong> {config.consentDuration} days</p>
                      <p>• <strong>Categories:</strong> {config.categories.join(', ')}</p>
                      <p className="mt-2 text-xs">💡 This is a visual preview. The actual widget will use your banner template design from the Templates page.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>General Configuration</CardTitle>
              <CardDescription>Basic widget settings and identification</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget ID
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={config.widgetId}
                  readOnly
                  className="font-mono bg-gray-50 pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Shield className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for your widget (auto-generated)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={config.domain}
                  onChange={(e) => {
                    updateConfig({ domain: e.target.value.toLowerCase().trim() });
                    if (error && error.includes('Domain')) {
                      setError(null);
                    }
                  }}
                  placeholder="example.com"
                  className={config.domain && !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(config.domain) 
                    ? 'border-red-300' 
                    : config.domain 
                    ? 'border-green-300' 
                    : ''}
                />
                {config.domain && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(config.domain) ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Your website domain (without http/https)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  Consent Duration (days)
                </div>
              </label>
              <Input
                type="number"
                value={config.consentDuration}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  updateConfig({ consentDuration: isNaN(value) ? 365 : value });
                }}
                min="1"
                max="365"
                className={config.consentDuration < 1 || config.consentDuration > 365 
                  ? 'border-red-300' 
                  : 'border-green-300'}
              />
              <p className="mt-1 text-xs text-gray-500">
                How long to remember consent ({config.consentDuration} days)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-800">
                  {config.categories.length}
                </Badge>
                <div>
                  <p className="text-sm font-medium text-gray-900">Cookie Categories</p>
                  <p className="text-xs text-gray-500">Categories selected</p>
                </div>
              </div>
              <Cookie className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consent Behavior - Modern Design */}
      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Consent Behavior</CardTitle>
                <CardDescription>Choose how your visitors provide consent</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Consent Mode Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Consent Mode</h3>
              <Badge variant="outline" className="text-xs">
                {config.behavior === 'explicit' ? 'GDPR Recommended' : 'Not Recommended'}
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {BEHAVIOR_OPTIONS.map((option) => {
                const isSelected = config.behavior === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => updateConfig({ behavior: option.id })}
                    className={`group relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-2 shadow-lg">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2 text-base">
                          {option.name}
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Privacy & Compliance Settings */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Privacy & Compliance Settings
              </h3>
              <Badge variant="outline" className="text-xs">
                {[config.blockScripts, config.gdprApplies].filter(Boolean).length} of 2 recommended enabled
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
              {[
                {
                  id: 'blockScripts',
                  checked: config.blockScripts,
                  icon: Shield,
                  title: 'Auto-block Scripts',
                  description: 'Block tracking scripts until consent is given',
                  color: 'blue',
                  bgColor: 'bg-blue-500',
                  borderColor: 'border-blue-500',
                  lightBg: 'bg-blue-50',
                  recommended: true
                },
                {
                  id: 'gdprApplies',
                  checked: config.gdprApplies,
                  icon: Lock,
                  title: 'GDPR/DPDPA Compliance',
                  description: 'Strict compliance with privacy regulations',
                  color: 'green',
                  bgColor: 'bg-green-500',
                  borderColor: 'border-green-500',
                  lightBg: 'bg-green-50',
                  recommended: true
                },
                {
                  id: 'respectDNT',
                  checked: config.respectDNT,
                  icon: Eye,
                  title: 'Do Not Track',
                  description: 'Honor browser DNT header preferences',
                  color: 'purple',
                  bgColor: 'bg-purple-500',
                  borderColor: 'border-purple-500',
                  lightBg: 'bg-purple-50',
                  recommended: false
                },
                {
                  id: 'showBrandingLink',
                  checked: config.showBrandingLink,
                  icon: Info,
                  title: 'Show Attribution',
                  description: 'Display "Powered by Consently" link',
                  color: 'gray',
                  bgColor: 'bg-gray-500',
                  borderColor: 'border-gray-400',
                  lightBg: 'bg-gray-50',
                  recommended: false
                }
              ].map((setting) => {
                const Icon = setting.icon;
                
                return (
                  <div
                    key={setting.id}
                    onClick={() => updateConfig({ [setting.id]: !setting.checked })}
                    className={`group relative rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                      setting.checked
                        ? `${setting.borderColor} ${setting.lightBg} shadow-md`
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {setting.recommended && setting.checked && (
                      <div className="absolute -top-3 -right-3">
                        <Badge className="bg-green-500 text-white text-xs px-2 py-1 shadow-lg">
                          <CheckCircle className="h-3 w-3 mr-1 inline" />
                          Recommended
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      {/* Icon Circle */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        setting.checked ? setting.bgColor : 'bg-gray-200'
                      } transition-colors`}>
                        <Icon className={`h-5 w-5 ${
                          setting.checked ? 'text-white' : 'text-gray-500'
                        }`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <label
                            htmlFor={setting.id}
                            className="text-base font-semibold text-gray-900 cursor-pointer leading-tight"
                          >
                            {setting.title}
                          </label>
                          <Checkbox
                            id={setting.id}
                            checked={setting.checked}
                            onChange={(e) => updateConfig({ [setting.id]: e.target.checked })}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          />
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Categories - Modern Design */}
      <Card className="border-2">
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
                <Cookie className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Cookie Categories</CardTitle>
                <CardDescription>Define which types of cookies your website uses</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1">
                {config.categories.length} Selected
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COOKIE_CATEGORIES.map((category) => {
              const isSelected = config.categories.includes(category.id);
              const isRequired = category.required;
              
              const categoryColors = {
                necessary: { bg: 'from-blue-500 to-blue-600', border: 'border-blue-500', light: 'bg-blue-50' },
                analytics: { bg: 'from-green-500 to-green-600', border: 'border-green-500', light: 'bg-green-50' },
                marketing: { bg: 'from-purple-500 to-purple-600', border: 'border-purple-500', light: 'bg-purple-50' },
                preferences: { bg: 'from-amber-500 to-amber-600', border: 'border-amber-500', light: 'bg-amber-50' },
                social: { bg: 'from-pink-500 to-pink-600', border: 'border-pink-500', light: 'bg-pink-50' }
              }[category.id] || { bg: 'from-gray-500 to-gray-600', border: 'border-gray-500', light: 'bg-gray-50' };
              
              return (
                <div
                  key={category.id}
                  className={`group relative rounded-xl border-2 p-5 transition-all duration-200 ${
                    isSelected
                      ? `${categoryColors.border} ${categoryColors.light} shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  } ${isRequired ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => {
                    if (!isRequired) {
                      const checked = !isSelected;
                      updateConfig({
                        categories: checked
                          ? [...config.categories, category.id]
                          : config.categories.filter((c) => c !== category.id)
                      });
                    }
                  }}
                >
                  {isRequired && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs shadow-lg">
                        <Lock className="h-3 w-3 mr-1 inline" />
                        Required
                      </Badge>
                    </div>
                  )}
                  
                  {isSelected && !isRequired && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={isSelected}
                        disabled={isRequired}
                        onChange={(e) => {
                          if (!isRequired) {
                            const checked = e.target.checked;
                            updateConfig({
                              categories: checked
                                ? [...config.categories, category.id]
                                : config.categories.filter((c) => c !== category.id)
                            });
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor={`cat-${category.id}`}
                        className="block text-base font-bold text-gray-900 mb-2 cursor-pointer"
                      >
                        {category.name}
                      </label>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Info Banner */}
          <div className="mt-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900 mb-2">Category Selection Guide</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span><strong>Necessary</strong> cookies are always required for basic website functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Select only the categories that your website actually uses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Users will be able to opt-in/out of non-necessary categories</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Code */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Code className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Installation Code</CardTitle>
                <CardDescription>Copy and paste this code into your website</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleCopyCode}
              className={copySuccess ? 'border-green-500 text-green-600 bg-green-50' : ''}
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="rounded-lg bg-gray-900 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-gray-400 font-mono">widget-embed.html</span>
                </div>
                <Badge className="bg-green-800 text-green-200">
                  Ready to Deploy
                </Badge>
              </div>
              <pre className="overflow-x-auto text-sm text-green-400 font-mono leading-relaxed">
                <code>{getEmbedCode()}</code>
              </pre>
            </div>
          </div>


          <div className="mt-6 grid md:grid-cols-2 gap-6">
            {/* Manual Installation Steps */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-3">Manual Installation</h3>
                  <p className="text-xs text-blue-800 mb-3">For custom websites with code access:</p>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <span className="text-sm text-blue-900">Copy the code snippet above</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <span className="text-sm text-blue-900">Paste in your website's <code className="bg-white px-2 py-0.5 rounded text-xs font-mono">&lt;head&gt;</code> section</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <span className="text-sm text-blue-900">Widget loads automatically on page visit</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <span className="text-sm text-blue-900">Test in incognito mode</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
            
            {/* Features */}
            <div className="rounded-lg bg-green-50 border border-green-200 p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-3">Features Included</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-900">Automatic script blocking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-900">GDPR & DPDPA compliance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-900">Responsive design</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-900">Real-time tracking</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Configuration Summary */}
          <div className="mt-6 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 p-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Current Configuration
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Domain</p>
                <p className="font-mono text-sm font-medium text-gray-900">{config.domain || 'Not set'}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Behavior</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{config.behavior}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-sm font-medium text-gray-900">{config.consentDuration} days</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Categories</p>
                <p className="text-sm font-medium text-gray-900">{config.categories.length} selected</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No-code Installation Guides */}
      <PlatformInstallCard embedCode={getEmbedCode()} />
    </div>
  );
}

type Platform = 'shopify' | 'wordpress' | 'wix' | 'magento' | 'squarespace' | 'webflow';

function PlatformInstallCard({ embedCode }: { embedCode: string }) {
  const [selected, setSelected] = useState<Platform | null>('shopify');

  const platforms: { id: Platform; name: string; badge?: string }[] = [
    { id: 'shopify', name: 'Shopify' },
    { id: 'wordpress', name: 'WordPress' },
    { id: 'wix', name: 'Wix' },
    { id: 'magento', name: 'Magento' },
    { id: 'squarespace', name: 'Squarespace' },
    { id: 'webflow', name: 'Webflow' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Code className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle>No-code Installation</CardTitle>
              <CardDescription>Select your platform to view step-by-step guide</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {platforms.map(p => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`px-3 py-2 rounded border text-sm ${selected === p.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="rounded-lg border bg-gray-50 p-4">
          {selected && (
            <InstallSteps platform={selected} embedCode={embedCode} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
      <pre>{code}</pre>
    </div>
  );
}

function InstallSteps({ platform, embedCode }: { platform: Platform; embedCode: string }) {
  switch (platform) {
    case 'shopify':
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Shopify</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
            <li>Open Shopify admin → Online Store → Themes → Edit code.</li>
            <li>Open layout/theme.liquid.</li>
            <li>Paste the snippet right before the closing <code className="px-1 rounded bg-white">&lt;/head&gt;</code> tag.</li>
            <li>Save and publish.</li>
          </ol>
          <CodeBlock code={embedCode} />
        </div>
      );
    case 'wordpress':
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">WordPress</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
            <li>Install and activate "Insert Headers and Footers" (or similar) plugin.</li>
            <li>Go to Settings → Insert Headers and Footers.</li>
            <li>Paste the snippet into the Header section.</li>
            <li>Save and clear caches if any.</li>
          </ol>
          <CodeBlock code={embedCode} />
        </div>
      );
    case 'wix':
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Wix</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
            <li>Wix Dashboard → Settings → Custom code.</li>
            <li>Add Custom Code → Paste snippet.</li>
            <li>Place code in Head → Apply to All pages → Load once.</li>
            <li>Publish your site.</li>
          </ol>
          <CodeBlock code={embedCode} />
        </div>
      );
    case 'magento':
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Magento</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
            <li>Admin → Content → Configuration → Edit your theme.</li>
            <li>HTML Head → Scripts and Style Sheets.</li>
            <li>Paste the snippet and Save Config.</li>
            <li>Flush Magento caches.</li>
          </ol>
          <CodeBlock code={embedCode} />
        </div>
      );
    case 'squarespace':
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Squarespace</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
            <li>Settings → Developer Tools → Code Injection.</li>
            <li>Paste the snippet into the Header field.</li>
            <li>Save and publish.</li>
          </ol>
          <CodeBlock code={embedCode} />
        </div>
      );
    case 'webflow':
      return (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Webflow</h4>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-800">
            <li>Project Settings → Custom Code.</li>
            <li>Paste the snippet in the Head Code area.</li>
            <li>Save, then Publish your site.</li>
          </ol>
          <CodeBlock code={embedCode} />
        </div>
      );
    default:
      return null;
  }
}
