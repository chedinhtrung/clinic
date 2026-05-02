ALTER TABLE patients
ADD COLUMN IF NOT EXISTS registration_date timestamptz;

UPDATE patients
SET registration_date = now()
WHERE registration_date IS NULL;

ALTER TABLE patients
ALTER COLUMN registration_date SET NOT NULL;

ALTER TABLE patients
ALTER COLUMN registration_date SET DEFAULT now();
