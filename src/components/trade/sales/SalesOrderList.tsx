import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Printer, 
  Eye, 
  Truck, 
  CreditCard, 
  Ban, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { SalesOrder, SalesOrderStatus } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface SalesOrderListProps {
  onNewOrder: () => void;
  onSelectOrder: (order: SalesOrder) => void;
  onPrintOrder: (order: SalesOrder) => void;
  onDispatchOrder: (order: SalesOrder) => void;
  onAdvancePayment: (order: SalesOrder) => void;
  onCancelOrder: (order: SalesOrder) => void;
}

export const SalesOrderList: React.FC<SalesOrderListProps> = ({
  onNewOrder,
  onSelectOrder,
  onPrintOrder,
  onDispatchOrder,
  onAdvancePayment,
  onCancelOrder
}) => {
  const { salesOrders, updateSalesOrderStatus } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return salesOrders.filter(so => {
      const matchesSearch = 
        so.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        so.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.customerPoNumber && so.customerPoNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || so.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [salesOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: SalesOrderStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in_production':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ready_for_dispatch':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'dispatched':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'on_hold':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExportCSV = () => {
    const headers = ['SO Number', 'Customer', 'Customer PO', 'Order Date', 'Delivery Date', 'Items', 'Total Value', 'Status', 'Advance Paid'];
    const rows = filteredOrders.map(o => [
      o.soNumber,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${(o.customerPoNumber || '').replace(/"/g, '""')}"`,
      o.orderDate,
      o.deliveryDate || '',
      o.items.length,
      o.grandTotal,
      o.status,
      o.advancePaid ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusOptions: { label: string; value: string; count: number }[] = [
    { label: 'All Orders', value: 'all', count: salesOrders.length },
    { label: 'Confirmed', value: 'confirmed', count: salesOrders.filter(o => o.status === 'confirmed').length },
    { label: 'In Production', value: 'in_production', count: salesOrders.filter(o => o.status === 'in_production').length },
    { label: 'Ready for Dispatch', value: 'ready_for_dispatch', count: salesOrders.filter(o => o.status === 'ready_for_dispatch').length },
    { label: 'Dispatched', value: 'dispatched', count: salesOrders.filter(o => o.status === 'dispatched' || o.status === 'completed').length },
    { label: 'Cancelled', value: 'cancelled', count: salesOrders.filter(o => o.status === 'cancelled').length }
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SO number, customer name, PO ref..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={onNewOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Sales Order
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusOptions.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-sm'
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

      {/* High Density Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No sales orders match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order Details</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Customer PO</th>
                  <th className="px-4 py-3">Delivery Date</th>
                  <th className="px-4 py-3">Advance Status</th>
                  <th className="px-4 py-3 text-right">Order Value</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(so => {
                  const today = new Date().toISOString().split('T')[0];
                  const isDelayed = so.deliveryDate && so.deliveryDate < today && !['completed', 'cancelled', 'dispatched'].includes(so.status);

                  return (
                    <tr key={so.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{so.soNumber}</div>
                        <div className="text-xs text-slate-400">
                          {so.orderDate} • {so.items.length} {so.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{so.customerName}</div>
                        {so.contactPerson && <div className="text-xs text-slate-400">{so.contactPerson}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {so.customerPoNumber ? (
                          <div>
                            <span className="font-mono text-xs font-medium text-slate-700">{so.customerPoNumber}</span>
                            {so.customerPoDate && <div className="text-[11px] text-slate-400">dt. {so.customerPoDate}</div>}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Direct / verbal</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {so.deliveryDate ? (
                          <div className={isDelayed ? 'text-rose-600 font-semibold flex items-center gap-1 text-xs' : 'text-slate-600 text-xs'}>
                            {isDelayed && <Clock className="w-3.5 h-3.5" />}
                            {so.deliveryDate}
                            {isDelayed && <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-1 rounded">Overdue</span>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {(so.advancePercentage || 0) > 0 ? (
                          so.advancePaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {so.advancePercentage}% Paid
                            </span>
                          ) : (
                            <button
                              onClick={() => onAdvancePayment(so)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pending ({so.advancePercentage}%)
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-slate-400">Net Credit</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-slate-900">{formatIndianCurrency(so.grandTotal)}</div>
                        <div className="text-[11px] text-slate-400">Tax incl.</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${getStatusBadge(so.status)}`}>
                          {so.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectOrder(so)}
                            title="View details"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintOrder(so)}
                            title="Print A4 Order Confirmation"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          
                          {/* Contextual Action Button */}
                          {so.status === 'confirmed' && (
                            <button
                              onClick={() => updateSalesOrderStatus(so.id, 'in_production')}
                              title="Release to Shopfloor"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                          )}

                          {['confirmed', 'in_production', 'ready_for_dispatch'].includes(so.status) && (
                            <button
                              onClick={() => onDispatchOrder(so)}
                              title="Create Dispatch Challan"
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}

                          {so.status !== 'cancelled' && so.status !== 'completed' && (
                            <button
                              onClick={() => onCancelOrder(so)}
                              title="Cancel Order"
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
