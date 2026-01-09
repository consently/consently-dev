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
    title: 'Necessary Cookies',
    description: 'These cookies are essential for the website to function and cannot be disabled in our systems. They are usually only set in response to actions made by you which amount to a request for services.',
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
  const [activeTab, setActiveTab] = useState('generate');
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
      toast.loading('Generating policy...');

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
      toast.success('Policy generated successfully!');
    } catch (error) {
      console.error('Policy generation error:', error);
      toast.error('Failed to generate policy');
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
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 6;
      let yPosition = margin;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize = 11, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(0, 0, 0);

        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin - 10) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
      };

      // Helper function to add a table for a cookie category
      const addCookieTable = (categoryTitle: string, cookies: ScannedCookie[]) => {
        if (cookies.length === 0) return;

        // Check for page break before category
        if (yPosition > pageHeight - margin - 60) {
          doc.addPage();
          yPosition = margin;
        }

        // Category header
        yPosition += 5;
        addText(categoryTitle, 14, true);
        yPosition += 3;

        // Table configuration
        const colWidths = [45, 40, 60, 25]; // Name, Domain, Purpose, Expiry
        const headers = ['Cookie Name', 'Domain', 'Purpose', 'Expiry'];
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);
        const tableStartX = margin;

        // Draw table header
        doc.setFillColor(59, 130, 246); // Blue background
        doc.rect(tableStartX, yPosition, tableWidth, 8, 'F');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);

        let xPos = tableStartX + 2;
        headers.forEach((header, i) => {
          doc.text(header, xPos, yPosition + 5.5);
          xPos += colWidths[i];
        });
        yPosition += 10;

        // Draw table rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);

        cookies.forEach((cookie, rowIndex) => {
          // Check for page break
          if (yPosition > pageHeight - margin - 15) {
            doc.addPage();
            yPosition = margin;

            // Re-draw header on new page
            doc.setFillColor(59, 130, 246);
            doc.rect(tableStartX, yPosition, tableWidth, 8, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            xPos = tableStartX + 2;
            headers.forEach((header, i) => {
              doc.text(header, xPos, yPosition + 5.5);
              xPos += colWidths[i];
            });
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
          }

          // Alternate row background
          if (rowIndex % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(tableStartX, yPosition - 1, tableWidth, 8, 'F');
          }

          // Draw row border
          doc.setDrawColor(229, 231, 235);
          doc.line(tableStartX, yPosition + 6, tableStartX + tableWidth, yPosition + 6);

          // Row data
          xPos = tableStartX + 2;
          const rowData = [
            cookie.name.substring(0, 18) + (cookie.name.length > 18 ? '...' : ''),
            cookie.domain.substring(0, 16) + (cookie.domain.length > 16 ? '...' : ''),
            (cookie.description || 'No description').substring(0, 28) + ((cookie.description || '').length > 28 ? '...' : ''),
            cookie.expiry || 'Session'
          ];

          rowData.forEach((text, i) => {
            doc.text(text, xPos, yPosition + 5);
            xPos += colWidths[i];
          });
          yPosition += 8;
        });

        yPosition += 5;
      };

      // Add title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Cookie Policy', margin, yPosition);
      yPosition += 10;

      // Add company name
      doc.setFontSize(14);
      doc.setTextColor(75, 85, 99);
      doc.text(`For ${companyName || getHostname(scannedUrl)}`, margin, yPosition);
      yPosition += 8;

      // Add date
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition);
      yPosition += 15;

      // Add summary
      addText(`This document lists all ${scannedCookies.length} cookies found on ${getHostname(scannedUrl)} organized by category.`, 11);
      yPosition += 5;

      // Group cookies by category
      const cookiesByCategory = scannedCookies.reduce((acc, cookie) => {
        if (!acc[cookie.category]) {
          acc[cookie.category] = [];
        }
        acc[cookie.category].push(cookie);
        return acc;
      }, {} as Record<string, ScannedCookie[]>);

      // Add tables for each category
      const categoryOrder: Array<{ key: string; title: string }> = [
        { key: 'necessary', title: 'Necessary Cookies' },
        { key: 'functional', title: 'Functional Cookies' },
        { key: 'analytics', title: 'Analytics Cookies' },
        { key: 'advertising', title: 'Advertising Cookies' }
      ];

      categoryOrder.forEach(({ key, title }) => {
        if (cookiesByCategory[key] && cookiesByCategory[key].length > 0) {
          addCookieTable(title, cookiesByCategory[key]);
        }
      });

      // Add Complete Cookie Inventory table
      if (scannedCookies.length > 0) {
        if (yPosition > pageHeight - margin - 60) {
          doc.addPage();
          yPosition = margin;
        }

        yPosition += 10;
        addText('Complete Cookie Inventory', 16, true);
        yPosition += 5;

        // Full inventory table
        const colWidths = [35, 35, 35, 45, 20];
        const headers = ['Name', 'Domain', 'Category', 'Purpose', 'Expiry'];
        const tableStartX = margin;
        const tableWidth = colWidths.reduce((a, b) => a + b, 0);

        // Draw header
        doc.setFillColor(17, 24, 39);
        doc.rect(tableStartX, yPosition, tableWidth, 8, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);

        let xPos = tableStartX + 2;
        headers.forEach((header, i) => {
          doc.text(header, xPos, yPosition + 5.5);
          xPos += colWidths[i];
        });
        yPosition += 10;

        // Draw rows
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7);

        scannedCookies.forEach((cookie, rowIndex) => {
          if (yPosition > pageHeight - margin - 15) {
            doc.addPage();
            yPosition = margin;

            // Re-draw header
            doc.setFillColor(17, 24, 39);
            doc.rect(tableStartX, yPosition, tableWidth, 8, 'F');
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            xPos = tableStartX + 2;
            headers.forEach((header, i) => {
              doc.text(header, xPos, yPosition + 5.5);
              xPos += colWidths[i];
            });
            yPosition += 10;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
          }

          if (rowIndex % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.rect(tableStartX, yPosition - 1, tableWidth, 7, 'F');
          }

          doc.setDrawColor(229, 231, 235);
          doc.line(tableStartX, yPosition + 5, tableStartX + tableWidth, yPosition + 5);

          xPos = tableStartX + 2;
          const categoryTitle = categoryDescriptions[cookie.category]?.title || cookie.category;
          const rowData = [
            cookie.name.substring(0, 14) + (cookie.name.length > 14 ? '..' : ''),
            cookie.domain.substring(0, 14) + (cookie.domain.length > 14 ? '..' : ''),
            categoryTitle.substring(0, 14) + (categoryTitle.length > 14 ? '..' : ''),
            (cookie.description || 'No description').substring(0, 20) + ((cookie.description || '').length > 20 ? '..' : ''),
            cookie.expiry || 'Session'
          ];

          rowData.forEach((text, i) => {
            doc.text(text, xPos, yPosition + 4);
            xPos += colWidths[i];
          });
          yPosition += 7;
        });
      }

      // Add footer on each page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          'Generated by Consently - DPDPA 2023 Compliance Platform',
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      }

      // Save PDF
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
                Cookie Policy Generator
              </CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                Generate comprehensive cookie policies based on your scanned cookies
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
            defaultValue="generate"
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl">
              <TabsTrigger
                value="generate"
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Policy
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className={`data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all ${!policyContent ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="export"
                className={`data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all ${!policyContent ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </TabsTrigger>
            </TabsList>


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
                </CardContent>
              </Card>

              <Button
                onClick={generatePolicy}
                disabled={isGenerating || scannedCookies.length === 0}
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Generating Policy...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-3 h-5 w-5" />
                    Generate Cookie Policy
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
                        <span className="text-sm text-blue-800">Detailed cookie descriptions</span>
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
