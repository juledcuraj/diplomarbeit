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
    const { title, appointment_date, location, doctor_name, notes } = await request.json();
    
    // Validate required fields
    if (!appointment_date || !title) {
      return NextResponse.json(
        { error: 'Appointment date and title are required' },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      `INSERT INTO appointments (user_id, title, appointment_date, location, doctor_name, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [user.id, title, appointment_date, location || '', doctor_name || '', notes || '', 'scheduled']
    );

    const newAppointment = result.rows[0];
    
    return NextResponse.json({ 
      success: true, 
      appointment: newAppointment 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}