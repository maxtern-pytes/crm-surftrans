import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import { StatCard, DataTable, StatusBadge, fmt } from '../../components/Shared';
import { DollarSign, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Earnings() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [finance, setFinance] = useState(null);
  const [agentDetail, setAgentDetail] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAgentCommissions(user.id),
      api.getFinanceOverview(),
      api.getAgent(user.id),
      api.getRevenueMonthly(),
    ]).then(([c, f, a, r]) => {
      setCommissions(c); setFinance(f); setAgentDetail(a); setRevenueData(r);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user.id]);

  const columns = [
    { header: 'Load', render: r => <span className="font-mono text-xs font-medium">{r.load_number}</span> },
    { header: 'Route', render: r => <span className="text-sm">{r.origin_city}, {r.origin_state} &rarr; {r.destination_city}, {r.destination_state}</span> },
    { header: 'Brokerage Fee', render: r => <span className="font-medium">{fmt.usd(r.brokerage_fee)}</span> },
    { header: 'Rate', render: r => <span>{fmt.pct(r.commission_rate)}</span> },
    { header: 'Cap Applied', render: r => r.cap_applied ? <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Yes</span> : <span className="text-xs text-gray-400">No</span> },
    { header: 'Commission', render: r => <span className="font-semibold text-green-600">{fmt.usd(r.commission_amount)}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const paidComms = commissions.filter(c => c.status === 'paid');
  const pendingComms = commissions.filter(c => c.status === 'pending' || c.status === 'approved');

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My Earnings</h1><p className="text-sm text-gray-500 mt-1">Commission history and payout tracking</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Earned" value={fmt.usd(finance?.total_commissions)} color="green" />
        <StatCard icon={CheckCircle} label="Paid Out" value={fmt.usd(finance?.paid_commissions)} color="blue" />
        <StatCard icon={Clock} label="Pending Payout" value={fmt.usd(finance?.pending_commissions)} color="amber" />
        <StatCard icon={TrendingUp} label="Total Brokerage" value={fmt.usd(agentDetail?.total_brokerage)} sub={`Rate: ${fmt.pct(agentDetail?.commission_rate || 0)}`} color="purple" />
      </div>

      {/* Earnings Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Earnings</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmt.usd(v)} />
            <Bar dataKey="brokerage_revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Brokerage Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Commission History */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Commission History ({commissions.length} records)</h3>
        </div>
        <DataTable columns={columns} data={commissions} emptyMessage="No commissions yet. Complete loads to earn commissions!" />
      </div>
    </div>
  );
}
