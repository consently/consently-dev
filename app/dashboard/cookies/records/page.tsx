'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Search, Download, CheckCircle2, XCircle, AlertCircle, Globe, Monitor, Smartphone, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ConsentRecord {
  id: string;
  consent_id: string;
  status: 'accepted' | 'rejected' | 'partial' | 'revoked';
  categories?: string[];
  created_at: string;
  ip_address?: string | null;
  device_type?: string | null;
  user_agent?: string | null;
  language?: string | null;
}

const statusIcons = {
  accepted: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  rejected: <XCircle className="h-4 w-4 text-red-500" />,
  partial: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  revoked: <AlertCircle className="h-4 w-4 text-orange-500" />,
};

const statusColors = {
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
  revoked: 'bg-orange-100 text-orange-800',
};

const deviceIcons = {
  Desktop: <Monitor className="h-4 w-4" />,
  Mobile: <Smartphone className="h-4 w-4" />,
  Tablet: <Smartphone className="h-4 w-4" />,
};

export default function CookieConsentRecordsPage() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const [totalRecords, setTotalRecords] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch records on mount and when filters change
  useEffect(() => {
    fetchRecords();
  }, [searchQuery, statusFilter, dateRange]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        page: '1',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/consent/records?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch records');
      }

      setRecords(result.data || []);
      setTotalRecords(result.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load cookie consent records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyConsentId = async (consentId: string) => {
    try {
      await navigator.clipboard.writeText(consentId);
      setCopiedId(consentId);
      toast.success('Session ID copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy Session ID');
    }
  };

  const handleExport = () => {
    const csv = [
      ['ID', 'Session ID', 'Status', 'Categories', 'Timestamp', 'IP Address', 'Device', 'Language'],
      ...records.map((r) => [
        r.id,
        r.consent_id,
        r.status,
        r.categories?.join(', ') || 'N/A',
        r.created_at,
        r.ip_address || 'N/A',
        r.device_type || 'N/A',
        r.language || 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie-consent-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Records exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cookie Consent Records</h1>
        <p className="text-gray-600 mt-2">
          View and manage all cookie consent records with detailed tracking information
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter((r) => r.status === 'accepted').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter((r) => r.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter((r) => r.status === 'partial').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Records</CardTitle>
          <CardDescription>
            Search by session ID. Click the copy icon next to any session ID to copy it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by session ID (e.g., con_1735558473829_a7k2p)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  label="Search"
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'partial', label: 'Partial' },
                { value: 'revoked', label: 'Revoked' },
              ]}
            />
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
              options={[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
                { value: 'all', label: 'All time' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cookie Consent Records</CardTitle>
            <CardDescription>
              {records.length} record{records.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-gray-50/50">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Session ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Categories</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Device</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">IP Address</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={record.id} className="border-b transition-colors hover:bg-gray-50/50">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-gray-700">{record.consent_id}</span>
                          <button
                            onClick={() => handleCopyConsentId(record.consent_id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy Session ID"
                          >
                            {copiedId === record.consent_id ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          {statusIcons[record.status]}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[record.status]
                            }`}
                          >
                            {record.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {record.categories && record.categories.length > 0 ? (
                            record.categories.map((cat) => (
                              <span
                                key={cat}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {cat}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2 text-gray-600">
                          {deviceIcons[record.device_type as keyof typeof deviceIcons] || deviceIcons.Desktop}
                          <span className="text-sm">{record.device_type || 'Desktop'}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-gray-600 font-mono text-sm">
                        {record.ip_address || 'N/A'}
                      </td>
                      <td className="p-4 align-middle text-gray-600">
                        {format(new Date(record.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
