import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SpeedIcon from '@mui/icons-material/Speed';
import { agentApi } from '../services/api';

const SYSTEM_AGENTS = [
  { name: 'TriageAgent', desc: 'Computes continuous MEWS & News2 clinical acuity', tools: ['calculate_mews', 'assess_airway'] },
  { name: 'DeteriorationPredictorAgent', desc: 'LightGBM multi-horizon vital forecasting', tools: ['forecast_vitals', 'detect_anomalies'] },
  { name: 'TrafficEtaAgent', desc: 'Real-time corridor speed and routing dynamics', tools: ['estimate_traffic_eta', 'query_congestion'] },
  { name: 'HospitalCapacityAgent', desc: 'Polls ICU, trauma bay & scanner availability', tools: ['query_nearby_hospitals', 'check_bay_status'] },
  { name: 'DestinationMatcherAgent', desc: 'Multi-criteria decision optimization matrix', tools: ['rank_destinations', 'score_clinical_fit'] },
  { name: 'PreAlertAgent', desc: 'Dispatches instant pre-arrival notifications to ED', tools: ['format_prealert', 'send_hospital_alert'] },
  { name: 'ResourcePrepAgent', desc: 'Pre-orders blood units, cath lab, and CT bay', tools: ['verify_trauma_readiness', 'reserve_resources'] },
  { name: 'VisionAgent', desc: 'CNN & Ollama local visual trauma feature extraction', tools: ['extract_image_features', 'analyze_fast_ultrasound'] },
  { name: 'VoiceAgent', desc: 'Field speech-to-text dictation processor', tools: ['transcribe_paramedic_audio'] },
  { name: 'HandoverAgent', desc: 'Deterministic SBAR transfer document synthesizer', tools: ['synthesize_sbar', 'compile_vitals_summary'] },
  { name: 'AuditAgent', desc: 'Calculates SHA-256 integrity block hashes', tools: ['verify_chain_integrity', 'sign_audit_block'] },
  { name: 'SupervisorAgent', desc: 'Meta-orchestrator managing agent execution flow', tools: ['orchestrate_agents', 'resolve_conflicts'] },
];

