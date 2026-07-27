import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';
import { useSimStore } from '../stores/appStore';
import { Volume2, Play, Square, Repeat, History, Mic, Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ta', label: 'Tamil', flag: '🏛️' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', flag: '🌟' },
  { code: 'kn', label: 'Kannada', flag: '🌿' },
  { code: 'ml', label: 'Malayalam', flag: '🌴' },
];

const ALERT_TEMPLATES: Record<string, Record<string, string>> = {
  en: {
    critical: 'WARNING! High rollover risk detected. Reduce speed to {speed} km/h immediately. Sharp {direction} curve ahead in {distance} meters.',
    warning: 'Caution! Moderate risk detected. Load imbalance on {side} side. Recommended speed: {speed} km/h.',
    safe: 'All systems normal. Current speed: {speed} km/h. Road conditions are good. Safe to continue.',
  },
  ta: {
    critical: 'எச்சரிக்கை! அதிக ரோல்ஓவர் ஆபத்து கண்டறியப்பட்டது. வேகத்தை {speed} கி.மீ/மணி க்கு குறைக்கவும்.',
    warning: 'எச்சரிக்கை! மிதமான ஆபத்து கண்டறியப்பட்டது. சுமை சமநிலை பிரச்சினை.',
    safe: 'அனைத்து அமைப்புகளும் இயல்பாக உள்ளன. தொடர்ந்து பயணிக்கவும்.',
  },
  hi: {
    critical: 'चेतावनी! उच्च रोलओवर जोखिम। गति को {speed} किमी/घंटा तक कम करें। {distance} मीटर आगे तीव्र मोड़।',
    warning: 'सावधान! मध्यम जोखिम। {side} तरफ लोड असंतुलन। अनुशंसित गति: {speed} किमी/घंटा।',
    safe: 'सभी सिस्टम सामान्य। वर्तमान गति: {speed} किमी/घंटा। सुरक्षित यात्रा जारी रखें।',
  },
  te: {
    critical: 'హెచ్చరిక! అధిక రోలోవర్ ప్రమాదం గుర్తించబడింది. వేగాన్ని {speed} కి.మీ/గంటకు తగ్గించండి.',
    warning: 'జాగ్రత్త! మితమైన ప్రమాదం. లోడ్ అసమతుల్యత.',
    safe: 'అన్ని వ్యవస్థలు సాధారణంగా ఉన్నాయి. ప్రయాణం కొనసాగించండి.',
  },
  kn: {
    critical: 'ಎಚ್ಚರಿಕೆ! ಅಧಿಕ ರೋಲೋವರ್ ಅಪಾಯ ಪತ್ತೆಯಾಗಿದೆ. ವೇಗವನ್ನು {speed} ಕಿ.ಮೀ/ಗಂಟೆಗೆ ಕಡಿಮೆ ಮಾಡಿ.',
    warning: 'ಎಚ್ಚರಿಕೆ! ಮಧ್ಯಮ ಅಪಾಯ. ಹೊರೆ ಅಸಮತೋಲನ.',
    safe: 'ಎಲ್ಲಾ ವ್ಯವಸ್ಥೆಗಳು ಸಾಮಾನ್ಯ. ಪ್ರಯಾಣ ಮುಂದುವರಿಸಿ.',
  },
  ml: {
    critical: 'മുന്നറിയിപ്പ്! ഉയർന്ന റോളോവർ അപകടം കണ്ടെത്തി. വേഗത {speed} കി.മീ/മണിക്കൂർ ആക്കുക.',
    warning: 'ജാഗ്രത! മിതമായ അപകടം. ലോഡ് അസന്തുലിതാവസ്ഥ.',
    safe: 'എല്ലാ സംവിധാനങ്ങളും സാധാരണ. യാത്ര തുടരുക.',
  },
};

interface VoiceMessage {
  id: string;
  text: string;
  language: string;
  severity: 'safe' | 'warning' | 'critical';
  timestamp: Date;
}

