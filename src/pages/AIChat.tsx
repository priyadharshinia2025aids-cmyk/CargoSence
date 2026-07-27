import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';
import { useSimStore } from '../stores/appStore';
import { Bot, Send, User, Trash2, Lightbulb } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function generateResponse(question: string, vs: any): string {
  const q = question.toLowerCase();
  if (!vs) return "No vehicle data available. Please ensure the simulation is running.";

  const { vehicle, risk, imu, loadCells, obd, road, gps } = vs;
  const totalLoad = loadCells?.reduce((s: number, c: any) => s + c.weight, 0) || 0;

  if (q.includes('risk') || q.includes('danger') || q.includes('safe')) {
    return `**Current Risk Assessment for ${vehicle.plateNumber}:**\n\n` +
      `Overall risk: **${risk.overall}%** (${risk.level.toUpperCase()})\n\n` +
      `• Rollover risk: ${risk.rollover}%\n` +
      `• Overload risk: ${risk.overload}%\n` +
      `• Speed compliance: ${risk.speedCompliance}%\n\n` +
      (risk.factors.length > 0
        ? `**Primary factors:**\n${risk.factors.map((f: string) => `• ${f}`).join('\n')}\n\n`
        : '') +
      `**Recommended action:** ${risk.level === 'critical' ? `Reduce speed to ${risk.recommendedSpeed} km/h immediately.` : risk.level === 'warning' ? `Maintain ${risk.recommendedSpeed} km/h and monitor load.` : 'Continue safely at current speed.'}`;
  }

  if (q.includes('mainten') || q.includes('service') || q.includes('repair')) {
    return `**Maintenance Status for ${vehicle.plateNumber}:**\n\n` +
      `Engine Temperature: ${obd.engineTemp.toFixed(1)}°C (${obd.engineTemp > 100 ? '⚠️ HIGH' : '✅ Normal'})\n` +
      `Battery Voltage: ${obd.batteryVoltage.toFixed(2)}V (${obd.batteryVoltage < 12.5 ? '⚠️ LOW' : '✅ Normal'})\n` +
      `Fuel Level: ${Math.round(vehicle.fuel)}%\n` +
      `Odometer: ${vehicle.odometer.toLocaleString()} km\n` +
      `DTC Codes: ${obd.dtcCodes.length > 0 ? obd.dtcCodes.join(', ') : 'None — Clear'}\n\n` +
      `**Recommended:** ${obd.dtcCodes.length > 0 ? 'Schedule immediate diagnostic at nearest service center.' : 'Next oil change due in approximately 5,000 km.'}`;
  }

  if (q.includes('load') || q.includes('weight') || q.includes('cargo')) {
    const cells = loadCells || [];
    return `**Load Distribution for ${vehicle.plateNumber}:**\n\n` +
      `Total load: **${(totalLoad / 1000).toFixed(2)}t**\n\n` +
      cells.map((c: any) => `• ${c.label}: ${c.weight.toLocaleString()} kg (${c.percentage.toFixed(1)}%) — ${c.status.toUpperCase()}`).join('\n') +
      `\n\n**Center of Gravity:** Lateral ${(cells[1]?.weight + cells[3]?.weight > cells[0]?.weight + cells[2]?.weight ? 'slightly right' : 'slightly left')}\n` +
      `**Stability:** ${risk.rollover < 40 ? '✅ Good' : risk.rollover < 70 ? '⚠️ Moderate — monitor during curves' : '🚨 Critical — redistribute cargo'}`;
  }

  if (q.includes('speed') || q.includes('recommend') || q.includes('slow')) {
    return `**Speed Analysis for ${vehicle.plateNumber}:**\n\n` +
      `Current speed: **${vehicle.speed} km/h**\n` +
      `Road speed limit: **${road.speedLimit} km/h**\n` +
      `AI recommended speed: **${risk.recommendedSpeed} km/h**\n\n` +
      `**Road conditions:**\n` +
      `• Type: ${road.roadType}\n` +
      `• Curvature: ${(road.curvature * 100).toFixed(0)}%\n` +
      `• Gradient: ${road.gradient.toFixed(1)}%\n` +
      `• Next curve: ${road.nextCurve.direction} in ${road.nextCurve.distance.toFixed(0)}m\n\n` +
      `**Why this speed?** ${risk.rollover > 50 ? 'High roll angle detected — lower speed reduces rollover risk significantly.' : road.curvature > 0.4 ? 'Upcoming sharp curve requires speed reduction for safe navigation.' : 'Current road conditions allow normal speed operation.'}`;
  }

  if (q.includes('fuel') || q.includes('range') || q.includes('efficiency')) {
    const range = Math.round(vehicle.fuel * 4.2 * 0.8); // simplified range estimate
    return `**Fuel Report for ${vehicle.plateNumber}:**\n\n` +
      `Current fuel: **${Math.round(vehicle.fuel)}%**\n` +
      `Estimated range: ~${range} km\n` +
      `Fuel pressure: ${obd.fuelPressure.toFixed(0)} kPa\n` +
      `Current consumption: ~${(obd.mafRate * 0.3).toFixed(1)} L/100km (estimated)\n\n` +
      `${vehicle.fuel < 30 ? '⚠️ **Fuel stop recommended** — locate nearest fuel station.' : '✅ Fuel level adequate for current route.'}`;
  }

  if (q.includes('weather') || q.includes('rain') || q.includes('wind')) {
    return `**Weather Impact Assessment:**\n\nI don't have direct weather API access in this demo, but based on sensor data:\n\n` +
      `• IMU vibration: ${imu.vibration.toFixed(3)}g — ${imu.vibration > 0.5 ? 'elevated, possibly wet road' : 'normal'}\n` +
      `• Traction estimate: ${imu.vibration > 0.5 ? 'Reduced — increase following distance' : 'Good'}\n\n` +
      `**Recommendation:** Monitor vibration levels and reduce speed in any adverse conditions.`;
  }

  if (q.includes('gps') || q.includes('location') || q.includes('position')) {
    return `**GPS & Location Data for ${vehicle.plateNumber}:**\n\n` +
      `Latitude: **${gps.lat.toFixed(6)}°**\n` +
      `Longitude: **${gps.lng.toFixed(6)}°**\n` +
      `Elevation: ${gps.elevation.toFixed(0)}m\n` +
      `Heading: ${gps.heading.toFixed(1)}°\n` +
      `Speed (GPS): ${gps.speed.toFixed(1)} km/h\n` +
      `Satellites: ${gps.satellites} (${gps.fix ? '3D Fix ✅' : 'No Fix ❌'})\n` +
      `Accuracy: ±${gps.accuracy.toFixed(1)}m\n\n` +
      `Active route: **${vehicle.route || 'No active route'}**`;
  }

  // Default response
  return `I'm the CargoSense AI Assistant powered by Qwen 2.5-3B via Groq & LangGraph.\n\n` +
    `For vehicle **${vehicle.plateNumber}**, here's a quick status:\n\n` +
    `• Speed: ${vehicle.speed} km/h | Risk: ${risk.overall}% (${risk.level})\n` +
    `• Total load: ${(totalLoad / 1000).toFixed(2)}t | Fuel: ${Math.round(vehicle.fuel)}%\n` +
    `• Engine: ${obd.engineTemp.toFixed(0)}°C | Battery: ${obd.batteryVoltage.toFixed(2)}V\n\n` +
    `**You can ask me about:**\n` +
    `• Risk factors & safety\n• Load distribution & cargo\n• Speed recommendations\n• Maintenance & engine health\n• Fuel & range\n• GPS & location`;
}

