import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  Chip, Alert, CircularProgress, Stepper, Step, StepLabel,
  Paper, IconButton, Divider, Collapse, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapIcon from '@mui/icons-material/Map';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SmsIcon from '@mui/icons-material/Sms';
import CallIcon from '@mui/icons-material/Call';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { incidentApi, patientApi } from '../services/api';
import { wsService } from '../services/websocket';
import { EmergencyIncident } from '../types';

const INCIDENT_CATEGORIES = [
  { id: 'ROAD_ACCIDENT', label: 'Road Accident', icon: <DirectionsCarIcon /> },
  { id: 'CARDIAC_ARREST', label: 'Cardiac / Collapse', icon: <FavoriteIcon /> },
  { id: 'FALL_TRAUMA', label: 'Trauma / Fall', icon: <MedicalServicesIcon /> },
  { id: 'BURNS', label: 'Burns / Fire', icon: <LocalFireDepartmentIcon /> },
  { id: 'OTHER', label: 'Other Emergency', icon: <HelpOutlineIcon /> }
];

// Custom Map Pin Icon
const pinIcon = L.divIcon({
  html: `<div style="background-color:#da3633; color:white; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:3px solid white; box-shadow:0 0 14px #da3633; font-size:18px;">📍</div>`,
  className: 'pin-icon',
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

// Map click listener component
function MapClickPinpoint({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    }
  });
  return null;
}

