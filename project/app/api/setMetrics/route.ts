import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { metric_date, metric_type, value_numeric, value_text, unit } = await request.json();
    
    // Validate required fields
    if (!metric_date || !metric_type) {
      return NextResponse.json(
        { error: 'Metric date and metric type are required' },
        { status: 400 }
      );
    }

    // Validate that either value_numeric or value_text is provided
    if (!value_numeric && !value_text) {
      return NextResponse.json(
        { error: 'Either numeric value or text value must be provided' },
        { status: 400 }
      );
    }

    // Convert metric_date to UTC if it's not already
    const utcDate = new Date(metric_date).toISOString().split('T')[0];
    
    const result = await pool.query(
      `INSERT INTO health_metrics (user_id, metric_date, metric_type, value_numeric, value_text, unit, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [user.id, utcDate, metric_type, value_numeric || null, value_text || null, unit || null]
    );

    const newMetric = result.rows[0];
    
    return NextResponse.json({ 
      success: true, 
      metric: newMetric 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create health metric' },
      { status: 500 }
    );
  }
}
