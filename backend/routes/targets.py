"""
Vulnerable Target Endpoints
Simulated vulnerable application endpoints for training purposes only.
All attacks happen within this sandbox — no real vulnerabilities are exploited.
"""

import re
from flask import Blueprint, request, jsonify

targets_bp = Blueprint("targets", __name__)


def _detect_sqli(payload):
    """Check if payload contains SQL injection patterns."""
    patterns = [
        r"('|\"|;)",
        r"(or\s+1\s*=\s*1)",
        r"(union\s+select)",
        r"-{2,}",
        r"(drop|delete|insert|update)\s+",
        r"(or\s+'1'\s*=\s*'1')",
    ]
    for p in patterns:
        if re.search(p, payload, re.IGNORECASE):
            return True
    return False


def _detect_xss(payload):
    """Check if payload contains XSS patterns."""
    patterns = [
        r"<script",
        r"javascript:",
        r"on(load|click|error|mouseover)\s*=",
        r"<iframe",
        r"alert\s*\(",
        r"document\.cookie",
    ]
    for p in patterns:
        if re.search(p, payload, re.IGNORECASE):
            return True
    return False


def _detect_cmdinj(payload):
    """Check for command injection patterns."""
    patterns = [r"(;|\||&&|\$\(|`)", r"(ls|cat|whoami|id|rm|nc)"]
    for p in patterns:
        if re.search(p, payload, re.IGNORECASE):
            return True
    return False


@targets_bp.route("/api/target/login", methods=["POST"])
def target_login():
    """Simulated SQL injection vulnerable login endpoint."""
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")

    combined = f"{username} {password}"

    if _detect_sqli(combined):
        return jsonify({
            "status": "VULNERABILITY_TRIGGERED",
            "message": "⚠️ SQL Injection detected! Authentication bypass simulated.",
            "simulated_query": f"SELECT * FROM users WHERE username='{username}' AND password='{password}'",
            "result": "Login successful as admin (SQL logic bypassed)",
            "user": {"id": 1, "username": "admin", "role": "superadmin"},
            "vulnerable": True,
        }), 200

    if username == "admin" and password == "admin":
        return jsonify({
            "status": "SUCCESS",
            "message": "Login successful (weak credentials)",
            "user": {"id": 1, "username": "admin", "role": "admin"},
            "vulnerable": False,
        }), 200

    return jsonify({
        "status": "FAILED",
        "message": "Invalid username or password.",
        "vulnerable": False,
    }), 401


@targets_bp.route("/api/target/comment", methods=["POST"])
def target_comment():
    """Simulated XSS-vulnerable comment submission endpoint."""
    data = request.get_json() or {}
    comment = data.get("comment", "")
    author = data.get("author", "Anonymous")

    if _detect_xss(comment):
        return jsonify({
            "status": "VULNERABILITY_TRIGGERED",
            "message": "⚠️ XSS payload detected! Script would execute in victim browsers.",
            "stored_comment": comment,
            "attack_effect": "All users viewing this comment would execute the injected script.",
            "stolen_data": "document.cookie = 'session_id=abc123xyz; auth_token=eyJhbG...'",
            "vulnerable": True,
        }), 200

    return jsonify({
        "status": "SUCCESS",
        "message": "Comment posted successfully.",
        "comment": {"author": author, "content": comment, "id": "cmt_001"},
        "vulnerable": False,
    }), 201


@targets_bp.route("/api/target/admin", methods=["POST"])
def target_admin():
    """Simulated brute force vulnerable admin login."""
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")

    common_creds = {
        "admin": ["admin", "password", "123456", "admin123", "qwerty", "letmein"],
        "root": ["root", "toor", "password", "123456"],
        "administrator": ["administrator", "password", "admin"],
    }

    if username in common_creds and password in common_creds[username]:
        return jsonify({
            "status": "VULNERABILITY_TRIGGERED",
            "message": "⚠️ Brute Force Success! Weak credentials accepted.",
            "user": username,
            "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SIMULATED",
            "access_level": "FULL_ADMIN",
            "vulnerable": True,
        }), 200

    return jsonify({
        "status": "FAILED",
        "message": "Access denied. Invalid credentials.",
        "attempt_logged": True,
        "vulnerable": False,
    }), 401


@targets_bp.route("/api/target/search", methods=["GET"])
def target_search():
    """Simulated SQL injection vulnerable search box."""
    query = request.args.get("q", "")

    if _detect_sqli(query):
        return jsonify({
            "status": "VULNERABILITY_TRIGGERED",
            "message": "⚠️ SQL Injection in search! Database contents exposed.",
            "simulated_query": f"SELECT * FROM products WHERE name LIKE '%{query}%'",
            "leaked_data": [
                {"id": 1, "username": "admin", "password_hash": "5f4dcc3b5aa765d61d8327deb882cf99"},
                {"id": 2, "username": "john.doe", "password_hash": "e10adc3949ba59abbe56e057f20f883e"},
                {"id": 3, "username": "jane.doe", "password_hash": "25f9e794323b453885f5181f1b624d0b"},
            ],
            "vulnerable": True,
        }), 200

    if _detect_cmdinj(query):
        return jsonify({
            "status": "VULNERABILITY_TRIGGERED",
            "message": "⚠️ Command Injection in search! OS command executed.",
            "output": "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin",
            "vulnerable": True,
        }), 200

    # Normal search result
    return jsonify({
        "status": "SUCCESS",
        "query": query,
        "results": [
            {"id": 1, "name": f"Product matching '{query}'", "category": "Security"},
        ],
        "vulnerable": False,
    }), 200