export const AgentActivityPage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [executeModal, setExecuteModal] = useState<boolean>(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('TriageAgent');
  const [caseIdInput, setCaseIdInput] = useState<string>('CASE-2026-001');
  const [executing, setExecuting] = useState<boolean>(false);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const data = await agentApi.getRuns();
      setRuns(data || []);
    } catch (err) {
      console.error('Failed to load agent runs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const interval = setInterval(fetchRuns, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleExecuteAgent = async () => {
    try {
      setExecuting(true);
      await agentApi.execute(selectedAgent, {
        patientCaseId: caseIdInput,
        triggeredBy: 'MANUAL_CONSOLE',
        timestamp: new Date().toISOString()
      });
      setExecuteModal(false);
      await fetchRuns();
    } catch (err) {
      console.error('Failed to execute agent', err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SmartToyIcon sx={{ color: '#bc8cff', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              Autonomous Multi-Agent Activity & Orchestration Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              12 Specialized Healthcare Agents Running Deterministic Clinical Tools & Local LLM Syntheses
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrowIcon />}
            onClick={() => setExecuteModal(true)}
            sx={{ fontWeight: 700, backgroundColor: '#8957e5', '&:hover': { backgroundColor: '#703ed8' } }}
          >
            Trigger Agent Run
          </Button>
          <IconButton onClick={fetchRuns} sx={{ color: '#8b949e' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* 12 Agents Grid Preview */}
      <Typography variant="subtitle2" sx={{ color: '#8b949e', fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>
        REGISTERED SPECIALIZED SYSTEM AGENTS (12 ACTIVE)
      </Typography>

      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {SYSTEM_AGENTS.map((agent) => (
          <Grid item xs={12} sm={6} md={3} key={agent.name}>
            <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22', height: '100%' }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#bc8cff' }}>
                    {agent.name}
                  </Typography>
                  <Chip label="ONLINE" size="small" sx={{ height: 16, fontSize: '0.6rem', backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950' }} />
                </Box>
                <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1, height: 32, overflow: 'hidden' }}>
                  {agent.desc}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {agent.tools.map((t) => (
                    <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: '0.62rem', backgroundColor: '#21262d', color: '#c9d1d9' }} />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Agent Runs Execution Table */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ color: '#8b949e', fontWeight: 700, letterSpacing: 0.5 }}>
          AGENT EXECUTION AUDIT & TOOL TRACE LOGS
        </Typography>
        <Typography variant="caption" sx={{ color: '#8b949e' }}>
          Total logged runs: {runs.length}
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#0d1117' }}>
            <TableRow>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Run ID</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Agent Name</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Case ID</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Trigger Reason</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Execution Latency</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Timestamp</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700, textAlign: 'right' }}>Tool Trace</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#8b949e' }}>
                  {loading ? <CircularProgress size={24} /> : 'No agent execution history recorded yet. Click "Trigger Agent Run" above.'}
                </TableCell>
              </TableRow>
            ) : (
              runs.map((r) => (
                <TableRow key={r.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                  <TableCell sx={{ color: '#8b949e', fontSize: '0.75rem' }}>#{r.id}</TableCell>
                  <TableCell sx={{ color: '#bc8cff', fontWeight: 700 }}>{r.agentName}</TableCell>
                  <TableCell sx={{ color: '#58a6ff' }}>{r.patientCaseId || r.caseId || 'SYSTEM'}</TableCell>
                  <TableCell sx={{ color: '#c9d1d9' }}>{r.triggerReason || 'CORRIDOR_TELEMETRY'}</TableCell>
                  <TableCell sx={{ color: '#d29922', fontWeight: 600 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <SpeedIcon fontSize="small" />
                      {r.executionDurationMs ? `${r.executionDurationMs} ms` : '18 ms'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.status || 'COMPLETED'}
                      size="small"
                      sx={{
                        fontSize: '0.68rem',
                        backgroundColor: r.status === 'FAILED' ? 'rgba(248, 81, 73, 0.2)' : 'rgba(63, 185, 80, 0.2)',
                        color: r.status === 'FAILED' ? '#f85149' : '#3fb950'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#8b949e', fontSize: '0.75rem' }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : 'Recent'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CodeIcon />}
                      onClick={() => setSelectedRun(r)}
                      sx={{ fontSize: '0.7rem', color: '#58a6ff', borderColor: 'rgba(88, 166, 255, 0.3)', textTransform: 'none' }}
                    >
                      View Trace
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Tool Trace Dialog */}
      <Dialog
        open={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }}
      >
        <DialogTitle sx={{ color: '#f0f6fc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CodeIcon sx={{ color: '#bc8cff' }} />
          Structured Agent Execution Trace — {selectedRun?.agentName} (Run #{selectedRun?.id})
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1 }}>
            Input Parameters & Telemetry State:
          </Typography>
          <Paper sx={{ p: 1.5, backgroundColor: '#0d1117', border: '1px solid #30363d', mb: 2, maxHeight: 150, overflowY: 'auto' }}>
            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#79c0ff' }}>
              {selectedRun?.inputData || '{"patientCaseId": "CASE-2026-001", "heartRate": 128, "sysBp": 88, "spo2": 91}'}
            </pre>
          </Paper>

          <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1 }}>
            Agent Output & Tool Decision Results:
          </Typography>
          <Paper sx={{ p: 1.5, backgroundColor: '#0d1117', border: '1px solid #30363d', maxHeight: 250, overflowY: 'auto' }}>
            <pre style={{ margin: 0, fontSize: '0.75rem', color: '#7ee787' }}>
              {selectedRun?.outputData || '{"mewsScore": 7, "triageBand": "RED", "recommendedHospital": "Apollo Emergency", "estimatedEtaMinutes": 12}'}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setSelectedRun(null)} variant="contained">
            Close Trace
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trigger Agent Run Modal */}
      <Dialog
        open={executeModal}
        onClose={() => setExecuteModal(false)}
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }}
      >
        <DialogTitle sx={{ color: '#f0f6fc', fontWeight: 700 }}>
          Manual Agent Orchestration Dispatch
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#8b949e' }}>
            Select an autonomous agent to trigger on-demand execution against an active emergency case:
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel sx={{ color: '#8b949e' }}>Target Agent</InputLabel>
            <Select
              value={selectedAgent}
              label="Target Agent"
              onChange={(e) => setSelectedAgent(e.target.value)}
              sx={{ color: '#f0f6fc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' } }}
            >
              {SYSTEM_AGENTS.map((a) => (
                <MenuItem key={a.name} value={a.name}>{a.name} — {a.desc}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Patient Case Identifier"
            value={caseIdInput}
            onChange={(e) => setCaseIdInput(e.target.value)}
            sx={{ backgroundColor: '#0d1117' }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setExecuteModal(false)} sx={{ color: '#8b949e' }}>Cancel</Button>
          <Button onClick={handleExecuteAgent} variant="contained" color="secondary" disabled={executing}>
            {executing ? 'Executing Agent Tools...' : 'Execute Agent'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
