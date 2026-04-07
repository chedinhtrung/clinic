from config import *
from datetime import date, datetime, time, timedelta, timezone
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


class BookingAccessError(ValueError):
    """Raised when a booking cannot be accessed by the current session."""


"""Return all distinct slot dates from tomorrow onward that this session may claim."""
def db_get_available_dates(session_id: str | None = None) -> list[str]:
    query = """
        SELECT DISTINCT DATE(s.start_at) AS available_date
        FROM slots s
        WHERE s.start_at >= date_trunc('day', now()) + interval '1 day'
          AND NOT EXISTS (
              SELECT 1
              FROM bookings b
              WHERE b.slot_id = s.id
                AND (
                    b.status = 'confirmed'
                    OR (b.status = 'pending' AND (b.session_id IS DISTINCT FROM %s))
                )
          )
        ORDER BY available_date ASC
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (session_id,))
            rows = cur.fetchall()

    return [row[0].isoformat() for row in rows]


"""Return all slots for one YYYY-MM-DD date that this session may claim."""
def db_get_available_slots(selected_date_raw: str, session_id: str | None = None) -> list[dict[str, str]]:
    selected_date = _parse_selected_date(selected_date_raw)
    day_start = datetime.combine(selected_date, time.min)
    day_end = day_start + timedelta(days=1)

    query = """
        SELECT s.start_at, s.end_at, s.id
        FROM slots s
        WHERE s.start_at >= %s
          AND s.start_at < %s
          AND NOT EXISTS (
              SELECT 1
              FROM bookings b
              WHERE b.slot_id = s.id
                AND (
                    b.status = 'confirmed'
                    OR (b.status = 'pending' AND (b.session_id IS DISTINCT FROM %s))
                )
          )
        ORDER BY s.start_at ASC
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (day_start, day_end, session_id))
            rows = cur.fetchall()

    return [
        {
            "id": str(row[2]),
            "startAt": row[0].isoformat(),
            "endAt": row[1].isoformat(),
        }
        for row in rows
    ]


