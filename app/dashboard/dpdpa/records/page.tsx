'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Filter, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ConsentRecord {
  id: string;
  email: string;
  consentType: 'cookie' | 'dpdpa';
  status: 'granted' | 'denied' | 'withdrawn';
  timestamp: string;
  ipAddress: string;
  location: string;
}

// Mock data
const mockRecords: ConsentRecord[] = [
  { id: '1', email: 'user1@example.com', consentType: 'cookie', status: 'granted', timestamp: '2025-10-10T10:30:00Z', ipAddress: '192.168.1.1', location: 'Mumbai, India' },
  { id: '2', email: 'user2@example.com', consentType: 'dpdpa', status: 'granted', timestamp: '2025-10-10T09:15:00Z', ipAddress: '192.168.1.2', location: 'Delhi, India' },
  { id: '3', email: 'user3@example.com', consentType: 'cookie', status: 'denied', timestamp: '2025-10-10T08:45:00Z', ipAddress: '192.168.1.3', location: 'Bangalore, India' },
  { id: '4', email: 'user4@example.com', consentType: 'dpdpa', status: 'withdrawn', timestamp: '2025-10-09T14:20:00Z', ipAddress: '192.168.1.4', location: 'Chennai, India' },
  { id: '5', email: 'user5@example.com', consentType: 'cookie', status: 'granted', timestamp: '2025-10-09T11:00:00Z', ipAddress: '192.168.1.5', location: 'Pune, India' },
];

const statusIcons = {
  granted: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  denied: <XCircle className="h-4 w-4 text-red-500" />,
  withdrawn: <AlertCircle className="h-4 w-4 text-orange-500" />,
};

const statusColors = {
  granted: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  withdrawn: 'bg-orange-100 text-orange-800',
};

export default function ConsentRecordsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredRecords = mockRecords.filter((record) => {
    const matchesSearch = record.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.consentType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleExport = () => {
    // Implement CSV export
    const csv = [
      ['ID', 'Email', 'Type', 'Status', 'Timestamp', 'IP Address', 'Location'],
      ...filteredRecords.map((r) => [
        r.id,
        r.email,
        r.consentType,
        r.status,
        r.timestamp,
        r.ipAddress,
        r.location,
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
            <div className="text-2xl font-bold">{mockRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Granted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockRecords.filter((r) => r.status === 'granted').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockRecords.filter((r) => r.status === 'denied').length}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search by email..."
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
                { value: 'granted', label: 'Granted' },
                { value: 'denied', label: 'Denied' },
                { value: 'withdrawn', label: 'Withdrawn' },
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
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Consent Records</CardTitle>
            <CardDescription>
              {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
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
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Email</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Type</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Timestamp</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">IP Address</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-700">Location</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b transition-colors hover:bg-gray-50/50">
                    <td className="p-4 align-middle font-medium">{record.email}</td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {record.consentType}
                      </span>
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
                    <td className="p-4 align-middle text-gray-600">
                      {format(new Date(record.timestamp), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="p-4 align-middle text-gray-600 font-mono text-sm">
                      {record.ipAddress}
                    </td>
                    <td className="p-4 align-middle text-gray-600">{record.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No records found</h3>
              <p className="mt-2 text-sm text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
