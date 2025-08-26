import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { canResend, markResent } from '@/lib/store';
import { sendVerificationEmail } from '@/lib/mailer';
import { sha256 } from '@/lib/crypto';
import pool from '@/lib/db';

const resendSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Resend API called');
    
    const body = await request.json();
    console.log('📝 Received resend request for email:', body.email);
    
    // Validate request body
    const validationResult = resendSchema.safeParse(body);
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

    // Check if there's a pending (unverified) user for this email
    console.log('🔍 Checking for unverified user...');
    const userQuery = `
      SELECT id, email, verification_code, verification_expires_at 
      FROM users 
      WHERE email = $1 AND is_verified = false
    `;
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No unverified user found for email:', email);
      return NextResponse.json(
        { error: 'No pending registration found. Please start registration again.' },
        { status: 400 }
      );
    }

    // Check if user can resend (rate limiting)
    const canResendCode = await canResend(email);
    
    if (!canResendCode) {
      console.log('❌ Resend limit reached for email:', email);
      return NextResponse.json(
        { error: 'Resend limit reached. Please wait before requesting another code.' },
        { status: 429 }
      );
    }

    // Generate new 6-digit verification code
    console.log('🔢 Generating new verification code for email:', email);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = sha256(verificationCode);
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update the user's verification code in database
    console.log('💾 Updating verification code in database...');
    const updateQuery = `
      UPDATE users 
      SET verification_code = $1, 
          verification_expires_at = $2, 
          verification_attempts = 0,
          updated_at = NOW()
      WHERE email = $3 AND is_verified = false
      RETURNING id, email
    `;
    
    const updateResult = await pool.query(updateQuery, [codeHash, codeExpiresAt, email]);
    
    if (updateResult.rows.length === 0) {
      console.log('❌ Failed to update verification code for email:', email);
      return NextResponse.json(
        { error: 'Failed to generate new verification code. Please try again.' },
        { status: 500 }
      );
    }

    // Send verification email
    console.log('📧 Resending verification email to:', email);
    await sendVerificationEmail(email, verificationCode);

    // Mark as resent (for rate limiting)
    await markResent(email);

    console.log('✅ Verification code resent successfully to:', email);

    return NextResponse.json({
      ok: true,
      message: 'Verification code resent successfully'
    });

  } catch (error) {
    console.error('💥 Resend error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

