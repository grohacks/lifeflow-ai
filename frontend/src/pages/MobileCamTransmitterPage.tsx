import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid, Chip,
  Alert, Stack, Slider, IconButton, Paper, Divider, FormControl, Select, MenuItem
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import SensorsIcon from '@mui/icons-material/Sensors';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LockIcon from '@mui/icons-material/Lock';
import { patientApi } from '../services/api';
import { wsService } from '../services/websocket';

export const MobileCamTransmitterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCaseId = searchParams.get('caseId');
  const [activeCases, setActiveCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(urlCaseId || 'CASE-318948');
  const [customCaseInput, setCustomCaseInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  useEffect(() => {
    if (urlCaseId && urlCaseId !== selectedCaseId) {
      setSelectedCaseId(urlCaseId);
    }
  }, [urlCaseId]);

  useEffect(() => {
    patientApi.getActiveCases().then((cases) => {
      if (cases && cases.length > 0) {
        setActiveCases(cases);
        if (!urlCaseId) {
          // Find the most relevant emergency case (prefer RED or the latest case)
          const targetCase = cases.find((c: any) => c.triageCategory === 'RED') || cases[cases.length - 1] || cases[0];
          setSelectedCaseId(targetCase.caseId);
          setSearchParams({ caseId: targetCase.caseId }, { replace: true });
        }
      }
    }).catch((err) => console.warn('Could not load active cases on mobile:', err));
  }, []);

  const caseId = selectedCaseId;

  // Step 1: Vitals state
  const [spo2, setSpo2] = useState<number>(92);
  const [heartRate, setHeartRate] = useState<number>(114);
  const [systolicBp, setSystolicBp] = useState<number>(100);
  const [diastolicBp, setDiastolicBp] = useState<number>(65);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(24);
  const [vitalsSentStatus, setVitalsSentStatus] = useState<string | null>(null);
  const [transmittingVitals, setTransmittingVitals] = useState(false);

  // Step 2: Camera Stream state
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [streamFps, setStreamFps] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  // Check if current context is secure (HTTPS or localhost)
  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || window.location.protocol === 'https:');
  const httpsUrl = `https://${window.location.hostname}:${window.location.port || '5173'}/mobile-cam`;

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Transmit vitals to LifeFlow
  const handleTransmitVitals = async (customVitals?: { spo2: number; hr: number; sys: number; dia: number; rr: number }) => {
    setTransmittingVitals(true);
    setVitalsSentStatus(null);

    const s = customVitals ? customVitals.spo2 : spo2;
    const h = customVitals ? customVitals.hr : heartRate;
    const sys = customVitals ? customVitals.sys : systolicBp;
    const dia = customVitals ? customVitals.dia : diastolicBp;
    const rr = customVitals ? customVitals.rr : respiratoryRate;

    try {
      await patientApi.injectVitals(caseId, {
        spo2: s,
        heartRate: h,
        systolicBp: sys,
        diastolicBp: dia,
        respiratoryRate: rr,
        notes: `Transmitted live from Android mobile sensor: SpO2 ${s}%, HR ${h} bpm`
      });
      setVitalsSentStatus(`✓ Vitals Sent: SpO2 ${s}%, HR ${h} bpm, BP ${sys}/${dia} mmHg. LifeFlow Digital Twin updated!`);
    } catch (err: any) {
      setVitalsSentStatus(`Error sending telemetry: ${err.message}`);
    } finally {
      setTransmittingVitals(false);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        `Mobile Security Notice: Android Chrome requires HTTPS to allow live camera streaming. Please open this page via HTTPS: ${httpsUrl} (tap 'Advanced' ➔ 'Proceed'). Or use the 'Snap Photo with Camera' button below.`
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsStreaming(true);

      // Offscreen canvas for frame extraction
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      let framesSent = 0;
      const intervalMs = 100; // ~10-12 FPS for smooth latency over WebSocket

      timerRef.current = setInterval(() => {
        if (!videoRef.current || videoRef.current.readyState !== 4) return;
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, 480, 360);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);

        framesSent++;
        setFrameCount(framesSent);
        setStreamFps(10);

        // Publish live frame over WebSocket to LifeFlow
        wsService.publish(`/app/camera-stream/${caseId}`, {
          frame: dataUrl,
          timestamp: Date.now(),
          sender: 'ANDROID_PHONE',
          facingMode: facingMode
        });
      }, intervalMs);

    } catch (err: any) {
      setCameraError(`Camera error: ${err.message || 'Permission denied. Please ensure camera access is allowed in Chrome.'}`);
      setIsStreaming(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setStreamFps(0);

    // Notify LifeFlow console that stream stopped
    wsService.publish(`/app/camera-stream/${caseId}`, {
      stopped: true,
      timestamp: Date.now()
    });
  };

  // Switch between rear and front camera
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isStreaming) {
      stopCamera();
      setTimeout(() => startCamera(), 200);
    }
  };

  // High-Res Single Snap transmission to LifeFlow Holding Tray (from live stream)
  const handleSnapAndSendHighRes = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const highResDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      wsService.publish(`/app/camera-stream/${caseId}`, {
        isSnap: true,
        highResSnap: highResDataUrl,
        timestamp: Date.now()
      });

      alert('📸 High-Res Photo captured and sent to LifeFlow Holding Tray on your PC!');
    }
  };

  // State for snap upload
  const [uploadingSnap, setUploadingSnap] = useState(false);
  const [snapFeedback, setSnapFeedback] = useState<string | null>(null);

  // Resize and compress high-res phone camera photos (e.g. 15MB down to ~120KB)
  const compressImage = (file: File): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            canvas.toBlob((blob) => resolve({ blob: blob!, dataUrl }), 'image/jpeg', 0.75);
          } else {
            resolve({ blob: file, dataUrl: e.target?.result as string });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Native phone camera snap (works on both HTTP and HTTPS)
  const handleNativeCameraSnap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSnap(true);
    setSnapFeedback('Optimizing & transmitting photo to LifeFlow PC Tray...');

    try {
      const { blob, dataUrl } = await compressImage(file);

      // 1. Direct reliable HTTP multipart upload to backend
      const formData = new FormData();
      formData.append('file', blob, 'camera_snap.jpg');
      await patientApi.uploadSnap(caseId, formData);

      // 2. Also publish over STOMP WebSocket as secondary sync
      wsService.publish(`/app/camera-stream/${caseId}`, {
        isSnap: true,
        highResSnap: dataUrl,
        timestamp: Date.now()
      });

      setSnapFeedback('✓ Photo captured & successfully added to LifeFlow Holding Tray on PC!');
    } catch (err: any) {
      setSnapFeedback(`Error uploading snap: ${err.message}`);
    } finally {
      setUploadingSnap(false);
      e.target.value = '';
    }
  };

  return (
    <Box sx={{ maxWidth: 650, mx: 'auto', p: 2, pb: 6 }}>
      {/* Header Bar */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#f0f6fc', display: 'flex', alignItems: 'center', gap: 1 }}>
              <VideocamIcon sx={{ color: '#58a6ff' }} /> LifeFlow Mobile Field Transmitter
            </Typography>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              Connected Case: <strong>{caseId}</strong> • Android Device Link
            </Typography>
          </Box>
          <Chip
            label={wsService.isConnected() ? 'ONLINE' : 'LINKED'}
            color={wsService.isConnected() ? 'success' : 'default'}
            size="small"
          />
        </Box>

        {/* Mobile Patient Case Switcher */}
        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #30363d' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
            <Typography variant="caption" sx={{ color: '#58a6ff', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 800, fontSize: '0.72rem', letterSpacing: 0.5 }}>
              🎯 ACTIVE PATIENT CASE TO TREAT:
            </Typography>
            <Button
              size="small"
              onClick={() => setShowManualInput(!showManualInput)}
              sx={{ color: '#8b949e', fontSize: '0.68rem', textTransform: 'none', minWidth: 'auto', p: 0 }}
            >
              {showManualInput ? 'Choose from list' : 'Type custom ID'}
            </Button>
          </Box>

          {showManualInput ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="e.g. CASE-318948"
                value={customCaseInput}
                onChange={(e) => setCustomCaseInput(e.target.value)}
                sx={{
                  backgroundColor: '#0d1117',
                  '& .MuiInputBase-input': { color: '#f0f6fc', fontSize: 13, py: 1 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f6feb' }
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  if (customCaseInput.trim()) {
                    const id = customCaseInput.trim();
                    setSelectedCaseId(id);
                    setSearchParams({ caseId: id });
                    setShowManualInput(false);
                  }
                }}
                sx={{ backgroundColor: '#1f6feb', textTransform: 'none', fontWeight: 700 }}
              >
                Set
              </Button>
            </Box>
          ) : (
            <FormControl fullWidth size="small">
              <Select
                value={activeCases.some(c => c.caseId === caseId) ? caseId : (activeCases[0]?.caseId || caseId)}
                onChange={(e) => {
                  const newId = e.target.value as string;
                  setSelectedCaseId(newId);
                  setSearchParams({ caseId: newId });
                }}
                sx={{
                  backgroundColor: '#0d1117',
                  color: '#f0f6fc',
                  fontSize: 13,
                  fontWeight: 700,
                  height: 38,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1f6feb' }
                }}
              >
                {activeCases.map((c) => (
                  <MenuItem key={c.caseId} value={c.caseId}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                      <Chip
                        label={c.triageCategory || 'RED'}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 10,
                          fontWeight: 800,
                          backgroundColor: c.triageCategory === 'YELLOW' ? 'rgba(210, 153, 34, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                          color: c.triageCategory === 'YELLOW' ? '#d29922' : '#f85149'
                        }}
                      />
                      <strong style={{ color: '#58a6ff' }}>{c.caseId}</strong>
                      <span style={{ color: '#c9d1d9', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.chiefComplaint ? `(${c.chiefComplaint})` : (c.patientIdentifier || 'Emergency Patient')}
                      </span>
                    </Box>
                  </MenuItem>
                ))}
                {!activeCases.some(c => c.caseId === caseId) && (
                  <MenuItem value={caseId}>
                    <strong style={{ color: '#58a6ff' }}>{caseId}</strong> (Active Target)
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      {/* HTTPS Recommendation Banner if on HTTP */}
      {!isSecure && (
        <Alert
          severity="warning"
          icon={<LockIcon fontSize="inherit" />}
          sx={{ mb: 2, backgroundColor: 'rgba(210, 153, 34, 0.15)', borderColor: '#d29922', color: '#e3b341', fontSize: '0.82rem' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            HTTPS Required for Live Camera Stream
          </Typography>
          Mobile Chrome restricts live video streaming over plain HTTP. Tap below to switch to HTTPS:
          <Button
            size="small"
            variant="contained"
            color="warning"
            href={httpsUrl}
            sx={{ mt: 1, display: 'block', textTransform: 'none', fontWeight: 700 }}
          >
            🔒 Switch to HTTPS: {httpsUrl}
          </Button>
          <Typography variant="caption" sx={{ color: '#8b949e', display: 'block', mt: 0.5 }}>
            (When Chrome warns 'Connection is not private', tap <strong>Advanced ➔ Proceed to 192.168.0.105</strong>)
          </Typography>
        </Alert>
      )}

      {/* STEP 1: SENSE & TRANSMIT VITALS */}
      <Card sx={{ mb: 2.5, backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <SensorsIcon sx={{ color: '#3fb950' }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
              STEP 1: Sense & Transmit Vitals Data
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
            Simulate or read vitals from Android sensor / pulse oximeter and push directly to LifeFlow:
          </Typography>

          {/* 1-Tap Quick Presets */}
          <Typography variant="caption" sx={{ color: '#c9d1d9', fontWeight: 600, display: 'block', mb: 1 }}>
            Quick Sense Presets:
          </Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setSpo2(98); setHeartRate(74); setSystolicBp(120); setDiastolicBp(80); setRespiratoryRate(16);
                  handleTransmitVitals({ spo2: 98, hr: 74, sys: 120, dia: 80, rr: 16 });
                }}
                sx={{ borderColor: '#238636', color: '#3fb950', fontSize: '0.75rem', p: 0.8 }}
              >
                🟢 Normal (98%)
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setSpo2(91); setHeartRate(114); setSystolicBp(100); setDiastolicBp(65); setRespiratoryRate(24);
                  handleTransmitVitals({ spo2: 91, hr: 114, sys: 100, dia: 65, rr: 24 });
                }}
                sx={{ borderColor: '#d29922', color: '#d29922', fontSize: '0.75rem', p: 0.8 }}
              >
                🟡 Trauma (91%)
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setSpo2(87); setHeartRate(132); setSystolicBp(85); setDiastolicBp(55); setRespiratoryRate(30);
                  handleTransmitVitals({ spo2: 87, hr: 132, sys: 85, dia: 55, rr: 30 });
                }}
                sx={{ borderColor: '#f85149', color: '#f85149', fontSize: '0.75rem', p: 0.8 }}
              >
                🔴 Hypoxic (87%)
              </Button>
            </Grid>
          </Grid>

          {/* Fine-tune Sliders */}
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#0d1117', borderRadius: 1.5, border: '1px solid #30363d' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>Oxygen Saturation (SpO2)</Typography>
              <Typography variant="caption" sx={{ color: spo2 < 90 ? '#f85149' : '#3fb950', fontWeight: 700 }}>
                {spo2}%
              </Typography>
            </Box>
            <Slider
              value={spo2}
              min={70}
              max={100}
              onChange={(_, v) => setSpo2(v as number)}
              size="small"
              sx={{ color: spo2 < 90 ? '#f85149' : '#3fb950' }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#8b949e' }}>Heart Rate (Pulse)</Typography>
              <Typography variant="caption" sx={{ color: '#58a6ff', fontWeight: 700 }}>
                {heartRate} bpm
              </Typography>
            </Box>
            <Slider
              value={heartRate}
              min={40}
              max={180}
              onChange={(_, v) => setHeartRate(v as number)}
              size="small"
              sx={{ color: '#58a6ff' }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="success"
            disabled={transmittingVitals}
            onClick={() => handleTransmitVitals()}
            startIcon={<MonitorHeartIcon />}
            sx={{ fontWeight: 700 }}
          >
            {transmittingVitals ? 'Transmitting Telemetry...' : '⚡ Transmit Vitals to LifeFlow'}
          </Button>

          {vitalsSentStatus && (
            <Alert severity="success" sx={{ mt: 1.5, backgroundColor: 'rgba(63,185,80,0.1)', color: '#3fb950', fontSize: '0.82rem' }}>
              {vitalsSentStatus}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* STEP 2: LIVE CAMERA STREAM */}
      <Card sx={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: 2 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VideocamIcon sx={{ color: isStreaming ? '#f85149' : '#58a6ff' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
                STEP 2: Live Camera Stream to LifeFlow
              </Typography>
            </Box>
            {isStreaming && (
              <Chip
                label="LIVE STREAMING"
                color="error"
                size="small"
                sx={{ fontWeight: 700, animation: 'pulse 1.5s infinite' }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
            Opens your phone camera and streams video directly into LifeFlow on your computer:
          </Typography>

          {/* Viewfinder Container */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              minHeight: 240,
              maxHeight: 320,
              backgroundColor: '#0d1117',
              borderRadius: 2,
              border: `2px solid ${isStreaming ? '#f85149' : '#30363d'}`,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isStreaming ? 'block' : 'none'
              }}
            />

            {!isStreaming && (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <CameraAltIcon sx={{ fontSize: 50, color: '#8b949e', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#c9d1d9', fontWeight: 600 }}>
                  Camera Viewfinder Idle
                </Typography>
                <Typography variant="caption" sx={{ color: '#8b949e' }}>
                  Tap 'Open Camera & Start Live Stream' below
                </Typography>
              </Box>
            )}

            {isStreaming && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f85149' }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>
                  REC • {frameCount} frames ({streamFps} FPS)
                </Typography>
              </Box>
            )}

            {isStreaming && (
              <IconButton
                onClick={toggleCameraFacing}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
                }}
              >
                <FlipCameraIosIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {cameraError && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
              {cameraError}
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack spacing={1.5}>
            {!isStreaming ? (
              <>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<VideocamIcon />}
                  onClick={startCamera}
                  sx={{ fontWeight: 700, py: 1.2 }}
                >
                  🔴 Open Camera & Start Live Stream to LifeFlow
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  component="label"
                  color="primary"
                  startIcon={<CameraAltIcon />}
                  sx={{ fontWeight: 600, py: 1 }}
                >
                  📸 Take Photo with Camera (Works on HTTP/HTTPS)
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    capture="environment"
                    onChange={handleNativeCameraSnap}
                  />
                </Button>
              </>
            ) : (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<VideocamOffIcon />}
                  onClick={stopCamera}
                  sx={{ fontWeight: 600 }}
                >
                  Stop Live Stream
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<CameraAltIcon />}
                  onClick={handleSnapAndSendHighRes}
                  sx={{ fontWeight: 700, py: 1 }}
                >
                  📸 Snap & Send High-Res Frame to LifeFlow Tray
                </Button>
              </>
            )}

            {snapFeedback && (
              <Alert
                severity={snapFeedback.startsWith('✓') ? 'success' : 'info'}
                sx={{
                  mt: 1,
                  backgroundColor: snapFeedback.startsWith('✓') ? 'rgba(63,185,80,0.1)' : 'rgba(56,139,253,0.1)',
                  color: snapFeedback.startsWith('✓') ? '#3fb950' : '#58a6ff',
                  fontSize: '0.82rem'
                }}
              >
                {snapFeedback}
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
