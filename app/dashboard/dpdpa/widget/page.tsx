'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Modal } from '@/components/ui/modal';
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
  BarChart3,
  Trash2,
  X,
  Route,
  Edit,
  ChevronUp,
  ChevronDown,
  TestTube,
  Filter,
  FileText,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { LogoUploader } from '@/components/ui/logo-uploader';

interface Purpose {
  id: string;
  purposeId: string;
  purposeName: string;
  legalBasis: 'consent' | 'contract' | 'legal-obligation' | 'legitimate-interest';
  customDescription?: string;
  dataCategories: Array<{
    id: string;
    categoryName: string;
    retentionPeriod: string;
  }>;
}

interface ProcessingActivity {
  id: string;
  activityName: string;
  industry: string;
  purposes: Purpose[];
  dataSources: string[];
  dataRecipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  purpose?: string;
  retentionPeriod?: string;
  dataAttributes?: string[];
}

interface DisplayRule {
  id: string;
  rule_name: string;
  url_pattern: string;
  url_match_type: 'exact' | 'contains' | 'startsWith' | 'regex';
  trigger_type: 'onPageLoad' | 'onClick' | 'onFormSubmit' | 'onScroll';
  trigger_delay?: number;
  element_selector?: string;
  scroll_threshold?: number; // Scroll percentage (0-100) for onScroll trigger
  activities?: string[];
  activity_purposes?: Record<string, string[]>; // { activity_id: [purpose_id_1, purpose_id_2] } - filter purposes per activity
  notice_content?: {
    title?: string;
    message?: string;
    html?: string;
  };
  priority: number;
  is_active: boolean;
  notice_id?: string;
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
  displayRules?: DisplayRule[];
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
    supportedLanguages: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as'],
    displayRules: []
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
  const [previewLanguage, setPreviewLanguage] = useState<string>('en');
  const [translatedPreviewContent, setTranslatedPreviewContent] = useState<any>(null);
  const [translatingPreview, setTranslatingPreview] = useState(false);
  const [editingRule, setEditingRule] = useState<DisplayRule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleTestUrl, setRuleTestUrl] = useState('');
  const [complianceStatus, setComplianceStatus] = useState<{
    requirementsMet: number;
    totalRequirements: number;
    isCompliant: boolean;
    lastChecked?: Date;
  }>({ requirementsMet: 0, totalRequirements: 3, isCompliant: false });
  const [preferenceCentreStats, setPreferenceCentreStats] = useState<{
    totalVisitors: number;
    activeUsers: number;
    lastAccess?: Date;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
            
            // Fetch preference centre stats
            try {
              const prefStatsRes = await fetch(`/api/dpdpa/preference-centre-stats/${existingConfig.widget_id}`);
              if (prefStatsRes.ok) {
                const prefStatsData = await prefStatsRes.json();
                setPreferenceCentreStats(prefStatsData);
              }
            } catch (error) {
              console.error('Error fetching preference centre stats:', error);
            }
          }
          
          // Check compliance status
          checkComplianceStatus(existingConfig);
          
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
            supportedLanguages: existingConfig.supported_languages || ['en', 'hi', 'pa', 'te', 'ta'],
            privacyNoticeVersion: existingConfig.privacy_notice_version,
            privacyNoticeLastUpdated: existingConfig.privacy_notice_last_updated,
            requiresReconsent: existingConfig.requires_reconsent,
            displayRules: existingConfig.display_rules || []
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
    // Filter out invalid activity IDs before saving
    const activityIds = new Set(activities.map(a => a.id));
    const validSelectedActivities = config.selectedActivities.filter(id => activityIds.has(id));
    
    // Update config with only valid activities for validation
    const configToSave = {
      ...config,
      selectedActivities: validSelectedActivities
    };

    // Validate with cleaned config
    const errors: {[key: string]: string} = {};
    
    if (validSelectedActivities.length === 0) {
      errors.activities = 'Select at least one processing activity';
    }
    
    if (!configToSave.domain || configToSave.domain.trim() === '') {
      errors.domain = 'Domain is required';
    } else if (configToSave.domain.includes('http') || configToSave.domain.includes('www')) {
      errors.domain = 'Remove http://, https://, and www from domain';
    }
    
    if (!configToSave.name || configToSave.name.trim() === '') {
      errors.name = 'Widget name is required';
    }
    
    if (!configToSave.title || configToSave.title.trim() === '') {
      errors.title = 'Title is required';
    }
    
    if (!configToSave.message || configToSave.message.trim() === '') {
      errors.message = 'Message is required';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      if (!silent) {
        toast.error('Please fix the validation errors before saving');
      }
      return;
    }

    setSaving(true);

    try {
      const method = configToSave.widgetId ? 'PUT' : 'POST';
      const body = configToSave.widgetId 
        ? { 
            widgetId: configToSave.widgetId, 
            ...configToSave,
            displayRules: configToSave.displayRules || []
          }
        : {
            ...configToSave,
            displayRules: configToSave.displayRules || []
          };

      const response = await fetch('/api/dpdpa/widget-config', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      // Update config with cleaned activities and new widget ID if created
      setConfig(prev => ({
        ...prev,
        ...(data.widgetId && !prev.widgetId ? { widgetId: data.widgetId } : {}),
        selectedActivities: validSelectedActivities
      }));

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

  // Display Rules Management Functions
  const handleAddRule = () => {
    // Check limit (50 rules per widget)
    if (config.displayRules && config.displayRules.length >= 50) {
      toast.error('Maximum limit reached', {
        description: 'You can have a maximum of 50 display rules per widget. Please delete some rules before adding new ones.',
      });
      return;
    }

    const newRule: DisplayRule = {
      id: `rule_${Date.now()}`,
      rule_name: 'New Display Rule',
      url_pattern: '',
      url_match_type: 'contains',
      trigger_type: 'onFormSubmit', // Default: Show widget before form submission
      trigger_delay: 0, // No delay for form submit by default
      scroll_threshold: 50, // Default scroll threshold
      priority: 100,
      is_active: true,
      activities: [],
      notice_content: {
        title: '',
        message: '',
        html: ''
      }
    };
    setEditingRule(newRule);
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: DisplayRule) => {
    setEditingRule({ ...rule });
    setShowRuleModal(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this display rule?')) {
      setConfig(prev => ({
        ...prev,
        displayRules: (prev.displayRules || []).filter(r => r.id !== ruleId)
      }));
      toast.success('Display rule deleted');
    }
  };

  const handleSaveRule = (rule: DisplayRule) => {
    // Clean up rule: remove empty notice_content fields and ensure proper structure
    const cleanedRule: DisplayRule = {
      ...rule,
      notice_content: rule.notice_content && (
        rule.notice_content.title || 
        rule.notice_content.message || 
        rule.notice_content.html
      ) ? {
        ...(rule.notice_content.title ? { title: rule.notice_content.title } : {}),
        ...(rule.notice_content.message ? { message: rule.notice_content.message } : {}),
        ...(rule.notice_content.html ? { html: rule.notice_content.html } : {})
      } : undefined,
      activities: rule.activities && rule.activities.length > 0 ? rule.activities : undefined,
      // Clean up activity_purposes: remove empty arrays and empty objects
      activity_purposes: (() => {
        if (!rule.activity_purposes || Object.keys(rule.activity_purposes).length === 0) {
          return undefined;
        }
        // Remove activities with empty purpose arrays (empty = show all, so we can remove it)
        const cleaned: Record<string, string[]> = {};
        for (const [activityId, purposes] of Object.entries(rule.activity_purposes)) {
          // Only include if purposes array is not empty (empty means show all, so we skip it)
          if (purposes && purposes.length > 0) {
            cleaned[activityId] = purposes;
          }
        }
        // Return undefined if cleaned object is empty
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
      })(),
      element_selector: rule.element_selector || undefined,
      trigger_delay: rule.trigger_delay || undefined,
    };
    
    setConfig(prev => {
      const existingRules = prev.displayRules || [];
      const existingIndex = existingRules.findIndex(r => r.id === cleanedRule.id);
      
      if (existingIndex >= 0) {
        // Update existing rule
        const updatedRules = [...existingRules];
        updatedRules[existingIndex] = cleanedRule;
        return { ...prev, displayRules: updatedRules };
      } else {
        // Add new rule
        return { ...prev, displayRules: [...existingRules, cleanedRule] };
      }
    });
    setShowRuleModal(false);
    setEditingRule(null);
    setRuleTestUrl('');
    toast.success('Display rule saved');
  };

  const handleMoveRule = (ruleId: string, direction: 'up' | 'down') => {
    setConfig(prev => {
      const rules = [...(prev.displayRules || [])];
      const index = rules.findIndex(r => r.id === ruleId);
      
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === rules.length - 1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const newPriority = rules[newIndex].priority;
      rules[newIndex].priority = rules[index].priority;
      rules[index].priority = newPriority;
      
      // Sort by priority (higher first)
      rules.sort((a, b) => b.priority - a.priority);
      
      return { ...prev, displayRules: rules };
    });
  };

  const testRuleMatch = (rule: DisplayRule, testUrl: string): boolean => {
    if (!testUrl || !rule.url_pattern) return false;
    
    switch (rule.url_match_type) {
      case 'exact':
        return testUrl === rule.url_pattern;
      case 'contains':
        return testUrl.includes(rule.url_pattern);
      case 'startsWith':
        return testUrl.startsWith(rule.url_pattern);
      case 'regex':
        try {
          return new RegExp(rule.url_pattern).test(testUrl);
        } catch {
          return false;
        }
      default:
        return false;
    }
  };

  const handleDeleteWidget = async () => {
    if (!config.widgetId) {
      toast.error('No widget to delete');
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/dpdpa/widget-config?widgetId=${config.widgetId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete widget');
      }

      toast.success('✅ Widget deleted successfully');
      
      // Reset config to initial state
      setConfig({
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
        supportedLanguages: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur', 'as']
      });
      setShowDeleteConfirm(false);
      setWidgetStats(null);
      setPreferenceCentreStats(null);
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast.error('❌ ' + (error instanceof Error ? error.message : 'Failed to delete widget'));
    } finally {
      setDeleting(false);
    }
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
        return `// React/Next.js Installation\n'use client';\n\nimport { useEffect } from 'react';\n\nfunction ConsentlyWidget() {\n  useEffect(() => {\n    // Check if script is already loaded\n    const existingScript = document.querySelector('script[data-dpdpa-widget-id="${widgetId}"]');\n    if (existingScript) {\n      console.log('[Consently] Widget script already loaded');\n      return;\n    }\n\n    const script = document.createElement('script');\n    script.src = '${baseUrl}/dpdpa-widget.js';\n    script.setAttribute('data-dpdpa-widget-id', '${widgetId}');\n    script.async = true;\n    document.body.appendChild(script);\n\n    return () => {\n      // Safely remove script if it exists\n      if (script.parentNode) {\n        script.parentNode.removeChild(script);\n      }\n    };\n  }, []);\n\n  return null;\n}\n\nexport default ConsentlyWidget;`;
      
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
        activity.activityName.toLowerCase().includes(activitySearch.toLowerCase()) ||
        activity.purposes.some(p => p.purposeName.toLowerCase().includes(activitySearch.toLowerCase()));
      
      // Industry filter
      const matchesFilter = activityFilter === 'all' || activity.industry === activityFilter;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (activitySort === 'name') {
        return a.activityName.localeCompare(b.activityName);
      } else {
        return a.industry.localeCompare(b.industry);
      }
    });

  // Get unique industries for filter dropdown
  const uniqueIndustries = Array.from(new Set(activities.map(a => a.industry))).sort();

  // Calculate valid selected activities count (only count activities that actually exist)
  const validSelectedActivitiesCount = useMemo(() => {
    const activityIds = new Set(activities.map(a => a.id));
    return config.selectedActivities.filter(id => activityIds.has(id)).length;
  }, [config.selectedActivities, activities]);

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
    
    const activitySections = activities.map((activity, index) => {
      const purposes = activity.purposes || [];
      const purposesList = purposes.length > 0 
        ? purposes.map(p => `<li>${escapeHtml(p.purposeName || 'Unknown Purpose')} (${escapeHtml((p.legalBasis || 'consent').replace('-', ' '))})</li>`).join('')
        : '<li>No purposes defined</li>';
      
      const allDataCategories = purposes.flatMap(p => 
        (p.dataCategories || []).map(cat => cat.categoryName)
      );
      const dataCategoriesText = allDataCategories.length > 0 
        ? allDataCategories.map(c => escapeHtml(c)).join(', ')
        : 'N/A';
      
      const retentionPeriods = purposes.flatMap(p => 
        (p.dataCategories || []).map(cat => `${cat.categoryName}: ${cat.retentionPeriod || 'N/A'}`)
      );
      const retentionText = retentionPeriods.length > 0 
        ? retentionPeriods.map(r => escapeHtml(r)).join(', ')
        : 'N/A';

      return `
      <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
          ${index + 1}. ${escapeHtml(activity.activityName)}
        </h3>
        
        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Purposes:</strong>
          <ul style="margin: 4px 0 0 0; color: #6b7280; padding-left: 20px;">
            ${purposesList}
          </ul>
        </div>

        <div style="margin-bottom: 12px;">
          <strong style="color: #374151;">Data Categories:</strong>
          <p style="margin: 4px 0 0 0; color: #6b7280;">${dataCategoriesText}</p>
        </div>

        <div>
          <strong style="color: #374151;">Retention Periods:</strong>
          <p style="margin: 4px 0 0 0; color: #6b7280;">${retentionText}</p>
        </div>
      </div>
      `;
    }).join('');

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
  
  // Translate preview content to selected language
  const translatePreviewContent = async (targetLang: string) => {
    if (targetLang === 'en') {
      setTranslatedPreviewContent(null);
      return;
    }
    
    setTranslatingPreview(true);
    
    try {
      const textsToTranslate = [
        config.title,
        config.message,
        config.acceptButtonText,
        config.rejectButtonText,
        config.customizeButtonText,
        'Download Privacy Notice',
        'Proceed to Consent'
      ];
      
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: textsToTranslate,
          target: targetLang,
          source: 'en'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.translations) {
          setTranslatedPreviewContent({
            title: data.translations[0],
            message: data.translations[1],
            acceptButtonText: data.translations[2],
            rejectButtonText: data.translations[3],
            customizeButtonText: data.translations[4],
            downloadButtonText: data.translations[5],
            proceedButtonText: data.translations[6]
          });
          toast.success(`Preview translated to ${targetLang.toUpperCase()}`);
        }
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate preview');
      setTranslatedPreviewContent(null);
    } finally {
      setTranslatingPreview(false);
    }
  };
  
  // Handle preview language change
  const handlePreviewLanguageChange = async (lang: string) => {
    setPreviewLanguage(lang);
    await translatePreviewContent(lang);
  };

  // Check compliance status
  const checkComplianceStatus = (configData: any) => {
    let requirementsMet = 0;
    const totalRequirements = 3;
    
    // Check 1: Privacy notice version exists
    if (configData.privacy_notice_version) {
      requirementsMet++;
    }
    
    // Check 2: Privacy notice last updated exists
    if (configData.privacy_notice_last_updated) {
      requirementsMet++;
    }
    
    // Check 3: Selected activities exist
    if (configData.selected_activities && configData.selected_activities.length > 0) {
      requirementsMet++;
    }
    
    setComplianceStatus({
      requirementsMet,
      totalRequirements,
      isCompliant: requirementsMet === totalRequirements,
      lastChecked: new Date()
    });
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
  
  const updatePrivacyNoticeVersion = async () => {
    const currentVersion = config.privacyNoticeVersion || 'v1.0';
    const versionMatch = currentVersion.match(/v(\d+)\.(\d+)/);
    let newVersion = 'v1.1';
    
    if (versionMatch) {
      const major = parseInt(versionMatch[1]);
      const minor = parseInt(versionMatch[2]);
      newVersion = `v${major}.${minor + 1}`;
    }
    
    const confirmed = window.confirm(
      `Update privacy notice version to ${newVersion}?\n\nThis will require existing users to re-consent.`
    );
    
    if (!confirmed) return;
    
    setConfig({
      ...config,
      privacyNoticeVersion: newVersion,
      privacyNoticeLastUpdated: new Date().toISOString(),
      requiresReconsent: true
    });
    
    toast.success('Privacy notice version updated', {
      description: 'Existing users will be prompted to re-consent'
    });
  };
  
  const copyPreferenceCentreUrl = () => {
    const url = `${window.location.origin}/privacy-centre/${config.widgetId || '{widgetId}'}?visitorId={visitorId}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
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
                  <Button 
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Widget
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete DPDPA Widget?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will permanently delete your widget and all associated data:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
                  <li>Widget configuration and settings</li>
                  <li>All consent records for this widget</li>
                  <li>All grievance/data subject rights requests</li>
                  <li>Analytics and stats data</li>
                  <li>Integration code will stop working</li>
                </ul>
                <p className="text-sm font-semibold text-red-600">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleDeleteWidget}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Display Rule Edit Modal */}
      {editingRule && (
        <Modal
          open={showRuleModal}
          onClose={() => {
            setShowRuleModal(false);
            setEditingRule(null);
          }}
          title={editingRule.id.startsWith('rule_') && !config.displayRules?.find(r => r.id === editingRule.id) 
            ? 'Create Display Rule' 
            : 'Edit Display Rule'}
          size="xl"
        >
          <div className="space-y-6">
              {/* Quick Info Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-1">Display Rule Quick Guide</h5>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Display rules let you show different consent notices on different pages. Configure the URL pattern, 
                      trigger type, and optionally filter which activities/purposes to show.
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Basic Information</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editingRule.rule_name}
                      onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                      placeholder="e.g., Careers Page Notice"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={editingRule.priority}
                      onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 100 })}
                      min="0"
                      max="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Higher priority rules are evaluated first (0-1000)</p>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={editingRule.is_active}
                      onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Only active rules are evaluated</p>
                </div>
              </div>

              {/* URL Matching */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-purple-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Route className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">URL Matching</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL Pattern <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={editingRule.url_pattern}
                      onChange={(e) => setEditingRule({ ...editingRule, url_pattern: e.target.value })}
                      placeholder="e.g., /careers or /contact"
                    />
                    <p className="text-xs text-gray-500 mt-1">The URL pattern to match against</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Match Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingRule.url_match_type}
                      onChange={(e) => setEditingRule({ ...editingRule, url_match_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="contains">Contains</option>
                      <option value="exact">Exact Match</option>
                      <option value="startsWith">Starts With</option>
                      <option value="regex">Regular Expression</option>
                    </select>
                  </div>
                </div>

                {/* Test URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test URL Match
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={ruleTestUrl}
                      onChange={(e) => setRuleTestUrl(e.target.value)}
                      placeholder="e.g., /careers or /contact/form"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const matches = testRuleMatch(editingRule, ruleTestUrl);
                        if (matches) {
                          toast.success('✅ URL matches this rule!');
                        } else {
                          toast.info('❌ URL does not match this rule');
                        }
                      }}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </div>
              </div>

              {/* Trigger Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-green-200">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Trigger Configuration</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trigger Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingRule.trigger_type}
                      onChange={(e) => setEditingRule({ ...editingRule, trigger_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="onFormSubmit">On Form Submit (Recommended)</option>
                      <option value="onPageLoad">On Page Load</option>
                      <option value="onClick">On Click</option>
                      <option value="onScroll">On Scroll</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {editingRule.trigger_type === 'onFormSubmit' && (
                        'Widget shows before any form submission. Auto-detects all forms if no selector provided.'
                      )}
                      {editingRule.trigger_type === 'onPageLoad' && (
                        'Widget shows immediately when the page loads.'
                      )}
                      {editingRule.trigger_type === 'onClick' && (
                        'Widget shows when user clicks a specific element. Requires element selector.'
                      )}
                      {editingRule.trigger_type === 'onScroll' && (
                        'Widget shows when user scrolls to a certain threshold.'
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trigger Delay (ms)
                    </label>
                    <Input
                      type="number"
                      value={editingRule.trigger_delay || 1000}
                      onChange={(e) => setEditingRule({ ...editingRule, trigger_delay: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="60000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Delay before showing widget (0-60000ms)</p>
                  </div>
                </div>

                {(editingRule.trigger_type === 'onClick' || editingRule.trigger_type === 'onFormSubmit') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Element Selector (CSS) {editingRule.trigger_type === 'onFormSubmit' && <span className="text-gray-500 font-normal">(Optional)</span>}
                      {editingRule.trigger_type === 'onClick' && <span className="text-red-500">*</span>}
                    </label>
                    <Input
                      value={editingRule.element_selector || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, element_selector: e.target.value })}
                      placeholder={editingRule.trigger_type === 'onFormSubmit' ? 'e.g., form#contact-form (leave empty to auto-detect all forms)' : 'e.g., #submit-button or .cta-button'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editingRule.trigger_type === 'onFormSubmit' 
                        ? 'Optional: Target a specific form. If empty, widget will intercept ALL form submissions on the page.'
                        : 'CSS selector for the element to trigger on click'}
                    </p>
                  </div>
                )}

                {editingRule.trigger_type === 'onScroll' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scroll Threshold (%)
                    </label>
                    <Input
                      type="number"
                      value={editingRule.scroll_threshold !== undefined ? editingRule.scroll_threshold : 50}
                      onChange={(e) => setEditingRule({ ...editingRule, scroll_threshold: parseInt(e.target.value) || 50 })}
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Show widget when user scrolls to this percentage of the page (0-100). Default: 50%</p>
                  </div>
                )}
              </div>

              {/* Activity Filtering */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-orange-200">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Filter className="h-5 w-5 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Activity Filtering</h4>
                  <HelpCircle className="h-4 w-4 text-gray-400 ml-auto cursor-help" title="Select specific activities to show in this rule" />
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    <strong>ℹ️ Important:</strong> Select which activities to show when this rule triggers. Leave all unchecked to show all activities.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-900">
                      Select Activities <span className="text-xs font-normal text-gray-500">(Leave empty to show all)</span>
                    </label>
                    <div className="text-xs text-gray-500">
                      {(editingRule.activities || []).length > 0 ? (
                        <span className="text-orange-600 font-medium">
                          {(editingRule.activities || []).length} selected
                        </span>
                      ) : (
                        <span>All activities will be shown</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-80 overflow-y-auto bg-white shadow-sm">
                    {activities.length === 0 ? (
                      <div className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No activities available</p>
                        <p className="text-xs text-gray-400 mt-1">Add activities to your widget first</p>
                      </div>
                    ) : (
                      activities.map((activity) => {
                        const isSelected = (editingRule.activities || []).includes(activity.id);
                        return (
                          <div
                            key={activity.id}
                            className={`p-4 transition-all ${
                              isSelected 
                                ? 'bg-orange-50 border-l-4 border-l-orange-500' 
                                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                            }`}
                          >
                            <label className="flex items-start gap-3 cursor-pointer group">
                              <Checkbox
                                checked={isSelected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const currentActivities = editingRule.activities || [];
                                  const currentActivityPurposes = editingRule.activity_purposes || {};
                                  
                                  if (checked) {
                                    setEditingRule({ 
                                      ...editingRule, 
                                      activities: [...currentActivities, activity.id]
                                    });
                                  } else {
                                    const { [activity.id]: removed, ...restPurposes } = currentActivityPurposes;
                                    setEditingRule({ 
                                      ...editingRule, 
                                      activities: currentActivities.filter(id => id !== activity.id),
                                      activity_purposes: Object.keys(restPurposes).length > 0 ? restPurposes : undefined
                                    });
                                  }
                                }}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1">
                                    <h6 className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                                      {activity.activityName}
                                    </h6>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        {activity.industry}
                                      </Badge>
                                      {activity.purposes && activity.purposes.length > 0 && (
                                        <span className="text-xs text-gray-500">
                                          {activity.purposes.length} {activity.purposes.length === 1 ? 'purpose' : 'purposes'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                    <span className="text-[10px] uppercase font-medium text-gray-500">ID:</span>
                                    <code className="text-xs text-gray-700 font-mono">
                                      {activity.id.slice(0, 8)}...
                                    </code>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(activity.id);
                                      toast.success(`Activity ID copied: ${activity.activityName}`);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                  >
                                    <Copy className="h-3 w-3" />
                                    Copy ID
                                  </button>
                                </div>
                              </div>
                            </label>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Purpose Filtering - NEW */}
              {(editingRule.activities && editingRule.activities.length > 0) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-pink-200">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-pink-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Purpose Filtering (Advanced)</h4>
                    <HelpCircle className="h-4 w-4 text-gray-400 ml-auto cursor-help" title="Fine-tune which purposes to show for each activity" />
                  </div>
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                    <p className="text-sm text-pink-800">
                      <strong>💡 Tip:</strong> Select specific purposes to show for each activity. Leave "Show all purposes" checked to display all purposes for an activity.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {editingRule.activities.map((activityId) => {
                      const activity = activities.find(a => a.id === activityId);
                      if (!activity || !activity.purposes || activity.purposes.length === 0) return null;
                      
                      const selectedPurposes = editingRule.activity_purposes?.[activityId];
                      // If selectedPurposes is undefined or empty array, show all purposes
                      // If selectedPurposes has values, show only those purposes
                      const isAllPurposesSelected = !selectedPurposes || selectedPurposes.length === 0;
                      
                      return (
                        <div key={activityId} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">{activity.activityName}</h5>
                            <Badge variant="secondary">{activity.industry}</Badge>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <Checkbox
                                checked={isAllPurposesSelected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const currentActivityPurposes = editingRule.activity_purposes || {};
                                  if (checked) {
                                    // Show all purposes (remove from activity_purposes or set to empty)
                                    const { [activityId]: removed, ...rest } = currentActivityPurposes;
                                    setEditingRule({
                                      ...editingRule,
                                      activity_purposes: Object.keys(rest).length > 0 ? rest : undefined
                                    });
                                  } else {
                                    // Select all purposes by default (user wants to filter, so start with all selected)
                                    const allPurposeIds = activity.purposes.map(p => p.id);
                                    setEditingRule({
                                      ...editingRule,
                                      activity_purposes: { ...currentActivityPurposes, [activityId]: allPurposeIds }
                                    });
                                  }
                                }}
                              />
                              <span className="text-sm font-medium text-gray-700">Show all purposes</span>
                              {isAllPurposesSelected && (
                                <Badge variant="outline" className="ml-auto text-xs text-green-600">
                                  {activity.purposes.length} purposes
                                </Badge>
                              )}
                            </label>
                            {!isAllPurposesSelected && selectedPurposes && (
                              <div className="ml-6 space-y-2 border-l-2 border-blue-200 pl-4 bg-blue-50/50 rounded p-2">
                                <p className="text-xs text-blue-700 font-medium mb-2">
                                  Filtering: {selectedPurposes.length} of {activity.purposes.length} purposes
                                </p>
                                {activity.purposes.map((purpose) => (
                                  <label key={purpose.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded">
                                    <Checkbox
                                      checked={selectedPurposes.includes(purpose.id)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const currentActivityPurposes = editingRule.activity_purposes || {};
                                        const currentPurposes = currentActivityPurposes[activityId] || [];
                                        
                                        if (checked) {
                                          setEditingRule({
                                            ...editingRule,
                                            activity_purposes: {
                                              ...currentActivityPurposes,
                                              [activityId]: [...currentPurposes, purpose.id]
                                            }
                                          });
                                        } else {
                                          const newPurposes = currentPurposes.filter(id => id !== purpose.id);
                                          // If no purposes selected, remove from activity_purposes (show all)
                                          if (newPurposes.length === 0) {
                                            const { [activityId]: removed, ...rest } = currentActivityPurposes;
                                            setEditingRule({
                                              ...editingRule,
                                              activity_purposes: Object.keys(rest).length > 0 ? rest : undefined
                                            });
                                          } else {
                                            setEditingRule({
                                              ...editingRule,
                                              activity_purposes: {
                                                ...currentActivityPurposes,
                                                [activityId]: newPurposes
                                              }
                                            });
                                          }
                                        }
                                      }}
                                    />
                                    <span className="text-sm text-gray-700">{purpose.purposeName}</span>
                                    <Badge variant="outline" className="ml-auto text-xs">
                                      {purpose.legalBasis.replace('-', ' ')}
                                    </Badge>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notice Content Override */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-200">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Notice Content (Optional)</h4>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Override the default widget title, message, or HTML content for this rule. Leave empty to use default widget content.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Title
                    </label>
                    <Input
                      value={editingRule.notice_content?.title || ''}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        notice_content: { 
                          ...(editingRule.notice_content || {}), 
                          title: e.target.value || undefined
                        }
                      })}
                      placeholder="Leave empty to use default title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Message
                    </label>
                    <Textarea
                      value={editingRule.notice_content?.message || ''}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        notice_content: { 
                          ...(editingRule.notice_content || {}), 
                          message: e.target.value || undefined
                        }
                      })}
                      placeholder="Leave empty to use default message"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom HTML Content
                    </label>
                    <Textarea
                      value={editingRule.notice_content?.html || ''}
                      onChange={(e) => setEditingRule({
                        ...editingRule,
                        notice_content: { 
                          ...(editingRule.notice_content || {}), 
                          html: e.target.value || undefined
                        }
                      })}
                      placeholder="Custom HTML for privacy notice (optional)"
                      rows={5}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-gray-500 mt-1">HTML content will override the generated privacy notice</p>
                  </div>
                </div>
              </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRuleModal(false);
                  setEditingRule(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editingRule.rule_name || !editingRule.url_pattern) {
                    toast.error('Please fill in required fields (Rule Name and URL Pattern)');
                    return;
                  }
                  handleSaveRule(editingRule);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Rule
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Activities</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-2">{validSelectedActivitiesCount}</p>
                  <p className="text-xs text-indigo-700 mt-1">Configured</p>
                </div>
                <div className="p-3 bg-indigo-500 rounded-full">
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
                {validSelectedActivitiesCount > 0 ? (
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    {validSelectedActivitiesCount} selected
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
                              {activity.activityName}
                            </h4>
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                              {activity.industry}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {activity.purposes.map(p => p.purposeName).join(', ') || 'No purposes configured'}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {activity.purposes.flatMap(p => p.dataCategories.map(cat => cat.categoryName)).map((categoryName, i) => (
                              <span
                                key={i}
                                className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-md font-medium text-gray-700"
                              >
                                {categoryName}
                              </span>
                            ))}
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

          {/* Display Rules Management - NEW SECTION */}
          <Card className="shadow-sm hover:shadow-md transition-shadow border-blue-200">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Route className="h-5 w-5 text-blue-600" />
                    </div>
                    Display Rules
                  </CardTitle>
                  <CardDescription>
                    Configure page-specific notices and activity/purpose filtering based on URL patterns
                    {config.displayRules && config.displayRules.length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({config.displayRules.length}/50 rules)
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {config.displayRules && config.displayRules.length >= 45 && (
                    <span className="text-xs text-orange-600 font-medium">
                      {config.displayRules.length}/50 rules
                    </span>
                  )}
                  <Button
                    onClick={handleAddRule}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                    disabled={config.displayRules && config.displayRules.length >= 50}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!config.displayRules || config.displayRules.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-100 rounded-full">
                      <Route className="h-10 w-10 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Display Rules</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Create display rules to show custom notices on specific pages or filter activities based on URL patterns
                  </p>
                  <Button onClick={handleAddRule} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...(config.displayRules || [])]
                    .sort((a, b) => b.priority - a.priority)
                    .map((rule, index) => (
                      <div
                        key={rule.id}
                        className={`border-2 rounded-xl p-4 transition-all ${
                          rule.is_active
                            ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-white shadow-sm'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                variant={rule.is_active ? 'default' : 'secondary'}
                                className={rule.is_active ? 'bg-blue-600' : 'bg-gray-400'}
                              >
                                {rule.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <h4 className="font-semibold text-gray-900">{rule.rule_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                Priority: {rule.priority}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                              <div>
                                <span className="font-medium">URL Pattern:</span>{' '}
                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                  {rule.url_pattern || '(empty)'}
                                </code>
                              </div>
                              <div>
                                <span className="font-medium">Match Type:</span>{' '}
                                <span className="capitalize">{rule.url_match_type}</span>
                              </div>
                              <div>
                                <span className="font-medium">Trigger:</span>{' '}
                                <span className="capitalize">{rule.trigger_type}</span>
                                {rule.trigger_type === 'onScroll' && rule.scroll_threshold !== undefined && (
                                  <span className="text-gray-500 ml-1">({rule.scroll_threshold}%)</span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Activities:</span>{' '}
                                {rule.activities && rule.activities.length > 0
                                  ? `${rule.activities.length} selected`
                                  : 'All activities'}
                              </div>
                              {rule.activity_purposes && Object.keys(rule.activity_purposes).length > 0 && (
                                <div>
                                  <span className="font-medium">Purposes:</span>{' '}
                                  <span className="text-blue-600">Filtered ({Object.keys(rule.activity_purposes).length} activities)</span>
                                </div>
                              )}
                            </div>
                            {rule.notice_content && (rule.notice_content.title || rule.notice_content.message) && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-blue-900">
                                  <span className="font-medium">Custom Notice:</span>{' '}
                                  {rule.notice_content.title || rule.notice_content.message || 'Custom HTML content'}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-4">
                            <Tooltip content="Move up">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveRule(rule.id, 'up')}
                                disabled={index === 0}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Move down">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveRule(rule.id, 'down')}
                                disabled={index === (config.displayRules?.length || 0) - 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Edit rule">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRule(rule)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Delete rule">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              
              {config.displayRules && config.displayRules.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-900 flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Display Rules</strong> allow you to show custom notices on specific pages and filter activities.
                      Rules are evaluated in priority order (higher priority first). Only the first matching rule is applied.
                    </span>
                  </p>
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
                    { code: 'en', name: 'English', flag: '🇮🇳' },
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
                    { code: 'as', name: 'Assamese (অসমীয়া)', flag: '🇮🇳' },
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
                  <Tooltip content="Upload your logo to display in the widget header. Drag & drop or enter a URL. Recommended: 120x40px, PNG or SVG." />
                </label>
                <LogoUploader
                  value={config.theme.logoUrl || ''}
                  onChange={(url) =>
                    setConfig({
                      ...config,
                      theme: { ...config.theme, logoUrl: url }
                    })
                  }
                  maxSizeMB={2}
                />
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

              {/* Enhanced Live Preview with Real-time Sync */}
              <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Live Preview</p>
                      <p className="text-xs text-gray-600">Real-time widget preview</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {translatingPreview && (
                      <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg shadow-sm">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs font-semibold">Translating...</span>
                      </div>
                    )}
                    {!translatingPreview && previewLanguage !== 'en' && (
                      <div className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg shadow-sm">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs font-semibold">Translated</span>
                      </div>
                    )}
                    <button
                      onClick={() => handlePreviewLanguageChange('en')}
                      className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      title="Reset to English"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <div 
                  className="shadow-2xl max-w-md mx-auto overflow-hidden transition-all duration-300 hover:shadow-3xl"
                  style={{
                    backgroundColor: config.theme.backgroundColor,
                    color: config.theme.textColor,
                    borderRadius: `${config.theme.borderRadius}px`,
                    border: '2px solid rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Header - Enhanced Design */}
                  <div className="p-5 border-b-2 bg-gradient-to-br from-white via-blue-50 to-gray-50" style={{ borderColor: '#e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {config.theme.logoUrl ? (
                          <img 
                            src={config.theme.logoUrl} 
                            alt="Brand Logo" 
                            className="h-9 w-auto object-contain"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                            style={{ 
                              background: `linear-gradient(135deg, ${config.theme.primaryColor} 0%, ${config.theme.primaryColor}dd 100%)`,
                              boxShadow: `0 4px 8px ${config.theme.primaryColor}40`
                            }}
                          >
                            C
                          </div>
                        )}
                        <div>
                          <h2 className="font-extrabold text-xl m-0 mb-0.5" style={{ letterSpacing: '-0.02em' }}>Privacy Notice</h2>
                          <p className="text-[11px] text-gray-500 font-medium m-0">DPDPA 2023 Compliance</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select 
                          value={previewLanguage}
                          onChange={(e) => handlePreviewLanguageChange(e.target.value)}
                          disabled={translatingPreview}
                          className="text-xs px-2 py-1.5 border rounded-lg cursor-pointer bg-white hover:border-blue-400 transition-colors"
                          style={{ borderColor: '#e5e7eb', opacity: translatingPreview ? 0.5 : 1, fontSize: '11px' }}
                        >
                          {Array.from(new Set(config.supportedLanguages || ['en'])).map(code => {
                            const langMap: Record<string, {name: string}> = {
                              en: { name: 'English' },
                              hi: { name: 'हिंदी' },
                              pa: { name: 'ਪੰਜਾਬੀ' },
                              te: { name: 'తెలుగు' },
                              ta: { name: 'தமிழ்' },
                              bn: { name: 'বাংলা' },
                              mr: { name: 'मराठी' },
                              gu: { name: 'ગુજરાતી' },
                              kn: { name: 'ಕನ್ನಡ' },
                              ml: { name: 'മലയാളം' },
                              or: { name: 'ଓଡ଼ିଆ' },
                              ur: { name: 'اردو' },
                              as: { name: 'অসমীয়া' }
                            };
                            const lang = langMap[code] || { name: code };
                            return <option key={code} value={code}>{lang.name}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Main Content - Matching New Design */}
                  <div className="p-5">
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      {translatingPreview ? 'Translating...' : (translatedPreviewContent?.message || config.message)}
                    </p>

                    {/* Activities Table View - Enhanced */}
                    {config.selectedActivities.length > 0 && (
                      <div className="mb-4">
                        {/* Table Header */}
                        <div className="grid grid-cols-[auto_1fr_1.5fr] gap-3 mb-2 px-2">
                          <div className="w-5"></div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Purpose</div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Data Categories</div>
                        </div>
                        
                        {/* Table Body */}
                        <div className="space-y-2">
                          {config.selectedActivities.flatMap((actId) => {
                            const activity = activities.find(a => a.id === actId);
                            if (!activity || !activity.purposes || activity.purposes.length === 0) return [];
                            
                            // Create a row for each purpose within this activity
                            return activity.purposes.map((purpose, purposeIdx) => {
                              const dataCategories = purpose.dataCategories?.map(cat => cat.categoryName) || [];
                              const uniqueKey = `${actId}-${purpose.id || purposeIdx}`;
                              
                              return (
                                <div key={uniqueKey} className="grid grid-cols-[auto_1fr_1.5fr] gap-3 items-start p-2.5 border-2 rounded-lg bg-gradient-to-b from-white to-gray-50 hover:shadow-md transition-all" style={{ borderColor: '#e5e7eb' }}>
                                  <input 
                                    type="checkbox" 
                                    className="mt-0.5" 
                                    style={{ 
                                      width: '16px', 
                                      height: '16px',
                                      accentColor: config.theme.primaryColor,
                                      borderRadius: '3px'
                                    }} 
                                  />
                                  <div className="text-xs font-semibold text-gray-800 leading-tight pt-0.5">
                                    {purpose.purposeName || 'Unknown Purpose'}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {dataCategories.length > 0 ? (
                                      dataCategories.map((categoryName, i) => (
                                        <span key={i} className="text-[10px] px-2 py-0.5 bg-gray-100 border border-gray-200 rounded font-medium text-gray-700" style={{ fontSize: '9px' }}>
                                          {categoryName}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.5 text-gray-400 italic">No data categories</span>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })}
                        </div>
                      </div>
                    )}

                    {/* Manage Preferences Button - Enhanced & Prominent */}
                    <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-xl mb-3 border border-blue-300 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-[11px] text-blue-900 m-0 mb-1 leading-tight font-bold">
                            Manage Your Consent Preferences
                          </p>
                          <p className="text-[10px] text-gray-600 m-0 leading-tight">
                            You can change these settings at any time
                          </p>
                        </div>
                        <button
                          className="px-3.5 py-2 text-[11px] font-bold rounded-lg border-2 transition-all hover:shadow-lg flex items-center gap-1.5"
                          style={{ 
                            backgroundColor: 'white',
                            color: config.theme.primaryColor,
                            borderColor: config.theme.primaryColor
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
                          </svg>
                          Preference Centre
                        </button>
                      </div>
                    </div>

                    {/* Footer Links */}
                    <div className="p-2.5 bg-gray-50 rounded-lg mb-3">
                      <p className="text-[10px] text-gray-600 m-0 leading-relaxed">
                        If you have any grievances with how we process your personal data click <a href="#" style={{ color: config.theme.primaryColor }} className="underline font-medium">here</a>. If we are unable to resolve your grievance, you can also make a complaint to the Data Protection Board by clicking <a href="#" style={{ color: config.theme.primaryColor }} className="underline font-medium">here</a>.
                      </p>
                    </div>
                  </div>

                  {/* Footer Actions - Enhanced Design */}
                  <div className="px-5 py-4 border-t-2 bg-gradient-to-b from-gray-50 to-gray-100 flex gap-3 items-center" style={{ borderColor: '#e5e7eb', boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' }}>
                    <button
                      onClick={downloadPrivacyNotice}
                      className="p-2.5 bg-white border-2 rounded-xl transition-all hover:shadow-lg hover:scale-105"
                      style={{ borderColor: '#e5e7eb' }}
                      title="Download Privacy Notice"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                    <div className="flex-1 flex gap-2.5">
                      <button
                        className="flex-1 px-3 py-2.5 rounded-xl text-[11px] font-bold border-2 bg-gradient-to-b from-gray-50 to-gray-100 transition-all hover:shadow-md hover:scale-105"
                        style={{ color: config.theme.textColor, borderColor: '#e5e7eb' }}
                      >
                        Accept selected
                      </button>
                      <button
                        className="flex-1 px-3 py-2.5 rounded-xl text-[11px] font-bold text-white transition-all hover:shadow-lg hover:scale-105 shadow-md"
                        style={{ 
                          background: `linear-gradient(135deg, ${config.theme.primaryColor} 0%, ${config.theme.primaryColor}dd 100%)`,
                          boxShadow: `0 4px 8px ${config.theme.primaryColor}40`
                        }}
                      >
                        Accept all
                      </button>
                      <button
                        className="flex-1 px-3 py-2.5 rounded-xl text-[11px] font-bold bg-white border-2 transition-all hover:bg-gray-50 hover:scale-105"
                        style={{ borderColor: '#e5e7eb', color: config.theme.textColor }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Powered by Consently */}
                  {config.showBranding && (
                    <div className="px-5 py-2 text-center border-t bg-gray-50" style={{ borderColor: '#e5e7eb' }}>
                      <p className="text-[10px] text-gray-400 m-0">
                        Powered by <a href="https://consently.in" target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: config.theme.primaryColor }}>Consently</a>
                      </p>
                    </div>
                  )}
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span>Privacy Notice Compliance</span>
                  </CardTitle>
                  <CardDescription className="text-green-900/70">
                    DPDPA 2023 Requirements
                  </CardDescription>
                </div>
                <Badge className={complianceStatus.isCompliant ? 'bg-green-600' : 'bg-orange-600'}>
                  {complianceStatus.requirementsMet}/{complianceStatus.totalRequirements} Met
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Compliance Status Bar */}
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Compliance Status</span>
                  <span className="text-xs text-gray-600">
                    {complianceStatus.isCompliant ? '✓ Fully Compliant' : '⚠ Needs Attention'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      complianceStatus.isCompliant ? 'bg-green-600' : 'bg-orange-500'
                    }`}
                    style={{ width: `${(complianceStatus.requirementsMet / complianceStatus.totalRequirements) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="space-y-3">
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                  config.privacyNoticeVersion ? 'bg-white border-green-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    config.privacyNoticeVersion ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {config.privacyNoticeVersion ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">Version Tracking</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Privacy notice version must be set and tracked
                    </p>
                    {!config.privacyNoticeVersion && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">⚠ Missing</p>
                    )}
                  </div>
                </div>
                
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                  config.selectedActivities.length > 0 ? 'bg-white border-green-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    config.selectedActivities.length > 0 ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {config.selectedActivities.length > 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">Processing Activities</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      At least one processing activity must be selected
                    </p>
                    {config.selectedActivities.length === 0 && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">⚠ None selected</p>
                    )}
                  </div>
                </div>

                <div className={`flex items-start gap-3 p-3 rounded-lg border ${
                  config.privacyNoticeLastUpdated ? 'bg-white border-green-200' : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    config.privacyNoticeLastUpdated ? 'bg-green-100' : 'bg-orange-100'
                  }`}>
                    {config.privacyNoticeLastUpdated ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">Last Updated Date</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Privacy notice last updated timestamp required
                    </p>
                    {!config.privacyNoticeLastUpdated && (
                      <p className="text-xs text-orange-600 mt-1 font-medium">⚠ Not set</p>
                    )}
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
                        ? new Date(config.privacyNoticeLastUpdated).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-green-300 hover:bg-green-50"
                  onClick={updatePrivacyNoticeVersion}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Version
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-green-300 hover:bg-green-50"
                  onClick={() => {
                    const selectedActivitiesData = activities.filter(a => config.selectedActivities.includes(a.id));
                    if (selectedActivitiesData.length === 0) {
                      toast.error('Please select at least one processing activity first');
                      return;
                    }
                    const html = generatePrivacyNoticeHTML(selectedActivitiesData, config.domain || 'your-domain.com');
                    setGeneratedPrivacyNotice(html);
                    setShowPrivacyNoticeModal(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
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
              {/* Widget Status */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-semibold text-gray-900">Widget Status</span>
                </div>
                <Badge variant={config.isActive ? 'default' : 'secondary'} className="shadow-sm">
                  {config.isActive ? '✓ Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Activities Count with Breakdown */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">Processing Activities</span>
                  </div>
                  <Badge className="bg-blue-600 shadow-sm">{config.selectedActivities.length}</Badge>
                </div>
                {config.selectedActivities.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {config.selectedActivities.slice(0, 3).map((activityId) => {
                      const activity = activities.find(a => a.id === activityId);
                      return activity ? (
                        <div key={activityId} className="text-xs text-gray-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          {activity.activityName}
                        </div>
                      ) : null;
                    })}
                    {config.selectedActivities.length > 3 && (
                      <div className="text-xs text-gray-500 italic">
                        +{config.selectedActivities.length - 3} more...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Widget Statistics */}
              {widgetStats && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                    Widget Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-600">Total Consents</div>
                      <div className="text-lg font-bold text-purple-700">{widgetStats.totalConsents}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">This Week</div>
                      <div className="text-lg font-bold text-purple-700">{widgetStats.weeklyConsents}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-600">Conversion Rate</div>
                      <div className="text-lg font-bold text-purple-700">
                        {widgetStats.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Widget ID */}
              {config.widgetId && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900">Widget ID</span>
                    <Badge variant="outline" className="text-xs">UUID</Badge>
                  </div>
                  <code className="text-xs bg-white px-2 py-1 rounded border border-purple-200 block overflow-x-auto">
                    {config.widgetId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(config.widgetId || '');
                      toast.success('Widget ID copied!');
                    }}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Widget ID
                  </Button>
                </div>
              )}

              {/* Last Saved */}
              {lastSaved && (
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 flex items-center justify-between">
                    <span>Last Saved:</span>
                    <span className="font-medium text-gray-900">
                      {lastSaved.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preference Center Info Card */}
          <Card className="shadow-sm border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-md">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <span>Preference Centre Integration</span>
                  </CardTitle>
                  <CardDescription className="text-blue-900/70">
                    Let users manage their consent preferences
                  </CardDescription>
                </div>
                <Badge className={config.widgetId ? 'bg-green-600' : 'bg-gray-400'}>
                  {config.widgetId ? '✓ Active' : 'Not Configured'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              {/* Integration Status */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  {config.widgetId ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Integration Status</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {config.widgetId 
                        ? 'Preference Centre is fully integrated and ready to use. Users can access it through the "Manage Preferences" button in the widget.'
                        : 'Please save your widget configuration to activate the Preference Centre integration.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Preference Centre URL */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Preference Centre URL</h4>
                    <p className="text-xs text-gray-600 mb-2">Users are directed to:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-gray-100 px-2 py-1.5 rounded border border-gray-200 block overflow-x-auto">
                        {typeof window !== 'undefined' 
                          ? `${window.location.origin}/privacy-centre/${config.widgetId || '{widgetId}'}?visitorId={visitorId}`
                          : '/privacy-centre/{widgetId}?visitorId={visitorId}'
                        }
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={copyPreferenceCentreUrl}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {preferenceCentreStats && (
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    Usage Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-600">Total Visitors</div>
                      <div className="text-lg font-bold text-blue-700">{preferenceCentreStats.totalVisitors || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Active Users</div>
                      <div className="text-lg font-bold text-blue-700">{preferenceCentreStats.activeUsers || 0}</div>
                    </div>
                    {preferenceCentreStats.lastAccess && (
                      <div className="col-span-2">
                        <div className="text-xs text-gray-600">Last Access</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(preferenceCentreStats.lastAccess).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Features List */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Features</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">Manage individual consent preferences</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">View consent history and timeline</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">Exercise DPDP Act rights (access, correction, deletion)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">Raise grievances and complaints</p>
                  </div>
                </div>
              </div>

              {/* Enhanced UX Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 text-white">
                <p className="text-xs font-semibold flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4" />
                  Enhanced User Experience
                </p>
                <p className="text-xs opacity-90">
                  Users can change their consent preferences at any time through the Preference Centre, ensuring full transparency and control over their personal data.
                </p>
              </div>
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
