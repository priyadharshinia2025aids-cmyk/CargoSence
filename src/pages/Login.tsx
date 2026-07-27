import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, Chrome, Sun, Moon, AlertCircle, Zap } from 'lucide-react';
import { useAuthStore, useThemeStore } from '../stores/appStore';
import { toast } from 'sonner';

const DEMO_ACCOUNTS = [
  { email: 'admin@cargosense.io', role: 'Admin', color: '#ef4444' },
  { email: 'fleet@cargosense.io', role: 'Fleet Manager', color: '#a855f7' },
  { email: 'driver@cargosense.io', role: 'Driver', color: '#22c55e' },
  { email: 'warehouse@cargosense.io', role: 'Warehouse', color: '#f59e0b' },
  { email: 'supervisor@cargosense.io', role: 'Supervisor', color: '#3b82f6' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@cargosense.io');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle, loginWithMicrosoft } = useAuthStore();
  const { mode, toggle } = useThemeStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome to CargoSense!');
      navigate('/');
    } catch {
      setError('Invalid credentials. Try a demo account below.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'google' | 'microsoft') => {
    setLoading(true);
    try {
      if (provider === 'google') await loginWithGoogle();
      else await loginWithMicrosoft();
      toast.success('Signed in successfully!');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex overflow-hidden">
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(135deg, #0d0a1e 0%, #1a0a2e 40%, #0d0a1e 100%)' }}>
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 animate-float"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-15 animate-float"
          style={{ background: 'radial-gradient(circle, #a855f7, transparent 70%)', animationDelay: '1.5s' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-violet-900 flex items-center justify-center glow-purple">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">CargoSense</div>
              <div className="text-xs text-purple-300 font-mono">ENTERPRISE PLATFORM v2.4</div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Smart Commercial<br />
              <span style={{ background: 'linear-gradient(90deg, #a855f7, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Vehicle Safety
              </span><br />
              Platform
            </h2>
            <p className="text-purple-200/70 text-base leading-relaxed max-w-md">
              Real-time load monitoring, AI-powered risk analysis, and intelligent fleet management for modern logistics operations.
            </p>
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Vehicles Monitored', value: '2,847+' },
            { label: 'Accidents Prevented', value: '1,200+' },
            { label: 'Fleet Efficiency', value: '34% ↑' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="rounded-xl p-4 border border-purple-500/20"
              style={{ background: 'rgba(124,58,237,0.08)' }}
            >
              <div className="text-xl font-bold text-white font-mono">{stat.value}</div>
              <div className="text-[11px] text-purple-300/70 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <button
          onClick={toggle}
          className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield size={20} className="text-purple-400" />
            <span className="text-lg font-bold text-[var(--foreground)]">CargoSense</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1">Sign in</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-7">Access your fleet intelligence dashboard</p>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => handleSocial('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[13px] font-medium text-[var(--foreground)] hover:border-purple-500/50 transition-all disabled:opacity-50"
            >
              <span className="text-base">G</span> Google
            </button>
            <button
              onClick={() => handleSocial('microsoft')}
              disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[13px] font-medium text-[var(--foreground)] hover:border-purple-500/50 transition-all disabled:opacity-50"
            >
              <span className="text-base">⊞</span> Microsoft
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-[11px] text-[var(--muted-foreground)]">or continue with email</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-[var(--muted-foreground)] block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[var(--muted-foreground)] block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-9 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[13px] text-[var(--foreground)] focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-purple-500" />
                <span className="text-[12px] text-[var(--muted-foreground)]">Remember me</span>
              </label>
              <button type="button" className="text-[12px] text-purple-400 hover:text-purple-300">
                Forgot password?
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[12px]">
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <><Zap size={14} /> Sign In</>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <p className="text-[11px] text-[var(--muted-foreground)] mb-2 font-mono">DEMO ACCOUNTS (password: demo1234)</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => setEmail(acc.email)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono border transition-colors hover:border-purple-500/50"
                  style={{
                    borderColor: `${acc.color}40`,
                    color: acc.color,
                    background: `${acc.color}10`,
                  }}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
