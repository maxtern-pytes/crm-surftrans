// Determine API base URL with multiple fallbacks
const getApiBase = () => {
  // 1. Environment variable (set during build for production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // 2. If running on Render frontend domain, use Render backend
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://surftrans-backend.onrender.com/api';
  }
  
  // 3. Default to localhost for development
  return '/api';
};

const API_BASE = getApiBase();

// Debug: Log the API base URL in development
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE);
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  
  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),

  // Agents
  getAgents: () => request('/agents'),
  getAgent: (id) => request(`/agents/${id}`),
  createAgent: (data) => request('/agents', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id, data) => request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getAgentCommissions: (id) => request(`/agents/${id}/commissions`),

  // Clients
  getShippers: (params = '') => request(`/clients/shippers${params ? '?' + params : ''}`),
  getShipper: (id) => request(`/clients/shippers/${id}`),
  createShipper: (data) => request('/clients/shippers', { method: 'POST', body: JSON.stringify(data) }),
  updateShipper: (id, data) => request(`/clients/shippers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  discoverClients: (data) => request('/clients/shippers/ai-discover', { method: 'POST', body: JSON.stringify(data) }),
  generateOutreach: (id) => request(`/clients/shippers/${id}/ai-outreach`, { method: 'POST' }),
  getCarriers: (params = '') => request(`/clients/carriers${params ? '?' + params : ''}`),
  getCarrier: (id) => request(`/clients/carriers/${id}`),
  createCarrier: (data) => request('/clients/carriers', { method: 'POST', body: JSON.stringify(data) }),
  updateCarrier: (id, data) => request(`/clients/carriers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  matchCarriers: (data) => request('/clients/carriers/ai-match', { method: 'POST', body: JSON.stringify(data) }),
  addCommunication: (data) => request('/clients/communications', { method: 'POST', body: JSON.stringify(data) }),

  // Loads
  getLoads: (params = '') => request(`/loads${params ? '?' + params : ''}`),
  getLoadStats: () => request('/loads/stats'),
  getLoad: (id) => request(`/loads/${id}`),
  createLoad: (data) => request('/loads', { method: 'POST', body: JSON.stringify(data) }),
  updateLoad: (id, data) => request(`/loads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateLoadStatus: (id, status) => request(`/loads/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAIQuote: (data) => request('/loads/ai-quote', { method: 'POST', body: JSON.stringify(data) }),
  getAIRecommendations: () => request('/loads/ai-recommendations'),

  // Finance
  getFinanceOverview: () => request('/finance/overview'),
  getInvoices: (params = '') => request(`/finance/invoices${params ? '?' + params : ''}`),
  updateInvoiceStatus: (id, status) => request(`/finance/invoices/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getCommissions: (params = '') => request(`/finance/commissions${params ? '?' + params : ''}`),
  approveCommission: (id) => request(`/finance/commissions/${id}/approve`, { method: 'PUT' }),
  payCommission: (id) => request(`/finance/commissions/${id}/pay`, { method: 'PUT' }),
  uploadDocument: (formData) => request('/finance/documents/upload', { method: 'POST', body: formData, headers: {} }),
  runAIAudit: (data) => request('/finance/ai-audit', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getRevenueMonthly: () => request('/analytics/revenue-monthly'),
  getAgentPerformance: () => request('/analytics/agent-performance'),
  getLoadVolume: () => request('/analytics/load-volume'),
  getTopLanes: () => request('/analytics/top-lanes'),
  getDashboardSummary: () => request('/analytics/dashboard-summary'),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),

  // AI Agent
  aiChat: (data) => request('/ai-agent/chat', { method: 'POST', body: JSON.stringify(data) }),
  aiCreateLoad: (data) => request('/ai-agent/create-load', { method: 'POST', body: JSON.stringify(data) }),
  aiDiscoverClients: (data) => request('/ai-agent/discover-clients', { method: 'POST', body: JSON.stringify(data) }),
  aiSendOutreach: (data) => request('/ai-agent/send-outreach', { method: 'POST', body: JSON.stringify(data) }),
  aiGetTasks: (params = '') => request(`/ai-agent/tasks${params ? '?' + params : ''}`),
  aiUpdateTask: (id, data) => request(`/ai-agent/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  aiGetLeads: (params = '') => request(`/ai-agent/leads${params ? '?' + params : ''}`),
  aiGetDashboard: () => request('/ai-agent/dashboard'),
  aiRunOperations: () => request('/ai-agent/run-operations', { method: 'POST' }),
  
  // Generic methods for new endpoints
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
};
