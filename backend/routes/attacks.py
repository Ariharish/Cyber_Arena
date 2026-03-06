"""
Attack Routes — REST API for attack launching, logging, and retrieval.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone

from models.attack import create_attack_document, serialize_attack
from services.ai_analysis import analyze_attack
from services.attacker_intel import capture_intel
from services.replay import replay_attack

attacks_bp = Blueprint("attacks", __name__)

# db will be injected from app.py
_db = None
_socketio = None


def init_attacks(db, socketio):
    global _db, _socketio
    _db = db
    _socketio = socketio


@attacks_bp.route("/api/attacks/launch", methods=["POST"])
def launch_attack():
    """Launch a simulated attack — log it, analyze it, replay it, emit socket event."""
    data = request.get_json()

    attack_type = data.get("attack_type", "SQL Injection")
    payload = data.get("payload", "")
    target_endpoint = data.get("target_endpoint", "/api/target/login")

    if not payload:
        return jsonify({"error": "Payload is required"}), 400

    # Capture attacker intel
    intel = capture_intel(request)

    # AI analysis
    analysis = analyze_attack(attack_type, payload)

    # Replay attack
    replay = replay_attack(attack_type, payload, target_endpoint)

    # Build document
    doc = create_attack_document(
        attack_type=attack_type,
        payload=payload,
        target_endpoint=target_endpoint,
        attacker_ip=intel["ip"],
        attacker_location={
            "country": intel["country"],
            "country_code": intel["country_code"],
            "city": intel["city"],
            "isp": intel["isp"],
            "region": intel["region"],
            "lat": intel["lat"],
            "lon": intel["lon"],
        },
        browser=intel["browser"],
        operating_system=intel["operating_system"],
        ai_analysis=analysis,
        replay_results=replay,
        severity=analysis["severity"],
    )

    # Store in MongoDB
    result = _db.attacks.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    # Emit real-time socket event to Blue Team
    event_payload = {
        "attack_id": doc["attack_id"],
        "attack_type": attack_type,
        "payload": payload,
        "severity": analysis["severity"],
        "attacker_ip": intel["ip"],
        "country": intel["country"],
        "city": intel["city"],
        "browser": intel["browser"],
        "operating_system": intel["operating_system"],
        "timestamp": doc["timestamp"],
        "ai_summary": analysis["explanation"][:120] + "...",
        "replay_conclusion": replay["conclusion"],
    }
    _socketio.emit("attack_alert", event_payload)

    return jsonify({
        "success": True,
        "attack_id": doc["attack_id"],
        "ai_analysis": analysis,
        "replay_results": replay,
        "attacker_intel": intel,
    }), 201


@attacks_bp.route("/api/attacks", methods=["GET"])
def get_attacks():
    """Retrieve all attack logs, sorted by timestamp descending."""
    limit = int(request.args.get("limit", 100))
    page = int(request.args.get("page", 1))
    skip = (page - 1) * limit

    attacks = list(
        _db.attacks.find().sort("timestamp", -1).skip(skip).limit(limit)
    )
    serialized = [serialize_attack(a) for a in attacks]
    total = _db.attacks.count_documents({})

    return jsonify({
        "attacks": serialized,
        "total": total,
        "page": page,
        "limit": limit,
    })


@attacks_bp.route("/api/attacks/<attack_id>", methods=["GET"])
def get_attack(attack_id):
    """Get a single attack by attack_id."""
    attack = _db.attacks.find_one({"attack_id": attack_id})
    if not attack:
        return jsonify({"error": "Attack not found"}), 404
    return jsonify(serialize_attack(attack))


@attacks_bp.route("/api/attacks/<attack_id>/replay", methods=["POST"])
def replay_existing_attack(attack_id):
    """Re-run replay on an existing attack."""
    attack = _db.attacks.find_one({"attack_id": attack_id})
    if not attack:
        return jsonify({"error": "Attack not found"}), 404

    replay = replay_attack(
        attack["attack_type"],
        attack["payload"],
        attack["target_endpoint"],
    )

    _db.attacks.update_one(
        {"attack_id": attack_id},
        {"$set": {"replay_results": replay}},
    )

    return jsonify({"success": True, "replay_results": replay})


@attacks_bp.route("/api/stats", methods=["GET"])
def get_stats():
    """Return attack statistics for dashboard widgets."""
    total = _db.attacks.count_documents({})

    # Count by attack type
    pipeline_type = [
        {"$group": {"_id": "$attack_type", "count": {"$sum": 1}}}
    ]
    by_type = {doc["_id"]: doc["count"] for doc in _db.attacks.aggregate(pipeline_type)}

    # Count by severity
    pipeline_sev = [
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}}
    ]
    by_severity = {doc["_id"]: doc["count"] for doc in _db.attacks.aggregate(pipeline_sev)}

    # Today's attacks
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_count = _db.attacks.count_documents({"timestamp": {"$regex": f"^{today}"}})

    # Recent 7 attacks for feed
    recent = list(_db.attacks.find().sort("timestamp", -1).limit(7))
    recent_serialized = [serialize_attack(a) for a in recent]

    return jsonify({
        "total": total,
        "today": today_count,
        "by_type": by_type,
        "by_severity": by_severity,
        "recent": recent_serialized,
    })


@attacks_bp.route("/api/logs", methods=["GET"])
def get_logs():
    """Alias for /api/attacks for compatibility."""
    return get_attacks()
