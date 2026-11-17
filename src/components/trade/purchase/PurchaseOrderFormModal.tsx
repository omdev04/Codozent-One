import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Truck, 
  FileText, 
  AlertCircle, 
  DollarSign, 
  Percent, 
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseOrder, PurchaseRequisition, PurchaseOrderItem } from '../../../types/erp';
import { formatIndianCurrency, isIntraStateGst } from '../../../utils/indianCurrency';

interface PurchaseOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (po: PurchaseOrder) => void;
  initialPR?: PurchaseRequisition | null;
}

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPR
}) => {
  const { suppliers, items, purchaseRequisitions, activeCompany, createPurchaseOrder } = useERP();

  const [supplierId, setSupplierId] = useState('');
  const [requisitionId, setRequisitionId] = useState(initialPR?.id || '');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );
  const [tolerancePercentage, setTolerancePercentage] = useState<number>(5);
  const [deliveryGodown, setDeliveryGodown] = useState('Central Raw Material Godown, Pune Plant');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Credit from MRN/GRN');
  const [freightTerms, setFreightTerms] = useState('Included in unit rate');
  const [notes, setNotes] = useState('Delivery subject to Quality Inspection at plant store. Test certificate required.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [poItems, setPoItems] = useState<Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    specs: string;
    hsnSac: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    gstRate: number;
    tolerancePercentage: number;
  }>>([
    {
      itemId: '',
      itemCode: 'RM-MS-01',
      itemName: 'Mild Steel Round Bar 50mm',
      specs: 'EN8 Grade, Bright Finish',
      hsnSac: '7228',
      quantity: 50,
      unitPrice: 85,
      discountPercent: 0,
      gstRate: 18,
      tolerancePercentage: 5
    }
  ]);

  // Sync initial PR if passed
  useEffect(() => {
    if (initialPR) {
      setRequisitionId(initialPR.id);
      if (initialPR.preferredVendorId) {
        setSupplierId(initialPR.preferredVendorId);
      }
      if (initialPR.items && initialPR.items.length > 0) {
        setPoItems(initialPR.items.map(pi => ({
          itemId: pi.itemId || '',
          itemCode: pi.itemCode,
          itemName: pi.itemName,
          specs: pi.specifications || '',
          hsnSac: '7228',
          quantity: pi.quantity,
          unitPrice: pi.estimatedUnitRate || 0,
          discountPercent: 0,
          gstRate: 18,
          tolerancePercentage: 5
        })));
      }
    }
  }, [initialPR]);

  if (!isOpen) return null;

  const handleSupplierChange = (sId: string) => {
    setSupplierId(sId);
    const supp = suppliers.find(s => s.id === sId);
    if (supp?.paymentTerms) {
      setPaymentTerms(supp.paymentTerms);
    }
  };

  const handlePRSelect = (prId: string) => {
    setRequisitionId(prId);
    if (!prId) return;

    const pr = purchaseRequisitions.find(p => p.id === prId);
    if (pr) {
      if (pr.preferredVendorId) setSupplierId(pr.preferredVendorId);
      if (pr.items && pr.items.length > 0) {
        setPoItems(pr.items.map(pi => ({
          itemId: pi.itemId || '',
          itemCode: pi.itemCode,
          itemName: pi.itemName,
          specs: pi.specifications || '',
          hsnSac: '7228',
          quantity: pi.quantity,
          unitPrice: pi.estimatedUnitRate || 0,
          discountPercent: 0,
          gstRate: 18,
          tolerancePercentage: 5
        })));
      }
    }
  };

  const handleAddItem = () => {
    setPoItems(prev => [
      ...prev,
      {
        itemId: '',
        itemCode: `ITEM-0${prev.length + 1}`,
        itemName: '',
        specs: '',
        hsnSac: '7228',
        quantity: 10,
        unitPrice: 0,
        discountPercent: 0,
        gstRate: 18,
        tolerancePercentage: 5
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (poItems.length <= 1) return;
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemPropertyChange = (index: number, field: string, val: any) => {
    setPoItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };

      if (field === 'itemId' && val) {
        const catalogItem = items.find(i => i.id === val);
        if (catalogItem) {
          updated[index].itemCode = catalogItem.itemCode;
          updated[index].itemName = catalogItem.name;
          updated[index].unitPrice = catalogItem.standardCost || 0;
          updated[index].hsnSac = catalogItem.hsnSacCode || '7228';
        }
      }
      return updated;
    });
  };

  // Statutory GST calculation
  const supplierObj = suppliers.find(s => s.id === supplierId);
  const isIntraState = isIntraStateGst(activeCompany?.gstin || activeCompany?.state, supplierObj?.gstin || supplierObj?.address);

  const calculatedItems = poItems.map(itm => {
    const gross = (itm.quantity || 0) * (itm.unitPrice || 0);
    const disc = gross * ((itm.discountPercent || 0) / 100);
    const taxable = gross - disc;
    const tax = taxable * ((itm.gstRate || 0) / 100);
    const total = taxable + tax;
    return {
      ...itm,
      taxableAmount: taxable,
      taxAmount: tax,
      totalAmount: total
    };
  });

  const subtotal = calculatedItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
  const totalTaxable = calculatedItems.reduce((acc, i) => acc + i.taxableAmount, 0);
  const totalTax = calculatedItems.reduce((acc, i) => acc + i.taxAmount, 0);
  const grandTotal = totalTaxable + totalTax;

  const cgstAmount = isIntraState ? totalTax / 2 : 0;
  const sgstAmount = isIntraState ? totalTax / 2 : 0;
  const igstAmount = isIntraState ? 0 : totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMessage('Please select a supplier.');
      return;
    }
    if (poItems.some(i => !i.itemName.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      setErrorMessage('All lines must have valid material name, quantity, and unit price.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedSupp = suppliers.find(s => s.id === supplierId);
      const selectedPR = purchaseRequisitions.find(p => p.id === requisitionId);

      const poPayload: any = {
        supplierId,
        supplierName: selectedSupp?.name || 'Supplier',
        supplierReference: '',
        requisitionId: requisitionId || undefined,
        requisitionNumber: selectedPR?.prNumber || undefined,
        orderDate,
        expectedDate,
        tolerancePercentage,
        deliveryGodown,
        paymentTerms,
        freightTerms,
        status: 'ordered',
        subtotal,
        taxableAmount: totalTaxable,
        cgstAmount,
        sgstAmount,
        igstAmount,
        grandTotal,
        notes,
        items: calculatedItems.map((itm, idx) => ({
          id: `poi-${Date.now()}-${idx}`,
          itemId: itm.itemId || `mat-${Date.now()}-${idx}`,
          itemCode: itm.itemCode,
          itemName: itm.itemName,
          specs: itm.specs,
          hsnSac: itm.hsnSac,
          quantity: itm.quantity,
          unitPrice: itm.unitPrice,
          discountPercent: itm.discountPercent,
          taxableAmount: itm.taxableAmount,
          gstRate: itm.gstRate,
          taxAmount: itm.taxAmount,
          totalAmount: itm.totalAmount,
          receivedQuantity: 0,
          tolerancePercentage: itm.tolerancePercentage
        }))
      };

      const created = await createPurchaseOrder(poPayload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">New Purchase Order (PO)</h3>
              <p className="text-[11px] text-slate-500">Legal contract for materials procurement with delivery tolerance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Supplier & Reference Info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Convert from Approved PR
                </label>
                <select
                  value={requisitionId}
                  onChange={(e) => handlePRSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="">-- Manual PO --</option>
                  {purchaseRequisitions.filter(p => ['approved', 'pending_approval'].includes(p.status)).map(pr => (
                    <option key={pr.id} value={pr.id}>
                      {pr.prNumber} - {pr.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supplier / Vendor <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="">Choose Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.gstin ? `(${s.gstin})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Tolerance (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={tolerancePercentage}
                  onChange={(e) => setTolerancePercentage(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Order Date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Promised Delivery Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-blue-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery Godown</label>
                <input
                  type="text"
                  value={deliveryGodown}
                  onChange={(e) => setDeliveryGodown(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Purchase Items & Materials</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" /> Add Material
              </button>
            </div>

            <div className="space-y-2">
              {poItems.map((itm, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Item Description</label>
                    <input
                      type="text"
                      required
                      value={itm.itemName}
                      onChange={(e) => handleItemPropertyChange(idx, 'itemName', e.target.value)}
                      placeholder="Material description"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Specifications</label>
                    <input
                      type="text"
                      value={itm.specs}
                      onChange={(e) => handleItemPropertyChange(idx, 'specs', e.target.value)}
                      placeholder="e.g. EN8, Bright"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={itm.quantity}
                      onChange={(e) => handleItemPropertyChange(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-right font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Unit Rate (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={itm.unitPrice}
                      onChange={(e) => handleItemPropertyChange(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-right font-semibold text-blue-700"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {formatIndianCurrency((itm.quantity * itm.unitPrice) * 1.18, false)}
                    </span>
                    {poItems.length > 1 && (
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

          {/* Statutory Summary & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="space-y-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Freight Terms</label>
                <input
                  type="text"
                  value={freightTerms}
                  onChange={(e) => setFreightTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold text-slate-900">{formatIndianCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST ({isIntraState ? 'CGST+SGST 18%' : 'IGST 18%'}):</span>
                  <span className="font-semibold text-slate-900">{formatIndianCurrency(totalTax)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-blue-700">{formatIndianCurrency(grandTotal)}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Concurrency-safe PO-YYYY-XXXXX sequence generated on confirm.
              </div>
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
              {isSubmitting ? 'Issuing PO...' : 'Issue Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
