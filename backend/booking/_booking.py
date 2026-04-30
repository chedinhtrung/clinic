from config import *
from datetime import date, datetime, time, timedelta, timezone
from email.message import EmailMessage
from hashlib import sha512
import hmac
from random import randint
from secrets import token_urlsafe
import smtplib
from urllib.parse import quote_plus

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


class BookingExpiredError(ValueError):
    """Raised when a pending booking has expired and can no longer continue."""


class BookingPaymentConfigError(ValueError):
    """Raised when VNPay configuration is incomplete."""


class BookingEmailConflictError(ValueError):
    """Raised when an email already owns a confirmed booking."""


class BookingPaymentVerificationError(ValueError):
    """Raised when VNPay callback data is invalid or cannot be verified."""


class BookingChangeAccessError(ValueError):
    """Raised when a change-link booking lookup fails access validation."""


class BookingConfirmationAccessError(ValueError):
    """Raised when an email confirmation link is invalid or expired."""


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _generate_patient_code() -> int:
    return randint(100000000, 999999999)


def _find_patient_by_identity(cur, *, normalized_email: str, birthdate: str):
    # Find the canonical patient row for this normalized identity pair.
    cur.execute(
        """
        SELECT id, patient_code
        FROM patients
        WHERE lower(trim(email)) = %s
          AND birthdate = %s
        ORDER BY id
        FOR UPDATE
        LIMIT 1
        """,
        (normalized_email, birthdate),
    )
    return cur.fetchone()


def _create_patient(
    cur,
    *,
    name: str,
    gender: str,
    normalized_email: str,
    birthdate: str,
    phone: str | None,
):
    for _ in range(10):
        patient_code = _generate_patient_code()
        try:
            # Create a new patient profile when this identity has not been seen before.
            cur.execute(
                """
                INSERT INTO patients (patient_code, name, gender, email, birthdate, phone)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, patient_code
                """,
                (patient_code, name, gender, normalized_email, birthdate, phone),
            )
            return cur.fetchone()
        except UniqueViolation:
            existing_patient = _find_patient_by_identity(
                cur,
                normalized_email=normalized_email,
                birthdate=birthdate,
            )
            if existing_patient is not None:
                return existing_patient
            continue

    raise RuntimeError("could not generate a unique patient code")


def _build_vnpay_hash_data(params: dict[str, str]) -> str:
    sorted_items = sorted(params.items())
    return "&".join(f"{key}={quote_plus(str(value))}" for key, value in sorted_items)


def _build_sha512_hex(value: str) -> str:
    return sha512(value.encode("utf-8")).hexdigest()


def _build_change_link(*, booking_id: str, patient_id: str) -> str:
    return f"{BOOKING_PUBLIC_BASE_URL}/booking/change?booking_id={booking_id}&patient_id={patient_id}"


def _build_confirmation_link(*, booking_id: str, token: str) -> str:
    return f"{BOOKING_PUBLIC_BASE_URL}/api/booking/confirm?booking_id={booking_id}&token={token}"


def _send_email(*, recipient_email: str, subject: str, body: str) -> None:
    if not recipient_email:
        raise ValueError("recipient_email is required")
    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD or not SMTP_FROM_EMAIL:
        raise BookingPaymentConfigError(
            "SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM_EMAIL."
        )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = recipient_email
    message.set_content(body)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as smtp:
        if SMTP_USE_TLS:
            smtp.starttls()
        smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(message)


