'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Download, 
  Copy, 
  Eye, 
  Edit, 
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Mail,
  Building,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export default function CookiePolicyGenerator() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState<any[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    websiteUrl: '',
    contactEmail: '',
    companyAddress: '',
    scanId: null as string | null,
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cookies/policy-generator');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePolicy = async () => {
    if (!formData.companyName || !formData.websiteUrl || !formData.contactEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/cookies/policy-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cookie policy generated successfully!');
        await fetchPolicies();
        setSelectedPolicy(data.data);
        setEditMode(false);
        // Reset form
        setFormData({
          companyName: '',
          websiteUrl: '',
          contactEmail: '',
          companyAddress: '',
          scanId: null,
        });
      } else {
        toast.error(data.error || 'Failed to generate policy');
      }
    } catch (error) {
      console.error('Error generating policy:', error);
      toast.error('Failed to generate policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadHTML = (policy: any) => {
    const htmlContent = generateHTMLPolicy(policy);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${policy.company_name}-cookie-policy.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Policy downloaded!');
  };

  const generateHTMLPolicy = (policy: any) => {
    const data = policy.policy_data || policy;
    
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Cookie Policy - ${data.company_name}</title>
  <style>
    body { 
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; 
      line-height:1.62; 
      color:#111; 
      padding:24px; 
      max-width:980px; 
      margin:0 auto; 
    }
    h1,h2,h3 { color:#0b2545; }
    .meta { color:#4b5563; font-size:0.95rem; margin-bottom:18px; }
    .section { margin:28px 0; }
    table { width:100%; border-collapse:collapse; margin-top:12px; }
    th, td { padding:10px 12px; border:1px solid #e6e9ee; text-align:left; font-size:0.95rem; }
    th { background:#f7f9fc; }
    .note { font-size:0.92rem; color:#374151; background:#f8fafc; padding:10px; border-left:3px solid #c7e0ff; margin-top:12px; }
  </style>
</head>
<body>
  <header>
    <h1>Cookie Policy</h1>
    <div class="meta">
      Last updated: ${data.last_updated_date || new Date().toISOString().split('T')[0]}
      &nbsp;|&nbsp; Version: ${data.policy_version || '1.0'}
    </div>
  </header>

  <section class="section">
    <h2>1. Introduction</h2>
    <p>
      This Cookie Policy explains how <strong>${data.company_name}</strong> ("we", "us", "our") uses cookies and similar technologies on <strong>${data.website_url}</strong> (the "Website").
    </p>
  </section>

  <section class="section">
    <h2>2. What are cookies?</h2>
    <p class="small">
      Cookies are small text files stored on your device when you visit websites. They help websites operate, remember your settings, and enable analytics and advertising functions.
      "First-party" cookies are set by our domain; "third-party" cookies are set by external partners.
    </p>
  </section>

  <section class="section">
    <h2>3. Why we use cookies</h2>
    <ul>
      <li><strong>Strictly necessary:</strong> Required for core website functionality (e.g., security, session, shopping cart).</li>
      <li><strong>Functional:</strong> Remember choices (language, region) and personalization.</li>
      <li><strong>Analytics:</strong> Understand website usage to improve performance.</li>
      <li><strong>Advertising / Marketing:</strong> Deliver relevant ads and measure campaign effectiveness.</li>
    </ul>
  </section>

  ${data.cookie_inventory ? `
  <section class="section">
    <h2>4. Cookies used on this website</h2>
    <div id="cookie_inventory">
      <table>
        <thead>
          <tr>
            <th>Cookie Name</th>
            <th>Domain</th>
            <th>Category</th>
            <th>Expiry</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          ${data.cookie_inventory.map((cookie: any) => `
            <tr>
              <td><code>${cookie.name || 'N/A'}</code></td>
              <td>${cookie.domain || 'N/A'}</td>
              <td>${cookie.category || 'Unclassified'}</td>
              <td>${cookie.expiry || 'Session'}</td>
              <td>${cookie.purpose || 'Not specified'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </section>
  ` : ''}

  <section class="section">
    <h2>5. How to manage cookies</h2>
    <p>
      You can manage cookie preferences through:
    </p>
    <ol>
      <li><strong>Cookie banner / settings:</strong> Click Cookie Settings on the Website to accept/reject categories.</li>
      <li><strong>Browser controls:</strong> Block or delete cookies using your browser settings.</li>
    </ol>
  </section>

  <section class="section">
    <h2>6. Your rights</h2>
    <p class="small">
      Depending on your jurisdiction, you may have rights to access, rectify, delete, restrict or object to processing of your personal data, and the right to data portability. To exercise these rights, contact us at:
      <br /><strong>Email:</strong> <a href="mailto:${data.contact_email}">${data.contact_email}</a>
    </p>
  </section>

  <section class="section">
    <h2>7. Changes to this policy</h2>
    <p class="small">
      We may update this Cookie Policy. The "Last updated" date at the top will reflect the latest revision.
    </p>
  </section>

  <section class="section">
    <h2>8. Contact</h2>
    <p>
      <strong>${data.company_name}</strong><br/>
      ${data.company_address ? `Address: ${data.company_address}<br/>` : ''}
      Email: <a href="mailto:${data.contact_email}">${data.contact_email}</a><br/>
      Website: <a href="${data.website_url}">${data.website_url}</a>
    </p>
  </section>

  <footer style="margin-top:28px;" class="small">
    <p>Policy generated by <strong>Consently</strong> - Cookie Compliance Platform</p>
  </footer>
</body>
</html>`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cookie Policy Generator</h1>
        <p className="text-gray-600 mt-2">Generate customizable cookie policy documents for your website</p>
      </div>

      {/* Generator Form */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Generate New Policy</CardTitle>
              <CardDescription>Fill in your company details to create a customized cookie policy</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company Name <span className="text-red-500">*</span>
                </div>
              </label>
              <Input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Your Company Ltd."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL <span className="text-red-500">*</span>
                </div>
              </label>
              <Input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                placeholder="https://yourwebsite.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Email <span className="text-red-500">*</span>
                </div>
              </label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@yourcompany.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address (Optional)
              </label>
              <Input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                placeholder="123 Main St, City, Country"
                className="w-full"
              />
            </div>
          </div>

          <Button 
            onClick={handleGeneratePolicy}
            disabled={saving}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Cookie Policy
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Policies */}
      {policies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Cookie Policies</CardTitle>
            <CardDescription>Previously generated policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{policy.company_name}</h3>
                    <p className="text-sm text-gray-600">{policy.website_url}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(policy.created_at).toLocaleDateString()}
                      </span>
                      <span>Version {policy.version}</span>
                      {policy.is_published && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadHTML(policy)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {selectedPolicy && (
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-purple-600" />
                <CardTitle>Policy Preview</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPolicy(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: generateHTMLPolicy(selectedPolicy) }}
                className="border rounded-lg p-6 bg-white"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
