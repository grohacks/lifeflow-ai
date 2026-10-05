# LifeFlow AI — Testing & Verification Strategy

LifeFlow AI incorporates automated verification across all tiers: Python AI microservices, Edge Gateway offline buffering, Spring Boot backend test compilation, and React frontend build.

---

## 1. Automated Unit & Integration Tests

### 1.1 Python AI Service Tests
Tests verify multi-horizon forecasting, linear trend estimation, confidence interval generation, and computer vision feature extraction:
```bash
cd ai-service
pytest tests/ -v
```

### 1.2 Python Edge Gateway Offline Buffer Tests
Tests verify SQLite schema creation, offline record persistence, unsynced retrieval, and batch synchronization flags:
```bash
cd edge-gateway
pytest tests/ -v
```

### 1.3 Spring Boot Backend Test Compilation
Tests verify Flyway migrations, JPA entity mappings, security filters, and REST controllers:
```bash
cd backend
mvn test-compile
```

### 1.4 Frontend TypeScript & Vite Production Build
Tests verify React TypeScript type correctness, route declarations, and production asset minification:
```bash
cd frontend
npm run build
```

---

## 2. End-to-End Golden Hour Scenario Verification

The platform includes a deterministic Golden Hour simulation orchestrator to validate the full reactive pipeline:
1. **Initial State (T=0)**: Patient exhibits moderate trauma (HR 105, BP 115/75, GCS 14). St. Jude Trauma Center is ranked #1.
2. **Acute Deterioration (T=15)**: Patient undergoes hypovolemic shock (HR 138, MAP 52, SpO2 86%). Patient Twin detects significant slope change ($\Delta \text{score} > 0.15$) and triggers async destination re-evaluation.
3. **Corridor Gridlock (T=25)**: Major arterial highway experiences simulated incident, adding 15 minutes of delay to St. Jude. Decision engine shifts recommendation to Metro General Hospital.
4. **Capacity Drop (T=35)**: St. Jude trauma bays drop to 0. Feasibility constraint hard-disqualifies St. Jude, reinforcing Metro General.
5. **Paramedic Pre-Alert (T=40)**: Paramedic reviews updated recommendation and issues pre-alert to Metro General ED.
6. **Regulatory Audit**: Inspect `/api/audit/events` to verify every decision version, trigger, and timestamp is captured.
