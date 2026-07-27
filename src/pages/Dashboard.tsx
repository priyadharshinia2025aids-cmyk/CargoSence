import { motion } from 'framer-motion';
import { Truck, AlertTriangle, Activity, Fuel, Zap, Shield, TrendingUp, TrendingDown, MapPin, Clock, Users, Package } from 'lucide-react';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useMemo } from 'react';

function StatCard({ title, value, sub, icon: Icon, color, trend }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="cs-card relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${color}, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[11px] font-mono ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-[var(--foreground)] font-mono">{value}</div>
      <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{title}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color }}>{sub}</div>}
    </motion.div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map = { safe: ['text-green-400', 'bg-green-400/10'], warning: ['text-yellow-400', 'bg-yellow-400/10'], critical: ['text-red-400', 'bg-red-400/10'] };
  const [tc, bg] = (map as any)[level] || map.safe;
  return <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${tc} ${bg}`}>{level.toUpperCase()}</span>;
}

const FAKE_CHART = Array.from({ length: 24 }, (_, i) => ({
  h: `${i.toString().padStart(2, '0')}:00`,
  risk: 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10,
  load: 70 + Math.sin(i * 0.3) * 15 + Math.random() * 5,
  fuel: 80 - i * 1.5 + Math.random() * 5,
}));

export default function Dashboard() {
  const { vehicles, alerts, weather, tick } = useSimStore();
  const vsArr = useMemo(() => Object.values(vehicles), [vehicles]);

  const online = vsArr.filter(v => v.vehicle.status === 'online').length;
  const critAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  const avgRisk = vsArr.length ? Math.round(vsArr.reduce((s, v) => s + v.risk.overall, 0) / vsArr.length) : 0;
  const totalLoad = vsArr.length ? Math.round(vsArr.reduce((s, v) => s + v.loadCells.reduce((ls, c) => ls + c.weight, 0), 0)) : 0;

  const FAKE_TRIPS = [
    { id: 'T-2847', vehicle: 'TN-01-AB-1234', driver: 'Rajesh Kumar', origin: 'Chennai', dest: 'Bangalore', eta: '4h 20m', status: 'active', progress: 65 },
    { id: 'T-2848', vehicle: 'TN-02-CD-5678', driver: 'Suresh Patel', origin: 'Chennai', dest: 'Hyderabad', eta: '6h 10m', status: 'active', progress: 32 },
    { id: 'T-2846', vehicle: 'AP-05-IJ-7890', driver: 'Ramesh Babu', origin: 'Hyd', dest: 'Vijayawada', eta: '1h 45m', status: 'active', progress: 80 },
    { id: 'T-2845', vehicle: 'KA-03-EF-9012', driver: 'Anand Singh', origin: 'Bangalore', dest: 'Pune', eta: '—', status: 'idle', progress: 0 },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Operations Dashboard" subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Vehicles Online" value={`${online}/${vsArr.length}`} icon={Truck} color="#a855f7" trend={12} sub="2 on active trips" />
          <StatCard title="Critical Alerts" value={critAlerts} icon={AlertTriangle} color="#ef4444" trend={-8} sub={critAlerts > 0 ? `${critAlerts} need attention` : 'All clear'} />
          <StatCard title="Avg Fleet Risk" value={`${avgRisk}%`} icon={Shield} color={avgRisk > 70 ? '#ef4444' : avgRisk > 40 ? '#f59e0b' : '#22c55e'} trend={-5} sub={avgRisk > 70 ? 'Critical' : avgRisk > 40 ? 'Moderate' : 'Healthy'} />
          <StatCard title="Total Active Load" value={`${(totalLoad / 1000).toFixed(1)}t`} icon={Package} color="#3b82f6" trend={3} sub="Across all vehicles" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Risk trend chart */}
          <div className="lg:col-span-2 cs-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">Fleet Risk & Load Trend</h3>
                <p className="text-[11px] text-[var(--muted-foreground)]">Last 24 hours</p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" />Risk %</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Load %</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={FAKE_CHART}>
                <defs>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="h" tick={{ fontSize: 10, fill: '#8884aa' }} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="risk" stroke="#7c3aed" fill="url(#riskGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="load" stroke="#3b82f6" fill="url(#loadGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Weather + quick stats */}
          <div className="space-y-4">
            <div className="cs-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--foreground)]">Weather</span>
                <span className="text-[11px] text-[var(--muted-foreground)]">Chennai, India</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{weather.icon}</span>
                <div>
                  <div className="text-2xl font-bold text-[var(--foreground)] font-mono">{Math.round(weather.temperature)}°C</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">{weather.condition}</div>
                  <div className="text-[10px] text-[var(--muted-foreground)]">Wind {Math.round(weather.windSpeed)} km/h · Humidity {Math.round(weather.humidity)}%</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-[10px] font-mono text-[var(--muted-foreground)]">
                  VISIBILITY: {(weather.visibility / 1000).toFixed(1)}km · PRECIP: {weather.precipitation.toFixed(1)}mm
                </div>
              </div>
            </div>

            <div className="cs-card">
              <h3 className="text-xs font-semibold text-[var(--foreground)] mb-3">Vehicle Health Summary</h3>
              {vsArr.slice(0, 4).map(vs => (
                <div key={vs.vehicle.id} className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${vs.vehicle.status === 'online' ? 'bg-green-400' : vs.vehicle.status === 'idle' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <span className="text-[11px] text-[var(--foreground)] flex-1 truncate font-mono">{vs.vehicle.plateNumber}</span>
                  <RiskBadge level={vs.risk.level} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active trips */}
        <div className="cs-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Active Trips</h3>
            <span className="text-[11px] text-purple-400 font-mono">{FAKE_TRIPS.filter(t => t.status === 'active').length} ACTIVE</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  {['Trip ID', 'Vehicle', 'Driver', 'Route', 'Progress', 'ETA', 'Status'].map(h => (
                    <th key={h} className="text-left pb-2 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FAKE_TRIPS.map(trip => (
                  <tr key={trip.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/50 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-purple-400">{trip.id}</td>
                    <td className="pr-4 font-mono text-[10px]">{trip.vehicle}</td>
                    <td className="pr-4">{trip.driver}</td>
                    <td className="pr-4">
                      <span className="flex items-center gap-1">
                        {trip.origin} <span className="text-[var(--muted-foreground)]">→</span> {trip.dest}
                      </span>
                    </td>
                    <td className="pr-4 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${trip.progress}%`, background: trip.progress > 70 ? '#22c55e' : '#7c3aed' }} />
                        </div>
                        <span className="text-[10px] font-mono w-8">{trip.progress}%</span>
                      </div>
                    </td>
                    <td className="pr-4 font-mono text-[var(--muted-foreground)]">{trip.eta}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${trip.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                        {trip.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live vehicle cards */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Live Vehicle Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vsArr.map((vs, i) => (
              <motion.div
                key={vs.vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="cs-card relative overflow-hidden hover:border-purple-500/40 transition-colors cursor-pointer"
              >
                <div className="absolute top-3 right-3">
                  <div className={`w-2 h-2 rounded-full ${vs.vehicle.status === 'online' ? 'bg-green-400 animate-pulse' : vs.vehicle.status === 'idle' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Truck size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--foreground)] font-mono">{vs.vehicle.plateNumber}</div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">{vs.vehicle.driver}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)]">{vs.vehicle.model}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {[
                    { label: 'Speed', value: `${vs.vehicle.speed}`, unit: 'km/h', color: '#a855f7' },
                    { label: 'Fuel', value: `${Math.round(vs.vehicle.fuel)}`, unit: '%', color: '#3b82f6' },
                    { label: 'Risk', value: `${vs.risk.overall}`, unit: '%', color: vs.risk.level === 'critical' ? '#ef4444' : vs.risk.level === 'warning' ? '#f59e0b' : '#22c55e' },
                  ].map(m => (
                    <div key={m.label} className="bg-[var(--muted)] rounded-lg p-2">
                      <div className="text-base font-bold font-mono" style={{ color: m.color }}>{m.value}<span className="text-[10px]">{m.unit}</span></div>
                      <div className="text-[9px] text-[var(--muted-foreground)]">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                    <MapPin size={10} />
                    {vs.vehicle.route || 'No active route'}
                  </div>
                  <RiskBadge level={vs.risk.level} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="cs-card">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Recent Alerts</h3>
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-[var(--muted-foreground)] text-sm">No alerts — all systems nominal</div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--muted)] hover:bg-[var(--secondary)] transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alert.severity === 'critical' ? 'bg-red-400' : alert.severity === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-[var(--foreground)]">{alert.message}</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5 font-mono">{alert.vehicle} · {alert.timestamp.toLocaleTimeString()}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${alert.severity === 'critical' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
