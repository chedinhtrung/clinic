# Slot Management

This document describes the current admin slot-management workflow between the
admin frontend, admin backend, and booking database.

## Main Workflow

1. The admin opens the slot-management tab.

   The admin page renders `SlotManagement` from
   `adminpage/components/SlotMgmt.tsx`.

2. The calendar mounts.

   `SlotMgmt.tsx` renders a FullCalendar instance. The default view is month
   view. Whenever FullCalendar initializes or the visible date range changes,
   it fires `datesSet`.

3. The frontend fetches visible slots.

   `datesSet` calls `getSlotsFromRange(info)`, which sends:

   ```http
   POST http://localhost:5002/api/get_slots
   Content-Type: application/json
   ```

   ```json
   {
     "start": "visible-range-start",
     "end": "visible-range-end"
   }
   ```

4. The admin backend handles `/api/get_slots`.

   `backend/admin/app.py` reads the JSON body and calls:

   ```python
   db_get_slots(start=data.get("start"), end=data.get("end"))
   ```

   The database helper lives in `backend/admin/_booking.py`.

5. The admin database helper loads real slot data.

   `_booking.py` imports the database connection pool from
   `backend/admin/config.py`.

   `config.py` reads:

   ```env
   BOOKING_DB_URL
   ADMIN_DB_POOL_MIN_SIZE
   ADMIN_DB_POOL_MAX_SIZE
   ```

   `ADMIN_DB_POOL_MIN_SIZE` defaults to `1`.
   `ADMIN_DB_POOL_MAX_SIZE` defaults to `10`.

6. The database query joins slots, bookings, and patients.

   `db_get_slots` queries `slots` for rows that overlap the requested range.
   It also left-joins the most relevant active booking for each slot:

   ```sql
   status IN ('pending', 'confirmed')
   ```

   If the booking has a patient, patient details are also loaded from
   `patients`.

7. The backend returns admin-facing slot objects.

   The response shape is:

   ```json
   {
     "id": "slot-id",
     "start": "slot-start-iso",
     "end": "slot-end-iso",
     "createdAt": "slot-created-at-iso",
     "bookingId": "booking-id-or-null",
     "status": "free | pending | confirmed",
     "title": "display-title",
     "reservationCode": 123456789,
     "bookingExpiresAt": "booking-expiry-iso-or-null",
     "confirmedAt": "confirmed-at-iso-or-null",
     "patient_id": "patient-id-or-null",
     "patient_name": "patient-name-or-null",
     "patient_birthdate": "YYYY-MM-DD-or-null",
     "patient_email": "patient-email-or-null",
     "patient_phone": "patient-phone-or-null",
     "patient_gender": "patient-gender-or-null",
     "ai_summary": "ai-summary-or-null"
   }
   ```

   Status is derived as follows:

   - `free`: a slot exists without an active booking.
   - `pending`: the slot has an active pending booking.
   - `confirmed`: the slot has an active confirmed booking.

8. The frontend displays slots as calendar events.

   The frontend converts `start` and `end` strings into `Date` objects, stores
   the result in `slotlist`, and renders them through FullCalendar.

   Event colors are currently:

   - `free`: green
   - `pending`: amber
   - `confirmed`: red
   - `creating`: muted green

9. The admin clicks a calendar date.

   In month view, clicking a date switches the calendar to week view centered
   around that date. This triggers another `/api/get_slots` request for the new
   visible range.

10. The admin clicks an existing slot.

    In week view, clicking a slot finds the matching slot in `slotlist` and sets
    it as `selectedSlot`.

    Once `selectedSlot` exists, `SlotMgmt.tsx` renders `SlotEditor`.

11. The editor displays selected slot data.

    `adminpage/components/SlotEditor.tsx` currently displays:

    - slot date
    - start and end time
    - status badge
    - slot title

    The backend can return patient details, but the editor does not yet display
    all of them.

## Creating A Slot

The admin backend now supports creating a slot:

```http
POST /api/slots
Content-Type: application/json
```

```json
{
  "start": "2026-04-22T09:00:00+07:00",
  "end": "2026-04-22T09:30:00+07:00"
}
```

The route calls:

```python
db_insert_slot(start=data.get("start"), end=data.get("end"))
```

The helper inserts into `slots`, then returns the full admin slot object.

Frontend status: not wired yet. `SlotEditor.tsx` still has a placeholder save
handler.

## Updating A Slot

The admin backend now supports updating an unbooked slot:

```http
PATCH /api/slots/<slot_id>
Content-Type: application/json
```

```json
{
  "start": "2026-04-22T09:00:00+07:00",
  "end": "2026-04-22T09:30:00+07:00"
}
```

The route calls:

```python
db_update_slot(slot_id=slot_id, start=data.get("start"), end=data.get("end"))
```

The backend refuses to update slots with active `pending` or `confirmed`
bookings and returns `409 Conflict`.

Frontend status: not wired yet.

## Deleting A Slot

The admin backend now supports deleting an unbooked slot:

```http
DELETE /api/slots/<slot_id>
```

The route calls:

```python
db_delete_slot(slot_id=slot_id)
```

The backend refuses to delete slots with active `pending` or `confirmed`
bookings and returns `409 Conflict`.

Frontend status: only unsaved frontend-only `creating` slots can currently be
discarded. Real slot deletion is not wired yet.

## Current Implementation Status

Connected:

- Admin calendar fetches slots by visible range.
- Admin backend has real DB helpers for fetching, creating, updating, and
  deleting slots.
- Slot fetch joins active booking and patient data.
- Backend returns an admin-facing shape compatible with the calendar.

Not yet connected:

- `SlotEditor.tsx` does not call create, update, or delete endpoints.
- The editor does not yet show all returned patient data.
- The frontend still uses a hardcoded admin API URL.
- The frontend has no loading or error states for slot operations.
- New frontend-only draft slots still need to be normalized against the full
  `Slot` type.

## Related Files

- `adminpage/components/SlotMgmt.tsx`
- `adminpage/components/SlotEditor.tsx`
- `adminpage/components/Slot.tsx`
- `backend/admin/app.py`
- `backend/admin/_booking.py`
- `backend/admin/config.py`
- `backend/database/001_bookings.sql`
