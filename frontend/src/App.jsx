import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Agents from './pages/admin/Agents';
import Shippers from './pages/admin/Shippers';
import Carriers from './pages/admin/Carriers';
import Loads from './pages/admin/Loads';
import Finance from './pages/admin/Finance';
import Analytics from './pages/admin/Analytics';

// Agent pages
import AgentDashboard from './pages/agent/Dashboard';
import MyClients from './pages/agent/MyClients';
import MyLoads from './pages/agent/MyLoads';
import Earnings from './pages/agent/Earnings';

// AI Agent
import AIAgent from './pages/AIAgent';
import AIDashboard from './pages/admin/AIDashboard';
import MarketIntelligence from './pages/admin/MarketIntelligence';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/agent'} replace /> : <Login />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/agents" element={<ProtectedRoute role="admin"><Agents /></ProtectedRoute>} />
      <Route path="/admin/shippers" element={<ProtectedRoute role="admin"><Shippers /></ProtectedRoute>} />
      <Route path="/admin/carriers" element={<ProtectedRoute role="admin"><Carriers /></ProtectedRoute>} />
      <Route path="/admin/loads" element={<ProtectedRoute role="admin"><Loads /></ProtectedRoute>} />
      <Route path="/admin/finance" element={<ProtectedRoute role="admin"><Finance /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><Analytics /></ProtectedRoute>} />

      {/* Agent Routes */}
      <Route path="/agent" element={<ProtectedRoute role="agent"><AgentDashboard /></ProtectedRoute>} />
      <Route path="/agent/clients" element={<ProtectedRoute role="agent"><MyClients /></ProtectedRoute>} />
      <Route path="/agent/loads" element={<ProtectedRoute role="agent"><MyLoads /></ProtectedRoute>} />
      <Route path="/agent/earnings" element={<ProtectedRoute role="agent"><Earnings /></ProtectedRoute>} />

      {/* AI Agent Route (Both admin and agent) */}
      <Route path="/ai-agent" element={<ProtectedRoute><AIAgent /></ProtectedRoute>} />
      <Route path="/ai-dashboard" element={<ProtectedRoute><AIDashboard /></ProtectedRoute>} />
      <Route path="/market-intelligence" element={<ProtectedRoute><MarketIntelligence /></ProtectedRoute>} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
