import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Grid } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { hospitalApi, transportApi, decisionApi } from '../services/api';
import { wsService } from '../services/websocket';
import { Hospital, AmbulanceState, Recommendation } from '../types';

// Custom icons using CSS/SVG
const ambulanceIcon = L.divIcon({
  html: `<div style="background-color:#f85149; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; box-shadow:0 0 10px #f85149;">🚑</div>`,
  className: 'amb-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const hospitalIcon = (isTop: boolean) => L.divIcon({
  html: `<div style="background-color:${isTop ? '#3fb950' : '#58a6ff'}; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; box-shadow:0 0 8px ${isTop ? '#3fb950' : '#58a6ff'};">🏥</div>`,
  className: 'hosp-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

export const MapPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulanceState, setAmbulanceState] = useState<AmbulanceState | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const defaultPosition: [number, number] = [37.7749, -122.4194]; // Metro City Center

  useEffect(() => {
    hospitalApi.getAll().then(setHospitals).catch(() => {});
    transportApi.getLatestState(1).then(setAmbulanceState).catch(() => {});
    decisionApi.getActiveRecommendation('CASE-2026-001').then(setRecommendation).catch(() => {});

    const unsubs = [
      wsService.subscribe('/topic/transport/1', (data) => setAmbulanceState(data)),
      wsService.subscribe('/topic/recommendations/CASE-2026-001', (data) => setRecommendation(data)),
      wsService.subscribe('/topic/hospital-resources', () => {
        hospitalApi.getAll().then(setHospitals).catch(() => {});
      })
    ];

    return () => unsubs.forEach((fn) => fn());
  }, []);

  const ambPos: [number, number] = ambulanceState?.latitude && ambulanceState?.longitude
    ? [ambulanceState.latitude, ambulanceState.longitude]
    : defaultPosition;

  const topHospId = recommendation?.selectedHospitalId;

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#f0f6fc' }}>
            Tactical Fleet & Hospital GIS Map
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b949e' }}>
            OpenStreetMap (Zero-Cost Local Routing) • Haversine Geodesic Intersect
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label="Ambulance: Medic-1" sx={{ backgroundColor: 'rgba(248, 81, 73, 0.2)', color: '#f85149' }} />
          <Chip label="Selected Destination: Green Line" sx={{ backgroundColor: 'rgba(63, 185, 80, 0.2)', color: '#3fb950' }} />
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #30363d',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          position: 'relative'
        }}
      >
        <MapContainer center={ambPos} zoom={13} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Ambulance Marker */}
          <Marker position={ambPos} icon={ambulanceIcon}>
            <Popup>
              <strong>Medic-1 (Ambulance #101)</strong><br />
              Speed: {ambulanceState?.speedKmh || 45} km/h<br />
              Case: CASE-2026-001 (Trauma Priority 1)
            </Popup>
          </Marker>

          {/* Hospital Markers & Route Vectors */}
          {hospitals.map((h) => {
            const isTop = h.id === topHospId;
            const cand = recommendation?.candidates?.find((c) => c.hospitalId === h.id);
            const hospPos: [number, number] = [h.latitude, h.longitude];

            return (
              <React.Fragment key={h.id}>
                <Marker position={hospPos} icon={hospitalIcon(isTop)}>
                  <Popup>
                    <strong>{h.name}</strong><br />
                    Trauma: {h.traumaLevel}<br />
                    ETA: {cand?.etaMinutes || '--'} min<br />
                    Suitability Score: {cand?.overallSuitabilityScore || '--'}/100<br />
                    Status: {cand?.feasibility || 'FEASIBLE'}
                  </Popup>
                </Marker>

                {/* Line from ambulance to hospital */}
                <Polyline
                  positions={[ambPos, hospPos]}
                  color={isTop ? '#3fb950' : '#58a6ff'}
                  weight={isTop ? 4 : 2}
                  dashArray={isTop ? undefined : '5, 10'}
                  opacity={isTop ? 0.9 : 0.4}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </Box>
    </Box>
  );
};
