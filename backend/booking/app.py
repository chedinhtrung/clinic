from flask import Flask, request, jsonify
from flask_cors import CORS
from _booking import *
from datetime import datetime
import os
import threading
import time

app = Flask(__name__)
CORS(app, supports_credentials=True)

BOOKING_SESSION_COOKIE = "booking_session_id"
BOOKING_SESSION_MAX_AGE = 60 * 60 * 24 * 30
EXPIRY_SWEEP_INTERVAL_SECONDS = 60
_expiry_thread_lock = threading.Lock()
_expiry_thread_started = False


@app.route("/api/session", methods=["GET"])
def ensure_session():
    """Ensure the browser has an anonymous booking session cookie.

    This endpoint is called by the frontend when the booking UI first loads.
    If the browser already has `booking_session_id`, the endpoint simply
    acknowledges success. Otherwise it creates a fresh anonymous session id and
    sends it back as an HttpOnly cookie so later booking actions can be tied to
    the same browser session.
    """
    existing_session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    response = jsonify({"ok": True})

    if existing_session_id:
        print(existing_session_id)
        return response

    response.set_cookie(
        BOOKING_SESSION_COOKIE,
        create_booking_session_id(),
        max_age=BOOKING_SESSION_MAX_AGE,
        httponly=True,
        samesite="Lax",
    )
    return response


@app.route("/api/get_available_slots", methods=["POST"])
def get_available_slots():
    """Return all claimable slots for one selected calendar day.

    The frontend sends a raw `YYYY-MM-DD` string in the request body. The
    backend evaluates availability in a session-aware way so that:
    - confirmed slots are hidden from everyone
    - pending slots are hidden from other sessions
    - the current session may still see its own pending slot
    """
    data = request.get_json()
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    try:
        slots = db_get_available_slots(data, session_id=session_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(slots)


@app.route("/api/get_available_dates", methods=["GET"])
def get_available_dates():
    """Return all currently bookable dates for the current session.

    A date is included only if it still contains at least one slot that this
    session may claim under the current booking rules.
    """
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    dates = db_get_available_dates(session_id=session_id)
    return jsonify(dates)


@app.route("/api/claim_booking", methods=["POST"])
def claim_booking():
    """Claim the requested slot for the current anonymous booking session.

    The frontend sends `slotId`. The backend performs the claim atomically:
    it verifies the slot, checks for active ownership, and either creates a new
    pending booking or moves/reuses the current session's existing pending
    booking according to the booking rules.
    """
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    data = request.get_json() or {}
    slot_id = data.get("slotId")

    try:
        booking = db_claim_slot(slot_id=slot_id, session_id=session_id)
    except BookingConflictError as exc:
        return jsonify({"error": str(exc)}), 409
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"booking": booking}), 201


@app.route("/api/booking/<booking_id>", methods=["GET"])
def get_booking(booking_id: str):
    """Load one booking authoritatively for the current session.

    This is the read endpoint used by the booking and payment pages. It only
    returns the booking if the supplied `booking_id` belongs to the current
    browser session, and includes slot timing plus any attached patient details.
    """
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    try:
        booking = db_get_booking(booking_id=booking_id, session_id=session_id)
    except BookingAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"booking": booking})


@app.route("/api/booking/change", methods=["GET"])
def get_booking_for_change_link():
    booking_id = (request.args.get("booking_id") or "").strip()
    patient_id = (request.args.get("patient_id") or "").strip()

    try:
        booking = db_get_booking_for_change_link(booking_id=booking_id, patient_id=patient_id)
    except BookingChangeAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"booking": booking})


@app.route("/api/booking/cancel", methods=["POST"])
def cancel_booking():
    """Cancel the current session's active pending booking.

    This mutation is intentionally session-based rather than URL-id-based so a
    user cannot cancel another booking simply by tampering with a booking id in
    the browser location bar.
    """
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    try:
        db_cancel_pending_booking_for_session(session_id=session_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"ok": True})


