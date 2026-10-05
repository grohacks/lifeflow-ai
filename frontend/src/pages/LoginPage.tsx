import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Grid, Divider,
  Tabs, Tab, FormControl, InputLabel, Select, MenuItem, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { isHospitalRole } from '../types';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

interface AccountReference {
  username: string;
  pass: string;
  role: string;
  title: string;
  color: string;
  badge: string;
  scope: string;
  category: 'Paramedic' | 'Hospital In-Charge' | 'On-Call Doctor' | 'Control & Admin';
}

const existingAccounts: AccountReference[] = [
  {
    username: 'paramedic',
    pass: 'paramedic123',
    role: 'ROLE_PARAMEDIC',
    title: 'Lead Paramedic (Medic One)',
    color: '#58a6ff',
    badge: 'Ambulance Crew',
    scope: 'Telemetry streaming, vision vitals survey, bedside ultrasound, live GMaps navigation & destination confirmation',
    category: 'Paramedic'
  },
  {
    username: 'hosp_stjude',
    pass: 'stjude123',
    role: 'ROLE_HOSPITAL_OPERATOR',
    title: 'St. Jude ED In-Charge (HOSP-001)',
    color: '#3fb950',
    badge: 'Level 1 Trauma',
    scope: 'St. Jude Central: live inbound pre-alerts, minute vitals & injury photos, bed/blood/equipment reservation & doctor callout',
    category: 'Hospital In-Charge'
  },
  {
    username: 'hosp_metro',
    pass: 'metro123',
    role: 'ROLE_HOSPITAL_OPERATOR',
    title: 'Metro General ED In-Charge (HOSP-002)',
    color: '#2ea043',
    badge: 'Level 2 Trauma',
    scope: 'Metro General: dedicated facility console, approaching ambulance GPS map, resource reservation & doctor dispatch',
    category: 'Hospital In-Charge'
  },
  {
    username: 'hosp_westside',
    pass: 'westside123',
    role: 'ROLE_HOSPITAL_OPERATOR',
    title: 'Westside ED In-Charge (HOSP-003)',
    color: '#56d364',
    badge: 'Level 3 Community',
    scope: 'Westside Community: local bed triage, incoming patient summary, reservation confirmation & surgical alerts',
    category: 'Hospital In-Charge'
  },
  {
    username: 'hosp_apex',
    pass: 'apex123',
    role: 'ROLE_HOSPITAL_OPERATOR',
    title: 'Apex Trauma ED In-Charge (HOSP-APX-5417)',
    color: '#1f6feb',
    badge: 'Level 1 Regional Trauma',
    scope: 'Apex Regional Trauma & Specialty Center: dedicated facility console, incoming critical pre-alerts, live vitals & injury photos, bed/blood/equipment reservation & specialist doctor assignment',
    category: 'Hospital In-Charge'
  },
  {
    username: 'doctor_trauma',
    pass: 'doctor123',
    role: 'ROLE_CLINICIAN_VIEWER',
    title: 'Dr. Robert House (Trauma Surgery)',
    color: '#bc8cff',
    badge: 'Trauma Bay 1',
    scope: 'St. Jude Trauma: live approaching ambulance GPS, sensor waveforms, injury photos, AI forecasts at ETA & pre-arrival directives',
    category: 'On-Call Doctor'
  },
  {
    username: 'doctor_cardio',
    pass: 'doctor123',
    role: 'ROLE_CLINICIAN_VIEWER',
    title: 'Dr. Emily Watson (Cardiology)',
    color: '#d2a8ff',
    badge: 'Cath Lab',
    scope: 'Metro General: cardiac twin waveforms, ECG monitor, arterial line streaming, catheterization orders',
    category: 'On-Call Doctor'
  },
  {
    username: 'doctor_apex',
    pass: 'doctor123',
    role: 'ROLE_CLINICIAN_VIEWER',
    title: 'Dr. Alexander Vance (Apex Lead Trauma Surgeon)',
    color: '#a371f7',
    badge: 'Apex Resuscitation',
    scope: 'Apex Regional Trauma: approaching ambulance GPS, telemetry waveforms, AI vision injury photos, patient twin state at ETA & pre-arrival orders',
    category: 'On-Call Doctor'
  },
  {
    username: 'control',
    pass: 'control123',
    role: 'ROLE_CONTROL_ROOM',
    title: 'Control Room Dispatcher',
    color: '#d29922',
    badge: 'Fleet Ops',
    scope: 'Regional fleet overview, 911/112 incident dispatch, traffic corridors, emergency route recalculations',
    category: 'Control & Admin'
  },
  {
    username: 'admin',
    pass: 'admin123',
    role: 'ROLE_ADMIN',
    title: 'System Administrator',
    color: '#f85149',
    badge: 'Superuser',
    scope: 'Platform governance, user management, hospital network & resource allocation, immutable audit logs',
    category: 'Control & Admin'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  // Sign In form state
  const [username, setUsername] = useState('paramedic');
  const [password, setPassword] = useState('paramedic123');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('ROLE_PARAMEDIC');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const loginUser = customUser || username;
    const loginPass = customPass || password;

    try {
      const data = await authApi.login(loginUser.trim(), loginPass);
      localStorage.setItem('lifeflow_token', data.token);
      localStorage.setItem('lifeflow_user', JSON.stringify({
        id: data.userId,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles,
        hospitalCode: data.hospitalCode,
        hospitalName: data.hospitalName,
        department: data.department
      }));
      localStorage.removeItem('lifeflow_active_role_view');

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      const isHospitalOrClinician = isHospitalRole(data.roles);
      if (isHospitalOrClinician) {
        navigate('/hospital-console');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!regUsername || !regPassword || !regFullName || !regEmail) {
      setError('Please fill in all registration fields.');
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.register({
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        role: regRole
      });

      localStorage.setItem('lifeflow_token', data.token);
      localStorage.setItem('lifeflow_user', JSON.stringify({
        id: data.userId,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles
      }));
      localStorage.removeItem('lifeflow_active_role_view');

      setSuccessMsg(`Account created successfully for ${data.fullName} with role ${regRole.replace('ROLE_', '')}! Redirecting...`);
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        navigate('/');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Username or email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090d13',
        p: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 620,
          width: '100%',
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          borderRadius: 2.5
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header Banner */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '50%',
                backgroundColor: 'rgba(248, 81, 73, 0.15)',
                color: '#f85149',
                mb: 1.5
              }}
            >
              <HealthAndSafetyIcon sx={{ fontSize: 44 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#f0f6fc', letterSpacing: 0.5 }}>
              LifeFlow AI
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b949e', textAlign: 'center', mt: 0.5 }}>
              Predictive Emergency Healthcare Digital Twin Platform • Zero-Trust Role-Based Access
            </Typography>
          </Box>

          {/* Sign In vs Register Tabs */}
          <Tabs
            value={tabIndex}
            onChange={(_, val) => { setTabIndex(val); setError(null); setSuccessMsg(null); }}
            variant="fullWidth"
            sx={{
              mb: 3,
              borderBottom: '1px solid #30363d',
              '& .MuiTab-root': { fontWeight: 600, color: '#8b949e', textTransform: 'none' },
              '& .Mui-selected': { color: '#58a6ff' },
              '& .MuiTabs-indicator': { backgroundColor: '#58a6ff' }
            }}
          >
            <Tab icon={<LoginIcon />} iconPosition="start" label="Sign In with Credentials" />
            <Tab icon={<HowToRegIcon />} iconPosition="start" label="Register New Staff Account" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, backgroundColor: 'rgba(248, 81, 73, 0.15)', color: '#ff7b72', border: '1px solid #f85149' }}>
              {error}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2.5, backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', border: '1px solid #3fb950' }}>
              {successMsg}
            </Alert>
          )}

          {/* ========================================================================= */}
          {/* TAB 0: SIGN IN WITH CREDENTIALS                                           */}
          {/* ========================================================================= */}
          {tabIndex === 0 && (
            <Box>
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  required
                  sx={{ input: { color: '#f0f6fc' }, mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                  variant="outlined"
                  size="small"
                  required
                  sx={{ input: { color: '#f0f6fc' }, mb: 2.5 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  disabled={loading}
                  sx={{ py: 1.2, fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' }}
                >
                  {loading ? 'Authenticating with Backend...' : 'Sign In to Authorized Console'}
                </Button>
              </Box>

              {/* Pre-Configured Operational Accounts Reference */}
              <Divider sx={{ my: 3, borderColor: '#30363d' }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, letterSpacing: 0.5 }}>
                  ROLE CREDENTIALS & ONE-CLICK ACCESS
                </Typography>
              </Divider>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  label="All Profiles"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#58a6ff', color: '#58a6ff' }}
                />
                <Chip
                  label="🏥 Hospital In-Charges"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#3fb950', color: '#3fb950' }}
                />
                <Chip
                  label="🩺 On-Call Doctors"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#bc8cff', color: '#bc8cff' }}
                />
                <Chip
                  label="🚑 Paramedics"
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#58a6ff', color: '#58a6ff' }}
                />
              </Box>

              <TableContainer component={Paper} sx={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { borderColor: '#30363d', color: '#8b949e', fontWeight: 700, fontSize: '0.72rem' } }}>
                      <TableCell>ROLE / IDENTITY</TableCell>
                      <TableCell>CREDENTIALS</TableCell>
                      <TableCell align="right">ONE-CLICK ACCESS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {existingAccounts.map((acc) => (
                      <TableRow key={acc.username} sx={{ '& td': { borderColor: '#21262d' } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: acc.color, fontSize: '0.78rem' }}>
                            {acc.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontSize: '0.65rem' }}>
                            {acc.badge} • {acc.role}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            <span style={{ color: '#f0f6fc', fontWeight: 600 }}>{acc.username}</span>
                            <span style={{ color: '#8b949e' }}> / </span>
                            <span style={{ color: '#8b949e' }}>{acc.pass}</span>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleFillCredentials(acc.username, acc.pass)}
                              sx={{
                                fontSize: '0.68rem',
                                py: 0.2,
                                px: 0.8,
                                textTransform: 'none',
                                borderColor: '#30363d',
                                color: '#8b949e',
                                '&:hover': { borderColor: '#8b949e' }
                              }}
                            >
                              Fill
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleLogin(undefined, acc.username, acc.pass)}
                              disabled={loading}
                              sx={{
                                fontSize: '0.68rem',
                                py: 0.2,
                                px: 1.2,
                                textTransform: 'none',
                                backgroundColor: acc.color,
                                color: '#090d13',
                                fontWeight: 700,
                                '&:hover': { backgroundColor: acc.color, filter: 'brightness(1.15)' }
                              }}
                            >
                              Login
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: REGISTER NEW STAFF WITH ASSIGNED ROLE                              */}
          {/* ========================================================================= */}
          {tabIndex === 1 && (
            <Box component="form" onSubmit={handleRegister}>
              <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
                Register a new healthcare identity. When you log in with these credentials, the system automatically adapts the interface exclusively to your assigned operational role.
              </Typography>

              <TextField
                fullWidth
                label="Full Name"
                placeholder="e.g. Dr. Alex Morgan"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
                variant="outlined"
                size="small"
                sx={{ input: { color: '#f0f6fc' }, mb: 2 }}
              />

              <TextField
                fullWidth
                label="Work Email"
                type="email"
                placeholder="e.g. alex.morgan@hospital.org"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                variant="outlined"
                size="small"
                sx={{ input: { color: '#f0f6fc' }, mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    placeholder="e.g. amorgan"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                    variant="outlined"
                    size="small"
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    variant="outlined"
                    size="small"
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#8b949e' }}>Assigned Operational Role</InputLabel>
                <Select
                  value={regRole}
                  label="Assigned Operational Role"
                  onChange={(e) => setRegRole(e.target.value)}
                  sx={{ color: '#f0f6fc', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' } }}
                >
                  <MenuItem value="ROLE_PARAMEDIC">🚑 Lead Paramedic (Field Ambulance Crew)</MenuItem>
                  <MenuItem value="ROLE_HOSPITAL_OPERATOR">🏥 Hospital ED Coordinator (Triage & Bed Management)</MenuItem>
                  <MenuItem value="ROLE_CONTROL_ROOM">📡 Control Room Dispatcher (Fleet & Route Control)</MenuItem>
                  <MenuItem value="ROLE_CLINICIAN_VIEWER">🩺 Clinician / Specialist Physician (Vital & ECG Oversight)</MenuItem>
                  <MenuItem value="ROLE_ADMIN">⚙️ System Administrator (Platform & Hospital Governance)</MenuItem>
                </Select>
              </FormControl>

              {/* Role Scope Preview Banner */}
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 1.5,
                  backgroundColor: '#0d1117',
                  border: '1px solid #30363d'
                }}
              >
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, display: 'block' }}>
                  ROLE PERMISSION SCOPE:
                </Typography>
                <Typography variant="body2" sx={{ color: '#58a6ff', fontWeight: 600, mt: 0.5 }}>
                  {existingAccounts.find(a => a.role === regRole)?.title || regRole}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.5 }}>
                  {existingAccounts.find(a => a.role === regRole)?.scope || 'Assigned system role permissions.'}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="success"
                size="large"
                type="submit"
                disabled={loading}
                sx={{ py: 1.2, fontWeight: 700, textTransform: 'none', fontSize: '0.95rem', backgroundColor: '#238636' }}
              >
                {loading ? 'Creating Account in Backend Database...' : 'Register Account & Sign In'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
