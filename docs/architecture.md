# LifeFlow AI — System Architecture Document

## 1. System Overview

**LifeFlow AI** is a zero-cost, edge-to-cloud Predictive Emergency Healthcare Digital Twin Platform designed to optimize patient transport and clinical destination triage during the critical "Golden Hour". 

The platform continuously fuses high-frequency telemetry from 10 simulated ambulance medical devices, models the dynamic physiological state of the patient, evaluates urban transport corridors with live traffic multipliers, and monitors real-time hospital specialty capabilities and capacity constraints.

```
+-----------------------------------------------------------------------------------+
|                           AMBULANCE CABIN / EDGE LAYER                            |
|                                                                                   |
|  [Simulated Medical Devices (10)]                                                  |
|    - Monitor, Defib, Vent, Infusion, Capno, Ultrasound, Glucometer, Thermometer... |
|                                   | (JSON / MQTT)                                 |
|                                   v                                               |
|                    [Edge Gateway (FastAPI / SQLite)]                              |
|                       - Offline Buffer (`offline_buffer`)                         |
|                       - Reconnect & Batch Forwarder                               |
+-----------------------------------|-----------------------------------------------+
                                    | WAN (MQTT / HTTP)
                                    v
+-----------------------------------------------------------------------------------+
|                        CLOUD & BACKEND PLATFORM LAYER                             |
|                                                                                   |
|  [Mosquitto MQTT Broker]           [Redis 7.x Cache]          [Local MySQL 8.x]   |
|   Topic: lifeflow/ambulance/telemetry  TTL Cache / PubSub        Flyway Migrations|
|                   \                        /                       V1 - V6        |
|                    \                      /                       /               |
|            +----------------------------------------------------+/                |
|            |      Spring Boot 3.4.3 Core Healthcare Backend     |                 |
|            |                                                    |                 |
|            | - Device Adapter Engine (Normalization & Unit Conv)|                 |
|            | - Patient Digital Twin (EWMA, Deterioration Index) |                 |
|            | - Transport Digital Twin (Haversine + Detours)     |                 |
|            | - Hospital Digital Twin (Capability & Freshness)   |                 |
|            | - MCDA Decision Engine (Versioned Recommendations) |                 |
|            | - Pre-Alert & Human Confirmation Safeguards        |                 |
|            | - Immutability Audit Trail Engine                  |                 |
|            +----------------------------------------------------+                 |
|                       |                                   |                       |
|                       v                                   v                       |
|          [FastAPI AI Microservice]             [WebSocket STOMP Broker]           |
|            - Time-Series Forecasting             - /topic/telemetry               |
|            - Vision Baseline Extraction          - /topic/patient-twin            |
|            - Statistical Deterioration           - /topic/recommendations         |
+-----------------------------------------------------------|-----------------------+
                                                            |
                                                            v
+-----------------------------------------------------------------------------------+
|                        TACTICAL FRONTEND LAYER (REACT SPA)                        |
|                                                                                   |
|  - Real-Time Operations Fleet Dashboard (Leaflet + OpenStreetMap)                 |
|  - Patient Digital Twin & Multi-Horizon Vital Signs Visualizer                    |
|  - Multi-Criteria Decision Breakdown & Explainability Matrix                      |
|  - Hospital Pre-Alert System with Two-Paramedic Confirmation Guard                |
|  - Deterministic Golden Hour Simulation Controller                                |
|  - Immutable Regulatory Audit Log Viewer                                          |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Pillars

### 2.1 Zero-Cost Operating Model
LifeFlow AI eliminates all recurring cloud subscriptions and proprietary API dependencies:
- **Zero Paid Mapping APIs**: Employs OpenStreetMap tiles and a local geometric `HaversineRouter` with urban curvature detour modeling (factor 1.25) and corridor congestion factors instead of Google Maps Distance Matrix or Directions API.
- **Zero Proprietary Cloud AI**: Eliminates OpenAI, Anthropic, AWS SageMaker, and Azure Cognitive Services. Vital forecasting utilizes local Scikit-Learn regression with exponentially weighted moving averages and uncertainty estimation; imaging feature extraction executes on local OpenCV/NumPy pipelines.
- **Zero Proprietary Messaging**: MQTT via open-source Eclipse Mosquitto replaces AWS IoT Core or Twilio; STOMP over SockJS handles real-time web broadcasts.

### 2.2 Triple Digital Twin Modeling
1. **Patient Digital Twin**:
   - Maintains continuous physiological state across Heart Rate, MAP, SpO2, Respiratory Rate, EtCO2, GCS, and Core Temp.
   - Computes an aggregate Deterioration Score ($0.0 - 1.0$) based on vital threshold excursions and multi-vital derivative trends.
   - Triggers automated re-evaluation whenever vital trajectory shifts materially ($\Delta \text{score} \ge 0.15$ or acute threshold breach).
2. **Transport Digital Twin**:
   - Tracks dynamic ambulance GPS coordinates, heading, velocity, and corridor congestion factors.
   - Computes deterministic, traffic-adjusted Estimated Time of Arrival (ETA) to every regional receiving center.
3. **Hospital Digital Twin**:
   - Models receiving center specialty capability flags (Trauma Level, STEMI catheterization, Comprehensive Stroke, Burn, Pediatric ICU).
   - Monitors available bed capacity across ICU, Trauma Resuscitation Bays, Operating Rooms, CT Scanners, and Cath Labs.
   - Enforces a **Freshness TTL** (default 15 minutes) — if capacity telemetry exceeds the threshold, the system flags the data as stale and applies an uncertainty penalty to recommendation scores.

### 2.3 Multi-Criteria Decision Analysis (MCDA) Destination Engine
Destination selection is performed via a deterministic, multi-criteria objective function:
$$\text{Score}(H) = w_{\text{travel}} \cdot S_{\text{travel}} + w_{\text{cap}} \cdot S_{\text{cap}} + w_{\text{wait}} \cdot S_{\text{wait}} + w_{\text{qual}} \cdot S_{\text{qual}} - P_{\text{stale}}$$

- **Hard Feasibility Gates**: Hospitals lacking required specialty certifications (e.g. STEMI cath lab for cardiac emergencies, Level 1 trauma for multi-system trauma) or with 0 available trauma/ICU capacity are filtered out or disqualified.
- **Explainability**: Every candidate destination receives a itemized explanation breakdown outlining why it was prioritized or ranked lower.
- **Versioned Immutability**: Recommendations are strictly versioned (`v1`, `v2`, `v3`). Past recommendations are preserved with historical timestamps to support complete forensic and clinical reviews.

### 2.4 Human-in-the-Loop Safeguards
LifeFlow AI is strictly a clinical decision-support tool. It:
- Displays explicit non-diagnostic disclaimers across all AI forecasts and image features.
- Requires explicit clinician/paramedic confirmation before any pre-alert is dispatched to receiving emergency departments.
- Provides override capabilities with mandatory reason logging for clinical audits.
