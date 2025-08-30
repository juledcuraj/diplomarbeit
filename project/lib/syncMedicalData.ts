import pool from './db';

/**
 * Synchronizes medical data from user_medical_profile to emergency_profiles
 * to ensure consistency between both tables
 */
export async function syncMedicalDataToEmergency(userId: number) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get medical data from user_medical_profile
    const medicalResult = await client.query(
      'SELECT blood_type, allergies, chronic_conditions, medication_notes FROM user_medical_profile WHERE user_id = $1',
      [userId]
    );
    
    if (medicalResult.rows.length === 0) {
      // If no medical profile exists, create one
      await client.query(
        'INSERT INTO user_medical_profile (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [userId]
      );
    }
    
    const medicalData = medicalResult.rows[0] || {};
    
    // Update emergency profile with medical data
    await client.query(
      `INSERT INTO emergency_profiles (user_id, blood_type, allergies, conditions, medications, qr_code, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         blood_type = EXCLUDED.blood_type,
         allergies = EXCLUDED.allergies,
         conditions = EXCLUDED.conditions,
         medications = EXCLUDED.medications,
         last_updated = NOW()`,
      [
        userId,
        medicalData.blood_type,
        medicalData.allergies,
        medicalData.chronic_conditions,
        medicalData.medication_notes,
        `EMERGENCY_QR_${userId}_${Date.now()}`
      ]
    );
    
    await client.query('COMMIT');
    console.log(`Medical data synced for user ${userId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error syncing medical data:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Ensures that all existing users have their medical data synced
 */
export async function syncAllUsersMedicalData() {
  try {
    const usersResult = await pool.query('SELECT id FROM users');
    
    for (const user of usersResult.rows) {
      await syncMedicalDataToEmergency(user.id);
    }
    
    console.log('All users medical data synced successfully');
  } catch (error) {
    console.error('Error syncing all users medical data:', error);
    throw error;
  }
}
