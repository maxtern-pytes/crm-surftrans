import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { StatCard, StatusBadge, fmt } from '../../components/Shared';
import { Package, DollarSign, TrendingUp, Award, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [finance, setFinance] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentLoads, setRecentLoads] = useState([]);
  const [agentDetail, setAgentDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardSummary(),
      api.getFinanceOverview(),
      api.getRevenueMonthly(),
      api.getLoads('limit=5'),
      api.getAgent(user.id),
    ]).then(([s, f, r, l, a]) => {
      setSummary(s); setFinance(f); setRevenueData(r); setRecentLoads(l); setAgentDetail(a);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const progressPct = agentDetail && !agentDetail.cap_removed ? Math.min(100, (agentDetail.total_brokerage / 2000) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.first_name}!</h1>
        <p className="text-sm text-gray-500 mt-1">Agent ID: {user.agent_id} &middot; Here's your performance overview</p>
      </div>

      {/* Commission Tier Status */}
      <div className={`rounded-xl p-5 ${agentDetail?.cap_removed ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'}`}>
        <div className="flex items-start gap-3">
          <Award className={agentDetail?.cap_removed ? 'text-green-500' : 'text-blue-500'} size={24} />
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">
              {agentDetail?.cap_removed ? 'Tier 2 - Premium Agent' : 'Tier 1 - Standard Agent'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Commission Rate: <span className="font-bold">{fmt.pct(agentDetail?.commission_rate || 0.17)}</span>
              {agentDetail?.cap_removed ? ' (No Cap)' : ` (Cap: ${fmt.usd(agentDetail?.commission_cap || 500)})`}
            </div>
            {!agentDetail?.cap_removed && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress to Tier 2</span>
                  <span>{fmt.usd(agentDetail?.total_brokerage || 0)} / $2,000</span>
                </div>
                <div className="w-full bg-white/80 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="text-xs text-gray-400 mt-1">Earn {fmt.usd(2000 - (agentDetail?.total_brokerage || 0))} more in brokerage to unlock 27% rate with no cap</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Active Loads" value={summary?.active_loads || 0} sub={`${summary?.total_loads || 0} total`} color="blue" />
        <StatCard icon={DollarSign} label="Total Earnings" value={fmt.usd(finance?.total_commissions)} color="green" />
        <StatCard icon={TrendingUp} label="Total Brokerage" value={fmt.usd(agentDetail?.total_brokerage)} sub="Lifetime brokerage generated" color="purple" />
        <StatCard icon={DollarSign} label="Pending Payout" value={fmt.usd(finance?.pending_commissions)} sub="Awaiting approval/payment" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">My Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => fmt.usd(v)} />
              <Bar dataKey="brokerage_revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Brokerage" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Loads */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Loads</h3>
          <div className="space-y-3">
            {recentLoads.length === 0 ? (
              <div className="text-center text-sm text-gray-400 py-8">No loads yet. Start by creating your first load!</div>
            ) : recentLoads.map(l => (
              <div key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{l.load_number}</div>
                  <div className="text-xs text-gray-500">
                    {l.origin_city}, {l.origin_state} <ArrowRight size={10} className="inline" /> {l.destination_city}, {l.destination_state}
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={l.status} />
                  <div className="text-xs font-medium text-green-600 mt-1">{fmt.usd(l.brokerage_fee)} margin</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
