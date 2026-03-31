from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)

@app.route("/api/get_slots", methods=["POST"])
def get_available_slots():
    data = request.get_json()
    print(data)
    timestamp = data.get("timestamp")

    #TODO: fetch slots from data.start to data.end and return them

    return jsonify([
        {
            "id": "123",
            "start": datetime(2026,3,31,10,30).isoformat(),
            "end": (datetime(2026,3,31,10,30) + timedelta(hours=1)).isoformat(),
            "status": "free",
            "title": "Lịch hẹn trống"
        },
        {
            "id": "456",
            "start": datetime(2026,3,31,11,30).isoformat(),
            "end": (datetime(2026,3,31,11,30) + timedelta(hours=1)).isoformat(),
            "status": "pending",
            "title": "Chờ thanh toán"
        }, 
        {
            "id": "789",
            "start": datetime(2026,3,31,12,30).isoformat(),
            "end": (datetime(2026,3,31,12,30) + timedelta(hours=1)).isoformat(),
            "status": "confirmed",
            "title": "Nguyễn Văn B"
        }
    ])


if __name__=="__main__":
    app.run(port=5002)
