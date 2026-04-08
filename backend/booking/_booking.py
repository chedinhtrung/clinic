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


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _build_vnpay_hash_data(params: dict[str, str]) -> str:
    sorted_items = sorted(params.items())
    return "&".join(f"{key}={quote_plus(str(value))}" for key, value in sorted_items)


def send_booking_confirmation_email(
    *,
    recipient_email: str,
    recipient_name: str | None,
    reservation_code: str | int,
    slot_start_at: datetime | None = None,
    slot_end_at: datetime | None = None
) -> None:
    """Send a basic confirmation email after VNPay confirms the booking."""
    if not recipient_email:
        raise ValueError("recipient_email is required")
    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD or not SMTP_FROM_EMAIL:
        raise BookingPaymentConfigError(
            "SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, and SMTP_FROM_EMAIL."
        )

    subject = f"Xác nhận lịch hẹn #{reservation_code}"
    greeting_name = recipient_name or "Quy khach"
    slot_line = ""
    if slot_start_at is not None:
        slot_line = (
            "\n"
            f"""Lịch hẹn: {slot_start_at.astimezone(timezone(timedelta(hours=7))).strftime('%H:%M')} - 
                        {slot_end_at.astimezone(timezone(timedelta(hours=7))).strftime('%H:%M')}
                        {slot_start_at.astimezone(timezone(timedelta(hours=7))).strftime('%d/%m%Y')}
            """
        )

    body = (
        f"""Xin chào {greeting_name},
        Cảm ơn bạn đã sử dụng dịch vụ của Phòng khám Cơ Xương Khớp Bs. Chế Đình Nghĩa.
        Chúng tôi xác nhận lịch hẹn của bạn như sau:
        """
        f"Mã đặt chỗ: {reservation_code}\n"
        f"{slot_line}"
        "\n"
        "Nếu bạn cần hỗ trợ, vui lòng phản hồi email này.\n\n"
        "Trân trọng,\n"
        f"{SMTP_FROM_NAME}"
    )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    message["To"] = recipient_email
    message.set_content(body)

    print(message)

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as smtp:
        if SMTP_USE_TLS:
            smtp.starttls()
        smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
        smtp.send_message(message)
    
    print(f"Sent email with {SMTP_USERNAME} {SMTP_PASSWORD}")


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
        SELECT b.id, b.reservation_code, b.status, b.slot_id, b.expires_at, s.start_at, s.end_at,
               p.name, p.email, p.phone, p.birthdate, p.gender
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
        "patientName": row[7],
        "patientEmail": row[8],
        "patientPhone": row[9],
        "patientBirthdate": row[10].isoformat() if row[10] else None,
        "patientGender": row[11],
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


"""Persist patient details for the current session's active booking and allow payment to continue."""
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
                slot_id = booking_row[1]
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
                    raise BookingExpiredError("booking has expired")

                cur.execute(
                    """
                    SELECT b.id, b.slot_id, b.patient_id, b.status
                    FROM bookings b
                    JOIN patients p ON p.id = b.patient_id
                    WHERE lower(trim(p.email)) = %s
                      AND b.status IN ('pending', 'confirmed')
                    ORDER BY CASE WHEN b.status = 'confirmed' THEN 0 ELSE 1 END, b.created_at DESC
                    FOR UPDATE
                    """,
                    (normalized_email,),
                )
                email_bookings = cur.fetchall()

                confirmed_booking = next((row for row in email_bookings if row[3] == "confirmed"), None)
                pending_booking = next((row for row in email_bookings if row[3] == "pending"), None)

                if confirmed_booking is not None and str(confirmed_booking[0]) != str(booking_id):
                    raise BookingEmailConflictError("Bạn đã có một lịch hẹn được xác nhận. Vui lòng kiểm tra email và hủy nếu muốn thay đổi lịch hẹn.")

                canonical_booking_id = booking_id
                canonical_patient_id = patient_id

                if pending_booking is not None and str(pending_booking[0]) != str(booking_id):
                    canonical_booking_id = pending_booking[0]
                    canonical_patient_id = pending_booking[2]

                if canonical_patient_id is None:
                    cur.execute(
                        """
                        INSERT INTO patients (name, gender, email, birthdate, phone)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (name, gender, normalized_email, birthdate, phone),
                    )
                    canonical_patient_id = cur.fetchone()[0]
                else:
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

                cur.execute(
                    """
                    UPDATE bookings
                    SET slot_id = %s,
                        session_id = %s,
                        patient_id = %s,
                        expires_at = %s
                    WHERE id = %s
                    RETURNING id, reservation_code, status, slot_id, expires_at
                    """,
                    (slot_id, session_id, canonical_patient_id, payment_expires_at, canonical_booking_id),
                )
                updated_booking = cur.fetchone()

                if str(canonical_booking_id) != str(booking_id):
                    cur.execute(
                        """
                        UPDATE bookings
                        SET status = 'cancelled'
                        WHERE id = %s
                        """,
                        (booking_id,),
                    )

    return {
        "id": str(updated_booking[0]),
        "reservationCode": updated_booking[1],
        "status": updated_booking[2],
        "slotId": str(updated_booking[3]),
        "expiresAt": updated_booking[4].isoformat(),
        "displayExpiresAt": (updated_booking[4] - timedelta(minutes=1)).isoformat(),
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


"""Verify VNPay callback parameters and confirm the corresponding booking when payment succeeds."""
def db_process_vnpay_callback(callback_params: dict[str, str]) -> dict[str, str | bool | int | dict[str, str]]:
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
        raise BookingPaymentVerificationError("invalid VNPay signature")

    try:
        amount_vnd = int(amount_raw) // 100
    except ValueError as exc:
        raise BookingPaymentVerificationError("invalid VNPay amount") from exc

    successful_payment = response_code == "00" and (transaction_status in (None, "", "00"))

    confirmation_email_payload = None

    with DB_POOL.connection() as conn:
        with conn.transaction():
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT b.id, b.status, b.confirmed_at, p.email, p.name, s.start_at, s.end_at
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
                    raise BookingPaymentVerificationError("booking not found for VNPay transaction reference")

                booking_id = booking_row[0]
                booking_status = booking_row[1]
                patient_email = booking_row[3]
                patient_name = booking_row[4]
                slot_start_at = booking_row[5]
                slot_end_at = booking_row[6]
                confirmation_email_sent = False

                if amount_vnd != 50000:
                    raise BookingPaymentVerificationError("unexpected VNPay amount")

                if successful_payment and booking_status != "confirmed":
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
                    if patient_email:
                        confirmation_email_payload = {
                            "recipientEmail": patient_email,
                            "recipientName": patient_name or "",
                            "reservationCode": str(txn_ref),
                            "slotStartAt": slot_start_at.isoformat(),
                            "slotEndAt": slot_end_at.isoformat()
                        }
                else:
                    confirmed_at = booking_row[2]

    return {
        "ok": successful_payment,
        "bookingId": str(booking_id),
        "reservationCode": txn_ref,
        "responseCode": response_code,
        "transactionStatus": transaction_status or "",
        "confirmed": successful_payment,
        "confirmedAt": confirmed_at.isoformat() if confirmed_at else None,
        "confirmationEmailSent": confirmation_email_sent,
        "confirmationEmail": confirmation_email_payload,
    }


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
