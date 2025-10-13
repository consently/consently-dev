'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { 
  Eye, 
  Save, 
  Copy, 
  CheckCircle,
  Layout,
  Maximize,
  Loader2,
  Plus,
  Trash2,
  Clock
} from 'lucide-react';

// Template definitions mapped to database layout types
const LAYOUT_TEMPLATES = [
  {
    id: 'bar',
    name: 'Banner Bar',
    description: 'Full-width banner at top or bottom',
    layout: 'bar'
  },
  {
    id: 'box',
    name: 'Compact Box',
    description: 'Small box positioned in corners',
    layout: 'box'
  },
  {
    id: 'modal',
    name: 'Center Modal',
    description: 'Modal dialog in center with overlay',
    layout: 'modal'
  },
  {
    id: 'popup',
    name: 'Popup Window',
    description: 'Popup window with close button',
    layout: 'popup'
  },
  {
    id: 'floating',
    name: 'Floating Card',
    description: 'Floating card with shadow',
    layout: 'floating'
  },
  {
    id: 'inline',
    name: 'Inline Banner',
    description: 'Embedded inline banner',
    layout: 'inline'
  }
];

const POSITIONS = [
  { value: 'bottom', label: 'Bottom' },
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'center-modal', label: 'Center Modal' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' }
];

type BannerConfig = {
  id?: string;
  name: string;
  description?: string;
  position: string;
  layout: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily?: string;
    fontSize?: number;
    borderRadius?: number;
    boxShadow?: boolean;
  };
  title: string;
  message: string;
  privacyPolicyUrl?: string;
  privacyPolicyText?: string;
  acceptButton: {
    text: string;
    backgroundColor: string;
    textColor: string;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: string;
  };
  rejectButton?: {
    text: string;
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: string;
  };
  settingsButton?: {
    text: string;
    backgroundColor: string;
    textColor: string;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: string;
  };
  showRejectButton?: boolean;
  showSettingsButton?: boolean;
  autoShow?: boolean;
  showAfterDelay?: number;
  respectDNT?: boolean;
  blockContent?: boolean;
  customCSS?: string;
  customJS?: string;
  zIndex?: number;
  is_active?: boolean;
  is_default?: boolean;
};

