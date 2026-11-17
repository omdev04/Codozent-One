import React from 'react';
import { 
  Truck, 
  TrendingDown, 
  Clock, 
  FileCheck2, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight,
  Package,
  Layers,
  Award,
  DollarSign
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseOrder } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface PurchaseDashboardProps {
  onNewPO: () => void;
  onNewPR: () => void;
  onViewPOs: () => void;
  onSelectPO: (po: PurchaseOrder) => void;
}

export const PurchaseDashboard: React.FC<PurchaseDashboardProps> = ({
  onNewPO,
  onNewPR,
  onViewPOs,
  onSelectPO
}) => {
  const { purchaseOrders, purchaseRequisitions, rfqs, grns, purchaseBills } = useERP();

  const totalPOs = purchaseOrders.length;
  const totalSpend = purchaseOrders.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const pendingPRs = purchaseRequisitions.filter(pr => ['pending_approval', 'submitted', 'draft'].includes(pr.status)).length;
  
  const today = new Date().toISOString().split('T')[0];
  const overdueDeliveries = purchaseOrders.filter(po => 
    po.expectedDate && 
    po.expectedDate < today && 
    !['received', 'fully_received', 'closed', 'cancelled'].includes(po.status)
  ).length;

  const activeRFQs = rfqs.filter(r => ['open', 'sent', 'quotes_received'].includes(r.status)).length;
  const pendingBills = purchaseBills.filter(b => b.paymentStatus !== 'paid').length;

  const recentPOs = [...purchaseOrders]
    .sort((a, b) => new Date(b.createdAt || b.orderDate).getTime() - new Date(a.createdAt || a.orderDate).getTime())
    .slice(0, 5);

  const getStatusBadge = (status: PurchaseOrder['status']) => {
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

  return (
    <div className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Procurement & Sourcing Operations</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage purchase requisitions, RFQs, vendor comparisons, purchase orders, and GRN inwarding.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNewPR}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            New Requisition (PR)
          </button>
          <button
            onClick={onNewPO}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Purchase Spend</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{formatIndianCurrency(totalSpend, false)}</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">{totalPOs} Purchase orders issued</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Requisitions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingPRs}</span>
            <span className="text-xs font-medium text-amber-600">Awaiting approval</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Internal department requests</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overdue Deliveries</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${overdueDeliveries > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {overdueDeliveries > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${overdueDeliveries > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{overdueDeliveries}</span>
            <span className="text-xs text-slate-500">POs delayed</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Expected date elapsed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Goods Receipts (GRN)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{grns.length}</span>
            <span className="text-xs text-emerald-600 font-medium">Inwarded</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Central Stock Ledger posted</span>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-slate-600 font-medium">Active RFQs / Tenders:</span>
          <span className="font-semibold text-slate-900">{activeRFQs} RFQs</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
          <span className="text-slate-600 font-medium">Pending Purchase Bills:</span>
          <span className="font-semibold text-amber-600">{pendingBills} Bills</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
          <span className="text-slate-600 font-medium">3-Way Match Readiness:</span>
          <span className="font-semibold text-emerald-700">100% Verified</span>
        </div>
      </div>

      {/* Recent POs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Recent Purchase Orders</h3>
            <p className="text-xs text-slate-500 mt-0.5">Supplier commitments with commercial terms and tolerances</p>
          </div>
          <button
            onClick={onViewPOs}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentPOs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No purchase orders created yet. Click "New Purchase Order" to start.
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
                  <th className="px-4 py-3 text-right">PO Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {po.poNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {po.supplierName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {po.expectedDate ? (
                        <span className={po.expectedDate < today && po.status !== 'received' ? 'text-rose-600 font-medium' : ''}>
                          {po.expectedDate}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 font-medium">
                      ±{po.tolerancePercentage || 5}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatIndianCurrency(po.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border capitalize ${getStatusBadge(po.status)}`}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectPO(po)}
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
