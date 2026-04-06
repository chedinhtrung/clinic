from config import *
from datetime import date, datetime, time, timedelta
from random import randint
from secrets import token_urlsafe

import psycopg
from psycopg.errors import UniqueViolation
from psycopg_pool import ConnectionPool


if not DB_URL:
    raise RuntimeError("BOOKING_DB_URL environment variable is not set")


# Reuse PostgreSQL connections across requests so we don't pay the cost of
# opening a brand new database connection on every API call.
DB_POOL = ConnectionPool(conninfo=DB_URL, min_size=1, max_size=10)


"""Create a secure anonymous session id for browser-side booking identity."""
def create_booking_session_id() -> str:
    return token_urlsafe(32)


class BookingConflictError(ValueError):
    """Raised when a slot is already held by an active booking."""


"""Return all distinct slot dates from tomorrow onward as YYYY-MM-DD strings."""
def db_get_available_dates() -> list[str]:
    query = """
        SELECT DISTINCT DATE(start_at) AS available_date
        FROM slots
        WHERE start_at >= date_trunc('day', now()) + interval '1 day'
        ORDER BY available_date ASC
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()

    dates = [row[0].isoformat() for row in rows]
    print(dates)
    return dates


"""Return all slots for one YYYY-MM-DD date in a frontend-friendly shape."""
def db_get_available_slots(selected_date_raw: str) -> list[dict[str, str]]:
    selected_date = _parse_selected_date(selected_date_raw)
    day_start = datetime.combine(selected_date, time.min)
    day_end = day_start + timedelta(days=1)

    query = """
        SELECT start_at, end_at, id
        FROM slots
        WHERE start_at >= %s AND start_at < %s
        ORDER BY start_at ASC
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (day_start, day_end))
            rows = cur.fetchall()

    print(rows)
    return [
        {
            "from": row[0].strftime("%H:%M"),
            "to": row[1].strftime("%H:%M"),
            "id": str(row[2]),
        }
        for row in rows
    ]


"""Claim a slot for the current anonymous session if it has no active booking."""
def db_claim_slot(*, slot_id: str, session_id: str) -> dict[str, str | int]:
    if not slot_id:
        raise ValueError("slot_id is required")
    if not session_id:
        raise ValueError("session_id is required")

    for _ in range(10):
        reservation_code = randint(100000000, 999999999)
        try:
            with DB_POOL.connection() as conn:
                with conn.transaction():
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT id, start_at, end_at
                            FROM slots
                            WHERE id = %s
                            FOR UPDATE
                            """,
                            (slot_id,),
                        )
                        slot_row = cur.fetchone()
                        if slot_row is None:
                            raise ValueError("slot not found")

                        cur.execute(
                            """
                            SELECT id
                            FROM bookings
                            WHERE slot_id = %s
                              AND status IN ('pending', 'confirmed')
                            LIMIT 1
                            """,
                            (slot_id,),
                        )
                        active_booking = cur.fetchone()
                        if active_booking is not None:
                            raise BookingConflictError("slot is already booked")

                        cur.execute(
                            """
                            INSERT INTO bookings (slot_id, session_id, expires_at, status, reservation_code)
                            VALUES (%s, %s, %s, 'pending', %s)
                            RETURNING id, reservation_code, status
                            """,
                            (slot_id, session_id, datetime.now() + timedelta(minutes=15), reservation_code),
                        )
                        booking_row = cur.fetchone()

            return {
                "id": str(booking_row[0]),
                "reservationCode": booking_row[1],
                "status": booking_row[2],
                "slotId": str(slot_row[0]),
                "startAt": slot_row[1].isoformat(),
                "endAt": slot_row[2].isoformat(),
            }
        except UniqueViolation:
            continue

    raise RuntimeError("could not generate a unique reservation code")


"""Validate and parse the YYYY-MM-DD date string sent by the frontend."""
def _parse_selected_date(selected_date_raw: str) -> date:
    if not selected_date_raw:
        raise ValueError("selected date is required")

    try:
        return date.fromisoformat(selected_date_raw)
    except ValueError as exc:
        raise ValueError("selected date must be a valid YYYY-MM-DD string") from exc
