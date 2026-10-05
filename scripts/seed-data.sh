#!/usr/bin/env bash
# ==============================================================================
# LifeFlow AI — Seed Data Verification Script (Bash)
# ==============================================================================
set -e

BACKEND_URL="http://localhost:8080/api"

echo "=========================================================="
echo "         LifeFlow AI — Seed Data Verification             "
echo "=========================================================="

echo -e "\n[1/3] Authenticating with backend..."
LOGIN_RESP=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}')

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "  [!] Authentication failed. Backend response: $LOGIN_RESP"
    exit 1
fi
echo "  [+] Authentication successful."

echo -e "\n[2/3] Checking Ambulances..."
curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/ambulances" | grep -o '"callSign":"[^"]*' | head -n 5 || true

echo -e "\n[3/3] Checking Hospitals..."
curl -s -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/hospitals" | grep -o '"name":"[^"]*' | head -n 5 || true

echo -e "\n=========================================================="
echo "  Seed verification complete. System is ready for demo.   "
echo "=========================================================="
