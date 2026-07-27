import { motion } from 'framer-motion';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Scale, AlertTriangle, TrendingUp } from 'lucide-react';

function LoadCell({ label, weight, maxWeight, percentage, status, position }: any) {
  const color = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e';
  return (
    <motion.div
      animate={{ borderColor: color + '40' }}
      className="cs-card border-2 relative overflow-hidden"
      style={{ borderColor: `${color}40` }}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-[11px] text-[var(--muted-foreground)] font-mono">{position.toUpperCase()}</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{label}</div>
          </div>
          <div className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: `${color}20`, color }}>
            {status.toUpperCase()}
          </div>
        </div>
        <div className="text-3xl font-bold font-mono mb-1" style={{ color }}>
          {weight.toLocaleString()}
          <span className="text-sm ml-1 font-normal text-[var(--muted-foreground)]">kg</span>
        </div>
        <div className="text-[11px] text-[var(--muted-foreground)] mb-3">{percentage.toFixed(1)}% of {(maxWeight / 1000).toFixed(0)}t limit</div>
        <div className="progress-bar h-3">
          <motion.div
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-[var(--muted-foreground)] font-mono mt-1">
          <span>0</span><span>{(maxWeight / 1000).toFixed(0)}t</span>
        </div>
      </div>
    </motion.div>
  );
}

function HeatMapCell({ weight, maxWeight, label, x, y }: any) {
  const pct = weight / maxWeight;
  const h = Math.round((1 - pct) * 120); // green to red hue
  const color = pct > 0.9 ? '#ef4444' : pct > 0.75 ? '#f59e0b' : '#22c55e';
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }}>
      <div
        className="w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 cursor-pointer hover:scale-105 transition-transform"
        style={{ background: `${color}25`, borderColor: `${color}60` }}
      >
        <div className="text-[11px] font-bold font-mono" style={{ color }}>{(weight / 1000).toFixed(1)}t</div>
        <div className="text-[9px] text-[var(--muted-foreground)]">{label}</div>
      </div>
    </div>
  );
}

const HIST_LEN = 60;
const weightHist: Record<string, number[]> = { fl: [], fr: [], rl: [], rr: [] };

