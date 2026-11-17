import React from 'react';
import { 
  FileText, 
  Clock, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  ArrowRight,
  Eye,
  Calendar,
  Building2
} from 'lucide-react';
import { Quotation } from '../../types/erp';
import { formatIndianCurrency } from '../../utils/indianCurrency';

interface QuotationDashboardProps {
  quotations: Quotation[];
  onViewQuotation: (quote: Quotation) => void;
  onCreateNew: () => void;
  onConvertToSalesOrder: (quote: Quotation) => void;
}

export const QuotationDashboard: React.FC<QuotationDashboardProps> = ({
  quotations,
  onViewQuotation,
  onCreateNew,
  onConvertToSalesOrder
}) => {
  // Aggregate real statistics from actual database records
  const totalCount = quotations.length;
  const draftQuotes = quotations.filter(q => q.status === 'draft');
  const pendingApprovalQuotes = quotations.filter(q => q.status === 'pending_approval');
  const sentQuotes = quotations.filter(q => q.status === 'sent' || q.status === 'under_negotiation');
  const acceptedQuotes = quotations.filter(q => q.status === 'accepted' || q.status === 'converted_to_order');
  const rejectedQuotes = quotations.filter(q => q.status === 'rejected');

  const now = new Date();
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);

  const expiringSoonQuotes = quotations.filter(q => {
    if (q.status === 'accepted' || q.status === 'rejected' || q.status === 'converted_to_order' || q.status === 'cancelled' || q.status === 'superseded') {
      return false;
    }
    const valDate = new Date(q.validUntil);
    return valDate >= now && valDate <= sevenDaysFromNow;
  });

  const totalValue = quotations
    .filter(q => q.status !== 'superseded' && q.status !== 'cancelled')
    .reduce((acc, q) => acc + (q.grandTotal || 0), 0);

  const acceptedValue = acceptedQuotes.reduce((acc, q) => acc + (q.grandTotal || 0), 0);

  // Conversion rate: Accepted / (Accepted + Rejected + Sent) * 100
  const decisiveCount = acceptedQuotes.length + rejectedQuotes.length;
  const conversionRate = decisiveCount > 0 ? Math.round((acceptedQuotes.length / decisiveCount) * 100) : (acceptedQuotes.length > 0 ? 100 : 0);

  // Monthly performance calculation (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData: { month: string; value: number; count: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substr(2, 2)}`;
    const mQuotes = quotations.filter(q => {
      const qDate = new Date(q.quoteDate);
      return qDate.getMonth() === d.getMonth() && qDate.getFullYear() === d.getFullYear();
    });
    const val = mQuotes.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
    monthlyData.push({ month: mStr, value: val, count: mQuotes.length });
  }

  const maxMonthVal = Math.max(1, ...monthlyData.map(m => m.value));

  // Quick Action Queues
  const awaitingResponse = quotations.filter(q => q.status === 'sent' || q.status === 'under_negotiation').slice(0, 5);
  const recentlyAccepted = quotations.filter(q => q.status === 'accepted' && !q.convertedSalesOrderId).slice(0, 5);
  const recentlyRejected = quotations.filter(q => q.status === 'rejected').slice(0, 5);
  const recentAll = [...quotations].sort((a, b) => new Date(b.quoteDate).getTime() - new Date(a.quoteDate).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">
      
      {/* 9 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
        {/* 1. Total */}
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-2xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Total Quotes</div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All series</div>
        </div>

        {/* 2. Draft */}
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-2xs">
          <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Draft</div>
          <div className="text-xl font-bold text-slate-700 mt-1 font-mono">{draftQuotes.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">In preparation</div>
        </div>

        {/* 3. Pending Approval */}
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-2xs">
          <div className="text-[10px] text-amber-700 font-bold uppercase truncate">Pending Review</div>
          <div className="text-xl font-bold text-amber-700 mt-1 font-mono">{pendingApprovalQuotes.length}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Managerial signoff</div>
        </div>

        {/* 4. Sent */}
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-2xs">
          <div className="text-[10px] text-blue-700 font-bold uppercase truncate">Sent to Client</div>
          <div className="text-xl font-bold text-blue-700 mt-1 font-mono">{sentQuotes.length}</div>
          <div className="text-[10px] text-blue-500 mt-0.5">Awaiting response</div>
        </div>

        {/* 5. Accepted */}
        <div className="p-3 bg-white border border-emerald-300 rounded-md shadow-2xs bg-emerald-50/20">
          <div className="text-[10px] text-emerald-800 font-bold uppercase truncate">Accepted</div>
          <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{acceptedQuotes.length}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Ready for SO</div>
        </div>

        {/* 6. Rejected */}
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-2xs">
          <div className="text-[10px] text-red-700 font-bold uppercase truncate">Rejected</div>
          <div className="text-xl font-bold text-red-600 mt-1 font-mono">{rejectedQuotes.length}</div>
          <div className="text-[10px] text-red-400 mt-0.5">Client opt-out</div>
        </div>

        {/* 7. Expiring Soon */}
        <div className="p-3 bg-white border border-orange-200 rounded-md shadow-2xs bg-orange-50/20">
          <div className="text-[10px] text-orange-800 font-bold uppercase truncate">Expiring Soon</div>
          <div className="text-xl font-bold text-orange-700 mt-1 font-mono">{expiringSoonQuotes.length}</div>
          <div className="text-[10px] text-orange-600 mt-0.5">&lt; 7 Days validity</div>
        </div>

        {/* 8. Total Pipeline Value */}
        <div className="p-3 bg-white border border-slate-200 rounded-md shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] text-slate-500 font-bold uppercase truncate">Quoted Pipeline</div>
          <div className="text-sm font-black text-slate-900 mt-1 font-mono truncate">
            {formatIndianCurrency(totalValue, false)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Taxable + GST</div>
        </div>

        {/* 9. Won / Accepted Value */}
        <div className="p-3 bg-white border border-emerald-300 rounded-md shadow-2xs col-span-2 sm:col-span-1 bg-emerald-50/30">
          <div className="text-[10px] text-emerald-800 font-bold uppercase truncate">Won Quotations</div>
          <div className="text-sm font-black text-emerald-800 mt-1 font-mono truncate">
            {formatIndianCurrency(acceptedValue, false)}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Win Rate: {conversionRate}%</div>
        </div>
      </div>

      {/* Analytics & Performance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Trend (2 columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Monthly Quotation Value (Last 6 Months)</h3>
              <p className="text-[11px] text-slate-500">Commercial proposal flow generated from actual database records.</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-blue-700 font-mono">
                {formatIndianCurrency(totalValue, false)}
              </span>
              <span className="text-[10px] text-slate-400 block">Total Pipeline</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="pt-4 pb-2">
            <div className="h-40 flex items-end justify-between gap-3 px-2 border-b border-slate-200">
              {monthlyData.map((m, idx) => {
                const heightPct = Math.max(8, Math.round((m.value / maxMonthVal) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="text-[9px] font-mono text-slate-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{m.value > 100000 ? `${(m.value / 100000).toFixed(1)}L` : (m.value / 1000).toFixed(0) + 'k'}
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[42px] bg-blue-600 group-hover:bg-blue-500 rounded-t transition-all"
                    />
                    <div className="text-[10px] font-mono text-slate-600 mt-2 truncate w-full text-center">
                      {m.month}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      {m.count} Q
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Distribution & Conversion Funnel */}
        <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Conversion Funnel & Health</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Win ratio and quote-to-order pipeline velocity.</p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">Conversion Win Rate</span>
                <span className="font-mono font-bold text-emerald-700">{conversionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                <div style={{ width: `${conversionRate}%` }} className="bg-emerald-600 h-full" />
                <div style={{ width: `${100 - conversionRate}%` }} className="bg-red-400 h-full" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>{acceptedQuotes.length} Accepted</span>
                <span>{rejectedQuotes.length} Rejected</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Drafts (Unsent)</span>
                </span>
                <span className="font-mono font-semibold">{draftQuotes.length}</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Dispatched to Client</span>
                </span>
                <span className="font-mono font-semibold">{sentQuotes.length}</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Accepted / Confirmed</span>
                </span>
                <span className="font-mono font-semibold text-emerald-700">{acceptedQuotes.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onCreateNew}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate New Quotation</span>
          </button>
        </div>

      </div>

      {/* Actionable Queues Section (4 Column Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Queue 1: Ready to Convert to Sales Order */}
        <div className="bg-white border border-emerald-200 rounded-md p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span>Accepted - Ready for Sales Order ({recentlyAccepted.length})</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              High Priority
            </span>
          </div>

          {recentlyAccepted.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No pending accepted quotations awaiting order conversion.
            </div>
          ) : (
            <div className="space-y-2">
              {recentlyAccepted.map(q => (
                <div key={q.id} className="p-2.5 bg-emerald-50/40 border border-emerald-150 rounded flex items-center justify-between hover:bg-emerald-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs font-mono">{q.quotationNumber}</div>
                    <div className="text-[11px] text-slate-600 truncate max-w-[180px]">{q.customerName}</div>
                    <div className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">₹{q.grandTotal.toLocaleString('en-IN')}</div>
                  </div>
                  <button
                    onClick={() => onConvertToSalesOrder(q)}
                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Convert to Live Sales Order"
                  >
                    <span>Create SO</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue 2: Awaiting Customer Response */}
        <div className="bg-white border border-blue-200 rounded-md p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Awaiting Client Response ({awaitingResponse.length})</span>
            </div>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
              Follow-up
            </span>
          </div>

          {awaitingResponse.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No active quotations currently with customers.
            </div>
          ) : (
            <div className="space-y-2">
              {awaitingResponse.map(q => (
                <div key={q.id} className="p-2.5 bg-blue-50/30 border border-blue-100 rounded flex items-center justify-between hover:bg-blue-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs font-mono">{q.quotationNumber} ({q.revision})</div>
                    <div className="text-[11px] text-slate-600 truncate max-w-[180px]">{q.customerName}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">Expires: {q.validUntil}</div>
                  </div>
                  <button
                    onClick={() => onViewQuotation(q)}
                    className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-blue-700 cursor-pointer"
                    title="View Quotation"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue 3: Expiring Soon (< 7 Days) */}
        <div className="bg-white border border-orange-200 rounded-md p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-orange-100 pb-2">
            <div className="flex items-center gap-1.5 text-orange-900 font-bold text-xs">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Quotations Expiring Soon ({expiringSoonQuotes.length})</span>
            </div>
            <span className="text-[10px] font-mono bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
              Validity Alert
            </span>
          </div>

          {expiringSoonQuotes.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No quotations expiring in the next 7 days.
            </div>
          ) : (
            <div className="space-y-2">
              {expiringSoonQuotes.map(q => (
                <div key={q.id} className="p-2.5 bg-orange-50/30 border border-orange-150 rounded flex items-center justify-between hover:bg-orange-50 transition-colors">
                  <div>
                    <div className="font-bold text-slate-900 text-xs font-mono">{q.quotationNumber}</div>
                    <div className="text-[11px] text-slate-600 truncate max-w-[180px]">{q.customerName}</div>
                    <div className="text-[10px] font-mono text-orange-700 font-semibold mt-0.5">Expires: {q.validUntil}</div>
                  </div>
                  <button
                    onClick={() => onViewQuotation(q)}
                    className="p-1.5 bg-white border border-slate-200 rounded text-slate-600 hover:text-orange-700 cursor-pointer"
                    title="Review Quote"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
