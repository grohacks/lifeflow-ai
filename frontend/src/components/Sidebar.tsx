import React, { useState } from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Divider,
  Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import MapIcon from '@mui/icons-material/Map';
import DomainIcon from '@mui/icons-material/Domain';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import SecurityIcon from '@mui/icons-material/Security';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ForumIcon from '@mui/icons-material/Forum';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import TuneIcon from '@mui/icons-material/Tune';
import ShieldIcon from '@mui/icons-material/Shield';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PsychologyIcon from '@mui/icons-material/Psychology';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavSection {
  title: string;
  roleTag: string;
  items: { label: string; path: string; icon: React.ReactNode; badge?: string }[];
}

const getAllNavSections = (userRole: string): NavSection[] => {
  if (userRole.includes('PARAMEDIC')) {
    return [
      {
        title: 'FIELD TRIAGE & EMS',
        roleTag: 'Paramedic',
        items: [
          { label: 'Operations Dashboard', path: '/', icon: <DashboardIcon /> },
          { label: 'Incident Scene Dispatch', path: '/incident-dispatch', icon: <LocalHospitalIcon />, badge: 'Copilot 🤖' },
          { label: 'Ambulance Pre-Alert Dispatch', path: '/prealert', icon: <NotificationsActiveIcon />, badge: 'Hospital Dispatch' },
          { label: 'Patient Digital Twin', path: '/patient-twin', icon: <MonitorHeartIcon />, badge: 'Vitals & ECG' },
          { label: 'Destination Evaluation', path: '/destination', icon: <AltRouteIcon /> },
          { label: 'SBAR Clinical Handover', path: '/handover', icon: <AssignmentIcon />, badge: 'Transfer' },
        ]
      },
      {
        title: 'PARAMEDIC COMMS & AI',
        roleTag: 'Cabin Tools',
        items: [
          { label: 'Intercom & Comms', path: '/communication', icon: <ForumIcon />, badge: 'Realtime' },
          { label: 'Alerts & Escalations', path: '/alerts', icon: <WarningAmberIcon />, badge: 'Priority' },
          { label: 'Clinical AI Assistant', path: '/assistant', icon: <PsychologyIcon />, badge: 'Ollama' },
          { label: 'Edge Sensing & Devices', path: '/devices', icon: <DevicesOtherIcon />, badge: 'Phone/HL7' },
          { label: 'Tactical GIS Map', path: '/map', icon: <MapIcon /> },
        ]
      }
    ];
  }

  if (userRole.includes('HOSPITAL')) {
    return [
      {
        title: 'EMERGENCY DEPARTMENT',
        roleTag: 'Hospital ED',
        items: [
          { label: 'Hospital ED Console', path: '/hospital-console', icon: <StorefrontIcon />, badge: 'Live Beds' },
          { label: 'Hospital Network', path: '/hospitals', icon: <DomainIcon />, badge: 'Bed Capacity' },
        ]
      },
      {
        title: 'INBOUND CLINICAL CARE',
        roleTag: 'Receiving ED',
        items: [
          { label: 'Patient Digital Twin', path: '/patient-twin', icon: <MonitorHeartIcon />, badge: 'Inbound Vitals' },
          { label: 'SBAR Clinical Handover', path: '/handover', icon: <AssignmentIcon />, badge: 'Accept Patient' },
        ]
      },
      {
        title: 'ED COMMUNICATIONS',
        roleTag: 'ED Comms',
        items: [
          { label: 'Intercom & Comms', path: '/communication', icon: <ForumIcon />, badge: 'Cabin Audio' },
          { label: 'Alerts & Escalations', path: '/alerts', icon: <WarningAmberIcon />, badge: 'Priority' },
        ]
      }
    ];
  }

  if (userRole.includes('CONTROL')) {
    return [
      {
        title: 'DISPATCH & FLEET CONTROL',
        roleTag: 'Control Room',
        items: [
          { label: 'Operations Dashboard', path: '/', icon: <DashboardIcon /> },
          { label: 'Incident Scene Dispatch', path: '/incident-dispatch', icon: <LocalHospitalIcon />, badge: 'SOS Scene' },
          { label: 'Tactical GIS Map', path: '/map', icon: <MapIcon />, badge: 'Fleet GPS' },
          { label: 'Destination Evaluation', path: '/destination', icon: <AltRouteIcon /> },
        ]
      },
      {
        title: 'REGIONAL AI & SIMULATION',
        roleTag: 'Control Room',
        items: [
          { label: 'Multi-Agent Activity', path: '/agents', icon: <SmartToyIcon />, badge: '12 Agents' },
          { label: 'Simulation Control', path: '/simulation', icon: <PlayCircleFilledWhiteIcon />, badge: 'Traffic Multiplier' },
          { label: 'Hospital Network', path: '/hospitals', icon: <DomainIcon />, badge: 'Beds' },
        ]
      },
      {
        title: 'COORDINATION & COMMS',
        roleTag: 'Control Room',
        items: [
          { label: 'Intercom & Comms', path: '/communication', icon: <ForumIcon />, badge: 'Realtime' },
          { label: 'Alerts & Escalations', path: '/alerts', icon: <WarningAmberIcon />, badge: 'Priority' },
        ]
      }
    ];
  }

  if (userRole.includes('CLINICIAN')) {
    return [
      {
        title: 'TRAUMA & SURGICAL OVERSIGHT',
        roleTag: 'Clinician',
        items: [
          { label: 'Hospital ED Console', path: '/hospital-console', icon: <StorefrontIcon />, badge: 'Inbound Bay' },
          { label: 'Patient Digital Twin', path: '/patient-twin', icon: <MonitorHeartIcon />, badge: 'Forecast & ECG' },
          { label: 'SBAR Clinical Handover', path: '/handover', icon: <AssignmentIcon />, badge: 'Transfer Audit' },
        ]
      },
      {
        title: 'CLINICAL INTELLIGENCE',
        roleTag: 'Clinician',
        items: [
          { label: 'Clinical AI Assistant', path: '/assistant', icon: <PsychologyIcon />, badge: 'Ollama Protocols' },
          { label: 'Tactical GIS Map', path: '/map', icon: <MapIcon />, badge: 'Ambulance Vector' },
        ]
      },
      {
        title: 'CLINICAL COMMUNICATIONS',
        roleTag: 'Clinician',
        items: [
          { label: 'Intercom & Comms', path: '/communication', icon: <ForumIcon />, badge: 'Direct Link' },
          { label: 'Alerts & Escalations', path: '/alerts', icon: <WarningAmberIcon />, badge: 'Critical' },
        ]
      }
    ];
  }

  // ROLE_ADMIN or Superuser - Administration, Network & Governance items
  return [
    {
      title: 'PLATFORM GOVERNANCE & AUDIT',
      roleTag: 'Administrator',
      items: [
        { label: 'Operations Dashboard', path: '/', icon: <DashboardIcon /> },
        { label: 'Audit Trail (SHA-256)', path: '/audit', icon: <HistoryEduIcon />, badge: 'Immutable' },
        { label: 'Security & Access Control', path: '/security', icon: <ShieldIcon />, badge: 'Zero-Trust' },
        { label: 'System Configuration', path: '/config', icon: <TuneIcon /> },
      ]
    },
    {
      title: 'REGIONAL NETWORK & RESOURCES',
      roleTag: 'Administrator',
      items: [
        { label: 'Hospital Network & Resources', path: '/hospitals', icon: <DomainIcon />, badge: 'Admin Manage' },
        { label: 'Hospital ED Console', path: '/hospital-console', icon: <StorefrontIcon />, badge: 'Live Bays' },
      ]
    },
    {
      title: 'AI & SIMULATION CONTROL',
      roleTag: 'Administrator',
      items: [
        { label: 'Simulation Control', path: '/simulation', icon: <PlayCircleFilledWhiteIcon />, badge: 'Scenarios' },
        { label: 'Multi-Agent Activity', path: '/agents', icon: <SmartToyIcon />, badge: '12 Agents' },
        { label: 'Tactical GIS Map', path: '/map', icon: <MapIcon /> },
      ]
    },
    {
      title: 'SYSTEM COMMUNICATIONS',
      roleTag: 'Administrator',
      items: [
        { label: 'Intercom & Comms', path: '/communication', icon: <ForumIcon />, badge: 'Platform' },
        { label: 'Alerts & Escalations', path: '/alerts', icon: <WarningAmberIcon />, badge: 'Priority' },
      ]
    }
  ];
};

