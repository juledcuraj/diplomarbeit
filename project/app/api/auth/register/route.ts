import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword } from '@/lib/auth';
import pool from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mailer';
import { sha256 } from '@/lib/crypto';
import { AUTH_CONFIG, VALIDATION_RULES } from '@/lib/config';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(AUTH_CONFIG.PASSWORD_MIN_LENGTH, `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters long`),
  full_name: z.string().min(VALIDATION_RULES.FULL_NAME_MIN_LENGTH, `Full name must be at least ${VALIDATION_RULES.FULL_NAME_MIN_LENGTH} characters long`),
  date_of_birth: z.string().optional().refine((date) => {
    if (!date) return true; // Optional field
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed <= new Date();
  }, 'Invalid date format or future date'),
  gender: z.enum(VALIDATION_RULES.GENDER_OPTIONS).optional(),
  phone: z.string().optional().refine((phone) => {
    if (!phone) return true; // Optional field
    // Basic phone validation (allows various formats including numbers starting with 0)
    return VALIDATION_RULES.PHONE_REGEX.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, 'Invalid phone number format'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Registration API called');
    
    // Check if request has a body
    const text = await request.text();
    if (!text || text.trim() === '') {
      console.log('❌ No request body provided');
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      );
    }

    // Parse JSON
    let body;
    try {
      body = JSON.parse(text);
      console.log('📝 Parsed request body:', body);
    } catch (parseError) {
      console.log('❌ Invalid JSON format');
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    // Validate request body
    const validationResult = registerSchema.safeParse(body);
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

    const { email, password, full_name, date_of_birth, gender, phone } = validationResult.data;

    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUserResult = await pool.query(existingUserQuery, [email]);
    
    if (existingUserResult.rows.length > 0) {
      console.log('❌ User already exists');
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    console.log('🔐 Hashing password...');
    const password_hash = hashPassword(password);

    // Generate 6-digit verification code
    console.log('🔢 Generating verification code...');
    const verificationCode = Math.floor(Math.pow(10, AUTH_CONFIG.VERIFICATION_CODE_LENGTH - 1) + Math.random() * (Math.pow(10, AUTH_CONFIG.VERIFICATION_CODE_LENGTH) - Math.pow(10, AUTH_CONFIG.VERIFICATION_CODE_LENGTH - 1))).toString();
    const codeHash = sha256(verificationCode);
    const codeExpiresAt = new Date(Date.now() + AUTH_CONFIG.VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

    // Create user in database immediately, but mark as unverified
    console.log('💾 Creating user in database with verification code...');
    const insertUserQuery = `
      INSERT INTO users (
        email, password_hash, full_name, date_of_birth, gender, phone, 
        verification_code, verification_expires_at, is_verified, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        verification_code = EXCLUDED.verification_code,
        verification_expires_at = EXCLUDED.verification_expires_at,
        updated_at = NOW()
      RETURNING id, email, full_name
    `;
    
    const values = [
      email,
      password_hash,
      full_name,
      date_of_birth || null,
      gender || null,
      phone || null,
      codeHash,
      codeExpiresAt
    ];

    const result = await pool.query(insertUserQuery, values);
    const newUser = result.rows[0];

    // Bootstrap medical profile for new user
    try {
      await pool.query(
        'INSERT INTO user_medical_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [newUser.id]
      );
      
      // Also create emergency profile with basic info
      const qrCode = `EMERGENCY_QR_${newUser.id}_${Date.now()}`;
      await pool.query(
        'INSERT INTO emergency_profiles (user_id, qr_code) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING',
        [newUser.id, qrCode]
      );
    } catch (error) {
      console.error('Failed to create medical/emergency profile:', error);
      // Don't fail registration if profile creation fails
    }

    // Send verification email
    console.log('📧 Sending verification email...');
    await sendVerificationEmail(email, verificationCode);

    console.log('✅ User created and verification email sent!');

    // Return success response
    return NextResponse.json({
      ok: true,
      message: 'Registration successful! Please check your email for verification code.',
    }, { status: 201 });

  } catch (error) {
    console.error('💥 Registration error:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key value violates unique constraint')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
