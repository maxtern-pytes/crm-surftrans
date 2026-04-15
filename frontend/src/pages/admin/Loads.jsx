import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Modal, DataTable, StatusBadge, fmt } from '../../components/Shared';
import { Plus, Search, ArrowRight, RefreshCw, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

export default function Loads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [shippers, setShippers] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [aiQuote, setAIQuote] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState([]);
  const [form, setForm] = useState({
    shipper_id: '', carrier_id: '', agent_id: '', origin_city: '', origin_state: '', destination_city: '', destination_state: '',
    pickup_date: '', delivery_date: '', commodity: '', weight: '', equipment_type: 'Dry Van', shipper_rate: '', carrier_rate: '', notes: ''
  });

  const loadData = () => {
    const params = [];
    if (filter) params.push(`status=${filter}`);
    if (search) params.push(`search=${search}`);
    api.getLoads(params.join('&')).then(setLoads).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(loadData, [filter]);

  useEffect(() => {
    Promise.all([api.getShippers(), api.getCarriers(), api.getAgents()]).then(([s, c, a]) => {
      setShippers(s); setCarriers(c); setAgents(a);
    }).catch(() => {});
    // Load AI recommendations
    api.getAIRecommendations().then(res => {
      if (res.recommendations) setAIRecommendations(res.recommendations);
    }).catch(() => {});
  }, []);

  const handleGetAIQuote = async () => {
    if (!form.origin_city || !form.origin_state || !form.destination_city || !form.destination_state) {
      alert('Please enter origin and destination first');
      return;
    }
    setAILoading(true);
    try {
      const quote = await api.getAIQuote({
        origin_city: form.origin_city,
        origin_state: form.origin_state,
        destination_city: form.destination_city,
        destination_state: form.destination_state,
        commodity: form.commodity,
        weight: form.weight,
        equipment_type: form.equipment_type
      });
      setAIQuote(quote);
    } catch (err) {
      alert(err.message);
    } finally {
      setAILoading(false);
    }
  };

  const handleAcceptQuote = () => {
    if (aiQuote) {
      setForm({
        ...form,
        shipper_rate: aiQuote.recommended_shipper_rate?.toString() || '',
        carrier_rate: aiQuote.recommended_carrier_rate?.toString() || ''
      });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = { 
        ...form, 
        shipper_rate: parseFloat(form.shipper_rate), 
        carrier_rate: form.carrier_rate ? parseFloat(form.carrier_rate) : null, 
        weight: form.weight ? parseFloat(form.weight) : null,
        ai_quote_data: aiQuote,
        risk_level: aiQuote?.risk_level || 'medium',
        transit_estimate: aiQuote?.transit_days ? `${aiQuote.transit_days} days` : null
      };
      await api.createLoad(data);
      setShowAdd(false);
      setAIQuote(null);
      setForm({ shipper_id: '', carrier_id: '', agent_id: '', origin_city: '', origin_state: '', destination_city: '', destination_state: '', pickup_date: '', delivery_date: '', commodity: '', weight: '', equipment_type: 'Dry Van', shipper_rate: '', carrier_rate: '', notes: '' });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleSelect = async (row) => {
    try { const detail = await api.getLoad(row.id); setSelected(detail); } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (loadId, newStatus) => {
    try {
      await api.updateLoadStatus(loadId, newStatus);
      const detail = await api.getLoad(loadId);
      setSelected(detail);
      loadData();
    } catch (err) { alert(err.message); }
  };

  const statusFilters = ['', 'booked', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'cancelled'];

  const columns = [
    { header: 'Load #', render: r => <span className="font-mono text-xs font-medium text-blue-600">{r.load_number}</span> },
    { header: 'Route', render: r => (
      <div className="text-sm">
        <span>{r.origin_city}, {r.origin_state}</span>
        <ArrowRight size={12} className="inline mx-1 text-gray-400" />
        <span>{r.destination_city}, {r.destination_state}</span>
      </div>
    )},
    { header: 'Shipper', render: r => <span className="text-sm">{r.shipper_name || '-'}</span> },
    { header: 'Carrier', render: r => <span className="text-sm">{r.carrier_name || '-'}</span> },
    { header: 'Agent', render: r => <span className="text-sm">{r.agent_first ? `${r.agent_first} ${r.agent_last}` : '-'}</span> },
    { header: 'Rates', render: r => (
      <div className="text-xs">
        <div>Ship: <span className="font-medium">{fmt.usd(r.shipper_rate)}</span></div>
        <div>Carrier: <span className="font-medium">{fmt.usd(r.carrier_rate)}</span></div>
      </div>
    )},
    { header: 'Margin', render: r => <span className="font-medium text-green-600">{fmt.usd(r.brokerage_fee)}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Loads</h1><p className="text-sm text-gray-500 mt-1">{loads.length} shipments</p></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><Plus size={16} /> Create Load</button>
      </div>

      {/* AI Recommendations */}
      {aiRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-purple-600" />
            <h3 className="text-sm font-semibold text-purple-900">AI Load Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiRecommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs font-medium text-gray-900">
                    {rec.origin_city}, {rec.origin_state} → {rec.destination_city}, {rec.destination_state}
                  </div>
                  <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                    rec.confidence_score > 75 ? 'bg-green-100 text-green-700' :
                    rec.confidence_score > 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {rec.confidence_score}%
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Est. Margin: <span className="font-semibold text-green-600">{fmt.usd(rec.estimated_margin)}</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">{rec.reasoning}</div>
                <button
                  onClick={() => {
                    setForm({
                      ...form,
                      origin_city: rec.origin_city,
                      origin_state: rec.origin_state,
                      destination_city: rec.destination_city,
                      destination_state: rec.destination_state,
                      commodity: rec.recommended_commodity || form.commodity
                    });
                    setShowAdd(true);
                  }}
                  className="w-full px-2 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                >
                  Create Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {statusFilters.map(s => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </button>
        ))}
        <div className="relative ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadData()} placeholder="Search..."
            className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none w-44" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={loads} onRowClick={handleSelect} />
      </div>

      {/* Create Load Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setAIQuote(null); }} title="Create New Load" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipper *</label>
              <select required value={form.shipper_id} onChange={e => setForm({...form, shipper_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Shipper</option>
                {shippers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
              <select value={form.carrier_id} onChange={e => setForm({...form, carrier_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Carrier</option>
                {carriers.map(c => <option key={c.id} value={c.id}>{c.company_name} ({c.mc_number})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-xs font-medium text-blue-700 mb-2">Origin</div>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="City *" value={form.origin_city} onChange={e => setForm({...form, origin_city: e.target.value})} className="px-2 py-1.5 border border-gray-300 rounded text-sm outline-none" />
                <input required placeholder="State *" value={form.origin_state} onChange={e => setForm({...form, origin_state: e.target.value})} className="px-2 py-1.5 border border-gray-300 rounded text-sm outline-none" />
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-xs font-medium text-green-700 mb-2">Destination</div>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="City *" value={form.destination_city} onChange={e => setForm({...form, destination_city: e.target.value})} className="px-2 py-1.5 border border-gray-300 rounded text-sm outline-none" />
                <input required placeholder="State *" value={form.destination_state} onChange={e => setForm({...form, destination_state: e.target.value})} className="px-2 py-1.5 border border-gray-300 rounded text-sm outline-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Commodity</label><input value={form.commodity} onChange={e => setForm({...form, commodity: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label><input type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
              <select value={form.equipment_type} onChange={e => setForm({...form, equipment_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option>Dry Van</option><option>Reefer</option><option>Flatbed</option><option>Step Deck</option><option>Lowboy</option>
              </select>
            </div>
          </div>

          {/* AI Quote Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleGetAIQuote}
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
            >
              <Sparkles size={16} />
              {aiLoading ? 'Generating Quote...' : 'Get AI Quote'}
            </button>
            {aiQuote && (
              <button
                type="button"
                onClick={handleAcceptQuote}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                Accept Quote
              </button>
            )}
          </div>

          {/* AI Quote Display */}
          {aiQuote && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">AI Pricing Analysis</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="bg-white rounded p-2">
                  <div className="text-xs text-gray-500">Shipper Rate</div>
                  <div className="text-sm font-bold text-blue-600">
                    {fmt.usd(aiQuote.shipper_rate_min)} - {fmt.usd(aiQuote.shipper_rate_max)}
                  </div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-xs text-gray-500">Carrier Rate</div>
                  <div className="text-sm font-bold text-amber-600">
                    {fmt.usd(aiQuote.carrier_rate_min)} - {fmt.usd(aiQuote.carrier_rate_max)}
                  </div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-xs text-gray-500">Expected Margin</div>
                  <div className="text-sm font-bold text-green-600">{fmt.usd(aiQuote.expected_margin)}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-xs text-gray-500">Transit</div>
                  <div className="text-sm font-bold text-gray-700">{aiQuote.transit_days} days</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className={`px-2 py-1 rounded font-medium ${
                  aiQuote.risk_level === 'low' ? 'bg-green-100 text-green-700' :
                  aiQuote.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <AlertCircle size={12} className="inline mr-1" />
                  Risk: {aiQuote.risk_level}
                </div>
                <div className="text-gray-600">Confidence: {aiQuote.confidence_score}%</div>
              </div>
              {aiQuote.market_notes && (
                <div className="mt-2 text-xs text-gray-600 italic">{aiQuote.market_notes}</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label><input type="date" value={form.pickup_date} onChange={e => setForm({...form, pickup_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label><input type="date" value={form.delivery_date} onChange={e => setForm({...form, delivery_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Shipper Rate ($) *</label><input required type="number" step="0.01" value={form.shipper_rate} onChange={e => setForm({...form, shipper_rate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Carrier Rate ($)</label><input type="number" step="0.01" value={form.carrier_rate} onChange={e => setForm({...form, carrier_rate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Margin</label>
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
                {form.shipper_rate && form.carrier_rate ? fmt.usd(parseFloat(form.shipper_rate) - parseFloat(form.carrier_rate)) : '-'}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowAdd(false); setAIQuote(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create Load</button>
          </div>
        </form>
      </Modal>

      {/* Load Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Load ${selected.load_number}` : ''} wide>
        {selected && (
          <div className="space-y-6">
            {/* Status Pipeline */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {['booked','dispatched','in_transit','delivered','invoiced','paid'].map((s, i) => {
                const statuses = ['booked','dispatched','in_transit','delivered','invoiced','paid'];
                const currentIdx = statuses.indexOf(selected.status);
                const thisIdx = i;
                const done = thisIdx <= currentIdx;
                return (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${done ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    {i < 5 && <ArrowRight size={12} className="text-gray-300 shrink-0" />}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Origin</div><div className="text-sm font-medium mt-0.5">{selected.origin_city}, {selected.origin_state}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Destination</div><div className="text-sm font-medium mt-0.5">{selected.destination_city}, {selected.destination_state}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Pickup</div><div className="text-sm mt-0.5">{fmt.date(selected.pickup_date)}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Delivery</div><div className="text-sm mt-0.5">{fmt.date(selected.delivery_date)}</div></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-xs text-blue-600 mb-1">Shipper Rate</div>
                <div className="text-lg font-bold text-blue-700">{fmt.usd(selected.shipper_rate)}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <div className="text-xs text-amber-600 mb-1">Carrier Rate</div>
                <div className="text-lg font-bold text-amber-700">{fmt.usd(selected.carrier_rate)}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-xs text-green-600 mb-1">Brokerage Margin</div>
                <div className="text-lg font-bold text-green-700">{fmt.usd(selected.brokerage_fee)}</div>
              </div>
            </div>

            {/* Commission Info */}
            {selected.commission && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-800 mb-1">Commission</div>
                <div className="text-xs text-purple-600">
                  {fmt.usd(selected.commission.brokerage_fee)} &times; {fmt.pct(selected.commission.commission_rate)}
                  {selected.commission.cap_applied ? ' (capped)' : ''}
                  &nbsp;= <span className="font-bold">{fmt.usd(selected.commission.commission_amount)}</span>
                  &nbsp;&middot;&nbsp;<StatusBadge status={selected.commission.status} />
                </div>
              </div>
            )}

            {/* Status Actions */}
            {selected.status !== 'paid' && selected.status !== 'cancelled' && (
              <div className="flex gap-2 pt-2">
                {selected.status === 'booked' && <button onClick={() => handleStatusChange(selected.id, 'dispatched')} className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700">Mark Dispatched</button>}
                {selected.status === 'dispatched' && <button onClick={() => handleStatusChange(selected.id, 'in_transit')} className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700">Mark In Transit</button>}
                {selected.status === 'in_transit' && <button onClick={() => handleStatusChange(selected.id, 'delivered')} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">Mark Delivered</button>}
                {selected.status === 'delivered' && <button onClick={() => handleStatusChange(selected.id, 'invoiced')} className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">Mark Invoiced</button>}
                {selected.status === 'invoiced' && <button onClick={() => handleStatusChange(selected.id, 'paid')} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">Mark Paid</button>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