export default function CookieTemplatesPage() {
  const [selectedLayout, setSelectedLayout] = useState('bar');
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingBanners, setExistingBanners] = useState<BannerConfig[]>([]);
  const [currentBannerId, setCurrentBannerId] = useState<string | null>(null);
  
  const [config, setConfig] = useState<BannerConfig>({
    name: 'My Cookie Banner',
    description: '',
    layout: 'bar',
    position: 'bottom',
    theme: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      borderRadius: 8,
      boxShadow: true
    },
    title: 'We value your privacy',
    message: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
    privacyPolicyUrl: '',
    privacyPolicyText: 'Privacy Policy',
    acceptButton: {
      text: 'Accept All',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 'semibold'
    },
    rejectButton: {
      text: 'Reject All',
      backgroundColor: '#ffffff',
      textColor: '#3b82f6',
      borderColor: '#3b82f6',
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 'medium'
    },
    settingsButton: {
      text: 'Cookie Settings',
      backgroundColor: '#f3f4f6',
      textColor: '#1f2937',
      borderRadius: 6,
      fontSize: 14,
      fontWeight: 'normal'
    },
    showRejectButton: true,
    showSettingsButton: true,
    autoShow: true,
    showAfterDelay: 0,
    respectDNT: false,
    blockContent: false,
    zIndex: 9999,
    is_active: true,
    is_default: false
  });

  // Load existing banner configurations
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await api.cookies.getBanners();
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && Array.isArray(response.data)) {
        setExistingBanners(response.data);
        
        // Load default or first banner if exists
        const defaultBanner = response.data.find((b: BannerConfig) => b.is_default);
        const bannerToLoad = defaultBanner || response.data[0];
        
        if (bannerToLoad) {
          loadBannerConfig(bannerToLoad);
        }
      }
    } catch (error) {
      console.error('Error loading banners:', error);
      toast.error('Failed to load banner configurations');
    } finally {
      setLoading(false);
    }
  };

  const loadBannerConfig = (banner: BannerConfig) => {
    setCurrentBannerId(banner.id || null);
    setConfig(banner);
    setSelectedLayout(banner.layout);
    setSaved(false);
  };

  const updateConfig = (updates: Partial<BannerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const updateTheme = (themeUpdates: Partial<BannerConfig['theme']>) => {
    setConfig(prev => ({
      ...prev,
      theme: { ...prev.theme, ...themeUpdates }
    }));
    setSaved(false);
  };

  const updateButton = (
    buttonType: 'acceptButton' | 'rejectButton' | 'settingsButton',
    updates: Partial<BannerConfig['acceptButton'] & { borderColor?: string }>
  ) => {
    setConfig(prev => ({
      ...prev,
      [buttonType]: { ...prev[buttonType], ...updates }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!config.name || !config.title || !config.message) {
        toast.error('Please fill in all required fields');
        return;
      }

      let response;
      if (currentBannerId) {
        // Update existing banner
        response = await api.cookies.updateBanner({
          id: currentBannerId,
          ...config
        });
      } else {
        // Create new banner
        response = await api.cookies.createBanner(config);
      }

      if (response.error) {
        throw new Error(response.error);
      }

      setSaved(true);
      toast.success(currentBannerId ? 'Banner updated successfully!' : 'Banner created successfully!');
      
      // Reload banners list
      await loadBanners();
      
      // Set current banner ID if it was a new creation
      if (!currentBannerId && response.data?.id) {
        setCurrentBannerId(response.data.id);
      }
      
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner configuration?')) {
      return;
    }

    try {
      const response = await api.cookies.deleteBanner(bannerId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      toast.success('Banner deleted successfully');
      
      // Reset if deleted banner was current
      if (bannerId === currentBannerId) {
        setCurrentBannerId(null);
        // Reset to default config
      }
      
      await loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleNewBanner = () => {
    setCurrentBannerId(null);
    setConfig({
      name: 'New Cookie Banner',
      description: '',
      layout: 'bar',
      position: 'bottom',
      theme: {
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        borderRadius: 8,
        boxShadow: true
      },
      title: 'We value your privacy',
      message: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.',
      privacyPolicyUrl: '',
      privacyPolicyText: 'Privacy Policy',
      acceptButton: {
        text: 'Accept All',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 'semibold'
      },
      rejectButton: {
        text: 'Reject All',
        backgroundColor: '#ffffff',
        textColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 'medium'
      },
      settingsButton: {
        text: 'Cookie Settings',
        backgroundColor: '#f3f4f6',
        textColor: '#1f2937',
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 'normal'
      },
      showRejectButton: true,
      showSettingsButton: true,
      autoShow: true,
      showAfterDelay: 0,
      respectDNT: false,
      blockContent: false,
      zIndex: 9999,
      is_active: true,
      is_default: false
    });
    setSaved(false);
  };

  const handleCopyCode = () => {
    const embedCode = `<script src="${window.location.origin}/widget.js" data-consently-id="${currentBannerId || 'YOUR_BANNER_ID'}"></script>`;
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cookie Banner Templates</h1>
          <p className="mt-1 text-gray-600">
            Create and customize your cookie consent banners
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleNewBanner}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Banner
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
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
        </div>
      </div>

      {/* Existing Banners List */}
      {existingBanners.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Your Banner Configurations
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {existingBanners.map((banner) => (
              <div
                key={banner.id}
                className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  currentBannerId === banner.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => loadBannerConfig(banner)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {banner.name}
                      {banner.is_default && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Default
                        </span>
                      )}
                    </div>
                    {banner.description && (
                      <div className="mt-1 text-xs text-gray-500">
                        {banner.description}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      <Layout className="h-3 w-3" />
                      {banner.layout} • {banner.position}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(banner.id!);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Banner Configuration
            </h2>
            <div className="space-y-4">
              {/* Banner Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banner Name *
                </label>
                <Input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  placeholder="My Cookie Banner"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <Input
                  type="text"
                  value={config.description || ''}
                  onChange={(e) => updateConfig({ description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              {/* Layout Templates */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Layout Style
                </label>
                <div className="space-y-2">
                  {LAYOUT_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => {
                        setSelectedLayout(template.layout);
                        updateConfig({ layout: template.layout });
                      }}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                        selectedLayout === template.layout
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Layout className="mt-0.5 h-4 w-4 text-gray-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                          </div>
                          <div className="mt-0.5 text-xs text-gray-500">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active/Default Toggles */}
              <div className="space-y-2 pt-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.is_active || false}
                    onChange={(e) => updateConfig({ is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.is_default || false}
                    onChange={(e) => updateConfig({ is_default: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as Default</span>
                </label>
              </div>
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

              {/* Theme Colors */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Theme Colors</h3>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Primary Color
                    </label>
                    <Input
                      type="color"
                      value={config.theme.primaryColor}
                      onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Secondary Color
                    </label>
                    <Input
                      type="color"
                      value={config.theme.secondaryColor}
                      onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Text Color
                    </label>
                    <Input
                      type="color"
                      value={config.theme.textColor}
                      onChange={(e) => updateTheme({ textColor: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Background
                    </label>
                    <Input
                      type="color"
                      value={config.theme.backgroundColor}
                      onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Settings */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Font Size (px)
                  </label>
                  <Input
                    type="number"
                    min="12"
                    max="20"
                    value={config.theme.fontSize}
                    onChange={(e) => updateTheme({ fontSize: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-600">
                    Border Radius (px)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={config.theme.borderRadius}
                    onChange={(e) => updateTheme({ borderRadius: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.theme.boxShadow || false}
                      onChange={(e) => updateTheme({ boxShadow: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-xs text-gray-700">Box Shadow</span>
                  </label>
                </div>
              </div>

              {/* Text Content */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banner Title *
                </label>
                <Input
                  type="text"
                  value={config.title}
                  onChange={(e) => updateConfig({ title: e.target.value })}
                  placeholder="We value your privacy"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Banner Message *
                </label>
                <Textarea
                  value={config.message}
                  onChange={(e) => updateConfig({ message: e.target.value })}
                  rows={3}
                  placeholder="Describe how you use cookies..."
                  required
                />
              </div>

              {/* Privacy Policy */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Privacy Policy URL
                  </label>
                  <Input
                    type="url"
                    value={config.privacyPolicyUrl || ''}
                    onChange={(e) => updateConfig({ privacyPolicyUrl: e.target.value })}
                    placeholder="https://example.com/privacy"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Privacy Policy Link Text
                  </label>
                  <Input
                    type="text"
                    value={config.privacyPolicyText || ''}
                    onChange={(e) => updateConfig({ privacyPolicyText: e.target.value })}
                    placeholder="Privacy Policy"
                  />
                </div>
              </div>

              {/* Button Configurations */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Button Configurations</h3>
                
                {/* Accept Button */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="mb-2 text-xs font-semibold text-gray-700 uppercase">Accept Button</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">Button Text</label>
                      <Input
                        type="text"
                        value={config.acceptButton.text}
                        onChange={(e) => updateButton('acceptButton', { text: e.target.value })}
                        placeholder="Accept All"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">Background Color</label>
                      <Input
                        type="color"
                        value={config.acceptButton.backgroundColor}
                        onChange={(e) => updateButton('acceptButton', { backgroundColor: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">Text Color</label>
                      <Input
                        type="color"
                        value={config.acceptButton.textColor}
                        onChange={(e) => updateButton('acceptButton', { textColor: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Reject Button */}
                {config.showRejectButton && config.rejectButton && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase">Reject Button</h4>
                      <button
                        onClick={() => updateConfig({ showRejectButton: false })}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Button Text</label>
                        <Input
                          type="text"
                          value={config.rejectButton.text}
                          onChange={(e) => updateButton('rejectButton', { text: e.target.value })}
                          placeholder="Reject All"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Background</label>
                        <Input
                          type="color"
                          value={config.rejectButton.backgroundColor}
                          onChange={(e) => updateButton('rejectButton', { backgroundColor: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Text Color</label>
                        <Input
                          type="color"
                          value={config.rejectButton.textColor}
                          onChange={(e) => updateButton('rejectButton', { textColor: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Border Color</label>
                        <Input
                          type="color"
                          value={config.rejectButton.borderColor || '#3b82f6'}
                          onChange={(e) => updateButton('rejectButton', { borderColor: e.target.value })}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!config.showRejectButton && (
                  <button
                    onClick={() => updateConfig({ showRejectButton: true })}
                    className="mb-4 text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Reject Button
                  </button>
                )}

                {/* Settings Button */}
                {config.showSettingsButton && config.settingsButton && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase">Settings Button</h4>
                      <button
                        onClick={() => updateConfig({ showSettingsButton: false })}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Button Text</label>
                        <Input
                          type="text"
                          value={config.settingsButton.text}
                          onChange={(e) => updateButton('settingsButton', { text: e.target.value })}
                          placeholder="Cookie Settings"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Background</label>
                        <Input
                          type="color"
                          value={config.settingsButton.backgroundColor}
                          onChange={(e) => updateButton('settingsButton', { backgroundColor: e.target.value })}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-600">Text Color</label>
                        <Input
                          type="color"
                          value={config.settingsButton.textColor}
                          onChange={(e) => updateButton('settingsButton', { textColor: e.target.value })}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {!config.showSettingsButton && (
                  <button
                    onClick={() => updateConfig({ showSettingsButton: true })}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add Settings Button
                  </button>
                )}
              </div>

              {/* Behavior Settings */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Behavior Settings</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoShow || false}
                      onChange={(e) => updateConfig({ autoShow: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Auto-show banner on page load</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.respectDNT || false}
                      onChange={(e) => updateConfig({ respectDNT: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Respect Do Not Track (DNT)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.blockContent || false}
                      onChange={(e) => updateConfig({ blockContent: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Block content until consent</span>
                  </label>
                </div>
                
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Show After Delay (ms)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="60000"
                      step="100"
                      value={config.showAfterDelay || 0}
                      onChange={(e) => updateConfig({ showAfterDelay: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-600">
                      Z-Index
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="999999"
                      value={config.zIndex || 9999}
                      onChange={(e) => updateConfig({ zIndex: parseInt(e.target.value) || 9999 })}
                    />
                  </div>
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">Embed Code</h3>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-consently-id="${currentBannerId || 'BANNER_ID_WILL_BE_GENERATED'}"></script>`}
                    readOnly
                    className="flex-1 font-mono text-sm bg-gray-50"
                  />
                  <Button variant="outline" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {currentBannerId 
                    ? 'Add this code to your website\'s <head> section to display the banner'
                    : 'Save the banner configuration first to generate your unique embed code'
                  }
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

          <div className="relative min-h-[500px] rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8">
            {/* Preview Area */}
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-gray-400">
                <Maximize className="mx-auto mb-2 h-12 w-12" />
                <p className="text-lg font-medium">Website Content Preview</p>
                <p className="mt-1 text-sm">Your cookie banner will overlay this content</p>
                <div className="mt-4 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Layout className="h-3 w-3" />
                    {config.layout} • {config.position}
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Preview */}
            <div
              className={`absolute ${
                config.position === 'bottom'
                  ? 'bottom-0 left-0 right-0'
                  : config.position === 'top'
                  ? 'left-0 right-0 top-0'
                  : config.position === 'center' || config.position === 'center-modal'
                  ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                  : config.position === 'bottom-left'
                  ? 'bottom-4 left-4'
                  : config.position === 'bottom-right'
                  ? 'bottom-4 right-4'
                  : config.position === 'top-left'
                  ? 'top-4 left-4'
                  : 'top-4 right-4'
              } ${
                config.position.includes('center') || config.layout === 'modal' ? 'max-w-lg' : 
                config.layout === 'box' || config.layout === 'floating' ? 'max-w-md' :
                config.layout === 'bar' ? 'w-full' : 'max-w-xl'
              } p-6`}
              style={{
                backgroundColor: config.theme.backgroundColor,
                color: config.theme.textColor,
                borderRadius: `${config.theme.borderRadius}px`,
                boxShadow: config.theme.boxShadow ? '0 10px 40px rgba(0,0,0,0.15)' : 'none',
                fontSize: `${config.theme.fontSize}px`,
                zIndex: config.zIndex
              }}
            >
              <h3 className="mb-2 text-lg font-bold">{config.title}</h3>
              <p className="mb-4 text-sm opacity-90">{config.message}</p>
              
              {config.privacyPolicyUrl && (
                <a 
                  href={config.privacyPolicyUrl}
                  className="mb-4 text-xs underline block"
                  style={{ color: config.theme.primaryColor }}
                >
                  {config.privacyPolicyText || 'Privacy Policy'}
                </a>
              )}
              
              <div className="flex flex-wrap gap-2">
                {/* Accept Button */}
                <button
                  className="px-4 py-2 text-sm transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: config.acceptButton.backgroundColor,
                    color: config.acceptButton.textColor,
                    borderRadius: `${config.acceptButton.borderRadius || 6}px`,
                    fontSize: `${config.acceptButton.fontSize || 14}px`,
                    fontWeight: config.acceptButton.fontWeight || 'semibold'
                  }}
                >
                  {config.acceptButton.text}
                </button>
                
                {/* Reject Button */}
                {config.showRejectButton && config.rejectButton && (
                  <button
                    className="px-4 py-2 text-sm border transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: config.rejectButton.backgroundColor,
                      color: config.rejectButton.textColor,
                      borderColor: config.rejectButton.borderColor || config.theme.primaryColor,
                      borderRadius: `${config.rejectButton.borderRadius || 6}px`,
                      fontSize: `${config.rejectButton.fontSize || 14}px`,
                      fontWeight: config.rejectButton.fontWeight || 'medium'
                    }}
                  >
                    {config.rejectButton.text}
                  </button>
                )}
                
                {/* Settings Button */}
                {config.showSettingsButton && config.settingsButton && (
                  <button
                    className="px-4 py-2 text-sm transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: config.settingsButton.backgroundColor,
                      color: config.settingsButton.textColor,
                      borderRadius: `${config.settingsButton.borderRadius || 6}px`,
                      fontSize: `${config.settingsButton.fontSize || 14}px`,
                      fontWeight: config.settingsButton.fontWeight || 'normal'
                    }}
                  >
                    {config.settingsButton.text}
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
