from flask import Flask, request, jsonify
from flask_cors import CORS

from chatbot import *

app = Flask(__name__)
CORS(app)

chatbot = ChatBot(openai_key=OPENAI_KEY)

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()

    user_message = data.get("message", "")

    reply = chatbot.chat(user_message)["content"]

    print(user_message)
    print(reply)

    return jsonify({
        "reply": reply
    })

if __name__ == "__main__":
    app.run(debug=True)