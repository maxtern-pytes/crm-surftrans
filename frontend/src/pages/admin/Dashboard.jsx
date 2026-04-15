import { useState, useEffect } from 'react';
import { api } from '../../api';
import { StatCard, fmt, StatusBadge } from '../../components/Shared';
import { Package, DollarSign, Users, Truck, Building2, TrendingUp, Activity, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [finance, setFinance] = useState(null);
  const [loadStats, setLoadStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [recentLoads, setRecentLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.getFinanceOverview(),
      api.getLoadStats(),
      api.getRevenueMonthly(),
      api.getAgentPerformance(),
      api.getLoads('limit=5'),
    ]).then(([s, f, ls, r, a, l]) => {
      setSummary(s);
      setFinance(f);
      setLoadStats(ls);
      setRevenueData(r);
      setAgentPerf(a);
      setRecentLoads(l);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const pieData = loadStats ? [
    { name: 'Booked', value: loadStats.booked },
    { name: 'In Transit', value: loadStats.in_transit },
    { name: 'Delivered', value: loadStats.delivered },
    { name: 'Paid', value: loadStats.paid },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your freight brokerage operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={fmt.usd(finance?.total_brokerage_revenue)} sub="Brokerage fees earned" color="green" />
        <StatCard icon={Package} label="Active Loads" value={summary?.active_loads || 0} sub={`${summary?.total_loads || 0} total loads`} color="blue" />
        <StatCard icon={Users} label="Total Agents" value={summary?.agent_count || 0} sub="Active freight agents" color="purple" />
        <StatCard icon={TrendingUp} label="This Month" value={fmt.usd(summary?.revenue_this_month)} sub={`${summary?.delivered_this_month || 0} loads delivered`} color="amber" />
      </div>

      {/* Finance Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Company Net Revenue</div>
          <div className="text-xl font-bold text-green-600">{fmt.usd(finance?.company_net_revenue)}</div>
          <div className="text-xs text-gray-400 mt-1">After agent commissions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Pending Revenue</div>
          <div className="text-xl font-bold text-amber-600">{fmt.usd(finance?.pending_revenue)}</div>
          <div className="text-xs text-gray-400 mt-1">{finance?.pending_invoices || 0} pending invoices</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500 mb-1">Total Commissions</div>
          <div className="text-xl font-bold text-purple-600">{fmt.usd(finance?.total_commissions)}</div>
          <div className="text-xs text-gray-400 mt-1">{fmt.usd(finance?.pending_commissions)} pending payout</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Brokerage Revenue</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt.usd(v)} />
              <Bar dataKey="brokerage_revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Brokerage" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Load Status Pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Load Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-gray-600">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance + Recent Loads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Agent Performance Rankings</h3>
          <div className="space-y-3">
            {agentPerf.slice(0, 5).map((a, i) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{a.first_name} {a.last_name}</div>
                  <div className="text-xs text-gray-400">{a.agent_id} &middot; {a.total_loads} loads &middot; {fmt.pct(a.commission_rate)} rate{a.cap_removed ? ' (no cap)' : ''}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{fmt.usd(a.revenue)}</div>
                  <div className="text-xs text-green-600">{fmt.usd(a.earnings)} earned</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Loads */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Loads</h3>
          <div className="space-y-3">
            {recentLoads.slice(0, 5).map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{l.load_number}</div>
                  <div className="text-xs text-gray-500">{l.origin_city}, {l.origin_state} &rarr; {l.destination_city}, {l.destination_state}</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={l.status} />
                  <div className="text-xs text-gray-500 mt-1">{fmt.usd(l.shipper_rate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
