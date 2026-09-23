"""CyberArena Vercel API.

A serverless-safe REST API for the CyberArena training simulator.
The application is intentionally simulation-only: it detects and models
payloads instead of executing them against real systems.
"""
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from flask import Flask, jsonify, request
from flask_cors import CORS

# Reuse the existing simulation/analysis modules.
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from services.ai_analysis import analyze_attack  # noqa: E402
from services.replay import replay_attack  # noqa: E402
from user_agents import parse as parse_ua  # noqa: E402

app = Flask(__name__)
CORS(app)

_store_lock = Lock()
_memory_attacks = []
_mongo = None
_mongo_collection = None


def _get_mongo_collection():
    """Use MongoDB when MONGO_URI is configured; otherwise use memory."""
    global _mongo, _mongo_collection
    uri = os.getenv("MONGO_URI")
    if not uri:
        return None
    if _mongo_collection is not None:
        return _mongo_collection
    try:
        from pymongo import MongoClient
        _mongo = MongoClient(uri, serverSelectionTimeoutMS=2500)
        _mongo.admin.command("ping")
        db_name = os.getenv("DB_NAME", "cyberarena")
        _mongo_collection = _mongo[db_name]["attacks"]
        return _mongo_collection
    except Exception:
        _mongo = None
        _mongo_collection = None
        return None


def _insert(doc):
    collection = _get_mongo_collection()
    if collection is not None:
        result = collection.insert_one(dict(doc))
        doc = dict(doc)
        doc["_id"] = str(result.inserted_id)
        return doc
    with _store_lock:
        saved = dict(doc)
        saved["_id"] = saved["attack_id"]
        _memory_attacks.append(saved)
        return dict(saved)


def _all_attacks():
    collection = _get_mongo_collection()
    if collection is not None:
        return list(collection.find().sort("timestamp", -1).limit(500))
    with _store_lock:
        return sorted(
            [dict(x) for x in _memory_attacks],
            key=lambda x: x.get("timestamp", ""),
            reverse=True,
        )


def _find_attack(attack_id):
    collection = _get_mongo_collection()
    if collection is not None:
        return collection.find_one({"attack_id": attack_id})
    with _store_lock:
        for attack in _memory_attacks:
            if attack.get("attack_id") == attack_id:
                return dict(attack)
    return None


def _update_replay(attack_id, replay):
    collection = _get_mongo_collection()
    if collection is not None:
        collection.update_one(
            {"attack_id": attack_id},
            {"$set": {"replay_results": replay}},
        )
        return
    with _store_lock:
        for attack in _memory_attacks:
            if attack.get("attack_id") == attack_id:
                attack["replay_results"] = replay
                return


def _serialize(doc):
    if not doc:
        return None
    result = dict(doc)
    result["_id"] = str(result.get("_id", result.get("attack_id", "")))
    return result


def _attacker_intel(req):
    # On Vercel this is normally the edge/proxy address, so do not pretend it
    # is necessarily the visitor's direct public IP.
    forwarded = req.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (req.remote_addr or "unknown")
    ua_string = req.headers.get("User-Agent", "")
    ua = parse_ua(ua_string)
    return {
        "ip": ip,
        "country": "Unknown / Edge Proxy",
        "country_code": "??",
        "city": "Unknown",
        "isp": "Vercel / Edge",
        "region": "Unknown",
        "lat": 0,
        "lon": 0,
        "browser": f"{ua.browser.family} {ua.browser.version_string}".strip(),
        "operating_system": f"{ua.os.family} {ua.os.version_string}".strip(),
        "device": ua.device.family,
        "user_agent": ua_string,
        "is_mobile": ua.is_mobile,
    }


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "CyberArena API",
        "version": "2.0.0-vercel",
        "storage": "mongodb" if _get_mongo_collection() is not None else "memory",
    })


