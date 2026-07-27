import { motion } from 'framer-motion';
import { Truck, Gauge, Fuel, Battery, Thermometer, Wifi, Satellite, AlertTriangle, CheckCircle, MapPin, Activity, Zap } from 'lucide-react';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
    </div>
  );
}

function Gauge3({ value, max, label, unit, color }: { value: number; max: number; label: string; unit: string; color: string }) {
  const pct = Math.min(value / max, 1);
  const angle = -135 + pct * 270;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 80 60" className="w-24 h-18">
        <path d="M10 55 A 35 35 0 1 1 70 55" fill="none" stroke="var(--muted)" strokeWidth="8" strokeLinecap="round" />
        <path d="M10 55 A 35 35 0 1 1 70 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${pct * 110} 110`} />
        <text x="40" y="45" textAnchor="middle" fontSize="13" fontWeight="bold" fill={color} fontFamily="monospace">
          {Math.round(value)}
        </text>
        <text x="40" y="55" textAnchor="middle" fontSize="8" fill="#8884aa" fontFamily="monospace">{unit}</text>
      </svg>
      <span className="text-[10px] text-[var(--muted-foreground)] -mt-2">{label}</span>
    </div>
  );
}

// Mini spark chart history
const HIST_LEN = 30;
const speedHistory: number[] = Array(HIST_LEN).fill(0);
const riskHistory: number[] = Array(HIST_LEN).fill(0);

