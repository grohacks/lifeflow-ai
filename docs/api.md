# LifeFlow AI — API & WebSocket Topic Catalog

All REST endpoints are rooted under `/api/`. All JSON responses adhere to the standard payload envelope:
```json
{
  "success": true,
  "message": "Descriptive message",
  "data": { ... },
  "correlationId": "uuid",
  "timestamp": "2026-09-21T10:00:00Z"
}
```

---

## 1. Authentication Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user, return JWT token | Public |
| `POST` | `/api/auth/register` | Register new staff user | `ROLE_ADMIN` |
| `GET` | `/api/auth/me` | Return currently authenticated user profile | Authenticated |

---

## 2. Ambulances & Telemetry Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/ambulances` | List all ambulances with live status & coordinate | Any |
| `GET` | `/api/ambulances/{id}` | Get specific ambulance telemetry and device status | Any |
| `POST` | `/api/ambulances` | Register a new ambulance unit | `ROLE_ADMIN` |
| `POST` | `/api/ambulances/{id}/location` | Update live GPS coordinates & speed | `ROLE_PARAMEDIC`, `ROLE_ADMIN` |
| `GET` | `/api/ambulances/{id}/telemetry` | Get recent sensor observations stream | Any |

---

## 3. Medical Devices & Observations Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/devices` | List registered medical devices | Any |
| `POST` | `/api/devices` | Register a new medical device | `ROLE_ADMIN` |
| `POST` | `/api/devices/observations` | Ingest real-time sensor observation | Any |
| `POST` | `/api/devices/observations/batch` | Batch ingest buffered offline observations | Any |

---

## 4. Patient Cases & Digital Twin Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/patients/cases` | List active emergency patient cases | Any |
| `GET` | `/api/patients/cases/{id}` | Get full case dossier (vitals, interventions) | Any |
| `POST` | `/api/patients/cases` | Register a new emergency patient case | `ROLE_PARAMEDIC`, `ROLE_ADMIN` |
| `GET` | `/api/patients/cases/{id}/twin` | Get live Patient Digital Twin state | Any |
| `POST` | `/api/patients/cases/{id}/interventions` | Record paramedic intervention (IV, meds, O2) | `ROLE_PARAMEDIC` |
| `POST` | `/api/patients/cases/{id}/images` | Upload wound/ECG image for AI feature analysis | `ROLE_PARAMEDIC` |
| `GET` | `/api/patients/cases/{id}/forecasts` | Retrieve multi-horizon forecasted vital trajectory | Any |

---

## 5. Hospital Network & Capacity Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/hospitals` | List regional hospitals with capabilities & capacity | Any |
| `GET` | `/api/hospitals/{id}` | Get detailed hospital capacity and twin state | Any |
| `POST` | `/api/hospitals` | Register a new receiving hospital | `ROLE_ADMIN` |
| `POST` | `/api/hospitals/{id}/resources` | Update resource units (ICU, Trauma, OR, Cath) | `ROLE_HOSPITAL_COORDINATOR`, `ROLE_ADMIN` |
| `GET` | `/api/hospitals/{id}/twin` | Get real-time Hospital Digital Twin status | Any |

---

## 6. Destination Re-Evaluation & Decision Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/decisions/cases/{caseId}/latest` | Get the latest active destination recommendation | Any |
| `GET` | `/api/decisions/cases/{caseId}/history` | Get full versioned history of recommendations | Any |
| `POST` | `/api/decisions/cases/{caseId}/reevaluate`| Manually trigger MCDA destination re-evaluation | `ROLE_PARAMEDIC`, `ROLE_CONTROL_OPERATOR` |

---

## 7. Hospital Pre-Alerts Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/prealerts/active` | Get active pending pre-alerts across network | Any |
| `GET` | `/api/prealerts/hospital/{hospitalId}` | Get pre-alerts targeted to specific hospital | Any |
| `POST` | `/api/prealerts/confirm` | Submit paramedic destination confirmation / override | `ROLE_PARAMEDIC`, `ROLE_CONTROL_OPERATOR` |
| `POST` | `/api/prealerts/{id}/acknowledge` | Hospital emergency department acknowledges alert | `ROLE_HOSPITAL_COORDINATOR`, `ROLE_CLINICIAN` |

---

## 8. Simulation Control Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `POST` | `/api/simulation/start` | Start deterministic Golden Hour emergency run | Any |
| `POST` | `/api/simulation/step` | Advance simulation by one waypoint | Any |
| `POST` | `/api/simulation/trigger-deterioration` | Inject patient physiological collapse event | Any |
| `POST` | `/api/simulation/trigger-traffic-surge` | Inject urban corridor gridlock (+15m delay) | Any |
| `POST` | `/api/simulation/trigger-hospital-drop` | Drop target hospital trauma bay capacity to 0 | Any |
| `POST` | `/api/simulation/reset` | Reset simulation state to initial baseline | Any |

---

## 9. Regulatory Audit Trail Endpoints

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/audit/events` | Query regulatory audit log with pagination & filters | `ROLE_ADMIN`, `ROLE_CONTROL_OPERATOR` |
| `GET` | `/api/audit/events/entity` | Query audit trail for a specific entity ID & type | Any |

---

## 10. WebSocket (STOMP over SockJS) Topics

| Topic URI | Payload Model | Broadcast Trigger |
|---|---|---|
| `/topic/telemetry/{ambulanceId}` | `SensorObservationDto` | Ingestion of new device vital |
| `/topic/patient-twin/{caseId}` | `PatientTwinStateDto` | Physiological state update or deterioration |
| `/topic/transport-twin/{ambulanceId}` | `AmbulanceStateDto` | GPS update, heading, or speed change |
| `/topic/hospital-twin/{hospitalId}` | `HospitalTwinStateDto` | Capacity change or freshness update |
| `/topic/recommendations/{caseId}` | `RecommendationDto` | Destination re-evaluation completion |
| `/topic/prealerts/{hospitalId}` | `PreAlertDto` | Confirmed pre-alert dispatched to hospital |
