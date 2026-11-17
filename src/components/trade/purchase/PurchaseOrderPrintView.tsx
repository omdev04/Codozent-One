import React from 'react';
import { Printer, X } from 'lucide-react';
import { PurchaseOrder } from '../../../types/erp';
import { useERP } from '../../../context/ERPContext';
import { formatIndianCurrency, numberToIndianWords } from '../../../utils/indianCurrency';

interface PurchaseOrderPrintViewProps {
  po: PurchaseOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseOrderPrintView: React.FC<PurchaseOrderPrintViewProps> = ({
  po,
  isOpen,
  onClose
}) => {
  const { activeCompany } = useERP();

  if (!isOpen || !po) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 flex flex-col print:m-0 print:shadow-none print:w-full print:rounded-none">
        {/* Floating Print Bar (Hidden on print) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl print:hidden">
          <span className="text-sm font-semibold text-slate-700">
            A4 Purchase Order Preview — {po.poNumber}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
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
                <div><span className="font-semibold">PAN:</span> {activeCompany.pan || 'AAACA1234A'} | <span className="font-semibold">Email:</span> purchase@Codozent One.in</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase font-extrabold tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded inline-block border border-emerald-200">
                Purchase Order
              </div>
              <div className="mt-3 text-lg font-bold font-mono text-slate-900">{po.poNumber}</div>
              <div className="text-slate-500 mt-0.5">Date: {po.orderDate}</div>
            </div>
          </div>

          {/* Supplier & Delivery Reference */}
          <div className="grid grid-cols-2 gap-6 py-4 border-b border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vendor / Supplier</span>
              <div className="text-sm font-bold text-slate-900 mt-1">{po.supplierName}</div>
              <p className="text-slate-600 mt-1">Vendor Plant / Office address on record</p>
            </div>
            <div className="space-y-1.5 text-right sm:text-left sm:pl-8 border-l border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivery Instructions</span>
              <div className="grid grid-cols-2 gap-1 text-slate-700 pt-1">
                <span className="text-slate-500 font-medium">Expected Date:</span>
                <span className="font-bold text-blue-700">{po.expectedDate}</span>

                <span className="text-slate-500 font-medium">Delivery Godown:</span>
                <span>{po.deliveryGodown || 'Central Plant Stores'}</span>

                <span className="text-slate-500 font-medium">Payment Terms:</span>
                <span>{po.paymentTerms || '30 Days Net'}</span>

                <span className="text-slate-500 font-medium">Tolerance Allowed:</span>
                <span className="font-semibold text-emerald-700">±{po.tolerancePercentage || 5}% on Qty</span>
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-50 text-slate-700 font-semibold text-[11px] uppercase">
                  <th className="py-2.5 px-2 text-center w-8">#</th>
                  <th className="py-2.5 px-3">Material Description & Specs</th>
                  <th className="py-2.5 px-2 text-center">HSN</th>
                  <th className="py-2.5 px-2 text-right">Quantity</th>
                  <th className="py-2.5 px-2 text-right">Unit Rate (₹)</th>
                  <th className="py-2.5 px-2 text-right">Taxable</th>
                  <th className="py-2.5 px-2 text-right">GST</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {po.items.map((itm, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-3 px-2 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{itm.itemName}</div>
                      {itm.specs && <div className="text-[11px] text-slate-500">{itm.specs}</div>}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-600">{itm.hsnSac || '7228'}</td>
                    <td className="py-3 px-2 text-right font-semibold text-slate-800">{itm.quantity}</td>
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
              <div className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">Total in Words:</div>
              <div className="text-xs font-semibold text-slate-800 italic mt-0.5">
                {numberToIndianWords(po.grandTotal)}
              </div>

              <div className="mt-6 text-[10px] text-slate-500 space-y-1">
                <div className="font-bold uppercase text-slate-700">Standard Purchase Conditions:</div>
                <div>1. Quality Inspection at buyer's factory store will be final.</div>
                <div>2. Rejected material must be replaced or credited within 7 business days.</div>
                <div>3. Mention PO Number on all delivery challans and tax invoices.</div>
                <div>4. Delivery tolerance of ±{po.tolerancePercentage || 5}% accepted for bulk weight.</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Taxable Value:</span>
                <span className="font-semibold text-slate-900">{formatIndianCurrency(po.taxableAmount || po.subtotal)}</span>
              </div>
              {po.cgstAmount > 0 && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">CGST (9%):</span>
                    <span className="font-semibold text-slate-900">{formatIndianCurrency(po.cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">SGST (9%):</span>
                    <span className="font-semibold text-slate-900">{formatIndianCurrency(po.sgstAmount)}</span>
                  </div>
                </>
              )}
              {po.igstAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">IGST (18%):</span>
                  <span className="font-semibold text-slate-900">{formatIndianCurrency(po.igstAmount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-bold text-slate-900">
                <span>Grand Total (INR):</span>
                <span className="text-emerald-800">{formatIndianCurrency(po.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Signature Block */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 items-end">
            <div className="text-[11px] text-slate-500">
              Vendor Order Acknowledgement Stamp & Signature
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">For {activeCompany.name}</div>
              <div className="h-12"></div>
              <div className="text-[11px] text-slate-600 font-semibold">Authorized Purchase Executive</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
