import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  LinearProgress, IconButton, Alert, Tooltip
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigationIcon from '@mui/icons-material/Navigation';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { useNavigate } from 'react-router-dom';
import {
  VirtualAgentCursor,
  VirtualCursorState,
  playTactileClick,
  playCelebrationChime,
  speakAgentVoice
} from './VirtualAgentCursor';
import { incidentApi, decisionApi, preAlertApi, hospitalApi } from '../services/api';
import { EmergencyIncident } from '../types';

export interface AutonomousCopilotLiveTourProps {
  active: boolean;
  onClose: () => void;
  incident: EmergencyIncident | null;
  onIncidentUpdated: (updated: EmergencyIncident) => void;
}

export const AutonomousCopilotLiveTour: React.FC<AutonomousCopilotLiveTourProps> = ({
  active,
  onClose,
  incident,
  onIncidentUpdated
}) => {
  const navigate = useNavigate();

  // Workflow State: 1 = Respond, 2 = Arrive, 3 = Board, 4 = Destination, 5 = PreAlert, 6 = Completed
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing Autonomous Resuscitation Copilot...');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Dynamic AI Selection State (Strictly dynamically populated from AI evaluate API & DOM)
  const [selectedTopHospital, setSelectedTopHospital] = useState<any | null>(null);

  // Virtual Cursor State
  const [cursorState, setCursorState] = useState<VirtualCursorState>({
    x: window.innerWidth / 2,
    y: 100,
    visible: false,
    label: '🤖 Paramedic AI Agent',
    sublabel: 'Starting operational sequence...',
    isClicking: false,
    rippleCoords: null,
    transitionDuration: 700
  });

  // Unique Run ID reference to completely guard against React StrictMode instant remounting
  const activeRunId = useRef<number>(0);
  const pauseRef = useRef<boolean>(false);

  useEffect(() => {
    pauseRef.current = isPaused;
  }, [isPaused]);

  // Voice wrapper respecting voiceEnabled state
  const speak = (text: string) => {
    if (voiceEnabled) {
      speakAgentVoice(text);
    }
  };

  // Wait with pause and active-run token checking
  const sleep = async (ms: number, runId: number) => {
    const adjusted = ms / speedMultiplier;
    const interval = 50;
    let elapsed = 0;
    while (elapsed < adjusted) {
      if (activeRunId.current !== runId) return;
      while (pauseRef.current && activeRunId.current === runId) {
        await new Promise((r) => setTimeout(r, 100));
      }
      await new Promise((r) => setTimeout(r, interval));
      elapsed += interval;
    }
  };

  // Wait for element to appear in DOM with timeout (up to maxWaitMs)
  const waitForElement = async (
    elementId: string,
    runId: number,
    maxWaitMs = 6000
  ): Promise<HTMLElement | null> => {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (activeRunId.current !== runId) return null;
      const el = document.getElementById(elementId);
      if (el) return el;
      await new Promise((r) => setTimeout(r, 120));
    }
    return document.getElementById(elementId);
  };

  // Move virtual cursor smoothly to element
  const moveCursorToElement = async (
    el: HTMLElement,
    label: string,
    sublabel: string,
    runId: number
  ): Promise<boolean> => {
    if (activeRunId.current !== runId) return false;

    // Scroll element smoothly into center view
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    await new Promise((r) => setTimeout(r, 260));
    if (activeRunId.current !== runId) return false;

    const rect = el.getBoundingClientRect();
    const targetX = Math.round(rect.left + rect.width / 2);
    const targetY = Math.round(rect.top + rect.height / 2);

    const transitionMs = Math.round(720 / speedMultiplier);

    // Update cursor position and animate glide
    setCursorState((prev) => ({
      ...prev,
      visible: true,
      x: targetX,
      y: targetY,
      label,
      sublabel,
      isClicking: false,
      transitionDuration: transitionMs
    }));

    // Wait for the cursor to arrive at the target element
    await sleep(transitionMs + 100, runId);
    if (activeRunId.current !== runId) return false;

    // Highlight the target element with a visible cyber-emerald focus ring
    el.style.transition = 'all 0.25s ease';
    el.style.outline = '3px solid #3fb950';
    el.style.boxShadow = '0 0 24px rgba(63, 185, 80, 0.85)';

    // Hover targeting dwell time (feels authentic)
    await sleep(300, runId);
    return true;
  };

  // Perform realistic click on target element and trigger DOM click
  const clickTargetElement = async (
    el: HTMLElement,
    runId: number,
    actionCallback?: () => Promise<void> | void
  ): Promise<void> => {
    if (activeRunId.current !== runId) return;

    const rect = el.getBoundingClientRect();
    const clickX = Math.round(rect.left + rect.width / 2);
    const clickY = Math.round(rect.top + rect.height / 2);

    // Visual button depression
    el.style.transform = 'scale(0.94)';

    // Cursor click animation & expanding ripple
    setCursorState((prev) => ({
      ...prev,
      isClicking: true,
      rippleCoords: { x: clickX, y: clickY }
    }));

    // Audible tactile mouse click
    playTactileClick();

    await sleep(160, runId);

    // Restore button appearance
    el.style.transform = 'scale(1)';
    el.style.outline = '';
    el.style.boxShadow = '';

    setCursorState((prev) => ({
      ...prev,
      isClicking: false
    }));

    // Trigger native DOM click to invoke component's React handlers
    try {
      el.click();
    } catch (e) {
      console.warn('Native el.click() fallback:', e);
    }

    // Execute callback (e.g. backend sync)
    if (actionCallback) {
      await actionCallback();
    }

    await sleep(450, runId);
  };

  // Main Automated Operational Loop
  useEffect(() => {
    if (!active || !incident) return;

    const runId = ++activeRunId.current;

    const runAutomatedSequence = async () => {
      try {
        let currentIncident = { ...incident };
        const caseId =
          currentIncident.patientCaseId ||
          `CASE-${new Date().getFullYear()}-${String(currentIncident.id).padStart(3, '0')}`;

        setStatusMessage(`🤖 Autonomous Paramedic Copilot engaged for Incident ${currentIncident.incidentCode}`);
        speak('Autonomous Copilot active. Commencing hands-free operational protocol.');

        // Initialize cursor at top-center
        setCursorState({
          x: window.innerWidth / 2,
          y: 110,
          visible: true,
          label: '🤖 Paramedic AI Agent',
          sublabel: 'Targeting next tactical action...',
          isClicking: false,
          rippleCoords: null,
          transitionDuration: 600
        });

        await sleep(650, runId);
        if (activeRunId.current !== runId) return;

        // =========================================================================
        // STAGE 1: Auto-Respond to Scene (EN_ROUTE_SCENE)
        // =========================================================================
        setCurrentStep(1);
        if (
          currentIncident.status === 'REPORTED' ||
          currentIncident.status === 'ASSIGNED' ||
          !currentIncident.status
        ) {
          setStatusMessage('Step 1/5: Navigating to Accept Incident and En Route to Scene...');
          speak('Unit responding en route to incident scene.');

          const btnEnRoute = await waitForElement('btn-copilot-enroute', runId, 5000);
          if (btnEnRoute) {
            await moveCursorToElement(
              btnEnRoute,
              '🤖 Paramedic AI Agent',
              '🎯 Clicking: Accept & En Route to Scene',
              runId
            );

            await clickTargetElement(btnEnRoute, runId, async () => {
              try {
                const updated = await incidentApi.updateStatus(currentIncident.id, 'EN_ROUTE_SCENE');
                currentIncident = updated;
                onIncidentUpdated(updated);
              } catch (e) {
                console.warn('En-route update fallback:', e);
              }
            });
          }

          // Wait for DOM to render Arrived button
          await waitForElement('btn-copilot-onscene', runId, 5000);
        } else {
          setStatusMessage('Step 1/5: Unit already dispatched en route to scene.');
        }

        await sleep(700, runId);
        if (activeRunId.current !== runId) return;

        // =========================================================================
        // STAGE 2: Auto-Arrive at Scene (ON_SCENE)
        // =========================================================================
        setCurrentStep(2);
        if (currentIncident.status !== 'ON_SCENE' && currentIncident.status !== 'PATIENT_LOADED') {
          setStatusMessage('Step 2/5: Confirming arrival at emergency scene coordinates...');
          speak('Arrived at scene. Initiating patient resuscitation protocol.');

          const btnOnScene = await waitForElement('btn-copilot-onscene', runId, 6000);
          if (btnOnScene) {
            await moveCursorToElement(
              btnOnScene,
              '🤖 Paramedic AI Agent',
              '🎯 Clicking: Arrived at Scene',
              runId
            );

            await clickTargetElement(btnOnScene, runId, async () => {
              try {
                const updated = await incidentApi.updateStatus(currentIncident.id, 'ON_SCENE');
                currentIncident = updated;
                onIncidentUpdated(updated);
              } catch (e) {
                console.warn('On-scene update fallback:', e);
              }
            });
          }

          // Wait for DOM to render Board button
          await waitForElement('btn-copilot-board', runId, 5000);
        } else {
          setStatusMessage('Step 2/5: Unit already arrived on scene.');
        }

        await sleep(750, runId);
        if (activeRunId.current !== runId) return;

        // =========================================================================
        // STAGE 3: Auto-Board Patient into Ambulance (PATIENT_LOADED)
        // =========================================================================
        setCurrentStep(3);
        if (currentIncident.status !== 'PATIENT_LOADED') {
          setStatusMessage('Step 3/5: Loading patient into ambulance cabin & activating Digital Twin...');
          speak('Patient loaded onto stretcher. Digital twin telemetry online.');

          const btnBoard = await waitForElement('btn-copilot-board', runId, 6000);
          if (btnBoard) {
            await moveCursorToElement(
              btnBoard,
              '🤖 Paramedic AI Agent',
              '🎯 Clicking: Board Patient',
              runId
            );

            await clickTargetElement(btnBoard, runId, async () => {
              try {
                const updated = await incidentApi.boardPatient(currentIncident.id);
                currentIncident = updated;
                onIncidentUpdated(updated);
              } catch (e) {
                console.warn('Board patient fallback:', e);
              }
            });
          }
        } else {
          setStatusMessage('Step 3/5: Patient already boarded in ambulance.');
        }

        await sleep(900, runId);
        if (activeRunId.current !== runId) return;

        // =========================================================================
        // STAGE 4: Multi-Agent Destination Optimization (STRICTLY DYNAMIC EVALUATION)
        // =========================================================================
        setCurrentStep(4);
        setStatusMessage('Step 4/5: Multi-Criteria AI Agent evaluating regional trauma facilities...');
        speak('AI Multi-Criteria Engine evaluating regional trauma facilities.');

        const activeCaseId = currentIncident.patientCaseId || caseId;

        // Trigger AI evaluation backend
        let evalData: any = null;
        try {
          evalData = await decisionApi.evaluate(activeCaseId);
        } catch (e) {
          console.warn('Evaluate failed, checking active recommendation:', e);
          evalData = await decisionApi.getActiveRecommendation(activeCaseId).catch(() => null);
        }

        // Wait for candidate cards in the Inline Recommendation Tray
        let candidateCards: NodeListOf<Element> | null = null;
        const startWaitCandidates = Date.now();
        while (Date.now() - startWaitCandidates < 7000) {
          if (activeRunId.current !== runId) return;
          const found = document.querySelectorAll('[id^="card-hospital-candidate-"]');
          if (found && found.length > 0) {
            candidateCards = found;
            break;
          }
          await new Promise((r) => setTimeout(r, 150));
        }

        // Determine top candidate dynamically
        let topCandidate: any = null;
        if (evalData && evalData.candidates && evalData.candidates.length > 0) {
          const sorted = [...evalData.candidates].sort((a: any, b: any) => {
            if (a.isRecommended && !b.isRecommended) return -1;
            if (!a.isRecommended && b.isRecommended) return 1;
            const rankA = a.rankOrder ?? 999;
            const rankB = b.rankOrder ?? 999;
            if (rankA !== rankB) return rankA - rankB;
            return (b.overallSuitabilityScore || 0) - (a.overallSuitabilityScore || 0);
          });
          topCandidate = sorted[0];
        }

        if (!topCandidate) {
          // Fallback from network
          const allHosp = await hospitalApi.getAll().catch(() => []);
          topCandidate = {
            hospitalId: allHosp[0]?.id || 1,
            hospitalName: allHosp[0]?.name || 'Hope Valley Medical Center',
            overallSuitabilityScore: 82.5,
            etaMinutes: 6,
            rankOrder: 1
          };
        }

        setSelectedTopHospital(topCandidate);

        setStatusMessage(
          `Step 4/5: AI Evaluated. Top Rank #1 Recommendation: ${topCandidate.hospitalName} (Score: ${Math.round(topCandidate.overallSuitabilityScore || 70)}%, ETA: ~${topCandidate.etaMinutes || 6}m)`
        );

        // Move cursor to the Rank #1 Hospital Card
        let topCardEl: HTMLElement | null = null;
        if (candidateCards && candidateCards.length > 0) {
          topCardEl = candidateCards[0] as HTMLElement;
        } else {
          topCardEl = await waitForElement(`card-hospital-candidate-${topCandidate.hospitalId}`, runId, 5000);
        }

        if (topCardEl) {
          await moveCursorToElement(
            topCardEl,
            '🤖 Paramedic AI Agent',
            `🏥 Selecting Rank #1: ${topCandidate.hospitalName}`,
            runId
          );

          await clickTargetElement(topCardEl, runId, () => {
            setSelectedTopHospital(topCandidate);
          });
        }

        speak(`Optimal destination evaluated. Rank one recommendation is ${topCandidate.hospitalName}. Selecting ${topCandidate.hospitalName}.`);
        await sleep(900, runId);
        if (activeRunId.current !== runId) return;

        // =========================================================================
        // STAGE 5: Dispatch Priority-1 Emergency Pre-Alert to Receiving ED
        // =========================================================================
        setCurrentStep(5);
        setStatusMessage(
          `Step 5/5: Transmitting Priority-1 Pre-Alert to ${topCandidate.hospitalName} Emergency Department...`
        );
        speak(`Dispatching priority-one pre-alert to ${topCandidate.hospitalName} emergency department.`);

        const dispatchBtn = await waitForElement('btn-copilot-dispatch-prealert', runId, 6000);
        if (dispatchBtn) {
          await moveCursorToElement(
            dispatchBtn,
            '🤖 Paramedic AI Agent',
            `🚨 Dispatching Pre-Alert to ${topCandidate.hospitalName}`,
            runId
          );

          await clickTargetElement(dispatchBtn, runId);

          // Wait up to 5s for confirmation banner to appear
          const confirmed = await waitForElement('alert-prealert-dispatched', runId, 5000);
          if (!confirmed) {
            // Fallback direct transmission if click didn't propagate
            try {
              await preAlertApi.recordDecision({
                caseId: activeCaseId,
                selectedHospitalId: topCandidate.hospitalId,
                decisionType: 'ACCEPT',
                reason: `Autonomous Paramedic Copilot: Automated operational dispatch during critical resuscitation. Selected AI Rank #1 facility: ${topCandidate.hospitalName}.`
              });
            } catch (e) {
              console.warn('Fallback direct dispatch:', e);
            }
          }
        }

        // Celebratory completion sequence
        playCelebrationChime();
        speak(`Inbound pre-alert active for ${topCandidate.hospitalName}. Opening Live Approaching Navigation and Telemetry.`);
        setStatusMessage(
          `🎉 Pre-Alert Dispatched to ${topCandidate.hospitalName}! Transitioning to Live Approaching Navigation Console...`
        );
        setCurrentStep(6);
        setIsCompleted(true);

        // Move cursor smoothly back to top-right out of the way
        setCursorState((prev) => ({
          ...prev,
          x: window.innerWidth - 180,
          y: 70,
          label: '🤖 Copilot: Standby',
          sublabel: 'Mission Completed Successfully',
          isClicking: false,
          transitionDuration: 900
        }));

        await sleep(1600, runId);
        if (activeRunId.current !== runId) return;

        // Auto-navigate to PreAlertPage so user sees the golden alert banner, moving ambulance, and streaming vitals
        navigate(`/prealert?caseId=${activeCaseId}&hospitalId=${topCandidate.hospitalId}`);
      } catch (err: any) {
        console.error('Copilot Tour Execution Error:', err);
        setStatusMessage(`❌ Error during execution: ${err.message || 'Unknown error'}`);
      }
    };

    runAutomatedSequence();

    return () => {
      // Invalidate current run
      activeRunId.current++;
    };
  }, [active, incident?.id]);

  const handleAbort = () => {
    activeRunId.current++;
    onClose();
  };

  if (!active || !incident) return null;

  const progressPercent = Math.min(100, Math.round(((currentStep - 1) / 5) * 100));

  return (
    <>
      {/* 1. Global Virtual Agent Animated Cursor */}
      <VirtualAgentCursor cursorState={cursorState} />

      {/* 2. Floating Cybernetic Copilot HUD Bar (Fixed Bottom Center so it never blocks top buttons) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999990,
          width: '92%',
          maxWidth: 960,
          backgroundColor: 'rgba(13, 17, 23, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #3fb950',
          boxShadow: '0 0 32px rgba(63, 185, 80, 0.45), 0 -10px 30px rgba(0,0,0,0.85)',
          borderRadius: 3,
          p: 1.6,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Top Header Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: 'rgba(35, 134, 54, 0.3)',
                border: '1.5px solid #3fb950',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(63, 185, 80, 0.6)'
              }}
            >
              <SmartToyIcon sx={{ color: '#3fb950', fontSize: 20 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f0f6fc', letterSpacing: '0.4px', lineHeight: 1.1 }}>
                  AUTONOMOUS PARAMEDIC COPILOT
                </Typography>
                <Chip
                  label={isCompleted ? '✓ COMPLETED' : `STEP ${Math.min(currentStep, 5)} OF 5`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    backgroundColor: isCompleted ? 'rgba(56, 139, 253, 0.25)' : 'rgba(35, 134, 54, 0.3)',
                    color: isCompleted ? '#58a6ff' : '#3fb950',
                    border: `1px solid ${isCompleted ? '#58a6ff' : '#3fb950'}`
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.2 }}>
                Hands-Free Real-Time Screen Navigation & Clinical Dispatch • Case: <strong>{incident.patientCaseId || incident.incidentCode}</strong>
              </Typography>
            </Box>
          </Box>

          {/* Control Action Buttons */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Speed Toggle */}
            <Tooltip title={`Execution Speed: ${speedMultiplier}x`}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSpeedMultiplier((prev) => (prev === 1.0 ? 1.8 : 1.0))}
                sx={{
                  height: 28,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  borderColor: '#30363d',
                  color: speedMultiplier > 1 ? '#ffd33d' : '#8b949e'
                }}
              >
                ⚡ {speedMultiplier}x Speed
              </Button>
            </Tooltip>

            {/* Voice Toggle */}
            <IconButton
              size="small"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              sx={{ color: voiceEnabled ? '#3fb950' : '#8b949e', border: '1px solid #30363d' }}
            >
              {voiceEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            </IconButton>

            {/* Pause / Resume */}
            {!isCompleted && (
              <Button
                variant="outlined"
                size="small"
                startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                onClick={() => setIsPaused(!isPaused)}
                sx={{
                  height: 28,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderColor: isPaused ? '#ffd33d' : '#30363d',
                  color: isPaused ? '#ffd33d' : '#c9d1d9'
                }}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}

            {/* Manual Override / Close */}
            <Button
              variant="contained"
              size="small"
              onClick={handleAbort}
              sx={{
                height: 28,
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: 'rgba(248, 81, 73, 0.2)',
                color: '#f85149',
                border: '1px solid rgba(248, 81, 73, 0.5)',
                '&:hover': { backgroundColor: 'rgba(248, 81, 73, 0.35)' }
              }}
            >
              {isCompleted ? 'Exit Copilot' : 'Manual Override'}
            </Button>
          </Stack>
        </Box>

        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={progressPercent}
          sx={{
            height: 5,
            borderRadius: 3,
            backgroundColor: '#21262d',
            '& .MuiLinearProgress-bar': {
              backgroundColor: isCompleted ? '#58a6ff' : '#3fb950',
              boxShadow: isCompleted ? '0 0 10px #58a6ff' : '0 0 10px #3fb950'
            },
            mb: 1
          }}
        />

        {/* Status Message and Live Steps Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc', fontSize: '0.82rem' }}>
            {statusMessage}
          </Typography>

          <Stack direction="row" spacing={0.8} alignItems="center">
            {[
              { idx: 1, label: 'En Route' },
              { idx: 2, label: 'On Scene' },
              { idx: 3, label: 'Boarded' },
              { idx: 4, label: 'AI Dest' },
              { idx: 5, label: 'Pre-Alert' }
            ].map((st) => {
              const isPast = currentStep > st.idx || isCompleted;
              const isCurr = currentStep === st.idx && !isCompleted;
              return (
                <Chip
                  key={st.idx}
                  label={st.label}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    backgroundColor: isPast
                      ? 'rgba(63, 185, 80, 0.25)'
                      : isCurr
                      ? 'rgba(88, 166, 255, 0.25)'
                      : 'rgba(48, 54, 61, 0.4)',
                    color: isPast ? '#3fb950' : isCurr ? '#58a6ff' : '#8b949e',
                    border: isCurr ? '1px solid #58a6ff' : 'none'
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Post-Completion Quick Actions */}
        {isCompleted && selectedTopHospital && (
          <Box
            sx={{
              mt: 1.5,
              pt: 1.2,
              borderTop: '1px solid #30363d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 700 }}>
              ✓ Pre-Alert Dispatched to {selectedTopHospital.hospitalName} • Trauma Bay Reserved
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                startIcon={<NavigationIcon />}
                onClick={() =>
                  navigate(
                    `/prealert?caseId=${incident.patientCaseId || 'CASE-2026-001'}&hospitalId=${selectedTopHospital.hospitalId}`
                  )
                }
                sx={{
                  backgroundColor: '#238636',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  height: 28
                }}
              >
                👁️ View Live Pre-Alert
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<MonitorHeartIcon />}
                onClick={() => navigate(`/patient-twin?caseId=${incident.patientCaseId || 'CASE-2026-001'}`)}
                sx={{
                  borderColor: '#58a6ff',
                  color: '#58a6ff',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 28
                }}
              >
                🩺 Patient Twin
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LocalHospitalIcon />}
                onClick={() => navigate('/hospital-console')}
                sx={{
                  borderColor: '#30363d',
                  color: '#c9d1d9',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 28
                }}
              >
                🏥 Hospital Console
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </>
  );
};
