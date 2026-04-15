import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Modal, DataTable, StatusBadge, fmt } from '../../components/Shared';
import { Plus, Search, Building2, Truck } from 'lucide-react';

export default function MyClients() {
  const [tab, setTab] = useState('shippers');
  const [shippers, setShippers] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(null);
  const [form, setForm] = useState({});

  const loadData = () => {
    Promise.all([api.getShippers(), api.getCarriers()])
      .then(([s, c]) => { setShippers(s); setCarriers(c); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const handleCreateShipper = async (e) => {
    e.preventDefault();
    try { await api.createShipper(form); setShowAdd(null); setForm({}); loadData(); }
    catch (err) { alert(err.message); }
  };

  const handleCreateCarrier = async (e) => {
    e.preventDefault();
    try { await api.createCarrier(form); setShowAdd(null); setForm({}); loadData(); }
    catch (err) { alert(err.message); }
  };

  const shipperCols = [
    { header: 'Company', render: r => <div><div className="font-medium text-gray-900">{r.company_name}</div><div className="text-xs text-gray-400">{r.contact_name}</div></div> },
    { header: 'Contact', render: r => <div className="text-xs"><div>{r.email || '-'}</div><div className="text-gray-400">{r.phone || '-'}</div></div> },
    { header: 'Location', render: r => <span className="text-sm">{r.city ? `${r.city}, ${r.state}` : '-'}</span> },
    { header: 'Category', render: r => <StatusBadge status={r.category} /> },
    { header: 'Loads', render: r => r.total_loads || 0 },
    { header: 'Revenue', render: r => <span className="font-medium text-green-600">{fmt.usd(r.total_revenue)}</span> },
  ];

  const carrierCols = [
    { header: 'Company', render: r => <div><div className="font-medium text-gray-900">{r.company_name}</div><div className="text-xs text-gray-400">{r.contact_name}</div></div> },
    { header: 'MC / DOT', render: r => <div className="text-xs font-mono"><div>{r.mc_number || '-'}</div><div className="text-gray-400">{r.dot_number || '-'}</div></div> },
    { header: 'Equipment', render: r => <span className="text-sm">{r.equipment_types || '-'}</span> },
    { header: 'Rating', render: r => <span className="text-amber-500">{'★'.repeat(Math.round(r.rating || 0))} <span className="text-gray-400 text-xs">{Number(r.rating || 0).toFixed(1)}</span></span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Loads', render: r => r.total_loads || 0 },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">My Clients</h1><p className="text-sm text-gray-500 mt-1">{shippers.length} shippers, {carriers.length} carriers</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAdd('shipper'); setForm({ company_name: '', contact_name: '', email: '', phone: '', city: '', state: '', zip: '', category: 'standard' }); }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><Building2 size={14} /> Add Shipper</button>
          <button onClick={() => { setShowAdd('carrier'); setForm({ company_name: '', contact_name: '', mc_number: '', dot_number: '', email: '', phone: '', equipment_types: '' }); }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800"><Truck size={14} /> Add Carrier</button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('shippers')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'shippers' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Shippers ({shippers.length})
        </button>
        <button onClick={() => setTab('carriers')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'carriers' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Carriers ({carriers.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tab === 'shippers' ? (
          <DataTable columns={shipperCols} data={shippers} emptyMessage="No shippers yet. Add your first shipper client!" />
        ) : (
          <DataTable columns={carrierCols} data={carriers} emptyMessage="No carriers yet. Add your first carrier!" />
        )}
      </div>

      {/* Add Shipper Modal */}
      <Modal open={showAdd === 'shipper'} onClose={() => setShowAdd(null)} title="Add New Shipper">
        <form onSubmit={handleCreateShipper} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input required value={form.company_name || ''} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label><input required value={form.contact_name || ''} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">State</label><input value={form.state || ''} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category || 'standard'} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="standard">Standard</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create</button>
          </div>
        </form>
      </Modal>

      {/* Add Carrier Modal */}
      <Modal open={showAdd === 'carrier'} onClose={() => setShowAdd(null)} title="Add New Carrier">
        <form onSubmit={handleCreateCarrier} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input required value={form.company_name || ''} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label><input required value={form.contact_name || ''} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label><input value={form.mc_number || ''} onChange={e => setForm({...form, mc_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label><input value={form.dot_number || ''} onChange={e => setForm({...form, dot_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Equipment Types</label><input value={form.equipment_types || ''} onChange={e => setForm({...form, equipment_types: e.target.value})} placeholder="Dry Van, Reefer, Flatbed" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
