# Booking Flow Technical Notes

This document explains the current booking flow across the booking backend and
the landing page frontend. The flow is intentionally stateful. A pending booking
is tied to a browser-held anonymous session cookie until a patient email is
submitted, and later payment confirmation depends on the booking still being
valid.

Relevant files:

- `backend/booking/app.py`
- `backend/booking/_booking.py`
- `backend/database/001_bookings.sql`
- `landingpage/app/Booking.tsx`
- `landingpage/app/booking/page.tsx`
- `landingpage/components/ContactForm.tsx`
- `landingpage/app/payment/page.tsx`

## Core Idea

The booking system has two identities:

1. Anonymous browser session identity, stored in the `booking_session_id` cookie.
2. Patient email identity, known only after the contact form is submitted.

Before contact details are submitted, the backend can only know that "this same
browser" owns a pending booking. After contact details are submitted, the email
becomes the stronger business identity for conflict detection.

This means a booking is not just identified by `bookingId` in the URL. For the
normal booking and payment pages, the backend also requires the same browser
cookie that originally claimed or inherited the booking.

## Database Model

The relevant tables are `slots`, `bookings`, and `patients`.

`slots` stores available appointment windows:

- `id`
- `start_at`
- `end_at`

`bookings` stores slot holds and confirmed appointments:

- `id`
- `slot_id`
- `session_id`
- `patient_id`
- `expires_at`
- `confirmed_at`
- `status`
- `reservation_code`

`patients` stores contact details:

- `id`
- `name`
- `gender`
- `email`
- `birthdate`
- `phone`

Important database constraints:

- `reservation_code` is unique.
- A patient email is unique after normalization with `lower(trim(email))`.
- A slot can have only one active booking where status is `pending` or
  `confirmed`.

The allowed booking statuses are:

- `pending`
- `confirmed`
- `expired`
- `cancelled`
- `finished`

## Browser Session Cookie

The backend uses an HttpOnly cookie named `booking_session_id`.

The cookie is created by:

```text
GET /api/session
```

Frontend entry point:

```text
landingpage/app/Booking.tsx
```

Backend function:

```text
ensure_session()
```

If the cookie already exists, the backend leaves it alone. If it does not exist,
the backend generates a secure anonymous session id with
`create_booking_session_id()` and sets the cookie.

Cookie settings:

- `httponly=True`
- `samesite="Lax"`
- `max_age=30 days`

Because the cookie is HttpOnly, frontend code cannot read it directly. The
frontend must use `credentials: "include"` when calling booking APIs that depend
on this cookie.

If the cookie is missing later, session-protected endpoints reject the request.
This matters for users who block cookies, switch browsers, use private browsing,
or open payment/booking links in a context where the original cookie is absent.

## High-Level Flow

1. User opens the booking UI.
2. Frontend calls `GET /api/session`.
3. Backend creates or reuses `booking_session_id`.
4. Frontend loads available dates.
5. User selects a date.
6. Frontend loads available slots for that date.
7. User selects a slot and clicks the booking button.
8. Frontend calls `POST /api/claim_booking`.
9. Backend creates or moves a `pending` booking for this session.
10. Frontend redirects to `/booking?bookingId=...`.
11. Booking page reloads the booking from the backend.
12. User submits contact details.
13. Frontend calls `POST /api/booking/proceed_to_payment`.
14. Backend validates expiry, applies email-based rules, saves patient details,
    and extends the hold for payment.
15. Frontend redirects to `/payment?bookingId=...`.
16. Payment page reloads the booking from the backend.
17. User clicks the VNPay payment button.
18. Frontend calls `POST /api/payment/vnpay`.
19. Backend creates a signed VNPay payment URL.
20. Browser redirects to VNPay.
21. VNPay returns the browser to the frontend return page.
22. VNPay also calls the backend IPN endpoint.
23. The IPN endpoint confirms the booking if payment succeeded.

## Availability Loading

The initial date and slot loading happens in:

```text
landingpage/app/Booking.tsx
```

Available dates are loaded from:

```text
GET /api/get_available_dates
```

Available slots are loaded from:

```text
POST /api/get_available_slots
```

Backend functions:

```text
db_get_available_dates()
db_get_available_slots()
```

Availability is session-aware:

- Confirmed bookings block a slot for everyone.
- Pending bookings block a slot for other sessions.
- The current session can still see its own pending slot.

This is why these read endpoints also receive the cookie. Without session
awareness, a user's own held slot would disappear from them as soon as they
claimed it.

Pending bookings that have technically expired may still block availability
until the backend expiry sweeper marks them as `expired`. The sweeper runs every
60 seconds.

## Claiming a Slot

When the user selects a slot and clicks the booking button, the frontend calls:

```text
POST /api/claim_booking
```

Request body:

