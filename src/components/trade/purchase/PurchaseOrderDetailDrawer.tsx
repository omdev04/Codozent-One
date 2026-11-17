import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Package, 
  Ban, 
  CheckCircle2, 
  Truck, 
  Calendar, 
  Building2, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface PurchaseOrderDetailDrawerProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (po: PurchaseOrder) => void;
  onReceiveGRN: (po: PurchaseOrder) => void;
  onCancel: (po: PurchaseOrder) => void;
}

export const PurchaseOrderDetailDrawer: React.FC<PurchaseOrderDetailDrawerProps> = ({
  po,
  isOpen,
  onClose,
  onPrint,
  onReceiveGRN,
  onCancel
}) => {
  const { grns } = useERP();
  const [activeTab, setActiveTab] = useState<'items' | 'commercial' | 'grns'>('items');

  if (!isOpen || !po) return null;

  const linkedGRNs = grns.filter(g => g.purchaseOrderId === po.id || g.poNumber === po.poNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 font-mono">{po.poNumber}</h3>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full border capitalize bg-blue-50 text-blue-700 border-blue-200">
                {po.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{po.supplierName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(po)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print A4 PO
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action strip */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span>Actions:</span>
          </div>
          <div className="flex items-center gap-2">
            {['ordered', 'partially_received', 'sent_to_vendor'].includes(po.status) && (
              <button
                onClick={() => onReceiveGRN(po)}
                className="inline-flex items-center gap-1 px-3 py-1 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              >
                <Package className="w-3.5 h-3.5" />
                Inward GRN
              </button>
            )}
            {po.status !== 'cancelled' && po.status !== 'closed' && (
              <button
                onClick={() => onCancel(po)}
                className="px-2.5 py-1 font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              >
                Cancel PO
              </button>
            )}
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex border-b border-slate-200 px-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-3 border-b-2 font-semibold transition-colors mr-6 ${
              activeTab === 'items' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Materials & Items ({po.items.length})
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`py-3 border-b-2 font-semibold transition-colors mr-6 ${
              activeTab === 'commercial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Commercial Terms & GST
          </button>
          <button
            onClick={() => setActiveTab('grns')}
            className={`py-3 border-b-2 font-semibold transition-colors ${
              activeTab === 'grns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Inward GRNs ({linkedGRNs.length})
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'items' && (
            <div className="space-y-3">
              {po.items.map((itm, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{itm.itemName}</div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">HSN: {itm.hsnSac || '7228'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-sm">{formatIndianCurrency(itm.totalAmount)}</div>
                      <div className="text-[11px] text-slate-400">
                        {itm.quantity} × {formatIndianCurrency(itm.unitPrice)} (+{itm.gstRate}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[10px]">Specifications</span>
                      <span className="text-slate-700 font-medium">{itm.specs || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[10px]">Received Qty</span>
                      <span className="text-slate-700 font-medium">{itm.receivedQuantity || 0} / {itm.quantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[10px]">Tolerance</span>
                      <span className="text-slate-700 font-medium">±{itm.tolerancePercentage || 5}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'commercial' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-600 text-[11px]">Commercial & GST Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-500 block">Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatIndianCurrency(po.subtotal)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total GST:</span>
                    <span className="font-semibold text-slate-900">
                      {formatIndianCurrency((po.cgstAmount || 0) + (po.sgstAmount || 0) + (po.igstAmount || 0))}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-blue-700 text-base">{formatIndianCurrency(po.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Delivery Godown</span>
                  <p className="text-slate-600">{po.deliveryGodown || 'Central Stores, Pune Plant'}</p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Payment & Freight Terms</span>
                  <p className="text-slate-600">{po.paymentTerms || '30 Days Net'}</p>
                  <p className="text-slate-500 mt-1">Freight: {po.freightTerms || 'Included'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'grns' && (
            <div className="space-y-3">
              {linkedGRNs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No inward GRNs recorded yet against this PO.
                </div>
              ) : (
                linkedGRNs.map((grn, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 font-mono">{grn.grnNumber}</div>
                      <div className="text-slate-500 text-[11px]">
                        Received: {grn.receiptDate} • Invoice: {grn.supplierInvoiceNo}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Stock Posted
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