"""Create or move the current session's pending booking onto the requested slot."""
def db_claim_slot(*, slot_id: str, session_id: str) -> dict[str, str | int]:
    if not slot_id:
        raise ValueError("slot_id is required")
    if not session_id:
        raise ValueError("session_id is required")

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=16)

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
                            SELECT id, session_id, status, reservation_code, expires_at
                            FROM bookings
                            WHERE slot_id = %s
                              AND status IN ('pending', 'confirmed')
                            FOR UPDATE
                            LIMIT 1
                            """,
                            (slot_id,),
                        )
                        target_booking = cur.fetchone()

                        cur.execute(
                            """
                            SELECT id, slot_id, reservation_code, status
                            FROM bookings
                            WHERE session_id = %s
                              AND status = 'pending'
                            ORDER BY created_at DESC
                            FOR UPDATE
                            LIMIT 1
                            """,
                            (session_id,),
                        )
                        existing_pending_booking = cur.fetchone()

                        if target_booking is not None:
                            target_booking_id = str(target_booking[0])
                            target_booking_session_id = target_booking[1]
                            target_booking_status = target_booking[2]

                            # Clicking the same slot again should simply reuse the
                            # existing pending booking owned by this session.
                            if (
                                existing_pending_booking is not None
                                and target_booking_id == str(existing_pending_booking[0])
                            ):
                                return {
                                    "id": target_booking_id,
                                    "reservationCode": target_booking[3],
                                    "status": target_booking_status,
                                    "expiresAt": target_booking[4].isoformat(),
                                    "displayExpiresAt": (target_booking[4] - timedelta(minutes=1)).isoformat(),
                                    "slotId": str(slot_row[0]),
                                    "startAt": slot_row[1].isoformat(),
                                    "endAt": slot_row[2].isoformat(),
                                }

                            if target_booking_status == "confirmed" or target_booking_session_id != session_id:
                                raise BookingConflictError("slot is already booked")

                        if existing_pending_booking is not None:
                            cur.execute(
                                """
                                UPDATE bookings
                                SET slot_id = %s,
                                    expires_at = %s,
                                    status = 'pending'
                                WHERE id = %s
                                RETURNING id, reservation_code, status, expires_at
                                """,
                                (slot_id, expires_at, existing_pending_booking[0]),
                            )
                            booking_row = cur.fetchone()
                            return {
                                "id": str(booking_row[0]),
                                "reservationCode": booking_row[1],
                                "status": booking_row[2],
                                "expiresAt": booking_row[3].isoformat(),
                                "displayExpiresAt": (booking_row[3] - timedelta(minutes=1)).isoformat(),
                                "slotId": str(slot_row[0]),
                                "startAt": slot_row[1].isoformat(),
                                "endAt": slot_row[2].isoformat(),
                            }

                        if target_booking is not None:
                            raise BookingConflictError("slot is already booked")

                        cur.execute(
                            """
                            INSERT INTO bookings (slot_id, session_id, expires_at, status, reservation_code)
                            VALUES (%s, %s, %s, 'pending', %s)
                            RETURNING id, reservation_code, status, expires_at
                            """,
                            (slot_id, session_id, expires_at, reservation_code),
                        )
                        booking_row = cur.fetchone()

            return {
                "id": str(booking_row[0]),
                "reservationCode": booking_row[1],
                "status": booking_row[2],
                "expiresAt": booking_row[3].isoformat(),
                "displayExpiresAt": (booking_row[3] - timedelta(minutes=1)).isoformat(),
                "slotId": str(slot_row[0]),
                "startAt": slot_row[1].isoformat(),
                "endAt": slot_row[2].isoformat(),
            }
        except UniqueViolation:
            continue

    raise RuntimeError("could not generate a unique reservation code")


"""Return one booking if it belongs to the current session."""
def db_get_booking(*, booking_id: str, session_id: str) -> dict[str, str | int]:
    if not booking_id:
        raise ValueError("booking_id is required")
    if not session_id:
        raise ValueError("session_id is required")

    query = """
        SELECT b.id, b.reservation_code, b.status, b.slot_id, b.expires_at, s.start_at, s.end_at
        FROM bookings b
        JOIN slots s ON s.id = b.slot_id
        WHERE b.id = %s
          AND b.session_id = %s
        LIMIT 1
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (booking_id, session_id))
            row = cur.fetchone()

    if row is None:
        raise BookingAccessError("booking not found")

    return {
        "id": str(row[0]),
        "reservationCode": row[1],
        "status": row[2],
        "slotId": str(row[3]),
        "expiresAt": row[4].isoformat(),
        "displayExpiresAt": (row[4] - timedelta(minutes=1)).isoformat(),
        "startAt": row[5].isoformat(),
        "endAt": row[6].isoformat(),
    }


"""Cancel the current session's active pending booking, if one exists."""
def db_cancel_pending_booking_for_session(*, session_id: str) -> None:
    if not session_id:
        raise ValueError("session_id is required")

    query = """
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = (
            SELECT id
            FROM bookings
            WHERE session_id = %s
              AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
        )
    """

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(query, (session_id,))


"""Mark expired pending bookings so they stop blocking slot availability."""
def db_expire_pending_bookings() -> int:
    query = """
        UPDATE bookings
        SET status = 'expired'
        WHERE status = 'pending'
          AND expires_at <= now()
    """

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(query)
                return cur.rowcount


"""Validate and parse the YYYY-MM-DD date string sent by the frontend."""
def _parse_selected_date(selected_date_raw: str) -> date:
    if not selected_date_raw:
        raise ValueError("selected date is required")

    try:
        return date.fromisoformat(selected_date_raw)
    except ValueError as exc:
        raise ValueError("selected date must be a valid YYYY-MM-DD string") from exc
