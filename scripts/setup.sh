#!/usr/bin/env bash
# ==============================================================================
# LifeFlow AI — Setup Script (Bash)
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "=========================================================="
echo "       LifeFlow AI — System Initialization & Setup         "
echo "=========================================================="

# 1. Environment file
echo -e "\n[1/6] Checking environment configuration (.env)..."
if [ ! -f "$ROOT_DIR/.env" ]; then
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    echo "  [+] Created .env from .env.example"
else
    echo "  [*] .env file already exists."
fi

# 2. Database directory and MySQL check
echo -e "\n[2/6] Checking local MySQL configuration..."
DB_PASS="${DB_PASSWORD:-root}"
if command -v mysql &>/dev/null; then
    mysql -h 127.0.0.1 -P 3306 -u root -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS lifeflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
    echo "  [*] MySQL 'lifeflow' database check completed."
else
    echo "  [*] mysql CLI not installed or not in PATH."
fi

# 3. Create upload directory
echo -e "\n[3/6] Setting up uploads directory..."
mkdir -p "$ROOT_DIR/data/uploads"
echo "  [+] data/uploads ready."

# 4. Python services
echo -e "\n[4/6] Setting up Python dependencies..."
if command -v python3 &>/dev/null; then
    python3 -m pip install -r "$ROOT_DIR/ai-service/requirements.txt" -q
    python3 -m pip install -r "$ROOT_DIR/edge-gateway/requirements.txt" -q
    echo "  [+] Python dependencies installed."
elif command -v python &>/dev/null; then
    python -m pip install -r "$ROOT_DIR/ai-service/requirements.txt" -q
    python -m pip install -r "$ROOT_DIR/edge-gateway/requirements.txt" -q
    echo "  [+] Python dependencies installed."
fi

# 5. Backend compilation
echo -e "\n[5/6] Verifying Java & Maven backend..."
if command -v mvn &>/dev/null; then
    cd "$ROOT_DIR/backend"
    mvn test-compile -DskipTests -q
    cd "$ROOT_DIR"
    echo "  [+] Backend compilation verified."
fi

# 6. Frontend
echo -e "\n[6/6] Verifying Frontend dependencies..."
if command -v npm &>/dev/null; then
    cd "$ROOT_DIR/frontend"
    [ ! -d "node_modules" ] && npm install --quiet
    cd "$ROOT_DIR"
    echo "  [+] Frontend ready."
fi

echo "=========================================================="
echo "       LifeFlow AI Setup Completed Successfully!           "
echo "=========================================================="
