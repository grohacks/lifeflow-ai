import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Grid, Button, IconButton,
  FormControl, InputLabel, Select, MenuItem, LinearProgress, Stack,
  Tooltip, Alert, Divider, CircularProgress, Tabs, Tab, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, AreaChart, Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ScienceIcon from '@mui/icons-material/Science';
import PsychologyIcon from '@mui/icons-material/Psychology';
import NavigationIcon from '@mui/icons-material/Navigation';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import AirIcon from '@mui/icons-material/Air';
import TrafficIcon from '@mui/icons-material/Traffic';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LayersIcon from '@mui/icons-material/Layers';
import BarChartIcon from '@mui/icons-material/BarChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import TimelineIcon from '@mui/icons-material/Timeline';
import TableChartIcon from '@mui/icons-material/TableChart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { decisionApi, patientApi, hospitalApi, preAlertApi } from '../services/api';
import { wsService } from '../services/websocket';
import { Recommendation, Hospital } from '../types';
import '../leaflet-custom.css';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Scene Marker Pin
const createSceneIcon = () => L.divIcon({
  html: `
    <div style="
      background: #d29922;
      border: 2px solid #ffffff;
      border-radius: 6px;
      padding: 3px 6px;
      display: flex;
      align-items: center;
      gap: 3px;
      box-shadow: 0 0 10px rgba(210, 153, 34, 0.85);
      color: #ffffff;
      font-weight: 700;
      font-size: 11px;
      white-space: nowrap;
    ">
      📍 <span>Scene</span>
    </div>
  `,
  className: 'live-scene-pin',
  iconSize: [80, 24],
  iconAnchor: [40, 12],
});

// Hospital Marker Pin with Selection status
const createHospitalPin = (name: string, rank: number, isSelected: boolean, isFeasible: boolean) => L.divIcon({
  html: `
    <div style="
      background: ${!isFeasible ? '#6e7681' : isSelected ? '#3fb950' : rank === 1 ? '#238636' : '#1f6feb'};
      border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
      border-radius: 6px;
      padding: 3px 6px;
      display: flex;
      align-items: center;
      gap: 3px;
      box-shadow: 0 0 12px ${isSelected ? 'rgba(63, 185, 80, 0.95)' : rank === 1 ? 'rgba(35, 134, 54, 0.85)' : 'rgba(31, 111, 235, 0.7)'};
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
      white-space: nowrap;
    ">
      🏥 <span>#${rank} ${name.split(' ')[0]}</span> ${isSelected ? '★' : ''}
    </div>
  `,
  className: 'hosp-map-pin',
  iconSize: [120, 28],
  iconAnchor: [60, 14],
});

type ConditionScenario = 'BASELINE' | 'HEMORRHAGIC' | 'STEMI' | 'NEUROTRAUMA' | 'RESPIRATORY';
type TrafficScenario = 'NORMAL' | 'GREEN_WAVE' | 'GRIDLOCK';
type AnalyticsTab = 'RADAR' | 'BARS' | 'GOLDEN_HOUR' | 'MATRIX';

// Realistic Bengaluru Metro Coordinates for Regional Network Hospitals
export const LOCAL_HOSPITAL_COORDS: Record<string, [number, number]> = {
  'HOSP-001': [12.9716, 77.5946], // St. Jude Comprehensive Trauma Center (~5.4 km)
  'HOSP-002': [12.9345, 77.6101], // Metro General Hospital (~2.1 km)
  'HOSP-003': [12.9592, 77.6974], // Mission Bay Medical Center (~8.3 km)
  'HOSP-004': [12.9141, 77.6358], // Hope Valley Medical Center (~3.8 km)
  'HOSP-005': [13.0358, 77.5970], // Northshore Community Hospital (~12.2 km)
  'HOSP-APX-5417': [12.9810, 77.6320], // Apex Regional Trauma & Specialty Center (~5.8 km)
  'HOSP-ED-5433': [12.9800, 77.6000], // Emergency Branch North (~5.6 km)
};

export const getEffectiveHospitalCoords = (
  hosp: any,
  fallbackLat: number = 12.981,
  fallbackLng: number = 77.632
): [number, number] => {
  if (!hosp) return [fallbackLat, fallbackLng];
  const code = hosp.hospitalCode;
  if (code && LOCAL_HOSPITAL_COORDS[code]) {
    return LOCAL_HOSPITAL_COORDS[code];
  }
  const name = (hosp.name || hosp.hospitalName || '').toLowerCase();
  if (name.includes('apex')) return LOCAL_HOSPITAL_COORDS['HOSP-APX-5417'];
  if (name.includes('jude')) return LOCAL_HOSPITAL_COORDS['HOSP-001'];
  if (name.includes('metro')) return LOCAL_HOSPITAL_COORDS['HOSP-002'];
  if (name.includes('mission')) return LOCAL_HOSPITAL_COORDS['HOSP-003'];
  if (name.includes('hope')) return LOCAL_HOSPITAL_COORDS['HOSP-004'];
  if (name.includes('northshore')) return LOCAL_HOSPITAL_COORDS['HOSP-005'];

  const lat = hosp.latitude ?? fallbackLat;
  const lng = hosp.longitude ?? fallbackLng;
  if (Math.abs(lat - fallbackLat) > 2.0 || Math.abs(lng - fallbackLng) > 2.0) {
    const id = hosp.id || hosp.hospitalId || 1;
    const angle = (id * 137.5) * (Math.PI / 180);
    const radius = 0.03 + (id % 5) * 0.015;
    return [fallbackLat + radius * Math.sin(angle), fallbackLng + radius * Math.cos(angle)];
  }
  return [lat, lng];
};

export const calculateHaversineDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

