import React from 'react';
import { 
  Users, TrendingUp, CheckCircle, Clock, AlertTriangle, 
  FileCheck, ShieldCheck, IndianRupee, ArrowRight, Award, 
  Building2, Phone, Calendar 
} from 'lucide-react';
import { CrmLead, CrmLeadFollowup } from '../../types/erp';
import { CRM_STAGES } from './crmStages';

interface CrmDashboardProps {
  leads: CrmLead[];
  followups: CrmLeadFollowup[];
  onSelectLead: (lead: CrmLead) => void;
  onNavigateToTab: (tab: 'table' | 'followups') => void;
  onNewLeadClick: () => void;
}

export const CrmDashboard: React.FC<CrmDashboardProps> = ({
  leads,
  followups,
  onSelectLead,
  onNavigateToTab,
  onNewLeadClick
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Tenant Metrics (Live Computed)
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === 'new').length;
  const contacted = leads.filter(l => l.status === 'contacted').length;
  const qualified = leads.filter(l => l.status === 'qualified' || l.status === 'requirement_understanding').length;
  const quotesSent = leads.filter(l => l.status === 'quotation_sent' || l.status === 'quotation_preparation' || (l.status as any) === 'proposal').length;
  const won = leads.filter(l => l.status === 'won').length;
  const lost = leads.filter(l => l.status === 'lost').length;
  const dueTodayFollowups = followups.filter(f => !f.isCompleted && f.scheduledDate === todayStr).length;

  const totalPipelineValue = leads
    .filter(l => l.status !== 'lost' && l.status !== 'won')
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  const wonDealsValue = leads
    .filter(l => l.status === 'won')
    .reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);

  // Source Breakdown
  const sourceCounts = leads.reduce((acc: Record<string, number>, l) => {
    const src = l.source || 'other';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingFollowups = followups
    .filter(f => !f.isCompleted)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* 8 Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Inquiries', val: totalLeads, color: 'text-slate-900', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'New Leads', val: newLeads, color: 'text-blue-600', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Contacted', val: contacted, color: 'text-sky-600', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Qualified', val: qualified, color: 'text-teal-600', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Quotes Sent', val: quotesSent, color: 'text-purple-600', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Won Deals', val: won, color: 'text-emerald-700', bg: 'bg-emerald-50/50', border: 'border-emerald-200' },
          { label: 'Lost Deals', val: lost, color: 'text-slate-500', bg: 'bg-white', border: 'border-slate-200' },
          { label: 'Due Today', val: dueTodayFollowups, color: 'text-red-600 font-bold', bg: 'bg-red-50/50', border: 'border-red-200' }
        ].map((kpi, idx) => (
          <div key={idx} className={`p-3 rounded-lg border ${kpi.border} ${kpi.bg} shadow-2xs`}>
            <div className="text-[11px] font-medium text-slate-500 truncate">{kpi.label}</div>
            <div className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Commercial Value Hero Band */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Active Pipeline Value</div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              ₹{totalPipelineValue.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="h-10 w-px bg-blue-200 hidden sm:block" />
          <div>
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Deals Won & Converted</div>
            <div className="text-2xl font-bold text-emerald-700 mt-0.5">
              ₹{wonDealsValue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('table')}
            className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            View All Leads
          </button>
          <button
            onClick={onNewLeadClick}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            + New Lead Intake
          </button>
        </div>
      </div>

      {/* Grid: Pipeline Stage Distribution & Lead Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stage Distribution (2 cols) */}
        <div className="lg:col-span-2 p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sales Pipeline Stage Distribution
            </h3>
            <span className="text-[11px] text-slate-500">Live tenant distribution</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {CRM_STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.status === stage.id || (stage.id === 'quotation_sent' && (l.status as any) === 'proposal'));
              const stageValue = stageLeads.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);
              const percentage = totalLeads > 0 ? Math.round((stageLeads.length / totalLeads) * 100) : 0;

              return (
                <div key={stage.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="font-medium text-slate-800">{stage.label}</span>
                      <span className="text-slate-400 text-[11px]">({stageLeads.length})</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{stageValue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(percentage, stageLeads.length > 0 ? 5 : 0)}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Breakdown (1 col) */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Lead Channels
            </h3>
            <span className="text-[11px] text-slate-500">{totalLeads} Total</span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { id: 'indiamart', label: 'IndiaMART Buyers', color: 'bg-blue-600' },
              { id: 'justdial', label: 'JustDial Leads', color: 'bg-orange-500' },
              { id: 'whatsapp', label: 'WhatsApp Direct', color: 'bg-emerald-600' },
              { id: 'direct', label: 'Direct Walk-In / Plant Visit', color: 'bg-sky-600' },
              { id: 'referral', label: 'Customer Referrals', color: 'bg-purple-600' },
              { id: 'trade_fair', label: 'Trade Expo / IMTEX', color: 'bg-amber-600' },
              { id: 'other', label: 'Others / Website', color: 'bg-slate-400' }
            ].map(src => {
              const count = sourceCounts[src.id] || (src.id === 'other' ? (sourceCounts['other'] || 0) + (sourceCounts['google'] || 0) + (sourceCounts['meta_ads'] || 0) : 0);
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;

              return (
                <div key={src.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">{src.label}</span>
                    <span className="font-semibold text-slate-900">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${src.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Follow-ups & Recent Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Follow-ups Agenda */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Upcoming Client Follow-ups</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('followups')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View All ({followups.filter(f => !f.isCompleted).length})
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {upcomingFollowups.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No pending follow-ups scheduled.
              </div>
            ) : (
              upcomingFollowups.map(flw => {
                const matchedLead = leads.find(l => l.id === flw.leadId);
                const isOverdue = flw.scheduledDate < todayStr;
                const isToday = flw.scheduledDate === todayStr;

                return (
                  <div
                    key={flw.id}
                    onClick={() => matchedLead && onSelectLead(matchedLead)}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-md hover:border-blue-400 cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 line-clamp-1">{flw.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {matchedLead ? matchedLead.companyName : 'Inquiry'} · Assigned: {flw.assignedTo}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isOverdue ? 'bg-red-100 text-red-700' :
                        isToday ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {isOverdue ? 'Overdue' : isToday ? 'Today' : flw.scheduledDate}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recently Inquired Leads */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Recently Received Leads</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('table')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View Table ({leads.length})
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {recentLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                No leads recorded yet. Click "+ New Lead Intake" to register the first opportunity.
              </div>
            ) : (
              recentLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-md hover:border-blue-400 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 line-clamp-1">
                      {lead.companyName || lead.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {lead.contactName} · {lead.city || 'Pune'} · Channel: {lead.source}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-slate-900">
                      ₹{Number(lead.dealValue).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold capitalize">
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
