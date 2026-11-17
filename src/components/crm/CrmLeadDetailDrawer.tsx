import React, { useState, useEffect } from 'react';
import {
  X, Phone, Mail, MessageSquare, Building2, User,
  Calendar, FileText, CheckCircle, Clock, ShieldCheck,
  TrendingUp, Award, AlertTriangle, ArrowRight, Plus,
  Download, FileCheck, Check, Send, ExternalLink
} from 'lucide-react';
import {
  CrmLead, CrmLeadActivity, CrmLeadFollowup, CrmLeadDocument,
  Quotation, CrmFollowupOutcome
} from '../../types/erp';
import { api } from '../../lib/api';

interface CrmLeadDetailDrawerProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (lead: CrmLead) => void;
  onConvertQuotation: (leadId: string) => Promise<void>;
  onMarkWon: (leadId: string) => Promise<void>;
  onMarkLost: (lead: CrmLead) => void;
  onStageChange: (leadId: string, stage: any) => Promise<void>;
  onScheduleFollowup: (lead: CrmLead) => void;
  activeCompanyId: string;
}

export const CrmLeadDetailDrawer: React.FC<CrmLeadDetailDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onConvertQuotation,
  onMarkWon,
  onMarkLost,
  onStageChange,
  onScheduleFollowup,
  activeCompanyId
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'followups' | 'requirements' | 'quotations' | 'documents'>('overview');
  const [activities, setActivities] = useState<CrmLeadActivity[]>([]);
  const [followups, setFollowups] = useState<CrmLeadFollowup[]>([]);
  const [documents, setDocuments] = useState<CrmLeadDocument[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // New Note / Activity State
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState<CrmLeadActivity['type']>('note');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Follow-up Completion State
  const [completingFollowupId, setCompletingFollowupId] = useState<string | null>(null);
  const [completionOutcome, setCompletionOutcome] = useState<CrmFollowupOutcome>('connected');
  const [completionNotes, setCompletionNotes] = useState('');

  // New Document Upload State
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docFileName, setDocFileName] = useState('');
  const [docNotes, setDocNotes] = useState('');

  useEffect(() => {
    if (lead && isOpen) {
      loadLeadDetails();
    }
  }, [lead?.id, isOpen]);

  const loadLeadDetails = async () => {
    if (!lead) return;
    setIsLoadingDetails(true);
    try {
      const [actRes, flwRes, docRes] = await Promise.allSettled([
        api.crm.listActivities(activeCompanyId, lead.id),
        api.crm.listFollowups(activeCompanyId, { leadId: lead.id }),
        api.crm.listDocuments(activeCompanyId, lead.id)
      ]);

      if (actRes.status === 'fulfilled' && actRes.value) setActivities(actRes.value);
      if (flwRes.status === 'fulfilled' && flwRes.value) setFollowups(flwRes.value);
      if (docRes.status === 'fulfilled' && docRes.value) setDocuments(docRes.value);

      // Check linked quotations
      const allQuotes = await api.sales.listQuotations(activeCompanyId).catch(() => []);
      if (allQuotes) {
        setQuotations(allQuotes.filter(q => q.leadId === lead.id || q.quotationNumber === lead.convertedQuotationNumber));
      }
    } catch (err) {
      console.error('Error loading lead drawer details', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !lead) return;
    setIsSubmittingNote(true);
    try {
      const titleMap = {
        note: 'Internal Note Added',
        call: 'Phone Call Logged',
        meeting: 'Client Meeting Held',
        whatsapp: 'WhatsApp Message Sent',
        email: 'Email Sent'
      };
      await api.crm.createActivity(activeCompanyId, lead.id, {
        type: newNoteType,
        title: titleMap[newNoteType as keyof typeof titleMap] || 'Activity Logged',
        description: newNote.trim(),
        metadata: { channel: newNoteType }
      });
      setNewNote('');
      loadLeadDetails();
    } catch (err) {
      console.error('Failed to add note', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleCompleteFollowup = async (fId: string) => {
    try {
      await api.crm.updateFollowup(activeCompanyId, fId, {
        isCompleted: true,
        outcome: completionOutcome,
        outcomeNotes: completionNotes
      });
      setCompletingFollowupId(null);
      setCompletionNotes('');
      loadLeadDetails();
    } catch (err) {
      console.error('Failed to complete followup', err);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileName.trim() || !lead) return;
    try {
      await api.crm.createDocument(activeCompanyId, lead.id, {
        fileName: docFileName.trim(),
        fileSize: 1024 * 350,
        fileType: 'application/pdf',
        storagePath: `/drawings/${lead.leadNumber}/${docFileName.trim()}`,
        fileUrl: '#',
        notes: docNotes
      });
      setIsUploadingDoc(false);
      setDocFileName('');
      setDocNotes('');
      loadLeadDetails();
    } catch (err) {
      console.error('Failed to add document', err);
    }
  };

  if (!isOpen || !lead) return null;

  const stageLabels: Record<string, string> = {
    new: 'New Lead',
    contacted: 'Contacted',
    qualified: 'Qualified',
    requirement_understanding: 'Req. Understanding',
    quotation_preparation: 'Quote Preparation',
    quotation_sent: 'Quotation Sent',
    negotiation: 'Negotiation',
    won: 'Won / Converted',
    lost: 'Lost Deal',
    on_hold: 'On Hold',
    proposal: 'Quotation Sent'
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-700',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    urgent: 'bg-red-50 text-red-700 border-red-200 font-semibold'
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between shrink-0">
          <div className="space-y-1.5 flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                {lead.leadNumber || lead.id}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border ${priorityColors[lead.priority] || 'bg-slate-100 text-slate-700'}`}>
                {lead.priority.toUpperCase()}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-600 text-white">
                {stageLabels[lead.status] || lead.status}
              </span>
              {lead.score !== undefined && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  Score: {lead.score}/100
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              {lead.companyName || lead.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {lead.contactName} {lead.designation && `(${lead.designation})`}
              </span>
              <span className="flex items-center gap-1 font-mono font-semibold text-slate-900">
                ₹{lead.dealValue.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-500">
                Owner: {lead.assignedTo || 'Unassigned'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="px-5 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
          {lead.status !== 'won' && (
            <button
              onClick={() => onConvertQuotation(lead.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors shrink-0"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Convert to Quotation Draft</span>
            </button>
          )}

          <button
            onClick={() => onScheduleFollowup(lead)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md border border-slate-300 transition-colors shrink-0"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Book Follow-up</span>
          </button>

          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md border border-slate-300 transition-colors shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call</span>
            </a>
          )}

          {lead.phone && (
            <a
              href={`https://wa.me/91${lead.phone.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${lead.contactName}, regarding your manufacturing inquiry with Codozent One:`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-md border border-emerald-300 transition-colors shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          )}

          {lead.status !== 'won' && (
            <button
              onClick={() => onMarkWon(lead.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Won</span>
            </button>
          )}

          {lead.status !== 'lost' && (
            <button
              onClick={() => onMarkLost(lead)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-md border border-red-200 transition-colors shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>Mark Lost</span>
            </button>
          )}

          <button
            onClick={() => onEdit(lead)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors shrink-0 ml-auto"
          >
            Edit
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'timeline', label: `Timeline (${activities.length})` },
            { id: 'followups', label: `Follow-ups (${followups.filter(f => !f.isCompleted).length})` },
            { id: 'requirements', label: 'Specs & Reqs' },
            { id: 'quotations', label: `Quotations (${quotations.length})` },
            { id: 'documents', label: `Docs (${documents.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              {/* Lost Notice if lost */}
              {lead.status === 'lost' && lead.lostReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Deal Closed as Lost
                  </div>
                  <div className="mt-1 font-medium">Reason: {lead.lostReason}</div>
                  {lead.lostNotes && <div className="text-[11px] text-red-700 mt-0.5">{lead.lostNotes}</div>}
                </div>
              )}

              {/* Converted Notice if converted */}
              {lead.convertedQuotationNumber && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Converted to Quotation {lead.convertedQuotationNumber}
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Linked to customer master record: {lead.convertedCustomerName || lead.companyName}
                    </div>
                  </div>
                </div>
              )}

              {/* Company & Contact Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Company Details</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div><span className="text-slate-500">Name:</span> <strong className="text-slate-800">{lead.companyName}</strong></div>
                    <div><span className="text-slate-500">Industry:</span> {lead.industry || 'Manufacturing'}</div>
                    <div><span className="text-slate-500">Constitution:</span> {lead.companyType || 'Private Limited'}</div>
                    <div><span className="text-slate-500">GSTIN:</span> <span className="font-mono">{lead.gstin || 'Not Provided'}</span></div>
                    <div><span className="text-slate-500">Location:</span> {lead.address ? `${lead.address}, ` : ''}{lead.city || 'Pune'}, {lead.state || 'Maharashtra'} {lead.pincode ? `- ${lead.pincode}` : ''}</div>
                    {lead.website && (
                      <div><span className="text-slate-500">Website:</span> <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-600 underline">{lead.website}</a></div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Contact Person</span>
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div><span className="text-slate-500">Name:</span> <strong className="text-slate-800">{lead.contactName}</strong></div>
                    <div><span className="text-slate-500">Designation:</span> {lead.designation || 'Purchase / Technical'}</div>
                    <div><span className="text-slate-500">Phone:</span> <span className="font-mono">{lead.phone}</span></div>
                    {lead.alternatePhone && <div><span className="text-slate-500">Alt Phone:</span> <span className="font-mono">{lead.alternatePhone}</span></div>}
                    <div><span className="text-slate-500">Email:</span> {lead.email || 'None'}</div>
                    <div><span className="text-slate-500">Preferred Channel:</span> <span className="capitalize">{lead.preferredContactMethod || 'phone'}</span></div>
                  </div>
                </div>
              </div>

              {/* Requirement Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="font-bold text-slate-800">Technical Scope & Deal Summary</div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {lead.requirementDescription || 'No detailed technical requirement description recorded.'}
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-slate-600">
                  <div>
                    <span className="text-slate-500">Part/Service:</span>
                    <div className="font-semibold text-slate-800">{lead.productInterest || 'General Machining'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Batch Qty:</span>
                    <div className="font-semibold text-slate-800 font-mono">{lead.targetQuantity || '1000'} Pcs</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Channel Source:</span>
                    <div className="font-semibold text-slate-800 capitalize">{lead.source}</div>
                  </div>
                </div>
              </div>

              {/* Score Breakdown Checklist */}
              {lead.scoreBreakdown && lead.scoreBreakdown.length > 0 && (
                <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Lead Health & Conversion Score</span>
                    <span className="font-bold text-emerald-700">{lead.score || 0} / 100</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {lead.scoreBreakdown.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          {f.points > 0 ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{f.factor}</span>
                        </div>
                        <span className={f.points > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                          +{f.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVITY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Quick Note Input */}
              <form onSubmit={handleAddActivity} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Log Interaction / Note</span>
                  <div className="flex items-center gap-1">
                    {(['note', 'call', 'meeting', 'whatsapp'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewNoteType(t)}
                        className={`text-[10px] px-2 py-0.5 rounded capitalize ${newNoteType === t ? 'bg-blue-600 text-white font-semibold' : 'bg-white border text-slate-600'
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={2}
                  required
                  placeholder={`Write ${newNoteType} details (e.g. Discussed drawing tolerances with purchase manager...)`}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 text-slate-800"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>

              {/* Timeline Items */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {activities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    No logged interactions yet.
                  </div>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="relative flex items-start gap-3 pl-1">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 z-10 text-[10px] font-bold shadow-2xs">
                        {act.type === 'call' ? '📞' : act.type === 'meeting' ? '🤝' : act.type === 'quotation_created' ? '📄' : '📝'}
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg flex-1 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{act.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(act.performedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        {act.description && (
                          <div className="text-xs text-slate-700 leading-relaxed">
                            {act.description}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 pt-0.5">
                          By: {act.performedBy}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FOLLOW-UPS */}
          {activeTab === 'followups' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Scheduled Follow-ups</span>
                <button
                  onClick={() => onScheduleFollowup(lead)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-medium hover:bg-blue-100"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Follow-up</span>
                </button>
              </div>

              {followups.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No upcoming follow-ups booked for this lead.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {followups.map(flw => (
                    <div
                      key={flw.id}
                      className={`p-3 rounded-lg border space-y-2 ${flw.isCompleted
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-blue-200 shadow-2xs'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{flw.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono uppercase">
                              {flw.type}
                            </span>
                            {flw.isCompleted && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                                Completed ({flw.outcome || 'Done'})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Date: {flw.scheduledDate} {flw.scheduledTime} · Assigned: {flw.assignedTo}
                          </div>
                        </div>

                        {!flw.isCompleted && (
                          <button
                            onClick={() => setCompletingFollowupId(flw.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded"
                          >
                            Mark Done
                          </button>
                        )}
                      </div>

                      {flw.notes && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          {flw.notes}
                        </div>
                      )}

                      {/* Outcome Form Modal/Dropdown if completing */}
                      {completingFollowupId === flw.id && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md space-y-2 mt-2">
                          <div className="font-semibold text-slate-800">Record Follow-up Outcome</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-600">Call Outcome</label>
                              <select
                                value={completionOutcome}
                                onChange={(e) => setCompletionOutcome(e.target.value as any)}
                                className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                              >
                                <option value="connected">Connected / Discussed</option>
                                <option value="no_answer">No Answer / Switched Off</option>
                                <option value="interested">Interested - Prepare Quote</option>
                                <option value="meeting_scheduled">Meeting Scheduled</option>
                                <option value="requirement_received">Drawings/Requirement Received</option>
                                <option value="call_back_later">Call Back Later</option>
                                <option value="not_interested">Not Interested / Disqualified</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-600">Notes</label>
                              <input
                                type="text"
                                placeholder="Outcome details..."
                                value={completionNotes}
                                onChange={(e) => setCompletionNotes(e.target.value)}
                                className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => setCompletingFollowupId(null)}
                              className="px-2 py-1 text-[11px] border bg-white rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleCompleteFollowup(flw.id)}
                              className="px-2.5 py-1 text-[11px] bg-blue-600 text-white rounded font-medium"
                            >
                              Confirm Outcome
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SPECS & REQUIREMENTS */}
          {activeTab === 'requirements' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="font-bold text-slate-800 text-sm">Manufacturing Part Specifications</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 font-medium">Product / Component Category:</span>
                    <div className="text-slate-900 font-semibold mt-0.5">{lead.productInterest || 'Precision Machining'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Batch / Order Quantity:</span>
                    <div className="text-slate-900 font-semibold font-mono mt-0.5">{lead.targetQuantity || '1000'} Units</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Target Delivery Timeline:</span>
                    <div className="text-slate-900 font-semibold mt-0.5">{lead.targetDeliveryDate || 'Within 15 days of PO'}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Budgeted Deal Value:</span>
                    <div className="text-slate-900 font-semibold font-mono mt-0.5">₹{lead.dealValue.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Technical Notes & Drawing Tolerances:</span>
                  <div className="mt-1 p-2.5 bg-white border border-slate-200 rounded text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {lead.requirementDescription || 'No detailed drawing specifications provided yet. Follow-up to request 2D PDF / 3D STEP files.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: QUOTATIONS */}
          {activeTab === 'quotations' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Linked Quotations</span>
                <button
                  onClick={() => onConvertQuotation(lead.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create Quote Draft</span>
                </button>
              </div>

              {quotations.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-slate-700 font-medium">No quotations generated yet</div>
                  <div className="text-slate-500 text-[11px]">
                    Click "Create Quote Draft" to automatically carry forward customer name, lead ID, and requirement specs into the Quotations module.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {quotations.map(q => (
                    <div key={q.id} className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700">{q.quotationNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold uppercase">
                            {q.status}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{q.grandTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Date: {q.quoteDate} · Valid Until: {q.validUntil}
                      </div>
                      {q.items && q.items.length > 0 && (
                        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
                          Items: {q.items.map(it => `${it.itemName} (${it.quantity} pcs)`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Uploaded Drawings & RFQs</span>
                <button
                  onClick={() => setIsUploadingDoc(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-medium hover:bg-blue-100"
                >
                  <Plus className="w-3 h-3" />
                  <span>Attach Document</span>
                </button>
              </div>

              {isUploadingDoc && (
                <form onSubmit={handleAddDocument} className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-2">
                  <div className="font-semibold text-slate-800">Attach Technical Drawing / PDF</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 font-semibold">File Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bush_REV_B_Machining.pdf"
                        value={docFileName}
                        onChange={(e) => setDocFileName(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-semibold">Notes / Version</label>
                      <input
                        type="text"
                        placeholder="e.g. 2D drawing with tolerances"
                        value={docNotes}
                        onChange={(e) => setDocNotes(e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsUploadingDoc(false)}
                      className="px-2 py-1 text-[11px] border bg-white rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-[11px] bg-blue-600 text-white rounded font-medium"
                    >
                      Upload File
                    </button>
                  </div>
                </form>
              )}

              {documents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 italic">
                  No technical drawings or spec sheets uploaded for this inquiry.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">{doc.fileName}</div>
                          <div className="text-[10px] text-slate-400">
                            Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                            {doc.notes && ` · ${doc.notes}`}
                          </div>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl || '#'}
                        onClick={(e) => { e.preventDefault(); alert(`Simulated download for ${doc.fileName}`); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Download / View"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
