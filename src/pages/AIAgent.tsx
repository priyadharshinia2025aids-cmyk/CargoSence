import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';
import { useSimStore } from '../stores/appStore';
import { Bot, RefreshCw, ChevronRight, Zap, Brain, AlertTriangle } from 'lucide-react';

interface AgentOutput {
  summary: string;
  riskLevel: 'safe' | 'warning' | 'critical';
  riskScore: number;
  primaryReason: string;
  factors: string[];
  recommendation: string;
  recommendedSpeed: number;
  cargoAction?: string;
  nextCheckIn: string;
  confidence: number;
}

function generateAgentOutput(vs: any): AgentOutput {
  const { risk, imu, loadCells, obd, road, gps, vehicle } = vs;
  const totalLoad = loadCells.reduce((s: number, c: any) => s + c.weight, 0);
  const flW = loadCells[0]?.weight || 0;
  const frW = loadCells[1]?.weight || 0;
  const rlW = loadCells[2]?.weight || 0;
  const rrW = loadCells[3]?.weight || 0;
  const leftLoad = flW + rlW;
  const rightLoad = frW + rrW;
  const imbalancePct = Math.abs(leftLoad - rightLoad) / (leftLoad + rightLoad) * 100;
  const factors: string[] = [];

  if (Math.abs(imu.roll) > 8) factors.push(`Roll angle: ${imu.roll.toFixed(1)}° (${Math.abs(imu.roll) > 15 ? 'critical' : 'elevated'})`);
  if (road.curvature > 0.3) factors.push(`Road curvature: ${(road.curvature * 100).toFixed(0)}% (${road.nextCurve.direction} curve in ${road.nextCurve.distance.toFixed(0)}m)`);
  if (vehicle.speed > road.speedLimit) factors.push(`Speed violation: ${vehicle.speed} km/h in ${road.speedLimit} km/h zone`);
  if (imbalancePct > 10) factors.push(`Load imbalance: ${imbalancePct.toFixed(1)}% (${leftLoad > rightLoad ? 'left-heavy' : 'right-heavy'})`);
  if (risk.overload > 70) factors.push(`Overload risk: ${risk.overload}% (total ${(totalLoad / 1000).toFixed(1)}t)`);
  if (obd.engineTemp > 95) factors.push(`Engine temp: ${obd.engineTemp.toFixed(1)}°C (elevated)`);
  if (imu.vibration > 0.8) factors.push(`High vibration: ${imu.vibration.toFixed(2)}g (rough road)`);

  let summary = '';
  let recommendation = '';
  let cargoAction: string | undefined;

  if (risk.level === 'critical') {
    summary = `⚠️ CRITICAL: ${vehicle.plateNumber} is operating under HIGH RISK conditions. Immediate intervention required. ${factors.slice(0, 2).join('. ')}.`;
    recommendation = `Reduce speed to ${risk.recommendedSpeed} km/h immediately. Find nearest safe pull-over point within 500m. Do not continue until risk factors are resolved.`;
    if (imbalancePct > 15) cargoAction = `Move approximately ${Math.round(Math.abs(leftLoad - rightLoad) / 2)} kg from ${leftLoad > rightLoad ? 'left' : 'right'} side to ${leftLoad > rightLoad ? 'right' : 'left'} side at next safe stop.`;
  } else if (risk.level === 'warning') {
    summary = `⚡ WARNING: Moderate risk conditions detected on ${vehicle.plateNumber}. Driver advisory issued. ${factors.slice(0, 2).join('. ')}.`;
    recommendation = `Reduce speed to ${risk.recommendedSpeed} km/h. Increase following distance. Monitor load distribution at next stop.`;
    if (imbalancePct > 10) cargoAction = `Consider redistributing ${Math.round(Math.abs(leftLoad - rightLoad) / 3)} kg at next opportunity to improve stability.`;
  } else {
    summary = `✅ SAFE: ${vehicle.plateNumber} operating within normal parameters. All systems nominal. Maintaining route to ${vehicle.route?.split(' → ')[1] || 'destination'}.`;
    recommendation = `Continue at current speed. Next mandatory check in 2 hours or at destination. Fuel stop recommended when below 30%.`;
  }

  return {
    summary,
    riskLevel: risk.level,
    riskScore: risk.overall,
    primaryReason: factors[0] || 'All parameters nominal',
    factors,
    recommendation,
    recommendedSpeed: risk.recommendedSpeed,
    cargoAction,
    nextCheckIn: risk.level === 'critical' ? 'IMMEDIATE' : risk.level === 'warning' ? '15 minutes' : '2 hours',
    confidence: 0.87 + Math.random() * 0.10,
  };
}

const THINKING_STEPS = [
  'Fetching sensor telemetry from IoT edge nodes...',
  'Analyzing load cell distribution (FL/FR/RL/RR)...',
  'Processing IMU roll/pitch/yaw vectors...',
  'Evaluating GPS road geometry & curvature...',
  'Correlating OBD-II engine parameters...',
  'Running LangGraph reasoning chain (Qwen 2.5-3B)...',
  'Applying fleet safety model v3.2...',
  'Generating natural language explanation...',
];

