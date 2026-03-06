"""
Attacker Intelligence Module
Captures IP metadata, geolocation, browser, and OS information from incoming requests.
"""

import requests
from user_agents import parse as parse_ua


def get_attacker_ip(request):
    """Extract real IP address, handling proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "127.0.0.1"


def get_geo_info(ip):
    """Lookup geolocation data from ip-api.com (free, no API key needed)."""
    # Skip geo lookup for local/private IPs
    if ip in ("127.0.0.1", "::1", "localhost") or ip.startswith("192.168.") or ip.startswith("10."):
        return {
            "country": "Local Network",
            "country_code": "LO",
            "city": "Localhost",
            "isp": "Internal",
            "region": "N/A",
            "lat": 0,
            "lon": 0,
        }

    try:
        resp = requests.get(f"http://ip-api.com/json/{ip}", timeout=3)
        data = resp.json()
        if data.get("status") == "success":
            return {
                "country": data.get("country", "Unknown"),
                "country_code": data.get("countryCode", "??"),
                "city": data.get("city", "Unknown"),
                "isp": data.get("isp", "Unknown"),
                "region": data.get("regionName", "Unknown"),
                "lat": data.get("lat", 0),
                "lon": data.get("lon", 0),
            }
    except Exception:
        pass

    return {
        "country": "Unknown",
        "country_code": "??",
        "city": "Unknown",
        "isp": "Unknown",
        "region": "Unknown",
        "lat": 0,
        "lon": 0,
    }


def get_browser_info(request):
    """Parse user-agent string to extract browser and OS."""
    ua_string = request.headers.get("User-Agent", "")
    ua = parse_ua(ua_string)

    return {
        "browser": f"{ua.browser.family} {ua.browser.version_string}",
        "operating_system": f"{ua.os.family} {ua.os.version_string}",
        "device": ua.device.family,
        "user_agent": ua_string,
        "is_mobile": ua.is_mobile,
        "is_tablet": ua.is_tablet,
        "is_pc": ua.is_pc,
    }


def capture_intel(request):
    """
    Main function to capture all attacker intelligence from a Flask request.
    Returns a structured dict with IP, geo, browser, OS info.
    """
    ip = get_attacker_ip(request)
    geo = get_geo_info(ip)
    browser_info = get_browser_info(request)

    return {
        "ip": ip,
        "country": geo["country"],
        "country_code": geo["country_code"],
        "city": geo["city"],
        "isp": geo["isp"],
        "region": geo["region"],
        "lat": geo["lat"],
        "lon": geo["lon"],
        "browser": browser_info["browser"],
        "operating_system": browser_info["operating_system"],
        "device": browser_info["device"],
        "user_agent": browser_info["user_agent"],
        "is_mobile": browser_info["is_mobile"],
    }
