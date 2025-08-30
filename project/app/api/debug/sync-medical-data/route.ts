import { NextRequest, NextResponse } from 'next/server';
import { syncAllUsersMedicalData } from '@/lib/syncMedicalData';

// This is a development endpoint to sync all medical data
export async function POST(request: NextRequest) {
  try {
    await syncAllUsersMedicalData();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Medical data synced successfully for all users' 
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync medical data' },
      { status: 500 }
    );
  }
}
