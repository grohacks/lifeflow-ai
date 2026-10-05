import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, ButtonGroup, Chip, Alert,
  Divider, TextField, MenuItem
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SpeedIcon from '@mui/icons-material/Speed';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import TrafficIcon from '@mui/icons-material/Traffic';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import { simulationApi } from '../services/api';
import { wsService } from '../services/websocket';

export const SimulationControlPage: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [speed, setSpeed] = useState(1.0);
  const [networkConnected, setNetworkConnected] = useState(true);
  const [eventLog, setEventLog] = useState<string[]>([]);

  useEffect(() => {
    loadStatus();

    const unsub = wsService.subscribe('/topic/simulation', (data) => {
      setStatus(data);
    });

    return () => unsub();
  }, []);

  const loadStatus = () => {
    simulationApi.getStatus().then(setStatus).catch(() => {});
  };

  const logEvent = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setEventLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const handleStart = async () => {
    try {
      await simulationApi.start();
      logEvent('Golden Hour Dynamic Destination Scenario Launched');
      loadStatus();
    } catch (e: any) {
      logEvent('Error starting: ' + e.message);
    }
  };

  const handlePause = async () => {
    await simulationApi.pause();
    logEvent('Simulation Paused');
    loadStatus();
  };

  const handleResume = async () => {
    await simulationApi.resume();
    logEvent('Simulation Resumed');
    loadStatus();
  };

  const handleReset = async () => {
    await simulationApi.reset();
    logEvent('Simulation Reset to Base State');
    loadStatus();
  };

  const handleSpeedChange = async (s: number) => {
    setSpeed(s);
    await simulationApi.setSpeed(s);
    logEvent(`Simulation speed set to ${s}x`);
  };

  const handleTriggerDeterioration = async () => {
    try {
      await simulationApi.triggerDeterioration();
      logEvent('TRIGGERED: Acute Patient Deterioration (SpO2: 95% -> 88%, HR: 110 -> 131 bpm)');
    } catch (e: any) {
      logEvent('Error: ' + e.message);
    }
  };

  const handleTriggerTraffic = async (mult = 1.8) => {
    try {
      await simulationApi.triggerTraffic(mult);
      logEvent(`TRIGGERED: Traffic Congestion Surge (Multiplier: ${mult}x)`);
    } catch (e: any) {
      logEvent('Error: ' + e.message);
    }
  };

  const handleTriggerHospitalICU = async () => {
    try {
      await simulationApi.triggerHospitalResource('HOSP-002', 'ICU_BEDS', 0);
      logEvent('TRIGGERED: Metro General Hospital ICU beds dropped from 2 to 0');
    } catch (e: any) {
      logEvent('Error: ' + e.message);
    }
  };

  const handleToggleNetwork = (connected: boolean) => {
    setNetworkConnected(connected);
    logEvent(connected ? 'NETWORK RESTORED: Triggering Edge Offline Buffer Sync' : 'NETWORK CUT: Edge Gateway in Offline Buffering Mode');
  };

  const user = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
  const roles: string[] = user.roles || ['ROLE_PARAMEDIC'];
  const canControlSimulation = roles.some((r: string) => r.includes('CONTROL') || r.includes('ADMIN'));

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
            Simulation Control Center & Scenario Injector
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b949e' }}>
            Multi-Speed Playback • Deterministic Dynamic Event Triggers • Edge Resiliency Testing
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {canControlSimulation ? (
            <Chip label="Control Room Dispatcher: Authorized" color="warning" size="small" sx={{ fontWeight: 600 }} />
          ) : (
            <Chip label="🔒 Read-Only Observer" size="small" sx={{ backgroundColor: 'rgba(210, 153, 34, 0.15)', color: '#d29922', border: '1px solid rgba(210, 153, 34, 0.4)', fontWeight: 600 }} />
          )}
          <Chip
            label={status?.running ? 'SIMULATION RUNNING' : 'SIMULATION IDLE / PAUSED'}
            color={status?.running ? 'success' : 'default'}
            sx={{ fontWeight: 700 }}
          />
        </Box>
      </Box>

      {!canControlSimulation && (
        <Alert severity="info" sx={{ mb: 3, backgroundColor: 'rgba(56, 139, 253, 0.08)', border: '1px solid rgba(56, 139, 253, 0.3)', color: '#c9d1d9' }}>
          <strong>Notice:</strong> You are logged in as a field or clinical staff member. Simulation playback controls, highway traffic multipliers, and casualty surge injections require <strong>Control Room Dispatcher</strong> or <strong>Administrator</strong> credentials. (Use the role switcher in the top-right navbar to switch to Control Room to test scenario injection).
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Playback Controls */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc', mb: 2 }}>
                Scenario Execution Controls
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStart}
                  disabled={!canControlSimulation}
                  sx={{ fontWeight: 600 }}
                >
                  Start Golden Hour
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PauseIcon />}
                  onClick={handlePause}
                  disabled={!canControlSimulation}
                  sx={{ borderColor: '#30363d', color: '#c9d1d9' }}
                >
                  Pause
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleResume}
                  disabled={!canControlSimulation}
                  sx={{ borderColor: '#30363d', color: '#c9d1d9' }}
                >
                  Resume
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RestartAltIcon />}
                  onClick={handleReset}
                  disabled={!canControlSimulation}
                >
                  Reset
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ color: '#8b949e', mb: 1, fontWeight: 600 }}>
                SIMULATION SPEED MULTIPLIER
              </Typography>
              <ButtonGroup variant="outlined" size="small" sx={{ mb: 2 }}>
                {[1.0, 2.0, 5.0, 10.0].map((s) => (
                  <Button
                    key={s}
                    variant={speed === s ? 'contained' : 'outlined'}
                    onClick={() => handleSpeedChange(s)}
                    sx={{ borderColor: '#30363d' }}
                  >
                    {s}x
                  </Button>
                ))}
              </ButtonGroup>

              <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: '#0d1117' }}>
                <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                  Scenario: <strong>{status?.scenario || 'GOLDEN_HOUR'}</strong> • Heartbeat Tick: <strong>{status?.step || 0}</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Dynamic Scenario Event Triggers */}
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc', mb: 1 }}>
                Live In-Flight Event Triggers
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 2.5 }}>
                Trigger immediate environmental changes to observe automated continuous re-evaluation
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<FlashOnIcon />}
                    onClick={handleTriggerDeterioration}
                    sx={{ py: 1.2, fontWeight: 700, justifyContent: 'flex-start' }}
                  >
                    1. Trigger Patient Deterioration (SpO2 drops to 88%, HR 131)
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    startIcon={<TrafficIcon />}
                    onClick={() => handleTriggerTraffic(1.8)}
                    sx={{ py: 1.2, fontWeight: 700, justifyContent: 'flex-start' }}
                  >
                    2. Trigger Traffic Congestion Surge (1.8x Delay Multiplier)
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="info"
                    startIcon={<LocalHospitalIcon />}
                    onClick={handleTriggerHospitalICU}
                    sx={{ py: 1.2, fontWeight: 700, justifyContent: 'flex-start' }}
                  >
                    3. Trigger Hospital Resource Loss (Metro Gen ICU 2 -&gt; 0 Beds)
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<WifiOffIcon />}
                    onClick={() => handleToggleNetwork(false)}
                    sx={{ py: 1, borderColor: '#30363d' }}
                  >
                    Disconnect Network
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    startIcon={<WifiIcon />}
                    onClick={() => handleToggleNetwork(true)}
                    sx={{ py: 1, borderColor: '#30363d' }}
                  >
                    Reconnect & Sync
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Simulation Audit / Log Feed */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc', mb: 2 }}>
                Simulation Event Telemetry Feed
              </Typography>

              <Box
                sx={{
                  backgroundColor: '#090d13',
                  p: 2,
                  borderRadius: 1.5,
                  height: 400,
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  border: '1px solid #21262d'
                }}
              >
                {eventLog.length === 0 ? (
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    Awaiting simulation actions... Start scenario or fire triggers on the left.
                  </Typography>
                ) : (
                  eventLog.map((log, idx) => (
                    <Box key={idx} sx={{ color: log.includes('TRIGGERED') ? '#f85149' : log.includes('NETWORK') ? '#d29922' : '#58a6ff', mb: 0.8 }}>
                      {log}
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