export default function VoiceAssistant() {
  const { vehicles, selectedVehicleId } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  const [selectedLang, setSelectedLang] = useState('en');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [history, setHistory] = useState<VoiceMessage[]>([]);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getAlertText = (lang: string) => {
    if (!vs) return '';
    const templates = ALERT_TEMPLATES[lang] || ALERT_TEMPLATES.en;
    const level = vs.risk.level;
    const template = templates[level] || templates.safe;
    return template
      .replace('{speed}', String(vs.risk.recommendedSpeed))
      .replace('{distance}', String(Math.round(vs.road.nextCurve.distance)))
      .replace('{direction}', vs.road.nextCurve.direction)
      .replace('{side}', vs.loadCells[0]?.weight > vs.loadCells[1]?.weight ? 'left' : 'right');
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = selectedLang === 'en' ? 'en-IN' : selectedLang === 'ta' ? 'ta-IN' : selectedLang === 'hi' ? 'hi-IN' : 'en-IN';
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    synthRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  const handlePlay = () => {
    const text = getAlertText(selectedLang);
    setCurrentText(text);
    speak(text);
    const msg: VoiceMessage = {
      id: Date.now().toString(),
      text,
      language: selectedLang,
      severity: vs?.risk.level || 'safe',
      timestamp: new Date(),
    };
    setHistory(prev => [msg, ...prev].slice(0, 20));
  };

  const handleStop = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  const severityColor = vs?.risk.level === 'critical' ? '#ef4444' : vs?.risk.level === 'warning' ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col h-full">
      <Header title="Multilingual Voice Assistant" subtitle="Piper TTS · 6 Languages · Real-time safety alerts" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Language selector */}
        <div className="cs-card">
          <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">SELECT LANGUAGE</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`p-3 rounded-xl text-center transition-all border ${selectedLang === lang.code ? 'border-purple-500/60 bg-purple-500/15' : 'border-[var(--border)] hover:border-purple-500/30'}`}
              >
                <div className="text-2xl mb-1">{lang.flag}</div>
                <div className="text-[11px] font-medium text-[var(--foreground)]">{lang.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current alert */}
        <div className="cs-card border-2" style={{ borderColor: `${severityColor}30` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${severityColor}20` }}>
              <Volume2 size={20} style={{ color: severityColor }} />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">Current Alert — {LANGUAGES.find(l => l.code === selectedLang)?.label}</div>
              <div className="text-[10px] font-mono" style={{ color: severityColor }}>{vs?.risk.level.toUpperCase()} · {vs?.risk.overall}% RISK</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isPlaying && (
                <motion.div className="flex items-center gap-1">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="w-1 h-4 rounded-full"
                      style={{ background: severityColor }}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--muted)] mb-4 min-h-[60px]">
            <p className="text-[13px] text-[var(--foreground)] leading-relaxed">
              {getAlertText(selectedLang)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              <Play size={15} /> {isPlaying ? 'Playing...' : 'Play Alert'}
            </button>
            {isPlaying && (
              <button onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold">
                <Square size={14} /> Stop
              </button>
            )}
            <button onClick={() => speak(currentText || getAlertText(selectedLang))}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--muted)] text-[var(--foreground)] text-sm border border-[var(--border)]">
              <Repeat size={14} /> Repeat
            </button>
          </div>
        </div>

        {/* SOS button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const sos = 'SOS EMERGENCY ALERT! Driver requesting immediate assistance. Vehicle: ' + (vs?.vehicle.plateNumber || 'Unknown') + '. Location: ' + (vs?.gps.lat.toFixed(4) || '0') + ', ' + (vs?.gps.lng.toFixed(4) || '0');
            speak(sos);
            setHistory(prev => [{ id: Date.now().toString(), text: sos, language: selectedLang, severity: 'critical', timestamp: new Date() }, ...prev]);
          }}
          className="w-full p-4 rounded-xl bg-red-500/15 border-2 border-red-500/50 flex items-center justify-center gap-3 text-red-400 font-bold text-base hover:bg-red-500/25 transition-all"
        >
          <Mic size={20} className="animate-pulse" />
          🚨 SOS EMERGENCY VOICE ALERT
        </motion.button>

        {/* Voice history */}
        <div className="cs-card">
          <div className="flex items-center gap-2 mb-3">
            <History size={14} className="text-[var(--muted-foreground)]" />
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)]">VOICE HISTORY</h3>
          </div>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-[12px] text-[var(--muted-foreground)] text-center py-4">No voice alerts played yet</p>
            ) : (
              history.map(msg => (
                <div key={msg.id} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--muted)]">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${msg.severity === 'critical' ? 'bg-red-400' : msg.severity === 'warning' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--foreground)] line-clamp-2">{msg.text}</p>
                    <div className="text-[9px] font-mono text-[var(--muted-foreground)] mt-1">
                      {LANGUAGES.find(l => l.code === msg.language)?.label} · {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <button onClick={() => speak(msg.text)} className="shrink-0 p-1 rounded hover:text-purple-400 text-[var(--muted-foreground)]">
                    <Play size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
