import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Chip, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Alert, CircularProgress, LinearProgress
} from '@mui/material';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import WifiIcon from '@mui/icons-material/Wifi';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import { deviceApi } from '../services/api';

const REGISTERED_MEDICAL_DEVICES = [
  { id: 1, name: 'Mindray BeneView T8', type: 'Multi-Parameter Patient Monitor', protocol: 'HL7 v2.6 over MLLP/TCP', port: '2575', status: 'STREAMING', quality: 0.98, rate: '1.0 Hz' },
  { id: 2, name: 'Philips IntelliVue MX800', type: 'Continuous ICU/Ambulance Monitor', protocol: 'IEEE 11073-20601 / UDP', port: '4001', status: 'STREAMING', quality: 0.95, rate: '2.0 Hz' },
  { id: 3, name: 'Zoll X-Series Defibrillator', type: 'Defibrillator & 12-Lead ECG', protocol: 'Bluetooth LE GATT Profile', port: 'BLE-00:1A:7D', status: 'STREAMING', quality: 0.92, rate: '0.5 Hz' },
  { id: 4, name: 'Welch Allyn Propaq CS', type: 'Vital Signs Monitor (NIBP/Temp)', protocol: 'Modbus RTU / RS-232 Serial', port: 'COM3', status: 'STANDBY', quality: 0.88, rate: '0.2 Hz' },
  { id: 5, name: 'Masimo Radical-7', type: 'Pulse CO-Oximeter (SpO2 / SpHb)', protocol: 'Bluetooth LE GATT (0x180D)', port: 'BLE-00:1B:44', status: 'STREAMING', quality: 0.99, rate: '1.0 Hz' },
];

export const DeviceManagementPage: React.FC = () => {
  const [devices, setDevices] = useState<any[]>(REGISTERED_MEDICAL_DEVICES);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <DevicesOtherIcon sx={{ color: '#58a6ff', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              Device Management & Edge Sensing Gateway
            </Typography>
            <Typography variant="body2" sx={{ color: '#8b949e' }}>
              Hardware Telemetry Ingestion, HL7/IEEE Protocols, and Physical Mobile Sensing Hub
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => setLoading(true)}
            sx={{ borderColor: '#30363d', color: '#c9d1d9' }}
          >
            Refresh Devices
          </Button>
        </Box>
      </Box>

      {/* Critical Regulatory Disclaimer */}
      <Alert
        severity="info"
        sx={{
          mb: 3,
          backgroundColor: 'rgba(56, 139, 253, 0.1)',
          border: '1px solid rgba(56, 139, 253, 0.4)',
          color: '#c9d1d9'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#58a6ff' }}>
          REGULATORY NON-MEDICAL DEVICE DISCLAIMER:
        </Typography>
        <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.5 }}>
          The native Android LifeFlow application acts strictly as an <strong>edge logistics and communication gateway</strong> (relaying GPS, vehicle motion dynamics, device power state, and secure camera documentation). Physiological vital signs (ECG, SpO2, Blood Pressure) are acquired exclusively from certified hospital/ambulance telemetry equipment via standardized protocols (HL7, IEEE 11073, BLE GATT). The phone itself does not perform medical diagnosis.
        </Typography>
      </Alert>

      {/* Mobile Sensing Gateway State Card */}
      <Typography variant="subtitle2" sx={{ color: '#8b949e', fontWeight: 700, mb: 1, letterSpacing: 0.5 }}>
        PRIMARY PHYSICAL SENSING GATEWAY (ANDROID EDGE NODE)
      </Typography>

      <Card sx={{ mb: 3, border: '1px solid #30363d', backgroundColor: '#161b22' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <SmartphoneIcon sx={{ color: '#3fb950', fontSize: 32 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                    AMB-01 Mobile Gateway
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8b949e' }}>
                    Android 14 (API 34) • App v1.0.0
                  </Typography>
                </Box>
              </Box>
              <Chip
                label="MQTT GATEWAY: CONNECTED"
                size="small"
                sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950', fontWeight: 700, fontSize: '0.65rem', border: '1px solid #3fb950' }}
              />
            </Grid>

            {/* GPS Telemetry */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <GpsFixedIcon sx={{ color: '#58a6ff', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>GPS POSITIONING</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                12.9716° N, 77.5946° E
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                Speed: 46.2 km/h • Bearing: 84° • Acc: ±2.4m
              </Typography>
            </Grid>

            {/* Battery & Charging */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <BatteryChargingFullIcon sx={{ color: '#3fb950', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>POWER SUBSYSTEM</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                87% (Fast Charging - USB-PD)
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                Thermal: 31.4°C • Battery Health: Good
              </Typography>
            </Grid>

            {/* Motion Dynamics */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <SpeedIcon sx={{ color: '#d29922', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: '#8b949e', fontWeight: 700 }}>MOTION & VIBRATION</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#d29922' }}>
                IN_VEHICLE (SMOOTH PAVEMENT)
              </Typography>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>
                Accel RMS: 0.18g • Gyro Drift: Nominal
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Certified Medical Devices Registry */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ color: '#8b949e', fontWeight: 700, letterSpacing: 0.5 }}>
          CLINICAL MEDICAL DEVICE INTERFACES (HL7 / IEEE 11073 / BLE GATT)
        </Typography>
        <Typography variant="caption" sx={{ color: '#8b949e' }}>
          5 Hardware Interfaces Active
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#0d1117' }}>
            <TableRow>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Medical Device Name</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Clinical Category</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Interface Protocol</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Port / Address</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Streaming Frequency</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>Signal Quality</TableCell>
              <TableCell sx={{ color: '#f0f6fc', fontWeight: 700, textAlign: 'right' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((d) => (
              <TableRow key={d.id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' } }}>
                <TableCell sx={{ color: '#f0f6fc', fontWeight: 700 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalInformationIcon sx={{ color: '#58a6ff', fontSize: 18 }} />
                    {d.name}
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#c9d1d9' }}>{d.type}</TableCell>
                <TableCell sx={{ color: '#bc8cff', fontSize: '0.8rem' }}>{d.protocol}</TableCell>
                <TableCell sx={{ color: '#8b949e', fontSize: '0.78rem' }}>{d.port}</TableCell>
                <TableCell sx={{ color: '#d29922', fontWeight: 600 }}>{d.rate}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={d.quality * 100}
                      sx={{
                        width: 60,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#21262d',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#3fb950' }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 700 }}>
                      {Math.round(d.quality * 100)}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Chip
                    label={d.status}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: d.status === 'STREAMING' ? 'rgba(63, 185, 80, 0.2)' : 'rgba(139, 148, 158, 0.2)',
                      color: d.status === 'STREAMING' ? '#3fb950' : '#8b949e',
                      border: `1px solid ${d.status === 'STREAMING' ? '#3fb950' : '#30363d'}`
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
