import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE user_id = $1 ORDER BY appointment_date ASC',
      [user.id]
    );
    
    return NextResponse.json({ appointments: result.rows });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}