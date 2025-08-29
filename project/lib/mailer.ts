import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "Email Verification Code",
    text: `Your verification code is ${code}. Valid for 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${code}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
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
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" 
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

export async function sendPasswordResetEmail(to: string, fullName: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject: "Reset Your Password - Health Management Platform",
    text: `Hi ${fullName}, you requested a password reset. Click this link to reset your password: ${resetUrl}. This link will expire in 1 hour. If you didn't request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Password Reset Request</h2>
        <p>Hi ${fullName},</p>
        <p>We received a request to reset your password for your Health Management Platform account.</p>
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">🔑 Reset Your Password</h3>
          <p style="margin-bottom: 15px;">Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
        </div>
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #721c24;">
            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
          </p>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">
          ${resetUrl}
        </p>
        <p><strong>If you didn't request this password reset, please ignore this email.</strong> Your password will remain unchanged.</p>
        <p>For security reasons, this request came from IP address and will be logged.</p>
        <p>Best regards,<br>Health Management Platform Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send password reset email to ${to}:`, error);
    throw new Error("Failed to send password reset email");
  }
}
