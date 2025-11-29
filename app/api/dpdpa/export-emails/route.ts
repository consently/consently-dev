import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logSuccess } from '@/lib/audit';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * GET /api/dpdpa/export-emails
 * Export verified visitor emails from consent records
 * 
 * Query Parameters:
 * - format: 'csv' | 'json' | 'pdf' (default: 'csv')
 * - widgetId: optional widget ID filter
 * - status: 'all' | 'accepted' | 'rejected' | 'partial' | 'revoked' (default: 'all')
 * - startDate: ISO date string for filtering
 * - endDate: ISO date string for filtering
 * - includeAnonymous: 'true' | 'false' - include records without verified emails (default: 'false')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth required
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const widgetId = searchParams.get('widgetId') || undefined;
    const status = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const includeAnonymous = searchParams.get('includeAnonymous') === 'true';

    // Validate format
    if (!['csv', 'json', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Use csv, json, or pdf' },
        { status: 400 }
      );
    }

    // Get user's widgets
    const { data: widgets, error: widgetsError } = await supabase
      .from('dpdpa_widget_configs')
      .select('widget_id, name, domain')
      .eq('user_id', user.id);

    if (widgetsError) {
      console.error('Error fetching widgets:', widgetsError);
      return NextResponse.json(
        { error: 'Failed to fetch widgets' },
        { status: 500 }
      );
    }

    const widgetIds = (widgets || []).map((w: any) => w.widget_id);
    const widgetMap = new Map((widgets || []).map((w: any) => [w.widget_id, w]));

    if (widgetIds.length === 0) {
      return NextResponse.json(
        { error: 'No widgets found for this user' },
        { status: 404 }
      );
    }

    // Validate widgetId if provided
    if (widgetId && !widgetIds.includes(widgetId)) {
      return NextResponse.json(
        { error: 'Widget not found or access denied' },
        { status: 404 }
      );
    }

    // Build query for consent records
    let query = supabase
      .from('dpdpa_consent_records')
      .select(`
        id,
        visitor_id,
        visitor_email,
        visitor_email_hash,
        consent_status,
        consent_given_at,
        widget_id,
        device_type,
        country_code,
        language
      `)
      .order('consent_given_at', { ascending: false });

    // Filter by widget(s)
    if (widgetId) {
      query = query.eq('widget_id', widgetId);
    } else {
      query = query.in('widget_id', widgetIds);
    }

    // Filter by status
    if (status !== 'all') {
      query = query.eq('consent_status', status);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('consent_given_at', startDate);
    }
    if (endDate) {
      query = query.lte('consent_given_at', endDate);
    }

    // Only get records with verified emails unless includeAnonymous is true
    if (!includeAnonymous) {
      query = query.not('visitor_email', 'is', null);
    }

    const { data: records, error: recordsError } = await query;

    if (recordsError) {
      console.error('Error fetching consent records:', recordsError);
      return NextResponse.json(
        { error: 'Failed to fetch consent records' },
        { status: 500 }
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json(
        { 
          error: 'No records found matching the criteria',
          message: includeAnonymous 
            ? 'No consent records found for the selected filters' 
            : 'No verified email records found. Try including anonymous records or adjusting filters.'
        },
        { status: 404 }
      );
    }

    // Deduplicate by email (keep most recent consent per email)
    const emailMap = new Map<string, any>();
    for (const record of records) {
      const email = record.visitor_email?.toLowerCase();
      if (email) {
        // Keep the most recent record for each email
        if (!emailMap.has(email)) {
          emailMap.set(email, record);
        }
      } else if (includeAnonymous) {
        // For anonymous records, use visitor_id as key
        const key = `anonymous_${record.visitor_id}`;
        if (!emailMap.has(key)) {
          emailMap.set(key, record);
        }
      }
    }

    const uniqueRecords = Array.from(emailMap.values());

    // Enrich records with widget info
    const enrichedRecords = uniqueRecords.map((record: any) => {
      const widget = widgetMap.get(record.widget_id);
      return {
        email: record.visitor_email || 'Anonymous',
        emailHash: record.visitor_email_hash || null,
        consentStatus: record.consent_status,
        consentDate: record.consent_given_at,
        widgetName: widget?.name || 'Unknown Widget',
        domain: widget?.domain || 'Unknown Domain',
        deviceType: record.device_type || 'Unknown',
        country: record.country_code || 'Unknown',
        language: record.language || 'Unknown',
        visitorId: record.visitor_id,
      };
    });

    // Log the export action
    await logSuccess(
      user.id,
      'email.export',
      'consent_emails',
      `Exported ${enrichedRecords.length} emails`,
      {
        format,
        widgetId: widgetId || 'all',
        status,
        includeAnonymous,
        recordCount: enrichedRecords.length,
      },
      request
    );

    // Generate export based on format
    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'json') {
      return new NextResponse(
        JSON.stringify({
          exportDate: new Date().toISOString(),
          totalRecords: enrichedRecords.length,
          filters: {
            widgetId: widgetId || 'all',
            status,
            startDate,
            endDate,
            includeAnonymous,
          },
          records: enrichedRecords,
        }, null, 2),
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="consent-emails-${timestamp}.json"`,
          },
        }
      );
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text('Verified Email Export Report', 14, 20);

      // Metadata
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${enrichedRecords.length}`, 14, 36);
      doc.text(`Status Filter: ${status}`, 14, 42);
      if (widgetId) {
        const widget = widgetMap.get(widgetId);
        doc.text(`Widget: ${widget?.name || widgetId}`, 14, 48);
      }

      // Table data
      const tableData = enrichedRecords.map((record: any) => [
        record.email,
        record.consentStatus,
        new Date(record.consentDate).toLocaleDateString(),
        record.domain,
        record.deviceType,
        record.country,
      ]);

      autoTable(doc, {
        head: [['Email', 'Status', 'Consent Date', 'Domain', 'Device', 'Country']],
        body: tableData,
        startY: widgetId ? 54 : 48,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="consent-emails-${timestamp}.pdf"`,
        },
      });
    } else {
      // CSV format (default)
      const escapeCSV = (value: string | null | undefined): string => {
        if (!value) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      const headers = [
        'Email',
        'Consent Status',
        'Consent Date',
        'Widget Name',
        'Domain',
        'Device Type',
        'Country',
        'Language',
        'Visitor ID',
      ];

      const csvRows = [headers.join(',')];

      enrichedRecords.forEach((record: any) => {
        const row = [
          escapeCSV(record.email),
          escapeCSV(record.consentStatus),
          escapeCSV(new Date(record.consentDate).toISOString()),
          escapeCSV(record.widgetName),
          escapeCSV(record.domain),
          escapeCSV(record.deviceType),
          escapeCSV(record.country),
          escapeCSV(record.language),
          escapeCSV(record.visitorId),
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="consent-emails-${timestamp}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Error exporting emails:', error);
    return NextResponse.json(
      { error: 'Failed to export emails' },
      { status: 500 }
    );
  }
}