```json
{
  "slotId": "..."
}
```

Frontend code:

```text
landingpage/app/Booking.tsx
```

Backend functions:

```text
claim_booking()
db_claim_slot()
```

The backend requires the `booking_session_id` cookie. If it is missing, the
request fails.

`db_claim_slot()` performs the claim inside a transaction and locks the selected
slot. It checks:

- Whether the slot exists.
- Whether the target slot already has an active booking.
- Whether the current session already has a pending booking.

Important behavior:

- If the same session clicks the same already-held slot, the existing pending
  booking is reused.
- If the same session already has a pending booking and chooses a different
  slot, the backend moves that same booking row to the new slot.
- If another session already holds the slot, the backend rejects with a conflict.
- If the slot is confirmed, the backend rejects with a conflict.

The claim creates a `pending` booking with an expiry about 16 minutes in the
future. The frontend receives both:

- `expiresAt`
- `displayExpiresAt`

The visible timer uses `displayExpiresAt`, which is one minute earlier than the
true backend expiry. This gives the backend a small buffer.

After a successful claim, the frontend redirects to:

```text
/booking?bookingId=<booking-id>
```

## Booking Details Page

The booking details page is:

```text
landingpage/app/booking/page.tsx
```

It reads `bookingId` from the URL and then calls:

```text
GET /api/booking/<booking_id>
```

Backend functions:

```text
get_booking()
db_get_booking()
```

The URL parameter alone is not enough. The backend also checks that:

- `booking_id` matches a real booking.
- `session_id` on that booking matches the current `booking_session_id` cookie.

If the cookie is missing, changed, or from another browser, the booking cannot be
loaded through this endpoint.

The page displays:

- Date and time.
- Reservation code.
- Service type.
- Hold countdown.
- Contact form.

The countdown is calculated from `displayExpiresAt`. When it reaches zero, the
frontend alerts the user and redirects home. This is only a user experience
timer. The backend still performs its own expiry checks.

## Contact Form and Proceeding to Payment

The contact form is:

```text
landingpage/components/ContactForm.tsx
```

On submit, it calls:

```text
POST /api/booking/proceed_to_payment
```

Request body:

```json
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "birthdate": "YYYY-MM-DD",
  "gender": "...",
  "message": "..."
}
```

The backend currently uses:

- `name`
- `email`
- `phone`
- `birthdate`
- `gender`

The backend currently ignores `message`.

Backend functions:

```text
proceed_to_payment()
db_proceed_to_payment_for_session()
```

This is the most important transition in the flow. The backend does not receive
`bookingId` from the form. Instead, it finds the current session's latest
`pending` booking.

Then it:

1. Validates required patient fields.
2. Normalizes the submitted email.
3. Locks the current pending booking.
4. Checks whether the pending booking has expired.
5. Marks it `expired` and rejects if the true backend expiry has passed.
6. Searches for other `pending` or `confirmed` bookings using the same email.
7. Rejects if the email already owns a different confirmed booking.
8. Reuses an existing pending booking for that email if one exists.
9. Creates or updates the patient record.
10. Updates the canonical booking with the selected slot, current session,
    patient id, and a refreshed payment expiry.
11. Cancels the non-canonical current booking if the email-owned pending booking
    was reused.

The response contains the canonical booking. This is important because the
booking returned by the backend may not be the same row that the user originally
claimed. If email-based pending-booking reuse occurs, the backend returns the
email-owned pending booking instead.

The frontend correctly follows the returned booking id:

```text
/payment?bookingId=<data.booking.id>
```

## Payment Page

The payment page is:

```text
landingpage/app/payment/page.tsx
```

It reads `bookingId` from the URL and reloads the booking from:

```text
GET /api/booking/<booking_id>
```

This means the payment page has the same session-cookie dependency as the
booking details page. The booking must belong to the current browser session.

The page displays:

- Date and time.
- Reservation code.
- Patient name.
- Patient email.
- Patient phone.
- Patient birthdate.
- Patient gender.
- Hold countdown.
- VNPay payment button.

The countdown again uses `displayExpiresAt`. If it reaches zero, the frontend
alerts and redirects home.

## Creating a VNPay Payment

When the user clicks the VNPay button, the payment page calls:

```text
POST /api/payment/vnpay
```

Request body:

```json
{
  "bookingId": "..."
}
```

Backend functions:

```text
create_vnpay_payment()
db_create_vnpay_payment_url()
```

The backend checks:

- The session cookie exists.
- `bookingId` is present.
- The booking belongs to the current session.
- The booking status is still `pending`.
- The booking has not expired.
- VNPay config is present.

If these checks pass, the backend builds and signs VNPay parameters using the
configured merchant secret. The payment amount is currently hard-coded as:

```text
50000 VND
```

