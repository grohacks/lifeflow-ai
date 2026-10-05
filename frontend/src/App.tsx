import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { PatientTwinPage } from './pages/PatientTwinPage';
import { MapPage } from './pages/MapPage';
import { HospitalTwinPage } from './pages/HospitalTwinPage';
import { DestinationEvaluationPage } from './pages/DestinationEvaluationPage';
import { PreAlertPage } from './pages/PreAlertPage';
import { SimulationControlPage } from './pages/SimulationControlPage';
import { AuditPage } from './pages/AuditPage';
import { HospitalConsolePage } from './pages/HospitalConsolePage';
import { CommunicationCenterPage } from './pages/CommunicationCenterPage';
import { AlertsPage } from './pages/AlertsPage';
import { AgentActivityPage } from './pages/AgentActivityPage';
import { DeviceManagementPage } from './pages/DeviceManagementPage';
import { SecurityCenterPage } from './pages/SecurityCenterPage';
import { ConfigurationPage } from './pages/ConfigurationPage';
import { EmergencyHandoverPage } from './pages/EmergencyHandoverPage';
import { ClinicalAssistantPage } from './pages/ClinicalAssistantPage';
import { CitizenSosPage } from './pages/CitizenSosPage';
import { IncidentDispatchPage } from './pages/IncidentDispatchPage';
import { MobileCamTransmitterPage } from './pages/MobileCamTransmitterPage';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#090d13',
      paper: '#161b22',
    },
    primary: {
      main: '#58a6ff',
      light: '#79c0ff',
      dark: '#1f6feb',
    },
    secondary: {
      main: '#f0883e',
      light: '#ffa657',
      dark: '#bd561d',
    },
    error: {
      main: '#f85149',
    },
    warning: {
      main: '#d29922',
    },
    info: {
      main: '#388bfd',
    },
    success: {
      main: '#3fb950',
    },
    text: {
      primary: '#c9d1d9',
      secondary: '#8b949e',
    },
    divider: '#30363d',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #30363d',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('lifeflow_token');
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsAuthenticated(!!localStorage.getItem('lifeflow_token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/sos" element={<CitizenSosPage />} />
          <Route path="/emergency" element={<CitizenSosPage />} />
          <Route path="/mobile-cam" element={<MobileCamTransmitterPage />} />
          
          <Route
            path="/"
            element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" replace />}
          >
            <Route index element={<OperationsDashboard />} />
            <Route path="incident-dispatch" element={<IncidentDispatchPage />} />
            <Route path="ambulance" element={<OperationsDashboard />} />
            <Route path="patient-twin" element={<PatientTwinPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="hospitals" element={<HospitalTwinPage />} />
            <Route path="destination" element={<DestinationEvaluationPage />} />
            <Route path="prealert" element={<PreAlertPage />} />
            <Route path="hospital-console" element={<HospitalConsolePage />} />
            <Route path="communication" element={<CommunicationCenterPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="agents" element={<AgentActivityPage />} />
            <Route path="devices" element={<DeviceManagementPage />} />
            <Route path="security" element={<SecurityCenterPage />} />
            <Route path="config" element={<ConfigurationPage />} />
            <Route path="handover" element={<EmergencyHandoverPage />} />
            <Route path="assistant" element={<ClinicalAssistantPage />} />
            <Route path="simulation" element={<SimulationControlPage />} />
            <Route path="audit" element={<AuditPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
