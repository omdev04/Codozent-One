import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Search,
  ChevronDown,
  Menu,
  LogOut,
  Sparkles,
  ShieldCheck,
  Check,
  Settings,
  Users,
  Layers,
  FileText,
  Database,
  Grid,
  ChevronRight
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPRole } from '../../types/erp';
import { NavTab } from './Sidebar';

interface NavbarProps {
  onOpenMRP: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onToggleSidebar?: () => void;
  onOpenAssistant?: () => void;
  onToggleCollapse?: () => void;
  isSidebarCollapsed?: boolean;
  onNavigateTab?: (tab: NavTab, subTab?: string) => void;
  onOpenPortal?: () => void;
  isPortalMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMRP,
  searchQuery,
  setSearchQuery,
  onToggleSidebar,
  onOpenAssistant,
  onToggleCollapse,
  isSidebarCollapsed = false,
  onNavigateTab,
  onOpenPortal,
  isPortalMode = false
}) => {
  const {
    companies,
    activeCompany,
    setActiveCompanyId,
    currentRole,
    setCurrentRole,
    calculateMRP,
    currentUser,
    logout
  } = useERP();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const compRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (compRef.current && !compRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mrpShortages = calculateMRP();
  const criticalShortagesCount = mrpShortages.filter(s => s.netShortage > 0).length;

  const rolesList: { role: ERPRole; label: string; desc: string }[] = [
    { role: 'super_admin', label: 'Super Admin', desc: 'Tenant-wide platform root access' },
    { role: 'owner', label: 'Tenant Owner', desc: 'Enterprise owner & group governance' },
    { role: 'admin', label: 'Company Administrator', desc: 'Company plant & operational admin' },
    { role: 'finance_manager', label: 'Finance Manager', desc: 'Ledgers, GST, banking & vouchers' },
    { role: 'sales_manager', label: 'Sales Manager', desc: 'Deals, pipelines, quotes & orders' },
    { role: 'sales_executive', label: 'Sales Executive', desc: 'Lead handling & quotation generation' },
    { role: 'purchase_manager', label: 'Purchase Manager', desc: 'RFQs, POs, vendor terms & costing' },
    { role: 'inventory_manager', label: 'Inventory Manager', desc: 'Stores, valuation & stock movements' },
    { role: 'production_manager', label: 'Production Manager', desc: 'Work orders, machine schedules & BOM' },
    { role: 'hr_manager', label: 'HR Manager', desc: 'Staff, attendance, payroll & tickets' },
    { role: 'viewer', label: 'Read-Only User', desc: 'Statutory compliance & read-only audit' }
  ];

  const handlePortalClick = () => {
    setCompanyDropdownOpen(false);
    if (onOpenPortal) {
      onOpenPortal();
    } else if (onNavigateTab) {
      onNavigateTab('dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Desktop Collapse & Entity Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 md:hidden rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Menu"
            type="button"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Lockup visible only on Mobile when sidebar is closed */}
        <div className="flex items-center space-x-2 md:hidden">
          <div className="w-6 h-6 rounded bg-[#0c6cf2] text-white flex items-center justify-center font-bold text-xs">
            M
          </div>
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            Codozent One
          </span>
        </div>

        {/* Direct Link to Organizations Hub (Zoho Portal Switcher) - visible only when inside a company workspace */}
        {!isPortalMode && (
          <button
            type="button"
            onClick={handlePortalClick}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 text-slate-700 hover:text-[#0c6cf2] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            title="Go to Organizations Hub (All Companies)"
          >
            <Grid className="w-3.5 h-3.5 text-[#0c6cf2]" />
            <span>Organizations</span>
          </button>
        )}

        {/* Modern Minimalist Entity Switcher */}
        <div className="relative" ref={compRef}>
          <button
            onClick={() => { setCompanyDropdownOpen(!companyDropdownOpen); setUserDropdownOpen(false); }}
            className={`
              flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border transition-all text-slate-800 cursor-pointer group bg-white
              ${companyDropdownOpen
                ? 'border-[#0c6cf2] ring-2 ring-[#0c6cf2]/10 bg-slate-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
              }
            `}
            title="Switch Active Company"
          >
            <div className="w-6 h-6 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:text-[#0c6cf2] group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
              <Building2 className="w-3.5 h-3.5" />
            </div>

            <span className="font-semibold text-xs text-slate-900 truncate max-w-[160px] sm:max-w-[200px] md:max-w-[240px]">
              {activeCompany.name}
            </span>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-150 shrink-0 ${companyDropdownOpen ? 'rotate-180 text-slate-700' : ''}`} />
          </button>

          {companyDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-76 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in-50 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-100 mb-1">
                <span>Select Company Entity</span>
                <span className="font-mono text-[9px] text-slate-400 font-normal">{companies.length} Active</span>
              </div>

              <div className="space-y-0.5">
                {companies.map(c => {
                  const isCurrent = c.id === activeCompany.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCompanyId(c.id);
                        setCompanyDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${isCurrent
                        ? 'bg-blue-50/80 text-[#0c6cf2]'
                        : 'hover:bg-slate-50 text-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${isCurrent ? 'bg-blue-100 text-[#0c6cf2]' : 'bg-slate-100 text-slate-500'
                          }`}>
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs truncate ${isCurrent ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {c.code} · {c.city} · GSTIN: {c.gstin}
                          </div>
                        </div>
                      </div>

                      {isCurrent && (
                        <Check className="w-4 h-4 text-[#0c6cf2] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Zoho Portal / Hub Shortcut */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePortalClick}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-bold text-[#0c6cf2] hover:bg-blue-50 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Grid className="w-3.5 h-3.5" />
                    <span>All Organizations (Home)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#0c6cf2]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Global Clean Search */}
      <div className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md mx-4 lg:mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, invoices, parties..."
            className="w-full pl-9 pr-12 py-1.5 text-xs rounded-lg bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
          />
          <kbd className="absolute right-2.5 top-2 pointer-events-none text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: AI Copilot, User Profile */}
      <div className="flex items-center space-x-2 md:space-x-3">

        {/* MRP alert indicator if shortages exist */}
        {criticalShortagesCount > 0 && (
          <button
            onClick={onOpenMRP}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span>MRP: {criticalShortagesCount}</span>
          </button>
        )}

        {/* AI Assistant Copilot Trigger */}
        {onOpenAssistant && (
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-50/80 hover:bg-blue-100 border border-blue-200/60 text-[#0c6cf2] cursor-pointer transition-colors shadow-2xs"
            title="Ask AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Copilot</span>
          </button>
        )}

        {/* User Account Profile with Integrated Role Switcher */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setCompanyDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-[#0c6cf2] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'FA'}
            </div>
            <div className="text-left hidden lg:block">
              <span className="font-semibold text-xs text-slate-800 block leading-tight max-w-[120px] truncate">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-400 capitalize block leading-none mt-0.5">
                {currentRole.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-68 bg-white rounded-xl border border-slate-200/90 shadow-xl p-1.5 z-50 animate-in fade-in-50 duration-150">
              {/* Profile Header */}
              <div className="px-3 py-2.5 bg-slate-50/80 rounded-lg border border-slate-100 mb-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.name || 'Enterprise Owner'}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {currentUser?.email}
                </div>
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#0057d2] border border-blue-200/70 font-mono">
                    {currentRole.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-600 truncate font-medium">
                    · {activeCompany?.name}
                  </span>
                </div>
              </div>

              {/* Quick Navigation into Settings */}
              <div className="py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onNavigateTab?.('settings', 'company');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors cursor-pointer group font-medium"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0057d2] transition-colors" />
                  <span>Company Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onNavigateTab?.('settings', 'users');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors cursor-pointer group font-medium"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0057d2] transition-colors" />
                  <span>Team & Permissions</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onNavigateTab?.('settings', 'modules');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors cursor-pointer group font-medium"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0057d2] transition-colors" />
                  <span>Installed Modules</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onNavigateTab?.('settings', 'sequences');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 flex items-center gap-2.5 transition-colors cursor-pointer group font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0057d2] transition-colors" />
                  <span>Document Numbering</span>
                </button>
              </div>

              {/* Sign Out */}
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={async () => {
                    setUserDropdownOpen(false);
                    await logout();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
