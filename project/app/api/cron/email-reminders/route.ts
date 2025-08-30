import { NextRequest, NextResponse } from 'next/server';
import { sendPendingReminders } from '@/lib/emailReminders';

export async function GET(request: NextRequest) {
  try {
    // Check if the request is from a cron job or authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔔 Running email reminder cron job...');
    
    await sendPendingReminders();
    
    return NextResponse.json({
      success: true,
      message: 'Email reminders processed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in email reminder cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process email reminders' },
      { status: 500 }
    );
  }
}
