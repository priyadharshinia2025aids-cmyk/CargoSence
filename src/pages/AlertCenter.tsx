import { motion, AnimatePresence } from 'framer-motion';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { Bell, CheckCircle, Trash2, Filter, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { useState } from 'react';
import type { Alert } from '../types';

const ALERT_ICONS: Record<string, any> = {
  overload: AlertOctagon,
  load_imbalance: AlertTriangle,
  rollover_risk: AlertOctagon,
  engine_fault: AlertTriangle,
  battery_low: Info,
  gps_lost: AlertTriangle,
  harsh_braking: AlertTriangle,
  high_speed: AlertTriangle,
  cargo_shift: AlertOctagon,
};

const ALERT_COLORS: Record<string, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

function AlertCard({ alert, onAck }: { alert: Alert; onAck: (id: string) => void }) {
  const Icon = ALERT_ICONS[alert.type] || Bell;
  const color = ALERT_COLORS[alert.severity] || '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${alert.acknowledged ? 'opacity-50 border-[var(--border)]' : ''}`}
      style={{ background: `${color}08`, borderColor: `${color}30` }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[12px] font-semibold text-[var(--foreground)]">{alert.message}</span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{alert.vehicle}</span>
              <span className="text-[10px] text-[var(--muted-foreground)]">{alert.timestamp.toLocaleTimeString()}</span>
              {alert.location && <span className="text-[10px] text-[var(--muted-foreground)] truncate max-w-[120px]">📍 {alert.location}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: `${color}20`, color }}>
              {alert.severity.toUpperCase()}
            </span>
            {!alert.acknowledged && (
              <button
                onClick={() => onAck(alert.id)}
                className="w-7 h-7 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-green-400 hover:bg-green-400/10 transition-colors"
              >
                <CheckCircle size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AlertCenter() {
  const { alerts, acknowledgeAlert, clearAlerts } = useSimStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'unacked'>('all');

  const filtered = alerts.filter(a => {
    if (filter === 'critical') return a.severity === 'critical';
    if (filter === 'warning') return a.severity === 'warning';
    if (filter === 'unacked') return !a.acknowledged;
    return true;
  });

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length,
    total: alerts.length,
    unacked: alerts.filter(a => !a.acknowledged).length,
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Alert Center" subtitle="Real-time fleet safety alerts & notifications" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical Alerts', count: stats.critical, color: '#ef4444' },
            { label: 'Warnings', count: stats.warning, color: '#f59e0b' },
            { label: 'Unacknowledged', count: stats.unacked, color: '#a855f7' },
            { label: 'Total Today', count: stats.total, color: '#3b82f6' },
          ].map(s => (
            <div key={s.label} className="cs-card">
              <div className="text-[10px] text-[var(--muted-foreground)]">{s.label}</div>
              <div className="text-2xl font-bold font-mono mt-1" style={{ color: s.color }}>{s.count}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {(['all', 'critical', 'warning', 'unacked'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${filter === f ? 'bg-purple-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => filtered.forEach(a => !a.acknowledged && acknowledgeAlert(a.id))}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-green-400 bg-green-400/10 border border-green-400/20 hover:bg-green-400/20"
          >
            <CheckCircle size={13} /> Ack All
          </button>
          <button
            onClick={clearAlerts}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20"
          >
            <Trash2 size={13} /> Clear All
          </button>
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-[var(--muted-foreground)]"
              >
                <Bell size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No alerts match your filter</p>
              </motion.div>
            ) : (
              filtered.map(alert => (
                <AlertCard key={alert.id} alert={alert} onAck={acknowledgeAlert} />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
