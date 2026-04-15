import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Modal, DataTable, StatusBadge, fmt } from '../../components/Shared';
import { Plus, Search, Building2, Sparkles, Mail, Target } from 'lucide-react';

export default function Shippers() {
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ company_name: '', contact_name: '', email: '', phone: '', city: '', state: '', zip: '', category: 'standard' });
  
  // AI Features State
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveredClients, setDiscoveredClients] = useState([]);
  const [discoveryForm, setDiscoveryForm] = useState({
    target_regions: '',
    industries: '',
    target_lanes: ''
  });
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachResult, setOutreachResult] = useState(null);

  const load = () => { api.getShippers(search ? `search=${search}` : '').then(setShippers).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleSearch = () => { setLoading(true); load(); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.createShipper(form); setShowAdd(false); setForm({ company_name: '', contact_name: '', email: '', phone: '', city: '', state: '', zip: '', category: 'standard' }); load(); }
    catch (err) { alert(err.message); }
  };

  const handleSelect = async (row) => {
    try { const detail = await api.getShipper(row.id); setSelected(detail); }
    catch (err) { console.error(err); }
  };

  // AI Client Discovery
  const handleDiscoverClients = async (e) => {
    e.preventDefault();
    setDiscoveryLoading(true);
    try {
      const params = {
        target_regions: discoveryForm.target_regions.split(',').map(s => s.trim()).filter(Boolean),
        industries: discoveryForm.industries.split(',').map(s => s.trim()).filter(Boolean),
        target_lanes: discoveryForm.target_lanes.split(',').map(s => s.trim()).filter(Boolean)
      };
      const result = await api.discoverClients(params);
      setDiscoveredClients(result.prospects || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  // AI Outreach Generation
  const handleGenerateOutreach = async (shipperId) => {
    setOutreachLoading(true);
    try {
      const result = await api.generateOutreach(shipperId);
      setOutreachResult(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setOutreachLoading(false);
    }
  };

  const columns = [
    { header: 'Company', render: r => <div><div className="font-medium text-gray-900">{r.company_name}</div><div className="text-xs text-gray-400">{r.contact_name}</div></div> },
    { header: 'Contact', render: r => <div className="text-xs"><div>{r.email}</div><div className="text-gray-400">{r.phone}</div></div> },
    { header: 'Location', render: r => <span className="text-sm">{r.city ? `${r.city}, ${r.state}` : '-'}</span> },
    { header: 'Category', render: r => <StatusBadge status={r.category} /> },
    { header: 'Agent', render: r => r.agent_first ? <span className="text-sm">{r.agent_first} {r.agent_last}</span> : <span className="text-gray-400 text-sm">-</span> },
    { header: 'Loads', render: r => r.total_loads || 0 },
    { header: 'Revenue', render: r => <span className="font-medium">{fmt.usd(r.total_revenue)}</span> },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Shippers</h1><p className="text-sm text-gray-500 mt-1">{shippers.length} shipper clients</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowDiscovery(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            <Sparkles size={16} /> AI Discover Clients
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Add Shipper
          </button>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search shippers..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Search</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={shippers} onRowClick={handleSelect} />
      </div>

      {/* Add Shipper Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Shipper">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
            <input required value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
              <input value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create Shipper</button>
          </div>
        </form>
      </Modal>

      {/* Shipper Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.company_name || ''} wide>
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Contact</div><div className="text-sm font-medium mt-0.5">{selected.contact_name}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Email</div><div className="text-sm mt-0.5">{selected.email || '-'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Phone</div><div className="text-sm mt-0.5">{selected.phone || '-'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Category</div><div className="mt-0.5"><StatusBadge status={selected.category} /></div></div>
            </div>
            {selected.loads?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Load History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selected.loads.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div><span className="font-mono text-xs">{l.load_number}</span> <span className="text-gray-400 mx-1">&middot;</span> {l.origin_city} &rarr; {l.destination_city}</div>
                      <div className="flex items-center gap-2"><span className="font-medium">{fmt.usd(l.shipper_rate)}</span><StatusBadge status={l.status} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* AI Outreach Section */}
            <div className="border-t pt-4">
              <button 
                onClick={() => handleGenerateOutreach(selected.id)}
                disabled={outreachLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                <Mail size={16} /> {outreachLoading ? 'Generating...' : 'Generate AI Outreach'}
              </button>
              
              {outreachResult && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">AI-Generated Outreach Strategy</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Subject:</span> {outreachResult.subject}</p>
                    <p><span className="font-medium">Email Body:</span></p>
                    <p className="text-gray-700 whitespace-pre-wrap">{outreachResult.email_body}</p>
                    <p><span className="font-medium">Follow-up:</span> {outreachResult.follow_up_days} days</p>
                    <p><span className="font-medium">Approach:</span> {outreachResult.approach}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
      
      {/* AI Client Discovery Modal */}
      <Modal open={showDiscovery} onClose={() => setShowDiscovery(false)} title="AI Client Discovery" wide>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Target className="text-purple-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-purple-900 mb-1">AI-Powered Client Discovery</h4>
                <p className="text-xs text-purple-700">Our AI will analyze market data and find high-potential shippers based on your criteria.</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleDiscoverClients} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Regions (comma-separated)</label>
              <input 
                value={discoveryForm.target_regions}
                onChange={e => setDiscoveryForm({...discoveryForm, target_regions: e.target.value})}
                placeholder="California, Texas, New York"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industries (comma-separated)</label>
              <input 
                value={discoveryForm.industries}
                onChange={e => setDiscoveryForm({...discoveryForm, industries: e.target.value})}
                placeholder="Manufacturing, Retail, Food & Beverage"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Lanes (comma-separated)</label>
              <input 
                value={discoveryForm.target_lanes}
                onChange={e => setDiscoveryForm({...discoveryForm, target_lanes: e.target.value})}
                placeholder="CA -> TX, TX -> NY, FL -> IL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowDiscovery(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={discoveryLoading} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                <Sparkles size={16} /> {discoveryLoading ? 'Discovering...' : 'Discover Clients'}
              </button>
            </div>
          </form>
          
          {discoveredClients.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Discovered Prospects ({discoveredClients.length})</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {discoveredClients.map((prospect, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">{prospect.company_name}</h5>
                        <p className="text-xs text-gray-500">{prospect.industry} &middot; {prospect.location}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Fit Score</div>
                        <div className={`text-lg font-bold ${prospect.fit_score >= 80 ? 'text-green-600' : prospect.fit_score >= 60 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {prospect.fit_score}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div><span className="text-gray-500">Est. Freight Spend:</span> <span className="font-medium">{fmt.usd(prospect.estimated_annual_freight_spend)}</span></div>
                      <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{prospect.contact_email || 'N/A'}</span></div>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{prospect.reasoning}</p>
                    <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Add to CRM</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
