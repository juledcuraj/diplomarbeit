import { NextRequest, NextResponse } from 'next/server';
import { getRecords } from '@/lib/getRecords';
import { setRecord } from '@/lib/setRecords';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

// GET /api/medical-records - Get medical records with health metrics summary
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

    // Get records
    const recordsResult = await getRecords({
      userId: user.id,
      record_type,
      from,
      to,
      q,
      page,
      pageSize
    });

    // Get related health metrics for each record (within 7 days of record date)
    const recordsWithMetrics = await Promise.all(
      recordsResult.items.map(async (record) => {
        try {
          const metricsQuery = `
            SELECT metric_type, value_numeric, value_text, unit, metric_date
            FROM health_metrics 
            WHERE user_id = $1 
            AND metric_date BETWEEN $2::date - INTERVAL '7 days' AND $2::date + INTERVAL '7 days'
            ORDER BY metric_date DESC
            LIMIT 5
          `;
          
          const metricsResult = await pool.query(metricsQuery, [user.id, record.record_date]);
          
          return {
            ...record,
            related_metrics: metricsResult.rows
          };
        } catch (error) {
          console.error('Error fetching related metrics:', error);
          return {
            ...record,
            related_metrics: []
          };
        }
      })
    );

    return NextResponse.json({
      ...recordsResult,
      items: recordsWithMetrics
    });
  } catch (error) {
    console.error('Error in GET /api/medical-records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}

// POST /api/medical-records - Create a new medical record with optional metrics summary
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { record_type, record_date, storage_uri, description, include_metrics_summary } = body;

    // Validate required fields
    if (!record_type || !record_date || !storage_uri) {
      return NextResponse.json(
        { error: 'Missing required fields: record_type, record_date, and storage_uri are required' },
        { status: 400 }
      );
    }

    // Auto-generate description if not provided and include_metrics_summary is true
    let finalDescription = description;
    
    if (include_metrics_summary && !description) {
      try {
        // Get recent health metrics around the record date
        const metricsQuery = `
          SELECT metric_type, value_numeric, value_text, unit, metric_date
          FROM health_metrics 
          WHERE user_id = $1 
          AND metric_date BETWEEN $2::date - INTERVAL '30 days' AND $2::date
          ORDER BY metric_date DESC
          LIMIT 10
        `;
        
        const metricsResult = await pool.query(metricsQuery, [user.id, record_date]);
        
        if (metricsResult.rows.length > 0) {
          const metricsSummary = metricsResult.rows.map(m => {
            const value = m.value_text || (m.value_numeric && m.unit ? `${m.value_numeric} ${m.unit}` : m.value_numeric);
            return `${m.metric_type.replace('_', ' ')}: ${value}`;
          }).join(', ');
          
          finalDescription = `Medical record with recent health metrics: ${metricsSummary}`;
        }
      } catch (error) {
        console.error('Error generating metrics summary:', error);
        // Continue without summary
      }
    }

    const newRecord = await setRecord({
      user_id: user.id,
      record_type,
      storage_uri,
      record_date,
      description: finalDescription
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/medical-records:', error);
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    );
  }
}
