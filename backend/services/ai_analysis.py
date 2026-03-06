"""
AI Threat Analysis Engine
Rule-based analysis of attack payloads with severity scoring and mitigation suggestions.
"""

import re

# Attack signature patterns
SQLI_PATTERNS = [
    r"('\s*(or|and)\s*'?\d)",
    r"(--|#|/\*)",
    r"(union\s+select)",
    r"(drop\s+table)",
    r"(insert\s+into)",
    r"(select\s+.*\s+from)",
    r"(1\s*=\s*1)",
    r"(sleep\s*\()",
    r"(benchmark\s*\()",
    r"(xp_cmdshell)",
    r"('|\"|;|\\)",
]

XSS_PATTERNS = [
    r"<script.*?>",
    r"javascript:",
    r"on(load|click|mouseover|error|focus|blur)\s*=",
    r"<iframe",
    r"<img.*?onerror",
    r"alert\s*\(",
    r"document\.(cookie|write|location)",
    r"eval\s*\(",
    r"<svg.*?onload",
]

CMDINJ_PATTERNS = [
    r"(;|\||&&|\$\(|`)",
    r"(ls|dir|cat|type|echo|whoami|id|pwd)",
    r"(/etc/passwd|/etc/shadow|/bin/sh|/bin/bash)",
    r"(rm\s+-rf|del\s+/f)",
    r"(wget|curl|nc|netcat)",
    r"(chmod|chown|sudo)",
    r"(>\s*/dev/null|2>&1)",
]

BRUTE_PATTERNS = [
    r"(admin|root|administrator|superuser)",
    r"(password|pass|pwd|12345|qwerty|letmein)",
    r"(test|demo|guest|user)",
]

MITIGATION_MAP = {
    "SQL Injection": {
        "mitigation": (
            "1. Use parameterized queries / prepared statements.\n"
            "2. Implement strict input validation and whitelisting.\n"
            "3. Apply least-privilege database accounts.\n"
            "4. Use a Web Application Firewall (WAF).\n"
            "5. Enable query logging and anomaly detection."
        ),
        "description": "SQL Injection manipulates database queries by injecting malicious SQL syntax, potentially bypassing authentication, leaking data, or destroying databases.",
    },
    "Cross-Site Scripting (XSS)": {
        "mitigation": (
            "1. Encode all user-supplied output (HTML entity encoding).\n"
            "2. Implement Content Security Policy (CSP) headers.\n"
            "3. Use HttpOnly and Secure flags on cookies.\n"
            "4. Validate and sanitize all input server-side.\n"
            "5. Use modern frameworks that auto-escape output."
        ),
        "description": "XSS injects malicious scripts into web pages viewed by other users, allowing session hijacking, credential theft, or malware distribution.",
    },
    "Brute Force Login": {
        "mitigation": (
            "1. Implement account lockout after N failed attempts.\n"
            "2. Add CAPTCHA / rate limiting on login endpoints.\n"
            "3. Enforce multi-factor authentication (MFA).\n"
            "4. Use password hashing with bcrypt/Argon2.\n"
            "5. Monitor and alert on repeated login failures."
        ),
        "description": "Brute force attacks systematically try all possible password combinations to gain unauthorized access to accounts.",
    },
    "Command Injection": {
        "mitigation": (
            "1. Never pass user input directly to shell commands.\n"
            "2. Use language-native APIs instead of shell execution.\n"
            "3. Implement strict input validation with allowlists.\n"
            "4. Run application with minimal OS privileges.\n"
            "5. Use sandboxing and containerization."
        ),
        "description": "Command injection allows attackers to execute arbitrary OS commands on the server, potentially gaining full system control.",
    },
}

