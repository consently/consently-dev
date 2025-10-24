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
import { Tooltip } from '@/components/ui/tooltip';
import { Accordion } from '@/components/ui/accordion';
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
    fontFamily?: string;
    logoUrl?: string;
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
  supportedLanguages?: string[];
  privacyNoticeVersion?: string;
  privacyNoticeLastUpdated?: string;
  requiresReconsent?: boolean;
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
    supportedLanguages: ['en', 'hi', 'pa', 'te', 'ta']
  });
  const [copySuccess, setCopySuccess] = useState(false);
  const [selectedLanguagesForTranslation, setSelectedLanguagesForTranslation] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [activitySort, setActivitySort] = useState<'name' | 'industry'>('name');
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'html' | 'wordpress' | 'shopify' | 'wix' | 'react'>('html');
  const [widgetStats, setWidgetStats] = useState<{totalConsents: number; weeklyConsents: number; conversionRate: number} | null>(null);
  const [notifications, setNotifications] = useState<Array<{id: string; type: 'info' | 'warning' | 'error' | 'success'; title: string; message: string}>>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPrivacyNoticeModal, setShowPrivacyNoticeModal] = useState(false);
  const [generatedPrivacyNotice, setGeneratedPrivacyNotice] = useState<string>('');

  const themePresets = [
    { name: 'Default Blue', primaryColor: '#3b82f6', backgroundColor: '#ffffff', textColor: '#1f2937' },
    { name: 'Professional Dark', primaryColor: '#6366f1', backgroundColor: '#1f2937', textColor: '#f9fafb' },
    { name: 'Modern Purple', primaryColor: '#8b5cf6', backgroundColor: '#faf5ff', textColor: '#581c87' },
    { name: 'Fresh Green', primaryColor: '#10b981', backgroundColor: '#ffffff', textColor: '#064e3b' },
    { name: 'Elegant Rose', primaryColor: '#f43f5e', backgroundColor: '#fff1f2', textColor: '#881337' },
  ];

  const fontFamilies = [
    { name: 'System Default', value: 'system-ui, -apple-system, sans-serif' },
    { name: 'Inter', value: 'Inter, system-ui, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Georgia (Serif)', value: 'Georgia, serif' },
    { name: 'Times New Roman (Serif)', value: '"Times New Roman", serif' },
  ];

  useEffect(() => {
    fetchData();
    initializeNotifications();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !config.widgetId) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave(true); // silent save
    }, 30000); // Auto-save after 30 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [config, hasUnsavedChanges]);

  // Track unsaved changes
  useEffect(() => {
    if (config.widgetId) {
      setHasUnsavedChanges(true);
    }
  }, [config]);

  // Initialize notifications
  const initializeNotifications = () => {
    const alerts = [];
    
    // Check for expiring consents (example notification)
    alerts.push({
      id: 'dpdpa-compliance',
      type: 'info' as const,
      title: 'DPDPA 2023 Compliance Active',
      message: 'Your widget is fully compliant with Digital Personal Data Protection Act 2023 requirements.'
    });

    // Check if widget is new (no stats yet)
    if (config.widgetId && !widgetStats) {
      alerts.push({
        id: 'new-widget',
        type: 'info' as const,
        title: 'New Widget Detected',
        message: 'Deploy your widget to start collecting consent data. Stats will appear once users interact.'
      });
    }

    setNotifications(alerts);
  };

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
          
          // Fetch widget stats if widgetId exists
          if (existingConfig.widget_id) {
            try {
              const statsRes = await fetch(`/api/dpdpa/widget-stats/${existingConfig.widget_id}`);
              if (statsRes.ok) {
                const statsData = await statsRes.json();
                setWidgetStats({
                  totalConsents: statsData.totalConsents || 0,
                  weeklyConsents: statsData.weeklyConsents || 0,
                  conversionRate: statsData.conversionRate || 0
                });
              }
            } catch (error) {
              console.error('Error fetching stats:', error);
            }
          }
          
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
            supportedLanguages: existingConfig.supported_languages || ['en', 'hi', 'pa', 'te', 'ta']
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

  const validateConfig = () => {
    const errors: {[key: string]: string} = {};
    
    if (!config.domain || config.domain.trim() === '') {
      errors.domain = 'Domain is required';
    } else if (config.domain.includes('http') || config.domain.includes('www')) {
      errors.domain = 'Remove http://, https://, and www from domain';
    }
    
    if (!config.name || config.name.trim() === '') {
      errors.name = 'Widget name is required';
    }
    
    if (config.selectedActivities.length === 0) {
      errors.activities = 'Select at least one processing activity';
    }
    
    if (!config.title || config.title.trim() === '') {
      errors.title = 'Title is required';
    }
    
    if (!config.message || config.message.trim() === '') {
      errors.message = 'Message is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (silent = false) => {
    if (!validateConfig()) {
      if (!silent) {
        toast.error('Please fix the validation errors before saving');
      }
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

      if (!silent) {
        toast.success('✅ Configuration saved successfully!', {
          description: config.widgetId ? 'Your widget configuration has been updated.' : 'Your widget is now ready to deploy.',
        });
      }
      
      // Update last saved time and clear unsaved changes flag
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Clear validation errors on successful save
      setValidationErrors({});
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('❌ Failed to save configuration', {
        description: error instanceof Error ? error.message : 'Please try again or contact support.',
      });
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

  const getPlatformSpecificCode = (platform: string) => {
    if (!config.widgetId) return '';
    const baseUrl = window.location.origin;
    const widgetId = config.widgetId;

    switch (platform) {
      case 'html':
        return `<!-- Consently DPDPA Widget -->\n<script defer src="${baseUrl}/dpdpa-widget.js" data-dpdpa-widget-id="${widgetId}"></script>`;
      
      case 'wordpress':
        return `<?php\n/**\n * Add Consently DPDPA Widget to WordPress\n * Add this to your theme's footer.php or use a plugin like \"Insert Headers and Footers\"\n */\n?>\n<script defer src="${baseUrl}/dpdpa-widget.js" data-dpdpa-widget-id="${widgetId}"></script>`;
      
      case 'shopify':
        return `<!-- Add to: Online Store > Themes > Actions > Edit Code > theme.liquid -->\n<!-- Place before </body> tag -->\n<script defer src="${baseUrl}/dpdpa-widget.js" data-dpdpa-widget-id="${widgetId}"></script>\n\n<!-- Production Option: Upload to Shopify CDN -->\n<!-- 1. Download widget: curl -o dpdpa-widget.js ${baseUrl}/dpdpa-widget.js -->\n<!-- 2. Upload at: Settings > Files -->\n<!-- 3. Replace src with Shopify CDN URL -->`;
      
      case 'wix':
        return `<!-- Wix Installation:\n1. Go to Settings > Custom Code\n2. Click \"+ Add Custom Code\"\n3. Paste the code below\n4. Set to load on \"All Pages\" in the <body> section\n-->\n<script defer src="${baseUrl}/dpdpa-widget.js" data-dpdpa-widget-id="${widgetId}"></script>`;
      
      case 'react':
        return `// React/Next.js Installation\nimport { useEffect } from 'react';\n\nfunction ConsentlyWidget() {\n  useEffect(() => {\n    const script = document.createElement('script');\n    script.src = '${baseUrl}/dpdpa-widget.js';\n    script.setAttribute('data-dpdpa-widget-id', '${widgetId}');\n    script.async = true;\n    document.body.appendChild(script);\n\n    return () => {\n      document.body.removeChild(script);\n    };\n  }, []);\n\n  return null;\n}\n\nexport default ConsentlyWidget;`;
      
      default:
        return getEmbedCode();
    }
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

  // Filter and sort activities
  const filteredAndSortedActivities = activities
    .filter(activity => {
      // Search filter
      const matchesSearch = activitySearch === '' || 
        activity.activity_name.toLowerCase().includes(activitySearch.toLowerCase()) ||
        activity.purpose.toLowerCase().includes(activitySearch.toLowerCase());
      
      // Industry filter
      const matchesFilter = activityFilter === 'all' || activity.industry === activityFilter;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (activitySort === 'name') {
        return a.activity_name.localeCompare(b.activity_name);
      } else {
        return a.industry.localeCompare(b.industry);
      }
    });

  // Get unique industries for filter dropdown
  const uniqueIndustries = Array.from(new Set(activities.map(a => a.industry))).sort();

  // Generate privacy notice HTML for preview
  const generatePrivacyNoticePreview = () => {
    if (config.selectedActivities.length === 0) {
      toast.error('Please select at least one processing activity first');
      return;
    }

    const selectedActivitiesData = activities.filter(a => config.selectedActivities.includes(a.id));
    const html = generatePrivacyNoticeHTML(selectedActivitiesData, config.domain || 'your-domain.com');
    setGeneratedPrivacyNotice(html);
    setShowPrivacyNoticeModal(true);
  };

  // Privacy notice HTML generator (matches backend logic)
  const generatePrivacyNoticeHTML = (activities: ProcessingActivity[], domain: string): string => {
    const companyName = domain || '[Your Company Name]';
    
    const activitySections = activities.map((activity, index) => `
      <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
          ${index + 1}. ${escapeHtml(activity.activity_name)}
        </h3>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Purpose:</strong>
          <p style="margin: 4px 0 0 0; color: #6b7280;">${escapeHtml(activity.purpose)}</p>
        </div>

        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Data Categories:</strong>
          <p style="margin: 4px 0 0 0; color: #6b7280;">${activity.data_attributes.map(a => escapeHtml(a)).join(', ')}</p>
        </div>

        <div>
          <strong style="color: #374151;">Retention Period:</strong>
          <p style="margin: 4px 0 0 0; color: #6b7280;">${escapeHtml(activity.retention_period)}</p>
        </div>
      </div>
    `).join('');

    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Notice - Data Processing Activities</title>
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 32px 16px;">
    
    <h1 style="color: #111827; font-size: 32px; margin-bottom: 16px;">Privacy Notice</h1>
    
    <div style="background: #dbeafe; padding: 16px; border-radius: 8px; margin-bottom: 32px;">
      <p style="margin: 0; color: #1e40af; font-weight: 500;">
        This notice explains how ${escapeHtml(companyName)} processes your personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA).
      </p>
    </div>

    <h2 style="color: #1f2937; font-size: 24px; margin-top: 32px; margin-bottom: 16px;">Data Processing Activities</h2>
    
    <p style="color: #6b7280; margin-bottom: 24px;">
      We process your personal data for the following purposes. You have the right to provide or withdraw consent for each activity.
    </p>

    ${activitySections}

    <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
      <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">Your Rights Under DPDPA 2023</h2>
      
      <ul style="color: #6b7280; line-height: 1.8;">
        <li><strong>Right to Access:</strong> You can request information about what personal data we hold about you.</li>
        <li><strong>Right to Correction:</strong> You can request correction of inaccurate or incomplete data.</li>
        <li><strong>Right to Erasure:</strong> You can request deletion of your personal data in certain circumstances.</li>
        <li><strong>Right to Withdraw Consent:</strong> You can withdraw your consent at any time.</li>
        <li><strong>Right to Grievance Redressal:</strong> You can raise concerns or complaints about data processing.</li>
      </ul>

      <p style="color: #6b7280; margin-top: 24px;">
        <strong>How to Exercise Your Rights:</strong><br>
        You can manage your consent preferences or raise a grievance through our consent widget on ${escapeHtml(domain)}, 
        or contact us at [contact-email@${escapeHtml(domain)}].
      </p>

      <p style="color: #6b7280; margin-top: 16px;">
        <strong>Response Time:</strong> We will respond to your requests within 72 hours as required by DPDPA 2023.
      </p>
    </div>

    <div style="margin-top: 32px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        <strong>Last Updated:</strong> ${new Date().toLocaleDateString()}<br>
        <strong>Contact:</strong> [contact-email@${escapeHtml(domain)}]<br>
        <strong>Compliance:</strong> This notice is compliant with the Digital Personal Data Protection Act, 2023 (DPDPA)
      </p>
    </div>

  </body>
  </html>
    `.trim();
  };

  const escapeHtml = (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  const downloadPrivacyNotice = () => {
    if (config.selectedActivities.length === 0) {
      toast.error('Please select at least one processing activity first');
      return;
    }

    const selectedActivitiesData = activities.filter(a => config.selectedActivities.includes(a.id));
    const html = generatePrivacyNoticeHTML(selectedActivitiesData, config.domain || 'your-domain.com');
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-notice-${config.domain || 'document'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Privacy notice downloaded successfully!');
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
                onClick={() => handleSave(false)}
                disabled={saving}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                aria-label="Save widget configuration"
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
              {hasUnsavedChanges && !saving && (
                <span className="text-xs text-gray-500 ml-2">
                  Unsaved changes • Auto-save in 30s
                </span>
              )}
              {lastSaved && (
                <span className="text-xs text-gray-500 ml-2">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div className="space-y-2" role="alert" aria-live="polite">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative overflow-hidden rounded-xl border p-4 shadow-sm ${
                notification.type === 'error' ? 'bg-red-50 border-red-200' :
                notification.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                notification.type === 'success' ? 'bg-green-50 border-green-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <button
                onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                className="absolute top-2 right-2 p-1 hover:bg-black/10 rounded"
                aria-label="Dismiss notification"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'error' ? 'bg-red-100' :
                  notification.type === 'warning' ? 'bg-orange-100' :
                  notification.type === 'success' ? 'bg-green-100' :
                  'bg-blue-100'
                }`}>
                  {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-orange-600" />}
                  {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {notification.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Analytics Summary */}
      {config.widgetId && widgetStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Weekly Consents</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{widgetStats.weeklyConsents}</p>
                  <p className="text-xs text-blue-700 mt-1">Last 7 days</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Total Consents</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-2">{widgetStats.totalConsents}</p>
                  <p className="text-xs text-indigo-700 mt-1">All time</p>
                </div>
                <div className="p-3 bg-indigo-500 rounded-full">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Conversion Rate</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{widgetStats.conversionRate}%</p>
                  <p className="text-xs text-green-700 mt-1">Acceptance rate</p>
                </div>
                <div className="p-3 bg-green-500 rounded-full">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Activities</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{config.selectedActivities.length}</p>
                  <p className="text-xs text-purple-700 mt-1">Configured</p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Privacy Notice Modal */}
      {showPrivacyNoticeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPrivacyNoticeModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Full Privacy Notice Preview</h2>
                <p className="text-sm text-gray-600 mt-1">This is what users will see and download</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={downloadPrivacyNotice}
                  variant="outline"
                  size="sm"
                  className="shadow-sm"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </Button>
                <button
                  onClick={() => setShowPrivacyNoticeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedPrivacyNotice }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Auto-generated from your processing activities</span>
                </div>
                <Button
                  onClick={() => setShowPrivacyNoticeModal(false)}
                  variant="default"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Processing Activities Selection - NOW FIRST */}
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
                {config.selectedActivities.length > 0 ? (
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    {config.selectedActivities.length} selected
                  </Badge>
                ) : validationErrors.activities ? (
                  <Badge className="bg-red-100 text-red-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Required
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {validationErrors.activities && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.activities}
                  </p>
                </div>
              )}
              
              {/* Search, Filter, and Sort Controls */}
              {activities.length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Input
                        value={activitySearch}
                        onChange={(e) => setActivitySearch(e.target.value)}
                        placeholder="Search activities by name or purpose..."
                        className="pl-10"
                      />
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    
                    {/* Filter by Industry */}
                    <select
                      value={activityFilter}
                      onChange={(e) => setActivityFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Industries</option>
                      {uniqueIndustries.map(industry => (
                        <option key={industry} value={industry}>{industry}</option>
                      ))}
                    </select>
                    
                    {/* Sort */}
                    <select
                      value={activitySort}
                      onChange={(e) => setActivitySort(e.target.value as 'name' | 'industry')}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="industry">Sort by Industry</option>
                    </select>
                  </div>
                  
                  {/* Results count */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Showing {filteredAndSortedActivities.length} of {activities.length} activities
                    </span>
                    {(activitySearch || activityFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setActivitySearch('');
                          setActivityFilter('all');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}
              
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
                  {filteredAndSortedActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No activities match your filters</p>
                      <button
                        onClick={() => {
                          setActivitySearch('');
                          setActivityFilter('all');
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredAndSortedActivities.map((activity) => (
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
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Settings - NOW SECOND */}
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
                  <Tooltip content="Internal name for identifying this widget configuration in your dashboard" />
                </label>
                <Input
                  value={config.name}
                  onChange={(e) => {
                    setConfig({ ...config, name: e.target.value });
                    if (validationErrors.name) {
                      setValidationErrors({ ...validationErrors, name: '' });
                    }
                  }}
                  placeholder="My DPDPA Widget"
                  className={`transition-all focus:ring-2 focus:ring-blue-500 ${validationErrors.name ? 'border-red-500' : ''}`}
                />
                {validationErrors.name && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.name}
                  </p>
                )}
                {!validationErrors.name && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Internal name for identification
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Domain <span className="text-red-500">*</span>
                  <Tooltip content="The domain where this widget will be deployed (e.g., example.com). Do not include https:// or www." />
                </label>
                <Input
                  value={config.domain}
                  onChange={(e) => {
                    setConfig({ ...config, domain: e.target.value });
                    if (validationErrors.domain) {
                      setValidationErrors({ ...validationErrors, domain: '' });
                    }
                  }}
                  placeholder="example.com"
                  className={`transition-all focus:ring-2 focus:ring-blue-500 font-mono text-sm ${validationErrors.domain ? 'border-red-500' : ''}`}
                />
                {validationErrors.domain && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.domain}
                  </p>
                )}
                {!validationErrors.domain && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    The domain where this widget will be deployed (without https://)
                  </p>
                )}
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

              {/* Supported Languages */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Globe className="h-4 w-4" />
                  Supported Languages
                  <Tooltip content="Select which languages will be available in the widget dropdown. Text will be automatically translated when users select a language." />
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-800">
                    <strong>🌐 Auto-Translation:</strong> When users select a language, all widget text will be automatically translated in real-time.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: 'en', name: 'English', flag: '🇬🇧' },
                    { code: 'hi', name: 'Hindi (हिंदी)', flag: '🇮🇳' },
                    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', flag: '🇮🇳' },
                    { code: 'te', name: 'Telugu (తెలుగు)', flag: '🇮🇳' },
                    { code: 'ta', name: 'Tamil (தமிழ்)', flag: '🇮🇳' },
                    { code: 'bn', name: 'Bengali (বাংলা)', flag: '🇮🇳' },
                    { code: 'mr', name: 'Marathi (मराठी)', flag: '🇮🇳' },
                    { code: 'gu', name: 'Gujarati (ગુજરાતી)', flag: '🇮🇳' },
                    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', flag: '🇮🇳' },
                    { code: 'ml', name: 'Malayalam (മലയാളം)', flag: '🇮🇳' },
                    { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', flag: '🇮🇳' },
                    { code: 'ur', name: 'Urdu (اردو)', flag: '🇮🇳' },
                  ].map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        const isSelected = config.supportedLanguages?.includes(lang.code);
                        if (isSelected) {
                          // Don't allow removing English
                          if (lang.code === 'en') {
                            toast.error('English is required and cannot be removed');
                            return;
                          }
                          setConfig({
                            ...config,
                            supportedLanguages: config.supportedLanguages?.filter(l => l !== lang.code) || []
                          });
                        } else {
                          setConfig({
                            ...config,
                            supportedLanguages: [...(config.supportedLanguages || []), lang.code]
                          });
                        }
                      }}
                      className={`flex items-center gap-2 p-3 border-2 rounded-lg transition-all ${
                        config.supportedLanguages?.includes(lang.code)
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="text-sm font-medium text-gray-700 flex-1 text-left">{lang.name}</span>
                      {config.supportedLanguages?.includes(lang.code) && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                      {lang.code === 'en' && (
                        <Badge className="bg-blue-600 text-white text-xs">Required</Badge>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Selected languages will appear in the widget dropdown. Users can switch languages and see auto-translated content.
                </p>
              </div>

            </CardContent>
          </Card>

          {/* Appearance */}
          <Accordion 
            title="Appearance & Theme" 
            defaultOpen={false}
            icon={<div className="p-2 bg-purple-100 rounded-lg"><Palette className="h-5 w-5 text-purple-600" /></div>}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-6">
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

              {/* Font Family Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Font Family
                  <Tooltip content="Choose the font family for your widget text. Google Fonts will be loaded automatically." />
                </label>
                <select
                  value={config.theme.fontFamily || fontFamilies[0].value}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      theme: { ...config.theme, fontFamily: e.target.value }
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {fontFamilies.map(font => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Brand Logo (Optional)
                  <Tooltip content="Upload your logo to display in the widget header. Recommended size: 120x40px, PNG or SVG format." />
                </label>
                <div className="flex items-center gap-3">
                  {config.theme.logoUrl && (
                    <div className="relative">
                      <img src={config.theme.logoUrl} alt="Logo" className="h-10 w-auto border border-gray-200 rounded" />
                      <button
                        onClick={() => setConfig({ ...config, theme: { ...config.theme, logoUrl: '' } })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  <Input
                    type="url"
                    value={config.theme.logoUrl || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        theme: { ...config.theme, logoUrl: e.target.value }
                      })
                    }
                    placeholder="https://example.com/logo.png"
                    className="flex-1 transition-all focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                  />
                </div>
                <p className="text-xs text-gray-500">Enter a URL to your logo image</p>
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-gray-500">LIVE PREVIEW</p>
                  {config.language !== 'en' && (
                    <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                      <Info className="h-3 w-3" />
                      <span className="text-xs font-medium">Static preview - Translation works in live widget</span>
                    </div>
                  )}
                </div>
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
                        {config.theme.logoUrl ? (
                          <img 
                            src={config.theme.logoUrl} 
                            alt="Brand Logo" 
                            className="h-8 w-auto object-contain"
                            onError={(e) => {
                              // Fallback to icon if image fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: config.theme.primaryColor }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 11l3 3L22 4"/>
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                            </svg>
                          </div>
                        )}
                        <span className="font-bold text-sm">{config.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <select 
                          value={config.language}
                          onChange={(e) => setConfig({ ...config, language: e.target.value })}
                          className="text-xs px-2 py-1 border rounded-lg cursor-pointer bg-white"
                          style={{ borderColor: '#e5e7eb' }}
                        >
                          {(config.supportedLanguages || ['en']).map(code => {
                            const langMap: Record<string, {flag: string, name: string}> = {
                              en: { flag: '🇬🇧', name: 'English' },
                              hi: { flag: '🇮🇳', name: 'हिंदी' },
                              pa: { flag: '🇮🇳', name: 'ਪੰਜਾਬੀ' },
                              te: { flag: '🇮🇳', name: 'తెలుగు' },
                              ta: { flag: '🇮🇳', name: 'தமிழ்' },
                              bn: { flag: '🇮🇳', name: 'বাংলা' },
                              mr: { flag: '🇮🇳', name: 'मराठी' },
                              gu: { flag: '🇮🇳', name: 'ગુજરાતી' },
                              kn: { flag: '🇮🇳', name: 'ಕನ್ನಡ' },
                              ml: { flag: '🇮🇳', name: 'മലയാളം' },
                              or: { flag: '🇮🇳', name: 'ଓଡ଼ିଆ' },
                              ur: { flag: '🇮🇳', name: 'اردو' }
                            };
                            const lang = langMap[code] || { flag: '🌐', name: code };
                            return <option key={code} value={code}>{lang.flag} {lang.name}</option>;
                          })}
                        </select>
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
                      <p className="text-xs opacity-70 mb-2">{config.message}</p>
                      {config.selectedActivities.length > 0 && (
                        <div className="space-y-1">
                          {config.selectedActivities.slice(0, 2).map((actId, idx) => {
                            const activity = activities.find(a => a.id === actId);
                            return activity ? (
                              <div key={actId} className="text-xs opacity-50">
                                {idx + 1}. {activity.activity_name}
                              </div>
                            ) : null;
                          })}
                          {config.selectedActivities.length > 2 && (
                            <div className="text-xs opacity-50">... and {config.selectedActivities.length - 2} more</div>
                          )}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>

                    {/* Preview Full Notice Button */}
                    <button
                      onClick={generatePrivacyNoticePreview}
                      disabled={config.selectedActivities.length === 0}
                      className="w-full mb-3 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      style={{ 
                        backgroundColor: config.selectedActivities.length > 0 ? config.theme.primaryColor : '#e5e7eb',
                        color: config.selectedActivities.length > 0 ? '#fff' : '#6b7280',
                        cursor: config.selectedActivities.length > 0 ? 'pointer' : 'not-allowed',
                        opacity: config.selectedActivities.length > 0 ? 1 : 0.6
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview Full Privacy Notice
                    </button>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={downloadPrivacyNotice}
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
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3">
                      <p className="text-xs text-red-600">⚠ Please complete both requirements to proceed</p>
                    </div>

                    {/* Powered by Consently */}
                    {config.showBranding && (
                      <div className="pt-2 border-t border-gray-200 text-center">
                        <a 
                          href="https://consently.app" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1"
                        >
                          Powered by <span className="font-semibold">Consently</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

          {/* Behavior Settings */}
          <Accordion 
            title="Behavior Settings" 
            defaultOpen={false}
            icon={<div className="p-2 bg-green-100 rounded-lg"><Zap className="h-5 w-5 text-green-600" /></div>}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Play className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">Auto Show Widget</p>
                        <Tooltip content="When enabled, the widget will automatically appear after the specified delay. When disabled, you'll need to trigger it programmatically." />
                      </div>
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
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  Consent Duration: {config.consentDuration} days
                  <Tooltip content="How long the user's consent will be remembered before asking again (30-730 days)" />
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">Respect Do Not Track</p>
                        <Tooltip content="When enabled, the widget will not display if the user has Do Not Track (DNT) enabled in their browser" />
                      </div>
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
            </div>
          </Accordion>

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
                Choose your platform and copy the code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {config.widgetId ? (
                <>
                  {/* Platform Tabs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { id: 'html', label: 'HTML', icon: '🌐' },
                      { id: 'wordpress', label: 'WordPress', icon: '📝' },
                      { id: 'shopify', label: 'Shopify', icon: '🛒' },
                      { id: 'wix', label: 'Wix', icon: '🎨' },
                      { id: 'react', label: 'React', icon: '⚛️' },
                    ].map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id as any)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedPlatform === platform.id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                        }`}
                      >
                        <span className="mr-1">{platform.icon}</span>
                        {platform.label}
                      </button>
                    ))}
                  </div>

                  {/* Code Block */}
                  <div className="relative group">
                    <div className="bg-gray-900 text-gray-100 p-5 rounded-xl text-xs font-mono overflow-x-auto border border-gray-700 shadow-inner max-h-64">
                      <pre className="leading-relaxed">{getPlatformSpecificCode(selectedPlatform)}</pre>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                        {selectedPlatform.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(getPlatformSpecificCode(selectedPlatform));
                      setCopySuccess(true);
                      toast.success('✅ Code copied to clipboard!', {
                        description: `${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} integration code copied successfully.`
                      });
                      setTimeout(() => setCopySuccess(false), 3000);
                    }}
                    className="w-full shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 animate-bounce" />
                        Copied Successfully!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Code
                      </>
                    )}
                  </Button>

                  {/* Usage Statistics */}
                  {widgetStats && (
                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        Usage Statistics
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{widgetStats.weeklyConsents}</div>
                          <div className="text-xs text-gray-600 mt-1">This Week</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-600">{widgetStats.totalConsents}</div>
                          <div className="text-xs text-gray-600 mt-1">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{widgetStats.conversionRate}%</div>
                          <div className="text-xs text-gray-600 mt-1">Conversion</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Installation Guide */}
                  <div className="bg-blue-100 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900 flex items-start gap-2">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {selectedPlatform === 'html' && 'Paste this code just before the closing </body> tag on your website.'}
                        {selectedPlatform === 'wordpress' && 'Add this to your theme\'s footer.php or use a plugin like "Insert Headers and Footers".'}
                        {selectedPlatform === 'shopify' && 'Go to Online Store > Themes > Actions > Edit Code > theme.liquid. Place before </body> tag. For production, upload the widget file to Shopify (Settings > Files) to use their CDN.'}
                        {selectedPlatform === 'wix' && 'Go to Settings > Custom Code, click "+ Add Custom Code", and set to load on all pages.'}
                        {selectedPlatform === 'react' && 'Import and use the ConsentlyWidget component in your app layout or _app.js file.'}
                      </span>
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

          {/* Privacy Notice Compliance */}
          <Card className="shadow-sm border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="border-b border-green-200">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span>Privacy Notice Compliance</span>
              </CardTitle>
              <CardDescription className="text-green-900/70">
                DPDPA 2023 Requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Requirements Checklist */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Scroll Requirement</h4>
                    <p className="text-xs text-gray-600 mt-1">Users must scroll through entire privacy notice</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Download Requirement</h4>
                    <p className="text-xs text-gray-600 mt-1">Privacy notice must be downloaded before consent</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Progress Indicator</h4>
                    <p className="text-xs text-gray-600 mt-1">Visual progress bar shows completion status</p>
                  </div>
                </div>
              </div>

              {/* Version Tracking */}
              <div className="p-4 bg-white rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-green-600" />
                  Version Tracking
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Current Version:</span>
                    <Badge className="bg-green-100 text-green-700">
                      {config.privacyNoticeVersion || 'v1.0'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900 font-medium">
                      {config.privacyNoticeLastUpdated 
                        ? new Date(config.privacyNoticeLastUpdated).toLocaleDateString()
                        : 'Not set'
                      }
                    </span>
                  </div>
                  {config.requiresReconsent && (
                    <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-900 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Re-consent required after notice update
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Update Privacy Notice */}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-green-300 hover:bg-green-50"
                onClick={() => {
                  const newVersion = prompt('Enter new version number (e.g., v1.1, v2.0):', config.privacyNoticeVersion || 'v1.0');
                  if (newVersion) {
                    setConfig({
                      ...config,
                      privacyNoticeVersion: newVersion,
                      privacyNoticeLastUpdated: new Date().toISOString(),
                      requiresReconsent: true
                    });
                    toast.success('Privacy notice version updated', {
                      description: 'Existing users will be prompted to re-consent'
                    });
                  }
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Update Privacy Notice Version
              </Button>
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
