-- Add new profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medications TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;

-- Add check constraints for data validation
ALTER TABLE users ADD CONSTRAINT check_gender 
  CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

ALTER TABLE users ADD CONSTRAINT check_blood_type 
  CHECK (blood_type IS NULL OR blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
