# CyberArena — Setup & Run Guide

## Prerequisites

- **Python 3.9+** installed
- **Node.js 18+** installed (for frontend)
- **MongoDB** running locally on port 27017 (optional — app works without it using in-memory storage)

---

## 1. Start the Backend

```powershell
cd C:\Users\acer\.gemini\antigravity\scratch\cyberarena\backend

# Create virtual environment (first time only)
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Run Flask server
python app.py
```

Backend starts at: **http://localhost:5000**

> ✅ No MongoDB? No problem — the app automatically uses in-memory storage.

---

## 2. Start the Frontend

```powershell
cd C:\Users\acer\.gemini\antigravity\scratch\cyberarena\frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

Frontend starts at: **http://localhost:5173**

---

## 3. Using CyberArena

1. Open **http://localhost:5173** in your browser
2. Navigate to **Red Team Console** 
3. Select an attack type → Enter a payload → Click **Launch Attack**
4. Watch the **SOC Dashboard** update in real-time
5. Check **Threat Feed** for the social-media style event stream
6. View **Attacker Intel** for captured metadata
7. Test **Vulnerable App** directly with attack payloads

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/attacks/launch | Launch simulated attack |
| GET | /api/attacks | List all attack logs |
| GET | /api/stats | Attack statistics |
| POST | /api/target/login | SQLi vulnerable login |
| POST | /api/target/comment | XSS vulnerable comment |
| POST | /api/target/admin | Brute force admin login |
| GET | /api/target/search | SQLi vulnerable search |
| GET | /api/health | Backend health check |

## WebSocket Event
- **attack_alert** — emitted when any attack is launched

---

## Example Payloads

### SQL Injection
```
' OR 1=1 --
' UNION SELECT * FROM users --
admin'--
```

### XSS
```
<script>alert(document.cookie)</script>
<img src=x onerror=alert(1)>
```

### Brute Force
```
Username: admin | Password: admin
Username: root  | Password: 123456
```

### Command Injection
```
; whoami
| cat /etc/passwd
&& ls -la
```
