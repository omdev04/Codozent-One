import React from 'react';
import { Printer, Download, X, Building2, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { Quotation, Company } from '../../types/erp';
import { formatIndianCurrency } from '../../utils/indianCurrency';

interface QuotationPrintViewProps {
  quotation: Quotation;
  company: Company | null;
  onClose: () => void;
}

export const QuotationPrintView: React.FC<QuotationPrintViewProps> = ({
  quotation,
  company,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isIntraState = quotation.igstAmount === 0 && (quotation.cgstAmount > 0 || quotation.sgstAmount > 0);

  const billingAddr = typeof quotation.billingAddress === 'object' && quotation.billingAddress !== null
    ? `${quotation.billingAddress.street || ''}, ${quotation.billingAddress.city || ''}, ${quotation.billingAddress.state || ''} - ${quotation.billingAddress.pincode || ''}`
    : String(quotation.billingAddress || 'As per customer master');

  const shippingAddr = typeof quotation.shippingAddress === 'object' && quotation.shippingAddress !== null
    ? `${quotation.shippingAddress.street || ''}, ${quotation.shippingAddress.city || ''}, ${quotation.shippingAddress.state || ''} - ${quotation.shippingAddress.pincode || ''}`
    : String(quotation.shippingAddress || billingAddr);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* Container */}
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[96vh] flex flex-col overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-sm tracking-wide text-blue-400">
              {quotation.quotationNumber}
            </span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {quotation.revision}
            </span>
            <span className="text-xs text-slate-400">
              | Customer: {quotation.customerName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Quotation Document (A4 Styling) */}
        <div className="p-8 sm:p-12 overflow-y-auto print:p-4 text-slate-800 text-xs font-sans space-y-6 print:overflow-visible">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-base">
                  M
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                    {company?.name || 'Apex Precision Technologies Pvt Ltd'}
                  </h1>
                  <span className="text-[10px] text-slate-500 font-medium">Precision Engineering & Made-To-Order Manufacturing</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">{company?.address || 'Plot No. E-45, MIDC Chakan Phase II, Bhamboli'}</p>
              <p className="text-[11px] text-slate-600">{company?.city || 'Pune'}, {company?.state || 'Maharashtra'} - {company?.pincode || '410501'}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] font-mono text-slate-700">
                <span>GSTIN: <strong>{company?.gstin || '27AAACA1234M1Z5'}</strong></span>
                <span>PAN: <strong>{company?.pan || 'AAACA1234M'}</strong></span>
                <span>State: <strong>{company?.state || 'Maharashtra'} (27)</strong></span>
              </div>
            </div>

            {/* Document Title & Meta Box */}
            <div className="text-right sm:self-stretch flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold tracking-widest text-xs uppercase rounded-xs">
                  FORMAL COMMERCIAL QUOTATION
                </div>
                <div className="text-lg font-black text-blue-700 font-mono mt-2 tracking-tight">
                  {quotation.quotationNumber}
                </div>
                <div className="text-xs font-bold text-slate-700 font-mono">
                  Revision: {quotation.revision}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 font-mono space-y-0.5 mt-2">
                <div>Date: <strong>{quotation.quoteDate}</strong></div>
                <div>Valid Until: <strong className="text-red-700">{quotation.validUntil}</strong></div>
                {quotation.referenceNumber && (
                  <div>Ref / RFQ #: <strong>{quotation.referenceNumber}</strong></div>
                )}
                <div>Place of Supply: <strong>{quotation.placeOfSupply || 'Maharashtra (27)'}</strong></div>
              </div>
            </div>
          </div>

          {/* Customer / Consignee Address Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bill To */}
            <div className="p-3.5 rounded border border-slate-200 bg-slate-50/50">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Billed To (Customer Details):
              </div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                {quotation.customerName}
              </div>
              {quotation.contactPerson && (
                <div className="text-xs text-slate-700 mt-0.5 font-medium">Attn: {quotation.contactPerson}</div>
              )}
              <div className="text-[11px] text-slate-600 mt-1 leading-normal whitespace-pre-line">
                {billingAddr}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-700 flex flex-wrap gap-x-3">
                {quotation.gstin && <span>GSTIN: <strong>{quotation.gstin}</strong></span>}
                {quotation.phone && <span>Tel: {quotation.phone}</span>}
                {quotation.email && <span>Email: {quotation.email}</span>}
              </div>
            </div>

            {/* Ship To / Technical Scope */}
            <div className="p-3.5 rounded border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Delivery / Consignee Location:
                </div>
                <div className="text-[11px] text-slate-700 leading-normal whitespace-pre-line">
                  {shippingAddr}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Quotation Subject:</span>
                  <span className="font-semibold text-slate-800">{quotation.subject || 'Custom Manufacturing & Supply'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 mt-0.5">
                  <span>Sales Representative:</span>
                  <span className="font-medium text-slate-800">{quotation.salespersonName || quotation.createdBy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2 px-2 text-center w-8 border-r border-slate-200">#</th>
                  <th className="py-2 px-3 border-r border-slate-200">Item Name & Technical Specifications</th>
                  <th className="py-2 px-2 text-center w-16 border-r border-slate-200">HSN/SAC</th>
                  <th className="py-2 px-2 text-right w-14 border-r border-slate-200">Qty</th>
                  <th className="py-2 px-2 text-center w-12 border-r border-slate-200">UOM</th>
                  <th className="py-2 px-2.5 text-right w-20 border-r border-slate-200">Unit Rate (₹)</th>
                  <th className="py-2 px-2.5 text-right w-20 border-r border-slate-200">Taxable (₹)</th>
                  <th className="py-2 px-2 text-center w-14 border-r border-slate-200">GST %</th>
                  <th className="py-2 px-2.5 text-right w-24">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {quotation.items?.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-2 text-center font-mono text-slate-500 border-r border-slate-200 align-top">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200 align-top">
                      <div className="font-bold text-slate-900 text-xs">{it.itemName}</div>
                      <div className="text-[10px] font-mono text-slate-500">Code: {it.itemCode}</div>
                      
                      {/* Manufacturing specs */}
                      {(it.description || it.technicalSpecifications || it.dimensions || it.materialGrade || it.drawingReference) && (
                        <div className="mt-1 text-[11px] text-slate-600 space-y-0.5 bg-slate-50 p-1.5 rounded border border-slate-150">
                          {it.description && <div>{it.description}</div>}
                          {it.technicalSpecifications && (
                            <div className="text-slate-700">Specs: {it.technicalSpecifications}</div>
                          )}
                          <div className="flex flex-wrap gap-x-3 text-[10px] text-slate-600 font-mono">
                            {it.materialGrade && <span>Grade: <strong>{it.materialGrade}</strong></span>}
                            {it.dimensions && <span>Dims: <strong>{it.dimensions}</strong></span>}
                            {it.drawingReference && <span>Dwg Ref: <strong>{it.drawingReference}</strong></span>}
                            {it.toleranceDetails && <span>Tol: <strong>{it.toleranceDetails}</strong></span>}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200 align-top">
                      {it.hsnSacCode || '8483'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 border-r border-slate-200 align-top">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-600 border-r border-slate-200 align-top">
                      {it.uom || 'Nos'}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-800 border-r border-slate-200 align-top">
                      {it.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-900 border-r border-slate-200 align-top">
                      {(it.taxableAmount !== undefined ? it.taxableAmount : (it.quantity * it.unitPrice)).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700 border-r border-slate-200 align-top">
                      {it.gstRate}%
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900 align-top">
                      {it.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Commercial Summary & GST Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
            {/* Left: Indian Words, Bank Details, and Notes */}
            <div className="sm:col-span-7 space-y-4">
              {/* Amount in words */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Amount Chargeable (in words):
                </span>
                <span className="text-xs font-bold text-slate-900 italic mt-0.5 block leading-snug">
                  {quotation.amountInWords || 'Rupees Only'}
                </span>
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Bank Details for RTGS / NEFT Remittance:
                </span>
                <div className="grid grid-cols-2 gap-x-4 font-mono text-slate-700">
                  <div>Bank: <strong>HDFC Bank Ltd</strong></div>
                  <div>Branch: <strong>Chakan Industrial MIDC</strong></div>
                  <div>A/C Name: <strong>Apex Precision Tech Pvt Ltd</strong></div>
                  <div>A/C No: <strong>50200084920194</strong></div>
                  <div>IFSC: <strong>HDFC0001234</strong></div>
                  <div>MICR: <strong>411240012</strong></div>
                </div>
              </div>

              {/* Customer Notes */}
              {(quotation.customerNotes || quotation.notes) && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Customer Remarks / Project Scope:
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {quotation.customerNotes || quotation.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Calculations Box */}
            <div className="sm:col-span-5 bg-slate-50 p-4 rounded border border-slate-200 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross Value):</span>
                <span>₹{quotation.subtotal.toFixed(2)}</span>
              </div>

              {quotation.discountAmount ? (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Discount {quotation.discountType === 'percentage' && quotation.discountValue ? `(${quotation.discountValue}%)` : ''}:</span>
                  <span>- ₹{quotation.discountAmount.toFixed(2)}</span>
                </div>
              ) : null}

              <div className="flex justify-between text-slate-900 font-semibold pt-1 border-t border-slate-200">
                <span>Taxable Value:</span>
                <span>₹{(quotation.taxableAmount !== undefined ? quotation.taxableAmount : quotation.subtotal).toFixed(2)}</span>
              </div>

              {/* GST Breakdown */}
              {isIntraState ? (
                <>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Central GST (CGST 9%):</span>
                    <span>₹{quotation.cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>State GST (SGST 9%):</span>
                    <span>₹{quotation.sgstAmount.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Integrated GST (IGST 18%):</span>
                  <span>₹{quotation.igstAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Additional charges */}
              {quotation.freightAmount ? (
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Freight / Logistics:</span>
                  <span>₹{quotation.freightAmount.toFixed(2)}</span>
                </div>
              ) : null}

              {quotation.packingAmount ? (
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Packing & Handling:</span>
                  <span>₹{quotation.packingAmount.toFixed(2)}</span>
                </div>
              ) : null}

              {quotation.otherCharges ? (
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Other Charges:</span>
                  <span>₹{quotation.otherCharges.toFixed(2)}</span>
                </div>
              ) : null}

              {quotation.roundOff ? (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Round Off:</span>
                  <span>{quotation.roundOff > 0 ? `+₹${quotation.roundOff.toFixed(2)}` : `-₹${Math.abs(quotation.roundOff).toFixed(2)}`}</span>
                </div>
              ) : null}

              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>Grand Total (INR):</span>
                <span className="text-base text-blue-700">₹{quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Standard Terms & Conditions */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-2">
              Commercial Terms & Statutory Conditions:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[11px] text-slate-600 leading-normal">
              <div>• <strong>Payment Terms:</strong> {quotation.paymentTerms || '50% advance with PO, balance against proforma.'}</div>
              <div>• <strong>Delivery Period:</strong> {quotation.deliveryPeriod || '2-3 weeks from confirmed PO & drawing approval.'}</div>
              <div>• <strong>Delivery Location:</strong> {quotation.deliveryLocation || 'Ex-Works Chakan MIDC Plant.'}</div>
              <div>• <strong>Transportation:</strong> {quotation.transportationTerms || 'Freight extra at actuals.'}</div>
              <div>• <strong>Packaging:</strong> {quotation.packingTerms || 'Standard seaworthy/palletized packing included.'}</div>
              <div>• <strong>Warranty:</strong> {quotation.warrantyTerms || '12 months against manufacturing defects.'}</div>
              <div>• <strong>Validity:</strong> {quotation.validityTerms || 'Quotation valid for 15 days.'}</div>
              <div>• <strong>Taxes & Duties:</strong> {quotation.taxesAndDuties || 'GST as applicable at actuals.'}</div>
            </div>
            {quotation.customTerms && (
              <div className="mt-2 p-2 bg-slate-50 rounded text-[11px] text-slate-700 border border-slate-200">
                <strong>Special Conditions:</strong> {quotation.customTerms}
              </div>
            )}
          </div>

          {/* Signatures & Footer */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 items-end">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Customer Acceptance:</div>
              <div className="text-[11px] text-slate-600 mt-1">We accept the rates, terms, and technical specifications detailed above.</div>
              <div className="mt-8 border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-500">
                Authorized Signatory & Rubber Stamp
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-700 uppercase">
                For {company?.name || 'Apex Precision Technologies Pvt Ltd'}
              </div>
              <div className="h-10 flex items-center justify-end">
                <span className="font-serif italic text-blue-900 text-sm font-semibold">Authorized Signatory</span>
              </div>
              <div className="border-t border-slate-900 pt-1 text-[10px] text-slate-600 font-medium">
                {quotation.approvedBy || quotation.salespersonName || 'Commercial Director'}
                <div className="text-[9px] text-slate-400 font-mono">Digitally verified through House of MSME OS</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
