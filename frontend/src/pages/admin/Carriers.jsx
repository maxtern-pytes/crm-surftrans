import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Modal, DataTable, StatusBadge, fmt } from '../../components/Shared';
import { Plus, Search, Sparkles, Truck } from 'lucide-react';

export default function Carriers() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ company_name: '', contact_name: '', mc_number: '', dot_number: '', email: '', phone: '', city: '', state: '', equipment_types: '' });
  
  // AI Carrier Matching State
  const [showMatching, setShowMatching] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchedCarriers, setMatchedCarriers] = useState([]);
  const [matchingForm, setMatchingForm] = useState({
    origin_city: '',
    origin_state: '',
    destination_city: '',
    destination_state: '',
    equipment_type: '',
    weight: ''
  });

  const load = () => { api.getCarriers(search ? `search=${search}` : '').then(setCarriers).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await api.createCarrier(form); setShowAdd(false); setForm({ company_name: '', contact_name: '', mc_number: '', dot_number: '', email: '', phone: '', city: '', state: '', equipment_types: '' }); load(); }
    catch (err) { alert(err.message); }
  };

  const handleSelect = async (row) => {
    try { const detail = await api.getCarrier(row.id); setSelected(detail); } catch (err) { console.error(err); }
  };

  // AI Carrier Matching
  const handleMatchCarriers = async (e) => {
    e.preventDefault();
    setMatchingLoading(true);
    try {
      const params = {
        origin_city: matchingForm.origin_city,
        origin_state: matchingForm.origin_state,
        destination_city: matchingForm.destination_city,
        destination_state: matchingForm.destination_state,
        equipment_type: matchingForm.equipment_type,
        weight: parseInt(matchingForm.weight) || 0
      };
      const result = await api.matchCarriers(params);
      setMatchedCarriers(result.matches || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setMatchingLoading(false);
    }
  };

  const columns = [
    { header: 'Company', render: r => <div><div className="font-medium text-gray-900">{r.company_name}</div><div className="text-xs text-gray-400">{r.contact_name}</div></div> },
    { header: 'MC / DOT', render: r => <div className="text-xs font-mono"><div>{r.mc_number || '-'}</div><div className="text-gray-400">{r.dot_number || '-'}</div></div> },
    { header: 'Equipment', render: r => <span className="text-sm">{r.equipment_types || '-'}</span> },
    { header: 'Rating', render: r => (
      <div className="flex items-center gap-1">
        <span className="text-amber-500">{'★'.repeat(Math.round(r.rating || 0))}</span>
        <span className="text-xs text-gray-400">{Number(r.rating || 0).toFixed(1)}</span>
      </div>
    )},
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Loads', render: r => r.total_loads || 0 },
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Carriers</h1><p className="text-sm text-gray-500 mt-1">{carriers.length} registered carriers</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowMatching(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            <Sparkles size={16} /> AI Match Carriers
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus size={16} /> Add Carrier
          </button>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search carriers..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <DataTable columns={columns} data={carriers} onRowClick={handleSelect} />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Carrier">
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">MC Number</label><input value={form.mc_number} onChange={e => setForm({...form, mc_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">DOT Number</label><input value={form.dot_number} onChange={e => setForm({...form, dot_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Types</label>
            <input value={form.equipment_types} onChange={e => setForm({...form, equipment_types: e.target.value})} placeholder="Dry Van, Reefer, Flatbed" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create Carrier</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.company_name || ''} wide>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">MC Number</div><div className="text-sm font-mono mt-0.5">{selected.mc_number || '-'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">DOT Number</div><div className="text-sm font-mono mt-0.5">{selected.dot_number || '-'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Equipment</div><div className="text-sm mt-0.5">{selected.equipment_types || '-'}</div></div>
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Status</div><div className="mt-0.5"><StatusBadge status={selected.status} /></div></div>
            </div>
            {selected.loads?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Load History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selected.loads.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <div><span className="font-mono text-xs">{l.load_number}</span> <span className="text-gray-400 mx-1">&middot;</span> {l.origin_city} &rarr; {l.destination_city}</div>
                      <div className="flex items-center gap-2"><span className="font-medium">{fmt.usd(l.carrier_rate)}</span><StatusBadge status={l.status} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* AI Carrier Matching Modal */}
      <Modal open={showMatching} onClose={() => setShowMatching(false)} title="AI Carrier Matching" wide>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Truck className="text-purple-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-purple-900 mb-1">AI-Powered Carrier Matching</h4>
                <p className="text-xs text-purple-700">Our AI will find the best carriers for your load based on route, equipment, capacity, and reliability.</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleMatchCarriers} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin City *</label>
                <input 
                  required
                  value={matchingForm.origin_city}
                  onChange={e => setMatchingForm({...matchingForm, origin_city: e.target.value})}
                  placeholder="Los Angeles"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin State *</label>
                <input 
                  required
                  value={matchingForm.origin_state}
                  onChange={e => setMatchingForm({...matchingForm, origin_state: e.target.value})}
                  placeholder="CA"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination City *</label>
                <input 
                  required
                  value={matchingForm.destination_city}
                  onChange={e => setMatchingForm({...matchingForm, destination_city: e.target.value})}
                  placeholder="Houston"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination State *</label>
                <input 
                  required
                  value={matchingForm.destination_state}
                  onChange={e => setMatchingForm({...matchingForm, destination_state: e.target.value})}
                  placeholder="TX"
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type *</label>
                <select 
                  required
                  value={matchingForm.equipment_type}
                  onChange={e => setMatchingForm({...matchingForm, equipment_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select equipment</option>
                  <option value="Dry Van">Dry Van</option>
                  <option value="Reefer">Reefer</option>
                  <option value="Flatbed">Flatbed</option>
                  <option value="Step Deck">Step Deck</option>
                  <option value="Lowboy">Lowboy</option>
                  <option value="Hotshot">Hotshot</option>
                  <option value="Box Truck">Box Truck</option>
                  <option value="Tanker">Tanker</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs) *</label>
                <input 
                  required
                  type="number"
                  value={matchingForm.weight}
                  onChange={e => setMatchingForm({...matchingForm, weight: e.target.value})}
                  placeholder="40000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowMatching(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={matchingLoading} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                <Sparkles size={16} /> {matchingLoading ? 'Matching...' : 'Find Best Carriers'}
              </button>
            </div>
          </form>
          
          {matchedCarriers.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Matched Carriers ({matchedCarriers.length})</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {matchedCarriers.map((match, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-gray-900">{match.company_name}</h5>
                        <p className="text-xs text-gray-500">MC: {match.mc_number} &middot; {match.equipment_types}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Match Score</div>
                        <div className={`text-lg font-bold ${match.match_score >= 90 ? 'text-green-600' : match.match_score >= 75 ? 'text-amber-600' : 'text-gray-600'}`}>
                          {match.match_score}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div><span className="text-gray-500">Reliability:</span> <span className="font-medium">{match.reliability_score}%</span></div>
                      <div><span className="text-gray-500">Rating:</span> <span className="font-medium">{'★'.repeat(Math.round(match.rating || 0))} ({match.rating})</span></div>
                      <div><span className="text-gray-500">Location:</span> <span className="font-medium">{match.city}, {match.state}</span></div>
                      <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{match.email || match.phone || 'N/A'}</span></div>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{match.matching_reason}</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">View Details</button>
                      <button className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700">Assign Load</button>
                    </div>
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
