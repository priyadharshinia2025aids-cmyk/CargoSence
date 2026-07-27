import { motion } from 'framer-motion';
import { Bell, Sun, Moon, Search, RefreshCw, Wifi, Clock } from 'lucide-react';
import { useAuthStore, useThemeStore, useSimStore } from '../../stores/appStore';
import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuthStore();
  const { mode, toggle } = useThemeStore();
  const { alerts, tick } = useSimStore();
  const [time, setTime] = useState(new Date());
  const unacked = alerts.filter(a => !a.acknowledged).length;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-14 border-b border-[var(--border)] bg-[var(--card)] flex items-center px-5 gap-4 shrink-0 z-30">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-[var(--foreground)] truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-[var(--muted-foreground)]">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-[var(--muted)] rounded-lg px-3 py-1.5 text-[13px] text-[var(--muted-foreground)] w-48">
        <Search size={13} />
        <span>Search...</span>
      </div>

      {/* Live tick indicator */}
      <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-purple-400">
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-1.5 h-1.5 rounded-full bg-purple-400"
        />
        T+{tick}s
      </div>

      {/* Time */}
      <div className="hidden lg:flex items-center gap-1.5 text-[12px] font-mono text-[var(--muted-foreground)]">
        <Clock size={12} />
        {time.toLocaleTimeString('en-IN', { hour12: false })}
      </div>

      {/* WiFi indicator */}
      <div className="flex items-center gap-1 text-green-400">
        <Wifi size={14} />
        <span className="text-[11px] font-mono hidden lg:block">LIVE</span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
      >
        {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Alerts bell */}
      <button className="relative w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
        <Bell size={15} />
        {unacked > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
          >
            {unacked > 9 ? '9+' : unacked}
          </motion.span>
        )}
      </button>

      {/* Avatar */}
      {user && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-[12px] font-bold text-white cursor-pointer">
          {user.avatar}
        </div>
      )}
    </header>
  );
}
