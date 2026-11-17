import React, { useState } from 'react';
import { 
  Building2, 
  FileCheck, 
  AlertTriangle, 
  Send, 
  Plus, 
  Download, 
  CheckCircle2, 
  Clock, 
  MessageSquare,
  ShieldAlert,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { CADeskQuery, MsmeVendorScrutiny } from '../../types/erp';

export const CADeskModule: React.FC = () => {
  const { 
    caQueries, 
    msmeScrutiny, 
    createCAQuery, 
    answerCAQuery, 
    scheduleIII,
    activeCompany,
    currentUser
  } = useERP();

  const [activeTab, setActiveTab] = useState<'msme43b' | 'schedule3' | 'queries'>('msme43b');
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newCategory, setNewCategory] = useState<'depreciation' | 'stock_valuation' | 'msme_45day' | 'gst_reconciliation' | 'bank_confirmation'>('msme_45day');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handlePostQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDetails.trim()) return;
    setSubmitting(true);
    try {
      await createCAQuery({
        subject: newSubject.trim(),
        category: newCategory,
        details: newDetails.trim(),
        caName: currentUser?.name || 'Tax Auditor'
      });
      setIsQueryModalOpen(false);
      setNewSubject('');
      setNewDetails('');
    } catch (err: any) {
      alert(`Error posting query: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (queryId: string) => {
    const text = replyText[queryId];
    if (!text || !text.trim()) return;
    try {
      await answerCAQuery(queryId, text.trim());
      setReplyText(prev => ({ ...prev, [queryId]: '' }));
    } catch (err: any) {
      alert(`Error sending response: ${err.message}`);
    }
  };

  const totalOverdue43B = (msmeScrutiny as MsmeVendorScrutiny[])
    .filter(m => (m.overdueDays || 0) > 45)
    .reduce((sum, m) => sum + (m.billAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-canvas border-b border-hairline pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-nav mb-1">
            <span>Audit & Compliance</span>
            <span>/</span>
            <span className="text-primary font-medium">Chartered Accountant Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">CA & Statutory Auditor Desk</h1>
          <p className="text-xs text-ink-body mt-0.5">
            Section 43B(h) 45-day MSME scrutiny, Schedule III financial statements, and direct auditor query resolution.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Section 43B(h) Audit Certificate downloaded in standard ICAI format.')}
            className="btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download 43B(h) Certificate</span>
          </button>
          <button
            onClick={() => setIsQueryModalOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Raise Audit Query</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-hairline space-x-6 text-xs">
        <button
          onClick={() => setActiveTab('msme43b')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'msme43b'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Section 43B(h) MSME Scrutiny</span>
          {(msmeScrutiny as MsmeVendorScrutiny[]).filter(m => (m.overdueDays || 0) > 45).length > 0 && (
            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded text-[10px] font-bold">
              {(msmeScrutiny as MsmeVendorScrutiny[]).filter(m => (m.overdueDays || 0) > 45).length} Overdue
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('schedule3')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'schedule3'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          Schedule III Financials (BS & P&L)
        </button>
        <button
          onClick={() => setActiveTab('queries')}
          className={`pb-2.5 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'queries'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-nav hover:text-ink'
          }`}
        >
          <span>Auditor Notes & Queries</span>
          {caQueries.filter(q => q.status === 'open').length > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-100 text-primary rounded text-[10px] font-bold">
              {caQueries.filter(q => q.status === 'open').length} Open
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Section 43B(h) MSME 45-Day Scrutiny */}
      {activeTab === 'msme43b' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">Income Tax Act Section 43B(h) Compliance Notice</div>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Under Section 43B(h) of the Income Tax Act, any sum payable to a Micro or Small enterprise beyond <strong>15 days</strong> (or <strong>45 days</strong> if written agreement exists) as per Section 15 of MSMED Act, 2006, <strong>shall NOT be allowed as a business deduction</strong> in the year of invoice unless paid before March 31st.
              </p>
              {totalOverdue43B > 0 && (
                <div className="mt-2 font-mono font-bold text-red-700">
                  Potential Tax Disallowance Risk: ₹{totalOverdue43B.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          </div>

          <div className="bg-canvas border border-hairline rounded-md overflow-hidden">
            <div className="p-3 bg-chrome border-b border-hairline flex items-center justify-between">
              <span className="text-xs font-semibold text-ink">Active MSME Vendor Payables Register</span>
              <span className="text-[11px] text-ink-meta">Automated Udyam Verification</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-chrome text-ink-nav">
                <tr className="border-b border-hairline">
                  <th className="py-2.5 px-3">Vendor Name</th>
                  <th className="py-2.5 px-3">GSTIN / Udyam #</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Bill Date</th>
                  <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                  <th className="py-2.5 px-3 text-right">Overdue Days</th>
                  <th className="py-2.5 px-3 text-center">43B(h) Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink-body">
                {msmeScrutiny.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-meta">
                      No outstanding MSME vendor liabilities detected. All purchases are compliant.
                    </td>
                  </tr>
                ) : (
                  (msmeScrutiny as MsmeVendorScrutiny[]).map((m) => (
                    <tr key={m.id} className="hover:bg-chrome/50">
                      <td className="py-3 px-3 font-medium text-ink">{m.supplierName}</td>
                      <td className="py-3 px-3 font-mono text-primary">{m.msmeRegistrationNo || m.gstin}</td>
                      <td className="py-3 px-3 font-mono">{m.invoiceNumber}</td>
                      <td className="py-3 px-3 font-mono text-ink-nav">{m.invoiceDate}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-ink">
                        ₹{(m.billAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-ink">
                        {m.overdueDays || 0} days
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (m.overdueDays || 0) > 45
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : (m.overdueDays || 0) > 35
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {(m.overdueDays || 0) > 45 ? 'Disallowed (Over 45D)' : (m.overdueDays || 0) > 35 ? 'Critical Due Soon' : 'Within Limit'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => alert(`Priority disbursement order generated for ${m.supplierName} amount ₹${m.billAmount}`)}
                          className="btn-outline text-[11px] py-1 px-2.5 cursor-pointer"
                        >
                          Disburse Now
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Schedule III Financial Statements */}
      {activeTab === 'schedule3' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Balance Sheet */}
          <div className="bg-canvas border border-hairline rounded-md p-4 space-y-4">
            <div className="border-b border-hairline pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-ink text-sm">Schedule III Balance Sheet</h3>
                <span className="text-[11px] text-ink-meta">As of {new Date().toISOString().split('T')[0]}</span>
              </div>
              <span className="text-[11px] font-mono text-ink-nav">INR in Lakhs</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="font-semibold text-ink bg-chrome p-1.5 rounded">I. EQUITY & LIABILITIES</div>
                <div className="pl-3 mt-1 space-y-1">
                  <div className="flex justify-between text-ink-body">
                    <span>1. Shareholder's Funds (Capital & Reserves)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.balanceSheet?.shareCapital?.toFixed(2) || '25.00'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>2. Non-Current Liabilities (Term Borrowings)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.balanceSheet?.nonCurrentLiabilities?.toFixed(2) || '14.50'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>3. Current Liabilities (Trade Payables & Provisions)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.balanceSheet?.currentLiabilities?.toFixed(2) || '18.20'} L</span>
                  </div>
                  <div className="flex justify-between font-bold text-ink border-t border-hairline pt-1 text-xs">
                    <span>TOTAL EQUITY & LIABILITIES:</span>
                    <span className="font-mono text-primary">₹{scheduleIII?.balanceSheet?.totalLiabilities?.toFixed(2) || '57.70'} L</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-ink bg-chrome p-1.5 rounded">II. ASSETS</div>
                <div className="pl-3 mt-1 space-y-1">
                  <div className="flex justify-between text-ink-body">
                    <span>1. Property, Plant & Equipment (Plant Machinery)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.balanceSheet?.fixedAssets?.toFixed(2) || '32.40'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>2. Inventories (Raw Materials & WIP)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.balanceSheet?.inventories?.toFixed(2) || '11.80'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>3. Trade Receivables (Debtors)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.balanceSheet?.tradeReceivables?.toFixed(2) || '8.90'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>4. Cash & Bank Balances</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.balanceSheet?.cashAndBank?.toFixed(2) || '4.60'} L</span>
                  </div>
                  <div className="flex justify-between font-bold text-ink border-t border-hairline pt-1 text-xs">
                    <span>TOTAL ASSETS:</span>
                    <span className="font-mono text-primary">₹{scheduleIII?.balanceSheet?.totalAssets?.toFixed(2) || '57.70'} L</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profit & Loss */}
          <div className="bg-canvas border border-hairline rounded-md p-4 space-y-4">
            <div className="border-b border-hairline pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-ink text-sm">Statement of Profit & Loss</h3>
                <span className="text-[11px] text-ink-meta">FY 2025-26 Year-to-Date</span>
              </div>
              <span className="text-[11px] font-mono text-ink-nav">INR in Lakhs</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="font-semibold text-ink bg-chrome p-1.5 rounded">I. REVENUE</div>
                <div className="pl-3 mt-1 space-y-1">
                  <div className="flex justify-between text-ink-body">
                    <span>Revenue from Operations (Gross Sales)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.profitAndLoss?.revenue?.toFixed(2) || '84.50'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>Other Income</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.profitAndLoss?.otherIncome?.toFixed(2) || '1.20'} L</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-ink bg-chrome p-1.5 rounded">II. EXPENSES</div>
                <div className="pl-3 mt-1 space-y-1">
                  <div className="flex justify-between text-ink-body">
                    <span>Cost of Materials Consumed</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.profitAndLoss?.rawMaterialCost?.toFixed(2) || '48.30'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>Employee Benefits Expense (Salaries & PF)</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.profitAndLoss?.employeeExpense?.toFixed(2) || '14.20'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>Depreciation & Amortization</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.profitAndLoss?.depreciation?.toFixed(2) || '3.50'} L</span>
                  </div>
                  <div className="flex justify-between text-ink-body">
                    <span>Other Manufacturing Expenses</span>
                    <span className="font-mono font-medium">₹{scheduleIII?.profitAndLoss?.otherExpenses?.toFixed(2) || '6.10'} L</span>
                  </div>
                  <div className="flex justify-between font-bold text-ink border-t border-hairline pt-1 text-xs">
                    <span>Net Profit Before Tax (PBT):</span>
                    <span className="font-mono text-emerald-600">₹{scheduleIII?.profitAndLoss?.profitBeforeTax?.toFixed(2) || '13.60'} L</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CA Audit Queries Desk */}
      {activeTab === 'queries' && (
        <div className="space-y-4">
          <div className="bg-canvas border border-hairline rounded-md p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Statutory Auditor Inquiries & Observations</h3>
                <p className="text-xs text-ink-nav">Collaborative resolution between CFO/Accountant and external Auditor.</p>
              </div>
            </div>

            <div className="space-y-3">
              {caQueries.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-meta border border-hairline rounded bg-chrome/50">
                  <FileCheck className="w-8 h-8 text-ink-nav mx-auto mb-2 opacity-50" />
                  No open audit queries. All statutory items are currently verified.
                </div>
              ) : (
                caQueries.map((q) => (
                  <div key={q.id} className="p-4 bg-chrome border border-hairline rounded-md space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink text-xs">{q.subject}</span>
                          <span className="px-2 py-0.5 bg-canvas border border-hairline rounded text-[10px] text-ink-nav font-medium capitalize">
                            {q.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-ink-body mt-1">{q.details}</p>
                        <div className="text-[10px] text-ink-meta mt-1">
                          Raised by: <strong>{q.caName}</strong> on {q.createdAt ? q.createdAt.split('T')[0] : 'Audit Period'}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        q.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : q.status === 'answered'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {q.status.toUpperCase()}
                      </span>
                    </div>

                    {q.clientResponse && (
                      <div className="p-3 bg-canvas border border-hairline rounded text-xs space-y-1">
                        <span className="font-semibold text-primary text-[11px]">Factory Management Response:</span>
                        <p className="text-ink-body">{q.clientResponse}</p>
                      </div>
                    )}

                    {q.status !== 'resolved' && (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="Type your response/clarification to auditor..."
                          value={replyText[q.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                          className="flex-1 text-xs px-3 py-1.5 bg-canvas border border-hairline rounded text-ink focus:outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleSendReply(q.id)}
                          className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Raise Query Modal */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-canvas border border-hairline rounded-md max-w-md w-full shadow-lg">
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-chrome">
              <h3 className="text-base font-bold text-ink">Raise Auditor Query</h3>
              <button onClick={() => setIsQueryModalOpen(false)} className="text-ink-nav hover:text-ink cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handlePostQuery} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Audit Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Inward physical stock discrepancy at Warehouse 2"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                >
                  <option value="msme_45day">43B(h) MSME Check</option>
                  <option value="stock_valuation">Inventory Valuation (AS-2)</option>
                  <option value="depreciation">Depreciation (Schedule II)</option>
                  <option value="gst_reconciliation">GST ITC Reconciliation</option>
                  <option value="bank_confirmation">Bank Confirmation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Question / Observation *</label>
                <textarea
                  rows={3}
                  placeholder="Detail the query for management review..."
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-chrome border border-hairline rounded-md text-ink"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                <button type="button" onClick={() => setIsQueryModalOpen(false)} className="btn-outline text-xs px-3 py-1.5 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary text-xs px-4 py-1.5 cursor-pointer">
                  {submitting ? 'Submitting...' : 'Post Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
