import { create } from 'zustand';
import type { User, UserRole, Alert, VehicleSimState, WeatherData, ThemeMode } from '../types';
import {
  generateVehicles, initVehicleState, simulateVehicle, generateAlerts, generateWeather
} from '../simulation/engine';

// ─── Auth Store ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
}

const DEMO_USERS: Record<string, User> = {
  'admin@cargosense.io': { id: 'u1', name: 'Arun Krishnamurthy', email: 'admin@cargosense.io', role: 'admin', avatar: 'AK' },
  'fleet@cargosense.io': { id: 'u2', name: 'Meera Nair', email: 'fleet@cargosense.io', role: 'fleet_manager', avatar: 'MN' },
  'driver@cargosense.io': { id: 'u3', name: 'Rajesh Kumar', email: 'driver@cargosense.io', role: 'driver', avatar: 'RK', vehicle: 'TN-01-AB-1234' },
  'warehouse@cargosense.io': { id: 'u4', name: 'Priya Devi', email: 'warehouse@cargosense.io', role: 'warehouse_operator', avatar: 'PD' },
  'supervisor@cargosense.io': { id: 'u5', name: 'Venkat Rao', email: 'supervisor@cargosense.io', role: 'transport_supervisor', avatar: 'VR' },
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email, _password, role) => {
    await new Promise(r => setTimeout(r, 1200));
    const user = DEMO_USERS[email] || {
      id: 'u99', name: email.split('@')[0], email,
      role: role || 'fleet_manager', avatar: email.slice(0, 2).toUpperCase(),
    };
    set({ user, isAuthenticated: true });
  },
  loginWithGoogle: async () => {
    await new Promise(r => setTimeout(r, 1000));
    set({ user: DEMO_USERS['fleet@cargosense.io'], isAuthenticated: true });
  },
  loginWithMicrosoft: async () => {
    await new Promise(r => setTimeout(r, 1000));
    set({ user: DEMO_USERS['admin@cargosense.io'], isAuthenticated: true });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// ─── Theme Store ─────────────────────────────────────────────────────────────

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  set: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'dark',
  toggle: () => set(s => {
    const next = s.mode === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', next === 'light');
    return { mode: next };
  }),
  set: (mode) => {
    document.documentElement.classList.toggle('light', mode === 'light');
    set({ mode });
  },
}));

// ─── Simulation Store ─────────────────────────────────────────────────────────

interface SimStore {
  tick: number;
  vehicles: Record<string, VehicleSimState>;
  weather: WeatherData;
  alerts: Alert[];
  selectedVehicleId: string;
  isRunning: boolean;
  init: () => void;
  tick_: () => void;
  selectVehicle: (id: string) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlerts: () => void;
}

let simInterval: ReturnType<typeof setInterval> | null = null;

export const useSimStore = create<SimStore>((set, get) => ({
  tick: 0,
  vehicles: {},
  weather: generateWeather(0) as WeatherData,
  alerts: [],
  selectedVehicleId: 'v1',
  isRunning: false,

  init: () => {
    const vArr = generateVehicles();
    const vehicles: Record<string, VehicleSimState> = {};
    vArr.forEach(v => { vehicles[v.id] = initVehicleState(v); });
    const weather = generateWeather(0) as WeatherData;
    set({ vehicles, weather, isRunning: true, tick: 0 });

    if (simInterval) clearInterval(simInterval);
    simInterval = setInterval(() => {
      get().tick_();
    }, 1000);
  },

  tick_: () => {
    const { tick, vehicles, alerts } = get();
    const newTick = tick + 1;
    const weather = generateWeather(newTick) as WeatherData;

    const newVehicles: Record<string, VehicleSimState> = {};
    Object.entries(vehicles).forEach(([id, vs]) => {
      newVehicles[id] = simulateVehicle(vs, newTick, weather);
    });

    const vsArr = Object.values(newVehicles);
    const newAlerts = generateAlerts(vsArr, alerts);

    set({ tick: newTick, vehicles: newVehicles, weather, alerts: newAlerts });
  },

  selectVehicle: (id) => set({ selectedVehicleId: id }),
  acknowledgeAlert: (id) => set(s => ({
    alerts: s.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a)
  })),
  clearAlerts: () => set({ alerts: [] }),
}));

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}));
