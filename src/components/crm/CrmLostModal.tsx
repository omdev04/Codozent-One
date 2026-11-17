import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { CrmLead } from '../../types/erp';

interface CrmLostModalProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmLost: (leadId: string, reason: string, notes: string) => Promise<void>;
}

const LOSS_REASONS = [
  'Price / Quote too high (Competitor cheaper)',
  'Technical specification or drawing mismatch',
  'Capacity / Machine delivery timeline unachievable',
  'Client budget canceled / Project shelved',
  'Strict credit/payment terms disagreement',
  'Quality / Certification prerequisite missing',
  'Client unresponsive after repeated follow-ups',
  'Other commercial / business reason'
];

export const CrmLostModal: React.FC<CrmLostModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConfirmLost
}) => {
  const [reason, setReason] = useState(LOSS_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await onConfirmLost(lead.id, reason, notes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-red-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-slate-900">Mark Lead as Lost</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1">
            <div className="font-semibold text-slate-800">
              {lead.companyName || lead.contactName}
            </div>
            <div className="text-slate-500">
              Lead #{lead.leadNumber} · Value: ₹{lead.dealValue.toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Loss Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-blue-600"
            >
              {LOSS_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Feedback for Manufacturing Audit
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client negotiated target price of ₹420/pc, competitor offered ₹395 with 60 days credit."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Mark Lost'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
