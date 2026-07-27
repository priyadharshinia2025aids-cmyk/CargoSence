import type {
  Vehicle, LoadCell, IMUSensor, GPSData, OBDData, RoadData,
  WeatherData, RiskAssessment, Alert, VehicleSimState, AlertType
} from '../types';

// Realistic truck routes (lat/lng waypoints)
const ROUTES: Record<string, [number, number][]> = {
  'TN-01-AB-1234': [
    [13.0827, 80.2707], [13.1, 80.28], [13.12, 80.27], [13.15, 80.29],
    [13.18, 80.31], [13.2, 80.33], [13.22, 80.35], [13.25, 80.37],
    [13.28, 80.39], [13.3, 80.4], [13.32, 80.38], [13.35, 80.36],
  ],
  'TN-02-CD-5678': [
    [12.9716, 80.2209], [12.98, 80.23], [12.99, 80.25], [13.0, 80.27],
    [13.01, 80.29], [13.02, 80.31], [13.03, 80.28], [13.04, 80.26],
    [13.05, 80.24], [13.06, 80.22], [13.07, 80.20], [13.08, 80.18],
  ],
  'KA-03-EF-9012': [
    [12.9716, 77.5946], [12.98, 77.61], [12.99, 77.63], [13.0, 77.65],
    [13.01, 77.67], [13.02, 77.69], [13.03, 77.66], [13.04, 77.63],
    [13.05, 80.60], [13.06, 77.57], [13.07, 77.54], [13.08, 77.51],
  ],
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function noise(seed: number, amplitude: number) {
  return (Math.sin(seed * 127.1 + Math.cos(seed * 311.7) * 43758.5453) * 0.5 + 0.5) * amplitude;
}
function sineWave(tick: number, freq: number, amplitude: number, offset = 0) {
  return Math.sin(tick * freq + offset) * amplitude;
}

export function generateVehicles(): Vehicle[] {
  return [
    {
      id: 'v1', plateNumber: 'TN-01-AB-1234', model: 'Tata Prima 4928.S',
      driver: 'Rajesh Kumar', driverId: 'd1',
      status: 'online', lat: 13.0827, lng: 80.2707,
      speed: 65, heading: 45, fuel: 78, battery: 13.8,
      engineTemp: 92, rpm: 1800, odometer: 124567,
      lastSeen: new Date(), route: 'Chennai → Bangalore', tripId: 'trip-001',
      cargo: 'Electronics',
    },
    {
      id: 'v2', plateNumber: 'TN-02-CD-5678', model: 'Ashok Leyland 3516',
      driver: 'Suresh Patel', driverId: 'd2',
      status: 'online', lat: 12.9716, lng: 80.2209,
      speed: 42, heading: 90, fuel: 45, battery: 13.2,
      engineTemp: 88, rpm: 1600, odometer: 89234,
      lastSeen: new Date(), route: 'Chennai → Hyderabad', tripId: 'trip-002',
      cargo: 'FMCG Goods',
    },
    {
      id: 'v3', plateNumber: 'KA-03-EF-9012', model: 'BharatBenz 3523R',
      driver: 'Anand Singh', driverId: 'd3',
      status: 'idle', lat: 12.9716, lng: 77.5946,
      speed: 0, heading: 180, fuel: 92, battery: 14.1,
      engineTemp: 45, rpm: 800, odometer: 56789,
      lastSeen: new Date(), route: 'Bangalore → Pune', tripId: undefined,
      cargo: 'Auto Parts',
    },
    {
      id: 'v4', plateNumber: 'MH-04-GH-3456', model: 'Volvo FH16',
      driver: 'Vikram Sharma', driverId: 'd4',
      status: 'maintenance', lat: 18.9667, lng: 72.8333,
      speed: 0, heading: 0, fuel: 30, battery: 12.8,
      engineTemp: 35, rpm: 0, odometer: 234567,
      lastSeen: new Date(), route: undefined, tripId: undefined,
      cargo: 'Heavy Machinery',
    },
    {
      id: 'v5', plateNumber: 'AP-05-IJ-7890', model: 'Tata Signa 4825.TK',
      driver: 'Ramesh Babu', driverId: 'd5',
      status: 'online', lat: 17.3850, lng: 78.4867,
      speed: 71, heading: 270, fuel: 62, battery: 13.6,
      engineTemp: 95, rpm: 1950, odometer: 178432,
      lastSeen: new Date(), route: 'Hyderabad → Vijayawada', tripId: 'trip-003',
      cargo: 'Cement',
    },
  ];
}

function generateLoadCells(tick: number, vehicleId: string, scenario: number): LoadCell[] {
  const base = [8500, 7200, 9100, 8800];
  const variation = [
    sineWave(tick, 0.02, 120, 0),
    sineWave(tick, 0.018, 95, 1),
    sineWave(tick, 0.022, 140, 2),
    sineWave(tick, 0.019, 110, 3),
  ];
  // Simulate cargo shift at intervals
  const shiftFactor = scenario === 1 ? sineWave(tick, 0.005, 800) : 0;
  const weights = [
    clamp(base[0] + variation[0] + shiftFactor, 100, 12000),
    clamp(base[1] + variation[1] - shiftFactor * 0.5, 100, 12000),
    clamp(base[2] + variation[2] + shiftFactor * 0.3, 100, 12000),
    clamp(base[3] + variation[3] - shiftFactor * 0.2, 100, 12000),
  ];
  const labels = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right'];
  const ids: LoadCell['id'][] = ['fl', 'fr', 'rl', 'rr'];
  const maxW = 12000;

  return ids.map((id, i) => {
    const pct = (weights[i] / maxW) * 100;
    return {
      id, label: labels[i], weight: Math.round(weights[i]),
      maxWeight: maxW, percentage: Math.round(pct * 10) / 10,
      status: pct > 90 ? 'critical' : pct > 75 ? 'warning' : 'safe',
    };
  });
}

function generateIMU(tick: number, speed: number, road: RoadData): IMUSensor {
  const curveFactor = road.curvature * 0.3;
  const speedFactor = speed / 100;
  const vibBase = speed > 0 ? 0.15 : 0.02;
  return {
    roll: clamp(sineWave(tick, 0.015, 4 + curveFactor * 8) + noise(tick, 0.5), -35, 35),
    pitch: clamp(road.gradient * 0.5 + sineWave(tick, 0.01, 2), -20, 20),
    yaw: sineWave(tick, 0.008, 1.5),
    accelX: sineWave(tick, 0.025, 0.3 * speedFactor) + noise(tick + 1, 0.1),
    accelY: sineWave(tick, 0.02, 0.2 * speedFactor) + noise(tick + 2, 0.08),
    accelZ: 9.81 + sineWave(tick, 0.03, 0.15 * speedFactor),
    gyroX: sineWave(tick, 0.04, 0.8 * speedFactor),
    gyroY: sineWave(tick, 0.035, 0.6 * speedFactor),
    gyroZ: sineWave(tick, 0.03, 0.4 * speedFactor),
    vibration: clamp(vibBase + noise(tick + 3, vibBase * 2) + speedFactor * 0.3, 0, 2),
    temperature: 38 + noise(tick + 4, 4),
  };
}

function generateGPS(tick: number, vehicle: Vehicle, route: [number, number][], routeIndex: number): GPSData {
  const waypointCount = route.length;
  const idx = routeIndex % waypointCount;
  const nextIdx = (routeIndex + 1) % waypointCount;
  const t = (tick % 200) / 200;
  const lat = lerp(route[idx][0], route[nextIdx][0], t) + noise(tick + 10, 0.00005);
  const lng = lerp(route[idx][1], route[nextIdx][1], t) + noise(tick + 11, 0.00005);
  return {
    lat, lng,
    heading: vehicle.heading + sineWave(tick, 0.01, 5),
    speed: vehicle.speed + sineWave(tick, 0.03, 8),
    elevation: 120 + noise(tick + 12, 80),
    accuracy: 2 + noise(tick + 13, 3),
    satellites: Math.round(8 + noise(tick, 4)),
    fix: true,
  };
}

function generateOBD(tick: number, vehicle: Vehicle): OBDData {
  return {
    rpm: clamp(vehicle.rpm + sineWave(tick, 0.04, 200), 750, 2800),
    engineTemp: clamp(vehicle.engineTemp + sineWave(tick, 0.005, 8), 40, 115),
    batteryVoltage: clamp(vehicle.battery + sineWave(tick, 0.02, 0.3), 12.0, 14.8),
    fuelLevel: clamp(vehicle.fuel - tick * 0.001, 5, 100),
    speed: vehicle.speed + sineWave(tick, 0.03, 5),
    throttlePosition: clamp(35 + sineWave(tick, 0.04, 25), 0, 100),
    intakeTemp: 42 + noise(tick + 20, 15),
    mafRate: 18.5 + sineWave(tick, 0.05, 6),
    fuelPressure: 350 + sineWave(tick, 0.02, 20),
    dtcCodes: vehicle.id === 'v4' ? ['P0128', 'P0300'] : [],
  };
}

function generateRoad(tick: number): RoadData {
  const curvePhase = Math.floor(tick / 300);
  const curvature = Math.abs(sineWave(tick, 0.005, 0.8));
  const gradient = sineWave(tick, 0.003, 6);
  const roadTypes = ['Highway NH-48', 'State Highway SH-17', 'Urban Arterial', 'Mountain Road'];
  const surfaces = ['Asphalt - Good', 'Asphalt - Worn', 'Concrete', 'Gravel - Poor'];
  const warnings: string[] = [];
  if (curvature > 0.5) warnings.push('Sharp Curve Ahead');
  if (Math.abs(gradient) > 4) warnings.push(`Steep ${gradient > 0 ? 'Uphill' : 'Downhill'} Gradient`);
  if (tick % 500 < 50) warnings.push('Speed Bump 200m');

  return {
    roadType: roadTypes[curvePhase % roadTypes.length],
    curvature,
    gradient,
    elevation: 120 + sineWave(tick, 0.003, 80),
    speedLimit: curvature > 0.6 ? 30 : curvature > 0.3 ? 50 : 80,
    surfaceCondition: surfaces[curvePhase % surfaces.length],
    warnings,
    nextCurve: {
      distance: 200 + noise(tick, 800),
      radius: 150 + noise(tick + 1, 500),
      direction: curvature > 0.2 ? (Math.sin(tick * 0.01) > 0 ? 'left' : 'right') : 'straight',
    },
  };
}

function genWeather(tick: number): WeatherData {
  const conditions = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Fog'];
  const icons = ['☀️', '⛅', '☁️', '🌧️', '🌫️'];
  const idx = Math.floor(tick / 3000) % conditions.length;
  return {
    condition: conditions[idx],
    temperature: 28 + sineWave(tick, 0.001, 8),
    humidity: 65 + sineWave(tick, 0.002, 20),
    windSpeed: 15 + sineWave(tick, 0.003, 10),
    windDirection: ['N', 'NE', 'E', 'SE', 'S'][Math.floor(tick / 1000) % 5],
    visibility: idx === 4 ? 200 + noise(tick, 300) : 8000 + noise(tick, 2000),
    precipitation: idx === 3 ? 5 + noise(tick, 10) : 0,
    icon: icons[idx],
  };
}

function computeRisk(loadCells: LoadCell[], imu: IMUSensor, obd: OBDData, road: RoadData, speed: number): RiskAssessment {
  const totalLoad = loadCells.reduce((s, c) => s + c.weight, 0);
  const maxTotal = 30000;
  const overloadRisk = clamp((totalLoad / maxTotal) * 100, 0, 100);

  const flLoad = loadCells[0].weight + loadCells[2].weight;
  const frLoad = loadCells[1].weight + loadCells[3].weight;
  const sideImbalance = Math.abs(flLoad - frLoad) / (flLoad + frLoad);
  const rolloverRisk = clamp((Math.abs(imu.roll) / 35 * 0.5 + sideImbalance * 0.3 + road.curvature * 0.2) * 100, 0, 100);

  const speedCompliance = clamp((speed / road.speedLimit) * 100, 0, 100);
  const braking = clamp(Math.abs(imu.accelX) / 1.0 * 100, 0, 100);

  const overall = clamp((rolloverRisk * 0.3 + overloadRisk * 0.25 + speedCompliance * 0.25 + braking * 0.2), 0, 100);
  const level = overall > 70 ? 'critical' : overall > 40 ? 'warning' : 'safe';

  const factors: string[] = [];
  if (rolloverRisk > 60) factors.push(`High roll angle: ${imu.roll.toFixed(1)}°`);
  if (overloadRisk > 75) factors.push(`Overload: ${Math.round(totalLoad)}kg`);
  if (road.curvature > 0.5) factors.push('Sharp curve detected');
  if (speed > road.speedLimit) factors.push(`Speeding: ${Math.round(speed)} km/h`);

  return {
    overall: Math.round(overall),
    rollover: Math.round(rolloverRisk),
    overload: Math.round(overloadRisk),
    speedCompliance: Math.round(speedCompliance),
    braking: Math.round(braking),
    level,
    factors,
    recommendedSpeed: Math.round(road.speedLimit * (1 - rolloverRisk / 200)),
  };
}

export function simulateVehicle(prev: VehicleSimState, tick: number, weather: WeatherData): VehicleSimState {
  const { vehicle, route, routeIndex } = prev;
  const newRouteIndex = Math.floor(tick / 200) % route.length;
  const road = generateRoad(tick);
  const gps = generateGPS(tick, vehicle, route, newRouteIndex);
  const obd = generateOBD(tick, vehicle);
  const imu = generateIMU(tick, vehicle.speed, road);
  const loadCells = generateLoadCells(tick, vehicle.id, 0);
  const newSpeed = vehicle.status === 'online' ? clamp(
    vehicle.speed + sineWave(tick, 0.04, 15) + noise(tick, 5),
    0, 90
  ) : 0;
  const risk = computeRisk(loadCells, imu, obd, road, newSpeed);

  const updatedVehicle: Vehicle = {
    ...vehicle,
    lat: gps.lat,
    lng: gps.lng,
    speed: Math.round(newSpeed),
    heading: gps.heading,
    fuel: obd.fuelLevel,
    battery: obd.batteryVoltage,
    engineTemp: obd.engineTemp,
    rpm: Math.round(obd.rpm),
    lastSeen: new Date(),
  };

  return {
    vehicle: updatedVehicle,
    loadCells,
    imu,
    gps,
    obd,
    road,
    risk,
    route,
    routeIndex: newRouteIndex,
  };
}

export function generateWeather(tick: number): WeatherData {
  return genWeather(tick);
}

export function generateAlerts(vehicles: VehicleSimState[], existingAlerts: Alert[]): Alert[] {
  const now = new Date();
  const newAlerts: Alert[] = [];

  vehicles.forEach(vs => {
    const { vehicle, risk, loadCells, obd } = vs;
    if (vehicle.status !== 'online') return;

    const makeAlert = (type: AlertType, severity: Alert['severity'], message: string): Alert => ({
      id: `${type}-${vehicle.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, severity, message,
      vehicleId: vehicle.id, vehicle: vehicle.plateNumber,
      timestamp: now, acknowledged: false,
      location: `${vs.gps.lat.toFixed(4)}, ${vs.gps.lng.toFixed(4)}`,
    });

    if (risk.overall > 75 && Math.random() < 0.03) {
      newAlerts.push(makeAlert('rollover_risk', 'critical', `Rollover risk ${risk.overall}% on ${vs.road.roadType}`));
    }
    if (loadCells.some(c => c.status === 'critical') && Math.random() < 0.02) {
      newAlerts.push(makeAlert('overload', 'critical', `Axle overload detected on ${vehicle.plateNumber}`));
    }
    if (obd.batteryVoltage < 12.5 && Math.random() < 0.02) {
      newAlerts.push(makeAlert('battery_low', 'warning', `Low battery: ${obd.batteryVoltage.toFixed(1)}V`));
    }
    if (vehicle.speed > vs.road.speedLimit + 15 && Math.random() < 0.03) {
      newAlerts.push(makeAlert('high_speed', 'warning', `Speeding: ${vehicle.speed} km/h in ${vs.road.speedLimit} zone`));
    }
  });

  const combined = [...newAlerts, ...existingAlerts].slice(0, 50);
  return combined;
}

export function initVehicleState(vehicle: Vehicle): VehicleSimState {
  const route = ROUTES[vehicle.plateNumber] || ROUTES['TN-01-AB-1234'];
  const road = generateRoad(0);
  const imu = generateIMU(0, vehicle.speed, road);
  const loadCells = generateLoadCells(0, vehicle.id, 0);
  const gps: GPSData = {
    lat: vehicle.lat, lng: vehicle.lng,
    heading: vehicle.heading, speed: vehicle.speed,
    elevation: 120, accuracy: 3, satellites: 10, fix: true,
  };
  const obd: OBDData = {
    rpm: vehicle.rpm, engineTemp: vehicle.engineTemp,
    batteryVoltage: vehicle.battery, fuelLevel: vehicle.fuel,
    speed: vehicle.speed, throttlePosition: 35, intakeTemp: 42,
    mafRate: 18.5, fuelPressure: 350, dtcCodes: [],
  };
  const risk = computeRisk(loadCells, imu, obd, road, vehicle.speed);
  return { vehicle, loadCells, imu, gps, obd, road, risk, route, routeIndex: 0 };
}
