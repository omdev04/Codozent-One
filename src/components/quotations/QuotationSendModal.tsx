import React, { useState } from 'react';
import { Send, Mail, MessageSquare, Copy, Check, X, FileText, AlertCircle } from 'lucide-react';
import { Quotation } from '../../types/erp';

interface QuotationSendModalProps {
  quotation: Quotation;
  isOpen: boolean;
  onClose: () => void;
  onSend: (sentVia: 'email' | 'whatsapp' | 'manual', comments?: string) => Promise<void>;
}

export const QuotationSendModal: React.FC<QuotationSendModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onSend
}) => {
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'manual'>('email');
  const [recipientEmail, setRecipientEmail] = useState(quotation.email || '');
  const [recipientPhone, setRecipientPhone] = useState(quotation.phone || '');
  const [subject, setSubject] = useState(`Formal Quotation: ${quotation.quotationNumber} (${quotation.revision}) - ${quotation.customerName}`);
  const [message, setMessage] = useState(
    `Dear ${quotation.contactPerson || quotation.customerName},\n\nPlease find attached official quotation ${quotation.quotationNumber} (${quotation.revision}) amounting to ₹${quotation.grandTotal.toLocaleString('en-IN')} for your requirement.\n\nValidity: ${quotation.validUntil}.\n\nKindly review and let us know your confirmation to initiate production scheduling.\n\nWarm regards,\nSales Commercial Team`
  );
  const [isSending, setIsSending] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      if (channel === 'whatsapp' && recipientPhone) {
        // Open WhatsApp web with encoded message
        const text = encodeURIComponent(message);
        const cleanPhone = recipientPhone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      }
      await onSend(channel, message);
      onClose();
    } catch (err: any) {
      alert(`Error sending quotation: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/quotations/verify/${quotation.quotationNumber}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold">Dispatch Quotation to Client</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Channel Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              Select Dispatch Channel
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setChannel('email')}
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  channel === 'email'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Work Email</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  channel === 'whatsapp'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setChannel('manual')}
                className={`py-2 px-3 rounded border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  channel === 'manual'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Record Manual</span>
              </button>
            </div>
          </div>

          {/* Email or Phone field */}
          {channel === 'email' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Recipient Email Address *
              </label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="procurement@clientcompany.com"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          )}

          {channel === 'whatsapp' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Client Mobile / WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          )}

          {/* Subject */}
          {channel === 'email' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Email Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-medium"
              />
            </div>
          )}

          {/* Message Text */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Message Body / Accompanying Note
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-sans"
            />
          </div>

          {/* Summary Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-800">{quotation.quotationNumber} ({quotation.revision})</div>
              <div className="text-[11px] text-slate-500">Value: ₹{quotation.grandTotal.toLocaleString('en-IN')} ({quotation.items.length} line items)</div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-slate-700 hover:text-blue-700 border border-slate-200 rounded bg-white font-medium flex items-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Quote Link'}</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Confirm & Dispatch'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
