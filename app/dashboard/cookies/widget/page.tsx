'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { 
  Settings, 
  Code, 
  Copy, 
  Download,
  CheckCircle,
  AlertCircle
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
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<WidgetConfig>({
    widgetId: 'cnsty_' + Math.random().toString(36).substr(2, 9),
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
      const response = await fetch('/api/cookies/widget-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const updateConfig = (updates: Partial<WidgetConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cookies/widget-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to save');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save configuration');
    } finally {
      setLoading(false);
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getEmbedCode());
    alert('Embed code copied to clipboard!');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cookie Widget Settings</h1>
          <p className="mt-1 text-gray-600">
            Configure your cookie consent widget behavior and appearance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadConfig}>
            <Download className="mr-2 h-4 w-4" />
            Export Config
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {saved ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Settings'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            General Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Widget ID
              </label>
              <Input
                type="text"
                value={config.widgetId}
                readOnly
                className="font-mono text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Unique identifier for your widget
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Domain *
              </label>
              <Input
                type="text"
                value={config.domain}
                onChange={(e) => updateConfig({ domain: e.target.value })}
                placeholder="example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Domain where the widget will be used
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Consent Duration (days)
              </label>
              <Input
                type="number"
                value={config.consentDuration}
                onChange={(e) => updateConfig({ consentDuration: parseInt(e.target.value) })}
                min="1"
                max="365"
              />
              <p className="mt-1 text-xs text-gray-500">
                How long to remember user's consent choice
              </p>
            </div>
          </div>
        </Card>

        {/* Behavior Settings */}
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Behavior Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Consent Mode
              </label>
              {BEHAVIOR_OPTIONS.map((option) => (
                <div
                  key={option.id}
                  className="mb-3 flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <input
                    type="radio"
                    id={option.id}
                    name="behavior"
                    checked={config.behavior === option.id}
                    onChange={() => updateConfig({ behavior: option.id })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={option.id}
                      className="block cursor-pointer font-medium text-gray-900"
                    >
                      {option.name}
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="blockScripts"
                  checked={config.blockScripts}
                  onChange={(e) => updateConfig({ blockScripts: e.target.checked })}
                />
                <div className="flex-1">
                  <label
                    htmlFor="blockScripts"
                    className="block cursor-pointer font-medium text-gray-900"
                  >
                    Auto-block Scripts
                  </label>
                  <p className="text-xs text-gray-500">
                    Automatically block tracking scripts until consent
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="respectDNT"
                  checked={config.respectDNT}
                  onChange={(e) => updateConfig({ respectDNT: e.target.checked })}
                />
                <div className="flex-1">
                  <label
                    htmlFor="respectDNT"
                    className="block cursor-pointer font-medium text-gray-900"
                  >
                    Respect Do Not Track
                  </label>
                  <p className="text-xs text-gray-500">
                    Honor browser's DNT setting
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="gdprApplies"
                  checked={config.gdprApplies}
                  onChange={(e) => updateConfig({ gdprApplies: e.target.checked })}
                />
                <div className="flex-1">
                  <label
                    htmlFor="gdprApplies"
                    className="block cursor-pointer font-medium text-gray-900"
                  >
                    GDPR/DPDPA Compliance Mode
                  </label>
                  <p className="text-xs text-gray-500">
                    Enable strict compliance features
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="showBranding"
                  checked={config.showBrandingLink}
                  onChange={(e) => updateConfig({ showBrandingLink: e.target.checked })}
                />
                <div className="flex-1">
                  <label
                    htmlFor="showBranding"
                    className="block cursor-pointer font-medium text-gray-900"
                  >
                    Show Consently Branding
                  </label>
                  <p className="text-xs text-gray-500">
                    Display "Powered by Consently" link
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cookie Categories */}
      <Card className="p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">
          Cookie Categories
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COOKIE_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className={`rounded-lg border-2 p-4 ${
                config.categories.includes(category.id)
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`cat-${category.id}`}
                  checked={config.categories.includes(category.id)}
                  disabled={category.required}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateConfig({
                      categories: checked
                        ? [...config.categories, category.id]
                        : config.categories.filter((c) => c !== category.id)
                    });
                  }}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`cat-${category.id}`}
                    className="block cursor-pointer font-medium text-gray-900"
                  >
                    {category.name}
                    {category.required && (
                      <span className="ml-2 text-xs text-blue-600">(Required)</span>
                    )}
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Embed Code */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Code className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Installation Code
            </h2>
          </div>
          <Button variant="outline" onClick={handleCopyCode}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </Button>
        </div>

        <div className="rounded-lg bg-gray-900 p-4">
          <pre className="overflow-x-auto text-xs text-green-400">
            <code>{getEmbedCode()}</code>
          </pre>
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Installation Instructions</h3>
              <ol className="mt-2 space-y-1 text-sm text-blue-700">
                <li>1. Copy the code snippet above</li>
                <li>2. Paste it in the &lt;head&gt; section of your website</li>
                <li>3. The widget will automatically load and display</li>
                <li>4. Test it by visiting your website in an incognito window</li>
              </ol>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
