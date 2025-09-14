BEGIN;

-- ---------- Core tables ----------
CREATE TABLE users (
    id                       BIGSERIAL PRIMARY KEY,
    email                    TEXT        NOT NULL UNIQUE,
    password_hash            TEXT        NOT NULL,
    full_name                TEXT        NOT NULL,
    date_of_birth            DATE,
    gender                   TEXT,
    phone                    TEXT,
    email_verified           BOOLEAN     NOT NULL DEFAULT FALSE,
    verification_code        TEXT,
    verification_expires_at  TIMESTAMPTZ,
    verification_attempts    INTEGER     DEFAULT 0,
    is_verified              BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medical records table
CREATE TABLE IF NOT EXISTS medical_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE medical_records (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    record_type  TEXT        NOT NULL,       -- e.g., lab_result, imaging
    storage_uri  TEXT,                       -- file path, URL, or object-store key (nullable for DB storage)
    record_date  DATE        NOT NULL,
    description  TEXT,
    pdf_data     BYTEA,                      -- Store PDF binary data directly in database
    filename     VARCHAR(255),               -- Original filename
    file_size    BIGINT,                     -- File size in bytes
    mime_type    VARCHAR(100),               -- MIME type (application/pdf)
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_storage_method CHECK (
        (storage_uri IS NOT NULL AND pdf_data IS NULL) OR 
        (storage_uri IS NULL AND pdf_data IS NOT NULL) OR
        (storage_uri IS NOT NULL AND pdf_data IS NOT NULL)
    )
);

CREATE TABLE health_metrics (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_date   DATE        NOT NULL,
    metric_type   TEXT        NOT NULL,         -- e.g., blood_pressure, bmi
    value_numeric NUMERIC,
    value_text TEXT,
    unit TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Health suggestions table
CREATE TABLE IF NOT EXISTS health_suggestions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_text TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT FALSE,
    related_metric_id BIGINT REFERENCES health_metrics(id) ON DELETE SET NULL
);

CREATE TABLE user_medical_profile (
    user_id              BIGINT      PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    blood_type           TEXT        CHECK (blood_type IN ('O-','O+','A-','A+','B-','B+','AB-','AB+')),
    allergies            TEXT,
    chronic_conditions   TEXT,
    implants             TEXT,
    medication_notes     TEXT,
    organ_donor          BOOLEAN,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_profiles (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT      NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_type              TEXT,
    allergies               TEXT,
    conditions              TEXT,
    medications             TEXT,
    emergency_contact_name  TEXT,
    emergency_contact_phone TEXT,
    qr_code TEXT NOT NULL, -- String embedded in the QR code
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster token lookups
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- ---------- Insert test data ----------

-- Insert juled user
-- password: juledpass123
INSERT INTO users (email, password_hash, full_name, date_of_birth, gender, phone, email_verified, is_verified) VALUES
('juled1150@gmail.com', '$2b$12$rQv3c1yqBwEHxv.cJEOwOuz.cVzN8UKYSWlBYx8R2r6.qO7KLqXhO', 'Juled Curaj', '1995-06-15', 'Male', '+41234567890', true, true);

-- Insert medical profile for juled
INSERT INTO user_medical_profile (user_id, blood_type, allergies, chronic_conditions, implants, medication_notes, organ_donor) VALUES
(1, 'A+', 'Shellfish (mild reaction), Dust mites', 'Mild hypertension', NULL, 'Lisinopril 5mg daily, Vitamin D3 1000IU', true);

-- Insert health metrics for Juled (user_id: 1)
INSERT INTO health_metrics (user_id, metric_date, metric_type, value_numeric, unit) VALUES
(1, '2025-08-30', 'systolic_bp', 138, 'mmHg'),
(1, '2025-08-30', 'diastolic_bp', 86, 'mmHg'),
(1, '2025-08-30', 'weight', 75.2, 'kg'),
(1, '2025-08-30', 'bmi', 24.8, 'kg/m²'),
(1, '2025-08-30', 'heart_rate', 72, 'bpm'),
(1, '2025-08-28', 'systolic_bp', 135, 'mmHg'),
(1, '2025-08-28', 'diastolic_bp', 84, 'mmHg'),
(1, '2025-08-28', 'weight', 75.4, 'kg'),
(1, '2025-08-26', 'blood_glucose', 92, 'mg/dL'),
(1, '2025-08-26', 'temperature', 36.8, '°C'),
(1, '2025-08-25', 'heart_rate', 68, 'bpm'),
(1, '2025-08-24', 'spo2', 98, '%');

-- Insert sample appointments for Juled
INSERT INTO appointments (user_id, title, appointment_date, location, doctor_name, notes, status) VALUES
(1, 'Cardiology Consultation', '2025-09-10 14:30:00+00', 'Heart Health Center', 'Dr. Sarah Martinez', 'Follow-up for hypertension management', 'scheduled'),
(1, 'Annual Physical Exam', '2025-09-25 10:00:00+00', 'Primary Care Clinic', 'Dr. Michael Thompson', 'Routine annual checkup', 'scheduled'),
(1, 'Blood Work Follow-up', '2025-10-05 09:15:00+00', 'Lab Services Center', 'Dr. Lisa Chen', 'Review latest lab results', 'scheduled');

-- Insert emergency profile for Juled
INSERT INTO emergency_profiles (user_id, blood_type, allergies, conditions, medications, emergency_contact_name, emergency_contact_phone, qr_code) VALUES
(1, 'A+', 'Shellfish (mild reaction), Dust mites', 'Mild hypertension', 'Lisinopril 5mg daily, Vitamin D3 1000IU', 'Maria Curaj', '+41234567891', 'EMERGENCY_QR_JULED_' || EXTRACT(EPOCH FROM NOW())::TEXT);

-- Insert health suggestions for Juled
INSERT INTO health_suggestions (user_id, suggestion_text, related_metric_id) VALUES
(1, 'Your blood pressure is slightly elevated. Consider reducing sodium intake and increasing physical activity.', 1),
(1, 'Great job maintaining a healthy BMI! Continue with your current diet and exercise routine.', 4),
(1, 'Your oxygen saturation levels are excellent. Keep up the good respiratory health practices.', 12);


COMMIT;
