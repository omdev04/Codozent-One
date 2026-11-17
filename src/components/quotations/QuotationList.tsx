import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreVertical, 
  Eye, 
  Edit2, 
  Copy, 
  Send, 
  Printer, 
  GitBranch, 
  ShoppingCart, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  Building2,
  Calendar,
  DollarSign,
  User,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { Quotation, QuotationStatus } from '../../types/erp';
import { formatIndianCurrency } from '../../utils/indianCurrency';

interface QuotationListProps {
  quotations: Quotation[];
  onViewQuotation: (quote: Quotation) => void;
  onEditQuotation: (quote: Quotation) => void;
  onDuplicateQuotation: (quote: Quotation) => void;
  onPrintQuotation: (quote: Quotation) => void;
  onSendQuotation: (quote: Quotation) => void;
  onCreateRevision: (quote: Quotation) => void;
  onConvertToSalesOrder: (quote: Quotation) => void;
  onCancelQuotation: (quote: Quotation) => void;
  onCreateNew: () => void;
}

export const QuotationList: React.FC<QuotationListProps> = ({
  quotations,
  onViewQuotation,
  onEditQuotation,
  onDuplicateQuotation,
  onPrintQuotation,
  onSendQuotation,
  onCreateRevision,
  onConvertToSalesOrder,
  onCancelQuotation,
  onCreateNew
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'quotationNumber' | 'quoteDate' | 'customerName' | 'grandTotal' | 'validUntil'>('quoteDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Extract distinct salespersons
  const salespersons = useMemo(() => {
    const set = new Set<string>();
    quotations.forEach(q => {
      if (q.salespersonName) set.add(q.salespersonName);
      else if (q.createdBy) set.add(q.createdBy);
    });
    return Array.from(set);
  }, [quotations]);

  // Filtering & Sorting
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Search
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        q.quotationNumber.toLowerCase().includes(term) ||
        q.customerName.toLowerCase().includes(term) ||
        (q.subject && q.subject.toLowerCase().includes(term)) ||
        (q.leadNumber && q.leadNumber.toLowerCase().includes(term)) ||
        (q.referenceNumber && q.referenceNumber.toLowerCase().includes(term));

      // Status
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;

      // Salesperson
      const spName = q.salespersonName || q.createdBy || '';
      const matchSalesperson = salespersonFilter === 'all' || spName === salespersonFilter;

      return matchSearch && matchStatus && matchSalesperson;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'quotationNumber') {
        comparison = a.quotationNumber.localeCompare(b.quotationNumber);
      } else if (sortField === 'quoteDate') {
        comparison = new Date(a.quoteDate).getTime() - new Date(b.quoteDate).getTime();
      } else if (sortField === 'customerName') {
        comparison = a.customerName.localeCompare(b.customerName);
      } else if (sortField === 'grandTotal') {
        comparison = (a.grandTotal || 0) - (b.grandTotal || 0);
      } else if (sortField === 'validUntil') {
        comparison = new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [quotations, searchTerm, statusFilter, salespersonFilter, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / pageSize));
  const paginatedQuotes = filteredQuotations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredQuotations.length === 0) {
      alert('No quotations to export');
      return;
    }

    const headers = [
      'Quotation Number',
      'Revision',
      'Date',
      'Valid Until',
      'Customer Name',
      'Contact Person',
      'GSTIN',
      'Lead Reference',
      'Subject',
      'Subtotal',
      'Discount',
      'Taxable Amount',
      'CGST',
      'SGST',
      'IGST',
      'Grand Total',
      'Status',
      'Created By'
    ];

    const rows = filteredQuotations.map(q => [
      `"${q.quotationNumber}"`,
      `"${q.revision}"`,
      `"${q.quoteDate}"`,
      `"${q.validUntil}"`,
      `"${(q.customerName || '').replace(/"/g, '""')}"`,
      `"${(q.contactPerson || '').replace(/"/g, '""')}"`,
      `"${q.gstin || ''}"`,
      `"${q.leadNumber || ''}"`,
      `"${(q.subject || '').replace(/"/g, '""')}"`,
      q.subtotal || 0,
      q.discountAmount || 0,
      q.taxableAmount || 0,
      q.cgstAmount || 0,
      q.sgstAmount || 0,
      q.igstAmount || 0,
      q.grandTotal || 0,
      `"${q.status}"`,
      `"${q.createdBy || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Quotations_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: QuotationStatus | string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-300">Draft</span>;
      case 'pending_approval':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Pending Review</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Approved</span>;
      case 'sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">Sent</span>;
      case 'under_negotiation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-300">Negotiating</span>;
      case 'accepted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-400 font-mono">Accepted</span>;
      case 'converted_to_order':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-700 text-white border border-blue-800">In Order</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-300">Rejected</span>;
      case 'expired':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-100 text-orange-800 border border-orange-300">Expired</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-600 border border-slate-300">Cancelled</span>;
      case 'superseded':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-150 text-slate-600 border border-slate-300">Superseded</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Controls Bar: Search, Filters, Export, New */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-md shadow-2xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by quote #, customer, subject, or lead ref..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-blue-600 text-slate-900"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="all">All Statuses ({quotations.length})</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="sent">Sent to Client</option>
              <option value="under_negotiation">Under Negotiation</option>
              <option value="accepted">Accepted</option>
              <option value="converted_to_order">Converted to Sales Order</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="superseded">Superseded Revisions</option>
            </select>
          </div>

          {/* Salesperson Dropdown */}
          {salespersons.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Salesperson:</span>
              <select
                value={salespersonFilter}
                onChange={e => { setSalespersonFilter(e.target.value); setCurrentPage(1); }}
                className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:border-blue-600"
              >
                <option value="all">All Team</option>
                {salespersons.map(sp => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
          )}

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* New Quotation button */}
          <button
            onClick={onCreateNew}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>

      </div>

      {/* Quotations Data Table */}
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                
                {/* Quotation Number */}
                <th 
                  onClick={() => handleSort('quotationNumber')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Quotation #</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Quotation Date */}
                <th 
                  onClick={() => handleSort('quoteDate')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Customer */}
                <th 
                  onClick={() => handleSort('customerName')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer & Scope</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Lead Reference */}
                <th className="py-2.5 px-3 whitespace-nowrap">Lead Ref</th>

                {/* Amount */}
                <th 
                  onClick={() => handleSort('grandTotal')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Value (₹)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Valid Until */}
                <th 
                  onClick={() => handleSort('validUntil')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Valid Until</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* Status */}
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Status</th>

                {/* Created By */}
                <th className="py-2.5 px-3 whitespace-nowrap">Created By</th>

                {/* Actions */}
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No quotations found matching the current search & filters.
                  </td>
                </tr>
              ) : (
                paginatedQuotes.map(q => {
                  const isMenuOpen = activeMenuId === q.id;
                  const isSuperseded = q.status === 'superseded';
                  const isAccepted = q.status === 'accepted';
                  const isConverted = q.status === 'converted_to_order';

                  return (
                    <tr 
                      key={q.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${isSuperseded ? 'opacity-65 bg-slate-50/30' : ''}`}
                    >
                      {/* Quotation Number & Revision Tag */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        <button
                          onClick={() => onViewQuotation(q)}
                          className="font-mono font-bold text-blue-700 hover:underline cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{q.quotationNumber}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {q.revision}
                          </span>
                        </button>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {q.items?.length || 0} line item(s)
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 font-mono text-slate-600 align-top whitespace-nowrap">
                        {q.quoteDate}
                      </td>

                      {/* Customer & Scope */}
                      <td className="py-3 px-3 align-top max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{q.customerName}</div>
                        {q.subject && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{q.subject}</div>
                        )}
                        {q.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">Ref: {q.referenceNumber}</div>
                        )}
                      </td>

                      {/* Lead Reference */}
                      <td className="py-3 px-3 align-top whitespace-nowrap">
                        {q.leadNumber ? (
                          <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {q.leadNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 align-top whitespace-nowrap">
                        <div>₹{q.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        {q.discountAmount ? (
                          <div className="text-[10px] text-emerald-700 font-normal">
                            Disc: -₹{q.discountAmount.toFixed(0)}
                          </div>
                        ) : null}
                      </td>

                      {/* Valid Until */}
                      <td className="py-3 px-3 font-mono text-slate-600 align-top whitespace-nowrap">
                        <span className={new Date(q.validUntil) < new Date() && q.status !== 'accepted' && q.status !== 'converted_to_order' ? 'text-red-600 font-semibold' : ''}>
                          {q.validUntil}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center align-top whitespace-nowrap">
                        {getStatusBadge(q.status)}
                      </td>

                      {/* Created By */}
                      <td className="py-3 px-3 text-slate-600 align-top whitespace-nowrap">
                        <div className="text-[11px] font-medium">{q.salespersonName || q.createdBy}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right align-top whitespace-nowrap relative">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Quick Convert Button for Accepted */}
                          {isAccepted && !q.convertedSalesOrderId && (
                            <button
                              onClick={() => onConvertToSalesOrder(q)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Convert to Sales Order"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>SO</span>
                            </button>
                          )}

                          {/* Quick View Button */}
                          <button
                            onClick={() => onViewQuotation(q)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="View Quotation Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Print Button */}
                          <button
                            onClick={() => onPrintQuotation(q)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                            title="Print / Save PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* More Dropdown Trigger */}
                          <div className="relative inline-block text-left">
                            <button
                              onClick={() => setActiveMenuId(isMenuOpen ? null : q.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="origin-top-right absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 py-1 text-left text-xs divide-y divide-slate-100">
                                
                                <div className="py-1">
                                  <button
                                    onClick={() => { onViewQuotation(q); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                                    <span>View Overview</span>
                                  </button>

                                  {q.status === 'draft' && (
                                    <button
                                      onClick={() => { onEditQuotation(q); setActiveMenuId(null); }}
                                      className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                                      <span>Edit Draft</span>
                                    </button>
                                  )}

                                  {!isSuperseded && !isConverted && (
                                    <button
                                      onClick={() => { onSendQuotation(q); setActiveMenuId(null); }}
                                      className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Send className="w-3.5 h-3.5 text-blue-600" />
                                      <span>Dispatch to Client</span>
                                    </button>
                                  )}
                                </div>

                                <div className="py-1">
                                  {!isSuperseded && !isConverted && (
                                    <button
                                      onClick={() => { onCreateRevision(q); setActiveMenuId(null); }}
                                      className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <GitBranch className="w-3.5 h-3.5 text-purple-600" />
                                      <span>Create Revision</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => { onDuplicateQuotation(q); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Duplicate Series</span>
                                  </button>
                                </div>

                                {q.status !== 'cancelled' && !isConverted && (
                                  <div className="py-1">
                                    <button
                                      onClick={() => { onCancelQuotation(q); setActiveMenuId(null); }}
                                      className="w-full px-3 py-1.5 text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Cancel Quotation</span>
                                    </button>
                                  </div>
                                )}

                              </div>
                            )}
                          </div>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredQuotations.length)} of {filteredQuotations.length} quotations
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
