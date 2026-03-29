from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/get_available_slots", methods=["POST"])
def get_available_slots():
    data = request.get_json()
    print(data)
    return jsonify([
        {"from": "9:00", "to": "10:00"},
        {"from": "10:00", "to": "11:00"},
        {"from": "11:00", "to": "12:00"},
        {"from": "12:00", "to": "13:00"},
        {"from": "13:00", "to": "14:00"},
        {"from": "11:00", "to": "12:00"},
        {"from": "11:00", "to": "12:00"},
        {"from": "11:00", "to": "12:00"}
    ])

@app.route("/api/get_available_dates", methods=["GET"])
def get_available_dates():
    return jsonify([
            "2026-03-26",
            "2026-03-27",
            "2026-03-29",
            "2026-04-01"
        ]
    )


if __name__=="__main__":
    app.run(port=5001)