export default function LoadMonitoring() {
  const { vehicles, selectedVehicleId } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  if (!vs) return null;

  const { loadCells, risk } = vs;
  const totalWeight = loadCells.reduce((s, c) => s + c.weight, 0);
  const maxTotal = loadCells.reduce((s, c) => s + c.maxWeight, 0);
  const totalPct = (totalWeight / maxTotal) * 100;

  // Update history
  loadCells.forEach(c => {
    if (!weightHist[c.id]) weightHist[c.id] = [];
    weightHist[c.id].push(c.weight);
    if (weightHist[c.id].length > HIST_LEN) weightHist[c.id].shift();
  });

  const trendData = Array.from({ length: HIST_LEN }, (_, i) => ({
    i,
    fl: weightHist.fl[i] || 0,
    fr: weightHist.fr[i] || 0,
    rl: weightHist.rl[i] || 0,
    rr: weightHist.rr[i] || 0,
  }));

  // Center of gravity calculation
  const flW = loadCells[0]?.weight || 0;
  const frW = loadCells[1]?.weight || 0;
  const rlW = loadCells[2]?.weight || 0;
  const rrW = loadCells[3]?.weight || 0;
  const frontTotal = flW + frW;
  const rearTotal = rlW + rrW;
  const leftTotal = flW + rlW;
  const rightTotal = frW + rrW;
  const cogX = ((rightTotal / (leftTotal + rightTotal)) * 100); // 0=left, 100=right
  const cogY = ((rearTotal / (frontTotal + rearTotal)) * 100); // 0=front, 100=rear

  const imbalance = Math.abs(leftTotal - rightTotal) / (leftTotal + rightTotal) * 100;

  const radarData = loadCells.map(c => ({
    axis: c.label.split(' ')[0] + ' ' + c.label.split(' ')[1],
    value: c.percentage,
    fullMark: 100,
  }));

  return (
    <div className="flex flex-col h-full">
      <Header title="Load Monitoring" subtitle="4-point industrial load cell array — real-time weight distribution" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Load', value: `${(totalWeight / 1000).toFixed(2)}t`, color: totalPct > 90 ? '#ef4444' : '#22c55e', sub: `${totalPct.toFixed(1)}% capacity` },
            { label: 'Remaining Capacity', value: `${((maxTotal - totalWeight) / 1000).toFixed(2)}t`, color: '#3b82f6', sub: 'Available' },
            { label: 'Side Imbalance', value: `${imbalance.toFixed(1)}%`, color: imbalance > 15 ? '#ef4444' : imbalance > 8 ? '#f59e0b' : '#22c55e', sub: imbalance > 15 ? '⚠ Redistribute cargo' : 'Acceptable' },
            { label: 'Rollover Risk', value: `${risk.rollover}%`, color: risk.rollover > 70 ? '#ef4444' : risk.rollover > 40 ? '#f59e0b' : '#22c55e', sub: risk.level.toUpperCase() },
          ].map(s => (
            <div key={s.label} className="cs-card">
              <div className="text-[10px] text-[var(--muted-foreground)] mb-1">{s.label}</div>
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] mt-1" style={{ color: s.color }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Load cells */}
          <div>
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">LOAD CELL READINGS</h3>
            <div className="grid grid-cols-2 gap-3">
              {loadCells.map(cell => (
                <LoadCell key={cell.id} {...cell} position={cell.id} />
              ))}
            </div>
          </div>

          {/* Heatmap + COG */}
          <div className="cs-card">
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-4">VEHICLE LOAD HEATMAP & CENTER OF GRAVITY</h3>
            <div className="relative bg-[var(--muted)] rounded-xl overflow-hidden" style={{ height: 220 }}>
              {/* Truck outline */}
              <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full opacity-30">
                <rect x="20" y="30" width="360" height="160" rx="12" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="6 3" />
                <rect x="280" y="50" width="80" height="100" rx="6" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
                <line x1="200" y1="30" x2="200" y2="190" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="4 2" />
                <line x1="20" y1="110" x2="380" y2="110" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="4 2" />
                <text x="200" y="22" textAnchor="middle" fill="#7c3aed" fontSize="10" fontFamily="monospace">FRONT</text>
                <text x="200" y="215" textAnchor="middle" fill="#7c3aed" fontSize="10" fontFamily="monospace">REAR</text>
              </svg>
              {/* Load cells */}
              <HeatMapCell weight={flW} maxWeight={12000} label="FL" x={35} y={30} />
              <HeatMapCell weight={frW} maxWeight={12000} label="FR" x={65} y={30} />
              <HeatMapCell weight={rlW} maxWeight={12000} label="RL" x={35} y={75} />
              <HeatMapCell weight={rrW} maxWeight={12000} label="RR" x={65} y={75} />
              {/* CoG marker */}
              <div
                className="absolute w-5 h-5 rounded-full border-2 border-yellow-400 bg-yellow-400/20 transition-all duration-500"
                style={{ left: `${cogX * 0.5 + 25}%`, top: `${cogY * 0.5 + 25}%`, transform: 'translate(-50%,-50%)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="absolute bottom-2 right-2 text-[9px] font-mono text-yellow-400">● CoG</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center">
                <div className="text-[10px] text-[var(--muted-foreground)]">CoG Lateral</div>
                <div className="text-sm font-mono font-bold text-yellow-400">{cogX.toFixed(1)}% {cogX > 55 ? '→ Right' : cogX < 45 ? '← Left' : 'Center'}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-[var(--muted-foreground)]">CoG Longitudinal</div>
                <div className="text-sm font-mono font-bold text-yellow-400">{cogY.toFixed(1)}% {cogY > 55 ? '↓ Rear' : cogY < 45 ? '↑ Front' : 'Balanced'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weight trend */}
        <div className="cs-card">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Weight Trend — Last 60 Seconds</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs>
                {[['fl','#ef4444'],['fr','#f59e0b'],['rl','#22c55e'],['rr','#3b82f6']].map(([k,c]) => (
                  <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              {[['fl','#ef4444','Front Left'],['fr','#f59e0b','Front Right'],['rl','#22c55e','Rear Left'],['rr','#3b82f6','Rear Right']].map(([k,c,n]) => (
                <Area key={k} type="monotone" dataKey={k} stroke={c as string} fill={`url(#grad-${k})`} strokeWidth={1.5} dot={false} name={n as string} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Warnings */}
        {imbalance > 10 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="cs-card border-yellow-500/30 bg-yellow-500/5"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-yellow-400">Cargo Imbalance Detected</div>
                <div className="text-[12px] text-[var(--muted-foreground)] mt-1">
                  Load imbalance of {imbalance.toFixed(1)}% detected between left and right axles.
                  {leftTotal > rightTotal
                    ? ` Move approximately ${Math.round((leftTotal - rightTotal) / 2)} kg from the left side to the right side.`
                    : ` Move approximately ${Math.round((rightTotal - leftTotal) / 2)} kg from the right side to the left side.`}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
