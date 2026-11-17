import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Check,
  Calendar,
  Phone,
  AlertCircle,
  QrCode,
  CheckCircle2,
  Download,
  Filter
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { KhataEntry } from '../../types/erp';

export const KhatabookModule: React.FC = () => {
  const {
    khataEntries,
    createKhataEntry,
    sendKhataWhatsApp,
    activeCompany
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'udhar' | 'jama'>('all');
  const [filterParty, setFilterParty] = useState<'all' | 'customer' | 'supplier'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalEntry, setQrModalEntry] = useState<KhataEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Form State
  const [partyName, setPartyName] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [partyType, setPartyType] = useState<'customer' | 'supplier'>('customer');
  const [entryType, setEntryType] = useState<'udhar' | 'jama'>('udhar');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [billNumber, setBillNumber] = useState('');

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim() || !amount || Number(amount) <= 0) {
      alert('Please enter party name and a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await createKhataEntry({
        partyName: partyName.trim(),
        phone: partyPhone.trim() || undefined,
        partyType,
        type: entryType,
        amount: Number(amount),
        description: description.trim() || (entryType === 'udhar' ? 'Goods supplied on credit' : 'Payment received'),
        billNumber: billNumber.trim() || undefined,
        paymentMode: 'upi'
      });
      setIsModalOpen(false);
      setPartyName('');
      setPartyPhone('');
      setAmount('');
      setDescription('');
      setBillNumber('');
      setActionNotice('Ledger entry added successfully to Khata book.');
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      alert(`Error creating entry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = async (entry: KhataEntry) => {
    setSendingId(entry.id);
    try {
      const res = await sendKhataWhatsApp(entry.id);

      const upiId = activeCompany?.gstin ? `${activeCompany.gstin.toLowerCase()}@icici` : 'factorypay@upi';
      const cleanPhone = (entry.phone || '').replace(/[^\d]/g, '');
      const msg = encodeURIComponent(
        `Namaste ${entry.partyName},\n\nA gentle reminder from ${activeCompany?.name || 'our company'}. An outstanding amount of ₹${entry.amount.toLocaleString('en-IN')} is due (Ref: ${entry.billNumber || 'Khata Bill'}).\n\nDirect UPI payment link:\nupi://pay?pa=${upiId}&pn=${encodeURIComponent(activeCompany?.name || 'Codozent One')}&am=${entry.amount}&cu=INR\n\nThank you!`
      );

      if (cleanPhone.length >= 10) {
        window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, '_blank');
      }

      setActionNotice(`WhatsApp notice sent: ${res.message}`);
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err: any) {
      alert(`Failed to send reminder: ${err.message}`);
    } finally {
      setSendingId(null);
    }
  };

  const handleExportCSV = () => {
    if (khataEntries.length === 0) {
      alert('No ledger entries to export');
      return;
    }
    const headers = ['Date', 'Party Name', 'Phone', 'Type', 'Party Type', 'Bill Number', 'Description', 'Amount'];
    const rows = filteredEntries.map(e => [
      e.entryDate?.split('T')[0] || '',
      `"${e.partyName.replace(/"/g, '""')}"`,
      e.phone || '',
      e.type,
      e.partyType,
      e.billNumber || '',
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `khatabook_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const totalUdhar = khataEntries
    .filter(e => e.type === 'udhar')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalJama = khataEntries
    .filter(e => e.type === 'jama')
    .reduce((sum, e) => sum + e.amount, 0);

  const netBalance = totalUdhar - totalJama;

  const filteredEntries = khataEntries.filter(e => {
    const matchSearch = e.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.phone && e.phone.includes(searchTerm)) ||
      (e.billNumber && e.billNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = filterType === 'all' || e.type === filterType;
    const matchParty = filterParty === 'all' || e.partyType === filterParty;
    return matchSearch && matchType && matchParty;
  });

  return (
    <div className="space-y-6">
      {/* Razorpay Blade Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>FINANCIALS</span>
            <span className="text-slate-300">/</span>
            <span className="text-[#0c6cf2]">DIGITAL KHATA</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Khatabook (Jama / Udhar Ledger)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-click customer & supplier credit tracker with automated WhatsApp payment links & UPI settlement.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleExportCSV}
            className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Export filtered ledger as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Khata Entry</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-[#0c6cf2] shrink-0" />
          <span className="font-medium">{actionNotice}</span>
        </div>
      )}

      {/* Razorpay Blade Metric / Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Receivables (Udhar) */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs relative overflow-hidden border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              You'll Get (Udhar / Receivables)
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-3 font-sans tracking-tight">
            ₹{totalUdhar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Pending collections from customers</span>
          </div>
        </div>

        {/* Card 2: Payables (Jama) */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs relative overflow-hidden border-t-4 border-t-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              You'll Pay (Jama / Payables)
            </span>
            <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-3 font-sans tracking-tight">
            ₹{totalJama.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-700 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Outstanding dues to suppliers</span>
          </div>
        </div>

        {/* Card 3: Net Working Position */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs relative overflow-hidden border-t-4 border-t-[#0c6cf2]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Net Working Position
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-[#0c6cf2] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-slate-900 mt-3 font-sans tracking-tight flex items-baseline gap-2">
            <span>₹{Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
              {netBalance >= 0 ? 'Net Inflow' : 'Net Outflow'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0c6cf2]" />
            <span>Calculated across active ledger books</span>
          </div>
        </div>
      </div>

      {/* Razorpay Blade Toolbar & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search party name, phone, bill number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-xs px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-slate-700 font-medium focus:outline-none focus:border-[#0c6cf2] cursor-pointer shadow-2xs"
          >
            <option value="all">All Flow (Jama & Udhar)</option>
            <option value="udhar">You Gave (Udhar Out)</option>
            <option value="jama">You Got (Jama In)</option>
          </select>

          <select
            value={filterParty}
            onChange={(e) => setFilterParty(e.target.value as any)}
            className="text-xs px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-slate-700 font-medium focus:outline-none focus:border-[#0c6cf2] cursor-pointer shadow-2xs"
          >
            <option value="all">All Parties</option>
            <option value="customer">Customers Only</option>
            <option value="supplier">Suppliers Only</option>
          </select>
        </div>
      </div>

      {/* Razorpay Blade Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Party Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Bill Ref / Notes</th>
                <th className="py-3 px-4 text-right">You Gave (Udhar)</th>
                <th className="py-3 px-4 text-right">You Got (Jama)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-slate-800">No entries in Khata book</div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Track credit given (Udhar) or payments received (Jama) with automated WhatsApp receipts.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="btn-primary text-xs px-3.5 py-1.5 cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record First Transaction</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {entry.entryDate ? entry.entryDate.split('T')[0] : 'Today'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{entry.partyName}</div>
                      <span className="text-[10px] text-slate-400 capitalize font-medium">{entry.partyType}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {entry.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {entry.phone}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${entry.type === 'udhar'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${entry.type === 'udhar' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {entry.type === 'udhar' ? 'Gave (Udhar)' : 'Got (Jama)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-medium">{entry.description}</div>
                      {entry.billNumber && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 mt-0.5 inline-block">
                          Ref: {entry.billNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      {entry.type === 'udhar' ? `₹${entry.amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {entry.type === 'jama' ? `₹${entry.amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {entry.type === 'udhar' && (
                          <>
                            <button
                              onClick={() => handleSendWhatsApp(entry)}
                              disabled={sendingId === entry.id}
                              title="Send WhatsApp payment reminder"
                              className="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>{entry.whatsappSent ? 'Re-send' : 'WhatsApp'}</span>
                            </button>
                            <button
                              onClick={() => setQrModalEntry(entry)}
                              title="Show UPI QR Code"
                              className="p-1.5 hover:bg-slate-100 rounded-md border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {entry.type === 'jama' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Settled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Khata Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50 duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Khata Transaction</h3>
                <p className="text-xs text-slate-500 mt-0.5">Credit given (Udhar) or payment received (Jama) for ledger.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEntryType('udhar')}
                  className={`py-3 px-4 text-xs font-bold rounded-lg border text-center cursor-pointer transition-all ${entryType === 'udhar'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-400 shadow-xs ring-2 ring-emerald-400/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <ArrowUpRight className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  You Gave (Udhar Out)
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType('jama')}
                  className={`py-3 px-4 text-xs font-bold rounded-lg border text-center cursor-pointer transition-all ${entryType === 'jama'
                    ? 'bg-rose-50 text-rose-700 border-rose-400 shadow-xs ring-2 ring-rose-400/20'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <ArrowDownLeft className="w-5 h-5 mx-auto mb-1 text-rose-600" />
                  You Got (Jama In)
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Party Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Precision Tools / Ramesh Patel"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  required
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={partyPhone}
                    onChange={(e) => setPartyPhone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Party Type
                  </label>
                  <select
                    value={partyType}
                    onChange={(e) => setPartyType(e.target.value as any)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all cursor-pointer"
                  >
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="15000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-semibold focus:bg-white focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Bill / Challan Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-0045"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Notes / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Partial advance received against PO"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline text-xs px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs px-5 py-2 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPI QR Modal */}
      {qrModalEntry && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in-50 duration-150">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">UPI Payment QR</h3>
            <p className="text-xs text-slate-500">
              Scan to pay ₹{qrModalEntry.amount.toLocaleString('en-IN')} to {activeCompany?.name}
            </p>

            <div className="w-48 h-48 mx-auto bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center p-3 shadow-inner">
              <QrCode className="w-32 h-32 text-slate-900" />
              <div className="text-[10px] font-mono text-slate-400 mt-2 font-medium">UPI Dynamic String Ready</div>
            </div>

            <div className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 break-all select-all">
              upi://pay?pa={activeCompany?.gstin ? `${activeCompany.gstin.toLowerCase()}@icici` : 'factorypay@upi'}&am={qrModalEntry.amount}
            </div>

            <button
              onClick={() => setQrModalEntry(null)}
              className="btn-outline w-full text-xs py-2 cursor-pointer font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