const rolePrivileges = [
  {
    role: 'ROLE_PARAMEDIC',
    name: 'Lead Paramedic',
    context: 'Field Ambulance Cabin Crew',
    color: '#58a6ff',
    canManage: [
      'Streams real-time patient cabin telemetry & detects anomalies',
      'Logs en route interventions (Oxygen, IV fluid, Intubation, Defibrillation)',
      'Records primary survey observations (GCS, Airway, Bleeding, Pain)',
      'Uploads point-of-care trauma images (FAST ultrasound, 12-lead ECG)',
      'Accepts or overrides algorithmic destination recommendations',
      'Dispatches instant pre-arrival alerts to receiving hospital ED'
    ],
    restricted: ['Cannot modify hospital ICU/ED bed inventory', 'Cannot inject highway traffic delays']
  },
  {
    role: 'ROLE_HOSPITAL_OPERATOR',
    name: 'Hospital ED Coordinator',
    context: 'Triage Nurse / Charge Coordinator',
    color: '#3fb950',
    canManage: [
      'Monitors and edits live ICU beds, trauma bays, OT theatres, ventilators, and CT scanners',
      'Receives real-time inbound pre-alert notifications with dynamic ETA countdowns',
      'Acknowledges incoming alerts to pre-mobilize trauma resuscitation teams and cath labs',
      'Reviews patient projected deterioration status at arrival'
    ],
    restricted: ['Cannot re-route ambulance', 'Cannot record field paramedic interventions']
  },
  {
    role: 'ROLE_CONTROL_ROOM',
    name: 'Control Room Dispatcher',
    context: 'Central Regional Dispatch Controller',
    color: '#d29922',
    canManage: [
      'Monitors entire regional ambulance fleet telemetry and corridor GPS positions',
      'Injects highway traffic congestion multipliers to re-evaluate ETA dynamics',
      'Triggers regional multi-criteria destination re-evaluation across all network hospitals',
      'Controls real-time simulation scenario speed (0.5x to 5.0x) and casualty stress testing'
    ],
    restricted: ['Cannot acknowledge hospital beds on behalf of emergency departments']
  },
  {
    role: 'ROLE_CLINICIAN_VIEWER',
    name: 'Clinician / Trauma Surgeon',
    context: 'Specialist Medical Oversight',
    color: '#bc8cff',
    canManage: [
      'Reviews multi-horizon vital forecasting (+5m, +15m, +30m at arrival)',
      'Inspects AI CNN feature extraction vectors on uploaded ultrasound and ECG images',
      'Audits clinical decision explanations and SHAP feature contributions',
      'Pre-orders emergency blood bank units and prepares surgical suites prior to patient touchdown'
    ],
    restricted: ['Read-only clinical observer; does not directly modify fleet logistics']
  },
  {
    role: 'ROLE_ADMIN',
    name: 'System Administrator',
    context: 'Full Platform Governance & Audit',
    color: '#f85149',
    canManage: [
      'Registers new clinical and paramedic staff accounts with role assignments',
      'Configures hospital accreditations (Trauma Level 1-4, Cath Lab, Stroke Center, Helipad)',
      'Inspects immutable regulatory audit trails with cryptographic hash verification',
      'Full override capabilities across all platform simulation controls and fleet registries'
    ],
    restricted: ['Unrestricted platform superuser authority']
  }
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [matrixOpen, setMatrixOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
  const activeRole: string = (user.roles && user.roles.find((r: string) => r.startsWith('ROLE_'))) || user.roles?.[0] || 'ROLE_PARAMEDIC';

  const getRoleColor = (roleStr: string) => {
    if (roleStr.includes('PARAMEDIC')) return '#58a6ff';
    if (roleStr.includes('HOSPITAL')) return '#3fb950';
    if (roleStr.includes('CONTROL')) return '#d29922';
    if (roleStr.includes('CLINICIAN')) return '#bc8cff';
    if (roleStr.includes('ADMIN')) return '#f85149';
    return '#8b949e';
  };

  const getRoleDescriptor = (roleStr: string) => {
    if (roleStr.includes('PARAMEDIC')) return 'Field Cabin Crew & Emergency Responder';
    if (roleStr.includes('HOSPITAL')) return 'Hospital ED & Trauma Bay Coordinator';
    if (roleStr.includes('CONTROL')) return 'Central Regional Fleet Controller';
    if (roleStr.includes('CLINICIAN')) return 'Trauma Specialist & Surgeon Oversight';
    if (roleStr.includes('ADMIN')) return 'Platform Governance & Administrator';
    return 'Emergency Healthcare Identity';
  };

  const activeNavSections = getAllNavSections(activeRole);

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: 250,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: 250,
            boxSizing: 'border-box',
            backgroundColor: '#0d1117',
            borderRight: '1px solid #30363d',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }
        }}
      >
        {/* User Role Card */}
        <Box sx={{ p: 2, borderBottom: '1px solid #30363d', backgroundColor: 'rgba(22, 27, 34, 0.85)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, letterSpacing: 0.5, fontSize: '0.65rem' }}>
              AUTHENTICATED IDENTITY
            </Typography>
            <Chip
              label={activeRole.replace('ROLE_', '')}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.62rem',
                fontWeight: 700,
                backgroundColor: `${getRoleColor(activeRole)}22`,
                color: getRoleColor(activeRole),
                border: `1px solid ${getRoleColor(activeRole)}55`
              }}
            />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.fullName || user.username || 'Healthcare Professional'}
          </Typography>
          <Typography variant="caption" sx={{ color: getRoleColor(activeRole), display: 'block', fontSize: '0.70rem', fontWeight: 600 }}>
            {getRoleDescriptor(activeRole)}
          </Typography>
          {user.email && (
            <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', fontSize: '0.65rem', mt: 0.3 }}>
              {user.email}
            </Typography>
          )}
        </Box>

        {/* Navigation Sections */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, py: 1 }}>
          {activeNavSections.map((sec, idx) => (
            <Box key={sec.title} sx={{ mb: 1.5 }}>
              <Box sx={{ px: 2, pt: 1, pb: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700, fontSize: '0.66rem', letterSpacing: 0.5 }}>
                  {sec.title}
                </Typography>
                <Typography variant="caption" sx={{ color: getRoleColor(activeRole), fontSize: '0.60rem', fontWeight: 600 }}>
                  {sec.roleTag}
                </Typography>
              </Box>
              <List disablePadding>
                {sec.items.map((item) => {
                  const isSelected = location.pathname === item.path;
                  return (
                    <ListItem key={item.path} disablePadding>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => navigate(item.path)}
                        sx={{
                          my: 0.3,
                          mx: 1,
                          py: 0.7,
                          borderRadius: 1.5,
                          '&.Mui-selected': {
                            backgroundColor: `${getRoleColor(activeRole)}20`,
                            color: getRoleColor(activeRole),
                            '&:hover': {
                              backgroundColor: `${getRoleColor(activeRole)}30`
                            },
                            '& .MuiListItemIcon-root': {
                              color: getRoleColor(activeRole)
                            }
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(177, 186, 196, 0.1)'
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: isSelected ? getRoleColor(activeRole) : '#8b949e', minWidth: 36 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.82rem',
                            fontWeight: isSelected ? 600 : 400
                          }}
                        />
                        {item.badge && (
                          <Chip
                            label={item.badge}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.58rem',
                              backgroundColor: 'rgba(139, 148, 158, 0.15)',
                              color: '#8b949e'
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
              {idx < activeNavSections.length - 1 && <Divider sx={{ borderColor: '#21262d', mx: 2, mt: 1 }} />}
            </Box>
          ))}
        </Box>

        {/* Bottom: Quick SOS & Privilege Matrix Buttons */}
        <Box sx={{ p: 1.5, borderTop: '1px solid #30363d', backgroundColor: '#161b22', display: 'flex', flexDirection: 'column', gap: 1 }}>

          <Button
            fullWidth
            variant="contained"
            size="small"
            onClick={() => window.open('/sos', '_blank')}
            sx={{
              fontSize: '0.72rem',
              backgroundColor: 'rgba(218, 54, 51, 0.2)',
              color: '#f85149',
              border: '1px solid #da3633',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': {
                backgroundColor: '#da3633',
                color: '#fff'
              }
            }}
          >
            📱 Citizen Mobile SOS Portal
          </Button>

          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<SecurityIcon />}
            onClick={() => setMatrixOpen(true)}
            sx={{
              fontSize: '0.72rem',
              color: '#58a6ff',
              borderColor: 'rgba(88, 166, 255, 0.4)',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Role Privilege Matrix
          </Button>
        </Box>
      </Drawer>

      {/* Role Privilege Matrix Dialog */}
      <Dialog
        open={matrixOpen}
        onClose={() => setMatrixOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            color: '#c9d1d9'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #30363d' }}>
          <SecurityIcon sx={{ color: '#58a6ff' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
            LifeFlow AI — Role-Based Access Control (RBAC) & Privilege Matrix
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
            Every user in LifeFlow AI is mapped to a strict healthcare operational identity. Below is the full breakdown of who each user is in real life, what actions and data they can manage, and their authorization boundaries.
          </Typography>

          <TableContainer component={Paper} sx={{ backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#161b22' }}>
                <TableRow>
                  <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Role & Identity</TableCell>
                  <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Operational Context</TableCell>
                  <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>What Data & Actions They Manage</TableCell>
                  <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>System Boundaries</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rolePrivileges.map((rp) => (
                  <TableRow key={rp.role} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Chip
                        label={rp.name}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          backgroundColor: `${rp.color}22`,
                          color: rp.color,
                          border: `1px solid ${rp.color}55`,
                          mb: 0.5,
                          display: 'flex'
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#8b949e', display: 'block' }}>
                        {rp.role}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: '#c9d1d9', verticalAlign: 'top', fontSize: '0.82rem' }}>
                      {rp.context}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.8rem', color: '#c9d1d9' }}>
                        {rp.canManage.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: '0.78rem', color: '#f85149' }}>
                        {rp.restricted.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #30363d', p: 2 }}>
          <Button onClick={() => setMatrixOpen(false)} variant="contained" color="primary">
            Close Matrix
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
