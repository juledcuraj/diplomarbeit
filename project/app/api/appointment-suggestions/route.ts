import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

// Create table for appointment suggestions if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS appointment_suggestions (
  id VARCHAR(255) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  danger_level INTEGER NOT NULL,
  timeframe TEXT NOT NULL,
  proposed_slots JSONB NOT NULL,
  reason TEXT NOT NULL,
  decline_consequence TEXT NOT NULL,
  no_show_consequence TEXT NOT NULL,
  related_metrics JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  decline_reason TEXT,
  snooze_until TIMESTAMPTZ,
  accepted_slot TIMESTAMPTZ,
  appointment_id BIGINT REFERENCES appointments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_suggestions_user_id ON appointment_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_suggestions_status ON appointment_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_appointment_suggestions_danger_level ON appointment_suggestions(danger_level);
`;

// Handle suggestion actions (accept, decline, snooze)
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Ensure table exists
    await pool.query(createTableQuery);
    
    const { action, suggestion_id, decline_reason, snooze_days, selected_slot } = await request.json();
    
    if (!action || !suggestion_id) {
      return NextResponse.json(
        { error: 'Action and suggestion_id are required' },
        { status: 400 }
      );
    }

    // Get the suggestion
    const suggestionResult = await pool.query(
      'SELECT * FROM appointment_suggestions WHERE id = $1 AND user_id = $2',
      [suggestion_id, user.id]
    );

    if (suggestionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      );
    }

    const suggestion = suggestionResult.rows[0];

    switch (action) {
      case 'accept':
        return await handleAccept(suggestion, selected_slot, user.id);
      
      case 'decline':
        return await handleDecline(suggestion_id, decline_reason, user.id);
      
      case 'snooze':
        return await handleSnooze(suggestion_id, snooze_days || 7, user.id);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be accept, decline, or snooze' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error handling suggestion action:', error);
    return NextResponse.json(
      { error: 'Failed to process suggestion action' },
      { status: 500 }
    );
  }
}

// Get user's appointment suggestions
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Ensure table exists
    await pool.query(createTableQuery);
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    
    let query = `
      SELECT s.*, a.title as appointment_title, a.appointment_date, a.status as appointment_status
      FROM appointment_suggestions s
      LEFT JOIN appointments a ON s.appointment_id = a.id
      WHERE s.user_id = $1
    `;
    const params: any[] = [user.id];
    
    if (status !== 'all') {
      query += ` AND s.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY s.danger_level DESC, s.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({
      success: true,
      suggestions: result.rows
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}

// Save generated suggestions to database
export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Ensure table exists
    await pool.query(createTableQuery);
    
    const { suggestions } = await request.json();
    
    if (!Array.isArray(suggestions)) {
      return NextResponse.json(
        { error: 'Suggestions must be an array' },
        { status: 400 }
      );
    }

    // Save each suggestion
    const savedSuggestions = [];
    
    for (const suggestion of suggestions) {
      const result = await pool.query(`
        INSERT INTO appointment_suggestions (
          id, user_id, title, specialty, danger_level, timeframe, 
          proposed_slots, reason, decline_consequence, no_show_consequence, 
          related_metrics, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          specialty = EXCLUDED.specialty,
          danger_level = EXCLUDED.danger_level,
          timeframe = EXCLUDED.timeframe,
          proposed_slots = EXCLUDED.proposed_slots,
          reason = EXCLUDED.reason,
          decline_consequence = EXCLUDED.decline_consequence,
          no_show_consequence = EXCLUDED.no_show_consequence,
          related_metrics = EXCLUDED.related_metrics,
          updated_at = NOW()
        RETURNING *
      `, [
        suggestion.id,
        user.id,
        suggestion.title,
        suggestion.specialty,
        suggestion.danger_level,
        suggestion.timeframe,
        JSON.stringify(suggestion.proposed_slots),
        suggestion.reason,
        suggestion.decline_consequence,
        suggestion.no_show_consequence,
        JSON.stringify(suggestion.related_metrics),
        'pending'
      ]);
      
      savedSuggestions.push(result.rows[0]);
    }
    
    return NextResponse.json({
      success: true,
      suggestions: savedSuggestions
    });
  } catch (error) {
    console.error('Error saving suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to save suggestions' },
      { status: 500 }
    );
  }
}

