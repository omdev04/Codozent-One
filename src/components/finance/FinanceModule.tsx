import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Printer, 
  Download, 
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Invoice } from '../../types/erp';

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
  const [partnerId, setPartnerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(50000);
  const [paymentMode, setPaymentMode] = useState('bank_transfer_neft_rtgs');
  const [refNo, setRefNo] = useState('');

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.partnerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTaxable = invoices.reduce((acc, i) => acc + i.subtotal, 0);
  const totalCGST = invoices.reduce((acc, i) => acc + i.cgstAmount, 0);
  const totalSGST = invoices.reduce((acc, i) => acc + i.sgstAmount, 0);
  const totalIGST = invoices.reduce((acc, i) => acc + i.igstAmount, 0);
  const totalGST = totalCGST + totalSGST + totalIGST;

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === partnerId);
    recordPayment(
      'customer_receipt',
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Financial ledger & tax compliance</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Finance & GST accounts
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="pill-container bg-surface-2 p-1 rounded-lg border border-hairline inline-flex items-center gap-1">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'invoices' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              Tax invoices
            </button>
            <button
              onClick={() => setActiveTab('gst')}
              className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'gst' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              GST returns
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'payments' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              Receipts
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'ledger' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              Ledger
            </button>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record payment</span>
          </button>
        </div>
      </div>

      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice # or partner..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-3 py-3">GSTIN</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right">GST (18%)</th>
                    <th className="px-4 py-3 text-right font-medium text-ink">Total</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-ink">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {inv.partnerName}
                      </td>
                      <td className="px-3 py-3 font-mono text-ink-muted">{inv.partnerGstin}</td>
                      <td className="px-3 py-3 text-ink-muted">{inv.invoiceDate}</td>
                      <td className="px-4 py-3 text-right font-mono text-ink-muted">
                        ₹{inv.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-muted">
                        ₹{(inv.cgstAmount + inv.sgstAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-ink">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-3 capitalize text-ink-muted">
                        {inv.status}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedInvoiceToPrint(inv)}
                          className="px-2 py-1 text-[11px] font-medium text-ink bg-surface-1 border border-hairline hover:border-ink rounded transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Printer className="w-3 h-3 text-ink-muted" />
                          <span>View invoice</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-1 p-4 rounded-lg border border-hairline">
              <div className="text-xs text-ink-muted">Total taxable outward</div>
              <div className="text-xl font-mono font-medium text-ink mt-1">
                ₹{totalTaxable.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-1 p-4 rounded-lg border border-hairline">
              <div className="text-xs text-ink-muted">Central tax (CGST 9%)</div>
              <div className="text-xl font-mono font-medium text-ink mt-1">
                ₹{totalCGST.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-1 p-4 rounded-lg border border-hairline">
              <div className="text-xs text-ink-muted">State tax (SGST 9%)</div>
              <div className="text-xl font-mono font-medium text-ink mt-1">
                ₹{totalSGST.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-surface-1 p-4 rounded-lg border border-hairline">
              <div className="text-xs text-ink-muted">Total GST output liability</div>
              <div className="text-xl font-mono font-medium text-fin-orange mt-1">
                ₹{totalGST.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="bg-surface-1 rounded-lg border border-hairline p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="text-sm font-medium text-ink">GSTR-1 outward supplies</h3>
                <p className="text-xs text-ink-muted">B2B taxable outward register</p>
              </div>
              <button className="btn-secondary text-xs">
                <Download className="w-3 h-3 text-ink-muted" />
                <span>Export GSTR-1 format</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-3 py-2.5">Recipient GSTIN</th>
                    <th className="px-3 py-2.5">Customer name</th>
                    <th className="px-3 py-2.5">Invoice #</th>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5 text-right">Taxable</th>
                    <th className="px-3 py-2.5 text-right">CGST</th>
                    <th className="px-3 py-2.5 text-right">SGST</th>
                    <th className="px-3 py-2.5 text-right font-medium text-ink">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-mono">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-canvas/40">
                      <td className="px-3 py-2.5 text-ink">{inv.partnerGstin}</td>
                      <td className="px-3 py-2.5 font-sans font-medium text-ink">{inv.partnerName}</td>
                      <td className="px-3 py-2.5 text-ink">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2.5 text-ink-muted">{inv.invoiceDate}</td>
                      <td className="px-3 py-2.5 text-right text-ink-muted">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 text-right text-ink-muted">₹{inv.cgstAmount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 text-right text-ink-muted">₹{inv.sgstAmount.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 text-right font-medium text-ink">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Voucher #</th>
                  <th className="px-4 py-3">Partner name</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Mode</th>
                  <th className="px-3 py-3 font-mono">Reference #</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-ink">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-ink">{p.paymentNumber}</td>
                    <td className="px-4 py-3 font-medium text-ink">{p.partnerName}</td>
                    <td className="px-3 py-3 capitalize text-ink-muted">{p.paymentType.replace('_', ' ')}</td>
                    <td className="px-3 py-3 uppercase text-[11px] font-mono text-ink-muted">{p.paymentMode.replace('_', ' ')}</td>
                    <td className="px-3 py-3 font-mono text-ink">{p.referenceNumber}</td>
                    <td className="px-3 py-3 text-ink-muted">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-ink">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3 capitalize text-ink-muted">
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Account code</th>
                  <th className="px-4 py-3">Account title</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-4 py-3 text-right font-medium text-ink">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {chartOfAccounts.map(coa => (
                  <tr key={coa.id} className="hover:bg-canvas/40">
                    <td className="px-4 py-3 font-mono font-medium text-ink">{coa.accountCode}</td>
                    <td className="px-4 py-3 font-medium text-ink">{coa.accountName}</td>
                    <td className="px-3 py-3 capitalize text-ink-muted">{coa.accountType}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-ink">
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
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Record bank receipt
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Customer</label>
                <select
                  required
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (Due: ₹{c.outstandingBalance.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Amount received (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="bank_transfer_neft_rtgs">NEFT / RTGS</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">UTR / Ref #</label>
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    placeholder="HDFC26110299881"
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Post receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE GST INVOICE MODAL */}
      {selectedInvoiceToPrint && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between no-print">
              <span className="text-xs font-medium text-ink">Tax invoice</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="btn-primary text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button onClick={() => setSelectedInvoiceToPrint(null)} className="p-1 text-ink-subtle hover:text-ink">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 printable-document text-ink">
              <div className="flex justify-between items-start border-b border-hairline pb-4">
                <div>
                  <h1 className="text-lg font-medium tracking-tight text-ink">{activeCompany.name}</h1>
                  <p className="text-xs text-ink-muted mt-0.5">{activeCompany.address}</p>
                  <p className="text-xs text-ink-muted">GSTIN: {activeCompany.gstin} · State: {activeCompany.state} ({activeCompany.stateCode})</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-medium uppercase text-ink-muted">
                    Tax invoice
                  </span>
                  <div className="font-mono font-medium text-base mt-1">{selectedInvoiceToPrint.invoiceNumber}</div>
                  <div className="text-xs text-ink-muted">Date: {selectedInvoiceToPrint.invoiceDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 border border-hairline rounded">
                  <span className="text-ink-muted">Billed to:</span>
                  <div className="font-medium text-ink mt-0.5">{selectedInvoiceToPrint.partnerName}</div>
                  <div className="font-mono text-ink-muted mt-0.5">GSTIN: {selectedInvoiceToPrint.partnerGstin}</div>
                </div>
                <div className="p-3 border border-hairline rounded">
                  <span className="text-ink-muted">E-invoice details:</span>
                  <div className="font-mono text-[10px] break-all text-ink mt-0.5">
                    IRN: {selectedInvoiceToPrint.gstIrn || '98d3c11f45778844ba9c8789312384a1e7b233a4112344dd99881122334455aa'}
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-hairline">
                <thead className="bg-canvas border-b border-hairline font-medium text-ink-muted">
                  <tr>
                    <th className="p-2.5 border-r border-hairline">Item</th>
                    <th className="p-2.5 border-r border-hairline">HSN</th>
                    <th className="p-2.5 border-r border-hairline text-right">Qty</th>
                    <th className="p-2.5 border-r border-hairline text-right">Rate</th>
                    <th className="p-2.5 border-r border-hairline text-right">Taxable</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline font-normal">
                  {selectedInvoiceToPrint.items.map((itm, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 border-r border-hairline font-medium text-ink">{itm.itemName}</td>
                      <td className="p-2.5 border-r border-hairline font-mono text-ink-muted">{itm.hsnSac}</td>
                      <td className="p-2.5 border-r border-hairline font-mono text-right">{itm.quantity}</td>
                      <td className="p-2.5 border-r border-hairline font-mono text-right">₹{itm.unitPrice}</td>
                      <td className="p-2.5 border-r border-hairline font-mono text-right">₹{(itm.quantity * itm.unitPrice).toLocaleString('en-IN')}</td>
                      <td className="p-2.5 font-mono font-medium text-right text-ink">₹{itm.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end text-xs">
                <div className="w-60 space-y-1.5 border-t border-hairline pt-2">
                  <div className="flex justify-between text-ink-muted">
                    <span>Taxable value:</span>
                    <span className="font-mono">₹{selectedInvoiceToPrint.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-ink-muted">
                    <span>CGST (9%):</span>
                    <span className="font-mono">₹{selectedInvoiceToPrint.cgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-ink-muted">
                    <span>SGST (9%):</span>
                    <span className="font-mono">₹{selectedInvoiceToPrint.sgstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-medium text-sm border-t border-hairline pt-1 text-ink">
                    <span>Invoice total:</span>
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
