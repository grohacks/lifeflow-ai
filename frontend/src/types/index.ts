export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  hospitalCode?: string;
  hospitalName?: string;
  department?: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  hospitalCode?: string;
  hospitalName?: string;
  department?: string;
}

export interface Ambulance {
  id: number;
  vehicleNumber: string;
  callSign: string;
  model: string;
  status: string;
  baseStation: string;
}

export interface ObservationEvent {
  eventId: string;
  patientCaseId: string;
  ambulanceId: number;
  deviceUid: string;
  deviceType: string;
  metric: string;
  value: number;
  unit: string;
  sourceTimestamp: string;
  quality: string;
  signalQuality: number;
}

export interface PatientTwinState {
  caseId: string;
  timestamp: string;
  heartRate: number;
  spo2: number;
  systolicBp: number;
  diastolicBp: number;
  mapValue: number;
  respiratoryRate: number;
  temperature: number;
  etco2: number;
  glucose: number;
  consciousness: string;
  injuryObservations: string;
  interventions: string;
  confidence: number;
  dataQuality: string;
  incidentLatitude?: number;
  incidentLongitude?: number;
  trendIndicators?: {
    heartRateEwma?: number;
    spo2Ewma?: number;
    deteriorationScore?: number;
    trendSlope?: string;
    dataQualityScore?: number;
  };
}

export interface PatientForecast {
  id: number;
  caseId: string;
  horizonMinutes: number;
  forecastTimestamp: string;
  metric: string;
  forecastValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  modelName: string;
  modelVersion: string;
  status: string;
}

export interface AmbulanceState {
  ambulanceId: number;
  caseId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speedKmh: number;
  cabinTemperature: number;
  humidity: number;
  oxygenSupplyPct: number;
  edgeBatteryPct: number;
  powerState: string;
  networkSignal: string;
  networkLatencyMs: number;
  packetLossPct: number;
  connectivity: string;
  timestamp: string;
}

export interface Route {
  id: number;
  ambulanceId: number;
  hospitalId: number;
  hospitalName: string;
  hospitalCode: string;
  distanceKm: number;
  baseDurationSeconds: number;
  trafficMultiplier: number;
  calculatedEtaSeconds: number;
  waypointsJson?: string;
}

export interface HospitalResource {
  id: number;
  hospitalId: number;
  resourceType: string;
  totalCapacity: number;
  availableCount: number;
  status: string;
  confidence: number;
  freshnessTtlSeconds: number;
  lastUpdatedAt: string;
  stale: boolean;
}

export interface HospitalTwinState {
  hospitalId: number;
  hospitalCode: string;
  hospitalName: string;
  timestamp: string;
  icuOccupancyPct: number;
  edOccupancyPct: number;
  otAvailableCount: number;
  ventilatorAvailableCount: number;
  ctScannerAvailable: boolean;
  mriScannerAvailable: boolean;
  specialistAvailable: boolean;
  traumaReady: boolean;
  overallFreshnessStatus: string;
  confidenceScore: number;
  projectedAtEta?: Record<string, number>;
}

export interface Hospital {
  id: number;
  hospitalCode: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  traumaLevel: string;
  hasCathLab: boolean;
  hasStrokeCenter: boolean;
  hasPediatricIcu: boolean;
  hasBurnUnit: boolean;
  hasHelipad: boolean;
  active: boolean;
  contactPhone: string;
  isDiverting?: boolean;
  resources: HospitalResource[];
  twinState?: HospitalTwinState;
}

export interface DestinationEvaluation {
  positiveFactors?: string[];
  negativeFactors?: string[];
  hardConstraints?: string[];
  uncertaintyFactors?: string[];
  patientForecastSummary?: string;
  hospitalForecastSummary?: string;
  transportSummary?: string;
}

