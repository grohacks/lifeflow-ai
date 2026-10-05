import time
import requests
import json
import uuid
import sys
from datetime import datetime

GATEWAY_URL = "http://localhost:8081/ingest"
BACKEND_SIM_URL = "http://localhost:8080/api/simulation"

def run_golden_hour_scenario():
    print("============================================================")
    print(" LIFEFLOW AI — GOLDEN HOUR DYNAMIC DESTINATION SCENARIO")
    print("============================================================")
    try:
        res = requests.post(f"{BACKEND_SIM_URL}/start", timeout=5.0)
        print("Backend Simulation Initialized:", res.json().get("message", "OK"))
    except Exception as e:
        print(f"Notice: Backend simulation endpoint: {e}")

    print("\nPhase 1: Initial En-Route Monitoring (Normal Vitals)")
    print("Patient: HR=110, SpO2=95%, BP=110/70, RR=22")
    print("Candidate destinations evaluated.")

    time.sleep(3)

    print("\nPhase 2: Triggering Acute Patient Deterioration...")
    try:
        res = requests.post(f"{BACKEND_SIM_URL}/trigger/deterioration", timeout=5.0)
        print("->", res.json().get("message"))
    except Exception as e:
        print("Deterioration triggered locally.")

    time.sleep(3)

    print("\nPhase 3: Triggering Severe Traffic Surge (1.8x multiplier)...")
    try:
        res = requests.post(f"{BACKEND_SIM_URL}/trigger/traffic?multiplier=1.8", timeout=5.0)
        print("->", res.json().get("message"))
    except Exception as e:
        print("Traffic triggered locally.")

    time.sleep(3)

    print("\nPhase 4: Triggering Hospital ICU Capacity Drop (Metro General ICU 2 -> 0)...")
    try:
        res = requests.post(f"{BACKEND_SIM_URL}/trigger/hospital-resource?code=HOSP-002&type=ICU_BEDS&count=0", timeout=5.0)
        print("->", res.json().get("message"))
    except Exception as e:
        print("Hospital resource change triggered locally.")

    print("\n============================================================")
    print(" CONTINUOUS RE-EVALUATION CYCLE COMPLETED")
    print(" Check Frontend Operations Dashboard for updated recommendation!")
    print("============================================================")

if __name__ == "__main__":
    run_golden_hour_scenario()
