import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Building2, 
  FileText, 
  AlertCircle, 
  Sparkles, 
  DollarSign, 
  Percent, 
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { SalesOrder, SalesOrderItem, Quotation } from '../../../types/erp';
import { formatIndianCurrency, isIntraStateGst } from '../../../utils/indianCurrency';

interface SalesOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: SalesOrder) => void;
}

export const SalesOrderFormModal: React.FC<SalesOrderFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { customers, items, quotations, activeCompany, createSalesOrder } = useERP();

  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [customerPoNumber, setCustomerPoNumber] = useState<string>('');
  const [customerPoDate, setCustomerPoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [advancePercentage, setAdvancePercentage] = useState<number>(20);
  const [paymentTerms, setPaymentTerms] = useState<string>('20% Advance, 80% on dispatch');
  const [deliveryTerms, setDeliveryTerms] = useState<string>('Ex-Factory Chakan, Pune');
  const [freightTerms, setFreightTerms] = useState<string>('Extra at actuals');
  const [billingAddress, setBillingAddress] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Line items state
  const [orderItems, setOrderItems] = useState<Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    description: string;
    technicalSpecs: string;
    drawingRef: string;
    materialGrade: string;
    dimensions: string;
    tolerance: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    gstRate: number;
    hsnSacCode: string;
  }>>([
    {
      itemId: '',
      itemCode: 'CUSTOM-01',
      itemName: 'CNC Machined Component',
      description: 'Custom precision component as per drawing',
      technicalSpecs: 'CNC Turning & Milling, Tolerance ±0.02 mm',
      drawingRef: 'DRW-2026-A1',
      materialGrade: 'EN8 / Mild Steel',
      dimensions: '50mm Dia x 120mm Length',
      tolerance: '±0.02 mm',
      uom: 'Nos',
      quantity: 50,
      unitPrice: 1250,
      discountPercent: 0,
      gstRate: 18,
      hsnSacCode: '8483'
    }
  ]);

  // Available accepted quotations
  const eligibleQuotations = quotations.filter(q => ['accepted', 'approved', 'sent'].includes(q.status));

  // Handle Customer Selection
  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const cust = customers.find(c => c.id === cId);
    if (cust) {
      setBillingAddress(cust.billingAddress || '');
      setShippingAddress(cust.shippingAddress || cust.billingAddress || '');
      if (cust.creditDays) {
        setPaymentTerms(`${cust.creditDays} Days Credit`);
      }
    }
  };

  // Handle Quotation Auto-fill
  const handleQuotationSelect = (qId: string) => {
    setSelectedQuoteId(qId);
    if (!qId) return;

    const quote = quotations.find(q => q.id === qId);
    if (!quote) return;

    setCustomerId(quote.customerId);
    const cust = customers.find(c => c.id === quote.customerId);
    setBillingAddress(typeof quote.billingAddress === 'string' ? quote.billingAddress : cust?.billingAddress || '');
    setShippingAddress(typeof quote.shippingAddress === 'string' ? quote.shippingAddress : cust?.shippingAddress || cust?.billingAddress || '');
    if (quote.paymentTerms) setPaymentTerms(quote.paymentTerms);
    if (quote.deliveryPeriod) setDeliveryTerms(quote.deliveryPeriod);

    // Map quotation items to SO items
    if (quote.items && quote.items.length > 0) {
      const mapped = quote.items.map(qi => ({
        itemId: qi.itemId || '',
        itemCode: qi.itemCode || 'CUSTOM',
        itemName: qi.itemName || 'Custom Item',
        description: qi.description || '',
        technicalSpecs: qi.technicalSpecifications || '',
        drawingRef: qi.drawingReference || '',
        materialGrade: qi.materialGrade || '',
        dimensions: qi.dimensions || '',
        tolerance: qi.toleranceDetails || '±0.05 mm',
        uom: qi.uom || 'Nos',
        quantity: qi.quantity || 1,
        unitPrice: qi.unitPrice || 0,
        discountPercent: qi.discountValue || 0,
        gstRate: 18,
        hsnSacCode: qi.hsnSacCode || '8483'
      }));
      setOrderItems(mapped);
    }
  };

  const handleAddItem = () => {
    setOrderItems(prev => [
      ...prev,
      {
        itemId: '',
        itemCode: `CUSTOM-0${prev.length + 1}`,
        itemName: '',
        description: '',
        technicalSpecs: '',
        drawingRef: '',
        materialGrade: '',
        dimensions: '',
        tolerance: '±0.05 mm',
        uom: 'Nos',
        quantity: 10,
        unitPrice: 0,
        discountPercent: 0,
        gstRate: 18,
        hsnSacCode: '8483'
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemPropertyChange = (index: number, field: string, val: any) => {
    setOrderItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };

      // If user selected an inventory item, auto-populate code and name
      if (field === 'itemId' && val) {
        const catalogItem = items.find(i => i.id === val);
        if (catalogItem) {
          updated[index].itemCode = catalogItem.itemCode;
          updated[index].itemName = catalogItem.name;
          updated[index].unitPrice = catalogItem.sellingPrice || 0;
          updated[index].uom = catalogItem.uom || 'Nos';
          updated[index].hsnSacCode = catalogItem.hsnSacCode || '8483';
        }
      }
      return updated;
    });
  };

  // Statutory GST calculation
  const customerObj = customers.find(c => c.id === customerId);
  const isIntraState = isIntraStateGst(activeCompany?.gstin || activeCompany?.state, customerObj?.gstin || customerObj?.billingAddress);

  // Compute Totals
  const calculatedItems = orderItems.map(itm => {
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
  const advanceAmount = Math.round(grandTotal * (advancePercentage / 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setErrorMessage('Please select a customer.');
      return;
    }
    if (orderItems.some(i => !i.itemName.trim() || i.quantity <= 0 || i.unitPrice <= 0)) {
      setErrorMessage('All item lines must have an item name, valid quantity, and unit price.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedCustomer = customers.find(c => c.id === customerId);
      const selectedQuote = quotations.find(q => q.id === selectedQuoteId);

      const orderPayload: any = {
        customerId,
        customerName: selectedCustomer?.name || 'Customer',
        customerPoNumber,
        customerPoDate,
        quotationId: selectedQuoteId || undefined,
        quotationNumber: selectedQuote?.quotationNumber || undefined,
        quotationRevision: selectedQuote?.revision || undefined,
        orderDate,
        deliveryDate: deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        priority,
        status: 'confirmed',
        subtotal,
        taxableAmount: totalTaxable,
        cgstAmount,
        sgstAmount,
        igstAmount,
        grandTotal,
        advancePercentage,
        advanceAmount,
        advancePaid: false,
        paymentTerms,
        deliveryTerms,
        freightTerms,
        billingAddress,
        shippingAddress,
        customerGstin: selectedCustomer?.gstin || '',
        notes,
        items: calculatedItems.map(itm => ({
          itemId: itm.itemId || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          itemCode: itm.itemCode,
          itemName: itm.itemName,
          description: itm.description,
          technicalSpecs: itm.technicalSpecs,
          drawingRef: itm.drawingRef,
          materialGrade: itm.materialGrade,
          dimensions: itm.dimensions,
          tolerance: itm.tolerance,
          uom: itm.uom,
          quantity: itm.quantity,
          unitPrice: itm.unitPrice,
          discountPercent: itm.discountPercent,
          discountAmount: (itm.quantity * itm.unitPrice) * (itm.discountPercent / 100),
          taxableAmount: itm.taxableAmount,
          hsnSacCode: itm.hsnSacCode,
          gstRate: itm.gstRate,
          taxAmount: itm.taxAmount,
          totalAmount: itm.totalAmount,
          shippedQuantity: 0
        }))
      };

      const created = await createSalesOrder(orderPayload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create sales order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">New Manufacturing Sales Order</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm purchase order with drawings, tolerances, material grades, and statutory GST.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer & Quotation Reference */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Customer & Reference Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Optional Quotation Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Convert from Accepted Quotation
                </label>
                <select
                  value={selectedQuoteId}
                  onChange={(e) => handleQuotationSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Manual Order (No Quotation) --</option>
                  {eligibleQuotations.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.quotationNumber} ({q.revision}) - {q.customerName} (₹{q.grandTotal?.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.gstin ? `(${c.gstin})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent / Hot Job</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              {/* Customer PO Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer PO Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO/APEX/2026/894"
                  value={customerPoNumber}
                  onChange={(e) => setCustomerPoNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Customer PO Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer PO Date
                </label>
                <input
                  type="date"
                  value={customerPoDate}
                  onChange={(e) => setCustomerPoDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Delivery Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Promised Delivery Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items & Made-to-Order Specs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  2. Manufactured Items & Technical Specifications
                </h4>
                <p className="text-[11px] text-slate-400">
                  Specify drawing references, dimensional tolerances, and material grades for fabrication.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Line
              </button>
            </div>

            <div className="space-y-3">
              {orderItems.map((itm, idx) => (
                <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Line #{idx + 1}</span>
                    {orderItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  {/* Item Basic Row */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Catalog Item / Preset
                      </label>
                      <select
                        value={itm.itemId}
                        onChange={(e) => handleItemPropertyChange(idx, 'itemId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Custom Manufacturing Item --</option>
                        {items.map(it => (
                          <option key={it.id} value={it.id}>
                            [{it.itemCode}] {it.name} - ₹{it.sellingPrice}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Item / Part Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={itm.itemCode}
                        onChange={(e) => handleItemPropertyChange(idx, 'itemCode', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Item Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Flange Bushing"
                        value={itm.itemName}
                        onChange={(e) => handleItemPropertyChange(idx, 'itemName', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Technical Made-to-Order Specs Row */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Drawing Ref</label>
                      <input
                        type="text"
                        placeholder="DRW-A101"
                        value={itm.drawingRef}
                        onChange={(e) => handleItemPropertyChange(idx, 'drawingRef', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Material Grade</label>
                      <input
                        type="text"
                        placeholder="e.g. SS316L, EN8"
                        value={itm.materialGrade}
                        onChange={(e) => handleItemPropertyChange(idx, 'materialGrade', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Tolerance</label>
                      <input
                        type="text"
                        placeholder="±0.02 mm"
                        value={itm.tolerance}
                        onChange={(e) => handleItemPropertyChange(idx, 'tolerance', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dimensions</label>
                      <input
                        type="text"
                        placeholder="OD 60 x ID 40 x L 80"
                        value={itm.dimensions}
                        onChange={(e) => handleItemPropertyChange(idx, 'dimensions', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">HSN/SAC Code</label>
                      <input
                        type="text"
                        placeholder="8483"
                        value={itm.hsnSacCode}
                        onChange={(e) => handleItemPropertyChange(idx, 'hsnSacCode', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Quantity, Pricing & Taxes Row */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={itm.quantity}
                        onChange={(e) => handleItemPropertyChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-right font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">UOM</label>
                      <select
                        value={itm.uom}
                        onChange={(e) => handleItemPropertyChange(idx, 'uom', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      >
                        <option value="Nos">Nos</option>
                        <option value="Kg">Kg</option>
                        <option value="Meter">Meter</option>
                        <option value="Set">Set</option>
                        <option value="Lot">Lot</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Unit Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={itm.unitPrice}
                        onChange={(e) => handleItemPropertyChange(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-right font-semibold text-blue-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={itm.discountPercent}
                        onChange={(e) => handleItemPropertyChange(idx, 'discountPercent', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">GST Rate %</label>
                      <select
                        value={itm.gstRate}
                        onChange={(e) => handleItemPropertyChange(idx, 'gstRate', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      >
                        <option value="18">18% (Standard)</option>
                        <option value="12">12%</option>
                        <option value="28">28%</option>
                        <option value="5">5%</option>
                        <option value="0">0%</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Line Total</label>
                      <div className="px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 rounded-md text-right border border-slate-200">
                        {formatIndianCurrency(
                          ((itm.quantity * itm.unitPrice) * (1 - (itm.discountPercent / 100))) * (1 + (itm.gstRate / 100))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Commercial Terms & Statutory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Commercial Terms */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Commercial Terms & Advance SOP
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Advance Required (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={advancePercentage}
                    onChange={(e) => setAdvancePercentage(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-right font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Advance Amount
                  </label>
                  <div className="px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 text-right">
                    {formatIndianCurrency(advanceAmount)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Delivery / Dispatch Terms
                </label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for production or dispatch..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg resize-none"
                />
              </div>
            </div>

            {/* Statutory GST & Order Value Summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Statutory Tax & Totals
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">
                    {isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
                  </span>
                </div>

                <div className="space-y-2 mt-3 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Subtotal:</span>
                    <span className="font-semibold text-slate-900">{formatIndianCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span className="font-semibold text-slate-900">{formatIndianCurrency(totalTaxable)}</span>
                  </div>

                  {isIntraState ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST (9%):</span>
                        <span className="font-semibold text-slate-900">{formatIndianCurrency(cgstAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST (9%):</span>
                        <span className="font-semibold text-slate-900">{formatIndianCurrency(sgstAmount)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST (18%):</span>
                      <span className="font-semibold text-slate-900">{formatIndianCurrency(igstAmount)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-blue-700">{formatIndianCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                A concurrency-safe SO-YYYY-XXXXX sequence number will be generated on confirmation.
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Confirming Order...' : 'Confirm Sales Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
