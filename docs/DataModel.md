# Data Model Notes

This document summarizes the booking data model and a few important lifecycle
rules that are easy to miss when reading the schema alone.

## Core Tables

### `patients`

Stores patient identity and contact details.

Important fields:

- `id`
- `patient_code`
- `name`
- `gender`
- `email`
- `birthdate`
- `phone`

Identity rule:

- patient identity is matched by `lower(trim(email)) + birthdate`

### `slots`

Stores schedulable appointment windows.

Important fields:

- `id`
- `start_at`
- `end_at`
- `is_active`
- `created_at`

Lifecycle rule:

- `is_active = true` means the slot is part of live scheduling inventory
- `is_active = false` means the slot has been archived and should not appear in
  public booking availability or normal admin slot-management views

Archival rule:

- a slot may be archived if it is not currently held by an active booking
- active booking means `pending` or `confirmed`
- cancelled, expired, and finished bookings do not block archival

Historical rule:

- archived slots remain in the database so historical bookings can still keep
  their original `slot_id` reference

### `bookings`

Stores slot holds and appointment history.

Important fields:

- `id`
- `slot_id`
- `session_id`
- `patient_id`
- `expires_at`
- `confirmed_at`
- `confirmation_hash`
- `status`
- `reservation_code`

Allowed statuses:

- `pending`
- `confirmed`
- `expired`
- `cancelled`
- `finished`

Important relationship note:

- bookings continue to reference their original slot even after that slot has
  been archived

## Design Intent

The system deliberately separates:

- slot lifecycle
- booking lifecycle

A slot being archived does not delete booking history.
A booking being cancelled does not require the slot row to be deleted.

This allows the doctor/admin to remove a slot from future scheduling without
breaking historical references for cancelled or confirmed bookings.
