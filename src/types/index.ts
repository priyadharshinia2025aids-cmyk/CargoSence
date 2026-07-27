export type UserRole = 'driver' | 'fleet_manager' | 'admin' | 'warehouse_operator' | 'transport_supervisor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  vehicle?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  driver: string;
  driverId: string;
  status: 'online' | 'offline' | 'idle' | 'maintenance';
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  fuel: number;
  battery: number;
  engineTemp: number;
  rpm: number;
  odometer: number;
  lastSeen: Date;
  route?: string;
  tripId?: string;
  cargo?: string;
}

export interface LoadCell {
  id: 'fl' | 'fr' | 'rl' | 'rr';
  label: string;
  weight: number;
  maxWeight: number;
  percentage: number;
  status: 'safe' | 'warning' | 'critical';
}

export interface IMUSensor {
  roll: number;
  pitch: number;
  yaw: number;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  vibration: number;
  temperature: number;
}

export interface GPSData {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  elevation: number;
  accuracy: number;
  satellites: number;
  fix: boolean;
}

export interface OBDData {
  rpm: number;
  engineTemp: number;
  batteryVoltage: number;
  fuelLevel: number;
  speed: number;
  throttlePosition: number;
  intakeTemp: number;
  mafRate: number;
  fuelPressure: number;
  dtcCodes: string[];
}

export interface RoadData {
  roadType: string;
  curvature: number;
  gradient: number;
  elevation: number;
  speedLimit: number;
  surfaceCondition: string;
  warnings: string[];
  nextCurve: { distance: number; radius: number; direction: 'left' | 'right' | 'straight' };
}

export interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  visibility: number;
  precipitation: number;
  icon: string;
}

export interface RiskAssessment {
  overall: number;
  rollover: number;
  overload: number;
  speedCompliance: number;
  braking: number;
  level: 'safe' | 'warning' | 'critical';
  factors: string[];
  recommendedSpeed: number;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  vehicleId: string;
  vehicle: string;
  timestamp: Date;
  acknowledged: boolean;
  location?: string;
}

export type AlertType =
  | 'overload'
  | 'load_imbalance'
  | 'rollover_risk'
  | 'engine_fault'
  | 'battery_low'
  | 'gps_lost'
  | 'harsh_braking'
  | 'high_speed'
  | 'cargo_shift'
  | 'maintenance_due'
  | 'geofence'
  | 'idle_time';

export interface Trip {
  id: string;
  vehicleId: string;
  vehicle: string;
  driver: string;
  origin: string;
  destination: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  fuelUsed: number;
  riskEvents: number;
  cargo: string;
  weight: number;
}

export interface SimulationState {
  tick: number;
  vehicles: Record<string, VehicleSimState>;
  weather: WeatherData;
  alerts: Alert[];
  isRunning: boolean;
}

export interface VehicleSimState {
  vehicle: Vehicle;
  loadCells: LoadCell[];
  imu: IMUSensor;
  gps: GPSData;
  obd: OBDData;
  road: RoadData;
  risk: RiskAssessment;
  route: [number, number][];
  routeIndex: number;
}

export interface DetectionResult {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  color: string;
}

export interface Pallet {
  id: string;
  description: string;
  weight: number;
  destination: string;
  barcode: string;
  position?: 'fl' | 'fr' | 'rl' | 'rr' | 'center';
  status: 'pending' | 'loaded' | 'delivered';
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  date: Date;
  cost: number;
  technician: string;
  notes: string;
  nextDue: Date;
}

export type ThemeMode = 'dark' | 'light';
