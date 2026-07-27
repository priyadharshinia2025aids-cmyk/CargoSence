import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';
import { Package, Plus, AlertTriangle, CheckCircle, Scan, Brain, Trash2 } from 'lucide-react';
import type { Pallet } from '../types';

const MAX_WEIGHT = 30000; // kg per vehicle

function generateBarcode(): string {
  return `CS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

function suggestPosition(pallets: Pallet[], newWeight: number): { position: Pallet['position']; reason: string } {
  const positions: Pallet['position'][] = ['fl', 'fr', 'rl', 'rr', 'center'];
  const weights: Record<string, number> = { fl: 0, fr: 0, rl: 0, rr: 0, center: 0 };
  pallets.forEach(p => { if (p.position) weights[p.position] = (weights[p.position] || 0) + p.weight; });

  // Find least loaded position
  const sorted = positions.sort((a, b) => (weights[a!] || 0) - (weights[b!] || 0));
  const pos = sorted[0] || 'center';

  const labels: Record<string, string> = { fl: 'Front Left', fr: 'Front Right', rl: 'Rear Left', rr: 'Rear Right', center: 'Center' };
  return {
    position: pos,
    reason: `${labels[pos!]} has the lowest load (${((weights[pos!] || 0) / 1000).toFixed(1)}t). Placing here balances the vehicle's center of gravity.`,
  };
}

