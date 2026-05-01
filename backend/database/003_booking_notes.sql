ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS patient_note text,
ADD COLUMN IF NOT EXISTS ai_summary text;
