import React, { useState } from 'react';
import { Tag, Search, Plus, Award, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RFQ } from '../../../types/erp';

interface RFQListProps {
  onNewRFQ: () => void;
  onOpenMatrix: (rfq: RFQ) => void;
}

export const RFQList: React.FC<RFQListProps> = ({ onNewRFQ, onOpenMatrix }) => {
  const { rfqs } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRFQs = rfqs.filter(r => 
    r.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: RFQ['status']) => {
    switch (status) {
      case 'awarded':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'quotes_received':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search RFQ number, item name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={onNewRFQ}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New RFQ Tender
        </button>
      </div>

      {/* RFQ Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredRFQs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No Request for Quotations (RFQs) published yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">RFQ Number</th>
                  <th className="px-4 py-3">Target Date</th>
                  <th className="px-4 py-3">Items & Requirements</th>
                  <th className="px-4 py-3 text-center">Quotes Received</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRFQs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {rfq.rfqNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{rfq.targetDeliveryDate || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {rfq.items.map(i => `${i.itemName} (${i.quantity} ${i.uom})`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-slate-800">
                        {rfq.quotes ? rfq.quotes.length : 0} Quotes
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${getStatusBadge(rfq.status)}`}>
                        {rfq.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onOpenMatrix(rfq)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Comparison Matrix
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
