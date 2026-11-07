import React from 'react';
import { 
  Factory, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  IndianRupee, 
  Boxes,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { NavTab } from '../layout/Sidebar';

interface ExecutiveDashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenMRP: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigate, onOpenMRP }) => {
  const { 
    activeCompany, 
    items, 
    salesOrders, 
    workOrders, 
    qualityInspections, 
    chartOfAccounts, 
    calculateMRP 
  } = useERP();

  const shortages = calculateMRP();
  const criticalShortagesCount = shortages.filter(s => s.netShortage > 0).length;

  const activeWorkOrders = workOrders.filter(w => ['scheduled', 'in_progress'].includes(w.status));
  const completedToday = workOrders.reduce((acc, w) => acc + w.producedQuantity, 0);
  const totalPlannedToday = workOrders.reduce((acc, w) => acc + w.plannedQuantity, 0);
  const productionRate = totalPlannedToday > 0 ? Math.round((completedToday / totalPlannedToday) * 100) : 0;

  const totalSalesRevenue = salesOrders.reduce((acc, s) => acc + s.grandTotal, 0);
  const pendingSalesCount = salesOrders.filter(s => ['confirmed', 'in_production'].includes(s.status)).length;

  // Chart of accounts balances
  const bankBalance = chartOfAccounts.find(c => c.accountCode === '1010')?.balance || 3450000;
  const debtorsBalance = chartOfAccounts.find(c => c.accountCode === '1030')?.balance || 2525000;
  const creditorsBalance = chartOfAccounts.find(c => c.accountCode === '2010')?.balance || 673000;
  const gstLiability = chartOfAccounts.find(c => c.accountCode === '2020')?.balance || 142000;

