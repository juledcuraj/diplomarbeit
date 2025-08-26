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
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/dashboard" 
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
