import React, { useState } from 'react';
import { Package, Search, Plus, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { GoodsReceiptNote } from '../../../types/erp';

interface GRNListProps {
  onNewGRN: () => void;
}

export const GRNList: React.FC<GRNListProps> = ({ onNewGRN }) => {
  const { grns } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGRNs = grns.filter(g =>
    g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.supplierInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            placeholder="Search GRN #, PO #, supplier, invoice #..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={onNewGRN}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Inward GRN
        </button>
      </div>

      {/* GRN Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredGRNs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No Goods Receipt Notes inwarded yet. Receive materials against POs to update Central Stock Ledger.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">GRN Number</th>
                  <th className="px-4 py-3">Receipt Date</th>
                  <th className="px-4 py-3">PO Reference</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Invoice & Batch</th>
                  <th className="px-4 py-3">Items (Accepted / Rejected)</th>
                  <th className="px-4 py-3 text-center">Stock Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGRNs.map((grn) => {
                  const totalAccepted = grn.items.reduce((s, i) => s + (i.acceptedQuantity || i.receivedQuantity || 0), 0);
                  const totalRejected = grn.items.reduce((s, i) => s + (i.rejectedQuantity || 0), 0);

                  return (
                    <tr key={grn.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                        {grn.grnNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{grn.receiptDate}</td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{grn.poNumber}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{grn.supplierName}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>Inv: {grn.supplierInvoiceNo}</div>
                        {grn.items[0]?.batchNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">Lot: {grn.items[0].batchNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-semibold text-emerald-700">{totalAccepted} Accepted</span>
                        {totalRejected > 0 && (
                          <span className="font-semibold text-rose-600 ml-2">({totalRejected} Rejected)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          Stock Posted
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
