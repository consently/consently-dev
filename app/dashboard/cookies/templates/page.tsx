'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { 
  Eye, 
  Save, 
  Copy, 
  CheckCircle,
  Layout,
  Maximize,
  Minimize
} from 'lucide-react';

const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimalist Banner',
    description: 'Simple bottom banner with essential information',
    preview: 'minimal'
  },
  {
    id: 'detailed',
    name: 'Detailed Banner',
    description: 'Comprehensive banner with all cookie categories',
    preview: 'detailed'
  },
  {
    id: 'floating',
    name: 'Floating Modal',
    description: 'Center modal with overlay background',
    preview: 'floating'
  },
  {
    id: 'sidebar',
    name: 'Side Panel',
    description: 'Slide-in panel from the right side',
    preview: 'sidebar'
  }
];

const POSITIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' }
];

type BannerConfig = {
  template: string;
  position: string;
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  title: string;
  message: string;
  acceptText: string;
  rejectText: string;
  settingsText: string;
};

export default function CookieTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('minimal');
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<BannerConfig>({
    template: 'minimal',
    position: 'bottom',
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    title: 'We value your privacy',
    message: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
    acceptText: 'Accept All',
    rejectText: 'Reject All',
    settingsText: 'Cookie Settings'
  });

  const updateConfig = (updates: Partial<BannerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/cookies/banner-config', {
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
    }
  };

  const handleCopyCode = () => {
    const embedCode = `<script src="${window.location.origin}/widget.js" data-consently-id="YOUR_ID"></script>`;
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cookie Banner Templates</h1>
          <p className="mt-1 text-gray-600">
            Choose and customize your cookie consent banner
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button onClick={handleSave}>
            {saved ? (
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Select Template
            </h2>
            <div className="space-y-3">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    updateConfig({ template: template.id });
                  }}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Layout className="mt-1 h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {template.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {template.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Customization Options */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Customize Banner
            </h2>

            <div className="space-y-6">
              {/* Position */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Position
                </label>
                <Select
                  value={config.position}
                  onChange={(e) => updateConfig({ position: e.target.value })}
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Colors */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <Input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Text Color
                  </label>
                  <Input
                    type="color"
                    value={config.textColor}
                    onChange={(e) => updateConfig({ textColor: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Background
                  </label>
                  <Input
                    type="color"
                    value={config.backgroundColor}
                    onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Text Content */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banner Title
                </label>
                <Input
                  type="text"
                  value={config.title}
                  onChange={(e) => updateConfig({ title: e.target.value })}
                  placeholder="We value your privacy"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banner Message
                </label>
                <Textarea
                  value={config.message}
                  onChange={(e) => updateConfig({ message: e.target.value })}
                  rows={3}
                  placeholder="Describe how you use cookies..."
                />
              </div>

              {/* Button Text */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Accept Button
                  </label>
                  <Input
                    type="text"
                    value={config.acceptText}
                    onChange={(e) => updateConfig({ acceptText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Reject Button
                  </label>
                  <Input
                    type="text"
                    value={config.rejectText}
                    onChange={(e) => updateConfig({ rejectText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Settings Button
                  </label>
                  <Input
                    type="text"
                    value={config.settingsText}
                    onChange={(e) => updateConfig({ settingsText: e.target.value })}
                  />
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Embed Code
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-consently-id="YOUR_ID"></script>`}
                    readOnly
                    className="flex-1 font-mono text-sm"
                  />
                  <Button variant="outline" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Add this code to your website's &lt;head&gt; section
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Live Preview</h2>
            <span className="text-sm text-gray-500">
              This is how your banner will appear to visitors
            </span>
          </div>

          <div className="relative min-h-[400px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
            {/* Preview Area */}
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-400">
                <Maximize className="mx-auto mb-2 h-12 w-12" />
                <p>Website Content Preview</p>
                <p className="mt-1 text-sm">Your cookie banner will overlay this content</p>
              </div>
            </div>

            {/* Banner Preview */}
            <div
              className={`absolute ${
                config.position === 'bottom'
                  ? 'bottom-0 left-0 right-0'
                  : config.position === 'top'
                  ? 'left-0 right-0 top-0'
                  : config.position === 'center'
                  ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                  : config.position === 'bottom-left'
                  ? 'bottom-4 left-4'
                  : 'bottom-4 right-4'
              } ${
                config.position === 'center' ? 'max-w-lg' : 'w-full'
              } rounded-lg p-6 shadow-2xl`}
              style={{
                backgroundColor: config.backgroundColor,
                color: config.textColor
              }}
            >
              <h3 className="mb-2 text-lg font-bold">{config.title}</h3>
              <p className="mb-4 text-sm opacity-90">{config.message}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {config.acceptText}
                </button>
                <button
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                  style={{
                    borderColor: config.primaryColor,
                    color: config.primaryColor
                  }}
                >
                  {config.rejectText}
                </button>
                <button
                  className="rounded-lg px-4 py-2 text-sm font-medium underline"
                  style={{ color: config.textColor }}
                >
                  {config.settingsText}
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