function LoadHeatmap({ pallets }: { pallets: Pallet[] }) {
  const positions: Pallet['position'][] = ['fl', 'fr', 'rl', 'rr'];
  const weights: Record<string, number> = { fl: 0, fr: 0, rl: 0, rr: 0 };
  pallets.forEach(p => { if (p.position && p.position !== 'center') weights[p.position] = (weights[p.position] || 0) + p.weight; });
  const max = Math.max(...Object.values(weights), 1);

  const posLayout = [
    { id: 'fl', label: 'FL', x: '20%', y: '20%' },
    { id: 'fr', label: 'FR', x: '65%', y: '20%' },
    { id: 'rl', label: 'RL', x: '20%', y: '65%' },
    { id: 'rr', label: 'RR', x: '65%', y: '65%' },
  ];

  return (
    <div className="relative bg-[var(--muted)] rounded-xl" style={{ height: 200 }}>
      <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full opacity-30">
        <rect x="20" y="15" width="360" height="170" rx="10" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="5 3" />
        <rect x="270" y="30" width="90" height="80" rx="5" fill="none" stroke="#7c3aed" strokeWidth="1" />
        <text x="200" y="10" textAnchor="middle" fill="#7c3aed" fontSize="9" fontFamily="monospace">FRONT</text>
        <text x="200" y="195" textAnchor="middle" fill="#7c3aed" fontSize="9" fontFamily="monospace">REAR</text>
        <line x1="200" y1="15" x2="200" y2="185" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="3 2" />
        <line x1="20" y1="100" x2="380" y2="100" stroke="#7c3aed" strokeWidth="0.5" strokeDasharray="3 2" />
      </svg>
      {posLayout.map(p => {
        const w = weights[p.id] || 0;
        const pct = w / max;
        const color = pct > 0.8 ? '#ef4444' : pct > 0.5 ? '#f59e0b' : '#22c55e';
        return (
          <div key={p.id} className="absolute" style={{ left: p.x, top: p.y, transform: 'translate(-50%,-50%)' }}>
            <div className="w-16 h-14 rounded-xl flex flex-col items-center justify-center border-2"
              style={{ background: `${color}25`, borderColor: `${color}60` }}>
              <div className="text-[11px] font-bold font-mono" style={{ color }}>{(w / 1000).toFixed(1)}t</div>
              <div className="text-[9px] text-[var(--muted-foreground)]">{p.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Warehouse() {
  const [pallets, setPallets] = useState<Pallet[]>([
    { id: '1', description: 'Electronics - Batch A', weight: 2400, destination: 'Bangalore', barcode: 'CS-AB1234', position: 'fl', status: 'loaded' },
    { id: '2', description: 'FMCG Goods - Cartons', weight: 1800, destination: 'Chennai', barcode: 'CS-CD5678', position: 'fr', status: 'loaded' },
    { id: '3', description: 'Auto Parts - Heavy', weight: 3200, destination: 'Pune', barcode: 'CS-EF9012', position: 'rl', status: 'loaded' },
  ]);
  const [form, setForm] = useState({ description: '', weight: '', destination: '' });
  const [suggestion, setSuggestion] = useState<{ position: Pallet['position']; reason: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const totalWeight = pallets.filter(p => p.status === 'loaded').reduce((s, p) => s + p.weight, 0);
  const capacityPct = (totalWeight / MAX_WEIGHT) * 100;

  const handleAnalyze = () => {
    const w = parseFloat(form.weight);
    if (!w || w <= 0) return;
    setSuggestion(suggestPosition(pallets, w));
  };

  const handleAdd = () => {
    if (!form.description || !form.weight || !form.destination || !suggestion) return;
    const newPallet: Pallet = {
      id: Date.now().toString(),
      description: form.description,
      weight: parseFloat(form.weight),
      destination: form.destination,
      barcode: generateBarcode(),
      position: suggestion.position,
      status: 'loaded',
    };
    setPallets(prev => [...prev, newPallet]);
    setForm({ description: '', weight: '', destination: '' });
    setSuggestion(null);
    setShowAdd(false);
  };

  // Detect imbalance
  const posWeights: Record<string, number> = { fl: 0, fr: 0, rl: 0, rr: 0 };
  pallets.filter(p => p.status === 'loaded' && p.position !== 'center').forEach(p => {
    if (p.position) posWeights[p.position] = (posWeights[p.position] || 0) + p.weight;
  });
  const leftLoad = (posWeights.fl || 0) + (posWeights.rl || 0);
  const rightLoad = (posWeights.fr || 0) + (posWeights.rr || 0);
  const imbalancePct = (leftLoad + rightLoad) > 0 ? Math.abs(leftLoad - rightLoad) / (leftLoad + rightLoad) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      <Header title="Warehouse Module" subtitle="Smart cargo registration & AI load redistribution" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Capacity overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Load', value: `${(totalWeight / 1000).toFixed(2)}t`, color: capacityPct > 90 ? '#ef4444' : '#22c55e' },
            { label: 'Capacity Used', value: `${capacityPct.toFixed(1)}%`, color: capacityPct > 90 ? '#ef4444' : capacityPct > 70 ? '#f59e0b' : '#22c55e' },
            { label: 'Remaining', value: `${((MAX_WEIGHT - totalWeight) / 1000).toFixed(2)}t`, color: '#3b82f6' },
            { label: 'Pallets Loaded', value: pallets.filter(p => p.status === 'loaded').length, color: '#a855f7' },
          ].map(m => (
            <div key={m.label} className="cs-card">
              <div className="text-[10px] text-[var(--muted-foreground)]">{m.label}</div>
              <div className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Imbalance warning */}
        <AnimatePresence>
          {imbalancePct > 12 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="cs-card border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-yellow-400">Load Imbalance Detected: {imbalancePct.toFixed(1)}%</div>
                  <div className="text-[12px] text-[var(--muted-foreground)] mt-1">
                    {leftLoad > rightLoad
                      ? `Move approximately ${Math.round((leftLoad - rightLoad) / 2)} kg from Rear Left or Front Left to the right side.`
                      : `Move approximately ${Math.round((rightLoad - leftLoad) / 2)} kg from Rear Right or Front Right to the left side.`}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Load heatmap */}
          <div className="cs-card">
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">LOAD DISTRIBUTION HEATMAP</h3>
            <LoadHeatmap pallets={pallets} />
          </div>

          {/* Add pallet form */}
          <div className="cs-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)]">REGISTER CARGO</h3>
              <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[12px] font-semibold">
                <Plus size={13} /> Add Pallet
              </button>
            </div>
            <AnimatePresence>
              {showAdd && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  {[
                    { label: 'Description', key: 'description', placeholder: 'Cargo description' },
                    { label: 'Weight (kg)', key: 'weight', placeholder: 'Weight in kg', type: 'number' },
                    { label: 'Destination', key: 'destination', placeholder: 'Destination city' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[11px] text-[var(--muted-foreground)] block mb-1">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        value={(form as any)[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-[13px] text-[var(--foreground)] focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                  <button onClick={handleAnalyze} className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[var(--muted)] border border-purple-500/30 text-purple-400 text-[12px] font-semibold hover:bg-purple-500/10">
                    <Brain size={14} /> AI Suggest Position
                  </button>
                  <AnimatePresence>
                    {suggestion && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
                        <div className="text-[12px] font-bold text-purple-400 mb-1">
                          ✨ Suggested: {suggestion.position?.toUpperCase()}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)]">{suggestion.reason}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex gap-2">
                    <button onClick={handleAdd} disabled={!suggestion}
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-[12px] font-semibold disabled:opacity-40">
                      <CheckCircle size={13} /> Confirm Load
                    </button>
                    <button onClick={() => { setShowAdd(false); setSuggestion(null); }}
                      className="px-4 h-9 rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)] text-[12px]">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pallet list */}
        <div className="cs-card">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Loaded Pallets</h3>
          <div className="space-y-2">
            {pallets.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--muted)] hover:bg-[var(--secondary)] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Package size={16} className="text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[var(--foreground)] truncate">{p.description}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{p.barcode}</span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">→ {p.destination}</span>
                    <span className="text-[10px] font-mono text-purple-400">{p.position?.toUpperCase()}</span>
                  </div>
                </div>
                <div className="text-[12px] font-mono font-bold text-[var(--foreground)]">{(p.weight / 1000).toFixed(2)}t</div>
                <button onClick={() => setPallets(prev => prev.filter(x => x.id !== p.id))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
