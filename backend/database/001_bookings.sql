CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  status text NOT NULL DEFAULT 'hold',
  reservation_code bigint NOT NULL UNIQUE,
  CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled'))
);

CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_bookings_rev_code ON bookings(reservation_code);
CREATE INDEX idx_bookings_patient_id ON bookings(patient_id);
CREATE INDEX idx_bookings_confirmation_hash ON bookings(confirmation_hash);
CREATE INDEX idx_slots_start_at ON slots(start_at);

CREATE UNIQUE INDEX unique_confirmed_slot
ON bookings(slot_id)
WHERE status = 'confirmed';