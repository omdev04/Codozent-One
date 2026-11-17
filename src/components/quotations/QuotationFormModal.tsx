import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  Building2, 
  User, 
  MapPin, 
  Percent, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Quotation, QuotationItem, Customer, Item, CrmLead, Company } from '../../types/erp';
import { formatIndianCurrency, numberToIndianWords, isIntraStateGst } from '../../utils/indianCurrency';

interface QuotationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editQuotation?: Quotation | null;
  initialLead?: CrmLead | null;
  customers: Customer[];
  items: Item[];
  leads: CrmLead[];
  company: Company | null;
  currentUser: { name: string; role?: string };
}

export const QuotationFormModal: React.FC<QuotationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editQuotation,
  initialLead,
  customers,
  items,
  leads,
  company,
  currentUser
}) => {
  // Mode: customer from Lead or Customer Master or Manual
  const [customerSource, setCustomerSource] = useState<'lead' | 'customer' | 'manual'>('customer');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Section A: Basic Details
  const [quotationNumber, setQuotationNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [subject, setSubject] = useState('Supply of Precision Components as per Drawing');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [salespersonName, setSalespersonName] = useState(currentUser?.name || 'Sales Desk');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra (27)');

  // Section B: Customer Information
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('Plot No. 12, MIDC Industrial Area, Pune 411018');
  const [shippingAddress, setShippingAddress] = useState('Plot No. 12, MIDC Industrial Area, Pune 411018');

  // Section C: Line Items Table
  const [quoteItems, setQuoteItems] = useState<any[]>([
    {
      id: `qit-${Date.now()}-0`,
      itemId: items[0]?.id || '',
      itemCode: items[0]?.itemCode || 'PART-001',
      itemName: items[0]?.name || 'CNC Turned Flange',
      description: 'Precision machined component with zinc plating',
      technicalSpecifications: 'Grade EN8D, Turning & Drilling',
      dimensions: 'Ø120mm x 45mm',
      materialGrade: 'EN8D / 1045',
      drawingReference: 'DWG-FLG-01 Rev B',
      toleranceDetails: '±0.05 mm',
      manufacturingNotes: 'Critical face runout under 0.02mm',
      hsnSacCode: '8483',
      uom: 'Nos',
      quantity: 100,
      unitPrice: items[0]?.standardCost ? items[0].standardCost * 1.5 : 450,
      discountType: 'percentage',
      discountValue: 0,
      discountAmount: 0,
      taxableAmount: 45000,
      gstRate: 18,
      totalAmount: 53100
    }
  ]);

  // Section D: Commercial & Discounts
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [packingAmount, setPackingAmount] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);

  // Section E: Standard Terms & Conditions
  const [termTemplate, setTermTemplate] = useState('standard_advance');
  const [paymentTerms, setPaymentTerms] = useState('50% advance along with PO, balance against proforma before dispatch.');
  const [deliveryPeriod, setDeliveryPeriod] = useState('2 to 3 weeks from receipt of approved drawings and PO.');
  const [deliveryLocation, setDeliveryLocation] = useState('Ex-Works Chakan MIDC Plant, Pune.');
  const [transportationTerms, setTransportationTerms] = useState('Freight extra at actuals through buyer approved transporter.');
  const [packingTerms, setPackingTerms] = useState('Standard seaworthy wooden box packing included.');
  const [warrantyTerms, setWarrantyTerms] = useState('12 months against manufacturing defects.');
  const [validityTerms, setValidityTerms] = useState('15 days from the date of quotation.');
  const [taxesAndDuties, setTaxesAndDuties] = useState('GST as applicable at actuals (currently 18%).');
  const [customTerms, setCustomTerms] = useState('');

  // Section F: Notes
  const [customerNotes, setCustomerNotes] = useState('Tooling & fixture charges waived for order quantity exceeding 500 pcs.');
  const [internalNotes, setInternalNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle template switch
  const handleTemplateChange = (tpl: string) => {
    setTermTemplate(tpl);
    if (tpl === 'standard_advance') {
      setPaymentTerms('50% advance along with PO, balance against proforma before dispatch.');
      setDeliveryPeriod('2 to 3 weeks from receipt of approved drawings and PO.');
      setDeliveryLocation('Ex-Works Chakan MIDC Plant, Pune.');
      setTransportationTerms('Freight extra at actuals through buyer approved transporter.');
    } else if (tpl === 'credit_30') {
      setPaymentTerms('30 days credit from the date of invoice against confirmed PO & PDC.');
      setDeliveryPeriod('4 weeks from order confirmation.');
      setDeliveryLocation('FOR Destination (Customer Plant).');
      setTransportationTerms('Included in quoted rate.');
    } else if (tpl === 'job_work') {
      setPaymentTerms('100% payment within 15 days of material receipt & inspection.');
      setDeliveryPeriod('7 to 10 working days from raw material arrival.');
      setDeliveryLocation('Customer site delivery.');
      setTransportationTerms('Customer to arrange both side transit.');
    }
  };

  // Populate Lead if passed
  useEffect(() => {
    if (initialLead) {
      setCustomerSource('lead');
      setSelectedLeadId(initialLead.id);
      setCustomerName(initialLead.companyName || initialLead.contactName);
      setContactPerson(initialLead.contactName || '');
      setPhone(initialLead.phone || '');
      setEmail(initialLead.email || '');
      setGstin(initialLead.gstin || '');
      if (initialLead.address) {
        setBillingAddress(initialLead.address);
        setShippingAddress(initialLead.address);
      }
      setSubject(`Quotation for ${initialLead.productInterest || initialLead.title || 'Component Requirement'}`);
      if (initialLead.targetQuantity && Number(initialLead.targetQuantity) > 0) {
        setQuoteItems(prev => [
          {
            ...prev[0],
            itemName: initialLead.productInterest || 'Custom Component',
            quantity: Number(initialLead.targetQuantity),
            unitPrice: initialLead.dealValue ? Math.round(Number(initialLead.dealValue) / Number(initialLead.targetQuantity)) : 450
          }
        ]);
      }
    } else if (editQuotation) {
      // Editing existing quotation
      setQuotationNumber(editQuotation.quotationNumber);
      setQuoteDate(editQuotation.quoteDate);
      setValidUntil(editQuotation.validUntil);
      setSubject(editQuotation.subject || '');
      setReferenceNumber(editQuotation.referenceNumber || '');
      setCustomerName(editQuotation.customerName);
      setContactPerson(editQuotation.contactPerson || '');
      setPhone(editQuotation.phone || '');
      setEmail(editQuotation.email || '');
      setGstin(editQuotation.gstin || '');
      setPlaceOfSupply(editQuotation.placeOfSupply || 'Maharashtra (27)');
      setBillingAddress(typeof editQuotation.billingAddress === 'object' ? JSON.stringify(editQuotation.billingAddress) : editQuotation.billingAddress || '');
      setShippingAddress(typeof editQuotation.shippingAddress === 'object' ? JSON.stringify(editQuotation.shippingAddress) : editQuotation.shippingAddress || '');
      setQuoteItems(editQuotation.items || []);
      setDiscountType(editQuotation.discountType || 'percentage');
      setDiscountValue(editQuotation.discountValue || 0);
      setFreightAmount(editQuotation.freightAmount || 0);
      setPackingAmount(editQuotation.packingAmount || 0);
      setOtherCharges(editQuotation.otherCharges || 0);
      setPaymentTerms(editQuotation.paymentTerms || '');
      setDeliveryPeriod(editQuotation.deliveryPeriod || '');
      setCustomerNotes(editQuotation.customerNotes || editQuotation.notes || '');
      setInternalNotes(editQuotation.internalNotes || '');
    }
  }, [initialLead, editQuotation]);

  // Handle lead selection change
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    setCustomerName(lead.companyName || lead.contactName);
    setContactPerson(lead.contactName || '');
    setPhone(lead.phone || '');
    setEmail(lead.email || '');
    setGstin(lead.gstin || '');
    if (lead.address) {
      setBillingAddress(lead.address);
      setShippingAddress(lead.address);
    }
    setSubject(`Quotation for ${lead.productInterest || lead.title}`);
  };

  // Handle customer selection change
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;
    setCustomerName(cust.name);
    setContactPerson(cust.contactPerson || '');
    setPhone(cust.phone || '');
    setEmail(cust.email || '');
    setGstin(cust.gstin || '');
    if (cust.billingAddress) {
      setBillingAddress(cust.billingAddress);
      setShippingAddress(cust.shippingAddress || cust.billingAddress);
    }
  };

  // Line item manipulation
  const handleAddLineItem = () => {
    const nextIdx = quoteItems.length;
    const defaultItm = items[nextIdx % items.length];
    const uPrice = defaultItm?.standardCost || 500;
    setQuoteItems(prev => [
      ...prev,
      {
        id: `qit-${Date.now()}-${nextIdx}`,
        itemId: defaultItm?.id || '',
        itemCode: defaultItm?.itemCode || `PART-${String(nextIdx + 1).padStart(3, '0')}`,
        itemName: defaultItm?.name || 'Custom Machined Part',
        description: 'CNC Turned / Milled specification',
        technicalSpecifications: 'As per technical drawing',
        dimensions: '',
        materialGrade: 'Mild Steel / EN8',
        drawingReference: '',
        toleranceDetails: '±0.05 mm',
        manufacturingNotes: '',
        hsnSacCode: '8483',
        uom: 'Nos',
        quantity: 10,
        unitPrice: uPrice,
        discountType: 'percentage',
        discountValue: 0,
        discountAmount: 0,
        taxableAmount: uPrice * 10,
        gstRate: defaultItm?.gstRate || 18,
        totalAmount: (uPrice * 10) * 1.18
      }
    ]);
  };

  const handleUpdateLineItem = (index: number, field: string, value: any) => {
    setQuoteItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, [field]: value };

      // If user picks an existing item from catalog
      if (field === 'itemId') {
        const found = items.find(i => i.id === value);
        if (found) {
          updated.itemCode = found.itemCode;
          updated.itemName = found.name;
          updated.unitPrice = found.standardCost || 500;
          updated.gstRate = found.gstRate || 18;
          updated.hsnSacCode = found.hsnSacCode || '8483';
          updated.uom = found.uom || 'Nos';
        }
      }

      // Recalculate line totals
      const qty = Math.max(0, Number(updated.quantity) || 0);
      const rate = Math.max(0, Number(updated.unitPrice) || 0);
      const gross = qty * rate;

      let disc = 0;
      if (updated.discountType === 'fixed') {
        disc = Math.min(gross, Math.max(0, Number(updated.discountValue) || 0));
      } else {
        const pct = Math.min(100, Math.max(0, Number(updated.discountValue) || 0));
        disc = gross * (pct / 100);
      }

      const taxable = Math.max(0, gross - disc);
      const taxRate = Number(updated.gstRate) >= 0 ? Number(updated.gstRate) : 18;
      const tax = taxable * (taxRate / 100);

      updated.discountAmount = disc;
      updated.taxableAmount = taxable;
      updated.totalAmount = taxable + tax;

      return updated;
    }));
  };

  const handleRemoveLineItem = (index: number) => {
    if (quoteItems.length <= 1) {
      alert('Quotation must contain at least one line item.');
      return;
    }
    setQuoteItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Indian GST Calculation Engine
  const supplierGstinOrState = company?.gstin || company?.state || '27';
  const isIntra = isIntraStateGst(supplierGstinOrState, placeOfSupply);

  // Financial aggregates
  const rawSubtotal = quoteItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const lineDiscountsTotal = quoteItems.reduce((acc, it) => acc + (it.discountAmount || 0), 0);
  const taxableBeforeHeaderDisc = quoteItems.reduce((acc, it) => acc + (it.taxableAmount || 0), 0);

  let headerDiscountAmt = 0;
  if (discountType === 'fixed') {
    headerDiscountAmt = Math.min(taxableBeforeHeaderDisc, Math.max(0, Number(discountValue) || 0));
  } else if (Number(discountValue) > 0) {
    const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
    headerDiscountAmt = taxableBeforeHeaderDisc * (pct / 100);
  }

  const finalTaxable = Math.max(0, taxableBeforeHeaderDisc - headerDiscountAmt);

  // Taxes
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  quoteItems.forEach(it => {
    const itemTaxable = it.taxableAmount || (it.quantity * it.unitPrice);
    const itemGst = itemTaxable * (Number(it.gstRate || 18) / 100);
    if (isIntra) {
      totalCgst += itemGst / 2;
      totalSgst += itemGst / 2;
    } else {
      totalIgst += itemGst;
    }
  });

  // Adjust tax if header discount applied
  if (headerDiscountAmt > 0 && taxableBeforeHeaderDisc > 0) {
    const ratio = finalTaxable / taxableBeforeHeaderDisc;
    totalCgst *= ratio;
    totalSgst *= ratio;
    totalIgst *= ratio;
  }

  const freight = Math.max(0, Number(freightAmount) || 0);
  const packing = Math.max(0, Number(packingAmount) || 0);
  const other = Math.max(0, Number(otherCharges) || 0);

  const rawGrandTotal = finalTaxable + totalCgst + totalSgst + totalIgst + freight + packing + other;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = Math.round((roundedGrandTotal - rawGrandTotal) * 100) / 100;
  const wordsPreview = numberToIndianWords(roundedGrandTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Please enter or select a customer name.');
      return;
    }
    if (quoteItems.length === 0) {
      setErrorMsg('At least one quotation line item is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await onSubmit({
        id: editQuotation?.id,
        quotationNumber: quotationNumber || undefined,
        quoteDate,
        validUntil,
        subject,
        referenceNumber,
        salespersonName,
        placeOfSupply,
        customerId: selectedCustomerId || (initialLead ? initialLead.convertedCustomerId : undefined) || `cust-${Date.now()}`,
        customerName: customerName.trim(),
        contactPerson,
        phone,
        email,
        gstin,
        leadId: selectedLeadId || initialLead?.id || undefined,
        leadNumber: initialLead?.leadNumber || undefined,
        billingAddress,
        shippingAddress,
        items: quoteItems,
        subtotal: rawSubtotal,
        discountType,
        discountValue,
        discountAmount: lineDiscountsTotal + headerDiscountAmt,
        taxableAmount: finalTaxable,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        freightAmount: freight,
        packingAmount: packing,
        otherCharges: other,
        roundOff,
        grandTotal: roundedGrandTotal,
        amountInWords: wordsPreview,
        paymentTerms,
        deliveryPeriod,
        deliveryLocation,
        transportationTerms,
        packingTerms,
        warrantyTerms,
        validityTerms,
        taxesAndDuties,
        customTerms,
        customerNotes,
        internalNotes,
        status: editQuotation?.status || 'draft'
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save quotation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-sm">
              <Calculator className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {editQuotation ? `Edit Quotation ${editQuotation.quotationNumber} (${editQuotation.revision})` : 'Create Commercial Quotation & Rate Card'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full-featured precision engineering estimate with GST, revisions, and made-to-order specs.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION A: BASIC INFORMATION                                  */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Section A: Basic Quotation Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quotation Number
                </label>
                <input
                  type="text"
                  disabled
                  value={quotationNumber || 'Auto-Generated (e.g. QT-2026-00001)'}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-slate-100 text-slate-600 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quotation Date *
                </label>
                <input
                  type="date"
                  required
                  value={quoteDate}
                  onChange={e => setQuoteDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Valid Until Date *
                </label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned Salesperson
                </label>
                <input
                  type="text"
                  value={salespersonName}
                  onChange={e => setSalespersonName(e.target.value)}
                  placeholder="Sales Engineer Name"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quotation Subject / Project Scope *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Quotation for CNC Machined Flange & Bushing assemblies"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Client RFQ / Reference PO #
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="e.g. RFQ-TATA-2026-99"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION B: CUSTOMER & LEAD INFORMATION                         */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Section B: Customer & Place of Supply</span>
              </div>

              {/* Source Switcher */}
              <div className="flex items-center gap-1 bg-white p-0.5 border border-slate-200 rounded">
                <button
                  type="button"
                  onClick={() => setCustomerSource('customer')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                    customerSource === 'customer' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerSource('lead')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                    customerSource === 'lead' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  From CRM Lead
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerSource('manual')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                    customerSource === 'manual' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual Entry
                </button>
              </div>
            </div>

            {/* Selector Rows */}
            {customerSource === 'customer' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Select Existing Customer Master
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">-- Choose from Customer Database --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerCode || 'CUST'}) - GST: {c.gstin || 'Unregistered'}</option>
                  ))}
                </select>
              </div>
            )}

            {customerSource === 'lead' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Select CRM Lead to Carry Forward
                </label>
                <select
                  value={selectedLeadId}
                  onChange={e => handleLeadSelect(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs text-slate-800 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="">-- Select Active Lead Inquiry --</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      [{l.leadNumber}] {l.companyName || l.contactName} - {l.productInterest || l.title} (₹{Number(l.dealValue || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Customer / Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Tata Motors Ltd, Pune Works"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-medium focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Kulkarni"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Customer GSTIN
                </label>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AAACA1234M1Z5"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono uppercase focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contact Mobile / Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98220 12345"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="purchase@tatamotors.com"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Place of Supply (GST Determination) *
                </label>
                <select
                  value={placeOfSupply}
                  onChange={e => setPlaceOfSupply(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Maharashtra (27)">Maharashtra (27) - Intra-State (CGST + SGST)</option>
                  <option value="Karnataka (29)">Karnataka (29) - Inter-State (IGST)</option>
                  <option value="Gujarat (24)">Gujarat (24) - Inter-State (IGST)</option>
                  <option value="Tamil Nadu (33)">Tamil Nadu (33) - Inter-State (IGST)</option>
                  <option value="Haryana (06)">Haryana (06) - Inter-State (IGST)</option>
                  <option value="Delhi (07)">Delhi (07) - Inter-State (IGST)</option>
                  <option value="Uttar Pradesh (09)">Uttar Pradesh (09) - Inter-State (IGST)</option>
                  <option value="Telangana (36)">Telangana (36) - Inter-State (IGST)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Billing Address Snapshot
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Shipping / Dispatch Address Snapshot
                </label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION C: DYNAMIC LINE ITEMS TABLE (Precision Manufacturing)  */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Section C: Manufacturing Items & Technical Specifications</span>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-3">
              {quoteItems.map((item, index) => (
                <div key={item.id || index} className="p-3 bg-white border border-slate-200 rounded space-y-2.5 shadow-2xs">
                  
                  {/* Row 1: Item Catalog Pick or Custom Name, Code, HSN, Qty, UOM, Rate, Discount */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-1 text-center font-mono font-bold text-slate-500 pb-1.5">
                      #{index + 1}
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Item / Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={item.itemName}
                        onChange={e => handleUpdateLineItem(index, 'itemName', e.target.value)}
                        placeholder="Component Name"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-bold focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        SKU / Part Code
                      </label>
                      <input
                        type="text"
                        value={item.itemCode}
                        onChange={e => handleUpdateLineItem(index, 'itemCode', e.target.value)}
                        placeholder="PART-001"
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        HSN/SAC
                      </label>
                      <input
                        type="text"
                        value={item.hsnSacCode}
                        onChange={e => handleUpdateLineItem(index, 'hsnSacCode', e.target.value)}
                        placeholder="8483"
                        className="w-full px-1.5 py-1.5 border border-slate-300 rounded text-xs font-mono text-center focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={item.quantity}
                        onChange={e => handleUpdateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold text-right focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        UOM
                      </label>
                      <select
                        value={item.uom}
                        onChange={e => handleUpdateLineItem(index, 'uom', e.target.value)}
                        className="w-full px-1 py-1.5 border border-slate-300 rounded text-xs font-mono text-center focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="Nos">Nos</option>
                        <option value="Kg">Kg</option>
                        <option value="Meter">Meter</option>
                        <option value="Set">Set</option>
                        <option value="Hours">Hours</option>
                        <option value="Lot">Lot</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Unit Rate (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={item.unitPrice}
                        onChange={e => handleUpdateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold text-right focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        GST %
                      </label>
                      <select
                        value={item.gstRate}
                        onChange={e => handleUpdateLineItem(index, 'gstRate', parseFloat(e.target.value))}
                        className="w-full px-1 py-1.5 border border-slate-300 rounded text-xs font-mono text-center focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-end pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                        title="Delete line item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Precision Manufacturing Attributes */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-[11px]">
                    <div>
                      <input
                        type="text"
                        value={item.materialGrade || ''}
                        onChange={e => handleUpdateLineItem(index, 'materialGrade', e.target.value)}
                        placeholder="Material Grade (e.g. SS316L, EN8, Al6061)"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.dimensions || ''}
                        onChange={e => handleUpdateLineItem(index, 'dimensions', e.target.value)}
                        placeholder="Dimensions (e.g. OD 140 x ID 85 x L 60mm)"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.drawingReference || ''}
                        onChange={e => handleUpdateLineItem(index, 'drawingReference', e.target.value)}
                        placeholder="Drawing Ref # (e.g. DWG-2026-08 Rev C)"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] font-mono focus:outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.toleranceDetails || ''}
                        onChange={e => handleUpdateLineItem(index, 'toleranceDetails', e.target.value)}
                        placeholder="Machining Tolerance (e.g. ±0.02 mm / H7)"
                        className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  {/* Row 3: Live Line Total */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                    <div>
                      Gross: ₹{(item.quantity * item.unitPrice).toFixed(2)} · Taxable: ₹{(item.taxableAmount || (item.quantity * item.unitPrice)).toFixed(2)}
                    </div>
                    <div className="font-bold text-slate-900 text-xs">
                      Line Total: ₹{(item.totalAmount || 0).toFixed(2)}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION D: PRICING, DISCOUNTS & INDIAN GST CALCULATION         */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              <span>Section D: Pricing, Additional Logistics & GST Calculation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Overall Discount
                </label>
                <div className="flex gap-1">
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-16 px-1 py-1.5 border border-slate-300 rounded bg-white text-xs font-semibold"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">₹</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountValue}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-bold text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Freight / Logistics (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={freightAmount}
                  onChange={e => setFreightAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Packaging Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={packingAmount}
                  onChange={e => setPackingAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono text-right"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Other Surcharges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={otherCharges}
                  onChange={e => setOtherCharges(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono text-right"
                />
              </div>
            </div>

            {/* Calculations Breakdown Card */}
            <div className="p-4 bg-white border border-slate-200 rounded space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-2 border-b border-slate-100">
                <div>
                  <span className="text-slate-500 text-[10px] block">Gross Subtotal</span>
                  <strong className="text-slate-900 text-sm">₹{rawSubtotal.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Discount Amount</span>
                  <strong className="text-emerald-700 text-sm">-₹{(lineDiscountsTotal + headerDiscountAmt).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Taxable Value</span>
                  <strong className="text-slate-900 text-sm">₹{finalTaxable.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">
                    {isIntra ? 'Intra-State GST (CGST+SGST)' : 'Inter-State GST (IGST)'}
                  </span>
                  <strong className="text-blue-700 text-sm">₹{(totalCgst + totalSgst + totalIgst).toFixed(2)}</strong>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Indian Currency Words:</span>
                  <span className="text-xs font-bold text-slate-900 italic font-sans">{wordsPreview}</span>
                </div>
                <div className="text-right mt-2 sm:mt-0">
                  <span className="text-xs text-slate-500 mr-2">Grand Total:</span>
                  <span className="text-lg font-black text-blue-700 font-mono">₹{roundedGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION E: TERMS AND CONDITIONS                                */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Section E: Commercial & Manufacturing Terms</span>
              </div>

              {/* Template selector */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-500 font-medium">Template:</span>
                <select
                  value={termTemplate}
                  onChange={e => handleTemplateChange(e.target.value)}
                  className="px-2 py-0.5 border border-slate-300 rounded bg-white font-semibold text-xs text-blue-700"
                >
                  <option value="standard_advance">50% Advance & Balance against Proforma (Standard)</option>
                  <option value="credit_30">30-Day Credit with Confirmed PO (Tier-1 Auto)</option>
                  <option value="job_work">CNC Job Work & Labor Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Terms *
                </label>
                <input
                  type="text"
                  required
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Delivery Lead Time *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryPeriod}
                  onChange={e => setDeliveryPeriod(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Delivery Location / Incoterms
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={e => setDeliveryLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Transportation Terms
                </label>
                <input
                  type="text"
                  value={transportationTerms}
                  onChange={e => setTransportationTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Packaging Standards
                </label>
                <input
                  type="text"
                  value={packingTerms}
                  onChange={e => setPackingTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Warranty Terms
                </label>
                <input
                  type="text"
                  value={warrantyTerms}
                  onChange={e => setWarrantyTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Custom Terms / Special Commercial Clauses
              </label>
              <textarea
                rows={2}
                value={customTerms}
                onChange={e => setCustomTerms(e.target.value)}
                placeholder="e.g. Raw material price escalation clause linked to LME copper index."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* SECTION F: INTERNAL & CUSTOMER NOTES                           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Section F: Customer vs Internal Confidential Notes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Customer-Facing Remarks (Printed on PDF)
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={e => setCustomerNotes(e.target.value)}
                  placeholder="Notes visible to the client on the formal quotation."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-red-700">
                    Internal Engineering Notes (Confidential)
                  </label>
                  <span className="text-[10px] text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded">
                    Never in PDF
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  placeholder="Confidential margin notes, machine hour rates, scrap assumptions..."
                  className="w-full px-2.5 py-1.5 border border-red-200 rounded text-xs bg-red-50/30 focus:border-red-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0">
            <div className="text-xs text-slate-500">
              {quoteItems.length} line item(s) · Total: <strong>₹{roundedGrandTotal.toLocaleString('en-IN')}</strong>
            </div>

            <div className="flex items-center gap-2">
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
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving Quotation...' : editQuotation ? 'Update Quotation' : 'Create & Save Quotation'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