export interface CandidateDestination {
  id: number;
  hospitalId: number;
  hospitalName: string;
  hospitalCode: string;
  etaSeconds: number;
  etaMinutes?: number;
  distanceKm: number;
  feasibility: string;
  clinicalFitScore: number;
  futureResourceScore: number;
  transportUtilityScore: number;
  patientCompatibilityScore: number;
  operationalCapacityScore: number;
  uncertaintyPenalty: number;
  overallSuitabilityScore: number;
  rankOrder: number;
  isRecommended: boolean;
  evaluation?: DestinationEvaluation;
}

export interface Recommendation {
  id: number;
  recommendationId: string;
  caseId: string;
  versionNumber: number;
  isActive: boolean;
  createdAt: string;
  validUntil: string;
  selectedHospitalId: number;
  selectedHospitalName: string;
  modelVersion: string;
  uncertaintyScore: number;
  status: string;
  summaryReason: string;
  candidates: CandidateDestination[];
}

export interface PreAlert {
  id: number;
  prealertId: string;
  caseId: string;
  ambulanceId: number;
  vehicleNumber: string;
  hospitalId: number;
  hospitalName: string;
  etaSeconds: number;
  etaMinutes: number;
  patientSummary: string;
  relevantObservations: string;
  interventionsPerformed: string;
  requestedCapabilities: string;
  status: string; // PENDING_ACK, ACKNOWLEDGED
  sentAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  reservedBeds?: string;
  reservedBloodUnits?: number;
  reservedEquipment?: string;
  assignedDoctorName?: string;
  doctorNotified?: boolean;
  doctorNotifiedAt?: string;
  doctorOrders?: string;
  incidentLatitude?: number;
  incidentLongitude?: number;
  hospitalLatitude?: number;
  hospitalLongitude?: number;
}

export interface ReserveResourcesRequest {
  reservedBeds?: string;
  reservedBloodUnits?: number;
  reservedEquipment?: string;
}

export interface NotifyDoctorRequest {
  doctorName: string;
  department?: string;
  note?: string;
}

export interface DoctorOrdersRequest {
  doctorName?: string;
  doctorOrders: string;
}

export interface AuditEvent {
  id: number;
  eventId: string;
  eventType: string;
  actorUser: string;
  caseId: string;
  ambulanceId?: number;
  hospitalId?: number;
  previousStateJson?: string;
  newStateJson?: string;
  recommendationId?: number;
  decisionId?: number;
  modelVersion?: string;
  correlationId: string;
  timestamp: string;
}

export interface EmergencyIncident {
  id: number;
  incidentCode: string;
  bystanderName: string;
  bystanderPhone: string;
  incidentType: string;
  severity: string;
  casualtyCount: number;
  description?: string;
  latitude: number;
  longitude: number;
  locationAddress?: string;
  photoUrl?: string;
  assignedAmbulanceId?: number;
  ambulanceCallSign?: string;
  distanceKm?: number;
  etaMinutes?: number;
  status: string; // REPORTED, ASSIGNED, EN_ROUTE_SCENE, ON_SCENE, PATIENT_LOADED, CANCELLED
  reportedAt: string;
  patientCaseId?: string;
}

export interface SosReportRequest {
  bystanderName?: string;
  bystanderPhone?: string;
  incidentType: string;
  severity?: string;
  casualtyCount?: number;
  description?: string;
  latitude: number;
  longitude: number;
  locationAddress?: string;
  photoUrl?: string;
}

export const getPrimaryRole = (roles?: string[]): string => {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return 'ROLE_PARAMEDIC';
  return roles.find((r) => r.startsWith('ROLE_')) || roles[0] || 'ROLE_PARAMEDIC';
};

export const isHospitalRole = (roles?: string[]): boolean => {
  const primary = getPrimaryRole(roles);
  return primary === 'ROLE_HOSPITAL_OPERATOR' || primary === 'ROLE_CLINICIAN_VIEWER';
};

export const isParamedicRole = (roles?: string[]): boolean => {
  const primary = getPrimaryRole(roles);
  return primary === 'ROLE_PARAMEDIC' || primary === 'ROLE_ADMIN' || primary === 'ROLE_CONTROL_ROOM';
};
