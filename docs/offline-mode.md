# LifeFlow AI — Edge Gateway & Offline Resiliency

Ambulance operations regularly encounter cellular connectivity dead zones (tunnels, rural corridors, subterranean basements). LifeFlow AI employs an active Edge Gateway with store-and-forward persistence to guarantee zero telemetry loss.

---

## 1. Architectural Architecture

```
[Medical Devices]
        |
        v
[Edge Gateway API]
        |
        +---> Check Cloud Connectivity (Ping / Health Endpoint)
        |
   +----+--------------------------+
   | Online                        | Offline (Dead Zone)
   v                               v
[Forward to Backend]     [Persist to Local SQLite `offline_buffer`]
 - POST /api/devices/       - id (Primary Key)
   observations             - payload (JSON string)
                            - created_at (Timestamp)
                            - synced (0 = pending)
                                   |
                                   | Connectivity Restored
                                   v
                         [Batch Sync Worker]
                          - Reads pending unsynced records
                          - Sends POST /api/devices/observations/batch
                          - Marks records as synced (synced = 1)
```

---

## 2. Buffer Schema & Replay Logic

### 2.1 SQLite Schema (`data/edge_buffer.db`)
```sql
CREATE TABLE IF NOT EXISTS offline_buffer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER,
    channel_code TEXT,
    metric_type TEXT,
    raw_value REAL,
    raw_unit TEXT,
    confidence_score REAL,
    observed_at TEXT,
    synced INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Monotonic Ordering & Deduplication
- Records are buffered with their original sensor capture timestamp (`observed_at`).
- When network reconnects, buffered observations are flushed in ascending temporal order (`ORDER BY id ASC`).
- The Spring Boot backend accepts batch payloads at `POST /api/devices/observations/batch` and idempotently deduplicates records using `(device_id, observed_at, metric_type)`.
