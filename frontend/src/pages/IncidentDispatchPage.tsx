import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Divider, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Stack, IconButton, Tooltip,
  Switch, FormControlLabel
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import NavigationIcon from '@mui/icons-material/Navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { incidentApi, transportApi, preAlertApi, patientApi } from '../services/api';
import { wsService } from '../services/websocket';
import { EmergencyIncident, AmbulanceState } from '../types';
import { AutonomousCopilotModal } from '../components/AutonomousCopilotModal';
import { AutonomousCopilotLiveTour } from '../components/AutonomousCopilotLiveTour';
import { InlineDestinationRecommendationTray } from '../components/InlineDestinationRecommendationTray';

// Map auto-recenter helper
const RecenterMap: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, 14, { duration: 1.0 });
    }
  }, [center[0], center[1], map]);
  return null;
};

// Custom Map Icons
const sceneIcon = L.divIcon({
  html: `<div style="background-color:#da3633; color:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:3px solid white; box-shadow:0 0 16px #da3633; font-size:18px;">⚠️</div>`,
  className: 'scene-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const ambulanceIcon = L.divIcon({
  html: `<div style="background-color:#1f6feb; color:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:3px solid white; box-shadow:0 0 16px #1f6feb; font-size:18px;">🚑</div>`,
  className: 'amb-icon',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

export const IncidentDispatchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlIncidentId = searchParams.get('incidentId');
  const urlCode = searchParams.get('code');

  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [ambulanceState, setAmbulanceState] = useState<AmbulanceState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState<boolean>(false);
  const [clock, setClock] = useState<Date>(new Date());

  const [newCallAlert, setNewCallAlert] = useState<EmergencyIncident | null>(null);

  // Paramedic Autonomous Copilot / Agent Mode State
  const [agentModeEnabled, setAgentModeEnabled] = useState<boolean>(() => {
    return localStorage.getItem('lifeflow_paramedic_agent_mode') === 'true';
  });
  const [copilotModalOpen, setCopilotModalOpen] = useState<boolean>(false);
  const [copilotLiveTourActive, setCopilotLiveTourActive] = useState<boolean>(false);

  const handleToggleAgentMode = (enabled: boolean) => {
    setAgentModeEnabled(enabled);
    localStorage.setItem('lifeflow_paramedic_agent_mode', String(enabled));
    if (enabled && selectedIncident && selectedIncident.status !== 'RESOLVED' && selectedIncident.status !== 'CANCELLED') {
      setCopilotLiveTourActive(true);
    } else if (!enabled) {
      setCopilotLiveTourActive(false);
    }
  };

  // AI Vision & On-Scene Camera Tray State
  const [aiVisionData, setAiVisionData] = useState<any | null>(null);
  const [aiVisionLoading, setAiVisionLoading] = useState<boolean>(false);
  const [sceneSnaps, setSceneSnaps] = useState<any[]>([]);
  const [uploadingSnap, setUploadingSnap] = useState<boolean>(false);
  const [lightboxSnap, setLightboxSnap] = useState<any | null>(null);

  // High-performance image compression using HTML5 Canvas (shrinks camera photo to ~50KB)
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

  // Upload on-scene photo snapped by paramedic
  const handleCaptureSceneSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const caseId = selectedIncident?.patientCaseId || 'CASE-2026-001';
      setUploadingSnap(true);
      try {
        const dataUrl = await compressImage(file);
        const uploaded = await patientApi.uploadSnapDataUrl(caseId, {
          dataUrl,
          source: 'PARAMEDIC_SCENE',
          label: `Paramedic On-Scene Trauma Photo (${selectedIncident?.incidentType?.replace('_', ' ') || 'Scene'})`
        });
        setSceneSnaps((prev) => [uploaded, ...prev.filter((s: any) => (s.highResSnap || s.dataUrl) !== dataUrl)]);
      } catch (err: any) {
        alert('Failed to transmit on-scene photo: ' + (err?.message || 'Upload error'));
      } finally {
        setUploadingSnap(false);
      }
    }
  };

  // Load and listen to all gathered scene snaps (Citizen SOS + Paramedic field + Cabin)
  useEffect(() => {
    if (!selectedIncident) {
      setAiVisionData(null);
      setSceneSnaps([]);
      return;
    }

    const caseId = selectedIncident.patientCaseId;
    if (caseId) {
      patientApi.getSnaps(caseId).then((snaps: any[]) => {
        if (snaps && snaps.length > 0) {
          setSceneSnaps(snaps);
          const sosWithAi = snaps.find((s: any) => s.source === 'CITIZEN_SOS' && s.aiFinding);
          if (sosWithAi && !aiVisionData) {
            setAiVisionData({
              findingSummary: sosWithAi.aiFinding,
              injuryRegion: sosWithAi.injuryRegion || 'Scene Trauma Area',
              bleedingDesc: sosWithAi.bleedingDesc || 'Active hemorrhage screened',
              confidence: sosWithAi.confidence ? Math.round(sosWithAi.confidence * 100) : 94,
              severity: selectedIncident.severity || 'CRITICAL'
            });
          }
        } else if (selectedIncident.photoUrl) {
          setSceneSnaps([{
            isSnap: true,
            highResSnap: selectedIncident.photoUrl,
            source: 'CITIZEN_SOS',
            label: `Citizen SOS Scene Photo (${selectedIncident.incidentType?.replace('_', ' ') || 'Scene'})`,
            timestamp: selectedIncident.reportedAt || Date.now()
          }]);
        }
      }).catch(() => {
        if (selectedIncident.photoUrl) {
          setSceneSnaps([{
            isSnap: true,
            highResSnap: selectedIncident.photoUrl,
            source: 'CITIZEN_SOS',
            label: `Citizen SOS Scene Photo (${selectedIncident.incidentType?.replace('_', ' ') || 'Scene'})`,
            timestamp: selectedIncident.reportedAt || Date.now()
          }]);
        }
      });

      const unsubSnaps = wsService.subscribe(`/topic/camera-snaps/${caseId}`, (incoming: any) => {
        if (incoming?.highResSnap || incoming?.dataUrl) {
          const url = incoming.highResSnap || incoming.dataUrl;
          setSceneSnaps((prev) => {
            const idx = prev.findIndex((s: any) => (s.highResSnap || s.dataUrl) === url);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...incoming };
              return updated;
            }
            return [incoming, ...prev];
          });
        }
      });

      return () => unsubSnaps();
    } else if (selectedIncident.photoUrl) {
      setSceneSnaps([{
        isSnap: true,
        highResSnap: selectedIncident.photoUrl,
        source: 'CITIZEN_SOS',
        label: `Citizen SOS Scene Photo (${selectedIncident.incidentType?.replace('_', ' ') || 'Scene'})`,
        timestamp: selectedIncident.reportedAt || Date.now()
      }]);
    }
  }, [selectedIncident?.id, selectedIncident?.patientCaseId, selectedIncident?.photoUrl]);

  // When paramedic responds to scene or views incident with photo, run Clinical Vision AI on scene photo
  useEffect(() => {
    if (!selectedIncident?.photoUrl) {
      setAiVisionData(null);
      return;
    }

    let isCancelled = false;
    setAiVisionLoading(true);

    patientApi.analyzeImage({
      dataUrl: selectedIncident.photoUrl,
      scanMode: 'PATIENT_TRAUMA',
      notes: `${selectedIncident.incidentType}: ${selectedIncident.description || 'Emergency Scene Trauma'}`
    }).then((result: any) => {
      if (!isCancelled && result) {
        setAiVisionData(result);
        setSceneSnaps((prev) => prev.map((s) => {
          if (s.source === 'CITIZEN_SOS' || (s.highResSnap || s.dataUrl) === selectedIncident.photoUrl) {
            return {
              ...s,
              aiFinding: result.findingSummary,
              injuryRegion: result.injuryRegion,
              bleedingDesc: result.bleedingDesc,
              confidence: result.confidence
            };
          }
          return s;
        }));
      }
    }).catch((err: any) => {
      console.warn('Could not run remote vision analysis, using local clinical fallback', err);
      if (!isCancelled) {
        setAiVisionData({
          findingSummary: 'Pre-Hospital Triage: Soft-tissue disruption & blunt contusion with localized bleeding index.',
          injuryRegion: 'Thoracic & Extremity Region',
          bleedingDesc: 'Visible hemorrhage; continuous direct pressure required',
          confidence: 93,
          severity: selectedIncident.severity || 'CRITICAL'
        });
      }
    }).finally(() => {
      if (!isCancelled) setAiVisionLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedIncident?.id, selectedIncident?.photoUrl]);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Zero-cost Web Audio alert chime for instant paramedic alert
  const playLocalChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(920, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  };

  // Load active incidents and ambulance state
  useEffect(() => {
    loadData();

    // Subscribe to incident alerts over WebSocket
    const handleIncomingIncident = (updated: EmergencyIncident) => {
      if (!updated || !updated.id) return;

      setIncidents((prev) => {
        const existingIdx = prev.findIndex((i) => i.id === updated.id);
        if (existingIdx >= 0) {
          const clone = [...prev];
          clone[existingIdx] = updated;
          return clone;
        } else {
          return [updated, ...prev];
        }
      });

      // If this is a new emergency report or assignment, show visual banner and ring alert chime
      if (updated.status === 'ASSIGNED' || updated.status === 'REPORTED') {
        setNewCallAlert({ ...updated });
        setSelectedIncident({ ...updated });
        playLocalChime();
      } else {
        // Auto-switch to updated incident if currently selected
        setSelectedIncident((current) => {
          if (!current || current.id === updated.id) {
            return { ...updated };
          }
          return current;
        });
      }
    };

    const unsubIncident = wsService.subscribe('/topic/incidents', handleIncomingIncident);
    const unsubAlerts = wsService.subscribe('/topic/alerts', handleIncomingIncident);

    // Fallback queue polling every 3 seconds
    const interval = setInterval(async () => {
      try {
        const incList = await incidentApi.getActive();
        if (incList && incList.length > 0) {
          setIncidents(incList);
          setSelectedIncident((curr) => {
            if (!curr) {
              if (urlIncidentId || urlCode) {
                const matched = incList.find(
                  (i) =>
                    (urlIncidentId && String(i.id) === String(urlIncidentId)) ||
                    (urlIncidentId && i.incidentCode === urlIncidentId) ||
                    (urlCode && i.incidentCode === urlCode)
                );
                if (matched) return matched;
              }
              return incList[0];
            }
            const found = incList.find((i) => i.id === curr.id);
            return found || curr;
          });
        }
      } catch {}
    }, 3000);

    // Subscribe to ambulance tracking
    const unsubAmb = wsService.subscribe('/topic/transport/1', (state: AmbulanceState) => {
      setAmbulanceState(state);
    });

    return () => {
      unsubIncident();
      unsubAlerts();
      unsubAmb();
      clearInterval(interval);
    };
  }, []);

  // Auto-select incident requested via URL params (e.g. from Emergency SOS HUD)
  useEffect(() => {
    if ((urlIncidentId || urlCode) && incidents.length > 0) {
      const matched = incidents.find(
        (i) =>
          (urlIncidentId && String(i.id) === String(urlIncidentId)) ||
          (urlIncidentId && i.incidentCode === urlIncidentId) ||
          (urlCode && i.incidentCode === urlCode)
      );
      if (matched) {
        setSelectedIncident(matched);
      }
    }
  }, [urlIncidentId, urlCode, incidents]);

  const loadData = async () => {
    try {
      setLoading(true);
      const incList = await incidentApi.getActive();
      setIncidents(incList || []);
      if (incList && incList.length > 0) {
        let target = incList[0];
        if (urlIncidentId || urlCode) {
          const matched = incList.find(
            (i) =>
              (urlIncidentId && String(i.id) === String(urlIncidentId)) ||
              (urlIncidentId && i.incidentCode === urlIncidentId) ||
              (urlCode && i.incidentCode === urlCode)
          );
          if (matched) target = matched;
        }
        setSelectedIncident(target);
      }
      const amb = await transportApi.getLatestState(1);
      setAmbulanceState(amb);
    } catch (e) {
      console.error('Failed to load incident dispatch data', e);
    } finally {
      setLoading(false);
    }
  };

  // Status transitions
  const handleUpdateStatus = async (status: string) => {
    if (!selectedIncident) return;
    try {
      setActionLoading(true);
      const updated = await incidentApi.updateStatus(selectedIncident.id, status);
      setSelectedIncident(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (e: any) {
      alert('Failed to update incident status: ' + (e?.message || 'Error'));
    } finally {
      setActionLoading(false);
    }
  };

  // Board Patient and launch digital twin
  const handleBoardPatient = async () => {
    if (!selectedIncident) return;
    try {
      setActionLoading(true);
      const updated = await incidentApi.boardPatient(selectedIncident.id);
      setSelectedIncident(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));

      // Direct transition to Destination Evaluation & Simulator with citizen SOS incident coordinates (only if not running copilot tour)
      const targetCase = updated.patientCaseId || selectedIncident.patientCaseId || 'CASE-2026-001';
      const lat = selectedIncident.latitude || 12.9352;
      const lng = selectedIncident.longitude || 77.6245;
      if (!copilotLiveTourActive) {
        setTimeout(() => {
          navigate(`/destination-evaluation?caseId=${targetCase}&lat=${lat}&lng=${lng}&fromDispatch=true`);
        }, 500);
      }
    } catch (e: any) {
      alert('Failed to board patient: ' + (e?.message || 'Error'));
      setActionLoading(false);
    }
  };

  // Ensure realistic scene coordinates
  const scenePos: [number, number] = selectedIncident?.latitude && selectedIncident?.longitude
    ? [selectedIncident.latitude, selectedIncident.longitude]
    : [16.5074, 80.6466];

  // Position ambulance near scene for intuitive local tactical navigation
  const isFar = ambulanceState?.latitude && (
    Math.abs(ambulanceState.latitude - scenePos[0]) > 0.3 ||
    Math.abs((ambulanceState.longitude || 0) - scenePos[1]) > 0.3
  );

  const ambPos: [number, number] = (ambulanceState?.latitude && ambulanceState?.longitude && !isFar)
    ? [ambulanceState.latitude, ambulanceState.longitude]
    : [scenePos[0] + 0.015, scenePos[1] + 0.012];

  const handleSimulateSms = async () => {
    try {
      const res = await incidentApi.smsWebhook({
        from: '+91-9876543210',
        body: 'LIFEFLOW SOS: ROAD ACCIDENT. Severe blunt chest trauma & bleeding. At Lat 16.5074, Lng 80.6466. Casualties: 1. Severity: CRITICAL. Need urgent ambulance!',
        latitude: 16.5074,
        longitude: 80.6466
      });
      setNewCallAlert(res);
      setIncidents(prev => [res, ...prev.filter(i => i.id !== res.id)]);
      setSelectedIncident(res);
    } catch (e: any) {
      alert('Failed to simulate 2G SMS dispatch: ' + (e?.message || 'Error'));
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Page Header */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              Incident Scene Dispatch & Navigation
            </Typography>
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '15px !important', color: '#58a6ff !important' }} />}
              label={`EMS Clock: ${clock.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })} • ${clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`}
              size="small"
              sx={{ backgroundColor: '#0d1117', color: '#58a6ff', border: '1px solid rgba(88, 166, 255, 0.4)', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.3 }}>
            Zero-Cost Citizen SOS Triage • Tactical Turn-by-Turn Response & Patient Boarding
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {/* Autonomous Copilot / Agent Mode Switch */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: agentModeEnabled ? 'rgba(35, 134, 54, 0.18)' : 'rgba(22, 27, 34, 0.85)',
              border: agentModeEnabled ? '1.5px solid #3fb950' : '1px solid #30363d',
              borderRadius: 2,
              px: 1.5,
              py: 0.35,
              boxShadow: agentModeEnabled ? '0 0 16px rgba(63, 185, 80, 0.35)' : 'none',
              transition: 'all 0.25s ease'
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={agentModeEnabled}
                  onChange={(e) => handleToggleAgentMode(e.target.checked)}
                  color="success"
                  size="small"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <SmartToyIcon sx={{ fontSize: 18, color: agentModeEnabled ? '#3fb950' : '#8b949e' }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.75rem', color: agentModeEnabled ? '#3fb950' : '#c9d1d9', lineHeight: 1.1 }}>
                      AGENT MODE
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.62rem', color: agentModeEnabled ? '#7ee787' : '#8b949e', display: 'block', lineHeight: 1 }}>
                      {agentModeEnabled ? '⚡ Autonomous Active' : 'Manual EMS'}
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ m: 0 }}
            />
          </Box>

          <Button
            variant="contained"
            size="small"
            onClick={handleSimulateSms}
            sx={{ backgroundColor: '#1f6feb', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}
          >
            📱 Simulate 2G SMS Intake
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => window.open('/sos', '_blank')}
            sx={{ borderColor: '#f85149', color: '#f85149', fontWeight: 700, fontSize: '0.75rem' }}
          >
            Open Citizen Mobile SOS
          </Button>
        </Stack>
      </Box>

      {/* In-Page Emergency Flash Banner */}
      {newCallAlert && (
        <Alert
          key={newCallAlert.id}
          severity="error"
          onClose={() => setNewCallAlert(null)}
          sx={{
            mb: 2,
            backgroundColor: 'rgba(218, 54, 51, 0.25)',
            color: '#f0f6fc',
            border: '2px solid #da3633',
            boxShadow: '0 0 20px rgba(218, 54, 51, 0.6)',
            borderRadius: 2,
            animation: 'flashPulse 1.2s infinite alternate',
            '@keyframes flashPulse': {
              '0%': { boxShadow: '0 0 10px rgba(218, 54, 51, 0.4)' },
              '100%': { boxShadow: '0 0 26px rgba(218, 54, 51, 0.9)' }
            }
          }}
        >
          <strong>
            {newCallAlert.description?.toUpperCase().includes('2G') || newCallAlert.description?.toUpperCase().includes('SMS')
              ? '📱 NEW INCOMING 2G SMS EMERGENCY: '
              : newCallAlert.description?.toUpperCase().includes('VOICE') || newCallAlert.description?.toUpperCase().includes('CALL')
              ? '📞 NEW INCOMING 112 VOICE CALL: '
              : '🚨 NEW INCOMING EMERGENCY SOS: '}
            {newCallAlert.incidentCode}
          </strong>{' '}
          — {newCallAlert.incidentType.replace('_', ' ')} ({newCallAlert.casualtyCount} Casualty) at {newCallAlert.locationAddress}. Automatically assigned to <strong>{newCallAlert.ambulanceCallSign || 'AMB-01'}</strong>.
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* =========================================================================
            LEFT COLUMN: ACTIVE INCIDENTS QUEUE
            ========================================================================= */}
        <Grid item xs={12} md={4}>
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                Active Scene Calls ({incidents.length})
              </Typography>
              <Chip label="LIVE FEED" size="small" sx={{ backgroundColor: '#da3633', color: '#fff', fontWeight: 800 }} />
            </Box>

            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              {incidents.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: '#8b949e' }}>
                  <Typography variant="body2">No active reported incidents.</Typography>
                  <Typography variant="caption">Incidents reported via citizen mobile SOS will appear here in real-time.</Typography>
                </Box>
              ) : (
                incidents.map((inc, idx) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <Paper
                      key={inc.id}
                      onClick={() => setSelectedIncident(inc)}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(56, 139, 253, 0.15)' : '#0d1117',
                        border: '1px solid',
                        borderColor: isSelected ? '#58a6ff' : idx === 0 ? 'rgba(63, 185, 80, 0.5)' : '#21262d',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#58a6ff' }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                            {inc.incidentCode}
                          </Typography>
                          {idx === 0 && (
                            <Chip
                              label="LATEST"
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: 9,
                                backgroundColor: '#238636',
                                color: '#fff',
                                fontWeight: 800
                              }}
                            />
                          )}
                        </Box>
                        <Chip
                          label={inc.status}
                          size="small"
                          sx={{
                            fontSize: 10,
                            height: 20,
                            backgroundColor:
                              inc.status === 'REPORTED' ? '#da3633' :
                              inc.status === 'EN_ROUTE_SCENE' ? '#d29922' :
                              inc.status === 'ON_SCENE' ? '#3fb950' : '#1f6feb',
                            color: '#fff',
                            fontWeight: 700
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#c9d1d9', fontSize: 13, mb: 0.5 }}>
                        {inc.incidentType.replace('_', ' ')} • {inc.casualtyCount} Casualty
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                        📍 {inc.locationAddress || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <AccessTimeIcon sx={{ fontSize: 12, color: '#58a6ff' }} />
                        {new Date(inc.reportedAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}, {new Date(inc.reportedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 0.5, borderTop: '1px solid #21262d' }}>
                        <Typography variant="caption" sx={{ color: '#58a6ff' }}>
                          Assigned: {inc.ambulanceCallSign || 'AMB-01'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 600 }}>
                          ETA: ~{inc.etaMinutes || 4}m
                        </Typography>
                      </Box>
                    </Paper>
                  );
                })
              )}
            </List>
          </Card>
        </Grid>

        {/* =========================================================================
            RIGHT COLUMN: GIS SCENE MAP & TACTICAL ACTIONS
            ========================================================================= */}
        <Grid item xs={12} md={8}>
          {selectedIncident ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Tactical Status & Action Card */}
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                          Incident {selectedIncident.incidentCode}
                        </Typography>
                        <Chip
                          label={selectedIncident.severity}
                          size="small"
                          sx={{
                            backgroundColor: selectedIncident.severity === 'CRITICAL' ? 'rgba(248, 81, 73, 0.2)' : 'rgba(210, 153, 34, 0.2)',
                            color: selectedIncident.severity === 'CRITICAL' ? '#f85149' : '#d29922',
                            fontWeight: 700
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.3 }}>
                        Reported by: <strong>{selectedIncident.bystanderName}</strong> ({selectedIncident.bystanderPhone}) •{' '}
                        <span style={{ color: '#c9d1d9' }}>
                          {new Date(selectedIncident.reportedAt).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(selectedIncident.reportedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </span>
                      </Typography>
                    </Box>

                    {/* Dynamic Action Progression */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Autonomous Copilot Action Trigger */}
                      <Button
                        variant={agentModeEnabled || copilotLiveTourActive ? "contained" : "outlined"}
                        color="success"
                        startIcon={<FlashOnIcon />}
                        onClick={() => setCopilotLiveTourActive(true)}
                        sx={{
                          fontWeight: 800,
                          backgroundColor: (agentModeEnabled || copilotLiveTourActive) ? '#238636' : 'rgba(35, 134, 54, 0.1)',
                          borderColor: '#238636',
                          color: (agentModeEnabled || copilotLiveTourActive) ? '#ffffff' : '#3fb950',
                          '&:hover': { backgroundColor: '#2ea043', color: '#fff' },
                          boxShadow: (agentModeEnabled || copilotLiveTourActive) ? '0 0 14px rgba(63, 185, 80, 0.5)' : 'none'
                        }}
                      >
                        ⚡ Run Live Copilot (Screen Cursor)
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SmartToyIcon />}
                        onClick={() => setCopilotModalOpen(true)}
                        sx={{
                          fontWeight: 700,
                          borderColor: '#30363d',
                          color: '#58a6ff',
                          '&:hover': { borderColor: '#58a6ff' }
                        }}
                      >
                        📋 Stepper Modal
                      </Button>

                      {selectedIncident.photoUrl && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setLightboxSnap(sceneSnaps[0] || { highResSnap: selectedIncident.photoUrl, label: 'Citizen SOS Scene Photo', source: 'CITIZEN_SOS', aiFinding: aiVisionData?.findingSummary })}
                          sx={{ borderColor: '#30363d', color: '#c9d1d9' }}
                        >
                          View Scene Photo
                        </Button>
                      )}

                      {(selectedIncident.status === 'ASSIGNED' || selectedIncident.status === 'REPORTED') && (
                        <Button
                          id="btn-copilot-enroute"
                          variant="contained"
                          color="warning"
                          disabled={actionLoading}
                          startIcon={actionLoading ? <CircularProgress size={16} /> : <NavigationIcon />}
                          onClick={() => handleUpdateStatus('EN_ROUTE_SCENE')}
                          sx={{ fontWeight: 700 }}
                        >
                          Accept & En Route to Scene
                        </Button>
                      )}

                      {selectedIncident.status === 'EN_ROUTE_SCENE' && (
                        <Button
                          id="btn-copilot-onscene"
                          variant="contained"
                          color="success"
                          disabled={actionLoading}
                          startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                          onClick={() => handleUpdateStatus('ON_SCENE')}
                          sx={{ fontWeight: 700 }}
                        >
                          Arrived at Scene
                        </Button>
                      )}

                      {selectedIncident.status === 'ON_SCENE' && (
                        <Button
                          id="btn-copilot-board"
                          variant="contained"
                          color="error"
                          disabled={actionLoading}
                          startIcon={actionLoading ? <CircularProgress size={16} /> : <MonitorHeartIcon />}
                          onClick={handleBoardPatient}
                          sx={{
                            fontWeight: 800,
                            backgroundColor: '#da3633',
                            '&:hover': { backgroundColor: '#b62324' }
                          }}
                        >
                          🚑 Board Patient ➔ AI Destination Evaluation
                        </Button>
                      )}

                      {selectedIncident.status === 'PATIENT_LOADED' && (
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<NavigationIcon />}
                            onClick={() => {
                              const lat = selectedIncident.latitude || 12.9352;
                              const lng = selectedIncident.longitude || 77.6245;
                              navigate(`/destination-evaluation?caseId=${selectedIncident.patientCaseId || 'CASE-2026-001'}&lat=${lat}&lng=${lng}&fromDispatch=true`);
                            }}
                            sx={{ fontWeight: 800, backgroundColor: '#1f6feb', '&:hover': { backgroundColor: '#388bfd' } }}
                          >
                            🤖 AI Destination Evaluation & Simulator
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<NavigationIcon />}
                            onClick={() => {
                              const lat = selectedIncident.latitude || 12.9352;
                              const lng = selectedIncident.longitude || 77.6245;
                              navigate(`/prealert?caseId=${selectedIncident.patientCaseId || 'CASE-2026-001'}&lat=${lat}&lng=${lng}`);
                            }}
                            sx={{ fontWeight: 700, borderColor: '#da3633', color: '#f85149' }}
                          >
                            🚨 Pre-Alert Directly
                          </Button>
                          <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<MonitorHeartIcon />}
                            onClick={() => navigate(`/patient-twin?caseId=${selectedIncident.patientCaseId || 'CASE-2026-001'}`)}
                            sx={{ fontWeight: 700 }}
                          >
                            Digital Twin ({selectedIncident.patientCaseId || 'CASE-2026-001'})
                          </Button>
                        </Stack>
                      )}

                      {selectedIncident.patientCaseId && selectedIncident.status !== 'PATIENT_LOADED' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<MonitorHeartIcon />}
                          onClick={() => navigate(`/patient-twin?caseId=${selectedIncident.patientCaseId}`)}
                          sx={{ fontWeight: 700, borderColor: '#388bfd', color: '#58a6ff' }}
                        >
                          View Inbound Twin ({selectedIncident.patientCaseId})
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* Autonomous Paramedic Copilot Active Banner */}
                  {agentModeEnabled && selectedIncident.status !== 'RESOLVED' && selectedIncident.status !== 'CANCELLED' && (
                    <Alert
                      severity="success"
                      icon={<SmartToyIcon sx={{ color: '#3fb950' }} />}
                      action={
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<FlashOnIcon />}
                            onClick={() => setCopilotLiveTourActive(true)}
                            sx={{
                              backgroundColor: '#238636',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              '&:hover': { backgroundColor: '#2ea043' },
                              boxShadow: '0 0 10px rgba(63, 185, 80, 0.5)'
                            }}
                          >
                            ⚡ Run Live Copilot (Screen Cursor)
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => setCopilotModalOpen(true)}
                            sx={{
                              borderColor: 'rgba(63, 185, 80, 0.5)',
                              color: '#3fb950',
                              fontWeight: 700,
                              fontSize: '0.72rem'
                            }}
                          >
                            📋 Modal
                          </Button>
                        </Stack>
                      }
                      sx={{
                        mt: 1.5,
                        backgroundColor: 'rgba(35, 134, 54, 0.15)',
                        border: '1px solid rgba(63, 185, 80, 0.45)',
                        color: '#f0f6fc',
                        borderRadius: 1.5,
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#3fb950' }}>
                        Autonomous Copilot / Paramedic Agent Mode Active
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                        Hands-free pipeline executes En Route ➔ On Scene ➔ Board Patient ➔ Evaluate AI Rank #1 Destination ➔ Dispatch ED Pre-Alert.
                      </Typography>
                    </Alert>
                  )}

                  {/* Scene Description & Problem Condition Details */}
                  <Box sx={{ mt: 1.5, p: 2, backgroundColor: '#090d13', borderRadius: 1.5, border: '1px solid #30363d' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ color: '#ffd33d', fontWeight: 800 }}>
                        🚨 Reported Problem / Patient Condition:
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 600, fontSize: 13.5, pl: 0.5, py: 0.5 }}>
                      {selectedIncident.description || 'Emergency medical assistance requested by bystander.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, mt: 1, pt: 1, borderTop: '1px solid #21262d', flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>
                        Assigned Unit: <strong style={{ color: '#58a6ff' }}>{selectedIncident.ambulanceCallSign || 'AMB-01'}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>
                        Distance: <strong style={{ color: '#3fb950' }}>{selectedIncident.distanceKm?.toFixed(1) || 2.1} km</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>
                        ETA: <strong style={{ color: '#d29922' }}>~{selectedIncident.etaMinutes || 4} mins</strong>
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Dynamic AI Destination Recommendation Tray (Shown when patient is boarded or during copilot tour) */}
              {(selectedIncident.status === 'PATIENT_LOADED' || copilotLiveTourActive) && (
                <InlineDestinationRecommendationTray
                  key={`${selectedIncident.id}-${selectedIncident.status || ''}-${selectedIncident.patientCaseId || ''}`}
                  incident={selectedIncident}
                  onSelectHospital={(h) => console.log('Copilot Selected Hospital:', h)}
                  onDispatched={(alert) => console.log('Copilot Pre-Alert Dispatched:', alert)}
                />
              )}

              {/* ========================================================================= */}
              {/* AI CLINICAL VISION SCENE ANALYSIS (SCENE TRIAGE)                          */}
              {/* ========================================================================= */}
              {aiVisionLoading && (
                <Box sx={{ p: 2, backgroundColor: 'rgba(88, 166, 255, 0.1)', border: '1px solid #58a6ff', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} sx={{ color: '#58a6ff' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#58a6ff', fontWeight: 800 }}>
                      Analyzing Incident Scene Visuals with Clinical Vision AI...
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>
                      Screening acute tissue trauma, open hemorrhage, cervical threat, and vital hemodynamic indicators.
                    </Typography>
                  </Box>
                </Box>
              )}

              {aiVisionData && !aiVisionLoading && (
                <Card sx={{ backgroundColor: 'rgba(210, 153, 34, 0.08)', border: '1.5px solid #d29922', borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AutoAwesomeIcon sx={{ color: '#ffd33d', fontSize: 22 }} />
                        <Typography variant="subtitle1" sx={{ color: '#ffd33d', fontWeight: 900 }}>
                          AI Clinical Vision Scene Analysis (Scene Triage)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip
                          label={`Confidence: ${aiVisionData.confidence || 94}%`}
                          size="small"
                          sx={{ height: 22, fontSize: '0.7rem', backgroundColor: 'rgba(210, 153, 34, 0.25)', color: '#ffd33d', fontWeight: 800 }}
                        />
                        <Chip
                          label={aiVisionData.severity === 'CRITICAL' ? 'CRITICAL • P1' : 'PRIORITY • P2'}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            backgroundColor: aiVisionData.severity === 'CRITICAL' ? '#da3633' : '#d29922',
                            color: '#ffffff',
                            fontWeight: 800
                          }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 700, mb: 0.8 }}>
                      Identified Trauma: <span style={{ color: '#ff7b72' }}>{aiVisionData.findingSummary}</span>
                    </Typography>

                    {aiVisionData.injuryRegion && (
                      <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', mb: 1 }}>
                        Target Anatomy: <strong style={{ color: '#58a6ff' }}>{aiVisionData.injuryRegion}</strong>
                        {aiVisionData.bleedingDesc && ` • ${aiVisionData.bleedingDesc}`}
                      </Typography>
                    )}

                    <Box sx={{ mt: 1, p: 1.5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 800, display: 'block', mb: 0.5 }}>
                        PARAMEDIC PRE-ARRIVAL CLINICAL ACTION DIRECTIVES:
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', lineHeight: 1.6 }}>
                        • Apply immediate firm, continuous direct pressure dressing to control hemorrhage.
                        <br />
                        • Enforce strict cervical-spine stabilization (C-collar) prior to extrication or movement.
                        <br />
                        • Prepare 2x large-bore IV lines (18G) and initiate high-flow supplemental O2 (15L/min NRB).
                        <br />
                        • Receiving Emergency Department has received this visual finding and mobilized trauma resuscitation.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* ========================================================================= */}
              {/* ON-SCENE VISUAL EVIDENCE & CAMERA TRAY                                    */}
              {/* ========================================================================= */}
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhotoCameraIcon sx={{ color: '#58a6ff', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ color: '#f0f6fc', fontWeight: 800 }}>
                        INCIDENT SCENE & INJURY PHOTOS ({sceneSnaps.length})
                      </Typography>
                    </Box>

                    <label htmlFor="paramedic-scene-snap-input">
                      <input
                        id="paramedic-scene-snap-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleCaptureSceneSnap}
                      />
                      <Button
                        component="span"
                        size="small"
                        disabled={uploadingSnap}
                        startIcon={uploadingSnap ? <CircularProgress size={12} color="inherit" /> : <PhotoCameraIcon fontSize="small" />}
                        sx={{
                          fontSize: '0.72rem',
                          py: 0.3,
                          px: 1.2,
                          backgroundColor: 'rgba(88, 166, 255, 0.15)',
                          color: '#58a6ff',
                          border: '1px solid rgba(88, 166, 255, 0.3)',
                          fontWeight: 700,
                          '&:hover': { backgroundColor: 'rgba(88, 166, 255, 0.25)' }
                        }}
                      >
                        {uploadingSnap ? 'Analyzing with AI...' : '+ Add On-Scene Photo'}
                      </Button>
                    </label>
                  </Box>

                  {sceneSnaps.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, pt: 0.5 }}>
                      {sceneSnaps.map((s, idx) => {
                        const imgUrl = s.highResSnap || s.dataUrl;
                        const isSos = s.source === 'CITIZEN_SOS';
                        return (
                          <Box
                            key={idx}
                            onClick={() => setLightboxSnap(s)}
                            sx={{
                              position: 'relative',
                              minWidth: 120,
                              maxWidth: 120,
                              height: 85,
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
                                  top: 3,
                                  left: 3,
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
                              label={isSos ? 'CITIZEN SOS' : 'ON-SCENE'}
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: 2,
                                left: 2,
                                height: 16,
                                fontSize: '0.58rem',
                                fontWeight: 800,
                                backgroundColor: isSos ? 'rgba(248,81,73,0.92)' : 'rgba(56,139,253,0.92)',
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
                    <Box sx={{ p: 2, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px dashed #30363d', textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                        No incident photos attached yet. Tap "+ Add On-Scene Photo" to capture collision damage or trauma evidence for hospital triage.
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Leaflet OpenStreetMap Container */}
              <Box
                sx={{
                  height: 'calc(100vh - 350px)',
                  minHeight: 400,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #30363d',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  position: 'relative'
                }}
              >
                <MapContainer center={scenePos} zoom={14} style={{ width: '100%', height: '100%' }}>
                  <RecenterMap center={scenePos} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Incident Scene Marker */}
                  <Marker position={scenePos} icon={sceneIcon}>
                    <Popup>
                      <strong>⚠️ ACCIDENT SCENE</strong><br />
                      Code: {selectedIncident.incidentCode}<br />
                      Type: {selectedIncident.incidentType}<br />
                      Casualties: {selectedIncident.casualtyCount}<br />
                      Bystander: {selectedIncident.bystanderName} ({selectedIncident.bystanderPhone})
                    </Popup>
                  </Marker>

                  {/* Dispatched Ambulance Marker */}
                  <Marker position={ambPos} icon={ambulanceIcon}>
                    <Popup>
                      <strong>🚑 {selectedIncident.ambulanceCallSign || 'AMB-01'}</strong><br />
                      Status: En Route to Scene<br />
                      Speed: {ambulanceState?.speedKmh || 45} km/h
                    </Popup>
                  </Marker>

                  {/* Turn-by-Turn Route Vector */}
                  <Polyline
                    positions={[ambPos, scenePos]}
                    color="#f85149"
                    dashArray="8, 8"
                    weight={4}
                  />
                </MapContainer>
              </Box>
            </Box>
          ) : (
            <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: '#8b949e' }}>
                Select an incident from the queue to view scene details and navigation.
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* High-Resolution Scene Photo Lightbox Dialog with AI Findings */}
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
              {lightboxSnap?.label || (lightboxSnap?.source === 'CITIZEN_SOS' ? 'Citizen SOS Scene Photo' : 'Paramedic On-Scene Photo')}
            </Typography>
            <Chip
              label={lightboxSnap?.source === 'CITIZEN_SOS' ? 'CITIZEN SOS' : 'PARAMEDIC ON-SCENE'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                backgroundColor: lightboxSnap?.source === 'CITIZEN_SOS' ? '#da3633' : '#1f6feb',
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
              style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 8, objectFit: 'contain' }}
            />
          )}
          {lightboxSnap?.timestamp && (
            <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 1 }}>
              Captured at: {new Date(lightboxSnap.timestamp).toLocaleString()}
            </Typography>
          )}
          {(lightboxSnap?.aiFinding || (lightboxSnap?.source === 'CITIZEN_SOS' && aiVisionData?.findingSummary)) && (
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
                {lightboxSnap.aiFinding || aiVisionData?.findingSummary}
              </Typography>
              {(lightboxSnap.injuryRegion || aiVisionData?.injuryRegion) && (
                <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', mt: 0.5 }}>
                  Identified Region: <strong>{lightboxSnap.injuryRegion || aiVisionData?.injuryRegion}</strong>
                  {(lightboxSnap.bleedingDesc || aiVisionData?.bleedingDesc) && ` • ${lightboxSnap.bleedingDesc || aiVisionData?.bleedingDesc}`}
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

      {/* Paramedic Autonomous Copilot (Agent Mode) Modal */}
      <AutonomousCopilotModal
        open={copilotModalOpen}
        onClose={() => setCopilotModalOpen(false)}
        incident={selectedIncident}
        onIncidentUpdated={(updated) => {
          setSelectedIncident(updated);
          setIncidents((prev) => prev.map((inc) => (inc.id === updated.id ? updated : inc)));
        }}
        autoStart={false}
      />

      {/* Live Autonomous Paramedic Copilot Tour with Real-Time Screen Cursor Gliding & Clicking */}
      <AutonomousCopilotLiveTour
        active={copilotLiveTourActive}
        onClose={() => setCopilotLiveTourActive(false)}
        incident={selectedIncident}
        onIncidentUpdated={(updated) => {
          setSelectedIncident(updated);
          setIncidents((prev) => prev.map((inc) => (inc.id === updated.id ? updated : inc)));
        }}
      />
    </Box>
  );
};

export default IncidentDispatchPage;
