import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { createRemindersForAppointment, sendRemindersForSpecificAppointment } from '@/lib/emailReminders';

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
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
    
    // Create email reminders for this appointment
    try {
      await createRemindersForAppointment(newAppointment.id);
      console.log(`Created reminders for new appointment ${newAppointment.id}`);
      
      // Send any reminders for THIS appointment that are due immediately (for testing)
      await sendRemindersForSpecificAppointment(newAppointment.id);
    } catch (reminderError) {
      console.error('Failed to create reminders for appointment:', reminderError);
      // Don't fail the appointment creation if reminders fail
    }
    
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