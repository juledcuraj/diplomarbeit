/**
 * Application Configuration
 * Centralized configuration for constants, validation rules, and app settings
 */

import { BLOOD_TYPES, GENDER_OPTIONS } from './constants/medical';

// Auth & Security Configuration
export const AUTH_CONFIG = {
  // Password validation
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
  
  // Verification code settings
  VERIFICATION_CODE_LENGTH: 6,
  VERIFICATION_CODE_EXPIRY_MINUTES: parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '10'),
  
  // JWT settings
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  
  // Rate limiting
  RESEND_COOLDOWN_MINUTES: parseInt(process.env.RESEND_COOLDOWN_MINUTES || '2'),
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  // User profile
  FULL_NAME_MIN_LENGTH: parseInt(process.env.FULL_NAME_MIN_LENGTH || '2'),
  PHONE_REGEX: /^[\+]?[0-9][\d]{0,15}$/,
  
  // Medical information
  MEDICAL_TEXT_MAX_LENGTH: parseInt(process.env.MEDICAL_TEXT_MAX_LENGTH || '1000'),
  BLOOD_TYPES,
  
  // Gender options
  GENDER_OPTIONS,
} as const;

// Medical Configuration
export const MEDICAL_CONFIG = {
  // Appointment danger levels and timeframes
  APPOINTMENT_TIMEFRAMES: {
    HIGH_PRIORITY: process.env.HIGH_PRIORITY_TIMEFRAME || 'within 7 days',
    MEDIUM_PRIORITY: process.env.MEDIUM_PRIORITY_TIMEFRAME || 'within 2 weeks',
    LOW_PRIORITY: process.env.LOW_PRIORITY_TIMEFRAME || 'within 4-6 weeks',
  },
  
  // Medical record types with colors (deprecated - use theme system instead)
  RECORD_TYPE_COLORS: {
    'lab_result': 'bg-medical-lab-result text-medical-lab-result-foreground border-medical-lab-result-border',
    'imaging': 'bg-medical-imaging text-medical-imaging-foreground border-medical-imaging-border',
    'prescription': 'bg-medical-prescription text-medical-prescription-foreground border-medical-prescription-border',
    'consultation': 'bg-medical-consultation text-medical-consultation-foreground border-medical-consultation-border',
    'vaccination': 'bg-medical-vaccination text-medical-vaccination-foreground border-medical-vaccination-border',
    'discharge_summary': 'bg-medical-discharge-summary text-medical-discharge-summary-foreground border-medical-discharge-summary-border',
    'other': 'bg-medical-other text-medical-other-foreground border-medical-other-border',
  } as const,
} as const;

// Email Configuration
export const EMAIL_CONFIG = {
  // SMTP settings
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465'),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || true,
  
  // Email content
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'Health Management Platform',
  FROM_EMAIL: process.env.SMTP_USER || 'noreply@healthapp.com',
  
  // URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Database Configuration
export const DB_CONFIG = {
  HOST: process.env.POSTGRES_HOST || 'localhost',
  PORT: parseInt(process.env.POSTGRES_PORT || '5432'),
  USER: process.env.POSTGRES_USER || 'myuser',
  PASSWORD: process.env.POSTGRES_PASSWORD || 'password123',
  DATABASE: process.env.POSTGRES_DB || 'myappdb',
  
  // Pool settings
  POOL_MAX: parseInt(process.env.DB_POOL_MAX || '20'),
  IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
} as const;

// UI Configuration
export const UI_CONFIG = {
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE || '10'),
  
  // Date/Time formatting
  DATE_LOCALE: process.env.DATE_LOCALE || 'en-US',
  DATE_FORMAT_OPTIONS: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  TIME_FORMAT_OPTIONS: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
  
  // Timeouts
  TOAST_TIMEOUT: parseInt(process.env.TOAST_TIMEOUT || '3000'),
  REDIRECT_DELAY: parseInt(process.env.REDIRECT_DELAY || '2000'),
} as const;

// Cron Job Configuration
export const CRON_CONFIG = {
  // Email reminder frequency
  EMAIL_REMINDER_INTERVAL_MINUTES: parseInt(process.env.EMAIL_REMINDER_INTERVAL_MINUTES || '15'),
  
  // Cleanup intervals
  TOKEN_CLEANUP_INTERVAL_HOURS: parseInt(process.env.TOKEN_CLEANUP_INTERVAL_HOURS || '24'),
} as const;

// Type exports for TypeScript
export type BloodType = typeof VALIDATION_RULES.BLOOD_TYPES[number];
export type GenderOption = typeof VALIDATION_RULES.GENDER_OPTIONS[number];
export type RecordType = keyof typeof MEDICAL_CONFIG.RECORD_TYPE_COLORS;
