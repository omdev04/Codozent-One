import React from 'react';
import { 
  Factory, 
  ShoppingCart, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  Plus
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

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="text-sm font-medium text-ink-muted">
            Operations overview
          </div>
          <h1 className="text-3xl font-medium text-ink tracking-[-0.8px] mt-1">
            {activeCompany.name}
          </h1>
          <p className="text-xs text-ink-muted mt-1">
            {activeCompany.city}, {activeCompany.state} · GSTIN {activeCompany.gstin}
          </p>
        </div>

        {/* Quiet, Professional Primary Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onNavigate('sales')}
            className="btn-secondary text-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New sales order</span>
          </button>
          <button
            onClick={() => onNavigate('manufacturing')}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New work order</span>
          </button>
        </div>
      </div>

      {/* Primary Lifted Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Output */}
        <div className="bg-surface-1 p-5 rounded-lg border border-hairline">
          <div className="text-xs font-normal text-ink-muted">
            Today's production output
          </div>
          <div className="mt-2 text-3xl font-medium tracking-tight text-ink">
            {completedToday} <span className="text-xs font-normal text-ink-muted">/ {totalPlannedToday} nos</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-hairline-soft">
            <span>Progress: {productionRate}%</span>
            <span>{activeWorkOrders.length} active jobs</span>
          </div>
        </div>

        {/* Sales */}
        <div className="bg-surface-1 p-5 rounded-lg border border-hairline">
          <div className="text-xs font-normal text-ink-muted">
            Confirmed sales orders
          </div>
          <div className="mt-2 text-3xl font-medium tracking-tight text-ink">
            {pendingSalesCount} <span className="text-xs font-normal text-ink-muted">orders</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-hairline-soft">
            <span>Total order value</span>
            <span className="font-mono text-ink">₹{totalSalesRevenue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Shortages */}
        <div className="bg-surface-1 p-5 rounded-lg border border-hairline">
          <div className="text-xs font-normal text-ink-muted">
            Material shortages (MRP)
          </div>
          <div className="mt-2 text-3xl font-medium tracking-tight text-ink flex items-baseline gap-2">
            <span className={criticalShortagesCount > 0 ? 'text-fin-orange' : 'text-ink'}>
              {criticalShortagesCount}
            </span>
            <span className="text-xs font-normal text-ink-muted">items</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-hairline-soft">
            <span>Low stock alert: {lowStockCount}</span>
            <button 
              onClick={onOpenMRP}
              className="text-fin-orange hover:underline font-medium"
            >
              Run MRP
            </button>
          </div>
        </div>

        {/* Quality */}
        <div className="bg-surface-1 p-5 rounded-lg border border-hairline">
          <div className="text-xs font-normal text-ink-muted">
            Quality acceptance rate
          </div>
          <div className="mt-2 text-3xl font-medium tracking-tight text-ink">
            98.2% <span className="text-xs font-normal text-ink-muted">pass</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-hairline-soft">
            <span>Rejections &lt; 2%</span>
            <button 
              onClick={() => onNavigate('quality')}
              className="text-ink hover:underline font-medium"
            >
              Inspection log
            </button>
          </div>
        </div>
      </div>

      {/* Active Work Orders & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Production List (2 Columns) */}
        <div className="lg:col-span-2 bg-surface-1 rounded-lg border border-hairline">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-ink">Active production work orders</h2>
              <p className="text-xs text-ink-muted">Real-time status of shop-floor machine jobs</p>
            </div>
            <button
              onClick={() => onNavigate('manufacturing')}
              className="text-xs text-ink-muted hover:text-ink flex items-center gap-1 font-medium"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-hairline-soft">
            {workOrders.slice(0, 4).map((wo) => {
              const progress = Math.round((wo.producedQuantity / wo.plannedQuantity) * 100);
              return (
                <div key={wo.id} className="p-4 hover:bg-canvas/50 transition-colors flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-medium text-ink">{wo.woNumber}</span>
                      <span className="text-xs font-medium text-ink">{wo.productName}</span>
                    </div>
                    <div className="text-xs text-ink-muted">
                      Operator: {wo.assignedWorker} · Due: {wo.dueDate}
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-4">
                    <div>
                      <div className="text-xs font-mono font-medium text-ink">
                        {wo.producedQuantity} / {wo.plannedQuantity}
                      </div>
                      <div className="text-[11px] text-ink-muted">{progress}%</div>
                    </div>
                    <div className="w-16 bg-surface-2 rounded-full h-1.5 overflow-hidden hidden sm:block">
                      <div 
                        className="bg-ink h-full rounded-full" 
                        style={{ width: `${Math.min(progress, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial & GST Ledger Summary (1 Column) */}
        <div className="bg-surface-1 rounded-lg border border-hairline p-5 space-y-4">
          <div className="border-b border-hairline pb-3">
            <h2 className="text-sm font-medium text-ink">Financial & tax position</h2>
            <p className="text-xs text-ink-muted">Double-entry ledger balances</p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded bg-canvas border border-hairline-soft flex items-center justify-between">
              <span className="text-ink-muted">Cash & bank balance</span>
              <span className="font-mono font-medium text-ink">₹{bankBalance.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-2.5 rounded bg-canvas border border-hairline-soft flex items-center justify-between">
              <span className="text-ink-muted">Trade receivables (Debtors)</span>
              <span className="font-mono font-medium text-ink">₹{debtorsBalance.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-2.5 rounded bg-canvas border border-hairline-soft flex items-center justify-between">
              <span className="text-ink-muted">Trade payables (Creditors)</span>
              <span className="font-mono font-medium text-ink">₹{creditorsBalance.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-2.5 rounded bg-canvas border border-hairline-soft flex items-center justify-between">
              <span className="text-ink-muted">Net GST liability (GSTR-3B)</span>
              <span className="font-mono font-medium text-ink">₹{gstLiability.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('finance')}
            className="w-full py-2 text-center text-xs font-medium text-ink hover:bg-surface-2 rounded-md border border-hairline transition-colors"
          >
            Review accounting ledger
          </button>
        </div>
      </div>
    </div>
  );
};
