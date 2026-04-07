from flask import Flask, request, jsonify
from flask_cors import CORS
from _booking import *
import threading
import time

app = Flask(__name__)
CORS(app, supports_credentials=True)

BOOKING_SESSION_COOKIE = "booking_session_id"
BOOKING_SESSION_MAX_AGE = 60 * 60 * 24 * 30
EXPIRY_SWEEP_INTERVAL_SECONDS = 60


@app.route("/api/session", methods=["GET"])
# Ensure the browser has an anonymous booking session cookie.
def ensure_session():
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
# Return the available slots for one selected calendar day.
def get_available_slots():
    data = request.get_json()
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    try:
        slots = db_get_available_slots(data, session_id=session_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(slots)


@app.route("/api/get_available_dates", methods=["GET"])
# Return all currently available booking dates.
def get_available_dates():
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    dates = db_get_available_dates(session_id=session_id)
    return jsonify(dates)


@app.route("/api/claim_booking", methods=["POST"])
def claim_booking():
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


@app.route("/api/booking/cancel", methods=["POST"])
def cancel_booking():
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    try:
        db_cancel_pending_booking_for_session(session_id=session_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"ok": True})


@app.route("/api/booking/proceed_to_payment", methods=["POST"])
def proceed_to_payment():
    session_id = request.cookies.get(BOOKING_SESSION_COOKIE)
    if not session_id:
        return jsonify({"error": "missing booking session"}), 400

    data = request.get_json() or {}

    try:
        booking = db_proceed_to_payment_for_session(
            session_id=session_id,
            name=data.get("name", "").strip(),
            email=data.get("email", "").strip(),
            phone=(data.get("phone") or "").strip() or None,
            birthdate=data.get("birthdate", "").strip(),
            gender=data.get("gender", "").strip(),
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


@app.route("/api/payment/vnpay", methods=["POST"])
def create_vnpay_payment():
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


def run_expiry_sweeper():
    while True:
        try:
            db_expire_pending_bookings()
        finally:
            time.sleep(EXPIRY_SWEEP_INTERVAL_SECONDS)


if __name__=="__main__":
    expiry_thread = threading.Thread(target=run_expiry_sweeper, daemon=True)
    expiry_thread.start()
    app.run(port=5001)
