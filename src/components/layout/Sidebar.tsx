import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Truck, Scale, Activity, Map, Camera,
  Bot, Volume2, Gauge, Users, Package, Box, MapPin,
  Bell, BarChart3, FileText, Settings, MessageCircle,
  ChevronLeft, ChevronRight, LogOut, Shield, Zap,
  Radio, Navigation
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../stores/appStore';
import { useSimStore } from '../../stores/appStore';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'] },
  { to: '/fleet', icon: Truck, label: 'Live Trucks', roles: ['all'] },
  { to: '/load', icon: Scale, label: 'Load Monitor', roles: ['all'] },
  { to: '/sensors', icon: Activity, label: 'Sensors', roles: ['all'] },
  { to: '/road', icon: Navigation, label: 'Road Intel', roles: ['all'] },
  { to: '/camera', icon: Camera, label: 'Camera AI', roles: ['all'] },
  { to: '/digital-twin', icon: Box, label: 'Digital Twin', roles: ['all'] },
  { to: '/map', icon: MapPin, label: 'Live Map', roles: ['all'] },
  { to: '/ai-agent', icon: Bot, label: 'AI Agent', roles: ['all'] },
  { to: '/voice', icon: Volume2, label: 'Voice Alerts', roles: ['all'] },
  { to: '/driver', icon: Gauge, label: 'Driver HUD', roles: ['driver', 'admin', 'fleet_manager', 'transport_supervisor'] },
  { to: '/fleet-manager', icon: Users, label: 'Fleet Mgr', roles: ['fleet_manager', 'admin', 'transport_supervisor'] },
  { to: '/warehouse', icon: Package, label: 'Warehouse', roles: ['warehouse_operator', 'admin', 'transport_supervisor'] },
  { to: '/alerts', icon: Bell, label: 'Alerts', roles: ['all'] },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['all'] },
  { to: '/reports', icon: FileText, label: 'Reports', roles: ['all'] },
  { to: '/ai-chat', icon: MessageCircle, label: 'AI Chat', roles: ['all'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['all'] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { alerts } = useSimStore();
  const navigate = useNavigate();
  const unacked = alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes('all') || (user && item.roles.includes(user.role))
  );

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-[var(--card)] border-r border-[var(--border)] z-40 shrink-0"
      style={{ overflow: 'hidden' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-900 flex items-center justify-center shrink-0 glow-purple">
          <Shield size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="text-sm font-bold text-[var(--foreground)] leading-tight">CargoSense</div>
              <div className="text-[10px] text-[var(--muted-foreground)] leading-tight font-mono">v2.4.1 ENTERPRISE</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Online indicator */}
      {!sidebarCollapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[var(--muted)] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-green shrink-0" />
          <span className="text-[11px] text-[var(--muted-foreground)] font-mono">SIM LIVE · 5 VEHICLES</span>
          <Radio size={10} className="text-purple-400 ml-auto animate-pulse" />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            {({ isActive }) => (
              <div
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon size={17} className="shrink-0" />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-[13px]"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.to === '/alerts' && unacked > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse-red">
                    {unacked}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--border)] p-3 shrink-0">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {user.avatar}
            </div>
            <div className="overflow-hidden">
              <div className="text-[12px] font-semibold text-[var(--foreground)] truncate">{user.name}</div>
              <div className="text-[10px] text-[var(--muted-foreground)] capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title={sidebarCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={15} className="shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-purple-500 transition-colors z-50"
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
