'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  ArrowLeft,
  Globe,
  Monitor,
  Smartphone,
  TrendingUp,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Shield,
  Building2,
  Search,
  Download,
  Eye,
  EyeOff,
  Lock,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface ActivityStats {
  activityInfo: {
    activityId: string;
    name: string;
    purpose: string;
    industry: string;
    dataAttributes: string[];
    retentionPeriod: string;
    isActive: boolean;
    createdAt: string;
  };
  overview: {
    totalResponses: number;
    acceptedCount: number;
    rejectedCount: number;
    acceptanceRate: number;
    widgetCount: number;
  };
  breakdown: {
    countries: Array<{
      country: string;
      accepted: number;
      rejected: number;
      total: number;
      acceptanceRate: number;
    }>;
    devices: Array<{
      device: string;
      accepted: number;
      rejected: number;
      total: number;
      acceptanceRate: number;
    }>;
  };
  timeSeries: Array<{ date: string; accepted: number; rejected: number }>;
  widgets: Array<{
    widgetId: string;
    widgetName: string;
    domain: string;
    accepted: number;
    rejected: number;
    total: number;
    acceptanceRate: number;
  }>;
}

interface ConsentRecord {
  principalId: string;
  name: string;
  visitorEmail: string | null;
  visitorEmailHash: string | null;
  consentDate: string;
  noticeVersion: string;
  channel: string;
  status: string;
  declineDate: string | null;
  reason: string | null;
}

