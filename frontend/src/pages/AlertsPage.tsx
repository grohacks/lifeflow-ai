import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, CircularProgress, Alert as MuiAlert
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import FilterListIcon from '@mui/icons-material/FilterList';
import { alertsApi } from '../services/api';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unresolvedOnly, setUnresolvedOnly] = useState<boolean>(false);
  const [ackModal, setAckModal] = useState<any>(null);
  const [notes, setNotes] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertsApi.getAll(unresolvedOnly);
      setAlerts(data || []);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [unresolvedOnly]);

  const handleAcknowledge = async () => {
    if (!ackModal) return;
    try {
      await alertsApi.acknowledge(ackModal.id, notes);
      setActionSuccess(`Alert #${ackModal.id} successfully acknowledged.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setAckModal(null);
      setNotes('');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  const getSeverityChip = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <Chip label="CRITICAL" size="small" sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#f85149', fontWeight: 700, border: '1px solid #f85149' }} />;
      case 'HIGH':
        return <Chip label="HIGH" size="small" sx={{ backgroundColor: 'rgba(240, 136, 62, 0.2)', color: '#f0883e', fontWeight: 700, border: '1px solid #f0883e' }} />;
      case 'MEDIUM':
        return <Chip label="MEDIUM" size="small" sx={{ backgroundColor: 'rgba(210, 153, 34, 0.2)', color: '#d29922', fontWeight: 700, border: '1px solid #d29922' }} />;
      default:
        return <Chip label="LOW" size="small" sx={{ backgroundColor: 'rgba(56, 139, 253, 0.2)', color: '#388bfd', fontWeight: 600 }} />;
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && a.status !== 'RESOLVED').length;
  const escalatedCount = alerts.filter((a) => a.status === 'ESCALATED').length;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <NotificationsActiveIcon sx={{ color: '#f85149', fontSize: 30 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              Alerts & Automated Escalation Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              Algorithmic Threshold Monitoring, Protocol Escalations & Emergency Clinical Broadcasts
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
                color="warning"
              />
            }
            label={<Typography variant="body2" sx={{ color: '#c9d1d9' }}>Unresolved Only</Typography>}
          />
          <IconButton onClick={fetchAlerts} sx={{ color: '#8b949e' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {actionSuccess && (
        <MuiAlert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950' }}>
          {actionSuccess}
        </MuiAlert>
      )}

      {/* Summary KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>CRITICAL ALERTS</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f85149' }}>{criticalCount}</Typography>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>Immediate action required</Typography>
              </Box>
              <WarningIcon sx={{ color: '#f85149', fontSize: 36 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>HIGH PRIORITY</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f0883e' }}>{highCount}</Typography>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>Pre-alerting clinical leads</Typography>
              </Box>
              <NotificationsActiveIcon sx={{ color: '#f0883e', fontSize: 36 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>ESCALATED INCIDENTS</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#d29922' }}>{escalatedCount}</Typography>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>Level 2 & 3 hierarchy notifications</Typography>
              </Box>
              <EscalatorWarningIcon sx={{ color: '#d29922', fontSize: 36 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#0d1117' }}>
            <TableRow>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>ID / Severity</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Alert Classification</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Target Case / Unit</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Description & Metric Bounds</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Escalation Status</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Triggered Time</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700, textAlign: 'right' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#8b949e' }}>
                  {loading ? <CircularProgress size={24} /> : 'No active alerts detected. All telemetry within safe parameters.'}
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((a) => (
                <TableRow key={a.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 600 }}>#{a.id}</Typography>
                      {getSeverityChip(a.severity)}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#f0f6fc', fontWeight: 600 }}>
                    {a.alertType?.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell sx={{ color: '#58a6ff' }}>
                    {a.patientCaseId || a.caseId || 'System-Wide'}
                  </TableCell>
                  <TableCell sx={{ color: '#c9d1d9' }}>
                    <Typography variant="body2">{a.title || a.message}</Typography>
                    {a.metric && (
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>
                        Metric: {a.metric} (Value: {a.currentValue ?? 'N/A'}, Threshold: {a.thresholdValue ?? 'N/A'})
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`Level ${a.escalationLevel || 1} • ${a.status}`}
                      size="small"
                      sx={{
                        fontSize: '0.7rem',
                        backgroundColor: a.status === 'ACKNOWLEDGED' ? 'rgba(63, 185, 80, 0.2)' : a.status === 'ESCALATED' ? 'rgba(240, 136, 62, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                        color: a.status === 'ACKNOWLEDGED' ? '#3fb950' : a.status === 'ESCALATED' ? '#f0883e' : '#f85149'
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#8b949e', fontSize: '0.75rem' }}>
                    {a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : 'Recent'}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    {a.status === 'ACKNOWLEDGED' || a.status === 'RESOLVED' ? (
                      <Chip label="Handled" size="small" icon={<CheckCircleIcon />} sx={{ backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3fb950' }} />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        onClick={() => setAckModal(a)}
                        sx={{ fontSize: '0.72rem', textTransform: 'none', fontWeight: 700 }}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Acknowledge Modal */}
      <Dialog
        open={!!ackModal}
        onClose={() => setAckModal(null)}
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d', color: '#c9d1d9' } }}
      >
        <DialogTitle sx={{ color: '#f0f6fc', fontWeight: 700 }}>
          Acknowledge Emergency Alert #{ackModal?.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are logging formal clinical acknowledgment of: <strong>{ackModal?.title || ackModal?.message}</strong>.
            This prevents secondary automated escalation to supervisory clinical directors.
          </Typography>
          <TextField
            fullWidth
            label="Clinical Action Taken / Mitigation Notes"
            placeholder="e.g. Oxygen mask applied; titration started; notifying trauma attending."
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ backgroundColor: '#0d1117' }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #30363d' }}>
          <Button onClick={() => setAckModal(null)} sx={{ color: '#8b949e' }}>Cancel</Button>
          <Button onClick={handleAcknowledge} variant="contained" color="success">
            Confirm Acknowledgment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
