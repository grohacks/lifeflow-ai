import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, LinearProgress, Button,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, Divider,
  Alert, Tab, Tabs, Stack, Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import FlightIcon from '@mui/icons-material/Flight';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { hospitalApi } from '../services/api';
import { wsService } from '../services/websocket';
import { Hospital } from '../types';

export const HospitalTwinPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHosp, setSelectedHosp] = useState<Hospital | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Edit Single Resource Modal
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editResourceType, setEditResourceType] = useState('ICU_BEDS');
  const [editValue, setEditValue] = useState(2);

  // Provision Resource Modal (on existing hospital)
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [provResourceType, setProvResourceType] = useState('MRI_SCANNERS');
  const [provTotal, setProvTotal] = useState(2);
  const [provAvail, setProvAvail] = useState(1);
  const [provTtl, setProvTtl] = useState(300);

  // Add New Hospital Modal
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Form state for new hospital
  const [hospName, setHospName] = useState('Apollo Spectra Trauma Center');
  const [hospCode, setHospCode] = useState('HOSP-ASTC-01');
  const [hospAddress, setHospAddress] = useState('144 Outer Ring Road, Indiranagar, Bengaluru');
  const [hospLat, setHospLat] = useState(12.9784);
  const [hospLon, setHospLon] = useState(77.6408);
  const [hospTraumaLevel, setHospTraumaLevel] = useState('LEVEL_1');
  const [hospPhone, setHospPhone] = useState('+91 80 4567 8900');

  // Relations & Accreditations
  const [hasCathLab, setHasCathLab] = useState(true);
  const [hasStrokeCenter, setHasStrokeCenter] = useState(true);
  const [hasBurnUnit, setHasBurnUnit] = useState(false);
  const [hasHelipad, setHasHelipad] = useState(true);
  const [hasPediatricIcu, setHasPediatricIcu] = useState(true);

  // Initial Resources Allocation
  const [icuTotal, setIcuTotal] = useState(16);
  const [icuAvail, setIcuAvail] = useState(5);
  const [edTotal, setEdTotal] = useState(40);
  const [edAvail, setEdAvail] = useState(12);
  const [otTotal, setOtTotal] = useState(8);
  const [otAvail, setOtAvail] = useState(3);
  const [ventTotal, setVentTotal] = useState(12);
  const [ventAvail, setVentAvail] = useState(6);
  const [ctTotal, setCtTotal] = useState(2);
  const [ctAvail, setCtAvail] = useState(1);
  const [mriTotal, setMriTotal] = useState(2);
  const [mriAvail, setMriAvail] = useState(1);
  const [bloodUnits, setBloodUnits] = useState(45);
  const [traumaSurgeons, setTraumaSurgeons] = useState(2);
  const [cardiologists, setCartiologists] = useState(1);
  const [neurologists, setNeurologists] = useState(1);

  useEffect(() => {
    loadHospitals();

    const unsub = wsService.subscribe('/topic/hospital-resources', () => {
      loadHospitals();
    });

    return () => unsub();
  }, []);

  const loadHospitals = () => {
    hospitalApi.getAll().then((data) => {
      // Filter only active hospitals
      setHospitals((data || []).filter((h: Hospital) => h.active !== false));
    }).catch(console.error);
  };

  const openEdit = (hosp: Hospital, resourceType: string, currentVal: number) => {
    setSelectedHosp(hosp);
    setEditResourceType(resourceType);
    setEditValue(currentVal);
    setEditDialogOpen(true);
  };

  const handleSaveResource = async () => {
    if (!selectedHosp) return;
    try {
      await hospitalApi.updateResource(selectedHosp.id, editResourceType, editValue);
      setEditDialogOpen(false);
      loadHospitals();
    } catch (e: any) {
      alert('Error updating resource: ' + e.message);
    }
  };

  const openProvision = (hosp: Hospital) => {
    setSelectedHosp(hosp);
    setProvResourceType('MRI_SCANNERS');
    setProvTotal(2);
    setProvAvail(1);
    setProvTtl(300);
    setProvisionDialogOpen(true);
  };

  const handleSaveProvision = async () => {
    if (!selectedHosp) return;
    try {
      await hospitalApi.provisionResource(selectedHosp.id, {
        resourceType: provResourceType,
        totalCapacity: provTotal,
        availableCount: provAvail,
        freshnessTtlSeconds: provTtl
      });
      setProvisionDialogOpen(false);
      loadHospitals();
    } catch (e: any) {
      alert('Error provisioning resource: ' + e.message);
    }
  };

  const handleCreateHospital = async () => {
    setCreateSubmitting(true);
    setCreateError(null);

    const resourceList = [
      { resourceType: 'ICU_BEDS', totalCapacity: icuTotal, availableCount: icuAvail },
      { resourceType: 'ED_BEDS', totalCapacity: edTotal, availableCount: edAvail },
      { resourceType: 'OT_THEATRES', totalCapacity: otTotal, availableCount: otAvail },
      { resourceType: 'VENTILATORS', totalCapacity: ventTotal, availableCount: ventAvail },
      { resourceType: 'CT_SCANNERS', totalCapacity: ctTotal, availableCount: ctAvail },
      { resourceType: 'MRI_SCANNERS', totalCapacity: mriTotal, availableCount: mriAvail },
      { resourceType: 'BLOOD_BANK_UNITS', totalCapacity: 60, availableCount: bloodUnits },
      { resourceType: 'TRAUMA_SURGEON', totalCapacity: 4, availableCount: traumaSurgeons },
      { resourceType: 'CARDIOLOGIST', totalCapacity: 3, availableCount: cardiologists },
      { resourceType: 'NEUROLOGIST', totalCapacity: 3, availableCount: neurologists }
    ];

    try {
      await hospitalApi.create({
        name: hospName,
        hospitalCode: hospCode,
        address: hospAddress,
        latitude: hospLat,
        longitude: hospLon,
        traumaLevel: hospTraumaLevel,
        hasCathLab,
        hasStrokeCenter,
        hasBurnUnit,
        hasHelipad,
        hasPediatricIcu,
        contactPhone: hospPhone,
        active: true,
        resources: resourceList
      });

      setCreateSuccess(`Hospital ${hospName} [${hospCode}] registered and all resources provisioned!`);
      setTimeout(() => {
        setCreateSuccess(null);
        setCreateDialogOpen(false);
        loadHospitals();
      }, 1500);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create hospital');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeactivate = async (hosp: Hospital) => {
    if (!window.confirm(`Are you sure you want to deactivate ${hosp.name} from the regional network? Active ambulance routes will be recalculated.`)) {
      return;
    }
    try {
      await hospitalApi.deactivate(hosp.id);
      loadHospitals();
    } catch (e: any) {
      alert('Error deactivating hospital: ' + e.message);
    }
  };

  const user = JSON.parse(localStorage.getItem('lifeflow_user') || '{}');
  const roles: string[] = user.roles || ['ROLE_PARAMEDIC'];
  const isAdmin = roles.some((r: string) => r.includes('ADMIN'));
  const isHospitalOperator = roles.some((r: string) => r === 'ROLE_HOSPITAL_OPERATOR');
  const canManageHospital = isAdmin || isHospitalOperator;

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocalHospitalIcon sx={{ color: '#3fb950', fontSize: 30 }} />
            Regional Hospital Network & Digital Twins
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5 }}>
            Real-Time Resource Telemetry • Specialty Accreditations • Dynamic ETA & Bed Capacity Allocation
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {canManageHospital && (
            <Button
              variant="contained"
              color="success"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => {
                // Generate a randomized sample code to make multiple additions easy
                const rnd = Math.floor(100 + Math.random() * 900);
                setHospCode(`HOSP-NEW-${rnd}`);
                setHospName(`City Metro Trauma Center ${rnd}`);
                setCreateDialogOpen(true);
              }}
              sx={{ fontWeight: 700, textTransform: 'none', px: 2, py: 1, backgroundColor: '#238636' }}
            >
              + Add Hospital & Provision Resources
            </Button>
          )}

          {isAdmin ? (
            <Chip
              icon={<LocalHospitalIcon />}
              label="System Administrator: Full Network Provisioning Authorized"
              color="primary"
              size="small"
              sx={{ fontWeight: 600, backgroundColor: 'rgba(31, 111, 235, 0.2)', border: '1px solid #1f6feb', color: '#58a6ff' }}
            />
          ) : isHospitalOperator ? (
            <Chip
              icon={<LocalHospitalIcon />}
              label="Hospital ED Coordinator: Resource Management Authorized"
              color="success"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ) : (
            <Chip
              label="🔒 Read-Only (Administrator or ED Coordinator Role Required to Add/Edit)"
              size="small"
              sx={{ backgroundColor: 'rgba(210, 153, 34, 0.15)', color: '#d29922', border: '1px solid rgba(210, 153, 34, 0.4)', fontWeight: 600 }}
            />
          )}
        </Box>
      </Box>

      {/* Hospital Cards Grid */}
      <Grid container spacing={3}>
        {hospitals.map((h) => {
          const icuRes = h.resources?.find((r) => r.resourceType === 'ICU_BEDS');
          const edRes = h.resources?.find((r) => r.resourceType === 'ED_BEDS');
          const otRes = h.resources?.find((r) => r.resourceType === 'OT_THEATRES');
          const ventRes = h.resources?.find((r) => r.resourceType === 'VENTILATORS');
          const ctRes = h.resources?.find((r) => r.resourceType === 'CT_SCANNERS');
          const mriRes = h.resources?.find((r) => r.resourceType === 'MRI_SCANNERS');
          const bloodRes = h.resources?.find((r) => r.resourceType === 'BLOOD_BANK_UNITS');
          const traumaSurgRes = h.resources?.find((r) => r.resourceType === 'TRAUMA_SURGEON');
          const cardioRes = h.resources?.find((r) => r.resourceType === 'CARDIOLOGIST');
          const neuroRes = h.resources?.find((r) => r.resourceType === 'NEUROLOGIST');

          const isStale = h.resources?.some((r) => r.stale);
          const icuAvailCount = icuRes?.availableCount ?? 0;
          const edAvailCount = edRes?.availableCount ?? 0;
          const otAvailCount = otRes?.availableCount ?? 0;

          return (
            <Grid item xs={12} md={6} lg={4} key={h.id}>
              <Card
                sx={{
                  backgroundColor: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'border-color 0.2s ease-in-out',
                  '&:hover': { borderColor: '#58a6ff' }
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1 }}>
                  {/* Title & Trauma Level */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc', lineHeight: 1.2 }}>
                        {h.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8b949e' }}>
                        {h.hospitalCode} • {h.address}
                      </Typography>
                      {h.contactPhone && (
                        <Typography variant="caption" sx={{ color: '#58a6ff', display: 'block' }}>
                          📞 {h.contactPhone}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={h.traumaLevel.replace('_', ' ')}
                      size="small"
                      color={h.traumaLevel === 'LEVEL_1' ? 'error' : h.traumaLevel === 'LEVEL_2' ? 'warning' : 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  {/* Accreditations & Relations Row */}
                  <Box sx={{ display: 'flex', gap: 0.8, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={isStale ? 'DATA STALE' : 'EHR SYNC: LIVE'}
                      size="small"
                      color={isStale ? 'warning' : 'success'}
                      variant="outlined"
                    />
                    {h.hasCathLab && (
                      <Chip
                        icon={<FavoriteIcon sx={{ fontSize: '14px !important', color: '#f85149' }} />}
                        label="Cath Lab"
                        size="small"
                        sx={{ backgroundColor: 'rgba(248, 81, 73, 0.15)', color: '#ff7b72', border: '1px solid rgba(248, 81, 73, 0.3)' }}
                      />
                    )}
                    {h.hasStrokeCenter && (
                      <Chip
                        icon={<PsychologyIcon sx={{ fontSize: '14px !important', color: '#bc8cff' }} />}
                        label="Stroke Ctr"
                        size="small"
                        sx={{ backgroundColor: 'rgba(188, 140, 255, 0.15)', color: '#bc8cff', border: '1px solid rgba(188, 140, 255, 0.3)' }}
                      />
                    )}
                    {h.hasBurnUnit && (
                      <Chip
                        icon={<WhatshotIcon sx={{ fontSize: '14px !important', color: '#d29922' }} />}
                        label="Burn Unit"
                        size="small"
                        sx={{ backgroundColor: 'rgba(210, 153, 34, 0.15)', color: '#e3b341', border: '1px solid rgba(210, 153, 34, 0.3)' }}
                      />
                    )}
                    {h.hasHelipad && (
                      <Chip
                        icon={<FlightIcon sx={{ fontSize: '14px !important', color: '#58a6ff' }} />}
                        label="Helipad"
                        size="small"
                        sx={{ backgroundColor: 'rgba(88, 166, 255, 0.15)', color: '#58a6ff', border: '1px solid rgba(88, 166, 255, 0.3)' }}
                      />
                    )}
                    {h.hasPediatricIcu && (
                      <Chip
                        icon={<ChildCareIcon sx={{ fontSize: '14px !important', color: '#3fb950' }} />}
                        label="PICU"
                        size="small"
                        sx={{ backgroundColor: 'rgba(63, 185, 80, 0.15)', color: '#56d364', border: '1px solid rgba(63, 185, 80, 0.3)' }}
                      />
                    )}
                  </Box>

                  {/* Resource Gauges */}
                  <Box sx={{ mb: 2 }}>
                    {/* ICU Capacity */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#c9d1d9' }}>
                        ICU Beds (Avail / Total):
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: icuAvailCount === 0 ? '#f85149' : icuAvailCount < 2 ? '#d29922' : '#3fb950'
                          }}
                        >
                          {icuAvailCount} / {icuRes?.totalCapacity || 10}
                        </Typography>
                        {canManageHospital && (
                          <Tooltip title="Update ICU Beds">
                            <IconButton size="small" onClick={() => openEdit(h, 'ICU_BEDS', icuAvailCount)} sx={{ p: 0.2 }}>
                              <EditIcon sx={{ fontSize: 14, color: '#3fb950' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={((icuRes?.totalCapacity ? (icuRes.totalCapacity - icuAvailCount) / icuRes.totalCapacity : 0)) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#21262d',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: icuAvailCount === 0 ? '#f85149' : '#58a6ff'
                        }
                      }}
                    />
                  </Box>

                  {/* ED Load */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#c9d1d9' }}>
                        Emergency Dept Bays (Avail / Total):
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#3fb950' }}>
                          {edAvailCount} / {edRes?.totalCapacity || 30}
                        </Typography>
                        {canManageHospital && (
                          <Tooltip title="Update ED load">
                            <IconButton size="small" onClick={() => openEdit(h, 'ED_BEDS', edAvailCount)} sx={{ p: 0.2 }}>
                              <EditIcon sx={{ fontSize: 14, color: '#3fb950' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={((edRes?.totalCapacity ? (edRes.totalCapacity - edAvailCount) / edRes.totalCapacity : 0)) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#21262d',
                        '& .MuiLinearProgress-bar': { backgroundColor: '#3fb950' }
                      }}
                    />
                  </Box>

                  {/* Specialty Readiness Matrix */}
                  <Box sx={{ pt: 1, borderTop: '1px solid #21262d' }}>
                    <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mb: 1, fontWeight: 600 }}>
                      CLINICAL SPECIALTY & DIAGNOSTICS READINESS
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: otAvailCount > 0 ? '#3fb950' : '#f85149', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          • Operating Rooms: {otAvailCount} Avail
                          {canManageHospital && (
                            <EditIcon
                              onClick={() => openEdit(h, 'OT_THEATRES', otAvailCount)}
                              sx={{ fontSize: 12, cursor: 'pointer', color: '#8b949e', '&:hover': { color: '#3fb950' } }}
                            />
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: (ventRes?.availableCount || 0) > 0 ? '#3fb950' : '#f85149', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          • Ventilators: {ventRes?.availableCount || 0} Avail
                          {canManageHospital && (
                            <EditIcon
                              onClick={() => openEdit(h, 'VENTILATORS', ventRes?.availableCount || 0)}
                              sx={{ fontSize: 12, cursor: 'pointer', color: '#8b949e', '&:hover': { color: '#3fb950' } }}
                            />
                          )}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: (ctRes?.availableCount || 0) > 0 ? '#3fb950' : '#f85149' }}>
                          • CT Scanner: {(ctRes?.availableCount || 0) > 0 ? `${ctRes?.availableCount} Operational` : 'Off-Line'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: (mriRes?.availableCount || 0) > 0 ? '#3fb950' : '#8b949e' }}>
                          • MRI Scanner: {(mriRes?.availableCount || 0) > 0 ? `${mriRes?.availableCount} Operational` : 'Not Configured'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: '#c9d1d9' }}>
                          • Blood Units: {bloodRes?.availableCount ?? 35} Units
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" sx={{ color: (traumaSurgRes?.availableCount || 0) > 0 ? '#3fb950' : '#d29922' }}>
                          • Trauma Surgeon: {(traumaSurgRes?.availableCount || 0) > 0 ? `${traumaSurgRes?.availableCount} On Duty` : 'On Call'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Actions Footer */}
                  {canManageHospital && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PlaylistAddIcon />}
                        onClick={() => openProvision(h)}
                        sx={{ fontSize: 11, borderColor: '#30363d', color: '#58a6ff', textTransform: 'none' }}
                      >
                        + Provision Resource
                      </Button>

                      {isAdmin && (
                        <Tooltip title="Deactivate facility from regional network">
                          <IconButton size="small" onClick={() => handleDeactivate(h)} sx={{ color: '#f85149' }}>
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ========================================================================= */}
      {/* ADD NEW HOSPITAL DIALOG                                                   */}
      {/* ========================================================================= */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !createSubmitting && setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ backgroundColor: '#0d1117', borderBottom: '1px solid #30363d', color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalHospitalIcon sx={{ color: '#3fb950' }} />
          Register New Regional Hospital & Provision Required Clinical Resources
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 2 }}>
          {createError && (
            <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(248, 81, 73, 0.1)', color: '#ff7b72', border: '1px solid #f85149' }}>
              {createError}
            </Alert>
          )}
          {createSuccess && (
            <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(63, 185, 80, 0.1)', color: '#3fb950', border: '1px solid #3fb950' }}>
              {createSuccess}
            </Alert>
          )}

          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              mb: 3,
              borderBottom: '1px solid #30363d',
              '& .MuiTab-root': { color: '#8b949e', textTransform: 'none', fontWeight: 600 },
              '& .Mui-selected': { color: '#58a6ff' },
              '& .MuiTabs-indicator': { backgroundColor: '#58a6ff' }
            }}
          >
            <Tab label="1. Facility Identity & Location" />
            <Tab label="2. Specialized Centers & Relations" />
            <Tab label="3. Clinical Resources & Capacities" />
          </Tabs>

          {/* TAB 0: Facility Identity */}
          {activeTab === 0 && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Hospital Name"
                    value={hospName}
                    onChange={(e) => setHospName(e.target.value)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Hospital Code (Unique)"
                    value={hospCode}
                    onChange={(e) => setHospCode(e.target.value.toUpperCase())}
                    helperText="e.g. HOSP-ASTC-01"
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: '#8b949e' }}>Trauma Accreditation Level</InputLabel>
                    <Select
                      value={hospTraumaLevel}
                      label="Trauma Accreditation Level"
                      onChange={(e) => setHospTraumaLevel(e.target.value)}
                      sx={{ color: '#f0f6fc' }}
                    >
                      <MenuItem value="LEVEL_1">Level 1 (Comprehensive Regional Trauma Center)</MenuItem>
                      <MenuItem value="LEVEL_2">Level 2 (Major Trauma Center)</MenuItem>
                      <MenuItem value="LEVEL_3">Level 3 (Community Emergency & Resuscitation)</MenuItem>
                      <MenuItem value="LEVEL_4">Level 4 (Basic Emergency Life Support)</MenuItem>
                      <MenuItem value="COMMUNITY">Community General Hospital</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Phone"
                    value={hospPhone}
                    onChange={(e) => setHospPhone(e.target.value)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Physical Address"
                value={hospAddress}
                onChange={(e) => setHospAddress(e.target.value)}
                sx={{ input: { color: '#f0f6fc' } }}
              />

              <Box sx={{ p: 2, border: '1px solid #30363d', borderRadius: 1.5, backgroundColor: '#0d1117' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f6fc' }}>
                    GIS Geolocation Coordinates (Lat/Lng)
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<MyLocationIcon />}
                    onClick={() => {
                      setHospLat(12.9716 + (Math.random() - 0.5) * 0.05);
                      setHospLon(77.5946 + (Math.random() - 0.5) * 0.05);
                    }}
                    sx={{ textTransform: 'none', color: '#58a6ff' }}
                  >
                    Set Within Incident Radius
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Latitude"
                      value={hospLat}
                      onChange={(e) => setHospLat(parseFloat(e.target.value) || 0)}
                      inputProps={{ step: '0.0001' }}
                      sx={{ input: { color: '#f0f6fc' } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Longitude"
                      value={hospLon}
                      onChange={(e) => setHospLon(parseFloat(e.target.value) || 0)}
                      inputProps={{ step: '0.0001' }}
                      sx={{ input: { color: '#f0f6fc' } }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          )}

          {/* TAB 1: Specialized Centers & Relations */}
          {activeTab === 1 && (
            <Stack spacing={2}>
              <Typography variant="body2" sx={{ color: '#8b949e', mb: 1 }}>
                Configure specialized emergency clinical facilities and relations. The multi-criteria decision engine (MCDA) uses these accreditations to route specific conditions (e.g. STEMI, Acute Ischemic Stroke, Severe Burns).
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
                <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <FormControlLabel
                    control={<Checkbox checked={hasCathLab} onChange={(e) => setHasCathLab(e.target.checked)} sx={{ color: '#f85149', '&.Mui-checked': { color: '#f85149' } }} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>Cardiac Cath Lab (PCI)</Typography>
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>Percutaneous coronary intervention for active STEMI myocardial infarction</Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <FormControlLabel
                    control={<Checkbox checked={hasStrokeCenter} onChange={(e) => setHasStrokeCenter(e.target.checked)} sx={{ color: '#bc8cff', '&.Mui-checked': { color: '#bc8cff' } }} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>Comprehensive Stroke Center</Typography>
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>Rapid neurovascular thrombolysis and mechanical endovascular thrombectomy</Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <FormControlLabel
                    control={<Checkbox checked={hasBurnUnit} onChange={(e) => setHasBurnUnit(e.target.checked)} sx={{ color: '#d29922', '&.Mui-checked': { color: '#d29922' } }} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>Specialized Burn Unit</Typography>
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>Fluid resuscitation and sterile grafting suites for severe inhalation/flame trauma</Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <FormControlLabel
                    control={<Checkbox checked={hasHelipad} onChange={(e) => setHasHelipad(e.target.checked)} sx={{ color: '#58a6ff', '&.Mui-checked': { color: '#58a6ff' } }} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>Rooftop Emergency Helipad</Typography>
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>Accepts direct air ambulance aeromedical medevac transfers</Typography>
                      </Box>
                    }
                  />
                </Paper>

                <Paper sx={{ p: 2, backgroundColor: '#0d1117', border: '1px solid #30363d' }}>
                  <FormControlLabel
                    control={<Checkbox checked={hasPediatricIcu} onChange={(e) => setHasPediatricIcu(e.target.checked)} sx={{ color: '#3fb950', '&.Mui-checked': { color: '#3fb950' } }} />}
                    label={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#f0f6fc' }}>Pediatric ICU (PICU)</Typography>
                        <Typography variant="caption" sx={{ color: '#8b949e' }}>Specialized neonatal and pediatric emergency critical care resuscitation</Typography>
                      </Box>
                    }
                  />
                </Paper>
              </Box>
            </Stack>
          )}

          {/* TAB 2: Clinical Resources & Capacities */}
          {activeTab === 2 && (
            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ color: '#8b949e' }}>
                Allocate initial total capacity and current available inventory for all required emergency department resources.
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #30363d', borderRadius: 1.5, backgroundColor: '#0d1117' }}>
                    <Typography variant="subtitle2" sx={{ color: '#58a6ff', fontWeight: 700, mb: 1.5 }}>
                      Critical Care Beds (ICU)
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Total Capacity"
                          value={icuTotal}
                          onChange={(e) => setIcuTotal(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Available Now"
                          value={icuAvail}
                          onChange={(e) => setIcuAvail(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #30363d', borderRadius: 1.5, backgroundColor: '#0d1117' }}>
                    <Typography variant="subtitle2" sx={{ color: '#3fb950', fontWeight: 700, mb: 1.5 }}>
                      Emergency Dept (ED) Bays
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Total Capacity"
                          value={edTotal}
                          onChange={(e) => setEdTotal(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Available Now"
                          value={edAvail}
                          onChange={(e) => setEdAvail(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #30363d', borderRadius: 1.5, backgroundColor: '#0d1117' }}>
                    <Typography variant="subtitle2" sx={{ color: '#bc8cff', fontWeight: 700, mb: 1.5 }}>
                      Operating Theatres (OR)
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Total Theatres"
                          value={otTotal}
                          onChange={(e) => setOtTotal(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Available Now"
                          value={otAvail}
                          onChange={(e) => setOtAvail(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, border: '1px solid #30363d', borderRadius: 1.5, backgroundColor: '#0d1117' }}>
                    <Typography variant="subtitle2" sx={{ color: '#e3b341', fontWeight: 700, mb: 1.5 }}>
                      Mechanical Ventilators
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Total Ventilators"
                          value={ventTotal}
                          onChange={(e) => setVentTotal(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          label="Available Now"
                          value={ventAvail}
                          onChange={(e) => setVentAvail(parseInt(e.target.value) || 0)}
                          sx={{ input: { color: '#f0f6fc' } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="CT Scanners Operational"
                    value={ctAvail}
                    onChange={(e) => setCtAvail(parseInt(e.target.value) || 0)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="MRI Scanners Operational"
                    value={mriAvail}
                    onChange={(e) => setMriAvail(parseInt(e.target.value) || 0)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Blood Bank Units Stocked"
                    value={bloodUnits}
                    onChange={(e) => setBloodUnits(parseInt(e.target.value) || 0)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Trauma Surgeons On Duty"
                    value={traumaSurgeons}
                    onChange={(e) => setTraumaSurgeons(parseInt(e.target.value) || 0)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Cardiologists On Duty"
                    value={cardiologists}
                    onChange={(e) => setCartiologists(parseInt(e.target.value) || 0)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Neurologists On Duty"
                    value={neurologists}
                    onChange={(e) => setNeurologists(parseInt(e.target.value) || 0)}
                    sx={{ input: { color: '#f0f6fc' } }}
                  />
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ backgroundColor: '#0d1117', borderTop: '1px solid #30363d', p: 2.5, justifyContent: 'space-between' }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: '#8b949e' }}>
            Cancel
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeTab > 0 && (
              <Button onClick={() => setActiveTab((prev) => prev - 1)} sx={{ color: '#c9d1d9' }}>
                Previous
              </Button>
            )}
            {activeTab < 2 ? (
              <Button variant="outlined" onClick={() => setActiveTab((prev) => prev + 1)}>
                Next: {activeTab === 0 ? 'Relations & Accreditations' : 'Resource Allocation'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                disabled={createSubmitting}
                onClick={handleCreateHospital}
                sx={{ fontWeight: 700, px: 3, backgroundColor: '#238636' }}
              >
                {createSubmitting ? 'Registering & Provisioning...' : 'Register Hospital & Provision Resources'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* PROVISION ADDITIONAL RESOURCE DIALOG (EXISTING HOSPITAL)                 */}
      {/* ========================================================================= */}
      <Dialog
        open={provisionDialogOpen}
        onClose={() => setProvisionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d' } }}
      >
        <DialogTitle sx={{ backgroundColor: '#0d1117', color: '#f0f6fc' }}>
          Provision Additional Resource Pool: {selectedHosp?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
            Add or expand a specific clinical department resource for facility <strong>{selectedHosp?.hospitalCode}</strong>.
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#8b949e' }}>Resource Type</InputLabel>
              <Select
                value={provResourceType}
                label="Resource Type"
                onChange={(e) => setProvResourceType(e.target.value)}
                sx={{ color: '#f0f6fc' }}
              >
                <MenuItem value="ICU_BEDS">ICU Beds (Intensive Care)</MenuItem>
                <MenuItem value="ED_BEDS">Emergency Department Bays</MenuItem>
                <MenuItem value="OT_THEATRES">Operating Theatres (Surgical Suites)</MenuItem>
                <MenuItem value="VENTILATORS">Mechanical Ventilators</MenuItem>
                <MenuItem value="CT_SCANNERS">CT Scanners (Diagnostic)</MenuItem>
                <MenuItem value="MRI_SCANNERS">MRI Scanners (Magnetic Resonance)</MenuItem>
                <MenuItem value="BLOOD_BANK_UNITS">Blood Bank Units</MenuItem>
                <MenuItem value="ECMO_MACHINE">ECMO Extracorporeal Membrane Oxygenation</MenuItem>
                <MenuItem value="HYPERBARIC_CHAMBER">Hyperbaric Oxygen Chamber</MenuItem>
                <MenuItem value="ISOLATION_BAY">Negative Pressure Isolation Bay</MenuItem>
                <MenuItem value="TRAUMA_SURGEON">Trauma Surgeon On-Duty</MenuItem>
                <MenuItem value="CARDIOLOGIST">Interventional Cardiologist</MenuItem>
                <MenuItem value="NEUROLOGIST">Neurovascular Specialist</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Total Quota / Capacity"
                  value={provTotal}
                  onChange={(e) => setProvTotal(parseInt(e.target.value) || 0)}
                  sx={{ input: { color: '#f0f6fc' } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Available Now"
                  value={provAvail}
                  onChange={(e) => setProvAvail(parseInt(e.target.value) || 0)}
                  sx={{ input: { color: '#f0f6fc' } }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              type="number"
              label="Freshness TTL (seconds)"
              value={provTtl}
              onChange={(e) => setProvTtl(parseInt(e.target.value) || 300)}
              helperText="EHR sync expiration window (default 300s = 5m)"
              sx={{ input: { color: '#f0f6fc' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#0d1117', p: 2 }}>
          <Button onClick={() => setProvisionDialogOpen(false)} sx={{ color: '#8b949e' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveProvision} sx={{ backgroundColor: '#238636' }}>
            Provision & Broadcast
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* QUICK EDIT SINGLE RESOURCE DIALOG                                         */}
      {/* ========================================================================= */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        PaperProps={{ sx: { backgroundColor: '#161b22', border: '1px solid #30363d' } }}
      >
        <DialogTitle sx={{ backgroundColor: '#0d1117', color: '#f0f6fc' }}>
          Update Resource: {editResourceType.replace('_', ' ')} ({selectedHosp?.name})
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 2 }}>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
            Simulate dynamic resource change to verify real-time digital twin and destination re-evaluation.
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Available Capacity"
            value={editValue}
            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
            sx={{ input: { color: '#f0f6fc' } }}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#0d1117', p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: '#8b949e' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveResource} sx={{ backgroundColor: '#238636' }}>
            Save & Reevaluate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
