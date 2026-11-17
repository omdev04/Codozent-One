import React, { useState } from 'react';
import {
  Users, Plus, LayoutDashboard, Table as TableIcon,
  Calendar, Upload, Download, ShieldCheck,
  CheckCircle, ArrowRight, Building2, Phone
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { CrmLead, CrmLeadStatus, CrmLeadFollowup } from '../../types/erp';
import { CrmDashboard } from './CrmDashboard';
import { CrmTable } from './CrmTable';
import { CrmFollowupDesk } from './CrmFollowupDesk';
import { CrmLeadFormModal } from './CrmLeadFormModal';
import { CrmLeadDetailDrawer } from './CrmLeadDetailDrawer';
import { CrmLostModal } from './CrmLostModal';
import { CrmImportModal } from './CrmImportModal';

export const CrmModule: React.FC = () => {
  const {
    leads,
    crmFollowups,
    createLead,
    updateLead,
    deleteLead,
    checkLeadDuplicate,
    createLeadFollowup,
    updateLeadFollowup,
    convertLeadToQuotationDraft,
    importLeadsBatch,
    activeCompany
  } = useERP();

  // Active View Tab: 'dashboard' | 'table' | 'followups'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'followups'>('dashboard');

  // Modal / Drawer States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<CrmLead | null>(null);

  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<CrmLead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [leadToMarkLost, setLeadToMarkLost] = useState<CrmLead | null>(null);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Handlers
  const handleOpenCreateModal = () => {
    setLeadToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (lead: CrmLead) => {
    setLeadToEdit(lead);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData: Partial<CrmLead>) => {
    if (leadToEdit) {
      await updateLead(leadToEdit.id, formData);
      if (selectedLeadForDrawer?.id === leadToEdit.id) {
        setSelectedLeadForDrawer({ ...selectedLeadForDrawer, ...formData } as CrmLead);
      }
    } else {
      const created = await createLead(formData);
      if (created) {
        setSelectedLeadForDrawer(created);
        setIsDrawerOpen(true);
      }
    }
  };

  const handleSelectLead = (lead: CrmLead) => {
    setSelectedLeadForDrawer(lead);
    setIsDrawerOpen(true);
  };

  const handleStageChange = async (leadId: string, newStage: CrmLeadStatus) => {
    await updateLead(leadId, { status: newStage });
    if (selectedLeadForDrawer?.id === leadId) {
      setSelectedLeadForDrawer(prev => prev ? { ...prev, status: newStage } : null);
    }
  };

  const handleTriggerLost = (lead: CrmLead) => {
    setLeadToMarkLost(lead);
    setIsLostModalOpen(true);
  };

  const handleConfirmLost = async (leadId: string, reason: string, notes: string) => {
    await updateLead(leadId, {
      status: 'lost',
      lostReason: reason,
      lostNotes: notes
    });
    if (selectedLeadForDrawer?.id === leadId) {
      setSelectedLeadForDrawer(prev => prev ? { ...prev, status: 'lost', lostReason: reason, lostNotes: notes } : null);
    }
  };

  const handleMarkWon = async (leadId: string) => {
    if (confirm('Mark this manufacturing lead as WON? You will also be prompted to convert it into a formal Quotation draft.')) {
      await updateLead(leadId, { status: 'won', winProbability: 100 });
      if (selectedLeadForDrawer?.id === leadId) {
        setSelectedLeadForDrawer(prev => prev ? { ...prev, status: 'won', winProbability: 100 } : null);
      }
    }
  };

  const handleConvertQuotation = async (leadId: string) => {
    const res = await convertLeadToQuotationDraft(leadId);
    if (res) {
      alert(`🎉 Lead converted to Quotation Draft: ${res.quotation.quotationNumber}!\n\nLinked Customer: ${res.customer.name}\nTotal Quote Value: ₹${res.quotation.grandTotal.toLocaleString('en-IN')}`);
      if (selectedLeadForDrawer?.id === leadId) {
        setSelectedLeadForDrawer(res.lead);
      }
    }
  };

  const handleBulkStageChange = async (ids: string[], newStage: CrmLeadStatus) => {
    for (const id of ids) {
      await updateLead(id, { status: newStage });
    }
  };

  const handleScheduleFollowup = (lead: CrmLead) => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);
    createLeadFollowup({
      leadId: lead.id,
      title: `Follow-up with ${lead.contactName} (${lead.companyName})`,
      scheduledDate: defaultDate.toISOString().split('T')[0],
      scheduledTime: '11:00',
      type: 'call',
      assignedTo: lead.assignedTo || 'Sales Staff',
      notes: 'Follow-up regarding drawings and commercial quote'
    });
    alert(`Follow-up scheduled for ${lead.companyName} on ${defaultDate.toISOString().split('T')[0]}.`);
  };

  const handleExportCsv = () => {
    if (leads.length === 0) return alert('No leads available to export.');

    const headers = ['Lead Number', 'Company Name', 'Contact Person', 'Phone', 'Email', 'Industry', 'Source', 'Deal Value', 'Stage', 'Priority', 'Assigned To', 'Next Followup', 'Created Date'];
    const rows = leads.map(l => [
      `"${l.leadNumber || l.id}"`,
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.contactName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.industry || ''}"`,
      `"${l.source}"`,
      l.dealValue,
      `"${l.status}"`,
      `"${l.priority}"`,
      `"${l.assignedTo || ''}"`,
      `"${l.nextFollowupDate || ''}"`,
      `"${new Date(l.createdAt).toLocaleDateString('en-IN')}"`
    ]);

    const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Module Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Lead Management & Sales Pipelines
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead Intake</span>
          </button>
        </div>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-2 rounded-t-lg shadow-2xs overflow-x-auto scrollbar-none">
        {[
          { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
          { id: 'table', label: `Leads List (${leads.length})`, icon: TableIcon },
          { id: 'followups', label: `Follow-up Desk (${crmFollowups.filter(f => !f.isCompleted).length})`, icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition-all whitespace-nowrap ${isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View Body */}
      <div>
        {activeTab === 'dashboard' && (
          <CrmDashboard
            leads={leads}
            followups={crmFollowups}
            onSelectLead={handleSelectLead}
            onNavigateToTab={(t) => setActiveTab(t)}
            onNewLeadClick={handleOpenCreateModal}
          />
        )}

        {activeTab === 'table' && (
          <CrmTable
            leads={leads}
            onSelectLead={handleSelectLead}
            onEditLead={handleOpenEditModal}
            onDeleteLead={deleteLead}
            onConvertQuotation={handleConvertQuotation}
            onBulkStageChange={handleBulkStageChange}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'followups' && (
          <CrmFollowupDesk
            followups={crmFollowups}
            leads={leads}
            onSelectLead={handleSelectLead}
            onUpdateFollowup={updateLeadFollowup}
            onScheduleNewFollowup={() => handleOpenCreateModal()}
          />
        )}
      </div>

      {/* 5-Step Progressive Create / Edit Modal */}
      <CrmLeadFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        leadToEdit={leadToEdit}
        checkDuplicate={checkLeadDuplicate}
      />

      {/* Comprehensive 6-Tab Detail Drawer */}
      <CrmLeadDetailDrawer
        lead={selectedLeadForDrawer}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={handleOpenEditModal}
        onConvertQuotation={handleConvertQuotation}
        onMarkWon={handleMarkWon}
        onMarkLost={handleTriggerLost}
        onStageChange={handleStageChange}
        onScheduleFollowup={handleScheduleFollowup}
        activeCompanyId={activeCompany.id}
      />

      {/* Mandatory Lost Reason Modal */}
      <CrmLostModal
        lead={leadToMarkLost}
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        onConfirmLost={handleConfirmLost}
      />

      {/* Bulk CSV Import Modal */}
      <CrmImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importLeadsBatch}
      />
    </div>
  );
};
