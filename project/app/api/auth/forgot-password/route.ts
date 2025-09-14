import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generatePasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';
import pool from '@/lib/db';

// Validation schema for forgot password
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Forgot password API called');
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = forgotPasswordSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('❌ Validation failed:', validationResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    console.log('📧 Password reset requested for:', email);

    // Check if user exists
    const userQuery = 'SELECT id, email, full_name FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found, but sending success response for security');
      // For security reasons, we don't reveal if the email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    const user = userResult.rows[0];
    console.log('👤 User found:', user.email);

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing reset tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);

    // Insert new reset token
    const insertTokenQuery = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `;
    await pool.query(insertTokenQuery, [user.id, resetToken, expiresAt]);

    console.log('🎫 Reset token generated and stored');

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, user.full_name, resetToken);
      console.log('✅ Password reset email sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send reset email:', emailError);
      // Clean up the token if email sending fails
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [resetToken]);
      
      return NextResponse.json(
        { error: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('💥 Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
