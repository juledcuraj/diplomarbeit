import { NextRequest, NextResponse } from 'next/server';
import { getRecordById } from '@/lib/getRecords';
import { getUserFromRequest } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import pool from '@/lib/db';
import path from 'path';

// GET /api/records/[id]/download - Download file as attachment
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

    // Check if PDF is stored in database (storage_uri starts with 'db_')
    if (record.storage_uri && record.storage_uri.startsWith('db_')) {
      try {
        // Get PDF data from database
        const result = await pool.query(
          `SELECT pdf_data, filename, file_size, mime_type, record_type 
           FROM medical_records 
           WHERE id = $1 AND user_id = $2 AND pdf_data IS NOT NULL`,
          [recordId, user.id]
        );

        if (result.rows.length === 0) {
          return NextResponse.json({ error: 'PDF data not found in database' }, { status: 404 });
        }

        const dbRecord = result.rows[0];
        const pdfData = dbRecord.pdf_data;
        const filename = dbRecord.filename || `medical_record_${recordId}.pdf`;
        const safeFileName = `${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}_${dbRecord.record_type}_${recordId}`;

        // Log download for security
        console.log(`Database PDF downloaded: ${filename} by user ${user.id} (${user.email}), record_id: ${recordId}`);

        return new NextResponse(pdfData, {
          headers: {
            'Content-Type': dbRecord.mime_type || 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeFileName}"`,
            'Content-Length': dbRecord.file_size?.toString() || pdfData.length.toString(),
            'Cache-Control': 'private, no-cache',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch (dbError) {
        console.error('Error retrieving PDF from database:', dbError);
        return NextResponse.json({ error: 'Error retrieving PDF from database' }, { status: 500 });
      }
    }

    // Fallback to file system storage for existing records

    // Sanitize and validate storage path
    const sanitizedPath = record.storage_uri.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
    
    // Construct file path - storage_uri should contain the full path relative to uploads directory
    const filePath = path.resolve(process.cwd(), 'uploads', sanitizedPath);
    
    // Security check: ensure file is within uploads directory
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!filePath.startsWith(uploadsDir)) {
      console.error('Directory traversal attempt detected:', record.storage_uri);
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error('File not found:', filePath);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
      const fileBuffer = await readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const baseName = path.basename(filePath, ext);
      
      // Create safe filename
      const safeFileName = `${baseName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${record.record_type}_${record.id}${ext}`;
      
      // Determine content type based on file extension
      let contentType = 'application/octet-stream';
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.txt':
          contentType = 'text/plain';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
      }

      // Log download for security
      console.log(`File downloaded: ${filePath} by user ${user.id} (${user.email})`);

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${safeFileName}"`,
          'Cache-Control': 'private, no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (fileError) {
      console.error('Error reading file:', fileError);
      return NextResponse.json({ error: 'Error reading file' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/records/[id]/download:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
