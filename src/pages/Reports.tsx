import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import { FileText, Download, Calendar, Truck, AlertTriangle, Wrench } from 'lucide-react';
import { useSimStore } from '../stores/appStore';

const REPORT_TYPES = [
  { id: 'trip', label: 'Trip Report', icon: Truck, description: 'Complete trip history with route, load, and risk data' },
  { id: 'risk', label: 'Risk Report', icon: AlertTriangle, description: 'Safety incidents, risk events, and driver behavior analysis' },
  { id: 'maintenance', label: 'Maintenance Report', icon: Wrench, description: 'Vehicle health, DTC codes, and maintenance schedule' },
];

function generateTripCSV(vehicles: any[]) {
  const rows = ['Trip ID,Vehicle,Driver,Origin,Destination,Distance (km),Duration,Avg Speed,Fuel Used,Risk Events,Status'];
  vehicles.forEach((vs, i) => {
    rows.push(`T-${2840 + i},${vs.vehicle.plateNumber},${vs.vehicle.driver},Chennai,Bangalore,${(150 + Math.random() * 200).toFixed(0)},${Math.floor(3 + Math.random() * 5)}h ${Math.floor(Math.random() * 60)}m,${(50 + Math.random() * 30).toFixed(0)} km/h,${(40 + Math.random() * 30).toFixed(1)} L,${Math.floor(Math.random() * 5)},Completed`);
  });
  return rows.join('\n');
}

function generateRiskCSV(vehicles: any[]) {
  const rows = ['Vehicle,Driver,Avg Risk,Max Risk,Rollover Events,Overload Events,Speed Violations,Risk Level'];
  vehicles.forEach(vs => {
    rows.push(`${vs.vehicle.plateNumber},${vs.vehicle.driver},${vs.risk.overall}%,${Math.min(vs.risk.overall + 20, 100)}%,${Math.floor(vs.risk.rollover / 25)},${Math.floor(vs.risk.overload / 30)},${Math.floor(vs.risk.speedCompliance / 20)},${vs.risk.level.toUpperCase()}`);
  });
  return rows.join('\n');
}

function generateMaintenanceCSV(vehicles: any[]) {
  const rows = ['Vehicle,Driver,Engine Temp,Battery,Fuel,RPM,DTC Codes,Next Service,Status'];
  vehicles.forEach(vs => {
    rows.push(`${vs.vehicle.plateNumber},${vs.vehicle.driver},${vs.obd.engineTemp.toFixed(1)}°C,${vs.obd.batteryVoltage.toFixed(2)}V,${Math.round(vs.vehicle.fuel)}%,${Math.round(vs.obd.rpm)} rpm,${vs.obd.dtcCodes.join(';') || 'None'},30 days,${vs.vehicle.status}`);
  });
  return rows.join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { vehicles } = useSimStore();
  const vsArr = Object.values(vehicles);
  const [generating, setGenerating] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('last7');

  const generate = async (type: string) => {
    setGenerating(type);
    await new Promise(r => setTimeout(r, 1200));
    const date = new Date().toISOString().split('T')[0];
    switch (type) {
      case 'trip': downloadCSV(generateTripCSV(vsArr), `trip-report-${date}.csv`); break;
      case 'risk': downloadCSV(generateRiskCSV(vsArr), `risk-report-${date}.csv`); break;
      case 'maintenance': downloadCSV(generateMaintenanceCSV(vsArr), `maintenance-report-${date}.csv`); break;
    }
    setGenerating(null);
  };

  const MAINTENANCE = [
    { vehicle: 'TN-01-AB-1234', type: 'Oil Change', date: '2025-12-15', cost: 3500, status: 'scheduled', technician: 'Service Center Chennai' },
    { vehicle: 'TN-02-CD-5678', type: 'Tyre Rotation', date: '2025-12-20', cost: 1200, status: 'due', technician: 'Mobile Unit' },
    { vehicle: 'MH-04-GH-3456', type: 'Engine Overhaul', date: '2025-12-10', cost: 45000, status: 'in-progress', technician: 'Volvo Service' },
    { vehicle: 'AP-05-IJ-7890', type: 'Brake Inspection', date: '2025-12-28', cost: 2000, status: 'scheduled', technician: 'RTA Authorized' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Reports" subtitle="Generate & download fleet reports" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Date range */}
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-[var(--muted-foreground)]" />
          <div className="flex gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'last7', label: 'Last 7 Days' },
              { id: 'last30', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom' },
            ].map(d => (
              <button key={d.id} onClick={() => setDateRange(d.id)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${dateRange === d.id ? 'bg-purple-600 text-white' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Report types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORT_TYPES.map(rt => (
            <motion.div
              key={rt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="cs-card hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <rt.icon size={18} className="text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)]">{rt.label}</h3>
              </div>
              <p className="text-[12px] text-[var(--muted-foreground)] mb-4">{rt.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => generate(rt.id)}
                  disabled={generating === rt.id}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-purple-600 text-white text-[12px] font-semibold hover:bg-purple-500 disabled:opacity-60"
                >
                  {generating === rt.id ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><Download size={13} /> CSV</>
                  )}
                </button>
                <button
                  onClick={() => generate(rt.id)}
                  disabled={generating === rt.id}
                  className="px-3 h-9 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-[12px] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  PDF
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Maintenance schedule */}
        <div className="cs-card">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Maintenance Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[var(--muted-foreground)] border-b border-[var(--border)]">
                  {['Vehicle', 'Type', 'Date', 'Cost (₹)', 'Technician', 'Status'].map(h => (
                    <th key={h} className="text-left pb-2 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MAINTENANCE.map((m, i) => {
                  const statusColor = m.status === 'in-progress' ? '#3b82f6' : m.status === 'due' ? '#ef4444' : '#f59e0b';
                  return (
                    <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--muted)]/30">
                      <td className="py-2.5 pr-4 font-mono text-purple-400">{m.vehicle}</td>
                      <td className="pr-4">{m.type}</td>
                      <td className="pr-4 font-mono">{m.date}</td>
                      <td className="pr-4 font-mono">₹{m.cost.toLocaleString()}</td>
                      <td className="pr-4 text-[var(--muted-foreground)]">{m.technician}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono capitalize" style={{ background: `${statusColor}20`, color: statusColor }}>
                          {m.status.replace('-', ' ')}
                        </span>
                      </td>
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
