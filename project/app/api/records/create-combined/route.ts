import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

// POST /api/records/create-combined - Create medical record with form data and optional PDF
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    
    // Extract form fields
    const record_type = formData.get('record_type') as string;
    const record_date = formData.get('record_date') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File | null;

    // Validate required fields
    if (!record_type || !record_date) {
      return NextResponse.json(
        { error: 'Record type and date are required' },
        { status: 400 }
      );
    }

    // Get related health metrics (within 7 days of record date)
    const metricsQuery = `
      SELECT metric_type, value_numeric, value_text, unit, metric_date
      FROM health_metrics 
      WHERE user_id = $1 
      AND metric_date BETWEEN $2::date - INTERVAL '7 days' AND $2::date + INTERVAL '7 days'
      ORDER BY metric_date DESC
    `;
    
    const metricsResult = await pool.query(metricsQuery, [user.id, record_date]);
    const relatedMetrics = metricsResult.rows;

    // Create comprehensive PDF document
    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = currentPage.getSize();
    
    // Load fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    // Colors
    const primaryColor = rgb(0.2, 0.4, 0.8);
    const textColor = rgb(0.2, 0.2, 0.2);
    const lightGray = rgb(0.9, 0.9, 0.9);
    
    let yPosition = height - 50;
    
    // Header
    currentPage.drawRectangle({
      x: 0,
      y: yPosition - 10,
      width,
      height: 60,
      color: primaryColor,
    });
    
    currentPage.drawText('Medical Record', {
      x: 50,
      y: yPosition + 10,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    
    yPosition -= 80;
    
    // Record Information Section
    currentPage.drawText('Record Information', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: primaryColor,
    });
    
    yPosition -= 25;
    
    // Draw background for record info
    currentPage.drawRectangle({
      x: 40,
      y: yPosition - 140,
      width: width - 80,
      height: 140,
      color: lightGray,
    });
    
    // Record details
    const recordInfo = [
      { label: 'Record Type:', value: record_type.replace('_', ' ').toUpperCase() },
      { label: 'Record Date:', value: new Date(record_date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      }) },
      { label: 'Description:', value: description || 'No description provided' },
      { label: 'Patient:', value: user.full_name || user.email },
      { label: 'Created:', value: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      }) },
    ];
    
    recordInfo.forEach((info, index) => {
      currentPage.drawText(info.label, {
        x: 50,
        y: yPosition - (index * 22),
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      const valueText = info.value.length > 60 ? info.value.substring(0, 57) + '...' : info.value;
      currentPage.drawText(valueText, {
        x: 150,
        y: yPosition - (index * 22),
        size: 10,
        font: regularFont,
        color: textColor,
      });
    });
    
    yPosition -= 160;
    
    // Health Metrics Section (if available)
    if (relatedMetrics.length > 0) {
      currentPage.drawText('Related Health Metrics', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: primaryColor,
      });
      
      yPosition -= 25;
      
      // Draw background for metrics
      const metricsHeight = Math.min(relatedMetrics.length * 20 + 40, 200);
      currentPage.drawRectangle({
        x: 40,
        y: yPosition - metricsHeight,
        width: width - 80,
        height: metricsHeight,
        color: lightGray,
      });
      
      // Table headers
      currentPage.drawText('Metric Type', {
        x: 50,
        y: yPosition - 10,
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      currentPage.drawText('Value', {
        x: 200,
        y: yPosition - 10,
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      currentPage.drawText('Date', {
        x: 350,
        y: yPosition - 10,
        size: 10,
        font: boldFont,
        color: textColor,
      });
      
      yPosition -= 25;
      
      // Metrics data
      relatedMetrics.slice(0, 8).forEach((metric, index) => {
        const value = metric.value_text || 
          (metric.value_numeric && metric.unit ? `${metric.value_numeric} ${metric.unit}` : 
           metric.value_numeric?.toString() || 'N/A');
        
        currentPage.drawText(metric.metric_type.replace('_', ' '), {
          x: 50,
          y: yPosition - (index * 20),
          size: 9,
          font: regularFont,
          color: textColor,
        });
        
        currentPage.drawText(value, {
          x: 200,
          y: yPosition - (index * 20),
          size: 9,
          font: regularFont,
          color: textColor,
        });
        
        currentPage.drawText(new Date(metric.metric_date).toLocaleDateString(), {
          x: 350,
          y: yPosition - (index * 20),
          size: 9,
          font: regularFont,
          color: textColor,
        });
      });
      
      yPosition -= relatedMetrics.length * 20 + 20;
    }

    // Handle uploaded PDF if provided
    let uploadedPdf = null;
    if (file && file.type === 'application/pdf' && file.size > 0) {
      try {
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: 'File size must be less than 10MB' },
            { status: 400 }
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);
        
        // Validate PDF header
        const pdfHeader = buffer.slice(0, 4);
        const headerString = Array.from(pdfHeader).map(byte => String.fromCharCode(byte)).join('');
        if (headerString !== '%PDF') {
          return NextResponse.json(
            { error: 'Invalid PDF file format' },
            { status: 400 }
          );
        }

        uploadedPdf = await PDFDocument.load(buffer);
      } catch (pdfError) {
        console.error('Error processing uploaded PDF:', pdfError);
        return NextResponse.json(
          { error: 'Invalid PDF file' },
          { status: 400 }
        );
      }
    }

    // Add separator page if we have uploaded content
    if (uploadedPdf) {
      // Add enough space or new page for separator
      if (yPosition < 150) {
        currentPage = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - 50;
      }
      
      yPosition -= 40;
      
      currentPage.drawText('Attached Documents', {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: primaryColor,
      });
      
      currentPage.drawText(`Original file: ${file?.name}`, {
        x: 50,
        y: yPosition - 25,
        size: 10,
        font: regularFont,
        color: textColor,
      });

      // Copy pages from uploaded PDF
      const uploadedPages = await pdfDoc.copyPages(uploadedPdf, uploadedPdf.getPageIndices());
      uploadedPages.forEach((page) => pdfDoc.addPage(page));
    }

    // Add footer to first page
    currentPage.drawText('Generated by HealthCare Manager', {
      x: 50,
      y: 50,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    currentPage.drawText(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    })}`, {
      x: width - 200,
      y: 50,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Generate final PDF
    const finalPdfBytes = await pdfDoc.save();
    
    // Store in database
    const storage_uri = `db_combined_${uuidv4()}`;
    const filename = `medical_record_${record_type}_${record_date.replace(/-/g, '')}.pdf`;
    
    const result = await pool.query(
      `INSERT INTO medical_records (
        user_id, record_type, record_date, description, 
        pdf_data, filename, file_size, mime_type, 
        storage_uri, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
      RETURNING id, filename, file_size, created_at`,
      [
        user.id,
        record_type,
        record_date,
        description || `Medical record with ${relatedMetrics.length} related health metrics${file ? ' and attached document' : ''}`,
        finalPdfBytes,
        filename,
        finalPdfBytes.length,
        'application/pdf',
        storage_uri
      ]
    );

    const savedRecord = result.rows[0];

    // Log creation
    console.log(`Combined medical record created: ${filename} by user ${user.id} (${user.email}), record_id: ${savedRecord.id}, metrics: ${relatedMetrics.length}, attachment: ${file ? 'yes' : 'no'}`);

    return NextResponse.json({
      success: true,
      record: {
        id: savedRecord.id,
        filename: savedRecord.filename,
        size: savedRecord.file_size,
        metrics_included: relatedMetrics.length,
        attachment_included: !!file,
        created_at: savedRecord.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/records/create-combined:', error);
    return NextResponse.json(
      { error: 'Failed to create combined medical record' },
      { status: 500 }
    );
  }
}
