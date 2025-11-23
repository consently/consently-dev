'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, Filter, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ExportSecurityModal } from '@/components/security/export-security-modal';

interface ConsentRecord {
  id: string; // unique session ID
  consent_status: 'accepted' | 'rejected' | 'partial' | 'revoked';
  consent_given_at?: string;
  consent_timestamp?: string; // Fallback for legacy records
  ip_address?: string | null;
  device_type?: string | null;
  user_agent?: string | null;
  country?: string | null;
  country_code?: string | null;
  consented_activities?: string[];
  rejected_activities?: string[];
  acceptedActivityNames?: string[]; // Added for display
  rejectedActivityNames?: string[]; // Added for display
  visitor_email?: string | null;
  visitor_email_hash?: string | null;
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [showVerifiedEmails, setShowVerifiedEmails] = useState(false);

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

  const toggleRowExpanded = (recordId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleExportClick = () => {
    setIsSecurityModalOpen(true);
  };

  const executeExport = () => {
    // Helper function to escape CSV fields
    const escapeCSV = (value: string | null | undefined): string => {
      if (!value) return 'N/A';
      const stringValue = String(value);
      // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csv = [
      ['ID', 'Status', 'Timestamp', 'IP Address', 'Device', 'Country', 'Accepted Activities', 'Rejected Activities'],
      ...records.map((r) => [
        escapeCSV(r.id),
        escapeCSV(r.consent_status),
        escapeCSV(r.consent_given_at || r.consent_timestamp || 'N/A'),
        escapeCSV(r.ip_address),
        escapeCSV(r.device_type),
        escapeCSV(r.country || r.country_code || 'N/A'),
        escapeCSV((r.acceptedActivityNames || []).join('; ')),
        escapeCSV((r.rejectedActivityNames || []).join('; ')),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Records exported successfully');
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 lg:p-0">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Consent Records</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
          View and manage all consent records with detailed audit trails
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-600 flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalRecords}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Granted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-700">
              {records.filter((r) => r.consent_status === 'accepted').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalRecords > 0
                ? `${Math.round((records.filter((r) => r.consent_status === 'accepted').length / totalRecords) * 100)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-red-600 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-red-700">
              {records.filter((r) => r.consent_status === 'rejected').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalRecords > 0
                ? `${Math.round((records.filter((r) => r.consent_status === 'rejected').length / totalRecords) * 100)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-yellow-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Partial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-yellow-700">
              {records.filter((r) => r.consent_status === 'partial').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {totalRecords > 0
                ? `${Math.round((records.filter((r) => r.consent_status === 'partial').length / totalRecords) * 100)}%`
                : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl">Filter Records</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setTypeFilter('all');
                setDateRange('30d');
              }}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              <Filter className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search - Full Width on Mobile */}
            <div className="w-full">
              <Input
                type="text"
                placeholder="Search by session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="Search"
                className="w-full"
              />
            </div>

            {/* Filters Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Records Table - Desktop */}
      <Card className="hidden lg:block">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>DPDPA Consent Records</CardTitle>
            <CardDescription>
              {records.length} record{records.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowVerifiedEmails(!showVerifiedEmails)}
              variant="outline"
              size="sm"
              title={showVerifiedEmails ? "Hide verified emails" : "Show verified emails"}
            >
              {showVerifiedEmails ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Emails
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Emails
                </>
              )}
            </Button>
            <Button onClick={handleExportClick} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="border-b-2 border-gray-200 bg-gray-50">
                <tr>
                  <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">User / ID</th>
                  <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">Status</th>
                  <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">Timestamp</th>
                  <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm min-w-[300px]">Activities</th>
                  <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">Location</th>
                  <th className="h-11 px-3 text-left align-middle font-semibold text-gray-700 text-sm">Device</th>
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
                  records.map((record) => {
                    const timestamp = record.consent_given_at || record.consent_timestamp;
                    const hasTimestamp = timestamp && !isNaN(new Date(timestamp).getTime());
                    const acceptedCount = record.consented_activities?.length || 0;
                    const rejectedCount = record.rejected_activities?.length || 0;
                    const isExpanded = expandedRows.has(record.id);
                    const hasActivities = acceptedCount > 0 || rejectedCount > 0;

                    return (
                      <React.Fragment key={record.id}>
                        <tr className="border-b border-gray-100 transition-colors hover:bg-blue-50/30">
                          <td className="p-3 align-middle">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">
                                {record.visitor_email
                                  ? (showVerifiedEmails ? record.visitor_email : 'Verified User (Hidden)')
                                  : (record.visitor_email_hash ? (showVerifiedEmails ? 'Verified User (Email Not Available)' : 'Verified User (Hidden)') : 'Anonymous')}
                              </span>
                              <div className="font-mono text-xs text-gray-500 max-w-[140px] truncate" title={record.id}>
                                {record.id.substring(0, 18)}...
                              </div>
                            </div>
                          </td>
                          <td className="p-3 align-middle">
                            <div className="flex items-center gap-1.5">
                              {statusIcons[record.consent_status]}
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusColors[record.consent_status]
                                  }`}
                              >
                                {record.consent_status.charAt(0).toUpperCase() + record.consent_status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 align-middle text-gray-600 text-sm">
                            {hasTimestamp ? (
                              <div className="whitespace-nowrap">
                                <div className="font-semibold text-gray-900">{format(new Date(timestamp), 'MMM d, yyyy')}</div>
                                <div className="text-xs text-gray-500">{format(new Date(timestamp), 'HH:mm:ss')}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3 align-top text-sm max-w-md">
                            <div className="space-y-2">
                              {/* Accepted Activities */}
                              {acceptedCount > 0 && (
                                <div>
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-green-700">Accepted ({acceptedCount})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(record.acceptedActivityNames || []).slice(0, 2).map((name, idx) => (
                                      <Badge
                                        key={idx}
                                        className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0.5 font-medium"
                                      >
                                        {name.length > 30 ? `${name.substring(0, 30)}...` : name}
                                      </Badge>
                                    ))}
                                    {acceptedCount > 2 && (
                                      <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-0.5">
                                        +{acceptedCount - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Rejected Activities */}
                              {rejectedCount > 0 && (
                                <div>
                                  <div className="flex items-center gap-1 mb-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-red-700">Rejected ({rejectedCount})</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(record.rejectedActivityNames || []).slice(0, 2).map((name, idx) => (
                                      <Badge
                                        key={idx}
                                        className="bg-red-100 text-red-800 border-red-200 text-xs px-2 py-0.5 font-medium"
                                      >
                                        {name.length > 30 ? `${name.substring(0, 30)}...` : name}
                                      </Badge>
                                    ))}
                                    {rejectedCount > 2 && (
                                      <Badge className="bg-red-50 text-red-700 border-red-200 text-xs px-2 py-0.5">
                                        +{rejectedCount - 2}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* No Activities */}
                              {acceptedCount === 0 && rejectedCount === 0 && (
                                <span className="text-gray-400 text-xs">No activities</span>
                              )}

                              {/* Expand Button for Full List */}
                              {hasActivities && (acceptedCount > 2 || rejectedCount > 2) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpanded(record.id)}
                                  className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 mt-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      View all
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle text-sm">
                            <div className="flex flex-col gap-1">
                              {(record.country || record.country_code) && (
                                <span className="text-gray-900 font-medium text-sm">{record.country || record.country_code}</span>
                              )}
                              {record.ip_address && (
                                <span className="font-mono text-xs text-gray-500">{record.ip_address}</span>
                              )}
                              {!record.country && !record.country_code && !record.ip_address && (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-sm font-medium">
                              {record.device_type || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && hasActivities && (
                          <tr key={`${record.id}-expanded`} className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100">
                            <td colSpan={6} className="p-4">
                              <div className="space-y-4 max-w-4xl">
                                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">Complete Activity List</span>
                                </div>
                                {acceptedCount > 0 && (
                                  <div className="bg-white rounded-lg p-3 border border-green-100">
                                    <h4 className="text-sm font-bold text-green-700 mb-2.5 flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4" />
                                      Accepted Activities ({acceptedCount})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(record.acceptedActivityNames || []).map((name, idx) => (
                                        <Badge
                                          key={idx}
                                          className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors text-xs py-1"
                                        >
                                          {name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {rejectedCount > 0 && (
                                  <div className="bg-white rounded-lg p-3 border border-red-100">
                                    <h4 className="text-sm font-bold text-red-700 mb-2.5 flex items-center gap-2">
                                      <XCircle className="h-4 w-4" />
                                      Rejected Activities ({rejectedCount})
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {(record.rejectedActivityNames || []).map((name, idx) => (
                                        <Badge
                                          key={idx}
                                          className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 transition-colors text-xs py-1"
                                        >
                                          {name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>

      {/* Records Cards - Mobile & Tablet */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Consent Records</h3>
            <p className="text-sm text-gray-600">
              {records.length} record{records.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowVerifiedEmails(!showVerifiedEmails)}
              variant="outline"
              size="sm"
              title={showVerifiedEmails ? "Hide emails" : "Show emails"}
            >
              {showVerifiedEmails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button onClick={handleExportClick} variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </CardContent>
          </Card>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No records found
            </CardContent>
          </Card>
        ) : (
          records.map((record) => {
            const timestamp = record.consent_given_at || record.consent_timestamp;
            const hasTimestamp = timestamp && !isNaN(new Date(timestamp).getTime());
            const acceptedCount = record.consented_activities?.length || 0;
            const rejectedCount = record.rejected_activities?.length || 0;
            const isExpanded = expandedRows.has(record.id);

            return (
              <Card key={record.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {statusIcons[record.consent_status]}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[record.consent_status]
                            }`}
                        >
                          {record.consent_status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {record.visitor_email
                          ? (showVerifiedEmails ? record.visitor_email : 'Verified User (Hidden)')
                          : (record.visitor_email_hash ? (showVerifiedEmails ? 'Verified User (Email Not Available)' : 'Verified User (Hidden)') : 'Anonymous Visitor')}
                      </div>
                      <div className="font-mono text-xs text-gray-500 truncate mt-1">
                        ID: {record.id.substring(0, 20)}...
                      </div>
                    </div>
                    {hasTimestamp && (
                      <div className="text-right text-xs text-gray-600">
                        <div className="font-medium">{format(new Date(timestamp), 'MMM d, yyyy')}</div>
                        <div className="text-gray-500">{format(new Date(timestamp), 'HH:mm')}</div>
                      </div>
                    )}
                  </div>

                  {/* Activities */}
                  <div className="space-y-3">
                    {/* Accepted Activities */}
                    {acceptedCount > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">
                            Accepted ({acceptedCount})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(isExpanded
                            ? record.acceptedActivityNames || []
                            : (record.acceptedActivityNames || []).slice(0, 2)
                          ).map((name, idx) => (
                            <Badge
                              key={idx}
                              className="bg-green-100 text-green-800 border-green-200 text-xs"
                            >
                              {name.length > 20 ? `${name.substring(0, 20)}...` : name}
                            </Badge>
                          ))}
                          {!isExpanded && acceptedCount > 2 && (
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                              +{acceptedCount - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rejected Activities */}
                    {rejectedCount > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">
                            Rejected ({rejectedCount})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(isExpanded
                            ? record.rejectedActivityNames || []
                            : (record.rejectedActivityNames || []).slice(0, 2)
                          ).map((name, idx) => (
                            <Badge
                              key={idx}
                              className="bg-red-100 text-red-800 border-red-200 text-xs"
                            >
                              {name.length > 20 ? `${name.substring(0, 20)}...` : name}
                            </Badge>
                          ))}
                          {!isExpanded && rejectedCount > 2 && (
                            <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                              +{rejectedCount - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {acceptedCount === 0 && rejectedCount === 0 && (
                      <div className="text-center py-2 text-sm text-gray-400">
                        No activities
                      </div>
                    )}

                    {/* Expand/Collapse Button */}
                    {(acceptedCount > 2 || rejectedCount > 2) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpanded(record.id)}
                        className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show all activities
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Footer - Location & Device */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-600">
                    <div className="flex items-center gap-4">
                      {(record.country || record.country_code) && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {record.country || record.country_code}
                        </span>
                      )}
                      {record.device_type && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          {record.device_type}
                        </span>
                      )}
                    </div>
                    {record.ip_address && (
                      <span className="font-mono text-gray-500 truncate max-w-[120px]">
                        {record.ip_address}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <ExportSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onVerified={executeExport}
        actionName="export DPDPA records"
      />
    </div >
  );
}

