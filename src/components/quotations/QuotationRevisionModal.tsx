import React, { useState } from 'react';
import { History, GitBranch, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { Quotation } from '../../types/erp';

interface QuotationRevisionModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRevision: (reason: string, notes?: string) => Promise<void>;
}

export const QuotationRevisionModal: React.FC<QuotationRevisionModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onConfirmRevision
}) => {
  const currentRevNum = quotation.revisionNumber || 0;
  const nextRevLabel = `Rev ${currentRevNum + 1}`;

  const [reasonCategory, setReasonCategory] = useState<'price_negotiation' | 'technical_drawing_change' | 'quantity_change' | 'terms_amendment' | 'other'>('price_negotiation');
  const [reasonDetails, setReasonDetails] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonDetails.trim()) {
      alert('Please specify the detailed revision reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullReason = `[${reasonCategory.toUpperCase()}] ${reasonDetails}`;
      await onConfirmRevision(fullReason, internalNotes);
      onClose();
    } catch (err: any) {
      alert(`Revision creation failed: ${err.message}`);
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
            <GitBranch className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold">Create New Quotation Revision</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Info Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Creating <strong>{nextRevLabel}</strong> will freeze current version <strong>{quotation.revision}</strong> as <span className="font-semibold underline">Superseded</span>. Previous pricing, terms, and item snapshots will be locked for audit history.
            </div>
          </div>

          {/* Quotation Family Info */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Quotation Series:</span>
              <span className="font-bold text-slate-900 text-xs">{quotation.quotationNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Revision Transition:</span>
              <span className="font-bold text-blue-700 text-xs">{quotation.revision} → {nextRevLabel}</span>
            </div>
          </div>

          {/* Reason Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Revision Reason Classification *
            </label>
            <select
              value={reasonCategory}
              onChange={e => setReasonCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            >
              <option value="price_negotiation">Commercial / Price Negotiation (Discounts / Rates)</option>
              <option value="technical_drawing_change">Technical Drawing / Specification Change (CAD Rev)</option>
              <option value="quantity_change">Batch / Order Quantity Modification</option>
              <option value="terms_amendment">Payment / Delivery Terms Amendment</option>
              <option value="other">Other Customer Clarification</option>
            </select>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Revision Change Description *
            </label>
            <textarea
              required
              rows={3}
              value={reasonDetails}
              onChange={e => setReasonDetails(e.target.value)}
              placeholder="e.g. Client requested 5% volume concession for 5000 pcs and updated drawing tolerance to ±0.02mm."
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-sans"
            />
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Internal Manufacturing Note (Optional)
            </label>
            <input
              type="text"
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="e.g. Approved by plant director under MIDC cluster agreement."
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Generating...' : `Spawn ${nextRevLabel}`}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
