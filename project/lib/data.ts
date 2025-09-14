// Static data for demo purposes - will be replaced with actual database calls
export const users = [
  {
    id: 1,
    email: 'demo@example.com',
    password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: 'password'
    full_name: 'John Doe',
    date_of_birth: '1990-05-15',
    gender: 'Male',
    phone: '+4312345678789',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Fetch all users
export async function getUsers() {
  const res = await pool.query('SELECT * FROM users');
  return res.rows;
}

// Fetch appointments for a specific user
export async function getAppointments(userId: number) {
  const res = await pool.query('SELECT * FROM appointments WHERE user_id = $1', [userId]);
  return res.rows;
}

// Fetch health metrics for a specific user
export async function getHealthMetrics(userId: number) {
  const res = await pool.query('SELECT * FROM health_metrics WHERE user_id = $1', [userId]);
  return res.rows;
}

export const emergencyProfile = {
  id: 1,
  user_id: 1,
  blood_type: 'O+',
  allergies: 'Penicillin, Shellfish',
  conditions: 'Mild Hypertension',
  medications: 'Lisinopril 10mg daily',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '+4312345678789',
  qr_code: 'EMERGENCY_PROFILE_1_JOHN_DOE',
  last_updated: '2024-12-01T00:00:00Z'
};
