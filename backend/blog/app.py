from flask import Flask, jsonify, request
from flask_cors import CORS
from _blog import db_get_categories, db_get_published_posts, db_get_tags, db_healthcheck

app = Flask(__name__)
CORS(app)


# Support both direct local-dev calls (/api/...) and production calls routed
# under the public /blog-api prefix without requiring Nginx path rewriting.
@app.route("/api/health", methods=["GET"])
@app.route("/blog-api/api/health", methods=["GET"])
def healthcheck():
    return jsonify({"ok": db_healthcheck()})


@app.route("/api/posts", methods=["GET"])
@app.route("/blog-api/api/posts", methods=["GET"])
def get_posts():
    category_slug = (request.args.get("category") or "").strip().lower()
    tag_slug = (request.args.get("tag") or "").strip().lower()
    limit = min(max(int(request.args.get("limit", 50)), 1), 100)
    posts = db_get_published_posts(
        category_slug=category_slug or None,
        tag_slug=tag_slug or None,
        limit=limit,
    )
    return jsonify({"posts": posts})


@app.route("/api/categories", methods=["GET"])
@app.route("/blog-api/api/categories", methods=["GET"])
def get_categories():
    return jsonify({"categories": db_get_categories()})


@app.route("/api/tags", methods=["GET"])
@app.route("/blog-api/api/tags", methods=["GET"])
def get_tags():
    return jsonify({"tags": db_get_tags()})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
