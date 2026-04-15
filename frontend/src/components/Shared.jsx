import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'} w-full max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-130px)]">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    slate: 'bg-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-700',
    blacklisted: 'bg-red-100 text-red-700',
    quoted: 'bg-gray-100 text-gray-600',
    booked: 'bg-blue-100 text-blue-700',
    dispatched: 'bg-cyan-100 text-cyan-700',
    in_transit: 'bg-amber-100 text-amber-700',
    delivered: 'bg-green-100 text-green-700',
    invoiced: 'bg-purple-100 text-purple-700',
    paid: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    pending: 'bg-amber-100 text-amber-700',
    sent: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    approved: 'bg-green-100 text-green-700',
    standard: 'bg-gray-100 text-gray-600',
    premium: 'bg-blue-100 text-blue-700',
    enterprise: 'bg-purple-100 text-purple-700',
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    fair: 'bg-amber-100 text-amber-700',
    poor: 'bg-red-100 text-red-700',
  };
  const label = status?.replace(/_/g, ' ') || 'N/A';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

export function DataTable({ columns, data, onRowClick, emptyMessage = 'No data found' }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-gray-400">{emptyMessage}</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col, i) => (
              <th key={i} className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri} onClick={() => onRowClick?.(row)}
              className={`border-b border-gray-50 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}>
              {columns.map((col, ci) => (
                <td key={ci} className="px-4 py-3 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const fmt = {
  usd: (v) => {
    if (v == null || isNaN(v)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  },
  pct: (v) => `${(v * 100).toFixed(0)}%`,
  num: (v) => new Intl.NumberFormat('en-US').format(v || 0),
  date: (v) => v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-',
};
