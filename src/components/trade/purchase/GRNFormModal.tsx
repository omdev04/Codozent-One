import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseOrder, GoodsReceiptNote } from '../../../types/erp';

interface GRNFormModalProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (grn: GoodsReceiptNote) => void;
}

export const GRNFormModal: React.FC<GRNFormModalProps> = ({
  po,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { purchaseOrders, warehouses, createGRN } = useERP();

  const [selectedPoId, setSelectedPoId] = useState(po?.id || '');
  const [warehouseId, setWarehouseId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('INV-SUPP-9021');
  const [deliveryChallanNo, setDeliveryChallanNo] = useState('DC-SUPP-4401');
  const [vehicleNumber, setVehicleNumber] = useState('MH 14 EM 2291');
  const [batchNumber, setBatchNumber] = useState(`LOT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [receiptLines, setReceiptLines] = useState<Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    orderedQty: number;
    previouslyReceivedQty: number;
    receivingQty: number;
    acceptedQty: number;
    rejectedQty: number;
    rejectionReason: string;
  }>>([]);

  // Sync when PO changes
  useEffect(() => {
    const targetPO = po || purchaseOrders.find(p => p.id === selectedPoId);
    if (targetPO) {
      setSelectedPoId(targetPO.id);
      setReceiptLines(targetPO.items.map(itm => {
        const remaining = Math.max(0, itm.quantity - (itm.receivedQuantity || 0));
        return {
          itemId: itm.itemId,
          itemCode: itm.itemCode,
          itemName: itm.itemName,
          orderedQty: itm.quantity,
          previouslyReceivedQty: itm.receivedQuantity || 0,
          receivingQty: remaining,
          acceptedQty: remaining,
          rejectedQty: 0,
          rejectionReason: ''
        };
      }));
    }
  }, [po, selectedPoId, purchaseOrders]);

  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !warehouseId) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouses, warehouseId]);

  if (!isOpen) return null;

  const currentPO = po || purchaseOrders.find(p => p.id === selectedPoId);
  const eligiblePOs = purchaseOrders.filter(p => ['ordered', 'partially_received', 'sent_to_vendor'].includes(p.status));

  const handleLineChange = (index: number, field: string, val: any) => {
    setReceiptLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };

      if (field === 'receivingQty') {
        const rec = Number(val) || 0;
        updated[index].acceptedQty = rec;
        updated[index].rejectedQty = 0;
      } else if (field === 'acceptedQty') {
        const acc = Number(val) || 0;
        const total = updated[index].receivingQty || 0;
        updated[index].rejectedQty = Math.max(0, total - acc);
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPO) {
      setErrorMessage('Please select a purchase order.');
      return;
    }
    if (receiptLines.some(l => l.receivingQty <= 0)) {
      setErrorMessage('Receiving quantity must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const itemsList = receiptLines.map(l => ({
        itemId: l.itemId,
        receivedQty: l.receivingQty,
        batchNo: batchNumber,
        acceptedQuantity: l.acceptedQty,
        rejectedQuantity: l.rejectedQty,
        rejectionReason: l.rejectionReason || undefined
      }));

      const created = await createGRN(
        currentPO.id,
        supplierInvoiceNo,
        warehouseId || 'wh-main',
        itemsList
      );
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate Goods Receipt Note');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Goods Receipt Note (GRN) Inwarding</h3>
              <p className="text-[11px] text-slate-500">Record physical material receipt and post directly to Central Stock Ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PO & Inward Details */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {!po && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Purchase Order <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={selectedPoId}
                    onChange={(e) => setSelectedPoId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="">Choose PO...</option>
                    {eligiblePOs.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.poNumber} - {p.supplierName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receiving Warehouse</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                  {warehouses.length === 0 && (
                    <option value="wh-main">Main Plant Stores</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supplier Invoice Number</label>
                <input
                  type="text"
                  required
                  value={supplierInvoiceNo}
                  onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle / Delivery Challan</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inward Batch / Lot #</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Receipt Lines Table */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Materials Verification & Inspection
            </span>

            <div className="space-y-2">
              {receiptLines.map((line, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{line.itemName}</span>
                      <span className="text-[11px] text-slate-400 font-mono ml-2">Code: {line.itemCode}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Ordered: <strong>{line.orderedQty}</strong> • Received Prev: <strong>{line.previouslyReceivedQty}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Now Receiving
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.receivingQty}
                        onChange={(e) => handleLineChange(idx, 'receivingQty', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-right font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 text-emerald-700">
                        Accepted Qty (Stocked)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={line.receivingQty}
                        value={line.acceptedQty}
                        onChange={(e) => handleLineChange(idx, 'acceptedQty', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-emerald-50/40 border border-emerald-300 rounded text-right font-bold text-emerald-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 text-rose-700">
                        Rejected Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={line.rejectedQty}
                        onChange={(e) => handleLineChange(idx, 'rejectedQty', Number(e.target.value))}
                        className="w-full px-2 py-1 bg-rose-50/40 border border-rose-300 rounded text-right font-bold text-rose-800"
                      />
                    </div>
                  </div>

                  {line.rejectedQty > 0 && (
                    <div>
                      <label className="block text-[10px] font-semibold text-rose-700 mb-0.5">
                        Rejection Reason (Quarantine log)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dimensions out of tolerance ±0.05 mm, surface pitting"
                        value={line.rejectionReason}
                        onChange={(e) => handleLineChange(idx, 'rejectionReason', e.target.value)}
                        className="w-full px-2 py-1 bg-rose-50/30 border border-rose-200 rounded text-xs text-rose-800"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Central Stock Ledger Alert */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-900 text-[11px]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              Accepted quantities will immediately increase warehouse inventory and create a verified stock ledger transaction (receipt_grn).
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Inwarding...' : 'Generate Verified GRN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
