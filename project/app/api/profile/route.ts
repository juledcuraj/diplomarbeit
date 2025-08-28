import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get user data from the users table
    const result = await pool.query(
      'SELECT id, email, full_name, date_of_birth, gender, phone, created_at FROM users WHERE id = $1',
      [user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userProfile = result.rows[0];

    // Try to get emergency profile data if it exists
    let emergencyData = {};
    try {
      const emergencyResult = await pool.query(
        'SELECT emergency_contact_name, emergency_contact_phone, address FROM emergency_profiles WHERE user_id = $1',
        [user.id]
      );
      
      if (emergencyResult.rows.length > 0) {
        emergencyData = emergencyResult.rows[0];
      }
    } catch (error) {
      // Emergency profiles table might not exist, that's okay
      console.log('Emergency profiles table not found, using default values');
    }

    const profile = {
      ...userProfile,
      ...emergencyData
    };

    return NextResponse.json({ 
      success: true, 
      profile 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { 
      full_name, 
      date_of_birth, 
      gender, 
      phone, 
      address,
      emergency_contact_name,
      emergency_contact_phone 
    } = await request.json();

    // Update the main user table
    const userUpdateResult = await pool.query(
      `UPDATE users 
       SET full_name = $1, date_of_birth = $2, gender = $3, phone = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, email, full_name, date_of_birth, gender, phone, created_at`,
      [full_name, date_of_birth, gender, phone, user.id]
    );

    if (userUpdateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let emergencyData = {};

    // Try to handle emergency contact data if the table exists
    if (address || emergency_contact_name || emergency_contact_phone) {
      try {
        // Check if emergency profile exists
        const emergencyCheckResult = await pool.query(
          'SELECT id FROM emergency_profiles WHERE user_id = $1',
          [user.id]
        );

        if (emergencyCheckResult.rows.length > 0) {
          // Update existing emergency profile
          const emergencyUpdateResult = await pool.query(
            `UPDATE emergency_profiles 
             SET address = $1, emergency_contact_name = $2, emergency_contact_phone = $3, updated_at = NOW()
             WHERE user_id = $4
             RETURNING address, emergency_contact_name, emergency_contact_phone`,
            [address, emergency_contact_name, emergency_contact_phone, user.id]
          );
          emergencyData = emergencyUpdateResult.rows[0];
        } else {
          // Create new emergency profile
          const emergencyCreateResult = await pool.query(
            `INSERT INTO emergency_profiles (user_id, address, emergency_contact_name, emergency_contact_phone, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING address, emergency_contact_name, emergency_contact_phone`,
            [user.id, address, emergency_contact_name, emergency_contact_phone]
          );
          emergencyData = emergencyCreateResult.rows[0];
        }
      } catch (error) {
        // Emergency profiles table might not exist, store in a simple way
        console.log('Emergency profiles table not available, storing basic profile only');
        // We'll just return the user data without emergency info
      }
    }

    const updatedProfile = {
      ...userUpdateResult.rows[0],
      ...emergencyData
    };

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile 
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
