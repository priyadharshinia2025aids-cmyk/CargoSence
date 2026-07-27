import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Text, Box, Cylinder, Sphere } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { useSimStore } from '../stores/appStore';
import Header from '../components/layout/Header';
import { RotateCcw, Maximize, ZoomIn, ZoomOut } from 'lucide-react';

function statusColor(level: string): THREE.Color {
  if (level === 'critical') return new THREE.Color('#ef4444');
  if (level === 'warning') return new THREE.Color('#f59e0b');
  return new THREE.Color('#22c55e');
}

function loadCellColor(pct: number): THREE.Color {
  if (pct > 90) return new THREE.Color('#ef4444');
  if (pct > 75) return new THREE.Color('#f59e0b');
  return new THREE.Color('#22c55e');
}

interface TruckMeshProps {
  roll: number;
  pitch: number;
  loadCells: any[];
  riskLevel: string;
  speed: number;
}

function Wheel({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.x += delta * 5;
  });
  return (
    <group ref={ref} position={position}>
      <Cylinder args={[0.35, 0.35, 0.28, 24]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </Cylinder>
      <Cylinder args={[0.25, 0.25, 0.3, 24]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#2d2d4a" metalness={0.8} roughness={0.2} />
      </Cylinder>
    </group>
  );
}

function CargoBox({ position, color, scale }: { position: [number, number, number]; color: THREE.Color; scale?: [number, number, number] }) {
  return (
    <Box position={position} args={scale || [0.6, 0.5, 0.5]}>
      <meshStandardMaterial color={color} roughness={0.7} transparent opacity={0.85} />
    </Box>
  );
}

function TruckMesh({ roll, pitch, loadCells, riskLevel, speed }: TruckMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const trailerRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Smooth target rotation
      const targetRoll = (roll * Math.PI) / 180 * 0.8;
      const targetPitch = (pitch * Math.PI) / 180 * 0.5;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRoll, delta * 3);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetPitch, delta * 3);
    }
    // Subtle idle vibration when speed > 0
    if (trailerRef.current && speed > 0) {
      trailerRef.current.position.y = Math.sin(Date.now() * 0.02) * 0.005;
    }
  });

  const lc = loadCells || [];
  const flColor = lc[0] ? loadCellColor(lc[0].percentage) : new THREE.Color('#22c55e');
  const frColor = lc[1] ? loadCellColor(lc[1].percentage) : new THREE.Color('#22c55e');
  const rlColor = lc[2] ? loadCellColor(lc[2].percentage) : new THREE.Color('#22c55e');
  const rrColor = lc[3] ? loadCellColor(lc[3].percentage) : new THREE.Color('#22c55e');
  const bodyColor = statusColor(riskLevel);

  return (
    <group ref={groupRef}>
      {/* Trailer body */}
      <group ref={trailerRef}>
        <Box args={[4, 0.9, 1.8]} position={[-0.5, 0.2, 0]}>
          <meshStandardMaterial color="#2d1b69" roughness={0.6} metalness={0.3} />
        </Box>
        {/* Trailer roof */}
        <Box args={[4, 0.08, 1.8]} position={[-0.5, 0.66, 0]}>
          <meshStandardMaterial color={bodyColor} roughness={0.4} metalness={0.5} emissive={bodyColor} emissiveIntensity={0.1} />
        </Box>
        {/* Trailer frame lines */}
        {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
          <Box key={i} args={[0.04, 0.9, 1.82]} position={[x, 0.2, 0]}>
            <meshStandardMaterial color="#7c3aed" roughness={0.3} metalness={0.7} />
          </Box>
        ))}

        {/* Cargo boxes on trailer */}
        {[
          { pos: [-1.3, 0.72, -0.4] as [number,number,number], color: flColor },
          { pos: [-1.3, 0.72, 0.4] as [number,number,number], color: frColor },
          { pos: [0.5, 0.72, -0.4] as [number,number,number], color: rlColor },
          { pos: [0.5, 0.72, 0.4] as [number,number,number], color: rrColor },
          { pos: [-0.4, 0.72, 0] as [number,number,number], color: new THREE.Color('#7c3aed') },
          { pos: [1.4, 0.72, 0] as [number,number,number], color: new THREE.Color('#3b82f6') },
        ].map((c, i) => (
          <CargoBox key={i} position={c.pos} color={c.color} />
        ))}

        {/* CoG indicator */}
        <Sphere args={[0.08, 16, 16]} position={[0, 0.75, 0]}>
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
        </Sphere>

        {/* Trailer wheels */}
        <Wheel position={[-2, -0.32, 1.0]} />
        <Wheel position={[-2, -0.32, -1.0]} />
        <Wheel position={[1.2, -0.32, 1.0]} />
        <Wheel position={[1.2, -0.32, -1.0]} />
      </group>

      {/* Cab */}
      <group position={[2.8, 0, 0]}>
        <Box args={[1.4, 1.2, 1.8]} position={[0, 0.3, 0]}>
          <meshStandardMaterial color="#3b1a8a" roughness={0.4} metalness={0.4} />
        </Box>
        {/* Windshield */}
        <Box args={[0.04, 0.7, 1.4]} position={[0.68, 0.4, 0]}>
          <meshStandardMaterial color="#0a1a4a" roughness={0.1} metalness={0.1} transparent opacity={0.6} />
        </Box>
        {/* Headlights */}
        {[-0.5, 0.5].map((z, i) => (
          <Sphere key={i} args={[0.1, 8, 8]} position={[0.7, 0.05, z]}>
            <meshStandardMaterial color="#fffbeb" emissive="#fffbeb" emissiveIntensity={speed > 0 ? 1.5 : 0.2} />
          </Sphere>
        ))}
        {/* Cab wheels */}
        <Wheel position={[0.5, -0.48, 1.0]} />
        <Wheel position={[0.5, -0.48, -1.0]} />
        {/* Exhaust stack */}
        <Cylinder args={[0.06, 0.06, 1.2, 8]} position={[0, 1.1, 0.7]}>
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </group>

      {/* Ground shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

function Scene({ roll, pitch, loadCells, riskLevel, speed }: TruckMeshProps) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#7c3aed" />
      <pointLight position={[5, 2, 5]} intensity={0.3} color="#3b82f6" />
      <Grid
        args={[20, 20]}
        position={[0, -0.72, 0]}
        cellColor="#7c3aed"
        sectionColor="#2d1b69"
        cellSize={1}
        sectionSize={5}
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={20}
        fadeStrength={1}
      />
      <TruckMesh roll={roll} pitch={pitch} loadCells={loadCells} riskLevel={riskLevel} speed={speed} />
      <OrbitControls makeDefault enablePan enableZoom enableRotate autoRotate={false} />
    </>
  );
}

export default function DigitalTwin() {
  const { vehicles, selectedVehicleId } = useSimStore();
  const vs = vehicles[selectedVehicleId] || Object.values(vehicles)[0];
  if (!vs) return null;
  const { imu, loadCells, risk, vehicle } = vs;

  const lc = loadCells || [];
  const totalLoad = lc.reduce((s: number, c: any) => s + c.weight, 0);

  return (
    <div className="flex flex-col h-full">
      <Header title="Digital Twin" subtitle="Interactive 3D truck model — real-time load & orientation sync" />
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 gap-0">
        {/* 3D Canvas */}
        <div className="flex-1 relative bg-[#0a0a12]">
          <Canvas camera={{ position: [8, 4, 8], fov: 45 }} shadows>
            <Suspense fallback={null}>
              <Scene
                roll={imu.roll}
                pitch={imu.pitch}
                loadCells={lc}
                riskLevel={risk.level}
                speed={vehicle.speed}
              />
            </Suspense>
          </Canvas>

          {/* HUD overlay */}
          <div className="absolute top-4 left-4 glass rounded-xl p-3 space-y-1.5">
            {[
              { label: 'Roll', value: `${imu.roll.toFixed(1)}°`, color: Math.abs(imu.roll) > 15 ? '#ef4444' : '#a855f7' },
              { label: 'Pitch', value: `${imu.pitch.toFixed(1)}°`, color: Math.abs(imu.pitch) > 10 ? '#f59e0b' : '#a855f7' },
              { label: 'Total Load', value: `${(totalLoad / 1000).toFixed(2)}t`, color: '#3b82f6' },
              { label: 'Risk Level', value: risk.level.toUpperCase(), color: risk.level === 'critical' ? '#ef4444' : risk.level === 'warning' ? '#f59e0b' : '#22c55e' },
            ].map(m => (
              <div key={m.label} className="flex justify-between gap-4 text-[11px]">
                <span className="text-[var(--muted-foreground)]">{m.label}</span>
                <span className="font-mono font-bold" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-xl p-3">
            <div className="text-[10px] font-mono text-[var(--muted-foreground)] mb-2">LOAD LEGEND</div>
            {[
              { color: '#22c55e', label: 'Safe (<75%)' },
              { color: '#f59e0b', label: 'Warning (75-90%)' },
              { color: '#ef4444', label: 'Critical (>90%)' },
              { color: '#facc15', label: '● Center of Gravity' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                <span className="text-[10px] text-[var(--foreground)]">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Controls hint */}
          <div className="absolute bottom-4 right-4 text-[10px] text-[var(--muted-foreground)] font-mono">
            Left drag: rotate · Scroll: zoom · Right drag: pan
          </div>
        </div>

        {/* Data panel */}
        <div className="w-full lg:w-60 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--card)] p-4 space-y-4 overflow-y-auto">
          <h3 className="text-[11px] font-mono text-[var(--muted-foreground)]">LOAD CELLS</h3>
          {lc.map((cell: any) => (
            <div key={cell.id}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--foreground)]">{cell.label}</span>
                <span className="font-mono" style={{ color: cell.status === 'critical' ? '#ef4444' : cell.status === 'warning' ? '#f59e0b' : '#22c55e' }}>
                  {cell.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar h-2">
                <div className="h-full rounded-full" style={{
                  width: `${cell.percentage}%`,
                  background: cell.status === 'critical' ? '#ef4444' : cell.status === 'warning' ? '#f59e0b' : '#22c55e'
                }} />
              </div>
              <div className="text-[9px] text-[var(--muted-foreground)] font-mono mt-0.5">{cell.weight.toLocaleString()} kg</div>
            </div>
          ))}

          <div className="border-t border-[var(--border)] pt-3">
            <h3 className="text-[11px] font-mono text-[var(--muted-foreground)] mb-2">IMU</h3>
            {[
              { k: 'Roll', v: `${imu.roll.toFixed(2)}°` },
              { k: 'Pitch', v: `${imu.pitch.toFixed(2)}°` },
              { k: 'Yaw', v: `${imu.yaw.toFixed(2)}°/s` },
              { k: 'Vibration', v: `${imu.vibration.toFixed(3)}g` },
            ].map(({ k, v }) => (
              <div key={k} className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--muted-foreground)]">{k}</span>
                <span className="font-mono text-[var(--foreground)]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
