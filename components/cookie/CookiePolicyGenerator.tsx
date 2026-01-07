'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Download, Eye, Wand2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { AIPolicyGenerator } from '@/lib/ai/policy-generator';

interface ScannedCookie {
  id: string;
  name: string;
  domain: string;
  category: 'necessary' | 'functional' | 'analytics' | 'advertising';
  expiry: string;
  description: string;
}

interface CookiePolicyGeneratorProps {
  scannedCookies: ScannedCookie[];
  scannedUrl: string;
  onClose: () => void;
}

const categoryDescriptions = {
  necessary: {
    title: 'Essential Cookies',
    description: 'These cookies are strictly necessary for the website to function and cannot be disabled in our systems. They are usually only set in response to actions made by you which amount to a request for services.',
    examples: ['User authentication', 'Shopping cart contents', 'Security tokens']
  },
  functional: {
    title: 'Functional Cookies',
    description: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.',
    examples: ['Language preferences', 'Remembering user choices', 'Customized content']
  },
  analytics: {
    title: 'Analytics Cookies',
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.',
    examples: ['Google Analytics', 'Page view tracking', 'User behavior analysis']
  },
  advertising: {
    title: 'Advertising Cookies',
    description: 'These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information but are based on uniquely identifying your browser and internet device.',
    examples: ['Google Ads', 'Facebook Pixel', 'Retargeting campaigns']
  }
};

