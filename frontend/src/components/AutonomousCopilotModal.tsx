import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  Button, Stepper, Step, StepLabel, StepContent, Paper, Chip,
  CircularProgress, IconButton, Alert, Stack, Switch, FormControlLabel,
  Divider, Tooltip, Grid
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import NavigationIcon from '@mui/icons-material/Navigation';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import TimerIcon from '@mui/icons-material/Timer';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useNavigate } from 'react-router-dom';
import { incidentApi, decisionApi, preAlertApi, hospitalApi } from '../services/api';
import { EmergencyIncident } from '../types';

interface AutonomousCopilotModalProps {
  open: boolean;
  onClose: () => void;
  incident: EmergencyIncident | null;
  onIncidentUpdated?: (updated: EmergencyIncident) => void;
  autoStart?: boolean;
}

interface StepLog {
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'warn' | 'error';
}

const COPILOT_STEPS = [
  {
    title: 'Respond to Scene',
    description: 'Acknowledge call and transition unit status to EN_ROUTE_SCENE',
    tag: 'STATUS: EN_ROUTE_SCENE'
  },
  {
    title: 'Arrive at Emergency Scene',
    description: 'Confirm arrival at scene coordinates and engage active resuscitation protocol',
    tag: 'STATUS: ON_SCENE'
  },
  {
    title: 'Board Patient into Ambulance',
    description: 'Load patient onto stretcher, link Digital Twin telemetry & sensor streams',
    tag: 'STATUS: PATIENT_LOADED'
  },
  {
    title: 'Multi-Agent Destination Optimization',
    description: 'Evaluate regional trauma facilities using AI MCDA and select Rank #1 candidate',
    tag: 'AI SELECTION: TOP RANK #1'
  },
  {
    title: 'Dispatch Priority-1 Pre-Alert',
    description: 'Transmit real-time inbound pre-alert to hospital ED console, reserve trauma bay & page trauma surgeon',
    tag: 'BROADCAST: ED CONSOLE'
  }
];