def send_booking_confirmation_email(
    *,
    recipient_email: str,
    recipient_name: str | None,
    reservation_code: str | int,
    booking_id: str,
    slot_start_at: datetime | None = None,
    slot_end_at: datetime | None = None,
    patient_id: str
) -> None:
    """Send a basic confirmation email after a booking has been confirmed."""
    subject = f"Xác nhận lịch hẹn #{reservation_code}"
    greeting_name = recipient_name or "Quý Khách"
    slot_line = ""
    if slot_start_at is not None:
        slot_line = (
            f"Thời gian: {slot_start_at.astimezone(timezone(timedelta(hours=7))).strftime('%H:%M')} - " \
            f"{slot_end_at.astimezone(timezone(timedelta(hours=7))).strftime('%H:%M')}" \
            f" ngày {slot_start_at.astimezone(timezone(timedelta(hours=7))).strftime('%d/%m/%Y')}"
        )

    body = (
        f"Xin chào {greeting_name}, \n \n" \
        "Cảm ơn bạn đã sử dụng dịch vụ của Phòng khám Cơ Xương Khớp BS. Chế Đình Nghĩa. \n" \
        "Chúng tôi xác nhận lịch hẹn của bạn như sau:\n \n" \
        f"Mã đặt chỗ: {reservation_code}\n" \
        f"{slot_line} \n \n" \
        f"Cuộc gọi trực tuyến: #TODO chèn link online call\n\n" \
        f"Để tiết kiệm thời gian và giúp bác sỹ nắm được tổng quan tình trạng của bạn, hãy vui lòng bỏ chút thời gian để hoàn thành bước đăng ký với trợ lý của chúng tôi: \n" \
        f" #TODO: Chèn link tới trợ lý \n \n" \
        f"Nếu cần thay đổi thông tin liên lạc hoặc hủy lịch hẹn, vui lòng click vào link dưới đây: \n" \
        f" {_build_change_link(booking_id=booking_id, patient_id=patient_id)}\n \n" \
        "Nếu bạn cần hỗ trợ, vui lòng phản hồi email này.\n\n"
        "Trân trọng,\n"
        f"{SMTP_FROM_NAME}"
    )

    _send_email(recipient_email=recipient_email, subject=subject, body=body)


def send_booking_confirmation_request_email(
    *,
    recipient_email: str,
    recipient_name: str | None,
    reservation_code: str | int,
    booking_id: str,
    confirmation_token: str,
    slot_start_at: datetime | None = None,
    slot_end_at: datetime | None = None,
) -> None:
    subject = f"Xác nhận đặt chỗ #{reservation_code}"
    greeting_name = recipient_name or "Quý Khách"
    slot_line = ""
    if slot_start_at is not None:
        slot_line = (
            f"Thời gian: {slot_start_at.astimezone(timezone(timedelta(hours=7))).strftime('%H:%M')} - " \
            f"{slot_end_at.astimezone(timezone(timedelta(hours=7))).strftime('%H:%M')}" \
            f" ngày {slot_start_at.astimezone(timezone(timedelta(hours=7))).strftime('%d/%m/%Y')}"
        )

    body = (
        f"Xin chào {greeting_name}, \n \n" \
        "Cảm ơn bạn đã sử dụng dịch vụ của Phòng khám Cơ Xương Khớp BS. Chế Đình Nghĩa. \n" \
        "Chúng tôi đã giữ chỗ lịch hẹn của bạn như sau:\n \n" \
        f"Mã đặt chỗ: {reservation_code}\n" \
        f"{slot_line} \n \n" \
        "Vui lòng click vào link dưới đây để xác nhận lịch hẹn của bạn: \n" \
        f" {_build_confirmation_link(booking_id=booking_id, token=confirmation_token)}\n \n" \
        "Nếu bạn không xác nhận kịp thời, lịch giữ chỗ có thể hết hạn.\n\n"
        "Trân trọng,\n"
        f"{SMTP_FROM_NAME}"
    )

    _send_email(recipient_email=recipient_email, subject=subject, body=body)


