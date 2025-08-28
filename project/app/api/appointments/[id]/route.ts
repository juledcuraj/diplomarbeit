import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
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

    const { title, appointment_date, location, doctor_name, notes } = await request.json();
    
    // Validate required fields
    if (!appointment_date || !title) {
      return NextResponse.json(
        { error: 'Appointment date and title are required' },
        { status: 400 }
      );
    }

    // Check if appointment exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
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
       SET title = $1, appointment_date = $2, location = $3, doctor_name = $4, notes = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [title, appointment_date, location || '', doctor_name || '', notes || '', appointmentId, user.id]
    );
    
    const updatedAppointment = result.rows[0];
    
    return NextResponse.json({ 
      success: true, 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Delete appointment
export async function DELETE(
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

    // Check if appointment exists and belongs to user
    const checkResult = await pool.query(
      'SELECT id FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, user.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }
    
    await pool.query(
      'DELETE FROM appointments WHERE id = $1 AND user_id = $2',
      [appointmentId, user.id]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Appointment deleted successfully' 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
