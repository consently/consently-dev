import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logFailure, logSuccess } from '@/lib/audit';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const partial = records?.filter(r => r.status === 'partial').length || 0;
    const withdrawn = records?.filter(r => r.status === 'revoked').length || 0;
    const consentRate = total > 0 ? ((granted / total) * 100).toFixed(1) : '0.0';
    const denialRate = total > 0 ? ((denied / total) * 100).toFixed(1) : '0.0';
    const revocationRate = total > 0 ? ((withdrawn / total) * 100).toFixed(1) : '0.0';
    
    // Calculate unique visitors (based on IP or consent_id)
    const uniqueVisitorsSet = new Set<string>();
    records?.forEach(r => {
      const identifier = r.consent_id || r.ip_address || r.id;
      if (identifier) uniqueVisitorsSet.add(identifier);
    });
    const uniqueVisitors = uniqueVisitorsSet.size;
    
    // Calculate return visitors (visitors with multiple consents)
    const visitorCountMap = new Map<string, number>();
    records?.forEach(r => {
      const identifier = r.consent_id || r.ip_address || r.id;
      if (identifier) {
        visitorCountMap.set(identifier, (visitorCountMap.get(identifier) || 0) + 1);
      }
    });
    const returnVisitors = Array.from(visitorCountMap.values()).filter(count => count > 1).length;

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

    // Calculate hourly patterns (0-23 hours)
    const hourlyMap = new Map<number, { consents: number; granted: number; denied: number }>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { consents: 0, granted: 0, denied: 0 });
    }
    records?.forEach((record) => {
      const hour = new Date(record.created_at).getHours();
      const stats = hourlyMap.get(hour)!;
      stats.consents++;
      if (record.status === 'accepted') stats.granted++;
      if (record.status === 'rejected') stats.denied++;
    });
    const hourlyData = Array.from(hourlyMap.entries())
      .map(([hour, stats]) => ({
        hour,
        consents: stats.consents,
        granted: stats.granted,
        denied: stats.denied,
      }))
      .sort((a, b) => a.hour - b.hour);

    // Calculate day of week patterns
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeekMap = new Map<number, { consents: number; granted: number; denied: number }>();
    for (let i = 0; i < 7; i++) {
      dayOfWeekMap.set(i, { consents: 0, granted: 0, denied: 0 });
    }
    records?.forEach((record) => {
      const dayOfWeek = new Date(record.created_at).getDay();
      const stats = dayOfWeekMap.get(dayOfWeek)!;
      stats.consents++;
      if (record.status === 'accepted') stats.granted++;
      if (record.status === 'rejected') stats.denied++;
    });
    const dayOfWeekData = Array.from(dayOfWeekMap.entries())
      .map(([dayNumber, stats]) => ({
        day: dayNames[dayNumber],
        dayNumber,
        consents: stats.consents,
        granted: stats.granted,
        denied: stats.denied,
      }))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    // Parse browser from user_agent
    const parseBrowser = (userAgent: string | null): string => {
      if (!userAgent) return 'Unknown';
      const ua = userAgent.toLowerCase();
      if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
      if (ua.includes('firefox')) return 'Firefox';
      if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
      if (ua.includes('edg')) return 'Edge';
      if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
      if (ua.includes('msie') || ua.includes('trident')) return 'IE';
      return 'Other';
    };

    // Parse OS from user_agent
    const parseOS = (userAgent: string | null): string => {
      if (!userAgent) return 'Unknown';
      const ua = userAgent.toLowerCase();
      if (ua.includes('windows')) return 'Windows';
      if (ua.includes('mac os') || ua.includes('macos')) return 'macOS';
      if (ua.includes('linux') && !ua.includes('android')) return 'Linux';
      if (ua.includes('android')) return 'Android';
      if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
      return 'Other';
    };

    // Calculate browser breakdown
    const browserMap = new Map<string, { count: number; granted: number }>();
    records?.forEach((record) => {
      const browser = parseBrowser(record.user_agent);
      if (!browserMap.has(browser)) {
        browserMap.set(browser, { count: 0, granted: 0 });
      }
      const stats = browserMap.get(browser)!;
      stats.count++;
      if (record.status === 'accepted') stats.granted++;
    });
    const browserData = Array.from(browserMap.entries())
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        percentage: total > 0 ? Number(((stats.count / total) * 100).toFixed(1)) : 0,
        consentRate: stats.count > 0 ? Number(((stats.granted / stats.count) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate OS breakdown
    const osMap = new Map<string, { count: number; granted: number }>();
    records?.forEach((record) => {
      const os = parseOS(record.user_agent);
      if (!osMap.has(os)) {
        osMap.set(os, { count: 0, granted: 0 });
      }
      const stats = osMap.get(os)!;
      stats.count++;
      if (record.status === 'accepted') stats.granted++;
    });
    const osData = Array.from(osMap.entries())
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        percentage: total > 0 ? Number(((stats.count / total) * 100).toFixed(1)) : 0,
        consentRate: stats.count > 0 ? Number(((stats.granted / stats.count) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate language breakdown
    const languageMap = new Map<string, { count: number; granted: number }>();
    records?.forEach((record) => {
      const lang = record.language || 'Unknown';
      if (!languageMap.has(lang)) {
        languageMap.set(lang, { count: 0, granted: 0 });
      }
      const stats = languageMap.get(lang)!;
      stats.count++;
      if (record.status === 'accepted') stats.granted++;
    });
    const languageData = Array.from(languageMap.entries())
      .map(([language, stats]) => ({
        language,
        count: stats.count,
        percentage: total > 0 ? Number(((stats.count / total) * 100).toFixed(1)) : 0,
        consentRate: stats.count > 0 ? Number(((stats.granted / stats.count) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate conversion funnel
    const conversionFunnel = {
      visitors: uniqueVisitors,
      consents: total,
      granted,
      partial,
      conversionRate: uniqueVisitors > 0 ? Number(((total / uniqueVisitors) * 100).toFixed(1)) : 0,
    };

    // Calculate previous period comparison
    let previousPeriod: any = undefined;
    if (dateRange !== 'all') {
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(startDate);
      const daysDiff = parseInt(dateRange);
      previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
      
      const { data: previousRecords } = await supabase
        .from('consent_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', previousEndDate.toISOString());
      
      if (previousRecords && previousRecords.length > 0) {
        const prevTotal = previousRecords.length;
        const prevGranted = previousRecords.filter(r => r.status === 'accepted').length;
        const prevConsentRate = prevTotal > 0 ? (prevGranted / prevTotal) * 100 : 0;
        const change = total - prevTotal;
        const changePercentage = prevTotal > 0 ? ((change / prevTotal) * 100) : 0;
        
        previousPeriod = {
          totalConsents: prevTotal,
          consentRate: Number(prevConsentRate.toFixed(1)),
          change,
          changePercentage: Number(changePercentage.toFixed(1)),
        };
      }
    }

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
        partialConsents: partial,
        consentRate: parseFloat(consentRate),
        denialRate: parseFloat(denialRate),
        revocationRate: parseFloat(revocationRate),
        uniqueVisitors,
        returnVisitors,
        uniqueCountries,
        uniqueDevices,
      },
      trendData,
      deviceData,
      geographicData,
      hourlyData,
      dayOfWeekData,
      browserData,
      osData,
      languageData,
      conversionFunnel,
      previousPeriod,
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
      // Generate CSV with all data including geographic data
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
        ['Partial', partial.toString()],
        ['Withdrawn', withdrawn.toString()],
        ['Consent Rate', `${consentRate}%`],
        ['Denial Rate', `${denialRate}%`],
        ['Revocation Rate', `${revocationRate}%`],
        ['Unique Visitors', uniqueVisitors.toString()],
        ['Return Visitors', returnVisitors.toString()],
        ['Unique Countries', uniqueCountries.toString()],
        ['Unique Devices', uniqueDevices.toString()],
        [],
        ['Trend Data'],
        ['Date', 'Granted', 'Denied', 'Withdrawn'],
        ...trendData.map(t => [t.date, t.granted.toString(), t.denied.toString(), t.withdrawn.toString()]),
        [],
        ['Device Breakdown'],
        ['Device', 'Count', 'Percentage'],
        ...deviceData.map(d => [d.name, d.value.toString(), `${d.percentage}%`]),
        [],
        ['Geographic Distribution'],
        ['Country', 'Total Consents', 'Consent Rate (%)'],
        ...geographicData.map(g => [g.country, g.consents.toString(), g.consentRate.toString()]),
        [],
        ['Hourly Patterns'],
        ['Hour', 'Total Consents', 'Granted', 'Denied'],
        ...hourlyData.map(h => [h.hour.toString(), h.consents.toString(), h.granted.toString(), h.denied.toString()]),
        [],
        ['Day of Week Patterns'],
        ['Day', 'Total Consents', 'Granted', 'Denied'],
        ...dayOfWeekData.map(d => [d.day, d.consents.toString(), d.granted.toString(), d.denied.toString()]),
        [],
        ['Browser Breakdown'],
        ['Browser', 'Count', 'Percentage', 'Consent Rate (%)'],
        ...browserData.map(b => [b.name, b.count.toString(), b.percentage.toString(), b.consentRate.toString()]),
        [],
        ['Operating System Breakdown'],
        ['OS', 'Count', 'Percentage', 'Consent Rate (%)'],
        ...osData.map(o => [o.name, o.count.toString(), o.percentage.toString(), o.consentRate.toString()]),
        [],
        ['Language Breakdown'],
        ['Language', 'Count', 'Percentage', 'Consent Rate (%)'],
        ...languageData.map(l => [l.language, l.count.toString(), l.percentage.toString(), l.consentRate.toString()]),
        [],
        ['Conversion Funnel'],
        ['Metric', 'Value'],
        ['Visitors', conversionFunnel.visitors.toString()],
        ['Consents', conversionFunnel.consents.toString()],
        ['Granted', conversionFunnel.granted.toString()],
        ['Partial', conversionFunnel.partial.toString()],
        ['Conversion Rate', `${conversionFunnel.conversionRate}%`],
      ];

      // Escape commas and quotes in CSV values
      const escapeCsvValue = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csv = csvLines.map(line => line.map(escapeCsvValue).join(',')).join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="consent-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'pdf') {
      // Generate PDF report
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let currentY = margin;

      // Helper function to check page break
      const checkPageBreak = (requiredHeight: number = 20) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
      };

      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text('Consent Analytics Report', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Report metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99); // Gray-600
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, currentY);
      currentY += 6;
      doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, margin, currentY);
      currentY += 10;

      // Summary section
      checkPageBreak(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55); // Gray-800
      doc.text('Summary Metrics', margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryData = [
        ['Total Consents', total.toLocaleString()],
        ['Granted', granted.toLocaleString()],
        ['Denied', denied.toLocaleString()],
        ['Partial', partial.toLocaleString()],
        ['Withdrawn', withdrawn.toLocaleString()],
        ['Consent Rate', `${consentRate}%`],
        ['Denial Rate', `${denialRate}%`],
        ['Revocation Rate', `${revocationRate}%`],
        ['Unique Visitors', uniqueVisitors.toLocaleString()],
        ['Return Visitors', returnVisitors.toLocaleString()],
        ['Unique Countries', uniqueCountries.toString()],
        ['Unique Devices', uniqueDevices.toString()],
      ];

      summaryData.forEach(([key, value]) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81); // Gray-700
        doc.text(`${key}:`, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99); // Gray-600
        doc.text(value, margin + 60, currentY);
        currentY += 7;
      });

      currentY += 5;

      // Device breakdown table
      if (deviceData.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Device Breakdown', margin, currentY);
        currentY += 8;

        const deviceTableData = deviceData.map(d => [d.name, d.value.toString(), `${d.percentage}%`]);

        autoTable(doc, {
          startY: currentY,
          head: [['Device', 'Count', 'Percentage']],
          body: deviceTableData,
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Geographic distribution table
      if (geographicData.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Geographic Distribution', margin, currentY);
        currentY += 8;

        const geoTableData = geographicData.map(g => [
          g.country,
          g.consents.toString(),
          `${g.consentRate}%`,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Country', 'Total Consents', 'Consent Rate']],
          body: geoTableData,
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Browser breakdown table
      if (browserData.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Browser Breakdown', margin, currentY);
        currentY += 8;

        const browserTableData = browserData.map(b => [
          b.name,
          b.count.toString(),
          `${b.percentage}%`,
          `${b.consentRate}%`,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Browser', 'Count', 'Percentage', 'Consent Rate']],
          body: browserTableData,
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // OS breakdown table
      if (osData.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Operating System Breakdown', margin, currentY);
        currentY += 8;

        const osTableData = osData.map(o => [
          o.name,
          o.count.toString(),
          `${o.percentage}%`,
          `${o.consentRate}%`,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['OS', 'Count', 'Percentage', 'Consent Rate']],
          body: osTableData,
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 9,
            cellPadding: 4,
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Conversion Funnel
      checkPageBreak(30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Conversion Funnel', margin, currentY);
      currentY += 10;

      const funnelData = [
        ['Visitors', conversionFunnel.visitors.toLocaleString()],
        ['Consents', conversionFunnel.consents.toLocaleString()],
        ['Granted', conversionFunnel.granted.toLocaleString()],
        ['Partial', conversionFunnel.partial.toLocaleString()],
        ['Conversion Rate', `${conversionFunnel.conversionRate}%`],
      ];

      funnelData.forEach(([key, value]) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(`${key}:`, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        doc.text(value, margin + 60, currentY);
        currentY += 7;
      });

      currentY += 5;

      // Trend data table (limited to last 30 days for PDF)
      if (trendData.length > 0) {
        checkPageBreak(50);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text('Consent Trends (Last 30 Days)', margin, currentY);
        currentY += 8;

        const recentTrends = trendData.slice(-30);
        const trendTableData = recentTrends.map(t => [
          t.date,
          t.granted.toString(),
          t.denied.toString(),
          t.withdrawn.toString(),
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Date', 'Granted', 'Denied', 'Withdrawn']],
          body: trendTableData,
          theme: 'grid',
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251],
          },
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 8,
            cellPadding: 3,
          },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Footer on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175); // Gray-400
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          'Consently - Consent Management Platform',
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Generate PDF blob
      const pdfBlob = doc.output('blob');
      
      return new NextResponse(pdfBlob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="consent-report-${new Date().toISOString().split('T')[0]}.pdf"`,
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
