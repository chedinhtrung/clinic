ALTER TABLE slots
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_slots_is_active_start_at
ON slots(is_active, start_at);