export const DestinationEvaluationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCaseId = searchParams.get('caseId');
  const urlLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const urlLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
  const urlHospitalId = searchParams.get('hospitalId') ? parseInt(searchParams.get('hospitalId')!, 10) : null;
  const fromDispatch = searchParams.get('fromDispatch') === 'true';

  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(urlCaseId || 'CASE-2026-001');
  const [patientTwin, setPatientTwin] = useState<any>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // User-selected destination (paramedic decision autonomy)
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(
    urlHospitalId ? Number(urlHospitalId) : null
  );

  // Analytics visualization tab
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('RADAR');

  // What-If Simulation State
  const [simCondition, setSimCondition] = useState<ConditionScenario>('BASELINE');
  const [simTraffic, setSimTraffic] = useState<TrafficScenario>('NORMAL');
  const [simDivertedIds, setSimDivertedIds] = useState<number[]>([]);
  const [isSimActive, setIsSimActive] = useState(false);

  const caseId = selectedCaseId;

  // Scene Coordinates (defaults to Bengaluru incident scene)
  const sceneLat = urlLat || patientTwin?.incidentLatitude || 12.9352;
  const sceneLng = urlLng || patientTwin?.incidentLongitude || 77.6245;
  const scenePos: [number, number] = [sceneLat, sceneLng];

  // Sync with URL caseId
  useEffect(() => {
    if (urlCaseId && urlCaseId !== selectedCaseId) {
      setSelectedCaseId(urlCaseId);
    }
  }, [urlCaseId]);

  // Load active patient cases
  useEffect(() => {
    patientApi.getActiveCases().then((cases) => {
      if (cases && cases.length > 0) {
        setActiveCases(cases);
        if (!urlCaseId) {
          setSelectedCaseId(cases[0].caseId);
          setSearchParams({ caseId: cases[0].caseId }, { replace: true });
        }
      }
    }).catch((err) => console.warn('Could not load active cases:', err));
  }, []);

  // Load recommendation & hospitals for selected case
  useEffect(() => {
    loadRecommendation();
    hospitalApi.getAll().then((data) => setHospitals(data || [])).catch(() => {});
    patientApi.getTwin(caseId).then((data) => setPatientTwin(data)).catch(() => {});

    const unsubRec = wsService.subscribe(`/topic/recommendations/${caseId}`, (data) => {
      setRecommendation(data);
      if (data?.selectedHospitalId && !urlHospitalId) {
        setSelectedHospitalId(data.selectedHospitalId);
      }
    });
    const unsubTwin = wsService.subscribe(`/topic/patient-twin/${caseId}`, (data) => {
      setPatientTwin(data);
    });

    return () => {
      unsubRec();
      unsubTwin();
    };
  }, [caseId]);

  const loadRecommendation = async () => {
    setLoading(true);
    try {
      let data = await decisionApi.getActiveRecommendation(caseId).catch(() => null);
      if (!data) {
        data = await decisionApi.evaluate(caseId).catch(() => null);
      }
      setRecommendation(data);
      if (data?.selectedHospitalId && !urlHospitalId) {
        setSelectedHospitalId(data.selectedHospitalId);
      }
    } catch (e) {
      console.error('Error loading recommendation:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualReevaluate = async () => {
    setLoading(true);
    try {
      const data = await decisionApi.evaluate(caseId);
      setRecommendation(data);
      if (data?.selectedHospitalId && !urlHospitalId) {
        setSelectedHospitalId(data.selectedHospitalId);
      }
      setIsSimActive(false);
      setSimCondition('BASELINE');
      setSimTraffic('NORMAL');
      setSimDivertedIds([]);
    } catch (e: any) {
      alert('Error re-evaluating: ' + (e?.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to extract resource counts from Hospital object
  const getResourceCount = (h: Hospital | undefined, type: string): { available: number; total: number } => {
    if (!h || !h.resources) return { available: 0, total: 0 };
    const res = h.resources.find((r: any) => r.resourceType === type);
    return res ? { available: res.availableCount || 0, total: res.totalCapacity || 0 } : { available: 0, total: 0 };
  };

  // Toggle hospital simulated divert
  const toggleDivert = (hospId: number) => {
    setIsSimActive(true);
    setSimDivertedIds((prev) =>
      prev.includes(hospId) ? prev.filter((id) => id !== hospId) : [...prev, hospId]
    );
  };

  // Reset simulator back to live baseline
  const handleResetSimulation = () => {
    setIsSimActive(false);
    setSimCondition('BASELINE');
    setSimTraffic('NORMAL');
    setSimDivertedIds([]);
    if (recommendation?.selectedHospitalId && !urlHospitalId) {
      setSelectedHospitalId(recommendation.selectedHospitalId);
    }
  };

  // Dynamic Candidate Evaluation Engine
  const evaluatedCandidates = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return [];

    const candidatesList = hospitals.map((h) => {
      const backendCand = recommendation?.candidates?.find((c) => c.hospitalId === h.id);

      // Distance calculation from scene using local metro coordinates
      const [effLat, effLng] = getEffectiveHospitalCoords(h, sceneLat, sceneLng);
      const baseDistanceKm = backendCand?.distanceKm && backendCand.distanceKm < 50
        ? backendCand.distanceKm
        : calculateHaversineDistanceKm(sceneLat, sceneLng, effLat, effLng);

      let baseEta = Math.max(3, Math.round(baseDistanceKm * 1.6 + 2));
      if (backendCand && backendCand.etaMinutes && backendCand.etaMinutes < 60) {
        baseEta = backendCand.etaMinutes;
      }

      // Live Resource Metrics
      const icu = getResourceCount(h, 'ICU_BEDS');
      const ed = getResourceCount(h, 'ED_BEDS');
      const ot = getResourceCount(h, 'OT_THEATRES');
      const blood = getResourceCount(h, 'BLOOD_BANK_UNITS');
      const vent = getResourceCount(h, 'VENTILATORS');
      const surgeon = getResourceCount(h, 'TRAUMA_SURGEON');
      const cardio = getResourceCount(h, 'CARDIOLOGIST');
      const neuro = getResourceCount(h, 'NEUROLOGIST');
      const ct = getResourceCount(h, 'CT_SCANNERS');

      let clinicalFit = backendCand?.clinicalFitScore ?? (h.traumaLevel === 'LEVEL_1' ? 100 : 85);
      let futureResource = backendCand?.futureResourceScore ?? Math.min(100, Math.round((icu.available / Math.max(1, icu.total)) * 100 + 40));
      let transportScore = backendCand?.transportUtilityScore ?? Math.max(0, Math.round(100 - baseDistanceKm * 8));
      let penalty = backendCand?.uncertaintyPenalty ?? 5;

      let feasibility = 'FEASIBLE';
      const constraintViolations: string[] = [];
      const positiveDrivers: string[] = [];

      if (h.traumaLevel === 'LEVEL_1') positiveDrivers.push('Level 1 Comprehensive Trauma Center');
      if (h.hasCathLab) positiveDrivers.push('24/7 PCI Cath Lab Ready');
      if (h.hasStrokeCenter) positiveDrivers.push('Certified Comprehensive Stroke Center');
      if (icu.available > 0) positiveDrivers.push(`${icu.available} ICU Beds online`);
      if (ot.available > 0) positiveDrivers.push(`${ot.available} OT Suites on standby`);

      // 1. Condition Shifts
      if (simCondition === 'HEMORRHAGIC') {
        if (blood.available > 30) {
          positiveDrivers.push(`Massive Transfusion Protocol ready (${blood.available} units)`);
          clinicalFit = Math.min(100, clinicalFit + 10);
        } else if (blood.available < 10) {
          constraintViolations.push('Limited Blood Bank Units for Massive Transfusion');
          clinicalFit = Math.max(20, clinicalFit - 30);
        }
        if (h.traumaLevel !== 'LEVEL_1') {
          constraintViolations.push('Level 1 Trauma Center preferred for exsanguinating trauma');
          clinicalFit = Math.max(30, clinicalFit - 25);
        }
      } else if (simCondition === 'STEMI') {
        if (!h.hasCathLab) {
          feasibility = 'INFEASIBLE';
          constraintViolations.push('CRITICAL: No 24/7 Cath Lab / PCI capability');
          clinicalFit = 0;
        } else {
          positiveDrivers.push('Door-to-Balloon PCI Cath Lab team active');
          clinicalFit = 100;
        }
      } else if (simCondition === 'NEUROTRAUMA') {
        if (ct.available === 0 && ct.total > 0) {
          feasibility = 'INFEASIBLE';
          constraintViolations.push('CRITICAL: Emergency Head CT Scanner offline');
          clinicalFit = 10;
        } else if (neuro.available === 0 && h.traumaLevel !== 'LEVEL_1') {
          constraintViolations.push('On-call Neurologist unavailable');
          clinicalFit = Math.max(30, clinicalFit - 35);
        } else {
          positiveDrivers.push('Neurosurgical Trauma Team & Rapid CT ready');
          clinicalFit = 100;
        }
      } else if (simCondition === 'RESPIRATORY') {
        if (vent.available === 0) {
          constraintViolations.push('All Mechanical Ventilators currently allocated');
          futureResource = Math.max(10, futureResource - 50);
        } else {
          positiveDrivers.push(`${vent.available} Critical Care Ventilators online`);
        }
      }

      // 2. Traffic Shifts
      let finalEta = baseEta;
      if (simTraffic === 'GREEN_WAVE') {
        finalEta = Math.max(2, Math.round(baseEta * 0.65));
        transportScore = Math.min(100, transportScore + 15);
        positiveDrivers.push('Green Wave Corridor: -35% ETA signal preemption');
      } else if (simTraffic === 'GRIDLOCK') {
        finalEta = Math.round(baseEta * 1.55);
        transportScore = Math.max(0, transportScore - 25);
        constraintViolations.push('Heavy corridor traffic congestion');
      }

      // 3. ED Divert Shifts
      const isDiverted = simDivertedIds.includes(h.id) || h.isDiverting;
      if (isDiverted) {
        feasibility = 'INFEASIBLE';
        constraintViolations.push('SIMULATED ED DIVERT: 100% ICU Bed saturation');
        futureResource = 0;
        clinicalFit = Math.max(10, clinicalFit - 40);
      }

      // Composite Suitability Score (0-100)
      // When NOT in simulation mode, respect the backend AI Decision Engine recommendation score
      let suitability: number;
      if (!isSimActive && backendCand?.overallSuitabilityScore != null) {
        suitability = Math.round(backendCand.overallSuitabilityScore);
      } else {
        suitability = Math.round(
          clinicalFit * 0.30 +
          futureResource * 0.25 +
          transportScore * 0.25 +
          (h.traumaLevel === 'LEVEL_1' ? 10 : 5) -
          (feasibility === 'INFEASIBLE' ? 45 : penalty)
        );
        suitability = Math.max(5, Math.min(99, suitability));
      }

      // Golden Hour Survival Probability calculation (decay over travel minutes)
      const survivalProb = Math.max(15, Math.round(100 * Math.exp(-0.012 * finalEta)));

      const isBackendRecommended = backendCand?.isRecommended === true || h.id === recommendation?.selectedHospitalId;

      return {
        hospital: h,
        hospitalId: h.id,
        hospitalName: h.name,
        hospitalCode: h.hospitalCode,
        latitude: effLat,
        longitude: effLng,
        traumaLevel: h.traumaLevel,
        distanceKm: baseDistanceKm,
        etaMinutes: finalEta,
        clinicalFitScore: clinicalFit,
        futureResourceScore: futureResource,
        transportUtilityScore: transportScore,
        uncertaintyPenalty: penalty,
        suitabilityScore: suitability,
        survivalProbability: survivalProb,
        feasibility,
        isDiverted,
        resources: { icu, ed, ot, blood, vent, surgeon, cardio, neuro, ct },
        positiveDrivers,
        constraintViolations,
        isRecommended: isBackendRecommended,
        rankOrder: backendCand?.rankOrder ?? 99,
        backendRankOrder: backendCand?.rankOrder,
        isBackendRecommended,
      };
    });

    // Sorting:
    // If NOT simulating, sort by backend AI recommendation rankOrder primarily
    if (!isSimActive && recommendation?.candidates && recommendation.candidates.length > 0) {
      candidatesList.sort((a, b) => {
        if (a.rankOrder !== b.rankOrder) {
          return a.rankOrder - b.rankOrder;
        }
        return b.suitabilityScore - a.suitabilityScore;
      });
    } else {
      // In What-If simulation mode: sort feasible first, then highest recalculated suitability score
      candidatesList.sort((a, b) => {
        if (a.feasibility === 'FEASIBLE' && b.feasibility !== 'FEASIBLE') return -1;
        if (a.feasibility !== 'FEASIBLE' && b.feasibility === 'FEASIBLE') return 1;
        return b.suitabilityScore - a.suitabilityScore;
      });
    }

    return candidatesList.map((c, idx) => ({
      ...c,
      rankOrder: (!isSimActive && c.backendRankOrder != null) ? c.backendRankOrder : (idx + 1),
      isRecommended: !isSimActive
        ? (c.isBackendRecommended || (recommendation?.selectedHospitalId ? c.hospitalId === recommendation.selectedHospitalId : idx === 0))
        : (idx === 0 && c.feasibility === 'FEASIBLE')
    }));
  }, [hospitals, recommendation, simCondition, simTraffic, simDivertedIds, sceneLat, sceneLng, isSimActive]);

  // Set default selection to recommendation target or top candidate if unselected
  useEffect(() => {
    if (urlHospitalId) {
      setSelectedHospitalId(Number(urlHospitalId));
    } else if (recommendation?.selectedHospitalId) {
      setSelectedHospitalId(recommendation.selectedHospitalId);
    } else if (evaluatedCandidates.length > 0 && selectedHospitalId === null) {
      const best = evaluatedCandidates.find((c) => c.isRecommended) || evaluatedCandidates[0];
      setSelectedHospitalId(best.hospitalId);
    }
  }, [recommendation?.selectedHospitalId, urlHospitalId, evaluatedCandidates.length]);

  // Active chosen hospital
  const chosenCandidate = evaluatedCandidates.find((c) => c.hospitalId === selectedHospitalId) || evaluatedCandidates[0];
  const topCandidate = evaluatedCandidates.find((c) => c.isRecommended) || evaluatedCandidates[0];

  // Dispatch Pre-Alert to chosen hospital
  const handleConfirmAndDispatch = async () => {
    if (!chosenCandidate) return;
    setActionLoading(chosenCandidate.hospitalId);
    try {
      await preAlertApi.recordDecision({
        caseId,
        selectedHospitalId: chosenCandidate.hospitalId,
        decisionType: chosenCandidate.isRecommended ? 'ACCEPT' : 'OVERRIDE',
        reason: chosenCandidate.isRecommended
          ? `Paramedic confirmed AI #1 recommendation (${chosenCandidate.hospitalName}) based on ${chosenCandidate.suitabilityScore}/100 suitability and ${chosenCandidate.etaMinutes}m ETA.`
          : `Paramedic clinical override: Selected #${chosenCandidate.rankOrder} ${chosenCandidate.hospitalName} over #${topCandidate?.rankOrder} ${topCandidate?.hospitalName}. Reason: Clinical preference & resource allocation.`
      }).catch((e) => console.warn('Audit decision notice:', e));

      navigate(`/prealert?caseId=${caseId}&hospitalId=${chosenCandidate.hospitalId}&lat=${sceneLat}&lng=${sceneLng}`);
    } catch (e: any) {
      alert('Failed to dispatch pre-alert: ' + (e?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  // Recharts Data Prep
  // 1. Radar Chart Data (Top 3 Candidates compared across 5 dimensions)
  const radarData = useMemo(() => {
    const top3 = evaluatedCandidates.slice(0, 3);
    const metrics = [
      { key: 'clinicalFitScore', name: 'Clinical Fit' },
      { key: 'futureResourceScore', name: 'Bed & Capacity' },
      { key: 'transportUtilityScore', name: 'Transit Speed' },
      {
        key: 'surgicalReadiness',
        name: 'Surgical Readiness',
        calc: (c: any) => Math.min(100, (c.resources.ot.available * 25) + (c.resources.surgeon.available * 25))
      },
      {
        key: 'bloodReserves',
        name: 'Blood Reserves',
        calc: (c: any) => Math.min(100, Math.round((c.resources.blood.available / 60) * 100))
      }
    ];

    return metrics.map((m) => {
      const row: any = { metric: m.name };
      top3.forEach((cand, idx) => {
        row[`cand_${idx}`] = m.calc ? m.calc(cand) : cand[m.key];
      });
      return row;
    });
  }, [evaluatedCandidates]);

  // 2. Bar Chart Data (Suitability Breakdown across all regional candidates)
  const barData = useMemo(() => {
    return evaluatedCandidates.slice(0, 6).map((c) => ({
      name: c.hospitalName.split(' ')[0],
      suitability: c.suitabilityScore,
      clinicalFit: c.clinicalFitScore,
      capacity: c.futureResourceScore,
      transport: c.transportUtilityScore,
      eta: c.etaMinutes,
      isChosen: c.hospitalId === chosenCandidate?.hospitalId
    }));
  }, [evaluatedCandidates, chosenCandidate]);

  // 3. Golden Hour Survival Probability Curve Data
  const goldenHourData = useMemo(() => {
    // Generate time series points from 0 to 45 minutes
    const points = [];
    for (let t = 0; t <= 40; t += 2) {
      const prob = Math.round(100 * Math.exp(-0.012 * t));
      points.push({
        minute: t,
        survivalProbability: prob,
        label: `${t}m: ${prob}%`
      });
    }
    return points;
  }, []);

  return (
    <Box sx={{ flexGrow: 1, pb: 6 }}>
      {/* Top Banner: Navigation, Case Info, and Triage Priority */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PsychologyIcon sx={{ color: '#58a6ff', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              AI Destination Decision Matrix & Scenario Simulator
            </Typography>
            <Chip
              label="MCDA ENGINE v2.4"
              size="small"
              sx={{ backgroundColor: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', border: '1px solid #1f6feb', fontWeight: 700 }}
            />
            {isSimActive && (
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                label="SIMULATION ACTIVE"
                size="small"
                sx={{ backgroundColor: '#8957e5', color: '#ffffff', fontWeight: 800 }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.3 }}>
            Objective Multi-Facility Benchmarking • Golden Hour Prognosis • Autonomous Clinical Decision
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Patient Selector */}
          {activeCases.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel sx={{ color: '#58a6ff', fontSize: 13, fontWeight: 700 }}>Active Patient</InputLabel>
              <Select
                value={caseId}
                label="Active Patient"
                onChange={(e) => {
                  const newId = e.target.value as string;
                  setSelectedCaseId(newId);
                  setSearchParams({ caseId: newId });
                }}
                sx={{
                  backgroundColor: '#161b22',
                  color: '#f0f6fc',
                  fontSize: 13,
                  fontWeight: 700,
                  height: 38,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#58a6ff' }
                }}
              >
                {activeCases.map((c) => (
                  <MenuItem key={c.caseId} value={c.caseId}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={c.triageCategory || 'RED'}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 10,
                          fontWeight: 800,
                          backgroundColor: c.triageCategory === 'YELLOW' ? 'rgba(210, 153, 34, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                          color: c.triageCategory === 'YELLOW' ? '#d29922' : '#f85149'
                        }}
                      />
                      <strong style={{ color: '#58a6ff' }}>{c.caseId}</strong>
                      <span style={{ color: '#8b949e', fontSize: 12 }}>
                        {c.patientIdentifier || c.fullName || 'Trauma Patient'}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleManualReevaluate}
            disabled={loading}
            sx={{ borderColor: '#30363d', color: '#58a6ff', textTransform: 'none', fontWeight: 600 }}
          >
            {loading ? 'Evaluating...' : 'Re-Evaluate Network'}
          </Button>

          {/* Primary Action Button: Dispatch to Chosen Hospital */}
          {chosenCandidate && (
            <Button
              variant="contained"
              color="success"
              startIcon={<NavigationIcon />}
              onClick={handleConfirmAndDispatch}
              disabled={actionLoading !== null}
              sx={{
                fontWeight: 800,
                backgroundColor: chosenCandidate.isRecommended ? '#238636' : '#1f6feb',
                '&:hover': { backgroundColor: chosenCandidate.isRecommended ? '#2ea043' : '#388bfd' },
                textTransform: 'none',
                boxShadow: '0 0 12px rgba(35, 134, 54, 0.5)'
              }}
            >
              {actionLoading === chosenCandidate.hospitalId ? (
                <CircularProgress size={18} sx={{ color: '#fff' }} />
              ) : (
                `🚑 Transmit Pre-Alert to ${chosenCandidate.hospitalName.split(' ')[0]} (${chosenCandidate.etaMinutes}m)`
              )}
            </Button>
          )}
        </Stack>
      </Box>

      {/* On-Scene Patient Boarded Alert Notice */}
      {fromDispatch && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon fontSize="inherit" />}
          sx={{
            mb: 2.5,
            backgroundColor: 'rgba(35, 134, 54, 0.15)',
            color: '#3fb950',
            border: '1px solid #238636',
            fontWeight: 600,
            borderRadius: 2
          }}
        >
          🚑 <strong>Patient Successfully Boarded!</strong> Explore the comparative analytics below. LifeFlow AI has calculated suitability scores across all facilities, but you have full autonomy to select any hospital.
        </Alert>
      )}

      {/* Patient Triage & Vitals Telemetry HUD */}
      <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            {/* Case Info */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <MonitorHeartIcon sx={{ color: '#f85149', fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                  {caseId} — Diagnostic Telemetry
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.8rem' }}>
                📍 Scene Origin: <strong>{sceneLat.toFixed(4)}, {sceneLng.toFixed(4)}</strong> (Koramangala/Halasuru Corridor)
              </Typography>
              <Typography variant="body2" sx={{ color: '#c9d1d9', fontSize: '0.8rem', mt: 0.4 }}>
                Diagnostic Impression: <strong>{patientTwin?.initialImpression || 'Severe Polytrauma, Hemorrhagic Risk, Shock Index 1.04'}</strong>
              </Typography>
            </Grid>

            {/* Live Vitals Snapshot */}
            <Grid item xs={12} md={5}>
              <Grid container spacing={1}>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontSize: '0.68rem' }}>HEART RATE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#f85149' }}>
                      {patientTwin?.heartRate ? Math.round(patientTwin.heartRate) : 112} <span style={{ fontSize: '0.65rem' }}>bpm</span>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontSize: '0.68rem' }}>SPO2</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#388bfd' }}>
                      {patientTwin?.spo2 ? Math.round(patientTwin.spo2) : 93} <span style={{ fontSize: '0.65rem' }}>%</span>
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontSize: '0.68rem' }}>BP</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#d29922' }}>
                      {patientTwin?.systolicBp ? `${Math.round(patientTwin.systolicBp)}/68` : '108/70'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontSize: '0.68rem' }}>RESP. RATE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#3fb950' }}>
                      {patientTwin?.respiratoryRate ? Math.round(patientTwin.respiratoryRate) : 24} <span style={{ fontSize: '0.65rem' }}>/min</span>
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Triage & Severity Status */}
            <Grid item xs={12} md={3} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Chip
                label="TRIAGE: RED (PRIORITY 1 RESUSCITATION)"
                sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#f85149', border: '1px solid #f85149', fontWeight: 800, mb: 0.5 }}
              />
              <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                Golden Hour Survival Window: ~45 min
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* AI EXECUTIVE SUMMARY & CLINICAL RATIONALE */}
      <Card sx={{ backgroundColor: '#161b22', border: '1px solid #1f6feb', mb: 3, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.2, backgroundColor: 'rgba(31, 111, 235, 0.15)', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#58a6ff', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              AI Clinical Reasoning & Facility Benchmark Summary
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip
              label={`Currently Selected: ${chosenCandidate?.hospitalName}`}
              size="small"
              sx={{ backgroundColor: '#238636', color: '#fff', fontWeight: 700 }}
            />
            {chosenCandidate?.hospitalId !== topCandidate?.hospitalId && (
              <Chip
                label="MANUAL OVERRIDE ACTIVE"
                size="small"
                sx={{ backgroundColor: '#d29922', color: '#fff', fontWeight: 800 }}
              />
            )}
          </Stack>
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="body1" sx={{ color: '#f0f6fc', lineHeight: 1.6, mb: 1.5 }}>
            {recommendation?.summaryReason ? (
              recommendation.summaryReason
            ) : (
              `LifeFlow AI evaluated all regional trauma centers based on patient ${caseId}'s physiological status. ` +
              `${topCandidate?.hospitalName} is ranked #1 with a suitability score of ${topCandidate?.suitabilityScore}/100. ` +
              `It offers a Level 1 trauma bay within a ${topCandidate?.etaMinutes}-minute transit corridor with ` +
              `${topCandidate?.resources.icu.available} ICU beds and ${topCandidate?.resources.ot.available} surgical suites on immediate standby.`
            )}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>#1 AI RECOMMENDATION</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#3fb950', mt: 0.5 }}>
                  {topCandidate?.hospitalName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                  Score: {topCandidate?.suitabilityScore}/100 • ETA: {topCandidate?.etaMinutes}m
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>FASTEST ARRIVAL</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#58a6ff', mt: 0.5 }}>
                  {evaluatedCandidates.reduce((min, c) => c.etaMinutes < min.etaMinutes ? c : min, evaluatedCandidates[0])?.hospitalName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                  Transit: {evaluatedCandidates.reduce((min, c) => c.etaMinutes < min.etaMinutes ? c : min, evaluatedCandidates[0])?.etaMinutes}m ({evaluatedCandidates.reduce((min, c) => c.etaMinutes < min.etaMinutes ? c : min, evaluatedCandidates[0])?.distanceKm} km)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>SURGICAL & ICU READINESS</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#bc8cff', mt: 0.5 }}>
                  {evaluatedCandidates.reduce((max, c) => c.resources.ot.available > max.resources.ot.available ? c : max, evaluatedCandidates[0])?.hospitalName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                  {evaluatedCandidates.reduce((max, c) => c.resources.ot.available > max.resources.ot.available ? c : max, evaluatedCandidates[0])?.resources.ot.available} OT Suites & {evaluatedCandidates.reduce((max, c) => c.resources.ot.available > max.resources.ot.available ? c : max, evaluatedCandidates[0])?.resources.icu.available} ICU Beds Free
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>GOLDEN HOUR PROGNOSIS</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f0883e', mt: 0.5 }}>
                  {chosenCandidate?.survivalProbability}% Survival Window
                </Typography>
                <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                  At {chosenCandidate?.etaMinutes} min arrival window
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* INTERACTIVE "WHAT-IF" AI SCENARIO SIMULATOR PANEL */}
      <Card sx={{ backgroundColor: '#161b22', border: '2px solid #8957e5', mb: 3, borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ backgroundColor: 'rgba(137, 87, 229, 0.15)', px: 2.5, py: 1.2, borderBottom: '1px solid rgba(137, 87, 229, 0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScienceIcon sx={{ color: '#bc8cff', fontSize: 24 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              Interactive "What-If" AI Scenario Simulator & Stress Tester
            </Typography>
            <Chip label="TEST CLINICAL SCENARIOS" size="small" sx={{ backgroundColor: '#8957e5', color: '#fff', fontWeight: 700, fontSize: '0.68rem' }} />
          </Box>
          {isSimActive && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleResetSimulation}
              sx={{ color: '#bc8cff', borderColor: '#8957e5', py: 0.2, textTransform: 'none', fontWeight: 700 }}
            >
              Reset to Live Baseline
            </Button>
          )}
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2.5}>
            {/* Control 1: Clinical Condition Shift */}
            <Grid item xs={12} md={5}>
              <Typography variant="caption" sx={{ color: '#bc8cff', fontWeight: 800, display: 'block', mb: 0.8 }}>
                1. SIMULATE PATIENT CONDITION DETERIORATION:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="🩺 Baseline Polytrauma"
                  clickable
                  onClick={() => { setSimCondition('BASELINE'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simCondition === 'BASELINE' ? '#1f6feb' : '#21262d',
                    color: simCondition === 'BASELINE' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
                <Chip
                  label="🩸 Massive Hemorrhage"
                  clickable
                  onClick={() => { setSimCondition('HEMORRHAGIC'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simCondition === 'HEMORRHAGIC' ? '#da3633' : '#21262d',
                    color: simCondition === 'HEMORRHAGIC' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
                <Chip
                  label="🫀 Acute STEMI / Arrest"
                  clickable
                  onClick={() => { setSimCondition('STEMI'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simCondition === 'STEMI' ? '#f0883e' : '#21262d',
                    color: simCondition === 'STEMI' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
                <Chip
                  label="🧠 Severe Neurotrauma (GCS<8)"
                  clickable
                  onClick={() => { setSimCondition('NEUROTRAUMA'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simCondition === 'NEUROTRAUMA' ? '#8957e5' : '#21262d',
                    color: simCondition === 'NEUROTRAUMA' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
                <Chip
                  label="🫁 Respiratory Failure (ARDS)"
                  clickable
                  onClick={() => { setSimCondition('RESPIRATORY'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simCondition === 'RESPIRATORY' ? '#238636' : '#21262d',
                    color: simCondition === 'RESPIRATORY' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
              </Box>
            </Grid>

            {/* Control 2: Traffic & Corridor Priority */}
            <Grid item xs={12} md={4}>
              <Typography variant="caption" sx={{ color: '#58a6ff', fontWeight: 800, display: 'block', mb: 0.8 }}>
                2. SIMULATE TRAFFIC & TRANSIT CORRIDOR:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<TrafficIcon sx={{ fontSize: '16px !important' }} />}
                  label="🟡 Standard Traffic"
                  clickable
                  onClick={() => { setSimTraffic('NORMAL'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simTraffic === 'NORMAL' ? '#d29922' : '#21262d',
                    color: simTraffic === 'NORMAL' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
                <Chip
                  icon={<SpeedIcon sx={{ fontSize: '16px !important' }} />}
                  label="🟢 Green Wave Priority (-35% ETA)"
                  clickable
                  onClick={() => { setSimTraffic('GREEN_WAVE'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simTraffic === 'GREEN_WAVE' ? '#238636' : '#21262d',
                    color: simTraffic === 'GREEN_WAVE' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: '16px !important' }} />}
                  label="🔴 Severe Gridlock (+50% ETA)"
                  clickable
                  onClick={() => { setSimTraffic('GRIDLOCK'); setIsSimActive(true); }}
                  sx={{
                    backgroundColor: simTraffic === 'GRIDLOCK' ? '#da3633' : '#21262d',
                    color: simTraffic === 'GRIDLOCK' ? '#fff' : '#c9d1d9',
                    fontWeight: 700,
                    border: '1px solid #30363d'
                  }}
                />
              </Box>
            </Grid>

            {/* Control 3: ED Divert Stress Tester */}
            <Grid item xs={12} md={3}>
              <Typography variant="caption" sx={{ color: '#f85149', fontWeight: 800, display: 'block', mb: 0.8 }}>
                3. SIMULATE HOSPITAL ED DIVERT:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {hospitals.slice(0, 3).map((h) => {
                  const isDiverted = simDivertedIds.includes(h.id);
                  return (
                    <Chip
                      key={h.id}
                      label={isDiverted ? `⚠️ ${h.name.split(' ')[0]} DIVERTED` : `Divert ${h.name.split(' ')[0]}`}
                      clickable
                      onClick={() => toggleDivert(h.id)}
                      color={isDiverted ? 'error' : 'default'}
                      variant={isDiverted ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  );
                })}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* VISUAL ANALYTICS & BENCHMARKING SUITE (RECHARTS) */}
      <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', mb: 3, borderRadius: 2 }}>
        <Box sx={{ borderBottom: '1px solid #30363d', px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <Tabs
            value={analyticsTab}
            onChange={(_, val) => setAnalyticsTab(val)}
            textColor="inherit"
            sx={{
              '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', minHeight: 48 },
              '& .Mui-selected': { color: '#58a6ff' },
              '& .MuiTabs-indicator': { backgroundColor: '#58a6ff' }
            }}
          >
            <Tab icon={<DonutLargeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="MCDA Capability Radar" value="RADAR" />
            <Tab icon={<BarChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Head-to-Head Score Breakdown" value="BARS" />
            <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Golden Hour Prognosis Curve" value="GOLDEN_HOUR" />
            <Tab icon={<TableChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Live Capacity Grid" value="MATRIX" />
          </Tabs>

          <Typography variant="caption" sx={{ color: '#8b949e', display: { xs: 'none', md: 'block' } }}>
            Interactive Decision Support • Click any hospital below to focus
          </Typography>
        </Box>

        <CardContent sx={{ p: 2.5 }}>
          {/* TAB 1: RADAR / SPIDER MULTI-CRITERIA BENCHMARK */}
          {analyticsTab === 'RADAR' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    Multi-Criteria Capability Radar: Top 3 Destination Candidates
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    Comparing Clinical Capability, ICU Capacity, Transit Speed, Surgical Readiness, and Blood Bank Inventory
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                  {evaluatedCandidates.slice(0, 3).map((cand, idx) => {
                    const colors = ['#238636', '#1f6feb', '#f0883e'];
                    return (
                      <Box key={cand.hospitalId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: colors[idx] }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#c9d1d9' }}>
                          #{idx + 1} {cand.hospitalName.split(' ')[0]} ({cand.suitabilityScore} pts)
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              <Box sx={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#30363d" />
                    <PolarAngleAxis dataKey="metric" stroke="#8b949e" tick={{ fill: '#c9d1d9', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#30363d" tick={{ fill: '#8b949e', fontSize: 10 }} />
                    <Radar
                      name={evaluatedCandidates[0]?.hospitalName.split(' ')[0] || '#1'}
                      dataKey="cand_0"
                      stroke="#238636"
                      fill="#238636"
                      fillOpacity={0.45}
                    />
                    {evaluatedCandidates.length > 1 && (
                      <Radar
                        name={evaluatedCandidates[1]?.hospitalName.split(' ')[0] || '#2'}
                        dataKey="cand_1"
                        stroke="#1f6feb"
                        fill="#1f6feb"
                        fillOpacity={0.3}
                      />
                    )}
                    {evaluatedCandidates.length > 2 && (
                      <Radar
                        name={evaluatedCandidates[2]?.hospitalName.split(' ')[0] || '#3'}
                        dataKey="cand_2"
                        stroke="#f0883e"
                        fill="#f0883e"
                        fillOpacity={0.2}
                      />
                    )}
                    <Legend wrapperStyle={{ color: '#f0f6fc', paddingTop: 10 }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8, color: '#f0f6fc' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}

          {/* TAB 2: HEAD-TO-HEAD COMPARATIVE BARS */}
          {analyticsTab === 'BARS' && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc', mb: 0.5 }}>
                Head-to-Head Comparative Metric Decomposition
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 2 }}>
                Overall Suitability vs Clinical Fit (30%), Resource Capacity (25%), and Transit Score (25%)
              </Typography>
              <Box sx={{ height: 320, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="name" stroke="#8b949e" tick={{ fill: '#c9d1d9', fontSize: 12 }} />
                    <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontSize: 11 }} domain={[0, 100]} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8, color: '#f0f6fc' }}
                    />
                    <Legend wrapperStyle={{ color: '#f0f6fc', paddingTop: 10 }} />
                    <Bar dataKey="suitability" name="Suitability Score" fill="#3fb950" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clinicalFit" name="Clinical Capability" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="capacity" name="Bed / OT Capacity" fill="#bc8cff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="transport" name="Transit Utility" fill="#f0883e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}

          {/* TAB 3: GOLDEN HOUR PROGNOSIS CURVE */}
          {analyticsTab === 'GOLDEN_HOUR' && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    Golden Hour Prognosis & Survival Window Decay Curve
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    ATLS Resuscitation Window Decay: Higher survival probability correlates with rapid transit to Level 1 / Cath Lab readiness
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ height: 260, width: '100%', mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={goldenHourData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="survivalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3fb950" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#da3633" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="minute" stroke="#8b949e" tick={{ fill: '#c9d1d9' }} unit=" min" />
                    <YAxis stroke="#8b949e" tick={{ fill: '#8b949e' }} domain={[0, 100]} unit="%" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: 8, color: '#f0f6fc' }}
                      formatter={(val: any) => [`${val}% Survival Probability`, 'Prognosis']}
                      labelFormatter={(label: any) => `Transit Time: ${label} minutes`}
                    />
                    <Area type="monotone" dataKey="survivalProbability" stroke="#3fb950" strokeWidth={3} fillOpacity={1} fill="url(#survivalGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* Marker points for top candidates */}
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {evaluatedCandidates.slice(0, 4).map((c) => (
                  <Box key={c.hospitalId} sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontWeight: 700 }}>
                      {c.hospitalName.split(' ')[0]} ({c.etaMinutes} min)
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: c.survivalProbability > 85 ? '#3fb950' : c.survivalProbability > 70 ? '#d29922' : '#f85149' }}>
                      {c.survivalProbability}% Survival Window
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* TAB 4: LIVE CAPACITY COMPARISON GRID */}
          {analyticsTab === 'MATRIX' && (
            <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderColor: '#30363d', color: '#8b949e', fontWeight: 700 } }}>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Trauma Level</TableCell>
                    <TableCell>ETA / Distance</TableCell>
                    <TableCell>ICU Beds</TableCell>
                    <TableCell>ED Bays</TableCell>
                    <TableCell>OT Suites</TableCell>
                    <TableCell>Blood Bank</TableCell>
                    <TableCell>Ventilators</TableCell>
                    <TableCell>Specialties</TableCell>
                    <TableCell>Suitability</TableCell>
                    <TableCell align="right">Select</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {evaluatedCandidates.map((c) => {
                    const isSelected = c.hospitalId === chosenCandidate?.hospitalId;
                    return (
                      <TableRow
                        key={c.hospitalId}
                        hover
                        onClick={() => setSelectedHospitalId(c.hospitalId)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(63, 185, 80, 0.12)' : 'inherit',
                          '& td': { borderColor: '#30363d', color: '#c9d1d9' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: isSelected ? '#3fb950' : '#f0f6fc' }}>
                          #{c.rankOrder} {c.hospitalName}
                        </TableCell>
                        <TableCell>
                          <Chip label={c.traumaLevel?.replace('_', ' ') || 'Level 1'} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#f0883e' }}>
                          {c.etaMinutes} min ({c.distanceKm} km)
                        </TableCell>
                        <TableCell sx={{ color: c.resources.icu.available > 0 ? '#3fb950' : '#f85149', fontWeight: 700 }}>
                          {c.resources.icu.available} / {c.resources.icu.total}
                        </TableCell>
                        <TableCell>{c.resources.ed.available} / {c.resources.ed.total}</TableCell>
                        <TableCell sx={{ color: c.resources.ot.available > 0 ? '#3fb950' : '#f85149', fontWeight: 700 }}>
                          {c.resources.ot.available} / {c.resources.ot.total}
                        </TableCell>
                        <TableCell>{c.resources.blood.available} units</TableCell>
                        <TableCell>{c.resources.vent.available} / {c.resources.vent.total}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            {c.hospital.hasCathLab && <Chip label="PCI" size="small" sx={{ height: 18, fontSize: 9, backgroundColor: '#21262d', color: '#58a6ff' }} />}
                            {c.hospital.hasStrokeCenter && <Chip label="Stroke" size="small" sx={{ height: 18, fontSize: 9, backgroundColor: '#21262d', color: '#bc8cff' }} />}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: c.isRecommended ? '#3fb950' : '#58a6ff' }}>
                          {c.suitabilityScore}/100
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={isSelected ? 'contained' : 'outlined'}
                            color={isSelected ? 'success' : 'primary'}
                            onClick={(e) => { e.stopPropagation(); setSelectedHospitalId(c.hospitalId); }}
                            sx={{ fontSize: '0.72rem', py: 0.2, textTransform: 'none', fontWeight: 700 }}
                          >
                            {isSelected ? '✓ Selected' : 'Choose'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* MAIN TWO-COLUMN WORKSPACE: Candidate Cards & GIS Tactical Route Map */}
      <Grid container spacing={3}>
        {/* Left Column: Evaluated Hospital Candidates with Interactive Selection */}
        <Grid item xs={12} lg={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              Candidate Facility Evaluation Cards ({evaluatedCandidates.length} Available)
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              Click any card to select as target receiving facility
            </Typography>
          </Box>

          <Stack spacing={2}>
            {evaluatedCandidates.map((cand) => {
              const isSelected = cand.hospitalId === chosenCandidate?.hospitalId;
              const isRecommended = cand.isRecommended;
              const isFeasible = cand.feasibility === 'FEASIBLE';

              return (
                <Card
                  key={cand.hospitalId}
                  onClick={() => setSelectedHospitalId(cand.hospitalId)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: '#161b22',
                    border: isSelected
                      ? '2px solid #3fb950'
                      : isRecommended
                      ? '2px solid #238636'
                      : isFeasible
                      ? '1px solid #30363d'
                      : '1px solid rgba(248, 81, 73, 0.4)',
                    boxShadow: isSelected
                      ? '0 0 20px rgba(63, 185, 80, 0.4)'
                      : isRecommended
                      ? '0 0 14px rgba(35, 134, 54, 0.3)'
                      : 'none',
                    borderRadius: 2.5,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {/* Card Header Banner */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1.2,
                      backgroundColor: isSelected
                        ? 'rgba(63, 185, 80, 0.2)'
                        : isRecommended
                        ? 'rgba(35, 134, 54, 0.15)'
                        : !isFeasible
                        ? 'rgba(248, 81, 73, 0.08)'
                        : '#21262d',
                      borderBottom: '1px solid #30363d',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={isRecommended ? '#1 AI RECOMMENDED' : `#${cand.rankOrder} CANDIDATE`}
                        size="small"
                        sx={{
                          backgroundColor: isRecommended ? '#238636' : '#30363d',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isSelected ? '#3fb950' : '#f0f6fc' }}>
                        {cand.hospitalName}
                      </Typography>
                      <Chip
                        label={cand.traumaLevel?.replace('_', ' ') || 'Level 1'}
                        size="small"
                        sx={{ backgroundColor: '#21262d', color: '#58a6ff', fontSize: '0.68rem', fontWeight: 600 }}
                      />
                      {isSelected && (
                        <Chip
                          icon={<DoneAllIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                          label="TARGET SELECTED"
                          size="small"
                          sx={{ backgroundColor: '#238636', color: '#fff', fontWeight: 800, fontSize: '0.68rem' }}
                        />
                      )}
                    </Box>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        icon={isFeasible ? <CheckCircleIcon sx={{ fontSize: '14px !important' }} /> : <CancelIcon sx={{ fontSize: '14px !important' }} />}
                        label={cand.feasibility}
                        size="small"
                        color={isFeasible ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: '0.68rem' }}
                      />
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      {/* Left: Overall Suitability Gauge */}
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: '#0d1117',
                            border: '1px solid #30363d',
                            textAlign: 'center'
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>
                            SUITABILITY SCORE
                          </Typography>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 900,
                              color: isSelected ? '#3fb950' : isRecommended ? '#3fb950' : isFeasible ? '#58a6ff' : '#8b949e',
                              lineHeight: 1.1,
                              my: 0.5
                            }}
                          >
                            {cand.suitabilityScore}
                            <span style={{ fontSize: '1rem', color: '#8b949e', fontWeight: 500 }}>/100</span>
                          </Typography>
                          <Typography variant="caption" sx={{ color: isRecommended ? '#3fb950' : '#8b949e', fontWeight: 600, display: 'block' }}>
                            {isRecommended ? 'Optimal Clinical Destination' : isFeasible ? 'Viable Secondary Facility' : 'Constraint Violated'}
                          </Typography>

                          {/* Transit ETA & Distance */}
                          <Divider sx={{ my: 1, borderColor: '#30363d' }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimerIcon sx={{ color: '#f0883e', fontSize: 16 }} />
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#f0883e' }}>
                                {cand.etaMinutes} min
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <NavigationIcon sx={{ color: '#58a6ff', fontSize: 14 }} />
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#c9d1d9' }}>
                                {cand.distanceKm} km
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Middle: Live Resource Availability Matrix */}
                      <Grid item xs={12} sm={8}>
                        <Typography variant="caption" sx={{ color: '#58a6ff', fontWeight: 800, display: 'block', mb: 0.8 }}>
                          LIVE RESOURCE AVAILABILITY AT ARRIVAL ETA:
                        </Typography>
                        <Grid container spacing={1}>
                          {/* ICU Beds */}
                          <Grid item xs={4}>
                            <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>ICU BEDS</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: cand.resources.icu.available > 0 ? '#3fb950' : '#f85149' }}>
                                {cand.resources.icu.available} / {cand.resources.icu.total || 15}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* ED / Trauma Beds */}
                          <Grid item xs={4}>
                            <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>ED / TRAUMA</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: cand.resources.ed.available > 0 ? '#3fb950' : '#d29922' }}>
                                {cand.resources.ed.available} / {cand.resources.ed.total || 40}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Operating Theatres */}
                          <Grid item xs={4}>
                            <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>OT SUITES</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: cand.resources.ot.available > 0 ? '#3fb950' : '#f85149' }}>
                                {cand.resources.ot.available} / {cand.resources.ot.total || 8}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Blood Bank Units */}
                          <Grid item xs={4}>
                            <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>BLOOD BANK</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: cand.resources.blood.available > 10 ? '#3fb950' : '#f85149' }}>
                                {cand.resources.blood.available || 30} units
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Ventilators */}
                          <Grid item xs={4}>
                            <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>VENTILATORS</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: cand.resources.vent.available > 0 ? '#3fb950' : '#f85149' }}>
                                {cand.resources.vent.available} / {cand.resources.vent.total || 14}
                              </Typography>
                            </Box>
                          </Grid>

                          {/* Specialties */}
                          <Grid item xs={4}>
                            <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'block' }}>SPECIALTIES</Typography>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#bc8cff' }}>
                                {cand.hospital.hasCathLab && cand.hospital.hasStrokeCenter ? 'Cath+Stroke Ready' : cand.hospital.hasCathLab ? 'Cath Lab Ready' : 'Emergency General'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Factor Score Decomposition Bars */}
                        <Box sx={{ mt: 1.5 }}>
                          <Grid container spacing={1}>
                            <Grid item xs={4}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Clinical Fit</span> <span>{cand.clinicalFitScore}%</span>
                              </Typography>
                              <LinearProgress variant="determinate" value={cand.clinicalFitScore} sx={{ height: 4, borderRadius: 2, backgroundColor: '#21262d', '& .MuiLinearProgress-bar': { backgroundColor: '#3fb950' } }} />
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Capacity</span> <span>{cand.futureResourceScore}%</span>
                              </Typography>
                              <LinearProgress variant="determinate" value={cand.futureResourceScore} sx={{ height: 4, borderRadius: 2, backgroundColor: '#21262d', '& .MuiLinearProgress-bar': { backgroundColor: '#58a6ff' } }} />
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Transport</span> <span>{cand.transportUtilityScore}%</span>
                              </Typography>
                              <LinearProgress variant="determinate" value={cand.transportUtilityScore} sx={{ height: 4, borderRadius: 2, backgroundColor: '#21262d', '& .MuiLinearProgress-bar': { backgroundColor: '#f0883e' } }} />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* AI Reasoning Factor Highlights */}
                    <Box sx={{ mt: 2, p: 1.2, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                      {cand.positiveDrivers.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: cand.constraintViolations.length > 0 ? 0.8 : 0 }}>
                          {cand.positiveDrivers.map((p, idx) => (
                            <Typography key={idx} variant="caption" sx={{ color: '#3fb950', fontWeight: 600 }}>
                              ✓ {p}
                            </Typography>
                          ))}
                        </Box>
                      )}
                      {cand.constraintViolations.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {cand.constraintViolations.map((v, idx) => (
                            <Typography key={idx} variant="caption" sx={{ color: '#f85149', fontWeight: 700 }}>
                              ✗ {v}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Card Actions: Selection & Direct Route */}
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: isSelected ? '#3fb950' : '#8b949e', fontWeight: 700 }}>
                        {isSelected ? '★ Currently Selected as Receiving Hospital' : 'Click to inspect & select this facility'}
                      </Typography>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant={isSelected ? 'contained' : 'outlined'}
                          color={isSelected ? 'success' : 'primary'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospitalId(cand.hospitalId);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                        >
                          {isSelected ? '✓ Selected' : `Select ${cand.hospitalName.split(' ')[0]}`}
                        </Button>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Grid>

        {/* Right Column: GIS Tactical Corridor Map & Target Action */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                GIS Tactical Corridor Preview
              </Typography>
              <Chip
                label={`Focus: ${chosenCandidate?.hospitalName.split(' ')[0] || 'Target'}`}
                size="small"
                sx={{ backgroundColor: '#21262d', color: '#3fb950', fontWeight: 800, fontSize: '0.72rem' }}
              />
            </Box>

            <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2.5, overflow: 'hidden', mb: 2 }}>
              <Box sx={{ height: 440, position: 'relative', width: '100%' }}>
                <MapContainer
                  center={scenePos}
                  zoom={13}
                  style={{ width: '100%', height: '100%', backgroundColor: '#0d1117' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    subdomains={['a', 'b', 'c', 'd']}
                    maxZoom={19}
                  />

                  {/* Incident Scene Marker */}
                  <Marker position={scenePos} icon={createSceneIcon()}>
                    <Popup>
                      <strong>📍 Incident Scene Origin</strong>
                      <br />
                      Patient boarded at scene.
                    </Popup>
                  </Marker>

                  {/* Hospital Markers & Dynamic Route Lines */}
                  {evaluatedCandidates.map((cand) => {
                    const hospPos: [number, number] = [cand.latitude, cand.longitude];
                    const isSelected = cand.hospitalId === chosenCandidate?.hospitalId;
                    const isRec = cand.isRecommended;
                    const isFeas = cand.feasibility === 'FEASIBLE';

                    return (
                      <React.Fragment key={cand.hospitalId}>
                        <Marker
                          position={hospPos}
                          icon={createHospitalPin(cand.hospitalName, cand.rankOrder, isSelected, isFeas)}
                          eventHandlers={{
                            click: () => setSelectedHospitalId(cand.hospitalId)
                          }}
                        >
                          <Popup>
                            <strong>{cand.hospitalName}</strong>
                            <br />
                            Rank: #{cand.rankOrder} | Suitability: {cand.suitabilityScore}/100
                            <br />
                            ETA: {cand.etaMinutes} min ({cand.distanceKm} km)
                            <br />
                            {isSelected ? '★ Currently Selected Target' : 'Click card to select'}
                          </Popup>
                        </Marker>

                        {/* Route Corridor Vector */}
                        <Polyline
                          positions={[scenePos, hospPos]}
                          color={isSelected ? '#3fb950' : isRec ? '#238636' : isFeas ? '#58a6ff' : '#6e7681'}
                          weight={isSelected ? 6 : isRec ? 4 : 2}
                          opacity={isSelected ? 1.0 : isRec ? 0.8 : 0.35}
                          dashArray={isSelected ? undefined : isRec ? '8, 6' : '4, 8'}
                        />
                      </React.Fragment>
                    );
                  })}
                </MapContainer>

                {/* Map Floating HUD Info */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    backgroundColor: 'rgba(13, 17, 23, 0.94)',
                    backdropFilter: 'blur(8px)',
                    p: 1.2,
                    borderRadius: 2,
                    border: '1px solid #30363d',
                    zIndex: 1000,
                    pointerEvents: 'none'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontWeight: 700 }}>
                    ACTIVE TRANSIT TARGET:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#3fb950', fontWeight: 800 }}>
                    Scene ➔ {chosenCandidate?.hospitalName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#f0883e', fontWeight: 700 }}>
                    Transit: {chosenCandidate?.etaMinutes} mins ({chosenCandidate?.distanceKm} km) • {chosenCandidate?.survivalProbability}% Survival Window
                  </Typography>
                </Box>
              </Box>

              {/* Map Footer Key */}
              <Box sx={{ p: 1.5, backgroundColor: '#161b22', borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 4, backgroundColor: '#3fb950', borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ color: '#c9d1d9', fontSize: '0.7rem' }}>Selected Target</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 4, backgroundColor: '#238636', borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ color: '#c9d1d9', fontSize: '0.7rem' }}>#1 AI Top Choice</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 4, backgroundColor: '#58a6ff', borderRadius: 1 }} />
                    <Typography variant="caption" sx={{ color: '#c9d1d9', fontSize: '0.7rem' }}>Alternative</Typography>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* Targeted Pre-Alert Dispatch Command Box */}
            {chosenCandidate && (
              <Card sx={{ backgroundColor: '#161b22', border: '2px solid #238636', borderRadius: 2.5, p: 2 }}>
                <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 800, display: 'block' }}>
                  CONFIRM DESTINATION & INITIATE EMERGENCY PRE-ALERT:
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc', mt: 0.5 }}>
                  {chosenCandidate.hospitalName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.8rem', mb: 2 }}>
                  Corridor ETA: <strong>{chosenCandidate.etaMinutes} mins</strong> • {chosenCandidate.resources.icu.available} ICU Beds Ready • {chosenCandidate.resources.ot.available} OT Suites Free
                </Typography>

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={actionLoading === chosenCandidate.hospitalId ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <NavigationIcon />}
                  disabled={actionLoading !== null}
                  onClick={handleConfirmAndDispatch}
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    backgroundColor: '#238636',
                    '&:hover': { backgroundColor: '#2ea043' },
                    py: 1.2,
                    boxShadow: '0 0 16px rgba(35, 134, 54, 0.6)',
                    textTransform: 'none'
                  }}
                >
                  🚀 Confirm Destination & Transmit Pre-Alert
                </Button>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
