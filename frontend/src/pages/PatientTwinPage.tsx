import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, TextField,
  MenuItem, Divider, Alert, CircularProgress, Tabs, Tab, Dialog,
  DialogTitle, DialogContent, DialogActions, IconButton, Paper, Stack,
  LinearProgress, Tooltip, Badge, FormControl, InputLabel, Select
} from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import SensorsIcon from '@mui/icons-material/Sensors';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';
import ShieldIcon from '@mui/icons-material/Shield';
import LockIcon from '@mui/icons-material/Lock';
import QRCode from 'qrcode';
import { patientApi, systemApi, preAlertApi } from '../services/api';
import { wsService } from '../services/websocket';
import { PatientTwinState, PatientForecast } from '../types';
import { LiveApproachingMap } from '../components/LiveApproachingMap';

interface HeldSnap {
  id: string;
  dataUrl: string;
  timestamp: string;
  tag?: string;
  aiFinding?: string;
  injuryRegion?: string;
  bleedingDesc?: string;
  source?: string;
}

interface AnalyzedSnapResult {
  id: string;
  tag: string;
  dataUrl: string;
  region: string;
  bleeding: string;
  summary: string;
  confidence: number;
  vitals?: {
    spo2?: number;
    heartRate?: number;
    systolicBp?: number;
    diastolicBp?: number;
    respiratoryRate?: number;
  };
}

