import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import { useAuthStore, useThemeStore } from '../stores/appStore';
import { User, Bell, Globe, Ruler, Key, Palette, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

function SettingSection({ title, icon: Icon, children }: any) {
  return (
    <div className="cs-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Icon size={16} className="text-purple-400" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)]/50 last:border-0">
      <div>
        <div className="text-[13px] text-[var(--foreground)]">{label}</div>
        {description && <div className="text-[11px] text-[var(--muted-foreground)]">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5.5 rounded-full transition-colors relative ${checked ? 'bg-purple-600' : 'bg-[var(--muted)]'}`}
        style={{ width: 40, height: 22 }}
      >
        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuthStore();
  const { mode, set: setTheme } = useThemeStore();
  const [notifications, setNotifications] = useState({ critical: true, warnings: true, maintenance: true, gps: false, email: true, sms: false });
  const [units, setUnits] = useState({ weight: 'kg', speed: 'kmh', temp: 'celsius', distance: 'km' });
  const [saved, setSaved] = useState(false);

  const save = () => {
    toast.success('Settings saved successfully');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" subtitle="Platform configuration & preferences" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Profile */}
        <SettingSection title="Driver Profile" icon={User}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-2xl font-bold text-white">
              {user?.avatar}
            </div>
            <div>
              <div className="text-base font-semibold text-[var(--foreground)]">{user?.name}</div>
              <div className="text-[12px] text-[var(--muted-foreground)]">{user?.email}</div>
              <div className="text-[11px] text-purple-400 capitalize">{user?.role.replace('_', ' ')}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Full Name', value: user?.name || '', placeholder: 'Your name' },
              { label: 'Email', value: user?.email || '', placeholder: 'Email address' },
              { label: 'Phone', value: '+91 98765 43210', placeholder: 'Phone number' },
              { label: 'License No.', value: 'TN-0120210123456', placeholder: 'License number' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">{f.label}</label>
                <input
                  defaultValue={f.value}
                  placeholder={f.placeholder}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[13px] text-[var(--foreground)] focus:outline-none focus:border-purple-500"
                />
              </div>
            ))}
          </div>
        </SettingSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Theme */}
          <SettingSection title="Appearance" icon={Palette}>
            <div className="flex gap-3 mb-3">
              {[{ id: 'dark', label: 'Dark Mode' }, { id: 'light', label: 'Light Mode' }].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`flex-1 py-2.5 rounded-xl text-[13px] font-medium transition-all border ${mode === t.id ? 'border-purple-500/60 bg-purple-500/15 text-purple-400' : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-purple-500/30'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-[var(--muted-foreground)]">UI accent color: Purple Violet</div>
          </SettingSection>

          {/* Language */}
          <SettingSection title="Language & Region" icon={Globe}>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">Interface Language</label>
                <select className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[13px] text-[var(--foreground)] focus:outline-none focus:border-purple-500">
                  <option>English</option>
                  <option>Tamil</option>
                  <option>Hindi</option>
                  <option>Telugu</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">Voice Alert Language</label>
                <select className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[13px] text-[var(--foreground)] focus:outline-none focus:border-purple-500">
                  <option>English</option>
                  <option>Tamil</option>
                  <option>Hindi</option>
                  <option>Telugu</option>
                  <option>Kannada</option>
                  <option>Malayalam</option>
                </select>
              </div>
            </div>
          </SettingSection>
        </div>

        {/* Notifications */}
        <SettingSection title="Notifications" icon={Bell}>
          <div>
            <Toggle label="Critical Alerts" description="Rollover risk, overload, engine failure" checked={notifications.critical} onChange={(v: boolean) => setNotifications(p => ({ ...p, critical: v }))} />
            <Toggle label="Safety Warnings" description="Speed violations, load imbalance" checked={notifications.warnings} onChange={(v: boolean) => setNotifications(p => ({ ...p, warnings: v }))} />
            <Toggle label="Maintenance Alerts" description="Service due, DTC codes" checked={notifications.maintenance} onChange={(v: boolean) => setNotifications(p => ({ ...p, maintenance: v }))} />
            <Toggle label="GPS Events" description="Geofence, GPS signal lost" checked={notifications.gps} onChange={(v: boolean) => setNotifications(p => ({ ...p, gps: v }))} />
            <Toggle label="Email Notifications" description="Daily summary email" checked={notifications.email} onChange={(v: boolean) => setNotifications(p => ({ ...p, email: v }))} />
            <Toggle label="SMS Alerts" description="Critical alerts via SMS" checked={notifications.sms} onChange={(v: boolean) => setNotifications(p => ({ ...p, sms: v }))} />
          </div>
        </SettingSection>

        {/* Units */}
        <SettingSection title="Measurement Units" icon={Ruler}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Weight', options: ['kg', 'lb', 'tonne'], key: 'weight' },
              { label: 'Speed', options: ['km/h', 'mph', 'm/s'], key: 'speed' },
              { label: 'Temperature', options: ['celsius', 'fahrenheit', 'kelvin'], key: 'temp' },
              { label: 'Distance', options: ['km', 'miles', 'm'], key: 'distance' },
            ].map(u => (
              <div key={u.key}>
                <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">{u.label}</label>
                <select
                  value={(units as any)[u.key]}
                  onChange={e => setUnits(p => ({ ...p, [u.key]: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[13px] text-[var(--foreground)] focus:outline-none focus:border-purple-500"
                >
                  {u.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
        </SettingSection>

        {/* API Keys */}
        <SettingSection title="API Configuration" icon={Key}>
          <div className="space-y-3">
            {[
              { label: 'Groq API Key', placeholder: 'gsk_...' },
              { label: 'OpenRouteService API', placeholder: 'Your ORS key' },
              { label: 'Supabase URL', placeholder: 'https://xxx.supabase.co' },
              { label: 'Supabase Anon Key', placeholder: 'eyJ...' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">{f.label}</label>
                <input
                  type="password"
                  placeholder={f.placeholder}
                  className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[13px] text-[var(--foreground)] focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            ))}
          </div>
        </SettingSection>

        {/* Save button */}
        <div className="flex justify-end">
          <motion.button
            onClick={save}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90"
          >
            <Save size={15} />
            {saved ? 'Saved!' : 'Save Settings'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
