from datetime import datetime
from typing import Any

from config import DB_POOL


class AdminSlotConflictError(ValueError):
    """Raised when a slot mutation conflicts with an active booking."""


class AdminSlotNotFoundError(ValueError):
    """Raised when a slot cannot be found."""



def _parse_datetime(raw_value: str | None, field_name: str) -> datetime:
    if not raw_value:
        raise ValueError(f"{field_name} is required")

    # FullCalendar may send UTC timestamps with a trailing Z; datetime.fromisoformat
    # expects an explicit offset instead.
    normalized = raw_value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be a valid ISO datetime") from exc


def _validate_slot_range(start_at: datetime, end_at: datetime) -> None:
    if end_at <= start_at:
        raise ValueError("slot end must be after slot start")


def _slot_title(status: str, patient_name: str | None) -> str:
    # Keep display labels centralized so list and detail endpoints agree.
    if status == "free":
        return "Lịch hẹn trống"
    if status == "pending":
        return "Chờ xác nhận"
    if status == "confirmed":
        return patient_name or "Đã xác nhận"
    if status == "finished":
        return patient_name or "Đã hoàn thành"
    return status


def _row_to_admin_slot(row: Any) -> dict[str, Any]:
    # A slot without an active booking is considered admin-visible availability.
    status = row[5] or "free"
    patient_name = row[6]

    return {
        "id": str(row[0]),
        "start": row[1].isoformat(),
        "end": row[2].isoformat(),
        "createdAt": row[3].isoformat(),
        "bookingId": str(row[4]) if row[4] else None,
        "status": status,
        "title": _slot_title(status, patient_name),
        "reservationCode": row[12],
        "bookingExpiresAt": row[13].isoformat() if row[13] else None,
        "confirmedAt": row[14].isoformat() if row[14] else None,
        "patient_id": str(row[7]) if row[7] else None,
        "patient_name": patient_name,
        "patient_birthdate": row[8].isoformat() if row[8] else None,
        "patient_email": row[9],
        "patient_phone": row[10],
        "patient_gender": row[11],
        "patient_note": row[15],
        "ai_summary": row[16],
    }


ADMIN_SLOT_SELECT = """
    SELECT s.id,
           s.start_at,
           s.end_at,
           s.created_at,
           b.id AS booking_id,
           b.status,
           p.name,
           p.id AS patient_id,
           p.birthdate,
           p.email,
           p.phone,
           p.gender,
           b.reservation_code,
           b.expires_at,
           b.confirmed_at,
           b.patient_note,
           b.ai_summary
    FROM slots s
    LEFT JOIN LATERAL (
        -- Prefer active bookings in admin view, but still show finished history
        -- when no pending/confirmed row exists for a slot.
        SELECT id, slot_id, patient_id, status, reservation_code, expires_at, confirmed_at, patient_note, ai_summary
        FROM bookings
        WHERE slot_id = s.id
          AND status IN ('pending', 'confirmed', 'finished')
        ORDER BY CASE
                   WHEN status = 'confirmed' THEN 0
                   WHEN status = 'pending' THEN 1
                   WHEN status = 'finished' THEN 2
                   ELSE 3
                 END,
                 created_at DESC
        LIMIT 1
    ) b ON true
    LEFT JOIN patients p ON p.id = b.patient_id
"""


def db_get_slots(*, start: str | None, end: str | None) -> list[dict[str, Any]]:
    start_at = _parse_datetime(start, "start")
    end_at = _parse_datetime(end, "end")
    _validate_slot_range(start_at, end_at)

    query = ADMIN_SLOT_SELECT + """
        -- Return any active slot that overlaps the requested calendar window.
        WHERE s.start_at < %s
          AND s.end_at > %s
          AND s.is_active = true
        ORDER BY s.start_at ASC
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (end_at, start_at))
            rows = cur.fetchall()

    return [_row_to_admin_slot(row) for row in rows]


def db_get_slot(*, slot_id: str) -> dict[str, Any]:
    if not slot_id:
        raise ValueError("slot_id is required")

    query = ADMIN_SLOT_SELECT + """
        WHERE s.id = %s
        LIMIT 1
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (slot_id,))
            row = cur.fetchone()

    if row is None:
        raise AdminSlotNotFoundError("slot not found")

    return _row_to_admin_slot(row)


def db_insert_slot(*, start: str | None, end: str | None) -> dict[str, Any]:
    start_at = _parse_datetime(start, "start")
    end_at = _parse_datetime(end, "end")
    _validate_slot_range(start_at, end_at)

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO slots (start_at, end_at)
                    VALUES (%s, %s)
                    RETURNING id
                    """,
                    (start_at, end_at),
                )
                slot_id = str(cur.fetchone()[0])

    # Re-read through the shared serializer so create returns the same shape
    # as range/detail fetches.
    return db_get_slot(slot_id=slot_id)


def db_update_slot(*, slot_id: str, start: str | None, end: str | None) -> dict[str, Any]:
    if not slot_id:
        raise ValueError("slot_id is required")

    start_at = _parse_datetime(start, "start")
    end_at = _parse_datetime(end, "end")
    _validate_slot_range(start_at, end_at)

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Changing a slot with booking history would silently rewrite
                # appointment history, so only never-booked slots can be edited.
                cur.execute(
                    """
                    SELECT id
                    FROM bookings
                    WHERE slot_id = %s
                    LIMIT 1
                    FOR UPDATE
                    """,
                    (slot_id,),
                )
                if cur.fetchone() is not None:
                    raise AdminSlotConflictError("cannot update a slot with booking history")

                cur.execute(
                    """
                    UPDATE slots
                    SET start_at = %s,
                        end_at = %s
                    WHERE id = %s
                    RETURNING id
                    """,
                    (start_at, end_at, slot_id),
                )
                updated_row = cur.fetchone()

                if updated_row is None:
                    raise AdminSlotNotFoundError("slot not found")

    return db_get_slot(slot_id=slot_id)


def db_delete_slot(*, slot_id: str) -> None:
    if not slot_id:
        raise ValueError("slot_id is required")

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Archiving is allowed unless the slot is still occupied by an
                # active pending or confirmed booking.
                cur.execute(
                    """
                    SELECT id
                    FROM bookings
                    WHERE slot_id = %s
                      AND status IN ('pending', 'confirmed')
                    LIMIT 1
                    FOR UPDATE
                    """,
                    (slot_id,),
                )
                if cur.fetchone() is not None:
                    raise AdminSlotConflictError("Không thể xóa lịch hẹn đã được book. Contact bệnh nhân trước khi hủy.")

                cur.execute(
                    """
                    UPDATE slots
                    SET is_active = false
                    WHERE id = %s
                      AND is_active = true
                    RETURNING id
                    """,
                    (slot_id,),
                )
                deleted_row = cur.fetchone()

                if deleted_row is None:
                    raise AdminSlotNotFoundError("slot not found")
