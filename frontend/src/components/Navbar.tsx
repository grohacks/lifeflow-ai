import React, { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Chip, IconButton, Tooltip, Button,
  Menu, MenuItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useNavigate } from 'react-router-dom';
import { healthApi } from '../services/api';
import { wsService } from '../services/websocket';
import { getPrimaryRole } from '../types';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(() => JSON.parse(localStorage.getItem('lifeflow_user') || '{}'));
  const [health, setHealth] = useState<any>(null);
  const [wsOnline, setWsOnline] = useState(wsService.isConnected());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const handleStorage = () => {
      setUser(JSON.parse(localStorage.getItem('lifeflow_user') || '{}'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const checkHealth = () => {
      healthApi.getHealth()
        .then((res) => setHealth(res))
        .catch(() => setHealth({ status: 'DEGRADED' }));
      setWsOnline(wsService.isConnected());
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('lifeflow_token');
    localStorage.removeItem('lifeflow_user');
    localStorage.removeItem('lifeflow_active_role_view');
    window.location.href = '/login';
  };

  const roleName = getPrimaryRole(user.roles);
  const getRoleBadgeColor = () => {
    if (roleName.includes('PARAMEDIC')) return '#58a6ff';
    if (roleName.includes('HOSPITAL')) return '#3fb950';
    if (roleName.includes('CONTROL')) return '#d29922';
    if (roleName.includes('CLINICIAN')) return '#bc8cff';
    if (roleName.includes('ADMIN')) return '#f85149';
    return '#8b949e';
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left: Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <HealthAndSafetyIcon sx={{ color: '#f85149', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.2 }}>
              LifeFlow AI
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              Predictive Emergency Healthcare Digital Twin
            </Typography>
          </Box>
        </Box>

        {/* Center: System Health & Disclaimer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={health?.components?.mysql === 'UP' ? 'MySQL 8.x: Online' : 'MySQL: Connecting...'}>
            <Chip
              label="MySQL"
              size="small"
              color={health?.components?.mysql === 'UP' ? 'success' : 'warning'}
              variant="outlined"
            />
          </Tooltip>

          <Tooltip title={wsOnline ? 'Live Telemetry Stream: Connected' : 'Live Stream: Connecting...'}>
            <Chip
              icon={wsOnline ? <WifiIcon /> : <WifiOffIcon />}
              label={wsOnline ? 'Live Stream' : 'Standby'}
              size="small"
              color={wsOnline ? 'success' : 'default'}
              sx={{ fontWeight: 600 }}
            />
          </Tooltip>

          <Chip
            label="DECISION SUPPORT ONLY — REQUIRES HUMAN CONFIRMATION"
            size="small"
            sx={{
              backgroundColor: 'rgba(210, 153, 34, 0.15)',
              color: '#d29922',
              fontWeight: 700,
              fontSize: '0.72rem',
              border: '1px solid rgba(210, 153, 34, 0.4)'
            }}
          />
        </Box>

        {/* Right: Real-time System Clock & User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<AccessTimeIcon sx={{ fontSize: '14px !important', color: '#58a6ff !important' }} />}
            label={`${currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })} • ${currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(22, 27, 34, 0.9)',
              color: '#c9d1d9',
              border: '1px solid #30363d',
              fontWeight: 600,
              fontSize: '0.78rem'
            }}
          />

          {user.username ? (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AccountCircleIcon />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  color: '#f0f6fc',
                  borderColor: getRoleBadgeColor(),
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                {user.fullName || user.username} ({user.roles?.[0]?.replace('ROLE_', '')})
              </Button>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    backgroundColor: '#161b22',
                    border: '1px solid #30363d',
                    color: '#c9d1d9',
                    minWidth: 260
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    Signed in as:
                  </Typography>
                  <Typography variant="body2" sx={{ color: getRoleBadgeColor(), fontWeight: 600 }}>
                    {user.roles?.[0]?.replace('ROLE_', '')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    {user.email}
                  </Typography>
                </Box>
                <Divider sx={{ borderColor: '#30363d' }} />
                <MenuItem onClick={handleLogout} sx={{ color: '#f85149' }}>
                  <ListItemIcon><LogoutIcon sx={{ color: '#f85149' }} fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Sign Out" />
                </MenuItem>
              </Menu>

              <Tooltip title="Sign Out">
                <IconButton onClick={handleLogout} sx={{ color: '#8b949e' }}>
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
