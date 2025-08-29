import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST /api/records/upload - Upload PDF file
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = '.pdf';
    const uniqueId = uuidv4();
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);
    const filename = `${uniqueId}_${sanitizedName}`;

    try {
      // Convert file to buffer for database storage
      const bytes = await file.arrayBuffer();
      const buffer = new Uint8Array(bytes);
      
      // Additional MIME type validation by checking PDF header
      const pdfHeader = buffer.slice(0, 4);
      const headerString = Array.from(pdfHeader).map(byte => String.fromCharCode(byte)).join('');
      if (headerString !== '%PDF') {
        return NextResponse.json(
          { error: 'Invalid PDF file format' },
          { status: 400 }
        );
      }

      // Store PDF in database instead of file system
      const storage_uri = `db_${uniqueId}`;
      
      // Insert into database with PDF binary data
      const result = await pool.query(
        `INSERT INTO medical_records (
          user_id, record_type, record_date, description, 
          pdf_data, filename, file_size, mime_type, 
          storage_uri, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
        RETURNING id, filename, file_size, created_at`,
        [
          user.id,
          'uploaded_document', // default type
          new Date().toISOString().split('T')[0], // today's date
          `Uploaded PDF: ${file.name}`,
          buffer, // Store binary data in database
          file.name,
          file.size,
          file.type,
          storage_uri
        ]
      );

      const savedRecord = result.rows[0];

      // Log upload for security
      console.log(`PDF stored in database: ${filename} by user ${user.id} (${user.email}), size: ${file.size} bytes, record_id: ${savedRecord.id}`);

      return NextResponse.json({
        storage_uri,
        filename: file.name,
        size: file.size,
        mime: file.type,
        uploaded_at: new Date().toISOString()
      }, { status: 201 });

    } catch (dbError) {
      console.error('Error saving PDF to database:', dbError);
      return NextResponse.json(
        { error: 'Failed to save PDF to database' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in POST /api/records/upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
