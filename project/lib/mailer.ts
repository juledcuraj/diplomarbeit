import nodemailer from "nodemailer";
import { EMAIL_CONFIG, AUTH_CONFIG } from '@/lib/config';
import { generateVerificationEmail, generatePasswordResetEmail } from '@/lib/templates/emailTemplates';
import { formatDateTime } from '@/lib/utils/dateFormatter';

const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.SMTP_HOST,
  port: EMAIL_CONFIG.SMTP_PORT,
  secure: EMAIL_CONFIG.SMTP_SECURE,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const mailOptions = {
    from: `${EMAIL_CONFIG.FROM_NAME} <${EMAIL_CONFIG.FROM_EMAIL}>`,
    to,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw new Error("Failed to send email");
  }
}

export async function sendVerificationEmail(to: string, code: string, fullName: string = "User"): Promise<void> {
  try {
    const emailContent = generateVerificationEmail({
      fullName,
      verificationCode: code,
      expiryMinutes: AUTH_CONFIG.VERIFICATION_CODE_EXPIRY_MINUTES,
    });

    await sendEmail(to, emailContent.subject, emailContent.html);
    console.log(`✅ Verification email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${to}:`, error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendWelcomeEmail(to: string, fullName: string): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "Welcome to Health Management Platform!",
    text: `Welcome ${fullName}! Your account has been successfully created and verified. You can now login to access all features.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Welcome to Health Management Platform!</h2>
        <p>Hi ${fullName},</p>
        <p>Congratulations! Your account has been successfully created and verified.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #28a745; margin-top: 0;">✅ Account Verified</h3>
          <p style="margin-bottom: 0;">Your email address has been confirmed and your account is now active.</p>
        </div>
        <p>You can now login to access all features including:</p>
        <ul>
          <li>Health metrics tracking</li>
          <li>Appointment management</li>
          <li>Emergency profile setup</li>
          <li>Medical records management</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${EMAIL_CONFIG.APP_URL}/dashboard" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>Health Management Platform Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${to}:`, error);
    // Don't throw error for welcome email - it's not critical
    console.warn("Welcome email failed but continuing with registration");
  }
}

export async function sendPasswordResetEmail(to: string, fullName: string, resetToken: string, ipAddress: string = 'Unknown', userAgent: string = 'Unknown'): Promise<void> {
  const resetUrl = `${EMAIL_CONFIG.APP_URL}/reset-password?token=${resetToken}`;
  const requestTime = formatDateTime(new Date(), 'LONG');
  
  try {
    const emailContent = generatePasswordResetEmail({
      fullName,
      resetUrl,
      requestTime,
      ipAddress,
      userAgent,
      expiryHours: 1,
    });

    await sendEmail(to, emailContent.subject, emailContent.html);
    console.log(`✅ Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${to}:`, error);
    throw new Error("Failed to send password reset email");
  }
}