"""Return all distinct slot dates from tomorrow onward that this session may claim."""
def db_get_available_dates(session_id: str | None = None) -> list[str]:
    # List future dates that still have at least one slot this session can claim.
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

    # Return claimable slots for one calendar day, while preserving visibility
    # of this session's own pending hold.
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
        raise ValueError("Slot id is required")
    if not session_id:
        raise ValueError("Bạn cần bật cookies trình duyệt để lưu session")

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=16)

    for _ in range(10):
        reservation_code = randint(100000000, 999999999)
        try:
            with DB_POOL.connection() as conn:
                with conn.transaction():
                    with conn.cursor() as cur:
                        # Lock the target slot row so competing claims serialize cleanly.
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

                        # Check whether the selected slot is already held or confirmed.
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

                        # Load this session's current pending booking so we can reuse or move it.
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

    # Load one booking only if it still belongs to the current browser session.
    query = """
        SELECT b.id, b.reservation_code, b.status, b.slot_id, b.expires_at, s.start_at, s.end_at,
               p.patient_code, p.name, p.email, p.phone, p.birthdate, p.gender
        FROM bookings b
        JOIN slots s ON s.id = b.slot_id
        LEFT JOIN patients p ON p.id = b.patient_id
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
        "patientCode": row[7],
        "patientName": row[8],
        "patientEmail": row[9],
        "patientPhone": row[10],
        "patientBirthdate": row[11].isoformat() if row[11] else None,
        "patientGender": row[12],
    }


"""Return one booking when both booking_id and patient_id from the emailed change link match."""
def db_get_booking_for_change_link(*, booking_id: str, patient_id: str) -> dict[str, str | int]:
    if not booking_id:
        raise ValueError("booking_id is required")
    if not patient_id:
        raise ValueError("patient_id is required")

    # Resolve a booking from the identifiers embedded in the emailed change link.
    query = """
        SELECT b.id, b.reservation_code, b.status, b.slot_id, b.expires_at, b.confirmed_at,
               s.start_at, s.end_at, p.id, p.patient_code, p.name, p.email, p.phone, p.birthdate, p.gender
        FROM bookings b
        JOIN slots s ON s.id = b.slot_id
        JOIN patients p ON p.id = b.patient_id
        WHERE b.id = %s
          AND p.id = %s
        LIMIT 1
    """

    with DB_POOL.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (booking_id, patient_id))
            row = cur.fetchone()

    if row is None:
        raise BookingChangeAccessError("booking not found")

    return {
        "id": str(row[0]),
        "reservationCode": row[1],
        "status": row[2],
        "slotId": str(row[3]),
        "expiresAt": row[4].isoformat(),
        "confirmedAt": row[5].isoformat() if row[5] else None,
        "startAt": row[6].isoformat(),
        "endAt": row[7].isoformat(),
        "patientId": str(row[8]),
        "patientCode": row[9],
        "patientName": row[10],
        "patientEmail": row[11],
        "patientPhone": row[12],
        "patientBirthdate": row[13].isoformat() if row[13] else None,
        "patientGender": row[14],
    }


"""Cancel the current session's active pending booking, if one exists."""
def db_cancel_pending_booking_for_session(*, session_id: str) -> None:
    if not session_id:
        raise ValueError("session_id is required")

    # Cancel the latest pending booking still owned by this browser session.
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


"""Update patient contact details through the emailed change link."""
def db_update_booking_contact_for_change_link(
    *,
    booking_id: str,
    patient_id: str,
    name: str,
    email: str,
    phone: str | None,
    birthdate: str,
    gender: str,
) -> dict[str, str | int]:
    if not booking_id:
        raise ValueError("booking_id is required")
    if not patient_id:
        raise ValueError("patient_id is required")
    if not name:
        raise ValueError("name is required")
    if not email:
        raise ValueError("email is required")
    if not birthdate:
        raise ValueError("birthdate is required")
    if not gender:
        raise ValueError("gender is required")

    normalized_email = _normalize_email(email)

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Lock the booking and linked patient row that the emailed link is allowed to edit.
                cur.execute(
                    """
                    SELECT b.id, b.status, p.id
                    FROM bookings b
                    JOIN patients p ON p.id = b.patient_id
                    WHERE b.id = %s
                      AND p.id = %s
                    FOR UPDATE OF b, p
                    LIMIT 1
                    """,
                    (booking_id, patient_id),
                )
                booking_row = cur.fetchone()

                if booking_row is None:
                    raise BookingChangeAccessError("Không thể tìm thấy lịch hẹn này.")

                # Reuse an existing patient row if the edited identity now matches another patient.
                matched_patient = _find_patient_by_identity(
                    cur,
                    normalized_email=normalized_email,
                    birthdate=birthdate,
                )
                target_patient_id = patient_id

                if matched_patient is not None and str(matched_patient[0]) != str(patient_id):
                    target_patient_id = matched_patient[0]
                    cur.execute(
                        """
                        UPDATE bookings
                        SET patient_id = %s
                        WHERE id = %s
                        """,
                        (target_patient_id, booking_id),
                    )

                # Persist the latest contact details onto the resolved patient row.
                cur.execute(
                    """
                    UPDATE patients
                    SET name = %s,
                        gender = %s,
                        email = %s,
                        birthdate = %s,
                        phone = %s
                    WHERE id = %s
                    """,
                    (name, gender, normalized_email, birthdate, phone, target_patient_id),
                )

    return db_get_booking_for_change_link(booking_id=booking_id, patient_id=str(target_patient_id))


