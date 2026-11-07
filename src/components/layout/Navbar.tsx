import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Database, 
  Search, 
  ChevronDown,
  RotateCcw
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
  
  const compRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (compRef.current && !compRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mrpShortages = calculateMRP();
  const criticalShortagesCount = mrpShortages.filter(s => s.netShortage > 0).length;

  const rolesList: { role: ERPRole; label: string; desc: string }[] = [
    { role: 'owner', label: 'Owner / Managing Director', desc: 'Full plant & financials' },
    { role: 'production_manager', label: 'Production Manager', desc: 'Work orders & planning' },
    { role: 'storekeeper', label: 'Storekeeper', desc: 'GRN, issues & stock ledger' },
    { role: 'worker', label: 'Shop-Floor Worker', desc: 'Tactile task terminal' },
    { role: 'qc_inspector', label: 'QC Inspector', desc: 'Incoming & lot release' },
    { role: 'accountant', label: 'Accountant', desc: 'GST, invoices & ledgers' },
    { role: 'viewer', label: 'Auditor / Viewer', desc: 'Read-only compliance' }
  ];

  return (
    <header className="sticky top-0 z-30 h-14 bg-canvas border-b border-hairline px-4 md:px-8 flex items-center justify-between">
      {/* Brand & Wordmark */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded bg-ink text-white flex items-center justify-center font-bold text-xs tracking-tight">
            F
          </div>
          <span className="text-sm font-medium text-ink tracking-tight">
            FactoryFlow
          </span>
          <span className="text-[11px] font-normal text-ink-muted hidden sm:inline border-l border-hairline pl-2.5">
            ERP
          </span>
        </div>

        {/* Company Context Selector */}
        <div className="relative" ref={compRef}>
          <button
            onClick={() => { setCompanyDropdownOpen(!companyDropdownOpen); setRoleDropdownOpen(false); }}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-md bg-surface-1 border border-hairline hover:border-ink/50 transition-colors text-xs text-ink"
          >
            <Building2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="max-w-[130px] md:max-w-[210px] truncate font-medium">{activeCompany.name}</span>
            <ChevronDown className="w-3 h-3 text-ink-muted" />
          </button>

          {companyDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-72 bg-surface-1 rounded-lg border border-hairline shadow-lift p-1.5 z-50">
              <div className="px-2 py-1 text-[11px] font-medium text-ink-subtle">
                Switch company workspace
              </div>
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveCompanyId(c.id);
                    setCompanyDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors flex flex-col ${
                    c.id === activeCompany.id ? 'bg-surface-2 text-ink font-medium' : 'hover:bg-canvas text-ink-muted'
                  }`}
                >
                  <div className="text-xs text-ink">{c.name}</div>
                  <div className="text-[10px] text-ink-subtle mt-0.5 flex justify-between">
                    <span>{c.code} · {c.city}</span>
                    <span>GST: {c.gstin.slice(0, 8)}...</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Minimal Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parts, orders, work orders..."
            className="w-full pl-8 pr-3 py-1 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Fin Orange MRP indicator if shortages exist */}
        {criticalShortagesCount > 0 && (
          <button
            onClick={onOpenMRP}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-fin-orange text-white text-xs font-medium hover:bg-fin-orangeHover transition-colors"
          >
            <span>MRP: {criticalShortagesCount} shortages</span>
          </button>
        )}

        {/* Role Switcher */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => { setRoleDropdownOpen(!roleDropdownOpen); setCompanyDropdownOpen(false); }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-1 border border-hairline hover:border-ink/50 transition-colors text-xs text-ink"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-ink-muted" />
            <span className="capitalize font-medium hidden sm:inline">{currentRole.replace('_', ' ')}</span>
            <ChevronDown className="w-3 h-3 text-ink-muted" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-surface-1 rounded-lg border border-hairline shadow-lift p-1.5 z-50">
              <div className="px-2 py-1 text-[11px] font-medium text-ink-subtle">
                Role-based access view
              </div>
              {rolesList.map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    setCurrentRole(r.role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-md transition-colors ${
                    r.role === currentRole ? 'bg-surface-2 text-ink font-medium' : 'hover:bg-canvas text-ink-muted'
                  }`}
                >
                  <div className="text-xs text-ink">{r.label}</div>
                  <div className="text-[10px] text-ink-subtle">{r.desc}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Supabase Status Pill */}
        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-surface-1 border border-hairline hover:border-ink/50 text-xs text-ink transition-colors"
          title="Supabase PostgreSQL"
        >
          <Database className="w-3.5 h-3.5 text-ink-muted" />
          <span className="hidden md:inline font-medium">Supabase</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-report-green' : 'bg-ink-muted'}`} />
        </button>

        {/* Reset Data */}
        <button
          onClick={resetToDemoData}
          className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
          title="Reset sample data"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