export default function LiveTruckMonitoring() {
  const { vehicles, selectedVehicleId, selectVehicle } = useSimStore();
  const vsArr = useMemo(() => Object.values(vehicles), [vehicles]);
  const selected = vehicles[selectedVehicleId] || vsArr[0];

  if (!selected) return null;
  const { vehicle, obd, gps, imu, road, risk, loadCells } = selected;

  // Update history
  speedHistory.push(vehicle.speed);
  if (speedHistory.length > HIST_LEN) speedHistory.shift();
  riskHistory.push(risk.overall);
  if (riskHistory.length > HIST_LEN) riskHistory.shift();

  const sparkData = speedHistory.map((s, i) => ({ i, speed: s, risk: riskHistory[i] }));

  const totalLoad = loadCells.reduce((s, c) => s + c.weight, 0);
  const riskColor = risk.level === 'critical' ? '#ef4444' : risk.level === 'warning' ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col h-full">
      <Header title="Live Truck Monitoring" subtitle="Real-time vehicle telemetry — 1s refresh" />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex gap-4 h-full flex-col xl:flex-row">

          {/* Vehicle selector sidebar */}
          <div className="xl:w-52 shrink-0">
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-2">SELECT VEHICLE</h3>
            <div className="space-y-2">
              {vsArr.map(vs => (
                <button
                  key={vs.vehicle.id}
                  onClick={() => selectVehicle(vs.vehicle.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${vs.vehicle.id === selectedVehicleId
                    ? 'border-purple-500/60 bg-purple-500/10'
                    : 'border-[var(--border)] bg-[var(--card)] hover:border-purple-500/30'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-2 h-2 rounded-full ${vs.vehicle.status === 'online' ? 'bg-green-400' : vs.vehicle.status === 'idle' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                    <span className="text-[11px] font-mono text-[var(--foreground)] font-semibold">{vs.vehicle.plateNumber}</span>
                  </div>
                  <div className="text-[10px] text-[var(--muted-foreground)] truncate">{vs.vehicle.driver}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)] truncate">{vs.vehicle.model}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[10px] font-mono" style={{ color: riskColor }}>{vs.risk.overall}%</span>
                    <span className="text-[9px] text-[var(--muted-foreground)]">risk</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main monitor area */}
          <div className="flex-1 space-y-4">
            {/* Truck header card */}
            <div className="cs-card relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #12111f, #1a0a2e)' }}>
              <div className="absolute inset-0 opacity-10"
                style={{ background: 'radial-gradient(circle at right, #7c3aed, transparent 60%)' }} />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Truck SVG illustration */}
                <div className="w-40 h-28 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-lg">
                    {/* Trailer */}
                    <rect x="10" y="30" width="110" height="70" rx="4" fill="#2d1b69" stroke="#7c3aed" strokeWidth="1.5" />
                    <rect x="14" y="34" width="102" height="62" rx="2" fill="#1a1040" />
                    {/* Cab */}
                    <rect x="120" y="40" width="65" height="60" rx="6" fill="#3b1a8a" stroke="#7c3aed" strokeWidth="1.5" />
                    {/* Windshield */}
                    <rect x="125" y="44" width="50" height="30" rx="3" fill="#0a1a4a" opacity="0.8" />
                    <line x1="150" y1="44" x2="150" y2="74" stroke="#3b82f6" strokeWidth="0.5" opacity="0.5" />
                    {/* Wheels */}
                    {[30, 65, 130, 155].map(x => (
                      <g key={x}>
                        <circle cx={x} cy="103" r="13" fill="#1a1040" stroke="#7c3aed" strokeWidth="1.5" />
                        <circle cx={x} cy="103" r="7" fill="#0a0a12" stroke="#a855f7" strokeWidth="1" />
                        <circle cx={x} cy="103" r="2" fill="#a855f7" />
                      </g>
                    ))}
                    {/* Exhaust */}
                    <rect x="183" y="30" width="4" height="20" rx="1" fill="#7c3aed" />
                    {/* Load indicators on trailer */}
                    <rect x="20" y="40" width="90" height="10" rx="2" fill={riskColor} opacity="0.6" />
                    <text x="65" y="49" textAnchor="middle" fontSize="6" fill="white" fontFamily="monospace">
                      {Math.round(totalLoad / 1000).toFixed(1)}t LOAD
                    </text>
                    {/* Speed display */}
                    <text x="150" y="65" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#a855f7" fontFamily="monospace">
                      {vehicle.speed}
                    </text>
                    <text x="150" y="73" textAnchor="middle" fontSize="7" fill="#c4b5fd" fontFamily="monospace">km/h</text>
                  </svg>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-white font-mono">{vehicle.plateNumber}</h2>
                      <p className="text-sm text-purple-200/80">{vehicle.model}</p>
                      <p className="text-[12px] text-purple-300/60">Driver: {vehicle.driver}</p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-bold font-mono ${risk.level === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : risk.level === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                      {risk.level.toUpperCase()} · {risk.overall}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {[
                      { label: 'Location', value: `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`, icon: MapPin },
                      { label: 'Route', value: vehicle.route || 'No active route', icon: Truck },
                      { label: 'Heading', value: `${Math.round(gps.heading)}° ${['N','NE','E','SE','S','SW','W','NW'][Math.round(gps.heading/45)%8]}`, icon: Activity },
                      { label: 'Odometer', value: `${vehicle.odometer.toLocaleString()} km`, icon: Gauge },
                    ].map(m => (
                      <div key={m.label} className="flex items-center gap-2">
                        <m.icon size={13} className="text-purple-400 shrink-0" />
                        <div>
                          <div className="text-[10px] text-purple-300/60">{m.label}</div>
                          <div className="text-[11px] text-white font-mono truncate max-w-[100px]">{m.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Gauges row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="cs-card flex flex-col items-center py-3">
                <Gauge3 value={vehicle.speed} max={120} label="Speed" unit="km/h" color="#a855f7" />
              </div>
              <div className="cs-card flex flex-col items-center py-3">
                <Gauge3 value={obd.rpm} max={3000} label="Engine RPM" unit="rpm" color="#3b82f6" />
              </div>
              <div className="cs-card flex flex-col items-center py-3">
                <Gauge3 value={obd.engineTemp} max={120} label="Engine Temp" unit="°C" color={obd.engineTemp > 100 ? '#ef4444' : '#f59e0b'} />
              </div>
              <div className="cs-card flex flex-col items-center py-3">
                <Gauge3 value={obd.fuelLevel} max={100} label="Fuel Level" unit="%" color="#22c55e" />
              </div>
            </div>

            {/* Status grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* System status */}
              <div className="cs-card">
                <h4 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">SYSTEM STATUS</h4>
                <div className="space-y-2">
                  <StatusDot ok={vehicle.status === 'online'} label="Engine Running" />
                  <StatusDot ok={gps.fix} label="GPS Lock" />
                  <StatusDot ok={vehicle.battery > 12} label="Battery OK" />
                  <StatusDot ok={obd.dtcCodes.length === 0} label="No Fault Codes" />
                  <StatusDot ok={obd.engineTemp < 100} label="Temp Normal" />
                  <StatusDot ok={vehicle.speed <= road.speedLimit + 10} label="Speed Compliant" />
                </div>
              </div>

              {/* Battery & sensors */}
              <div className="cs-card">
                <h4 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">ELECTRICAL</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[var(--muted-foreground)]">Battery</span>
                      <span className="font-mono text-[var(--foreground)]">{obd.batteryVoltage.toFixed(2)}V</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${((obd.batteryVoltage - 11) / 4) * 100}%`, background: '#22c55e' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[var(--muted-foreground)]">Throttle</span>
                      <span className="font-mono text-[var(--foreground)]">{Math.round(obd.throttlePosition)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${obd.throttlePosition}%`, background: '#7c3aed' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[var(--muted-foreground)]">MAF Rate</span>
                      <span className="font-mono text-[var(--foreground)]">{obd.mafRate.toFixed(1)} g/s</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${(obd.mafRate / 30) * 100}%`, background: '#3b82f6' }} />
                    </div>
                  </div>
                </div>
                {obd.dtcCodes.length > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="text-[10px] font-mono text-red-400">DTC: {obd.dtcCodes.join(', ')}</div>
                  </div>
                )}
              </div>

              {/* GPS */}
              <div className="cs-card">
                <h4 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">GPS TELEMETRY</h4>
                <div className="space-y-2">
                  {[
                    { k: 'Latitude', v: gps.lat.toFixed(6) },
                    { k: 'Longitude', v: gps.lng.toFixed(6) },
                    { k: 'Speed', v: `${gps.speed.toFixed(1)} km/h` },
                    { k: 'Elevation', v: `${gps.elevation.toFixed(0)} m` },
                    { k: 'Heading', v: `${gps.heading.toFixed(1)}°` },
                    { k: 'Satellites', v: `${gps.satellites}` },
                    { k: 'Accuracy', v: `±${gps.accuracy.toFixed(1)} m` },
                  ].map(({ k, v }) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-[var(--muted-foreground)]">{k}</span>
                      <span className="font-mono text-[var(--foreground)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Speed + Risk spark charts */}
            <div className="grid grid-cols-2 gap-4">
              <div className="cs-card">
                <h4 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-2">SPEED HISTORY (30s)</h4>
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={sparkData}>
                    <Line type="monotone" dataKey="speed" stroke="#a855f7" dot={false} strokeWidth={2} />
                    <Tooltip contentStyle={{ display: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="cs-card">
                <h4 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-2">RISK HISTORY (30s)</h4>
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={sparkData}>
                    <Line type="monotone" dataKey="risk" stroke={riskColor} dot={false} strokeWidth={2} />
                    <Tooltip contentStyle={{ display: 'none' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk factors */}
            {risk.factors.length > 0 && (
              <div className="cs-card border-red-500/20 bg-red-500/5">
                <h4 className="text-[11px] font-mono text-red-400 mb-2">⚠ RISK FACTORS</h4>
                <div className="space-y-1.5">
                  {risk.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] text-red-300">
                      <AlertTriangle size={12} className="text-red-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] font-mono text-yellow-400">
                  Recommended speed: {risk.recommendedSpeed} km/h
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
