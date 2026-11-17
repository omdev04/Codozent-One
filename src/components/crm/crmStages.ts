import { CrmLeadStatus } from '../../types/erp';

export interface CrmStageConfig {
  id: CrmLeadStatus;
  label: string;
  color: string;
  badgeBg: string;
}

export const CRM_STAGES: CrmStageConfig[] = [
  { id: 'new', label: 'New Lead', color: '#0057d2', badgeBg: 'bg-blue-50 text-blue-700' },
  { id: 'contacted', label: 'Contacted', color: '#0284c7', badgeBg: 'bg-sky-50 text-sky-700' },
  { id: 'qualified', label: 'Qualified', color: '#0d9488', badgeBg: 'bg-teal-50 text-teal-700' },
  { id: 'requirement_understanding', label: 'Req. Understanding', color: '#d97706', badgeBg: 'bg-amber-50 text-amber-700' },
  { id: 'quotation_preparation', label: 'Quote Prep', color: '#7c3aed', badgeBg: 'bg-purple-50 text-purple-700' },
  { id: 'quotation_sent', label: 'Quote Sent', color: '#6366f1', badgeBg: 'bg-indigo-50 text-indigo-700' },
  { id: 'negotiation', label: 'Negotiation', color: '#ea580c', badgeBg: 'bg-orange-50 text-orange-700' },
  { id: 'won', label: 'Won Deal', color: '#16a34a', badgeBg: 'bg-emerald-50 text-emerald-700' },
  { id: 'lost', label: 'Lost Deal', color: '#64748b', badgeBg: 'bg-slate-100 text-slate-700' },
  { id: 'on_hold', label: 'On Hold', color: '#94a3b8', badgeBg: 'bg-slate-50 text-slate-600' }
];
