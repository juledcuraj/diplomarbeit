import { NextRequest, NextResponse } from 'next/server';
import { appointments } from '@/lib/data';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userAppointments = appointments.filter(apt => apt.user_id === user.id);
  
  return NextResponse.json({ appointments: userAppointments });
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
    const appointmentData = await request.json();
    
    const newAppointment = {
      id: appointments.length + 1,
      user_id: user.id,
      ...appointmentData,
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    appointments.push(newAppointment);
    
    return NextResponse.json({ 
      success: true, 
      appointment: newAppointment 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}