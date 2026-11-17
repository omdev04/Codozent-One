import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Truck, 
  CreditCard, 
  Ban, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Calendar, 
  Building2, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { SalesOrder, SalesOrderStatus } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface SalesOrderDetailDrawerProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (order: SalesOrder) => void;
  onDispatch: (order: SalesOrder) => void;
  onAdvancePayment: (order: SalesOrder) => void;
  onCancel: (order: SalesOrder) => void;
}

export const SalesOrderDetailDrawer: React.FC<SalesOrderDetailDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onPrint,
  onDispatch,
  onAdvancePayment,
  onCancel
}) => {
  const { updateSalesOrderStatus } = useERP();
  const [activeTab, setActiveTab] = useState<'items' | 'commercial' | 'history'>('items');

  if (!isOpen || !order) return null;

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
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{order.soNumber}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${getStatusBadge(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">{order.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(order)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print A4 PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Progression Bar */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>Status Transition:</span>
          </div>
          <div className="flex items-center gap-2">
            {order.status === 'confirmed' && (
              <button
                onClick={() => updateSalesOrderStatus(order.id, 'in_production')}
                className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
              >
                Release to Shopfloor
              </button>
            )}
            {order.status === 'in_production' && (
              <button
                onClick={() => updateSalesOrderStatus(order.id, 'ready_for_dispatch')}
                className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
              >
                Mark Ready for Dispatch
              </button>
            )}
            {['confirmed', 'in_production', 'ready_for_dispatch'].includes(order.status) && (
              <button
                onClick={() => onDispatch(order)}
                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
              >
                Dispatch Challan
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'completed' && (
              <button
                onClick={() => onCancel(order)}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs inside Drawer */}
        <div className="flex border-b border-slate-200 px-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-3 border-b-2 font-semibold transition-colors mr-6 ${
              activeTab === 'items'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Items & Technical Specs ({order.items.length})
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`py-3 border-b-2 font-semibold transition-colors mr-6 ${
              activeTab === 'commercial'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Commercial Terms & GST
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 font-semibold transition-colors ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Status History & Logs
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'items' && (
            <div className="space-y-4">
              {order.items.map((itm, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{itm.itemName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">Code: {itm.itemCode}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">{formatIndianCurrency(itm.totalAmount)}</div>
                      <div className="text-[11px] text-slate-400">
                        {itm.quantity} {itm.uom || 'Nos'} × {formatIndianCurrency(itm.unitPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Made-to-Order Specs Pill Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Drawing Reference</span>
                      <span className="font-medium text-slate-800">{itm.drawingRef || 'Standard'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Material Grade</span>
                      <span className="font-medium text-slate-800">{itm.materialGrade || '—'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tolerance</span>
                      <span className="font-medium text-slate-800">{itm.tolerance || '±0.05 mm'}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">HSN/SAC</span>
                      <span className="font-medium font-mono text-slate-800">{itm.hsnSacCode || '8483'}</span>
                    </div>
                  </div>

                  {itm.technicalSpecs && (
                    <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-700">Specs: </span>
                      {itm.technicalSpecs}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'commercial' && (
            <div className="space-y-4 text-xs">
              {/* Commercial Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-slate-600">Financial Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Gross Subtotal:</span>
                    <span className="font-semibold text-slate-900 text-sm">{formatIndianCurrency(order.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Taxable Value:</span>
                    <span className="font-semibold text-slate-900 text-sm">{formatIndianCurrency(order.taxableAmount || order.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CGST / SGST:</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {order.cgstAmount > 0 ? `${formatIndianCurrency(order.cgstAmount)} + ${formatIndianCurrency(order.sgstAmount)}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">IGST:</span>
                    <span className="font-semibold text-slate-900 text-sm">
                      {order.igstAmount > 0 ? formatIndianCurrency(order.igstAmount) : '—'}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-blue-700 text-base">{formatIndianCurrency(order.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Advance Terms Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-600">Advance Payment SOP</h4>
                <div className="flex items-center justify-between">
                  <span>Advance Condition:</span>
                  <span className="font-semibold text-slate-900">{order.advancePercentage || 0}% Advance</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Advance Value:</span>
                  <span className="font-bold text-amber-700">{formatIndianCurrency(order.advanceAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Status:</span>
                  {order.advancePaid ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Received {order.advanceUtrRef ? `(UTR: ${order.advanceUtrRef})` : ''}
                    </span>
                  ) : (
                    <button
                      onClick={() => onAdvancePayment(order)}
                      className="px-2.5 py-1 font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
                    >
                      Record Advance Received
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery & Addresses */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Billing Address</span>
                  <p className="text-slate-600 whitespace-pre-line">{order.billingAddress || order.customerName}</p>
                  {order.customerGstin && (
                    <p className="mt-1 font-mono text-[11px] text-slate-500">GSTIN: {order.customerGstin}</p>
                  )}
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Shipping Address</span>
                  <p className="text-slate-600 whitespace-pre-line">{order.shippingAddress || order.billingAddress || order.customerName}</p>
                  {order.deliveryTerms && (
                    <p className="mt-1 text-slate-500">Terms: {order.deliveryTerms}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Trail & Status Transitions</h4>
              {(!order.statusHistory || order.statusHistory.length === 0) ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  Order was confirmed on {order.orderDate} by {order.createdBy || 'Authorized User'}.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-3 before:w-0.5 before:bg-slate-200">
                  {order.statusHistory.map((sh, idx) => (
                    <div key={idx} className="relative pl-7 text-xs">
                      <div className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span className="capitalize">
                            {sh.fromStatus.replace(/_/g, ' ')} → {sh.toStatus.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] font-normal text-slate-400">
                            {new Date(sh.changedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-slate-500 mt-1">Updated by: {sh.changedBy}</div>
                        {sh.reason && (
                          <div className="mt-1 p-1.5 bg-white rounded border border-slate-200 text-slate-700 font-medium">
                            Remarks: {sh.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {order.cancellationReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  <span className="font-bold">Cancellation Reason: </span>
                  {order.cancellationReason}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
