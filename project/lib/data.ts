import pool from './db';

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

// Fetch medical records for a specific user
export async function getMedicalRecords(userId: number) {
  const res = await pool.query('SELECT * FROM medical_records WHERE user_id = $1', [userId]);
  return res.rows;
}

// Fetch health suggestions for a specific user
export async function getHealthSuggestions(userId: number) {
  const res = await pool.query('SELECT * FROM health_suggestions WHERE user_id = $1', [userId]);
  return res.rows;
}

// Fetch emergency profile for a specific user
export async function getEmergencyProfile(userId: number) {
  const res = await pool.query('SELECT * FROM emergency_profiles WHERE user_id = $1', [userId]);
  return res.rows[0]; // Return the first row (unique profile per user)
}