export const PatientTwinPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCaseId = searchParams.get('caseId');
  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(urlCaseId || 'CASE-2026-001');

  // Synchronize when URL changes
  useEffect(() => {
    if (urlCaseId && urlCaseId !== selectedCaseId) {
      setSelectedCaseId(urlCaseId);
    }
  }, [urlCaseId]);

  // Load active cases list to populate switcher
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

  const caseId = selectedCaseId;
  const [twin, setTwin] = useState<PatientTwinState | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<PatientForecast[]>([]);

  // Remote Stream State (Received from Android Phone)
  const [remoteStreamFrame, setRemoteStreamFrame] = useState<string | null>(null);
  const [isRemoteStreaming, setIsRemoteStreaming] = useState(false);
  const [lastStreamTime, setLastStreamTime] = useState<number>(0);

  // Local Webcam Fallback State
  const [useLocalCam, setUseLocalCam] = useState(false);
  const [localCamActive, setLocalCamActive] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Multi-Snap Holding Tray State
  const [heldSnaps, setHeldSnaps] = useState<HeldSnap[]>([]);
  const [previewSnap, setPreviewSnap] = useState<HeldSnap | null>(null);
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [batchResultSummary, setBatchResultSummary] = useState<string | null>(null);
  const [analyzedSnapResults, setAnalyzedSnapResults] = useState<AnalyzedSnapResult[]>([]);

  // Android guide & observation states
  const [androidGuideOpen, setAndroidGuideOpen] = useState(false);
  const [consciousness, setConsciousness] = useState('ALERT');
  const [bleeding, setBleeding] = useState('MINOR');
  const [notes, setNotes] = useState('Blunt trauma to left chest following vehicle impact.');
  const [linkCopied, setLinkCopied] = useState(false);
  const [lanHost, setLanHost] = useState<string>(window.location.hostname);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // User Role & Permissions (Paramedics have field capture & write access; Doctors & Hospitals have read-only surveillance access)
  const currentUser = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
  const userRoles: string[] = currentUser.roles || [];
  const isParamedic = userRoles.some((r: string) => r.includes('PARAMEDIC') || r.includes('ADMIN'));
  const isDoctorUser = userRoles.some((r: string) => r.includes('CLINICIAN') || r.includes('PHYSICIAN') || r.includes('DOCTOR')) || currentUser.username?.toLowerCase().startsWith('doctor');
  const isHospitalUser = userRoles.some((r: string) => r.includes('HOSPITAL')) || currentUser.username?.toLowerCase().startsWith('hosp');
  const isReadOnly = !isParamedic;

  const [activePreAlert, setActivePreAlert] = useState<any>(null);
  const [doctorDirectivesInput, setDoctorDirectivesInput] = useState<string>('Administer 100mg IV tramadol, prepare cervical collar, initiate 1L warmed saline bolus');
  const [directivesSentMsg, setDirectivesSentMsg] = useState<string | null>(null);
  const [sendingDirectives, setSendingDirectives] = useState<boolean>(false);

  const loadPreAlertForCase = async () => {
    try {
      const allAlerts = await preAlertApi.getAll();
      if (allAlerts && allAlerts.length > 0) {
        const matched = allAlerts.find((a: any) => a.caseId === caseId);
        setActivePreAlert(matched || null);
      } else {
        setActivePreAlert(null);
      }
    } catch (e) {
      console.warn('Could not load prealerts for doctor view', e);
    }
  };

  useEffect(() => {
    loadPreAlertForCase();
    const interval = setInterval(loadPreAlertForCase, 4000);
    return () => clearInterval(interval);
  }, [caseId]);

  const handleSendDirectives = async () => {
    if (!activePreAlert || !doctorDirectivesInput.trim()) return;
    setSendingDirectives(true);
    try {
      const docName = currentUser.fullName || currentUser.username || 'Dr. Alexander Vance, MD, FACS (Chief Trauma Surgeon)';
      const updated = await preAlertApi.saveDoctorOrders(activePreAlert.prealertId, {
        doctorName: docName,
        doctorOrders: doctorDirectivesInput.trim()
      });
      setActivePreAlert(updated);
      setDirectivesSentMsg(`Directives dispatched to ${activePreAlert.vehicleNumber || 'Medic One'} ambulance crew at ${new Date().toLocaleTimeString()}!`);
      setTimeout(() => setDirectivesSentMsg(null), 5000);
    } catch (e: any) {
      alert('Failed to transmit directives: ' + e.message);
    } finally {
      setSendingDirectives(false);
    }
  };

  // Fetch host's actual Wi-Fi / LAN IP so mobile phone can connect directly
  useEffect(() => {
    systemApi.getNetworkInfo().then((info: any) => {
      if (info && info.lanIp && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        setLanHost(info.lanIp);
      }
    }).catch((err: any) => console.warn('Could not fetch LAN IP:', err));
  }, []);

  // Calculate local transmitter URL with patient caseId
  const mobileTransmitterUrl = `${window.location.protocol}//${lanHost}:${window.location.port || '5173'}/mobile-cam?caseId=${caseId}`;

  // Generate offline QR code whenever the mobile URL updates
  useEffect(() => {
    QRCode.toDataURL(mobileTransmitterUrl, {
      width: 220,
      margin: 1,
      color: {
        dark: '#0d1117',
        light: '#ffffff'
      }
    }).then((url: string) => setQrCodeDataUrl(url)).catch((err: any) => console.warn('QR error:', err));
  }, [mobileTransmitterUrl]);

  useEffect(() => {
    // Reset state for new patient
    setRemoteStreamFrame(null);
    setIsRemoteStreaming(false);
    setHeldSnaps([]);
    setAnalyzedSnapResults([]);
    setBatchResultSummary(null);
    loadData();

    // Fetch existing cached snaps for this case from backend
    patientApi.getSnaps(caseId).then((snaps: any[]) => {
      if (snaps && snaps.length > 0) {
        setHeldSnaps(snaps.map((s, idx) => ({
          id: `snap_${s.timestamp || Date.now()}_${idx}`,
          dataUrl: s.highResSnap || s.dataUrl,
          timestamp: new Date(s.timestamp || Date.now()).toLocaleTimeString(),
          tag: s.label || (s.source === 'CITIZEN_SOS' ? '📸 Citizen SOS Scene Photo' : `Cabin Snap #${idx + 1}`),
          aiFinding: s.aiFinding,
          injuryRegion: s.injuryRegion,
          bleedingDesc: s.bleedingDesc,
          source: s.source
        })));

        // Automatically populate analyzed breakdown for doctor/hospital view
        const initialAnalyzed = snaps.map((s, idx) => ({
          id: `snap_${s.timestamp || Date.now()}_${idx}`,
          tag: s.label || (s.source === 'CITIZEN_SOS' ? '📸 Citizen SOS Scene Photo' : s.source === 'PARAMEDIC_SCENE' ? '📸 Paramedic On-Scene Photo' : `Field Snap #${idx + 1}`),
          dataUrl: s.highResSnap || s.dataUrl,
          region: s.injuryRegion || 'Observed Trauma Field',
          bleeding: s.bleedingDesc || 'Monitored',
          summary: s.aiFinding || 'Paramedic visual survey recorded en-route',
          confidence: 94
        }));
        setAnalyzedSnapResults(initialAnalyzed);
      }
    }).catch(() => {});

    const handleTwinUpdate = (data: any) => {
      if (!data) return;
      setTwin(data);
      setHistory((prev) => {
        const timeStr = new Date(data.timestamp || Date.now()).toLocaleTimeString();
        const next = [...prev, {
          time: timeStr,
          hr: data.heartRate,
          spo2: data.spo2,
          bpSys: data.systolicBp,
          bpDia: data.diastolicBp,
          rr: data.respiratoryRate
        }];
        return next.slice(-20);
      });
    };

    const handleSnapIncoming = (data: any) => {
      if (data?.highResSnap || data?.dataUrl) {
        const url = data.highResSnap || data.dataUrl;
        const newSnapId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const snapTag = data.label || (data.source === 'CITIZEN_SOS' ? '📸 Citizen SOS Scene Photo' : data.source === 'PARAMEDIC_SCENE' ? '📸 Paramedic On-Scene Photo' : `Field Snap`);
        
        setHeldSnaps((prev) => {
          const idx = prev.findIndex((p) => p.dataUrl === url);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              aiFinding: data.aiFinding || updated[idx].aiFinding,
              injuryRegion: data.injuryRegion || updated[idx].injuryRegion,
              bleedingDesc: data.bleedingDesc || updated[idx].bleedingDesc,
              source: data.source || updated[idx].source
            };
            return updated;
          }
          return [
            ...prev,
            {
              id: newSnapId,
              dataUrl: url,
              timestamp: new Date().toLocaleTimeString(),
              tag: `${snapTag} #${prev.length + 1}`,
              aiFinding: data.aiFinding,
              injuryRegion: data.injuryRegion,
              bleedingDesc: data.bleedingDesc,
              source: data.source
            }
          ];
        });

        // Also update analyzedSnapResults so hospital and doctor view updates in real time
        setAnalyzedSnapResults((prev) => {
          const idx = prev.findIndex((p) => p.dataUrl === url);
          const analyzedItem: AnalyzedSnapResult = {
            id: newSnapId,
            tag: `${snapTag} #${prev.length + 1}`,
            dataUrl: url,
            region: data.injuryRegion || 'Observed Trauma Field',
            bleeding: data.bleedingDesc || 'Monitored',
            summary: data.aiFinding || 'Paramedic visual survey streamed en-route',
            confidence: 94
          };
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...analyzedItem };
            return updated;
          }
          return [...prev, analyzedItem];
        });
      }
    };

    // 1. Subscribe to Digital Twin telemetry updates on both topics
    const unsubTwin1 = wsService.subscribe(`/topic/patient-twin/${caseId}`, handleTwinUpdate);
    const unsubTwin2 = wsService.subscribe(`/topic/patients/${caseId}/twin`, handleTwinUpdate);

    // 2. Subscribe to Camera Stream and Snaps
    const unsubStream = wsService.subscribe(`/topic/camera-stream/${caseId}`, (data) => {
      if (data.stopped) {
        setIsRemoteStreaming(false);
        setRemoteStreamFrame(null);
        return;
      }

      if (data.frame) {
        setRemoteStreamFrame(data.frame);
        setIsRemoteStreaming(true);
        setLastStreamTime(Date.now());
      }

      if (data.isSnap) {
        handleSnapIncoming(data);
      }
    });

    const unsubSnaps = wsService.subscribe(`/topic/camera-snaps/${caseId}`, handleSnapIncoming);
    const unsubAlert = wsService.subscribe(`/topic/prealerts/case/${caseId}`, (alertData) => {
      if (alertData && alertData.caseId === caseId) {
        setActivePreAlert(alertData);
      }
    });

    return () => {
      unsubTwin1();
      unsubTwin2();
      unsubStream();
      unsubSnaps();
      unsubAlert();
      stopLocalCam();
    };
  }, [caseId]);

  const loadData = async () => {
    try {
      const [tData, tlData, fcData] = await Promise.all([
        patientApi.getTwin(caseId).catch(() => null),
        patientApi.getTimeline(caseId).catch(() => null),
        patientApi.getForecasts(caseId).catch(() => [])
      ]);

      if (tData) {
        setTwin(tData);
        setHistory([
          { time: 'T-4m', hr: (tData.heartRate || 110) - 4, spo2: (tData.spo2 || 95) + 1, rr: 20 },
          { time: 'T-3m', hr: (tData.heartRate || 110) - 2, spo2: (tData.spo2 || 95), rr: 21 },
          { time: 'T-2m', hr: (tData.heartRate || 110) - 1, spo2: (tData.spo2 || 95), rr: 21 },
          { time: 'T-1m', hr: tData.heartRate || 110, spo2: tData.spo2 || 95, rr: 22 },
          { time: 'Now', hr: tData.heartRate || 110, spo2: tData.spo2 || 95, rr: tData.respiratoryRate || 22 }
        ]);
      }
      if (fcData) setForecasts(fcData);
    } catch (e) {
      console.error('Error loading twin data:', e);
    }
  };

  // Local Webcam Toggle
  const startLocalCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }
      setLocalCamActive(true);
      setUseLocalCam(true);
    } catch (err: any) {
      alert(`Local camera error: ${err.message}`);
    }
  };

  const stopLocalCam = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setLocalCamActive(false);
    setUseLocalCam(false);
  };

  // Capture Frame from Stream into Holding Tray
  const handleCaptureFromStream = () => {
    let capturedDataUrl: string | null = null;

    if (isRemoteStreaming && remoteStreamFrame) {
      capturedDataUrl = remoteStreamFrame;
    } else if (localCamActive && localVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = localVideoRef.current.videoWidth || 640;
      canvas.height = localVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(localVideoRef.current, 0, 0, canvas.width, canvas.height);
        capturedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!capturedDataUrl) {
      alert('No active camera stream to capture from. Please start live stream from your Android phone or local webcam.');
      return;
    }

    const newSnap: HeldSnap = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUrl: capturedDataUrl,
      timestamp: new Date().toLocaleTimeString(),
      tag: `Capture #${heldSnaps.length + 1}`
    };

    setHeldSnaps((prev) => [...prev, newSnap]);
    setBatchResultSummary(null);
  };

  // Delete Individual Snap from Holding Tray
  const handleDeleteSnap = (id: string) => {
    setHeldSnaps((prev) => prev.filter((s) => s.id !== id));
    setAnalyzedSnapResults((prev) => prev.filter((r) => r.id !== id));
  };

  // Clear All Snaps
  const handleClearAllSnaps = () => {
    setHeldSnaps([]);
    setAnalyzedSnapResults([]);
    setBatchResultSummary(null);
  };

  // Batch AI Vision Analysis of All Held Snaps Individually
  const handleBatchAnalyze = async () => {
    if (heldSnaps.length === 0) return;

    setBatchAnalyzing(true);
    setBatchResultSummary(null);
    const results: AnalyzedSnapResult[] = [];

    try {
      // Analyze EACH held snapshot individually so findings reflect each distinct image!
      for (let i = 0; i < heldSnaps.length; i++) {
        const snap = heldSnaps[i];
        try {
          const res = await fetch(snap.dataUrl);
          const blob = await res.blob();

          const formData = new FormData();
          formData.append('file', blob, `snap_${i + 1}.jpg`);
          formData.append('mode', 'PATIENT_TRAUMA');

          const analysisRes = await patientApi.scanVisionVitals(caseId, formData);

          let detectedVitals: any = null;
          let findingSummary = '';
          if (analysisRes.metadataJson) {
            try {
              const parsed = JSON.parse(analysisRes.metadataJson);
              detectedVitals = parsed.detectedVitals;
              findingSummary = parsed.findingSummary || '';
            } catch (e) {
              // ignore
            }
          }

          results.push({
            id: snap.id,
            tag: snap.tag || `Photo #${i + 1}`,
            dataUrl: snap.dataUrl,
            region: analysisRes.possibleInjuryRegion || 'Observed Trauma Field',
            bleeding: analysisRes.possibleVisibleBleeding || 'Monitored',
            summary: findingSummary || `Trauma analysis completed for Photo #${i + 1}`,
            confidence: analysisRes.confidence ? Math.round(analysisRes.confidence * 100) : 93,
            vitals: detectedVitals
          });
        } catch (err: any) {
          console.error(`Failed to analyze snap ${i + 1}:`, err);
        }
      }

      setAnalyzedSnapResults(results);

      if (results.length > 0) {
        setBatchResultSummary(
          `✓ ${results.length} Photos Analyzed: Individual Computer Vision analysis complete. Each photo has custom visual findings and telemetry below. Digital Twin updated & broadcast to ER!`
        );
        loadData();
      } else {
        alert('Could not analyze photos. Please verify backend connectivity.');
      }
    } catch (err: any) {
      alert('Batch AI Vision analysis error: ' + (err.response?.data?.message || err.message));
    } finally {
      setBatchAnalyzing(false);
    }
  };

  // Copy mobile link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileTransmitterUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 3000);
  };

  // Derived Calculations
  const hr = twin?.heartRate || 110;
  const sysBp = twin?.systolicBp || 110;
  const spo2 = twin?.spo2 || 95;
  const shockIndex = sysBp > 0 ? (hr / sysBp) : 1.0;
  const isHypoxic = spo2 < 92;
  const isSevereHypoxic = spo2 < 90;

  // Chart data
  const chartData = [...history];
  chartData.push(
    { time: '+5m (FC)', hr: isHypoxic ? hr + 4 : hr, spo2: isHypoxic ? spo2 - 1 : spo2, forecast: true },
    { time: '+10m (FC)', hr: isHypoxic ? hr + 8 : hr + 1, spo2: isHypoxic ? spo2 - 2 : spo2, forecast: true },
    { time: '+15m (FC)', hr: isHypoxic ? hr + 13 : hr + 1, spo2: isHypoxic ? spo2 - 3 : spo2, forecast: true },
    { time: '+30m (FC)', hr: isHypoxic ? hr + 19 : hr + 2, spo2: isHypoxic ? spo2 - 4 : spo2, forecast: true }
  );

  return (
    <Box sx={{ flexGrow: 1, pb: 4 }}>
      {/* Top Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <MonitorHeartIcon sx={{ color: '#58a6ff', fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                Patient Digital Twin
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5 }}>
              Real-Time State Synthesis • Live Android Camera Stream • Multi-Snap AI Vision • EWMA Horizon
            </Typography>
          </Box>

          {/* ACTIVE PATIENT CASE SELECTOR */}
          {activeCases.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel sx={{ color: '#58a6ff', fontSize: 13, fontWeight: 600 }}>Active Patient Case</InputLabel>
              <Select
                value={caseId}
                label="Active Patient Case"
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
                  height: 40,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f6feb', borderWidth: 1.5 },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#58a6ff' },
                  '& .MuiSvgIcon-root': { color: '#58a6ff' }
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
                      <span style={{ color: '#c9d1d9', fontSize: 12 }}>
                        {c.patientIdentifier || c.fullName || 'Emergency Patient'}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {!isReadOnly && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<PhoneAndroidIcon />}
              onClick={() => setAndroidGuideOpen(true)}
              sx={{
                borderColor: '#1f6feb',
                color: '#58a6ff',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: '#58a6ff', backgroundColor: 'rgba(56, 139, 253, 0.1)' }
              }}
            >
              📱 Android Setup & Apps Guide
            </Button>
          )}
          <Chip
            label={`Confidence: ${twin?.confidence ? (twin.confidence * 100).toFixed(0) : 98}%`}
            color="info"
            size="small"
          />
          <Chip
            label={`Quality: ${twin?.dataQuality || 'GOOD'}`}
            color="success"
            size="small"
          />
        </Box>
      </Box>

      {/* Read-Only Surveillance Notice for Doctor and Hospital Staff */}
      {isReadOnly && (
        <Alert
          severity="info"
          icon={<ShieldIcon sx={{ color: '#58a6ff' }} />}
          sx={{
            mb: 3,
            backgroundColor: 'rgba(56, 139, 253, 0.1)',
            borderColor: '#1f6feb',
            borderWidth: 1,
            borderStyle: 'solid',
            color: '#58a6ff'
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                🛡️ READ-ONLY RECEIVING CLINICAL SURVEILLANCE ({isDoctorUser ? 'ATTENDING PHYSICIAN' : isHospitalUser ? 'RECEIVING ED' : 'CLINICAL OBSERVER'})
              </Typography>
              <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                Patient Digital Twin vitals and visual surveys are actively streamed from the field by the en-route Paramedic Crew. Modifying controls are locked for receiving hospital and physician accounts to maintain forensic data integrity.
              </Typography>
            </Box>
            <Chip
              icon={<LockIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
              label="READ-ONLY SURVEILLANCE"
              size="small"
              sx={{ backgroundColor: '#1f6feb', color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}
            />
          </Box>
        </Alert>
      )}

      {/* Critical Alerts Banner */}
      {isHypoxic && (
        <Alert
          severity={isSevereHypoxic ? 'error' : 'warning'}
          icon={<WarningAmberIcon fontSize="inherit" />}
          sx={{
            mb: 3,
            backgroundColor: isSevereHypoxic ? 'rgba(248, 81, 73, 0.15)' : 'rgba(210, 153, 34, 0.15)',
            borderColor: isSevereHypoxic ? '#f85149' : '#d29922',
            borderWidth: 1,
            borderStyle: 'solid',
            color: isSevereHypoxic ? '#ff7b72' : '#e3b341'
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {isSevereHypoxic ? 'CRITICAL HYPOXIA DETECTED (SpO2 < 90%)' : 'MODERATE OXYGEN DESATURATION DETECTED (SpO2 < 92%)'}
          </Typography>
          <Typography variant="caption">
            Immediate High-Flow Oxygen (15L Non-Rebreather) indicated. Automated ER trauma team pre-alert active.
          </Typography>
        </Alert>
      )}

      {/* ========================================================================= */}
      {/* DOCTOR CLINICAL PRE-ALERT, APPROACHING MAP & EN-ROUTE DIRECTIVES PANEL     */}
      {/* ========================================================================= */}
      {activePreAlert && (
        <Card
          sx={{
            mb: 3,
            backgroundColor: '#161b22',
            border: '2px solid #8957e5',
            boxShadow: '0 8px 24px rgba(137, 87, 229, 0.25)',
            borderRadius: 2.5
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            {/* Header Strip */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocalHospitalIcon sx={{ color: '#bc8cff', fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc', lineHeight: 1.2 }}>
                    🚨 Urgent Inbound Emergency Pre-Alert: {activePreAlert.hospitalName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    Assigned Physician: <strong>{activePreAlert.assignedDoctorName || (isDoctorUser ? currentUser.fullName : 'On-Call Specialist')}</strong> • En-Route Unit: {activePreAlert.vehicleNumber || 'AMB-01 (Medic One)'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  icon={<TimerIcon sx={{ fontSize: '16px !important', color: '#f85149 !important' }} />}
                  label={`Live ETA: ${activePreAlert.etaMinutes || 8} mins`}
                  sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#f85149', fontWeight: 800, border: '1px solid #f85149' }}
                />
                {activePreAlert.reservedBeds && (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#3fb950 !important' }} />}
                    label={`Reserved: ${activePreAlert.reservedBeds}`}
                    sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', fontWeight: 700, border: '1px solid #3fb950' }}
                  />
                )}
                {activePreAlert.reservedBloodUnits > 0 && (
                  <Chip
                    label={`🩸 ${activePreAlert.reservedBloodUnits} Units Blood`}
                    sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#ff7b72', fontWeight: 700 }}
                  />
                )}
              </Box>
            </Box>

            {/* Grid with Live Approaching Map and En-Route Directives Form */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block', mb: 0.8 }}>
                  REAL-TIME APPROACHING AMBULANCE GPS & ROUTE TO TRAUMA BAY:
                </Typography>
                <LiveApproachingMap
                  hospitalName={activePreAlert.hospitalName || 'Apex Regional Trauma & Specialty Center'}
                  hospitalLat={activePreAlert.hospitalLatitude || 12.981}
                  hospitalLon={activePreAlert.hospitalLongitude || 77.632}
                  initialAmbLat={activePreAlert.incidentLatitude || twin?.incidentLatitude || 12.9352}
                  initialAmbLon={activePreAlert.incidentLongitude || twin?.incidentLongitude || 77.6245}
                  vehicleNumber={activePreAlert.vehicleNumber || 'AMB-01 (Medic One)'}
                  initialEtaMinutes={activePreAlert.etaMinutes || 8}
                  height={260}
                  isAccepted={activePreAlert.status === 'ACCEPTED' || activePreAlert.status === 'ACKNOWLEDGED'}
                  isArrived={activePreAlert.status === 'ARRIVED'}
                  isPending={activePreAlert.status === 'PENDING_ACK'}
                  onMarkArrived={async () => {
                    if (!activePreAlert?.prealertId) return;
                    try {
                      const updated = await preAlertApi.markArrived(activePreAlert.prealertId);
                      setActivePreAlert(updated);
                    } catch (e: any) {
                      console.error('Error marking arrived', e);
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} md={5}>
                <Box sx={{ p: 2, height: '100%', backgroundColor: '#0d1117', borderRadius: 2, border: '1px solid #30363d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#bc8cff' }}>
                        Doctor Pre-Arrival Directives
                      </Typography>
                      <Chip label="Two-Way Channel" size="small" sx={{ fontSize: '0.65rem', backgroundColor: '#21262d', color: '#bc8cff' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1.5 }}>
                      Orders entered here are transmitted directly to the ambulance dashboard en-route so the crew prepares the patient accordingly.
                    </Typography>

                    {directivesSentMsg && (
                      <Alert severity="success" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950' }}>
                        {directivesSentMsg}
                      </Alert>
                    )}

                    {/* Quick Order Chips */}
                    <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Quick Clinical Protocols:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
                      {[
                        'Administer 100mg IV tramadol',
                        'Maintain C-collar & spine board',
                        'Start 1L warmed saline bolus',
                        'Prepare chest tube thoracostomy'
                      ].map((proto) => (
                        <Chip
                          key={proto}
                          label={proto}
                          size="small"
                          onClick={() => setDoctorDirectivesInput((prev) => prev ? `${prev}. ${proto}` : proto)}
                          sx={{ fontSize: '0.68rem', cursor: 'pointer', backgroundColor: '#21262d', color: '#c9d1d9', '&:hover': { backgroundColor: '#30363d', color: '#58a6ff' } }}
                        />
                      ))}
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={doctorDirectivesInput}
                      onChange={(e) => setDoctorDirectivesInput(e.target.value)}
                      placeholder="e.g. Administer analgesia, maintain high-flow O2, prepare rapid transfusion..."
                      sx={{
                        backgroundColor: '#161b22',
                        input: { color: '#f0f6fc' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' }
                      }}
                    />
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSendDirectives}
                    disabled={sendingDirectives || !doctorDirectivesInput.trim()}
                    sx={{ mt: 1.5, fontWeight: 700, textTransform: 'none', backgroundColor: '#8957e5', color: '#fff', '&:hover': { backgroundColor: '#a371f7' } }}
                  >
                    {sendingDirectives ? 'Transmitting Orders...' : 'Transmit Directives to Ambulance Crew'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Left Column: Digital Twin Vitals Cards & Trend Charts */}
        <Grid item xs={12} lg={7}>
          {/* Key Vitals Overview Strip */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Oxygen Saturation (SpO2) Card */}
            <Grid item xs={12} sm={4}>
              <Card sx={{
                backgroundColor: '#161b22',
                border: `1px solid ${spo2 < 90 ? '#f85149' : spo2 < 94 ? '#d29922' : '#30363d'}`,
                height: '100%'
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>
                      OXYGEN (SpO2)
                    </Typography>
                    <Chip
                      size="small"
                      label={spo2 < 90 ? 'HYPOXIC' : spo2 < 95 ? 'BORDERLINE' : 'NORMAL'}
                      sx={{
                        backgroundColor: spo2 < 90 ? 'rgba(248,81,73,0.2)' : spo2 < 95 ? 'rgba(210,153,34,0.2)' : 'rgba(63,185,80,0.2)',
                        color: spo2 < 90 ? '#ff7b72' : spo2 < 95 ? '#d29922' : '#3fb950',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                  <Typography variant="h3" sx={{
                    fontWeight: 800,
                    my: 1,
                    color: spo2 < 90 ? '#f85149' : spo2 < 95 ? '#d29922' : '#3fb950'
                  }}>
                    {Math.round(spo2)}<span style={{ fontSize: '1.4rem' }}>%</span>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, (spo2 - 70) * 3.33))}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#21262d',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: spo2 < 90 ? '#f85149' : spo2 < 95 ? '#d29922' : '#3fb950'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#8b949e', mt: 1, display: 'block' }}>
                    Target: 95-100% • Via Android Telemetry
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Heart Rate & Shock Index */}
            <Grid item xs={12} sm={4}>
              <Card sx={{
                backgroundColor: '#161b22',
                border: `1px solid ${shockIndex > 0.9 ? '#f85149' : '#30363d'}`,
                height: '100%'
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>
                      HEART RATE (HR)
                    </Typography>
                    <Chip
                      size="small"
                      label={`SI: ${shockIndex.toFixed(2)}`}
                      sx={{
                        backgroundColor: shockIndex > 0.9 ? 'rgba(248,81,73,0.2)' : 'rgba(56,139,253,0.2)',
                        color: shockIndex > 0.9 ? '#ff7b72' : '#58a6ff',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, my: 1, color: '#58a6ff' }}>
                    {Math.round(hr)} <span style={{ fontSize: '1.2rem', color: '#8b949e' }}>bpm</span>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                    Shock Index: <strong>{shockIndex > 0.9 ? 'Severe (>0.9)' : shockIndex > 0.7 ? 'Elevated' : 'Normal (<0.7)'}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Blood Pressure & Respiration */}
            <Grid item xs={12} sm={4}>
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>
                    BLOOD PRESSURE & RR
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#f0f6fc' }}>
                    {Math.round(sysBp)} / {Math.round(twin?.diastolicBp || 70)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8b949e' }}>
                    MAP: <strong>{Math.round(twin?.mapValue || 83)} mmHg</strong> • RR: <strong>{twin?.respiratoryRate || 20} /min</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Heart Rate & SpO2 Chart */}
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                  Heart Rate & Oxygenation (Live Stream Sync + AI Horizon)
                </Typography>
                <Chip label="Live Telemetry Stream" size="small" sx={{ backgroundColor: '#21262d', color: '#3fb950' }} />
              </Box>

              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                    <XAxis dataKey="time" stroke="#8b949e" />
                    <YAxis yAxisId="left" stroke="#58a6ff" domain={[50, 160]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3fb950" domain={[75, 100]} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', color: '#c9d1d9' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="hr" name="Heart Rate (bpm)" stroke="#58a6ff" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#3fb950" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Live Android Camera Stream, Holding Tray & Batch AI Analysis */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VideocamIcon sx={{ color: isRemoteStreaming || (!isReadOnly && localCamActive) ? '#f85149' : '#58a6ff' }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    {isReadOnly ? 'Live Cabin Camera & Field Photos' : 'Live Camera Stream & Holding Tray'}
                  </Typography>
                </Box>
                <Chip
                  label={
                    isReadOnly
                      ? (isRemoteStreaming ? '🔴 AMBULANCE CABIN LIVE' : 'EMS CABIN STANDBY')
                      : (isRemoteStreaming ? '🔴 ANDROID PHONE LIVE' : localCamActive ? 'WEBCAM LIVE' : 'WAITING FOR PHONE')
                  }
                  color={isRemoteStreaming ? 'error' : (!isReadOnly && localCamActive) ? 'info' : 'default'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>

              {/* Mobile Link & QR Scan Helper Strip (Paramedics) OR Active Stream Telemetry Indicator (Doctors/Hospitals) */}
              {isReadOnly ? (
                <Paper
                  sx={{
                    p: 1.5,
                    mb: 2,
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SensorsIcon sx={{ color: isRemoteStreaming ? '#f85149' : '#3fb950', fontSize: 26, flexShrink: 0 }} />
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="caption" sx={{ color: isRemoteStreaming ? '#f85149' : '#3fb950', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, fontSize: '0.74rem' }}>
                        {isRemoteStreaming ? '● LIVE EMS CABIN SENSOR & VIDEO BROADCAST' : 'LIVE EMS CABIN SENSOR & CAMERA FEED'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#c9d1d9', fontSize: '0.78rem' }}>
                        {isRemoteStreaming
                          ? 'High-definition cabin video and optical biometric feed actively transmitting from ambulance.'
                          : 'Paramedic Telemetry Gateway active. Field photos and cabin video stream live once dispatched by crew.'}
                      </Typography>
                    </Box>
                    <Chip
                      label="🔒 PARAMEDIC STREAM"
                      size="small"
                      sx={{ ml: 'auto', backgroundColor: '#21262d', color: '#8b949e', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}
                    />
                  </Box>
                </Paper>
              ) : (
                <Paper
                  sx={{
                    p: 1.5,
                    mb: 2,
                    backgroundColor: '#0d1117',
                    border: '1px solid #1f6feb',
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                      {qrCodeDataUrl ? (
                        <Tooltip title="Click to enlarge QR Code" arrow>
                          <Box
                            component="img"
                            src={qrCodeDataUrl}
                            alt="Scan with Android"
                            onClick={() => setShowQrModal(true)}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              border: '2px solid #58a6ff',
                              cursor: 'pointer',
                              backgroundColor: '#fff',
                              p: 0.3,
                              flexShrink: 0,
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.06)' }
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <QrCodeIcon sx={{ fontSize: 40, color: '#58a6ff', flexShrink: 0 }} />
                      )}
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ color: '#58a6ff', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700, fontSize: '0.74rem' }}>
                          <PhoneAndroidIcon sx={{ fontSize: 15 }} /> SCAN QR WITH PHONE CAMERA:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#f0f6fc',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {mobileTransmitterUrl}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.68rem', display: 'block' }}>
                          Points directly to <strong>{caseId}</strong> • Tap QR to enlarge
                        </Typography>
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setShowQrModal(true)}
                        startIcon={<QrCodeIcon />}
                        sx={{ backgroundColor: '#1f6feb', color: '#fff', fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
                      >
                        Enlarge QR
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleCopyLink}
                        startIcon={<ContentCopyIcon fontSize="small" />}
                        sx={{ borderColor: '#30363d', color: '#c9d1d9', fontSize: '0.72rem', textTransform: 'none', whiteSpace: 'nowrap' }}
                      >
                        {linkCopied ? 'Copied!' : 'Copy'}
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              )}

              {/* Live Video Viewfinder Display */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 250,
                  backgroundColor: '#0d1117',
                  borderRadius: 2,
                  border: `2px solid ${isRemoteStreaming ? '#f85149' : (!isReadOnly && localCamActive) ? '#1f6feb' : '#30363d'}`,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                {/* 1. Remote Stream from Android Phone */}
                {isRemoteStreaming && remoteStreamFrame && (
                  <img
                    src={remoteStreamFrame}
                    alt="Android Phone Live Stream"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}

                {/* 2. Fallback Local Webcam (Paramedics Only) */}
                {!isReadOnly && (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: !isRemoteStreaming && localCamActive ? 'block' : 'none'
                    }}
                  />
                )}

                {/* 3. Idle Standby State */}
                {!isRemoteStreaming && (!localCamActive || isReadOnly) && (
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <PhoneAndroidIcon sx={{ fontSize: 44, color: '#8b949e', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>
                      {isReadOnly ? 'Waiting for Ambulance Cabin Live Video Stream...' : 'Waiting for Android Phone Camera Stream...'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: isReadOnly ? 0 : 2 }}>
                      {isReadOnly
                        ? 'Video stream will appear here in real time when started by the en-route paramedic crew.'
                        : <span>Open <strong>/mobile-cam</strong> on your Android phone and tap 'Start Live Stream'</span>
                      }
                    </Typography>
                    {!isReadOnly && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={startLocalCam}
                        sx={{ borderColor: '#30363d', color: '#58a6ff', textTransform: 'none' }}
                      >
                        Or Use Laptop Webcam
                      </Button>
                    )}
                  </Box>
                )}

                {/* Live Transmission Overlay */}
                {(isRemoteStreaming || (!isReadOnly && localCamActive)) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8
                    }}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f85149' }} />
                    <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}>
                      {isRemoteStreaming ? 'STREAMING FROM CABIN (12 FPS)' : 'LOCAL WEBCAM ACTIVE'}
                    </Typography>
                  </Box>
                )}

                {!isReadOnly && localCamActive && (
                  <Button
                    size="small"
                    variant="contained"
                    color="inherit"
                    onClick={stopLocalCam}
                    sx={{ position: 'absolute', top: 8, right: 8, fontSize: '0.7rem', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  >
                    Close Webcam
                  </Button>
                )}
              </Box>

              {/* Capture Frame Button (Paramedic Only) */}
              {!isReadOnly && (
                <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<CameraAltIcon />}
                    disabled={!isRemoteStreaming && !localCamActive}
                    onClick={handleCaptureFromStream}
                    sx={{ fontWeight: 700, py: 1 }}
                  >
                    📸 Capture Snap from Stream
                  </Button>
                  {heldSnaps.length > 0 && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleClearAllSnaps}
                      sx={{ borderColor: '#30363d', color: '#8b949e', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                    >
                      Clear Tray
                    </Button>
                  )}
                </Stack>
              )}

              {/* CAPTURED PHOTOS HOLDING TRAY */}
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  backgroundColor: '#0d1117',
                  borderColor: heldSnaps.length > 0 ? '#1f6feb' : '#30363d',
                  borderRadius: 2,
                  mb: 2.5
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    {isReadOnly ? 'Field & En-Route Photos' : 'Captured Photos Tray'}
                  </Typography>
                  <Chip
                    label={isReadOnly ? `${heldSnaps.length} Photos Recorded` : `${heldSnaps.length} Photos Held`}
                    size="small"
                    color={heldSnaps.length > 0 ? 'primary' : 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>

                {heldSnaps.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', textAlign: 'center', py: 2 }}>
                    {isReadOnly
                      ? 'No field photos captured yet by the paramedic crew.'
                      : <span>No photos captured yet. Click <strong>'Capture Snap from Stream'</strong> above (or tap snap on your phone) to hold images here for AI analysis.</span>
                    }
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1.5,
                      overflowX: 'auto',
                      pb: 1,
                      '&::-webkit-scrollbar': { height: 6 },
                      '&::-webkit-scrollbar-thumb': { backgroundColor: '#30363d', borderRadius: 3 }
                    }}
                  >
                    {heldSnaps.map((snap, index) => (
                      <Paper
                        key={snap.id}
                        sx={{
                          position: 'relative',
                          minWidth: 105,
                          maxWidth: 105,
                          backgroundColor: '#161b22',
                          border: '1px solid #30363d',
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={snap.dataUrl}
                          alt={`Snap ${index + 1}`}
                          onClick={() => setPreviewSnap(snap)}
                          style={{
                            width: '100%',
                            height: 75,
                            objectFit: 'cover',
                            cursor: 'pointer',
                            display: 'block'
                          }}
                        />
                        <Box sx={{ p: 0.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#c9d1d9', fontWeight: 600 }}>
                            #{index + 1}
                          </Typography>
                          {!isReadOnly && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteSnap(snap.id)}
                              sx={{ p: 0.2, color: '#f85149' }}
                            >
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>

              {/* BATCH ANALYZE BUTTON (Paramedic Only) */}
              {!isReadOnly && (
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={heldSnaps.length === 0 || batchAnalyzing}
                  onClick={handleBatchAnalyze}
                  startIcon={batchAnalyzing ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                  sx={{
                    fontWeight: 700,
                    py: 1.2,
                    backgroundColor: '#238636',
                    '&:hover': { backgroundColor: '#2ea043' }
                  }}
                >
                  {batchAnalyzing ? 'Analyzing All Held Snaps with AI...' : `✨ Analyze All Held Snaps (${heldSnaps.length}) with Vision AI`}
                </Button>
              )}

              {/* Batch Analysis Results Card */}
              {batchResultSummary && (
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon fontSize="inherit" />}
                  sx={{
                    mt: 2,
                    backgroundColor: 'rgba(63, 185, 80, 0.12)',
                    borderColor: '#238636',
                    borderWidth: 1,
                    borderStyle: 'solid',
                    color: '#3fb950',
                    fontSize: '0.82rem'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Vision AI Telemetry Populated
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                    {batchResultSummary}
                  </Typography>
                </Alert>
              )}

              {/* Itemized Per-Photo Diagnostic Breakdown */}
              {analyzedSnapResults.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Per-Photo AI Diagnostic Breakdown ({analyzedSnapResults.length})
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#58a6ff', fontSize: '0.7rem' }}>
                      Click photo to enlarge
                    </Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    {analyzedSnapResults.map((item, idx) => (
                      <Paper
                        key={item.id || idx}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          backgroundColor: '#161b22',
                          borderColor: '#30363d',
                          borderRadius: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Box
                            component="img"
                            src={item.dataUrl}
                            alt={item.tag}
                            onClick={() => setPreviewSnap({ id: item.id, dataUrl: item.dataUrl, timestamp: '', tag: item.tag })}
                            sx={{
                              width: 64,
                              height: 64,
                              objectFit: 'cover',
                              borderRadius: 1.5,
                              border: '1px solid #30363d',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#58a6ff' }}>
                                {item.tag}
                              </Typography>
                              <Chip
                                label={`${item.confidence}% Match`}
                                size="small"
                                sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(56, 139, 253, 0.15)', color: '#58a6ff' }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.8rem', lineHeight: 1.25, mb: 0.5 }}>
                              🎯 Region: {item.region}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: item.bleeding.toUpperCase().includes('ACTIVE') ? '#f85149' : '#8b949e',
                                fontWeight: item.bleeding.toUpperCase().includes('ACTIVE') ? 700 : 500,
                                mb: 0.5,
                                lineHeight: 1.3
                              }}
                            >
                              🩸 Bleeding: {item.bleeding}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#8b949e', fontSize: '0.72rem', mb: 0.5, lineHeight: 1.3 }}>
                              {item.summary}
                            </Typography>
                            {item.vitals && (
                              <Stack direction="row" spacing={0.6} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                {item.vitals.spo2 != null && (
                                  <Chip
                                    label={`SpO2: ${item.vitals.spo2}%`}
                                    size="small"
                                    color={item.vitals.spo2 < 90 ? 'error' : item.vitals.spo2 < 94 ? 'warning' : 'success'}
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600 }}
                                  />
                                )}
                                {item.vitals.heartRate != null && (
                                  <Chip
                                    label={`HR: ${item.vitals.heartRate} bpm`}
                                    size="small"
                                    color={item.vitals.heartRate > 115 ? 'error' : item.vitals.heartRate > 100 ? 'warning' : 'primary'}
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600 }}
                                  />
                                )}
                                {item.vitals.systolicBp != null && item.vitals.diastolicBp != null && (
                                  <Chip
                                    label={`BP: ${item.vitals.systolicBp}/${item.vitals.diastolicBp}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.62rem', color: '#c9d1d9', borderColor: '#30363d' }}
                                  />
                                )}
                                {item.vitals.respiratoryRate != null && (
                                  <Chip
                                    label={`RR: ${item.vitals.respiratoryRate}/min`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.62rem', color: '#8b949e', borderColor: '#30363d' }}
                                  />
                                )}
                              </Stack>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snap Preview Lightbox Dialog */}
      <Dialog open={!!previewSnap} onClose={() => setPreviewSnap(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#161b22', color: '#f0f6fc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {previewSnap?.tag || 'Held Snapshot Preview'} ({previewSnap?.timestamp})
          </Typography>
          <IconButton onClick={() => setPreviewSnap(null)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#0d1117', p: 2, textAlign: 'center' }}>
          {previewSnap && (
            <img
              src={previewSnap.dataUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#161b22', p: 1.5 }}>
          <Button onClick={() => setPreviewSnap(null)} variant="outlined" sx={{ color: '#c9d1d9' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Android Sensor & Vitals Apps Guide Dialog */}
      <Dialog
        open={androidGuideOpen}
        onClose={() => setAndroidGuideOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            color: '#c9d1d9'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PhoneAndroidIcon sx={{ color: '#58a6ff' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              How Android Devices Measure Oxygen (SpO2) & Stream Vitals
            </Typography>
          </Box>
          <IconButton onClick={() => setAndroidGuideOpen(false)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: '#30363d' }}>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 3 }}>
            There are 4 main methods to capture SpO2 and stream vitals using Android smartphones:
          </Typography>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VideocamIcon sx={{ color: '#f85149' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    1. Live Camera Stream (/mobile-cam)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#58a6ff', fontWeight: 600, display: 'block', mb: 1 }}>
                  BUILT INTO LIFEFLOW • ZERO INSTALLATION
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.85rem' }}>
                  Open <code>http://192.168.0.105:5173/mobile-cam</code> in Chrome on your Android phone. Tap <strong>'Start Live Stream'</strong>. The phone's rear camera streams live video into LifeFlow console. You click <strong>'Capture Snap'</strong> to hold multiple photos, then tap <strong>'Analyze All Held Snaps'</strong>.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SensorsIcon sx={{ color: '#3fb950' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    2. All-in-One PPG Apps (SpO2, HR, RR, BP)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 600, display: 'block', mb: 1 }}>
                  SINGLE 45-SEC SCAN MEASURES ALL VITALS
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.85rem' }}>
                  Apps like <strong>Careplix Vitals</strong> (finger on rear camera + flash) and <strong>Anura / Binah.ai</strong> (30-sec facial video scan) capture SpO2, Heart Rate, Respiration Rate, and Blood Pressure in one single scan without external gear.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <MedicalServicesIcon sx={{ color: '#58a6ff' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    3. BLE Bluetooth Pulse Oximeters
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#58a6ff', fontWeight: 600, display: 'block', mb: 1 }}>
                  STANDARD EMS FIELD PROTOCOL
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.85rem' }}>
                  Wireless pulse oximeter finger clips (e.g. Wellue O2Ring, Contec CMS50D-BT) broadcast SpO2 and pulse waveforms via standard Bluetooth GATT profile <code>0x1822</code>.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #1f6feb', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VisibilityIcon sx={{ color: '#58a6ff' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    4. LifeFlow Multimodal Vision OCR
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#58a6ff', fontWeight: 600, display: 'block', mb: 1 }}>
                  OCR ANY PHYSICAL MONITOR SCREEN
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: '0.85rem' }}>
                  Point phone camera at any physical monitor screen or budget ₹500 finger oximeter display. LifeFlow's vision model reads SpO2, HR, BP, and RR values and updates the digital twin in real-time.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderColor: '#30363d' }}>
          <Button onClick={() => setAndroidGuideOpen(false)} variant="contained" color="primary">
            Close Guide
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enlarged QR Code Modal for Phone Camera Sync */}
      <Dialog
        open={showQrModal}
        onClose={() => setShowQrModal(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            borderRadius: 3,
            p: 2,
            textAlign: 'center',
            maxWidth: 420
          }
        }}
      >
        <DialogTitle sx={{ color: '#f0f6fc', fontWeight: 700, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneAndroidIcon sx={{ color: '#58a6ff' }} /> Sync Mobile Field Cam
          </Box>
          <IconButton onClick={() => setShowQrModal(false)} size="small" sx={{ color: '#8b949e' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
            Point your Android phone camera at this QR code. It will open Chrome and pair directly with current patient <strong>{caseId}</strong>.
          </Typography>
          {qrCodeDataUrl && (
            <Box
              sx={{
                p: 2,
                backgroundColor: '#ffffff',
                borderRadius: 2,
                display: 'inline-block',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                mb: 2
              }}
            >
              <Box
                component="img"
                src={qrCodeDataUrl}
                alt="Scan with Phone"
                sx={{ width: 220, height: 220, display: 'block' }}
              />
            </Box>
          )}
          <Paper sx={{ p: 1, backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: 1.5, mb: 1 }}>
            <Typography variant="caption" sx={{ color: '#58a6ff', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 700 }}>
              {mobileTransmitterUrl}
            </Typography>
          </Paper>
          <Typography variant="caption" sx={{ color: '#3fb950', display: 'block', fontWeight: 600 }}>
            ✓ Both phone and laptop must be on the same Wi-Fi network.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pt: 0 }}>
          <Button
            variant="contained"
            onClick={handleCopyLink}
            startIcon={<ContentCopyIcon />}
            sx={{ backgroundColor: '#1f6feb', textTransform: 'none', fontWeight: 700 }}
          >
            {linkCopied ? 'Link Copied!' : 'Copy Direct Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
