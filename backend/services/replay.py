"""
Attack Replay Engine
Simulates replaying captured attacks against vulnerable target endpoints.
"""

import random
import time
import re


# Simulated vulnerable response logic
def _simulate_sqli_response(payload, attempt):
    """Simulate SQL injection outcome."""
    payload_lower = payload.lower()
    # Strong bypass patterns succeed
    if re.search(r"(or\s+1\s*=\s*1|or\s+'1'='1|union.*select|--|admin'--)", payload_lower):
        if attempt < 3:
            return {
                "status": "SUCCESS",
                "response": "Authentication bypassed. Login successful as admin.",
                "http_code": 200,
                "vulnerable": True,
            }
        else:
            # Simulate WAF blocking on later attempts
            return {
                "status": "BLOCKED",
                "response": "WAF detected and blocked the request.",
                "http_code": 403,
                "vulnerable": False,
            }
    return {
        "status": "FAILED",
        "response": "Query returned no results.",
        "http_code": 200,
        "vulnerable": False,
    }


def _simulate_xss_response(payload, attempt):
    """Simulate XSS outcome."""
    if re.search(r"(<script|onerror|onload|javascript:|alert\()", payload, re.IGNORECASE):
        if attempt == 1:
            return {
                "status": "SUCCESS",
                "response": f"Script executed: {payload[:50]}...",
                "http_code": 200,
                "vulnerable": True,
            }
        elif attempt == 2:
            return {
                "status": "SUCCESS",
                "response": "Cookie captured: session_id=abc123xyz",
                "http_code": 200,
                "vulnerable": True,
            }
        else:
            return {
                "status": "BLOCKED",
                "response": "Content Security Policy (CSP) blocked script execution.",
                "http_code": 204,
                "vulnerable": False,
            }
    return {
        "status": "FAILED",
        "response": "Input sanitized, no script executed.",
        "http_code": 200,
        "vulnerable": False,
    }


def _simulate_brute_force_response(payload, attempt):
    """Simulate brute force outcome."""
    common_creds = ["admin", "password", "123456", "admin123", "root", "qwerty"]
    if any(c in payload.lower() for c in common_creds) and attempt <= 2:
        return {
            "status": "SUCCESS",
            "response": "Credentials matched. Access granted.",
            "http_code": 200,
            "vulnerable": True,
        }
    elif attempt >= 3:
        return {
            "status": "BLOCKED",
            "response": "Account locked. Too many failed attempts.",
            "http_code": 429,
            "vulnerable": False,
        }
    return {
        "status": "FAILED",
        "response": "Invalid credentials.",
        "http_code": 401,
        "vulnerable": False,
    }


def _simulate_cmdinj_response(payload, attempt):
    """Simulate command injection outcome."""
    if re.search(r"(;|\||&&|\$\(|`)", payload):
        if attempt == 1:
            return {
                "status": "SUCCESS",
                "response": "root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33",
                "http_code": 200,
                "vulnerable": True,
            }
        elif attempt == 2:
            return {
                "status": "SUCCESS",
                "response": "uid=0(root) gid=0(root) groups=0(root)",
                "http_code": 200,
                "vulnerable": True,
            }
        else:
            return {
                "status": "BLOCKED",
                "response": "Security filter detected shell metacharacters.",
                "http_code": 403,
                "vulnerable": False,
            }
    return {
        "status": "FAILED",
        "response": "Command not recognized.",
        "http_code": 400,
        "vulnerable": False,
    }


REPLAY_HANDLERS = {
    "SQL Injection": _simulate_sqli_response,
    "Cross-Site Scripting (XSS)": _simulate_xss_response,
    "Brute Force Login": _simulate_brute_force_response,
    "Command Injection": _simulate_cmdinj_response,
}


def replay_attack(attack_type, payload, target_endpoint, replay_count=3):
    """
    Replay an attack N times and collect results.
    Returns list of replay attempt results.
    """
    handler = REPLAY_HANDLERS.get(attack_type, _simulate_sqli_response)
    results = []

    for i in range(1, replay_count + 1):
        # Small simulated delay
        time.sleep(0.1)
        result = handler(payload, i)
        results.append({
            "attempt": i,
            "status": result["status"],
            "response": result["response"],
            "http_code": result["http_code"],
            "vulnerable": result["vulnerable"],
            "target": target_endpoint,
        })

    success_count = sum(1 for r in results if r["status"] == "SUCCESS")
    blocked_count = sum(1 for r in results if r["status"] == "BLOCKED")

    return {
        "total_replays": replay_count,
        "successes": success_count,
        "blocked": blocked_count,
        "failed": replay_count - success_count - blocked_count,
        "attempts": results,
        "conclusion": (
            "VULNERABLE — target is susceptible to this attack type."
            if success_count > 0
            else "MITIGATED — target defenses blocked the attack."
        ),
    }
