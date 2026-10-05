# LifeFlow AI — Deployment & Infrastructure Guide

LifeFlow AI supports two operational deployment models: **Unified Docker Compose** and **Bare-Metal / Developer Mode**.

---

## 1. Unified Docker Compose Deployment

The root `docker-compose.yml` provisions all 6 containerized services in an isolated bridge network:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mosquitto:
    image: eclipse-mosquitto:2
    ports: ["1883:1883", "9001:9001"]

  backend:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [redis, mosquitto]

  ai-service:
    build: ./ai-service
    ports: ["8000:8000"]

  edge-gateway:
    build: ./edge-gateway
    ports: ["8001:8001"]

  frontend:
    build: ./frontend
    ports: ["3000:80"]
    depends_on: [backend]
```

### Launch Command:
```bash
docker compose up -d --build
```

If you do not have a local MySQL instance installed, launch MySQL in a container using:
```bash
docker compose -f docker-compose.yml -f docker-compose.mysql.yml up -d
```

---

## 2. Bare-Metal Developer Mode (Windows / macOS / Linux)

### Step 1: Start Supporting Infrastructure
Ensure MySQL 8.0, Redis, and Mosquitto are running on their default ports:
- MySQL: `localhost:3306` (Database: `lifeflow`)
- Redis: `localhost:6379`
- Mosquitto: `localhost:1883`

### Step 2: Launch AI Microservice
```bash
cd ai-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Launch Edge Gateway Microservice
```bash
cd edge-gateway
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Step 4: Launch Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```

### Step 5: Launch Frontend SPA
```bash
cd frontend
npm run dev
```

The application will be accessible at `http://localhost:5173`.
