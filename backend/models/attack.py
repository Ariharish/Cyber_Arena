import uuid
from datetime import datetime, timezone


def create_attack_document(
    attack_type,
    payload,
    target_endpoint,
    attacker_ip,
    attacker_location,
    browser,
    operating_system,
    ai_analysis,
    replay_results,
    severity="MEDIUM",
):
    """Create a new attack document for MongoDB insertion."""
    return {
        "attack_id": str(uuid.uuid4()),
        "attack_type": attack_type,
        "payload": payload,
        "target_endpoint": target_endpoint,
        "attacker_ip": attacker_ip,
        "attacker_location": attacker_location,
        "browser": browser,
        "operating_system": operating_system,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ai_analysis": ai_analysis,
        "replay_results": replay_results,
        "severity": severity,
    }


def serialize_attack(attack):
    """Convert MongoDB document to JSON-serializable dict."""
    if attack is None:
        return None
    attack["_id"] = str(attack["_id"])
    return attack
