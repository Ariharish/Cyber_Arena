# Start CyberArena Backend
Write-Host "Starting CyberArena Backend..." -ForegroundColor Cyan
Set-Location "C:\Users\acer\.gemini\antigravity\scratch\cyberarena\backend"
$env:FLASK_ENV = "development"
.\venv\Scripts\python app.py
