import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  Printer, 
  Eye, 
  Package, 
  Ban, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface PurchaseOrderListProps {
  onNewPO: () => void;
  onSelectPO: (po: PurchaseOrder) => void;
  onPrintPO: (po: PurchaseOrder) => void;
  onReceiveGRN: (po: PurchaseOrder) => void;
  onCancelPO: (po: PurchaseOrder) => void;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  onNewPO,
  onSelectPO,
  onPrintPO,
  onReceiveGRN,
  onCancelPO
}) => {
  const { purchaseOrders } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesSearch = 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'ordered':
      case 'sent_to_vendor':
      case 'confirmed_by_vendor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'partially_received':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'fully_received':
      case 'received':
      case 'closed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExportCSV = () => {
    const headers = ['PO Number', 'Supplier', 'Order Date', 'Expected Date', 'Items', 'Total Value', 'Status', 'Tolerance %'];
    const rows = filteredPOs.map(p => [
      p.poNumber,
      `"${p.supplierName.replace(/"/g, '""')}"`,
      p.orderDate,
      p.expectedDate || '',
      p.items.length,
      p.grandTotal,
      p.status,
      p.tolerancePercentage || 5
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusOptions = [
    { label: 'All POs', value: 'all', count: purchaseOrders.length },
    { label: 'Ordered', value: 'ordered', count: purchaseOrders.filter(p => ['ordered', 'sent_to_vendor'].includes(p.status)).length },
    { label: 'Partially Received', value: 'partially_received', count: purchaseOrders.filter(p => p.status === 'partially_received').length },
    { label: 'Received / Closed', value: 'received', count: purchaseOrders.filter(p => ['received', 'fully_received', 'closed'].includes(p.status)).length },
    { label: 'Cancelled', value: 'cancelled', count: purchaseOrders.filter(p => p.status === 'cancelled').length }
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PO number, vendor name, material..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={onNewPO}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusOptions.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              statusFilter === tab.value ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPOs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No purchase orders match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Expected Date</th>
                  <th className="px-4 py-3 text-center">Tolerance</th>
                  <th className="px-4 py-3 text-right">PO Value</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.map((po) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = po.expectedDate && po.expectedDate < today && !['received', 'fully_received', 'closed', 'cancelled'].includes(po.status);

                  return (
                    <tr key={po.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 font-mono">{po.poNumber}</div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {po.orderDate} • {po.items.length} {po.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{po.supplierName}</div>
                        {po.requisitionNumber && (
                          <div className="text-[10px] text-slate-400">from {po.requisitionNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {po.expectedDate ? (
                          <div className={isOverdue ? 'text-rose-600 font-semibold flex items-center gap-1' : 'text-slate-600'}>
                            {isOverdue && <Clock className="w-3.5 h-3.5" />}
                            {po.expectedDate}
                            {isOverdue && <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-1 rounded">Overdue</span>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        ±{po.tolerancePercentage || 5}%
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatIndianCurrency(po.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${getStatusBadge(po.status)}`}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectPO(po)}
                            title="View details"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintPO(po)}
                            title="Print A4 Purchase Order"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Receive Inward GRN button */}
                          {['ordered', 'partially_received', 'sent_to_vendor'].includes(po.status) && (
                            <button
                              onClick={() => onReceiveGRN(po)}
                              title="Record Inward GRN"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Package className="w-4 h-4" />
                            </button>
                          )}

                          {po.status !== 'cancelled' && po.status !== 'closed' && (
                            <button
                              onClick={() => onCancelPO(po)}
                              title="Cancel PO"
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
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
