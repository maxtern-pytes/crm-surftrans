import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import {
  LayoutDashboard, Users, Truck, Package, DollarSign, BarChart3,
  Bell, LogOut, Menu, X, Building2, ChevronDown, UserCircle, Bot, Brain, TrendingUp
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ai-dashboard', icon: Brain, label: 'AI Operations' },
  { to: '/market-intelligence', icon: TrendingUp, label: 'Market Trends' },
  { to: '/ai-agent', icon: Bot, label: 'AI Agent' },
  { to: '/admin/agents', icon: Users, label: 'Agents' },
  { to: '/admin/shippers', icon: Building2, label: 'Shippers' },
  { to: '/admin/carriers', icon: Truck, label: 'Carriers' },
  { to: '/admin/loads', icon: Package, label: 'Loads' },
  { to: '/admin/finance', icon: DollarSign, label: 'Finance' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

const agentLinks = [
  { to: '/agent', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ai-dashboard', icon: Brain, label: 'AI Operations' },
  { to: '/market-intelligence', icon: TrendingUp, label: 'Market Trends' },
  { to: '/ai-agent', icon: Bot, label: 'AI Agent' },
  { to: '/agent/clients', icon: Building2, label: 'My Clients' },
  { to: '/agent/loads', icon: Package, label: 'My Loads' },
  { to: '/agent/earnings', icon: DollarSign, label: 'Earnings' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState({ notifications: [], unread_count: 0 });
  const [showNotif, setShowNotif] = useState(false);

  const links = user?.role === 'admin' ? adminLinks : agentLinks;

  useEffect(() => {
    api.getNotifications().then(setNotifications).catch(() => {});
    const interval = setInterval(() => {
      api.getNotifications().then(setNotifications).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleMarkAllRead = async () => {
    await api.markAllRead();
    setNotifications(prev => ({ ...prev, unread_count: 0, notifications: prev.notifications.map(n => ({ ...n, read: 1 })) }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">ST</div>
          <div>
            <div className="font-semibold text-sm">SurfTrans</div>
            <div className="text-[11px] text-slate-400">Freight Broker Platform</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(link => {
            const Icon = link.icon;
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-700">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-medium">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-[11px] text-slate-400 capitalize">{user?.role} {user?.agent_id !== 'ADMIN-001' ? `(${user?.agent_id})` : ''}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell size={20} className="text-gray-600" />
                {notifications.unread_count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications.unread_count}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-sm">Notifications</span>
                    {notifications.unread_count > 0 && (
                      <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications</div>
                    ) : (
                      notifications.notifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-gray-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                          <div className="text-sm font-medium text-gray-800">{n.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
