import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
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
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Create user-specific subdirectory
    const userUploadsDir = path.join(uploadsDir, `user_${user.id}`);
    if (!existsSync(userUploadsDir)) {
      await mkdir(userUploadsDir, { recursive: true });
    }

    const filePath = path.join(userUploadsDir, filename);
    const storage_uri = `user_${user.id}/${filename}`;

    try {
      // Convert file to buffer and save
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

      await writeFile(filePath, buffer);

      // Log upload for security
      console.log(`File uploaded: ${storage_uri} by user ${user.id} (${user.email}), size: ${file.size} bytes`);

      return NextResponse.json({
        storage_uri,
        filename: file.name,
        size: file.size,
        mime: file.type,
        uploaded_at: new Date().toISOString()
      }, { status: 201 });

    } catch (fileError) {
      console.error('Error saving file:', fileError);
      return NextResponse.json(
        { error: 'Failed to save file' },
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
