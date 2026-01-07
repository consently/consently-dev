'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, FileText, Download, Eye, Wand2, AlertCircle, CheckCircle, Sparkles, ChevronDown, ChevronRight, Cookie, Shield, BarChart3, Target, Settings, Globe, Clock, Info, Check, X } from 'lucide-react';
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
    examples: ['User authentication', 'Shopping cart contents', 'Security tokens'],
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#10b981'
  },
  functional: {
    title: 'Functional Cookies',
    description: 'These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.',
    examples: ['Language preferences', 'Remembering user choices', 'Customized content'],
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6'
  },
  analytics: {
    title: 'Analytics Cookies',
    description: 'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site.',
    examples: ['Google Analytics', 'Page view tracking', 'User behavior analysis'],
    color: '#f59e0b',
    bgColor: '#fef3c7',
    borderColor: '#f59e0b'
  },
  advertising: {
    title: 'Advertising Cookies',
    description: 'These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information but are based on uniquely identifying your browser and internet device.',
    examples: ['Google Ads', 'Facebook Pixel', 'Retargeting campaigns'],
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444'
  }
};

export function CookiePolicyGenerator({ scannedCookies, scannedUrl, onClose }: CookiePolicyGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [policyContent, setPolicyContent] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [policyDate, setPolicyDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('settings');
  const [useAI, setUseAI] = useState(true); // AI is enabled by default
  const [categoryToggles, setCategoryToggles] = useState({
    necessary: true,
    functional: true,
    analytics: true,
    advertising: false
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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

| Cookie Name | Domain | Purpose | Expiry |
|-------------|--------|---------|--------|
`;

        cookies.forEach(cookie => {
          const purpose = cookie.description || 'Used for ' + category + ' purposes';
          const expiry = cookie.expiry || 'Session';
          policy += `| ${cookie.name} | ${cookie.domain} | ${purpose} | ${expiry} |
`;
        });
      }
    });

    // Add comprehensive cookie table
    policy += `
## Complete Cookie Inventory

The following table provides a comprehensive list of all cookies found on our website:

| Cookie Name | Domain | Category | Purpose | Expiry |
|-------------|--------|----------|---------|--------|
`;

    scannedCookies.forEach(cookie => {
      const purpose = cookie.description || 'No description available';
      const expiry = cookie.expiry || 'Session';
      const category = categoryDescriptions[cookie.category]?.title || cookie.category;
      policy += `| ${cookie.name} | ${cookie.domain} | ${category} | ${purpose} | ${expiry} |
`;
    });

    // Add third-party cookies section
    const thirdPartyCookies = scannedCookies.filter(cookie => !cookie.domain.includes(getHostname(scannedUrl)));
    if (thirdPartyCookies.length > 0) {
      policy += `
## Third-Party Cookies

We also use cookies set by third-party service providers to help us understand how our website is being used and to provide additional services to you. The following third-party cookies may be used:

| Cookie Name | Provider | Purpose |
|-------------|----------|---------|
`;

      thirdPartyCookies.forEach(cookie => {
        const purpose = cookie.description || 'Third-party service cookie';
        policy += `| ${cookie.name} | ${cookie.domain} | ${purpose} |
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

      // Helper function to add table
      const addTable = (headers: string[], rows: string[][], columnWidths: number[]) => {
        // Check if we need a new page
        if (yPosition > doc.internal.pageSize.getHeight() - margin - (rows.length + 2) * lineHeight) {
          doc.addPage();
          yPosition = margin;
        }

        // Add table headers
        let xPos = margin;
        headers.forEach((header, index) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(header, xPos, yPosition);
          xPos += columnWidths[index];
        });
        yPosition += lineHeight;

        // Add separator line
        doc.setLineWidth(0.1);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight;

        // Add table rows
        rows.forEach(row => {
          xPos = margin;
          row.forEach((cell, index) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const cellText = doc.splitTextToSize(cell, columnWidths[index] - 2);
            cellText.forEach((line: string, lineIndex: number) => {
              doc.text(line, xPos, yPosition + (lineIndex * lineHeight));
            });
            xPos += columnWidths[index];
          });
          yPosition += lineHeight;
        });

        // Add bottom line
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight + 5;

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
      let inTable = false;
      let tableHeaders: string[] = [];
      let tableRows: string[][] = [];
      
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
        } else if (line.startsWith('|') && line.endsWith('|')) {
          // Table row
          const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
          
          if (cells.length > 0 && !cells[0].includes('---')) {
            if (!inTable) {
              // First row - headers
              tableHeaders = cells;
              inTable = true;
            } else {
              // Data row
              tableRows.push(cells);
            }
          }
        } else if (line.trim() === '' && inTable) {
          // End of table
          if (tableHeaders.length > 0 && tableRows.length > 0) {
            // Calculate column widths (equal distribution)
            const columnWidths = tableHeaders.map(() => (pageWidth - margin * 2) / tableHeaders.length);
            yPosition = addTable(tableHeaders, tableRows, columnWidths);
          }
          inTable = false;
          tableHeaders = [];
          tableRows = [];
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

  const getCategoryCookies = (category: string) => {
    return scannedCookies.filter((cookie) => cookie.category === category);
  };

  const toggleCategory = (category: keyof typeof categoryToggles) => {
    if (category === 'necessary') return; // Necessary cookies cannot be disabled
    setCategoryToggles(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleRejectAll = () => {
    setCategoryToggles({
      necessary: true,
      functional: false,
      analytics: false,
      advertising: false
    });
  };

  const handleAcceptAll = () => {
    setCategoryToggles({
      necessary: true,
      functional: true,
      analytics: true,
      advertising: true
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'necessary': return <Shield className="h-5 w-5" />;
      case 'functional': return <Cookie className="h-5 w-5" />;
      case 'analytics': return <BarChart3 className="h-5 w-5" />;
      case 'advertising': return <Target className="h-5 w-5" />;
      default: return <Cookie className="h-5 w-5" />;
    }
  };

  const getProgressPercentage = () => {
    const enabledCategories = Object.values(categoryToggles).filter(Boolean).length;
    return (enabledCategories / Object.keys(categoryToggles).length) * 100;
  };

  const getSelectedCategoriesCount = () => {
    return Object.values(categoryToggles).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
                AI Cookie Policy Generator
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                Generate comprehensive cookie policies with AI-powered insights based on your scanned cookies
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose} className="hover:bg-gray-50">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
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
            defaultValue="settings"
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger 
                value="settings" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />
                Cookie Settings
              </TabsTrigger>
              <TabsTrigger 
                value="generate" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Policy
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className={`data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all ${
                  !policyContent ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="export" 
                className={`data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all ${
                  !policyContent ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <div className="space-y-6">
                {/* Header with Progress */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Privacy Preference Center</h3>
                    <p className="text-gray-600">Manage your cookie preferences. Click on categories to learn more.</p>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Categories Selected</span>
                      <span className="text-sm font-bold text-blue-600">{getSelectedCategoriesCount()} of 4</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cookie Categories */}
                <div className="space-y-4">
                  {Object.entries(categoryDescriptions).map(([category, info]) => {
                    const cookies = getCategoryCookies(category);
                    const isExpanded = expandedCategories.includes(category);
                    const isEnabled = categoryToggles[category as keyof typeof categoryToggles];
                    const isDisabled = category === 'necessary';
                    
                    return (
                      <Card 
                        key={category} 
                        className={`transition-all duration-300 overflow-hidden ${
                          isExpanded ? 'shadow-xl' : 'shadow-md hover:shadow-lg'
                        }`}
                        style={{
                          outline: isExpanded ? `2px solid ${info.borderColor}` : undefined,
                          outlineOffset: isExpanded ? '2px' : undefined
                        }}
                      >
                        <CardContent className="p-0">
                          <div 
                            className="flex items-center justify-between p-5 cursor-pointer transition-colors hover:bg-gray-50"
                            onClick={() => toggleCategoryExpansion(category)}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div 
                                className="p-3 rounded-xl shadow-sm"
                                style={{
                                  backgroundColor: info.bgColor,
                                  color: info.color
                                }}
                              >
                                {getCategoryIcon(category)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-semibold text-lg">{info.title}</h4>
                                  <Badge 
                                    variant="secondary" 
                                    className="text-sm px-3 py-1"
                                    style={{
                                      backgroundColor: info.bgColor,
                                      color: info.color,
                                      borderColor: info.borderColor
                                    }}
                                  >
                                    {cookies.length} cookies
                                  </Badge>
                                  {isDisabled && (
                                    <Badge variant="outline" className="text-xs">
                                      <Info className="h-3 w-3 mr-1" />
                                      Always Required
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">{info.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={(checked) => {
                                  toggleCategory(category as keyof typeof categoryToggles);
                                }}
                                disabled={isDisabled}
                                className="scale-110"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  toggleCategoryExpansion(category);
                                }}
                                className="hover:bg-gray-100"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-5 w-5" />
                                ) : (
                                  <ChevronRight className="h-5 w-5" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div 
                              className="border-t bg-gray-50"
                              style={{ borderColor: info.borderColor + '30' }}
                            >
                              <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-semibold text-base flex items-center gap-2">
                                    <Cookie className="h-4 w-4" style={{ color: info.color }} />
                                    Cookies in this category
                                  </h5>
                                  <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                                    {cookies.length} cookies
                                  </span>
                                </div>
                                
                                {cookies.length > 0 ? (
                                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                    {cookies.map((cookie) => (
                                      <div 
                                        key={cookie.id} 
                                        className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                              <span className="font-semibold text-base">{cookie.name}</span>
                                              <Badge 
                                                variant="outline" 
                                                className="text-xs font-mono"
                                                style={{ borderColor: info.borderColor, color: info.color }}
                                              >
                                                {cookie.domain}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                              {cookie.description || 'No description available'}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                              <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Expires: {cookie.expiry || 'Session'}
                                              </span>
                                              <span className="flex items-center gap-1">
                                                <Globe className="h-3 w-3" />
                                                {cookie.domain}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <Cookie className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                    <p className="text-sm text-gray-500">No cookies found in this category.</p>
                                  </div>
                                )}
                                
                                {info.examples.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                      <Info className="h-4 w-4" />
                                      Common purposes:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {info.examples.map((example, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                          {example}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <Separator className="my-6" />
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleRejectAll}
                    className="flex-1 h-12 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-colors"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject All
                  </Button>
                  <Button 
                    onClick={handleAcceptAll}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept All
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('generate')}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Save My Preferences
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-6">
              {/* Cookie Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Cookie className="h-6 w-6 text-gray-600" />
                    <span className="text-2xl font-bold text-gray-900">{scannedCookies.length}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Total Cookies</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Shield className="h-6 w-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-900">{getCategoryCount('necessary')}</span>
                  </div>
                  <div className="text-sm font-medium text-green-700">Necessary</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Cookie className="h-6 w-6 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-900">{getCategoryCount('functional')}</span>
                  </div>
                  <div className="text-sm font-medium text-blue-700">Functional</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-yellow-100 p-5 rounded-xl border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                    <span className="text-2xl font-bold text-amber-900">{getCategoryCount('analytics')}</span>
                  </div>
                  <div className="text-sm font-medium text-amber-700">Analytics</div>
                </div>
              </div>

              {/* Configuration */}
              <Card className="shadow-md">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Policy Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter your company name"
                        className="mt-2 h-11"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="privacy@example.com"
                        className="mt-2 h-11"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="policyDate" className="text-sm font-medium text-gray-700">Policy Date</Label>
                    <Input
                      id="policyDate"
                      type="date"
                      value={policyDate}
                      onChange={(e) => setPolicyDate(e.target.value)}
                      className="mt-2 h-11"
                    />
                  </div>
                  
                  {/* AI Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <div>
                        <Label htmlFor="useAI" className="text-sm font-semibold text-purple-900">
                          Enhanced AI Generation
                        </Label>
                        <p className="text-xs text-purple-700 mt-1">Generate comprehensive, professional policies</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      id="useAI"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  {useAI && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">AI Enhancement Active</p>
                          <p>Generate a comprehensive, professional policy with detailed explanations and legal compliance features.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button 
                onClick={generatePolicy} 
                disabled={isGenerating || scannedCookies.length === 0}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    {useAI ? 'Generating AI Policy...' : 'Generating Policy...'}
                  </>
                ) : (
                  <>
                    {useAI ? <Sparkles className="mr-3 h-5 w-5" /> : <Wand2 className="mr-3 h-5 w-5" />}
                    {useAI ? 'Generate AI-Enhanced Policy' : 'Generate Standard Policy'}
                  </>
                )}
              </Button>

              {scannedCookies.length === 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    No cookies found. Please scan a website first to generate a policy.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Policy Preview</h3>
                  <p className="text-sm text-gray-600 mt-1">Review your generated cookie policy</p>
                </div>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={copyToClipboard}
                  className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </div>
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">{policyContent}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6">
              <div className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Export Options
                    </CardTitle>
                    <CardDescription>
                      Download your cookie policy in different formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Button 
                      onClick={exportToPDF} 
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      <Download className="mr-3 h-5 w-5" />
                      Export as PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={copyToClipboard} 
                      className="w-full h-12 text-base font-semibold hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                    >
                      <FileText className="mr-3 h-5 w-5" />
                      Copy to Clipboard
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Policy Features
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-blue-800">GDPR and DPDPA 2023 compliant</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{useAI ? 'AI-powered detailed descriptions' : 'Detailed cookie descriptions'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-blue-800">Table format for cookie inventory</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-blue-800">Third-party cookie tracking</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
