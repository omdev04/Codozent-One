import React, { useState } from 'react';
import { FileText, Search, Plus, Printer, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { Invoice } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface SalesInvoiceListProps {
  onSelectInvoice?: (invoice: Invoice) => void;
}

export const SalesInvoiceList: React.FC<SalesInvoiceListProps> = ({ onSelectInvoice }) => {
  const { invoices } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.partnerName && inv.partnerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPaymentStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'unpaid':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'partially_paid':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
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
            placeholder="Search invoice number, customer name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No sales invoices issued yet. Dispatched sales orders can be billed here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Taxable</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.partnerName}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatIndianCurrency(inv.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatIndianCurrency((inv.cgstAmount || 0) + (inv.sgstAmount || 0) + (inv.igstAmount || 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatIndianCurrency(inv.totalAmount || inv.grandTotal || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${getPaymentStatusBadge(inv.status)}`}>
                        {inv.status}
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
