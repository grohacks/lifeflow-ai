import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, Divider,
  TextField, Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, LinearProgress, Switch, FormControlLabel,
  Stack, Tooltip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import DomainIcon from '@mui/icons-material/Domain';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BedIcon from '@mui/icons-material/SingleBed';
import AirlineSeatFlatIcon from '@mui/icons-material/AirlineSeatFlat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimerIcon from '@mui/icons-material/Timer';
import BloodtypeIcon from '@mui/icons-material/Bloodtype';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PersonIcon from '@mui/icons-material/Person';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { hospitalApi, preAlertApi, patientApi } from '../services/api';
import { wsService } from '../services/websocket';
import { LiveApproachingMap } from '../components/LiveApproachingMap';

export interface HospitalDoctor {
  fullName: string;
  department: string;
  username: string;
  credentialInfo: string;
}

export const HOSPITAL_DOCTORS_DIRECTORY: Record<string, HospitalDoctor[]> = {
  'HOSP-APX-5417': [
    { fullName: 'Dr. Alexander Vance, MD, FACS (Chief Trauma Surgeon)', department: 'Trauma Surgery & Resuscitation', username: 'doctor_apex', credentialInfo: 'doctor_apex / doctor123' },
    { fullName: 'Dr. Priya Sharma, MD (Consultant Neurosurgeon)', department: 'Neurotrauma & Critical Care', username: 'doctor_apex_neuro', credentialInfo: 'doctor_apex_neuro / doctor123' },
    { fullName: 'Dr. Rajesh Nair, MD (Interventional Cardiologist)', department: 'Emergency Cardiology & Cath Lab', username: 'doctor_apex_cardio', credentialInfo: 'doctor_apex_cardio / doctor123' }
  ],
  'HOSP-001': [
    { fullName: 'Dr. Robert House, MD (Trauma Surgery & Resuscitation)', department: 'Trauma Surgery & Resuscitation', username: 'doctor_trauma', credentialInfo: 'doctor_trauma / doctor123' },
    { fullName: 'Dr. Emily Watson, MD (Interventional Cardiology)', department: 'Interventional Cardiology & Cath Lab', username: 'doctor_cardio', credentialInfo: 'doctor_cardio / doctor123' }
  ],
  'HOSP-002': [
    { fullName: 'Dr. Stephen Strange, MD (Neurotrauma & Critical Care)', department: 'Neurotrauma & Critical Care', username: 'clinician', credentialInfo: 'clinician / clinician123' },
    { fullName: 'Dr. James Wilson, MD (Emergency Medicine)', department: 'Emergency Medicine', username: 'doctor_metro', credentialInfo: 'doctor_metro / doctor123' }
  ],
  'HOSP-003': [
    { fullName: 'Dr. John Watson, MD (General & Acute Care Surgery)', department: 'General & Acute Care Surgery', username: 'doctor_westside', credentialInfo: 'doctor_westside / doctor123' }
  ]
};

export const getDoctorsForFacility = (hospCode?: string, hospName?: string): HospitalDoctor[] => {
  if (hospCode && HOSPITAL_DOCTORS_DIRECTORY[hospCode]) {
    return HOSPITAL_DOCTORS_DIRECTORY[hospCode];
  }
  if (hospName) {
    const lower = hospName.toLowerCase();
    if (lower.includes('apex')) return HOSPITAL_DOCTORS_DIRECTORY['HOSP-APX-5417'];
    if (lower.includes('jude')) return HOSPITAL_DOCTORS_DIRECTORY['HOSP-001'];
    if (lower.includes('metro')) return HOSPITAL_DOCTORS_DIRECTORY['HOSP-002'];
    if (lower.includes('westside')) return HOSPITAL_DOCTORS_DIRECTORY['HOSP-003'];
  }
  return HOSPITAL_DOCTORS_DIRECTORY['HOSP-APX-5417'] || [];
};

