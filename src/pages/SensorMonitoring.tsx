import { motion } from 'framer-motion';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Activity, Satellite, Gauge, Zap } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const HIST_LEN = 60;
const imuHist: Record<string, number[]> = {};

function SensorRow({ label, value, unit, color, min, max }: any) {
  const pct = ((value - min) / (max - min)) * 100;
  const clampedPct = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-[var(--muted-foreground)] w-28 shrink-0">{label}</span>
      <div className="flex-1 progress-bar h-2">
        <motion.div animate={{ width: `${clampedPct}%` }} transition={{ duration: 0.3 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-[11px] font-mono text-[var(--foreground)] w-20 text-right">{typeof value === 'number' ? value.toFixed(2) : value} {unit}</span>
    </div>
  );
}

function IMUVisualizer({ roll, pitch }: { roll: number; pitch: number }) {
  return (
    <div className="relative w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 200 120" className="w-full h-full">
        {/* Horizon reference */}
        <line x1="20" y1="60" x2="180" y2="60" stroke="rgba(124,58,237,0.3)" strokeWidth="1" strokeDasharray="4 2" />
        {/* Truck body */}
        <g transform={`translate(100, 60) rotate(${roll})`}>
          <rect x="-50" y="-18" width="100" height="36" rx="6" fill="#2d1b69" stroke="#7c3aed" strokeWidth="2" />
          <rect x="20" y="-22" width="25" height="20" rx="3" fill="#3b1a8a" stroke="#a855f7" strokeWidth="1" />
          {/* Wheels */}
          {[-40, 10, 30].map((x, i) => (
            <ellipse key={i} cx={x} cy="18" rx="10" ry="8" fill="#1a1040" stroke="#7c3aed" strokeWidth="1" />
          ))}
        </g>
        {/* Roll angle label */}
        <text x="100" y="108" textAnchor="middle" fill="#a855f7" fontSize="10" fontFamily="monospace">
          Roll: {roll.toFixed(1)}° | Pitch: {pitch.toFixed(1)}°
        </text>
      </svg>
    </div>
  );
}

export default function SensorMonitoring() {
  const { vehicles, selectedVehicleId } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  const [activeTab, setActiveTab] = useState<'imu' | 'gps' | 'obd'>('imu');
  const histRef = useRef<Record<string, number[]>>({});

  if (!vs) return null;
  const { imu, gps, obd } = vs;

  // Update history
  const fields = { roll: imu.roll, pitch: imu.pitch, yaw: imu.yaw, accelX: imu.accelX, accelY: imu.accelY, accelZ: imu.accelZ, vibration: imu.vibration };
  Object.entries(fields).forEach(([k, v]) => {
    if (!histRef.current[k]) histRef.current[k] = [];
    histRef.current[k].push(v);
    if (histRef.current[k].length > HIST_LEN) histRef.current[k].shift();
  });

  const chartData = Array.from({ length: HIST_LEN }, (_, i) => ({
    i,
    roll: histRef.current.roll?.[i] || 0,
    pitch: histRef.current.pitch?.[i] || 0,
    yaw: histRef.current.yaw?.[i] || 0,
    vibration: histRef.current.vibration?.[i] || 0,
  }));

  const TABS = [
    { id: 'imu', label: 'MPU6050 IMU', icon: Activity },
    { id: 'gps', label: 'GPS Module', icon: Satellite },
    { id: 'obd', label: 'OBD-II', icon: Gauge },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Sensor Monitoring" subtitle="MPU6050 · GPS · OBD-II real-time telemetry" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Tab selector */}
        <div className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${activeTab === tab.id ? 'bg-purple-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'imu' && (
          <div className="space-y-5">
            {/* IMU Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="cs-card">
                <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">ORIENTATION VISUALIZER</h3>
                <IMUVisualizer roll={imu.roll} pitch={imu.pitch} />
              </div>
              <div className="cs-card">
                <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">EULER ANGLES</h3>
                <div className="space-y-3">
                  <SensorRow label="Roll" value={imu.roll} unit="°" color="#ef4444" min={-35} max={35} />
                  <SensorRow label="Pitch" value={imu.pitch} unit="°" color="#f59e0b" min={-20} max={20} />
                  <SensorRow label="Yaw" value={imu.yaw} unit="°/s" color="#3b82f6" min={-5} max={5} />
                  <SensorRow label="Vibration" value={imu.vibration} unit="g" color="#a855f7" min={0} max={2} />
                  <SensorRow label="IMU Temp" value={imu.temperature} unit="°C" color="#22c55e" min={20} max={60} />
                </div>
              </div>
            </div>

            {/* Accelerometer */}
            <div className="cs-card">
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">ACCELEROMETER (g)</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { axis: 'X', value: imu.accelX, color: '#ef4444' },
                  { axis: 'Y', value: imu.accelY, color: '#22c55e' },
                  { axis: 'Z', value: imu.accelZ, color: '#3b82f6' },
                ].map(a => (
                  <div key={a.axis} className="text-center p-3 rounded-xl" style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-1">AXIS {a.axis}</div>
                    <div className="text-2xl font-bold font-mono" style={{ color: a.color }}>
                      {a.value >= 0 ? '+' : ''}{a.value.toFixed(3)}
                    </div>
                    <div className="text-[9px] text-[var(--muted-foreground)]">m/s²</div>
                  </div>
                ))}
              </div>
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">GYROSCOPE (°/s)</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { axis: 'X', value: imu.gyroX, color: '#a855f7' },
                  { axis: 'Y', value: imu.gyroY, color: '#f59e0b' },
                  { axis: 'Z', value: imu.gyroZ, color: '#06b6d4' },
                ].map(a => (
                  <div key={a.axis} className="text-center p-3 rounded-xl" style={{ background: `${a.color}15`, border: `1px solid ${a.color}30` }}>
                    <div className="text-[10px] text-[var(--muted-foreground)] mb-1">GYRO {a.axis}</div>
                    <div className="text-2xl font-bold font-mono" style={{ color: a.color }}>
                      {a.value >= 0 ? '+' : ''}{a.value.toFixed(3)}
                    </div>
                    <div className="text-[9px] text-[var(--muted-foreground)]">°/s</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="cs-card">
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">ROLL / PITCH / YAW HISTORY</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                  <XAxis dataKey="i" hide />
                  <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="roll" stroke="#ef4444" dot={false} strokeWidth={1.5} name="Roll °" />
                  <Line type="monotone" dataKey="pitch" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="Pitch °" />
                  <Line type="monotone" dataKey="yaw" stroke="#3b82f6" dot={false} strokeWidth={1.5} name="Yaw °/s" />
                  <Line type="monotone" dataKey="vibration" stroke="#a855f7" dot={false} strokeWidth={1.5} name="Vibration g" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'gps' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Latitude', value: gps.lat.toFixed(6), unit: '°', color: '#22c55e' },
                { label: 'Longitude', value: gps.lng.toFixed(6), unit: '°', color: '#3b82f6' },
                { label: 'Elevation', value: gps.elevation.toFixed(1), unit: 'm', color: '#f59e0b' },
                { label: 'Speed', value: gps.speed.toFixed(1), unit: 'km/h', color: '#a855f7' },
              ].map(m => (
                <div key={m.label} className="cs-card">
                  <div className="text-[10px] text-[var(--muted-foreground)]">{m.label}</div>
                  <div className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">{m.unit}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Heading', value: `${gps.heading.toFixed(1)}°`, color: '#06b6d4' },
                { label: 'Satellites', value: `${gps.satellites}`, color: '#22c55e' },
                { label: 'Accuracy', value: `±${gps.accuracy.toFixed(1)}m`, color: '#a855f7' },
                { label: 'Fix Type', value: gps.fix ? '3D Fix' : 'No Fix', color: gps.fix ? '#22c55e' : '#ef4444' },
                { label: 'HDOP', value: (gps.accuracy / 3).toFixed(2), color: '#f59e0b' },
                { label: 'PDOP', value: (gps.accuracy / 2.5).toFixed(2), color: '#3b82f6' },
              ].map(m => (
                <div key={m.label} className="cs-card flex justify-between items-center">
                  <span className="text-[12px] text-[var(--muted-foreground)]">{m.label}</span>
                  <span className="font-mono font-bold text-[13px]" style={{ color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'obd' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Engine RPM', value: obd.rpm.toFixed(0), unit: 'rpm', color: '#a855f7', max: 3000 },
                { label: 'Engine Temp', value: obd.engineTemp.toFixed(1), unit: '°C', color: obd.engineTemp > 100 ? '#ef4444' : '#f59e0b', max: 120 },
                { label: 'Battery', value: obd.batteryVoltage.toFixed(2), unit: 'V', color: '#22c55e', max: 15 },
                { label: 'Fuel Level', value: obd.fuelLevel.toFixed(1), unit: '%', color: '#3b82f6', max: 100 },
                { label: 'Throttle', value: obd.throttlePosition.toFixed(1), unit: '%', color: '#06b6d4', max: 100 },
                { label: 'Fuel Pressure', value: obd.fuelPressure.toFixed(0), unit: 'kPa', color: '#f59e0b', max: 500 },
              ].map(m => (
                <div key={m.label} className="cs-card">
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-[var(--muted-foreground)]">{m.label}</span>
                    <span className="font-mono" style={{ color: m.color }}>{m.value} {m.unit}</span>
                  </div>
                  <div className="progress-bar h-2">
                    <div className="progress-bar-fill h-full rounded-full" style={{ width: `${(parseFloat(m.value) / m.max) * 100}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="cs-card">
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-2">DIAGNOSTIC TROUBLE CODES</h3>
              {obd.dtcCodes.length > 0 ? (
                <div className="space-y-2">
                  {obd.dtcCodes.map(code => (
                    <div key={code} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="font-mono text-red-400 text-sm">{code}</span>
                      <span className="text-[11px] text-[var(--muted-foreground)]">
                        {code === 'P0128' ? 'Coolant Temp Below Thermostat Regulating Temperature' : 'Random/Multiple Cylinder Misfire Detected'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-[12px] text-green-400">No fault codes detected — all systems nominal</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
