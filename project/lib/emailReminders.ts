import pool from './db';
import { sendEmail } from './mailer';

interface Appointment {
  id: number;
  user_id: number;
  title: string;
  appointment_date: string;
  location?: string;
  doctor_name?: string;
  notes?: string;
  user_email: string;
  user_name: string;
}

interface Reminder {
  id: number;
  appointment_id: number;
  remind_at: string;
  sent: boolean;
}

/**
 * Email reminder rules:
 * - Immediate: When appointment is created
 * - 7 days before appointment
 * - 1 day before appointment
 * (Same schedule for all appointment types)
 */
export function getReminderSchedule(appointmentTitle: string, appointmentDate: Date): Date[] {
  const reminders: Date[] = [];
  const now = new Date();
  
  // Always create immediate reminder when appointment is created
  const immediateReminder = new Date(now.getTime() - 1000); // 1 second ago (immediate)
  reminders.push(immediateReminder);
  
  // Add 7 days before reminder (if appointment is more than 7 days away)
  addReminderIfFuture(reminders, appointmentDate, 7, 'days', now);
  
  // Add 1 day before reminder (if appointment is more than 1 day away)
  addReminderIfFuture(reminders, appointmentDate, 1, 'days', now);
  
  console.log(`Created ${reminders.length} reminders for appointment: immediate + future reminders`);
  return reminders;
}

function addReminderIfFuture(
  reminders: Date[], 
  appointmentDate: Date, 
  amount: number, 
  unit: 'days' | 'hours', 
  now: Date
): void {
  const reminderTime = new Date(appointmentDate);
  
  if (unit === 'days') {
    reminderTime.setDate(reminderTime.getDate() - amount);
  } else if (unit === 'hours') {
    reminderTime.setHours(reminderTime.getHours() - amount);
  }
  
  // Only add reminder if it's in the future
  if (reminderTime > now) {
    reminders.push(reminderTime);
  }
}

export async function createRemindersForAppointment(appointmentId: number): Promise<void> {
  try {
    // Get appointment details
    const appointmentResult = await pool.query(
      `SELECT a.*, u.email, u.full_name 
       FROM appointments a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.id = $1`,
      [appointmentId]
    );
    
    if (appointmentResult.rows.length === 0) {
      console.error(`Appointment ${appointmentId} not found`);
      return;
    }
    
    const appointment = appointmentResult.rows[0];
    const appointmentDate = new Date(appointment.appointment_date);
    
    // Generate reminder schedule based on appointment type
    const reminderTimes = getReminderSchedule(appointment.title, appointmentDate);
    
    // Delete existing reminders for this appointment
    await pool.query(
      'DELETE FROM reminders WHERE appointment_id = $1',
      [appointmentId]
    );
    
    // Create new reminders
    for (const reminderTime of reminderTimes) {
      await pool.query(
        'INSERT INTO reminders (appointment_id, remind_at) VALUES ($1, $2)',
        [appointmentId, reminderTime]
      );
    }
    
    console.log(`Created ${reminderTimes.length} reminders for appointment ${appointmentId}`);
    
  } catch (error) {
    console.error('Error creating reminders:', error);
  }
}

