import React from 'react';
import { 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight,
  Package,
  Layers,
  FileCheck2
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { SalesOrder } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface SalesDashboardProps {
  onNewOrder: () => void;
  onViewOrders: () => void;
  onSelectOrder: (order: SalesOrder) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  onNewOrder,
  onViewOrders,
  onSelectOrder
}) => {
  const { salesOrders, deliveryChallans, invoices } = useERP();

  const totalOrders = salesOrders.length;
  const totalValue = salesOrders.reduce((sum, so) => sum + (so.grandTotal || 0), 0);
  const inProduction = salesOrders.filter(so => so.status === 'in_production').length;
  const readyDispatch = salesOrders.filter(so => so.status === 'ready_for_dispatch').length;
  const completedOrders = salesOrders.filter(so => so.status === 'completed').length;
  
  const today = new Date().toISOString().split('T')[0];
  const delayedOrders = salesOrders.filter(so => 
    so.deliveryDate && 
    so.deliveryDate < today && 
    !['completed', 'cancelled', 'dispatched'].includes(so.status)
  ).length;

  const pendingAdvance = salesOrders.filter(so => 
    (so.advancePercentage || 0) > 0 && !so.advancePaid && so.status !== 'cancelled'
  ).length;

  const avgOrderValue = totalOrders > 0 ? Math.round(totalValue / totalOrders) : 0;
  const fulfillmentRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 100;

  const recentOrders = [...salesOrders]
    .sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: SalesOrder['status']) => {
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
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sales Operations & Execution</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor real-time made-to-order manufacturing sales, dispatch schedules, and fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onViewOrders}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            All Orders ({totalOrders})
          </button>
          <button
            onClick={onNewOrder}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Sales Order
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{formatIndianCurrency(totalValue, false)}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Across {totalOrders} manufacturing orders</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Production</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{inProduction}</span>
            <span className="text-xs font-medium text-amber-600">Active jobs</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Shop-floor fabrication</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ready for Dispatch</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{readyDispatch}</span>
            <span className="text-xs font-medium text-purple-600">QC Approved</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{deliveryChallans.length} Challans generated</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Delayed Deliveries</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${delayedOrders > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {delayedOrders > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${delayedOrders > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{delayedOrders}</span>
            <span className="text-xs text-slate-500">Orders overdue</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{fulfillmentRate}% On-time fulfillment</span>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-slate-600 font-medium">Avg Order Value:</span>
          <span className="font-semibold text-slate-900">{formatIndianCurrency(avgOrderValue, false)}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
          <span className="text-slate-600 font-medium">Pending Advance:</span>
          <span className="font-semibold text-amber-600">{pendingAdvance} Orders</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
          <span className="text-slate-600 font-medium">Sales Invoices:</span>
          <span className="font-semibold text-slate-900">{invoices.length} Invoices</span>
        </div>
      </div>

      {/* Recent Sales Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Recent Sales Orders</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest customer purchase commitments and manufacturing releases</p>
          </div>
          <button
            onClick={onViewOrders}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No sales orders created yet. Click "New Sales Order" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">SO Number</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Customer PO #</th>
                  <th className="px-4 py-3">Delivery Date</th>
                  <th className="px-4 py-3 text-right">Order Value</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((so) => (
                  <tr key={so.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {so.soNumber}
                      {so.quotationNumber && (
                        <span className="block text-xs font-normal text-slate-400">from {so.quotationNumber}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {so.customerName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {so.customerPoNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {so.deliveryDate ? (
                        <span className={so.deliveryDate < today && so.status !== 'completed' ? 'text-rose-600 font-medium' : ''}>
                          {so.deliveryDate}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatIndianCurrency(so.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${getStatusBadge(so.status)}`}>
                        {so.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectOrder(so)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Details
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