@app.route("/api/booking/change", methods=["PATCH"])
def update_booking_for_change_link():
    booking_id = (request.args.get("booking_id") or "").strip()
    patient_id = (request.args.get("patient_id") or "").strip()
    data = request.get_json() or {}

    try:
        booking = db_update_booking_contact_for_change_link(
            booking_id=booking_id,
            patient_id=patient_id,
            name=data.get("name", "").strip(),
            email=data.get("email", "").strip(),
            phone=(data.get("phone") or "").strip(),
            birthdate=data.get("birthdate", "").strip(),
            gender=data.get("gender", "").strip(),
            patient_note=(data.get("message") or "").strip(),
        )
    except BookingEmailConflictError as exc:
        return jsonify({"error": str(exc)}), 409
    except BookingChangeAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"booking": booking})


@app.route("/api/booking/change", methods=["DELETE"])
def delete_booking_for_change_link():
    booking_id = (request.args.get("booking_id") or "").strip()
    patient_id = (request.args.get("patient_id") or "").strip()

    try:
        db_delete_booking_for_change_link(booking_id=booking_id, patient_id=patient_id)
    except BookingChangeAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"ok": True})


@app.route("/api/booking/prepare_booking_confirmation", methods=["POST"])
def prepare_booking_confirmation():
    """Validate the in-progress booking, persist patient details, and continue.

    This endpoint is triggered by the contact form submit action. It verifies
    that the current session still owns a valid pending booking, expires it
    immediately if it has timed out, applies the email-based booking rules,
    creates or updates the patient record, extends the hold for the payment
    stage, and returns the canonical booking that should continue to payment.
    """
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    data = request.get_json() or {}

    try:
        booking = db_prepare_booking_confirmation_for_session(
            session_id=session_id,
            name=data.get("name", "").strip(),
            email=data.get("email", "").strip(),
            phone=(data.get("phone") or "").strip(),
            birthdate=data.get("birthdate", "").strip(),
            gender=data.get("gender", "").strip(),
            patient_note=(data.get("message") or "").strip(),
        )
    except BookingEmailConflictError as exc:
        return jsonify({"error": str(exc)}), 409
    except BookingExpiredError as exc:
        return jsonify({"error": str(exc)}), 410
    except BookingAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"booking": booking})


@app.route("/api/booking/send_confirmation_email", methods=["POST"])
def send_booking_confirmation_email_for_session():
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    data = request.get_json() or {}

    try:
        result = db_send_booking_confirmation_for_session(
            session_id=session_id,
            booking_id=(data.get("bookingId") or "").strip(),
        )
    except BookingExpiredError as exc:
        return jsonify({"error": str(exc)}), 410
    except BookingAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except BookingPaymentConfigError as exc:
        return jsonify({"error": str(exc)}), 500
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"result": result})


@app.route("/api/booking/confirm", methods=["GET"])
def confirm_booking_from_email_link():
    booking_id = (request.args.get("booking_id") or "").strip()
    confirmation_token = (request.args.get("token") or "").strip()

    try:
        result = db_confirm_booking_from_email_link(
            booking_id=booking_id,
            confirmation_token=confirmation_token,
        )
    except BookingConfirmationAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except BookingExpiredError as exc:
        return jsonify({"error": str(exc)}), 410
    except BookingPaymentConfigError as exc:
        return jsonify({"error": str(exc)}), 500
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"result": result})


@app.route("/api/payment/vnpay", methods=["POST"])
def create_vnpay_payment():
    """Create a signed VNPay payment URL for the current booking.

    The frontend sends `bookingId`. The backend verifies that the booking still
    belongs to the current session and is still payable, then signs the VNPay
    request parameters using the merchant secret and returns the final redirect
    URL for the browser to navigate to.
    """
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    data = request.get_json() or {}
    booking_id = data.get("bookingId")
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1").split(",")[0].strip()

    try:
        payment_url = db_create_vnpay_payment_url(
            booking_id=booking_id,
            session_id=session_id,
            client_ip=client_ip,
        )
    except BookingPaymentConfigError as exc:
        return jsonify({"error": str(exc)}), 500
    except BookingExpiredError as exc:
        return jsonify({"error": str(exc)}), 410
    except BookingAccessError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"paymentUrl": payment_url})


