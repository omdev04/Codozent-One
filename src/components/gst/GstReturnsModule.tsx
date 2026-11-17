import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Download,
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Gst2BMatchRecord } from '../../types/erp';

export const GstReturnsModule: React.FC = () => {
  const { 
    gstSummary, 
    gst2bRecords, 
    update2BAction, 
    invoices, 
    purchaseOrders,
    activeCompany 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'summary' | 'reconciliation' | 'rule37' | 'gstr3b'>('summary');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Calculate live GSTR-1 outward values from actual invoices
  const totalB2B = invoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);
  const totalCgst = invoices.reduce((sum, inv) => sum + (inv.cgstAmount || 0), 0);
  const totalSgst = invoices.reduce((sum, inv) => sum + (inv.sgstAmount || 0), 0);
  const totalIgst = invoices.reduce((sum, inv) => sum + (inv.igstAmount || 0), 0);
  const totalOutputTax = totalCgst + totalSgst + totalIgst;

  // Calculate 2B records
  const matchedRecords = gst2bRecords.filter(r => r.matchStatus === 'matched');
  const mismatchRecords = gst2bRecords.filter(r => r.matchStatus !== 'matched');
  const claimedItc = gst2bRecords
    .filter(r => r.itcAction === 'claim')
    .reduce((sum, r) => sum + (r.portalTaxAmount || r.booksTaxAmount || 0), 0);

  // Net 3B Calculation
  const netCashLiability = Math.max(0, totalOutputTax - claimedItc);

  const handleAction = async (id: string, action: 'claim' | 'hold' | 'reverse') => {
    setUpdatingId(id);
    try {
      await update2BAction(id, action);
    } catch (err: any) {
      alert(`Failed to update ITC action: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-canvas border-b border-hairline pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-nav mb-1">
            <span>Taxation & Statutory</span>
            <span>/</span>
            <span className="text-primary font-medium">GST Compliance Suite</span>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">GST Returns & 2B Reconciliation</h1>
          <p className="text-xs text-ink-body mt-0.5">
            GSTR-1 outward summary, GSTR-2B vs Books reconciliation, Section 16(4) Rule 37 180-day reversal, and GSTR-3B computation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-chrome px-2.5 py-1 rounded border border-hairline text-ink">
            GSTIN: {activeCompany?.gstin || '27AAACT2727Q1ZT'}
          </span>
          <button 
            onClick={() => alert('GSTIN Portal credentials synced. Records fresh as of today.')}
            className="btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Portal</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline space-x-6 text-xs">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          GSTR-1 Outward Summary
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'reconciliation'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          <span>GSTR-2B ITC Match</span>
          {mismatchRecords.length > 0 && (
            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-bold">
              {mismatchRecords.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rule37')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rule37'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Rule 37 (180-Day Rule)</span>
        </button>
        <button
          onClick={() => setActiveTab('gstr3b')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'gstr3b'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          GSTR-3B Tax Liability
        </button>
      </div>

      {/* Tab 1: GSTR-1 Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-chrome border border-hairline rounded-md">
              <span className="text-xs text-ink-nav">B2B Taxable Invoices</span>
              <div className="text-xl font-bold text-ink mt-1 font-mono">
                ₹{totalB2B.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-meta mt-1">{invoices.length} Registered Outward Invoices</div>
            </div>
            <div className="p-4 bg-chrome border border-hairline rounded-md">
              <span className="text-xs text-ink-nav">CGST (Central Tax)</span>
              <div className="text-xl font-bold text-ink mt-1 font-mono">
                ₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-meta mt-1">Intra-State 9%</div>
            </div>
            <div className="p-4 bg-chrome border border-hairline rounded-md">
              <span className="text-xs text-ink-nav">SGST (State Tax)</span>
              <div className="text-xl font-bold text-ink mt-1 font-mono">
                ₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-meta mt-1">Maharashtra State 9%</div>
            </div>
            <div className="p-4 bg-band-blue border border-hairline rounded-md">
              <span className="text-xs text-primary font-medium">Total Output Tax Liability</span>
              <div className="text-xl font-bold text-primary mt-1 font-mono">
                ₹{totalOutputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-ink-meta mt-1">Gross Tax Collected</div>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <div className="p-3 bg-chrome border-b border-hairline flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">GSTR-1 Section-wise Breakdown (Table 4A, 4B)</span>
              <button 
                onClick={() => alert('JSON exported for direct upload to GSTN portal')}
                className="btn-outline text-xs py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export GSTR-1 JSON</span>
              </button>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-chrome text-ink-nav">
                <tr className="border-b border-hairline">
                  <th className="py-2.5 px-3">Table No.</th>
                  <th className="py-2.5 px-3">Category Description</th>
                  <th className="py-2.5 px-3 text-right">Invoice Count</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value (₹)</th>
                  <th className="py-2.5 px-3 text-right">IGST (₹)</th>
                  <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                  <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                <tr>
                  <td className="py-3 px-3 font-mono font-medium">4A, 4B, 4C</td>
                  <td className="py-3 px-3 font-medium text-ink">B2B Supplies to Registered Taxpayers</td>
                  <td className="py-3 px-3 text-right font-mono">{invoices.length}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{totalB2B.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{totalIgst.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{totalCgst.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono">₹{totalSgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-ink-meta">7</td>
                  <td className="py-3 px-3 text-ink-nav">B2C (Small) Intra-state supplies</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">0</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹0.00</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹0.00</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹0.00</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹0.00</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-mono text-ink-meta">12</td>
                  <td className="py-3 px-3 text-ink-nav">HSN/SAC Wise Summary of Outward Supplies</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">{invoices.length}</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹{totalB2B.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹0.00</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹{totalCgst.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-ink-meta">₹{totalSgst.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: GSTR-2B ITC Match */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="p-3 bg-chrome border border-hairline rounded-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-ink">Reconciliation Status:</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {matchedRecords.length} Auto-Matched
              </span>
              {mismatchRecords.length > 0 && (
                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {mismatchRecords.length} Requires Action
                </span>
              )}
            </div>
            <div className="text-ink-nav">
              Eligible Claimed ITC: <strong className="text-primary font-mono">₹{claimedItc.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-chrome text-ink-nav">
                <tr className="border-b border-hairline">
                  <th className="py-2.5 px-3">Vendor GSTIN</th>
                  <th className="py-2.5 px-3">Vendor Trade Name</th>
                  <th className="py-2.5 px-3">Inv Number</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Books Tax (₹)</th>
                  <th className="py-2.5 px-3 text-right">2B Portal Tax (₹)</th>
                  <th className="py-2.5 px-3 text-center">Match Status</th>
                  <th className="py-2.5 px-3 text-center">ITC Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink-body">
                {gst2bRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-meta">
                      No GSTR-2B purchase records found. Connect portal or add purchase bills.
                    </td>
                  </tr>
                ) : (
                  gst2bRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-chrome/50">
                      <td className="py-3 px-3 font-mono text-primary font-medium">{r.supplierGstin}</td>
                      <td className="py-3 px-3 font-medium text-ink">{r.supplierName}</td>
                      <td className="py-3 px-3 font-mono">{r.invoiceNumber}</td>
                      <td className="py-3 px-3 text-ink-nav">{r.invoiceDate}</td>
                      <td className="py-3 px-3 text-right font-mono">₹{r.booksTaxAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium">₹{r.portalTaxAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          r.matchStatus === 'matched'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {r.matchStatus === 'matched' ? 'Matched' : r.matchStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleAction(r.id, 'claim')}
                            disabled={updatingId === r.id}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                              r.itcAction === 'claim'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-canvas text-ink-nav border-hairline hover:bg-chrome'
                            }`}
                          >
                            Claim
                          </button>
                          <button
                            onClick={() => handleAction(r.id, 'hold')}
                            disabled={updatingId === r.id}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                              r.itcAction === 'hold'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-canvas text-ink-nav border-hairline hover:bg-chrome'
                            }`}
                          >
                            Hold
                          </button>
                          <button
                            onClick={() => handleAction(r.id, 'reverse')}
                            disabled={updatingId === r.id}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                              r.itcAction === 'reverse'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-canvas text-ink-nav border-hairline hover:bg-chrome'
                            }`}
                          >
                            Reverse
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Rule 37 (180-Day ITC Reversal Rule) */}
      {activeTab === 'rule37' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Statutory Rule 37 CGST Act (180-Day Payment Check)</div>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                If the recipient of goods fails to pay the supplier the invoice amount plus taxes within <strong>180 days</strong> from the date of issuance of the invoice, the Input Tax Credit (ITC) claimed earlier must be reversed in Table 4(B)(2) of GSTR-3B along with interest @ 18% p.a. under Section 50.
              </p>
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Vendor Invoices Approaching / Exceeding 180 Days</span>
              <span className="text-xs text-ink-meta">Automated Aging Analysis</span>
            </div>

            <div className="p-6 text-center text-xs text-ink-meta border border-dashed border-hairline rounded bg-chrome/50">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
              <div className="text-ink font-medium">All active supplier bills are within the 180-day statutory window.</div>
              <p className="text-ink-nav mt-1">No mandatory Rule 37 ITC reversals required for this tax period.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: GSTR-3B Auto-Tax Liability */}
      {activeTab === 'gstr3b' && (
        <div className="space-y-4">
          <div className="bg-canvas border border-hairline rounded-md p-4">
            <h3 className="text-sm font-bold text-ink mb-1">GSTR-3B Summary of Net Tax Payable</h3>
            <p className="text-xs text-ink-nav mb-4">Final computation after offsetting Output Liability with Eligible Input Tax Credit.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-hairline pt-4">
              <div className="p-3 bg-chrome rounded border border-hairline">
                <span className="text-xs text-ink-nav">Gross Tax on Outward Supplies</span>
                <div className="text-xl font-bold font-mono text-ink mt-1">
                  ₹{totalOutputTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-ink-meta mt-1">From GSTR-1 Verified Invoices</div>
              </div>

              <div className="p-3 bg-chrome rounded border border-hairline">
                <span className="text-xs text-ink-nav">Less: Eligible ITC (GSTR-2B Claimed)</span>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                  - ₹{claimedItc.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-ink-meta mt-1">Matched vendor tax credits</div>
              </div>

              <div className="p-3 bg-band-blue rounded border border-primary/20">
                <span className="text-xs text-primary font-medium">Net Tax Payable in Cash</span>
                <div className="text-xl font-bold font-mono text-primary mt-1">
                  ₹{netCashLiability.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-ink-meta mt-1">Payable via PMT-06 Challan</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                onClick={() => alert('CPIN Challan generated with net tax liability.')}
                className="btn-primary text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Generate GST PMT-06 Challan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
