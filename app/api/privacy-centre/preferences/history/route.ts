import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Privacy Centre Consent History API
 * Allows visitors to view their consent change history
 * Supports export to CSV and PDF
 * 
 * NOTE: Uses service role client to bypass RLS - this is a public endpoint
 * that allows anonymous visitors to view and export their consent history.
 */

// GET - Fetch visitor's consent history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    
    const visitorId = searchParams.get('visitorId');
    const widgetId = searchParams.get('widgetId');
    const format = searchParams.get('format'); // 'json' (default), 'csv', or 'pdf'

    if (!visitorId || !widgetId) {
      return NextResponse.json(
        { error: 'visitorId and widgetId are required' },
        { status: 400 }
      );
    }

    // Fetch consent history with activity details
    const { data: history, error: historyError } = await supabase
      .from('consent_history')
      .select(`
        *,
        processing_activities (
          activity_name,
          industry
        )
      `)
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId)
      .order('changed_at', { ascending: false });

    // Fetch consent records to get page URLs for each time period
    const { data: consentRecords } = await supabase
      .from('dpdpa_consent_records')
      .select('consent_given_at, current_url, page_title')
      .eq('visitor_id', visitorId)
      .eq('widget_id', widgetId)
      .not('current_url', 'is', null)
      .order('consent_given_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching consent history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch consent history' },
        { status: 500 }
      );
    }

    // Format history records with page context
    const formattedHistory = (history || []).map((record: any) => {
      // Find the closest consent record by timestamp to get page URL
      let pageUrl = null;
      let pageTitle = null;
      
      if (consentRecords && consentRecords.length > 0) {
        const recordTime = new Date(record.changed_at).getTime();
        // Find the record with closest timestamp (within 1 minute)
        const closestRecord = consentRecords.find((cr: any) => {
          const crTime = new Date(cr.consent_given_at).getTime();
          return Math.abs(crTime - recordTime) < 60000; // Within 1 minute
        });
        
        if (closestRecord) {
          pageUrl = closestRecord.current_url;
          pageTitle = closestRecord.page_title;
        }
      }
      
      return {
        id: record.id,
        activityName: record.processing_activities?.activity_name || 'Unknown Activity',
        industry: record.processing_activities?.industry || 'N/A',
        previousStatus: record.previous_status,
        newStatus: record.new_status,
        changeReason: record.change_reason,
        changeSource: record.change_source,
        changedAt: record.changed_at,
        deviceType: record.device_type,
        language: record.language,
        consentVersion: record.consent_version,
        pageUrl: pageUrl,
        pageTitle: pageTitle,
      };
    });

    // Return based on format
    if (format === 'csv') {
      return generateCSV(formattedHistory, visitorId);
    }

    if (format === 'pdf') {
      return await generatePDF(formattedHistory, visitorId, widgetId);
    }

    // Default JSON response
    return NextResponse.json({
      data: {
        visitorId,
        widgetId,
        totalRecords: formattedHistory.length,
        history: formattedHistory,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/privacy-centre/preferences/history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate CSV export
function generateCSV(history: any[], visitorId: string) {
  const headers = [
    'Date & Time',
    'Activity',
    'Industry',
    'Previous Status',
    'New Status',
    'Page',
    'Reason',
    'Source',
    'Device',
  ];

  const rows = history.map((record) => [
    new Date(record.changedAt).toLocaleString(),
    record.activityName,
    record.industry,
    record.previousStatus || 'N/A',
    record.newStatus,
    record.pageTitle || record.pageUrl || 'N/A',
    record.changeReason || 'N/A',
    record.changeSource,
    record.deviceType || 'N/A',
  ]);

  let csv = headers.join(',') + '\n';
  csv += rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

  const filename = `consent-history-${visitorId}-${Date.now()}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// Generate PDF export
async function generatePDF(history: any[], visitorId: string, widgetId: string) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text('Consent History Report', 14, 20);

  // Metadata
  doc.setFontSize(10);
  doc.text(`Visitor ID: ${visitorId}`, 14, 30);
  doc.text(`Widget ID: ${widgetId}`, 14, 36);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 42);
  doc.text(`Total Records: ${history.length}`, 14, 48);

  // Table
  const tableData = history.map((record) => [
    new Date(record.changedAt).toLocaleString(),
    record.activityName,
    record.previousStatus || 'N/A',
    record.newStatus,
    record.pageTitle || 'N/A',
    record.changeSource,
  ]);

  autoTable(doc, {
    head: [['Date & Time', 'Activity', 'Previous', 'New Status', 'Page', 'Source']],
    body: tableData,
    startY: 55,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [59, 130, 246] }, // Blue
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const pdfBuffer = doc.output('arraybuffer');
  const filename = `consent-history-${visitorId}-${Date.now()}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