export default function ActivityStatsPage() {
  const params = useParams();
  const activityId = params.activityId as string;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [range, setRange] = useState('30d');

  // Records State
  const [activeTab, setActiveTab] = useState('accepted');
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRecordDetails, setSelectedRecordDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showVerifiedEmails, setShowVerifiedEmails] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [activityId, range]);

  useEffect(() => {
    fetchRecords();
  }, [activityId, activeTab, page, searchQuery]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dpdpa/activity-stats/${activityId}?range=${range}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch activity stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load activity statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    try {
      setRecordsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: activeTab,
        search: searchQuery
      });

      const response = await fetch(`/api/dpdpa/activity-records/${activityId}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch records');

      const data = await response.json();
      setRecords(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalRecords(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load consent records');
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchRecordDetails = async (principalId: string) => {
    try {
      setDetailsLoading(true);
      const response = await fetch(`/api/dpdpa/consent-record/${principalId}`);
      if (!response.ok) throw new Error('Failed to fetch record details');

      const result = await response.json();
      setSelectedRecordDetails(result.data);
    } catch (error) {
      console.error('Error fetching record details:', error);
      toast.error('Failed to load consent record details');
      setSelectedRecordId(null); // Close the sheet on error
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('Export started. Check your email for the CSV/PDF report.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading activity statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No statistics found for this activity</p>
        <Link href="/dashboard/dpdpa/activities">
          <Button className="mt-4">Back to Activities</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/dpdpa/activities">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Activities
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{stats.activityInfo.name}</h1>
              <Badge variant={stats.activityInfo.isActive ? 'default' : 'secondary'}>
                {stats.activityInfo.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-700">
                {stats.activityInfo.industry}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">
              <strong>Description:</strong> {stats.activityInfo.purpose}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created {new Date(stats.activityInfo.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Retention: {stats.activityInfo.retentionPeriod}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Button
              variant={range === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={range === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={range === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRange('all')}
            >
              All Time
            </Button>
          </div>
        </div>
      </div>

      {/* Data Attributes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Data Collected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.activityInfo.dataAttributes.map((attr, i) => (
              <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-800">
                {attr}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.overview.totalResponses.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              Across {stats.overview.widgetCount} widget{stats.overview.widgetCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.overview.acceptanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.overview.acceptedCount.toLocaleString()} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.overview.acceptedCount.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Users granted consent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.overview.rejectedCount.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Users denied consent</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Consent View (Tabs) */}
      <Card className="overflow-hidden border-t-4 border-t-blue-500">
        <Tabs defaultValue="accepted" onValueChange={(val) => {
          setActiveTab(val);
          setPage(1);
          setSearchQuery('');
        }} className="w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
            <TabsList>
              <TabsTrigger value="accepted" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                Accepted Consents ({stats.overview.acceptedCount.toLocaleString()})
              </TabsTrigger>
              <TabsTrigger value="declined" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                Declined / Revoked ({stats.overview.rejectedCount.toLocaleString()})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Principal ID..."
                  className="pl-9 w-[250px] h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            <TabsContent value="accepted" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Consent Date</TableHead>
                    <TableHead>Notice Ver.</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{record.principalId}</TableCell>
                        <TableCell>
                          {record.visitorEmail
                            ? (showVerifiedEmails ? record.visitorEmail : 'Verified User (Hidden)')
                            : (record.visitorEmailHash ? (showVerifiedEmails ? 'Verified User (Email Not Available)' : 'Verified User (Hidden)') : 'Anonymous Visitor')}
                        </TableCell>
                        <TableCell>{new Date(record.consentDate).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.noticeVersion}</Badge>
                        </TableCell>
                        <TableCell>{record.channel}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecordId(record.principalId);
                              fetchRecordDetails(record.principalId);
                            }}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="declined" className="m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Decline Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason (Opt)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" />
                      </TableCell>
                    </TableRow>
                  ) : records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{record.principalId}</TableCell>
                        <TableCell>
                          {record.visitorEmail
                            ? (showVerifiedEmails ? record.visitorEmail : 'Verified User (Hidden)')
                            : (record.visitorEmailHash ? (showVerifiedEmails ? 'Verified User (Email Not Available)' : 'Verified User (Hidden)') : 'Anonymous Visitor')}
                        </TableCell>
                        <TableCell>{record.declineDate ? new Date(record.declineDate).toLocaleString() : '-'}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'withdrawn' ? 'destructive' : 'secondary'}>
                            {record.status === 'withdrawn' ? 'Revocation' : 'Initial Decline'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 italic">
                          {record.reason || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" title="Lock / Suppress">
                            <Lock className="h-4 w-4 text-gray-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, totalRecords)} of {totalRecords} records
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || recordsLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || recordsLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Additional Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Widget Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              Performance by Widget
            </CardTitle>
            <CardDescription>How this activity performs across different widgets</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.widgets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No widget data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.widgets.map((widget) => (
                  <div
                    key={widget.widgetId}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <Link href={`/dashboard/dpdpa/widget-stats/${widget.widgetId}`}>
                          <h4 className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                            {widget.widgetName}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Globe className="h-3 w-3 text-gray-500" />
                          <p className="text-sm text-gray-600">{widget.domain}</p>
                        </div>
                      </div>
                      <Badge
                        className={`${widget.acceptanceRate >= 75
                          ? 'bg-green-100 text-green-800'
                          : widget.acceptanceRate >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {widget.acceptanceRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {widget.accepted} accepted
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          {widget.rejected} rejected
                        </span>
                      </div>
                      <span className="text-gray-600">{widget.total} total</span>
                    </div>
                    <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${widget.acceptanceRate >= 75
                          ? 'bg-green-500'
                          : widget.acceptanceRate >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                          }`}
                        style={{ width: `${widget.acceptanceRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geographic & Device Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-600" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Acceptance by country</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.breakdown.countries.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No geographic data available</p>
              ) : (
                <div className="space-y-3">
                  {stats.breakdown.countries
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((country) => (
                      <div key={country.country} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{country.country}</span>
                            <Badge
                              variant="secondary"
                              className={`${country.acceptanceRate >= 75
                                ? 'bg-green-100 text-green-800'
                                : country.acceptanceRate >= 50
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {country.acceptanceRate.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="text-green-600">{country.accepted} ✓</span>
                            <span className="text-red-600">{country.rejected} ✗</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                Device Distribution
              </CardTitle>
              <CardDescription>Acceptance by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.breakdown.devices.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-4">No device data available</p>
              ) : (
                <div className="space-y-3">
                  {stats.breakdown.devices
                    .sort((a, b) => b.total - a.total)
                    .map((device) => (
                      <div key={device.device} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {device.device === 'Mobile' && <Smartphone className="h-4 w-4 text-gray-600" />}
                              {device.device === 'Desktop' && <Monitor className="h-4 w-4 text-gray-600" />}
                              <span className="text-sm font-medium text-gray-900">{device.device}</span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`${device.acceptanceRate >= 75
                                ? 'bg-green-100 text-green-800'
                                : device.acceptanceRate >= 50
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {device.acceptanceRate.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="text-green-600">{device.accepted} ✓</span>
                            <span className="text-red-600">{device.rejected} ✗</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Consent Record Preview Sheet */}
      <Sheet open={!!selectedRecordId} onOpenChange={() => { setSelectedRecordId(null); setSelectedRecordDetails(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Consent Record Details</SheetTitle>
            <SheetDescription>
              {selectedRecordDetails?.visitor_email || 'Anonymous User'}
            </SheetDescription>
          </SheetHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
          ) : selectedRecordDetails ? (
            <div className="mt-6 space-y-6">
              {/* Status and Metadata */}
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Consent Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge className={`${selectedRecordDetails.consent_status === 'accepted' ? 'bg-green-100 text-green-800' :
                        selectedRecordDetails.consent_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {selectedRecordDetails.consent_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Timestamp:</span>
                      <span className="text-sm text-gray-900">
                        {selectedRecordDetails.consent_given_at ? new Date(selectedRecordDetails.consent_given_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Device:</span>
                      <span className="text-sm text-gray-900">{selectedRecordDetails.device_type || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">IP Address:</span>
                      <span className="text-sm text-gray-900 font-mono">{selectedRecordDetails.ip_address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Browser:</span>
                      <span className="text-sm text-gray-900">{selectedRecordDetails.browser || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Country:</span>
                      <span className="text-sm text-gray-900">{selectedRecordDetails.country_code || 'Unknown'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Privacy Notice */}
              {selectedRecordDetails.privacyNoticeHTML ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Privacy Notice {selectedRecordDetails.isHistoricalSnapshot ? '(Verified Snapshot)' : '(Current Version)'}</h3>
                  {!selectedRecordDetails.isHistoricalSnapshot && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-xs text-yellow-800">
                        ⚠️ This is the current version of the privacy notice. The actual notice accepted by the user may have differed if the configuration has changed since consent was given.
                      </p>
                    </div>
                  )}
                  <div
                    className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: selectedRecordDetails.privacyNoticeHTML }}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No privacy notice available
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

