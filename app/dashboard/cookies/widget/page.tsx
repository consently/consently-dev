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
  { id: 'implicit', name: 'Implicit Consent', description: 'Track after X seconds without action' },
  { id: 'explicit', name: 'Explicit Consent', description: 'Require user action before tracking' },
  { id: 'optout', name: 'Opt-Out', description: 'Track by default, allow opt-out' }
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
    return `<!-- Consently Cookie Consent Widget -->
<script>
  window.consentlyConfig = {
    widgetId: "${config.widgetId}",
    domain: "${config.domain}",
    categories: ${JSON.stringify(config.categories)},
    behavior: "${config.behavior}",
    consentDuration: ${config.consentDuration},
    blockScripts: ${config.blockScripts},
    respectDNT: ${config.respectDNT}
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" async></script>`;
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
                      <p>• <strong>Behavior:</strong> {config.behavior === 'explicit' ? 'Explicit Consent' : config.behavior === 'implicit' ? 'Implicit Consent' : 'Opt-Out'}</p>
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

      {/* Consent Behavior */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Consent Behavior</CardTitle>
              <CardDescription>Configure how consent is collected from users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Consent Mode
            </label>
            <div className="space-y-3">
              {BEHAVIOR_OPTIONS.map((option) => {
                const isSelected = config.behavior === option.id;
                return (
                  <div
                    key={option.id}
                    onClick={() => updateConfig({ behavior: option.id })}
                    className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id={option.id}
                        name="behavior"
                        checked={isSelected}
                        onChange={() => updateConfig({ behavior: option.id })}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <label
                            htmlFor={option.id}
                            className="text-sm font-semibold text-gray-900 cursor-pointer"
                          >
                            {option.name}
                          </label>
                          {isSelected && (
                            <Badge className="bg-blue-600 text-white">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Compliance & Privacy Options
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <div
                onClick={() => updateConfig({ blockScripts: !config.blockScripts })}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  config.blockScripts
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="blockScripts"
                    checked={config.blockScripts}
                    onChange={(e) => updateConfig({ blockScripts: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <label
                        htmlFor="blockScripts"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Auto-block Scripts
                      </label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Block tracking scripts until consent is given
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => updateConfig({ respectDNT: !config.respectDNT })}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  config.respectDNT
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="respectDNT"
                    checked={config.respectDNT}
                    onChange={(e) => updateConfig({ respectDNT: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <label
                        htmlFor="respectDNT"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Respect Do Not Track
                      </label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Honor browser DNT header settings
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => updateConfig({ gdprApplies: !config.gdprApplies })}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  config.gdprApplies
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="gdprApplies"
                    checked={config.gdprApplies}
                    onChange={(e) => updateConfig({ gdprApplies: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Lock className="h-4 w-4 text-green-600" />
                      <label
                        htmlFor="gdprApplies"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        GDPR/DPDPA Compliance
                      </label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Strict compliance with GDPR & DPDPA
                    </p>
                  </div>
                </div>
              </div>

              <div
                onClick={() => updateConfig({ showBrandingLink: !config.showBrandingLink })}
                className={`rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  config.showBrandingLink
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="showBranding"
                    checked={config.showBrandingLink}
                    onChange={(e) => updateConfig({ showBrandingLink: e.target.checked })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-gray-600" />
                      <label
                        htmlFor="showBranding"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Show Branding
                      </label>
                    </div>
                    <p className="text-xs text-gray-600">
                      Display "Powered by Consently" link
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Cookie className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Cookie Categories</CardTitle>
                <CardDescription>Select the cookie types your website uses</CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {config.categories.length} Selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {COOKIE_CATEGORIES.map((category) => {
              const isSelected = config.categories.includes(category.id);
              const isRequired = category.required;
              
              return (
                <div
                  key={category.id}
                  className={`relative rounded-lg border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isRequired ? 'opacity-100' : 'cursor-pointer hover:shadow-md'}`}
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
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-blue-600 text-white text-xs">Required</Badge>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={isSelected}
                      disabled={isRequired}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateConfig({
                          categories: checked
                            ? [...config.categories, category.id]
                            : config.categories.filter((c) => c !== category.id)
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`cat-${category.id}`}
                        className="block text-sm font-semibold text-gray-900 mb-1 cursor-pointer"
                      >
                        {category.name}
                      </label>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {category.description}
                      </p>
                      {isSelected && !isRequired && (
                        <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">About Cookie Categories</h4>
                <p className="text-sm text-blue-800">
                  Select all cookie types that your website uses. "Necessary" cookies are always required and cannot be disabled as they are essential for basic website functionality.
                </p>
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
    </div>
  );
}
