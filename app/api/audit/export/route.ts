import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv'; // csv, json, or pdf
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Fetch all audit logs for user (with date filtering if provided)
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user.id);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch audit logs' },
        { status: 500 }
      );
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: 'No audit logs found' },
        { status: 404 }
      );
    }

    // Generate export based on format
    if (format === 'json') {
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.json"`
        }
      });
    } else if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Audit Logs Report', 14, 20);
      
      // Metadata
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Records: ${logs.length}`, 14, 36);
      if (startDate) doc.text(`Start Date: ${new Date(startDate).toLocaleDateString()}`, 14, 42);
      if (endDate) doc.text(`End Date: ${new Date(endDate).toLocaleDateString()}`, 14, 48);
      
      // Table data
      const tableData = logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.action,
        log.resource_type,
        log.resource_id || 'N/A',
        log.status,
        log.ip_address || 'N/A',
      ]);
      
      autoTable(doc, {
        head: [['Date', 'Action', 'Resource Type', 'Resource ID', 'Status', 'IP Address']],
        body: tableData,
        startY: (startDate || endDate) ? 54 : 42,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.pdf"`
        }
      });
    } else {
      // CSV format (default)
      const headers = ['ID', 'Action', 'Resource Type', 'Resource ID', 'Status', 'IP Address', 'Created At'];
      const csvRows = [headers.join(',')];

      logs.forEach(log => {
        const row = [
          log.id,
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.status,
          log.ip_address || '',
          new Date(log.created_at).toISOString()
        ].map(val => `"${String(val).replace(/"/g, '""')}"`);
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`
        }
      });
    }

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}
