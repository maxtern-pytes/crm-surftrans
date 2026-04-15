import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Modal, DataTable, StatusBadge, fmt } from '../../components/Shared';
import { Plus, ArrowRight } from 'lucide-react';

export default function MyLoads() {
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [shippers, setShippers] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [form, setForm] = useState({
    shipper_id: '', carrier_id: '', origin_city: '', origin_state: '', destination_city: '', destination_state: '',
    pickup_date: '', delivery_date: '', commodity: '', equipment_type: 'Dry Van', shipper_rate: '', carrier_rate: ''
  });

  const loadData = () => {
    const params = filter ? `status=${filter}` : '';
    api.getLoads(params).then(setLoads).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(loadData, [filter]);

  useEffect(() => {
    Promise.all([api.getShippers(), api.getCarriers()]).then(([s, c]) => { setShippers(s); setCarriers(c); }).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createLoad({ ...form, shipper_rate: parseFloat(form.shipper_rate), carrier_rate: form.carrier_rate ? parseFloat(form.carrier_rate) : null });
      setShowAdd(false);
      setForm({ shipper_id: '', carrier_id: '', origin_city: '', origin_state: '', destination_city: '', destination_state: '', pickup_date: '', delivery_date: '', commodity: '', equipment_type: 'Dry Van', shipper_rate: '', carrier_rate: '' });
      loadData();
    } catch (err) { alert(err.message); }
  };

  const handleSelect = async (row) => {
    try { const detail = await api.getLoad(row.id); setSelected(detail); } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (loadId, newStatus) => {
    try { await api.updateLoadStatus(loadId, newStatus); const detail = await api.getLoad(loadId); setSelected(detail); loadData(); }
    catch (err) { alert(err.message); }
  };

  const statusFilters = ['', 'booked', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid'];

  const columns = [
    { header: 'Load #', render: r => <span className="font-mono text-xs font-medium text-blue-600">{r.load_number}</span> },
    { header: 'Route', render: r => <div className="text-sm">{r.origin_city}, {r.origin_state} <ArrowRight size={12} className="inline mx-1 text-gray-400" /> {r.destination_city}, {r.destination_state}</div> },
    { header: 'Shipper', render: r => <span className="text-sm">{r.shipper_name || '-'}</span> },
    { header: 'Carrier', render: r => <span className="text-sm">{r.carrier_name || '-'}</span> },
    { header: 'Ship Rate', render: r => <span className="font-medium">{fmt.usd(r.shipper_rate)}</span> },
    { header: 'Margin', render: r => <span className="font-medium text-green-600">{fmt.usd(r.brokerage_fee)}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">My Loads</h1><p className="text-sm text-gray-500 mt-1">{loads.length} shipments</p></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><Plus size={16} /> Create Load</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map(s => (
          <button key={s || 'all'} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={loads} onRowClick={handleSelect} emptyMessage="No loads yet. Create your first load!" />
      </div>

      {/* Create Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create New Load" wide>
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
                {carriers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label><input type="date" value={form.pickup_date} onChange={e => setForm({...form, pickup_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label><input type="date" value={form.delivery_date} onChange={e => setForm({...form, delivery_date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
              <select value={form.equipment_type} onChange={e => setForm({...form, equipment_type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option>Dry Van</option><option>Reefer</option><option>Flatbed</option><option>Step Deck</option>
              </select>
            </div>
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create Load</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Load ${selected.load_number}` : ''} wide>
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {['booked','dispatched','in_transit','delivered','invoiced','paid'].map((s, i) => {
                const currentIdx = ['booked','dispatched','in_transit','delivered','invoiced','paid'].indexOf(selected.status);
                return (
                  <div key={s} className="flex items-center gap-1">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${i <= currentIdx ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    {i < 5 && <ArrowRight size={12} className="text-gray-300 shrink-0" />}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center"><div className="text-xs text-blue-600 mb-1">Shipper Rate</div><div className="text-lg font-bold text-blue-700">{fmt.usd(selected.shipper_rate)}</div></div>
              <div className="bg-amber-50 rounded-lg p-4 text-center"><div className="text-xs text-amber-600 mb-1">Carrier Rate</div><div className="text-lg font-bold text-amber-700">{fmt.usd(selected.carrier_rate)}</div></div>
              <div className="bg-green-50 rounded-lg p-4 text-center"><div className="text-xs text-green-600 mb-1">Margin</div><div className="text-lg font-bold text-green-700">{fmt.usd(selected.brokerage_fee)}</div></div>
            </div>
            {selected.commission && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-800">My Commission: <span className="text-lg">{fmt.usd(selected.commission.commission_amount)}</span></div>
                <div className="text-xs text-purple-600 mt-1">{fmt.pct(selected.commission.commission_rate)} of {fmt.usd(selected.commission.brokerage_fee)}{selected.commission.cap_applied ? ' (capped)' : ''}</div>
              </div>
            )}
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
