import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Send, 
  GitBranch, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ShoppingCart, 
  Copy, 
  Paperclip, 
  Download, 
  ShieldCheck, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertTriangle,
  History,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Quotation, QuotationActivity, QuotationRevision, QuotationAttachment, Company } from '../../types/erp';
import { formatIndianCurrency } from '../../utils/indianCurrency';

interface QuotationDetailDrawerProps {
  quotation: Quotation;
  allQuotations: Quotation[];
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrint: () => void;
  onOpenSend: () => void;
  onOpenRevision: () => void;
  onOpenApproval: () => void;
  onConvertToSalesOrder: () => Promise<void>;
  onSelectRevision: (revQuote: Quotation) => void;
  onAddAttachment: (att: Partial<QuotationAttachment>) => Promise<void>;
}

export const QuotationDetailDrawer: React.FC<QuotationDetailDrawerProps> = ({
  quotation,
  allQuotations,
  company,
  isOpen,
  onClose,
  onOpenPrint,
  onOpenSend,
  onOpenRevision,
  onOpenApproval,
  onConvertToSalesOrder,
  onSelectRevision,
  onAddAttachment
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'terms' | 'timeline' | 'revisions' | 'attachments'>('overview');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentCategory, setNewAttachmentCategory] = useState<'drawing' | 'spec_sheet' | 'po' | 'other'>('drawing');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  // Find all revisions in the same quotation family
  const familyId = quotation.quotationFamilyId || quotation.quotationNumber;
  const familyRevisions = allQuotations.filter(
    q => (q.quotationFamilyId && q.quotationFamilyId === familyId) || q.quotationNumber === quotation.quotationNumber
  ).sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0));

  const isSuperseded = quotation.status === 'superseded';
  const isConverted = quotation.status === 'converted_to_order';
  const isAccepted = quotation.status === 'accepted';
  const isDraft = quotation.status === 'draft';
  const isPendingApproval = quotation.status === 'pending_approval';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">Draft</span>;
      case 'pending_approval':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Pending Approval</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Approved</span>;
      case 'sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">Sent to Client</span>;
      case 'under_negotiation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-300">Under Negotiation</span>;
      case 'accepted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono">Accepted</span>;
      case 'converted_to_order':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-700 text-white border border-blue-800">Converted to SO</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-300">Rejected</span>;
      case 'expired':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-300">Expired</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-600 border border-slate-300">Cancelled</span>;
      case 'superseded':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700 border border-slate-400">Superseded</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const handleUploadAttachmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim()) return;
    setIsUploading(true);
    try {
      await onAddAttachment({
        fileName: newAttachmentName.trim(),
        fileType: 'application/pdf',
        fileSize: Math.floor(Math.random() * 500000) + 100000,
        category: newAttachmentCategory,
        fileUrl: '#'
      });
      setNewAttachmentName('');
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const billingAddr = typeof quotation.billingAddress === 'object' && quotation.billingAddress !== null
    ? `${quotation.billingAddress.street || ''}, ${quotation.billingAddress.city || ''}, ${quotation.billingAddress.state || ''} - ${quotation.billingAddress.pincode || ''}`
    : String(quotation.billingAddress || 'Standard Address');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      
      {/* Drawer Container */}
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-mono font-bold text-sm">
              QT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono tracking-tight text-white">
                  {quotation.quotationNumber}
                </h2>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono font-bold text-[10px] border border-blue-800">
                  {quotation.revision}
                </span>
                {getStatusBadge(quotation.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {quotation.customerName} {quotation.subject ? `· ${quotation.subject}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Print official quotation"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {/* Quick Action: Send Quote */}
            {!isSuperseded && !isConverted && (
              <button
                onClick={onOpenSend}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Customer</span>
              </button>
            )}

            {/* Quick Action: Internal Approval */}
            {isDraft && (
              <button
                onClick={onOpenApproval}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>Submit / Approve</span>
              </button>
            )}

            {/* Quick Action: Create Revision */}
            {!isSuperseded && !isConverted && (
              <button
                onClick={onOpenRevision}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 text-purple-600" />
                <span>Create Revision</span>
              </button>
            )}
          </div>

          {/* Critical Conversion Point: Convert Accepted Quote to Sales Order */}
          <div className="flex items-center gap-2">
            {isAccepted && !quotation.convertedSalesOrderId && (
              <button
                onClick={onConvertToSalesOrder}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Convert to Live Sales Order →</span>
              </button>
            )}

            {isConverted && (
              <div className="flex items-center gap-1.5 text-blue-700 font-bold font-mono bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Sales Order {quotation.convertedSalesOrderNumber || 'Active'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0">
          {[
            { id: 'overview', label: 'Overview & Commercials' },
            { id: 'items', label: `Line Items (${quotation.items?.length || 0})` },
            { id: 'terms', label: 'Terms & Conditions' },
            { id: 'timeline', label: `Activity Timeline (${quotation.activities?.length || 0})` },
            { id: 'revisions', label: `Revisions (${familyRevisions.length})` },
            { id: 'attachments', label: `Drawings & Files (${quotation.attachments?.length || 0})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-xs text-slate-700 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Warnings / Superseded Banner */}
              {isSuperseded && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Historical / Superseded Revision</span>
                    <p className="text-[11px] mt-0.5">
                      This revision snapshot has been superseded by a newer revision. Pricing and specifications are archived for reference only.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Commercial Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Grand Total (INR)</div>
                  <div className="text-base font-black text-blue-700 font-mono mt-0.5">
                    ₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Taxable + GST</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total GST (CGST+SGST/IGST)</div>
                  <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                    ₹{(quotation.cgstAmount + quotation.sgstAmount + quotation.igstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Intra/Inter state</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Quote Date & Validity</div>
                  <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                    {quotation.quoteDate}
                  </div>
                  <div className="text-[10px] text-red-700 font-medium mt-0.5">Valid: {quotation.validUntil}</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Prepared By</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                    {quotation.salespersonName || quotation.createdBy}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Series: {quotation.revision}</div>
                </div>
              </div>

              {/* Amount in words */}
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                  Amount Chargeable (in words):
                </span>
                <span className="text-xs font-bold text-slate-900 italic mt-0.5 block">
                  {quotation.amountInWords || 'Rupees Only'}
                </span>
              </div>

              {/* Customer & Linked Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded bg-white space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Customer Information</span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">{quotation.customerName}</div>
                  {quotation.contactPerson && (
                    <div className="text-xs text-slate-700">Contact: {quotation.contactPerson}</div>
                  )}
                  <div className="text-[11px] text-slate-600 leading-normal whitespace-pre-line">{billingAddr}</div>
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-600">
                    {quotation.gstin && <span>GSTIN: <strong>{quotation.gstin}</strong></span>}
                    {quotation.phone && <span>Tel: {quotation.phone}</span>}
                    {quotation.email && <span>Email: {quotation.email}</span>}
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded bg-white space-y-2">
                  <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Quotation Context & Links</span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quotation Subject:</span>
                      <span className="font-semibold text-slate-800">{quotation.subject || 'Standard Job'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer PO / RFQ Ref:</span>
                      <span className="font-mono font-medium text-slate-800">{quotation.referenceNumber || 'None'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Linked CRM Lead:</span>
                      <span className="font-mono text-blue-700 font-semibold">{quotation.leadNumber || 'Direct Customer Entry'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Place of Supply:</span>
                      <span className="font-medium text-slate-800">{quotation.placeOfSupply || 'Maharashtra (27)'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Internal Notes (Confidential) */}
              {quotation.internalNotes && (
                <div className="p-3 bg-red-50/50 border border-red-200 rounded">
                  <div className="flex items-center gap-1.5 text-red-800 font-bold text-[11px] uppercase tracking-wider mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Internal Notes (Strictly confidential - never printed in client PDF):</span>
                  </div>
                  <p className="text-slate-800 text-xs whitespace-pre-line font-mono">
                    {quotation.internalNotes}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: LINE ITEMS & SPECIFICATIONS */}
          {activeTab === 'items' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Item Details & Specs</th>
                      <th className="py-2.5 px-2 text-center w-16">HSN</th>
                      <th className="py-2.5 px-2 text-right w-14">Qty</th>
                      <th className="py-2.5 px-2 text-center w-12">UOM</th>
                      <th className="py-2.5 px-2.5 text-right w-20">Unit Rate (₹)</th>
                      <th className="py-2.5 px-2.5 text-right w-20">Taxable (₹)</th>
                      <th className="py-2.5 px-2 text-center w-14">GST</th>
                      <th className="py-2.5 px-2.5 text-right w-24">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quotation.items?.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono text-slate-500 align-top">{idx + 1}</td>
                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-slate-900">{it.itemName}</div>
                          <div className="text-[11px] font-mono text-slate-500">Code: {it.itemCode}</div>
                          
                          {/* Specs card */}
                          <div className="mt-1.5 p-2 bg-slate-50 rounded border border-slate-200 space-y-1 text-[11px]">
                            {it.description && <div>{it.description}</div>}
                            {it.technicalSpecifications && <div><strong>Specs:</strong> {it.technicalSpecifications}</div>}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-slate-600">
                              {it.materialGrade && <span>Grade: <strong>{it.materialGrade}</strong></span>}
                              {it.dimensions && <span>Dims: <strong>{it.dimensions}</strong></span>}
                              {it.drawingReference && <span>Drawing: <strong>{it.drawingReference}</strong></span>}
                              {it.toleranceDetails && <span>Tolerance: <strong>{it.toleranceDetails}</strong></span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-600 align-top">{it.hsnSacCode || '8483'}</td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 align-top">{it.quantity}</td>
                        <td className="py-3 px-2 text-center font-mono text-slate-600 align-top">{it.uom || 'Nos'}</td>
                        <td className="py-3 px-2.5 text-right font-mono text-slate-800 align-top">₹{it.unitPrice.toFixed(2)}</td>
                        <td className="py-3 px-2.5 text-right font-mono font-medium text-slate-900 align-top">₹{(it.taxableAmount || (it.quantity * it.unitPrice)).toFixed(2)}</td>
                        <td className="py-3 px-2 text-center font-mono text-slate-700 align-top">{it.gstRate}%</td>
                        <td className="py-3 px-2.5 text-right font-mono font-bold text-slate-900 align-top">₹{it.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commercial Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-full max-w-sm p-4 bg-slate-50 border border-slate-200 rounded space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{quotation.subtotal.toFixed(2)}</span>
                  </div>
                  {quotation.discountAmount ? (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount:</span>
                      <span>-₹{quotation.discountAmount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-slate-900 font-semibold pt-1 border-t border-slate-200">
                    <span>Taxable Value:</span>
                    <span>₹{(quotation.taxableAmount !== undefined ? quotation.taxableAmount : quotation.subtotal).toFixed(2)}</span>
                  </div>
                  {quotation.cgstAmount > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>CGST (9%):</span>
                      <span>₹{quotation.cgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {quotation.sgstAmount > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>SGST (9%):</span>
                      <span>₹{quotation.sgstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {quotation.igstAmount > 0 && (
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>IGST (18%):</span>
                      <span>₹{quotation.igstAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-blue-700 pt-2 border-t-2 border-slate-900">
                    <span>Grand Total:</span>
                    <span>₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS & CONDITIONS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Payment Terms</span>
                  <p className="text-xs text-slate-800">{quotation.paymentTerms || '50% advance along with PO, balance against proforma.'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Delivery Period</span>
                  <p className="text-xs text-slate-800">{quotation.deliveryPeriod || '2-3 weeks from confirmed PO.'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Delivery Location</span>
                  <p className="text-xs text-slate-800">{quotation.deliveryLocation || 'Ex-Works Chakan MIDC.'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Transportation</span>
                  <p className="text-xs text-slate-800">{quotation.transportationTerms || 'Freight extra at actuals.'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Packaging Standards</span>
                  <p className="text-xs text-slate-800">{quotation.packingTerms || 'Standard seaworthy/wooden box packing.'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Warranty Period</span>
                  <p className="text-xs text-slate-800">{quotation.warrantyTerms || '12 months against manufacturing defects.'}</p>
                </div>
              </div>

              {quotation.customTerms && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Custom / Special Commercial Terms</span>
                  <p className="text-xs text-slate-800 whitespace-pre-line">{quotation.customTerms}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACTIVITY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(quotation.activities || []).map((act, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white ring-2 ring-slate-100 flex items-center justify-center" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{act.title}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(act.performedAt).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{act.description}</p>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1">
                        By: <span className="font-medium text-slate-700">{act.performedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REVISIONS */}
          {activeTab === 'revisions' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600">
                All revisions created within quotation series <strong>{quotation.quotationNumber}</strong>:
              </div>

              <div className="space-y-2.5">
                {familyRevisions.map((rev, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectRevision(rev)}
                    className={`p-3.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                      rev.id === quotation.id
                        ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700">
                        {rev.revision}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{rev.quotationNumber}</span>
                          {getStatusBadge(rev.status)}
                          {rev.id === quotation.id && (
                            <span className="text-[10px] text-blue-700 font-bold">(Currently Viewing)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Date: {rev.quoteDate} · Grand Total: <strong>₹{rev.grandTotal.toLocaleString('en-IN')}</strong> · Items: {rev.items?.length || 0}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-500">
                      <div>Created by: {rev.createdBy}</div>
                      <div className="text-[10px] text-slate-400">{new Date(rev.createdAt || rev.quoteDate).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload form */}
              <form onSubmit={handleUploadAttachmentSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newAttachmentName}
                  onChange={e => setNewAttachmentName(e.target.value)}
                  placeholder="e.g. Flange_Drawing_RevB.dwg, Technical_Tolerance_Sheet.pdf"
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <select
                  value={newAttachmentCategory}
                  onChange={e => setNewAttachmentCategory(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-700"
                >
                  <option value="drawing">Drawing (.CAD/.DWG/.PDF)</option>
                  <option value="spec_sheet">Spec Sheet</option>
                  <option value="po">Client PO Ref</option>
                  <option value="other">Other Document</option>
                </select>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer disabled:opacity-60"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </form>

              {/* Attachments List */}
              <div className="space-y-2">
                {(quotation.attachments || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No technical drawings or attachments linked to this quotation yet.
                  </div>
                ) : (
                  (quotation.attachments || []).map((att, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{att.fileName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Category: <span className="uppercase font-semibold">{att.category}</span> · {Math.round(att.fileSize / 1024)} KB · Uploaded by {att.uploadedBy}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Simulating download of ${att.fileName}`)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 cursor-pointer"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
