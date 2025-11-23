'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Shield,
  Download,
  Filter,
  Search,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ExportSecurityModal } from '@/components/security/export-security-modal';

type AuditLog = {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  status: 'success' | 'failure';
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  created_at: string;
};

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'user.login', label: 'User Login' },
  { value: 'user.register', label: 'User Register' },
  { value: 'user.update', label: 'User Update' },
  { value: 'subscription.create', label: 'Subscription Create' },
  { value: 'subscription.update', label: 'Subscription Update' },
  { value: 'banner.create', label: 'Banner Create' },
  { value: 'banner.update', label: 'Banner Update' },
  { value: 'widget.update', label: 'Widget Update' },
  { value: 'consent.record', label: 'Consent Record' },
];

const STATUS_TYPES = [
  { value: '', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' }
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Security Modal State
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<'csv' | 'json' | 'pdf' | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, statusFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString()
      });

      if (actionFilter) params.append('action', actionFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/audit/logs?${params}`);

      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportClick = (format: 'csv' | 'json' | 'pdf') => {
    setPendingExportFormat(format);
    setIsSecurityModalOpen(true);
  };

  const executeExport = async () => {
    if (!pendingExportFormat) return;

    const format = pendingExportFormat;
    try {
      const params = new URLSearchParams({ format });
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`/api/audit/export?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to export logs' }));
        throw new Error(errorData.error || 'Failed to export logs');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
      alert(error instanceof Error ? error.message : 'Failed to export logs');
    } finally {
      setPendingExportFormat(null);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.resource_type.toLowerCase().includes(search) ||
      (log.resource_id && log.resource_id.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-gray-600">
            Track all actions and events in your account
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleExportClick('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportClick('json')}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button variant="outline" onClick={() => handleExportClick('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={fetchLogs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Action
            </label>
            <Select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
            >
              {ACTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              {STATUS_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(0);
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>

        {(actionFilter || statusFilter || startDate || endDate || searchTerm) && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setActionFilter('');
                setStatusFilter('');
                setStartDate('');
                setEndDate('');
                setSearchTerm('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      {/* Logs Table */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Activity Log ({total} total)
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-gray-600">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-gray-600">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Failure
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{log.resource_type}</div>
                        {log.resource_id && (
                          <div className="text-xs text-gray-400">
                            {log.resource_id}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {page * limit + 1} - {Math.min((page + 1) * limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
      <ExportSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onVerified={executeExport}
        actionName="export audit logs"
      />
    </div >
  );
}
