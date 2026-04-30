# Patient Identity Rules

This note explains how the booking backend now identifies and reuses patient
records without requiring a user account.

Relevant files:

- `backend/booking/_booking.py`
- `backend/database/001_bookings.sql`
- `backend/database/003_patient_identity.sql`

## Why This Exists

The booking flow does not require patients to create an account. That is good
for conversion, but it means the backend cannot rely on login-based identity.

The system now separates three concepts:

1. `patients.id`: internal immutable UUID used by the database.
2. `patients.patient_code`: unique 9-digit human-readable patient reference.
3. Patient identity match: normalized email plus birthdate.

## Database Rules

`patients.patient_code` is unique and intended for human-facing workflows such
as support, admin lookup, and future patient references.

The backend no longer treats email alone as globally unique. Instead, the
database enforces uniqueness on:

- `lower(trim(email))`
- `birthdate`

This allows a family or shared contact address to be reused by different
patients, while still preventing duplicate records for the same person when the
same email and birthdate are submitted again.

## Booking Matching Rule

When the booking flow receives patient details during
`POST /api/booking/prepare_booking_confirmation`, it uses this rule:

1. Normalize the submitted email with `lower(trim(email))`.
2. Look for an existing patient with the same normalized email and birthdate.
3. If found, reuse that patient record.
4. If not found, create a new patient with a new 9-digit `patient_code`.

If the matched patient already has another active booking with status
`pending` or `confirmed`, the existing booking rules still apply. That means a
second confirmed booking for the same matched patient is rejected.

## Change-Link Rule

When a patient updates details from the emailed change link, the backend applies
the same identity rule:

1. Normalize the submitted email.
2. Look for another patient with the same normalized email and birthdate.
3. If found, reattach the booking to that patient record and update it.
4. If not found, update the current patient record in place.

This keeps the matching logic consistent between the initial booking flow and
later contact-detail edits.

## Migration Note

Existing databases need the migration in
`backend/database/003_patient_identity.sql`.

That migration:

- adds `patient_code`
- backfills a code for existing patients
- drops the old unique-email index
- creates the new unique indexes for `patient_code` and patient identity
