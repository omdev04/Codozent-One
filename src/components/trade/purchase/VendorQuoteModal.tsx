import React, { useState } from 'react';
import { X, Award, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RFQ, RFQQuote } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface VendorQuoteModalProps {
  rfq: RFQ | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VendorQuoteModal: React.FC<VendorQuoteModalProps> = ({
  rfq,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { suppliers, addQuoteToRFQ } = useERP();

  const [supplierId, setSupplierId] = useState('');
  const [basicRate, setBasicRate] = useState<number>(1850);
  const [gstRate, setGstRate] = useState<number>(18);
  const [freightAmount, setFreightAmount] = useState<number>(1200);
  const [deliveryDays, setDeliveryDays] = useState<number>(3);
  const [paymentTerms, setPaymentTerms] = useState('30 Days Credit');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !rfq) return null;

  // Compute Landed Cost
  const primaryItem = rfq.items[0];
  const itemQty = primaryItem ? primaryItem.quantity : 1;
  const grossBasic = itemQty * basicRate;
  const gstAmount = grossBasic * (gstRate / 100);
  const totalLandedCost = grossBasic + gstAmount + freightAmount;

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
      const quotePayload: Omit<RFQQuote, 'id' | 'receivedAt'> = {
        supplierId,
        supplierName: supp?.name || 'Vendor',
        unitRate: basicRate,
        basicRate,
        gstRate,
        freightAmount,
        deliveryDays,
        leadTimeDays: deliveryDays,
        totalLandedCost,
        paymentTerms,
        notes
      };

      await addQuoteToRFQ(rfq.id, quotePayload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Vendor Quotation</h3>
              <p className="text-[11px] text-slate-500">Record supplier bid for tender {rfq.rfqNumber}</p>
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Supplier <span className="text-rose-500">*</span></label>
            <select
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            >
              <option value="">Choose vendor...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.paymentTerms || 'Standard'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Basic Unit Rate (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={basicRate}
                onChange={(e) => setBasicRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-semibold text-blue-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST Rate %</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
              >
                <option value="18">18% (Standard)</option>
                <option value="12">12%</option>
                <option value="28">28%</option>
                <option value="5">5%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Freight / Cartage (₹)</label>
              <input
                type="number"
                min="0"
                value={freightAmount}
                onChange={(e) => setFreightAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-right"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Time (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-right"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Landed Cost Breakdown Preview */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1">
            <div className="flex justify-between text-indigo-900">
              <span>Basic Value ({itemQty} items):</span>
              <span className="font-semibold">{formatIndianCurrency(grossBasic)}</span>
            </div>
            <div className="flex justify-between text-indigo-900">
              <span>GST ({gstRate}%):</span>
              <span className="font-semibold">{formatIndianCurrency(gstAmount)}</span>
            </div>
            <div className="flex justify-between text-indigo-900">
              <span>Freight:</span>
              <span className="font-semibold">{formatIndianCurrency(freightAmount)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-indigo-200 font-bold text-sm text-indigo-950">
              <span>Total Landed Cost:</span>
              <span>{formatIndianCurrency(totalLandedCost)}</span>
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Recording...' : 'Save Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