async function handleAccept(suggestion: any, selectedSlot: string, userId: number) {
  if (!selectedSlot) {
    return NextResponse.json(
      { error: 'Selected slot is required for acceptance' },
      { status: 400 }
    );
  }

  try {
    // Create appointment
    const appointmentResult = await pool.query(`
      INSERT INTO appointments (
        user_id, title, appointment_date, location, doctor_name, 
        notes, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [
      userId,
      `${suggestion.specialty} - ${suggestion.title}`,
      selectedSlot,
      'To be confirmed',
      'To be assigned',
      `Appointment created from health suggestion: ${suggestion.reason}`,
      'scheduled'
    ]);

    const appointment = appointmentResult.rows[0];

    // Update suggestion status
    await pool.query(`
      UPDATE appointment_suggestions 
      SET status = 'accepted', accepted_slot = $1, appointment_id = $2, updated_at = NOW()
      WHERE id = $3
    `, [selectedSlot, appointment.id, suggestion.id]);

    // Create reminders based on danger level
    await createReminders(appointment.id, selectedSlot, suggestion.danger_level);

    return NextResponse.json({
      success: true,
      message: 'Suggestion accepted and appointment created',
      appointment
    });
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    throw error;
  }
}

async function handleDecline(suggestionId: string, declineReason: string, userId: number) {
  await pool.query(`
    UPDATE appointment_suggestions 
    SET status = 'declined', decline_reason = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
  `, [declineReason || 'No reason provided', suggestionId, userId]);

  return NextResponse.json({
    success: true,
    message: 'Suggestion declined'
  });
}

async function handleSnooze(suggestionId: string, snoozeDays: number, userId: number) {
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);

  await pool.query(`
    UPDATE appointment_suggestions 
    SET status = 'snoozed', snooze_until = $1, updated_at = NOW()
    WHERE id = $2 AND user_id = $3
  `, [snoozeUntil.toISOString(), suggestionId, userId]);

  return NextResponse.json({
    success: true,
    message: `Suggestion snoozed for ${snoozeDays} days`
  });
}

async function createReminders(appointmentId: number, appointmentDate: string, dangerLevel: number) {
  const appointment = new Date(appointmentDate);
  const reminders: { remind_at: Date }[] = [];

  // Reminder schedules based on danger level
  switch (dangerLevel) {
    case 3: // T-7d, T-3d, T-24h, T-6h, T-2h
      reminders.push(
        { remind_at: new Date(appointment.getTime() - 7 * 24 * 60 * 60 * 1000) },
        { remind_at: new Date(appointment.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { remind_at: new Date(appointment.getTime() - 24 * 60 * 60 * 1000) },
        { remind_at: new Date(appointment.getTime() - 6 * 60 * 60 * 1000) },
        { remind_at: new Date(appointment.getTime() - 2 * 60 * 60 * 1000) }
      );
      break;
    case 2: // T-7d, T-48h, T-12h
      reminders.push(
        { remind_at: new Date(appointment.getTime() - 7 * 24 * 60 * 60 * 1000) },
        { remind_at: new Date(appointment.getTime() - 48 * 60 * 60 * 1000) },
        { remind_at: new Date(appointment.getTime() - 12 * 60 * 60 * 1000) }
      );
      break;
    case 1: // T-72h, T-24h
      reminders.push(
        { remind_at: new Date(appointment.getTime() - 72 * 60 * 60 * 1000) },
        { remind_at: new Date(appointment.getTime() - 24 * 60 * 60 * 1000) }
      );
      break;
  }

  // Insert reminders
  for (const reminder of reminders) {
    // Only create reminders for future times
    if (reminder.remind_at > new Date()) {
      await pool.query(`
        INSERT INTO reminders (appointment_id, remind_at, sent, created_at, updated_at)
        VALUES ($1, $2, false, NOW(), NOW())
      `, [appointmentId, reminder.remind_at.toISOString()]);
    }
  }
}