VNPay `vnp_TxnRef` is the booking `reservation_code`.

The backend returns:

```json
{
  "paymentUrl": "..."
}
```

The frontend redirects the browser to that URL with:

```text
window.location.href = data.paymentUrl
```

## VNPay Return vs IPN

There are two VNPay callback-related endpoints:

```text
GET /api/payment/vnpay/return
GET /api/payment/vnpay/ipn
```

The return endpoint is browser-facing. It verifies the VNPay query parameters
and returns a trusted result for display, but it calls the shared verification
logic with:

```text
allow_confirmation=False
```

That means the return endpoint verifies but does not confirm the booking.

The IPN endpoint is server-to-server and authoritative. It calls the shared
verification logic with:

```text
allow_confirmation=True
```

If the signature is valid, the amount is correct, and VNPay reports success, the
IPN path updates the booking to:

```text
status = confirmed
confirmed_at = now()
```

After confirming, it prepares a confirmation email payload. The IPN handler then
attempts to send the confirmation email.

The IPN path is designed to be idempotent. If VNPay calls it more than once, an
already confirmed booking should remain confirmed.

## Expiry Model

The backend uses a true expiry and the frontend uses an earlier display expiry.

On claim:

- Backend sets `expires_at` to about 16 minutes from now.
- Response includes `displayExpiresAt`, which is one minute earlier.

On proceed to payment:

- Backend checks the true `expires_at`.
- If expired, it marks the booking `expired` immediately.
- If still valid, it extends the hold for payment by about 16 minutes.

In the background:

```text
run_expiry_sweeper()
db_expire_pending_bookings()
```

The sweeper runs every 60 seconds and marks expired pending bookings as
`expired`.

Frontend timers are advisory. Backend expiry checks are authoritative.

## Cancellation

The contact form includes a cancel button.

It calls:

```text
POST /api/booking/cancel
```

Backend functions:

```text
cancel_booking()
db_cancel_pending_booking_for_session()
```

The backend cancels the latest active pending booking for the current session.
It does not accept a `bookingId` in the request body. This is deliberate because
it prevents a user from cancelling another user's booking by changing a URL or
payload id.

## Important Failure Cases

### Missing cookie

If `booking_session_id` is missing, these endpoints fail:

- `POST /api/claim_booking`
- `GET /api/booking/<booking_id>`
- `POST /api/booking/cancel`
- `POST /api/booking/proceed_to_payment`
- `POST /api/payment/vnpay`

This can happen if the browser blocks cookies, the request does not include
credentials, the API domain changes in a way that prevents cookie inclusion, or
the user opens the flow in another browser/device.

### Booking id without matching session

A URL like this is not enough by itself:

```text
/booking?bookingId=...
/payment?bookingId=...
```

The backend also requires the current session cookie to match the booking's
`session_id`.

### Expired pending booking

If the frontend timer expires, the page redirects home. If the user submits at
nearly the same time, the backend still checks the real `expires_at` and rejects
if the booking expired.

### Slot conflict

If another active booking already owns the selected slot, `claim_booking`
returns a conflict. The frontend refreshes the selected date availability and
asks the user to choose another slot.

### Email already has a confirmed booking

When contact details are submitted, the backend rejects if the normalized email
already owns a different confirmed booking.

### Email already has a pending booking

When contact details are submitted, the backend may reuse the existing pending
booking for that email. The booking id returned to the frontend can therefore be
different from the one in the original `/booking` URL.

## Why the Flow Is Intricate

The complexity comes from combining three different concerns:

1. Temporary anonymous slot holds.
2. Patient identity and duplicate-booking rules.
3. External payment confirmation.

The anonymous session cookie is necessary before the patient has entered an
email. The email becomes important only later. The payment provider then uses
the reservation code, not the browser session, when sending callbacks.

Because of that, the system must carefully translate between:

- Browser session id.
- Booking id.
- Patient id.
- Patient email.
- Reservation code.
- VNPay transaction reference.

Each identifier is useful at a different stage, and using the wrong one as the
source of truth would create either security issues or duplicate-booking bugs.

## Practical Invariants

These are the assumptions that keep the flow consistent:

- Normal booking and payment page access requires the same
  `booking_session_id` cookie.
- A session should have at most one active in-progress pending booking in the
  normal flow.
- A slot should have at most one active booking.
- A confirmed booking always blocks its slot.
- A pending booking blocks its slot for other sessions.
- The current session may still see and continue its own pending booking.
- Once an email is submitted, a confirmed booking for that email blocks new
  bookings.
- An existing pending booking for an email may become the canonical booking.
- The frontend must follow the booking id returned by
  `proceed_to_payment()`.
- Frontend countdowns are only UX; backend expiry is authoritative.
- VNPay IPN is the authoritative confirmation path.

