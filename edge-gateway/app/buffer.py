import sqlite3
import json
import os
from typing import List, Dict, Any

DB_PATH = os.environ.get("EDGE_BUFFER_DB", "edge_buffer.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS offline_buffer (
        event_id TEXT PRIMARY KEY,
        case_id TEXT,
        ambulance_id INTEGER,
        device_uid TEXT,
        device_type TEXT,
        metric TEXT,
        value REAL,
        unit TEXT,
        source_timestamp TEXT,
        gateway_timestamp TEXT,
        quality TEXT,
        signal_quality REAL,
        provenance TEXT,
        device_status TEXT,
        battery_status INTEGER,
        calibration_status TEXT,
        sequence_number INTEGER,
        correlation_id TEXT,
        synced INTEGER DEFAULT 0
    )
    """)
    conn.commit()
    conn.close()

def insert_event(event: Dict[str, Any]):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR IGNORE INTO offline_buffer (
        event_id, case_id, ambulance_id, device_uid, device_type, metric, value, unit,
        source_timestamp, gateway_timestamp, quality, signal_quality, provenance,
        device_status, battery_status, calibration_status, sequence_number, correlation_id, synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        event.get("eventId"),
        event.get("patientCaseId"),
        event.get("ambulanceId"),
        event.get("deviceUid"),
        event.get("deviceType"),
        event.get("metric"),
        event.get("value"),
        event.get("unit"),
        event.get("sourceTimestamp"),
        event.get("gatewayTimestamp"),
        event.get("quality"),
        event.get("signalQuality"),
        event.get("provenance"),
        event.get("deviceStatus"),
        event.get("batteryStatus"),
        event.get("calibrationStatus"),
        event.get("sequenceNumber"),
        event.get("correlationId")
    ))
    conn.commit()
    conn.close()

def get_unsynced_events(limit: int = 100) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM offline_buffer WHERE synced = 0 ORDER BY sequence_number ASC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append({
            "eventId": r["event_id"],
            "patientCaseId": r["case_id"],
            "ambulanceId": r["ambulance_id"],
            "deviceUid": r["device_uid"],
            "deviceType": r["device_type"],
            "metric": r["metric"],
            "value": r["value"],
            "unit": r["unit"],
            "sourceTimestamp": r["source_timestamp"],
            "gatewayTimestamp": r["gateway_timestamp"],
            "quality": r["quality"],
            "signalQuality": r["signal_quality"],
            "provenance": r["provenance"],
            "deviceStatus": r["device_status"],
            "batteryStatus": r["battery_status"],
            "calibrationStatus": r["calibration_status"],
            "sequenceNumber": r["sequence_number"],
            "correlationId": r["correlation_id"]
        })
    conn.close()
    return results

def mark_events_synced(event_ids: List[str]):
    if not event_ids:
        return
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executemany("UPDATE offline_buffer SET synced = 1 WHERE event_id = ?", [(eid,) for eid in event_ids])
    conn.commit()
    conn.close()

def count_unsynced() -> int:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM offline_buffer WHERE synced = 0")
    count = cursor.fetchone()[0]
    conn.close()
    return count
