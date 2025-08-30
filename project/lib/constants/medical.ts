/**
 * Medical Constants and Categories
 * Centralized medical-related constants for consistency across the application
 */

// Blood Types
export const BLOOD_TYPES = [
  'O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'
] as const;

export type BloodType = typeof BLOOD_TYPES[number];

// Gender Options
export const GENDER_OPTIONS = [
  'Male', 'Female', 'Other', 'Prefer not to say'
] as const;

export type GenderOption = typeof GENDER_OPTIONS[number];

// Medical Record Types
export const MEDICAL_RECORD_TYPES = {
  LAB_RESULT: 'lab_result',
  IMAGING: 'imaging', 
  PRESCRIPTION: 'prescription',
  CONSULTATION: 'consultation',
  VACCINATION: 'vaccination',
  DISCHARGE_SUMMARY: 'discharge_summary',
  OTHER: 'other'
} as const;

export const MEDICAL_RECORD_TYPE_LABELS = {
  [MEDICAL_RECORD_TYPES.LAB_RESULT]: 'Lab Result',
  [MEDICAL_RECORD_TYPES.IMAGING]: 'Imaging',
  [MEDICAL_RECORD_TYPES.PRESCRIPTION]: 'Prescription',
  [MEDICAL_RECORD_TYPES.CONSULTATION]: 'Consultation',
  [MEDICAL_RECORD_TYPES.VACCINATION]: 'Vaccination',
  [MEDICAL_RECORD_TYPES.DISCHARGE_SUMMARY]: 'Discharge Summary',
  [MEDICAL_RECORD_TYPES.OTHER]: 'Other'
} as const;

export type MedicalRecordType = typeof MEDICAL_RECORD_TYPES[keyof typeof MEDICAL_RECORD_TYPES];

// Health Metric Types
export const HEALTH_METRIC_TYPES = {
  BLOOD_PRESSURE_SYSTOLIC: 'systolic_bp',
  BLOOD_PRESSURE_DIASTOLIC: 'diastolic_bp',
  HEART_RATE: 'heart_rate',
  WEIGHT: 'weight',
  BMI: 'bmi',
  BLOOD_GLUCOSE: 'blood_glucose',
  TEMPERATURE: 'temperature',
  OXYGEN_SATURATION: 'spo2',
  CHOLESTEROL_TOTAL: 'cholesterol_total',
  CHOLESTEROL_LDL: 'cholesterol_ldl',
  CHOLESTEROL_HDL: 'cholesterol_hdl',
  TRIGLYCERIDES: 'triglycerides'
} as const;

export const HEALTH_METRIC_LABELS = {
  [HEALTH_METRIC_TYPES.BLOOD_PRESSURE_SYSTOLIC]: 'Systolic Blood Pressure',
  [HEALTH_METRIC_TYPES.BLOOD_PRESSURE_DIASTOLIC]: 'Diastolic Blood Pressure',
  [HEALTH_METRIC_TYPES.HEART_RATE]: 'Heart Rate',
  [HEALTH_METRIC_TYPES.WEIGHT]: 'Weight',
  [HEALTH_METRIC_TYPES.BMI]: 'BMI',
  [HEALTH_METRIC_TYPES.BLOOD_GLUCOSE]: 'Blood Glucose',
  [HEALTH_METRIC_TYPES.TEMPERATURE]: 'Temperature',
  [HEALTH_METRIC_TYPES.OXYGEN_SATURATION]: 'Oxygen Saturation',
  [HEALTH_METRIC_TYPES.CHOLESTEROL_TOTAL]: 'Total Cholesterol',
  [HEALTH_METRIC_TYPES.CHOLESTEROL_LDL]: 'LDL Cholesterol',
  [HEALTH_METRIC_TYPES.CHOLESTEROL_HDL]: 'HDL Cholesterol',
  [HEALTH_METRIC_TYPES.TRIGLYCERIDES]: 'Triglycerides'
} as const;

