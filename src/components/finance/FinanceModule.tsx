import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Receipt, 
  IndianRupee, 
  CheckCircle2, 
  Printer, 
  Download, 
  Building,
  CreditCard,
  QrCode,
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Invoice, Payment } from '../../types/erp';

export const FinanceModule: React.FC = () => {
  const { 
    invoices, 
    payments, 
    chartOfAccounts, 
    recordPayment, 
    customers, 
    activeCompany 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'gst' | 'ledger'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<Invoice | null>(null);

  // New Payment State
  const [partnerType, setPartnerType] = useState<'customer_receipt' | 'supplier_payment'>('customer_receipt');
  const [partnerId, setPartnerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(50000);
  const [paymentMode, setPaymentMode] = useState('bank_transfer_neft_rtgs');
  const [refNo, setRefNo] = useState('');

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // GST calculations
  const totalTaxable = invoices.reduce((acc, i) => acc + i.subtotal, 0);
  const totalCGST = invoices.reduce((acc, i) => acc + i.cgstAmount, 0);
  const totalSGST = invoices.reduce((acc, i) => acc + i.sgstAmount, 0);
  const totalIGST = invoices.reduce((acc, i) => acc + i.igstAmount, 0);
  const totalGST = totalCGST + totalSGST + totalIGST;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === partnerId);
    recordPayment(
      partnerType,
      partnerId,
      customer?.name || 'Customer Partner',
      paymentAmount,
      paymentMode,
      refNo || `UTR${Date.now().toString().slice(-8)}`
    );
    setIsPaymentModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-report-green" />
            Finance, GST & Invoicing
          </h1>
          <p className="text-xs text-ink-muted">
            Indian GST compliance (GSTR-1 / GSTR-3B), e-Invoicing, double-entry General Ledger & receivable/payable aging
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-surface-1 border border-hairline rounded-lg p-0.5 shadow-card">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'invoices' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Tax Invoices
            </button>
            <button
              onClick={() => setActiveTab('gst')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'gst' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              GST Returns (1 & 3B)
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'payments' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Receipts & Vouchers
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'ledger' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              General Ledger
            </button>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoices by #, partner..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink"
            />
          </div>

          <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Customer / Partner</th>
                    <th className="px-3 py-3">GSTIN</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right">CGST + SGST (18%)</th>
                    <th className="px-4 py-3 text-right font-bold">Total (₹)</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">
                        {inv.invoiceNumber}
                        {inv.gstIrn && (
                          <div className="text-[9px] text-report-green font-mono">e-Invoice IRN Active</div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {inv.partnerName}
                      </td>
                      <td className="px-3 py-3 font-mono text-ink-muted">{inv.partnerGstin}</td>
                      <td className="px-3 py-3 text-ink-muted">{inv.invoiceDate}</td>
                      <td className="px-4 py-3 text-right font-mono text-ink">
                        ₹{inv.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-muted">
                        ₹{(inv.cgstAmount + inv.sgstAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          inv.status === 'paid'
                            ? 'bg-green-100 text-report-green'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedInvoiceToPrint(inv)}
                          className="px-2.5 py-1 text-[11px] font-medium text-ink bg-surface-1 border border-hairline hover:border-ink rounded transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View & Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gst' && (
        <div className="space-y-6">
          {/* GST Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card">
              <div className="text-[11px] font-medium text-ink-subtle">Total Taxable Outward</div>
              <div className="text-xl font-bold font-mono text-ink mt-1">
                ₹{totalTaxable.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card">
              <div className="text-[11px] font-medium text-ink-subtle">Central Tax (CGST 9%)</div>
              <div className="text-xl font-bold font-mono text-report-blue mt-1">
                ₹{totalCGST.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card">
              <div className="text-[11px] font-medium text-ink-subtle">State Tax (SGST 9%)</div>
              <div className="text-xl font-bold font-mono text-report-blue mt-1">
                ₹{totalSGST.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card">
              <div className="text-[11px] font-medium text-ink-subtle">Total GST Output Liability</div>
              <div className="text-xl font-bold font-mono text-fin-orange mt-1">
                ₹{totalGST.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* GSTR-1 & GSTR-3B Details */}
          <div className="bg-surface-1 rounded-xl border border-hairline p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-sm font-bold text-ink">GSTR-1 B2B Invoices Register</h3>
                <p className="text-[11px] text-ink-muted">For electronic filing with GSTN portal</p>
              </div>
              <button className="px-3 py-1.5 text-xs font-semibold text-ink bg-surface-1 border border-hairline hover:border-ink rounded-md flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>Export GSTR-1 JSON</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/40 border-b border-hairline font-semibold text-ink">
                  <tr>
                    <th className="px-3 py-2.5">GSTIN of Recipient</th>
                    <th className="px-3 py-2.5">Receiver Name</th>
                    <th className="px-3 py-2.5">Invoice No</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-right">Invoice Value</th>
                    <th className="px-3 py-2.5">Place of Supply (POS)</th>
                    <th className="px-3 py-2.5 text-right">Taxable Val</th>
                    <th className="px-3 py-2.5 text-right">Integrated Tax</th>
                    <th className="px-3 py-2.5 text-right">Central Tax</th>
                    <th className="px-3 py-2.5 text-right">State Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-mono">
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2.5 text-ink">{inv.partnerGstin}</td>
                      <td className="px-3 py-2.5 font-sans font-medium text-ink">{inv.partnerName}</td>
                      <td className="px-3 py-2.5 text-ink">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2.5 text-ink-muted">{inv.invoiceDate}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-ink">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 font-sans text-ink-muted">27-Maharashtra</td>
                      <td className="px-3 py-2.5 text-right text-ink">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 text-right text-ink-subtle">₹0</td>
                      <td className="px-3 py-2.5 text-right text-report-blue">₹{inv.cgstAmount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 text-right text-report-blue">₹{inv.sgstAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                <tr>
                  <th className="px-4 py-3">Receipt / Voucher #</th>
                  <th className="px-4 py-3">Partner Name</th>
                  <th className="px-3 py-3">Payment Type</th>
                  <th className="px-3 py-3">Mode</th>
                  <th className="px-3 py-3 font-mono">Bank Reference #</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">{p.paymentNumber}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{p.partnerName}</td>
                    <td className="px-3 py-3 capitalize">{p.paymentType.replace('_', ' ')}</td>
                    <td className="px-3 py-3 uppercase text-[11px] font-mono text-ink-muted">{p.paymentMode.replace('_', ' ')}</td>
                    <td className="px-3 py-3 font-mono text-ink">{p.referenceNumber}</td>
                    <td className="px-3 py-3 text-ink-muted">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-report-green">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-report-green uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="px-4 py-3 bg-surface-2/40 border-b border-hairline text-xs font-semibold text-ink">
            Standard Chart of Accounts (COA) Balances
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-1 border-b border-hairline text-ink-subtle font-medium">
                <tr>
                  <th className="px-4 py-3">Account Code</th>
                  <th className="px-4 py-3">Account Title</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Closing Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {chartOfAccounts.map(coa => (
                  <tr key={coa.id} className="hover:bg-canvas/50">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">{coa.accountCode}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{coa.accountName}</td>
                    <td className="px-3 py-3 uppercase text-[10px] font-bold text-ink-muted">{coa.accountType}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                      ₹{coa.balance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <Receipt className="w-4 h-4 text-report-green" />
                Record Payment / Bank Receipt
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Customer / Partner</label>
                <select
                  required
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Outstanding: ₹{c.outstandingBalance.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Amount Received (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="bank_transfer_neft_rtgs">NEFT / RTGS / IMPS</option>
                    <option value="upi">UPI Corporate</option>
                    <option value="cheque">Cheque</option>
                    <option value="cash">Petty Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Bank UTR / Ref #</label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    placeholder="e.g. HDFC26110299881"
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-report-green hover:bg-green-700 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Post Receipt Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE GST TAX INVOICE MODAL */}
      {selectedInvoiceToPrint && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-lift border border-hairline">
            <div className="px-6 py-4 bg-surface-2/40 border-b border-hairline flex items-center justify-between no-print">
              <span className="text-xs font-bold text-ink">Printable GST Tax Invoice</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-ink text-white rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Invoice
                </button>
                <button onClick={() => setSelectedInvoiceToPrint(null)} className="p-1 text-ink-muted hover:text-ink">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actual Printable Invoice Layout */}
            <div className="p-8 space-y-6 printable-document text-ink">
              <div className="flex justify-between items-start border-b border-ink/20 pb-4">
                <div>
                  <h1 className="text-xl font-bold">{activeCompany.name}</h1>
                  <p className="text-xs text-ink-muted mt-0.5">{activeCompany.address}</p>
                  <p className="text-xs text-ink-muted">GSTIN: {activeCompany.gstin} · PAN: {activeCompany.pan}</p>
                  <p className="text-xs text-ink-muted">State: {activeCompany.state} ({activeCompany.stateCode})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-report-blue border border-report-blue px-2 py-0.5 rounded">
                    TAX INVOICE (ORIGINAL FOR RECIPIENT)
                  </span>
                  <div className="font-mono font-bold text-base mt-2">{selectedInvoiceToPrint.invoiceNumber}</div>
                  <div className="text-xs text-ink-muted">Date: {selectedInvoiceToPrint.invoiceDate}</div>
                </div>
              </div>

              {/* Billed to */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-hairline rounded-lg">
                  <span className="font-bold text-ink-muted uppercase">Billed To (Customer):</span>
                  <div className="font-bold text-sm mt-1">{selectedInvoiceToPrint.partnerName}</div>
                  <div className="font-mono mt-0.5">GSTIN: {selectedInvoiceToPrint.partnerGstin}</div>
                  <div className="text-ink-muted mt-0.5">Place of Supply: 27-Maharashtra</div>
                </div>
                <div className="p-3 border border-hairline rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-ink-muted uppercase">E-Invoice Portal Details:</span>
                    <div className="font-mono text-[10px] break-all text-ink mt-1">
                      IRN: {selectedInvoiceToPrint.gstIrn || 'N/A'}
                    </div>
                  </div>
                  <div className="text-[10px] text-report-green font-bold">
                    ✓ E-Invoice Signed by IRP
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-hairline">
                <thead className="bg-surface-2 border-b border-hairline font-bold">
                  <tr>
                    <th className="p-2 border-r border-hairline">Item Description</th>
                    <th className="p-2 border-r border-hairline">HSN/SAC</th>
                    <th className="p-2 border-r border-hairline text-right">Qty</th>
                    <th className="p-2 border-r border-hairline text-right">Rate</th>
                    <th className="p-2 border-r border-hairline text-right">Taxable</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {selectedInvoiceToPrint.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-hairline font-medium">{itm.itemName}</td>
                      <td className="p-2 border-r border-hairline font-mono">{itm.hsnSac}</td>
                      <td className="p-2 border-r border-hairline font-mono text-right">{itm.quantity}</td>
                      <td className="p-2 border-r border-hairline font-mono text-right">₹{itm.unitPrice}</td>
                      <td className="p-2 border-r border-hairline font-mono text-right">₹{(itm.quantity * itm.unitPrice).toLocaleString('en-IN')}</td>
                      <td className="p-2 font-mono font-bold text-right">₹{itm.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-1.5 border-t border-hairline pt-2">
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span className="font-mono">₹{selectedInvoiceToPrint.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹{selectedInvoiceToPrint.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹{selectedInvoiceToPrint.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t border-ink pt-1.5">
                    <span>Invoice Total:</span>
                    <span className="font-mono">₹{selectedInvoiceToPrint.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