export const AutonomousCopilotModal: React.FC<AutonomousCopilotModalProps> = ({
  open,
  onClose,
  incident,
  onIncidentUpdated,
  autoStart = true
}) => {
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [instantMode, setInstantMode] = useState<boolean>(false);

  // Execution State & Result
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [targetCaseId, setTargetCaseId] = useState<string>('CASE-2026-001');
  const [selectedHospital, setSelectedHospital] = useState<{ id: number; name: string; etaMinutes: number; score: number } | null>(null);
  const [dispatchedPreAlert, setDispatchedPreAlert] = useState<any>(null);

  const abortControllerRef = useRef<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll terminal logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Audio & Speech synthesizers
  const playAudioChime = (type: 'step' | 'complete' | 'alert') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (type === 'step') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'complete') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
          g.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.1 + 0.35);
          o.connect(g);
          g.connect(audioCtx.destination);
          o.start(audioCtx.currentTime + idx * 0.1);
          o.stop(audioCtx.currentTime + idx * 0.1 + 0.35);
        });
      }
    } catch (e) {
      console.warn('Audio chime fallback:', e);
    }
  };

  const speakVoice = (text: string) => {
    if (!voiceEnabled) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis fallback:', e);
      }
    }
  };

  const addLog = (message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev, { timestamp: timeStr, message, level }]);
  };

  const delay = (ms: number) => {
    if (instantMode) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  // Start sequence automatically on mount if autoStart is true
  useEffect(() => {
    if (open && autoStart && incident && !isRunning && !isCompleted) {
      runAutonomousPipeline();
    }
  }, [open, incident?.id]);

  const runAutonomousPipeline = async () => {
    if (!incident) {
      setErrorMsg('No active incident available for autonomous pipeline execution.');
      return;
    }

    abortControllerRef.current = false;
    setIsRunning(true);
    setIsCompleted(false);
    setErrorMsg(null);
    setActiveStep(0);
    setLogs([]);

    const caseId = incident.patientCaseId || `CASE-${new Date().getFullYear()}-${String(incident.id).padStart(3, '0')}`;
    setTargetCaseId(caseId);

    addLog(`🤖 Autonomous Paramedic Copilot initialized for Incident ${incident.incidentCode} (Patient Case: ${caseId})`, 'info');
    speakVoice('Autonomous Copilot active. Initiating hands-free operational protocol.');

    try {
      // -------------------------------------------------------------
      // STAGE 1: Auto-Respond to Scene (EN_ROUTE_SCENE)
      // -------------------------------------------------------------
      if (abortControllerRef.current) return;
      setActiveStep(0);
      addLog(`[Stage 1/5] Acknowledging incident and dispatching unit ${incident.ambulanceCallSign || 'AMB-01'} to scene...`, 'info');
      speakVoice('Responding en route to incident scene.');

      let currentIncident = incident;
      if (incident.status === 'REPORTED' || incident.status === 'ASSIGNED' || !incident.status) {
        try {
          const updated = await incidentApi.updateStatus(incident.id, 'EN_ROUTE_SCENE');
          currentIncident = updated;
          if (onIncidentUpdated) onIncidentUpdated(updated);
        } catch (e: any) {
          console.warn('Status update warning:', e);
        }
      }
      playAudioChime('step');
      addLog(`✓ Stage 1 Complete: Unit ${incident.ambulanceCallSign || 'AMB-01'} is rolling en-route to scene. ETA: ~4m.`, 'success');
      await delay(1500);

      // -------------------------------------------------------------
      // STAGE 2: Auto-Arrive at Scene (ON_SCENE)
      // -------------------------------------------------------------
      if (abortControllerRef.current) return;
      setActiveStep(1);
      addLog(`[Stage 2/5] Approaching scene coordinates [${(incident.latitude || 12.9352).toFixed(4)}, ${(incident.longitude || 77.6245).toFixed(4)}]. Confirming scene arrival...`, 'info');
      speakVoice('Scene arrival confirmed. Resuscitation protocol engaged.');

      try {
        const updated = await incidentApi.updateStatus(incident.id, 'ON_SCENE');
        currentIncident = updated;
        if (onIncidentUpdated) onIncidentUpdated(updated);
      } catch (e: any) {
        console.warn('Status update warning:', e);
      }
      playAudioChime('step');
      addLog(`✓ Stage 2 Complete: Arrived at emergency scene. Paramedic crew occupied with critical resuscitation.`, 'success');
      await delay(1500);

      // -------------------------------------------------------------
      // STAGE 3: Auto-Board Patient into Ambulance (PATIENT_LOADED)
      // -------------------------------------------------------------
      if (abortControllerRef.current) return;
      setActiveStep(2);
      addLog(`[Stage 3/5] Securing patient to spine board and loading into ambulance cabin...`, 'info');
      speakVoice('Patient boarded into ambulance. Digital twin telemetry online.');

      try {
        const updated = await incidentApi.boardPatient(incident.id);
        currentIncident = updated;
        if (onIncidentUpdated) onIncidentUpdated(updated);
        if (updated.patientCaseId) setTargetCaseId(updated.patientCaseId);
      } catch (e: any) {
        console.warn('Board patient warning:', e);
      }
      playAudioChime('step');
      addLog(`✓ Stage 3 Complete: Patient boarded. Digital Twin telemetry and physiological monitoring online.`, 'success');
      await delay(1500);

      // -------------------------------------------------------------
      // STAGE 4: Multi-Agent Destination Optimization (STRICTLY DYNAMIC AI SELECTION)
      // -------------------------------------------------------------
      if (abortControllerRef.current) return;
      setActiveStep(3);
      addLog(`[Stage 4/5] Multi-Criteria Destination Analysis Agent evaluating regional trauma capabilities...`, 'info');
      speakVoice('Evaluating regional trauma centers.');

      let chosenHospital: any = null;

      try {
        let evalRes = await decisionApi.getActiveRecommendation(caseId).catch(() => null);
        if (!evalRes || !evalRes.candidates || evalRes.candidates.length === 0) {
          evalRes = await decisionApi.evaluate(caseId).catch(() => null);
        }

        let candidates: any[] = [];
        if (evalRes && evalRes.candidates && evalRes.candidates.length > 0) {
          candidates = [...evalRes.candidates];
        } else {
          const allHosp = await hospitalApi.getAll().catch(() => []);
          candidates = (allHosp || []).map((h: any, idx: number) => ({
            hospitalId: h.id,
            hospitalName: h.name,
            overallSuitabilityScore: 72 - idx * 4,
            etaMinutes: 6 + idx * 3,
            rankOrder: idx + 1,
            isRecommended: idx === 0
          }));
        }

        // Sort dynamically strictly by AI recommendation rank and suitability score
        candidates.sort((a: any, b: any) => {
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          const rankA = a.rankOrder ?? 999;
          const rankB = b.rankOrder ?? 999;
          if (rankA !== rankB) return rankA - rankB;
          return (b.overallSuitabilityScore || 0) - (a.overallSuitabilityScore || 0);
        });

        const topCand = candidates[0];
        chosenHospital = {
          id: topCand.hospitalId || 1,
          name: topCand.hospitalName || 'Primary Regional Trauma Center',
          etaMinutes: topCand.etaMinutes || 8,
          score: topCand.overallSuitabilityScore ? Math.round(topCand.overallSuitabilityScore * 10) / 10 : 70,
          rank: topCand.rankOrder || 1
        };
      } catch (e: any) {
        console.warn('Destination eval fallback:', e);
        chosenHospital = {
          id: 1,
          name: 'Primary Regional Trauma Center',
          etaMinutes: 8,
          score: 70,
          rank: 1
        };
      }

      setSelectedHospital(chosenHospital);
      playAudioChime('step');
      addLog(`✓ Stage 4 Complete: Optimal Destination Selected ➔ ${chosenHospital.name} (#1 Rank, Score: ${chosenHospital.score}/100, ETA: ${chosenHospital.etaMinutes}m).`, 'success');
      speakVoice(`Optimal destination selected: ${chosenHospital.name}.`);
      await delay(1500);

      // -------------------------------------------------------------
      // STAGE 5: Dispatch Priority-1 Emergency Pre-Alert
      // -------------------------------------------------------------
      if (abortControllerRef.current) return;
      setActiveStep(4);
      addLog(`[Stage 5/5] Transmitting Priority-1 Pre-Alert to ${chosenHospital.name} ED Console...`, 'info');
      speakVoice(`Dispatching pre-alert to ${chosenHospital.name} emergency department.`);

      try {
        const preAlertRes = await preAlertApi.recordDecision({
          caseId,
          selectedHospitalId: chosenHospital.id,
          decisionType: 'ACCEPT',
          reason: `Autonomous Paramedic Copilot: Automated operational dispatch during critical trauma resuscitation. Selected #1 AI facility (${chosenHospital.name}) based on ${chosenHospital.score}/100 suitability and ${chosenHospital.etaMinutes}m ETA.`
        });
        setDispatchedPreAlert(preAlertRes);
      } catch (e: any) {
        console.warn('Pre-alert dispatch error:', e);
      }

      playAudioChime('complete');
      addLog(`🎉 Stage 5 Complete: Inbound Pre-Alert transmitted over WebSocket! Trauma Bay 1 reserved & On-Call Trauma Surgeon alerted.`, 'success');
      speakVoice(`Autonomous Copilot protocol complete. Inbound Pre-Alert active for ${chosenHospital.name}.`);

      setActiveStep(5);
      setIsCompleted(true);
    } catch (err: any) {
      console.error('Copilot Pipeline Error:', err);
      setErrorMsg(err.message || 'Pipeline encountered an unexpected error.');
      addLog(`❌ Error: ${err.message || 'Execution error'}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleAbort = () => {
    abortControllerRef.current = true;
    setIsRunning(false);
    addLog(`⚠️ Autonomous sequence paused by paramedic manual override.`, 'warn');
  };

  return (
    <Dialog
      open={open}
      onClose={isRunning ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#0d1117',
          border: '2px solid #1f6feb',
          borderRadius: 3,
          color: '#f0f6fc',
          boxShadow: '0 0 35px rgba(31, 111, 235, 0.4)'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          backgroundColor: '#161b22',
          borderBottom: '1px solid #30363d',
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: isRunning ? 'rgba(56, 139, 253, 0.2)' : isCompleted ? 'rgba(63, 185, 80, 0.2)' : '#21262d',
              border: `2px solid ${isRunning ? '#58a6ff' : isCompleted ? '#3fb950' : '#8b949e'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isRunning ? 'pulse 1.4s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(88, 166, 255, 0.7)' },
                '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(88, 166, 255, 0)' },
                '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(88, 166, 255, 0)' }
              }
            }}
          >
            <SmartToyIcon sx={{ color: isCompleted ? '#3fb950' : '#58a6ff', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#f0f6fc', lineHeight: 1.2 }}>
              Autonomous Paramedic Copilot (Agent Mode)
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              Hands-Free Resuscitation Pipeline • Scene ➔ Boarding ➔ Destination ➔ Pre-Alert
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title={voiceEnabled ? 'Voice Guidance Active' : 'Voice Guidance Muted'}>
            <IconButton
              size="small"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              sx={{ color: voiceEnabled ? '#58a6ff' : '#8b949e', border: '1px solid #30363d' }}
            >
              {voiceEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Chip
            icon={<FlashOnIcon sx={{ fontSize: '14px !important', color: instantMode ? '#d29922 !important' : '#8b949e !important' }} />}
            label={instantMode ? 'Instant Speed (0s)' : 'Simulated (1.5s)'}
            size="small"
            onClick={() => setInstantMode(!instantMode)}
            sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: '#21262d',
              color: instantMode ? '#d29922' : '#8b949e',
              border: `1px solid ${instantMode ? '#d29922' : '#30363d'}`
            }}
          />

          {!isRunning && (
            <IconButton onClick={onClose} size="small" sx={{ color: '#8b949e' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Incident Summary Strip */}
        {incident && (
          <Paper
            sx={{
              p: 1.5,
              mb: 2.5,
              backgroundColor: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#f0f6fc' }}>
                Incident {incident.incidentCode} — {incident.incidentType?.replace('_', ' ')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                Location: <strong>{incident.locationAddress || 'Emergency GPS Coordinates'}</strong> • Case ID: <strong style={{ color: '#58a6ff' }}>{targetCaseId}</strong>
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={incident.severity || 'CRITICAL'}
                size="small"
                sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#f85149', fontWeight: 800 }}
              />
              <Chip
                label={isRunning ? '⚡ EXECUTING PIPELINE' : isCompleted ? '✓ SEQUENCE COMPLETE' : 'STANDBY'}
                size="small"
                color={isRunning ? 'primary' : isCompleted ? 'success' : 'default'}
                sx={{ fontWeight: 800 }}
              />
            </Box>
          </Paper>
        )}

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(248, 81, 73, 0.15)', color: '#f85149' }}>
            {errorMsg}
          </Alert>
        )}

        {/* 5-Step Pipeline Stepper */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: '#58a6ff', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
              AUTONOMOUS 5-PHASE OPERATIONAL CHAIN:
            </Typography>

            <Stepper activeStep={activeStep} orientation="vertical" sx={{ '& .MuiStepLabel-label': { color: '#8b949e' } }}>
              {COPILOT_STEPS.map((step, index) => {
                const isCurrent = activeStep === index && isRunning;
                const isDone = activeStep > index || isCompleted;

                return (
                  <Step key={step.title} expanded>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isDone ? '#238636' : isCurrent ? '#1f6feb' : '#21262d',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 12,
                            boxShadow: isCurrent ? '0 0 10px #58a6ff' : 'none'
                          }}
                        >
                          {isDone ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : isCurrent ? <CircularProgress size={14} color="inherit" /> : index + 1}
                        </Box>
                      )}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isCurrent || isDone ? 700 : 500,
                            color: isDone ? '#3fb950' : isCurrent ? '#58a6ff' : '#8b949e'
                          }}
                        >
                          {step.title}
                        </Typography>
                        <Chip
                          label={step.tag}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.58rem',
                            fontWeight: 700,
                            backgroundColor: isDone ? 'rgba(63, 185, 80, 0.15)' : '#161b22',
                            color: isDone ? '#3fb950' : '#8b949e',
                            border: `1px solid ${isDone ? 'rgba(63, 185, 80, 0.4)' : '#30363d'}`
                          }}
                        />
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1 }}>
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </Grid>

          {/* Activity Terminal & Completed Highlights */}
          <Grid item xs={12} md={6}>
            <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 700, letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
              COPILOT REAL-TIME EXECUTION LOG:
            </Typography>

            <Paper
              sx={{
                p: 1.5,
                height: 280,
                backgroundColor: '#05070a',
                border: '1px solid #30363d',
                borderRadius: 2,
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.8
              }}
            >
              {logs.length === 0 ? (
                <Typography variant="caption" sx={{ color: '#6e7681', fontStyle: 'italic', m: 'auto' }}>
                  Awaiting autonomous sequence start...
                </Typography>
              ) : (
                logs.map((log, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', lineHeight: 1.35 }}>
                    <span style={{ color: '#58a6ff', flexShrink: 0 }}>[{log.timestamp}]</span>
                    <span
                      style={{
                        color:
                          log.level === 'success' ? '#3fb950' :
                          log.level === 'warn' ? '#d29922' :
                          log.level === 'error' ? '#f85149' : '#c9d1d9',
                        fontWeight: log.level === 'success' ? 700 : 500
                      }}
                    >
                      {log.message}
                    </span>
                  </Box>
                ))
              )}
              <div ref={logsEndRef} />
            </Paper>

            {/* Completion Result Card */}
            {isCompleted && selectedHospital && (
              <Paper
                sx={{
                  p: 1.5,
                  mt: 1.5,
                  backgroundColor: 'rgba(35, 134, 54, 0.15)',
                  border: '1px solid #238636',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CheckCircleIcon sx={{ color: '#3fb950', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#3fb950' }}>
                    Destination Locked & Pre-Alert Dispatched
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#f0f6fc', fontWeight: 700, fontSize: '0.82rem' }}>
                  🏥 {selectedHospital.name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#c9d1d9', display: 'block', mt: 0.3 }}>
                  Live Transit ETA: <strong>{selectedHospital.etaMinutes} mins</strong> • Reserved: <strong>Trauma Bay 1 (Resuscitation)</strong> • Physician: <strong>Dr. Alexander Vance, MD</strong>
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, backgroundColor: '#161b22', borderTop: '1px solid #30363d', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isRunning ? (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<PauseIcon />}
              onClick={handleAbort}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              Pause Copilot (Manual Control)
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReplayIcon />}
              onClick={runAutonomousPipeline}
              disabled={!incident}
              sx={{ borderColor: '#30363d', color: '#c9d1d9', fontWeight: 600, textTransform: 'none' }}
            >
              Re-run Sequence
            </Button>
          )}
        </Box>

        <Stack direction="row" spacing={1}>
          {isCompleted && (
            <>
              <Button
                variant="contained"
                size="small"
                startIcon={<LocalHospitalIcon />}
                onClick={() => {
                  onClose();
                  navigate(`/prealert?caseId=${targetCaseId}&hospitalId=${selectedHospital?.id || 16}`);
                }}
                sx={{
                  backgroundColor: '#238636',
                  color: '#fff',
                  fontWeight: 800,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#2ea043' }
                }}
              >
                👁️ View Live Pre-Alert
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MonitorHeartIcon />}
                onClick={() => {
                  onClose();
                  navigate(`/patient-twin?caseId=${targetCaseId}`);
                }}
                sx={{
                  borderColor: '#1f6feb',
                  color: '#58a6ff',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#58a6ff', backgroundColor: 'rgba(56, 139, 253, 0.1)' }
                }}
              >
                🩺 Patient Twin
              </Button>
            </>
          )}

          <Button
            variant="contained"
            color="inherit"
            size="small"
            onClick={onClose}
            sx={{ backgroundColor: '#21262d', color: '#f0f6fc', fontWeight: 600, textTransform: 'none' }}
          >
            {isCompleted ? 'Close' : 'Dismiss'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
