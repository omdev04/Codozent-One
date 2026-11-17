import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  LayoutDashboard,
  Users,
  FileText,
  ShoppingCart,
  Store,
  Truck,
  Package,
  Layers,
  HardHat,
  CheckCircle2,
  Briefcase,
  BookOpen,
  FileSpreadsheet,
  Receipt,
  Scale,
  LifeBuoy,
  BarChart3,
  Settings,
  Lock,
  ChevronDown,
  ChevronRight,
  Search,
  X,
  Coins,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingBag
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export type NavTab =
  | 'dashboard'
  | 'trade'
  | 'crm'
  | 'quotations'
  | 'sales'
  | 'counter'
  | 'purchase'
  | 'inventory'
  | 'manufacturing'
  | 'shopfloor'
  | 'quality'
  | 'work'
  | 'khatabook'
  | 'finance'
  | 'gstReturns'
  | 'caDesk'
  | 'hrms'
  | 'support'
  | 'reports'
  | 'settings'
  | 'marketplace';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  onOpenPortal?: () => void;
  isPortalMode?: boolean;
}

interface NavSubItem {
  label: string;
  tab: NavTab;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavItemSimple {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tab?: NavTab;
  badge?: number;
  items?: NavSubItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isOpen = false,
  onClose,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
  onOpenPortal,
  isPortalMode = false
}) => {
  const {
    canAccess,
    salesOrders,
    purchaseOrders,
    workOrders,
    items,
    quotations,
    leads,
    supportTickets,
    isModuleInstalled
  } = useERP();

  // Collapsed state fallback with localStorage persistence
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('Codozent One_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const handleSetCollapsed = (val: boolean) => {
    if (propSetIsCollapsed) {
      propSetIsCollapsed(val);
    } else {
      setInternalCollapsed(val);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('Codozent One_sidebar_collapsed', String(val));
    }
  };

  const handleToggleCollapsed = () => {
    handleSetCollapsed(!isCollapsed);
  };

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleCollapsed();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const [searchFilter, setSearchFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pendingSalesCount = salesOrders.filter(s => ['confirmed', 'in_production'].includes(s.status)).length;
  const pendingOrdersCount = purchaseOrders.filter(p => p.status === 'ordered').length;
  const activeWorkOrdersCount = workOrders.filter(w => ['scheduled', 'in_progress'].includes(w.status)).length;
  const lowStockCount = items.filter(i => i.currentStock <= i.reorderLevel).length;
  const openTicketsCount = supportTickets.filter(t => t.status === 'open').length;
  const pendingQuotesCount = quotations.filter(q => q.status === 'sent' || q.status === 'draft').length;

  // Untitled UI Simple Navigation Structure (Modular & Decoupled)
  const rawNavItemsSimple: NavItemSimple[] = [
    {
      id: 'home',
      label: 'Home & Sales',
      icon: Home,
      items: [
        { label: 'CRM & Leads', tab: 'crm', icon: Users, badge: leads.length > 0 ? leads.length : undefined },
        { label: 'Quotations', tab: 'quotations', icon: FileText, badge: pendingQuotesCount > 0 ? pendingQuotesCount : undefined },
        { label: 'Orders & Invoices', tab: 'sales', icon: ShoppingCart, badge: pendingSalesCount > 0 ? pendingSalesCount : undefined },
        { label: 'Counter POS', tab: 'counter', icon: Store }
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: Package,
      items: [
        { label: 'Procure & MRP', tab: 'purchase', icon: Truck, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
        { label: 'Inventory & Stores', tab: 'inventory', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
        { label: 'Manufacturing & BOM', tab: 'manufacturing', icon: Layers, badge: activeWorkOrdersCount > 0 ? activeWorkOrdersCount : undefined },
        { label: 'Shop-Floor Terminal', tab: 'shopfloor', icon: HardHat },
        { label: 'Quality Control', tab: 'quality', icon: CheckCircle2 },
        { label: 'Work & Projects', tab: 'work', icon: Briefcase }
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: Coins,
      items: [
        { label: 'Khatabook (Daybook)', tab: 'khatabook', icon: BookOpen },
        { label: 'Finance & Accounts', tab: 'finance', icon: FileSpreadsheet },
        { label: 'GST Returns & 2B', tab: 'gstReturns', icon: Receipt },
        { label: 'CA & Auditor Desk', tab: 'caDesk', icon: Scale }
      ]
    },
    {
      id: 'hrms',
      label: 'Users & Staff',
      tab: 'hrms',
      icon: Users
    },
    {
      id: 'reporting',
      label: 'Reporting',
      tab: 'reports',
      icon: BarChart3
    },
    {
      id: 'support_tickets',
      label: 'Support Tickets',
      tab: 'support',
      icon: LifeBuoy,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined
    },
    {
      id: 'marketplace',
      label: 'App Marketplace',
      tab: 'marketplace',
      icon: ShoppingBag
    }
  ];

  // Dynamically filter navigation items based on installedModules & user RBAC permissions
  const navItemsSimple: NavItemSimple[] = rawNavItemsSimple
    .map(group => {
      if (group.items) {
        const filteredItems = group.items.filter(item => isModuleInstalled(item.tab) && canAccess(item.tab));
        return {
          ...group,
          items: filteredItems
        };
      }
      return group;
    })
    .filter(group => {
      if (group.items) {
        return group.items.length > 0;
      }
      if (group.tab) {
        return isModuleInstalled(group.tab) && canAccess(group.tab);
      }
      return true;
    });

  // Portal Navigation (Clean Home / Account-level menu matching Image 2 reference)
  const portalNavItems: NavItemSimple[] = [
    {
      id: 'home',
      label: 'Home',
      tab: 'dashboard',
      icon: Home
    },
    {
      id: 'marketplace',
      label: 'Marketplace',
      tab: 'marketplace',
      icon: ShoppingBag
    },
    {
      id: 'subscription',
      label: 'Subscription',
      tab: 'settings',
      icon: Receipt
    }
  ];

  // In Portal (Home) mode, hide operational modules from sidebar; show them only inside workspace tenants
  const effectiveNavItems: NavItemSimple[] = isPortalMode ? portalNavItems : navItemsSimple;

  // Accordion open/collapse state for parent groups (expanded desktop mode)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    home: true,
    operations: true,
    finance: true
  });

  // Auto-expand section when active tab belongs to it
  useEffect(() => {
    for (const group of effectiveNavItems) {
      if (group.items && group.items.some(item => item.tab === currentTab)) {
        setOpenGroups(prev => ({ ...prev, [group.id]: true }));
        break;
      }
    }
  }, [currentTab, isPortalMode]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleSelectTab = (tab: NavTab) => {
    if (canAccess(tab)) {
      if (tab === 'dashboard' && onOpenPortal) {
        onOpenPortal();
      }
      setCurrentTab(tab);
      setActiveFlyout(null);
      if (onClose) onClose();
    }
  };

  // Filtered items when typing in search bar
  const filteredNavItems = searchFilter.trim() === ''
    ? null
    : effectiveNavItems.flatMap(g => g.items ? g.items : [g as unknown as NavSubItem]).filter(i =>
      i.label.toLowerCase().includes(searchFilter.toLowerCase())
    );

  // Floating Flyout state when sidebar is in collapsed icon rail mode
  const [activeFlyout, setActiveFlyout] = useState<{
    groupId: string;
    top: number;
    title: string;
    items?: NavSubItem[];
    tab?: NavTab;
  } | null>(null);

  const flyoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnterGroup = (
    group: NavItemSimple,
    e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
  ) => {
    if (!isCollapsed) return;
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current);
      flyoutTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const flyoutEstimatedHeight = (group.items?.length || 1) * 38 + 48;
    const top = Math.min(rect.top, Math.max(12, window.innerHeight - flyoutEstimatedHeight - 16));
    setActiveFlyout({
      groupId: group.id,
      top: Math.max(12, top),
      title: group.label,
      items: group.items,
      tab: group.tab
    });
  };

  const handleMouseEnterSimpleTooltip = (
    title: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!isCollapsed) return;
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current);
      flyoutTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveFlyout({
      groupId: title,
      top: Math.max(12, rect.top),
      title
    });
  };

  const handleMouseLeaveGroup = () => {
    if (!isCollapsed) return;
    flyoutTimeoutRef.current = setTimeout(() => {
      setActiveFlyout(null);
    }, 200);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Main Navigation Sidebar with Collapsible Icon Rail Mode */}
      <aside
        className={`
          h-screen bg-white border-r border-slate-200 
          flex flex-col justify-between select-none shrink-0 z-30
          fixed md:static inset-y-0 left-0
          transition-[width,transform] duration-200 ease-in-out
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-64 md:w-[72px] md:min-w-[72px]' : 'w-64 min-w-[256px] lg:w-72 lg:min-w-[288px]'}
        `}
      >
        {/* ========================================================================= */}
        {/* VIEW 1: COLLAPSED ICON RAIL (Desktop Only when isCollapsed = true)        */}
        {/* ========================================================================= */}
        {isCollapsed && (
          <div className="hidden md:flex flex-col justify-between h-full w-full py-3 px-2">
            {/* Top Brand Logo & Action Buttons */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              {/* App Glyph */}
              <div
                onClick={() => handleSelectTab('dashboard')}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c6cf2] to-[#0052cc] text-white flex items-center justify-center font-black text-sm shadow-xs hover:scale-105 transition-all cursor-pointer"
                title="Codozent One Dashboard"
              >
                M
              </div>

              {/* Expand Sidebar Toggle Button */}
              <button
                type="button"
                onClick={() => handleSetCollapsed(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#0c6cf2] hover:bg-blue-50 transition-colors cursor-pointer"
                title="Expand sidebar (Ctrl+B)"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>

              {/* Search Icon (Expands & Focuses Search) */}
              <button
                type="button"
                onClick={() => {
                  handleSetCollapsed(false);
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Search modules (Click to expand)"
              >
                <Search className="w-4 h-4" />
              </button>

              <div className="w-8 border-b border-slate-200 my-1" />
            </div>

            {/* Middle: Icon Rail Navigation List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 scrollbar-none py-1">
              {effectiveNavItems.map(group => {
                const GroupIcon = group.icon;
                const hasChildren = Boolean(group.items && group.items.length > 0);
                const isChildActive = hasChildren && group.items?.some(i => i.tab === currentTab);
                const isDirectActive = group.tab === currentTab;
                const isActive = isChildActive || isDirectActive;
                const totalBadges = group.items?.reduce((acc, sub) => acc + (sub.badge || 0), 0) || group.badge || 0;

                return (
                  <div
                    key={group.id}
                    className="relative flex justify-center"
                    onMouseEnter={(e) => handleMouseEnterGroup(group, e)}
                    onMouseLeave={handleMouseLeaveGroup}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (hasChildren && group.items && group.items.length > 0) {
                          const activeSub = group.items.find(i => i.tab === currentTab);
                          handleSelectTab(activeSub ? activeSub.tab : group.items[0].tab);
                        } else if (group.tab) {
                          handleSelectTab(group.tab);
                        }
                      }}
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center relative transition-all cursor-pointer group
                        ${isActive
                          ? 'bg-blue-50 text-[#0c6cf2] font-semibold ring-1 ring-[#0c6cf2]/30 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }
                      `}
                      title={group.label}
                    >
                      <GroupIcon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#0c6cf2]' : 'text-slate-500 group-hover:text-slate-800'}`} />

                      {/* Active indicator bar on left border */}
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#0c6cf2] rounded-r-full" />
                      )}

                      {/* Badge counter */}
                      {totalBadges > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold bg-[#0c6cf2] text-white flex items-center justify-center shadow-xs">
                          {totalBadges > 99 ? '99+' : totalBadges}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom: Support, Settings & User Profile in Collapsed Rail */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 pt-2 border-t border-slate-200">
              {/* Support */}
              <button
                type="button"
                onClick={() => handleSelectTab('support')}
                onMouseEnter={(e) => handleMouseEnterSimpleTooltip('Support Desk (Online)', e)}
                onMouseLeave={handleMouseLeaveGroup}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center relative transition-colors cursor-pointer
                  ${currentTab === 'support'
                    ? 'bg-blue-50 text-[#0c6cf2] ring-1 ring-[#0c6cf2]/30'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
                title="Support Desk (Online)"
              >
                <LifeBuoy className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => handleSelectTab('settings')}
                onMouseEnter={(e) => handleMouseEnterSimpleTooltip('Settings', e)}
                onMouseLeave={handleMouseLeaveGroup}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center relative transition-colors cursor-pointer
                  ${currentTab === 'settings'
                    ? 'bg-blue-50 text-[#0c6cf2] ring-1 ring-[#0c6cf2]/30'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }
                `}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: EXPANDED SIDEBAR (Desktop when !isCollapsed OR Mobile drawer)       */}
        {/* ========================================================================= */}
        <div className={`${isCollapsed ? 'flex md:hidden' : 'flex'} flex-col justify-between h-full w-full`}>
          {/* TOP: Brand Lockup + Search Bar */}
          <div className="pt-4 px-4 pb-2 shrink-0">
            <div className="flex items-center justify-between mb-4">
              {/* Brand Glyph & App Name */}
              <div
                onClick={() => handleSelectTab('dashboard')}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0c6cf2] to-[#0052cc] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-all shrink-0">
                  M
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                    Codozent One
                  </h1>
                  <span className="text-[10px] text-slate-400 font-medium block leading-none mt-0.5">
                    Bharat Enterprise OS
                  </span>
                </div>
              </div>

              {/* Action Buttons: Desktop Collapse & Mobile Close */}
              <div className="flex items-center gap-1">
                {/* Desktop Collapse Button */}
                <button
                  type="button"
                  onClick={() => handleSetCollapsed(true)}
                  className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Collapse sidebar to icon rail (Ctrl+B)"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>

                {/* Mobile Close Button */}
                {isOpen && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors md:hidden cursor-pointer"
                    title="Close Sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Search Bar (Untitled UI Style) */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0c6cf2] focus:bg-white transition-all"
              />
              {searchFilter ? (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ×
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1 py-0.2 rounded pointer-events-none">
                  ⌘K
                </span>
              )}
            </div>
          </div>

          {/* MIDDLE: Scrollable Navigation List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-none">
            {filteredNavItems ? (
              /* Search Filter Results */
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Matching Modules ({filteredNavItems.length})
                </div>
                {filteredNavItems.map(item => {
                  const SubIcon = item.icon || LayoutDashboard;
                  const isSelected = currentTab === item.tab;
                  const accessible = canAccess(item.tab);

                  return (
                    <button
                      key={item.tab}
                      type="button"
                      onClick={() => handleSelectTab(item.tab)}
                      disabled={!accessible}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${isSelected
                          ? 'bg-blue-50 text-[#0c6cf2] font-semibold'
                          : accessible
                            ? 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            : 'text-slate-400 opacity-40 cursor-not-allowed'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SubIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#0c6cf2]' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Standard Untitled UI Simple Navigation List */
              effectiveNavItems.map(group => {
                const GroupIcon = group.icon;
                const hasChildren = Boolean(group.items && group.items.length > 0);
                const isGroupExpanded = Boolean(openGroups[group.id]);
                const isChildActive = hasChildren && group.items?.some(i => i.tab === currentTab);
                const isDirectActive = group.tab === currentTab;

                if (!hasChildren) {
                  // Direct Standalone Nav Item (Users, Reporting, Support Tickets)
                  const accessible = group.tab ? canAccess(group.tab) : true;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => group.tab && handleSelectTab(group.tab)}
                      disabled={!accessible}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${isDirectActive
                          ? 'bg-blue-50 text-[#0c6cf2] font-semibold shadow-2xs'
                          : accessible
                            ? 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                            : 'text-slate-400 opacity-40 cursor-not-allowed'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GroupIcon className={`w-4 h-4 shrink-0 ${isDirectActive ? 'text-[#0c6cf2]' : 'text-slate-400'}`} />
                        <span className="truncate">{group.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {!accessible && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                        {group.badge !== undefined && accessible && (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${isDirectActive
                              ? 'bg-blue-100 text-[#0c6cf2]'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                            {group.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                }

                // Accordion Group Nav Item (Home, Operations, Finance)
                const groupTotalBadges = group.items?.reduce((acc, sub) => acc + (sub.badge || 0), 0) || 0;

                return (
                  <div key={group.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${isChildActive
                          ? 'text-slate-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GroupIcon className={`w-4 h-4 shrink-0 ${isChildActive ? 'text-[#0c6cf2]' : 'text-slate-400'}`} />
                        <span className="truncate">{group.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {groupTotalBadges > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold bg-blue-100 text-[#0c6cf2]">
                            {groupTotalBadges}
                          </span>
                        )}
                        {isGroupExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Accordion Sub-Items List */}
                    {isGroupExpanded && (
                      <div className="ml-4 pl-3.5 border-l border-slate-200 space-y-0.5 mt-0.5">
                        {group.items?.map(subItem => {
                          const isSubActive = currentTab === subItem.tab;
                          const accessible = canAccess(subItem.tab);

                          return (
                            <button
                              key={subItem.tab}
                              type="button"
                              onClick={() => handleSelectTab(subItem.tab)}
                              disabled={!accessible}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${isSubActive
                                  ? 'bg-blue-50 text-[#0c6cf2] font-semibold'
                                  : accessible
                                    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    : 'text-slate-400 opacity-40 cursor-not-allowed'
                                }`}
                            >
                              <span className="truncate">{subItem.label}</span>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                {!accessible && <Lock className="w-3 h-3 text-slate-400" />}
                                {subItem.badge !== undefined && accessible && (
                                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${isSubActive
                                      ? 'bg-blue-100 text-[#0c6cf2]'
                                      : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {subItem.badge}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* BOTTOM: Footer Items + User Profile (Untitled UI Style) */}
          <div className="pt-2 pb-3 px-3 border-t border-slate-200 shrink-0 space-y-1">
            {/* Support with Modern Online Dot Badge */}
            <button
              type="button"
              onClick={() => handleSelectTab('support')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentTab === 'support'
                  ? 'bg-blue-50 text-[#0c6cf2] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-4 h-4 text-slate-400" />
                <span>Support</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => handleSelectTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${currentTab === 'settings'
                  ? 'bg-blue-50 text-[#0c6cf2] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* FLOATING FLYOUT MENU (When Collapsed to Icon Rail on Desktop)              */}
      {/* ========================================================================= */}
      {isCollapsed && activeFlyout && (
        <div
          onMouseEnter={() => {
            if (flyoutTimeoutRef.current) {
              clearTimeout(flyoutTimeoutRef.current);
              flyoutTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeaveGroup}
          className="hidden md:block fixed z-50 left-[76px] w-56 bg-white border border-slate-200/90 rounded-xl shadow-xl py-2 px-1.5 text-slate-800 animate-in fade-in-50 zoom-in-95 duration-100"
          style={{ top: activeFlyout.top }}
        >
          {/* Flyout Header */}
          <div className="px-2.5 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-900 tracking-tight">
              {activeFlyout.title}
            </span>
            {activeFlyout.items && (
              <span className="text-[10px] text-slate-400 font-medium">
                {activeFlyout.items.length} modules
              </span>
            )}
          </div>

          {/* Sub-items List */}
          {activeFlyout.items && activeFlyout.items.length > 0 ? (
            <div className="space-y-0.5">
              {activeFlyout.items.map(subItem => {
                const SubIcon = subItem.icon || LayoutDashboard;
                const isSelected = currentTab === subItem.tab;
                const accessible = canAccess(subItem.tab);

                return (
                  <button
                    key={subItem.tab}
                    type="button"
                    onClick={() => {
                      handleSelectTab(subItem.tab);
                      setActiveFlyout(null);
                    }}
                    disabled={!accessible}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${isSelected
                        ? 'bg-blue-50 text-[#0c6cf2] font-semibold'
                        : accessible
                          ? 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          : 'text-slate-400 opacity-40 cursor-not-allowed'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SubIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#0c6cf2]' : 'text-slate-400'}`} />
                      <span className="truncate">{subItem.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      {!accessible && <Lock className="w-3 h-3 text-slate-400" />}
                      {subItem.badge !== undefined && accessible && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold ${isSelected
                            ? 'bg-blue-100 text-[#0c6cf2]'
                            : 'bg-slate-100 text-slate-600'
                          }`}>
                          {subItem.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : activeFlyout.tab ? (
            <button
              type="button"
              onClick={() => {
                handleSelectTab(activeFlyout.tab!);
                setActiveFlyout(null);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            >
              <span>Open {activeFlyout.title}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <div className="px-2 py-1 text-xs text-slate-600">
              {activeFlyout.title}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Sidebar;
