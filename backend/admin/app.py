from flask import Flask, jsonify, request
from flask_cors import CORS

from _blog import (
    AdminBlogNotFoundError,
    db_create_blog_post,
    db_delete_blog_post,
    db_get_blog_lookup_data,
    db_get_blog_post,
    db_get_blog_posts_page,
    db_update_blog_post,
)
from _booking import (
    AdminSlotConflictError,
    AdminSlotNotFoundError,
    db_delete_slot,
    db_get_slot,
    db_get_slots,
    db_insert_slot,
    db_update_slot,
)
from _patient import db_get_patient, db_get_patient_bookings, db_get_patients_page, db_search_patients, db_update_patient_notes


app = Flask(__name__)
CORS(app)


@app.route("/api/blog/lookup", methods=["GET"])
def get_blog_lookup():
    return jsonify(db_get_blog_lookup_data())


@app.route("/api/blog/posts", methods=["GET"])
def get_blog_posts():
    try:
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("pageSize", 10))
    except ValueError:
        return jsonify({"error": "page and pageSize must be integers"}), 400

    return jsonify(
        db_get_blog_posts_page(
            page=page,
            page_size=page_size,
            search_text=request.args.get("searchText", ""),
            filter_text=request.args.get("filterText", ""),
        )
    )


@app.route("/api/blog/posts", methods=["POST"])
def create_blog_post():
    try:
        post = db_create_blog_post()
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"post": post}), 201


@app.route("/api/blog/posts/<post_id>", methods=["GET"])
def get_blog_post(post_id: str):
    try:
        post = db_get_blog_post(post_id=post_id)
    except AdminBlogNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"post": post})


@app.route("/api/blog/posts/<post_id>", methods=["PATCH"])
def update_blog_post(post_id: str):
    data = request.get_json() or {}

    try:
        result = db_update_blog_post(post_id=post_id, payload=data)
    except AdminBlogNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(result)


@app.route("/api/blog/posts/<post_id>", methods=["DELETE"])
def delete_blog_post(post_id: str):
    try:
        db_delete_blog_post(post_id=post_id)
    except AdminBlogNotFoundError as exc:
        return jsonify({"error": str(exc)}), 404
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"ok": True})


@app.route("/api/get_slots", methods=["POST"])
def get_slots():
    data = request.get_json() or {}

    try:
        slots = db_get_slots(start=data.get("start"), end=data.get("end"))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(slots)


@app.route("/api/patients", methods=["GET"])
def get_patients():
    try:
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("pageSize", 50))
    except ValueError:
        return jsonify({"error": "page and pageSize must be integers"}), 400

    sort_by = request.args.get("sortBy", "registration_date")
    sort_order = request.args.get("sortOrder", "desc")

    try:
        return jsonify(
            db_get_patients_page(
                page=page,
                page_size=page_size,
                sort_by=sort_by,
                sort_order=sort_order,
            )
        )
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.route("/api/patients/search", methods=["GET"])
def search_patients():
    query = request.args.get("q", "")

    try:
        limit = int(request.args.get("limit", 50))
    except ValueError:
        return jsonify({"error": "limit must be an integer"}), 400

    try:
        patients = db_search_patients(query=query, limit=limit)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"patients": patients})


@app.route("/api/patients/<patient_id>", methods=["GET"])
def get_patient(patient_id: str):
    try:
        patient = db_get_patient(patient_id=patient_id)
    except ValueError as exc:
        message = str(exc)
        if message == "patient not found":
            return jsonify({"error": message}), 404
        return jsonify({"error": message}), 400

    return jsonify({"patient": patient})


@app.route("/api/patients/<patient_id>", methods=["PATCH"])
def update_patient(patient_id: str):
    data = request.get_json() or {}
    notes = data.get("notes", "")

    if not isinstance(notes, str):
        return jsonify({"error": "notes must be a string"}), 400

    try:
        patient = db_update_patient_notes(patient_id=patient_id, notes=notes)
    except ValueError as exc:
        message = str(exc)
        if message == "patient not found":
            return jsonify({"error": message}), 404
        return jsonify({"error": message}), 400

    return jsonify({"patient": patient})


@app.route("/api/patients/<patient_id>/bookings", methods=["GET"])
def get_patient_bookings(patient_id: str):
    try:
        bookings = db_get_patient_bookings(patient_id=patient_id)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"bookings": bookings})


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