"""Delete one booking through the emailed change link without deleting the patient record."""
def db_delete_booking_for_change_link(*, booking_id: str, patient_id: str) -> None:
    if not booking_id:
        raise ValueError("booking_id is required")
    if not patient_id:
        raise ValueError("patient_id is required")

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Delete only the booking that matches the emailed booking/patient pair.
                cur.execute(
                    """
                    DELETE FROM bookings b
                    USING patients p
                    WHERE b.patient_id = p.id
                      AND b.id = %s
                      AND p.id = %s
                    RETURNING b.id
                    """,
                    (booking_id, patient_id),
                )
                deleted_row = cur.fetchone()

                if deleted_row is None:
                    raise BookingChangeAccessError("Không thể tìm thấy lịch hẹn này")


"""Persist patient details on the current session-owned booking row."""
def db_proceed_to_payment_for_session(
    *,
    session_id: str,
    name: str,
    email: str,
    phone: str | None,
    birthdate: str,
    gender: str,
) -> dict[str, str | int]:
    if not session_id:
        raise ValueError("session_id is required")
    if not name:
        raise ValueError("name is required")
    if not email:
        raise ValueError("email is required")
    if not birthdate:
        raise ValueError("birthdate is required")
    if not gender:
        raise ValueError("gender is required")

    normalized_email = _normalize_email(email)
    now_utc = datetime.now(timezone.utc)
    payment_expires_at = now_utc + timedelta(minutes=16)

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Load and lock the current session-owned pending booking that is moving
                # from anonymous session ownership to patient-linked ownership.
                cur.execute(
                    """
                    SELECT id, slot_id, patient_id, status, expires_at
                    FROM bookings
                    WHERE session_id = %s
                      AND status = 'pending'
                    ORDER BY created_at DESC
                    FOR UPDATE
                    LIMIT 1
                    """,
                    (session_id,),
                )
                booking_row = cur.fetchone()

                if booking_row is None:
                    raise BookingAccessError("booking not found")

                booking_id = booking_row[0]
                patient_id = booking_row[2]
                booking_status = booking_row[3]
                expires_at = booking_row[4]

                if booking_status != "pending":
                    raise BookingAccessError("booking is no longer pending")

                if expires_at <= now_utc:
                    cur.execute(
                        """
                        UPDATE bookings
                        SET status = 'expired'
                        WHERE id = %s
                        """,
                        (booking_id,),
                    )
                    raise BookingExpiredError("Bạn cĐã có người khác nhanh tay hơn đặt lịch hẹn này, bạn thử lại nhé!")

                matched_patient = _find_patient_by_identity(
                    cur,
                    normalized_email=normalized_email,
                    birthdate=birthdate,
                )

                canonical_patient_id = matched_patient[0] if matched_patient is not None else patient_id

                if canonical_patient_id is not None:
                    # Inspect active bookings for this patient identity to enforce the
                    # "at most one confirmed booking" rule.
                    cur.execute(
                        """
                        SELECT id, status
                        FROM bookings
                        WHERE patient_id = %s
                          AND status IN ('pending', 'confirmed')
                        ORDER BY created_at DESC
                        FOR UPDATE
                        """,
                        (canonical_patient_id,),
                    )
                    identity_bookings = cur.fetchall()
                else:
                    identity_bookings = []

                confirmed_booking = next((row for row in identity_bookings if row[1] == "confirmed"), None)
                if confirmed_booking is not None and str(confirmed_booking[0]) != str(booking_id):
                    raise BookingEmailConflictError("Bạn đã có một lịch hẹn được xác nhận. Vui lòng kiểm tra email và hủy nếu muốn thay đổi lịch hẹn.")

                if canonical_patient_id is None:
                    created_patient = _create_patient(
                        cur,
                        name=name,
                        gender=gender,
                        normalized_email=normalized_email,
                        birthdate=birthdate,
                        phone=phone,
                    )
                    canonical_patient_id = created_patient[0]
                else:
                    # Refresh the matched patient's contact details with the latest form submission.
                    cur.execute(
                        """
                        UPDATE patients
                        SET name = %s,
                            gender = %s,
                            email = %s,
                            birthdate = %s,
                            phone = %s
                        WHERE id = %s
                        """,
                        (name, gender, normalized_email, birthdate, phone, canonical_patient_id),
                    )

                # Keep the current booking row and only resolve its patient relationship.
                cur.execute(
                    """
                    UPDATE bookings
                    SET patient_id = %s,
                        session_id = %s,
                        expires_at = %s
                    WHERE id = %s
                    RETURNING id, reservation_code, status, slot_id, expires_at
                    """,
                    (canonical_patient_id, session_id, payment_expires_at, booking_id),
                )
                updated_booking = cur.fetchone()

                if canonical_patient_id is not None:
                    # Cancel any older pending bookings for the same patient so the latest
                    # active session-owned booking wins.
                    cur.execute(
                        """
                        UPDATE bookings
                        SET status = 'cancelled'
                        WHERE patient_id = %s
                          AND status = 'pending'
                          AND id <> %s
                        """,
                        (canonical_patient_id, booking_id),
                    )

    return {
        "id": str(updated_booking[0]),
        "reservationCode": updated_booking[1],
        "status": updated_booking[2],
        "slotId": str(updated_booking[3]),
        "expiresAt": updated_booking[4].isoformat(),
        "displayExpiresAt": (updated_booking[4] - timedelta(minutes=1)).isoformat(),
    }


