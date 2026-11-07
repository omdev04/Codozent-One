import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Search, 
  AlertTriangle, 
  Sparkles,
  ChevronDown,
  Bell,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPRole } from '../../types/erp';

interface NavbarProps {
  onOpenMRP: () => void;
  onOpenSupabaseModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenMRP, 
  onOpenSupabaseModal, 
  searchQuery, 
  setSearchQuery 
}) => {
  const { 
    companies, 
    activeCompany, 
    setActiveCompanyId, 
    currentRole, 
    setCurrentRole, 
    calculateMRP,
    isCloudConnected,
    resetToDemoData
  } = useERP();

  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const mrpShortages = calculateMRP();
  const criticalShortagesCount = mrpShortages.filter(s => s.netShortage > 0).length;

  const rolesList: { role: ERPRole; label: string; desc: string }[] = [
    { role: 'owner', label: 'Factory Owner / MD', desc: 'Full plant visibility, financials & strategy' },
    { role: 'production_manager', label: 'Production Manager', desc: 'Work orders, BOMs, routing & planning' },
    { role: 'storekeeper', label: 'Storekeeper', desc: 'Material issues, GRN receipts & stock ledger' },
    { role: 'worker', label: 'Shop-Floor Worker', desc: 'Simplified terminal: My Tasks & Output' },
    { role: 'qc_inspector', label: 'QC Inspector', desc: 'Incoming, in-process & final pass/fail' },
    { role: 'accountant', label: 'Accountant', desc: 'GST invoices, GSTR-1/3B, Debtors/Creditors' },
    { role: 'viewer', label: 'Auditor / Viewer', desc: 'Read-only compliance & reports' }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-canvas border-b border-hairline px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Wordmark */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-md bg-ink text-white flex items-center justify-center font-bold tracking-tight text-sm shadow-sm">
            <span className="text-fin-orange font-black">F</span>F
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-ink tracking-tight flex items-center gap-1.5">
              FactoryFlow <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-surface-2 text-ink-muted">ERP</span>
            </span>
            <span className="text-[10px] text-ink-subtle hidden sm:inline">Chakan-Pune Industrial Belt</span>
          </div>
        </div>

        {/* Multi-Company Context Switcher */}
        <div className="relative">
          <button
            onClick={() => { setCompanyDropdownOpen(!companyDropdownOpen); setRoleDropdownOpen(false); }}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-surface-1 border border-hairline hover:border-ink transition-colors text-xs font-medium text-ink shadow-card"
            title="Switch Company Workspace"
          >
            <Building2 className="w-3.5 h-3.5 text-fin-orange" />
            <span className="max-w-[140px] md:max-w-[200px] truncate">{activeCompany.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

          {companyDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-surface-1 rounded-lg border border-hairline shadow-lift p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
                Select Company Workspace
              </div>
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCompanyId(c.id);
                    setCompanyDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-md transition-colors flex flex-col ${
                    c.id === activeCompany.id ? 'bg-canvas text-ink font-semibold border-l-2 border-fin-orange' : 'hover:bg-surface-2 text-ink-muted'
                  }`}
                >
                  <div className="text-xs text-ink">{c.name}</div>
                  <div className="text-[10px] text-ink-subtle mt-0.5 flex justify-between">
                    <span>{c.code} · {c.city}</span>
                    <span>GSTIN: {c.gstin.slice(0, 8)}...</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, orders, work orders..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>

      {/* Right Controls: Role Switcher, MRP Button, Supabase Status, Reset */}
      <div className="flex items-center space-x-3">
        {/* MRP Alert CTA */}
        {criticalShortagesCount > 0 && (
          <button
            onClick={onOpenMRP}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-fin-orange hover:bg-fin-orangeHover text-white text-xs font-medium transition-all shadow-sm animate-pulse"
            title="Critical Material Shortages Detected"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MRP Shortages:</span>
            <span className="bg-white/20 px-1.5 py-0.2 rounded text-[11px] font-bold">{criticalShortagesCount}</span>
          </button>
        )}

        {/* Role Switcher (RBAC Demo) */}
        <div className="relative">
          <button
            onClick={() => { setRoleDropdownOpen(!roleDropdownOpen); setCompanyDropdownOpen(false); }}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-surface-1 border border-hairline hover:border-ink transition-colors text-xs text-ink"
            title="Switch Simulated User Role"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-report-blue" />
            <span className="capitalize font-medium hidden sm:inline">{currentRole.replace('_', ' ')}</span>
            <ChevronDown className="w-3 h-3 text-ink-muted" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-surface-1 rounded-lg border border-hairline shadow-lift p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
                Simulate Role-Based Access (RBAC)
              </div>
              {rolesList.map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    setCurrentRole(r.role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors ${
                    r.role === currentRole ? 'bg-canvas text-ink font-semibold' : 'hover:bg-surface-2 text-ink-muted'
                  }`}
                >
                  <div className="text-xs text-ink">{r.label}</div>
                  <div className="text-[10px] text-ink-subtle">{r.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Supabase Cloud Status Indicator */}
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-surface-1 border border-hairline hover:border-ink transition-colors text-xs text-ink"
          title="Supabase PostgreSQL Integration & Schema"
        >
          <Database className={`w-3.5 h-3.5 ${isCloudConnected ? 'text-report-green' : 'text-fin-orange'}`} />
          <span className="hidden md:inline font-medium">Supabase</span>
          <span className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-report-green' : 'bg-fin-orange animate-ping'}`} />
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={resetToDemoData}
          className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
          title="Reset to Fresh Demonstration Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
