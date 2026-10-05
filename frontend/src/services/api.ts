import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Universal UUID v4 generator (works in both HTTP & HTTPS secure/insecure contexts)
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Request Interceptor: Attach JWT Token & Correlation ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lifeflow_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  config.headers['X-Correlation-Id'] = generateUUID();
  return config;
});

// Response Interceptor: Extract standard envelope `data`
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired/invalid
      localStorage.removeItem('lifeflow_token');
      localStorage.removeItem('lifeflow_user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then((res) => res.data.data),
  register: (data: { username: string; email: string; password: string; fullName: string; role?: string }) =>
    api.post('/auth/register', data).then((res) => res.data.data),
  getUsers: () => api.get('/auth/users').then((res) => res.data.data),
  getCurrentUser: () => api.get('/auth/me').then((res) => res.data.data)
};

export const healthApi = {
  getHealth: () => api.get('/health').then((res) => res.data)
};

export const ambulanceApi = {
  getAll: () => api.get('/ambulances').then((res) => res.data.data),
  getById: (id: number) => api.get(`/ambulances/${id}`).then((res) => res.data.data)
};

export const patientApi = {
  getActiveCases: () => api.get('/patients/active').then((res) => res.data.data),
  getCaseById: (caseId: string) => api.get(`/patients/${caseId}`).then((res) => res.data.data),
  getTwin: (caseId: string) => api.get(`/patients/${caseId}/twin`).then((res) => res.data.data),
  getTimeline: (caseId: string) => api.get(`/patients/${caseId}/timeline`).then((res) => res.data.data),
  getForecasts: (caseId: string) => api.get(`/patients/${caseId}/forecast`).then((res) => res.data.data),
  addObservation: (caseId: string, data: any) =>
    api.post(`/patients/${caseId}/observations`, data).then((res) => res.data.data),
  addIntervention: (caseId: string, data: any) =>
    api.post(`/patients/${caseId}/interventions`, data).then((res) => res.data.data),
  uploadImage: (caseId: string, formData: FormData) =>
    api.post(`/patients/${caseId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => res.data.data),
  scanVisionVitals: (caseId: string, formData: FormData) =>
    api.post(`/patients/${caseId}/vision-vitals`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => res.data.data),
  injectVitals: (caseId: string, vitals: { spo2?: number; heartRate?: number; systolicBp?: number; diastolicBp?: number; respiratoryRate?: number; notes?: string }) =>
    api.post(`/patients/${caseId}/vitals-telemetry`, vitals).then((res) => res.data.data),
  uploadSnap: (caseId: string, formData: FormData) =>
    api.post(`/patients/${caseId}/snap-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((res) => res.data.data),
  uploadSnapDataUrl: (caseId: string, data: { dataUrl: string; label?: string; source?: string }) =>
    api.post(`/patients/${caseId}/snap-dataurl`, data).then((res) => res.data.data),
  getSnaps: (caseId: string) =>
    api.get(`/patients/${caseId}/snaps`).then((res) => res.data.data),
  clearSnaps: (caseId: string) =>
    api.delete(`/patients/${caseId}/snaps`).then((res) => res.data.data),
  analyzeImage: (data: { dataUrl: string; scanMode?: string; notes?: string }) =>
    api.post('/patients/analyze-image', data).then((res) => res.data.data)
};

export const systemApi = {
  getNetworkInfo: () =>
    api.get('/health/network-info').then((res) => res.data)
};

export const hospitalApi = {
  getAll: () => api.get('/hospitals').then((res) => res.data.data),
  getByCode: (code: string) => api.get(`/hospitals/${code}`).then((res) => res.data.data),
  create: (data: any) => api.post('/hospitals', data).then((res) => res.data.data),
  provisionResource: (id: number, data: any) => api.post(`/hospitals/${id}/resources`, data).then((res) => res.data.data),
  updateResource: (id: number, resourceType: string, availableCount: number) =>
    api.patch(`/hospitals/${id}/resources`, { resourceType, availableCount }).then((res) => res.data.data),
  deactivate: (id: number) => api.delete(`/hospitals/${id}`).then((res) => res.data.data)
};

export const transportApi = {
  getLatestState: (ambulanceId: number) =>
    api.get(`/transport/ambulance/${ambulanceId}/state`).then((res) => res.data.data),
  getActiveRoutes: (ambulanceId: number) =>
    api.get(`/transport/ambulance/${ambulanceId}/routes`).then((res) => res.data.data),
  updateGps: (data: any) => api.post('/transport/gps', data).then((res) => res.data.data),
  updateTraffic: (ambulanceId: number, trafficMultiplier: number) =>
    api.post('/transport/traffic', { ambulanceId, trafficMultiplier }).then((res) => res.data.data)
};

export const decisionApi = {
  getActiveRecommendation: (caseId: string) =>
    api.get(`/decision/case/${caseId}/active`).then((res) => res.data.data),
  getRecommendationHistory: (caseId: string) =>
    api.get(`/decision/case/${caseId}/history`).then((res) => res.data.data),
  evaluate: (caseId: string) =>
    api.post(`/decision/case/${caseId}/evaluate`).then((res) => res.data.data)
};

export const preAlertApi = {
  recordDecision: (data: { caseId: string; recommendationId?: number; selectedHospitalId: number; decisionType: string; reason?: string }) =>
    api.post('/prealerts/decision', data).then((res) => res.data.data),
  acknowledge: (prealertId: string) =>
    api.post(`/prealerts/${prealertId}/acknowledge`).then((res) => res.data.data),
  accept: (prealertId: string) =>
    api.post(`/prealerts/${prealertId}/accept`).then((res) => res.data.data),
  markArrived: (prealertId: string) =>
    api.post(`/prealerts/${prealertId}/arrive`).then((res) => res.data.data),
  clearHospitalQueue: (hospitalId: number) =>
    api.delete(`/prealerts/hospital/${hospitalId}/clear`).then((res) => res.data.data),
  reserve: (prealertId: string, data: { reservedBeds?: string; reservedBloodUnits?: number; reservedEquipment?: string }) =>
    api.post(`/prealerts/${prealertId}/reserve`, data).then((res) => res.data.data),
  notifyDoctor: (prealertId: string, data: { doctorName: string; department?: string; note?: string }) =>
    api.post(`/prealerts/${prealertId}/notify-doctor`, data).then((res) => res.data.data),
  saveDoctorOrders: (prealertId: string, data: { doctorName?: string; doctorOrders: string }) =>
    api.post(`/prealerts/${prealertId}/doctor-orders`, data).then((res) => res.data.data),
  getForHospital: (hospitalId: number) =>
    api.get(`/prealerts/hospital/${hospitalId}`).then((res) => res.data.data),
  getAll: () => api.get('/prealerts').then((res) => res.data.data),
  getLatestForCase: (caseId: string) =>
    api.get(`/prealerts/case/${caseId}/latest`).then((res) => res.data.data),
  clearCaseAlerts: (caseId: string) =>
    api.delete(`/prealerts/case/${caseId}`).then((res) => res.data.data)
};

export const auditApi = {
  getByCase: (caseId: string) => api.get(`/audit/case/${caseId}`).then((res) => res.data.data),
  getAll: (page = 0, size = 50) => api.get(`/audit?page=${page}&size=${size}`).then((res) => res.data.data)
};

export const simulationApi = {
  start: () => api.post('/simulation/start').then((res) => res.data.data),
  pause: () => api.post('/simulation/pause').then((res) => res.data.data),
  resume: () => api.post('/simulation/resume').then((res) => res.data.data),
  reset: () => api.post('/simulation/reset').then((res) => res.data.data),
  setSpeed: (multiplier: number) => api.post(`/simulation/speed?multiplier=${multiplier}`).then((res) => res.data.data),
  triggerDeterioration: () => api.post('/simulation/trigger/deterioration').then((res) => res.data.data),
  triggerTraffic: (multiplier = 1.8) => api.post(`/simulation/trigger/traffic?multiplier=${multiplier}`).then((res) => res.data.data),
  triggerHospitalResource: (code = 'HOSP-002', type = 'ICU_BEDS', count = 0) =>
    api.post(`/simulation/trigger/hospital-resource?code=${code}&type=${type}&count=${count}`).then((res) => res.data.data),
  getStatus: () => api.get('/simulation/status').then((res) => res.data.data)
};

export const alertsApi = {
  getAll: (unresolvedOnly = false) =>
    api.get(`/alerts?unresolvedOnly=${unresolvedOnly}`).then((res) => res.data.data),
  acknowledge: (id: number, notes?: string) =>
    api.post(`/alerts/${id}/acknowledge`, { notes }).then((res) => res.data.data)
};

export const messageApi = {
  getByCase: (caseId: string) =>
    api.get(`/cases/${caseId}/messages`).then((res) => res.data.data),
  sendMessage: (caseId: string, data: { recipientRole: string; recipientUserId?: number; content: string; priority?: string }) =>
    api.post(`/cases/${caseId}/messages`, data).then((res) => res.data.data)
};

export const agentApi = {
  getRuns: (caseId?: string) =>
    api.get(`/agents/runs${caseId ? `?caseId=${caseId}` : ''}`).then((res) => res.data.data),
  execute: (agentName: string, inputData: Record<string, any>) =>
    api.post('/agents/execute', { agentName, inputData }).then((res) => res.data.data)
};

export const deviceApi = {
  getAll: () =>
    api.get('/devices').then((res) => res.data.data),
  getByAmbulance: (ambulanceId: number) =>
    api.get(`/devices/ambulance/${ambulanceId}`).then((res) => res.data.data),
  getObservations: (caseId: string, page = 0, size = 50) =>
    api.get(`/devices/observations/case/${caseId}?page=${page}&size=${size}`).then((res) => res.data.data)
};

export const configApi = {
  getAll: (category?: string) =>
    api.get(`/configurations${category ? `?category=${category}` : ''}`).then((res) => res.data.data),
  update: (configKey: string, configValue: string) =>
    api.patch(`/configurations/${configKey}`, { configValue }).then((res) => res.data.data)
};

export const handoverApi = {
  generate: (caseData: any) =>
    axios.post('http://localhost:8000/handover/generate', caseData).then((res) => res.data)
};

export const assistantApi = {
  query: (question: string, context: any) =>
    axios.post('http://localhost:8000/assistant/query', { question, context }).then((res) => res.data)
};

export const incidentApi = {
  reportSos: (data: any) =>
    api.post('/incidents/sos', data).then((res) => res.data.data),
  getActive: () =>
    api.get('/incidents/active').then((res) => res.data.data),
  getById: (id: number) =>
    api.get(`/incidents/${id}`).then((res) => res.data.data),
  updateStatus: (id: number, status: string) =>
    api.patch(`/incidents/${id}/status`, { status }).then((res) => res.data.data),
  boardPatient: (id: number, request?: any) =>
    api.post(`/incidents/${id}/board-patient`, request || {}).then((res) => res.data.data),
  smsWebhook: (data: { from: string; body: string; latitude?: number; longitude?: number }) =>
    api.post('/incidents/sms-webhook', data).then((res) => res.data.data),
  callWebhook: (data: { callerPhone: string; transcript: string; callerLocation?: string; latitude?: number; longitude?: number }) =>
    api.post('/incidents/call-webhook', data).then((res) => res.data.data)
};

export default api;
