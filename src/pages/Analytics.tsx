import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const PERIODS = ['Daily', 'Weekly', 'Monthly'];

function generateData(period: string) {
  const labels = period === 'Daily' ? ['00', '04', '08', '12', '16', '20', '24'] :
    period === 'Weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return labels.map(label => ({
    label,
    risk: Math.round(20 + Math.random() * 55),
    load: Math.round(60 + Math.random() * 30),
    fuel: Math.round(55 + Math.random() * 35),
    trips: Math.round(3 + Math.random() * 12),
    downtime: Math.round(Math.random() * 4),
    maintenance: Math.round(Math.random() * 3),
  }));
}

const PIE_DATA = [
  { name: 'Overload', value: 28, color: '#ef4444' },
  { name: 'High Speed', value: 22, color: '#f59e0b' },
  { name: 'Rollover Risk', value: 18, color: '#a855f7' },
  { name: 'Cargo Shift', value: 15, color: '#3b82f6' },
  { name: 'Engine Fault', value: 10, color: '#22c55e' },
  { name: 'Battery', value: 7, color: '#06b6d4' },
];

export default function Analytics() {
  const [period, setPeriod] = useState('Weekly');
  const data = generateData(period);

  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" subtitle="Fleet performance metrics & trend analysis" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Period selector */}
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${period === p ? 'bg-purple-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}>
              {p}
            </button>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Risk Score', value: '38%', trend: -12, color: '#22c55e' },
            { label: 'Total Trips', value: `${data.reduce((s, d) => s + d.trips, 0)}`, trend: 8, color: '#a855f7' },
            { label: 'Fuel Efficiency', value: '4.2 km/L', trend: 5, color: '#3b82f6' },
            { label: 'Downtime Hours', value: `${data.reduce((s, d) => s + d.downtime, 0)}h`, trend: -15, color: '#f59e0b' },
          ].map(m => (
            <div key={m.label} className="cs-card">
              <div className="text-[10px] text-[var(--muted-foreground)]">{m.label}</div>
              <div className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</div>
              <div className={`flex items-center gap-1 mt-1 text-[11px] ${m.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {m.trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(m.trend)}% vs prev {period.toLowerCase()}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Risk trend */}
          <div className="cs-card">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Risk Score Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="riskG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8884aa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="risk" stroke="#ef4444" fill="url(#riskG)" strokeWidth={2} dot={false} name="Risk %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Alert distribution */}
          <div className="cs-card">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Alert Type Distribution</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {PIE_DATA.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-[var(--muted-foreground)] flex-1">{d.name}</span>
                    <span className="font-mono font-bold" style={{ color: d.color }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trips & fuel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="cs-card">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Trips & Maintenance</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8884aa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="trips" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Trips" />
                <Bar dataKey="maintenance" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Maintenance events" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="cs-card">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Fuel Level Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#8884aa' }} />
                <YAxis tick={{ fontSize: 10, fill: '#8884aa' }} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="fuel" stroke="#22c55e" strokeWidth={2} dot={false} name="Fuel %" />
                <Line type="monotone" dataKey="load" stroke="#3b82f6" strokeWidth={2} dot={false} name="Load %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
