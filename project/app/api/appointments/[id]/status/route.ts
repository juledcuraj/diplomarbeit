import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

// PATCH /api/appointments/[id]/status - Update appointment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const appointmentId = parseInt(params.id);
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }

    const { status } = await request.json();
    
    // Validate status
    const validStatuses = ['scheduled', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: scheduled, completed, cancelled' },
        { status: 400 }
      );
    }

    // Check if appointment exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id, status FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, user.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }
    
    const result = await pool.query(
      `UPDATE appointments 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, appointmentId, user.id]
    );
    
    const updatedAppointment = result.rows[0];
    
    return NextResponse.json({ 
      success: true, 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment status' },
      { status: 500 }
    );
  }
}
