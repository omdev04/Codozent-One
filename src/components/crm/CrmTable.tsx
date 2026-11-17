import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, ArrowUpDown, ChevronLeft, ChevronRight, 
  MoreVertical, FileCheck, Phone, Mail, Award, CheckCircle, 
  AlertTriangle, Trash2, Eye, Calendar
} from 'lucide-react';
import { CrmLead, CrmLeadStatus, CrmLeadPriority, CrmLeadSource } from '../../types/erp';
import { CRM_STAGES } from './crmStages';

interface CrmTableProps {
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onEditLead: (lead: CrmLead) => void;
  onDeleteLead: (id: string) => Promise<void>;
  onConvertQuotation: (leadId: string) => Promise<void>;
  onBulkStageChange: (ids: string[], newStage: CrmLeadStatus) => Promise<void>;
  onExportCsv: () => void;
}

export const CrmTable: React.FC<CrmTableProps> = ({
  leads,
  onSelectLead,
  onEditLead,
  onDeleteLead,
  onConvertQuotation,
  onBulkStageChange,
  onExportCsv
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'dealValue' | 'score' | 'companyName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filtered and Sorted Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const q = search.trim().toLowerCase();
      const matchSearch = !q ||
        l.leadNumber?.toLowerCase().includes(q) ||
        l.companyName.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.productInterest?.toLowerCase().includes(q);

      const matchStage = stageFilter === 'all' || l.status === stageFilter;
      const matchSource = sourceFilter === 'all' || l.source === sourceFilter;
      const matchPriority = priorityFilter === 'all' || l.priority === priorityFilter;

      return matchSearch && matchStage && matchSource && matchPriority;
    }).sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'dealValue' || sortBy === 'score') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
  }, [leads, search, stageFilter, sourceFilter, priorityFilter, sortBy, sortOrder]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedLeads.map(l => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-3">
      {/* Search, Filter & Bulk Actions Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col lg:flex-row items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search company, contact, phone, lead ID, part..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Multi-Filters */}
        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Stages ({leads.length})</option>
            {CRM_STAGES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Sources</option>
            <option value="indiamart">IndiaMART</option>
            <option value="justdial">JustDial</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="trade_fair">Trade Fair / Expo</option>
            <option value="referral">Referral</option>
            <option value="direct">Direct Walk-In</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
            className="text-xs bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent / Hot</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors ml-auto lg:ml-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Strip if selected */}
      {selectedIds.length > 0 && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs animate-in fade-in duration-150">
          <div className="font-semibold text-blue-900">
            {selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Bulk Move Stage:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStageChange(selectedIds, e.target.value as CrmLeadStatus);
                  setSelectedIds([]);
                }
              }}
              className="text-xs bg-white border border-blue-300 rounded px-2 py-1 text-slate-800 focus:outline-none"
            >
              <option value="">Select Stage...</option>
              {CRM_STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-1 text-slate-500 hover:text-slate-800"
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold tracking-tight">
              <tr>
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={paginatedLeads.length > 0 && selectedIds.length === paginatedLeads.length}
                    onChange={toggleSelectAll}
                    className="accent-blue-600 rounded"
                  />
                </th>
                <th className="px-3 py-3 font-semibold">Lead ID</th>
                <th 
                  className="px-3 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('companyName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Company / Contact</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 font-semibold">Phone / Channel</th>
                <th 
                  className="px-3 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('dealValue')}
                >
                  <div className="flex items-center gap-1">
                    <span>Deal Value</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 font-semibold">Stage</th>
                <th 
                  className="px-3 py-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center gap-1">
                    <span>Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 font-semibold">Next Follow-up</th>
                <th className="px-3 py-3 font-semibold">Assigned To</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs italic">
                    No leads match your current search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => {
                  const isSelected = selectedIds.includes(lead.id);
                  const stageObj = CRM_STAGES.find(s => s.id === lead.status) || CRM_STAGES[0];

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => onSelectLead(lead)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(lead.id)}
                          className="accent-blue-600 rounded"
                        />
                      </td>

                      {/* Lead ID */}
                      <td className="px-3 py-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {lead.leadNumber || lead.id}
                      </td>

                      {/* Company & Contact */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-slate-900 line-clamp-1">
                          {lead.companyName || lead.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {lead.contactName} {lead.designation && `· ${lead.designation}`}
                        </div>
                      </td>

                      {/* Phone & Source */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="font-mono text-slate-800">{lead.phone}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{lead.source}</div>
                      </td>

                      {/* Deal Value */}
                      <td className="px-3 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{Number(lead.dealValue).toLocaleString('en-IN')}
                      </td>

                      {/* Stage Pill */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${stageObj.badgeBg}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageObj.color }} />
                          {stageObj.label}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <Award className="w-3 h-3 text-emerald-600" />
                          {lead.score || 50}
                        </span>
                      </td>

                      {/* Next Followup */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {lead.nextFollowupDate ? (
                          <div className="flex items-center gap-1 text-slate-700">
                            <Calendar className="w-3 h-3 text-blue-500" />
                            <span>{lead.nextFollowupDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Assigned To */}
                      <td className="px-3 py-3 text-slate-600 whitespace-nowrap">
                        {lead.assignedTo || 'Unassigned'}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {lead.status !== 'won' && (
                            <button
                              onClick={() => onConvertQuotation(lead.id)}
                              title="Convert to Quotation Draft"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditLead(lead)}
                            title="Edit Lead Details"
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete lead ${lead.leadNumber || lead.companyName}?`)) {
                                onDeleteLead(lead.id);
                              }
                            }}
                            title="Delete Lead"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{filteredLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-900">{Math.min(currentPage * pageSize, filteredLeads.length)}</strong> of{' '}
            <strong className="text-slate-900">{filteredLeads.length}</strong> leads
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
