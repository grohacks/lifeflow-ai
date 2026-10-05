import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, TextField,
  Select, MenuItem, FormControl, InputLabel, Paper, List, ListItem,
  Divider, IconButton, CircularProgress, Alert
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import SendIcon from '@mui/icons-material/Send';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { messageApi, patientApi } from '../services/api';

export const CommunicationCenterPage: React.FC = () => {
  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('CASE-2026-001');
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [recipientRole, setRecipientRole] = useState<string>('ROLE_HOSPITAL_OPERATOR');
  const [priority, setPriority] = useState<string>('NORMAL');
  const [loading, setLoading] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  const currentUser = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');

  const fetchCases = async () => {
    try {
      const cases = await patientApi.getActiveCases();
      setActiveCases(cases || []);
      if (cases && cases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(cases[0].caseId);
      }
    } catch (err) {
      console.error('Failed to fetch active cases', err);
    }
  };

  const fetchMessages = async (caseId: string) => {
    if (!caseId) return;
    try {
      setLoading(true);
      const data = await messageApi.getByCase(caseId);
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      fetchMessages(selectedCaseId);
      const interval = setInterval(() => fetchMessages(selectedCaseId), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedCaseId]);

  const handleSendMessage = async (customContent?: string) => {
    const text = customContent || messageText;
    if (!text.trim() || !selectedCaseId) return;

    try {
      setSending(true);
      await messageApi.sendMessage(selectedCaseId, {
        recipientRole,
        content: text.trim(),
        priority
      });
      setMessageText('');
      await fetchMessages(selectedCaseId);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleQuickCallout = (text: string, p: string) => {
    setPriority(p);
    handleSendMessage(text);
  };

  const getPriorityChip = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return <Chip label="CRITICAL" size="small" sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#f85149', fontWeight: 700, height: 20 }} />;
      case 'URGENT':
        return <Chip label="URGENT" size="small" sx={{ backgroundColor: 'rgba(210, 153, 34, 0.2)', color: '#d29922', fontWeight: 700, height: 20 }} />;
      default:
        return <Chip label="ROUTINE" size="small" sx={{ backgroundColor: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', fontWeight: 600, height: 20 }} />;
    }
  };

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ForumIcon sx={{ color: '#58a6ff', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              Clinical Communication & Intercom Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              Encrypted, Audited Role-to-Role Clinical Messaging for Active Inbound Resuscitation
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 200, backgroundColor: '#161b22' }}>
            <InputLabel sx={{ color: '#8b949e' }}>Active Case</InputLabel>
            <Select
              value={selectedCaseId}
              label="Active Case"
              onChange={(e) => setSelectedCaseId(e.target.value)}
              sx={{ color: '#f0f6fc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' } }}
            >
              <MenuItem value="CASE-2026-001">CASE-2026-001 (Poly-Trauma)</MenuItem>
              {activeCases.map((c) => (
                <MenuItem key={c.caseId} value={c.caseId}>
                  {c.caseId} ({c.chiefComplaint || 'Emergency'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton onClick={() => fetchMessages(selectedCaseId)} sx={{ color: '#8b949e' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Main Grid: Channels & Messages */}
      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Column: Quick Callouts & Case Context */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlashOnIcon sx={{ color: '#d29922', fontSize: 18 }} />
                Instant Clinical Callouts
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1.5 }}>
                Pre-formatted single-tap tactical alerts dispatched to trauma leads:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickCallout('12-Lead ECG confirmed STEMI. Cath lab team mobilization required on arrival.', 'CRITICAL')}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', borderColor: 'rgba(248, 81, 73, 0.4)', color: '#f85149', fontSize: '0.75rem', textTransform: 'none' }}
                >
                  🚨 STEMI Confirmed – Cath Lab Mobilization
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickCallout('FAST ultrasound suggests intra-abdominal free fluid. Prep 2 units O-Negative blood.', 'CRITICAL')}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', borderColor: 'rgba(248, 81, 73, 0.4)', color: '#f85149', fontSize: '0.75rem', textTransform: 'none' }}
                >
                  🩸 Hemorrhage – Prep 2 Units O-Negative
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickCallout('Heavy corridor traffic on expressway. ETA revised +7 minutes.', 'URGENT')}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', borderColor: 'rgba(210, 153, 34, 0.4)', color: '#d29922', fontSize: '0.75rem', textTransform: 'none' }}
                >
                  ⏱️ Route Delay – ETA Revised (+7 mins)
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleQuickCallout('Trauma Bay 1 ready. Anesthesia & Surgical Fellow on standby.', 'NORMAL')}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', borderColor: 'rgba(63, 185, 80, 0.4)', color: '#3fb950', fontSize: '0.75rem', textTransform: 'none' }}
                >
                  ✅ Trauma Bay 1 & Surgical Team Standby
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ border: '1px solid #30363d', backgroundColor: '#161b22', flexGrow: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc', mb: 1 }}>
                Active Communication Channel
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, color: '#c9d1d9', fontSize: '0.82rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e' }}>Case Identifier:</span>
                  <strong>{selectedCaseId}</strong>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e' }}>Ambulance Unit:</span>
                  <span>AMB-01 (ALS Unit)</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e' }}>Receiving Hospital:</span>
                  <span>Apollo Emergency Center</span>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b949e' }}>Security Layer:</span>
                  <span style={{ color: '#3fb950' }}>TLS 1.3 / Audit-Hashed</span>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Chat History & Composer */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Chat History */}
          <Paper
            sx={{
              flexGrow: 1,
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              p: 2,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              mb: 1.5
            }}
          >
            {loading && messages.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: '#8b949e' }}>
                <Typography variant="body2">No messages logged for this case yet.</Typography>
                <Typography variant="caption">Send an update or trigger a quick callout.</Typography>
              </Box>
            ) : (
              messages.map((m: any) => {
                const isMe = m.senderUsername === currentUser.username;
                return (
                  <Box
                    key={m.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '80%',
                        backgroundColor: isMe ? '#1f6feb22' : '#161b22',
                        border: `1px solid ${isMe ? '#1f6feb66' : '#30363d'}`,
                        borderRadius: 2,
                        p: 1.5
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <PersonIcon sx={{ fontSize: 16, color: '#58a6ff' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                            {m.senderUsername || 'Paramedic'}
                          </Typography>
                          <Chip
                            label={m.senderRole?.replace('ROLE_', '') || 'PARAMEDIC'}
                            size="small"
                            sx={{ height: 16, fontSize: '0.6rem', backgroundColor: '#21262d', color: '#8b949e' }}
                          />
                        </Box>
                        {getPriorityChip(m.priority)}
                      </Box>

                      <Typography variant="body2" sx={{ color: '#e6edf3', whiteSpace: 'pre-wrap', my: 0.5 }}>
                        {m.content}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#8b949e', fontSize: '0.65rem' }}>
                          {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : 'Just now'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </Paper>

          {/* Composer Box */}
          <Paper sx={{ p: 1.5, backgroundColor: '#161b22', border: '1px solid #30363d' }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#8b949e', fontSize: '0.75rem' }}>Target Role</InputLabel>
                  <Select
                    value={recipientRole}
                    label="Target Role"
                    onChange={(e) => setRecipientRole(e.target.value)}
                    sx={{ color: '#f0f6fc', fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' } }}
                  >
                    <MenuItem value="ROLE_HOSPITAL_OPERATOR">Hospital ED Lead</MenuItem>
                    <MenuItem value="ROLE_PARAMEDIC">Ambulance Crew</MenuItem>
                    <MenuItem value="ROLE_CONTROL_ROOM">Central Dispatch</MenuItem>
                    <MenuItem value="ROLE_CLINICIAN_VIEWER">Trauma Surgeon</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ color: '#8b949e', fontSize: '0.75rem' }}>Priority</InputLabel>
                  <Select
                    value={priority}
                    label="Priority"
                    onChange={(e) => setPriority(e.target.value)}
                    sx={{ color: '#f0f6fc', fontSize: '0.8rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' } }}
                  >
                    <MenuItem value="NORMAL">Normal</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type clinical update or coordination note..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#0d1117',
                      color: '#c9d1d9',
                      fontSize: '0.82rem',
                      '& fieldset': { borderColor: '#30363d' }
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={1.5}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={sending || !messageText.trim()}
                  onClick={() => handleSendMessage()}
                  endIcon={<SendIcon />}
                  sx={{ height: 40, fontWeight: 700 }}
                >
                  Send
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
