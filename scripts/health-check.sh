#!/usr/bin/env bash
# ==============================================================================
# LifeFlow AI — Health Check Script (Bash)
# ==============================================================================

echo "=========================================================="
echo "         LifeFlow AI — System Health Inspection           "
echo "=========================================================="

check_port() {
    local host=$1
    local port=$2
    local name=$3
    if nc -z -w 2 "$host" "$port" 2>/dev/null || (echo > /dev/tcp/"$host"/"$port") 2>/dev/null; then
        printf "[✓] %-28s %-30s UP\n" "$name" "$host:$port"
    else
        printf "[✗] %-28s %-30s DOWN\n" "$name" "$host:$port"
    fi
}

check_http() {
    local url=$1
    local name=$2
    if curl -s -f -m 3 "$url" > /dev/null 2>&1; then
        printf "[✓] %-28s %-30s UP\n" "$name" "$url"
    else
        printf "[✗] %-28s %-30s DOWN\n" "$name" "$url"
    fi
}

echo -e "\nInfrastructure Services:"
check_port "127.0.0.1" 3306 "MySQL Database"
check_port "127.0.0.1" 6379 "Redis Cache"
check_port "127.0.0.1" 1883 "Mosquitto MQTT"

echo -e "\nApplication Microservices:"
check_http "http://localhost:8080/api/health" "Spring Boot Backend"
check_http "http://localhost:8000/health" "FastAPI AI Service"
check_http "http://localhost:8001/health" "FastAPI Edge Gateway"
check_http "http://localhost:5173" "React Vite Frontend"

echo "=========================================================="