@app.post("/api/attacks/launch")
def launch_attack():
    data = request.get_json(silent=True) or {}
    attack_type = data.get("attack_type", "SQL Injection")
    payload = str(data.get("payload", ""))
    target_endpoint = data.get("target_endpoint", "/api/target/login")

    if not payload.strip():
        return jsonify({"error": "Payload is required"}), 400

    intel = _attacker_intel(request)
    analysis = analyze_attack(attack_type, payload)
    replay = replay_attack(attack_type, payload, target_endpoint, replay_count=3)

    doc = {
        "attack_id": str(uuid.uuid4()),
        "attack_type": attack_type,
        "payload": payload,
        "target_endpoint": target_endpoint,
        "attacker_ip": intel["ip"],
        "attacker_location": {
            "country": intel["country"],
            "country_code": intel["country_code"],
            "city": intel["city"],
            "isp": intel["isp"],
            "region": intel["region"],
            "lat": intel["lat"],
            "lon": intel["lon"],
        },
        "browser": intel["browser"],
        "operating_system": intel["operating_system"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_analysis": analysis,
        "replay_results": replay,
        "severity": analysis["severity"],
    }

    saved = _insert(doc)

    # This event is consumed by the frontend polling/event shim.
    alert = {
        "attack_id": saved["attack_id"],
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

    return jsonify({
        "success": True,
        "attack_id": saved["attack_id"],
        "ai_analysis": analysis,
        "replay_results": replay,
        "attacker_intel": intel,
        "alert": alert,
    }), 201


@app.get("/api/attacks")
def get_attacks():
    try:
        limit = max(1, min(int(request.args.get("limit", 100)), 500))
        page = max(1, int(request.args.get("page", 1)))
    except ValueError:
        limit, page = 100, 1
    attacks = _all_attacks()
    start = (page - 1) * limit
    return jsonify({
        "attacks": [_serialize(a) for a in attacks[start:start + limit]],
        "total": len(attacks),
        "page": page,
        "limit": limit,
    })


@app.get("/api/attacks/<attack_id>")
def get_attack(attack_id):
    attack = _find_attack(attack_id)
    if not attack:
        return jsonify({"error": "Attack not found"}), 404
    return jsonify(_serialize(attack))


@app.post("/api/attacks/<attack_id>/replay")
def replay_existing_attack(attack_id):
    attack = _find_attack(attack_id)
    if not attack:
        return jsonify({"error": "Attack not found"}), 404
    replay = replay_attack(
        attack["attack_type"],
        attack["payload"],
        attack["target_endpoint"],
    )
    _update_replay(attack_id, replay)
    return jsonify({"success": True, "replay_results": replay})


@app.get("/api/stats")
def get_stats():
    attacks = _all_attacks()
    by_type = {}
    by_severity = {}
    today = datetime.now(timezone.utc).date().isoformat()
    today_count = 0

    for attack in attacks:
        attack_type = attack.get("attack_type", "Unknown")
        severity = attack.get("severity", "LOW")
        by_type[attack_type] = by_type.get(attack_type, 0) + 1
        by_severity[severity] = by_severity.get(severity, 0) + 1
        if str(attack.get("timestamp", "")).startswith(today):
            today_count += 1

    return jsonify({
        "total": len(attacks),
        "today": today_count,
        "by_type": by_type,
        "by_severity": by_severity,
        "recent": [_serialize(a) for a in attacks[:7]],
    })


@app.get("/api/logs")
def get_logs():
    return get_attacks()


# ---- Safe simulated vulnerable targets ---------------------------------
# These endpoints are sandbox simulations. They never execute the supplied
# payloads as SQL, JavaScript, shell commands, or real authentication.


def _detect_sqli(payload):
    import re
    patterns = [r"('|\"|;)", r"(or\s+1\s*=\s*1)", r"(union\s+select)", r"-{2,}",
                r"(drop|delete|insert|update)\s+", r"(or\s+'1'\s*=\s*'1')"]
    return any(re.search(p, payload, re.I) for p in patterns)


def _detect_xss(payload):
    import re
    patterns = [r"<script", r"javascript:", r"on(load|click|error|mouseover)\s*=", r"<iframe",
                r"alert\s*\(", r"document\.cookie"]
    return any(re.search(p, payload, re.I) for p in patterns)


def _detect_cmdinj(payload):
    import re
    return bool(re.search(r"(;|\||&&|\$\(|`)", payload) and re.search(r"(ls|cat|whoami|id|rm|nc)", payload, re.I))


@app.post("/api/target/login")
def target_login():
    data = request.get_json(silent=True) or {}
    username, password = data.get("username", ""), data.get("password", "")
    combined = f"{username} {password}"
    if _detect_sqli(combined):
        return jsonify({"status": "VULNERABILITY_TRIGGERED", "message": "SQL Injection detected; authentication bypass simulated.",
                        "simulated_query": f"SELECT * FROM users WHERE username='{username}' AND password='{password}'",
                        "result": "Login successful as admin (simulated)",
                        "user": {"id": 1, "username": "admin", "role": "superadmin"}, "vulnerable": True})
    if username == "admin" and password == "admin":
        return jsonify({"status": "SUCCESS", "message": "Login successful (weak credentials)",
                        "user": {"id": 1, "username": "admin", "role": "admin"}, "vulnerable": False})
    return jsonify({"status": "FAILED", "message": "Invalid username or password.", "vulnerable": False}), 401


@app.post("/api/target/comment")
def target_comment():
    data = request.get_json(silent=True) or {}
    comment, author = data.get("comment", ""), data.get("author", "Anonymous")
    if _detect_xss(comment):
        return jsonify({"status": "VULNERABILITY_TRIGGERED", "message": "XSS payload detected; execution simulated.",
                        "stored_comment": comment, "attack_effect": "Script execution is simulated only.",
                        "vulnerable": True})
    return jsonify({"status": "SUCCESS", "message": "Comment posted successfully.",
                    "comment": {"author": author, "content": comment, "id": "cmt_001"}, "vulnerable": False}), 201


@app.post("/api/target/admin")
def target_admin():
    data = request.get_json(silent=True) or {}
    username, password = data.get("username", ""), data.get("password", "")
    common_creds = {"admin": ["admin", "password", "123456", "admin123", "qwerty", "letmein"],
                    "root": ["root", "toor", "password", "123456"],
                    "administrator": ["administrator", "password", "admin"]}
    if username in common_creds and password in common_creds[username]:
        return jsonify({"status": "VULNERABILITY_TRIGGERED", "message": "Weak credential accepted; brute-force success simulated.",
                        "user": username, "access_level": "FULL_ADMIN", "vulnerable": True})
    return jsonify({"status": "FAILED", "message": "Access denied. Invalid credentials.", "attempt_logged": True, "vulnerable": False}), 401


@app.get("/api/target/search")
def target_search():
    query = request.args.get("q", "")
    if _detect_sqli(query):
        return jsonify({"status": "VULNERABILITY_TRIGGERED", "message": "SQL Injection detected; database exposure simulated.",
                        "simulated_query": f"SELECT * FROM products WHERE name LIKE '%{query}%'",
                        "leaked_data": [{"id": 1, "username": "admin"}, {"id": 2, "username": "john.doe"}],
                        "vulnerable": True})
    if _detect_cmdinj(query):
        return jsonify({"status": "VULNERABILITY_TRIGGERED", "message": "Command injection detected; command execution simulated.",
                        "output": "simulated command output", "vulnerable": True})
    return jsonify({"status": "SUCCESS", "query": query,
                    "results": [{"id": 1, "name": f"Product matching '{query}'", "category": "Security"}],
                    "vulnerable": False})
