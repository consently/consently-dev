'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, AlertCircle, Globe, RefreshCw, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PageInfo {
  url: string;
  title: string | null;
  firstVisit: string;
  lastVisit: string;
  consentGiven: boolean;
  consentTimestamp: string | null;
  consentStatus: 'accepted' | 'rejected' | 'partial' | 'revoked' | null;
  activitiesCount: number;
}

interface PagesViewProps {
  visitorId: string;
  widgetId: string;
}

export function PagesView({ visitorId, widgetId }: PagesViewProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalPages: 0, totalConsents: 0 });

  useEffect(() => {
    fetchPages();
  }, [visitorId, widgetId]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/privacy-centre/pages?widgetId=${widgetId}&visitorId=${visitorId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data.pages || []);
      setStats({
        totalPages: data.totalPages || 0,
        totalConsents: data.totalConsents || 0,
      });
    } catch (err) {
      console.error('Error fetching pages:', err);
      setError('Unable to load pages. Please try again later.');
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">Rejected</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-0">Partial</Badge>;
      case 'revoked':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-0">Revoked</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300">Unknown</Badge>;
    }
  };

  const getPageTitle = (page: PageInfo) => {
    if (page.title) return page.title;
    try {
      const url = new URL(page.url);
      return url.pathname === '/' ? 'Home' : url.pathname;
    } catch {
      return 'Unknown Page';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-12 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl animate-pulse"></div>
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-3/4"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl animate-pulse shadow-sm"></div>
          ))}
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl animate-pulse shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 shadow-lg">
        <CardContent className="py-8 md:py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 rounded-full bg-gradient-to-br from-red-100 to-pink-100 items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Error Loading Pages</h3>
              <p className="text-sm md:text-base text-gray-600">{error}</p>
            </div>
            <Button onClick={fetchPages} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pages.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="py-16 md:py-20 text-center">
          <div className="inline-flex h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center mb-6">
            <Globe className="h-10 w-10 md:h-12 md:w-12 text-blue-500" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">No Pages Tracked Yet</h3>
          <p className="text-gray-600 max-w-md mx-auto text-sm md:text-base">
            Pages you visit will appear here once you interact with the consent widget.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
      {/* Modern Header with Gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-white to-blue-50/50 border border-blue-100 rounded-2xl p-6 md:p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center shadow-lg flex-shrink-0">
              <Sparkles className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                Your Page History
              </h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                Track all pages where you've interacted with the consent widget and manage your privacy preferences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center flex flex-shrink-0">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Total Pages</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {stats.totalPages}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
          <CardHeader className="pb-3 md:pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center flex flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Accepted</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {stats.totalConsents}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900">Pages Where You've Interacted</h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              A list of all pages where you've seen the consent widget and your response
            </p>
          </div>
          <Button onClick={fetchPages} variant="outline" size="sm" className="flex-shrink-0">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Pages Table - Desktop */}
      <Card className="hidden md:block border-0 shadow-lg">
        <CardContent className="p-0">
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                  <TableHead className="min-w-[250px] font-semibold">Page</TableHead>
                  <TableHead className="min-w-[100px] font-semibold">Status</TableHead>
                  <TableHead className="min-w-[80px] font-semibold">Activities</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">First Visit</TableHead>
                  <TableHead className="min-w-[140px] font-semibold">Last Visit</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page, index) => (
                  <TableRow key={index} className="hover:bg-blue-50/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900 line-clamp-1">{getPageTitle(page)}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[350px]" title={page.url}>
                          {page.url}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(page.consentStatus)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-300">{page.activitiesCount}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(page.firstVisit)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(page.lastVisit)}
                    </TableCell>
                    <TableCell>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Visit page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pages List - Mobile */}
      <div className="md:hidden space-y-4">
        {pages.map((page, index) => {
          const isAccepted = page.consentStatus === 'accepted';
          return (
            <Card
              key={index}
              className={`overflow-hidden border-0 shadow-lg transition-all duration-300 ${
                isAccepted
                  ? 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 ring-2 ring-green-200'
                  : 'bg-gradient-to-br from-white to-gray-50'
              }`}
            >
              <CardContent className="p-5">
                <div className="space-y-4">
                  {/* Page Title and URL */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-gray-900 line-clamp-2 text-base flex-1">
                        {getPageTitle(page)}
                      </h4>
                      {isAccepted && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 flex-shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 break-all" title={page.url}>
                      {page.url}
                    </p>
                  </div>

                  {/* Status and Activities */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(page.consentStatus)}
                    <Badge variant="outline" className="text-xs border-gray-300 bg-white/80">
                      {page.activitiesCount} {page.activitiesCount === 1 ? 'Activity' : 'Activities'}
                    </Badge>
                  </div>

                  {/* Dates */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 space-y-2 border border-gray-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">First Visit:</span>
                      <span className="text-gray-700 font-medium">{formatDate(page.firstVisit)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">Last Visit:</span>
                      <span className="text-gray-700 font-medium">{formatDate(page.lastVisit)}</span>
                    </div>
                  </div>

                  {/* Visit Link */}
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-9 rounded-lg px-3 border-2 border-blue-200 bg-transparent hover:bg-blue-50 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    <span>Visit Page</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
