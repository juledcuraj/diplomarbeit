import { NextRequest, NextResponse } from 'next/server';
import { healthMetrics } from '@/lib/data';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userMetrics = healthMetrics.filter(metric => metric.user_id === user.id);
  
  return NextResponse.json({ metrics: userMetrics });
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const metricData = await request.json();
    
    const newMetric = {
      id: healthMetrics.length + 1,
      user_id: user.id,
      ...metricData,
      created_at: new Date().toISOString()
    };

    healthMetrics.push(newMetric);
    
    return NextResponse.json({ 
      success: true, 
      metric: newMetric 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add health metric' },
      { status: 500 }
    );
  }
}