export const HEALTH_METRIC_UNITS = {
  [HEALTH_METRIC_TYPES.BLOOD_PRESSURE_SYSTOLIC]: 'mmHg',
  [HEALTH_METRIC_TYPES.BLOOD_PRESSURE_DIASTOLIC]: 'mmHg',
  [HEALTH_METRIC_TYPES.HEART_RATE]: 'bpm',
  [HEALTH_METRIC_TYPES.WEIGHT]: 'kg',
  [HEALTH_METRIC_TYPES.BMI]: 'kg/m²',
  [HEALTH_METRIC_TYPES.BLOOD_GLUCOSE]: 'mg/dL',
  [HEALTH_METRIC_TYPES.TEMPERATURE]: '°C',
  [HEALTH_METRIC_TYPES.OXYGEN_SATURATION]: '%',
  [HEALTH_METRIC_TYPES.CHOLESTEROL_TOTAL]: 'mg/dL',
  [HEALTH_METRIC_TYPES.CHOLESTEROL_LDL]: 'mg/dL',
  [HEALTH_METRIC_TYPES.CHOLESTEROL_HDL]: 'mg/dL',
  [HEALTH_METRIC_TYPES.TRIGLYCERIDES]: 'mg/dL'
} as const;

export type HealthMetricType = typeof HEALTH_METRIC_TYPES[keyof typeof HEALTH_METRIC_TYPES];

// Appointment Statuses
export const APPOINTMENT_STATUSES = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled'
} as const;

export const APPOINTMENT_STATUS_LABELS = {
  [APPOINTMENT_STATUSES.SCHEDULED]: 'Scheduled',
  [APPOINTMENT_STATUSES.CONFIRMED]: 'Confirmed',
  [APPOINTMENT_STATUSES.COMPLETED]: 'Completed',
  [APPOINTMENT_STATUSES.CANCELLED]: 'Cancelled',
  [APPOINTMENT_STATUSES.NO_SHOW]: 'No Show',
  [APPOINTMENT_STATUSES.RESCHEDULED]: 'Rescheduled'
} as const;

export type AppointmentStatus = typeof APPOINTMENT_STATUSES[keyof typeof APPOINTMENT_STATUSES];

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
} as const;

export const PRIORITY_LABELS = {
  [PRIORITY_LEVELS.LOW]: 'Low Priority',
  [PRIORITY_LEVELS.MEDIUM]: 'Medium Priority',
  [PRIORITY_LEVELS.HIGH]: 'High Priority',
  [PRIORITY_LEVELS.CRITICAL]: 'Critical'
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

// Common Allergies (for autocomplete/suggestions)
export const COMMON_ALLERGIES = [
  'Penicillin',
  'Shellfish',
  'Peanuts',
  'Tree nuts',
  'Dairy',
  'Eggs',
  'Soy',
  'Wheat/Gluten',
  'Fish',
  'Sesame',
  'Latex',
  'Dust mites',
  'Pollen',
  'Pet dander',
  'Mold',
  'Aspirin',
  'Ibuprofen',
  'Sulfa drugs',
  'Codeine',
  'Morphine'
] as const;

// Common Chronic Conditions
export const COMMON_CONDITIONS = [
  'Hypertension',
  'Diabetes Type 1',
  'Diabetes Type 2',
  'Asthma',
  'COPD',
  'Heart disease',
  'Arthritis',
  'Osteoporosis',
  'Depression',
  'Anxiety',
  'Migraine',
  'Epilepsy',
  'Thyroid disorder',
  'Kidney disease',
  'Liver disease',
  'Sleep apnea',
  'Fibromyalgia',
  'IBS',
  'Crohn\'s disease',
  'Ulcerative colitis'
] as const;

// Common Medications (for autocomplete/suggestions)
export const COMMON_MEDICATIONS = [
  'Lisinopril',
  'Metformin',
  'Atorvastatin',
  'Levothyroxine',
  'Amlodipine',
  'Omeprazole',
  'Losartan',
  'Simvastatin',
  'Gabapentin',
  'Sertraline',
  'Insulin',
  'Albuterol',
  'Furosemide',
  'Hydrochlorothiazide',
  'Pantoprazole',
  'Escitalopram',
  'Fluoxetine',
  'Tramadol',
  'Ibuprofen',
  'Acetaminophen'
] as const;

// Implant/Device Categories
export const MEDICAL_DEVICE_CATEGORIES = [
  'Cardiac devices (Pacemaker, ICD, etc.)',
  'Orthopedic implants (Hip, Knee, etc.)',
  'Dental implants',
  'Hearing aids/Cochlear implants',
  'Insulin pumps',
  'Neurostimulators',
  'Prosthetics',
  'Stents',
  'Artificial joints',
  'Other'
] as const;
