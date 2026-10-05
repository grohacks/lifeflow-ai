# LifeFlow AI — Medical Device Integration

LifeFlow AI interfaces with 10 simulated ambulance medical devices. Telemetry is parsed, normalized, and mapped to standardized physiological parameters using IEEE 11073 nomenclature.

---

## 1. Supported Medical Devices & Channel Specification

| # | Device Type | Protocol / Format | Sampling Rate | Channels / Metrics Captured | IEEE 11073 MDC Identifier |
|---|---|---|---|---|---|
| 1 | **Multiparameter Patient Monitor** | Serial / HL7 Vitals | 1 Hz | Heart Rate (bpm), Systolic/Diastolic BP (mmHg), MAP (mmHg), SpO2 (%), Pulse Rate | `MDC_PULS_RATE_NON_INV`, `MDC_PRESS_BLD_NONINV_SYS`, `MDC_PULS_OXIM_SAT_O2` |
| 2 | **12-Lead Diagnostic Defibrillator** | Binary ECG Stream | Continuous (250 Hz simulated downsampled to 10 Hz) | Rhythm classification, ST elevation (mm), Shock counter, Pacing current (mA) | `MDC_ECG_ELEC_POTL`, `MDC_ECG_LEAD_II` |
| 3 | **Emergency Transport Ventilator** | RS-232 / CAN bus | 0.5 Hz | Peak Inspiratory Pressure (cmH2O), PEEP (cmH2O), Tidal Volume (mL), FiO2 (%), Resp Rate | `MDC_VENT_PRESS_AWAY`, `MDC_VENT_VOL_TIDAL` |
| 4 | **Smart Syringe / Infusion Pump** | Wi-Fi / MQTT | Event-based + 0.2 Hz | Drug name (Norepinephrine, Fentanyl), Infusion rate (mcg/kg/min or mL/h), Volume infused | `MDC_DRUG_INFUS_RATE`, `MDC_VOL_INFUS` |
| 5 | **Capnography (EtCO2) Monitor** | Optical IR Sensor | 1 Hz | End-tidal CO2 (mmHg), Respiration rate (bpm), Capnogram waveform slope | `MDC_CONC_AWAY_CO2_ET` |
| 6 | **Point-of-Care Ultrasound (POCUS)** | DICOM / Image | On-demand (1-3 min) | FAST exam protocol findings, pneumothorax marker, free fluid volume indicator | `MDC_US_SCAN` |
| 7 | **Blood Glucose Monitor (Glucometer)** | Bluetooth LE / NFC | Event-based (1-5 min) | Blood glucose level (mg/dL or mmol/L) | `MDC_CONC_GLU_UNDETERMINED` |
| 8 | **Continuous Core Thermometer** | Probe Sensor | 0.1 Hz | Tympanic / Esophageal temperature (°C or °F) | `MDC_TEMP_BODY` |
| 9 | **Non-Invasive Blood Pressure (NIBP)** | Oscillometric Cuff | Intermittent (3-5 min) | Systolic, Diastolic, Mean Arterial Pressure | `MDC_PRESS_BLD_NONINV` |
| 10 | **Pulse Oximeter (Standalone Backup)** | Optical Sensor | 1 Hz | Peripheral SpO2 (%), Perfusion Index (PI) | `MDC_PULS_OXIM_PERF_REL` |

---

## 2. Ingestion, Normalization & Deduplication

### 2.1 Unit Normalization
Raw inputs are automatically converted to standard clinical units:
- **Temperature**: If input unit is `°F`, value is converted via $C = (F - 32) \times \frac{5}{9}$.
- **Blood Glucose**: If input unit is `mmol/L`, value is converted via $\text{mg/dL} = \text{mmol/L} \times 18.0182$.
- **Blood Pressure**: If unit is `kPa`, value is converted via $\text{mmHg} = \text{kPa} \times 7.50062$.

### 2.2 Deduplication & Threshold Filtering
- Out-of-range sensor readings (e.g. Heart Rate < 20 or > 300 bpm, SpO2 > 100%) are rejected or assigned a low confidence flag (`confidence_score < 0.5`).
- Identical observation values arriving within the deduplication window (default 250 ms) are merged to conserve database storage and network bandwidth.
