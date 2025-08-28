import { NextRequest, NextResponse } from 'next/server';
import { getRecordById } from '@/lib/getRecords';
import { getUserFromRequest } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import pool from '@/lib/db';

// GET /api/records/[id]/download-complete - Download merged PDF with record information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recordId = parseInt(params.id);
    if (isNaN(recordId)) {
      return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
    }

    // Get record and verify ownership
    const record = await getRecordById(recordId, user.id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found or access denied' }, { status: 404 });
    }

    // Get related health metrics
    const metricsQuery = `
      SELECT metric_type, value_numeric, value_text, unit, metric_date
      FROM health_metrics 
      WHERE user_id = $1 
      AND metric_date BETWEEN $2::date - INTERVAL '7 days' AND $2::date + INTERVAL '7 days'
      ORDER BY metric_date DESC
    `;
    
    const metricsResult = await pool.query(metricsQuery, [user.id, record.record_date]);
    const relatedMetrics = metricsResult.rows;

    // Create a new PDF document for record information
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    // Load fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Colors
    const primaryColor = rgb(0.2, 0.4, 0.8); // Blue
    const textColor = rgb(0.2, 0.2, 0.2); // Dark gray
    const lightGray = rgb(0.9, 0.9, 0.9);
    
    let yPosition = height - 50;
    
    // Header
    page.drawRectangle({
      x: 0,
      y: yPosition - 10,
      width,
      height: 60,
      color: primaryColor,
    });
    
    page.drawText('Medical Record Summary', {
      x: 50,
      y: yPosition + 10,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    
    yPosition -= 80;
    
    // Record Information Section
    page.drawText('Record Information', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });
    
    yPosition -= 25;
    
    // Draw background for record info
    page.drawRectangle({
      x: 40,
      y: yPosition - 120,
      width: width - 80,
      height: 120,
      color: lightGray,
    });
    
    // Record details
    const recordInfo = [
      { label: 'Record Type:', value: record.record_type.replace('_', ' ').toUpperCase() },
      { label: 'Record Date:', value: new Date(record.record_date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }) },
      { label: 'Description:', value: record.description || 'No description provided' },
      { label: 'Created:', value: new Date(record.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      }) },
    ];
    
    recordInfo.forEach((info, index) => {
      page.drawText(info.label, {
        x: 50,
        y: yPosition - (index * 20),
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      page.drawText(info.value, {
        x: 150,
        y: yPosition - (index * 20),
        size: 10,
        font: regularFont,
        color: textColor,
      });
    });
    
    yPosition -= 140;
    
    // Health Metrics Section (if available)
    if (relatedMetrics.length > 0) {
      page.drawText('Related Health Metrics', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: primaryColor,
      });
      
      yPosition -= 25;
      
      // Draw background for metrics
      const metricsHeight = Math.min(relatedMetrics.length * 20 + 20, 200);
      page.drawRectangle({
        x: 40,
        y: yPosition - metricsHeight,
        width: width - 80,
        height: metricsHeight,
        color: lightGray,
      });
      
      page.drawText('Metric Type', {
        x: 50,
        y: yPosition - 10,
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      page.drawText('Value', {
        x: 200,
        y: yPosition - 10,
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      page.drawText('Date', {
        x: 350,
        y: yPosition - 10,
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      yPosition -= 25;
      
      relatedMetrics.forEach((metric, index) => {
        if (yPosition < 100) return; // Stop if we're running out of space
        
        const value = metric.value_text || 
          (metric.value_numeric && metric.unit ? `${metric.value_numeric} ${metric.unit}` : 
           metric.value_numeric?.toString() || 'N/A');
        
        page.drawText(metric.metric_type.replace('_', ' '), {
          x: 50,
          y: yPosition - (index * 20),
          size: 9,
          font: regularFont,
          color: textColor,
        });
        
        page.drawText(value, {
          x: 200,
          y: yPosition - (index * 20),
          size: 9,
          font: regularFont,
          color: textColor,
        });
        
        page.drawText(new Date(metric.metric_date).toLocaleDateString(), {
          x: 350,
          y: yPosition - (index * 20),
          size: 9,
          font: regularFont,
          color: textColor,
        });
      });
      
      yPosition -= relatedMetrics.length * 20 + 20;
    }
    
    // Footer
    if (yPosition > 100) {
      page.drawText('Generated by HealthCare Manager', {
        x: 50,
        y: 50,
        size: 8,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      });
      
      page.drawText(`Generated on: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      })}`, {
        x: width - 200,
        y: 50,
        size: 8,
        font: regularFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Check if there's an uploaded file to merge
    let finalPdfBytes;
    
    if (record.storage_uri && record.storage_uri !== 'sample_lab_report.pdf') {
      // Try to merge with uploaded PDF
      const sanitizedPath = record.storage_uri.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
      const filePath = path.resolve(process.cwd(), 'uploads', sanitizedPath);
      
      if (existsSync(filePath)) {
        try {
          const uploadedPdfBytes = await readFile(filePath);
          const uploadedPdf = await PDFDocument.load(uploadedPdfBytes);
          
          // Copy pages from uploaded PDF to our summary PDF
          const uploadedPages = await pdfDoc.copyPages(uploadedPdf, uploadedPdf.getPageIndices());
          uploadedPages.forEach((page) => pdfDoc.addPage(page));
          
          console.log(`Merged uploaded PDF with record summary for record ${recordId}`);
        } catch (mergeError) {
          console.error('Error merging PDFs:', mergeError);
          // Continue with just the summary PDF
        }
      }
    }
    
    finalPdfBytes = await pdfDoc.save();
    
    // Create filename
    const safeRecordType = record.record_type.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date(record.record_date).toISOString().split('T')[0];
    const filename = `complete_medical_record_${safeRecordType}_${dateStr}_${recordId}.pdf`;
    
    // Log download for security
    console.log(`Complete medical record downloaded: ${filename} by user ${user.id} (${user.email})`);

    return new NextResponse(finalPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Error in GET /api/records/[id]/download-complete:', error);
    return NextResponse.json(
      { error: 'Failed to generate complete medical record' },
      { status: 500 }
    );
  }
}
