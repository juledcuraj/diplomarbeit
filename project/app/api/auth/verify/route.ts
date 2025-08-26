import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sha256 } from '@/lib/crypto';
import { sendWelcomeEmail } from '@/lib/mailer';
import pool from '@/lib/db';

const verifySchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().regex(/^\d{6}$/, 'Code must be exactly 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verify API called');
    
    const body = await request.json();
    console.log('📝 Received verify request for email:', body.email);
    
    // Validate request body
    const validationResult = verifySchema.safeParse(body);
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

    const { email, code } = validationResult.data;

    // Get user with verification code from database
    console.log('🔍 Looking up user and verification code...');
    const userQuery = `
      SELECT id, email, full_name, verification_code, verification_expires_at, 
             verification_attempts, is_verified
      FROM users 
      WHERE email = $1
    `;
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found for email:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.is_verified) {
      console.log('✅ User already verified for email:', email);
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Check if verification code exists and hasn't expired
    if (!user.verification_code || !user.verification_expires_at) {
      console.log('❌ No verification code found for email:', email);
      return NextResponse.json(
        { error: 'No verification code found. Please register again.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.verification_expires_at)) {
      console.log('❌ Verification code expired for email:', email);
      return NextResponse.json(
        { error: 'Verification code expired. Please register again.' },
        { status: 400 }
      );
    }

    // Check attempt limit
    const attempts = (user.verification_attempts || 0) + 1;
    console.log(`🔢 Verification attempt #${attempts} for email:`, email);
    
    if (attempts > 5) {
      console.log('❌ Too many attempts for email:', email);
      return NextResponse.json(
        { error: 'Too many attempts. Please register again.' },
        { status: 429 }
      );
    }

    // Update attempt count
    await pool.query(`
      UPDATE users 
      SET verification_attempts = $1, updated_at = NOW() 
      WHERE email = $2
    `, [attempts, email]);

    // Verify the code
    const providedCodeHash = sha256(code);
    
    if (providedCodeHash !== user.verification_code) {
      console.log('❌ Invalid code provided for email:', email);
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Code is valid - mark user as verified
    console.log('✅ Code verified successfully for email:', email);
    
    const updateQuery = `
      UPDATE users 
      SET is_verified = true, 
          verification_code = NULL, 
          verification_expires_at = NULL, 
          verification_attempts = NULL,
          updated_at = NOW()
      WHERE email = $1
      RETURNING id, email, full_name, date_of_birth, gender, phone, created_at
    `;
    
    const updateResult = await pool.query(updateQuery, [email]);
    const verifiedUser = updateResult.rows[0];

    // Send welcome email (non-blocking)
    console.log('📧 Sending welcome email...');
    sendWelcomeEmail(email, user.full_name).catch(error => {
      console.warn('⚠️ Welcome email failed but verification succeeded:', error);
    });

    console.log('🎉 Email verification completed for:', email);

    return NextResponse.json({
      ok: true,
      message: 'Email verified successfully! Account is now active.',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        full_name: verifiedUser.full_name,
        date_of_birth: verifiedUser.date_of_birth,
        gender: verifiedUser.gender,
        phone: verifiedUser.phone,
        created_at: verifiedUser.created_at
      }
    });

  } catch (error) {
    console.error('💥 Verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
