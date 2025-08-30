import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { syncMedicalDataToEmergency } from '@/lib/syncMedicalData';
import pool from '@/lib/db';
import { VALIDATION_RULES } from '@/lib/config';

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
    // Get user data merged with medical profile data
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.date_of_birth, u.gender,
              m.blood_type, m.allergies, m.chronic_conditions, m.implants, 
              m.medication_notes, m.organ_donor, u.created_at
       FROM users u
       LEFT JOIN user_medical_profile m ON m.user_id = u.id
       WHERE u.id = $1`,
      [parseInt(user.id.toString())]
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
      emergency_contact_phone,
      // Medical fields
      blood_type,
      allergies,
      chronic_conditions,
      implants,
      medication_notes,
      organ_donor
    } = await request.json();

    // Validate blood_type if provided
    if (blood_type && !VALIDATION_RULES.BLOOD_TYPES.includes(blood_type as any)) {
      return NextResponse.json(
        { error: 'Invalid blood type' },
        { status: 400 }
      );
    }

    // Trim and limit text fields
    const trimAndLimit = (text: string, maxLength: number = VALIDATION_RULES.MEDICAL_TEXT_MAX_LENGTH) => {
      return text ? text.trim().substring(0, maxLength) : null;
    };

    const trimmedAllergies = trimAndLimit(allergies);
    const trimmedConditions = trimAndLimit(chronic_conditions);
    const trimmedImplants = trimAndLimit(implants);
    const trimmedMedications = trimAndLimit(medication_notes);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update the main user table
      const userUpdateResult = await client.query(
        `UPDATE users 
         SET full_name = $1, date_of_birth = $2, gender = $3, phone = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, email, full_name, date_of_birth, gender, phone, created_at`,
        [full_name, date_of_birth, gender, phone, user.id]
      );

      if (userUpdateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Update or insert medical profile
      await client.query(
        `INSERT INTO user_medical_profile (user_id, blood_type, allergies, chronic_conditions, implants, medication_notes, organ_donor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           blood_type = EXCLUDED.blood_type,
           allergies = EXCLUDED.allergies,
           chronic_conditions = EXCLUDED.chronic_conditions,
           implants = EXCLUDED.implants,
           medication_notes = EXCLUDED.medication_notes,
           organ_donor = EXCLUDED.organ_donor,
           updated_at = NOW()`,
        [user.id, blood_type || null, trimmedAllergies, trimmedConditions, trimmedImplants, trimmedMedications, organ_donor]
      );

      // Sync medical data to emergency profile for consistency
      try {
        await client.query(
          `INSERT INTO emergency_profiles (user_id, blood_type, allergies, conditions, medications, qr_code, last_updated)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (user_id) DO UPDATE SET
             blood_type = EXCLUDED.blood_type,
             allergies = EXCLUDED.allergies,
             conditions = EXCLUDED.conditions,
             medications = EXCLUDED.medications,
             last_updated = NOW()`,
          [user.id, blood_type || null, trimmedAllergies, trimmedConditions, trimmedMedications, `EMERGENCY_QR_${user.id}_${Date.now()}`]
        );
      } catch (syncError) {
        console.error('Error syncing medical data to emergency profile:', syncError);
        // Don't fail the main operation if sync fails
      }

      // Get the updated merged profile
      const mergedResult = await client.query(
        `SELECT u.id, u.email, u.full_name, u.phone, u.date_of_birth, u.gender,
                m.blood_type, m.allergies, m.chronic_conditions, m.implants, 
                m.medication_notes, m.organ_donor, u.created_at
         FROM users u
         LEFT JOIN user_medical_profile m ON m.user_id = u.id
         WHERE u.id = $1`,
        [user.id]
      );

      let emergencyData = {};

      // Handle emergency contact data separately (non-medical fields)
      if (address || emergency_contact_name || emergency_contact_phone) {
        try {
          const emergencyUpdateResult = await client.query(
            `UPDATE emergency_profiles 
             SET emergency_contact_name = $2, emergency_contact_phone = $3, last_updated = NOW()
             WHERE user_id = $1
             RETURNING emergency_contact_name, emergency_contact_phone`,
            [user.id, emergency_contact_name, emergency_contact_phone]
          );
          
          if (emergencyUpdateResult.rows.length > 0) {
            emergencyData = { address, ...emergencyUpdateResult.rows[0] };
          }
        } catch (error) {
          console.log('Emergency profiles update failed, may not exist yet');
        }
      }

      await client.query('COMMIT');

      const updatedProfile = {
        ...mergedResult.rows[0],
        ...emergencyData
      };

      return NextResponse.json({ 
        success: true, 
        profile: updatedProfile 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
