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
