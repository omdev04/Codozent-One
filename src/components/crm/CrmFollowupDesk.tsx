import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Phone, MessageSquare, CheckCircle, 
  AlertTriangle, User, Building2, Check, ArrowRight, Plus 
} from 'lucide-react';
import { CrmLead, CrmLeadFollowup, CrmFollowupOutcome } from '../../types/erp';

interface CrmFollowupDeskProps {
  followups: CrmLeadFollowup[];
  leads: CrmLead[];
  onSelectLead: (lead: CrmLead) => void;
  onUpdateFollowup: (id: string, updates: Partial<CrmLeadFollowup>) => Promise<void>;
  onScheduleNewFollowup: (lead?: CrmLead) => void;
}

export const CrmFollowupDesk: React.FC<CrmFollowupDeskProps> = ({
  followups,
  leads,
  onSelectLead,
  onUpdateFollowup,
  onScheduleNewFollowup
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<CrmFollowupOutcome>('connected');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00');

  const todayStr = new Date().toISOString().split('T')[0];

  // Bucket followups
  const { todayList, upcomingList, overdueList, completedList } = useMemo(() => {
    const today: CrmLeadFollowup[] = [];
    const upcoming: CrmLeadFollowup[] = [];
    const overdue: CrmLeadFollowup[] = [];
    const completed: CrmLeadFollowup[] = [];

    followups.forEach(f => {
      if (f.isCompleted) {
        completed.push(f);
      } else if (f.scheduledDate === todayStr) {
        today.push(f);
      } else if (f.scheduledDate > todayStr) {
        upcoming.push(f);
      } else {
        overdue.push(f);
      }
    });

    return {
      todayList: today.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || '')),
      upcomingList: upcoming.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
      overdueList: overdue.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
      completedList: completed.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
    };
  }, [followups, todayStr]);

  const currentList = 
    activeTab === 'today' ? todayList :
    activeTab === 'upcoming' ? upcomingList :
    activeTab === 'overdue' ? overdueList : completedList;

  const handleComplete = async (fId: string) => {
    await onUpdateFollowup(fId, {
      isCompleted: true,
      outcome,
      outcomeNotes
    });
    setCompletingId(null);
    setOutcomeNotes('');
  };

  const handleReschedule = async (fId: string) => {
    if (!newDate) return;
    await onUpdateFollowup(fId, {
      scheduledDate: newDate,
      scheduledTime: newTime
    });
    setReschedulingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('today')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            activeTab === 'today' 
              ? 'bg-blue-50 border-blue-600 shadow-2xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Due Today</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{todayList.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">High priority client actions</div>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            activeTab === 'overdue' 
              ? 'bg-red-50 border-red-600 shadow-2xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">Overdue</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{overdueList.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Missed follow-up deadlines</div>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            activeTab === 'upcoming' 
              ? 'bg-indigo-50 border-indigo-600 shadow-2xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Upcoming</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{upcomingList.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Next 7 days schedule</div>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-3.5 rounded-lg border text-left transition-all ${
            activeTab === 'completed' 
              ? 'bg-emerald-50 border-emerald-600 shadow-2xs' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{completedList.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Logged calls & outcomes</div>
        </button>
      </div>

      {/* Follow-up Items Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>
              {activeTab === 'today' ? "Today's Follow-up Agenda" :
               activeTab === 'overdue' ? 'Overdue Follow-ups (Urgent Action Needed)' :
               activeTab === 'upcoming' ? 'Scheduled Future Follow-ups' : 'Historical Completed Follow-ups'}
            </span>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-mono">
              {currentList.length}
            </span>
          </div>
        </div>

        {currentList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 italic">
            No follow-ups in this queue. Great job staying on top of client communications!
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map(flw => {
              const matchedLead = leads.find(l => l.id === flw.leadId);

              return (
                <div
                  key={flw.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-400 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{flw.title}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
                          {flw.type}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {flw.scheduledDate} {flw.scheduledTime}
                        </span>
                      </div>

                      {matchedLead && (
                        <div 
                          onClick={() => onSelectLead(matchedLead)}
                          className="text-xs text-blue-700 hover:underline font-semibold cursor-pointer mt-1 flex items-center gap-1.5"
                        >
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{matchedLead.companyName} ({matchedLead.contactName}) · Deal: ₹{matchedLead.dealValue.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!flw.isCompleted && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {matchedLead?.phone && (
                          <a
                            href={`tel:${matchedLead.phone}`}
                            className="p-1.5 bg-white border border-slate-300 text-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                            title="Call Phone"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        {matchedLead?.phone && (
                          <a
                            href={`https://wa.me/91${matchedLead.phone.replace(/[^0-9]/g, '').slice(-10)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded hover:bg-emerald-100 transition-colors"
                            title="WhatsApp Chat"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => setCompletingId(flw.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Log Outcome</span>
                        </button>
                        <button
                          onClick={() => {
                            setReschedulingId(flw.id);
                            setNewDate(flw.scheduledDate);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded transition-colors"
                        >
                          Reschedule
                        </button>
                      </div>
                    )}
                  </div>

                  {flw.notes && (
                    <div className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-100">
                      {flw.notes}
                    </div>
                  )}

                  {/* Outcome display if completed */}
                  {flw.isCompleted && (
                    <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-200 flex items-center justify-between">
                      <div>
                        <strong>Outcome:</strong> {flw.outcome?.replace(/_/g, ' ').toUpperCase()}
                        {flw.outcomeNotes && ` · ${flw.outcomeNotes}`}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {flw.completedAt ? new Date(flw.completedAt).toLocaleDateString('en-IN') : ''}
                      </span>
                    </div>
                  )}

                  {/* Complete Form Modal Strip */}
                  {completingId === flw.id && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2 mt-2 text-xs animate-in fade-in duration-150">
                      <div className="font-bold text-slate-800">Record Follow-up Outcome</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Discussion Outcome</label>
                          <select
                            value={outcome}
                            onChange={(e) => setOutcome(e.target.value as any)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                          >
                            <option value="connected">Connected & Requirements Discussed</option>
                            <option value="no_answer">No Answer / Line Busy</option>
                            <option value="interested">High Interest - Send Quotation Draft</option>
                            <option value="meeting_scheduled">Plant / In-Person Meeting Fixed</option>
                            <option value="requirement_received">Engineering Drawings Received</option>
                            <option value="call_back_later">Requested Call Back Later</option>
                            <option value="not_interested">Not Interested / Project Shelved</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Key Takeaway / Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. Client requested sample quote for 5000 units by Thursday."
                            value={outcomeNotes}
                            onChange={(e) => setOutcomeNotes(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setCompletingId(null)}
                          className="px-2.5 py-1 text-xs border border-slate-300 bg-white rounded text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleComplete(flw.id)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
                        >
                          Save & Mark Completed
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reschedule Strip */}
                  {reschedulingId === flw.id && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-2 mt-2 text-xs animate-in fade-in duration-150">
                      <div className="font-bold text-amber-900">Reschedule Follow-up</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">New Date</label>
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">New Time</label>
                          <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setReschedulingId(null)}
                          className="px-2.5 py-1 text-xs border border-slate-300 bg-white rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReschedule(flw.id)}
                          className="px-3 py-1 text-xs bg-amber-600 text-white font-medium rounded hover:bg-amber-700"
                        >
                          Update Schedule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
