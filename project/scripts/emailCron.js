#!/usr/bin/env node

/**
 * Email Reminder Cron Job
 * 
 * This script should be run every 15 minutes to check for and send pending email reminders.
 * 
 * Setup instructions:
 * 1. Add to your crontab: "0,15,30,45 * * * * node /path/to/your/project/scripts/emailCron.js"
 * 2. Or run manually: "node scripts/emailCron.js"
 * 3. For production, use a proper task scheduler like cron or systemd timer
 */

const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'myuser',
  password: process.env.POSTGRES_PASSWORD || 'password123',
  database: process.env.POSTGRES_DB || 'myappdb',
});

// Email configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, htmlContent) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
}

async function runEmailCron() {
  const startTime = new Date();
  console.log(`\n🔔 [${startTime.toISOString()}] Starting email reminder cron job...`);
  
  try {
    // Find all pending reminders that should be sent now
    const result = await pool.query(`
      SELECT 
        r.id as reminder_id,
        r.appointment_id,
        r.remind_at,
        a.title,
        a.appointment_date,
        a.location,
        a.doctor_name,
        a.notes,
        u.email,
        u.full_name
      FROM reminders r
      JOIN appointments a ON r.appointment_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE r.sent = false 
        AND r.remind_at <= NOW()
        AND a.status = 'scheduled'
      ORDER BY r.remind_at ASC
    `);
    
    console.log(`📧 Found ${result.rows.length} pending reminders to send`);
    
    if (result.rows.length === 0) {
      console.log(`✨ No pending reminders at this time.`);
      return;
    }
    
    let sentCount = 0;
    let errorCount = 0;
    
    for (const row of result.rows) {
      try {
        console.log(`\n🔄 Processing reminder ${row.reminder_id} for appointment "${row.title}"`);
        
        const appointmentDate = new Date(row.appointment_date);
        const now = new Date();
        const timeUntilAppointment = appointmentDate.getTime() - now.getTime();
        
        // Calculate time until appointment
        const daysUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60 * 24));
        const hoursUntil = Math.floor(timeUntilAppointment / (1000 * 60 * 60));
        
        let timeText = '';
        if (daysUntil > 0) {
          timeText = `in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`;
        } else if (hoursUntil > 0) {
          timeText = `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
        } else {
          timeText = 'soon';
        }
        
        const formattedDate = appointmentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        const subject = `Reminder: ${row.title} - ${timeText}`;
        
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">📅 Appointment Reminder</h1>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi ${row.full_name},</p>
              
              <p style="font-size: 16px; margin-bottom: 25px;">This is a reminder about your upcoming appointment ${timeText}:</p>
              
              <div style="background-color: white; padding: 25px; border-radius: 8px; border-left: 4px solid #4CAF50; margin-bottom: 25px;">
                <h2 style="color: #333; margin-top: 0; margin-bottom: 15px;">${row.title}</h2>
                <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 8px 0; font-size: 16px;"><strong>🕐 Time:</strong> ${formattedTime}</p>
                ${row.doctor_name ? `<p style="margin: 8px 0; font-size: 16px;"><strong>👨‍⚕️ Doctor:</strong> ${row.doctor_name}</p>` : ''}
                ${row.location ? `<p style="margin: 8px 0; font-size: 16px;"><strong>📍 Location:</strong> ${row.location}</p>` : ''}
                ${row.notes ? `<p style="margin: 15px 0 8px 0; font-size: 16px;"><strong>📝 Notes:</strong></p><p style="margin: 0; font-size: 14px; color: #666;">${row.notes}</p>` : ''}
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                  <strong>💡 Tip:</strong> Please arrive 15 minutes early for check-in and bring any required documentation.
                </p>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-bottom: 0;">
                Best regards,<br>
                <strong>Health Management Platform Team</strong>
              </p>
            </div>
          </div>
        `;
        
        // Send the email
        await sendEmail(row.email, subject, htmlContent);
        
        // Mark reminder as sent
        await pool.query(
          'UPDATE reminders SET sent = true, sent_at = NOW(), updated_at = NOW() WHERE id = $1',
          [row.reminder_id]
        );
        
        console.log(`✅ Reminder ${row.reminder_id} sent successfully to ${row.email}`);
        sentCount++;
        
      } catch (error) {
        console.error(`❌ Failed to send reminder ${row.reminder_id}:`, error);
        errorCount++;
      }
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    console.log(`\n🎉 Email cron job completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total pending reminders: ${result.rows.length}`);
    console.log(`   • Successfully sent: ${sentCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Duration: ${duration}ms`);
    console.log(`   • Finished at: ${endTime.toISOString()}`);
    
  } catch (error) {
    console.error('💥 Email cron job failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the cron job
if (require.main === module) {
  runEmailCron().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
