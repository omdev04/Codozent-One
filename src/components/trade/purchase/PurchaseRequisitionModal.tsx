import React, { useState } from 'react';
import { X, Plus, Trash2, FileCheck2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseRequisition, PurchaseRequisitionItem } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface PurchaseRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pr: PurchaseRequisition) => void;
}

export const PurchaseRequisitionModal: React.FC<PurchaseRequisitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { items, suppliers, currentUser, createPurchaseRequisition } = useERP();

  const [department, setDepartment] = useState('Machine Shop / Production');
  const [requestedBy, setRequestedBy] = useState(currentUser.name || 'Plant Supervisor');
  const [requiredByDate, setRequiredByDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [purpose, setPurpose] = useState('Raw material for upcoming batch production');
  const [preferredVendorId, setPreferredVendorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [prItems, setPrItems] = useState<Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    specifications: string;
    quantity: number;
    uom: string;
    estimatedUnitRate: number;
  }>>([
    {
      itemId: '',
      itemCode: 'RM-MS-01',
      itemName: 'Mild Steel Round Bar 50mm',
      specifications: 'EN8 Grade, Bright Finish',
      quantity: 100,
      uom: 'Kg',
      estimatedUnitRate: 85
    }
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setPrItems(prev => [
      ...prev,
      {
        itemId: '',
        itemCode: `ITEM-0${prev.length + 1}`,
        itemName: '',
        specifications: '',
        quantity: 10,
        uom: 'Nos',
        estimatedUnitRate: 100
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (prItems.length <= 1) return;
    setPrItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemPropertyChange = (index: number, field: string, val: any) => {
    setPrItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };

      if (field === 'itemId' && val) {
        const found = items.find(i => i.id === val);
        if (found) {
          updated[index].itemCode = found.itemCode;
          updated[index].itemName = found.name;
          updated[index].uom = found.uom || 'Nos';
          updated[index].estimatedUnitRate = found.standardCost || 0;
        }
      }
      return updated;
    });
  };

  const totalEstimated = prItems.reduce(
    (acc, itm) => acc + (itm.quantity || 0) * (itm.estimatedUnitRate || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prItems.some(i => !i.itemName.trim() || i.quantity <= 0)) {
      setErrorMessage('Please fill in valid item name and quantity for all items.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const preferredVendor = suppliers.find(s => s.id === preferredVendorId);

      const prPayload = {
        department,
        requestedBy,
        requiredByDate,
        priority,
        purpose,
        preferredVendorId: preferredVendorId || undefined,
        preferredVendorName: preferredVendor?.name || undefined,
        totalEstimatedAmount: totalEstimated,
        items: prItems.map((itm, idx) => ({
          id: `pri-${Date.now()}-${idx}`,
          itemId: itm.itemId || undefined,
          itemCode: itm.itemCode,
          itemName: itm.itemName,
          specifications: itm.specifications,
          quantity: itm.quantity,
          uom: itm.uom,
          estimatedUnitRate: itm.estimatedUnitRate,
          estimatedTotal: itm.quantity * itm.estimatedUnitRate
        }))
      };

      const created = await createPurchaseRequisition(prPayload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">New Purchase Requisition (PR)</h3>
              <p className="text-[11px] text-slate-500">Internal factory requirement request before PO / tender release</p>
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

          {/* Department & Priority Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Required By Date</label>
              <input
                type="date"
                required
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-blue-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent (Stockout risk)</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Purpose / Requirement Reason</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Raw materials for order SO-2026-00012"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Requested Materials</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material
              </button>
            </div>

            <div className="space-y-2">
              {prItems.map((itm, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Item / Catalog</label>
                    <select
                      value={itm.itemId}
                      onChange={(e) => handleItemPropertyChange(idx, 'itemId', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    >
                      <option value="">-- Custom Item --</option>
                      {items.map(it => (
                        <option key={it.id} value={it.id}>[{it.itemCode}] {it.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Part / Item Name</label>
                    <input
                      type="text"
                      required
                      value={itm.itemName}
                      onChange={(e) => handleItemPropertyChange(idx, 'itemName', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity & UOM</label>
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
                        <option value="Set">Set</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Est. Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={itm.estimatedUnitRate}
                      onChange={(e) => handleItemPropertyChange(idx, 'estimatedUnitRate', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-right font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="font-bold text-slate-900">
                      {formatIndianCurrency(itm.quantity * itm.estimatedUnitRate, false)}
                    </span>
                    {prItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Total */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center font-semibold text-blue-900">
            <span>Total Estimated Requisition Value:</span>
            <span className="text-base font-bold">{formatIndianCurrency(totalEstimated)}</span>
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
              {isSubmitting ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