export async function sendPendingReminders(): Promise<void> {
  try {
    const now = new Date();
    
    // Get all pending reminders that should be sent now
    const result = await pool.query(
      `SELECT r.*, a.title, a.appointment_date, a.location, a.doctor_name, a.notes,
              u.email, u.full_name
       FROM reminders r
       JOIN appointments a ON r.appointment_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE r.sent = false 
         AND r.remind_at <= $1
         AND a.status = 'scheduled'
       ORDER BY r.remind_at ASC`,
      [now]
    );
    
    console.log(`Found ${result.rows.length} pending reminders to send`);
    
    for (const reminder of result.rows) {
      try {
        await sendAppointmentReminder(reminder);
        
        // Mark reminder as sent
        await pool.query(
          'UPDATE reminders SET sent = true, sent_at = NOW(), updated_at = NOW() WHERE id = $1',
          [reminder.id]
        );
        
        console.log(`Sent reminder ${reminder.id} for appointment ${reminder.appointment_id}`);
        
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error sending pending reminders:', error);
  }
}

async function sendAppointmentReminder(reminder: any): Promise<void> {
  const appointmentDate = new Date(reminder.appointment_date);
  const now = new Date();
  const timeUntilAppointment = appointmentDate.getTime() - now.getTime();
  
  // Calculate time until appointment
  const daysUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));
  
  let timeText = '';
  let isConfirmation = false;
  
  if (daysUntil > 1) {
    timeText = `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
  } else if (daysUntil === 1) {
    timeText = 'tomorrow';
  } else if (hoursUntil > 0) {
    timeText = `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
  } else {
    timeText = 'soon';
    isConfirmation = true; // This is the immediate confirmation email
  }
  
  const subject = isConfirmation 
    ? `Appointment Confirmed: ${reminder.title}`
    : `Appointment Reminder: ${reminder.title} ${timeText}`;
  
  const headerText = isConfirmation 
    ? '✅ Appointment Confirmed'
    : '📅 Appointment Reminder';
    
  const headerDescription = isConfirmation
    ? `Hi ${reminder.full_name?.split(' ')[0] || 'there'}, your appointment has been successfully scheduled!`
    : `Hi ${reminder.full_name?.split(' ')[0] || 'there'}, don't forget about your upcoming appointment!`;
  
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0 0 10px 0;">${headerText}</h2>
        <p style="margin: 0; color: #6b7280;">${headerDescription}</p>
      </div>
      
      <div style="background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 15px 0;">${reminder.title}</h3>
        
        <div style="margin-bottom: 10px;">
          <strong style="color: #4b5563;">📅 Date & Time:</strong><br>
          <span style="color: #6b7280;">${appointmentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} at ${appointmentDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
        
        ${reminder.doctor_name ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #4b5563;">👨‍⚕️ Doctor:</strong><br>
          <span style="color: #6b7280;">${reminder.doctor_name}</span>
        </div>
        ` : ''}
        
        ${reminder.location ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #4b5563;">📍 Location:</strong><br>
          <span style="color: #6b7280;">${reminder.location}</span>
        </div>
        ` : ''}
        
        ${reminder.notes ? `
        <div style="margin-bottom: 10px;">
          <strong style="color: #4b5563;">📝 Notes:</strong><br>
          <span style="color: #6b7280;">${reminder.notes}</span>
        </div>
        ` : ''}
      </div>
      
      <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <p style="margin: 0; color: #92400e;">
          ${isConfirmation 
            ? `🎯 <strong>Appointment scheduled ${timeText}</strong>`
            : `⏰ <strong>Your appointment is ${timeText}</strong>`
          }
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          This is an automated reminder from your Health Management System.<br>
          If you need to reschedule or cancel, please contact your healthcare provider.
        </p>
      </div>
    </div>
  `;
  
  await sendEmail(
    reminder.email,
    subject,
    emailBody
  );
}

export async function sendRemindersForSpecificAppointment(appointmentId: number): Promise<void> {
  try {
    const now = new Date();
    
    // Get pending reminders for this specific appointment that should be sent now
    const result = await pool.query(
      `SELECT r.*, a.title, a.appointment_date, a.location, a.doctor_name, a.notes,
              u.email, u.full_name
       FROM reminders r
       JOIN appointments a ON r.appointment_id = a.id
       JOIN users u ON a.user_id = u.id
       WHERE r.sent = false 
         AND r.remind_at <= $1
         AND a.status = 'scheduled'
         AND r.appointment_id = $2
       ORDER BY r.remind_at ASC`,
      [now, appointmentId]
    );
    
    console.log(`Found ${result.rows.length} pending reminders for appointment ${appointmentId}`);
    
    for (const reminder of result.rows) {
      try {
        await sendAppointmentReminder(reminder);
        
        // Mark reminder as sent
        await pool.query(
          'UPDATE reminders SET sent = true, sent_at = NOW(), updated_at = NOW() WHERE id = $1',
          [reminder.id]
        );
        
        console.log(`Sent reminder ${reminder.id} for appointment ${reminder.appointment_id}`);
        
      } catch (error) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('Error sending reminders for specific appointment:', error);
  }
}

export async function updateRemindersForAppointment(appointmentId: number): Promise<void> {
  // When an appointment is updated, recreate the reminders
  await createRemindersForAppointment(appointmentId);
}
