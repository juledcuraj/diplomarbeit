import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, generateToken } from '@/lib/auth';
import pool from '@/lib/db';

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters long'),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
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

    console.log('🔍 Testing database connection...');
    
    // Test database connection first
    try {
      const testQuery = 'SELECT 1 as test';
      const testResult = await pool.query(testQuery);
      console.log('✅ Database connection test successful:', testResult.rows[0]);
    } catch (dbError) {
      console.error('❌ Database connection test failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

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

    // Insert new user into database
    console.log('💾 Inserting new user...');
    const insertUserQuery = `
      INSERT INTO users (email, password_hash, full_name, date_of_birth, gender, phone, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, email, full_name, date_of_birth, gender, phone, created_at
    `;
    
    const values = [
      email,
      password_hash,
      full_name,
      date_of_birth || null,
      gender || null,
      phone || null
    ];

    const result = await pool.query(insertUserQuery, values);
    const newUser = result.rows[0];

    // Generate JWT token
    console.log('🎫 Generating JWT token...');
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      date_of_birth: newUser.date_of_birth,
      gender: newUser.gender,
      phone: newUser.phone
    });

    console.log('✅ User registered successfully!');

    // Return success response with user data and token
    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        date_of_birth: newUser.date_of_birth,
        gender: newUser.gender,
        phone: newUser.phone,
        created_at: newUser.created_at
      }
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
