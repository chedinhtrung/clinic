from flask import Flask, request, jsonify
from flask_cors import CORS
from _booking import *

app = Flask(__name__)
CORS(app, supports_credentials=True)

BOOKING_SESSION_COOKIE = "booking_session_id"
BOOKING_SESSION_MAX_AGE = 60 * 60 * 24 * 30


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
    try:
        slots = db_get_available_slots(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(slots)

@app.route("/api/get_available_dates", methods=["GET"])
# Return all currently available booking dates.
def get_available_dates():
    dates = db_get_available_dates()
    return jsonify(dates)


if __name__=="__main__":
    app.run(port=5001)