const SUGGESTIONS = [
  "What is causing high risk?",
  "When should maintenance be done?",
  "Why did speed recommendation change?",
  "Is the cargo load balanced?",
  "What's my current fuel status?",
  "Show me GPS coordinates",
];

export default function AIChat() {
  const { vehicles, selectedVehicleId } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm the CargoSense AI assistant. I can analyze your vehicle's real-time sensor data and answer questions about risk, load, maintenance, navigation, and more. What would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (text?: string) => {
    const q = text || input.trim();
    if (!q) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 800));
    const response = generateResponse(q, vs);
    const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <div key={i} className="font-bold text-[var(--foreground)] mt-2 mb-1">{line.replace(/\*\*/g, '')}</div>;
      }
      if (line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <div key={i} className="text-[12px] text-[var(--foreground)] leading-relaxed">
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j}>{p.replace(/\*\*/g, '')}</strong> : p)}
          </div>
        );
      }
      if (line.startsWith('•')) return <div key={i} className="text-[12px] text-[var(--foreground)] leading-relaxed pl-2">{line}</div>;
      if (line === '') return <div key={i} className="h-1" />;
      return <div key={i} className="text-[12px] text-[var(--foreground)] leading-relaxed">{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="AI Chat" subtitle="LangGraph + Qwen 2.5-3B · Ask anything about your fleet" />
      <div className="flex-1 flex flex-col min-h-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-purple-600' : 'bg-[var(--secondary)]'}`}>
                {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-[var(--foreground)]" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'assistant'
                ? 'bg-[var(--card)] border border-[var(--border)] rounded-tl-sm'
                : 'bg-purple-600 rounded-tr-sm'}`}
              >
                <div className={msg.role === 'user' ? 'text-white text-[13px]' : ''}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
                <div className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-purple-200' : 'text-[var(--muted-foreground)]'}`}>
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-tl-sm p-4">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ scaleY: [1, 2, 1] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div className="px-5 pb-2">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--muted)] text-[11px] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-purple-500/40 transition-all">
                <Lightbulb size={10} className="text-purple-400" />
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex gap-3">
            <button onClick={() => setMessages([messages[0]])}
              className="w-9 h-9 rounded-xl bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 size={15} />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about your fleet, risk, load, maintenance..."
              className="flex-1 h-9 px-4 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 disabled:opacity-50 transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
