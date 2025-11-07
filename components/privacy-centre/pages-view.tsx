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
import { ExternalLink, Loader2, AlertCircle, Globe } from 'lucide-react';

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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Partial</Badge>;
      case 'revoked':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Revoked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pages Tracked Yet</h3>
          <p className="text-gray-600">
            Pages you visit will appear here once you provide consent.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pages Visited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalPages}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pages with Consent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalConsents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pages Where You've Given Consent</CardTitle>
          <CardDescription>
            A list of all pages where you've interacted with the consent widget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Page</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activities</TableHead>
                  <TableHead>First Visit</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{getPageTitle(page)}</span>
                        <span className="text-xs text-gray-500 truncate max-w-md" title={page.url}>
                          {page.url}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(page.consentStatus)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{page.activitiesCount}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(page.firstVisit)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(page.lastVisit)}
                    </TableCell>
                    <TableCell>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
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
    </div>
  );
}
