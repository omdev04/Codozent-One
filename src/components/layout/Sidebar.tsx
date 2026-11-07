import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Boxes,
  Factory,
  HardHat,
  CheckCircle2,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Lock,
  Zap,
  Activity
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export type NavTab = 
  | 'dashboard' 
  | 'sales' 
  | 'purchase' 
  | 'inventory' 
  | 'manufacturing' 
  | 'shopfloor' 
  | 'quality' 
  | 'finance' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { 
    canAccess, 
    currentRole, 
    salesOrders, 
    purchaseOrders, 
    workOrders, 
    qualityInspections, 
    items 
  } = useERP();

  const pendingSalesCount = salesOrders.filter(s => ['confirmed', 'in_production'].includes(s.status)).length;
  const pendingOrdersCount = purchaseOrders.filter(p => p.status === 'ordered').length;
  const activeWorkOrdersCount = workOrders.filter(w => ['scheduled', 'in_progress'].includes(w.status)).length;
  const pendingQCCount = qualityInspections.filter(q => q.status === 'conditional_pass').length + 
    workOrders.filter(w => w.status === 'qc_pending').length;
  const lowStockCount = items.filter(i => i.currentStock <= i.reorderLevel).length;

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { 
      tab: 'dashboard', 
      label: 'Executive Dashboard', 
      icon: <LayoutDashboard className="w-4 h-4" /> 
    },
    { 
      tab: 'sales', 
      label: 'Sales & Orders', 
      icon: <ShoppingCart className="w-4 h-4" />, 
      badge: pendingSalesCount > 0 ? pendingSalesCount : undefined, 
      badgeColor: 'bg-report-blue' 
    },
    { 
      tab: 'purchase', 
      label: 'Procure & MRP', 
      icon: <Truck className="w-4 h-4" />, 
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined, 
      badgeColor: 'bg-report-orange' 
    },
    { 
      tab: 'inventory', 
      label: 'Inventory & Stores', 
      icon: <Boxes className="w-4 h-4" />, 
      badge: lowStockCount > 0 ? lowStockCount : undefined, 
      badgeColor: 'bg-fin-orange' 
    },
    { 
      tab: 'manufacturing', 
      label: 'Manufacturing & BOM', 
      icon: <Factory className="w-4 h-4" />, 
      badge: activeWorkOrdersCount > 0 ? activeWorkOrdersCount : undefined, 
      badgeColor: 'bg-ink' 
    },
    { 
      tab: 'shopfloor', 
      label: 'Shop-Floor Terminal', 
      icon: <HardHat className="w-4 h-4 text-fin-orange" />, 
      badge: 1, 
      badgeColor: 'bg-fin-orange' 
    },
    { 
      tab: 'quality', 
      label: 'Quality Control (QC)', 
      icon: <CheckCircle2 className="w-4 h-4" />, 
      badge: pendingQCCount > 0 ? pendingQCCount : undefined, 
      badgeColor: 'bg-report-pink' 
    },
    { 
      tab: 'finance', 
      label: 'Finance & GST Accounts', 
      icon: <FileSpreadsheet className="w-4 h-4" /> 
    },
    { 
      tab: 'reports', 
      label: 'Reports & Audits', 
      icon: <BarChart3 className="w-4 h-4" /> 
    },
    { 
      tab: 'settings', 
      label: 'Settings & Supabase', 
      icon: <Settings className="w-4 h-4" /> 
    }
  ];

  return (
    <aside className="w-64 bg-canvas border-r border-hairline flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
          Core Operations
        </div>

        {navItems.map(item => {
          const accessible = canAccess(item.tab);
          const isSelected = currentTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => {
                if (accessible) setCurrentTab(item.tab);
              }}
              disabled={!accessible}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-surface-1 text-ink shadow-card border border-hairline font-semibold'
                  : accessible
                  ? 'text-ink-muted hover:text-ink hover:bg-surface-2'
                  : 'text-ink-tertiary cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isSelected ? 'text-fin-orange' : 'text-ink-muted'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {!accessible && (
                  <span title="Restricted by Role-Based Access Control (RBAC)">
                    <Lock className="w-3 h-3 text-ink-tertiary" />
                  </span>
                )}
                {item.badge !== undefined && accessible && (
                  <span className={`text-[10px] text-white font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-ink'}`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Plant Operational Status Footer */}
      <div className="p-3 bg-surface-1 rounded-xl border border-hairline shadow-card space-y-2 mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-ink">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-report-green" /> Chakan Plant Line 1
          </span>
          <span className="text-[10px] text-report-green font-bold bg-green-50 px-1.5 py-0.5 rounded">ONLINE</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-ink-subtle pt-1 border-t border-hairline-soft">
          <div>
            <div className="text-ink-tertiary">Active Shift</div>
            <div className="font-semibold text-ink">Shift A (07-15)</div>
          </div>
          <div>
            <div className="text-ink-tertiary">Overall OEE</div>
            <div className="font-semibold text-report-blue">88.4%</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
