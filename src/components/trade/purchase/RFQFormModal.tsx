import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { RFQ } from '../../../types/erp';

interface RFQFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (rfq: RFQ) => void;
}

export const RFQFormModal: React.FC<RFQFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { items, suppliers, createRFQ } = useERP();

  const [targetDeliveryDate, setTargetDeliveryDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Standard 5% tolerance applies. Please quote competitive rates including freight to Pune plant.');
  const [rfqItems, setRfqItems] = useState<Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    uom: string;
    targetRate: number;
  }>>([
    {
      itemId: '',
      itemCode: 'RAW-01',
      itemName: 'Aluminium Rod 6061',
      quantity: 50,
      uom: 'Kg',
      targetRate: 280
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setRfqItems(prev => [
      ...prev,
      {
        itemId: '',
        itemCode: `ITEM-0${prev.length + 1}`,
        itemName: '',
        quantity: 10,
        uom: 'Nos',
        targetRate: 0
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (rfqItems.length <= 1) return;
    setRfqItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemPropertyChange = (index: number, field: string, val: any) => {
    setRfqItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };

      if (field === 'itemId' && val) {
        const found = items.find(i => i.id === val);
        if (found) {
          updated[index].itemCode = found.itemCode;
          updated[index].itemName = found.name;
          updated[index].uom = found.uom || 'Nos';
          updated[index].targetRate = found.standardCost || 0;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rfqItems.some(i => !i.itemName.trim() || i.quantity <= 0)) {
      setErrorMessage('Please specify valid item names and quantities.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await createRFQ({
        targetDeliveryDate,
        notes,
        items: rfqItems
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create Request for Quotation (RFQ)</h3>
              <p className="text-[11px] text-slate-500">Send procurement tender to vendors to invite price quotes</p>
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
            <label className="block font-semibold text-slate-700 mb-1">Target Delivery Deadline</label>
            <input
              type="date"
              required
              value={targetDeliveryDate}
              onChange={(e) => setTargetDeliveryDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-indigo-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Commercial Notes / Freight Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Tender Item Lines</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="space-y-2">
              {rfqItems.map((itm, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Item / Code</label>
                    <input
                      type="text"
                      required
                      value={itm.itemName}
                      onChange={(e) => handleItemPropertyChange(idx, 'itemName', e.target.value)}
                      placeholder="e.g. Aluminium Rod 6061"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min="1"
                        required
                        value={itm.quantity}
                        onChange={(e) => handleItemPropertyChange(idx, 'quantity', Number(e.target.value))}
                        className="w-2/3 px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-right"
                      />
                      <select
                        value={itm.uom}
                        onChange={(e) => handleItemPropertyChange(idx, 'uom', e.target.value)}
                        className="w-1/3 px-1 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="Nos">Nos</option>
                        <option value="Kg">Kg</option>
                        <option value="Meter">Mtr</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Target Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={itm.targetRate}
                      onChange={(e) => handleItemPropertyChange(idx, 'targetRate', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-right font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    {rfqItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
              {isSubmitting ? 'Generating RFQ...' : 'Release RFQ Tender'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