export const CitizenSosPage: React.FC = () => {
  // Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 16.5074, lng: 80.6466 });
  const [gpsLoading, setGpsLoading] = useState<boolean>(true);
  const [gpsSource, setGpsSource] = useState<'SATELLITE_GPS' | 'NETWORK_IP' | 'MAP_PIN'>('NETWORK_IP');
  const [gpsMessage, setGpsMessage] = useState<string>('Acquiring location...');
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [showMapPicker, setShowMapPicker] = useState<boolean>(true);

  // Form state
  const [incidentType, setIncidentType] = useState<string>('ROAD_ACCIDENT');
  const [severity, setSeverity] = useState<string>('CRITICAL');
  const [casualtyCount, setCasualtyCount] = useState<number>(1);
  const [bystanderName, setBystanderName] = useState<string>('');
  const [bystanderPhone, setBystanderPhone] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // Submission & Tracking state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeIncident, setActiveIncident] = useState<EmergencyIncident | null>(() => {
    try {
      const saved = localStorage.getItem('lifeflow_active_sos');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync active incident to localStorage for phone lock/refresh persistence
  useEffect(() => {
    if (activeIncident) {
      localStorage.setItem('lifeflow_active_sos', JSON.stringify(activeIncident));
    } else {
      localStorage.removeItem('lifeflow_active_sos');
    }
  }, [activeIncident]);

  // Real-time Clock & Elapsed Response Timer
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeIncident) {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeIncident]);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}m ${s}s`;
  };

  // Auto-acquire location on mount: try GPS -> fallback to real IP geolocation -> fallback to default
  useEffect(() => {
    acquireLocation();
  }, []);

  const acquireLocation = () => {
    setGpsLoading(true);

    // 1. Try browser hardware GPS (requires HTTPS or localhost)
    if ('geolocation' in navigator && window.isSecureContext) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setCoords({ lat, lng });
          setGpsSource('SATELLITE_GPS');
          setGpsMessage(`Satellite GPS Fix (Accuracy ±${Math.round(pos.coords.accuracy)}m)`);
          setLocationAddress(`GPS: ${lat}, ${lng} (Hardware Fix)`);
          setGpsLoading(false);
        },
        (err) => {
          console.warn('Satellite GPS failed:', err.message);
          fallbackToNetworkIp();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      // Insecure context (plain HTTP over local IP like http://192.168.0.105:5173)
      fallbackToNetworkIp();
    }
  };

  // 2. Free Zero-Cost Network IP Geolocation
  const fallbackToNetworkIp = async () => {
    try {
      const res = await fetch('https://ipwho.is/');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const lat = Number(data.latitude.toFixed(6));
        const lng = Number(data.longitude.toFixed(6));
        setCoords({ lat, lng });
        setGpsSource('NETWORK_IP');
        const cityInfo = [data.city, data.region, data.country].filter(Boolean).join(', ');
        setGpsMessage(`Network Location: ${cityInfo}`);
        setLocationAddress(`Near ${cityInfo} (Tap map below to pinpoint exact street)`);
        setGpsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('IP Geolocation fallback failed:', e);
    }

    // Default fallback if network offline
    setCoords({ lat: 16.5074, lng: 80.6466 });
    setGpsSource('NETWORK_IP');
    setGpsMessage('Default City Center. Tap map below to set exact spot.');
    setLocationAddress('City Center (Tap map below to pinpoint)');
    setGpsLoading(false);
  };

  // Handler when user taps map to pinpoint exact location
  const handleMapPinSelect = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    setGpsSource('MAP_PIN');
    setGpsMessage(`Pinned on Map: ${lat}, ${lng}`);
    setLocationAddress(`Pinned at: ${lat}, ${lng}`);
  };

  // High-performance image compression using HTML5 Canvas (shrinks 10MB camera photo to ~50KB)
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
            resolve(canvas.toDataURL('image/jpeg', 0.7));
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

  // Handle Photo Capture/Upload with instant canvas auto-compression (no citizen AI wait)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0]);
      setPhotoBase64(compressed);
    }
  };

  // Submit SOS Emergency Report
  const handleSubmitSos = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        bystanderName: bystanderName.trim() || 'Citizen Bystander',
        bystanderPhone: bystanderPhone.trim() || 'N/A',
        incidentType,
        severity,
        casualtyCount,
        description: description.trim() || 'Urgent emergency assistance requested by citizen.',
        latitude: coords.lat,
        longitude: coords.lng,
        locationAddress: locationAddress || `Scene at ${coords.lat}, ${coords.lng}`,
        photoUrl: photoBase64 || undefined
      };

      const result = await incidentApi.reportSos(payload);
      setActiveIncident(result);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err.message || 'Failed to dispatch SOS alert. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle quick-symptom chip in description text
  const toggleSymptom = (label: string) => {
    setDescription((prev) => {
      const parts = prev
        ? prev.split(', ').map((s) => s.trim()).filter(Boolean)
        : [];
      if (parts.includes(label)) {
        return parts.filter((s) => s !== label).join(', ');
      } else {
        return [...parts, label].join(', ');
      }
    });
  };

  // Cellular SMS & Voice Handlers (Zero-Cost 2G/GSM cellular channels)
  const [smsDraftOpened, setSmsDraftOpened] = useState<boolean>(false);
  const [confirmingSmsSent, setConfirmingSmsSent] = useState<boolean>(false);

  const handleResetForm = () => {
    setActiveIncident(null);
    localStorage.removeItem('lifeflow_active_sos');
    setDescription('');
    setPhotoBase64(null);
    setSubmitError(null);
    setSmsDraftOpened(false);
    setConfirmingSmsSent(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOfflineSmsClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    setSmsDraftOpened(true);

    const problemDetail = description.trim() ? ` Problem: ${description.trim()}.` : '';
    const smsBody = `LIFEFLOW SOS: ${incidentType.replace('_', ' ')}.${problemDetail} At Lat ${coords.lat}, Lng ${coords.lng}. Casualties: ${casualtyCount}. Severity: ${severity}. Need urgent ambulance!`;

    // Launch cellular SMS app with destination number 7249505296
    try {
      const smsLink = document.createElement('a');
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      smsLink.href = isIOS
        ? `sms:7249505296&body=${encodeURIComponent(smsBody)}`
        : `sms:7249505296?body=${encodeURIComponent(smsBody)}`;
      document.body.appendChild(smsLink);
      smsLink.click();
      document.body.removeChild(smsLink);
    } catch (err) {
      console.warn('Native SMS link trigger error:', err);
    }
  };

  const handleConfirmSmsSent = async () => {
    try {
      setConfirmingSmsSent(true);
      const problemDetail = description.trim() ? ` Problem: ${description.trim()}.` : '';
      const smsBody = `LIFEFLOW SOS: ${incidentType.replace('_', ' ')}.${problemDetail} At Lat ${coords.lat}, Lng ${coords.lng}. Casualties: ${casualtyCount}. Severity: ${severity}. Need urgent ambulance!`;

      const res = await incidentApi.smsWebhook({
        from: bystanderPhone.trim() || '7249505296',
        body: smsBody,
        latitude: coords.lat,
        longitude: coords.lng
      });
      setActiveIncident(res);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err.message || 'Failed to dispatch alert.');
    } finally {
      setConfirmingSmsSent(false);
    }
  };

  const handleOfflineCallClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    // Trigger cellular phone dialer with destination number 7249505296
    try {
      const telLink = document.createElement('a');
      telLink.href = 'tel:7249505296';
      document.body.appendChild(telLink);
      telLink.click();
      document.body.removeChild(telLink);
    } catch (err) {
      console.warn('Native phone call trigger error:', err);
    }
  };

  // Real-time tracking synchronization (WebSocket + 2s Polling + Visibility wakeup)
  useEffect(() => {
    // 1. WebSocket listeners on both /topic/incidents and /topic/alerts
    const unsubIncidents = wsService.subscribe('/topic/incidents', (updated: EmergencyIncident) => {
      if (!updated) return;
      if (activeIncident && updated.id === activeIncident.id) {
        setActiveIncident((prev) => ({ ...prev, ...updated }));
      } else if (!activeIncident && smsDraftOpened) {
        // Automatically link incoming incident if citizen sent SMS via gateway
        setActiveIncident(updated);
      }
    });

    const unsubAlerts = wsService.subscribe('/topic/alerts', (updated: EmergencyIncident) => {
      if (!updated) return;
      if (activeIncident && updated.id === activeIncident.id) {
        setActiveIncident((prev) => ({ ...prev, ...updated }));
      } else if (!activeIncident && smsDraftOpened) {
        setActiveIncident(updated);
      }
    });

    if (!activeIncident?.id) {
      return () => {
        unsubIncidents();
        unsubAlerts();
      };
    }

    // 2. Fast 2-second background status poll
    const pollStatus = async () => {
      try {
        const latest = await incidentApi.getById(activeIncident.id);
        if (latest) {
          setActiveIncident((prev) => {
            if (!prev || prev.status !== latest.status || prev.etaMinutes !== latest.etaMinutes) {
              return latest;
            }
            return prev;
          });
        }
      } catch {
        // network retry
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);

    // 3. Document visibility listener (instant refresh when user unlocks phone or switches back)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        pollStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', pollStatus);

    return () => {
      unsubIncidents();
      unsubAlerts();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', pollStatus);
    };
  }, [activeIncident?.id, smsDraftOpened]);

  // Stepper state mapping
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'REPORTED':
      case 'ASSIGNED':
        return 0;
      case 'EN_ROUTE_SCENE':
        return 1;
      case 'ON_SCENE':
        return 2;
      case 'PATIENT_LOADED':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#090d13',
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 540 }}>
        {/* Header Branding */}
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'rgba(248, 81, 73, 0.15)',
              border: '2px solid #f85149',
              mb: 1,
              boxShadow: '0 0 20px rgba(248, 81, 73, 0.4)'
            }}
          >
            <WarningAmberIcon sx={{ fontSize: 32, color: '#f85149' }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#f0f6fc', letterSpacing: 0.5 }}>
            LifeFlow AI • Emergency SOS
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5 }}>
            Zero-Cost Citizen Incident Dispatch • Nearest Ambulance Response
          </Typography>
          <Box sx={{ mt: 1.2, display: 'flex', justifyContent: 'center' }}>
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: '15px !important', color: '#58a6ff !important' }} />}
              label={`${formattedDate} • ${formattedTime}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(56, 139, 253, 0.1)',
                color: '#f0f6fc',
                border: '1px solid rgba(56, 139, 253, 0.3)',
                fontWeight: 700,
                fontSize: 12
              }}
            />
          </Box>
          {activeIncident && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'center' }}>
              <Chip
                label="🚨 Active SOS Session • Tap to Reset & Report New"
                onClick={handleResetForm}
                onDelete={handleResetForm}
                deleteIcon={<RefreshIcon sx={{ fontSize: '16px !important', color: '#f85149 !important' }} />}
                sx={{
                  backgroundColor: 'rgba(248, 81, 73, 0.15)',
                  color: '#f85149',
                  border: '1px solid #f85149',
                  fontWeight: 700,
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(248, 81, 73, 0.25)' }
                }}
              />
            </Box>
          )}
        </Box>

        {activeIncident ? (
          /* =========================================================================
             POST-SUBMISSION LIVE DISPATCH TRACKER VIEW
             ========================================================================= */
          <Card
            sx={{
              backgroundColor: '#161b22',
              border: '2px solid #3fb950',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(63, 185, 80, 0.25)',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                backgroundColor:
                  activeIncident.status === 'EN_ROUTE_SCENE' ? '#1f6feb' :
                  activeIncident.status === 'ON_SCENE' ? '#d29922' :
                  activeIncident.status === 'PATIENT_LOADED' ? '#8957e5' : '#238636',
                p: 2,
                textAlign: 'center',
                transition: 'background-color 0.4s ease'
              }}
            >
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>
                {activeIncident.status === 'ASSIGNED' && '🚨 AMBULANCE DISPATCHED!'}
                {activeIncident.status === 'EN_ROUTE_SCENE' && '⚡ AMBULANCE EN ROUTE TO YOU!'}
                {activeIncident.status === 'ON_SCENE' && '📍 PARAMEDICS ARRIVED AT SCENE!'}
                {activeIncident.status === 'PATIENT_LOADED' && '🏥 PATIENT BOARDED & IN TRANSIT!'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#e6edf3' }}>
                Incident Code: <strong>{activeIncident.incidentCode}</strong>
                {activeIncident.patientCaseId && (
                  <span> • Patient Case: <strong style={{ color: '#ffd33d' }}>{activeIncident.patientCaseId}</strong></span>
                )}
              </Typography>
              {activeIncident.patientCaseId && (
                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={`🫀 Patient Twin Linked: ${activeIncident.patientCaseId}`}
                    size="small"
                    sx={{ backgroundColor: 'rgba(255, 211, 61, 0.2)', color: '#ffd33d', fontWeight: 700, fontSize: 11 }}
                  />
                </Box>
              )}
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: '14px !important', color: '#fff !important' }} />}
                  label={`Reported: ${new Date(activeIncident.reportedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff', fontWeight: 600, fontSize: 11 }}
                />
                <Chip
                  label={`⏱️ Elapsed: ${formatElapsed(elapsedSeconds)}`}
                  size="small"
                  sx={{ backgroundColor: 'rgba(0,0,0,0.35)', color: '#ffd33d', fontWeight: 700, fontSize: 11 }}
                />
                <IconButton
                  size="small"
                  onClick={async () => {
                    try {
                      const latest = await incidentApi.getById(activeIncident.id);
                      if (latest) setActiveIncident(latest);
                    } catch {}
                  }}
                  sx={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.5)' } }}
                  title="Check live status now"
                >
                  <RefreshIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Emergency Retest & Cellular Actions Panel */}
              <Paper sx={{ p: 1.5, mb: 2.5, backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#8b949e', textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 1, textAlign: 'center' }}>
                  Emergency Retest & Cellular Actions:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      onClick={() => handleOfflineSmsClick()}
                      sx={{
                        backgroundColor: '#1f6feb',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        py: 0.8,
                        '&:hover': { backgroundColor: '#388bfd' }
                      }}
                    >
                      📱 Send Another 2G SMS
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={handleResetForm}
                      sx={{
                        borderColor: '#f85149',
                        color: '#f85149',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        py: 0.8,
                        '&:hover': { borderColor: '#da3633', backgroundColor: 'rgba(248, 81, 73, 0.1)' }
                      }}
                    >
                      🔄 Clear & Report New Case
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Stepper Progression */}
              <Box sx={{ my: 2 }}>
                <Stepper activeStep={getStepIndex(activeIncident.status)} alternativeLabel>
                  <Step>
                    <StepLabel StepIconProps={{ sx: { color: '#3fb950 !important' } }}>
                      <Typography variant="caption" sx={{ color: '#c9d1d9', fontWeight: 600 }}>
                        Dispatched
                      </Typography>
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>
                      <Typography variant="caption" sx={{ color: '#c9d1d9', fontWeight: 600 }}>
                        En Route
                      </Typography>
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>
                      <Typography variant="caption" sx={{ color: '#c9d1d9', fontWeight: 600 }}>
                        At Scene
                      </Typography>
                    </StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>
                      <Typography variant="caption" sx={{ color: '#c9d1d9', fontWeight: 600 }}>
                        Boarded
                      </Typography>
                    </StepLabel>
                  </Step>
                </Stepper>
              </Box>

              <Divider sx={{ my: 2, borderColor: '#30363d' }} />

              {/* Status and ETA Metrics */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', textTransform: 'uppercase' }}>
                      Assigned Vehicle
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#58a6ff', fontWeight: 700, mt: 0.5 }}>
                      🚑 {activeIncident.ambulanceCallSign || 'AMB-01'}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', textTransform: 'uppercase' }}>
                      Estimated Arrival
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#3fb950', fontWeight: 700, mt: 0.5 }}>
                      ~{activeIncident.etaMinutes || 4} Mins ({activeIncident.distanceKm?.toFixed(1) || 2.4} km)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Reported Emergency Problem & Condition */}
              <Paper sx={{ p: 2, mb: 2, backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#8b949e', textTransform: 'uppercase', fontWeight: 700, display: 'block', mb: 0.5 }}>
                  Reported Emergency Condition & Problem:
                </Typography>
                <Typography variant="body1" sx={{ color: '#f0f6fc', fontWeight: 700 }}>
                  🚨 {activeIncident.incidentType?.replace('_', ' ')} • {activeIncident.casualtyCount} Casualty ({activeIncident.severity})
                </Typography>
                {activeIncident.description && (
                  <Typography variant="body2" sx={{ color: '#58a6ff', mt: 0.5 }}>
                    📝 <strong>Problem / Details: </strong>{activeIncident.description}
                  </Typography>
                )}
              </Paper>

              {/* Status Banner */}
              <Alert
                severity={activeIncident.status === 'ON_SCENE' ? 'success' : 'info'}
                sx={{
                  backgroundColor: 'rgba(88, 166, 255, 0.1)',
                  color: '#f0f6fc',
                  border: '1px solid #388bfd',
                  mb: 3
                }}
              >
                <strong>Current Status: </strong>
                {activeIncident.status === 'ASSIGNED' && 'Ambulance assigned and preparing departure.'}
                {activeIncident.status === 'EN_ROUTE_SCENE' && 'Ambulance is actively navigating to your location!'}
                {activeIncident.status === 'ON_SCENE' && 'Paramedics have arrived at your scene.'}
                {activeIncident.status === 'PATIENT_LOADED' && 'Patient is boarded. Cabin digital twin active.'}
              </Alert>

              {/* Scene Guidelines */}
              <Paper sx={{ p: 2, backgroundColor: '#090d13', border: '1px solid #21262d', mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: '#d29922', fontWeight: 700, mb: 1 }}>
                  ⚠️ Critical On-Scene Instructions:
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: 13, mb: 0.5 }}>
                  • Do <strong>NOT</strong> move injured persons unless immediate fire/hazard risk exists.
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: 13, mb: 0.5 }}>
                  • Keep airways clear and maintain direct pressure on severe bleeding using clean cloth.
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e', fontSize: 13 }}>
                  • Stand by in a safe spot to flag down the incoming ambulance ({activeIncident.ambulanceCallSign || 'AMB-01'}).
                </Typography>
              </Paper>

              <Button
                variant="outlined"
                fullWidth
                onClick={handleResetForm}
                sx={{
                  borderColor: '#f85149',
                  color: '#f85149',
                  fontWeight: 800,
                  py: 1.2,
                  borderRadius: 2,
                  '&:hover': { borderColor: '#da3633', backgroundColor: 'rgba(248, 81, 73, 0.1)' }
                }}
              >
                🔄 Reset & Report Another Emergency
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* =========================================================================
             CITIZEN SOS REPORT FORM VIEW
             ========================================================================= */
          <Card
            sx={{
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Location Card with Tap-to-Pinpoint Map */}
              <Paper
                sx={{
                  p: 1.5,
                  mb: 2,
                  backgroundColor: '#0d1117',
                  border: '1px solid',
                  borderColor: gpsSource === 'SATELLITE_GPS' ? '#238636' : '#388bfd',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ color: gpsSource === 'SATELLITE_GPS' ? '#3fb950' : '#58a6ff' }} />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600 }}>
                          Emergency Location:
                        </Typography>
                        <Chip
                          label={gpsSource === 'SATELLITE_GPS' ? 'Satellite GPS' : gpsSource === 'MAP_PIN' ? 'Pinned on Map' : 'Network Location'}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            backgroundColor: gpsSource === 'SATELLITE_GPS' ? 'rgba(63, 185, 80, 0.2)' : 'rgba(88, 166, 255, 0.2)',
                            color: gpsSource === 'SATELLITE_GPS' ? '#3fb950' : '#58a6ff',
                            fontWeight: 700
                          }}
                        />
                      </Box>
                      {gpsLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                          <CircularProgress size={12} sx={{ color: '#58a6ff' }} />
                          <Typography variant="body2" sx={{ color: '#58a6ff' }}>Detecting location...</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 700, mt: 0.3 }}>
                          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.3 }}>
                        {gpsMessage}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={acquireLocation} sx={{ color: '#58a6ff' }} title="Refresh location">
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      sx={{ color: showMapPicker ? '#3fb950' : '#8b949e' }}
                      title="Toggle Interactive Map"
                    >
                      <MapIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* HTTP Security Info Tip */}
                {!window.isSecureContext && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #21262d' }}>
                    <Typography variant="caption" sx={{ color: '#d29922', display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11 }}>
                      <LockOpenIcon sx={{ fontSize: 13 }} />
                      Browsers require HTTPS for hardware satellite GPS. We detected your city via network. Tap the map below to pinpoint your exact street.
                    </Typography>
                  </Box>
                )}

                {/* Interactive Leaflet Pinpoint Map */}
                <Collapse in={showMapPicker}>
                  <Box sx={{ mt: 1.5, borderRadius: 2, overflow: 'hidden', border: '1px solid #30363d', position: 'relative' }}>
                    <Box sx={{ height: 200, width: '100%' }}>
                      <MapContainer
                        center={[coords.lat, coords.lng]}
                        zoom={13}
                        style={{ width: '100%', height: '100%' }}
                        key={`${coords.lat}-${coords.lng}`}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[coords.lat, coords.lng]} icon={pinIcon}>
                          <Popup>
                            <strong>Accident Scene</strong><br />
                            Lat: {coords.lat}<br />
                            Lng: {coords.lng}
                          </Popup>
                        </Marker>
                        <MapClickPinpoint onSelect={handleMapPinSelect} />
                      </MapContainer>
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 6,
                        left: 6,
                        right: 6,
                        backgroundColor: 'rgba(13, 17, 23, 0.85)',
                        backdropFilter: 'blur(4px)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 1000
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#c9d1d9', fontSize: 11, fontWeight: 600 }}>
                        👆 Tap anywhere on the map to set scene pin
                      </Typography>
                      <Chip
                        label="Pin Active"
                        size="small"
                        sx={{ height: 16, fontSize: 9, backgroundColor: '#238636', color: '#fff' }}
                      />
                    </Box>
                  </Box>
                </Collapse>
              </Paper>

              {/* Landmark or Address Input */}
              <TextField
                fullWidth
                size="small"
                label="Street Name / Landmark (Optional)"
                placeholder="e.g. Near Bus Stand, Opp. Fuel Station, MG Road"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />

              {/* Accident Category Selection */}
              <Typography variant="subtitle2" sx={{ color: '#c9d1d9', mb: 1, fontWeight: 700 }}>
                Emergency Incident Type:
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                {INCIDENT_CATEGORIES.map((cat) => {
                  const selected = incidentType === cat.id;
                  return (
                    <Grid item xs={6} sm={4} key={cat.id}>
                      <Button
                        variant={selected ? 'contained' : 'outlined'}
                        fullWidth
                        startIcon={cat.icon}
                        onClick={() => setIncidentType(cat.id)}
                        sx={{
                          py: 1,
                          fontSize: 12,
                          backgroundColor: selected ? '#1f6feb' : '#0d1117',
                          color: selected ? '#fff' : '#c9d1d9',
                          borderColor: selected ? '#58a6ff' : '#30363d',
                          '&:hover': {
                            backgroundColor: selected ? '#388bfd' : '#21262d'
                          }
                        }}
                      >
                        {cat.label}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Casualty Count & Severity */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ color: '#c9d1d9', mb: 0.5, fontWeight: 700 }}>
                    Casualties:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {[1, 2, 3, 4].map((num) => (
                      <Chip
                        key={num}
                        label={num === 4 ? '4+' : `${num}`}
                        clickable
                        onClick={() => setCasualtyCount(num)}
                        sx={{
                          flex: 1,
                          backgroundColor: casualtyCount === num ? '#f85149' : '#0d1117',
                          color: casualtyCount === num ? '#fff' : '#c9d1d9',
                          border: '1px solid',
                          borderColor: casualtyCount === num ? '#f85149' : '#30363d',
                          fontWeight: 700
                        }}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="subtitle2" sx={{ color: '#c9d1d9', mb: 0.5, fontWeight: 700 }}>
                    Severity:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {['CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
                      <Chip
                        key={sev}
                        label={sev === 'CRITICAL' ? 'Critical' : sev === 'HIGH' ? 'High' : 'Moderate'}
                        clickable
                        onClick={() => setSeverity(sev)}
                        sx={{
                          flex: 1,
                          fontSize: 11,
                          backgroundColor: severity === sev ? (sev === 'CRITICAL' ? '#f85149' : '#d29922') : '#0d1117',
                          color: severity === sev ? '#fff' : '#c9d1d9',
                          border: '1px solid',
                          borderColor: severity === sev ? '#f85149' : '#30363d',
                          fontWeight: 700
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              {/* Scene Photo Capture */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#c9d1d9', mb: 1, fontWeight: 700 }}>
                  Accident Scene Photo (Optional):
                </Typography>
                {photoBase64 ? (
                  <>
                    <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid #30363d' }}>
                    <img
                      src={photoBase64}
                      alt="Accident scene preview"
                      style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => setPhotoBase64(null)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#f85149',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>

                  {/* Clean Instant Photo Attached Status Badge */}
                  <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: 'rgba(63, 185, 80, 0.12)', border: '1px solid #3fb950', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleIcon sx={{ color: '#3fb950', fontSize: 24, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: '#3fb950', fontWeight: 800, fontSize: '0.85rem' }}>
                        📷 Scene Photo Attached • Direct Transmit to Paramedics
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', mt: 0.2 }}>
                        Photo will be delivered directly to the responding ambulance crew and emergency hospital trauma unit upon SOS dispatch.
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<PhotoCameraIcon />}
                    sx={{
                      py: 1.2,
                      borderStyle: 'dashed',
                      borderColor: '#30363d',
                      color: '#8b949e',
                      backgroundColor: '#0d1117',
                      '&:hover': { borderColor: '#58a6ff', color: '#58a6ff' }
                    }}
                  >
                    Take Photo or Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={handlePhotoCapture}
                    />
                  </Button>
                )}
              </Box>

              {/* Emergency Problem & Condition Section */}
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ color: '#ffd33d', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span style={{ fontSize: 16 }}>🚨</span> What is the Problem / Emergency Condition?
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    Tap symptoms below or type details
                  </Typography>
                </Box>

                {/* Quick-Select Symptom Chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.5 }}>
                  {[
                    { label: 'Severe Bleeding', icon: '🩸' },
                    { label: 'Unconscious', icon: '😵' },
                    { label: 'Not Breathing', icon: '🫁' },
                    { label: 'Chest Pain', icon: '🫀' },
                    { label: 'Trapped in Vehicle', icon: '🚗' },
                    { label: 'Head Injury', icon: '🤕' },
                    { label: 'Broken Bone', icon: '🦴' },
                    { label: 'Severe Burns', icon: '🔥' }
                  ].map((symptom) => {
                    const isSelected = description.includes(symptom.label);
                    return (
                      <Chip
                        key={symptom.label}
                        label={`${symptom.icon} ${symptom.label}`}
                        size="small"
                        clickable
                        onClick={() => toggleSymptom(symptom.label)}
                        sx={{
                          fontSize: 11,
                          fontWeight: isSelected ? 800 : 600,
                          backgroundColor: isSelected ? 'rgba(248, 81, 73, 0.25)' : '#161b22',
                          color: isSelected ? '#ff7b72' : '#c9d1d9',
                          border: '1px solid',
                          borderColor: isSelected ? '#f85149' : '#30363d',
                          '&:hover': {
                            backgroundColor: isSelected ? 'rgba(248, 81, 73, 0.35)' : '#21262d'
                          }
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Freeform Problem Text Field */}
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  placeholder="Describe what happened or victim condition (e.g. 2 cars collided, victim bleeding heavily, unconscious)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#161b22',
                      color: '#f0f6fc',
                      fontSize: 13,
                      '& fieldset': { borderColor: '#30363d' },
                      '&:hover fieldset': { borderColor: '#58a6ff' },
                      '&.Mui-focused fieldset': { borderColor: '#58a6ff' }
                    }
                  }}
                />
              </Box>

              {/* Bystander Contact (Optional) */}
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Your Name (Optional)"
                    value={bystanderName}
                    onChange={(e) => setBystanderName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Your Phone (Optional)"
                    value={bystanderPhone}
                    onChange={(e) => setBystanderPhone(e.target.value)}
                  />
                </Grid>
              </Grid>

              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}

              {/* Big Emergency SOS Button */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                onClick={handleSubmitSos}
                startIcon={submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : <WarningAmberIcon />}
                sx={{
                  py: 1.8,
                  fontSize: 17,
                  fontWeight: 900,
                  letterSpacing: 1,
                  backgroundColor: '#da3633',
                  boxShadow: '0 0 24px rgba(218, 54, 51, 0.6)',
                  color: '#ffffff',
                  borderRadius: 2,
                  animation: submitting ? 'none' : 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(218, 54, 51, 0.7)' },
                    '70%': { boxShadow: '0 0 0 16px rgba(218, 54, 51, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(218, 54, 51, 0)' }
                  },
                  '&:hover': {
                    backgroundColor: '#b62324'
                  }
                }}
              >
                {submitting ? 'DISPATCHING AMBULANCE...' : '🚨 TRANSMIT EMERGENCY SOS'}
              </Button>

              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#8b949e', mt: 1.5 }}>
                Directly alerts Nearest Lead Paramedic • Zero-Cost Local Dispatch
              </Typography>

              <Divider sx={{ my: 2.5, borderColor: '#30363d' }} />

              {/* Zero Internet / Offline Cellular Emergency Section */}
              <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                  <WifiOffIcon sx={{ color: '#ffd33d', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#ffd33d', fontWeight: 800 }}>
                    No Internet / Mobile Data? (Offline Fallback)
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1.5 }}>
                  Works without Wi-Fi or data packets using standard cellular 2G/GSM voice & SMS channels.
                </Typography>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      onClick={handleOfflineSmsClick}
                      variant="outlined"
                      fullWidth
                      startIcon={<SmsIcon sx={{ color: '#58a6ff' }} />}
                      sx={{
                        borderColor: 'rgba(88, 166, 255, 0.4)',
                        color: '#f0f6fc',
                        fontSize: 11,
                        py: 1,
                        fontWeight: 700,
                        backgroundColor: 'rgba(56, 139, 253, 0.1)',
                        '&:hover': { backgroundColor: 'rgba(56, 139, 253, 0.2)', borderColor: '#58a6ff' }
                      }}
                    >
                      Offline SMS (7249505296)
                    </Button>
                  </Grid>

                  <Grid item xs={6}>
                    <Button
                      onClick={handleOfflineCallClick}
                      variant="outlined"
                      fullWidth
                      startIcon={<CallIcon sx={{ color: '#3fb950' }} />}
                      sx={{
                        borderColor: 'rgba(63, 185, 80, 0.4)',
                        color: '#f0f6fc',
                        fontSize: 11,
                        py: 1,
                        fontWeight: 700,
                        backgroundColor: 'rgba(63, 185, 80, 0.1)',
                        '&:hover': { backgroundColor: 'rgba(63, 185, 80, 0.2)', borderColor: '#3fb950' }
                      }}
                    >
                      Emergency Call (7249505296)
                    </Button>
                  </Grid>
                </Grid>

                {smsDraftOpened && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'rgba(56, 139, 253, 0.12)',
                      border: '1px solid rgba(56, 139, 253, 0.4)',
                      textAlign: 'left'
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#58a6ff', fontSize: 13, fontWeight: 700 }}>
                      📱 Step 1: SMS Draft opened in your Messages app.
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', mt: 0.5, mb: 1.5 }}>
                      Press <strong>Send</strong> in your SMS app to transmit the text to <strong>7249505296</strong>. Then tap below to trigger the alert in the Paramedic Portal:
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      color="success"
                      disabled={confirmingSmsSent}
                      onClick={handleConfirmSmsSent}
                      startIcon={confirmingSmsSent ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                      sx={{
                        fontWeight: 800,
                        backgroundColor: '#238636',
                        py: 1,
                        fontSize: '0.85rem',
                        '&:hover': { backgroundColor: '#2ea043' }
                      }}
                    >
                      {confirmingSmsSent ? 'Connecting to Paramedics...' : '✅ I Have Sent The SMS (Trigger Alert)'}
                    </Button>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        )}
      </Box>

    </Box>
  );
};

export default CitizenSosPage;
