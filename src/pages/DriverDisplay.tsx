import { motion, AnimatePresence } from 'framer-motion';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { AlertTriangle, CheckCircle, AlertOctagon, Volume2, Phone, Navigation, Gauge } from 'lucide-react';

function BigCard({ status, value, label, sub, color }: any) {
  return (
    <motion.div
      animate={{ borderColor: color + '60', boxShadow: `0 0 30px ${color}20` }}
      className="rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden"
      style={{ background: color + '10', minHeight: 140 }}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }} />
      <div className="text-4xl md:text-5xl font-bold font-mono relative z-10" style={{ color }}>{value}</div>
      <div className="text-sm font-semibold mt-1 relative z-10" style={{ color }}>{label}</div>
      {sub && <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 relative z-10">{sub}</div>}
    </motion.div>
  );
}

export default function DriverDisplay() {
  const { vehicles, selectedVehicleId } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  if (!vs) return null;
  const { vehicle, risk, road, loadCells, gps, imu } = vs;

  const totalLoad = loadCells.reduce((s: number, c: any) => s + c.weight, 0);
  const statusColor = risk.level === 'critical' ? '#ef4444' : risk.level === 'warning' ? '#f59e0b' : '#22c55e';
  const StatusIcon = risk.level === 'critical' ? AlertOctagon : risk.level === 'warning' ? AlertTriangle : CheckCircle;

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Driver HUD" subtitle="Large-format driver safety display" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Status banner */}
        <motion.div
          animate={{ borderColor: statusColor + '60' }}
          className="rounded-2xl border-2 p-5 relative overflow-hidden"
          style={{ background: statusColor + '10' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: statusColor + '20' }}>
              <StatusIcon size={32} style={{ color: statusColor }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: statusColor }}>{risk.level.toUpperCase()}</div>
              <div className="text-base text-[var(--foreground)]">
                {risk.level === 'critical' ? `⚠️ HIGH RISK — Reduce to ${risk.recommendedSpeed} km/h NOW` :
                  risk.level === 'warning' ? `⚡ Caution — Maintain ${risk.recommendedSpeed} km/h` :
                    '✅ Safe — Maintain current speed'}
              </div>
              {risk.factors.length > 0 && (
                <div className="text-[12px] text-[var(--muted-foreground)] mt-1">{risk.factors[0]}</div>
              )}
            </div>
            <button
              onClick={() => speak(`${risk.level} alert. ${risk.level === 'critical' ? `Reduce speed to ${risk.recommendedSpeed} kilometers per hour immediately.` : `Recommended speed ${risk.recommendedSpeed} kilometers per hour.`}`)}
              className="ml-auto w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: statusColor + '20', border: `1px solid ${statusColor}40` }}
            >
              <Volume2 size={22} style={{ color: statusColor }} />
            </button>
          </div>
        </motion.div>

        {/* Big metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <BigCard
            status={vehicle.speed > road.speedLimit ? 'warning' : 'safe'}
            value={vehicle.speed}
            label="km/h"
            sub={`Limit: ${road.speedLimit} km/h`}
            color={vehicle.speed > road.speedLimit + 10 ? '#ef4444' : vehicle.speed > road.speedLimit ? '#f59e0b' : '#22c55e'}
          />
          <BigCard value={risk.recommendedSpeed} label="REC SPEED" sub="km/h" color="#a855f7" />
          <BigCard value={`${risk.overall}%`} label="RISK LEVEL" sub={risk.level.toUpperCase()} color={statusColor} />
          <BigCard value={`${(totalLoad / 1000).toFixed(1)}t`} label="CARGO LOAD" sub={`${loadCells[0]?.percentage.toFixed(0)}% capacity`} color="#3b82f6" />
          <BigCard value={`${road.nextCurve.distance.toFixed(0)}m`} label="NEXT CURVE" sub={road.nextCurve.direction.toUpperCase()} color={road.curvature > 0.5 ? '#ef4444' : '#f59e0b'} />
          <BigCard value={`${Math.round(vehicle.fuel)}%`} label="FUEL" sub={vehicle.fuel < 25 ? '⚠ Low fuel' : 'Sufficient'} color={vehicle.fuel < 25 ? '#ef4444' : '#22c55e'} />
        </div>

        {/* Road warnings */}
        <AnimatePresence>
          {road.warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {road.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <AlertTriangle size={20} className="text-yellow-400 shrink-0" />
                  <span className="text-base font-semibold text-yellow-400">{w}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => speak('SOS Emergency. Driver requesting immediate assistance. Please send help.')}
            className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-red-500/20 border-2 border-red-500/50 text-red-400 font-bold text-lg hover:bg-red-500/30 transition-colors"
          >
            <Phone size={24} /> SOS EMERGENCY
          </button>
          <button
            onClick={() => speak(`Route: ${vehicle.route || 'No active route'}. Current speed: ${vehicle.speed} kilometers per hour. Risk level: ${risk.level}.`)}
            className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-purple-500/20 border-2 border-purple-500/50 text-purple-400 font-bold text-lg hover:bg-purple-500/30 transition-colors"
          >
            <Volume2 size={24} /> VOICE STATUS
          </button>
        </div>

        {/* Nav info */}
        <div className="cs-card">
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={14} className="text-purple-400" />
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)]">NAVIGATION</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Route', value: vehicle.route || 'No route' },
              { label: 'GPS', value: `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` },
              { label: 'Heading', value: `${gps.heading.toFixed(0)}°` },
              { label: 'Road', value: road.roadType },
            ].map(m => (
              <div key={m.label}>
                <div className="text-[10px] text-[var(--muted-foreground)]">{m.label}</div>
                <div className="text-[12px] font-mono text-[var(--foreground)] font-semibold truncate">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
