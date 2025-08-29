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

CREATE TABLE appointments (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            TEXT        NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    location         TEXT,
    doctor_name      TEXT,
    notes            TEXT,
    status           text,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reminders (
    id             BIGSERIAL PRIMARY KEY,
    appointment_id BIGINT      NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    remind_at      TIMESTAMPTZ NOT NULL,
    sent           BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at        TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    value_text    TEXT,
    unit          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE health_suggestions (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_text   TEXT        NOT NULL,
    generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read              BOOLEAN     NOT NULL DEFAULT FALSE,
    related_metric_id BIGINT REFERENCES health_metrics(id) ON DELETE SET NULL
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
    qr_code                 TEXT        NOT NULL,   -- string embedded in the QR
    last_updated            TIMESTAMPTZ NOT NULL DEFAULT NOW()
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


COMMIT;
