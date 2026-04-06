from flask import Flask, request, jsonify
from flask_cors import CORS
from _booking import *

app = Flask(__name__)
CORS(app)

@app.route("/api/get_available_slots", methods=["POST"])
def get_available_slots():
    data = request.get_json()
    try:
        slots = db_get_available_slots(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(slots)

@app.route("/api/get_available_dates", methods=["GET"])
def get_available_dates():
    dates = db_get_available_dates()
    return jsonify(dates)


if __name__=="__main__":
    app.run(port=5001)
