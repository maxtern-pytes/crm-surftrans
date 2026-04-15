import { useState, useEffect } from 'react';
import { api } from '../../api';
import { fmt } from '../../components/Shared';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const [revenueData, setRevenueData] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);
  const [loadVolume, setLoadVolume] = useState([]);
  const [topLanes, setTopLanes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getRevenueMonthly(),
      api.getAgentPerformance(),
      api.getLoadVolume(),
      api.getTopLanes(),
    ]).then(([r, a, l, t]) => {
      setRevenueData(r); setAgentPerf(a); setLoadVolume(l); setTopLanes(t);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Analytics</h1><p className="text-sm text-gray-500 mt-1">Data-driven insights for your brokerage</p></div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => fmt.usd(v)} />
            <Bar dataKey="gross_revenue" fill="#93c5fd" radius={[2, 2, 0, 0]} name="Gross Revenue" />
            <Bar dataKey="brokerage_revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Brokerage Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Volume */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Load Volume Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={loadVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.3} name="Total" />
              <Area type="monotone" dataKey="completed" stroke="#10b981" fill="#6ee7b7" fillOpacity={0.3} name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Lanes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Shipping Lanes</h3>
          <div className="space-y-3">
            {topLanes.map((lane, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 text-xs text-gray-400 text-center">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{lane.lane}</span>
                    <span className="text-xs text-gray-500">{lane.load_count} loads</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${(lane.load_count / (topLanes[0]?.load_count || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-400">
                    <span>Avg Rate: {fmt.usd(lane.avg_rate)}</span>
                    <span>Avg Margin: {fmt.usd(lane.avg_margin)}</span>
                  </div>
                </div>
              </div>
            ))}
            {topLanes.length === 0 && <div className="text-center text-sm text-gray-400 py-8">No lane data available</div>}
          </div>
        </div>
      </div>

      {/* Agent Productivity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Agent Productivity Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agentPerf} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="first_name" tick={{ fontSize: 11 }} width={80} />
            <Tooltip formatter={v => fmt.usd(v)} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" />
            <Bar dataKey="earnings" fill="#10b981" radius={[0, 4, 4, 0]} name="Earnings" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
