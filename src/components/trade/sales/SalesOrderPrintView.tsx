import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { SalesOrder } from '../../../types/erp';
import { useERP } from '../../../context/ERPContext';
import { formatIndianCurrency, numberToIndianWords } from '../../../utils/indianCurrency';

interface SalesOrderPrintViewProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SalesOrderPrintView: React.FC<SalesOrderPrintViewProps> = ({
  order,
  isOpen,
  onClose
}) => {
  const { activeCompany } = useERP();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 flex flex-col print:m-0 print:shadow-none print:w-full print:rounded-none">
        {/* Floating Print Action Bar (Hidden on print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl print:hidden">
          <span className="text-sm font-semibold text-slate-700">
            A4 Order Confirmation Preview — {order.soNumber}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* A4 Printable Sheet */}
        <div className="p-8 sm:p-12 text-slate-900 font-sans text-xs flex-1 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{activeCompany.name}</h1>
              <p className="text-slate-600 mt-1 max-w-md">
                Plot No. 42, Sector 10, MIDC Industrial Area, Bhosari, Pune - 411026, Maharashtra, India
              </p>
              <div className="mt-2 text-slate-700 space-y-0.5">
                <div><span className="font-semibold">GSTIN:</span> {activeCompany.gstin || '27AAACA1234A1Z5'}</div>
                <div><span className="font-semibold">PAN:</span> {activeCompany.pan || 'AAACA1234A'} | <span className="font-semibold">Email:</span> orders@Codozent One.in</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase font-extrabold tracking-widest text-blue-800 bg-blue-50 px-3 py-1 rounded inline-block border border-blue-200">
                Order Confirmation
              </div>
              <div className="mt-3 text-lg font-bold font-mono text-slate-900">{order.soNumber}</div>
              <div className="text-slate-500 mt-0.5">Date: {order.orderDate}</div>
            </div>
          </div>

          {/* Reference & Party Grid */}
          <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Customer / Buyer</span>
              <div className="text-sm font-bold text-slate-900 mt-1">{order.customerName}</div>
              <p className="text-slate-600 mt-1 whitespace-pre-line">{order.billingAddress || 'Plant address on record'}</p>
              {order.customerGstin && (
                <div className="mt-2 text-slate-700">
                  <span className="font-semibold">GSTIN:</span> <span className="font-mono">{order.customerGstin}</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5 text-right sm:text-left sm:pl-8 border-l border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Order Commitment</span>
              <div className="grid grid-cols-2 gap-1 text-slate-700 pt-1">
                <span className="text-slate-500 font-medium">Customer PO Ref:</span>
                <span className="font-semibold text-slate-900 font-mono">{order.customerPoNumber || 'Verbal / Direct'}</span>

                <span className="text-slate-500 font-medium">PO Date:</span>
                <span>{order.customerPoDate || order.orderDate}</span>

                <span className="text-slate-500 font-medium">Promised Delivery:</span>
                <span className="font-semibold text-blue-700">{order.deliveryDate || 'Within 14 days'}</span>

                <span className="text-slate-500 font-medium">Payment Terms:</span>
                <span>{order.paymentTerms || `${order.advancePercentage || 20}% Advance`}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table with Drawings & Tolerances */}
          <div className="py-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 text-slate-700 font-semibold text-[11px] uppercase">
                  <th className="py-2.5 px-2 text-center w-8">#</th>
                  <th className="py-2.5 px-3">Description & Engineering Specs</th>
                  <th className="py-2.5 px-2 text-center">HSN</th>
                  <th className="py-2.5 px-2 text-right">Qty</th>
                  <th className="py-2.5 px-2 text-right">Unit Rate</th>
                  <th className="py-2.5 px-2 text-right">Taxable</th>
                  <th className="py-2.5 px-2 text-right">GST</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((itm, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-3 px-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{itm.itemName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Code: {itm.itemCode}</div>

                      {/* Made-to-order manufacturing specs */}
                      {(itm.drawingRef || itm.materialGrade || itm.tolerance) && (
                        <div className="mt-1 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 space-x-2">
                          {itm.drawingRef && <span><strong>Drw:</strong> {itm.drawingRef}</span>}
                          {itm.materialGrade && <span>• <strong>Grade:</strong> {itm.materialGrade}</span>}
                          {itm.tolerance && <span>• <strong>Tol:</strong> {itm.tolerance}</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-600">{itm.hsnSacCode || '8483'}</td>
                    <td className="py-3 px-2 text-right font-semibold text-slate-800">
                      {itm.quantity} {itm.uom || 'Nos'}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-700">{formatIndianCurrency(itm.unitPrice, false)}</td>
                    <td className="py-3 px-2 text-right text-slate-700">
                      {formatIndianCurrency(itm.taxableAmount || (itm.quantity * itm.unitPrice))}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-600">{itm.gstRate || 18}%</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatIndianCurrency(itm.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Commercial & Statutory Summary */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t-2 border-slate-300">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Amount in Words:</div>
              <div className="text-xs font-semibold text-slate-800 italic mt-0.5">
                {numberToIndianWords(order.grandTotal)}
              </div>

              {/* Statutory Terms */}
              <div className="mt-6 text-[10px] text-slate-500 space-y-1">
                <div className="font-bold uppercase text-slate-700">Terms & Conditions of Supply:</div>
                <div>1. Delivery subject to receipt of approved drawings and specified material.</div>
                <div>2. Standard tolerance applicable as per ISO 2768-m unless specified otherwise.</div>
                <div>3. Goods once confirmed cannot be cancelled without written approval and scrap compensation.</div>
                <div>4. Pune jurisdiction for all legal disputes.</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Subtotal (Gross):</span>
                <span className="font-semibold text-slate-900">{formatIndianCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Taxable Amount:</span>
                <span className="font-semibold text-slate-900">{formatIndianCurrency(order.taxableAmount || order.subtotal)}</span>
              </div>
              {order.cgstAmount > 0 && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Central GST (CGST 9%):</span>
                    <span className="font-semibold text-slate-900">{formatIndianCurrency(order.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">State GST (SGST 9%):</span>
                    <span className="font-semibold text-slate-900">{formatIndianCurrency(order.sgstAmount)}</span>
                  </div>
                </>
              )}
              {order.igstAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Integrated GST (IGST 18%):</span>
                  <span className="font-semibold text-slate-900">{formatIndianCurrency(order.igstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                <span>Grand Total (INR):</span>
                <span className="text-blue-900">{formatIndianCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signature Block */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 items-end">
            <div className="text-[11px] text-slate-500">
              Customer Acknowledgement / Acceptance Stamp
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">For {activeCompany.name}</div>
              <div className="h-12"></div>
              <div className="text-[11px] text-slate-600 font-semibold">Authorized Signatory / Plant Manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
