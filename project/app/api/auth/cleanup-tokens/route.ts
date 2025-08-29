import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredTokens, getTokenStats } from '@/lib/passwordResetCleanup';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Manual cleanup triggered');
    
    // Get stats before cleanup
    const statsBefore = await getTokenStats();
    
    // Perform cleanup
    await cleanupExpiredTokens();
    
    // Get stats after cleanup
    const statsAfter = await getTokenStats();
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      stats: {
        before: statsBefore,
        after: statsAfter,
        removed: {
          total: statsBefore.total - statsAfter.total,
          expired: statsBefore.expired,
          used: statsBefore.used
        }
      }
    });

  } catch (error) {
    console.error('💥 Cleanup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during cleanup' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Token stats requested');
    
    const stats = await getTokenStats();
    
    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('💥 Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error while getting stats' },
      { status: 500 }
    );
  }
}
