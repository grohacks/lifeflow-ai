# LifeFlow AI — Database Schema & Data Lifecycle

LifeFlow AI uses MySQL 8.x as its primary relational store. Database schema management is automated through 6 Flyway migrations located in `backend/src/main/resources/db/migration/`.

---

## 1. Flyway Migration Catalog

| Migration | Version | Target Domain | Primary Tables Created |
|---|---|---|---|
| `V1__init_auth_schema.sql` | 1 | RBAC Authentication | `users`, `roles`, `user_roles` |
| `V2__init_ambulance_and_devices.sql` | 2 | Fleet & Medical Hardware | `ambulances`, `medical_devices`, `device_channels`, `sensor_observations` |
| `V3__init_patient_schema.sql` | 3 | Clinical Cases & Patient Twin | `patient_cases`, `patient_observations`, `patient_interventions`, `patient_images`, `patient_twin_states`, `patient_forecasts` |
| `V4__init_transport_and_hospital_schema.sql` | 4 | Transport & Hospital Network | `ambulance_states`, `routes`, `hospitals`, `hospital_resources`, `hospital_resource_snapshots`, `hospital_twin_states` |
| `V5__init_decision_and_prealert_schema.sql` | 5 | MCDA Decisions & Pre-Alerts | `recommendations`, `candidate_destinations`, `destination_evaluations`, `human_decisions`, `prealerts` |
| `V6__init_audit_and_sync_schema.sql` | 6 | Compliance & Offline Sync | `audit_events`, `sync_events`, `model_versions` |

---

## 2. Core Entities and Relationships

```
  +------------------+         1:N         +------------------------+
  |    ambulances    |-------------------->|    medical_devices     |
  +------------------+                     +------------------------+
           | 1:N                                        | 1:N
           v                                            v
  +------------------+                     +------------------------+
  | ambulance_states |                     |  sensor_observations   |
  +------------------+                     +------------------------+
           |
           +--------------------+
                                |
                                v
  +------------------+  1:N  +------------------+  1:N  +--------------------+
  |  patient_cases   |------>|patient_twin_state|------>| destination_evals  |
  +------------------+       +------------------+       +--------------------+
           | 1:N                                                   |
           v                                                       v
  +------------------+                                  +--------------------+
  | recommendations  |--------------------------------->|candidate_destinats |
  +------------------+ 1:N                              +--------------------+
           |                                                       |
           v                                                       v
  +------------------+                                  +--------------------+
  | human_decisions  |                                  |     hospitals      |
  +------------------+                                  +--------------------+
           |                                                       | 1:N
           v                                                       v
  +------------------+                                  +--------------------+
  |    prealerts     |--------------------------------->| hospital_resources |
  +------------------+                                  +--------------------+
```

---

## 3. Immutability & Audit Invariants

### 3.1 Recommendation Versioning
Recommendations are strictly append-only. When conditions change (vital deterioration, traffic surge, or capacity drop):
1. A new recommendation record is inserted with `version_number = N + 1`.
2. The prior recommendation's `is_active` flag is set to `false`.
3. Historical recommendations are retained permanently to facilitate clinical root cause analyses.

### 3.2 Regulatory Audit Trail
The `audit_events` table enforces an append-only invariant:
- Columns: `id`, `event_type`, `entity_type`, `entity_id`, `actor_username`, `actor_role`, `details_json`, `ip_address`, `correlation_id`, `created_at`.
- No JPA update or delete operations are exposed on `AuditEventRepository`.
- Any clinical override, pre-alert transmission, patient registration, or significant parameter modification generates an immutable audit record.
