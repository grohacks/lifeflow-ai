import pytest
import os
from app import buffer

def test_sqlite_buffer(tmp_path):
    test_db = str(tmp_path / "test_buffer.db")
    buffer.DB_PATH = test_db
    buffer.init_db()

    assert buffer.count_unsynced() == 0

    event = {
        "eventId": "EVT-TEST-001",
        "patientCaseId": "CASE-TEST",
        "ambulanceId": 1,
        "deviceUid": "DEV-SPO2-001",
        "deviceType": "SPO2",
        "metric": "SPO2",
        "value": 95.0,
        "unit": "%",
        "sourceTimestamp": "2026-09-21T10:00:00Z",
        "gatewayTimestamp": "2026-09-21T10:00:01Z",
        "quality": "GOOD",
        "signalQuality": 0.98,
        "provenance": "SIM",
        "deviceStatus": "CONN",
        "batteryStatus": 90,
        "calibrationStatus": "CAL",
        "sequenceNumber": 1,
        "correlationId": "CORR-TEST"
    }

    buffer.insert_event(event)
    assert buffer.count_unsynced() == 1

    unsynced = buffer.get_unsynced_events()
    assert len(unsynced) == 1
    assert unsynced[0]["eventId"] == "EVT-TEST-001"

    buffer.mark_events_synced(["EVT-TEST-001"])
    assert buffer.count_unsynced() == 0
