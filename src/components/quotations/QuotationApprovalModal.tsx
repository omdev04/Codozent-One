import React, { useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { Quotation } from '../../types/erp';

interface QuotationApprovalModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comments?: string) => Promise<void>;
  onReject: (reason: string) => Promise<void>;
}

export const QuotationApprovalModal: React.FC<QuotationApprovalModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'reject' && !remarks.trim()) {
      alert('Please provide a mandatory reason for rejecting this quotation.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (decision === 'approve') {
        await onApprove(remarks);
      } else {
        await onReject(remarks);
      }
      onClose();
    } catch (err: any) {
      alert(`Approval workflow failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">Managerial Commercial Review</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Summary Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Quotation #:</span>
              <strong className="text-slate-900">{quotation.quotationNumber} ({quotation.revision})</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-800">{quotation.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Taxable / Grand Total:</span>
              <strong className="text-blue-700">₹{quotation.grandTotal.toLocaleString('en-IN')}</strong>
            </div>
            {quotation.discountAmount ? (
              <div className="flex justify-between items-center text-xs text-amber-700 font-semibold">
                <span>Discount Concession:</span>
                <span>₹{quotation.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            ) : null}
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              Review Action *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approve')}
                className={`py-2.5 px-3 rounded border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  decision === 'approve'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Quotation</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('reject')}
                className={`py-2.5 px-3 rounded border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  decision === 'reject'
                    ? 'border-red-600 bg-red-50 text-red-700 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Reject / Request Edits</span>
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              {decision === 'approve' ? 'Approval Remarks (Optional)' : 'Mandatory Rejection / Edit Reason *'}
            </label>
            <textarea
              required={decision === 'reject'}
              rows={3}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder={decision === 'approve' ? 'e.g. Commercial margin verified. Approved for dispatch.' : 'e.g. Discount exceeds 10% threshold. Margin is below acceptable floor.'}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-sans"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm ${
                decision === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {decision === 'approve' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{isSubmitting ? 'Processing...' : decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