def db_send_booking_confirmation_for_session(*, session_id: str, booking_id: str) -> dict[str, str | int | bool]:
    if not session_id:
        raise ValueError("session_id is required")
    if not booking_id:
        raise ValueError("booking_id is required")

    confirmation_token = token_urlsafe(32)
    confirmation_hash = _build_sha512_hex(confirmation_token)
    now_utc = datetime.now(timezone.utc)
    confirmation_expires_at = now_utc + timedelta(minutes=BOOKING_CONFIRMATION_WINDOW_MINUTES)

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Load the session-owned booking that is requesting the no-payment confirmation email.
                cur.execute(
                    """
                    SELECT b.id, b.status, b.expires_at, b.reservation_code, p.email, p.name, p.id, s.start_at, s.end_at
                    FROM bookings b
                    JOIN slots s ON s.id = b.slot_id
                    LEFT JOIN patients p ON p.id = b.patient_id
                    WHERE b.id = %s
                      AND b.session_id = %s
                    FOR UPDATE OF b
                    LIMIT 1
                    """,
                    (booking_id, session_id),
                )
                booking_row = cur.fetchone()

                if booking_row is None:
                    raise BookingAccessError("booking not found")

                booking_status = booking_row[1]
                expires_at = booking_row[2]
                recipient_email = booking_row[4]
                recipient_name = booking_row[5]

                if booking_status != "pending":
                    raise BookingAccessError("booking is no longer pending")
                if expires_at <= now_utc:
                    cur.execute(
                        """
                        UPDATE bookings
                        SET status = 'expired'
                        WHERE id = %s
                        """,
                        (booking_id,),
                    )
                    raise BookingExpiredError("Bạn cĐã có người khác nhanh tay hơn đặt lịch hẹn này, bạn thử lại nhé!")
                if not recipient_email:
                    raise ValueError("booking is missing patient email")

                # Store a one-time confirmation hash and extend the window for the email click.
                cur.execute(
                    """
                    UPDATE bookings
                    SET confirmation_hash = %s,
                        expires_at = %s
                    WHERE id = %s
                    """,
                    (confirmation_hash, confirmation_expires_at, booking_id),
                )

                email_payload = {
                    "recipientEmail": recipient_email,
                    "recipientName": recipient_name or "",
                    "reservationCode": str(booking_row[3]),
                    "bookingId": str(booking_row[0]),
                    "patientId": str(booking_row[6]),
                    "slotStartAt": booking_row[7].isoformat(),
                    "slotEndAt": booking_row[8].isoformat(),
                    "confirmationToken": confirmation_token,
                }

    send_booking_confirmation_request_email(
        recipient_email=email_payload["recipientEmail"],
        recipient_name=email_payload["recipientName"],
        reservation_code=email_payload["reservationCode"],
        booking_id=email_payload["bookingId"],
        confirmation_token=email_payload["confirmationToken"],
        slot_start_at=datetime.fromisoformat(email_payload["slotStartAt"]),
        slot_end_at=datetime.fromisoformat(email_payload["slotEndAt"]),
    )

    return {
        "ok": True,
        "bookingId": email_payload["bookingId"],
        "reservationCode": email_payload["reservationCode"],
        "emailSent": True,
        "expiresAt": confirmation_expires_at.isoformat(),
    }


