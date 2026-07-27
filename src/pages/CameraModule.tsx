import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/layout/Header';
import { Camera, Upload, Play, Pause, Eye, Target, AlertTriangle, Scan } from 'lucide-react';
import type { DetectionResult } from '../types';

const DETECTION_CLASSES = [
  { label: 'Car', color: '#22c55e', icon: '🚗' },
  { label: 'Truck', color: '#3b82f6', icon: '🚛' },
  { label: 'Person', color: '#f59e0b', icon: '🚶' },
  { label: 'Stop Sign', color: '#ef4444', icon: '🛑' },
  { label: 'Traffic Light', color: '#a855f7', icon: '🚦' },
  { label: 'Obstacle', color: '#ef4444', icon: '⚠️' },
  { label: 'Lane Marker', color: '#06b6d4', icon: '⬜' },
];

function generateDetections(): DetectionResult[] {
  const count = 2 + Math.floor(Math.random() * 4);
  const results: DetectionResult[] = [];
  for (let i = 0; i < count; i++) {
    const cls = DETECTION_CLASSES[Math.floor(Math.random() * DETECTION_CLASSES.length)];
    const x = 50 + Math.random() * 500;
    const y = 50 + Math.random() * 250;
    const w = 60 + Math.random() * 120;
    const h = 40 + Math.random() * 100;
    results.push({
      label: cls.label,
      confidence: 0.7 + Math.random() * 0.28,
      bbox: [x, y, x + w, y + h],
      color: cls.color,
    });
  }
  return results;
}

function DetectionCanvas({ detections, frameIndex }: { detections: DetectionResult[]; frameIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw simulated camera frame
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simulate road scene
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 150);
    skyGrad.addColorStop(0, '#0a0a20');
    skyGrad.addColorStop(1, '#1a1040');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, 200);

    // Road
    const roadGrad = ctx.createLinearGradient(0, 200, 0, canvas.height);
    roadGrad.addColorStop(0, '#1a1a2e');
    roadGrad.addColorStop(1, '#2d2d4a');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(0, 200, canvas.width, canvas.height - 200);

    // Lane lines
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.setLineDash([30, 20]);
    ctx.lineWidth = 2;
    [[280, 200, 260, 400], [340, 200, 340, 400]].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // UFLD lane boundary
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, canvas.height);
    ctx.quadraticCurveTo(270, 300, 290 + Math.sin(frameIndex * 0.05) * 5, 180);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(430, canvas.height);
    ctx.quadraticCurveTo(360, 300, 350 + Math.sin(frameIndex * 0.05) * 5, 180);
    ctx.stroke();

    // Draw detection boxes
    detections.forEach(det => {
      const [x1, y1, x2, y2] = det.bbox;
      ctx.strokeStyle = det.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      // Label background
      const label = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = det.color + 'cc';
      ctx.fillRect(x1, y1 - 18, tw + 8, 18);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x1 + 4, y1 - 4);

      // Corner markers
      const cs = 10;
      ctx.strokeStyle = det.color;
      ctx.lineWidth = 3;
      [[x1,y1,1,1],[x2,y1,-1,1],[x1,y2,1,-1],[x2,y2,-1,-1]].forEach(([cx,cy,dx,dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + (dy as number) * cs);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + (dx as number) * cs, cy);
        ctx.stroke();
      });
    });

    // Scan line animation
    const scanY = (frameIndex * 4) % canvas.height;
    const scanGrad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(0.5, 'rgba(124,58,237,0.3)');
    scanGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 10, canvas.width, 20);

    // HUD overlay
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = '#a855f7';
    ctx.fillText(`YOLO11 · UFLD ACTIVE · ${detections.length} OBJECTS`, 8, 16);
    ctx.fillStyle = '#22c55e';
    ctx.fillText(`FPS: ${24 + Math.floor(Math.random() * 6)} · GPU: ${65 + Math.floor(Math.random() * 20)}%`, 8, 30);
  }, [detections, frameIndex]);

  return <canvas ref={canvasRef} width={640} height={400} className="w-full rounded-xl" />;
}

