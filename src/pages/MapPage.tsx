import { useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import { useSimStore } from '../stores/appStore';
import { MapPin, Truck, Navigation, Zap } from 'lucide-react';

// Leaflet dynamic import
let L: any = null;

function MapView({ vehicles, selectedId, onSelect }: any) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    // Dynamically import leaflet
    import('leaflet').then(leaflet => {
      L = leaflet.default;
      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [13.0827, 80.2707],
        zoom: 8,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        className: 'map-tiles',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!mapInstance.current || !L) return;
    const map = mapInstance.current;

    Object.values(vehicles as Record<string, any>).forEach((vs: any) => {
      const v = vs.vehicle;
      const riskColor = vs.risk.level === 'critical' ? '#ef4444' : vs.risk.level === 'warning' ? '#f59e0b' : '#22c55e';
      const isSelected = v.id === selectedId;

      const svgIcon = L.divIcon({
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
          <div style="width:${isSelected ? 40 : 32}px;height:${isSelected ? 40 : 32}px;border-radius:50%;background:${riskColor}25;border:2px solid ${riskColor};display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.3s;box-shadow:0 0 ${isSelected ? 16 : 8}px ${riskColor}60">
            <svg width="16" height="16" fill="${riskColor}" viewBox="0 0 24 24"><path d="M1 3h15v13H1z" opacity=".3"/><path d="M15 8h4l3 3v5h-7V8zM3 18.5A2.5 2.5 0 0 0 5.5 21 2.5 2.5 0 0 0 8 18.5 2.5 2.5 0 0 0 5.5 16 2.5 2.5 0 0 0 3 18.5zM14 18.5a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5 2.5 2.5 0 0 0-2.5 2.5z"/></svg>
          </div>
          ${isSelected ? `<div style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#0a0a12;border:1px solid ${riskColor}40;border-radius:4px;padding:1px 5px;font-family:monospace;font-size:9px;color:${riskColor};white-space:nowrap">${v.plateNumber}</div>` : ''}
        </div>`,
      });

      if (markers.current[v.id]) {
        markers.current[v.id].setLatLng([v.lat, v.lng]).setIcon(svgIcon);
      } else {
        const marker = L.marker([v.lat, v.lng], { icon: svgIcon })
          .addTo(map)
          .on('click', () => onSelect(v.id));
        marker.bindPopup(`
          <div style="font-family:monospace;font-size:12px;min-width:160px">
            <b style="color:#a855f7">${v.plateNumber}</b><br/>
            Driver: ${v.driver}<br/>
            Speed: ${v.speed} km/h<br/>
            Status: ${v.status}<br/>
            Risk: ${vs.risk.overall}% ${vs.risk.level}
          </div>
        `, { className: 'cs-popup' });
        markers.current[v.id] = marker;
      }
    });
  }, [vehicles, selectedId]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default function MapPage() {
  const { vehicles, selectedVehicleId, selectVehicle } = useSimStore();
  const vsArr = useMemo(() => Object.values(vehicles), [vehicles]);
  const selected = vehicles[selectedVehicleId] || vsArr[0];

  return (
    <div className="flex flex-col h-full">
      <Header title="Live Fleet Map" subtitle="OpenStreetMap · Real-time vehicle tracking" />
      <div className="flex-1 flex min-h-0">
        {/* Map */}
        <div className="flex-1 relative">
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
          <MapView vehicles={vehicles} selectedId={selectedVehicleId} onSelect={selectVehicle} />

          {/* Legend */}
          <div className="absolute top-4 left-4 z-[1000] glass rounded-xl p-3">
            <div className="text-[10px] font-mono text-[var(--muted-foreground)] mb-2">FLEET STATUS</div>
            {[
              { color: '#22c55e', label: 'Safe' },
              { color: '#f59e0b', label: 'Warning' },
              { color: '#ef4444', label: 'Critical' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                <span className="text-[11px] text-[var(--foreground)]">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Selected vehicle info */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80 z-[1000] glass rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Truck size={14} className="text-purple-400" />
                <span className="text-sm font-semibold text-[var(--foreground)] font-mono">{selected.vehicle.plateNumber}</span>
                <div className={`ml-auto px-2 py-0.5 rounded text-[10px] font-mono ${selected.risk.level === 'critical' ? 'bg-red-500/20 text-red-400' : selected.risk.level === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                  {selected.risk.level.toUpperCase()}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Speed', value: `${selected.vehicle.speed} km/h` },
                  { label: 'Risk', value: `${selected.risk.overall}%` },
                  { label: 'Fuel', value: `${Math.round(selected.vehicle.fuel)}%` },
                ].map(m => (
                  <div key={m.label} className="bg-[var(--muted)] rounded-lg p-2">
                    <div className="text-[11px] font-mono font-bold text-[var(--foreground)]">{m.value}</div>
                    <div className="text-[9px] text-[var(--muted-foreground)]">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                <MapPin size={10} />
                {selected.gps.lat.toFixed(5)}, {selected.gps.lng.toFixed(5)}
              </div>
              {selected.road.warnings.length > 0 && (
                <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-[10px] text-yellow-400 font-mono">⚠ {selected.road.warnings[0]}</div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Vehicle list sidebar */}
        <div className="w-52 shrink-0 border-l border-[var(--border)] bg-[var(--card)] overflow-y-auto p-3">
          <h3 className="text-[10px] font-mono text-[var(--muted-foreground)] mb-2">VEHICLES ({vsArr.length})</h3>
          <div className="space-y-2">
            {vsArr.map(vs => (
              <button
                key={vs.vehicle.id}
                onClick={() => selectVehicle(vs.vehicle.id)}
                className={`w-full p-2.5 rounded-lg border text-left transition-all ${vs.vehicle.id === selectedVehicleId ? 'border-purple-500/50 bg-purple-500/10' : 'border-[var(--border)] hover:border-purple-500/30'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${vs.vehicle.status === 'online' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-[10px] font-mono text-[var(--foreground)] font-semibold truncate">{vs.vehicle.plateNumber}</span>
                </div>
                <div className="text-[9px] text-[var(--muted-foreground)] truncate">{vs.vehicle.driver}</div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] font-mono text-purple-400">{vs.vehicle.speed} km/h</span>
                  <span className="text-[9px] font-mono" style={{ color: vs.risk.level === 'critical' ? '#ef4444' : vs.risk.level === 'warning' ? '#f59e0b' : '#22c55e' }}>{vs.risk.overall}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