export function CookiePolicyGenerator({ scannedCookies, scannedUrl, onClose }: CookiePolicyGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [policyContent, setPolicyContent] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [policyDate, setPolicyDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('generate');
  const [useAI, setUseAI] = useState(true); // AI is enabled by default

  const generatePolicy = async () => {
    setIsGenerating(true);
    try {
      // Show loading toast
      toast.loading(useAI ? 'Generating AI-powered policy...' : 'Generating policy...');

      let policy: string;
      
      if (useAI && scannedCookies.length > 0) {
        // Use AI to generate policy
        policy = await AIPolicyGenerator.generatePolicy(scannedCookies, {
          companyName: companyName || getHostname(scannedUrl),
          contactEmail: contactEmail || 'privacy@example.com',
          websiteUrl: scannedUrl,
          jurisdiction: 'global'
        });
      } else {
        // Fallback to template-based generation
        const cookiesByCategory = scannedCookies.reduce((acc, cookie) => {
          if (!acc[cookie.category]) {
            acc[cookie.category] = [];
          }
          acc[cookie.category].push(cookie);
          return acc;
        }, {} as Record<string, ScannedCookie[]>);

        policy = generatePolicyContent(cookiesByCategory, companyName, contactEmail);
      }

      setPolicyContent(policy);
      setActiveTab('preview');
      toast.success(useAI ? 'AI-powered policy generated successfully!' : 'Policy generated successfully!');
    } catch (error) {
      console.error('Policy generation error:', error);
      toast.error(useAI ? 'Failed to generate AI policy. Using template...' : 'Failed to generate policy');
      
      // Fallback to template if AI fails
      if (useAI) {
        try {
          const cookiesByCategory = scannedCookies.reduce((acc, cookie) => {
            if (!acc[cookie.category]) {
              acc[cookie.category] = [];
            }
            acc[cookie.category].push(cookie);
            return acc;
          }, {} as Record<string, ScannedCookie[]>);

          const policy = generatePolicyContent(cookiesByCategory, companyName, contactEmail);
          setPolicyContent(policy);
          setActiveTab('preview');
          toast.success('Policy generated using template!');
        } catch (fallbackError) {
          toast.error('Failed to generate policy');
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePolicyContent = (cookiesByCategory: Record<string, ScannedCookie[]>, company: string, email: string) => {
    const siteName = company || getHostname(scannedUrl);
    const contact = email || 'privacy@example.com';
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let policy = `# Cookie Policy for ${siteName}

**Last Updated:** ${currentDate}

## Introduction

${siteName} uses cookies and similar technologies to enhance your experience on our website. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.

This policy applies to all users of ${siteName} (${scannedUrl}) and complies with applicable data protection laws, including the General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act (DPDPA) 2023.

## What Are Cookies?

Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners.

## How We Use Cookies

We use cookies for several purposes:
- To ensure the website functions properly
- To remember your preferences and settings
- To understand how you interact with our website
- To provide personalized content and advertising
- To analyze website traffic and usage patterns

## Types of Cookies We Use

Based on our recent scan, we use the following types of cookies:
`;

    // Add category sections
    Object.entries(categoryDescriptions).forEach(([category, info]) => {
      const cookies = cookiesByCategory[category] || [];
      if (cookies.length > 0) {
        policy += `
### ${info.title}

${info.description}

**Examples of purposes:**
${info.examples.map(example => `- ${example}`).join('\n')}

**Specific ${category.toLowerCase()} cookies we use:**
`;

        cookies.forEach(cookie => {
          policy += `- **${cookie.name}** (${cookie.domain}): ${cookie.description || 'Used for ' + category + ' purposes'} (Expires: ${cookie.expiry})
`;
        });
      }
    });

    // Add third-party cookies section
    const thirdPartyCookies = scannedCookies.filter(cookie => !cookie.domain.includes(getHostname(scannedUrl)));
    if (thirdPartyCookies.length > 0) {
      policy += `
## Third-Party Cookies

We also use cookies set by third-party service providers to help us understand how our website is being used and to provide additional services to you. The following third-party cookies may be used:

`;

      thirdPartyCookies.forEach(cookie => {
        policy += `- **${cookie.name}** by ${cookie.domain}: ${cookie.description || 'Third-party service cookie'}
`;
      });
    }

    // Add cookie management section
    policy += `
## Managing Your Cookie Preferences

You have the right to accept or reject cookies. You can exercise your cookie preferences in the following ways:

### Through Our Cookie Banner
When you first visit our website, you will be presented with a cookie banner where you can:
- Accept all cookies
- Reject non-essential cookies
- Customize your cookie preferences by category

### Through Your Browser Settings
Most web browsers allow you to control cookies through their settings. The help section of your browser or the website "www.allaboutcookies.org" provides information about how to manage cookies.

### Common Browser Controls
- **Chrome:** Settings > Privacy and security > Cookies and other site data
- **Firefox:** Options > Privacy & Security > Cookies and Site Data
- **Safari:** Preferences > Privacy > Cookies and website data
- **Edge:** Settings > Privacy, search, and services > Cookies

## Cookie Lifespan

Cookies can be categorized based on their duration:
- **Session Cookies:** These are temporary cookies that are erased when you close your browser.
- **Persistent Cookies:** These remain on your device for a set period or until you delete them.

## Your Rights

Under applicable data protection laws, you have the following rights regarding cookies:
- The right to be informed about the cookies we use
- The right to access information about cookies
- The right to withdraw consent at any time
- The right to lodge a complaint with a supervisory authority

## Changes to This Cookie Policy

We may update this Cookie Policy from time to time to reflect changes in our use of cookies or in applicable law. We will notify you of any significant changes by posting the new policy on our website and updating the "Last Updated" date.

## Contact Us

If you have any questions about this Cookie Policy or our use of cookies, please contact us:

- **Website:** ${scannedUrl}
- **Email:** ${contact}
- **Effective Date:** ${currentDate}

---

This Cookie Policy was generated by Consently's AI Cookie Policy Generator based on a comprehensive scan of ${scannedCookies.length} cookies found on our website.
`;

    return policy;
  };

  const getHostname = (url: string): string => {
    if (!url || url.trim() === '') {
      return 'your website';
    }
    
    try {
      let urlToParse = url.trim();
      if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
        urlToParse = `https://${urlToParse}`;
      }
      
      const urlObj = new URL(urlToParse);
      return urlObj.hostname;
    } catch (error) {
      return url.length > 50 ? url.substring(0, 47) + '...' : url || 'your website';
    }
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 6;
      let yPosition = margin;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize = 11, isBold = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }

        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        
        lines.forEach((line: string) => {
          if (yPosition > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        
        return yPosition;
      };

      // Add title
      addText('Cookie Policy', 20, true);
      yPosition += 5;

      // Add company name
      addText(`For ${companyName || getHostname(scannedUrl)}`, 14, true);
      yPosition += 5;

      // Add date
      addText(`Generated on ${new Date().toLocaleDateString()}`, 10);
      yPosition += 10;

      // Process policy content
      const lines = policyContent.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('# ')) {
          // Main heading
          addText(line.substring(2), 16, true);
          yPosition += 3;
        } else if (line.startsWith('## ')) {
          // Sub heading
          addText(line.substring(3), 14, true);
          yPosition += 2;
        } else if (line.startsWith('### ')) {
          // Sub sub heading
          addText(line.substring(4), 12, true);
          yPosition += 2;
        } else if (line.startsWith('**') && line.endsWith('**')) {
          // Bold text
          addText(line.replace(/\*\*/g, ''), 11, true);
        } else if (line.startsWith('- ')) {
          // Bullet point
          const bulletText = line.substring(2);
          addText('• ' + bulletText, 11);
        } else if (line.trim() === '') {
          // Empty line
          yPosition += 3;
        } else {
          // Regular text
          addText(line, 11);
        }
      }

      // Add footer
      const finalY = yPosition + 20;
      if (finalY < doc.internal.pageSize.getHeight() - margin) {
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          'This policy was generated by Consently - DPDPA 2023 Compliance Platform',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        );
      }

      // Save the PDF
      const filename = `cookie-policy-${(companyName || getHostname(scannedUrl)).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`;
      doc.save(filename);
      
      toast.success('Cookie policy exported to PDF!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(policyContent);
      toast.success('Policy copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getCategoryCount = (category: string) => {
    return scannedCookies.filter((cookie) => cookie.category === category).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Cookie Policy Generator
              </CardTitle>
              <CardDescription>
                Generate a comprehensive cookie policy based on your scanned cookies
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              if (value === 'preview' || value === 'export') {
                if (policyContent) {
                  setActiveTab(value);
                }
              } else {
                setActiveTab(value);
              }
            }} 
            defaultValue="generate"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className={!policyContent ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
              >
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="export" 
                className={!policyContent ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
              >
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              {/* Cookie Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{scannedCookies.length}</div>
                  <div className="text-sm text-gray-600">Total Cookies</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold">{getCategoryCount('necessary')}</div>
                  <div className="text-sm text-green-600">Necessary</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold">{getCategoryCount('functional')}</div>
                  <div className="text-sm text-blue-600">Functional</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold">{getCategoryCount('analytics')}</div>
                  <div className="text-sm text-yellow-600">Analytics</div>
                </div>
              </div>

              {/* Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="privacy@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="policyDate">Policy Date</Label>
                  <Input
                    id="policyDate"
                    type="date"
                    value={policyDate}
                    onChange={(e) => setPolicyDate(e.target.value)}
                  />
                </div>
                
                {/* AI Toggle */}
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <Label htmlFor="useAI" className="text-sm font-medium text-purple-900">
                      Enhanced AI Generation
                    </Label>
                  </div>
                  <input
                    type="checkbox"
                    id="useAI"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>
                
                {useAI && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>AI Enhancement:</strong> Generate a comprehensive, professional policy with detailed explanations and legal compliance features.
                    </p>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generatePolicy} 
                disabled={isGenerating || scannedCookies.length === 0}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {useAI ? 'Generating AI Policy...' : 'Generating Policy...'}
                  </>
                ) : (
                  <>
                    {useAI ? <Sparkles className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {useAI ? 'Generate AI-Enhanced Policy' : 'Generate Standard Policy'}
                  </>
                )}
              </Button>

              {scannedCookies.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    No cookies found. Please scan a website first to generate a policy.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Policy Preview</h3>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <FileText className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </div>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{policyContent}</pre>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Export Options</CardTitle>
                    <CardDescription>
                      Download your cookie policy in different formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={exportToPDF} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Export as PDF
                    </Button>
                    <Button variant="outline" onClick={copyToClipboard} className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                  </CardContent>
                </Card>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Policy Features</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      GDPR and DPDPA 2023 compliant
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {useAI ? 'AI-powered detailed descriptions' : 'Detailed cookie descriptions'}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Third-party cookie disclosures
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      User rights and management options
                    </li>
                    {useAI && (
                      <li className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        Professional legal language
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
