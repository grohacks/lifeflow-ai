import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { auditApi } from '../services/api';
import { AuditEvent } from '../types';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = () => {
    auditApi.getAll(0, 50).then((res) => {
      setEvents(res.content || res || []);
    }).catch(console.error);
  };

  const handleInspect = (event: AuditEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
            Regulatory Clinical & System Audit Log
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b949e' }}>
            Immutable Forensic Ledger • State Transition Diffs • Correlation Tracing
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadAudit}
          sx={{ borderColor: '#30363d', color: '#58a6ff' }}
        >
          Refresh Audit Log
        </Button>
      </Box>

      <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { borderColor: '#30363d', color: '#8b949e', fontWeight: 600 } }}>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Actor</TableCell>
                  <TableCell>Case ID</TableCell>
                  <TableCell>Correlation ID</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: '#8b949e' }}>
                      No audit events recorded yet. System operations will appear here.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((ev) => (
                    <TableRow key={ev.id} sx={{ '& td': { borderColor: '#30363d', color: '#c9d1d9' } }}>
                      <TableCell>{new Date(ev.timestamp).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={ev.eventType}
                          size="small"
                          sx={{
                            backgroundColor: ev.eventType.includes('DECISION') ? 'rgba(63, 185, 80, 0.15)' :
                                           ev.eventType.includes('DETERIORATION') ? 'rgba(248, 81, 73, 0.15)' :
                                           'rgba(88, 166, 255, 0.15)',
                            color: ev.eventType.includes('DECISION') ? '#3fb950' :
                                   ev.eventType.includes('DETERIORATION') ? '#f85149' :
                                   '#58a6ff',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{ev.actorUser}</TableCell>
                      <TableCell>{ev.caseId || '--'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#8b949e' }}>
                        {ev.correlationId?.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleInspect(ev)}
                          sx={{ color: '#58a6ff' }}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Inspect Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#161b22', color: '#f0f6fc' }}>
          Audit Event Details: {selectedEvent?.eventType}
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#161b22', pt: 2 }}>
          {selectedEvent && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#8b949e' }}>
                Event ID: <code>{selectedEvent.eventId}</code>
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b949e' }}>
                Correlation ID: <code>{selectedEvent.correlationId}</code>
              </Typography>
              <Typography variant="body2" sx={{ color: '#8b949e' }}>
                Actor: <strong>{selectedEvent.actorUser}</strong> • Timestamp: {new Date(selectedEvent.timestamp).toLocaleString()}
              </Typography>

              {selectedEvent.previousStateJson && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#f85149', fontWeight: 600 }}>
                    PREVIOUS STATE SNAPSHOT:
                  </Typography>
                  <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem', color: '#c9d1d9' }}>
                    {selectedEvent.previousStateJson}
                  </Box>
                </Box>
              )}

              {selectedEvent.newStateJson && (
                <Box>
                  <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 600 }}>
                    NEW STATE SNAPSHOT:
                  </Typography>
                  <Box sx={{ p: 1.5, backgroundColor: '#0d1117', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem', color: '#c9d1d9' }}>
                    {selectedEvent.newStateJson}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#161b22', p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
