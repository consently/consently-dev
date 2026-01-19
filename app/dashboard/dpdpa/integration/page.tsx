'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Copy, 
  CheckCircle, 
  Globe,
  Rocket,
  FileCode,
  Terminal,
  Eye,
  ExternalLink,
  AlertCircle,
  Settings,
  BarChart3,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { MobileIntegration } from '@/components/dpdpa/MobileIntegration';

interface WidgetConfig {
  widget_id: string;
  name: string;
  domain: string;
  is_active: boolean;
  selected_activities: any[];
}

export default function IntegrationPage() {
  const [configs, setConfigs] = useState<WidgetConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string>('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/dpdpa/widget-config');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedConfig(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to load widget configurations');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(''), 2000);
  };

  const getEmbedCode = (widgetId: string) => {
    // Always use production URL for widget script
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://www.consently.in';
return `<!-- Consently DPDPA Widget -->
<script defer src="${widgetUrl}/dpdpa-widget.js" 
        data-dpdpa-widget-id="${widgetId}"
        data-dpdpa-email="{{user_email}}"><!-- optional: pass the logged-in user's email -->
</script>`;
  };

  const getReactExample = (widgetId: string) => {
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://www.consently.in';
    return `'use client';

import { useEffect } from 'react';

function ConsentlyWidget() {
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[data-dpdpa-widget-id="${widgetId}"]');
    if (existingScript) {
      console.log('[Consently] Widget script already loaded');
      return;
    }

    const script = document.createElement('script');
    script.src = '${widgetUrl}/dpdpa-widget.js';
    script.setAttribute('data-dpdpa-widget-id', '${widgetId}');
    script.async = true;
    document.body.appendChild(script);

    // Listen to consent events
    const handleConsent = (event) => {
      const { status, acceptedActivities } = event.detail;
      console.log('Consent status:', status);
      console.log('Accepted activities:', acceptedActivities);
      
      // Enable features based on consent
      if (acceptedActivities.includes('analytics-id')) {
        initializeAnalytics();
      }
    };

    window.addEventListener('consentlyDPDPAConsent', handleConsent);

    return () => {
      window.removeEventListener('consentlyDPDPAConsent', handleConsent);
      // Safely remove script if it exists
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}

export default ConsentlyWidget;`;
  };

  const getNextJsExample = (widgetId: string) => {
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://www.consently.in';
    return `// components/ConsentlyWidget.tsx
'use client';

import { useEffect } from 'react';

function ConsentlyWidget() {
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[data-dpdpa-widget-id="${widgetId}"]');
    if (existingScript) {
      console.log('[Consently] Widget script already loaded');
      return;
    }

    const script = document.createElement('script');
    script.src = '${widgetUrl}/dpdpa-widget.js';
    script.setAttribute('data-dpdpa-widget-id', '${widgetId}');
    script.async = true;
    document.body.appendChild(script);

    // Listen to consent events
    const handleConsent = (event) => {
      const consent = event.detail;
      console.log('Consent received:', consent.status);
      
      // Update your app based on consent
      if (consent.acceptedActivities.includes('marketing-id')) {
        // Enable marketing features
      }
    };

    window.addEventListener('consentlyDPDPAConsent', handleConsent);

    return () => {
      window.removeEventListener('consentlyDPDPAConsent', handleConsent);
      // Safely remove script if it exists
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return null;
}

export default ConsentlyWidget;

// Then use in your layout.tsx:
// import ConsentlyWidget from '@/components/ConsentlyWidget';
// 
// export default function RootLayout({ children }) {
//   return (
//     <html>
//       <body>
//         {children}
//         <ConsentlyWidget />
//       </body>
//     </html>
//   );
// }`;
  };

  const getWordPressExample = (widgetId: string) => {
    const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://www.consently.in';
    return `<!-- Add to your WordPress theme's footer.php before </body> -->
<!-- Or use a plugin like "Insert Headers and Footers" -->

<!-- Consently DPDPA Widget -->
<script src="${widgetUrl}/dpdpa-widget.js" 
        data-dpdpa-widget-id="${widgetId}">
</script>

<script>
// Optional: Handle consent events
window.addEventListener('consentlyDPDPAConsent', function(event) {
  var consent = event.detail;
  console.log('DPDPA Consent Status:', consent.status);
  
  // Example: Load Google Analytics only with consent
  if (consent.acceptedActivities.includes('analytics-activity-id')) {
    // Load your analytics script here
  }
});
</script>`;
  };

  const getAPIExample = (widgetId: string) => {
    return `// JavaScript API Examples

// 1. Show consent widget manually
window.consentlyDPDPA.show();

// 2. Get current consent status
const consent = window.consentlyDPDPA.getConsent();
if (consent && consent.status === 'accepted') {
  console.log('User has accepted consent');
  console.log('Accepted activities:', consent.acceptedActivities);
}

// 3. Clear consent (for testing or withdrawal)
window.consentlyDPDPA.clearConsent();

// 4. Withdraw consent (clears and shows widget again)
window.consentlyDPDPA.withdraw();

// 5. Listen to consent updates
window.addEventListener('consentlyDPDPAConsent', function(event) {
  const { status, acceptedActivities, rejectedActivities } = event.detail;
  
  // Update your application state
  if (acceptedActivities.includes('marketing-activity-id')) {
    enableMarketingFeatures();
  }
  
  if (rejectedActivities.includes('analytics-activity-id')) {
    disableAnalytics();
  }
});`;
  };

  const getTestingExample = () => {
    return `// Testing Your Integration

// 1. Clear stored consent for fresh testing
localStorage.clear();
// or specifically:
localStorage.removeItem('consently_dpdpa_consent_${selectedConfig?.widget_id}');

// 2. Force show widget
window.consentlyDPDPA.show();

// 3. Check if widget loaded
console.assert(typeof window.consentlyDPDPA !== 'undefined', 'Widget loaded');

// 4. Test consent storage
window.consentlyDPDPA.clearConsent();
console.assert(window.consentlyDPDPA.getConsent() === null, 'Consent cleared');

// 5. Monitor network requests
// Open DevTools → Network tab
// Look for:
// - GET /api/dpdpa/widget-public/${selectedConfig?.widget_id}
// - POST /api/dpdpa/consent-record

// 6. Test on different devices
// - Desktop browser
// - Mobile browser
// - Different screen sizes`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integration guide...</p>
        </div>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Widget Integration</h1>
          <p className="text-gray-600 mt-2">
            Integrate DPDPA consent notices into your website
          </p>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Widget Configuration Found</h3>
            <p className="text-gray-600 mb-6">
              Create a widget configuration first to get integration code
            </p>
            <Button onClick={() => window.location.href = '/dashboard/dpdpa/widget'}>
              <Plus className="mr-2 h-4 w-4" />
              Configure Widget
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Widget Integration</h1>
        <p className="text-gray-600 mt-2">
          Integrate DPDPA consent notices into your website with a simple script tag
        </p>
      </div>

      {/* Widget Selector */}
      {configs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Widget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {configs.map((config) => (
                <Button
                  key={config.widget_id}
                  variant={selectedConfig?.widget_id === config.widget_id ? 'default' : 'outline'}
                  onClick={() => setSelectedConfig(config)}
                >
                  {config.name}
                  <Badge variant={config.is_active ? 'default' : 'secondary'} className="ml-2">
                    {config.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedConfig && (
        <>
          {/* Quick Start */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Quick Start</CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                Copy and paste this code before the closing &lt;/body&gt; tag of your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Embed Code</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(getEmbedCode(selectedConfig.widget_id), 'Embed code')}
                  >
                    {copied === 'Embed code' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                  <code>{getEmbedCode(selectedConfig.widget_id)}</code>
                </pre>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="bg-blue-100 p-2 rounded">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Domain</h4>
                    <p className="text-xs text-gray-600">{selectedConfig.domain}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="bg-blue-100 p-2 rounded">
                    <Code className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Widget ID</h4>
                    <p className="text-xs text-gray-600 font-mono">{selectedConfig.widget_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="bg-blue-100 p-2 rounded">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Activities</h4>
                    <p className="text-xs text-gray-600">{selectedConfig.selected_activities?.length || 0} selected</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform-Specific Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Platform-Specific Integration</CardTitle>
              <CardDescription>
                Choose your platform or framework for specific integration examples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                {/* Temporarily simplified - tabs component missing */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Standard HTML/JavaScript</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getEmbedCode(selectedConfig.widget_id), 'HTML code')}
                      >
                        {copied === 'HTML code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                      <code>{getEmbedCode(selectedConfig.widget_id)}</code>
                    </pre>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">React Integration</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getReactExample(selectedConfig.widget_id), 'React code')}
                      >
                        {copied === 'React code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                      <code>{getReactExample(selectedConfig.widget_id)}</code>
                    </pre>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Next.js Integration</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getNextJsExample(selectedConfig.widget_id), 'Next.js code')}
                      >
                        {copied === 'Next.js code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                      <code>{getNextJsExample(selectedConfig.widget_id)}</code>
                    </pre>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">WordPress Integration</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getWordPressExample(selectedConfig.widget_id), 'WordPress code')}
                      >
                        {copied === 'WordPress code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                      <code>{getWordPressExample(selectedConfig.widget_id)}</code>
                    </pre>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">JavaScript API</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(getAPIExample(selectedConfig.widget_id), 'API code')}
                      >
                        {copied === 'API code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                      <code>{getAPIExample(selectedConfig.widget_id)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile App SDK Integration */}
          <MobileIntegration widgetId={selectedConfig.widget_id} domain={selectedConfig.domain} />

          {/* Testing & Verification */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-gray-600" />
                <CardTitle>Testing & Verification</CardTitle>
              </div>
              <CardDescription>
                Test your integration before going live
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Testing Code</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(getTestingExample(), 'Testing code')}
                  >
                    {copied === 'Testing code' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    Copy
                  </Button>
                </div>
                <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                  <code>{getTestingExample()}</code>
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Checklist Before Going Live
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Widget loads without errors</li>
                    <li>✓ All processing activities display correctly</li>
                    <li>✓ Consent can be accepted/rejected</li>
                    <li>✓ Consent persists on page reload</li>
                    <li>✓ Domain matches your website</li>
                    <li>✓ Works on mobile devices</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Common Issues
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Widget not showing: Check widget ID</li>
                    <li>• CORS errors: Verify domain configuration</li>
                    <li>• Styling conflicts: Adjust z-index or custom CSS</li>
                    <li>• Not recording: Check browser console</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4" onClick={() => window.location.href = '/dashboard/dpdpa/widget'}>
                  <Settings className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Widget Settings</div>
                    <div className="text-xs text-gray-500">Customize appearance</div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4" onClick={() => window.location.href = '/dashboard/dpdpa/activities'}>
                  <FileCode className="h-5 w-5 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Processing Activities</div>
                    <div className="text-xs text-gray-500">Manage activities</div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4" asChild>
                  <a href="/docs/DPDPA_WIDGET_IMPLEMENTATION.md" target="_blank">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Full Documentation</div>
                      <div className="text-xs text-gray-500">Complete guide</div>
                    </div>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
