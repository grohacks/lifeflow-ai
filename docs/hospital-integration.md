# LifeFlow AI — Hospital Network & Capacity Integration

LifeFlow AI aggregates clinical capability and capacity telemetry across all regional receiving centers.

---

## 1. Specialty Capability Model

Every hospital in the LifeFlow network is indexed with its operational capabilities:

| Capability Property | Type | Description |
|---|---|---|
| `traumaLevel` | Integer (1 - 4) | 1 = Comprehensive Trauma Center, 4 = Basic stabilization |
| `hasStemiCenter` | Boolean | Dedicated 24/7 cardiac catheterization lab active |
| `hasStrokeCenter` | Boolean | Comprehensive / Primary stroke center with thrombectomy capability |
| `hasBurnCenter` | Boolean | Specialized burn ICU and surgical team |
| `hasPediatricIcu` | Boolean | Dedicated Pediatric Intensive Care Unit (PICU) |
| `historicalQualityScore` | Float (0.0 - 1.0) | Risk-adjusted survival and quality compliance benchmark |

---

## 2. Dynamic Resource Tracking & Freshness TTL

### 2.1 Tracked Resource Types
The platform tracks real-time inventory and availability across 5 critical hospital resources:
1. `ICU_BEDS`: Adult intensive care unit beds.
2. `TRAUMA_BAYS`: Resuscitation bays in the emergency department.
3. `OR_SUITES`: Operating rooms staffed and available for emergency surgery.
4. `CT_SCANNERS`: Diagnostic computed tomography scanners.
5. `CATH_LABS`: Cardiac catheterization suites ready for intervention.

### 2.2 Freshness TTL & Staleness Penalty
- Each resource snapshot records `last_updated_at`.
- The system enforces a default **Freshness TTL of 15 minutes** (`app.hospital.freshness-ttl-seconds: 900`).
- If current time exceeds `last_updated_at + TTL`:
  1. The hospital resource is flagged with `isStale: true`.
  2. The destination decision engine applies a **Staleness Penalty** ($P_{\text{stale}} = -0.20$) to the hospital's composite score.
  3. Paramedics and dispatchers are presented with a visual warning: `"Capacity telemetry stale (>15 min) — phone verification advised"`.
