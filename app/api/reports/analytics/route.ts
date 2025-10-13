import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logFailure, logSuccess } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get('dateRange') || '30';
    const format = searchParams.get('format') || 'json';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    if (dateRange !== 'all') {
      startDate.setDate(startDate.getDate() - parseInt(dateRange));
    } else {
      startDate.setFullYear(startDate.getFullYear() - 10); // 10 years back for "all"
    }

    // Fetch consent records for the date range
    const { data: records, error: recordsError } = await supabase
      .from('consent_records')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (recordsError) {
      console.error('Error fetching records:', recordsError);
      await logFailure(user.id, 'consent.record', 'consent_records', recordsError.message, request);
      return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
    }

    // Calculate metrics
    const total = records?.length || 0;
    const granted = records?.filter(r => r.status === 'accepted').length || 0;
    const denied = records?.filter(r => r.status === 'rejected').length || 0;
    const withdrawn = records?.filter(r => r.status === 'revoked').length || 0;
    const consentRate = total > 0 ? ((granted / total) * 100).toFixed(1) : '0.0';

    // Group by date for trends with weekly aggregation for better visualization
    const trendMap = new Map<string, { granted: number; denied: number; withdrawn: number }>();
    
    records?.forEach((record) => {
      const date = new Date(record.created_at).toISOString().split('T')[0];
      if (!trendMap.has(date)) {
        trendMap.set(date, { granted: 0, denied: 0, withdrawn: 0 });
      }
      const stats = trendMap.get(date)!;
      if (record.status === 'accepted') {
        stats.granted++;
      } else if (record.status === 'rejected') {
        stats.denied++;
      } else if (record.status === 'revoked') {
        stats.withdrawn++;
      }
    });

    // Sort by date and convert to array
    const trendData = Array.from(trendMap.entries())
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .map(([date, stats]) => ({
        date,
        granted: stats.granted,
        denied: stats.denied,
        withdrawn: stats.withdrawn,
      }));

    // Group by device type with proper normalization
    const deviceMap = new Map<string, number>();
    records?.forEach((record) => {
      let device = record.device_type || 'Unknown';
      // Normalize device names
      device = device.charAt(0).toUpperCase() + device.slice(1).toLowerCase();
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });

    // Sort by count descending
    const deviceData = Array.from(deviceMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0',
      }));

    // Group by IP/location (enhanced geographic data)
    // Note: In production, integrate with a GeoIP service like MaxMind or IP2Location
    const locationMap = new Map<string, { consents: number; granted: number }>();
    records?.forEach((record) => {
      // Extract country from IP or metadata
      // This is a simplified version - in production, use proper GeoIP lookup
      let location = 'Unknown';
      const ip = record.ip_address;
      
      if (ip) {
        // Simplified geographic mapping based on IP patterns
        if (ip.startsWith('192.168') || ip.startsWith('10.') || ip.startsWith('172.')) {
          location = 'India'; // Default for private/local IPs during development
        } else if (ip.startsWith('203.')) {
          location = 'India';
        } else if (ip.startsWith('8.') || ip.startsWith('64.')) {
          location = 'United States';
        } else if (ip.startsWith('82.') || ip.startsWith('86.')) {
          location = 'United Kingdom';
        } else if (ip.startsWith('85.')) {
          location = 'Germany';
        } else {
          location = 'Other';
        }
      }
      
      if (!locationMap.has(location)) {
        locationMap.set(location, { consents: 0, granted: 0 });
      }
      const stats = locationMap.get(location)!;
      stats.consents++;
      if (record.status === 'accepted') {
        stats.granted++;
      }
    });

    // Sort by consents descending and limit to top countries
    const geographicData = Array.from(locationMap.entries())
      .map(([country, stats]) => ({
        country,
        consents: stats.consents,
        consentRate: stats.consents > 0 ? Math.round((stats.granted / stats.consents) * 100) : 0,
      }))
      .sort((a, b) => b.consents - a.consents)
      .slice(0, 10); // Top 10 countries

    // Calculate additional metrics
    const uniqueCountries = geographicData.length;
    const uniqueDevices = deviceData.length;
    
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: dateRange,
      },
      summary: {
        totalConsents: total,
        grantedConsents: granted,
        deniedConsents: denied,
        withdrawnConsents: withdrawn,
        consentRate: parseFloat(consentRate),
        uniqueCountries,
        uniqueDevices,
      },
      trendData,
      deviceData,
      geographicData,
      metadata: {
        recordsAnalyzed: total,
        oldestRecord: records && records.length > 0 ? records[0].created_at : null,
        newestRecord: records && records.length > 0 ? records[records.length - 1].created_at : null,
      },
    };

    // Log the report generation
    await logSuccess(user.id, 'consent.record', 'reports', undefined, undefined, request);

    // Return based on format
    if (format === 'json') {
      return NextResponse.json(reportData);
    } else if (format === 'csv') {
      // Generate CSV
      const csvLines = [
        ['Consently Analytics Report'],
        ['Generated:', new Date().toLocaleString()],
        ['Date Range:', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`],
        [],
        ['Summary Metrics'],
        ['Metric', 'Value'],
        ['Total Consents', total.toString()],
        ['Granted', granted.toString()],
        ['Denied', denied.toString()],
        ['Withdrawn', withdrawn.toString()],
        ['Consent Rate', `${consentRate}%`],
        [],
        ['Trend Data'],
        ['Date', 'Granted', 'Denied', 'Withdrawn'],
        ...trendData.map(t => [t.date, t.granted.toString(), t.denied.toString(), t.withdrawn.toString()]),
        [],
        ['Device Breakdown'],
        ['Device', 'Count', 'Percentage'],
        ...deviceData.map(d => [d.name, d.value.toString(), `${d.percentage}%`]),
      ];

      const csv = csvLines.map(line => line.join(',')).join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="consent-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
