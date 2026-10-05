import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button, LinearProgress, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert,
  FormControl, Select, MenuItem
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import NavigationIcon from '@mui/icons-material/Navigation';
import SpeedIcon from '@mui/icons-material/Speed';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import AssignmentIcon from '@mui/icons-material/Assignment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MapIcon from '@mui/icons-material/Map';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { patientApi, hospitalApi, decisionApi, transportApi, simulationApi } from '../services/api';
import { wsService } from '../services/websocket';
import { PatientTwinState, Recommendation, Hospital, AmbulanceState } from '../types';

export const OperationsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCaseId = searchParams.get('caseId');

  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [caseId, setCaseId] = useState<string>(urlCaseId || 'CASE-2026-001');
  const [activeCase, setActiveCase] = useState<any>(null);
  const [twin, setTwin] = useState<PatientTwinState | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulanceState, setAmbulanceState] = useState<AmbulanceState | null>(null);
  const [loading, setLoading] = useState(true);

  const [userRole, setUserRole] = useState<string>(() => {
    const u = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
    return u.roles?.find((r: string) => r.startsWith('ROLE_')) || u.roles?.[0] || 'ROLE_PARAMEDIC';
  });

  useEffect(() => {
    const handleRoleSync = () => {
      const u = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
      setUserRole(u.roles?.find((r: string) => r.startsWith('ROLE_')) || u.roles?.[0] || 'ROLE_PARAMEDIC');
    };
    window.addEventListener('storage', handleRoleSync);
    return () => window.removeEventListener('storage', handleRoleSync);
  }, []);

  // Load active cases on mount
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

  // Sync if URL changes
  useEffect(() => {
    if (urlCaseId && urlCaseId !== caseId) {
      setCaseId(urlCaseId);
    }
  }, [urlCaseId]);

  useEffect(() => {
    loadData();

    // Subscribe to STOMP WebSocket topics for real-time updates for THIS specific patient case
    const unsubs = [
      wsService.subscribe(`/topic/patient-twin/${caseId}`, (data) => setTwin(data)),
      wsService.subscribe(`/topic/recommendations/${caseId}`, (data) => setRecommendation(data)),
      wsService.subscribe(`/topic/transport/1`, (data) => setAmbulanceState(data)),
      wsService.subscribe(`/topic/hospital-resources`, () => {
        hospitalApi.getAll().then((res) => setHospitals(res));
      })
    ];

    const pollInterval = setInterval(() => {
      decisionApi.getActiveRecommendation(caseId)
        .then((res) => setRecommendation(res))
        .catch(() => {});
    }, 4000);

    return () => {
      unsubs.forEach((fn) => fn());
      clearInterval(pollInterval);
    };
  }, [caseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hospRes, twinRes, recomRes, transRes, caseRes] = await Promise.allSettled([
        hospitalApi.getAll(),
        patientApi.getTwin(caseId),
        decisionApi.getActiveRecommendation(caseId),
        transportApi.getLatestState(1),
        patientApi.getCaseById(caseId)
      ]);

      if (hospRes.status === 'fulfilled') setHospitals(hospRes.value);
      if (twinRes.status === 'fulfilled') setTwin(twinRes.value);
      if (recomRes.status === 'fulfilled') setRecommendation(recomRes.value);
      if (transRes.status === 'fulfilled') setAmbulanceState(transRes.value);

      if (caseRes.status === 'fulfilled' && caseRes.value) {
        setActiveCase(caseRes.value);
      } else {
        const found = activeCases.find((c) => c.caseId === caseId);
        setActiveCase(found || {
          caseId: caseId,
          patientIdentifier: `PT-${caseId}`,
          chiefComplaint: 'Acute Trauma / Emergency Call',
          triageCategory: 'RED'
        });
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCaseChange = (newId: string) => {
    setCaseId(newId);
    setSearchParams({ caseId: newId });
  };

  const getDeteriorationBadge = () => {
    const score = twin?.trendIndicators?.deteriorationScore || 0;
    if (score >= 6) return <Chip label="CRITICAL DETERIORATION" color="error" size="small" sx={{ fontWeight: 700 }} />;
    if (score >= 3) return <Chip label="RISING RISK" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    return <Chip label="PHYSIOLOGICALLY STABLE" color="success" size="small" sx={{ fontWeight: 600 }} />;
  };

  const getRoleColor = (roleStr: string) => {
    if (roleStr.includes('PARAMEDIC')) return '#58a6ff';
    if (roleStr.includes('HOSPITAL')) return '#3fb950';
    if (roleStr.includes('CONTROL')) return '#d29922';
    if (roleStr.includes('CLINICIAN')) return '#bc8cff';
    if (roleStr.includes('ADMIN')) return '#f85149';
    return '#8b949e';
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Banner: Active Patient Selector Header */}
      <Box
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                Active Case:
              </Typography>
              {activeCases.length > 0 ? (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={caseId}
                    onChange={(e) => handleCaseChange(e.target.value)}
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
                            {c.patientName || c.patientIdentifier || 'Citizen Casualty'}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Chip label={caseId} color="primary" size="small" sx={{ fontWeight: 700 }} />
              )}
              <Chip label={activeCase?.triageCategory || 'RED'} color="error" size="small" sx={{ fontWeight: 700 }} />
              {getDeteriorationBadge()}
            </Box>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              {activeCase?.chiefComplaint || 'Blunt polytrauma, emergency priority field dispatch'} • Unit: <strong>Medic-1 (MED-UNIT-101)</strong>
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => navigate(`/destination?caseId=${caseId}`)}
            sx={{ fontWeight: 600 }}
          >
            Review Recommendation
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(`/patient-twin?caseId=${caseId}`)}
            sx={{ borderColor: '#388bfd', color: '#58a6ff', fontWeight: 600 }}
          >
            Open Patient Twin
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/simulation')}
            sx={{ borderColor: '#30363d', color: '#c9d1d9' }}
          >
            Simulation
          </Button>
        </Box>
      </Box>

      {/* Role-Specific Operational Command Banner */}
      <Box
        sx={{
          p: 1.5,
          mb: 2.5,
          backgroundColor: 'rgba(22, 27, 34, 0.75)',
          border: `1px solid ${getRoleColor(userRole)}44`,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            label={userRole.replace('ROLE_', '')}
            size="small"
            sx={{
              fontWeight: 800,
              backgroundColor: `${getRoleColor(userRole)}22`,
              color: getRoleColor(userRole),
              border: `1px solid ${getRoleColor(userRole)}66`,
              fontSize: '0.68rem'
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              {userRole.includes('PARAMEDIC') && 'Field Paramedic Dispatch & Cabin Care Suite'}
              {userRole.includes('HOSPITAL') && 'Hospital ED & Trauma Bay Receiving Console'}
              {userRole.includes('CONTROL') && 'Central Regional Dispatch & Fleet Operations'}
              {userRole.includes('CLINICIAN') && 'Trauma Specialist & Surgical Decision Oversight'}
              {userRole.includes('ADMIN') && 'System Administrator & Governance Control'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              {userRole.includes('PARAMEDIC') && 'Stream cabin vitals, capture point-of-care trauma imagery, and transmit hospital pre-alerts.'}
              {userRole.includes('HOSPITAL') && 'Monitor inbound ambulance ETA countdowns, pre-mobilize resuscitation bays, and adjust bed inventory.'}
              {userRole.includes('CONTROL') && 'Supervise corridor traffic dynamics, GIS tactical vectoring, and autonomous multi-agent fleet dispatch.'}
              {userRole.includes('CLINICIAN') && 'Review multi-horizon deterioration forecasts, CNN ultrasound feature vectors, and SBAR clinical handovers.'}
              {userRole.includes('ADMIN') && 'Full system supervisory oversight, cryptographic audit trail verification, and zero-trust credentials.'}
            </Typography>
          </Box>
        </Box>

        {/* Role-tailored Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {userRole.includes('PARAMEDIC') && (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LocalHospitalIcon />}
                onClick={() => navigate('/incident-dispatch')}
                sx={{ borderColor: '#58a6ff', color: '#58a6ff', fontSize: '0.75rem' }}
              >
                Incident Dispatch
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<MonitorHeartIcon />}
                onClick={() => navigate(`/patient-twin?caseId=${caseId}`)}
                sx={{ backgroundColor: '#238636', color: '#fff', fontSize: '0.75rem' }}
              >
                Cabin Twin & Camera
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate(`/handover?caseId=${caseId}`)}
                sx={{ borderColor: '#30363d', color: '#c9d1d9', fontSize: '0.75rem' }}
              >
                SBAR Handover
              </Button>
            </>
          )}

          {userRole.includes('HOSPITAL') && (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<NotificationsActiveIcon />}
                onClick={() => navigate(`/prealert?caseId=${caseId}`)}
                sx={{ backgroundColor: '#1f6feb', color: '#fff', fontSize: '0.75rem' }}
              >
                Inbound Bay Pre-Alert
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<StorefrontIcon />}
                onClick={() => navigate('/hospital-console')}
                sx={{ borderColor: '#3fb950', color: '#3fb950', fontSize: '0.75rem' }}
              >
                Manage ED Beds
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<MonitorHeartIcon />}
                onClick={() => navigate(`/patient-twin?caseId=${caseId}`)}
                sx={{ borderColor: '#30363d', color: '#c9d1d9', fontSize: '0.75rem' }}
              >
                Inbound Twin Telemetry
              </Button>
            </>
          )}

          {userRole.includes('CONTROL') && (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<MapIcon />}
                onClick={() => navigate('/map')}
                sx={{ backgroundColor: '#d29922', color: '#fff', fontSize: '0.75rem' }}
              >
                Tactical GIS Fleet Map
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SmartToyIcon />}
                onClick={() => navigate('/agents')}
                sx={{ borderColor: '#30363d', color: '#c9d1d9', fontSize: '0.75rem' }}
              >
                Multi-Agent Activity
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PlayCircleFilledWhiteIcon />}
                onClick={() => navigate('/simulation')}
                sx={{ borderColor: '#30363d', color: '#c9d1d9', fontSize: '0.75rem' }}
              >
                Simulation Control
              </Button>
            </>
          )}

          {userRole.includes('CLINICIAN') && (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<MonitorHeartIcon />}
                onClick={() => navigate(`/patient-twin?caseId=${caseId}`)}
                sx={{ backgroundColor: '#8957e5', color: '#fff', fontSize: '0.75rem' }}
              >
                Deterioration & Forecasting
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PsychologyIcon />}
                onClick={() => navigate('/assistant')}
                sx={{ borderColor: '#bc8cff', color: '#bc8cff', fontSize: '0.75rem' }}
              >
                Clinical AI Assistant
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate(`/handover?caseId=${caseId}`)}
                sx={{ borderColor: '#30363d', color: '#c9d1d9', fontSize: '0.75rem' }}
              >
                Clinical Handover
              </Button>
            </>
          )}

          {userRole.includes('ADMIN') && (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<HistoryEduIcon />}
                onClick={() => navigate('/audit')}
                sx={{ borderColor: '#f85149', color: '#f85149', fontSize: '0.75rem' }}
              >
                Audit Trail (SHA-256)
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ShieldIcon />}
                onClick={() => navigate('/security')}
                sx={{ borderColor: '#30363d', color: '#c9d1d9', fontSize: '0.75rem' }}
              >
                Security & RBAC
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<LocalHospitalIcon />}
                onClick={() => navigate('/incident-dispatch')}
                sx={{ backgroundColor: '#238636', color: '#fff', fontSize: '0.75rem' }}
              >
                Dispatch Suite
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        {/* Vital Signs Strip */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Heart Rate */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600 }}>
                    HEART RATE
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: (twin?.heartRate || 0) > 120 ? '#f85149' : '#58a6ff'
                      }}
                    >
                      {twin?.heartRate ? Math.round(twin.heartRate) : '--'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>bpm</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    EWMA: {twin?.trendIndicators?.heartRateEwma || '--'} bpm
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* SpO2 */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600 }}>
                    SpO2 OXYGENATION
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: (twin?.spo2 || 100) < 92 ? '#f85149' : '#3fb950'
                      }}
                    >
                      {twin?.spo2 ? Math.round(twin.spo2) : '--'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>%</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    Signal Quality: {twin?.dataQuality || 'GOOD'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Blood Pressure / MAP */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600 }}>
                    NIBP / MAP
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                      {twin?.systolicBp ? `${Math.round(twin.systolicBp)}/${Math.round(twin.diastolicBp || 0)}` : '--'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>mmHg</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    MAP: {twin?.mapValue ? Math.round(twin.mapValue) : '--'} mmHg
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Respiratory Rate */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600 }}>
                    RESPIRATION
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: (twin?.respiratoryRate || 0) > 28 ? '#f85149' : '#f0f6fc'
                      }}
                    >
                      {twin?.respiratoryRate ? Math.round(twin.respiratoryRate) : '--'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>/min</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    EtCO2: {twin?.etco2 ? Math.round(twin.etco2) : 36} mmHg
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Vehicle & GPS */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600 }}>
                    TRANSIT VELOCITY
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#3fb950' }}>
                      {ambulanceState?.speedKmh ? Math.round(ambulanceState.speedKmh) : '48'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8b949e' }}>km/h</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    GPS: {ambulanceState?.latitude?.toFixed(3) || '37.775'}, {ambulanceState?.longitude?.toFixed(3) || '-122.419'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Current Recommendation Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                  Destination Recommendation
                </Typography>
                <Chip
                  label={`v${recommendation?.versionNumber || 1} • MCDA Algorithm`}
                  size="small"
                  sx={{ backgroundColor: '#21262d', color: '#58a6ff' }}
                />
              </Box>

              {recommendation?.candidates && recommendation.candidates.length > 0 ? (
                <Box>
                  {/* Top Candidate */}
                  {(() => {
                    const top = recommendation.candidates.find((c) => c.isRecommended) || recommendation.candidates[0];
                    return (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: 'rgba(56, 139, 253, 0.1)',
                          border: '1px solid rgba(56, 139, 253, 0.4)',
                          mb: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#58a6ff' }}>
                            #1 {top.hospitalName}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#3fb950' }}>
                            {top.overallSuitabilityScore} / 100
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#8b949e', my: 1 }}>
                          ETA: <strong>{top.etaMinutes || Math.round(top.etaSeconds / 60)} minutes</strong> ({top.distanceKm} km)
                          • Status: <strong>{top.feasibility}</strong>
                        </Typography>

                        {top.evaluation?.positiveFactors && (
                          <Box sx={{ mt: 1 }}>
                            {top.evaluation.positiveFactors.slice(0, 2).map((pf, idx) => (
                              <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#3fb950' }}>
                                ✓ {pf}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })()}

                  <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1 }}>
                    Summary Rationale:
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#c9d1d9', fontStyle: 'italic', mb: 2 }}>
                    "{recommendation.summaryReason}"
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={() => navigate(`/prealert?caseId=${caseId}`)}
                    sx={{ fontWeight: 700 }}
                  >
                    Confirm Destination & Dispatch Hospital Pre-Alert
                  </Button>
                </Box>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#8b949e' }}>
                    Computing real-time destination suitability matrix...
                  </Typography>
                  <LinearProgress sx={{ mt: 2 }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Candidate Destination Comparison Table */}
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc', mb: 2 }}>
                Candidate Hospital Roster
              </Typography>

              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: '#30363d', color: '#8b949e', fontWeight: 600 } }}>
                      <TableCell>Hospital</TableCell>
                      <TableCell>ETA</TableCell>
                      <TableCell>Fit</TableCell>
                      <TableCell>ICU</TableCell>
                      <TableCell>Suitability</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recommendation?.candidates?.map((c) => {
                      const hosp = hospitals.find((h) => h.id === c.hospitalId);
                      const icu = hosp?.resources?.find((r) => r.resourceType === 'ICU_BEDS')?.availableCount || 0;
                      return (
                        <TableRow
                          key={c.id}
                          sx={{
                            '& td': { borderColor: '#30363d', color: '#c9d1d9' },
                            backgroundColor: c.isRecommended ? 'rgba(56, 139, 253, 0.08)' : 'inherit'
                          }}
                        >
                          <TableCell sx={{ fontWeight: c.isRecommended ? 700 : 400 }}>
                            {c.hospitalName}
                            {c.feasibility === 'INFEASIBLE' && (
                              <Typography variant="caption" sx={{ color: '#f85149', display: 'block' }}>
                                (Constraint Infeasible)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{c.etaMinutes || Math.round(c.etaSeconds / 60)}m</TableCell>
                          <TableCell>{c.clinicalFitScore}</TableCell>
                          <TableCell sx={{ color: icu === 0 ? '#f85149' : '#3fb950', fontWeight: 600 }}>
                            {icu}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: c.isRecommended ? '#58a6ff' : '#c9d1d9' }}>
                            {c.overallSuitabilityScore}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button size="small" onClick={() => navigate(`/destination?caseId=${caseId}`)} sx={{ color: '#58a6ff' }}>
                  View Full Decision Matrix →
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