STEP_BY_STEP = {
    "SQL Injection": [
        "🔍 Attacker identifies a login/search form that passes input to SQL database",
        "💉 Injects SQL syntax like `' OR 1=1 --` to manipulate the query logic",
        "🔓 Authentication is bypassed or sensitive data is extracted",
        "📦 Attacker may chain with UNION SELECT to dump entire tables",
        "🚨 If unsanitized, system is fully compromised",
    ],
    "Cross-Site Scripting (XSS)": [
        "🔍 Attacker finds a form or URL parameter that reflects user input",
        "💉 Injects `<script>alert(document.cookie)</script>` or similar payload",
        "🌐 Victim browser executes the injected script",
        "🍪 Session tokens, cookies, or credentials are stolen",
        "📤 Data is exfiltrated to attacker-controlled server",
    ],
    "Brute Force Login": [
        "🔍 Attacker identifies a login endpoint with no rate limiting",
        "🤖 Automated tool cycles through common username/password combos",
        "⚡ Thousands of requests sent per minute",
        "🔓 Weak or common credentials are eventually matched",
        "🚪 Attacker gains unauthorized access to account",
    ],
    "Command Injection": [
        "🔍 Attacker identifies input field passed to OS command (ping, ls, etc.)",
        "💉 Appends shell operators like `; whoami` or `| cat /etc/passwd`",
        "⚙️ Server executes injected command with application privileges",
        "📁 Sensitive files, user lists, or config data are exposed",
        "🔒 Escalation possible to full remote code execution (RCE)",
    ],
}


def calculate_severity(attack_type, payload):
    """Calculate severity score based on attack type and payload complexity."""
    payload_lower = payload.lower()
    score = 0

    if attack_type == "SQL Injection":
        for pattern in SQLI_PATTERNS:
            if re.search(pattern, payload_lower, re.IGNORECASE):
                score += 2
        if re.search(r"(drop|delete|truncate)", payload_lower, re.IGNORECASE):
            score += 5  # Destructive query
        if re.search(r"(union.*select)", payload_lower, re.IGNORECASE):
            score += 4  # Data extraction

    elif attack_type == "Cross-Site Scripting (XSS)":
        for pattern in XSS_PATTERNS:
            if re.search(pattern, payload_lower, re.IGNORECASE):
                score += 2
        if "document.cookie" in payload_lower:
            score += 4
        if "eval(" in payload_lower:
            score += 3

    elif attack_type == "Command Injection":
        for pattern in CMDINJ_PATTERNS:
            if re.search(pattern, payload_lower, re.IGNORECASE):
                score += 3
        if re.search(r"(rm\s+-rf|format)", payload_lower, re.IGNORECASE):
            score += 8  # Extremely destructive

    elif attack_type == "Brute Force Login":
        score = 6  # Always medium-high

    if score >= 12:
        return "CRITICAL", score
    elif score >= 7:
        return "HIGH", score
    elif score >= 4:
        return "MEDIUM", score
    else:
        return "LOW", max(score, 2)


def analyze_attack(attack_type, payload):
    """
    Main AI analysis function.
    Returns structured threat analysis for a given attack.
    """
    severity_label, severity_score = calculate_severity(attack_type, payload)

    info = MITIGATION_MAP.get(
        attack_type,
        {
            "mitigation": "Apply defense-in-depth principles and review security configurations.",
            "description": "Unknown attack type detected. Review logs and apply general hardening.",
        },
    )

    steps = STEP_BY_STEP.get(attack_type, ["Attack steps unavailable."])

    # Detect specific payload characteristics
    patterns_found = []
    payload_lower = payload.lower()

    if "'" in payload or '"' in payload:
        patterns_found.append("Quote injection character detected")
    if re.search(r"(union|select|drop|insert|delete)", payload_lower):
        patterns_found.append("SQL keyword detected")
    if re.search(r"<script|onerror|onload", payload_lower):
        patterns_found.append("Script tag or event handler detected")
    if re.search(r"(;|\||&&)", payload):
        patterns_found.append("Shell metacharacter detected")
    if re.search(r"(admin|root|password|12345)", payload_lower):
        patterns_found.append("Common credentials or keyword detected")

    explanation = (
        f"{info['description']} "
        f"This payload exhibits characteristics consistent with a {attack_type} attack. "
    )
    if patterns_found:
        explanation += "Detected indicators: " + "; ".join(patterns_found) + "."

    return {
        "attack_type": attack_type,
        "severity": severity_label,
        "severity_score": severity_score,
        "explanation": explanation,
        "mitigation": info["mitigation"],
        "step_by_step": steps,
        "patterns_detected": patterns_found,
    }
