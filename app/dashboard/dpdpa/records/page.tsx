'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Filter, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ConsentRecord {
  id: string; // unique session ID
  consent_status: 'accepted' | 'rejected' | 'partial' | 'revoked';
  consent_timestamp: string;
  ip_address?: string | null;
  device_type?: string | null;
  user_agent?: string | null;
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

export default function ConsentRecordsPage() {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d'); // 7d, 30d, 90d, all
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch records on mount and when filters change
  useEffect(() => {
    fetchRecords();
  }, [searchQuery, statusFilter, typeFilter, dateRange]);

const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        page: '1',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      // dateRange and type are not supported yet in this endpoint

      const response = await fetch(`/api/dpdpa/consent-record?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch records');
      }

      setRecords(result.data || []);
      setTotalRecords(result.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load consent records');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Implement CSV export
    const csv = [
      ['ID', 'Status', 'Timestamp', 'IP Address', 'Device'],
      ...records.map((r) => [
        r.id,
        r.consent_status,
        r.consent_timestamp,
        r.ip_address || 'N/A',
        r.device_type || 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Consent Records</h1>
        <p className="text-gray-600 mt-2">
          View and manage all consent records with detailed audit trails
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium text-green-600">Granted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter((r) => r.consent_status === 'accepted').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter((r) => r.consent_status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Search"
              />
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              label="Type"
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'cookie', label: 'Cookie' },
                { value: 'dpdpa', label: 'DPDPA' },
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
<CardTitle>DPDPA Consent Records</CardTitle>
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Timestamp</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">IP Address</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Device</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
records.map((record) => (
                    <tr key={record.id} className="border-b transition-colors hover:bg-gray-50/50">
                      <td className="p-4 align-middle font-mono text-sm">{record.id}</td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          {statusIcons[record.consent_status]}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusColors[record.consent_status]
                            }`}
                          >
                            {record.consent_status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle text-gray-600">
                        {format(new Date(record.consent_timestamp), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="p-4 align-middle text-gray-600 font-mono text-sm">
                        {record.ip_address || 'N/A'}
                      </td>
                      <td className="p-4 align-middle text-gray-600">{record.device_type || 'N/A'}</td>
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
