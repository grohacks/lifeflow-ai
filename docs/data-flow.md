# LifeFlow AI — End-to-End Data Flow

This document details the lifecycle and movement of telemetry, digital twin state transitions, decision re-evaluations, pre-alert broadcasts, and regulatory audit records.

---

## 1. High-Frequency Telemetry Ingestion Flow

```
[Medical Devices (1-10)] 
           | (Raw proprietary formats / IEEE 11073)
           v
[Simulated Medical Device Adapters]
           | (Standardized DeviceObservation: metric, value, unit, timestamp, confidence)
           v
[Edge Gateway]
      | 
      |-- If Offline: Persists to local SQLite `offline_buffer` table
      |-- If Online:  Dispatches via HTTP POST /api/devices/observations or MQTT
           v
[Mosquitto Broker / Spring Boot Ingestion Filter]
           v
[DeviceService.ingestObservation()]
      |
      |-- Unit Normalization (e.g. °F -> °C, mmHg -> kPa if configured)
      |-- Observation Deduplication & Threshold Validation
      |-- Persists to `sensor_observations` & `patient_observations`
      |
      +---> Dispatches STOMP event to `/topic/telemetry/{ambulanceId}`
      +---> Dispatches to PatientTwinService.updateFromObservation()
```

---

## 2. Digital Twin Synchronization Flow

```
                     [New Patient Observation]
                                 |
                                 v
                    [PatientTwinService.process()]
                                 |
         +-----------------------+-----------------------+
         |                                               |
         v                                               v
[EWMA Trajectory Smoothing]              [Deterioration Score Calculation]
 - Heart Rate trend slope                 - Vitals out of physiological bounds
 - MAP trend slope                        - Respiratory decompensation weighting
 - SpO2 drop rate                         - Glasgow Coma Scale (GCS) decay
         |                                               |
         +-----------------------+-----------------------+
                                 |
                                 v
                [Material Change Detection Guard]
                                 |
            Is (|ΔDeterioration| >= 0.15) OR (Threshold Breach)?
                                 |
                      +----------+----------+
                      | Yes                 | No
                      v                     v
          [ReevaluationService]      [Save State Snapshot]
          (Trigger async re-run)     (Broadcast to /topic/patient-twin/{caseId})
```

---

## 3. Destination Re-Evaluation Flow

```
                   [ReevaluationService.triggerReevaluation()]
                                       |
                                       v
                     [Fetch Active Patient Twin State]
                                       |
                     [Fetch Transport Twin (ETA to all Hospitals)]
                                       |
                     [Fetch Hospital Twin (Capacities & Freshness)]
                                       |
                                       v
                     [DestinationDecisionEngine.evaluate()]
                                       |
         +-----------------------------+-----------------------------+
         |                                                           |
         v                                                           v
[Hard Feasibility Constraints]                              [Multi-Criteria Scoring]
 - Does hospital meet specialty need?                        - Travel Time Score (w=0.35)
 - Does hospital have >0 critical beds?                      - Resource Availability (w=0.30)
 - Is ETA within golden window?                              - Historical Treatment Quality (w=0.20)
                                                             - Wait Time / Offload Score (w=0.15)
                                                             - Freshness Penalty (-0.20 if >15m old)
                                                                     |
                                                                     v
                                                          [Composite MCDA Score]
                                                                     |
                                                                     v
                                                    [Rank Candidate Destinations]
                                                                     |
                                                                     v
                                                    [Generate Itemized Explanations]
                                                                     |
                                                                     v
                                                  [Create Recommendation Version N+1]
                                                    - Deactivate previous version N
                                                    - Insert into `recommendations`
                                                    - Broadcast to `/topic/recommendations/{caseId}`
```

---

## 4. Pre-Alert and Confirmation Flow

```
[Paramedic / Operator Reviews Recommendation]
                       |
                       v
   [Human Decision Safeguard Interface]
                       |
       +---------------+---------------+
       | Accept Top Recommendation     | Override Recommendation
       v                               v
[Paramedic Confirms]          [Paramedic Specifies Alternative & Reason]
       |                               |
       +---------------+---------------+
                       |
                       v
         [POST /api/prealerts/confirm]
                       |
                       v
        [Create PreAlert Record & Payload]
         - Patient condition summary
         - ETA to target hospital
         - Required specialty preparation (e.g. Cath Lab, Trauma Bay)
         - Raw vital signs baseline
                       |
                       +---> Dispatches to Hospital Dashboard (`/topic/prealerts/{hospitalId}`)
                       +---> Dispatches SMS/Email notification (simulated webhook)
                       +---> Creates immutable audit entry in `audit_events`
```