export default function CameraModule() {
  const [isLive, setIsLive] = useState(false);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const toggleLive = useCallback(() => {
    setIsLive(prev => {
      if (!prev) {
        intervalRef.current = setInterval(() => {
          setDetections(generateDetections());
          setFrameIndex(f => f + 1);
        }, 100);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      return !prev;
    });
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setUploadedImage(ev.target?.result as string);
      setDetections(generateDetections());
    };
    reader.readAsDataURL(file);
  };

  const stats = {
    vehicles: detections.filter(d => ['Car', 'Truck'].includes(d.label)).length,
    signs: detections.filter(d => ['Stop Sign', 'Traffic Light'].includes(d.label)).length,
    obstacles: detections.filter(d => d.label === 'Obstacle').length,
    lanes: detections.filter(d => d.label === 'Lane Marker').length,
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Camera AI Module" subtitle="YOLO11 object detection · UFLD lane detection · Real-time inference" />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={toggleLive}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isLive ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-purple-600 text-white hover:bg-purple-500'}`}
          >
            {isLive ? <><Pause size={15} /> Stop Live</> : <><Play size={15} /> Start Live Camera</>}
          </button>
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] cursor-pointer hover:border-purple-500/40">
            <Upload size={15} />
            Upload Image
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          {isLive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[12px] text-green-400 font-mono">INFERENCE ACTIVE</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Camera view */}
          <div className="lg:col-span-2 cs-card p-0 overflow-hidden">
            <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
              <Camera size={14} className="text-purple-400" />
              <span className="text-[12px] font-mono text-[var(--foreground)]">FRONT CAMERA · YOLO11 + UFLD</span>
              <div className="ml-auto flex gap-2">
                {isLive && <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 animate-pulse">● LIVE</span>}
              </div>
            </div>
            <div className="relative bg-[var(--muted)]">
              {uploadedImage && !isLive ? (
                <div className="relative">
                  <img src={uploadedImage} alt="uploaded" className="w-full rounded-b-xl max-h-96 object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs font-mono text-purple-400 bg-black/50 px-3 py-1 rounded-lg">
                      {detections.length} objects detected
                    </div>
                  </div>
                </div>
              ) : (
                <DetectionCanvas detections={detections} frameIndex={frameIndex} />
              )}
              {!isLive && !uploadedImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Scan size={40} className="text-purple-400/40 mb-3 animate-pulse" />
                  <p className="text-sm text-[var(--muted-foreground)]">Start live feed or upload an image</p>
                </div>
              )}
            </div>
          </div>

          {/* Detection panel */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="cs-card">
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">DETECTION SUMMARY</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Vehicles', count: stats.vehicles, color: '#3b82f6' },
                  { label: 'Signs', count: stats.signs, color: '#a855f7' },
                  { label: 'Obstacles', count: stats.obstacles, color: '#ef4444' },
                  { label: 'Lane Lines', count: stats.lanes > 0 ? 2 : 0, color: '#06b6d4' },
                ].map(s => (
                  <div key={s.label} className="p-2 rounded-lg text-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                    <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-[9px] text-[var(--muted-foreground)]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detection list */}
            <div className="cs-card">
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-3">ACTIVE DETECTIONS</h3>
              <div className="space-y-2">
                <AnimatePresence>
                  {detections.length === 0 ? (
                    <div className="text-[12px] text-[var(--muted-foreground)] text-center py-4">No detections</div>
                  ) : (
                    detections.map((det, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: `${det.color}10`, border: `1px solid ${det.color}30` }}
                      >
                        <Target size={12} style={{ color: det.color }} />
                        <span className="text-[11px] font-semibold flex-1" style={{ color: det.color }}>{det.label}</span>
                        <span className="text-[10px] font-mono text-[var(--muted-foreground)]">{(det.confidence * 100).toFixed(1)}%</span>
                        <div className="w-10 progress-bar h-1.5">
                          <div className="h-full rounded-full" style={{ width: `${det.confidence * 100}%`, background: det.color }} />
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Model info */}
            <div className="cs-card">
              <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-2">MODEL INFO</h3>
              <div className="space-y-1.5 text-[11px]">
                {[
                  { k: 'Detection Model', v: 'YOLO11n' },
                  { k: 'Lane Model', v: 'UFLD v2' },
                  { k: 'Classes', v: '80 COCO + custom' },
                  { k: 'Input Size', v: '640×640' },
                  { k: 'Inference', v: 'Simulated 24fps' },
                  { k: 'Precision', v: 'FP16' },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">{k}</span>
                    <span className="font-mono text-purple-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
