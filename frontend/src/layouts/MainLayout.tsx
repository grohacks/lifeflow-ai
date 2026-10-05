import React, { useState, useEffect, useRef } from 'react';
import { Box, Button, IconButton, Chip, Typography, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlaceIcon from '@mui/icons-material/Place';
import NavigationIcon from '@mui/icons-material/Navigation';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { wsService } from '../services/websocket';
import { EmergencyIncident, isHospitalRole } from '../types';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sosAlert, setSosAlert] = useState<EmergencyIncident | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  isMutedRef.current = isMuted;

  // Track already alerted and dismissed incident IDs to avoid repeated nagging
  const dismissedIdsRef = useRef<Set<number>>(new Set());
  const alertedIdsRef = useRef<Set<number>>(new Set());

  const [currentUser, setCurrentUser] = useState<any>(() => JSON.parse(localStorage.getItem('lifeflow_user') || '{}'));

  useEffect(() => {
    const handleStorage = () => {
      setCurrentUser(JSON.parse(localStorage.getItem('lifeflow_user') || '{}'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const roles: string[] = currentUser?.roles || [];
  const isHospitalStaff = isHospitalRole(roles);

  const sosAlertRef = useRef<EmergencyIncident | null>(null);
  sosAlertRef.current = sosAlert;
  const lastAlertTimeRef = useRef<number>(0);

  // Play zero-cost Web Audio alert chime
  const playEmergencyChime = () => {
    if (isMutedRef.current) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;

      // Tone 1: 880 Hz
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2: 1320 Hz
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Audio alert unavailable', e);
    }
  };

  // Auto-dismiss floating HUD if paramedic is actively on /incident-dispatch
  useEffect(() => {
    if (location.pathname.includes('/incident-dispatch') && sosAlert) {
      dismissedIdsRef.current.add(sosAlert.id);
      setSosAlert(null);
    }
  }, [location.pathname, sosAlert]);

  useEffect(() => {
    const handleIncomingIncident = (data: EmergencyIncident) => {
      if (!data || !data.id) return;

      // Hospital ED doctors & clinicians do not respond to accident scenes in ambulances
      const freshUser = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
      const freshRoles: string[] = freshUser?.roles || [];
      if (isHospitalRole(freshRoles)) {
        return;
      }

      // If status moved past ASSIGNED (e.g. EN_ROUTE_SCENE, ON_SCENE, CANCELLED), clear the alert
      if (data.status !== 'REPORTED' && data.status !== 'ASSIGNED') {
        dismissedIdsRef.current.add(data.id);
        if (sosAlertRef.current?.id === data.id) {
          setSosAlert(null);
        }
        return;
      }

      // If already dismissed by user, do not alert again
      if (dismissedIdsRef.current.has(data.id)) {
        return;
      }

      // If paramedic is actively on the incident dispatch screen, don't obstruct with redundant HUD
      if (window.location.pathname.includes('/incident-dispatch')) {
        dismissedIdsRef.current.add(data.id);
        alertedIdsRef.current.add(data.id);
        return;
      }

      const now = Date.now();
      // Debounce duplicate packet for the same exact incident within 1.5s
      if (now - lastAlertTimeRef.current < 1500 && sosAlertRef.current?.id === data.id) {
        return;
      }

      lastAlertTimeRef.current = now;
      alertedIdsRef.current.add(data.id);
      setSosAlert({ ...data });
      setIsMinimized(false);
      playEmergencyChime();
    };

    const unsub1 = wsService.subscribe('/topic/incidents', handleIncomingIncident);
    const unsub2 = wsService.subscribe('/topic/alerts', handleIncomingIncident);

    return () => {
      unsub1();
      unsub2();
    };
  }, []); // Mount only: never teardown and recreate on alert changes

  const handleRespondToScene = () => {
    if (!sosAlert) return;
    const targetIncident = sosAlert;
    dismissedIdsRef.current.add(targetIncident.id);
    alertedIdsRef.current.add(targetIncident.id);
    setSosAlert(null);
    navigate(`/incident-dispatch?incidentId=${targetIncident.id}&code=${targetIncident.incidentCode}`);
  };

  const handleDismissAlert = (id?: number) => {
    const targetId = id || sosAlert?.id;
    if (targetId) {
      dismissedIdsRef.current.add(targetId);
      alertedIdsRef.current.add(targetId);
    }
    setSosAlert(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0d1117' }}>
      <Navbar />

      {/* =========================================================================
          TACTICAL FLOATING EMERGENCY SOS DISPATCH HUD
          Fixed positioning right below Navbar, guaranteed never clipped or squeezed
          ========================================================================= */}
      {sosAlert && !isMinimized && !isHospitalStaff && (
        <Box
          key={sosAlert.id}
          sx={{
            position: 'fixed',
            top: '76px', // Clear 12px gap below 64px navbar - guaranteed no overlap
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'min(1280px, calc(100vw - 32px))',
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, rgba(32, 10, 14, 0.97) 0%, rgba(20, 12, 18, 0.98) 55%, rgba(13, 17, 23, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(248, 81, 73, 0.9)',
            borderRadius: '14px',
            p: { xs: 1.5, sm: 2 },
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85), 0 0 32px rgba(248, 81, 73, 0.45)',
            animation: 'hudDropIn 0.45s cubic-bezier(0.16, 1, 0.3, 1), ambientBeaconPulse 2s infinite alternate',
            '@keyframes hudDropIn': {
              '0%': { opacity: 0, transform: 'translate(-50%, -24px) scale(0.96)' },
              '70%': { transform: 'translate(-50%, 3px) scale(1.008)' },
              '100%': { opacity: 1, transform: 'translate(-50%, 0) scale(1)' }
            },
            '@keyframes ambientBeaconPulse': {
              '0%': {
                borderColor: 'rgba(248, 81, 73, 0.7)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85), 0 0 20px rgba(248, 81, 73, 0.3)'
              },
              '100%': {
                borderColor: 'rgba(255, 123, 114, 1)',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.85), 0 0 45px rgba(248, 81, 73, 0.7)'
              }
            }
          }}
        >
          {/* Animated scanning top beam */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              borderTopLeftRadius: '14px',
              borderTopRightRadius: '14px',
              background: 'linear-gradient(90deg, #da3633, #ff7b72, #f85149, #ff7b72, #da3633)',
              backgroundSize: '200% 100%',
              animation: 'scanBeam 3s linear infinite',
              '@keyframes scanBeam': {
                '0%': { backgroundPosition: '0% 0%' },
                '100%': { backgroundPosition: '200% 0%' }
              }
            }}
          />

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              gap: { xs: 1.5, md: 2 }
            }}
          >
            {/* Left & Middle: Siren + Details */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
              {/* Glowing Beacon Siren */}
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -6,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(248, 81, 73, 0.4)',
                    animation: 'sirenSonar 1.6s ease-out infinite',
                    '@keyframes sirenSonar': {
                      '0%': { transform: 'scale(0.85)', opacity: 0.9 },
                      '100%': { transform: 'scale(2.2)', opacity: 0 }
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'relative',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #f85149 0%, #da3633 100%)',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 16px rgba(248, 81, 73, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'sirenRotate 2s ease-in-out infinite alternate',
                    '@keyframes sirenRotate': {
                      '0%': { transform: 'rotate(-10deg) scale(0.96)' },
                      '100%': { transform: 'rotate(10deg) scale(1.05)' }
                    }
                  }}
                >
                  <NotificationsActiveIcon sx={{ color: '#ffffff', fontSize: 26 }} />
                </Box>
              </Box>

              {/* Incident Metadata & Information */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Top Line: Priority Badge, Incident Code, Dispatch Type, Casualty Count */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                  <Chip
                    label="🚨 CRITICAL DISPATCH P1"
                    size="small"
                    sx={{
                      backgroundColor: '#da3633',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.72rem',
                      letterSpacing: '0.5px',
                      height: 22,
                      boxShadow: '0 0 10px rgba(218, 54, 51, 0.6)'
                    }}
                  />
                  <Chip
                    label={sosAlert.incidentCode}
                    size="small"
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: 'rgba(210, 153, 34, 0.2)',
                      color: '#ffd33d',
                      border: '1px solid rgba(210, 153, 34, 0.5)',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      height: 22
                    }}
                  />
                  {sosAlert.description?.toUpperCase().includes('2G') || sosAlert.description?.toUpperCase().includes('SMS') ? (
                    <Chip
                      label="📱 OFFLINE 2G SMS SOS"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(56, 139, 253, 0.2)',
                        color: '#58a6ff',
                        border: '1px solid rgba(56, 139, 253, 0.5)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        height: 22
                      }}
                    />
                  ) : sosAlert.description?.toUpperCase().includes('VOICE') || sosAlert.description?.toUpperCase().includes('CALL') ? (
                    <Chip
                      label="📞 112 VOICE CALL SOS"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(63, 185, 80, 0.2)',
                        color: '#3fb950',
                        border: '1px solid rgba(63, 185, 80, 0.5)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        height: 22
                      }}
                    />
                  ) : (
                    <Chip
                      label={`🚨 ${sosAlert.incidentType.replace('_', ' ')}`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(248, 81, 73, 0.2)',
                        color: '#ff7b72',
                        border: '1px solid rgba(248, 81, 73, 0.5)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        height: 22
                      }}
                    />
                  )}
                  <Chip
                    label={`🚑 ${sosAlert.casualtyCount} Casualty`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#f0f6fc',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                  <Chip
                    label={`⚡ Unit: ${sosAlert.ambulanceCallSign || 'AMB-01'}`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(163, 113, 247, 0.2)',
                      color: '#bc8cff',
                      border: '1px solid rgba(163, 113, 247, 0.4)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 22
                    }}
                  />
                </Box>

                {/* Bottom Line: Exact Location & Clinical Condition */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <PlaceIcon sx={{ fontSize: 16, color: '#f85149', flexShrink: 0 }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#f0f6fc',
                      fontWeight: 600,
                      fontSize: '0.86rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {sosAlert.locationAddress || 'GPS Coordinates Provided (Near Vijayawada Expressway)'}
                    {sosAlert.description && (
                      <span style={{ color: '#8b949e', fontWeight: 400, marginLeft: 8 }}>
                        — {sosAlert.description}
                      </span>
                    )}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right: Tactical Action Deck (NEVER squished or clipped) */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                flexShrink: 0,
                width: { xs: '100%', md: 'auto' },
                justifyContent: { xs: 'flex-end', md: 'flex-start' }
              }}
            >
              {/* RESPOND TO SCENE Button with High-Impact Sonar Animation */}
              <Button
                variant="contained"
                size="medium"
                onClick={handleRespondToScene}
                endIcon={<NavigationIcon sx={{ transform: 'rotate(45deg)', fontSize: 18 }} />}
                sx={{
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '0.86rem',
                  letterSpacing: '0.6px',
                  px: 2.8,
                  py: 1,
                  borderRadius: '8px',
                  border: '1px solid #ff7b72',
                  textTransform: 'uppercase',
                  animation: 'btnSonarPulse 1.8s ease-in-out infinite',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  '@keyframes btnSonarPulse': {
                    '0%': {
                      boxShadow: '0 0 0 0 rgba(248, 81, 73, 0.8), 0 0 16px rgba(248, 81, 73, 0.6)'
                    },
                    '70%': {
                      boxShadow: '0 0 0 12px rgba(248, 81, 73, 0), 0 0 24px rgba(248, 81, 73, 0.8)'
                    },
                    '100%': {
                      boxShadow: '0 0 0 0 rgba(248, 81, 73, 0), 0 0 16px rgba(248, 81, 73, 0.6)'
                    }
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #ff7b72 0%, #da3633 100%)',
                    transform: 'scale(1.04)',
                    boxShadow: '0 0 28px rgba(248, 81, 73, 0.95)'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                RESPOND TO SCENE
              </Button>

              {/* Audio Mute/Unmute toggle */}
              <Tooltip title={isMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}>
                <IconButton
                  size="small"
                  onClick={() => setIsMuted(!isMuted)}
                  sx={{
                    color: isMuted ? '#8b949e' : '#ff7b72',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid #30363d',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
                  }}
                >
                  {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {/* Minimize to compact pill */}
              <Tooltip title="Minimize to Corner Pill">
                <IconButton
                  size="small"
                  onClick={() => setIsMinimized(true)}
                  sx={{
                    color: '#c9d1d9',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid #30363d',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' }
                  }}
                >
                  <ExpandLessIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Dismiss / Close */}
              <Tooltip title="Dismiss Alert">
                <IconButton
                  size="small"
                  onClick={() => handleDismissAlert(sosAlert.id)}
                  sx={{
                    color: '#8b949e',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid #30363d',
                    '&:hover': { color: '#f85149', backgroundColor: 'rgba(248, 81, 73, 0.15)', borderColor: '#f85149' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      )}

      {/* Minimized Floating Corner Badge */}
      {sosAlert && isMinimized && !isHospitalStaff && (
        <Box
          key={`min-${sosAlert.id}`}
          sx={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1,
            pl: 1.5,
            backgroundColor: 'rgba(28, 10, 14, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid #f85149',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 16px rgba(248, 81, 73, 0.5)',
            animation: 'hudDropIn 0.3s ease-out'
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#f85149',
              animation: 'pulseDot 1s infinite alternate',
              '@keyframes pulseDot': {
                '0%': { opacity: 0.4, transform: 'scale(0.8)' },
                '100%': { opacity: 1, transform: 'scale(1.2)' }
              }
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 800, color: '#f0f6fc', fontSize: '0.8rem' }}>
            🚨 {sosAlert.incidentCode}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleRespondToScene}
            sx={{
              backgroundColor: '#da3633',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.72rem',
              py: 0.3,
              px: 1.5,
              borderRadius: '16px',
              '&:hover': { backgroundColor: '#b62324' }
            }}
          >
            RESPOND
          </Button>
          <Tooltip title="Expand Emergency HUD">
            <IconButton size="small" onClick={() => setIsMinimized(false)} sx={{ color: '#c9d1d9', p: 0.3 }}>
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Dismiss Alert">
            <IconButton size="small" onClick={() => handleDismissAlert(sosAlert.id)} sx={{ color: '#8b949e', p: 0.3 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2.5,
            overflowY: 'auto',
            backgroundColor: '#090d13',
            color: '#c9d1d9'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
