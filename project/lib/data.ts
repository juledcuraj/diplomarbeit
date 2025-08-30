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

export const appointments = [
  {
    id: 1,
    user_id: 1,
    title: 'Annual Physical Checkup',
    appointment_date: '2024-12-25T10:00:00Z',
    location: 'Main Street Medical Center',
    doctor_name: 'Dr. Sarah Johnson',
    notes: 'Bring previous lab results',
    status: 'scheduled',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    user_id: 1,
    title: 'Dental Cleaning',
    appointment_date: '2024-12-28T14:30:00Z',
    location: 'Bright Smile Dental',
    doctor_name: 'Dr. Michael Chen',
    notes: 'Regular cleaning and checkup',
    status: 'scheduled',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    user_id: 1,
    title: 'Cardiology Consultation',
    appointment_date: '2024-11-15T09:15:00Z',
    location: 'Heart Health Institute',
    doctor_name: 'Dr. Emily Rodriguez',
    notes: 'Follow-up on stress test results',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const healthMetrics = [
  {
    id: 1,
    user_id: 1,
    metric_date: '2024-12-01',
    metric_type: 'blood_pressure',
    value_numeric: 120,
    value_text: '120/80',
    unit: 'mmHg',
    created_at: '2024-12-01T00:00:00Z'
  },
  {
    id: 2,
    user_id: 1,
    metric_date: '2024-12-01',
    metric_type: 'weight',
    value_numeric: 75.5,
    value_text: null,
    unit: 'kg',
    created_at: '2024-12-01T00:00:00Z'
  },
  {
    id: 3,
    user_id: 1,
    metric_date: '2024-11-15',
    metric_type: 'blood_pressure',
    value_numeric: 118,
    value_text: '118/78',
    unit: 'mmHg',
    created_at: '2024-11-15T00:00:00Z'
  },
  {
    id: 4,
    user_id: 1,
    metric_date: '2024-11-15',
    metric_type: 'weight',
    value_numeric: 76.2,
    value_text: null,
    unit: 'kg',
    created_at: '2024-11-15T00:00:00Z'
  }
];

export const medicalRecords = [
  {
    id: 1,
    user_id: 1,
    record_type: 'lab_result',
    storage_uri: '/records/lab-2024-11-15.pdf',
    record_date: '2024-11-15',
    description: 'Complete Blood Count and Basic Metabolic Panel',
    created_at: '2024-11-15T00:00:00Z',
    updated_at: '2024-11-15T00:00:00Z'
  },
  {
    id: 2,
    user_id: 1,
    record_type: 'imaging',
    storage_uri: '/records/chest-xray-2024-10-20.dcm',
    record_date: '2024-10-20',
    description: 'Chest X-Ray - Normal findings',
    created_at: '2024-10-20T00:00:00Z',
    updated_at: '2024-10-20T00:00:00Z'
  }
];

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