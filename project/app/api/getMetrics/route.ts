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
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const metric_type = searchParams.get('metric_type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Build dynamic query
    let query = 'SELECT * FROM health_metrics WHERE user_id = $1';
    const params: any[] = [user.id];
    let paramIndex = 2;

    // Add optional filters
    if (metric_type) {
      query += ` AND metric_type = $${paramIndex}`;
      params.push(metric_type);
      paramIndex++;
    }

    if (from) {
      query += ` AND metric_date >= $${paramIndex}`;
      params.push(from);
      paramIndex++;
    }

    if (to) {
      query += ` AND metric_date <= $${paramIndex}`;
      params.push(to);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ' ORDER BY metric_date DESC, created_at DESC';
    
    const offset = (page - 1) * pageSize;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM health_metrics WHERE user_id = $1';
    const countParams: any[] = [user.id];
    let countParamIndex = 2;

    if (metric_type) {
      countQuery += ` AND metric_type = $${countParamIndex}`;
      countParams.push(metric_type);
      countParamIndex++;
    }

    if (from) {
      countQuery += ` AND metric_date >= $${countParamIndex}`;
      countParams.push(from);
      countParamIndex++;
    }

    if (to) {
      countQuery += ` AND metric_date <= $${countParamIndex}`;
      countParams.push(to);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    return NextResponse.json({ 
      metrics: result.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health metrics' },
      { status: 500 }
    );
  }
}