"""Create a signed VNPay redirect URL for the given booking owned by this session."""
def db_create_vnpay_payment_url(*, booking_id: str, session_id: str, client_ip: str) -> str:
    if not booking_id:
        raise ValueError("booking_id is required")
    if not session_id:
        raise ValueError("session_id is required")
    if not VNPAY_TMN_CODE or not VNPAY_HASH_SECRET or not VNPAY_RETURN_URL:
        raise BookingPaymentConfigError("VNPay configuration is incomplete. Please set VNPAY_TMN_CODE, VNPAY_HASH_SECRET, and VNPAY_RETURN_URL.")

    now_gmt7 = datetime.now(timezone(timedelta(hours=7)))

    # Load one payable booking while ensuring it still belongs to the current session.
    query = """
        SELECT b.id, b.status, b.expires_at, b.reservation_code, p.name
        FROM bookings b
        LEFT JOIN patients p ON p.id = b.patient_id
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

    booking_status = row[1]
    expires_at = row[2]
    reservation_code = row[3]
    patient_name = row[4] or "Dat lich tu van online"

    if booking_status != "pending":
        raise BookingAccessError("booking is no longer pending")
    if expires_at <= datetime.now(timezone.utc):
        raise BookingExpiredError("booking has expired")

    amount_vnd = 50000
    vnp_txn_ref = reservation_code

    params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": VNPAY_TMN_CODE,
        "vnp_Amount": str(int(amount_vnd * 100)),
        "vnp_CreateDate": now_gmt7.strftime("%Y%m%d%H%M%S"),
        "vnp_CurrCode": "VND",
        "vnp_IpAddr": client_ip or "127.0.0.1",
        "vnp_Locale": "vn",
        "vnp_OrderInfo": f"Thanh toan lich hen {reservation_code} {patient_name}",
        "vnp_OrderType": "other",
        "vnp_ReturnUrl": VNPAY_RETURN_URL,
        "vnp_TxnRef": vnp_txn_ref,
        "vnp_ExpireDate": expires_at.astimezone(timezone(timedelta(hours=7))).strftime("%Y%m%d%H%M%S"),
    }

    hash_data = _build_vnpay_hash_data(params)
    secure_hash = hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        hash_data.encode("utf-8"),
        sha512,
    ).hexdigest()

    query_string = f"{hash_data}&vnp_SecureHash={secure_hash}"

    return f"{VNPAY_PAYMENT_URL}?{query_string}"


def db_confirm_booking_from_email_link(*, booking_id: str, confirmation_token: str) -> dict[str, str | bool | None]:
    if not booking_id:
        raise ValueError("booking_id is required")
    if not confirmation_token:
        raise ValueError("token is required")

    confirmation_hash = _build_sha512_hex(confirmation_token)
    confirmation_email_payload = None

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                # Lock the booking referenced by the emailed token before validating and confirming it.
                cur.execute(
                    """
                    SELECT b.id, b.status, b.expires_at, b.confirmed_at, b.reservation_code, b.confirmation_hash,
                           p.email, p.name, p.id, s.start_at, s.end_at
                    FROM bookings b
                    JOIN slots s ON s.id = b.slot_id
                    LEFT JOIN patients p ON p.id = b.patient_id
                    WHERE b.id = %s
                    FOR UPDATE OF b
                    LIMIT 1
                    """,
                    (booking_id,),
                )
                booking_row = cur.fetchone()

                if booking_row is None:
                    raise BookingConfirmationAccessError("booking not found")

                booking_status = booking_row[1]
                expires_at = booking_row[2]
                confirmed_at = booking_row[3]
                stored_confirmation_hash = booking_row[5]

                if stored_confirmation_hash != confirmation_hash:
                    raise BookingConfirmationAccessError("invalid confirmation link")

                if booking_status == "confirmed":
                    return {
                        "ok": True,
                        "bookingId": str(booking_row[0]),
                        "reservationCode": str(booking_row[4]),
                        "confirmed": True,
                        "confirmedAt": confirmed_at.isoformat() if confirmed_at else None,
                        "confirmationEmailSent": False,
                    }

                if booking_status != "pending":
                    raise BookingConfirmationAccessError("booking is no longer pending")
                if expires_at <= datetime.now(timezone.utc):
                    cur.execute(
                        """
                        UPDATE bookings
                        SET status = 'expired'
                        WHERE id = %s
                        """,
                        (booking_id,),
                    )
                    raise BookingExpiredError("Bạn cĐã có người khác nhanh tay hơn đặt lịch hẹn này, bạn thử lại nhé!")

                # Flip the booking into the confirmed state once the emailed token is accepted.
                cur.execute(
                    """
                    UPDATE bookings
                    SET status = 'confirmed',
                        confirmed_at = now(),
                        confirmation_hash = NULL
                    WHERE id = %s
                    RETURNING confirmed_at
                    """,
                    (booking_id,),
                )
                confirmed_at = cur.fetchone()[0]

                if booking_row[6]:
                    confirmation_email_payload = {
                        "recipientEmail": booking_row[6],
                        "recipientName": booking_row[7] or "",
                        "reservationCode": str(booking_row[4]),
                        "bookingId": str(booking_row[0]),
                        "patientId": str(booking_row[8]),
                        "slotStartAt": booking_row[9].isoformat(),
                        "slotEndAt": booking_row[10].isoformat(),
                    }

    confirmation_email_sent = False
    if confirmation_email_payload:
        send_booking_confirmation_email(
            recipient_email=confirmation_email_payload["recipientEmail"],
            recipient_name=confirmation_email_payload["recipientName"],
            reservation_code=confirmation_email_payload["reservationCode"],
            booking_id=confirmation_email_payload["bookingId"],
            patient_id=confirmation_email_payload["patientId"],
            slot_start_at=datetime.fromisoformat(confirmation_email_payload["slotStartAt"]),
            slot_end_at=datetime.fromisoformat(confirmation_email_payload["slotEndAt"]),
        )
        confirmation_email_sent = True

    return {
        "ok": True,
        "bookingId": str(booking_id),
        "reservationCode": confirmation_email_payload["reservationCode"] if confirmation_email_payload else None,
        "confirmed": True,
        "confirmedAt": confirmed_at.isoformat() if confirmed_at else None,
        "confirmationEmailSent": confirmation_email_sent,
    }


"""Verify VNPay callback parameters and optionally confirm the booking for IPN requests."""
def db_process_vnpay_callback(
    callback_params: dict[str, str],
    *,
    allow_confirmation: bool = False,
) -> dict[str, str | bool | int | dict[str, str]]:
    print(f"VNP Callback: {str(callback_params)}")
    if not VNPAY_HASH_SECRET:
        raise BookingPaymentConfigError("VNPay configuration is incomplete. Please set VNPAY_HASH_SECRET.")

    if not callback_params:
        raise BookingPaymentVerificationError("missing VNPay callback parameters")

    secure_hash = callback_params.get("vnp_SecureHash")
    txn_ref = callback_params.get("vnp_TxnRef")
    response_code = callback_params.get("vnp_ResponseCode")
    transaction_status = callback_params.get("vnp_TransactionStatus")
    amount_raw = callback_params.get("vnp_Amount")

    if not secure_hash or not txn_ref or not response_code or not amount_raw:
        raise BookingPaymentVerificationError("missing required VNPay callback fields")

    params_to_verify = {
        key: value
        for key, value in callback_params.items()
        if key.startswith("vnp_") and key not in {"vnp_SecureHash", "vnp_SecureHashType"}
    }
    hash_data = _build_vnpay_hash_data(params_to_verify)
    expected_hash = hmac.new(
        VNPAY_HASH_SECRET.encode("utf-8"),
        hash_data.encode("utf-8"),
        sha512,
    ).hexdigest()

    if expected_hash.lower() != secure_hash.lower():
        raise BookingPaymentVerificationError("Lỗi xác nhận: không đúng chữ ký.")

    try:
        amount_vnd = int(amount_raw) // 100
    except ValueError as exc:
        raise BookingPaymentVerificationError("Số tiền chuyển khoản không đúng") from exc

    successful_payment = response_code == "00" and (transaction_status in (None, "", "00"))
    print(
        "[vnpay-callback] parsed callback "
        f"txn_ref={txn_ref!r} response_code={response_code!r} "
        f"transaction_status={transaction_status!r} amount_vnd={amount_vnd!r} "
        f"successful_payment={successful_payment!r} allow_confirmation={allow_confirmation!r}"
    )

    confirmation_email_payload = None

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                print(f"[vnpay-callback] looking up booking for reservation_code={txn_ref!r}")
                # Lock the booking behind this VNPay reservation code before reconciling payment.
                cur.execute(
                    """
                    SELECT b.id, b.status, b.confirmed_at, p.email, p.name, p.id, s.start_at, s.end_at
                    FROM bookings b
                    LEFT JOIN patients p ON p.id = b.patient_id
                    JOIN slots s ON s.id = b.slot_id
                    WHERE b.reservation_code = %s
                    LIMIT 1
                    FOR UPDATE OF b

                    """,
                    (txn_ref,),
                )
                booking_row = cur.fetchone()

                if booking_row is None:
                    print(f"[vnpay-callback] no booking found for reservation_code={txn_ref!r}")
                    raise BookingPaymentVerificationError("Không tìm thấy thanh toán cho mã đặt chỗ này.")

                booking_id = booking_row[0]
                booking_status = booking_row[1]
                patient_email = booking_row[3]
                patient_name = booking_row[4]
                patient_id = booking_row[5]
                slot_start_at = booking_row[6]
                slot_end_at = booking_row[7]
                confirmation_email_sent = False
                print(
                    "[vnpay-callback] booking row loaded "
                    f"booking_id={booking_id!r} status={booking_status!r} "
                    f"patient_email={patient_email!r} patient_name={patient_name!r} "
                    f"slot_start_at={slot_start_at!r} slot_end_at={slot_end_at!r}"
                )

                if amount_vnd != 50000:
                    print(
                        "[vnpay-callback] amount mismatch "
                        f"reservation_code={txn_ref!r} expected=50000 actual={amount_vnd!r}"
                    )
                    raise BookingPaymentVerificationError("unexpected VNPay amount")

                booking_confirmed = booking_status == "confirmed"

                if successful_payment and booking_status != "confirmed" and allow_confirmation:
                    print(f"[vnpay-callback] confirming booking_id={booking_id!r}")
                    # Confirm the booking only on the authoritative VNPay callback path.
                    cur.execute(
                        """
                        UPDATE bookings
                        SET status = 'confirmed',
                            confirmed_at = now()
                        WHERE id = %s
                        RETURNING confirmed_at
                        """,
                        (booking_id,),
                    )
                    confirmed_at = cur.fetchone()[0]
                    booking_confirmed = True
                    print(
                        "[vnpay-callback] booking confirmed "
                        f"booking_id={booking_id!r} confirmed_at={confirmed_at!r}"
                    )
                    if patient_email:
                        confirmation_email_payload = {
                            "recipientEmail": patient_email,
                            "recipientName": patient_name or "",
                            "reservationCode": str(txn_ref),
                            "bookingId": str(booking_id),
                            "patientId": str(patient_id),
                            "slotStartAt": slot_start_at.isoformat(),
                            "slotEndAt": slot_end_at.isoformat(),
                        }
                        print(
                            "[vnpay-callback] prepared confirmation email payload "
                            f"payload={confirmation_email_payload!r}"
                        )
                    else:
                        print(
                            "[vnpay-callback] booking confirmed but patient email missing; "
                            f"booking_id={booking_id!r}"
                        )
                else:
                    confirmed_at = booking_row[2]
                    print(
                        "[vnpay-callback] booking not updated during callback "
                        f"booking_id={booking_id!r} successful_payment={successful_payment!r} "
                        f"existing_status={booking_status!r} confirmed_at={confirmed_at!r} "
                        f"allow_confirmation={allow_confirmation!r}"
                    )

    print(f"Successfully processed booking for {txn_ref}")
    result = {
        "ok": successful_payment,
        "bookingId": str(booking_id),
        "reservationCode": txn_ref,
        "responseCode": response_code,
        "transactionStatus": transaction_status or "",
        "confirmed": booking_confirmed,
        "paymentVerified": successful_payment,
        "confirmedAt": confirmed_at.isoformat() if confirmed_at else None,
        "confirmationEmailSent": confirmation_email_sent,
        "confirmationEmail": confirmation_email_payload,
    }
    print(f"result: {str(result)}")
    return result


"""Mark expired pending bookings so they stop blocking slot availability."""
def db_expire_pending_bookings() -> int:
    # Expire pending bookings whose hold or email-confirmation window has elapsed.
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
