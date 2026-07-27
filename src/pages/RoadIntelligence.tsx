import { motion } from 'framer-motion';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { AlertTriangle, Navigation, TrendingUp, Wind, Eye, Gauge } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useRef } from 'react';

const elHist: number[] = Array(60).fill(120);
const gradHist: number[] = Array(60).fill(0);
const curvHist: number[] = Array(60).fill(0);

export default function RoadIntelligence() {
  const { vehicles, selectedVehicleId, weather } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  if (!vs) return null;
  const { road, gps, risk, vehicle } = vs;

  elHist.push(gps.elevation);
  elHist.shift();
  gradHist.push(road.gradient);
  gradHist.shift();
  curvHist.push(road.curvature * 100);
  curvHist.shift();

  const chartData = elHist.map((e, i) => ({ i, elevation: e, gradient: gradHist[i], curvature: curvHist[i] }));

  const roadColor = road.curvature > 0.6 ? '#ef4444' : road.curvature > 0.3 ? '#f59e0b' : '#22c55e';
  const gradColor = Math.abs(road.gradient) > 6 ? '#ef4444' : Math.abs(road.gradient) > 3 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col h-full">
      <Header title="Road Intelligence" subtitle="GPS + DEM elevation + road geometry analysis" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Road status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Road Type', value: road.roadType, color: '#a855f7', icon: Navigation },
            { label: 'Speed Limit', value: `${road.speedLimit} km/h`, color: vehicle.speed > road.speedLimit ? '#ef4444' : '#22c55e', icon: Gauge },
            { label: 'Surface', value: road.surfaceCondition, color: '#3b82f6', icon: Navigation },
            { label: 'Gradient', value: `${road.gradient >= 0 ? '+' : ''}${road.gradient.toFixed(1)}%`, color: gradColor, icon: TrendingUp },
          ].map(c => (
            <div key={c.label} className="cs-card">
              <div className="flex items-center gap-2 mb-2">
                <c.icon size={14} style={{ color: c.color }} />
                <span className="text-[10px] text-[var(--muted-foreground)]">{c.label}</span>
              </div>
              <div className="text-base font-bold font-mono" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Next curve alert */}
        <motion.div
          animate={{ borderColor: road.nextCurve.direction !== 'straight' ? '#f59e0b40' : '#22c55e40' }}
          className="cs-card border-2"
        >
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full">
                <circle cx="40" cy="40" r="35" fill="none" stroke="var(--muted)" strokeWidth="4" />
                <circle cx="40" cy="40" r="35" fill="none"
                  stroke={road.nextCurve.direction !== 'straight' ? '#f59e0b' : '#22c55e'}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${Math.min(road.curvature * 220, 220)} 220`} />
                <text x="40" y="38" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--foreground)" fontFamily="monospace">
                  {road.curvature > 0 ? (1 / road.curvature / 10).toFixed(0) : '∞'}
                </text>
                <text x="40" y="50" textAnchor="middle" fontSize="8" fill="#8884aa" fontFamily="monospace">radius m</text>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-1">
                {road.nextCurve.direction === 'straight' ? '✓ Straight Road Ahead' : `⚠ ${road.nextCurve.direction === 'left' ? '← Sharp Left' : '→ Sharp Right'} Curve`}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">Distance</div>
                  <div className="text-sm font-mono font-bold text-[var(--foreground)]">{road.nextCurve.distance.toFixed(0)}m</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">Curve Radius</div>
                  <div className="text-sm font-mono font-bold" style={{ color: roadColor }}>{road.nextCurve.radius.toFixed(0)}m</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">Rec. Speed</div>
                  <div className="text-sm font-mono font-bold text-purple-400">{risk.recommendedSpeed} km/h</div>
                </div>
              </div>
              {road.warnings.map((w, i) => (
                <div key={i} className="mt-2 flex items-center gap-2 text-[12px] text-yellow-400">
                  <AlertTriangle size={12} />
                  {w}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Elevation profile */}
          <div className="cs-card">
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">ELEVATION PROFILE</h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="elGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="i" hide />
                <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} unit="m" />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="elevation" stroke="#7c3aed" fill="url(#elGrad)" strokeWidth={2} dot={false} name="Elevation m" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Curvature & gradient */}
          <div className="cs-card">
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">CURVATURE & GRADIENT HISTORY</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <XAxis dataKey="i" hide />
                <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="curvature" stroke="#f59e0b" dot={false} strokeWidth={2} name="Curvature %" />
                <Line type="monotone" dataKey="gradient" stroke="#ef4444" dot={false} strokeWidth={2} name="Gradient %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather impact */}
        <div className="cs-card">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Weather Impact Assessment</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Visibility', value: `${(weather.visibility / 1000).toFixed(1)}km`, risk: weather.visibility < 1000 ? 'HIGH' : weather.visibility < 4000 ? 'MOD' : 'LOW', color: weather.visibility < 1000 ? '#ef4444' : weather.visibility < 4000 ? '#f59e0b' : '#22c55e', icon: Eye },
              { label: 'Wind', value: `${Math.round(weather.windSpeed)} km/h`, risk: weather.windSpeed > 50 ? 'HIGH' : weather.windSpeed > 25 ? 'MOD' : 'LOW', color: weather.windSpeed > 50 ? '#ef4444' : weather.windSpeed > 25 ? '#f59e0b' : '#22c55e', icon: Wind },
              { label: 'Rain', value: `${weather.precipitation.toFixed(1)}mm`, risk: weather.precipitation > 20 ? 'HIGH' : weather.precipitation > 5 ? 'MOD' : 'LOW', color: weather.precipitation > 20 ? '#ef4444' : weather.precipitation > 5 ? '#f59e0b' : '#22c55e', icon: Navigation },
              { label: 'Temperature', value: `${Math.round(weather.temperature)}°C`, risk: weather.temperature > 42 ? 'HIGH' : 'LOW', color: weather.temperature > 42 ? '#ef4444' : '#22c55e', icon: Gauge },
            ].map(w => (
              <div key={w.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${w.color}20` }}>
                  <w.icon size={16} style={{ color: w.color }} />
                </div>
                <div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">{w.label}</div>
                  <div className="text-sm font-mono font-bold text-[var(--foreground)]">{w.value}</div>
                  <div className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: `${w.color}20`, color: w.color }}>{w.risk} RISK</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
