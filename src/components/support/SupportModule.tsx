import React, { useState } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Send, 
  User, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SupportTicket } from '../../types/erp';

export const SupportModule: React.FC = () => {
  const { 
    supportTickets, 
    createSupportTicket, 
    replySupportTicket, 
    updateTicketStatus,
    activeCompany,
    currentUser 
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Ticket Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'quality_issue' | 'delivery_delay' | 'billing_discrepancy' | 'order_inquiry' | 'general'>('quality_issue');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [initialMessage, setInitialMessage] = useState('');

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !subject.trim() || !initialMessage.trim()) return;
    setIsSubmitting(true);
    try {
      await createSupportTicket({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '9876543210',
        subject: subject.trim(),
        category,
        priority,
        status: 'open',
        slaHoursRemaining: priority === 'urgent' ? 4 : priority === 'high' ? 8 : 24,
        assignedTo: 'Support Operations',
        messages: [
          {
            id: `msg-${Date.now()}`,
            sender: customerName.trim(),
            senderType: 'customer',
            message: initialMessage.trim(),
            timestamp: new Date().toISOString()
          }
        ]
      });
      setIsCreateOpen(false);
      setCustomerName('');
      setSubject('');
      setInitialMessage('');
    } catch (err: any) {
      alert(`Error creating ticket: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;
    try {
      await replySupportTicket(selectedTicket.id, replyContent.trim());
      setReplyContent('');
      const updated = supportTickets.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    } catch (err: any) {
      alert(`Reply error: ${err.message}`);
    }
  };

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      await updateTicketStatus(ticketId, status);
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const filteredTickets = supportTickets.filter(t => {
    const matchSearch = t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openTicketsCount = supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedCount = supportTickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-canvas border-b border-hairline pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-nav mb-1">
            <span>Customer Care</span>
            <span>/</span>
            <span className="text-primary font-medium">Helpdesk & Support</span>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Support & ISO Complaints Desk</h1>
          <p className="text-xs text-ink-body mt-0.5">
            Customer inquiries, delivery discrepancy resolution, ISO 9001 customer complaint logs, and SLA workflows.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-chrome border border-hairline rounded-md">
          <span className="text-xs text-ink-nav">Open & Active Tickets</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{openTicketsCount}</div>
          <div className="text-[11px] text-ink-meta mt-1">Pending resolution within SLA</div>
        </div>
        <div className="p-4 bg-chrome border border-hairline rounded-md">
          <span className="text-xs text-ink-nav">Resolved Cases</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-ink-meta mt-1">Closed successfully</div>
        </div>
        <div className="p-4 bg-chrome border border-hairline rounded-md">
          <span className="text-xs text-ink-nav">Avg SLA Compliance</span>
          <div className="text-2xl font-bold text-primary mt-1">98.4%</div>
          <div className="text-[11px] text-ink-meta mt-1">Under ISO 9001 Quality Benchmarks</div>
        </div>
      </div>

      {/* Layout: Ticket List (Left 6 cols) + Thread Detail (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-canvas p-2.5 border border-hairline rounded-md flex items-center gap-2">
            <Search className="w-4 h-4 text-ink-nav shrink-0" />
            <input
              type="text"
              placeholder="Search tickets by #, customer, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-transparent focus:outline-none text-ink"
            />
          </div>

          <div className="bg-canvas border border-hairline rounded-md divide-y divide-hairline max-h-[600px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-meta">
                <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-40 text-ink-nav" />
                No support tickets found. Click "New Ticket" to log a customer issue.
              </div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    selectedTicket?.id === t.id ? 'bg-band-blue border-l-4 border-l-primary' : 'hover:bg-chrome/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-primary">{t.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-chrome text-ink-nav'
                    }`}>
                      {t.priority.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-ink mt-1 line-clamp-1">{t.subject}</div>
                  <div className="text-[11px] text-ink-nav mt-0.5">{t.customerName}</div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline text-[10px] text-ink-meta">
                    <span className="capitalize">{t.category.replace('_', ' ')}</span>
                    <span className={`font-medium ${
                      t.status === 'resolved' ? 'text-emerald-600' :
                      t.status === 'in_progress' ? 'text-blue-600' : 'text-amber-600'
                    }`}>
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread */}
        <div className="lg:col-span-6 bg-canvas border border-hairline rounded-md flex flex-col h-[650px]">
          {selectedTicket ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-hairline bg-chrome flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{selectedTicket.ticketNumber}</span>
                    <span className="text-xs font-semibold text-ink">{selectedTicket.subject}</span>
                  </div>
                  <div className="text-[11px] text-ink-nav mt-0.5">
                    Customer: <strong>{selectedTicket.customerName}</strong>
                  </div>
                </div>

                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className="text-xs px-2 py-1 bg-canvas border border-hairline rounded font-medium text-ink"
                >
                  <option value="open">OPEN</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="waiting_on_client">WAITING ON CLIENT</option>
                  <option value="resolved">RESOLVED</option>
                </select>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-md max-w-sm text-xs space-y-1 ${
                      msg.senderType === 'staff'
                        ? 'ml-auto bg-band-blue border border-primary/20 text-ink'
                        : 'mr-auto bg-chrome border border-hairline text-ink-body'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-ink-meta font-medium">
                      <span>{msg.sender} ({msg.senderType === 'staff' ? 'Factory Staff' : 'Customer'})</span>
                      <span>{msg.timestamp ? msg.timestamp.split('T')[1]?.slice(0, 5) : ''}</span>
                    </div>
                    <p className="text-xs">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-3 border-t border-hairline bg-chrome/30 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type official reply to customer..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  className="flex-1 text-xs px-3 py-2 bg-canvas border border-hairline rounded text-ink focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleSendReply}
                  className="btn-primary text-xs py-2 px-3.5 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-ink-meta text-xs">
              <LifeBuoy className="w-10 h-10 opacity-30 mb-2" />
              <span>Select a ticket from the left to view the thread & respond.</span>
            </div>
          )}
        </div>
      </div>

      {/* New Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-canvas border border-hairline rounded-md max-w-md w-full shadow-lg">
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-chrome">
              <h3 className="text-base font-bold text-ink">Raise Support Ticket</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-ink-nav hover:text-ink cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Customer / Client Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Pune Auto Components Ltd"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Subject / Issue Summary *</label>
                <input
                  type="text"
                  placeholder="e.g. Dimensions out of tolerance on Batch 402"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink-nav mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                  >
                    <option value="quality_issue">Quality Discrepancy</option>
                    <option value="delivery_delay">Dispatch / Delivery Delay</option>
                    <option value="billing_discrepancy">Invoice / Tax Mismatch</option>
                    <option value="order_inquiry">Order Inquiry</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-nav mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-chrome border border-hairline rounded-md text-ink"
                  >
                    <option value="urgent">Urgent (4hr SLA)</option>
                    <option value="high">High (8hr SLA)</option>
                    <option value="medium">Medium (24hr SLA)</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-nav mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  placeholder="Explain the problem reported by the client..."
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-chrome border border-hairline rounded-md text-ink"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-outline text-xs px-3 py-1.5 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-xs px-4 py-1.5 cursor-pointer">
                  {isSubmitting ? 'Logging...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
