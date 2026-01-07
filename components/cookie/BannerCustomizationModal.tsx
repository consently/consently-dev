'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Loader2, 
  Sparkles, 
  Palette, 
  Layout, 
  Type, 
  Globe,
  Eye,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_LANGUAGES } from '@/lib/constants/indian-languages';

const bannerCustomizationSchema = z.object({
  // Content
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  message: z.string().min(20, 'Message must be at least 20 characters').max(500, 'Message too long'),
  
  // Button Labels
  acceptButtonText: z.string().min(2, 'Button text required').max(30),
  rejectButtonText: z.string().min(2, 'Button text required').max(30),
  settingsButtonText: z.string().min(2, 'Button text required').max(30),
  
  // Categories (consent chips)
  categories: z.array(z.string()).min(1, 'At least one category required'),
  
  // Theme
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Must be valid hex color'),
  backgroundColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Must be valid hex color'),
  textColor: z.string().regex(/^#([0-9A-Fa-f]{6})$/, 'Must be valid hex color'),
  fontFamily: z.string(),
  borderRadius: z.number().min(0).max(50),
  
  // Layout
  position: z.enum(['top', 'bottom', 'center']),
  layout: z.enum(['bar', 'box', 'modal']),
  
  // Language
  languages: z.array(z.string()).min(1, 'At least one language required'),
  
  // Privacy Links (optional)
  privacyPolicyUrl: z.string().url('Must be valid URL').optional().or(z.literal('')),
  privacyPolicyText: z.string().optional(),
  cookiePolicyUrl: z.string().url('Must be valid URL').optional().or(z.literal('')),
  cookiePolicyText: z.string().optional(),
});

type BannerCustomizationFormData = z.infer<typeof bannerCustomizationSchema>;

interface BannerCustomizationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: BannerCustomizationFormData) => Promise<void>;
  scannedUrl: string;
  scannedCookies: Array<{
    category: string;
    name: string;
  }>;
}

const CATEGORY_OPTIONS = [
  { id: 'necessary', name: 'Necessary', description: 'Required for website functionality', color: 'green' },
  { id: 'functional', name: 'Functional', description: 'Enhance user experience', color: 'blue' },
  { id: 'analytics', name: 'Analytics', description: 'Track usage and performance', color: 'yellow' },
  { id: 'advertising', name: 'Advertising', description: 'Targeted marketing', color: 'red' },
];

const THEME_PRESETS = [
  { name: 'Default Blue', primary: '#3b82f6', bg: '#ffffff', text: '#1f2937' },
  { name: 'Dark Mode', primary: '#6366f1', bg: '#1f2937', text: '#f9fafb' },
  { name: 'Fresh Green', primary: '#10b981', bg: '#ffffff', text: '#064e3b' },
  { name: 'Professional Purple', primary: '#8b5cf6', bg: '#faf5ff', text: '#581c87' },
];