export const HospitalConsolePage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
  const userHospitalCode = currentUser.hospitalCode;
  const isSuperAdmin = currentUser.roles?.includes('ROLE_ADMIN') || currentUser.username === 'hospital';

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [inboundAlerts, setInboundAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [divertActive, setDivertActive] = useState<boolean>(false);

  // Incoming Urgent Alert Dialog (Pops up when paramedic dispatches alert in real time)
  const [incomingAlertPopup, setIncomingAlertPopup] = useState<any>(null);

  // Hero Live Streaming Twin & Snaps States
  const [heroTwin, setHeroTwin] = useState<any>(null);
  const [heroSnaps, setHeroSnaps] = useState<any[]>([]);
  const [heroLightboxSnap, setHeroLightboxSnap] = useState<any | null>(null);

  // Doctor Directives Fast-Action Modal States
  const [doctorOrdersModalOpen, setDoctorOrdersModalOpen] = useState<boolean>(false);
  const [targetOrdersAlert, setTargetOrdersAlert] = useState<any>(null);
  const [doctorOrdersInput, setDoctorOrdersInput] = useState<string>('Administer 1g TXA IV over 10 min. Prepare rapid infuser and 4 units O-Neg.');
  const [doctorOrdersSubmitting, setDoctorOrdersSubmitting] = useState<boolean>(false);

  // Selected alert for detailed minute view
  const [detailAlert, setDetailAlert] = useState<any>(null);
  const [detailSnaps, setDetailSnaps] = useState<any[]>([]);
  const [detailTwin, setDetailTwin] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Reservation Dialog
  const [reserveModalOpen, setReserveModalOpen] = useState<boolean>(false);
  const [targetReserveAlert, setTargetReserveAlert] = useState<any>(null);
  const [reservedBeds, setReservedBeds] = useState<string>('Trauma Bay 1 (Resuscitation)');
  const [reservedBloodUnits, setReservedBloodUnits] = useState<number>(4);
  const [reservedEquipment, setReservedEquipment] = useState<string>('Mechanical Ventilator, Rapid Infuser, Thoracotomy Tray');
  const [reserveSubmitting, setReserveSubmitting] = useState<boolean>(false);

  // Doctor Notification Dialog
  const [doctorModalOpen, setDoctorModalOpen] = useState<boolean>(false);
  const [targetDoctorAlert, setTargetDoctorAlert] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('Dr. Alexander Vance, MD, FACS (Chief Trauma Surgeon)');
  const [doctorDepartment, setDoctorDepartment] = useState<string>('Trauma Surgery & Resuscitation');
  const [doctorNote, setDoctorNote] = useState<string>('Inbound severe blunt chest trauma. Prepare immediate CT angio and blood bank dispatch.');
  const [doctorSubmitting, setDoctorSubmitting] = useState<boolean>(false);

  // Play zero-cost Web Audio alert siren chime
  const playEmergencyChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      // Pulse 1: 880 Hz
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Pulse 2: 1320 Hz
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(1320, now + 0.22);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.55);
      gain2.gain.setValueAtTime(0.35, now + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.22);
      osc2.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio alert unavailable', e);
    }
  };

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const data = await hospitalApi.getAll();
      setHospitals(data || []);

      if (data && data.length > 0) {
        let initialHosp = data[0];
        // If logged-in user is an in-charge with a specific hospitalCode, strictly lock to their facility
        if (userHospitalCode) {
          const matched = data.find((h: any) => h.hospitalCode === userHospitalCode);
          if (matched) {
            initialHosp = matched;
            setSelectedHospital(matched);
            fetchPreAlerts(matched.id);
            return;
          }
        }

        if (!selectedHospital) {
          setSelectedHospital(initialHosp);
          fetchPreAlerts(initialHosp.id);
        } else {
          const updated = data.find((h: any) => h.id === selectedHospital.id) || initialHosp;
          setSelectedHospital(updated);
          fetchPreAlerts(updated.id);
        }
      }
    } catch (err) {
      console.error('Failed to load hospitals', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreAlerts = async (hospitalId: number) => {
    try {
      const alerts = await preAlertApi.getForHospital(hospitalId);
      setInboundAlerts(alerts || []);
      // If currently viewing details, refresh that alert data too
      if (detailAlert) {
        const refreshed = alerts.find((a: any) => a.prealertId === detailAlert.prealertId);
        if (refreshed) setDetailAlert(refreshed);
      }
    } catch (err) {
      console.error('Failed to load inbound alerts', err);
    }
  };

  // Real-Time WebSocket Subscriptions for Inbound Pre-Alerts
  useEffect(() => {
    if (!selectedHospital?.id) return;

    const unsubs = [
      wsService.subscribe(`/topic/prealerts/${selectedHospital.id}`, (alertData: any) => {
        if (!alertData) return;
        if (alertData.action === 'QUEUE_CLEARED') {
          setInboundAlerts([]);
          setIncomingAlertPopup(null);
          return;
        }
        playEmergencyChime();
        // If it's an unaccepted new alert, show high-priority incoming modal
        if (alertData.status === 'PENDING_ACK') {
          setIncomingAlertPopup(alertData);
        }
        fetchPreAlerts(selectedHospital.id);
      }),
      wsService.subscribe(`/topic/prealerts/all`, (alertData: any) => {
        if (!alertData) return;
        if (alertData.hospitalId === selectedHospital.id || !alertData.hospitalId) {
          fetchPreAlerts(selectedHospital.id);
        }
      })
    ];

    return () => unsubs.forEach((fn) => fn());
  }, [selectedHospital?.id]);

  useEffect(() => {
    fetchHospitals();
    const interval = setInterval(() => {
      if (selectedHospital) {
        fetchPreAlerts(selectedHospital.id);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedHospital?.id]);

  const handleHospitalChange = (h: any) => {
    setSelectedHospital(h);
    fetchPreAlerts(h.id);
  };

  const activeInboundAlerts = inboundAlerts.filter((a: any) => a.status === 'PENDING_ACK' || a.status === 'ACCEPTED');
  const primaryAlert = activeInboundAlerts.length > 0 ? activeInboundAlerts[0] : null;
  const primaryCaseId = primaryAlert?.caseId;

  // Real-time synchronization of patient digital twin vitals and camera snaps for the active inbound alert
  useEffect(() => {
    if (!primaryCaseId) {
      setHeroTwin(null);
      setHeroSnaps([]);
      return;
    }

    patientApi.getTwin(primaryCaseId).then((t) => setHeroTwin(t)).catch(() => {});
    patientApi.getSnaps(primaryCaseId).then((s) => setHeroSnaps(s || [])).catch(() => {});

    const handleSnap = (snap: any) => {
      if (!snap) return;
      const dataUrl = snap.highResSnap || snap.dataUrl;
      if (dataUrl) {
        setHeroSnaps((prev) => {
          const idx = prev.findIndex((s) => (s.highResSnap || s.dataUrl) === dataUrl);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...snap };
            return updated;
          }
          return [snap, ...prev];
        });
      }
    };

    const unsubs = [
      wsService.subscribe(`/topic/patients/${primaryCaseId}/twin`, (twinData) => {
        if (twinData) setHeroTwin(twinData);
      }),
      wsService.subscribe(`/topic/patient-twin/${primaryCaseId}`, (twinData) => {
        if (twinData) setHeroTwin(twinData);
      }),
      wsService.subscribe(`/topic/camera-snaps/${primaryCaseId}`, handleSnap),
      wsService.subscribe(`/topic/camera-stream/${primaryCaseId}`, handleSnap)
    ];

    return () => unsubs.forEach((fn) => fn());
  }, [primaryCaseId]);

  // Fast-Action Doctor Directives Handlers
  const handleOpenDoctorOrdersModal = (alert: any) => {
    setTargetOrdersAlert(alert);
    setDoctorOrdersInput(alert.doctorOrders || 'Administer 1g TXA IV over 10 min. Prepare rapid infuser and 4 units O-Neg.');
    setDoctorOrdersModalOpen(true);
  };

  const handleTransmitDoctorOrders = async () => {
    if (!targetOrdersAlert) return;
    setDoctorOrdersSubmitting(true);
    try {
      const updated = await preAlertApi.saveDoctorOrders(targetOrdersAlert.prealertId, {
        doctorName: selectedDoctor || 'On-Call Emergency Specialist',
        doctorOrders: doctorOrdersInput
      });
      setSuccessMsg(`✓ Directives transmitted to Paramedic Unit ${targetOrdersAlert.vehicleNumber || 'AMB-01'}!`);
      setDoctorOrdersModalOpen(false);
      if (selectedHospital) fetchPreAlerts(selectedHospital.id);
      if (detailAlert && detailAlert.prealertId === targetOrdersAlert.prealertId) {
        setDetailAlert(updated);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to transmit directives: ' + (err.response?.data?.message || err.message));
    } finally {
      setDoctorOrdersSubmitting(false);
    }
  };

  // 1-Click Fast Accept & Mobilize
  const handleAcceptPreAlert = async (alert: any) => {
    if (!alert?.prealertId) return;
    try {
      setUpdating(true);
      const res = await preAlertApi.accept(alert.prealertId);
      setSuccessMsg(`✓ Case ${alert.caseId} accepted by ${selectedHospital?.name || 'Emergency Department'}! Trauma Bay mobilized.`);
      setIncomingAlertPopup(null);
      setTimeout(() => setSuccessMsg(null), 5000);
      if (selectedHospital) fetchPreAlerts(selectedHospital.id);
      if (detailAlert && detailAlert.prealertId === alert.prealertId) {
        setDetailAlert(res);
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to accept pre-alert: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  // Reset / Clear Queue of Historical Test Records
  const handleClearQueue = async () => {
    if (!selectedHospital) return;
    if (!window.confirm(`Clear pre-alert queue for ${selectedHospital.name}? This resets historical test records so you can receive a fresh dispatch.`)) return;
    try {
      await preAlertApi.clearHospitalQueue(selectedHospital.id);
      setInboundAlerts([]);
      setIncomingAlertPopup(null);
      setSuccessMsg(`✓ Queue cleared. ${selectedHospital.name} ED is now in pristine standby.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchPreAlerts(selectedHospital.id);
    } catch (err: any) {
      alert('Failed to clear queue: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAdjustResource = async (resourceType: string, delta: number) => {
    if (!selectedHospital) return;
    try {
      setUpdating(true);
      const res = selectedHospital.resources?.find((r: any) => r.resourceType === resourceType);
      const currentAvailable = res ? res.availableCount : 0;
      const newCount = Math.max(0, currentAvailable + delta);
      await hospitalApi.updateResource(selectedHospital.id, resourceType, newCount);
      setSuccessMsg(`Updated ${resourceType.replace('_', ' ')} available count to ${newCount}`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchHospitals();
    } catch (err) {
      console.error('Failed to update hospital resource', err);
    } finally {
      setUpdating(false);
    }
  };

  // Open Detailed Minute View for an alert
  const handleOpenAlertDetails = async (alert: any) => {
    setDetailAlert(alert);
    setLoadingDetails(true);
    try {
      const caseId = alert.caseId || alert.patientCaseId || 'CASE-2026-001';
      const [snaps, twinData] = await Promise.all([
        patientApi.getSnaps(caseId).catch(() => []),
        patientApi.getTwin(caseId).catch(() => null)
      ]);
      setDetailSnaps(snaps || []);
      setDetailTwin(twinData);
    } catch (e) {
      console.error('Error fetching detail telemetry', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Reserve Modal
  const handleOpenReserveModal = (alert: any) => {
    setTargetReserveAlert(alert);
    setReservedBeds(alert.reservedBeds || 'Trauma Bay 1 (Resuscitation)');
    setReservedBloodUnits(alert.reservedBloodUnits || 4);
    setReservedEquipment(alert.reservedEquipment || 'Mechanical Ventilator, Rapid Infuser, Thoracotomy Tray');
    setReserveModalOpen(true);
  };

  // Submit Reservation
  const handleConfirmReservation = async () => {
    if (!targetReserveAlert) return;
    setReserveSubmitting(true);
    try {
      const updated = await preAlertApi.reserve(targetReserveAlert.prealertId, {
        reservedBeds,
        reservedBloodUnits: Number(reservedBloodUnits),
        reservedEquipment
      });
      setSuccessMsg(`Resources reserved successfully for Case ${targetReserveAlert.caseId}: ${reservedBeds}, ${reservedBloodUnits} Units Blood.`);
      setReserveModalOpen(false);
      if (selectedHospital) fetchPreAlerts(selectedHospital.id);
      if (detailAlert && detailAlert.prealertId === targetReserveAlert.prealertId) {
        setDetailAlert(updated);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to reserve resources: ' + (err.response?.data?.message || err.message));
    } finally {
      setReserveSubmitting(false);
    }
  };

  // Open Doctor Modal (strictly scoped to this facility's verified doctors)
  const handleOpenDoctorModal = (alert: any) => {
    setTargetDoctorAlert(alert);
    const hospCode = selectedHospital?.hospitalCode || alert.hospitalCode;
    const hospName = selectedHospital?.name || alert.hospitalName;
    const doctors = getDoctorsForFacility(hospCode, hospName);
    if (doctors.length > 0) {
      setSelectedDoctor(doctors[0].fullName);
      setDoctorDepartment(doctors[0].department);
    } else {
      setSelectedDoctor('Dr. Alexander Vance, MD, FACS (Chief Trauma Surgeon)');
      setDoctorDepartment('Trauma Surgery & Resuscitation');
    }
    setDoctorModalOpen(true);
  };

  // Submit Doctor Alert
  const handleConfirmDoctorAlert = async () => {
    if (!targetDoctorAlert) return;
    setDoctorSubmitting(true);
    try {
      const updated = await preAlertApi.notifyDoctor(targetDoctorAlert.prealertId, {
        doctorName: selectedDoctor,
        department: doctorDepartment,
        note: doctorNote
      });
      setSuccessMsg(`On-call specialist ${selectedDoctor} notified! Emergency patient twin and route dispatched.`);
      setDoctorModalOpen(false);
      if (selectedHospital) fetchPreAlerts(selectedHospital.id);
      if (detailAlert && detailAlert.prealertId === targetDoctorAlert.prealertId) {
        setDetailAlert(updated);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to notify doctor: ' + (err.response?.data?.message || err.message));
    } finally {
      setDoctorSubmitting(false);
    }
  };

  if (loading && !selectedHospital) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const getResource = (type: string) => {
    return selectedHospital?.resources?.find((r: any) => r.resourceType === type) || { availableCount: 0, totalCapacity: 10 };
  };

  const icuRes = getResource('ICU_BEDS');
  const traumaRes = getResource('TRAUMA_BAYS');
  const otRes = getResource('OPERATING_THEATRES');
  const ventRes = getResource('VENTILATORS');
  const icuPercent = Math.round(((icuRes.totalCapacity - icuRes.availableCount) / (icuRes.totalCapacity || 1)) * 100);

  return (
    <Box sx={{ p: 2 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <DomainIcon sx={{ color: '#3fb950', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              {selectedHospital?.name || 'Hospital ED Operations Console'}
            </Typography>
            <Chip
              label={userHospitalCode ? `DEDICATED: ${userHospitalCode}` : 'REGIONAL IN-CHARGE'}
              size="small"
              sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', border: '1px solid #3fb950', fontWeight: 700 }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5 }}>
            Logged in as <strong>{currentUser.fullName || currentUser.username}</strong> ({currentUser.roles?.[0]?.replace('ROLE_', '')})
            {userHospitalCode ? ` • Exclusively managing ${selectedHospital?.name}` : ' • Multi-hospital supervisor access'}
          </Typography>
        </Box>

        {/* Hospital Switcher (Available for Admins / Supervisors) */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {isSuperAdmin && hospitals.map((h) => (
            <Button
              key={h.id}
              variant={selectedHospital?.id === h.id ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleHospitalChange(h)}
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                backgroundColor: selectedHospital?.id === h.id ? '#238636' : 'transparent',
                borderColor: '#30363d',
                color: selectedHospital?.id === h.id ? '#fff' : '#c9d1d9'
              }}
            >
              {h.name.split(' ')[0]}
            </Button>
          ))}
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={handleClearQueue}
            sx={{ borderColor: 'rgba(248, 81, 73, 0.4)', color: '#f85149', fontSize: '0.75rem', fontWeight: 600 }}
          >
            Clear Inbound Queue
          </Button>
          <IconButton onClick={fetchHospitals} sx={{ color: '#8b949e' }} title="Refresh Pre-Alerts & Resources">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', border: '1px solid #3fb950' }}>
          {successMsg}
        </Alert>
      )}

      {/* Hospital Identity & Divert Banner */}
      <Card sx={{ mb: 3, border: '1px solid #30363d', backgroundColor: '#161b22' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                {selectedHospital?.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b949e' }}>
                {selectedHospital?.address} • Code: {selectedHospital?.hospitalCode} • Level {selectedHospital?.traumaLevel} Trauma Center
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`Trauma Level ${selectedHospital?.traumaLevel}`} size="small" sx={{ backgroundColor: '#21262d', color: '#58a6ff', fontWeight: 600 }} />
                {selectedHospital?.hasCathLab && <Chip label="Cath Lab Ready" size="small" sx={{ backgroundColor: '#21262d', color: '#3fb950' }} />}
                {selectedHospital?.hasStrokeCenter && <Chip label="Comprehensive Stroke" size="small" sx={{ backgroundColor: '#21262d', color: '#bc8cff' }} />}
                {selectedHospital?.hasHelipad && <Chip label="Helipad Ready" size="small" sx={{ backgroundColor: '#21262d', color: '#d29922' }} />}
              </Box>
            </Grid>
            <Grid item xs={12} md={3} sx={{ textAlign: 'right' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={divertActive}
                    onChange={(e) => setDivertActive(e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: divertActive ? '#d29922' : '#8b949e', fontWeight: 700 }}>
                    {divertActive ? 'ED DIVERT ACTIVE' : 'ACCEPTING ALL INBOUND'}
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Capacity Controls (ICU, Trauma, OT, Ventilators) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* ICU Beds */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>ICU BEDS</Typography>
                <BedIcon sx={{ color: '#58a6ff', fontSize: 20 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: icuRes.availableCount > 0 ? '#3fb950' : '#f85149' }}>
                  {icuRes.availableCount}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e' }}>
                  / {icuRes.totalCapacity} available
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={icuPercent}
                sx={{
                  my: 1.5,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#21262d',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: icuPercent > 85 ? '#f85149' : icuPercent > 60 ? '#d29922' : '#3fb950'
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>{icuPercent}% Occupied</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    disabled={updating || icuRes.availableCount <= 0}
                    onClick={() => handleAdjustResource('ICU_BEDS', -1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={updating || icuRes.availableCount >= icuRes.totalCapacity}
                    onClick={() => handleAdjustResource('ICU_BEDS', 1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Trauma Resuscitation Bays */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>TRAUMA RESUS BAYS</Typography>
                <LocalHospitalIcon sx={{ color: '#f85149', fontSize: 20 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: traumaRes.availableCount > 0 ? '#3fb950' : '#f85149' }}>
                  {traumaRes.availableCount}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e' }}>
                  / {traumaRes.totalCapacity} bays ready
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.round(((traumaRes.totalCapacity - traumaRes.availableCount) / (traumaRes.totalCapacity || 1)) * 100)}
                sx={{
                  my: 1.5,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#21262d',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#f85149' }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>Level 1 Shock Suites</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    disabled={updating || traumaRes.availableCount <= 0}
                    onClick={() => handleAdjustResource('TRAUMA_BAYS', -1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={updating || traumaRes.availableCount >= traumaRes.totalCapacity}
                    onClick={() => handleAdjustResource('TRAUMA_BAYS', 1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Operating Theatres */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>OPERATING THEATRES</Typography>
                <AirlineSeatFlatIcon sx={{ color: '#bc8cff', fontSize: 20 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: otRes.availableCount > 0 ? '#bc8cff' : '#f85149' }}>
                  {otRes.availableCount}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e' }}>
                  / {otRes.totalCapacity} OT ready
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.round(((otRes.totalCapacity - otRes.availableCount) / (otRes.totalCapacity || 1)) * 100)}
                sx={{
                  my: 1.5,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#21262d',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#bc8cff' }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>Emergency Surgical</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    disabled={updating || otRes.availableCount <= 0}
                    onClick={() => handleAdjustResource('OPERATING_THEATRES', -1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={updating || otRes.availableCount >= otRes.totalCapacity}
                    onClick={() => handleAdjustResource('OPERATING_THEATRES', 1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Ventilator Units */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>VENTILATORS</Typography>
                <CheckCircleIcon sx={{ color: '#388bfd', fontSize: 20 }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: ventRes.availableCount > 0 ? '#388bfd' : '#f85149' }}>
                  {ventRes.availableCount}
                </Typography>
                <Typography variant="body2" sx={{ color: '#8b949e' }}>
                  / {ventRes.totalCapacity} ventilators
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.round(((ventRes.totalCapacity - ventRes.availableCount) / (ventRes.totalCapacity || 1)) * 100)}
                sx={{
                  my: 1.5,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#21262d',
                  '& .MuiLinearProgress-bar': { backgroundColor: '#388bfd' }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>Mechanical Support</Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    disabled={updating || ventRes.availableCount <= 0}
                    onClick={() => handleAdjustResource('VENTILATORS', -1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={updating || ventRes.availableCount >= ventRes.totalCapacity}
                    onClick={() => handleAdjustResource('VENTILATORS', 1)}
                    sx={{ backgroundColor: '#21262d', color: '#c9d1d9' }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Inbound Ambulance Pre-Alerts Queue */}
      {(() => {
        const activeInboundAlerts = inboundAlerts.filter((a: any) => a.status === 'PENDING_ACK' || a.status === 'ACCEPTED');
        const primaryAlert = activeInboundAlerts.length > 0 ? activeInboundAlerts[0] : null;

        return (
          <Box sx={{ mb: 3 }}>
            {/* Active Inbound Resuscitation Case Hero Card */}
            {primaryAlert ? (
              <Card
                sx={{
                  mb: 3,
                  border: primaryAlert.status === 'PENDING_ACK' ? '2px solid #f85149' : '2px solid #3fb950',
                  backgroundColor: '#161b22',
                  boxShadow: primaryAlert.status === 'PENDING_ACK'
                    ? '0 0 20px rgba(248, 81, 73, 0.25)'
                    : '0 0 20px rgba(63, 185, 80, 0.2)'
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <NotificationsActiveIcon
                        sx={{
                          color: primaryAlert.status === 'PENDING_ACK' ? '#f85149' : '#3fb950',
                          fontSize: 28,
                          animation: primaryAlert.status === 'PENDING_ACK' ? 'pulse 1.2s infinite' : 'none',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)' },
                            '50%': { transform: 'scale(1.2)' },
                            '100%': { transform: 'scale(1)' }
                          }
                        }}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: 1 }}>
                          ACTIVE INBOUND EMERGENCY DISPATCH — {primaryAlert.vehicleNumber || 'AMB-01'}
                          <Chip
                            label={`CASE: ${primaryAlert.caseId}`}
                            size="small"
                            sx={{ backgroundColor: '#21262d', color: '#58a6ff', fontWeight: 700 }}
                          />
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>
                          Priority 1 Emergency En Route ➔ {selectedHospital?.name}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<MonitorHeartIcon />}
                        onClick={() => navigate(`/patient-twin?caseId=${primaryAlert.caseId}`)}
                        sx={{
                          backgroundColor: '#1f6feb',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          textTransform: 'none',
                          boxShadow: '0 2px 8px rgba(31, 111, 235, 0.4)',
                          '&:hover': { backgroundColor: '#388bfd' }
                        }}
                      >
                        👁️ View Full Patient Digital Twin
                      </Button>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 0.5, borderRadius: 1.5, backgroundColor: 'rgba(248, 81, 73, 0.15)', border: '1px solid #f85149', color: '#f85149', fontWeight: 800 }}>
                        <TimerIcon fontSize="small" />
                        <span>ETA: {primaryAlert.etaMinutes || 8} MINS</span>
                      </Box>

                      {primaryAlert.status === 'PENDING_ACK' ? (
                        <Chip
                          label="🚨 AWAITING ED ACCEPTANCE"
                          sx={{ backgroundColor: 'rgba(248, 81, 73, 0.25)', color: '#f85149', border: '1px solid #f85149', fontWeight: 800 }}
                        />
                      ) : (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: '16px !important', color: '#3fb950 !important' }} />}
                          label="✓ ACCEPTED & MOBILIZED"
                          sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', border: '1px solid #3fb950', fontWeight: 800 }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Patient Clinical Highlights & Status */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={7}>
                      <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                        <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>
                          FIELD CLINICAL SUMMARY:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 600, mt: 0.5 }}>
                          {primaryAlert.patientSummary || 'Acute major polytrauma en route under active resuscitation.'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: '#d29922' }}>
                            <strong>Observations:</strong> {primaryAlert.relevantObservations || 'Blunt polytrauma'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#58a6ff' }}>
                            <strong>Field Interventions:</strong> {primaryAlert.interventionsPerformed || 'High-flow O2, 2x IV'}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={5}>
                      <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', height: '100%' }}>
                        <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>
                          ALLOCATION STATUS:
                        </Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BedIcon sx={{ color: '#3fb950', fontSize: 18 }} />
                            <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 600 }}>
                              {primaryAlert.reservedBeds || 'Trauma Bay 1 (Resuscitation)'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BloodtypeIcon sx={{ color: '#f85149', fontSize: 18 }} />
                            <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                              Blood Bank: <strong>{primaryAlert.reservedBloodUnits > 0 ? `${primaryAlert.reservedBloodUnits} Units O-Neg Reserved` : '4 Units O-Neg Ready'}</strong>
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ color: '#bc8cff', fontSize: 18 }} />
                            <Typography variant="caption" sx={{ color: primaryAlert.doctorNotified ? '#bc8cff' : '#8b949e' }}>
                              Doctor: <strong>{primaryAlert.assignedDoctorName || 'Pending Assignment'}</strong>
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* ========================================================================= */}
                  {/* LIVE EN-ROUTE SENSOR TELEMETRY STREAM (CABIN VITALS)                     */}
                  {/* ========================================================================= */}
                  <Box sx={{ p: 1.5, mb: 2, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonitorHeartIcon sx={{ color: '#f85149', fontSize: 20 }} />
                        <Typography variant="caption" sx={{ color: '#f0f6fc', fontWeight: 800 }}>
                          LIVE EN-ROUTE CABIN SENSORS (CASE: {primaryAlert.caseId})
                        </Typography>
                      </Box>
                      <Chip
                        label="🟢 Streaming Live via Ambulance Gateway"
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', fontWeight: 700 }}
                      />
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box sx={{ p: 1, backgroundColor: '#161b22', borderRadius: 1, textAlign: 'center', border: '1px solid #30363d' }}>
                          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.62rem', display: 'block' }}>HEART RATE</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#f85149' }}>
                            {heroTwin?.heartRate ? Math.round(heroTwin.heartRate) : 116} <span style={{ fontSize: '0.7rem' }}>bpm</span>
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box sx={{ p: 1, backgroundColor: '#161b22', borderRadius: 1, textAlign: 'center', border: '1px solid #30363d' }}>
                          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.62rem', display: 'block' }}>SPO2 OXYGEN</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#388bfd' }}>
                            {heroTwin?.spo2 ? Math.round(heroTwin.spo2) : 94}% <span style={{ fontSize: '0.7rem' }}>O2</span>
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box sx={{ p: 1, backgroundColor: '#161b22', borderRadius: 1, textAlign: 'center', border: '1px solid #30363d' }}>
                          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.62rem', display: 'block' }}>BLOOD PRESSURE</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#d29922' }}>
                            {heroTwin?.systolicBp ? `${Math.round(heroTwin.systolicBp)}/${Math.round(heroTwin.diastolicBp || 68)}` : '108/68'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box sx={{ p: 1, backgroundColor: '#161b22', borderRadius: 1, textAlign: 'center', border: '1px solid #30363d' }}>
                          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.62rem', display: 'block' }}>RESPIRATORY</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#3fb950' }}>
                            {heroTwin?.respiratoryRate ? Math.round(heroTwin.respiratoryRate) : 24} <span style={{ fontSize: '0.7rem' }}>/min</span>
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box sx={{ p: 1, backgroundColor: '#161b22', borderRadius: 1, textAlign: 'center', border: '1px solid #30363d' }}>
                          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.62rem', display: 'block' }}>CORE TEMP</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#e3b341' }}>
                            {(heroTwin?.temperature || 37.1).toFixed(1)}°C
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={4} md={2}>
                        <Box sx={{ p: 1, backgroundColor: '#161b22', borderRadius: 1, textAlign: 'center', border: '1px solid #30363d' }}>
                          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.62rem', display: 'block' }}>CONSCIOUSNESS</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 800, color: '#bc8cff' }}>
                            {heroTwin?.consciousness || 'VERBAL'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* ========================================================================= */}
                  {/* FIELD VISUAL EVIDENCE & CITIZEN SOS SCENE PHOTOS GALLERY                  */}
                  {/* ========================================================================= */}
                  <Box sx={{ p: 1.5, mb: 2, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhotoCameraIcon sx={{ color: '#58a6ff', fontSize: 20 }} />
                        <Typography variant="caption" sx={{ color: '#f0f6fc', fontWeight: 800 }}>
                          FIELD VISUAL EVIDENCE & SOS SCENE PHOTOS ({heroSnaps.length})
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>
                        Click photo to zoom full high-res
                      </Typography>
                    </Box>

                    {heroSnaps.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, pt: 0.5 }}>
                        {heroSnaps.map((s, idx) => {
                          const imgUrl = s.highResSnap || s.dataUrl;
                          const isSos = s.source === 'CITIZEN_SOS';
                          return (
                            <Box
                              key={idx}
                              onClick={() => setHeroLightboxSnap(s)}
                              sx={{
                                position: 'relative',
                                minWidth: 140,
                                maxWidth: 140,
                                height: 95,
                                borderRadius: 1.5,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: isSos ? '2px solid #f85149' : '2px solid #58a6ff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
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
                                    top: 4,
                                    left: 4,
                                    backgroundColor: 'rgba(210, 153, 34, 0.95)',
                                    borderRadius: 1,
                                    px: 0.6,
                                    py: 0.1,
                                    fontSize: '0.55rem',
                                    fontWeight: 800,
                                    color: '#000',
                                    zIndex: 2
                                  }}
                                >
                                  ⚡ AI SCAN
                                </Box>
                              )}
                              <Chip
                                label={isSos ? 'CITIZEN SOS' : s.source === 'PARAMEDIC_SCENE' ? 'PARAMEDIC ON-SCENE' : 'AMBULANCE CABIN'}
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  bottom: 4,
                                  left: 4,
                                  height: 16,
                                  fontSize: '0.6rem',
                                  fontWeight: 800,
                                  backgroundColor: isSos ? 'rgba(248,81,73,0.95)' : s.source === 'PARAMEDIC_SCENE' ? 'rgba(210,153,34,0.95)' : 'rgba(56,139,253,0.95)',
                                  color: '#ffffff'
                                }}
                              />
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  backgroundColor: 'rgba(0,0,0,0.7)',
                                  borderRadius: '50%',
                                  p: 0.4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <ZoomInIcon sx={{ color: '#fff', fontSize: 16 }} />
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ p: 1.5, textAlign: 'center', border: '1px dashed #30363d', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>
                          No image attachments transmitted yet. Field camera feed standby.
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* High Impact Action Bar */}
                  <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {primaryAlert.status === 'PENDING_ACK' && (
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAcceptPreAlert(primaryAlert)}
                        sx={{
                          backgroundColor: '#238636',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          px: 2.5,
                          '&:hover': { backgroundColor: '#2ea043' }
                        }}
                      >
                        Accept & Mobilize Trauma Team
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={<BedIcon />}
                      onClick={() => handleOpenReserveModal(primaryAlert)}
                      sx={{
                        backgroundColor: '#1f6feb',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        '&:hover': { backgroundColor: '#388bfd' }
                      }}
                    >
                      {primaryAlert.reservedBeds ? 'Edit Bed & Blood' : 'Reserve Bed & Blood'}
                    </Button>

                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={<AssignmentIndIcon />}
                      onClick={() => handleOpenDoctorModal(primaryAlert)}
                      sx={{
                        backgroundColor: '#8957e5',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        '&:hover': { backgroundColor: '#a371f7' }
                      }}
                    >
                      {primaryAlert.doctorNotified ? 'Re-Alert Doctor' : 'Alert On-Call Doctor'}
                    </Button>

                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={<SendIcon />}
                      onClick={() => handleOpenDoctorOrdersModal(primaryAlert)}
                      sx={{
                        backgroundColor: '#bc8cff',
                        color: '#090d13',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        '&:hover': { backgroundColor: '#a371f7', color: '#fff' }
                      }}
                    >
                      {primaryAlert.doctorOrders ? 'Update Pre-Arrival Orders' : 'Send Pre-Arrival Orders'}
                    </Button>

                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenAlertDetails(primaryAlert)}
                      sx={{
                        borderColor: '#58a6ff',
                        color: '#58a6ff',
                        fontWeight: 700,
                        fontSize: '0.82rem'
                      }}
                    >
                      Minute Details & Approaching Map
                    </Button>

                    <Button
                      variant="outlined"
                      size="medium"
                      color="error"
                      startIcon={<DeleteSweepIcon />}
                      onClick={handleClearQueue}
                      sx={{
                        borderColor: 'rgba(248, 81, 73, 0.4)',
                        color: '#f85149',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        '&:hover': { backgroundColor: 'rgba(248, 81, 73, 0.1)', borderColor: '#f85149' }
                      }}
                    >
                      Clear Queue
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ mb: 3, border: '1px solid #30363d', backgroundColor: '#161b22', p: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <LocalHospitalIcon sx={{ color: '#3fb950', fontSize: 44, mb: 0.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                    {selectedHospital?.name} — Trauma Resuscitation Bays on Standby
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8b949e', maxWidth: 640 }}>
                    Emergency Department is fully operational and awaiting incoming ambulance pre-alert dispatch from field paramedic crew. When a paramedic dispatches an alert, it will instantly notify this console.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Chip label="Trauma Shock Suite 1 Ready" size="small" sx={{ backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950' }} />
                    <Chip label="Blood Bank Ready" size="small" sx={{ backgroundColor: 'rgba(56, 139, 253, 0.15)', color: '#58a6ff' }} />
                    <Chip label="On-Call Trauma Team Active" size="small" sx={{ backgroundColor: 'rgba(188, 140, 255, 0.15)', color: '#bc8cff' }} />
                  </Box>
                </Box>
              </Card>
            )}

            {/* Inbound Alerts Table Header & Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActiveIcon sx={{ color: '#58a6ff', fontSize: 22 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                  Pre-Alert Dispatch History for {selectedHospital?.name}
                </Typography>
                <Chip
                  label={`${inboundAlerts.length} Total Cases`}
                  size="small"
                  sx={{
                    backgroundColor: inboundAlerts.length > 0 ? 'rgba(56, 139, 253, 0.2)' : 'rgba(139, 148, 158, 0.2)',
                    color: inboundAlerts.length > 0 ? '#58a6ff' : '#8b949e',
                    fontWeight: 700
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleClearQueue}
                  disabled={inboundAlerts.length === 0}
                  sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 600, borderColor: '#d29922', color: '#d29922' }}
                >
                  Clear Past Test Records
                </Button>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>
                  Live WebSocket active
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#0d1117' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>AMBULANCE</TableCell>
                    <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>PATIENT CASE</TableCell>
                    <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>STATUS</TableCell>
                    <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>ETA</TableCell>
                    <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>RESERVED RESOURCES</TableCell>
                    <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>ASSIGNED DOCTOR</TableCell>
                    <TableCell sx={{ color: '#f0f6fc', fontWeight: 700, textAlign: 'right' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inboundAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#8b949e' }}>
                        No emergency pre-alerts currently in queue for {selectedHospital?.name}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inboundAlerts.map((alert: any) => (
                      <TableRow key={alert.id || alert.prealertId} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#58a6ff' }}>
                            {alert.vehicleNumber || `AMB-${alert.ambulanceId || '01'}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8b949e' }}>
                            Medic One • Priority 1
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                            {alert.caseId}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {alert.patientSummary || 'Acute trauma en route'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {alert.status === 'ACCEPTED' || alert.status === 'ACKNOWLEDGED' ? (
                            <Chip
                              icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: '#3fb950 !important' }} />}
                              label="ACCEPTED"
                              size="small"
                              sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', border: '1px solid #3fb950', fontWeight: 700 }}
                            />
                          ) : (
                            <Chip
                              label="PENDING ACCEPT"
                              size="small"
                              sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#f85149', border: '1px solid #f85149', fontWeight: 700 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f85149', fontWeight: 800 }}>
                            <TimerIcon fontSize="small" />
                            {alert.etaMinutes ? `${alert.etaMinutes} mins` : '8 mins'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {alert.reservedBeds ? (
                            <Box>
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#3fb950 !important' }} />}
                                label={alert.reservedBeds}
                                size="small"
                                sx={{ backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', border: '1px solid #3fb950', fontWeight: 600, mb: 0.5 }}
                              />
                              {alert.reservedBloodUnits > 0 && (
                                <Typography variant="caption" sx={{ display: 'block', color: '#f85149', fontWeight: 600 }}>
                                  🩸 {alert.reservedBloodUnits} Units Blood Reserved
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Chip
                              label="Pending Reservation"
                              size="small"
                              sx={{ backgroundColor: 'rgba(210, 153, 34, 0.15)', color: '#d29922', border: '1px solid #d29922' }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {alert.doctorNotified ? (
                            <Box>
                              <Chip
                                icon={<PersonIcon sx={{ fontSize: '14px !important', color: '#bc8cff !important' }} />}
                                label={alert.assignedDoctorName || 'Specialist Doctor'}
                                size="small"
                                sx={{ backgroundColor: 'rgba(188, 140, 255, 0.15)', color: '#bc8cff', border: '1px solid #bc8cff', fontWeight: 600 }}
                              />
                              <Typography variant="caption" sx={{ display: 'block', color: '#8b949e', fontSize: '0.68rem' }}>
                                Alerted at {new Date(alert.doctorNotifiedAt || '').toLocaleTimeString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Chip
                              label="Unassigned"
                              size="small"
                              sx={{ backgroundColor: '#21262d', color: '#8b949e' }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                            {/* Fast Accept Button for Pending Alerts */}
                            {alert.status === 'PENDING_ACK' && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleAcceptPreAlert(alert)}
                                sx={{
                                  fontSize: '0.72rem',
                                  textTransform: 'none',
                                  fontWeight: 800,
                                  backgroundColor: '#238636',
                                  color: '#fff',
                                  '&:hover': { backgroundColor: '#2ea043' }
                                }}
                              >
                                Accept
                              </Button>
                            )}

                            {/* Fast Arrived Button for En-Route Alerts */}
                            {(alert.status === 'ACCEPTED' || alert.status === 'ACKNOWLEDGED') && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={async () => {
                                  try {
                                    await preAlertApi.markArrived(alert.prealertId);
                                    if (selectedHospital?.id) fetchPreAlerts(selectedHospital.id);
                                  } catch (e: any) {
                                    console.error('Error marking arrived', e);
                                  }
                                }}
                                sx={{
                                  fontSize: '0.72rem',
                                  textTransform: 'none',
                                  fontWeight: 800,
                                  backgroundColor: '#238636',
                                  color: '#fff',
                                  '&:hover': { backgroundColor: '#2ea043' }
                                }}
                              >
                                🏁 Arrived
                              </Button>
                            )}

                            {alert.status === 'ARRIVED' && (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: '#3fb950 !important' }} />}
                                label="ARRIVED"
                                size="small"
                                sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', border: '1px solid #3fb950', fontWeight: 800, fontSize: '0.65rem' }}
                              />
                            )}

                            {/* Minute Details Button */}
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleOpenAlertDetails(alert)}
                              sx={{
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                fontWeight: 700,
                                borderColor: '#388bfd',
                                color: '#58a6ff'
                              }}
                            >
                              Details & Map
                            </Button>

                            {/* Patient Twin Link Button */}
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<MonitorHeartIcon />}
                              onClick={() => navigate(`/patient-twin?caseId=${alert.caseId}`)}
                              sx={{
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                fontWeight: 700,
                                borderColor: '#1f6feb',
                                color: '#58a6ff',
                                '&:hover': { borderColor: '#58a6ff', backgroundColor: 'rgba(56, 139, 253, 0.1)' }
                              }}
                            >
                              Twin
                            </Button>

                            {/* Reserve Resources Button */}
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<BedIcon />}
                              onClick={() => handleOpenReserveModal(alert)}
                              sx={{
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                fontWeight: 700,
                                backgroundColor: '#1f6feb',
                                color: '#fff',
                                '&:hover': { backgroundColor: '#388bfd' }
                              }}
                            >
                              {alert.reservedBeds ? 'Edit Bed' : 'Reserve Bed'}
                            </Button>

                            {/* Alert Doctor Button */}
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<AssignmentIndIcon />}
                              onClick={() => handleOpenDoctorModal(alert)}
                              sx={{
                                fontSize: '0.72rem',
                                textTransform: 'none',
                                fontWeight: 700,
                                backgroundColor: '#8957e5',
                                color: '#fff',
                                '&:hover': { backgroundColor: '#a371f7' }
                              }}
                            >
                              {alert.doctorNotified ? 'Re-Alert' : 'Alert Doctor'}
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );
      })()}

      {/* ========================================================================= */}
      {/* DETAILED MINUTE INFORMATION & LIVE MAP DIALOG                             */}
      {/* ========================================================================= */}
      <Dialog
        open={!!detailAlert}
        onClose={() => setDetailAlert(null)}
        maxWidth="lg"
        fullWidth
        TransitionProps={{
          onEntered: () => {
            window.dispatchEvent(new Event('resize'));
          }
        }}
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#f0f6fc', borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #30363d', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalHospitalIcon sx={{ color: '#f85149', fontSize: 26 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                Case {detailAlert?.caseId} — Minute Patient Intelligence & Approaching Map
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                En-route Unit: {detailAlert?.vehicleNumber || 'AMB-01'} ➔ {selectedHospital?.name || detailAlert?.hospitalName} • Live Telemetry Stream
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDetailAlert(null)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {loadingDetails ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {/* Left Column: Approaching Ambulance GIS Map & Directives */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#58a6ff', mb: 1 }}>
                  LIVE AMBULANCE NAVIGATION MAP (APPROACHING EMERGENCY DEPARTMENT)
                </Typography>
                <LiveApproachingMap
                  hospitalName={selectedHospital?.name || detailAlert?.hospitalName || 'Apex Regional Trauma & Specialty Center'}
                  hospitalLat={selectedHospital?.latitude || detailAlert?.hospitalLatitude || 12.981}
                  hospitalLon={selectedHospital?.longitude || detailAlert?.hospitalLongitude || 77.632}
                  initialAmbLat={detailAlert?.incidentLatitude || detailTwin?.incidentLatitude || 12.9352}
                  initialAmbLon={detailAlert?.incidentLongitude || detailTwin?.incidentLongitude || 77.6245}
                  vehicleNumber={detailAlert?.vehicleNumber || 'AMB-01 (Medic One)'}
                  initialEtaMinutes={detailAlert?.etaMinutes || 9}
                  height={320}
                  isAccepted={detailAlert?.status === 'ACCEPTED' || detailAlert?.status === 'ACKNOWLEDGED'}
                  isArrived={detailAlert?.status === 'ARRIVED'}
                  isPending={detailAlert?.status === 'PENDING_ACK'}
                  onMarkArrived={async () => {
                    if (!detailAlert?.prealertId) return;
                    try {
                      const updated = await preAlertApi.markArrived(detailAlert.prealertId);
                      setDetailAlert(updated);
                      if (selectedHospital?.id) fetchPreAlerts(selectedHospital.id);
                    } catch (e: any) {
                      console.error('Error marking arrived', e);
                    }
                  }}
                />

                {/* Paramedic Observations & Interventions */}
                <Box sx={{ mt: 2, p: 2, backgroundColor: '#0d1117', borderRadius: 2, border: '1px solid #30363d' }}>
                  <Typography variant="caption" sx={{ color: '#d29922', fontWeight: 700, display: 'block', mb: 0.5 }}>
                    FIELD CLINICAL SURVEY & INTERVENTIONS:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#c9d1d9', mb: 1 }}>
                    <strong>Observations:</strong> {detailAlert?.relevantObservations || 'Blunt polytrauma, diminished breath sounds left hemithorax.'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#c9d1d9' }}>
                    <strong>Interventions:</strong> {detailAlert?.interventionsPerformed || 'High-flow O2 15L/min NRB, 2x large-bore IV 18G established, C-collar placed.'}
                  </Typography>
                </Box>

                {/* Doctor Directives Status */}
                {detailAlert?.doctorOrders && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(188, 140, 255, 0.1)', borderRadius: 2, border: '1px solid #bc8cff' }}>
                    <Typography variant="caption" sx={{ color: '#bc8cff', fontWeight: 700, display: 'block' }}>
                      ON-CALL DOCTOR PRE-ARRIVAL ORDERS ({detailAlert?.assignedDoctorName}):
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 600, mt: 0.5 }}>
                      "{detailAlert?.doctorOrders}"
                    </Typography>
                  </Box>
                )}
              </Grid>

              {/* Right Column: Live Vitals, Sensor Waveforms & Captured Images */}
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#3fb950', mb: 1 }}>
                  LIVE PATIENT VITALS & SENSOR READINGS
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>HEART RATE</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#f85149' }}>
                        {detailTwin?.heartRate ? Math.round(detailTwin.heartRate) : 114} <span style={{ fontSize: '0.75rem' }}>bpm</span>
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>BLOOD OXYGEN</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#388bfd' }}>
                        {detailTwin?.spo2 ? Math.round(detailTwin.spo2) : 94} <span style={{ fontSize: '0.75rem' }}>%</span>
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>BLOOD PRESSURE</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#d29922' }}>
                        {detailTwin?.systolicBp ? `${Math.round(detailTwin.systolicBp)}/${Math.round(detailTwin.diastolicBp || 68)}` : '106/68'} <span style={{ fontSize: '0.75rem' }}>mmHg</span>
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>RESPIRATORY RATE</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#3fb950' }}>
                        {detailTwin?.respiratoryRate ? Math.round(detailTwin.respiratoryRate) : 24} <span style={{ fontSize: '0.75rem' }}>/min</span>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Captured Bedside Trauma Photos & Ultrasound */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#bc8cff', mb: 1 }}>
                  CAPTURED BEDSIDE IMAGES & ULTRASOUND ({detailSnaps.length} PHOTOS)
                </Typography>

                {detailSnaps.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center', backgroundColor: '#0d1117', borderRadius: 2, border: '1px solid #30363d' }}>
                    <Typography variant="body2" sx={{ color: '#8b949e' }}>
                      No diagnostic photos transmitted by ambulance crew yet.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
                    {detailSnaps.map((snap, idx) => (
                      <Box key={snap.id || idx} sx={{ border: '1px solid #30363d', borderRadius: 1.5, overflow: 'hidden', backgroundColor: '#0d1117' }}>
                        <img
                          src={snap.dataUrl || snap.url}
                          alt={snap.tag || 'bedside snap'}
                          style={{ width: '100%', height: 110, objectFit: 'cover' }}
                        />
                        <Box sx={{ p: 0.8 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#f0f6fc', display: 'block' }}>
                            {snap.tag || `Bedside Snap #${idx + 1}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
                            {snap.timestamp ? new Date(snap.timestamp).toLocaleTimeString() : 'En-route scan'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Action Buttons in Modal */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2.5 }}>
                  {detailAlert?.status !== 'ARRIVED' ? (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={async () => {
                        if (!detailAlert?.prealertId) return;
                        try {
                          const updated = await preAlertApi.markArrived(detailAlert.prealertId);
                          setDetailAlert(updated);
                          if (selectedHospital?.id) fetchPreAlerts(selectedHospital.id);
                        } catch (e: any) {
                          console.error('Error marking arrived', e);
                        }
                      }}
                      sx={{
                        backgroundColor: '#238636',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        py: 0.8,
                        boxShadow: '0 0 12px rgba(35, 134, 54, 0.5)',
                        '&:hover': { backgroundColor: '#2ea043' }
                      }}
                    >
                      🏁 Mark Ambulance Arrived at ED
                    </Button>
                  ) : (
                    <Chip
                      icon={<CheckCircleIcon sx={{ color: '#fff !important' }} />}
                      label="AMBULANCE DOCKED AT TRAUMA BAY"
                      size="medium"
                      sx={{ backgroundColor: '#238636', color: '#fff', fontWeight: 800, py: 1 }}
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<BedIcon />}
                      onClick={() => {
                        setDetailAlert(null);
                        handleOpenReserveModal(detailAlert);
                      }}
                      sx={{ backgroundColor: '#1f6feb', fontWeight: 700 }}
                    >
                      Reserve Resources
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PersonIcon />}
                      onClick={() => {
                        setDetailAlert(null);
                        handleOpenDoctorModal(detailAlert);
                      }}
                      sx={{ backgroundColor: '#8957e5', fontWeight: 700 }}
                    >
                      Assign On-Call Doctor
                    </Button>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<MonitorHeartIcon />}
                    onClick={() => {
                      const cid = detailAlert?.caseId;
                      setDetailAlert(null);
                      navigate(`/patient-twin?caseId=${cid}`);
                    }}
                    sx={{
                      borderColor: '#1f6feb',
                      color: '#58a6ff',
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': { borderColor: '#58a6ff', backgroundColor: 'rgba(56, 139, 253, 0.1)' }
                    }}
                  >
                    👁️ Open Full Patient Digital Twin
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* RESERVE RESOURCES DIALOG                                                  */}
      {/* ========================================================================= */}
      <Dialog
        open={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#f0f6fc' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#f0f6fc', borderBottom: '1px solid #30363d' }}>
          Reserve Critical Care Resources for Inbound Case {targetReserveAlert?.caseId}
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 2.5 }}>
            Lock beds, blood bank packages, and specialty equipment in advance so the trauma bay is ready when the ambulance arrives.
          </Typography>

          <TextField
            select
            fullWidth
            label="Dedicated Resuscitation Bay / Bed"
            value={reservedBeds}
            onChange={(e) => setReservedBeds(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          >
            <MenuItem value="Trauma Bay 1 (Resuscitation Suite)">Trauma Bay 1 (Resuscitation Suite)</MenuItem>
            <MenuItem value="Trauma Bay 2 (Shock Ward)">Trauma Bay 2 (Shock Ward)</MenuItem>
            <MenuItem value="ICU Bed 04 (Negative Pressure)">ICU Bed 04 (Negative Pressure)</MenuItem>
            <MenuItem value="Cath Lab Suite A">Cath Lab Suite A</MenuItem>
            <MenuItem value="Emergency OR 3">Emergency OR 3</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="number"
            label="Reserved Blood Bank Units (O-Negative PRBCs)"
            value={reservedBloodUnits}
            onChange={(e) => setReservedBloodUnits(Number(e.target.value))}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{ inputProps: { min: 0, max: 20 } }}
          />

          <TextField
            fullWidth
            label="Specialized Equipment on Standby"
            value={reservedEquipment}
            onChange={(e) => setReservedEquipment(e.target.value)}
            size="small"
            multiline
            rows={2}
            sx={{ mb: 1 }}
            placeholder="e.g. Mechanical Ventilator, Rapid Infuser, Thoracotomy Tray, Ultrasound"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setReserveModalOpen(false)} sx={{ color: '#8b949e' }}>Cancel</Button>
          <Button
            onClick={handleConfirmReservation}
            variant="contained"
            disabled={reserveSubmitting}
            sx={{ backgroundColor: '#238636', fontWeight: 700 }}
          >
            {reserveSubmitting ? 'Reserving...' : 'Confirm & Reserve Resources'}
          </Button>
        </DialogActions>
      </Dialog>



      {/* ========================================================================= */}
      {/* URGENT INCOMING PRE-ALERT DISPATCH POPUP (Triggered via Real-Time WebSocket)*/}
      {/* ========================================================================= */}
      <Dialog
        open={!!incomingAlertPopup}
        onClose={() => setIncomingAlertPopup(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#161b22',
            border: '2px solid #f85149',
            boxShadow: '0 0 35px rgba(248, 81, 73, 0.45)',
            color: '#f0f6fc',
            borderRadius: 2.5
          }
        }}
      >
        <DialogTitle sx={{ backgroundColor: 'rgba(248, 81, 73, 0.15)', borderBottom: '1px solid #f85149', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NotificationsActiveIcon sx={{ color: '#f85149', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#f85149', letterSpacing: 0.5 }}>
                🚨 NEW INCOMING AMBULANCE PRE-ALERT DISPATCHED!
              </Typography>
              <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                Field Paramedic has confirmed {selectedHospital?.name} as the target destination
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setIncomingAlertPopup(null)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 1.5, backgroundColor: '#0d1117', borderRadius: 2, border: '1px solid #30363d' }}>
            <Box>
              <Typography variant="body2" sx={{ color: '#8b949e', fontWeight: 600 }}>UNIT & CASE ID</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#58a6ff' }}>
                {incomingAlertPopup?.vehicleNumber || 'AMB-01'} • {incomingAlertPopup?.caseId}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color: '#8b949e', fontWeight: 600 }}>ESTIMATED ARRIVAL (ETA)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f85149', fontWeight: 800, fontSize: '1.25rem' }}>
                <TimerIcon />
                <span>{incomingAlertPopup?.etaMinutes || 8} MINUTES</span>
              </Box>
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block', mb: 0.5 }}>
              PATIENT SUMMARY & CHIEF COMPLAINT:
            </Typography>
            <Typography variant="body1" sx={{ color: '#f0f6fc', fontWeight: 600, backgroundColor: '#0d1117', p: 1.5, borderRadius: 1.5, border: '1px solid #30363d' }}>
              {incomingAlertPopup?.patientSummary || 'Acute trauma en route requiring immediate resuscitation.'}
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', height: '100%' }}>
                <Typography variant="caption" sx={{ color: '#d29922', fontWeight: 700, display: 'block' }}>
                  CLINICAL OBSERVATIONS:
                </Typography>
                <Typography variant="body2" sx={{ color: '#c9d1d9', mt: 0.5 }}>
                  {incomingAlertPopup?.relevantObservations || 'Blunt polytrauma, tachycardic, tachypneic.'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d', height: '100%' }}>
                <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 700, display: 'block' }}>
                  FIELD INTERVENTIONS:
                </Typography>
                <Typography variant="body2" sx={{ color: '#c9d1d9', mt: 0.5 }}>
                  {incomingAlertPopup?.interventionsPerformed || 'High-flow O2, bilateral IV lines established, spinal precautions.'}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ backgroundColor: 'rgba(210, 153, 34, 0.1)', color: '#d29922', border: '1px solid rgba(210, 153, 34, 0.4)' }}>
            <strong>Action Required:</strong> Accept this pre-alert to reserve Trauma Bay 1 and immediately transmit confirmation to the approaching paramedic crew.
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #30363d', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => {
              const alertRef = incomingAlertPopup;
              setIncomingAlertPopup(null);
              handleOpenAlertDetails(alertRef);
            }}
            sx={{ borderColor: '#58a6ff', color: '#58a6ff', fontWeight: 700 }}
          >
            View Minute Details & Live Map
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setIncomingAlertPopup(null)} sx={{ color: '#8b949e' }}>
              Dismiss
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleAcceptPreAlert(incomingAlertPopup)}
              sx={{ backgroundColor: '#238636', color: '#fff', fontWeight: 800, px: 3, '&:hover': { backgroundColor: '#2ea043' } }}
            >
              Accept & Mobilize Trauma Team
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Transmit Doctor Directives Modal */}
      <Dialog
        open={doctorOrdersModalOpen}
        onClose={() => setDoctorOrdersModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon sx={{ color: '#bc8cff' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              Transmit Specialist Pre-Arrival Directives
            </Typography>
          </Box>
          <IconButton onClick={() => setDoctorOrdersModalOpen(false)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(188, 140, 255, 0.1)', color: '#bc8cff', border: '1px solid rgba(188, 140, 255, 0.3)' }}>
            Orders entered here will instantly transmit via WebSocket to the Paramedic Cabin Console inside Unit <strong>{targetOrdersAlert?.vehicleNumber || 'AMB-01'}</strong>.
          </Alert>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, mb: 0.5 }}>
              ATTENDING SPECIALIST / PHYSICIAN:
            </Typography>
            <Select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              sx={{ backgroundColor: '#0d1117', color: '#f0f6fc', fontWeight: 700 }}
            >
              {getDoctorsForFacility(selectedHospital?.hospitalCode || targetOrdersAlert?.hospitalCode, selectedHospital?.name || targetOrdersAlert?.hospitalName).map((doc) => (
                <MenuItem key={doc.username} value={doc.fullName}>
                  👨‍⚕️ {doc.fullName} ({doc.department})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Pre-Arrival Medical Directives & Resuscitation Orders"
            value={doctorOrdersInput}
            onChange={(e) => setDoctorOrdersInput(e.target.value)}
            multiline
            rows={4}
            size="small"
            placeholder="e.g. Administer 1g TXA IV over 10 min, apply pelvic binder, prep rapid infuser and 4 units PRBCs upon bay arrival."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setDoctorOrdersModalOpen(false)} sx={{ color: '#8b949e' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={doctorOrdersSubmitting || !doctorOrdersInput.trim()}
            onClick={handleTransmitDoctorOrders}
            startIcon={<SendIcon />}
            sx={{
              backgroundColor: '#bc8cff',
              color: '#090d13',
              fontWeight: 800,
              '&:hover': { backgroundColor: '#a371f7', color: '#fff' }
            }}
          >
            {doctorOrdersSubmitting ? 'Transmitting...' : 'Dispatch Orders to Paramedic Unit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign / Alert On-Call Doctor Modal */}
      <Dialog
        open={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIndIcon sx={{ color: '#8957e5', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                Assign On-Call Specialist Doctor
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                Facility: <strong>{selectedHospital?.name || targetDoctorAlert?.hospitalName}</strong> (Code: {selectedHospital?.hospitalCode || targetDoctorAlert?.hospitalCode || 'HOSP'})
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDoctorModalOpen(false)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Alert severity="info" sx={{ mb: 2, backgroundColor: 'rgba(137, 87, 229, 0.1)', color: '#bc8cff', border: '1px solid rgba(137, 87, 229, 0.3)' }}>
            Only accredited on-call doctors belonging to <strong>{selectedHospital?.name || targetDoctorAlert?.hospitalName || 'this hospital facility'}</strong> are listed below. The assigned doctor logs in with their credentials to access the live Patient Digital Twin.
          </Alert>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, mb: 0.5 }}>
              SELECT ON-CALL SPECIALIST ({selectedHospital?.name || 'FACILITY DOCTORS'}):
            </Typography>
            <Select
              value={selectedDoctor}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDoctor(val);
                const docs = getDoctorsForFacility(
                  selectedHospital?.hospitalCode || targetDoctorAlert?.hospitalCode,
                  selectedHospital?.name || targetDoctorAlert?.hospitalName
                );
                const matched = docs.find((d) => d.fullName === val);
                if (matched) {
                  setDoctorDepartment(matched.department);
                }
              }}
              sx={{
                backgroundColor: '#0d1117',
                color: '#f0f6fc',
                fontWeight: 700,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' }
              }}
            >
              {getDoctorsForFacility(
                selectedHospital?.hospitalCode || targetDoctorAlert?.hospitalCode,
                selectedHospital?.name || targetDoctorAlert?.hospitalName
              ).map((doc) => (
                <MenuItem key={doc.username} value={doc.fullName}>
                  <Box sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                      👨‍⚕️ {doc.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                      Specialty: {doc.department} • Credentials: <strong style={{ color: '#58a6ff' }}>{doc.credentialInfo}</strong>
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Department / Specialty Suite"
            value={doctorDepartment}
            onChange={(e) => setDoctorDepartment(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Handoff Note / Triage Directives for Doctor"
            value={doctorNote}
            onChange={(e) => setDoctorNote(e.target.value)}
            multiline
            rows={3}
            size="small"
            placeholder="e.g. Inbound blunt thoracic trauma from highway collision. Patient hypotensive (BP 86/54). Rapid infuser and OR 3 on standby."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setDoctorModalOpen(false)} sx={{ color: '#8b949e' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={doctorSubmitting || !selectedDoctor}
            onClick={handleConfirmDoctorAlert}
            startIcon={<AssignmentIndIcon />}
            sx={{
              backgroundColor: '#8957e5',
              color: '#fff',
              fontWeight: 800,
              '&:hover': { backgroundColor: '#a371f7' }
            }}
          >
            {doctorSubmitting ? 'Assigning...' : 'Confirm Assignment & Alert Doctor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hero Visual Imagery Lightbox Modal */}
      <Dialog
        open={Boolean(heroLightboxSnap)}
        onClose={() => setHeroLightboxSnap(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhotoCameraIcon sx={{ color: heroLightboxSnap?.source === 'CITIZEN_SOS' ? '#f85149' : '#58a6ff' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
              {heroLightboxSnap?.label || (heroLightboxSnap?.source === 'CITIZEN_SOS' ? 'Citizen SOS Incident Photo' : 'Cabin Trauma Snapshot')}
            </Typography>
            <Chip
              label={heroLightboxSnap?.source === 'CITIZEN_SOS' ? 'CITIZEN SOS' : heroLightboxSnap?.source === 'PARAMEDIC_SCENE' ? 'PARAMEDIC ON-SCENE' : 'AMBULANCE CABIN'}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 800,
                backgroundColor: heroLightboxSnap?.source === 'CITIZEN_SOS' ? '#da3633' : heroLightboxSnap?.source === 'PARAMEDIC_SCENE' ? '#d29922' : '#238636',
                color: '#ffffff'
              }}
            />
          </Box>
          <IconButton onClick={() => setHeroLightboxSnap(null)} sx={{ color: '#8b949e' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, textAlign: 'center', backgroundColor: '#090d13' }}>
          {heroLightboxSnap && (
            <img
              src={heroLightboxSnap.highResSnap || heroLightboxSnap.dataUrl}
              alt={heroLightboxSnap.label || 'Incident High-Res Photo'}
              style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, objectFit: 'contain' }}
            />
          )}
          {heroLightboxSnap?.timestamp && (
            <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 1 }}>
              Transmitted at: {new Date(heroLightboxSnap.timestamp).toLocaleString()}
            </Typography>
          )}
          {heroLightboxSnap?.aiFinding && (
            <Box sx={{ mt: 1.5, p: 1.5, textAlign: 'left', backgroundColor: 'rgba(210, 153, 34, 0.15)', border: '1px solid #d29922', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#ffd33d', fontWeight: 800, display: 'block' }}>
                🤖 CLINICAL VISION AI FINDING & INJURY ASSESSMENT:
              </Typography>
              <Typography variant="body2" sx={{ color: '#ff7b72', fontWeight: 700, mt: 0.5 }}>
                {heroLightboxSnap.aiFinding}
              </Typography>
              {heroLightboxSnap.injuryRegion && (
                <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', mt: 0.5 }}>
                  Identified Region: <strong>{heroLightboxSnap.injuryRegion}</strong>
                  {heroLightboxSnap.bleedingDesc && ` • ${heroLightboxSnap.bleedingDesc}`}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setHeroLightboxSnap(null)} sx={{ color: '#c9d1d9' }}>
            Close Preview
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
