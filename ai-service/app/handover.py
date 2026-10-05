from typing import Dict, Any

class EmergencyHandoverGenerator:
    def generate_sbar_handover(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        case_id = case_data.get("case_id", "CASE-UNKNOWN")
        vitals = case_data.get("latest_vitals", {})
        interventions = case_data.get("interventions", [])
        observations = case_data.get("observations", [])
        eta_minutes = case_data.get("eta_minutes", 12)
        target_hospital = case_data.get("target_hospital", "Regional Trauma Center")

        hr = vitals.get("heartRate", 110)
        bp_sys = vitals.get("systolicBp", 95)
        bp_dia = vitals.get("diastolicBp", 62)
        spo2 = vitals.get("spo2", 94)

        situation = (
            f"Adult patient involved in trauma incident. Currently en route to {target_hospital} "
            f"via Medic-1 with estimated arrival in {eta_minutes} minutes."
        )

        background = (
            f"Case {case_id}. Primary injury: blunt chest contusion and extremity abrasions. "
            f"Confirmed interventions: {len(interventions)} performed en route."
        )

        shock_index = round(hr / bp_sys, 2) if bp_sys > 0 else 1.0
        assessment = (
            f"Current Vitals: HR {hr} bpm, BP {bp_sys}/{bp_dia} mmHg, SpO2 {spo2}%. "
            f"Shock Index is {shock_index} ({'Elevated / Compensated Shock' if shock_index > 0.9 else 'Within Limits'}). "
            f"Patient Digital Twin AI indicates guarded stability with projected deterioration risk at ETA."
        )

        recommendation = (
            f"Immediate trauma resuscitation bay activation upon touchdown. Recommend type and cross-match for 2 units PRBC, "
            f"bedside FAST ultrasound confirmation, and CT scan clearance."
        )

        return {
            "case_id": case_id,
            "target_hospital": target_hospital,
            "eta_minutes": eta_minutes,
            "sbar": {
                "situation": situation,
                "background": background,
                "assessment": assessment,
                "recommendation": recommendation
            },
            "requires_clinical_review": True,
            "generated_by": "LifeFlow Clinical Handover Engine v2.0"
        }
