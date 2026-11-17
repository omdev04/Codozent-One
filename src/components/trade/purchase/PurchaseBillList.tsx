import React, { useState } from 'react';
import { Receipt, Search, Plus, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseBill } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface PurchaseBillListProps {
  onNewBill: () => void;
}

export const PurchaseBillList: React.FC<PurchaseBillListProps> = ({ onNewBill }) => {
  const { purchaseBills } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBills = purchaseBills.filter(b =>
    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.supplierInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.poNumber && b.poNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: PurchaseBill['paymentStatus']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'partially_paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
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
            placeholder="Search bill #, invoice #, supplier, PO ref..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={onNewBill}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Purchase Bill
        </button>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No purchase bills recorded yet. Record bills against verified GRNs for 3-way matching.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Bill Number</th>
                  <th className="px-4 py-3">Supplier & Invoice</th>
                  <th className="px-4 py-3">3-Way Match References</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Bill Value</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {b.billNumber}
                      <span className="block text-[10px] text-slate-400 font-sans">{b.invoiceDate}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {b.supplierName}
                      <span className="block text-[11px] text-slate-500 font-mono">Inv: {b.supplierInvoiceNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          PO: {b.poNumber || 'Direct'}
                        </span>
                        {b.grnNumber && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] border border-emerald-200">
                            GRN: {b.grnNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{b.dueDate}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatIndianCurrency(b.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${getStatusBadge(b.paymentStatus)}`}>
                        {b.paymentStatus.replace(/_/g, ' ')}
                      </span>
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
