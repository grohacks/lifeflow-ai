# LifeFlow AI — Predictive Emergency Healthcare Digital Twin Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![Backend](https://img.shields.io/badge/Spring%20Boot-3.4.3-blue.svg)]()
[![Java](https://img.shields.io/badge/Java-21-orange.svg)]()
[![Database](https://img.shields.io/badge/MySQL-8.0-blue.svg)]()
[![AI](https://img.shields.io/badge/Python-FastAPI%20%7C%20Scikit--Learn-green.svg)]()
[![Frontend](https://img.shields.io/badge/React-18%20%7C%20Vite-purple.svg)]()
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)]()

> **CLINICAL DECISION SUPPORT NOTICE**: LifeFlow AI is designed exclusively for clinical decision support, operational simulation, and educational research. All artificial intelligence forecasts, physiological digital twin estimates, and automated recommendations are assistive and require confirmation by qualified medical personnel. Not intended as an autonomous diagnostic or dispatch device.

---

## 1. Executive Summary

**LifeFlow AI** is a production-grade, zero-cost, edge-to-cloud Predictive Emergency Healthcare Digital Twin Platform. It synthesizes real-time physiological telemetry from simulated ambulance medical devices, models transport corridors with live urban congestion multipliers, and continuously tracks regional hospital specialty capacity to solve the critical "Golden Hour" emergency triage problem.

### Key Capabilities:
- **10 Simulated Medical Devices**: Patient Monitor, Defibrillator, Ventilator, Infusion Pump, Capnography, Ultrasound, Glucometer, Thermometer, NIBP Cuff, Pulse Oximeter.
- **Edge Gateway & Offline Resiliency**: Local SQLite store-and-forward buffer guaranteeing zero data loss across cellular dead zones with automated batch catch-up.
- **Triple Digital Twin Engine**:
  - *Patient Twin*: Real-time physiological state, EWMA trend smoothing, and composite Deterioration Index scoring.
  - *Transport Twin*: Geodesic Haversine routing with urban detour factors and dynamic traffic congestion multipliers.
  - *Hospital Twin*: Real-time specialty certification checks and capacity monitoring with a 15-minute Freshness TTL staleness penalty.
- **Multi-Criteria Decision Analysis (MCDA)**: Versioned destination triage engine with hard feasibility gates, weighted objective scoring, and itemized clinical explanations.
- **Human-in-the-Loop Safeguards**: Paramedic override controls, reason logging, and two-tier confirmation before dispatching hospital pre-alerts.
- **Zero Paid Cloud Dependencies**: Runs entirely on local open-source technologies (OpenStreetMap, Local MySQL 8.x, Mosquitto MQTT, Redis, Scikit-Learn).

---

## 2. System Architecture

```
                                  +---------------------------------------+
                                  |   10 Simulated Medical Devices        |
                                  +---------------------------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |   Edge Gateway (FastAPI / SQLite)     |
                                  |   Offline Buffering & Auto Replay     |
                                  +---------------------------------------+
                                                      |
                                                      v
+---------------------------------------------------------------------------------------------------+
| Spring Boot 3.4.3 Healthcare Core Platform                                                        |
|                                                                                                   |
|  [Device Ingestion] ---> [Patient Twin] ---> [Transport Twin] ---> [Hospital Twin]                |
|           |                     |                   |                    |                        |
|           +---------------------+-------------------+--------------------+                        |
|                                 |                                                                 |
|                                 v                                                                 |
|                 [MCDA Destination Decision Engine] <---> [FastAPI AI Service]                     |
|                 (Versioned Recommendations v1..vN)       (Forecasting & Vision)                   |
|                                 |                                                                 |
|                                 v                                                                 |
|                     [Pre-Alert & Audit Engine]                                                    |
|                     (Immutable Audit Trail in MySQL)                                              |
+---------------------------------------------------------------------------------------------------+
                                  | WebSocket (STOMP) & REST
                                  v
+---------------------------------------------------------------------------------------------------+
| React 18 + TypeScript + Vite Emergency Operations Tactical SPA                                    |
| (OpenStreetMap Fleet Tracker, Patient Twin Monitor, Decision Breakdown, Hospital Network)          |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Directory Layout

```
lifeflow-ai/
├── ai-service/              # FastAPI Python service for time-series forecasting & vision
│   ├── app/                 # Forecasting, vision extraction, schemas, main
│   ├── tests/               # Pytest test cases
│   ├── Dockerfile
│   └── requirements.txt
├── backend/                 # Spring Boot 3.4.3 enterprise core application
│   ├── src/main/java/       # Domain modules: auth, ambulance, device, patient, twin, decision, etc.
│   ├── src/main/resources/  # application.yml, db/migration (Flyway V1-V6)
│   ├── pom.xml
│   └── Dockerfile
├── edge-gateway/            # FastAPI Python edge gateway with offline SQLite buffering
│   ├── app/                 # Buffer manager, network simulation, main
│   ├── tests/               # Pytest test cases
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React 18 + TypeScript + Material-UI + Leaflet SPA
│   ├── src/                 # Pages, components, services, layouts, types
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── simulator/               # Deterministic Golden Hour emergency simulation runner
│   └── runner.py
├── scripts/                 # PowerShell and Bash setup, health-check, seed, and demo scripts
├── docs/                    # 10 comprehensive architectural and technical specifications
├── docker-compose.yml       # Production container orchestration definition
└── docker-compose.mysql.yml # Optional containerized MySQL 8 service
```

---

## 4. Quickstart Guide

### Prerequisites
- Windows 10/11, macOS, or Linux
- **Java 21** & **Maven 3.9+**
- **Node.js 18+** & **npm**
- **Python 3.10+**
- **MySQL 8.0+** (running locally on port 3306 or via Docker)

### Option A: Automated PowerShell Setup (Windows)
```powershell
# 1. Clone or navigate to the directory
cd "e:\capstone projject\lifeflow-ai"

# 2. Run system initialization
.\scripts\setup.ps1

# 3. Verify health of supporting services
.\scripts\health-check.ps1

# 4. Launch the Golden Hour demonstration
.\scripts\run-demo.ps1
```

### Option B: Docker Compose (All Platforms)
```bash
docker compose up -d --build
```
Access the web frontend at `http://localhost:3000` (or `http://localhost:5173` in dev mode).

---

## 5. Default Credentials

The database is pre-seeded with role-based credentials:

| Username | Password | Role | Primary Responsibility |
|---|---|---|---|
| `admin` | `Admin@123` | `ROLE_ADMIN` | Full system administration, fleet management |
| `paramedic` | `Paramedic@123` | `ROLE_PARAMEDIC` | Active ambulance cabin, vital entry, triage confirmation |
| `operator` | `Operator@123` | `ROLE_CONTROL_OPERATOR` | Central dispatch, fleet oversight, manual re-evaluation |
| `hospital` | `Hospital@123` | `ROLE_HOSPITAL_COORDINATOR` | ED pre-alerts, bed & resource capacity updates |
| `clinician` | `Clinician@123` | `ROLE_CLINICIAN` | Trauma/specialty physician review & acknowledgement |

---

## 6. Golden Hour Deterministic Scenario Walkthrough

The platform includes a pre-configured, deterministic simulation reproducing an acute multi-system trauma emergency:

1. **T=0 min (Initial Triage)**:
   - Paramedic unit MED-01 transports a patient with blunt thoracic trauma.
   - Initial Vitals: HR 105, BP 115/75 (MAP 88), SpO2 96%, GCS 14.
   - **Recommendation v1**: St. Jude Trauma Center ranked #1 (Score: 0.88) due to Level 1 Trauma accreditation.

2. **T=15 min (Physiological Deterioration)**:
   - Patient decompensates into hemorrhagic shock: HR spikes to 138, MAP drops to 52 mmHg, SpO2 crashes to 86%.
   - Patient Digital Twin flags critical trend slope ($\Delta \text{score} = +0.32$).
   - Automated re-evaluation is triggered asynchronously.

3. **T=25 min (Corridor Gridlock)**:
   - Traffic incident on primary arterial corridor increases travel time to St. Jude by +15 minutes.
   - **Recommendation v2**: Decision engine pivots top choice to Metro General Hospital (ETA 11 min vs St. Jude 26 min).

4. **T=35 min (Hospital Resource Depletion)**:
   - St. Jude reports critical surge: Trauma Resuscitation Bays drop to 0.
   - Hard feasibility constraint disqualifies St. Jude from emergency trauma routing.
   - **Recommendation v3**: Metro General Hospital confirmed with high confidence.

5. **T=40 min (Human Pre-Alert Dispatch)**:
   - Paramedic confirms Metro General Hospital. Pre-alert is dispatched to Metro General's ED dashboard with ETA and clinical prep instructions.
   - Immutable event is recorded in the regulatory audit log.

---

## 7. Verification & Testing Commands

To run all automated verification suites:

```bash
# 1. AI Service Unit Tests
cd ai-service && pytest tests/ -v

# 2. Edge Gateway Unit Tests
cd ../edge-gateway && pytest tests/ -v

# 3. Backend Test Compilation
cd ../backend && mvn test-compile

# 4. Frontend Production Build
cd ../frontend && npm run build
```

---

## 8. License

This project is licensed under the MIT License.
"# lifeflow-ai" 
