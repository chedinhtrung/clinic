from flask import Flask, jsonify, request
from flask_cors import CORS

from chat_service import (
    ChatAccessError,
    ChatConfigError,
    ChatModelError,
    get_chat,
    send_chat_message,
)


app = Flask(__name__)
CORS(app)


@app.route("/api/chat", methods=["GET"])
def load_chat():
    token = (request.args.get("token") or "").strip()

    try:
        chat = get_chat(token=token)
    except ChatConfigError as exc:
        return jsonify({"error": str(exc)}), 500
    except ChatAccessError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"chat": chat})


@app.route("/api/chat", methods=["POST"])
def send_message():
    data = request.get_json() or {}

    try:
        result = send_chat_message(
            token=(data.get("token") or "").strip(),
            message=(data.get("message") or "").strip(),
        )
    except ChatConfigError as exc:
        return jsonify({"error": str(exc)}), 500
    except ChatModelError as exc:
        return jsonify({"error": str(exc)}), 502
    except ChatAccessError as exc:
        return jsonify({"error": str(exc)}), 403
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify({"result": result})


if __name__ == "__main__":
    app.run(port=5003, debug=True)
