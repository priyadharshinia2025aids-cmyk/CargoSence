import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore, useSimStore } from './stores/appStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveTruckMonitoring from './pages/LiveTruckMonitoring';
import LoadMonitoring from './pages/LoadMonitoring';
import SensorMonitoring from './pages/SensorMonitoring';
import RoadIntelligence from './pages/RoadIntelligence';
import CameraModule from './pages/CameraModule';
import AIAgent from './pages/AIAgent';
import VoiceAssistant from './pages/VoiceAssistant';
import DriverDisplay from './pages/DriverDisplay';
import FleetManager from './pages/FleetManager';
import Warehouse from './pages/Warehouse';
import DigitalTwin from './pages/DigitalTwin';
import MapPage from './pages/MapPage';
import AlertCenter from './pages/AlertCenter';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AIChat from './pages/AIChat';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function SimulationBootstrap({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { init, isRunning } = useSimStore();

  useEffect(() => {
    if (isAuthenticated && !isRunning) {
      init();
    }
  }, [isAuthenticated, isRunning, init]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <SimulationBootstrap>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="fleet" element={<LiveTruckMonitoring />} />
            <Route path="load" element={<LoadMonitoring />} />
            <Route path="sensors" element={<SensorMonitoring />} />
            <Route path="road" element={<RoadIntelligence />} />
            <Route path="camera" element={<CameraModule />} />
            <Route path="ai-agent" element={<AIAgent />} />
            <Route path="voice" element={<VoiceAssistant />} />
            <Route path="driver" element={<DriverDisplay />} />
            <Route path="fleet-manager" element={<FleetManager />} />
            <Route path="warehouse" element={<Warehouse />} />
            <Route path="digital-twin" element={<DigitalTwin />} />
            <Route path="map" element={<MapPage />} />
            <Route path="alerts" element={<AlertCenter />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="reports" element={<Reports />} />
            <Route path="ai-chat" element={<AIChat />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SimulationBootstrap>
    </BrowserRouter>
  );
}
