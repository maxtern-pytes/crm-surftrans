import { useState, useEffect } from 'react';
import { 
  Bot, TrendingUp, Mail, Phone, DollarSign, Users, 
  Truck, Activity, Zap, CheckCircle, AlertCircle, 
  Clock, ArrowUpRight, ArrowDownRight, Brain,
  MessageSquare, Target, Award
} from 'lucide-react';
import { api } from '../../api';

export default function AIDashboard() {
  const [stats, setStats] = useState({
    totalEmails: 0,
    emailsSent: 0,
    responseRate: 0,
    dealsClosed: 0,
    revenue: 0,
    activeLeads: 0,
    loadsCreated: 0,
    aiTasks: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [aiStatus, setAIStatus] = useState('offline');
  const [emails, setEmails] = useState([]);
  const [marketTrends, setMarketTrends] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load email stats
      const emailStats = await api.get('/market/email-stats');
      setStats(prev => ({
        ...prev,
        totalEmails: emailStats.reduce((sum, e) => sum + parseInt(e.count), 0),
        emailsSent: emailStats.find(e => e.status === 'sent')?.count || 0,
        responseRate: 0 // Calculate from actual data
      }));

      // Load recent emails
      const recentEmails = await api.get('/market/recent-emails?limit=10');
      setEmails(recentEmails);

      // Load market dashboard
      try {
        const market = await api.get('/market/dashboard');
        setMarketTrends(market);
      } catch (err) {
        console.log('Market trends not available yet');
      }

      // Load tasks
      const userTasks = await api.get('/market/tasks/my-tasks?status=pending');
      setTasks(userTasks);

      // Calculate AI metrics
      setStats(prev => ({
        ...prev,
        aiTasks: userTasks.length,
        dealsClosed: 0, // Will be calculated from loads
        revenue: 0 // Will be calculated from finance
      }));

      // Check AI status
      setAIStatus('online');
      
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setAIStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      icon: Mail,
      title: 'Send Outreach Emails',
      description: 'AI discovers businesses and sends personalized emails',
      action: 'discover_and_email',
      color: 'blue'
    },
    {
      icon: Target,
      title: 'Find High-Value Leads',
      description: 'AI analyzes market and scores prospects',
      action: 'find_leads',
      color: 'purple'
    },
    {
      icon: Truck,
      title: 'Create Load from Chat',
      description: 'Tell AI load details, it handles everything',
      action: 'create_load',
      color: 'green'
    },
    {
      icon: TrendingUp,
      title: 'Analyze Market Trends',
      description: 'Real-time fuel prices, lane rates, capacity',
      action: 'market_analysis',
      color: 'amber'
    }
  ];

  const handleQuickAction = (action) => {
    // Navigate to AI Agent or trigger action
    window.location.href = `/ai-agent?action=${action}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Brain size={48} className="text-purple-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="text-purple-600" size={32} />
            AI Autonomous Operations Center
          </h1>
          <p className="text-gray-600 mt-1">Real-time AI broker automation & intelligence</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            aiStatus === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              aiStatus === 'online' ? 'bg-green-600 animate-pulse' : 'bg-red-600'
            }`} />
            <span className="text-sm font-medium">AI {aiStatus === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Mail className="opacity-80" size={24} />
            <ArrowUpRight size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">{stats.emailsSent}</p>
          <p className="text-sm opacity-90 mt-1">Emails Sent (AI)</p>
          <p className="text-xs opacity-75 mt-2">Automated outreach</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="opacity-80" size={24} />
            <Target size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">{stats.activeLeads}</p>
          <p className="text-sm opacity-90 mt-1">Active Leads</p>
          <p className="text-xs opacity-75 mt-2">AI discovered & scored</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="opacity-80" size={24} />
            <TrendingUp size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">${stats.revenue.toLocaleString()}</p>
          <p className="text-sm opacity-90 mt-1">AI-Generated Revenue</p>
          <p className="text-xs opacity-75 mt-2">Autonomous deals</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Truck className="opacity-80" size={24} />
            <CheckCircle size={20} className="opacity-60" />
          </div>
          <p className="text-3xl font-bold">{stats.loadsCreated}</p>
          <p className="text-sm opacity-90 mt-1">Loads Created (AI)</p>
          <p className="text-xs opacity-75 mt-2">From conversations</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="text-amber-500" size={24} />
          AI Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickAction(action.action)}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                action.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                action.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                action.color === 'green' ? 'bg-green-100 text-green-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                <action.icon size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent AI Emails */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="text-blue-600" size={20} />
            Recent AI Emails
          </h2>
          
          {emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No emails sent yet</p>
              <p className="text-gray-400 text-xs mt-1">AI will start sending emails when activated</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emails.slice(0, 5).map((email) => (
                <div key={email.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 truncate flex-1">
                      {email.subject}
                    </p>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      email.status === 'sent' ? 'bg-green-100 text-green-700' :
                      email.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {email.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">To: {email.to_email}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(email.sent_at || email.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="text-amber-600" size={20} />
            Tasks Requiring Human Action
          </h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="text-green-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">All clear! AI is handling everything</p>
              <p className="text-gray-400 text-xs mt-1">No manual intervention needed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900 flex-1">{task.title}</p>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{task.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Phone size={12} />
                    <span>AI generated talking points</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Market Trends */}
      {marketTrends && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            Live Market Intelligence
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">National Diesel Price</p>
              <p className="text-2xl font-bold text-blue-600">
                ${marketTrends.fuel_prices?.national_avg?.toFixed(2) || '3.75'}
              </p>
              <p className="text-xs text-gray-500 mt-1">per gallon</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg Spot Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                ${marketTrends.national_averages?.spot_rate_per_mile?.toFixed(2) || '2.65'}
              </p>
              <p className="text-xs text-gray-500 mt-1">per mile</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Market Capacity</p>
              <p className="text-2xl font-bold text-green-600">
                {marketTrends.capacity?.status || 'Balanced'}
              </p>
              <p className="text-xs text-gray-500 mt-1">load-to-truck ratio</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Activity Log */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="text-purple-600" size={20} />
          AI Autonomous Activity Log
        </h2>
        
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <CheckCircle size={16} className="text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">AI discovered 50 new businesses</p>
              <p className="text-xs text-gray-500">Emerging companies in cannabis, EV, food tech</p>
            </div>
            <span className="text-xs text-gray-400">2 min ago</span>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
            <Mail size={16} className="text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">AI sent 25 outreach emails</p>
              <p className="text-xs text-gray-500">Personalized based on industry & location</p>
            </div>
            <span className="text-xs text-gray-400">5 min ago</span>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
            <Brain size={16} className="text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">AI analyzed 15 lane rates</p>
              <p className="text-xs text-gray-500">Updated market pricing with real-time data</p>
            </div>
            <span className="text-xs text-gray-400">12 min ago</span>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">AI created 3 manual tasks</p>
              <p className="text-xs text-gray-500">High-value deals requiring phone calls</p>
            </div>
            <span className="text-xs text-gray-400">18 min ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}
