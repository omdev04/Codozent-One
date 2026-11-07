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
  Lock
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
    salesOrders, 
    purchaseOrders, 
    workOrders, 
    items 
  } = useERP();

  const pendingSalesCount = salesOrders.filter(s => ['confirmed', 'in_production'].includes(s.status)).length;
  const pendingOrdersCount = purchaseOrders.filter(p => p.status === 'ordered').length;
  const activeWorkOrdersCount = workOrders.filter(w => ['scheduled', 'in_progress'].includes(w.status)).length;
  const lowStockCount = items.filter(i => i.currentStock <= i.reorderLevel).length;

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { 
      tab: 'dashboard', 
      label: 'Executive Overview', 
      icon: <LayoutDashboard className="w-4 h-4" /> 
    },
    { 
      tab: 'sales', 
      label: 'Sales & Orders', 
      icon: <ShoppingCart className="w-4 h-4" />, 
      badge: pendingSalesCount > 0 ? pendingSalesCount : undefined 
    },
    { 
      tab: 'purchase', 
      label: 'Procure & MRP', 
      icon: <Truck className="w-4 h-4" />, 
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined 
    },
    { 
      tab: 'inventory', 
      label: 'Inventory & Stores', 
      icon: <Boxes className="w-4 h-4" />, 
      badge: lowStockCount > 0 ? lowStockCount : undefined 
    },
    { 
      tab: 'manufacturing', 
      label: 'Manufacturing & BOM', 
      icon: <Factory className="w-4 h-4" />, 
      badge: activeWorkOrdersCount > 0 ? activeWorkOrdersCount : undefined 
    },
    { 
      tab: 'shopfloor', 
      label: 'Shop-Floor Terminal', 
      icon: <HardHat className="w-4 h-4 text-fin-orange" /> 
    },
    { 
      tab: 'quality', 
      label: 'Quality Control', 
      icon: <CheckCircle2 className="w-4 h-4" /> 
    },
    { 
      tab: 'finance', 
      label: 'Finance & GST', 
      icon: <FileSpreadsheet className="w-4 h-4" /> 
    },
    { 
      tab: 'reports', 
      label: 'Reports & Audits', 
      icon: <BarChart3 className="w-4 h-4" /> 
    },
    { 
      tab: 'settings', 
      label: 'Settings & Database', 
      icon: <Settings className="w-4 h-4" /> 
    }
  ];

  return (
    <aside className="w-60 bg-canvas border-r border-hairline flex flex-col justify-between p-3 select-none">
      <div className="space-y-0.5">
        <div className="px-3 py-2 text-[11px] font-medium text-ink-subtle">
          Platform
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
                isSelected
                  ? 'bg-surface-1 text-ink font-medium border border-hairline shadow-sm'
                  : accessible
                  ? 'text-ink-muted hover:text-ink hover:bg-surface-2/60'
                  : 'text-ink-tertiary cursor-not-allowed opacity-40'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className={isSelected ? 'text-ink' : 'text-ink-muted'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              <div className="flex items-center space-x-1.5">
                {!accessible && (
                  <span title="Restricted by role">
                    <Lock className="w-3 h-3 text-ink-tertiary" />
                  </span>
                )}
                {item.badge !== undefined && accessible && (
                  <span className="text-[10px] text-ink-muted bg-surface-2 font-mono px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Subtle Plant Status Card */}
      <div className="p-3 bg-surface-1 rounded-lg border border-hairline text-[11px] space-y-1">
        <div className="flex items-center justify-between font-medium text-ink">
          <span>Chakan Line 1</span>
          <span className="text-[10px] text-ink-muted">Shift A</span>
        </div>
        <div className="text-[10px] text-ink-subtle flex justify-between">
          <span>Overall OEE</span>
          <span className="font-mono text-ink font-medium">88.4%</span>
        </div>
      </div>
    </aside>
  );
};
