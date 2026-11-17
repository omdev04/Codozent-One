import React, { useState } from 'react';
import { X, Receipt, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseBill } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface PurchaseBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bill: PurchaseBill) => void;
}

export const PurchaseBillModal: React.FC<PurchaseBillModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { purchaseOrders, grns, suppliers, createPurchaseBill } = useERP();

  const [supplierId, setSupplierId] = useState('');
  const [selectedPoId, setSelectedPoId] = useState('');
  const [selectedGrnId, setSelectedGrnId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('INV-VEND-1102');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [taxableAmount, setTaxableAmount] = useState<number>(45000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePOChange = (poId: string) => {
    setSelectedPoId(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po) {
      setSupplierId(po.supplierId);
      setTaxableAmount(po.taxableAmount || po.subtotal);
      // Try to find matching GRN
      const grn = grns.find(g => g.purchaseOrderId === po.id || g.poNumber === po.poNumber);
      if (grn) setSelectedGrnId(grn.id);
    }
  };

  const gstAmount = taxableAmount * (gstRate / 100);
  const totalAmount = taxableAmount + gstAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMessage('Please select a supplier.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const supp = suppliers.find(s => s.id === supplierId);
      const po = purchaseOrders.find(p => p.id === selectedPoId);
      const grn = grns.find(g => g.id === selectedGrnId);

      const billPayload: any = {
        supplierInvoiceNumber,
        invoiceDate,
        supplierId,
        supplierName: supp?.name || 'Supplier',
        purchaseOrderId: po?.id || undefined,
        poNumber: po?.poNumber || undefined,
        grnId: grn?.id || undefined,
        grnNumber: grn?.grnNumber || undefined,
        taxableAmount,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2,
        igstAmount: 0,
        totalAmount,
        dueDate,
        paymentStatus: 'unpaid'
      };

      const created = await createPurchaseBill(billPayload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record purchase bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Vendor Purchase Bill</h3>
              <p className="text-[11px] text-slate-500">3-Way Match validation: PO ↔ GRN ↔ Vendor Invoice</p>
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

          {/* 3-Way Match Links */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Link Purchase Order (PO)</label>
              <select
                value={selectedPoId}
                onChange={(e) => handlePOChange(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              >
                <option value="">-- Direct Bill / Standalone --</option>
                {purchaseOrders.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.poNumber} - {p.supplierName} ({formatIndianCurrency(p.grandTotal)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Link Goods Receipt Note (GRN)</label>
              <select
                value={selectedGrnId}
                onChange={(e) => setSelectedGrnId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              >
                <option value="">-- Select Verified GRN --</option>
                {grns.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.grnNumber} (PO: {g.poNumber}) - {g.supplierName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendor Invoice # <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={supplierInvoiceNumber}
                onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Taxable Amount (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={taxableAmount}
                onChange={(e) => setTaxableAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-amber-700"
              />
            </div>
          </div>

          {/* Statutory Total */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-semibold text-slate-900">{formatIndianCurrency(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST ({gstRate}%):</span>
              <span className="font-semibold text-slate-900">{formatIndianCurrency(gstAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm text-slate-900">
              <span>Total Payable Bill:</span>
              <span className="text-blue-700">{formatIndianCurrency(totalAmount)}</span>
            </div>
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Record Purchase Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
