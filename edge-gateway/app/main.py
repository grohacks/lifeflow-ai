import os
import json
import uuid
import httpx
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from . import buffer

MQTT_HOST = os.environ.get("MQTT_HOST", "localhost")
MQTT_PORT = int(os.environ.get("MQTT_PORT", 1883))
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8080")

app = FastAPI(
    title="LifeFlow Edge Gateway",
    description="Ambulance Medical Device Gateway with Offline Buffering and Sync",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Edge State
edge_state = {
    "network_connected": True,
    "ambulance_id": 1,
    "buffered_count": 0,
    "last_sync_time": None
}

buffer.init_db()

class IngestObservationRequest(BaseModel):
    patientCaseId: str
    ambulanceId: Optional[int] = 1
    deviceId: Optional[int] = None
    deviceUid: str
    deviceType: str
    metric: str
    value: float
    unit: str
    quality: Optional[str] = "GOOD"
    signalQuality: Optional[float] = 1.0
    provenance: Optional[str] = "EDGE_ADAPTER"
    deviceStatus: Optional[str] = "CONNECTED"
    batteryStatus: Optional[int] = 95
    calibrationStatus: Optional[str] = "CALIBRATED"
    sequenceNumber: Optional[int] = 1
    correlationId: Optional[str] = None

@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "lifeflow-edge-gateway",
        "network": "CONNECTED" if edge_state["network_connected"] else "DISCONNECTED",
        "unsynced_buffer_count": buffer.count_unsynced()
    }

@app.get("/status")
def get_status():
    edge_state["buffered_count"] = buffer.count_unsynced()
    return edge_state

@app.post("/ingest")
async def ingest_observation(req: IngestObservationRequest):
    event_dict = req.dict()
    if not event_dict.get("eventId"):
        event_dict["eventId"] = str(uuid.uuid4())
    if not event_dict.get("sourceTimestamp"):
        event_dict["sourceTimestamp"] = datetime.now().isoformat()
    if not event_dict.get("gatewayTimestamp"):
        event_dict["gatewayTimestamp"] = datetime.now().isoformat()
    if not event_dict.get("correlationId"):
        event_dict["correlationId"] = str(uuid.uuid4())

    # Check connection status
    if edge_state["network_connected"]:
        # Attempt direct transmission to backend
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(f"{BACKEND_URL}/api/devices/observations", json=event_dict)
                if res.is_success:
                    return {"status": "TRANSMITTED_ONLINE", "eventId": event_dict["eventId"]}
        except Exception as e:
            # Fallback to buffer if network glitch
            buffer.insert_event(event_dict)
            return {"status": "BUFFERED_OFFLINE_FALLBACK", "eventId": event_dict["eventId"], "reason": str(e)}
    else:
        # Offline mode: buffer locally
        buffer.insert_event(event_dict)
        return {"status": "BUFFERED_OFFLINE", "eventId": event_dict["eventId"]}

@app.post("/network/toggle")
async def toggle_network(connected: bool):
    edge_state["network_connected"] = connected
    msg = "Network set to CONNECTED" if connected else "Network set to DISCONNECTED (Offline Mode Enabled)"

    if connected:
        # Trigger synchronization of buffered records
        sync_result = await drain_buffer_to_backend()
        return {"message": msg, "sync": sync_result}

    return {"message": msg, "unsynced_count": buffer.count_unsynced()}

async def drain_buffer_to_backend():
    unsynced = buffer.get_unsynced_events(limit=200)
    if not unsynced:
        return {"synced": 0, "status": "NO_BUFFERED_DATA"}

    payload = {
        "ambulanceId": edge_state["ambulance_id"],
        "correlationId": str(uuid.uuid4()),
        "observations": unsynced
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(f"{BACKEND_URL}/api/devices/sync", json=payload)
            if res.is_success:
                event_ids = [e["eventId"] for e in unsynced]
                buffer.mark_events_synced(event_ids)
                edge_state["last_sync_time"] = datetime.now().isoformat()
                return {"synced": len(event_ids), "status": "SYNCHRONIZED_SUCCESS"}
    except Exception as e:
        return {"synced": 0, "status": "SYNC_FAILED", "error": str(e)}

    return {"synced": 0, "status": "SYNC_FAILED"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8081, reload=True)
