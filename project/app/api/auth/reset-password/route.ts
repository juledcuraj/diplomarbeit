import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import pool from '@/lib/db';

// Validation schema for reset password
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Reset password API called');
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);
    
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

    const { token, newPassword } = validationResult.data;
    console.log('🎫 Processing reset token');

    // Find and validate reset token
    const tokenQuery = `
      SELECT prt.id, prt.user_id, prt.expires_at, prt.used, u.email, u.full_name
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = $1
    `;
    const tokenResult = await pool.query(tokenQuery, [token]);
    
    if (tokenResult.rows.length === 0) {
      console.log('❌ Invalid reset token');
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const resetData = tokenResult.rows[0];
    
    // Check if token is already used
    if (resetData.used) {
      console.log('❌ Reset token already used');
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > new Date(resetData.expires_at)) {
      console.log('❌ Reset token expired');
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    console.log('✅ Reset token validated for user:', resetData.email);

    // Hash the new password
    const hashedPassword = hashPassword(newPassword);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update user password
      const updatePasswordQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
      `;
      await client.query(updatePasswordQuery, [hashedPassword, resetData.user_id]);

      // Mark token as used
      const markTokenUsedQuery = `
        UPDATE password_reset_tokens 
        SET used = TRUE
        WHERE id = $1
      `;
      await client.query(markTokenUsedQuery, [resetData.id]);

      // Delete all other reset tokens for this user
      const deleteOtherTokensQuery = `
        DELETE FROM password_reset_tokens 
        WHERE user_id = $1 AND id != $2
      `;
      await client.query(deleteOtherTokensQuery, [resetData.user_id, resetData.id]);

      await client.query('COMMIT');
      console.log('✅ Password updated successfully for user:', resetData.email);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('💥 Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
