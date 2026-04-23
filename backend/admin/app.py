from flask import Flask, jsonify, request
from flask_cors import CORS

from _booking import (
    AdminSlotConflictError,
    AdminSlotNotFoundError,
    db_delete_slot,
    db_get_slot,
    db_get_slots,
    db_insert_slot,
    db_update_slot,
)


app = Flask(__name__)
CORS(app)


@app.route("/api/get_slots", methods=["POST"])
def get_slots():
    data = request.get_json() or {}

    try:
        slots = db_get_slots(start=data.get("start"), end=data.get("end"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(slots)


@app.route("/api/slots/<slot_id>", methods=["GET"])
def get_slot(slot_id: str):
    try:
        slot = db_get_slot(slot_id=slot_id)
    except AdminSlotNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"slot": slot})


@app.route("/api/slots", methods=["POST"])
def create_slot():
    data = request.get_json() or {}

    try:
        slot = db_insert_slot(start=data.get("start"), end=data.get("end"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"slot": slot}), 201


@app.route("/api/slots/<slot_id>", methods=["PATCH"])
def update_slot(slot_id: str):
    data = request.get_json() or {}

    try:
        slot = db_update_slot(slot_id=slot_id, start=data.get("start"), end=data.get("end"))
    except AdminSlotConflictError as exc:
        return jsonify({"error": str(exc)}), 409
    except AdminSlotNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"slot": slot})


@app.route("/api/slots/<slot_id>", methods=["DELETE"])
def delete_slot(slot_id: str):
    try:
        db_delete_slot(slot_id=slot_id)
    except AdminSlotConflictError as exc:
        return jsonify({"error": str(exc)}), 409
    except AdminSlotNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(port=5002)