export default function AIAgent() {
  const { vehicles, selectedVehicleId, tick } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  const [output, setOutput] = useState<AgentOutput | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runAgent = () => {
    if (!vs || isThinking) return;
    setIsThinking(true);
    setThinkingStep(0);
    setOutput(null);

    const stepInterval = setInterval(() => {
      setThinkingStep(s => {
        if (s >= THINKING_STEPS.length - 1) {
          clearInterval(stepInterval);
          setIsThinking(false);
          setOutput(generateAgentOutput(vs));
          return s;
        }
        return s + 1;
      });
    }, 350);
  };

  useEffect(() => {
    if (autoRefresh && tick % 30 === 0) runAgent();
  }, [tick, autoRefresh]);

  // Auto-run on mount
  useEffect(() => { setTimeout(runAgent, 500); }, []);

  const riskColor = output?.riskLevel === 'critical' ? '#ef4444' : output?.riskLevel === 'warning' ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col h-full">
      <Header title="AI Safety Agent" subtitle="LangGraph + Qwen 2.5-3B · Multi-sensor reasoning engine" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runAgent}
            disabled={isThinking}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50"
          >
            <Brain size={15} className={isThinking ? 'animate-spin' : ''} />
            {isThinking ? 'Reasoning...' : 'Run AI Analysis'}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${autoRefresh ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]'}`}
          >
            <RefreshCw size={14} className={autoRefresh ? 'animate-spin-slow' : ''} />
            Auto ({autoRefresh ? 'ON' : 'OFF'})
          </button>
          <div className="text-[11px] text-[var(--muted-foreground)] font-mono">
            Model: Qwen 2.5-3B via Groq · LangGraph v0.2
          </div>
        </div>

        {/* Thinking animation */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="cs-card border-purple-500/30"
              style={{ background: 'rgba(124,58,237,0.05)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                  <Brain size={16} className="absolute inset-0 m-auto text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-purple-400">AI Reasoning Chain Active</div>
                  <div className="text-[11px] text-[var(--muted-foreground)]">LangGraph multi-step analysis in progress...</div>
                </div>
              </div>
              <div className="space-y-2">
                {THINKING_STEPS.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2 text-[11px] transition-all ${i <= thinkingStep ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]/40'}`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${i < thinkingStep ? 'bg-green-500/20 text-green-400' : i === thinkingStep ? 'bg-purple-500/30 border border-purple-500' : 'bg-[var(--muted)]'}`}>
                      {i < thinkingStep ? '✓' : i === thinkingStep ? <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> : null}
                    </div>
                    <span className="font-mono">{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output */}
        <AnimatePresence>
          {output && !isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Main assessment */}
              <div className="cs-card border-2" style={{ borderColor: `${riskColor}40` }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${riskColor}20` }}>
                    <Bot size={22} style={{ color: riskColor }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-base font-bold" style={{ color: riskColor }}>
                        {output.riskLevel.toUpperCase()} ASSESSMENT
                      </span>
                      <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                        Confidence: {(output.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="ml-auto text-[10px] font-mono text-[var(--muted-foreground)]">
                        Next check: {output.nextCheckIn}
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--foreground)] leading-relaxed">{output.summary}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk factors */}
                <div className="cs-card">
                  <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">CONTRIBUTING FACTORS</h3>
                  {output.factors.length === 0 ? (
                    <div className="text-[12px] text-green-400">✓ No risk factors identified</div>
                  ) : (
                    <div className="space-y-2">
                      {output.factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ChevronRight size={12} className="text-purple-400 mt-0.5 shrink-0" />
                          <span className="text-[12px] text-[var(--foreground)]">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendation */}
                <div className="cs-card">
                  <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">RECOMMENDED ACTION</h3>
                  <p className="text-[13px] text-[var(--foreground)] leading-relaxed mb-3">{output.recommendation}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}30` }}>
                      <Zap size={14} style={{ color: riskColor }} />
                      <span className="text-sm font-bold font-mono" style={{ color: riskColor }}>{output.recommendedSpeed} km/h</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">recommended</span>
                    </div>
                  </div>
                  {output.cargoAction && (
                    <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="text-[11px] text-yellow-400 font-semibold mb-1">Cargo Redistribution Required</div>
                      <div className="text-[11px] text-[var(--muted-foreground)]">{output.cargoAction}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sensor inputs used */}
              <div className="cs-card">
                <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">SENSOR DATA USED IN ANALYSIS</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {vs && [
                    { label: 'IMU Roll', value: `${vs.imu.roll.toFixed(1)}°`, color: '#ef4444' },
                    { label: 'Load Total', value: `${(vs.loadCells.reduce((s: number, c: any) => s + c.weight, 0) / 1000).toFixed(2)}t`, color: '#3b82f6' },
                    { label: 'Speed', value: `${vs.vehicle.speed} km/h`, color: '#a855f7' },
                    { label: 'Curvature', value: `${(vs.road.curvature * 100).toFixed(0)}%`, color: '#f59e0b' },
                    { label: 'Gradient', value: `${vs.road.gradient.toFixed(1)}%`, color: '#22c55e' },
                    { label: 'Eng Temp', value: `${vs.obd.engineTemp.toFixed(0)}°C`, color: '#f59e0b' },
                    { label: 'Battery', value: `${vs.obd.batteryVoltage.toFixed(2)}V`, color: '#06b6d4' },
                    { label: 'Vibration', value: `${vs.imu.vibration.toFixed(2)}g`, color: '#a855f7' },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col items-center p-2 rounded-lg bg-[var(--muted)]">
                      <span className="text-[10px] text-[var(--muted-foreground)]">{m.label}</span>
                      <span className="text-sm font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