@app.route("/api/payment/vnpay/return", methods=["GET"])
def verify_vnpay_return():
    """Verify the browser-facing VNPay return payload.

    VNPay redirects the customer back to the frontend with query parameters.
    The frontend forwards those parameters here so the backend can verify the
    signature and return a trusted payment result for display.
    """
    print(f"[vnpay-return] received return params: {dict(request.args)!r}")
    try:
        result = db_process_vnpay_callback(
            {key: value for key, value in request.args.items()},
            allow_confirmation=False,
        )
    except BookingPaymentVerificationError as exc:
        print(f"[vnpay-return] verification error: {exc}")
        return jsonify({"error": str(exc)}), 400
    except BookingPaymentConfigError as exc:
        print(f"[vnpay-return] config error: {exc}")
        return jsonify({"error": str(exc)}), 500

    print(f"[vnpay-return] verification result: {result!r}")
    return jsonify({"result": result})


@app.route("/api/payment/vnpay/ipn", methods=["GET"])
def handle_vnpay_ipn():
    """Process VNPay's server-to-server payment notification (IPN).

    This is the authoritative callback path for payment reconciliation. The
    backend verifies the VNPay signature, updates the booking to `confirmed`
    when payment succeeds, and returns the response structure VNPay expects.
    The implementation is designed to be idempotent so repeated callbacks are
    safe.
    """
    print(f"[vnpay-ipn] received IPN params: {dict(request.args)!r}")
    try:
        result = db_process_vnpay_callback(
            {key: value for key, value in request.args.items()},
            allow_confirmation=True,
        )
    except BookingPaymentVerificationError as exc:
        print(f"[vnpay-ipn] verification error: {exc}")
        return jsonify({"RspCode": "97", "Message": "Invalid signature"})
    except BookingPaymentConfigError as exc:
        print(f"[vnpay-ipn] config error: {exc}")
        return jsonify({"RspCode": "99", "Message": "Unknown error"})

    email_payload = result.get("confirmationEmail")
    print(f"[vnpay-ipn] callback result: {result!r}")
    if result["confirmed"] and email_payload:
        print(
            "[vnpay-ipn] attempting confirmation email send "
            f"booking_id={result['bookingId']!r} payload={email_payload!r}"
        )
        try:
            send_booking_confirmation_email(
                recipient_email=email_payload["recipientEmail"],
                recipient_name=email_payload["recipientName"],
                reservation_code=email_payload["reservationCode"],
                booking_id=email_payload["bookingId"],
                patient_id=email_payload["patientId"],
                slot_start_at=datetime.fromisoformat(email_payload["slotStartAt"]),
                slot_end_at=datetime.fromisoformat(email_payload["slotEndAt"]),
            )
            result["confirmationEmailSent"] = True
            print(f"[vnpay-ipn] confirmation email sent for booking_id={result['bookingId']!r}")
        except Exception as exc:
            print(f"confirmation email failed for booking {result['bookingId']}: {exc}")
    else:
        print(
            "[vnpay-ipn] confirmation email skipped "
            f"confirmed={result['confirmed']!r} payment_verified={result.get('paymentVerified')!r} "
            f"email_payload_present={bool(email_payload)!r}"
        )

    if result["confirmed"]:
        print(f"[vnpay-ipn] returning Confirm Success for booking_id={result['bookingId']!r}")
        return jsonify({"RspCode": "00", "Message": "Confirm Success"})
    print(f"[vnpay-ipn] returning Payment not successful for booking_id={result['bookingId']!r}")
    return jsonify({"RspCode": "00", "Message": "Payment not successful"})


def run_expiry_sweeper():
    while True:
        try:
            expired_count = db_expire_pending_bookings()
            if expired_count:
                print(f"[expiry-sweeper] expired {expired_count} pending booking(s)")
        except Exception as exc:
            print(f"[expiry-sweeper] sweep failed: {exc}")
        finally:
            time.sleep(EXPIRY_SWEEP_INTERVAL_SECONDS)


def start_expiry_sweeper_once():
    global _expiry_thread_started
    with _expiry_thread_lock:
        if _expiry_thread_started:
            return
        expiry_thread = threading.Thread(
            target=run_expiry_sweeper,
            daemon=True,
            name=f"booking-expiry-sweeper-{os.getpid()}",
        )
        expiry_thread.start()
        _expiry_thread_started = True
        print(f"[expiry-sweeper] started in pid={os.getpid()}")


start_expiry_sweeper_once()


if __name__=="__main__":
    app.run(port=5001)
