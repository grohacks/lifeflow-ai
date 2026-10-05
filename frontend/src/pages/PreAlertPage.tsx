import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField, MenuItem,
  Grid, Alert, Divider, FormControl, Select, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NavigationIcon from '@mui/icons-material/Navigation';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import TimerIcon from '@mui/icons-material/Timer';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import PersonIcon from '@mui/icons-material/Person';
import SingleBedIcon from '@mui/icons-material/SingleBed';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import { useSearchParams } from 'react-router-dom';
import { decisionApi, preAlertApi, hospitalApi, patientApi } from '../services/api';
import { wsService } from '../services/websocket';
import { Recommendation, PreAlert, Hospital } from '../types';
import { LiveApproachingMap } from '../components/LiveApproachingMap';
import { getEffectiveHospitalCoords, calculateHaversineDistanceKm } from './DestinationEvaluationPage';

export const PreAlertPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCaseId = searchParams.get('caseId');
  const urlLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const urlLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
  const urlHospitalId = searchParams.get('hospitalId') ? parseInt(searchParams.get('hospitalId')!, 10) : null;
  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [caseId, setCaseId] = useState<string>(urlCaseId || 'CASE-2026-001');

  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [patientTwin, setPatientTwin] = useState<any>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | ''>('');
  const [decisionType, setDecisionType] = useState('ACCEPT');
  const [overrideReason, setOverrideReason] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<boolean>(false);
  const [activePreAlert, setActivePreAlert] = useState<any>(null);

  // AI Evaluation & Visual Media States
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [snaps, setSnaps] = useState<any[]>([]);
  const [lightboxSnap, setLightboxSnap] = useState<any | null>(null);
  const [uploadingCabinSnap, setUploadingCabinSnap] = useState<boolean>(false);
  const [showAllCandidates, setShowAllCandidates] = useState<boolean>(true);

  const user = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
  const roles: string[] = user.roles || ['ROLE_PARAMEDIC'];
  const canDispatch = roles.some((r: string) => r.includes('PARAMEDIC') || r.includes('ADMIN'));

  // Positive acceptance chime using Web Audio
  const playSuccessChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;

      [587, 740, 880, 1175].forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.25, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } catch (e) {
      console.warn('Audio chime unavailable', e);
    }
  };

  useEffect(() => {
    patientApi.getActiveCases().then((cases) => {
      if (cases && cases.length > 0) {
        setActiveCases(cases);
        if (!urlCaseId) {
          setCaseId(cases[0].caseId);
          setSearchParams({ caseId: cases[0].caseId });
        }
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (urlCaseId && urlCaseId !== caseId) {
      setCaseId(urlCaseId);
      setActivePreAlert(null);
      setDispatchStatus(null);
    }
  }, [urlCaseId]);

  useEffect(() => {
    setActivePreAlert(null);
    setDispatchStatus(null);
    loadData();

    const handlePreAlertUpdate = (data: any) => {
      if (!data) return;
      if (data.caseId === caseId) {
        setActivePreAlert(data);
        if (data.status === 'ACCEPTED' || data.status === 'ACKNOWLEDGED') {
          playSuccessChime();
        }
      }
    };

    const handleSnapUpdate = (snapData: any) => {
      if (!snapData) return;
      const dataUrl = snapData.highResSnap || snapData.dataUrl;
      if (dataUrl) {
        setSnaps((prev) => {
          const idx = prev.findIndex((s) => (s.highResSnap || s.dataUrl) === dataUrl);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...snapData };
            return updated;
          }
          return [snapData, ...prev];
        });
      }
    };

    const unsubs = [
      wsService.subscribe(`/topic/recommendations/${caseId}`, (data) => setRecommendation(data)),
      wsService.subscribe(`/topic/prealerts/case/${caseId}`, handlePreAlertUpdate),
      wsService.subscribe(`/topic/patients/${caseId}/twin`, (twinData) => {
        if (twinData) setPatientTwin(twinData);
      }),
      wsService.subscribe(`/topic/patient-twin/${caseId}`, (twinData) => {
        if (twinData) setPatientTwin(twinData);
      }),
      wsService.subscribe(`/topic/camera-snaps/${caseId}`, handleSnapUpdate),
      wsService.subscribe(`/topic/camera-stream/${caseId}`, handleSnapUpdate)
    ];

    return () => unsubs.forEach((fn) => fn());
  }, [caseId]);

  const loadData = async () => {
    try {
      const [recom, hosps, twin, latestAlert, snapsData] = await Promise.all([
        decisionApi.getActiveRecommendation(caseId).catch(() => null),
        hospitalApi.getAll().catch(() => []),
        patientApi.getTwin(caseId).catch(() => null),
        preAlertApi.getLatestForCase(caseId).catch(() => null),
        patientApi.getSnaps(caseId).catch(() => [])
      ]);

      if (recom) {
        setRecommendation(recom);
        if (recom.selectedHospitalId) {
          setSelectedHospitalId(recom.selectedHospitalId);
        }
      }
      if (hosps && hosps.length > 0) {
        setHospitals(hosps);
        setSelectedHospitalId((prev) => {
          if (urlHospitalId) return urlHospitalId;
          if (prev) return prev;
          if (recom?.selectedHospitalId) return recom.selectedHospitalId;
          const apex = hosps.find((h: any) => h.name.toLowerCase().includes('apex') || h.hospitalCode === 'HOSP-APX-5417');
          return apex ? apex.id : hosps[0].id;
        });
      }
      if (twin) setPatientTwin(twin);
      if (snapsData) setSnaps(snapsData);

      if (latestAlert && latestAlert.caseId === caseId) {
        setActivePreAlert(latestAlert);
        if (!urlHospitalId && latestAlert.hospitalId) {
          setSelectedHospitalId(latestAlert.hospitalId);
        }
      } else {
        setActivePreAlert(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run AI Nearest Hospital Analyzer
  const handleRunAiEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await decisionApi.evaluate(caseId);
      if (res) {
        setRecommendation(res);
        if (res.selectedHospitalId) {
          setSelectedHospitalId(res.selectedHospitalId);
          setDecisionType('ACCEPT');
        }
      }
    } catch (e: any) {
      console.error('AI evaluation failed', e);
      alert('AI evaluation failed: ' + (e?.message || 'Server error'));
    } finally {
      setEvaluating(false);
    }
  };

  // Compress image on-device using HTML5 canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.72));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle cabin trauma camera capture / upload
  const handleCaptureCabinSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingCabinSnap(true);
      try {
        const dataUrl = await compressImage(file);
        const uploaded = await patientApi.uploadSnapDataUrl(caseId, {
          dataUrl,
          source: 'PARAMEDIC_CABIN',
          label: 'Ambulance Cabin Field Snapshot'
        });
        setSnaps((prev) => [uploaded, ...prev]);
      } catch (err: any) {
        alert('Failed to transmit photo: ' + (err?.message || 'Upload error'));
      } finally {
        setUploadingCabinSnap(false);
      }
    }
  };

  const handleConfirmDecision = async () => {
    if (!selectedHospitalId) return;
    setDispatching(true);
    try {
      const res = await preAlertApi.recordDecision({
        caseId,
        recommendationId: recommendation?.id,
        selectedHospitalId: Number(selectedHospitalId),
        decisionType,
        reason: decisionType !== 'ACCEPT' ? overrideReason : 'Paramedic accepted algorithmic recommendation'
      });
      // Explicitly set to PENDING_ACK so map starts stationary awaiting hospital acceptance
      setActivePreAlert({ ...res, status: 'PENDING_ACK' });
      setDispatchStatus(`✓ Pre-Alert dispatched to ${res.hospitalName}! Awaiting Emergency Department acceptance...`);
    } catch (e: any) {
      alert('Error dispatching pre-alert: ' + e.message);
    } finally {
      setDispatching(false);
    }
  };

  const selectedHospital = hospitals.find((h) => h.id === Number(selectedHospitalId));
  const currentCase = activeCases.find((c) => c.caseId === caseId);

  // Dynamic incident coordinates: Prioritize URL GPS param, then alert/case/twin coordinates, then default
  const incidentLat = urlLat ?? activePreAlert?.incidentLatitude ?? currentCase?.incidentLatitude ?? patientTwin?.incidentLatitude ?? 12.9352;
  const incidentLon = urlLng ?? activePreAlert?.incidentLongitude ?? currentCase?.incidentLongitude ?? patientTwin?.incidentLongitude ?? 77.6245;

  const [effectiveHospLat, effectiveHospLon] = getEffectiveHospitalCoords(selectedHospital || activePreAlert, 12.981, 77.632);
  const hospitalLat = effectiveHospLat;
  const hospitalLon = effectiveHospLon;

  const getDisplayDistanceAndEta = (cand: any, idx: number) => {
    let dist = cand.distanceKm;
    let eta = cand.etaMinutes;

    if (!dist || dist > 50) {
      const hosp = hospitals.find((h) => h.id === cand.hospitalId);
      const [cLat, cLng] = getEffectiveHospitalCoords(hosp || cand, 12.981, 77.632);
      dist = calculateHaversineDistanceKm(incidentLat, incidentLon, cLat, cLng);
      eta = Math.max(3, Math.round(dist * 1.6 + 2));
    }

    return { dist: Number(dist).toFixed(1), eta };
  };

  const isArrived = activePreAlert?.status === 'ARRIVED';
  const isAccepted = (activePreAlert?.status === 'ACCEPTED' || activePreAlert?.status === 'ACKNOWLEDGED') && !isArrived;
  const isPending = activePreAlert?.status === 'PENDING_ACK' && !isAccepted && !isArrived;

  const handleMarkArrived = async () => {
    if (!activePreAlert?.prealertId) return;
    try {
      const res = await preAlertApi.markArrived(activePreAlert.prealertId);
      setActivePreAlert(res);
      playSuccessChime();
    } catch (e: any) {
      console.error('Error marking ambulance arrived', e);
      setActivePreAlert((prev: any) => prev ? { ...prev, status: 'ARRIVED', etaSeconds: 0 } : prev);
    }
  };

  const handleResetPreAlert = async () => {
    try {
      await preAlertApi.clearCaseAlerts(caseId);
    } catch {}
    setActivePreAlert(null);
    setDispatchStatus(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalHospitalIcon sx={{ color: '#f85149', fontSize: 30 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              Ambulance Cabin — Field Pre-Alert Dispatch & Approaching Navigation
            </Typography>
            <Chip
              label="MEDIC ONE UNIT"
              size="small"
              sx={{ backgroundColor: 'rgba(88, 166, 255, 0.2)', color: '#58a6ff', border: '1px solid #58a6ff', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5 }}>
            Field Paramedic Dispatch Console • Send Live Vitals & Injury Survey ➔ Secure Receiving ED Mobilization & Doctor Orders
          </Typography>
        </Box>

        {/* Patient Case Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }}>
          <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>
            INCIDENT CASUALTY:
          </Typography>
          {activeCases.length > 0 ? (
            <FormControl size="small" sx={{ minWidth: 230 }}>
              <Select
                value={caseId}
                onChange={(e) => {
                  setCaseId(e.target.value);
                  setSearchParams({ caseId: e.target.value });
                }}
                sx={{
                  backgroundColor: '#0d1117',
                  color: '#58a6ff',
                  fontWeight: 700,
                  height: 32,
                  fontSize: '0.85rem',
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
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          backgroundColor: c.triageCategory === 'RED' ? 'rgba(248,81,73,0.2)' : 'rgba(210,153,34,0.2)',
                          color: c.triageCategory === 'RED' ? '#f85149' : '#d29922'
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{c.caseId}</Typography>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>
                        {c.patientName || c.patientIdentifier || 'Casualty'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Chip label={caseId} color="primary" size="small" sx={{ fontWeight: 700 }} />
          )}

          {activePreAlert && (
            <Button
              size="small"
              onClick={handleResetPreAlert}
              sx={{ color: '#8b949e', textTransform: 'none', fontSize: '0.72rem', minWidth: 'auto', p: 0.5 }}
            >
              Clear Pre-Alert
            </Button>
          )}
        </Box>
      </Box>

      {/* Real-time Hospital PENDING_ACK Notification Banner */}
      {isPending && (
        <Alert
          severity="warning"
          icon={<CircularProgress size={24} sx={{ color: '#d29922' }} />}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(210, 153, 34, 0.15)',
            border: '2px solid #d29922',
            color: '#f0f6fc',
            borderRadius: 2,
            boxShadow: '0 0 20px rgba(210, 153, 34, 0.3)',
            animation: 'pulseAmber 2s infinite alternate',
            '@keyframes pulseAmber': {
              '0%': { boxShadow: '0 0 8px rgba(210, 153, 34, 0.2)' },
              '100%': { boxShadow: '0 0 24px rgba(210, 153, 34, 0.55)' }
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#d29922' }}>
                ⏳ PRE-ALERT TRANSMITTED TO {activePreAlert?.hospitalName?.toUpperCase()}!
              </Typography>
              <Typography variant="body2" sx={{ color: '#f0f6fc', mt: 0.5, fontWeight: 600 }}>
                Status: <strong>PENDING EMERGENCY DEPARTMENT CONFIRMATION</strong>. Case <strong>{activePreAlert?.caseId}</strong> pre-alert was dispatched.
                Awaiting the receiving Hospital In-Charge to review, mobilize trauma bays, and assign an on-call specialist.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="AWAITING HOSPITAL IN-CHARGE ACCEPTANCE"
                size="small"
                sx={{ backgroundColor: 'rgba(210, 153, 34, 0.3)', color: '#d29922', border: '1px solid #d29922', fontWeight: 800 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={handleResetPreAlert}
                sx={{
                  color: '#f0f6fc',
                  borderColor: '#d29922',
                  backgroundColor: '#161b22',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#21262d', borderColor: '#e3b341' }
                }}
              >
                🔄 Cancel & Reset
              </Button>
            </Box>
          </Box>
        </Alert>
      )}

      {/* Real-time Ambulance Arrived Banner */}
      {isArrived && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon sx={{ fontSize: 34, color: '#3fb950' }} />}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(63, 185, 80, 0.22)',
            border: '2px solid #3fb950',
            color: '#f0f6fc',
            borderRadius: 2,
            boxShadow: '0 0 30px rgba(63, 185, 80, 0.5)',
            animation: 'pulseGreen 2s infinite alternate'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#3fb950' }}>
                🏁 AMBULANCE DOCKED AT {activePreAlert?.hospitalName?.toUpperCase()} TRAUMA BAY!
              </Typography>
              <Typography variant="body2" sx={{ color: '#f0f6fc', mt: 0.5, fontWeight: 600 }}>
                Emergency response transit complete. Vehicle {activePreAlert?.vehicleNumber || 'AMB-01'} has safely arrived at the resuscitation suite.
                {activePreAlert?.assignedDoctorName && (
                  <span style={{ color: '#bc8cff', marginLeft: 8 }}>
                    👨‍⚕️ Receiving Specialist: <strong>{activePreAlert.assignedDoctorName}</strong>
                  </span>
                )}
                {activePreAlert?.reservedBeds && (
                  <span style={{ color: '#3fb950', marginLeft: 8 }}>
                    🛏️ Assigned Suite: <strong>{activePreAlert.reservedBeds}</strong>
                  </span>
                )}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#fff !important' }} />}
                label="AMBULANCE ARRIVED & DOCKED"
                size="medium"
                sx={{ backgroundColor: '#238636', color: '#fff', fontWeight: 800, fontSize: '0.8rem', py: 0.5 }}
              />
              <Button
                size="small"
                variant="outlined"
                onClick={handleResetPreAlert}
                sx={{
                  color: '#f0f6fc',
                  borderColor: '#30363d',
                  backgroundColor: '#161b22',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#21262d', borderColor: '#58a6ff' }
                }}
              >
                🔄 Start Fresh Dispatch
              </Button>
            </Box>
          </Box>
        </Alert>
      )}

      {/* Real-time Hospital Acceptance Notification Banner */}
      {isAccepted && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon sx={{ fontSize: 32, color: '#3fb950' }} />}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(63, 185, 80, 0.18)',
            border: '2px solid #3fb950',
            color: '#f0f6fc',
            borderRadius: 2,
            boxShadow: '0 0 25px rgba(63, 185, 80, 0.35)',
            animation: 'pulseGreen 2s infinite alternate',
            '@keyframes pulseGreen': {
              '0%': { boxShadow: '0 0 10px rgba(63, 185, 80, 0.25)' },
              '100%': { boxShadow: '0 0 30px rgba(63, 185, 80, 0.7)' }
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#3fb950' }}>
                🎉 PRE-ALERT ACCEPTED & MOBILIZED BY {activePreAlert?.hospitalName?.toUpperCase()}!
              </Typography>
              <Typography variant="body2" sx={{ color: '#f0f6fc', mt: 0.5, fontWeight: 600 }}>
                Receiving Emergency Department has accepted Case <strong>{activePreAlert?.caseId}</strong>.
                {activePreAlert?.reservedBeds && (
                  <span style={{ color: '#3fb950', marginLeft: 8 }}>
                    🛏️ Reserved: <strong>{activePreAlert.reservedBeds}</strong>
                  </span>
                )}
                {activePreAlert?.reservedBloodUnits > 0 && (
                  <span style={{ color: '#f85149', marginLeft: 8 }}>
                    🩸 <strong>{activePreAlert.reservedBloodUnits} Units Blood Ready</strong>
                  </span>
                )}
                {activePreAlert?.assignedDoctorName && (
                  <span style={{ color: '#bc8cff', marginLeft: 8 }}>
                    👨‍⚕️ Assigned Specialist: <strong>{activePreAlert.assignedDoctorName}</strong>
                  </span>
                )}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label="DESTINATION SECURED — EN ROUTE"
                size="small"
                sx={{ backgroundColor: '#238636', color: '#fff', fontWeight: 800 }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={handleMarkArrived}
                sx={{
                  backgroundColor: '#1f6feb',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  py: 0.5,
                  px: 1.5,
                  boxShadow: '0 0 12px rgba(31, 111, 235, 0.6)',
                  '&:hover': { backgroundColor: '#388bfd' },
                  textTransform: 'none'
                }}
              >
                🏁 Mark Ambulance Arrived at ED
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={handleResetPreAlert}
                sx={{
                  color: '#f0f6fc',
                  borderColor: '#30363d',
                  backgroundColor: '#161b22',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#21262d', borderColor: '#58a6ff' }
                }}
              >
                🔄 Start Fresh Dispatch
              </Button>
            </Box>
          </Box>
          {activePreAlert?.doctorOrders && (
            <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: 'rgba(188, 140, 255, 0.15)', borderRadius: 1.5, border: '1px solid #bc8cff' }}>
              <Typography variant="caption" sx={{ color: '#bc8cff', fontWeight: 800, display: 'block' }}>
                ON-CALL SPECIALIST PRE-ARRIVAL DIRECTIVE ({activePreAlert.assignedDoctorName || 'Doctor'}):
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 700, mt: 0.5 }}>
                "{activePreAlert.doctorOrders}"
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        {/* ========================================================================= */}
        {/* LEFT COLUMN: FIELD DISPATCH CONSOLE & PATIENT SURVEY                      */}
        {/* ========================================================================= */}
        <Grid item xs={12} md={5}>
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              {/* Patient Live Vitals in Ambulance */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MonitorHeartIcon sx={{ color: '#f85149', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                    PATIENT EN-ROUTE VITALS (CABIN SENSORS)
                  </Typography>
                </Box>
                <Chip label="Streaming" size="small" sx={{ backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', fontSize: '0.65rem', height: 18 }} />
              </Box>

              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>HR</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#f85149' }}>
                      {patientTwin?.heartRate ? Math.round(patientTwin.heartRate) : 112}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.6rem' }}>bpm</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>SPO2</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#388bfd' }}>
                      {patientTwin?.spo2 ? Math.round(patientTwin.spo2) : 94}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.6rem' }}>O2</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>BP</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#d29922' }}>
                      {patientTwin?.systolicBp ? `${Math.round(patientTwin.systolicBp)}/${Math.round(patientTwin.diastolicBp || 70)}` : '108/68'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.6rem' }}>mmHg</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1, backgroundColor: '#0d1117', borderRadius: 1, border: '1px solid #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>RR</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: '#3fb950' }}>
                      {patientTwin?.respiratoryRate ? Math.round(patientTwin.respiratoryRate) : 24}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.6rem' }}>/min</Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1.5, borderColor: '#30363d' }} />

              {/* ========================================================================= */}
              {/* FIELD VISUAL EVIDENCE & SOS SCENE PHOTOS                                  */}
              {/* ========================================================================= */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhotoCameraIcon sx={{ color: '#58a6ff', fontSize: 19 }} />
                    <Typography variant="caption" sx={{ color: '#f0f6fc', fontWeight: 800 }}>
                      INCIDENT SCENE & INJURY PHOTOS ({snaps.length})
                    </Typography>
                  </Box>
                  <label htmlFor="cabin-snap-input">
                    <input
                      id="cabin-snap-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handleCaptureCabinSnap}
                    />
                    <Button
                      component="span"
                      size="small"
                      disabled={uploadingCabinSnap}
                      startIcon={uploadingCabinSnap ? <CircularProgress size={12} color="inherit" /> : <PhotoCameraIcon fontSize="small" />}
                      sx={{
                        fontSize: '0.7rem',
                        py: 0.2,
                        px: 1,
                        backgroundColor: 'rgba(88, 166, 255, 0.15)',
                        color: '#58a6ff',
                        border: '1px solid rgba(88, 166, 255, 0.3)',
                        '&:hover': { backgroundColor: 'rgba(88, 166, 255, 0.25)' }
                      }}
                    >
                      {uploadingCabinSnap ? 'Uploading...' : '+ Add Cabin Photo'}
                    </Button>
                  </label>
                </Box>

                {snaps.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, pt: 0.5 }}>
                    {snaps.map((s, idx) => {
                      const imgUrl = s.highResSnap || s.dataUrl;
                      const isSos = s.source === 'CITIZEN_SOS';
                      return (
                        <Box
                          key={idx}
                          onClick={() => setLightboxSnap(s)}
                          sx={{
                            position: 'relative',
                            minWidth: 105,
                            maxWidth: 105,
                            height: 75,
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: isSos ? '2px solid #f85149' : '2px solid #58a6ff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            transition: 'transform 0.15s ease',
                            '&:hover': { transform: 'scale(1.05)' }
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={s.label || 'Incident Photo'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {s.aiFinding && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 2,
                                left: 2,
                                backgroundColor: 'rgba(210, 153, 34, 0.95)',
                                borderRadius: 0.8,
                                px: 0.5,
                                py: 0.1,
                                fontSize: '0.52rem',
                                fontWeight: 800,
                                color: '#000',
                                zIndex: 2
                              }}
                            >
                              ⚡ AI SCAN
                            </Box>
                          )}
                          <Chip
                            label={isSos ? 'SOS PHOTO' : s.source === 'PARAMEDIC_SCENE' ? 'SCENE PHOTO' : 'CABIN SCAN'}
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              left: 2,
                              height: 15,
                              fontSize: '0.55rem',
                              fontWeight: 800,
                              backgroundColor: isSos ? 'rgba(248,81,73,0.92)' : s.source === 'PARAMEDIC_SCENE' ? 'rgba(210,153,34,0.92)' : 'rgba(56,139,253,0.92)',
                              color: '#ffffff'
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              borderRadius: '50%',
                              p: 0.3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <ZoomInIcon sx={{ color: '#fff', fontSize: 14 }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px dashed #30363d', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                      No photos attached yet. Tap "+ Add Cabin Photo" to transmit field injury scans to the receiving ED.
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 1.5, borderColor: '#30363d' }} />

              {/* ========================================================================= */}
              {/* AI NEAREST HOSPITAL ANALYSIS & RECOMMENDATION ENGINE                      */}
              {/* ========================================================================= */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ color: '#bc8cff', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#bc8cff' }}>
                      AI NEAREST HOSPITAL ANALYZER
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleRunAiEvaluation}
                    disabled={evaluating}
                    startIcon={evaluating ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon fontSize="small" />}
                    sx={{
                      fontSize: '0.72rem',
                      py: 0.3,
                      px: 1,
                      color: '#bc8cff',
                      borderColor: '#bc8cff',
                      fontWeight: 700,
                      '&:hover': { backgroundColor: 'rgba(188, 140, 255, 0.15)', borderColor: '#bc8cff' }
                    }}
                  >
                    {evaluating ? 'Analyzing Regional EDs...' : '⚡ Re-analyze with AI'}
                  </Button>
                </Box>

                {/* Primary AI Recommendation Banner */}
                <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: 'rgba(188, 140, 255, 0.1)', border: '1px solid rgba(188, 140, 255, 0.35)', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#bc8cff' }}>
                      {recommendation?.selectedHospitalName || 'Calculating recommendation...'}
                    </Typography>
                    <Chip
                      label="⭐ AI #1 MATCH"
                      size="small"
                      sx={{ backgroundColor: '#bc8cff', color: '#090d13', fontWeight: 800, fontSize: '0.68rem', height: 20 }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block' }}>
                    {recommendation?.summaryReason || 'Optimal destination based on clinical specialty, trauma capabilities, open resuscitation suites, and live transit ETA.'}
                  </Typography>
                </Box>

                {/* Candidate Destinations Comparison Cards */}
                {recommendation?.candidates && recommendation.candidates.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>
                        EVALUATED REGIONAL FACILITIES (RANKED BY AI):
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setShowAllCandidates(!showAllCandidates)}
                        sx={{ fontSize: '0.65rem', color: '#58a6ff', p: 0 }}
                      >
                        {showAllCandidates ? 'Collapse' : `Show All (${recommendation.candidates.length})`}
                      </Button>
                    </Box>

                    {showAllCandidates && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {recommendation.candidates.map((cand: any, idx: number) => {
                          const isSelected = selectedHospitalId === cand.hospitalId;
                          const scorePct = Math.round((cand.overallSuitabilityScore || 0.9 - idx * 0.12) * 100);

                          return (
                            <Box
                              key={cand.hospitalId || idx}
                              sx={{
                                p: 1.2,
                                borderRadius: 1.5,
                                backgroundColor: isSelected ? 'rgba(56, 139, 253, 0.12)' : '#0d1117',
                                border: isSelected ? '1px solid #58a6ff' : '1px solid #30363d',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: isSelected ? '#58a6ff' : '#f0f6fc' }}>
                                    #{idx + 1} {cand.hospitalName}
                                  </Typography>
                                  {idx === 0 && (
                                    <Chip label="Top Pick" size="small" sx={{ height: 16, fontSize: '0.6rem', backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', fontWeight: 700 }} />
                                  )}
                                </Box>
                                <Chip
                                  label={`${scorePct}% Match`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    backgroundColor: scorePct >= 85 ? 'rgba(63, 185, 80, 0.2)' : scorePct >= 70 ? 'rgba(210, 153, 34, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                                    color: scorePct >= 85 ? '#3fb950' : scorePct >= 70 ? '#d29922' : '#f85149'
                                  }}
                                />
                              </Box>

                              <Box sx={{ display: 'flex', gap: 2, mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                {(() => {
                                  const { dist, eta } = getDisplayDistanceAndEta(cand, idx);
                                  return (
                                    <>
                                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <TimerIcon sx={{ fontSize: 13, color: '#58a6ff' }} />
                                        ETA: <strong>{eta} mins</strong>
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <RouteIcon sx={{ fontSize: 13, color: '#8b949e' }} />
                                        Distance: <strong>{dist} km</strong>
                                      </Typography>
                                    </>
                                  );
                                })()}
                                <Typography variant="caption" sx={{ color: '#8b949e' }}>
                                  Trauma Level: <strong>{cand.hospitalCode === 'HOSP-001' ? 'Level 1' : cand.hospitalCode === 'HOSP-002' ? 'Level 2' : 'Level 3'}</strong>
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.68rem', fontStyle: 'italic', maxWidth: '75%' }}>
                                  {cand.rationale || 'Specialty trauma suites available, rapid transit corridor.'}
                                </Typography>
                                {!isSelected ? (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      setSelectedHospitalId(Number(cand.hospitalId));
                                      setDecisionType('ACCEPT');
                                    }}
                                    sx={{ fontSize: '0.65rem', py: 0.1, px: 1, borderColor: '#30363d', color: '#c9d1d9' }}
                                  >
                                    Select
                                  </Button>
                                ) : (
                                  <Chip label="Selected" size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#238636', color: '#fff', fontWeight: 700 }} />
                                )}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Paramedic Decision Selector */}
              <TextField
                select
                fullWidth
                label="Paramedic Decision Action"
                value={decisionType}
                onChange={(e) => setDecisionType(e.target.value)}
                size="small"
                sx={{ mb: 2 }}
              >
                <MenuItem value="ACCEPT">ACCEPT — Confirm Recommended Facility</MenuItem>
                <MenuItem value="SELECT_ANOTHER">SELECT ANOTHER — Choose from regional facilities</MenuItem>
                <MenuItem value="OVERRIDE">OVERRIDE — Clinical judgment override</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="Selected Target Hospital"
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
                size="small"
                sx={{ mb: 2 }}
              >
                {hospitals.map((h) => (
                  <MenuItem key={h.id} value={h.id}>
                    {h.name} ({h.traumaLevel}) • Code: {h.hospitalCode}
                  </MenuItem>
                ))}
              </TextField>

              {decisionType !== 'ACCEPT' && (
                <TextField
                  fullWidth
                  label="Mandatory Clinical Rationale for Override"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  size="small"
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                  placeholder="Explain why clinical judgment overrides the algorithm..."
                />
              )}

              {/* Dispatch Button */}
              <Button
                id="btn-dispatch-prealert"
                fullWidth
                variant="contained"
                size="large"
                onClick={handleConfirmDecision}
                disabled={!selectedHospitalId || !canDispatch || dispatching}
                sx={{
                  py: 1.5,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  backgroundColor: '#da3633',
                  color: '#ffffff',
                  boxShadow: '0 0 15px rgba(218, 54, 51, 0.4)',
                  '&:hover': { backgroundColor: '#b62324' }
                }}
              >
                {dispatching
                  ? 'Transmitting Pre-Alert...'
                  : `🚨 DISPATCH PRE-ALERT TO ${selectedHospital?.name?.toUpperCase() || 'HOSPITAL'}`}
              </Button>

              {dispatchStatus && (
                <Alert severity="info" sx={{ mt: 2, backgroundColor: 'rgba(56, 139, 253, 0.1)', color: '#58a6ff', border: '1px solid #388bfd' }}>
                  {dispatchStatus}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Three-Step Dispatch Pipeline Status */}
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block', mb: 1.5 }}>
                DISPATCH SYNCHRONIZATION PIPELINE:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Step 1 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: activePreAlert ? '#3fb950' : '#8b949e', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: activePreAlert ? '#f0f6fc' : '#8b949e' }}>
                      1. Pre-Alert Dispatched to Hospital
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>
                      {activePreAlert ? `Transmitted to ${activePreAlert.hospitalName}` : 'Standby — Ready to dispatch'}
                    </Typography>
                  </Box>
                </Box>

                {/* Step 2 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: isAccepted ? '#3fb950' : '#d29922', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isAccepted ? '#f0f6fc' : '#8b949e' }}>
                      2. Receiving ED Acceptance & Bay Mobilization
                    </Typography>
                    <Typography variant="caption" sx={{ color: isAccepted ? '#3fb950' : '#d29922', fontWeight: 600 }}>
                      {isAccepted
                        ? `✓ Accepted by ${activePreAlert.acknowledgedBy || 'ED Coordinator'} — Trauma Bay Reserved`
                        : activePreAlert
                          ? '⏳ Awaiting Hospital In-Charge Acceptance...'
                          : 'Pending dispatch'}
                    </Typography>
                  </Box>
                </Box>

                {/* Step 3 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: activePreAlert?.doctorOrders ? '#3fb950' : '#8b949e', fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: activePreAlert?.doctorOrders ? '#f0f6fc' : '#8b949e' }}>
                      3. On-Call Specialist Pre-Arrival Directives
                    </Typography>
                    <Typography variant="caption" sx={{ color: activePreAlert?.doctorOrders ? '#bc8cff' : '#8b949e' }}>
                      {activePreAlert?.doctorOrders
                        ? `Directives received from ${activePreAlert.assignedDoctorName || 'Doctor'}`
                        : 'Standby for specialist directives'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE NAVIGATION MAP & HOSPITAL COMMUNICATIONS               */}
        {/* ========================================================================= */}
        <Grid item xs={12} md={7}>
          {/* Live Approaching Google-Maps Navigation */}
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', mb: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NavigationIcon sx={{ color: '#58a6ff', fontSize: 22 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                    Live En-Route Approaching Navigation (Ambulance ➔ Emergency Department)
                  </Typography>
                </Box>
                <Chip
                  label={
                    isArrived
                      ? 'Ambulance Arrived at Bay'
                      : isAccepted
                      ? 'Turn-by-Turn GPS Active'
                      : isPending
                      ? 'Pre-Alert Dispatched — Awaiting ED'
                      : 'Stationary at Scene'
                  }
                  size="small"
                  sx={{
                    backgroundColor: isArrived
                      ? 'rgba(63, 185, 80, 0.2)'
                      : isAccepted
                      ? 'rgba(56, 139, 253, 0.2)'
                      : isPending
                      ? 'rgba(210, 153, 34, 0.2)'
                      : 'rgba(139, 148, 158, 0.2)',
                    color: isArrived ? '#3fb950' : isAccepted ? '#58a6ff' : isPending ? '#d29922' : '#8b949e',
                    fontWeight: 700
                  }}
                />
              </Box>

              <LiveApproachingMap
                hospitalName={selectedHospital?.name || activePreAlert?.hospitalName || recommendation?.selectedHospitalName || 'Apex Regional Trauma & Specialty Center'}
                hospitalLat={hospitalLat}
                hospitalLon={hospitalLon}
                initialAmbLat={incidentLat}
                initialAmbLon={incidentLon}
                vehicleNumber={activePreAlert?.vehicleNumber || 'AMB-01 (Medic One)'}
                initialEtaMinutes={
                  activePreAlert?.etaMinutes && activePreAlert.etaMinutes < 60
                    ? activePreAlert.etaMinutes
                    : Math.max(3, Math.round(calculateHaversineDistanceKm(incidentLat, incidentLon, hospitalLat, hospitalLon) * 1.6 + 2))
                }
                height={350}
                isAccepted={isAccepted}
                isArrived={isArrived}
                isPending={isPending}
                onMarkArrived={handleMarkArrived}
              />
            </CardContent>
          </Card>

          {/* Receiving Hospital Response & Specialist Directives */}
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActiveIcon sx={{ color: isArrived ? '#3fb950' : isAccepted ? '#3fb950' : '#f85149', fontSize: 22 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                    Receiving Hospital ED Status & Pre-Arrival Directives
                  </Typography>
                </Box>
                {isArrived ? (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#3fb950 !important' }} />}
                    label="AMBULANCE ARRIVED AT BAY"
                    size="small"
                    sx={{ backgroundColor: 'rgba(63, 185, 80, 0.25)', color: '#3fb950', border: '1px solid #3fb950', fontWeight: 800 }}
                  />
                ) : isAccepted ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#3fb950 !important' }} />}
                      label="HOSPITAL MOBILIZED"
                      size="small"
                      sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', border: '1px solid #3fb950', fontWeight: 800 }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleMarkArrived}
                      sx={{
                        fontSize: '0.72rem',
                        py: 0.2,
                        px: 1,
                        color: '#3fb950',
                        borderColor: '#238636',
                        fontWeight: 700,
                        textTransform: 'none',
                        '&:hover': { backgroundColor: 'rgba(35, 134, 54, 0.2)' }
                      }}
                    >
                      🏁 Mark Arrived
                    </Button>
                  </Box>
                ) : (
                  <Chip
                    label={activePreAlert ? 'AWAITING ED ACCEPTANCE' : 'STANDBY AT SCENE'}
                    size="small"
                    sx={{ backgroundColor: 'rgba(210, 153, 34, 0.2)', color: '#d29922', border: '1px solid #d29922', fontWeight: 700 }}
                  />
                )}
              </Box>

              {/* Hospital Reservations */}
              {isAccepted && (
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <SingleBedIcon sx={{ color: '#3fb950', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>RESERVED TRAUMA BAY</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#3fb950' }}>
                        {activePreAlert?.reservedBeds || 'Trauma Bay 1 (Resuscitation)'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <BloodtypeIcon sx={{ color: '#f85149', fontSize: 18 }} />
                        <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>BLOOD BANK STANDBY</Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: '#f85149' }}>
                        {activePreAlert?.reservedBloodUnits > 0 ? `${activePreAlert.reservedBloodUnits} Units O-Neg PRBCs` : '4 Units O-Neg on Standby'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Specialist Pre-Arrival Directives */}
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: activePreAlert?.doctorOrders ? 'rgba(188, 140, 255, 0.12)' : '#0d1117', border: activePreAlert?.doctorOrders ? '1px solid #bc8cff' : '1px solid #30363d' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon sx={{ color: '#bc8cff', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#bc8cff' }}>
                    ON-CALL DOCTOR PRE-ARRIVAL DIRECTIVES:
                  </Typography>
                </Box>

                {activePreAlert?.doctorOrders ? (
                  <Box>
                    <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 700, mb: 1 }}>
                      "{activePreAlert.doctorOrders}"
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>
                      Transmitted by <strong>{activePreAlert.assignedDoctorName || 'On-Call Specialist'}</strong> at {new Date(activePreAlert.doctorNotifiedAt || '').toLocaleTimeString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#8b949e' }}>
                    {activePreAlert
                      ? '⏳ On-call specialist has been notified and is inspecting the live patient digital twin. Pre-arrival directives will appear here automatically.'
                      : 'Dispatch pre-alert to receiving hospital to initiate on-call specialist direct communication link.'}
                  </Typography>
                )}
              </Box>

              {/* Field Interventions Summary */}
              <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                <Typography variant="caption" sx={{ color: '#d29922', fontWeight: 700, display: 'block', mb: 0.5 }}>
                  ACTIVE FIELD INTERVENTIONS TRANSMITTED TO ED:
                </Typography>
                <Typography variant="body2" sx={{ color: '#c9d1d9' }}>
                  {activePreAlert?.interventionsPerformed || 'High-flow O2 15L/min NRB, 2x large-bore IV 18G established, C-collar placed, monitoring continuous ECG & SpO2.'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* High-Resolution Photo Lightbox Dialog */}
      <Dialog
        open={Boolean(lightboxSnap)}
        onClose={() => setLightboxSnap(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon sx={{ color: lightboxSnap?.source === 'CITIZEN_SOS' ? '#f85149' : '#58a6ff' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              {lightboxSnap?.label || (lightboxSnap?.source === 'CITIZEN_SOS' ? 'Citizen SOS Incident Photo' : 'Cabin Trauma Snapshot')}
            </Typography>
            <Chip
              label={lightboxSnap?.source === 'CITIZEN_SOS' ? 'CITIZEN SOS' : lightboxSnap?.source === 'PARAMEDIC_SCENE' ? 'PARAMEDIC ON-SCENE' : 'AMBULANCE CABIN'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                backgroundColor: lightboxSnap?.source === 'CITIZEN_SOS' ? '#da3633' : lightboxSnap?.source === 'PARAMEDIC_SCENE' ? '#d29922' : '#238636',
                color: '#ffffff'
              }}
            />
          </Box>
          <IconButton onClick={() => setLightboxSnap(null)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, textAlign: 'center', backgroundColor: '#090d13' }}>
          {lightboxSnap && (
            <img
              src={lightboxSnap.highResSnap || lightboxSnap.dataUrl}
              alt={lightboxSnap.label || 'Incident High-Res Photo'}
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }}
            />
          )}
          {lightboxSnap?.timestamp && (
            <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 1 }}>
              Captured at: {new Date(lightboxSnap.timestamp).toLocaleString()}
            </Typography>
          )}
          {lightboxSnap?.aiFinding && (
            <Box sx={{ mt: 2, p: 2, textAlign: 'left', backgroundColor: 'rgba(210, 153, 34, 0.12)', border: '1px solid #d29922', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesomeIcon sx={{ color: '#ffd33d', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ color: '#ffd33d', fontWeight: 800 }}>
                    CLINICAL VISION AI FINDINGS & INJURY ASSESSMENT:
                  </Typography>
                </Box>
                {lightboxSnap?.confidence && (
                  <Chip
                    label={`Confidence: ${lightboxSnap.confidence}%`}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem', backgroundColor: 'rgba(210, 153, 34, 0.25)', color: '#ffd33d', fontWeight: 700 }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: '#ff7b72', fontWeight: 700, mt: 0.5 }}>
                {lightboxSnap.aiFinding}
              </Typography>
              {lightboxSnap.injuryRegion && (
                <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', mt: 0.5 }}>
                  Identified Region: <strong>{lightboxSnap.injuryRegion}</strong>
                  {lightboxSnap.bleedingDesc && ` • ${lightboxSnap.bleedingDesc}`}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setLightboxSnap(null)} sx={{ color: '#c9d1d9' }}>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
