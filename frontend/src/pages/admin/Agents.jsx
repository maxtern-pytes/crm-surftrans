import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Modal, DataTable, StatusBadge, fmt } from '../../components/Shared';
import { UserPlus, Search, TrendingUp, Award } from 'lucide-react';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', first_name: '', last_name: '', phone: '' });
  const [search, setSearch] = useState('');

  const load = () => { api.getAgents().then(setAgents).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createAgent(form);
      setShowAdd(false);
      setForm({ email: '', password: '', first_name: '', last_name: '', phone: '' });
      load();
    } catch (err) { alert(err.message); }
  };

  const filtered = agents.filter(a =>
    `${a.first_name} ${a.last_name} ${a.agent_id} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { header: 'Agent ID', render: r => <span className="font-mono text-xs font-medium text-blue-600">{r.agent_id}</span> },
    { header: 'Name', render: r => <div><div className="font-medium text-gray-900">{r.first_name} {r.last_name}</div><div className="text-xs text-gray-400">{r.email}</div></div> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Commission', render: r => (
      <div>
        <span className="font-medium">{fmt.pct(r.commission_rate)}</span>
        {r.cap_removed ? <span className="ml-1.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">No Cap</span>
          : <span className="ml-1.5 text-xs text-gray-400">cap {fmt.usd(r.commission_cap)}</span>}
      </div>
    )},
    { header: 'Total Brokerage', render: r => <span className="font-medium">{fmt.usd(r.total_brokerage)}</span> },
    { header: 'Loads', render: r => <span>{r.total_loads}</span> },
    { header: 'Earnings', render: r => <span className="font-medium text-green-600">{fmt.usd(r.total_earnings)}</span> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-sm text-gray-500 mt-1">{agents.length} registered agents</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <UserPlus size={16} /> Add Agent
        </button>
      </div>

      {/* Commission Threshold Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-4 flex items-start gap-3">
        <Award className="text-blue-500 mt-0.5 shrink-0" size={20} />
        <div>
          <div className="text-sm font-medium text-gray-800">Commission Tier System</div>
          <div className="text-xs text-gray-600 mt-1">
            <span className="font-medium">Tier 1:</span> 17% commission, capped at $500 per load &middot;
            <span className="font-medium ml-2">Tier 2:</span> 27% commission, no cap (auto-activated when total brokerage exceeds $2,000)
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search agents..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={filtered} onRowClick={setSelected} />
      </div>

      {/* Add Agent Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Agent">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input required type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create Agent</button>
          </div>
        </form>
      </Modal>

      {/* Agent Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.first_name} ${selected.last_name}` : ''} wide>
        {selected && <AgentDetail agent={selected} />}
      </Modal>
    </div>
  );
}

function AgentDetail({ agent }) {
  const [commissions, setCommissions] = useState([]);
  useEffect(() => {
    api.getAgentCommissions(agent.id).then(setCommissions).catch(() => {});
  }, [agent.id]);

  return (
    <div className="space-y-6">
      {/* Agent Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Agent ID</div>
          <div className="font-mono font-medium text-sm mt-0.5">{agent.agent_id}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Status</div>
          <div className="mt-0.5"><StatusBadge status={agent.status} /></div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Commission Rate</div>
          <div className="font-medium text-sm mt-0.5">{fmt.pct(agent.commission_rate)} {agent.cap_removed ? '(No Cap)' : `(Cap: ${fmt.usd(agent.commission_cap)})`}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Total Brokerage</div>
          <div className="font-medium text-sm mt-0.5">{fmt.usd(agent.total_brokerage)}</div>
        </div>
      </div>

      {/* Progress Bar to Threshold */}
      {!agent.cap_removed && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to Tier 2 Upgrade</span>
            <span>{fmt.usd(agent.total_brokerage)} / $2,000</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (agent.total_brokerage / 2000) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Commission History */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Commission History</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {commissions.length === 0 ? (
            <div className="text-sm text-gray-400 py-4 text-center">No commissions yet</div>
          ) : commissions.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="font-mono text-xs font-medium">{c.load_number}</span>
                <span className="text-gray-400 mx-2">&middot;</span>
                <span className="text-gray-600">{c.origin_city} &rarr; {c.destination_city}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Fee: {fmt.usd(c.brokerage_fee)} &times; {fmt.pct(c.commission_rate)}{c.cap_applied ? ' (capped)' : ''}</span>
                <span className="font-semibold text-green-600">{fmt.usd(c.commission_amount)}</span>
                <StatusBadge status={c.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