const FONT_OPTIONS = [
  { name: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
  { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: '"Open Sans", sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  // All 22 Schedule 8 Indian Languages
  ...INDIAN_LANGUAGES.map(lang => ({
    code: lang.code,
    name: `${lang.name} (${lang.nativeName})`,
    flag: '🇮🇳'
  }))
];

// Helper function to safely extract hostname from URL
function getHostname(url: string): string {
  if (!url || url.trim() === '') {
    return 'your website';
  }
  
  try {
    // Add protocol if missing
    let urlToParse = url.trim();
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      urlToParse = `https://${urlToParse}`;
    }
    
    const urlObj = new URL(urlToParse);
    return urlObj.hostname;
  } catch (error) {
    // If URL parsing fails, try to extract domain from string
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Final fallback
    return url.length > 50 ? url.substring(0, 47) + '...' : url || 'your website';
  }
}

export function BannerCustomizationModal({
  open,
  onClose,
  onSave,
  scannedUrl,
  scannedCookies,
}: BannerCustomizationModalProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'theme' | 'layout'>('content');

  // Get unique categories from scanned cookies
  const detectedCategories = Array.from(
    new Set(scannedCookies.map(c => c.category))
  );

  // Initialize form with smart defaults
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BannerCustomizationFormData>({
    resolver: zodResolver(bannerCustomizationSchema),
    defaultValues: {
      title: '🍪 We value your privacy',
      message: `This website uses cookies to enhance your experience. We have detected ${scannedCookies.length} cookies. Please review and customize your preferences.`,
      acceptButtonText: 'Accept All',
      rejectButtonText: 'Reject All',
      settingsButtonText: 'Cookie Settings',
      categories: detectedCategories.length > 0 ? detectedCategories : ['necessary'],
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: 8,
      position: 'bottom',
      layout: 'bar',
      languages: ['en', 'hi'],
      privacyPolicyUrl: '',
      privacyPolicyText: 'Privacy Policy',
      cookiePolicyUrl: '',
      cookiePolicyText: 'Cookie Policy',
    },
  });

  // Watch all values for live preview
  const formValues = watch();

  const applyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
    setValue('primaryColor', preset.primary);
    setValue('backgroundColor', preset.bg);
    setValue('textColor', preset.text);
    toast.success(`Applied ${preset.name} theme`);
  };

  const toggleCategory = (categoryId: string) => {
    const current = formValues.categories;
    if (current.includes(categoryId)) {
      if (categoryId === 'necessary') {
        toast.error('Necessary cookies cannot be removed');
        return;
      }
      setValue('categories', current.filter(c => c !== categoryId));
    } else {
      setValue('categories', [...current, categoryId]);
    }
  };

  const toggleLanguage = (langCode: string) => {
    const current = formValues.languages;
    if (current.includes(langCode)) {
      if (langCode === 'en') {
        toast.error('English is required');
        return;
      }
      setValue('languages', current.filter(l => l !== langCode));
    } else {
      setValue('languages', [...current, langCode]);
    }
  };

  const onSubmit = async (data: BannerCustomizationFormData) => {
    try {
      setSaving(true);
      await onSave(data);
      // Don't show success toast here - let the parent component handle it
      // This allows the parent to show more detailed success messages
      onClose();
    } catch (error) {
      console.error('Error saving banner config:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to save configuration. Please check the console for details.';
      toast.error(errorMessage, {
        duration: 5000,
        description: 'If this persists, please try again or contact support.'
      });
      // Don't close modal on error so user can fix and retry
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize Your Cookie Banner"
      description={`Configure banner for ${getHostname(scannedUrl)}`}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs - Mobile Scrollable */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {[
            { id: 'content', label: 'Content', icon: Type },
            { id: 'theme', label: 'Theme', icon: Palette },
            { id: 'layout', label: 'Layout', icon: Layout },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors min-w-fit touch-manipulation ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Title *
                  </label>
                  <Input
                    {...register('title')}
                    placeholder="e.g., 🍪 We value your privacy"
                    error={errors.title?.message}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Short, friendly headline for your banner
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner Message *
                  </label>
                  <Textarea
                    {...register('message')}
                    placeholder="Explain your cookie usage..."
                    rows={4}
                    error={errors.message?.message}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formValues.message.length}/500 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Accept Button
                    </label>
                    <Input {...register('acceptButtonText')} error={errors.acceptButtonText?.message} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reject Button
                    </label>
                    <Input {...register('rejectButtonText')} error={errors.rejectButtonText?.message} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Settings Button
                    </label>
                    <Input {...register('settingsButtonText')} error={errors.settingsButtonText?.message} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cookie Categories *
                  </label>
                  <div className="space-y-2">
                    {CATEGORY_OPTIONS.map(cat => (
                      <div
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formValues.categories.includes(cat.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{cat.name}</span>
                              {cat.id === 'necessary' && (
                                <Badge className="text-xs">Required</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{cat.description}</p>
                          </div>
                          {formValues.categories.includes(cat.id) && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Supported Languages *
                    </div>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {LANGUAGE_OPTIONS.map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggleLanguage(lang.code)}
                        className={`flex items-center gap-2 p-2 border-2 rounded-lg transition-all text-left ${
                          formValues.languages.includes(lang.code)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-xs font-medium flex-1">{lang.name}</span>
                        {formValues.languages.includes(lang.code) && (
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Privacy Policy URL (optional)
                    </label>
                    <Input
                      {...register('privacyPolicyUrl')}
                      placeholder="https://yoursite.com/privacy"
                      error={errors.privacyPolicyUrl?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cookie Policy URL (optional)
                    </label>
                    <Input
                      {...register('cookiePolicyUrl')}
                      placeholder="https://yoursite.com/cookies"
                      error={errors.cookiePolicyUrl?.message}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme Presets
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {THEME_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => applyThemePreset(preset)}
                        className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all text-left"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <span className="text-sm font-medium">{preset.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.bg }} />
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: preset.text }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Primary Color
                    </label>
                    <Input
                      type="color"
                      {...register('primaryColor')}
                      className="h-10"
                    />
                    <Input
                      {...register('primaryColor')}
                      placeholder="#3b82f6"
                      className="mt-1 text-xs"
                      error={errors.primaryColor?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Background
                    </label>
                    <Input
                      type="color"
                      {...register('backgroundColor')}
                      className="h-10"
                    />
                    <Input
                      {...register('backgroundColor')}
                      placeholder="#ffffff"
                      className="mt-1 text-xs"
                      error={errors.backgroundColor?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Text Color
                    </label>
                    <Input
                      type="color"
                      {...register('textColor')}
                      className="h-10"
                    />
                    <Input
                      {...register('textColor')}
                      placeholder="#1f2937"
                      className="mt-1 text-xs"
                      error={errors.textColor?.message}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Family
                  </label>
                  <Select
                    {...register('fontFamily')}
                    options={FONT_OPTIONS.map(f => ({ value: f.value, label: f.name }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Border Radius: {formValues.borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    {...register('borderRadius', { valueAsNumber: true })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Layout Tab */}
            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { value: 'top', label: 'Top', icon: '↑' },
                      { value: 'bottom', label: 'Bottom', icon: '↓' },
                      { value: 'center', label: 'Center', icon: '⊙' },
                    ].map(pos => (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => setValue('position', pos.value as any)}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          formValues.position === pos.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{pos.icon}</div>
                        <div className="text-sm font-medium">{pos.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Layout Style
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'bar', label: 'Bar', desc: 'Full-width horizontal banner' },
                      { value: 'box', label: 'Box', desc: 'Compact floating box' },
                      { value: 'modal', label: 'Modal', desc: 'Centered overlay modal' },
                    ].map(layout => (
                      <button
                        key={layout.value}
                        type="button"
                        onClick={() => setValue('layout', layout.value as any)}
                        className={`w-full p-3 border-2 rounded-lg transition-all text-left ${
                          formValues.layout === layout.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{layout.label}</div>
                        <div className="text-xs text-gray-600">{layout.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <strong>Preview Note:</strong> Changes to position and layout will be reflected
                      in the live preview on the right.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Eye className="h-4 w-4" />
              Live Preview
            </div>
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              {/* Mock Browser */}
              <div className="bg-white rounded-lg shadow-xl">
                <div className="bg-gray-100 px-3 py-2 flex items-center gap-2 border-b">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 bg-white rounded px-2 py-1 text-xs text-gray-600">
                    {getHostname(scannedUrl)}
                  </div>
                </div>
                <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                  <div className="text-xs text-gray-400">Your Website Content</div>
                </div>
                
                {/* Live Banner Preview */}
                <div
                  className="p-4 shadow-lg"
                  style={{
                    backgroundColor: formValues.backgroundColor,
                    color: formValues.textColor,
                    borderRadius: `${formValues.borderRadius}px`,
                    fontFamily: formValues.fontFamily,
                  }}
                >
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">{formValues.title}</h3>
                    <p className="text-xs opacity-90">{formValues.message}</p>
                    <div className="flex flex-wrap gap-1">
                      {formValues.categories.map(cat => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        className="px-3 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: formValues.primaryColor,
                          color: '#ffffff',
                          borderRadius: `${formValues.borderRadius}px`,
                        }}
                      >
                        {formValues.acceptButtonText}
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-xs font-medium rounded border-2"
                        style={{
                          borderColor: formValues.primaryColor,
                          color: formValues.primaryColor,
                          borderRadius: `${formValues.borderRadius}px`,
                        }}
                      >
                        {formValues.rejectButtonText}
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: '#f3f4f6',
                          color: formValues.textColor,
                          borderRadius: `${formValues.borderRadius}px`,
                        }}
                      >
                        {formValues.settingsButtonText}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Preview updates in real-time as you customize
            </p>
          </div>
        </div>

        {/* Action Buttons - Mobile Stack */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={saving}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={saving} 
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Save & Generate Widget</span>
                <span className="sm:hidden">Save Widget</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
