# Booking Flow

This document describes the current booking workflow, the main business rules, and the backend/frontend functions involved in each step.

## Core Business Rules

- One browser session owns at most one in-progress pending booking in the normal flow.
- A slot can only be actively held by one owner at a time.
- A confirmed booking blocks the slot for everyone.
- Once patient contact details are submitted, patient identity is resolved from normalized email plus birthdate.
- One email may have at most one confirmed booking.
- If a matched patient already has another pending booking, the current session-owned booking wins and the older pending booking is cancelled.
- Pending bookings expire automatically.
- Frontend timers are advisory UX; backend expiry checks are authoritative.

## Main Flow

1. Browser loads the booking page.
2. Frontend calls `GET /api/session`.
3. Backend creates or reuses `booking_session_id`.
4. Frontend loads available dates and available slots.
5. User selects a slot and clicks the booking button.
6. Backend claims the slot in a transaction.
7. Frontend redirects to the booking details page.
8. Booking page reloads the booking authoritatively from backend.
9. User fills contact details and submits.
10. Backend checks expiry, resolves or creates the patient, attaches `patient_id` to the same booking row, cancels older pending bookings for the matched patient, and extends the timer for the next step.
11. Frontend can continue either to the payment page or to the no-payment confirmation-email step.
12. The chosen confirmation path eventually flips the booking to `confirmed`.

## Expiry Model

- Backend hold duration is 16 minutes.
- Frontend visible timer shows 15 minutes using `displayExpiresAt`.
- A background sweeper marks expired pending bookings as `expired`.
- The proceed-to-payment step also checks `expires_at` directly and can mark the booking expired immediately.

## Representative Scenarios

### Scenario 1: Fresh anonymous booking

1. Session has no current booking.
2. User claims a slot.
3. Backend inserts a new `pending` booking.
4. User fills details.
5. Backend creates a patient and attaches `patient_id`.
6. Backend extends the hold for payment.

Relevant functions:
- `ensure_session()`
- `db_get_available_dates()`
- `db_get_available_slots()`
- `db_claim_slot()`
- `db_get_booking()`
- `db_proceed_to_payment_for_session()`

### Scenario 2: Same session changes to another slot before payment

1. Session already has a `pending` booking.
2. User selects another slot.
3. Backend reuses the same `pending` booking row and moves it to the new slot.

Relevant functions:
- `db_claim_slot()`

### Scenario 3: User reloads booking page

1. Frontend already has `bookingId` in the URL.
2. Booking page loads backend data again using session ownership.
3. The page renders slot info, reservation code, timer, and any existing patient details.

Relevant functions:
- `db_get_booking()`

### Scenario 4: Booking expires while user is idle

1. Countdown reaches zero on the frontend.
2. Frontend alerts and redirects to the homepage.
3. Backend sweeper will eventually mark the row `expired` if it has not already been updated by another action.

Relevant functions:
- `db_expire_pending_bookings()`

### Scenario 5: User submits details after expiry

1. User clicks submit on the contact form.
2. Backend locks the current session booking with `FOR UPDATE`.
3. Backend checks `expires_at`.
4. If expired, backend updates status to `expired` and rejects.
5. Frontend alerts and redirects home.

Relevant functions:
- `db_proceed_to_payment_for_session()`

### Scenario 6: Email already has a pending booking

1. User reaches the contact form from a different session or with a newer pending hold.
2. Backend matches the submitted identity to an existing patient.
3. Backend keeps the current session-owned booking row, attaches that patient, and refreshes the booking expiry for the next step.
4. Backend cancels any other pending bookings already attached to that patient.
5. Frontend continues using the same booking id.

Relevant functions:
- `db_proceed_to_payment_for_session()`

### Scenario 7: Email already has a confirmed booking

1. User submits contact details with an email that already owns a confirmed booking.
2. Backend rejects with conflict.
3. Frontend alerts and does not continue to payment.

Relevant functions:
- `db_proceed_to_payment_for_session()`
- `proceed_to_payment()`

### Scenario 8: User abandons VNPay

1. User reaches the payment page.
2. User leaves VNPay without finishing payment.
3. Booking remains `pending` until expiry.
4. User may retry while the hold is still active.

Relevant functions:
- `db_create_vnpay_payment_url()`

### Scenario 9: User confirms by email instead of VNPay

1. User reaches the post-handoff confirmation step.
2. Backend stores a confirmation hash and sends a confirmation link email.
3. The booking remains `pending` while the email-confirmation window is active.
4. User clicks the emailed link.
5. Backend validates the token, confirms the same booking row, and sends the final confirmation email.

Relevant functions:
- `db_send_booking_confirmation_for_session()`
- `db_confirm_booking_from_email_link()`

## Current API Endpoints

- `GET /api/session`
- `GET /api/get_available_dates`
- `POST /api/get_available_slots`
- `POST /api/claim_booking`
- `GET /api/booking/<booking_id>`
- `POST /api/booking/cancel`
- `POST /api/booking/proceed_to_payment`
- `POST /api/booking/send_confirmation_email`
- `GET /api/booking/confirm`
- `POST /api/payment/vnpay`

## Frontend Entry Points

- `landingpage/app/Booking.tsx`
- `landingpage/app/booking/page.tsx`
- `landingpage/components/ContactForm.tsx`
- `landingpage/app/payment/page.tsx`

## Backend Entry Points

- `backend/booking/app.py`
- `backend/booking/_booking.py`

## Important Functions

- `create_booking_session_id()`
- `db_get_available_dates()`
- `db_get_available_slots()`
- `db_claim_slot()`
- `db_get_booking()`
- `db_cancel_pending_booking_for_session()`
- `db_proceed_to_payment_for_session()`
- `db_send_booking_confirmation_for_session()`
- `db_confirm_booking_from_email_link()`
- `db_create_vnpay_payment_url()`
- `db_expire_pending_bookings()`

## Current Known Tradeoffs

- Availability queries still treat expired `pending` bookings as blocking until the sweeper runs.
- Session identity is still important for anonymous ownership before email is known.
