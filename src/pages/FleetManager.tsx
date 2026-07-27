import { motion } from 'framer-motion';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { Truck, AlertTriangle, TrendingDown, TrendingUp, Download, BarChart3, Fuel } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useMemo } from 'react';

const FUEL_DATA = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
  v1: 85 - i * 8 + Math.random() * 10,
  v2: 72 - i * 6 + Math.random() * 8,
  v3: 90 - i * 4 + Math.random() * 5,
}));

export default function FleetManager() {
  const { vehicles, alerts } = useSimStore();
  const vsArr = useMemo(() => Object.values(vehicles), [vehicles]);

  const sorted = [...vsArr].sort((a, b) => b.risk.overall - a.risk.overall);

  const downloadReport = () => {
    const rows = ['Vehicle,Driver,Speed,Risk,Fuel,Load,Status'];
    vsArr.forEach(vs => {
      const load = vs.loadCells.reduce((s: number, c: any) => s + c.weight, 0);
      rows.push(`${vs.vehicle.plateNumber},${vs.vehicle.driver},${vs.vehicle.speed},${vs.risk.overall}%,${Math.round(vs.vehicle.fuel)}%,${(load/1000).toFixed(2)}t,${vs.vehicle.status}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fleet-report.csv'; a.click();
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Fleet Manager Dashboard" subtitle="Complete fleet oversight & analytics" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={downloadReport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500">
            <Download size={15} /> Export CSV
          </button>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Fleet', value: vsArr.length, color: '#a855f7' },
            { label: 'Online Now', value: vsArr.filter(v => v.vehicle.status === 'online').length, color: '#22c55e' },
            { label: 'Active Alerts', value: alerts.filter(a => !a.acknowledged).length, color: '#ef4444' },
            { label: 'Maintenance Due', value: 1, color: '#f59e0b' },
          ].map(m => (
            <div key={m.label} className="cs-card">
              <div className="text-[10px] text-[var(--muted-foreground)]">{m.label}</div>
              <div className="text-2xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Risk ranking */}
          <div className="cs-card">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Risk Ranking</h3>
            <div className="space-y-3">
              {sorted.map((vs, i) => {
                const riskColor = vs.risk.level === 'critical' ? '#ef4444' : vs.risk.level === 'warning' ? '#f59e0b' : '#22c55e';
                return (
                  <div key={vs.vehicle.id} className="flex items-center gap-3">
                    <span className="w-5 text-[12px] font-mono text-[var(--muted-foreground)]">#{i + 1}</span>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Truck size={15} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-mono font-semibold text-[var(--foreground)]">{vs.vehicle.plateNumber}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] truncate">{vs.vehicle.driver}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 progress-bar h-2">
                        <div className="h-full rounded-full" style={{ width: `${vs.risk.overall}%`, background: riskColor }} />
                      </div>
                      <span className="text-[11px] font-mono w-8" style={{ color: riskColor }}>{vs.risk.overall}%</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: `${riskColor}20`, color: riskColor }}>
                      {vs.risk.level.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fuel trend */}
          <div className="cs-card">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Fuel Consumption (7 days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={FUEL_DATA}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#8884aa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="v1" stroke="#7c3aed" strokeWidth={2} dot={false} name="TN-01-AB" />
                <Line type="monotone" dataKey="v2" stroke="#3b82f6" strokeWidth={2} dot={false} name="TN-02-CD" />
                <Line type="monotone" dataKey="v3" stroke="#22c55e" strokeWidth={2} dot={false} name="KA-03-EF" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle detail table */}
        <div className="cs-card">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Fleet Status Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  {['Vehicle', 'Driver', 'Status', 'Speed', 'Fuel', 'Load', 'Engine°C', 'Risk', 'Route'].map(h => (
                    <th key={h} className="text-left pb-2 pr-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vsArr.map(vs => {
                  const load = vs.loadCells.reduce((s: number, c: any) => s + c.weight, 0);
                  const riskColor = vs.risk.level === 'critical' ? '#ef4444' : vs.risk.level === 'warning' ? '#f59e0b' : '#22c55e';
                  const statusColor = vs.vehicle.status === 'online' ? '#22c55e' : vs.vehicle.status === 'idle' ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={vs.vehicle.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30">
                      <td className="py-2.5 pr-3 font-mono text-purple-400">{vs.vehicle.plateNumber}</td>
                      <td className="pr-3">{vs.vehicle.driver}</td>
                      <td className="pr-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: `${statusColor}20`, color: statusColor }}>{vs.vehicle.status.toUpperCase()}</span></td>
                      <td className="pr-3 font-mono">{vs.vehicle.speed} km/h</td>
                      <td className="pr-3 font-mono">{Math.round(vs.vehicle.fuel)}%</td>
                      <td className="pr-3 font-mono">{(load / 1000).toFixed(1)}t</td>
                      <td className="pr-3 font-mono" style={{ color: vs.obd.engineTemp > 100 ? '#ef4444' : 'inherit' }}>{vs.obd.engineTemp.toFixed(0)}°C</td>
                      <td className="pr-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: `${riskColor}20`, color: riskColor }}>{vs.risk.overall}%</span></td>
                      <td className="text-[10px] text-[var(--muted-foreground)] max-w-[100px] truncate">{vs.vehicle.route || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
