import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import NavigationIcon from '@mui/icons-material/Navigation';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapIcon from '@mui/icons-material/Map';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LayersIcon from '@mui/icons-material/Layers';
import '../leaflet-custom.css';

// Fix leaflet default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom incident scene icon
const createSceneIcon = () =>
  L.divIcon({
    html: `
      <div style="
        background: #d29922;
        border: 2px solid #ffffff;
        border-radius: 6px;
        padding: 3px 6px;
        display: flex;
        align-items: center;
        gap: 3px;
        box-shadow: 0 0 10px rgba(210, 153, 34, 0.85);
        color: #ffffff;
        font-weight: 700;
        font-size: 11px;
        white-space: nowrap;
      ">
        📍 <span>Scene</span>
      </div>
    `,
    className: 'live-scene-pin',
    iconSize: [80, 24],
    iconAnchor: [40, 12],
  });

// Custom siren ambulance icon (Active Transit)
const createAmbulanceIcon = (heading = 0, isArrived = false, isStationary = false) => {
  if (isArrived) {
    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 42px;
          height: 42px;
          background: #238636;
          border: 3px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px rgba(35, 134, 54, 0.95);
          font-size: 20px;
        ">
          🏁
        </div>
      `,
      className: 'live-amb-arrived-pin',
      iconSize: [42, 42],
      iconAnchor: [21, 21],
    });
  }

  if (isStationary) {
    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 38px;
          height: 38px;
          background: #d29922;
          border: 3px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 14px rgba(210, 153, 34, 0.85);
          font-size: 18px;
          animation: pulse-scene 1.8s infinite;
        ">
          🚑
        </div>
        <style>
          @keyframes pulse-scene {
            0% { box-shadow: 0 0 0 0 rgba(210, 153, 34, 0.7); }
            70% { box-shadow: 0 0 0 12px rgba(210, 153, 34, 0); }
            100% { box-shadow: 0 0 0 0 rgba(210, 153, 34, 0); }
          }
        </style>
      `,
      className: 'live-amb-stationary-pin',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  }

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        background: #f85149;
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px rgba(248, 81, 73, 0.9);
        animation: pulse-siren 1.2s infinite;
        font-size: 18px;
        transform: rotate(${heading}deg);
      ">
        🚑
      </div>
      <style>
        @keyframes pulse-siren {
          0% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0.7); }
          70% { box-shadow: 0 0 0 12px rgba(248, 81, 73, 0); }
          100% { box-shadow: 0 0 0 0 rgba(248, 81, 73, 0); }
        }
      </style>
    `,
    className: 'live-amb-pin',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

// Custom hospital destination icon
const createHospitalIcon = (name: string, isArrived = false) =>
  L.divIcon({
    html: `
      <div style="
        background: ${isArrived ? '#238636' : '#1f6feb'};
        border: 3px solid #ffffff;
        border-radius: 8px;
        padding: 4px 8px;
        display: flex;
        align-items: center;
        gap: 4px;
        box-shadow: 0 0 14px ${isArrived ? 'rgba(35, 134, 54, 0.9)' : 'rgba(31, 111, 235, 0.8)'};
        color: #ffffff;
        font-weight: 700;
        font-size: 12px;
        white-space: nowrap;
      ">
        🏥 <span>${name}</span> ${isArrived ? '✓ DOCKED' : ''}
      </div>
    `,
    className: 'live-hosp-pin',
    iconSize: [130, 32],
    iconAnchor: [65, 16],
  });

// Tile layer providers
interface TileConfig {
  name: string;
  url: string;
  attribution: string;
  subdomains: string[];
  maxZoom: number;
}

const TILE_CONFIGS: Record<string, TileConfig> = {
  voyager: {
    name: 'Street Map (Carto)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
  },
  dark: {
    name: 'Dark Tactical',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: ['a', 'b', 'c', 'd'],
    maxZoom: 19,
  },
  osm: {
    name: 'Standard OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
  },
};

// Component to dynamically adjust map bounds & invalidate container sizing
const RecenterMap: React.FC<{
  startPos: [number, number];
  ambPos: [number, number];
  hospPos: [number, number];
  isStationary?: boolean;
  isArrived?: boolean;
  isAccepted?: boolean;
  resetTrigger?: number;
}> = ({ startPos, ambPos, hospPos, isStationary, isArrived, isAccepted, resetTrigger }) => {
  const map = useMap();
  const lastStateRef = useRef<string>('');

  // Sizing invalidation for modals and responsive layouts
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [map]);

  // Adjust camera view ONLY on state transitions or reset, NEVER on every 1-second coordinate tick!
  useEffect(() => {
    try {
      const currentState = isArrived ? 'ARRIVED' : isAccepted ? 'ACCEPTED' : 'STATIONARY';
      const stateChanged = lastStateRef.current !== currentState;
      lastStateRef.current = currentState;

      if (isArrived) {
        map.setView(hospPos, 15, { animate: true });
      } else if (isStationary) {
        map.setView(startPos, 14, { animate: true });
      } else if (isAccepted) {
        if (stateChanged || resetTrigger) {
          const bounds = L.latLngBounds([startPos, hospPos]);
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15, animate: true });
        }
      }
    } catch (e) {
      // safe fallback
    }
  }, [isStationary, isArrived, isAccepted, resetTrigger, hospPos[0], hospPos[1], startPos[0], startPos[1], map]);

  return null;
};

interface LiveApproachingMapProps {
  hospitalName?: string;
  hospitalLat?: number;
  hospitalLon?: number;
  initialAmbLat?: number;
  initialAmbLon?: number;
  vehicleNumber?: string;
  initialEtaMinutes?: number;
  height?: number | string;
  showControls?: boolean;
  isAccepted?: boolean;
  isArrived?: boolean;
  isPending?: boolean;
  onMarkArrived?: () => void;
}

export const LiveApproachingMap: React.FC<LiveApproachingMapProps> = ({
  hospitalName = 'Apex Regional Trauma & Specialty Center',
  hospitalLat = 12.9719,
  hospitalLon = 77.5937,
  initialAmbLat = 12.9352,
  initialAmbLon = 77.6245,
  vehicleNumber = 'AMB-01 (Medic One)',
  initialEtaMinutes = 8,
  height = 340,
  showControls = true,
  isAccepted = false,
  isArrived = false,
  isPending = false,
  onMarkArrived,
}) => {
  const hospPos: [number, number] = [hospitalLat, hospitalLon];
  const [progress, setProgress] = useState<number>(() => (isArrived ? 1.0 : isAccepted ? 0.08 : 0.0));
  const [isDriving, setIsDriving] = useState<boolean>(() => isAccepted && !isArrived);
  const [speedKmh, setSpeedKmh] = useState<number>(() => (isAccepted && !isArrived ? 56 : 0));
  const [resetCount, setResetCount] = useState<number>(0);
  const [mapStyleKey, setMapStyleKey] = useState<'voyager' | 'dark' | 'osm'>('voyager');

  // Sync state when acceptance / arrival props change
  useEffect(() => {
    if (isArrived) {
      setProgress(1.0);
      setIsDriving(false);
      setSpeedKmh(0);
    } else if (isAccepted) {
      setIsDriving(true);
      setProgress((p) => (p >= 0.98 || p === 0 ? 0.08 : p));
      setSpeedKmh(56);
    } else {
      // Stationary at scene
      setProgress(0.0);
      setIsDriving(false);
      setSpeedKmh(0);
    }
  }, [isAccepted, isArrived]);

  // Coordinate disparity protection:
  // If coordinates are cross-continental (> 1.5 degrees / ~160km away),
  // fallback to local metropolitan scene offset (~5.8 km from destination hospital)
  const isCrossContinental =
    Math.abs(initialAmbLat - hospitalLat) > 1.5 ||
    Math.abs(initialAmbLon - hospitalLon) > 1.5;

  const validAmbStartLat = isCrossContinental ? hospitalLat - 0.0458 : initialAmbLat;
  const validAmbStartLon = isCrossContinental ? hospitalLon - 0.0075 : initialAmbLon;
  const startPos: [number, number] = [validAmbStartLat, validAmbStartLon];

  // Compute interpolated ambulance position
  const ambLat = isArrived ? hospitalLat : validAmbStartLat + (hospitalLat - validAmbStartLat) * progress;
  const ambLon = isArrived ? hospitalLon : validAmbStartLon + (hospitalLon - validAmbStartLon) * progress;
  const ambPos: [number, number] = [ambLat, ambLon];

  // Remaining distance & ETA
  const remainingFraction = isArrived ? 0 : Math.max(0, 1 - progress);
  const remainingDistanceKm = isArrived ? 0.0 : Math.max(0.1, Number((5.8 * remainingFraction).toFixed(1)));
  const remainingEtaSec = isArrived ? 0 : Math.max(10, Math.round(initialEtaMinutes * 60 * remainingFraction));
  const etaMinutes = Math.floor(remainingEtaSec / 60);
  const etaSeconds = remainingEtaSec % 60;

  // Calculate heading angle from ambulance to hospital
  const heading = Math.atan2(hospitalLon - ambLon, hospitalLat - ambLat) * (180 / Math.PI);

  // Simulation loop for live navigation movement (runs ONLY when isDriving and not arrived)
  useEffect(() => {
    if (!isDriving || isArrived) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.98) {
          return 0.98; // Bay entrance
        }
        return prev + 0.007;
      });

      // Realistic speed fluctuation in green corridor
      setSpeedKmh(Math.floor(52 + Math.random() * 14));
    }, 1000);

    return () => clearInterval(interval);
  }, [isDriving, isArrived]);

  const handleReset = () => {
    setResetCount((c) => c + 1);
    if (isAccepted && !isArrived) {
      setProgress(0.08);
      setIsDriving(true);
    } else {
      setProgress(0.0);
      setIsDriving(false);
    }
  };

  const handleImmediateArrival = () => {
    if (onMarkArrived) {
      onMarkArrived();
    } else {
      setProgress(1.0);
      setIsDriving(false);
      setSpeedKmh(0);
    }
  };

  const isStationary = !isAccepted && !isArrived;
  const currentTileConfig = TILE_CONFIGS[mapStyleKey] || TILE_CONFIGS.voyager;

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid #30363d',
        backgroundColor: '#0d1117',
      }}
    >
      {/* HUD Overlay: Navigation Status & Telemetry */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: 'rgba(13, 17, 23, 0.94)',
            backdropFilter: 'blur(8px)',
            px: 1.5,
            py: 0.8,
            borderRadius: 2,
            border: '1px solid #30363d',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          <NavigationIcon
            sx={{
              color: isArrived ? '#3fb950' : isAccepted ? '#58a6ff' : '#d29922',
              fontSize: 20,
              transform: `rotate(${heading}deg)`,
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.8rem', lineHeight: 1.1 }}>
              {vehicleNumber} ➔ {hospitalName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isArrived ? '#3fb950' : isAccepted ? '#58a6ff' : '#d29922',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              {isArrived
                ? '✓ Ambulance Arrived & Docked at Trauma Bay'
                : isAccepted
                ? '🚨 Active Transit Corridor • Green Wave Priority'
                : isPending
                ? '⏳ Pre-Alert Dispatched • Awaiting Hospital Acceptance'
                : '📍 Stationary at Incident Scene • Standby'}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: 'rgba(13, 17, 23, 0.94)',
            backdropFilter: 'blur(8px)',
            px: 1.2,
            py: 0.6,
            borderRadius: 2,
            border: '1px solid #30363d',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SpeedIcon sx={{ color: isStationary ? '#8b949e' : '#3fb950', fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: isStationary ? '#8b949e' : '#3fb950', fontSize: '0.85rem' }}>
              {speedKmh} km/h
            </Typography>
          </Box>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#30363d' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.85rem' }}>
              {remainingDistanceKm} km
            </Typography>
          </Box>
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#30363d' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimerIcon sx={{ color: isArrived ? '#3fb950' : isAccepted ? '#f85149' : '#d29922', fontSize: 18 }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                color: isArrived ? '#3fb950' : isAccepted ? '#f85149' : '#d29922',
                fontSize: '0.88rem',
              }}
            >
              {isArrived
                ? 'ARRIVED'
                : isAccepted
                ? `ETA ${etaMinutes}m ${etaSeconds < 10 ? `0${etaSeconds}` : etaSeconds}s`
                : `Est. ETA ~${initialEtaMinutes}m`}
            </Typography>
          </Box>

          {/* Map Layer Style Switcher */}
          <Box sx={{ width: '1px', height: 16, backgroundColor: '#30363d', ml: 0.5 }} />
          <Tooltip title={`Map Style: ${currentTileConfig.name} (Click to switch)`}>
            <IconButton
              size="small"
              onClick={() =>
                setMapStyleKey((k) => (k === 'voyager' ? 'dark' : k === 'dark' ? 'osm' : 'voyager'))
              }
              sx={{ color: '#58a6ff', p: 0.4 }}
            >
              <LayersIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Leaflet Map with Guaranteed Sizing & Tile Overrides */}
      <MapContainer
        center={ambPos}
        zoom={14}
        style={{ width: '100%', height: '100%', backgroundColor: '#0d1117' }}
        zoomControl={false}
      >
        <TileLayer
          key={mapStyleKey}
          attribution={currentTileConfig.attribution}
          url={currentTileConfig.url}
          maxZoom={currentTileConfig.maxZoom}
          subdomains={currentTileConfig.subdomains}
        />

        {/* Incident Scene Marker */}
        <Marker position={startPos} icon={createSceneIcon()}>
          <Popup>
            <strong>📍 Incident Scene</strong>
            <br />
            Emergency Patient Origin
          </Popup>
        </Marker>

        {/* Dynamic Route Polyline (Planned Corridor) */}
        <Polyline
          positions={[startPos, ambPos, hospPos]}
          color={isAccepted ? '#388bfd' : '#8b949e'}
          weight={isAccepted ? 5 : 3}
          opacity={isAccepted ? 0.85 : 0.4}
          dashArray={isAccepted ? '8, 6' : '5, 8'}
        />

        {/* Traveled portion (Solid Green) */}
        {(progress > 0 || isArrived) && (
          <Polyline
            positions={[startPos, ambPos]}
            color="#238636"
            weight={6}
            opacity={0.9}
          />
        )}

        {/* Hospital Destination Marker */}
        <Marker position={hospPos} icon={createHospitalIcon(hospitalName, isArrived)}>
          <Popup>
            <strong>{hospitalName}</strong>
            <br />
            {isArrived ? 'Ambulance Docked at Resuscitation Bay' : 'Emergency Resuscitation Destination'}
          </Popup>
        </Marker>

        {/* Ambulance Marker */}
        <Marker position={ambPos} icon={createAmbulanceIcon(heading, isArrived, isStationary)}>
          <Popup>
            <strong>{vehicleNumber}</strong>
            <br />
            {isArrived
              ? 'Status: Safely Arrived at Emergency Bay'
              : isAccepted
              ? `Status: Approaching ED • Speed: ${speedKmh} km/h • Remaining: ${remainingDistanceKm} km`
              : 'Status: Stationary at Incident Scene'}
          </Popup>
        </Marker>

        <RecenterMap
          startPos={startPos}
          ambPos={ambPos}
          hospPos={hospPos}
          isStationary={isStationary}
          isArrived={isArrived}
          isAccepted={isAccepted}
          resetTrigger={resetCount}
        />
      </MapContainer>

      {/* Bottom Live Controls Overlay */}
      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            pointerEvents: 'none',
          }}
        >
          {/* Status Chip */}
          <Box sx={{ pointerEvents: 'auto' }}>
            {isStationary && (
              <Chip
                icon={<LocationOnIcon sx={{ fontSize: '15px !important', color: '#fff !important' }} />}
                label={isPending ? '⏳ Awaiting Hospital Acceptance' : '📍 Stationary at Scene'}
                size="small"
                sx={{
                  backgroundColor: isPending ? '#d29922' : '#58a6ff',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              />
            )}
            {isAccepted && !isArrived && (
              <Chip
                label="🚨 Transit En-Route to ED"
                size="small"
                sx={{
                  backgroundColor: '#238636',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              />
            )}
            {isArrived && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '15px !important', color: '#fff !important' }} />}
                label="🏁 Arrived at Trauma Bay"
                size="small"
                sx={{
                  backgroundColor: '#238636',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  border: '1px solid #3fb950',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}
              />
            )}
          </Box>

          {/* Quick Simulation & Arrival Actions */}
          <Box
            sx={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'rgba(13, 17, 23, 0.94)',
              backdropFilter: 'blur(8px)',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: '1px solid #30363d',
            }}
          >
            {/* Action Button: Mark Ambulance Arrived at ED */}
            {isAccepted && !isArrived && (
              <Button
                size="small"
                variant="contained"
                onClick={handleImmediateArrival}
                sx={{
                  backgroundColor: '#238636',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  py: 0.3,
                  px: 1.2,
                  boxShadow: '0 0 10px rgba(35, 134, 54, 0.6)',
                  '&:hover': { backgroundColor: '#2ea043' },
                  textTransform: 'none',
                }}
              >
                🏁 Mark Ambulance Arrived at ED
              </Button>
            )}

            {isStationary && (
              <Typography
                variant="caption"
                sx={{ color: isPending ? '#d29922' : '#58a6ff', fontWeight: 700, fontSize: '0.72rem', px: 1 }}
              >
                {isPending ? '⏳ Awaiting ED Acceptance to Activate Transit' : '📍 Standby at Incident Scene'}
              </Typography>
            )}

            {isAccepted && !isArrived && (
              <>
                <Button
                  size="small"
                  variant="text"
                  startIcon={isDriving ? <PauseIcon /> : <PlayArrowIcon />}
                  onClick={() => setIsDriving(!isDriving)}
                  sx={{ color: isDriving ? '#d29922' : '#3fb950', py: 0.2, fontSize: '0.72rem', textTransform: 'none' }}
                >
                  {isDriving ? 'Pause' : 'Resume'}
                </Button>
                <IconButton size="small" onClick={handleReset} sx={{ color: '#8b949e', p: 0.5 }} title="Reset Route">
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </>
            )}

            {isArrived && (
              <Typography variant="caption" sx={{ color: '#3fb950', fontWeight: 700, fontSize: '0.72rem' }}>
                ✓ Docked at Emergency Entrance
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
