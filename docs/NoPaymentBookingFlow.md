# No-Payment Booking Flow

This document describes the no-payment booking flow that runs in parallel with
the existing VNPay-based payment flow.

Relevant files:

- `landingpage/app/booking-email/page.tsx`
- `landingpage/app/Booking.tsx`
- `landingpage/app/booking/page.tsx`
- `landingpage/components/ContactForm.tsx`
- `landingpage/app/confirmation/page.tsx`
- `backend/booking/app.py`
- `backend/booking/_booking.py`

## Goal

The no-payment flow keeps the existing slot-claim and patient-resolution logic,
but replaces the VNPay stage with an email-confirmation stage.

The booking is only confirmed after the patient clicks the emailed confirmation
link.

## High-Level Flow

1. Patient opens the no-payment booking entry page.
2. Frontend ensures the anonymous booking session cookie exists.
3. Patient selects a slot.
4. Frontend claims the slot for the current session.
5. Frontend redirects to the shared booking details page with:
   - `bookingId`
   - `flow=email`
6. Patient fills the contact form and submits.
7. Frontend calls `POST /api/booking/prepare_booking_confirmation`.
8. Backend validates the pending booking, resolves or creates the patient,
   attaches `patient_id`, cancels older pending bookings for that patient, and
   refreshes the hold for the next step.
9. Frontend redirects to `/confirmation?bookingId=...`.
10. Patient reviews the booking details again and clicks the confirmation
    button.
11. Frontend calls `POST /api/booking/send_confirmation_email`.
12. Backend stores `confirmation_hash`, refreshes `expires_at` for the
    email-confirmation window, and sends the confirmation email.
13. Patient clicks the emailed link.
14. Backend handles `GET /api/booking/confirm`.
15. Backend verifies the token, confirms the same booking row, clears the
    confirmation hash, and sends the final confirmation email.

## Frontend Trigger Points

### Slot claim

`landingpage/app/Booking.tsx`

- `GET /api/session`
- `GET /api/get_available_dates`
- `POST /api/get_available_slots`
- `POST /api/claim_booking`

The reusable `BookingFlow` component receives `confirmationMode="email"` from:

`landingpage/app/booking-email/page.tsx`

That causes the booking redirect to include:

```text
/booking?bookingId=...&flow=email
```

### Shared booking details form

`landingpage/app/booking/page.tsx`

The page reads `flow=email` from the query string and passes:

```text
nextStep="email"
```

to:

`landingpage/components/ContactForm.tsx`

On submit, the form calls:

```text
POST /api/booking/prepare_booking_confirmation
```

Then it redirects to:

```text
/confirmation?bookingId=...
```

### No-payment confirmation review page

`landingpage/app/confirmation/page.tsx`

This page:

- reloads the booking with `GET /api/booking/<booking_id>`
- shows the remaining hold countdown
- shows booking and patient details
- calls `POST /api/booking/send_confirmation_email` when the patient clicks the
  confirmation button

After success, the page tells the patient to check their email.

## Backend Endpoints Used

- `GET /api/session`
- `GET /api/get_available_dates`
- `POST /api/get_available_slots`
- `POST /api/claim_booking`
- `GET /api/booking/<booking_id>`
- `POST /api/booking/prepare_booking_confirmation`
- `POST /api/booking/send_confirmation_email`
- `GET /api/booking/confirm`

## Important Properties

- The current session-owned booking row remains authoritative during patient
  resolution.
- The no-payment flow shares the same patient-resolution step as the payment
  flow.
- The no-payment flow diverges only after the contact form is submitted.
- The booking stays `pending` until the emailed confirmation link is clicked.
- Email confirmation uses a token plus stored hash, not just a bare booking id.