  const lowStockCount = items.filter(i => i.currentStock <= i.reorderLevel).length;
  const pendingQC = qualityInspections.filter(q => q.status !== 'passed').length + workOrders.filter(w => w.status === 'qc_pending').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Plant Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-1 p-6 rounded-2xl border border-hairline shadow-card">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-fin-orange uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-fin-orange animate-ping" />
            Live Plant Operational Overview
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight mt-1">
            {activeCompany.name}
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            {activeCompany.industry} · {activeCompany.city}, {activeCompany.state} (GSTIN: {activeCompany.gstin})
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('sales')}
            className="px-3.5 py-2 rounded-md bg-ink hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            New Sales Order
          </button>
          <button
            onClick={() => onNavigate('manufacturing')}
            className="px-3.5 py-2 rounded-md bg-surface-1 border border-hairline hover:border-ink text-ink text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-card"
          >
            <Factory className="w-3.5 h-3.5" />
            New Work Order
          </button>
          <button
            onClick={onOpenMRP}
            className="px-3.5 py-2 rounded-md bg-fin-orange hover:bg-fin-orangeHover text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            Run MRP Engine
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Lift onto White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Production Output */}
        <div className="bg-surface-1 p-5 rounded-xl border border-hairline shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between text-ink-subtle text-xs font-medium">
            <span>Shop-Floor Output</span>
            <Factory className="w-4 h-4 text-report-blue" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-ink">
              {completedToday} <span className="text-xs font-normal text-ink-subtle">nos</span>
            </div>
            <span className="text-xs font-semibold text-report-green bg-green-50 px-1.5 py-0.5 rounded">
              {productionRate}% of plan
            </span>
          </div>
          <div className="mt-3 w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-report-blue h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(productionRate, 100)}%` }} 
            />
          </div>
          <div className="mt-2 text-[11px] text-ink-muted flex justify-between">
            <span>Target: {totalPlannedToday} nos</span>
            <span>{activeWorkOrders.length} active jobs</span>
          </div>
        </div>

        {/* Pending Orders & Pipeline */}
        <div className="bg-surface-1 p-5 rounded-xl border border-hairline shadow-card">
          <div className="flex items-center justify-between text-ink-subtle text-xs font-medium">
            <span>Pending Sales Orders</span>
            <ShoppingCart className="w-4 h-4 text-report-green" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-ink">
              {pendingSalesCount} <span className="text-xs font-normal text-ink-subtle">orders</span>
            </div>
            <span className="text-xs font-semibold text-ink bg-surface-2 px-1.5 py-0.5 rounded">
              Active Lots
            </span>
          </div>
          <div className="mt-3 text-[11px] text-ink-muted flex items-center justify-between pt-1 border-t border-hairline-soft">
            <span>Total Sales Value</span>
            <span className="font-semibold text-ink font-mono">₹{totalSalesRevenue.toLocaleString('en-IN')}</span>
          </div>
          <button
            onClick={() => onNavigate('sales')}
            className="mt-2 text-[11px] font-medium text-fin-orange hover:underline flex items-center gap-1"
          >
            Review customer orders <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Critical Shortages & Low Stock */}
        <div className="bg-surface-1 p-5 rounded-xl border border-hairline shadow-card">
          <div className="flex items-center justify-between text-ink-subtle text-xs font-medium">
            <span>Material Shortages (MRP)</span>
            <AlertTriangle className="w-4 h-4 text-fin-orange" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-fin-orange">
              {criticalShortagesCount} <span className="text-xs font-normal text-ink-subtle">items</span>
            </div>
            {criticalShortagesCount > 0 ? (
              <span className="text-xs font-bold text-fin-orange bg-fin-orangeLight px-1.5 py-0.5 rounded">
                Action Required
              </span>
            ) : (
              <span className="text-xs font-semibold text-report-green bg-green-50 px-1.5 py-0.5 rounded">
                Stock OK
              </span>
            )}
          </div>
          <div className="mt-3 text-[11px] text-ink-muted flex items-center justify-between pt-1 border-t border-hairline-soft">
            <span>Low Stock Reorders</span>
            <span className="font-semibold text-ink">{lowStockCount} items</span>
          </div>
          <button
            onClick={onOpenMRP}
            className="mt-2 text-[11px] font-medium text-fin-orange hover:underline flex items-center gap-1"
          >
            Explode BOM & Auto-PO <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Quality & Pass Rate */}
        <div className="bg-surface-1 p-5 rounded-xl border border-hairline shadow-card">
          <div className="flex items-center justify-between text-ink-subtle text-xs font-medium">
            <span>Quality Inspection Lock</span>
            <CheckCircle2 className="w-4 h-4 text-report-pink" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-ink">
              98.2% <span className="text-xs font-normal text-ink-subtle">Pass Rate</span>
            </div>
            <span className="text-xs font-semibold text-report-green bg-green-50 px-1.5 py-0.5 rounded">
              PPM &lt; 50
            </span>
          </div>
          <div className="mt-3 text-[11px] text-ink-muted flex items-center justify-between pt-1 border-t border-hairline-soft">
            <span>Pending QC Inspections</span>
            <span className="font-semibold text-ink">{pendingQC} lots</span>
          </div>
          <button
            onClick={() => onNavigate('quality')}
            className="mt-2 text-[11px] font-medium text-ink hover:text-fin-orange transition-colors flex items-center gap-1"
          >
            Open QC inspection queue <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Middle Row: Active Work Orders & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Production Work Orders (2 Columns) */}
        <div className="lg:col-span-2 bg-surface-1 rounded-xl border border-hairline shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Active Shop-Floor Production Jobs</h3>
              <p className="text-[11px] text-ink-muted">Real-time status of work orders running in CNC & assembly cells</p>
            </div>
            <button
              onClick={() => onNavigate('manufacturing')}
              className="text-xs font-medium text-ink-muted hover:text-ink flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-hairline-soft">
            {workOrders.slice(0, 4).map((wo) => {
              const progress = Math.round((wo.producedQuantity / wo.plannedQuantity) * 100);
              return (
                <div key={wo.id} className="p-4 hover:bg-canvas/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-semibold text-xs text-ink">{wo.woNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        wo.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-surface-2 text-ink-muted'
                      }`}>
                        {wo.priority}
                      </span>
                      <span className="text-xs font-semibold text-ink truncate max-w-xs">{wo.productName}</span>
                    </div>
                    <div className="text-[11px] text-ink-subtle flex items-center gap-3">
                      <span>Supervisor: {wo.assignedSupervisor}</span>
                      <span>•</span>
                      <span>Worker: {wo.assignedWorker}</span>
                      <span>•</span>
                      <span>Due: {wo.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-xs font-bold text-ink">
                        {wo.producedQuantity} / {wo.plannedQuantity}
                      </div>
                      <div className="text-[10px] text-ink-muted">{progress}% Complete</div>
                    </div>
                    <div className="w-20 bg-surface-2 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          wo.status === 'completed' ? 'bg-report-green' : 'bg-fin-orange'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial & GST Snapshot (1 Column) */}
        <div className="bg-surface-1 rounded-xl border border-hairline shadow-card p-5 space-y-4">
          <div className="border-b border-hairline pb-3">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-report-green" />
              Financial & GST Position
            </h3>
            <p className="text-[11px] text-ink-muted">Double-entry ledger summary & tax liability</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-surface-2/40 border border-hairline-soft flex items-center justify-between">
              <span className="text-xs text-ink-muted">Liquid Cash & Bank (SBI / HDFC)</span>
              <span className="text-xs font-bold font-mono text-ink">
                ₹{bankBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-2/40 border border-hairline-soft flex items-center justify-between">
              <div>
                <div className="text-xs text-ink-muted">Trade Receivables (Debtors)</div>
                <div className="text-[10px] text-ink-subtle">Tata Motors, Mahindra, Bajaj</div>
              </div>
              <span className="text-xs font-bold font-mono text-report-blue">
                ₹{debtorsBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-surface-2/40 border border-hairline-soft flex items-center justify-between">
              <span className="text-xs text-ink-muted">Trade Payables (Suppliers)</span>
              <span className="text-xs font-bold font-mono text-ink">
                ₹{creditorsBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-red-50/50 border border-red-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-ink">GST Liability (GSTR-3B)</div>
                <div className="text-[10px] text-red-600">Net Payable after ITC</div>
              </div>
              <span className="text-xs font-bold font-mono text-red-700">
                ₹{gstLiability.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('finance')}
            className="w-full py-2 text-center text-xs font-semibold text-ink hover:bg-surface-2 rounded-md border border-hairline transition-colors"
          >
            Open Full Accounting & GST Reports
          </button>
        </div>
      </div>
    </div>
  );
};
