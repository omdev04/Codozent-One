import React, { useState } from 'react';
import { 
  Award, 
  Plus, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Truck, 
  Clock, 
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RFQ, RFQQuote, PurchaseOrder } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';
import { VendorQuoteModal } from './VendorQuoteModal';

interface VendorComparisonMatrixProps {
  rfq: RFQ | null;
  isOpen: boolean;
  onClose: () => void;
  onAwardSuccess: (po: PurchaseOrder) => void;
}

export const VendorComparisonMatrix: React.FC<VendorComparisonMatrixProps> = ({
  rfq,
  isOpen,
  onClose,
  onAwardSuccess
}) => {
  const { awardRFQ } = useERP();
  const [isAddQuoteOpen, setIsAddQuoteOpen] = useState(false);
  const [selectedQuoteForAward, setSelectedQuoteForAward] = useState<RFQQuote | null>(null);
  const [awardReason, setAwardReason] = useState('Lowest Landed Cost (L1) with acceptable delivery timeline');
  const [isAwarding, setIsAwarding] = useState(false);

  if (!isOpen || !rfq) return null;

  const quotes = rfq.quotes || [];
  // Sort quotes by total landed cost to determine L1, L2, L3
  const sortedQuotes = [...quotes].sort((a, b) => a.totalLandedCost - b.totalLandedCost);

  const handleConfirmAward = async () => {
    if (!selectedQuoteForAward) return;
    setIsAwarding(true);
    try {
      const res = await awardRFQ(rfq.id, selectedQuoteForAward.id);
      onAwardSuccess(res.po);
      setSelectedQuoteForAward(null);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to award PO');
    } finally {
      setIsAwarding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Vendor Quotations Comparison Matrix — {rfq.rfqNumber}
              </h3>
              <p className="text-[11px] text-slate-500">
                Side-by-side evaluation of rates, GST, freight, landed cost, and lead times.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddQuoteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vendor Quote
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Requirements info banner */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 text-xs flex justify-between items-center">
          <div>
            <span className="font-semibold text-slate-700">Tender Requirements: </span>
            <span className="text-slate-600">
              {rfq.items.map(i => `${i.itemName} (Qty: ${i.quantity} ${i.uom})`).join(', ')}
            </span>
          </div>
          <div className="text-slate-500">
            Target Delivery: <span className="font-medium text-slate-800">{rfq.targetDeliveryDate || 'Standard'}</span>
          </div>
        </div>

        {/* Matrix Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {sortedQuotes.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No vendor quotations recorded yet for this tender. Click "Add Vendor Quote" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Rank</th>
                    <th className="px-4 py-2.5">Supplier Name</th>
                    <th className="px-3 py-2.5 text-right">Basic Rate</th>
                    <th className="px-3 py-2.5 text-right">GST %</th>
                    <th className="px-3 py-2.5 text-right">Freight</th>
                    <th className="px-4 py-2.5 text-right font-bold">Total Landed Cost</th>
                    <th className="px-3 py-2.5 text-center">Lead Time</th>
                    <th className="px-3 py-2.5">Payment Terms</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedQuotes.map((q, idx) => {
                    const isL1 = idx === 0;
                    return (
                      <tr key={q.id} className={`hover:bg-slate-50/75 transition-colors ${isL1 ? 'bg-emerald-50/30' : ''}`}>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isL1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            L{idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {q.supplierName}
                          {isL1 && (
                            <span className="block text-[10px] text-emerald-600 font-medium">Lowest Landed Bid</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-700">
                          {formatIndianCurrency(q.unitRate, false)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">
                          {q.gstRate || 18}%
                        </td>
                        <td className="px-3 py-3 text-right text-slate-600">
                          {formatIndianCurrency(q.freightAmount, false)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                          {formatIndianCurrency(q.totalLandedCost)}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-700">
                          {q.deliveryDays} Days
                        </td>
                        <td className="px-3 py-3 text-slate-600">
                          {q.paymentTerms || '30 Days'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => setSelectedQuoteForAward(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors"
                          >
                            Award PO <ArrowRight className="w-3 h-3" />
                          </button>
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

      {/* Award Justification Confirmation Modal */}
      {selectedQuoteForAward && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">
              Award Purchase Order
            </h4>
            <p className="text-slate-500">
              Supplier: <span className="font-semibold text-slate-900">{selectedQuoteForAward.supplierName}</span>
              <br />
              Total Landed Cost: <span className="font-bold text-emerald-700">{formatIndianCurrency(selectedQuoteForAward.totalLandedCost)}</span>
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commercial Award Justification</label>
              <textarea
                rows={3}
                value={awardReason}
                onChange={(e) => setAwardReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedQuoteForAward(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAward}
                disabled={isAwarding}
                className="px-4 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
              >
                {isAwarding ? 'Generating PO...' : 'Confirm & Create PO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Quote Sub-Modal */}
      <VendorQuoteModal
        rfq={rfq}
        isOpen={isAddQuoteOpen}
        onClose={() => setIsAddQuoteOpen(false)}
        onSuccess={() => setIsAddQuoteOpen(false)}
      />
    </div>
  );
};
