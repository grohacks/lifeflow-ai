import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, TextField,
  Slider, Alert, Divider, Chip, CircularProgress, Paper
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { configApi } from '../services/api';

export const ConfigurationPage: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Clinical Thresholds
  const [hrCritical, setHrCritical] = useState<number>(130);
  const [sbpCritical, setSbpCritical] = useState<number>(90);
  const [spo2Critical, setSpo2Critical] = useState<number>(90);
  const [rrCritical, setRrCritical] = useState<number>(30);

  // Decision Scoring Weights
  const [timeWeight, setTimeWeight] = useState<number>(35);
  const [capacityWeight, setCapacityWeight] = useState<number>(30);
  const [capabilityWeight, setCapabilityWeight] = useState<number>(25);
  const [riskWeight, setRiskWeight] = useState<number>(10);

  // Operations
  const [preAlertEta, setPreAlertEta] = useState<number>(15);
  const [escalateSecs, setEscalateSecs] = useState<number>(120);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await configApi.getAll();
      setConfigs(data || []);
      // Map existing values if present
      data?.forEach((c: any) => {
        if (c.configKey === 'threshold.vital.hr.max') setHrCritical(Number(c.configValue));
        if (c.configKey === 'threshold.vital.sbp.min') setSbpCritical(Number(c.configValue));
        if (c.configKey === 'threshold.vital.spo2.min') setSpo2Critical(Number(c.configValue));
        if (c.configKey === 'decision.weight.time') setTimeWeight(Number(c.configValue) * 100);
        if (c.configKey === 'decision.weight.capacity') setCapacityWeight(Number(c.configValue) * 100);
      });
    } catch (err) {
      console.error('Failed to load configs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSaveConfigs = async () => {
    try {
      setSaving(true);
      await configApi.update('threshold.vital.hr.max', String(hrCritical));
      await configApi.update('threshold.vital.sbp.min', String(sbpCritical));
      await configApi.update('threshold.vital.spo2.min', String(spo2Critical));
      await configApi.update('decision.weight.time', String((timeWeight / 100).toFixed(2)));
      await configApi.update('decision.weight.capacity', String((capacityWeight / 100).toFixed(2)));

      setSaveSuccess('Configuration updated successfully! New weights applied to decision engine.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to save configs', err);
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = timeWeight + capacityWeight + capabilityWeight + riskWeight;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TuneIcon sx={{ color: '#d29922', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              System Configuration & Clinical Calibration Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              Dynamic Calibration of Physiological Alarm Limits, MCDA Optimization Weights & Escalation Policies
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="warning"
          startIcon={<SaveIcon />}
          onClick={handleSaveConfigs}
          disabled={saving}
          sx={{ fontWeight: 700 }}
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3, backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', border: '1px solid #3fb950' }}>
          {saveSuccess}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Clinical Vital Signs Alarm Limits */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <HealthAndSafetyIcon sx={{ color: '#f85149' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                  Clinical Alarm Limits & Thresholds
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#8b949e', mb: 3 }}>
                Values breaching these critical cutoffs immediately fire Red Severity Alarms and sound hospital pre-alerts.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>Heart Rate Tachycardia Alarm (BPM)</Typography>
                    <Typography variant="body2" sx={{ color: '#f85149', fontWeight: 700 }}>≥ {hrCritical} bpm</Typography>
                  </Box>
                  <Slider
                    value={hrCritical}
                    min={100}
                    max={180}
                    onChange={(_, val) => setHrCritical(val as number)}
                    sx={{ color: '#f85149' }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>Systolic BP Hypotension Critical (mmHg)</Typography>
                    <Typography variant="body2" sx={{ color: '#f85149', fontWeight: 700 }}>≤ {sbpCritical} mmHg</Typography>
                  </Box>
                  <Slider
                    value={sbpCritical}
                    min={60}
                    max={110}
                    onChange={(_, val) => setSbpCritical(val as number)}
                    sx={{ color: '#f85149' }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>SpO2 Critical Hypoxia Cutoff (%)</Typography>
                    <Typography variant="body2" sx={{ color: '#58a6ff', fontWeight: 700 }}>≤ {spo2Critical}%</Typography>
                  </Box>
                  <Slider
                    value={spo2Critical}
                    min={75}
                    max={95}
                    onChange={(_, val) => setSpo2Critical(val as number)}
                    sx={{ color: '#58a6ff' }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>Respiratory Rate Tachypnea (breaths/min)</Typography>
                    <Typography variant="body2" sx={{ color: '#d29922', fontWeight: 700 }}>≥ {rrCritical} bpm</Typography>
                  </Box>
                  <Slider
                    value={rrCritical}
                    min={20}
                    max={50}
                    onChange={(_, val) => setRrCritical(val as number)}
                    sx={{ color: '#d29922' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Multi-Criteria Decision Algorithm (MCDA) Scoring Weights */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22', height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AltRouteIcon sx={{ color: '#58a6ff' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    Destination Algorithm Scoring Weights
                  </Typography>
                </Box>
                <Chip
                  label={`Total: ${totalWeight}%`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    backgroundColor: totalWeight === 100 ? 'rgba(63, 185, 80, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                    color: totalWeight === 100 ? '#3fb950' : '#f85149',
                    border: `1px solid ${totalWeight === 100 ? '#3fb950' : '#f85149'}`
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#8b949e', mb: 3 }}>
                Determines how the autonomous routing engine balances travel speed versus surgical specialty and ICU beds.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>Travel Time & Traffic ETA Weight</Typography>
                    <Typography variant="body2" sx={{ color: '#58a6ff', fontWeight: 700 }}>{timeWeight}%</Typography>
                  </Box>
                  <Slider
                    value={timeWeight}
                    min={10}
                    max={60}
                    onChange={(_, val) => setTimeWeight(val as number)}
                    sx={{ color: '#58a6ff' }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>Bed, OT & Ventilator Capacity Weight</Typography>
                    <Typography variant="body2" sx={{ color: '#3fb950', fontWeight: 700 }}>{capacityWeight}%</Typography>
                  </Box>
                  <Slider
                    value={capacityWeight}
                    min={10}
                    max={50}
                    onChange={(_, val) => setCapacityWeight(val as number)}
                    sx={{ color: '#3fb950' }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>Specialist Capability Match (Trauma/Cath/Stroke)</Typography>
                    <Typography variant="body2" sx={{ color: '#bc8cff', fontWeight: 700 }}>{capabilityWeight}%</Typography>
                  </Box>
                  <Slider
                    value={capabilityWeight}
                    min={10}
                    max={50}
                    onChange={(_, val) => setCapabilityWeight(val as number)}
                    sx={{ color: '#bc8cff' }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>Patient Deterioration Risk Penalty</Typography>
                    <Typography variant="body2" sx={{ color: '#f0883e', fontWeight: 700 }}>{riskWeight}%</Typography>
                  </Box>
                  <Slider
                    value={riskWeight}
                    min={5}
                    max={30}
                    onChange={(_, val) => setRiskWeight(val as number)}
                    sx={{ color: '#f0883e' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
