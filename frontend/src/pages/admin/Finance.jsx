import { useState, useEffect } from 'react';
import { api } from '../../api';
import { StatCard, DataTable, StatusBadge, fmt, Modal } from '../../components/Shared';
import { DollarSign, FileText, CreditCard, AlertTriangle, CheckCircle, Upload, Sparkles, FileCheck } from 'lucide-react';

export default function Finance() {
  const [overview, setOverview] = useState(null);
  const [tab, setTab] = useState('commissions');
  const [commissions, setCommissions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Document Upload & Audit State
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    load_id: '',
    document_type: 'invoice'
  });
  const [uploadResult, setUploadResult] = useState(null);
  
  const [showAudit, setShowAudit] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditForm, setAuditForm] = useState({
    load_id: ''
  });
  const [auditResult, setAuditResult] = useState(null);

  const loadData = () => {
    Promise.all([
      api.getFinanceOverview(),
      api.getCommissions(),
      api.getInvoices(),
    ]).then(([o, c, i]) => {
      setOverview(o); setCommissions(c); setInvoices(i);
    }).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const handleApproveComm = async (id) => {
    try { await api.approveCommission(id); loadData(); } catch (err) { alert(err.message); }
  };
  const handlePayComm = async (id) => {
    try { await api.payCommission(id); loadData(); } catch (err) { alert(err.message); }
  };
  const handleInvoiceStatus = async (id, status) => {
    try { await api.updateInvoiceStatus(id, status); loadData(); } catch (err) { alert(err.message); }
  };

  // AI Document Upload
  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert('Please select a file to upload');
      return;
    }
    
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('document', uploadForm.file);
      formData.append('load_id', uploadForm.load_id);
      formData.append('document_type', uploadForm.document_type);
      
      const result = await api.uploadDocument(formData);
      setUploadResult(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  // AI Financial Audit
  const handleAIAudit = async (e) => {
    e.preventDefault();
    if (!auditForm.load_id) {
      alert('Please enter a Load ID');
      return;
    }
    
    setAuditLoading(true);
    try {
      const result = await api.runAIAudit({ load_id: auditForm.load_id });
      setAuditResult(result);
    } catch (err) {
      alert(err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const commColumns = [
    { header: 'Load', render: r => <span className="font-mono text-xs font-medium">{r.load_number}</span> },
    { header: 'Agent', render: r => <div className="text-sm"><div className="font-medium">{r.agent_first} {r.agent_last}</div><div className="text-xs text-gray-400">{r.agent_code}</div></div> },
    { header: 'Route', render: r => <span className="text-sm">{r.origin_city}, {r.origin_state} &rarr; {r.destination_city}, {r.destination_state}</span> },
    { header: 'Brokerage', render: r => <span className="font-medium">{fmt.usd(r.brokerage_fee)}</span> },
    { header: 'Rate', render: r => <span>{fmt.pct(r.commission_rate)}{r.cap_applied ? ' (capped)' : ''}</span> },
    { header: 'Amount', render: r => <span className="font-semibold text-green-600">{fmt.usd(r.commission_amount)}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Actions', render: r => (
      <div className="flex gap-1">
        {r.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); handleApproveComm(r.id); }} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Approve</button>}
        {r.status === 'approved' && <button onClick={(e) => { e.stopPropagation(); handlePayComm(r.id); }} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Pay</button>}
      </div>
    )},
  ];

  const invoiceColumns = [
    { header: 'Invoice #', render: r => <span className="font-mono text-xs font-medium">{r.invoice_number}</span> },
    { header: 'Load', render: r => <span className="font-mono text-xs">{r.load_number}</span> },
    { header: 'Type', render: r => <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.type === 'shipper' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{r.type}</span> },
    { header: 'From', render: r => <span className="text-sm">{r.from_entity}</span> },
    { header: 'To', render: r => <span className="text-sm">{r.to_entity}</span> },
    { header: 'Amount', render: r => <span className="font-medium">{fmt.usd(r.amount)}</span> },
    { header: 'Due', render: r => <span className="text-sm">{fmt.date(r.due_date)}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Actions', render: r => (
      <div className="flex gap-1">
        {r.status === 'pending' && <button onClick={(e) => { e.stopPropagation(); handleInvoiceStatus(r.id, 'sent'); }} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Send</button>}
        {(r.status === 'sent' || r.status === 'pending') && <button onClick={(e) => { e.stopPropagation(); handleInvoiceStatus(r.id, 'paid'); }} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">Paid</button>}
      </div>
    )},
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1">Financial overview and transaction management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Upload size={16} /> Upload Document
          </button>
          <button onClick={() => setShowAudit(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
            <Sparkles size={16} /> AI Audit
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Brokerage" value={fmt.usd(overview?.total_brokerage_revenue)} color="green" />
        <StatCard icon={CreditCard} label="Company Net" value={fmt.usd(overview?.company_net_revenue)} sub="After commissions" color="blue" />
        <StatCard icon={FileText} label="Pending Invoices" value={overview?.pending_invoices || 0} color="amber" />
        <StatCard icon={AlertTriangle} label="Pending Commissions" value={fmt.usd(overview?.pending_commissions)} color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('commissions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'commissions' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Commissions ({commissions.length})
        </button>
        <button onClick={() => setTab('invoices')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'invoices' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
          Invoices ({invoices.length})
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {tab === 'commissions' ? (
          <DataTable columns={commColumns} data={commissions} emptyMessage="No commissions found" />
        ) : (
          <DataTable columns={invoiceColumns} data={invoices} emptyMessage="No invoices found" />
        )}
      </div>
      
      {/* Document Upload Modal */}
      <Modal open={showUpload} onClose={() => { setShowUpload(false); setUploadResult(null); }} title="AI Document Upload" wide>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <FileCheck className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">AI-Powered Document Processing</h4>
                <p className="text-xs text-blue-700">Upload invoices, BOLs, PODs, or other documents. AI will extract data and link to loads automatically.</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleDocumentUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document File *</label>
              <input 
                type="file"
                required
                accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Supported: PDF, JPG, PNG, Excel (Max 10MB)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Load ID (optional)</label>
              <input 
                value={uploadForm.load_id}
                onChange={e => setUploadForm({...uploadForm, load_id: e.target.value})}
                placeholder="Enter load ID to link document"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select 
                value={uploadForm.document_type}
                onChange={e => setUploadForm({...uploadForm, document_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="invoice">Invoice</option>
                <option value="bol">Bill of Lading (BOL)</option>
                <option value="pod">Proof of Delivery (POD)</option>
                <option value="rate_confirmation">Rate Confirmation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowUpload(false); setUploadResult(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={uploadLoading} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Upload size={16} /> {uploadLoading ? 'Uploading...' : 'Upload & Process'}
              </button>
            </div>
          </form>
          
          {uploadResult && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={16} />
                Document Processed Successfully
              </h4>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-2 text-sm">
                <p><span className="font-medium">Document Type:</span> {uploadResult.document_type}</p>
                <p><span className="font-medium">Extracted Amount:</span> {fmt.usd(uploadResult.extracted_amount)}</p>
                <p><span className="font-medium">Linked Load:</span> {uploadResult.load_id || 'Not linked'}</p>
                <p><span className="font-medium">Confidence:</span> {uploadResult.confidence}%</p>
                {uploadResult.invoice_created && <p className="text-green-700 font-medium">✓ Invoice automatically created</p>}
              </div>
            </div>
          )}
        </div>
      </Modal>
      
      {/* AI Audit Modal */}
      <Modal open={showAudit} onClose={() => { setShowAudit(false); setAuditResult(null); }} title="AI Financial Audit" wide>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="text-purple-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-purple-900 mb-1">AI Financial Audit Engine</h4>
                <p className="text-xs text-purple-700">AI will analyze all financial records for a load, detect discrepancies, and validate accuracy.</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleAIAudit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Load ID *</label>
              <input 
                required
                value={auditForm.load_id}
                onChange={e => setAuditForm({...auditForm, load_id: e.target.value})}
                placeholder="Enter load ID to audit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowAudit(false); setAuditResult(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={auditLoading} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                <Sparkles size={16} /> {auditLoading ? 'Auditing...' : 'Run AI Audit'}
              </button>
            </div>
          </form>
          
          {auditResult && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Audit Results</h4>
              
              {/* Overall Status */}
              <div className={`p-4 rounded-lg border mb-4 ${auditResult.has_discrepancies ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {auditResult.has_discrepancies ? (
                    <AlertTriangle className="text-amber-600" size={20} />
                  ) : (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                  <h5 className="font-semibold">
                    {auditResult.has_discrepancies ? 'Discrepancies Detected' : 'All Records Validated'}
                  </h5>
                </div>
                <p className="text-sm">{auditResult.summary}</p>
              </div>
              
              {/* Validation Results */}
              {auditResult.validations && auditResult.validations.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-semibold mb-2">Validations</h5>
                  <div className="space-y-2">
                    {auditResult.validations.map((validation, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border text-sm ${validation.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                          {validation.passed ? (
                            <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
                          ) : (
                            <AlertTriangle className="text-red-600 flex-shrink-0" size={16} />
                          )}
                          <div>
                            <p className="font-medium">{validation.check}</p>
                            <p className="text-xs text-gray-600">{validation.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Discrepancies */}
              {auditResult.discrepancies && auditResult.discrepancies.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold mb-2 text-amber-700">Discrepancies Found ({auditResult.discrepancies.length})</h5>
                  <div className="space-y-2">
                    {auditResult.discrepancies.map((disc, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm">
                        <p className="font-medium text-amber-900">{disc.issue}</p>
                        <p className="text-xs text-amber-700 mt-1">{disc.description}</p>
                        <p className="text-xs font-medium mt-1">Expected: {fmt.usd(disc.expected)} | Found: {fmt.usd(disc.actual)} | Difference: {fmt.usd(disc.difference)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Recommendations */}
              {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">AI Recommendations</h5>
                  <ul className="space-y-1 text-sm text-blue-800">
                    {auditResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
