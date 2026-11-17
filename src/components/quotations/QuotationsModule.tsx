import React, { useState } from 'react';
import { 
  FileText, 
  BarChart3, 
  Plus, 
  Layers, 
  RefreshCw, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Send,
  ShoppingCart
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Quotation, QuotationAttachment } from '../../types/erp';
import { QuotationDashboard } from './QuotationDashboard';
import { QuotationList } from './QuotationList';
import { QuotationFormModal } from './QuotationFormModal';
import { QuotationDetailDrawer } from './QuotationDetailDrawer';
import { QuotationPrintView } from './QuotationPrintView';
import { QuotationRevisionModal } from './QuotationRevisionModal';
import { QuotationSendModal } from './QuotationSendModal';
import { QuotationApprovalModal } from './QuotationApprovalModal';

export const QuotationsModule: React.FC = () => {
  const { 
    quotations, 
    createQuotation, 
    updateQuotation,
    createQuotationRevision,
    updateQuotationStatus,
    approveQuotation,
    rejectQuotation,
    sendQuotation,
    duplicateQuotation,
    convertQuotationToOrder, 
    addQuotationAttachment,
    deleteQuotation,
    refreshQuotations,
    items, 
    customers, 
    leads,
    activeCompany,
    currentUser 
  } = useERP();

  // Top level active tab: 'dashboard' | 'list'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('list');

  // Modals & Drawers State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  
  const [detailQuote, setDetailQuote] = useState<Quotation | null>(null);
  const [printQuote, setPrintQuote] = useState<Quotation | null>(null);
  const [revisionQuote, setRevisionQuote] = useState<Quotation | null>(null);
  const [sendQuote, setSendQuote] = useState<Quotation | null>(null);
  const [approvalQuote, setApprovalQuote] = useState<Quotation | null>(null);

  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Handlers
  const handleCreateNew = () => {
    setEditingQuote(null);
    setIsFormOpen(true);
  };

  const handleEditDraft = (quote: Quotation) => {
    setEditingQuote(quote);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    if (editingQuote) {
      await updateQuotation(editingQuote.id, formData);
      showToast(`Quotation ${editingQuote.quotationNumber} updated successfully.`);
      if (detailQuote && detailQuote.id === editingQuote.id) {
        setDetailQuote({ ...detailQuote, ...formData });
      }
    } else {
      const created = await createQuotation(formData);
      showToast(`New Quotation ${created.quotationNumber} (${created.revision}) generated.`);
      setDetailQuote(created);
    }
  };

  const handleDuplicate = async (quote: Quotation) => {
    try {
      const duplicated = await duplicateQuotation(quote.id);
      showToast(`Duplicated into new quotation ${duplicated.quotationNumber}.`);
      setDetailQuote(duplicated);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConvertToSalesOrder = async (quote: Quotation) => {
    if (!confirm(`Convert Quotation ${quote.quotationNumber} (${quote.revision}) to a live factory Sales Order? This will lock the quotation and initialize production scheduling.`)) {
      return;
    }
    try {
      const order = await convertQuotationToOrder(quote.id);
      showToast(`Success! Quotation converted to Sales Order ${order.soNumber}.`);
      // Update local drawer if open
      if (detailQuote && detailQuote.id === quote.id) {
        setDetailQuote({
          ...detailQuote,
          status: 'converted_to_order',
          convertedSalesOrderId: order.id,
          convertedSalesOrderNumber: order.soNumber
        });
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancelQuotation = async (quote: Quotation) => {
    if (!confirm(`Are you sure you want to cancel Quotation ${quote.quotationNumber}? This action is recorded in the audit trail.`)) {
      return;
    }
    try {
      await deleteQuotation(quote.id);
      showToast(`Quotation ${quote.quotationNumber} cancelled.`);
      if (detailQuote && detailQuote.id === quote.id) {
        setDetailQuote({ ...detailQuote, status: 'cancelled' });
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmRevision = async (reason: string, notes?: string) => {
    if (!revisionQuote) return;
    try {
      const newRev = await createQuotationRevision(revisionQuote.id, reason, {
        internalNotes: notes ? `${revisionQuote.internalNotes || ''}\n${notes}`.trim() : revisionQuote.internalNotes
      });
      showToast(`Spawned ${newRev.revision} for quotation ${newRev.quotationNumber}.`);
      setDetailQuote(newRev);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSendQuotationSubmit = async (sentVia: 'email' | 'whatsapp' | 'manual', comments?: string) => {
    if (!sendQuote) return;
    try {
      const updated = await sendQuotation(sendQuote.id, sentVia, comments);
      showToast(`Quotation ${updated.quotationNumber} marked as sent via ${sentVia}.`);
      if (detailQuote && detailQuote.id === sendQuote.id) {
        setDetailQuote(updated);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApprovalConfirm = async (comments?: string) => {
    if (!approvalQuote) return;
    try {
      const updated = await approveQuotation(approvalQuote.id, comments);
      showToast(`Quotation ${updated.quotationNumber} approved.`);
      if (detailQuote && detailQuote.id === approvalQuote.id) {
        setDetailQuote(updated);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!approvalQuote) return;
    try {
      const updated = await rejectQuotation(approvalQuote.id, reason);
      showToast(`Quotation ${updated.quotationNumber} marked as rejected.`);
      if (detailQuote && detailQuote.id === approvalQuote.id) {
        setDetailQuote(updated);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddAttachment = async (att: Partial<QuotationAttachment>) => {
    if (!detailQuote) return;
    try {
      await addQuotationAttachment(detailQuote.id, att);
      showToast('Document attached successfully.');
      const updatedList = await refreshQuotations();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Sync open detailQuote with fresh quotations state
  const currentDetailQuote = detailQuote ? quotations.find(q => q.id === detailQuote.id) || detailQuote : null;

  return (
    <div className="space-y-5">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-md shadow-lg text-xs font-semibold flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 ${
          feedbackToast.type === 'success' 
            ? 'bg-slate-900 text-white border-slate-700' 
            : 'bg-red-600 text-white border-red-700'
        }`}>
          {feedbackToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-red-200" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Top Banner / Breadcrumb Zone */}
      <div className="bg-white border-b border-slate-200 -mx-4 -mt-4 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span>Commercial & Sales</span>
            <span>/</span>
            <span className="text-blue-600 font-semibold">Quotations & Estimates</span>
            <span>/</span>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
              Indian MSME Engine
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quotation Management</span>
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => refreshQuotations()}
            className="p-2 border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-2xs"
            title="Refresh Quotations"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-t-md">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'list'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Quotations Registry ({quotations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Analytics</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 pr-2 hidden sm:block">
          Active Factory: <strong>{activeCompany?.name || 'Apex Precision'}</strong>
        </div>
      </div>

      {/* TAB 1: QUOTATIONS LISTING */}
      {activeTab === 'list' && (
        <QuotationList
          quotations={quotations}
          onViewQuotation={quote => setDetailQuote(quote)}
          onEditQuotation={handleEditDraft}
          onDuplicateQuotation={handleDuplicate}
          onPrintQuotation={quote => setPrintQuote(quote)}
          onSendQuotation={quote => setSendQuote(quote)}
          onCreateRevision={quote => setRevisionQuote(quote)}
          onConvertToSalesOrder={handleConvertToSalesOrder}
          onCancelQuotation={handleCancelQuotation}
          onCreateNew={handleCreateNew}
        />
      )}

      {/* TAB 2: DASHBOARD & ANALYTICS */}
      {activeTab === 'dashboard' && (
        <QuotationDashboard
          quotations={quotations}
          onViewQuotation={quote => setDetailQuote(quote)}
          onCreateNew={handleCreateNew}
          onConvertToSalesOrder={handleConvertToSalesOrder}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODALS & DRAWERS                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* 1. Create / Edit Quotation Form Modal */}
      {isFormOpen && (
        <QuotationFormModal
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingQuote(null); }}
          onSubmit={handleFormSubmit}
          editQuotation={editingQuote}
          customers={customers}
          items={items}
          leads={leads}
          company={activeCompany}
          currentUser={currentUser}
        />
      )}

      {/* 2. Detailed Quotation View Drawer */}
      {currentDetailQuote && (
        <QuotationDetailDrawer
          quotation={currentDetailQuote}
          allQuotations={quotations}
          company={activeCompany}
          isOpen={!!detailQuote}
          onClose={() => setDetailQuote(null)}
          onOpenPrint={() => setPrintQuote(currentDetailQuote)}
          onOpenSend={() => setSendQuote(currentDetailQuote)}
          onOpenRevision={() => setRevisionQuote(currentDetailQuote)}
          onOpenApproval={() => setApprovalQuote(currentDetailQuote)}
          onConvertToSalesOrder={() => handleConvertToSalesOrder(currentDetailQuote)}
          onSelectRevision={rev => setDetailQuote(rev)}
          onAddAttachment={handleAddAttachment}
        />
      )}

      {/* 3. Official Print & PDF Preview Modal */}
      {printQuote && (
        <QuotationPrintView
          quotation={printQuote}
          company={activeCompany}
          onClose={() => setPrintQuote(null)}
        />
      )}

      {/* 4. Revision Creation Modal */}
      {revisionQuote && (
        <QuotationRevisionModal
          quotation={revisionQuote}
          isOpen={!!revisionQuote}
          onClose={() => setRevisionQuote(null)}
          onConfirmRevision={handleConfirmRevision}
        />
      )}

      {/* 5. Dispatch / Send Quotation Modal */}
      {sendQuote && (
        <QuotationSendModal
          quotation={sendQuote}
          isOpen={!!sendQuote}
          onClose={() => setSendQuote(null)}
          onSend={handleSendQuotationSubmit}
        />
      )}

      {/* 6. Approval Review Modal */}
      {approvalQuote && (
        <QuotationApprovalModal
          quotation={approvalQuote}
          isOpen={!!approvalQuote}
          onClose={() => setApprovalQuote(null)}
          onApprove={handleApprovalConfirm}
          onReject={handleRejectConfirm}
        />
      )}

    </div>
  );
};
