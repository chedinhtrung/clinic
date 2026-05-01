CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code bigint NOT NULL UNIQUE,
  name text NOT NULL,
  gender text,
  email text,
  ai_summary text,
  birthdate date,
  phone text
);

CREATE TABLE slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id uuid NOT NULL REFERENCES slots(id),
  session_id text,
  patient_id uuid REFERENCES patients(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  confirmed_at timestamptz,
  confirmation_hash text,
  patient_note text,
  ai_summary text,
  chat_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  chat_status text NOT NULL DEFAULT 'active',
  status text NOT NULL DEFAULT 'pending',
  reservation_code bigint NOT NULL UNIQUE,
  CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled', 'finished')),
  CHECK (chat_status IN ('active', 'finished', 'abuse'))
);

CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_bookings_rev_code ON bookings(reservation_code);
CREATE INDEX idx_bookings_patient_id ON bookings(patient_id);
CREATE INDEX idx_bookings_confirmation_hash ON bookings(confirmation_hash);
CREATE INDEX idx_slots_start_at ON slots(start_at);
CREATE INDEX idx_slots_is_active_start_at ON slots(is_active, start_at);
CREATE UNIQUE INDEX unique_patient_identity
ON patients((lower(trim(email))), birthdate)
WHERE email IS NOT NULL
  AND birthdate IS NOT NULL;

CREATE UNIQUE INDEX unique_active_slot_booking
ON bookings(slot_id)
WHERE status IN ('pending', 'confirmed');
