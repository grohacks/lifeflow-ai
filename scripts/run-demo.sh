#!/usr/bin/env bash
# ==============================================================================
# LifeFlow AI — Golden Hour Demo Launcher (Bash)
# ==============================================================================
set -e

BACKEND_URL="http://localhost:8080/api"

echo "=========================================================="
echo "       LifeFlow AI — Golden Hour Simulation Demo          "
echo "=========================================================="

echo -e "\n[1/3] Authenticating session..."
LOGIN_RESP=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"paramedic","password":"Paramedic@123"}')

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
    echo "  [!] Authentication failed. Ensure backend is running."
    exit 1
fi
echo "  [+] Logged in successfully."

echo -e "\n[2/3] Triggering Golden Hour Simulation..."
curl -s -X POST "$BACKEND_URL/simulation/start?ambulanceId=1&caseId=1" \
  -H "Authorization: Bearer $TOKEN" | grep -o '"message":"[^"]*' || true

echo -e "\n[3/3] Demo ready!"
echo "  - Open Frontend Dashboard: http://localhost:5173"
echo "  - Run Python Simulator: python simulator/runner.py"
echo "=========================================================="
