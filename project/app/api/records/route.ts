import { NextRequest, NextResponse } from 'next/server';
import { getRecords } from '@/lib/getRecords';
import { setRecord } from '@/lib/setRecords';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/records - List user's medical records with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const record_type = searchParams.get('record_type') || undefined;
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const q = searchParams.get('q') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const result = await getRecords({
      userId: user.id,
      record_type,
      from,
      to,
      q,
      page,
      pageSize
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

// POST /api/records - Create a new medical record
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { record_type, record_date, storage_uri, description } = body;

    // Validate required fields
    if (!record_type || !record_date || !storage_uri) {
      return NextResponse.json(
        { error: 'Missing required fields: record_type, record_date, and storage_uri are required' },
        { status: 400 }
      );
    }

    // Validate record_date is a valid ISO date
    const date = new Date(record_date);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid record_date format. Please use ISO date format.' },
        { status: 400 }
      );
    }

    const newRecord = await setRecord({
      user_id: user.id,
      record_type,
      storage_uri,
      record_date,
      description
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/records:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}
