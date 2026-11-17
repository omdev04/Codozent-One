import React, { useState } from 'react';
import { 
  Factory, 
  ShoppingCart, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Building2,
  ExternalLink,
  Shield,
  Users,
  Layers,
  Boxes,
  FileText,
  FileSpreadsheet,
  Sparkles,
  CreditCard,
  Settings,
  Check,
  X,
  Briefcase,
  Package,
  Store,
  Truck,
  HardHat,
  Edit2,
  LayoutDashboard,
  CheckCircle,
  HelpCircle,
  Grid,
  Search,
  FileCheck,
  UserCheck,
  BookOpen,
  BarChart3,
  MapPin,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { NavTab } from '../layout/Sidebar';
import { ERP_APPS, AppDefinition } from '../marketplace/MarketplaceModule';
import { Company } from '../../types/erp';

interface ExecutiveDashboardProps {
  onNavigate: (tab: NavTab) => void;
  onOpenMRP: () => void;
  viewMode?: 'portal' | 'operations';
  setViewMode?: (mode: 'portal' | 'operations') => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  onNavigate, 
  onOpenMRP,
  viewMode: propViewMode,
  setViewMode: propSetViewMode
}) => {
  const { 
    activeCompany, 
    companies,
    selectCompany,
    createCompany,
    currentUser,
    installedModules,
    isModuleInstalled,
    items, 
    salesOrders, 
    workOrders, 
    qualityInspections, 
    chartOfAccounts, 
    companyUsers,
    calculateMRP 
  } = useERP();

  const activeCompanyId = activeCompany.id;

  // View state: 'portal' (Organizations Hub Entry Point) vs 'operations' (Specific Company Workspace Dashboard)
  const [internalViewMode, setInternalViewMode] = useState<'portal' | 'operations'>('portal');
  const viewMode = propViewMode !== undefined ? propViewMode : internalViewMode;
  const setViewMode = propSetViewMode || setInternalViewMode;

  // Search & Filter state
  const [searchFilter, setSearchFilter] = useState('');

  // Module chip metadata for company cards
  const MODULE_CHIPS: Record<string, { label: string }> = {
    crm: { label: 'CRM' },
    quotations: { label: 'Quotes' },
    sales: { label: 'Sales' },
    counter: { label: 'POS' },
    purchase: { label: 'Procure' },
    inventory: { label: 'Inventory' },
    manufacturing: { label: 'Mfg & BOM' },
    shopfloor: { label: 'Shopfloor' },
    quality: { label: 'Quality' },
    work: { label: 'Projects' },
    khatabook: { label: 'Khata' },
    finance: { label: 'Finance' },
    gstReturns: { label: 'GST' },
    caDesk: { label: 'CA Desk' },
    hrms: { label: 'HRMS' },
    support: { label: 'Support' },
    reports: { label: 'Reports' }
  };

  // Helper to read per-company allocated modules
  const getCompanyModules = (comp: Company): string[] => {
    try {
      const saved = localStorage.getItem(`Codozent One_modules_${comp.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Distinct module distribution per company
    if (comp.industry?.toLowerCase().includes('trading') || comp.code === 'COC') {
      return ['crm', 'quotations', 'sales', 'counter', 'khatabook', 'finance', 'gstReturns', 'caDesk', 'reports', 'settings'];
    }
    return [
      'crm', 'quotations', 'sales', 'purchase', 'inventory', 'manufacturing', 
      'shopfloor', 'quality', 'work', 'finance', 'gstReturns', 'caDesk', 'hrms', 'reports', 'settings'
    ];
  };

  // Modal State for Adding a New Company
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    code: '',
    gstin: '',
    city: 'Pune',
    industry: 'CNC Machining & Precision Turning',
    moduleSuite: 'manufacturing' as 'manufacturing' | 'trading' | 'finance'
  });
  const [addCompanyError, setAddCompanyError] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Operations Metrics Calculations
  const shortages = calculateMRP();
  const criticalShortagesCount = shortages.filter(s => s.netShortage > 0).length;
  const activeWorkOrders = workOrders.filter(w => ['scheduled', 'in_progress'].includes(w.status));
  const completedToday = workOrders.reduce((acc, w) => acc + (w.producedQuantity || 0), 0);
  const totalPlannedToday = workOrders.reduce((acc, w) => acc + (w.plannedQuantity || 0), 0);
  const productionRate = totalPlannedToday > 0 ? Math.round((completedToday / totalPlannedToday) * 100) : 0;
  const totalSalesRevenue = salesOrders.reduce((acc, s) => acc + s.grandTotal, 0);
  const pendingSalesCount = salesOrders.filter(s => ['confirmed', 'in_production'].includes(s.status)).length;

  const bankBalance = chartOfAccounts.find(c => c.accountCode === '1000')?.balance || 0;
  const debtorsBalance = chartOfAccounts.find(c => c.accountCode === '1100')?.balance || 0;
  const creditorsBalance = chartOfAccounts.find(c => c.accountCode === '2000')?.balance || 0;
  const gstLiability = chartOfAccounts.find(c => c.accountCode === '2100')?.balance || 0;
  const lowStockCount = items.filter(i => i.currentStock <= i.reorderLevel).length;

  const totalInspections = qualityInspections.length;
  const passedInspections = qualityInspections.filter(q => q.status === 'passed').length;
  const acceptanceRate = totalInspections > 0 ? `${((passedInspections / totalInspections) * 100).toFixed(1)}%` : '100%';

  const maxCompaniesAllowed = 5;
  const totalActiveModules = installedModules.length;

  // Filter companies based on search
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchFilter.toLowerCase())) ||
    (c.city && c.city.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  // Handle entering a workspace (Zoho entry point pattern)
  const handleEnterWorkspace = async (companyId: string) => {
    try {
      if (companyId !== activeCompanyId) {
        await selectCompany(companyId);
      }
      const comp = companies.find(c => c.id === companyId);
      setNotification(`Entered ${comp?.name || 'workspace'}`);
      setTimeout(() => setNotification(null), 3000);
      setViewMode('operations');
    } catch (err: any) {
      setNotification('Failed to switch workspace');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Launch a specific app module directly into active workspace
  const handleLaunchApp = async (tab: NavTab) => {
    onNavigate(tab);
  };

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.name.trim()) {
      setAddCompanyError('Please enter the company legal name.');
      return;
    }

    setIsCreatingCompany(true);
    setAddCompanyError('');
    try {
      const compCode = (newCompanyForm.code || newCompanyForm.name.slice(0, 4)).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const created = await createCompany({
        name: newCompanyForm.name.trim(),
        code: compCode || 'COMP',
        gstin: newCompanyForm.gstin.trim() || '27AAACP0123M1Z5',
        city: newCompanyForm.city.trim() || 'Pune',
        industry: newCompanyForm.industry
      });

      // Save custom module suite allocation for this specific company
      const compModules = newCompanyForm.moduleSuite === 'trading'
        ? ['crm', 'quotations', 'sales', 'counter', 'khatabook', 'finance', 'gstReturns', 'caDesk', 'reports', 'settings']
        : newCompanyForm.moduleSuite === 'finance'
        ? ['sales', 'khatabook', 'finance', 'gstReturns', 'caDesk', 'reports', 'settings']
        : ['crm', 'quotations', 'sales', 'purchase', 'inventory', 'manufacturing', 'shopfloor', 'quality', 'work', 'finance', 'gstReturns', 'caDesk', 'hrms', 'reports', 'settings'];
      localStorage.setItem(`Codozent One_modules_${created.id}`, JSON.stringify(compModules));

      setIsAddCompanyOpen(false);
      setNewCompanyForm({
        name: '',
        code: '',
        gstin: '',
        city: 'Pune',
        industry: 'CNC Machining & Precision Turning',
        moduleSuite: 'manufacturing'
      });
      setNotification(`Created & entered ${created.name}`);
      setTimeout(() => setNotification(null), 4000);
      setViewMode('operations');
    } catch (err: any) {
      setAddCompanyError(err.message || 'Failed to create workspace.');
    } finally {
      setIsCreatingCompany(false);
    }
  };

  // Get initials for company avatar
  const getInitials = (name: string, code?: string) => {
    if (code && code.length >= 2) return code.slice(0, 3).toUpperCase();
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filter active apps SPECIFICALLY for the active company
  const activeCompanyApps = ERP_APPS.filter(a => isModuleInstalled(a.id));

  // App suite groupings ONLY for modules that are installed for this company
  const activeAppSuites: { title: string; desc: string; apps: AppDefinition[] }[] = [
    {
      title: 'Sales & Customer Operations',
      desc: 'Lead pipelines, quotation estimation & tax invoicing',
      apps: activeCompanyApps.filter(a => ['crm', 'quotations', 'sales', 'counter'].includes(a.id))
    },
    {
      title: 'Supply Chain & Manufacturing',
      desc: 'Procurement, warehouses, BOM jobs, shop-floor terminal & QC',
      apps: activeCompanyApps.filter(a => ['purchase', 'inventory', 'manufacturing', 'shopfloor', 'quality', 'work'].includes(a.id))
    },
    {
      title: 'Finance, Tax & Audit',
      desc: 'Double-entry ledger, Bahi Khata, GST center & CA audit desk',
      apps: activeCompanyApps.filter(a => ['finance', 'khatabook', 'gstReturns', 'caDesk'].includes(a.id))
    },
    {
      title: 'Human Resources & Governance',
      desc: 'Biometric attendance, payroll, support desk & executive reports',
      apps: activeCompanyApps.filter(a => ['hrms', 'support', 'reports'].includes(a.id))
    }
  ].filter(suite => suite.apps.length > 0);

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* VIEW 1: ORGANIZATIONS HUB & TENANT DIRECTORY (Matches Image 2 Reference)  */}
      {/* ========================================================================= */}
      {viewMode === 'portal' ? (
        <div className="space-y-8 animate-in fade-in duration-150">
          
          {/* 1. HERO BAR: Title, Plan Status & Action Buttons (Matching Image 2) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {currentUser.name ? `${currentUser.name}'s workspace` : "Om Shukla's workspace"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                  {currentUser.role || 'Owner'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {companies.length} {companies.length === 1 ? 'company' : 'companies'} • {totalActiveModules} modules licensed
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Plan & users</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddCompanyOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0c6cf2] hover:bg-[#0052cc] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New company</span>
              </button>
            </div>
          </div>

          {/* 2. COMPANIES SECTION (Matching Image 2 Reference) */}
          <div className="space-y-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Companies
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                each one is a separate workspace with its own team and data
              </p>
            </div>

            {/* Organizations Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCompanies.map((comp) => {
                const isCurrent = comp.id === activeCompanyId;
                const initials = getInitials(comp.name, comp.code);
                const compModules = getCompanyModules(comp);

                // Module badge list matching Image 2 reference
                const moduleBadges = [
                  { id: 'finance', label: 'Money & books', icon: FileSpreadsheet },
                  { id: 'crm', label: 'Leads', icon: Users },
                  { id: 'hrms', label: 'HR & Payroll', icon: UserCheck },
                  { id: 'inventory', label: 'Inventory', icon: Package },
                  { id: 'manufacturing', label: 'Manufacturing', icon: Layers },
                  { id: 'reports', label: 'Ad reports', icon: BarChart3 },
                  { id: 'work', label: 'Tasks', icon: Briefcase }
                ].filter(b => compModules.includes(b.id));

                return (
                  <div
                    key={comp.id}
                    className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between hover:shadow-md ${
                      isCurrent
                        ? 'border-blue-400 ring-2 ring-blue-500/15 shadow-xs'
                        : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Row: Avatar + Name + Current Badge */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                            isCurrent
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          }`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold text-slate-900 truncate" title={comp.name}>
                                {comp.name}
                              </h3>
                              <Edit2 className="w-3 h-3 text-slate-300 shrink-0" />
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              {comp.id === 'comp-1' ? '2 members' : '1 member'} • {compModules.length} apps
                            </div>
                          </div>
                        </div>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Current
                          </span>
                        )}
                      </div>

                      {/* App Badges Grid (Matching Image 2) */}
                      <div className="py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {moduleBadges.map(badge => {
                            const Icon = badge.icon;
                            return (
                              <span
                                key={badge.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                <Icon className="w-3 h-3 text-slate-400" />
                                <span>{badge.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Primary Action (Direct Entrance to Workspace) */}
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleEnterWorkspace(comp.id)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#0c6cf2] hover:bg-[#0052cc] text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-[#0c6cf2] hover:text-white text-slate-800 transition-colors'
                        }`}
                      >
                        <span>→ Enter workspace</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add New Organization Card */}
              <div
                onClick={() => setIsAddCompanyOpen(true)}
                className="bg-white hover:bg-blue-50/20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0c6cf2] p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] group shadow-2xs"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0c6cf2] border border-blue-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add a company</h3>
                <span className="my-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Included in Plan
                </span>
                <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
                  Its own team and data, with the modules your account already has. Provisioned with instant multi-tenant isolation.
                </p>
              </div>
            </div>
          </div>

          {/* 3. ACCOUNT COVERAGE SECTION (Matching Image 2 Reference) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Made-to-Order Manufacturing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  What your account covers — shared across every company.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('marketplace')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Grid className="w-3.5 h-3.5 text-slate-400" />
                  <span>Marketplace</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  Manage plan
                </button>
              </div>
            </div>

            {/* Three Progress Bars: Companies, Modules, Users */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Companies</span>
                  <span className="font-bold text-slate-900">{companies.length} / 5</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#0c6cf2] h-full rounded-full" style={{ width: `${(companies.length / 5) * 100}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">At your plan limit. Add another with Add a company.</p>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Modules</span>
                  <span className="font-bold text-slate-900">{totalActiveModules} active</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (totalActiveModules / 15) * 100)}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">{totalActiveModules} owned across the account</p>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">Users</span>
                  <span className="font-bold text-slate-900">1 / 5</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '20%' }} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">1 of 5 users in use, across every company</p>
              </div>
            </div>

            {/* MODULES ON THE ACCOUNT */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                Modules on the account
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Billing', 'CA Desk', 'Leads', 'GST Returns', 'HR & Payroll',
                  'Inventory', 'Accounting', 'Manufacturing', 'Quotations', 'Tasks'
                ].map((modName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{modName} on</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 4. SUBSCRIPTION & ACCOUNT SPLIT (Matching Image 2 Reference) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Subscription Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Subscription</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    bought once for the account, on in every company
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('marketplace')}
                  className="text-xs text-[#0c6cf2] hover:underline font-bold"
                >
                  Browse marketplace
                </button>
              </div>

              {/* Table */}
              <div className="divide-y divide-slate-100 text-xs">
                <div className="grid grid-cols-3 py-2 font-bold text-slate-400 text-[10px] uppercase tracking-wider">
                  <span>Module</span>
                  <span>Status</span>
                  <span className="text-right">Renews</span>
                </div>
                {[
                  'Billing', 'CA Desk', 'Leads', 'GST Returns', 'HR & Payroll',
                  'Inventory', 'Accounting', 'Manufacturing', 'Quotations', 'Tasks'
                ].map((mod, idx) => (
                  <div key={idx} className="grid grid-cols-3 py-2.5 items-center">
                    <span className="font-semibold text-slate-900">{mod}</span>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                    <span className="text-right text-slate-400 font-mono">—</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Codozent One enterprise license manages the applications on this account.
              </div>
            </div>

            {/* Right: Account & Administrators */}
            <div className="space-y-6">
              {/* Account Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  Account
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Name</span>
                    <span className="font-bold text-slate-900">
                      {currentUser.name ? `${currentUser.name}'s workspace` : "Om Shukla's workspace"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[11px] block">Billing email</span>
                    <span className="font-mono text-slate-700">{currentUser.email || 'oms976346@gmail.com'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Your role here</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                        {currentUser.role || 'Owner'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[11px] block">Status</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrators Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Account administrators</h3>
                  <button
                    type="button"
                    onClick={() => onNavigate('settings')}
                    className="text-xs text-[#0c6cf2] hover:underline font-bold"
                  >
                    Edit
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Administrators can create companies and manage the subscription. This does not give them access to any company's data.
                </p>

                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div>
                      <div className="font-bold text-slate-900">{currentUser.name || 'Om Sanjay Shukla'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{currentUser.email || 'oms976346@gmail.com'}</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">owner</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div>
                      <div className="font-bold text-slate-900">Om Shukla</div>
                      <div className="text-[11px] text-slate-400 font-mono">mikam471@gmail.com</div>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">owner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================================= */
        /* VIEW 2: ACTIVE COMPANY WORKSPACE OPERATIONS (Inside the Workspace)      */
        /* ======================================================================= */
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Top Breadcrumb & Return-to-Hub Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('portal')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-700 hover:text-[#0c6cf2] hover:bg-blue-50 font-bold text-xs border border-slate-200 hover:border-blue-200 transition-all cursor-pointer shadow-2xs"
                title="Return to Organizations Hub"
              >
                <ArrowLeft className="w-4 h-4 text-[#0c6cf2]" />
                <span>← All Organizations</span>
              </button>
              <span className="text-slate-300 font-normal">/</span>
              <div className="min-w-0">
                <span className="font-bold text-slate-900 text-sm truncate block">{activeCompany.name}</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {activeCompany.city}, {activeCompany.state} · GSTIN {activeCompany.gstin}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setViewMode('portal')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Grid className="w-3.5 h-3.5 text-[#0c6cf2]" />
                <span>Switch Organization</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('sales')}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                <span>New Sales Order</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('manufacturing')}
                className="px-4 py-1.5 rounded-xl bg-[#0c6cf2] hover:bg-[#0052cc] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Work Order</span>
              </button>
            </div>
          </div>

          {/* 4 Operations KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Output */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Today's production output</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {completedToday} <span className="text-xs font-normal text-slate-500">/ {totalPlannedToday} nos</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Progress: {productionRate}%</span>
                <span>{activeWorkOrders.length} active jobs</span>
              </div>
            </div>

            {/* Sales */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Confirmed sales orders</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {pendingSalesCount} <span className="text-xs font-normal text-slate-500">orders</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Total order value</span>
                <span className="font-mono text-slate-900 font-semibold">₹{totalSalesRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Shortages */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Material shortages (MRP)</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono flex items-baseline gap-2">
                <span className={criticalShortagesCount > 0 ? 'text-amber-600' : 'text-slate-900'}>
                  {criticalShortagesCount}
                </span>
                <span className="text-xs font-normal text-slate-500">items</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Low stock: {lowStockCount}</span>
                <button 
                  onClick={onOpenMRP}
                  className="text-[#0c6cf2] hover:underline font-semibold cursor-pointer"
                >
                  Run MRP
                </button>
              </div>
            </div>

            {/* Quality */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Quality acceptance rate</div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {acceptanceRate}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Rejections &lt; 2%</span>
                <button 
                  onClick={() => onNavigate('quality')}
                  className="text-[#0c6cf2] hover:underline font-semibold cursor-pointer"
                >
                  Log view
                </button>
              </div>
            </div>
          </div>

          {/* Work Orders List & Financial Position Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Jobs */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Active machine work orders</h3>
                  <p className="text-xs text-slate-500">Real-time status of shop-floor fabrication jobs</p>
                </div>
                <button
                  onClick={() => onNavigate('manufacturing')}
                  className="text-xs text-[#0c6cf2] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {workOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No active production work orders. Schedule a job from confirmed sales orders or manufacturing catalog.
                  </div>
                ) : (
                  workOrders.slice(0, 4).map((wo) => {
                    const progress = wo.plannedQuantity > 0 ? Math.round(((wo.producedQuantity || 0) / wo.plannedQuantity) * 100) : 0;
                    return (
                      <div key={wo.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-semibold text-[#0c6cf2]">{wo.woNumber}</span>
                            <span className="text-xs font-semibold text-slate-900">{wo.productName}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Assigned: {wo.assignedWorker || 'Operator'} · Due: {wo.dueDate}
                          </div>
                        </div>

                        <div className="text-right flex items-center space-x-4">
                          <div>
                            <div className="text-xs font-mono font-bold text-slate-900">
                              {wo.producedQuantity || 0} / {wo.plannedQuantity}
                            </div>
                            <div className="text-[11px] text-slate-500">{progress}%</div>
                          </div>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div 
                              className="bg-[#0c6cf2] h-full rounded-full" 
                              style={{ width: `${Math.min(progress, 100)}%` }} 
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Financial & Tax Position</h3>
                <p className="text-xs text-slate-500">Live general ledger balances</p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-600">Cash & bank balance</span>
                  <span className="font-mono font-bold text-slate-900">₹{bankBalance.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-600">Trade receivables</span>
                  <span className="font-mono font-semibold text-slate-900">₹{debtorsBalance.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-600">Trade payables</span>
                  <span className="font-mono font-semibold text-slate-900">₹{creditorsBalance.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-600">Net GST liability (3B)</span>
                  <span className="font-mono font-bold text-amber-700">₹{gstLiability.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('finance')}
                className="w-full py-2 text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              >
                Review accounting ledger
              </button>
            </div>
          </div>

          {/* Active Company Installed Applications Suite */}
          {activeAppSuites.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-[#0c6cf2]" />
                    <span>Installed Applications ({activeCompany.name})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Launch directly into active workflows licensed and configured for this organization.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('marketplace')}
                  className="text-xs text-[#0c6cf2] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>App Marketplace</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Categorized Suites Grid (Only suites with installed apps for this company) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeAppSuites.map((suite, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="pb-2 border-b border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          {suite.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{suite.desc}</p>
                      </div>

                      <div className="space-y-1.5">
                        {suite.apps.map((app) => {
                          const Icon = app.icon || Package;
                          return (
                            <div
                              key={app.id}
                              onClick={() => handleLaunchApp(app.id)}
                              className="group p-2.5 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/40 transition-all flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-[#0c6cf2] flex items-center justify-center shrink-0 transition-colors">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-bold text-slate-800 group-hover:text-[#0c6cf2] transition-colors truncate">
                                    {app.name}
                                  </span>
                                  <span className="block text-[10px] text-slate-500 truncate">
                                    {app.tagline || app.category}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0c6cf2] group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD A NEW ORGANIZATION WORKSPACE                                   */}
      {/* ========================================================================= */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0c6cf2] border border-blue-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Organization Workspace</h3>
                  <p className="text-xs text-slate-500">Provision a separate legal entity with isolated ledger and data.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCompanyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addCompanyError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addCompanyError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCompanySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Company Legal Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Precision Technologies Pvt Ltd"
                  value={newCompanyForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
                    setNewCompanyForm(prev => ({
                      ...prev,
                      name,
                      code: prev.code ? prev.code : autoCode
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0c6cf2] focus:ring-2 focus:ring-[#0c6cf2]/10 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Short Prefix Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. APEX"
                    value={newCompanyForm.code}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 uppercase font-mono focus:outline-none focus:border-[#0c6cf2] focus:ring-2 focus:ring-[#0c6cf2]/10 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Plant City / Hub
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Chakan"
                    value={newCompanyForm.city}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0c6cf2] focus:ring-2 focus:ring-[#0c6cf2]/10 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  GSTIN (Indian GST Number)
                </label>
                <input
                  type="text"
                  placeholder="27AAACP0123M1Z5"
                  value={newCompanyForm.gstin}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, gstin: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 uppercase font-mono focus:outline-none focus:border-[#0c6cf2] focus:ring-2 focus:ring-[#0c6cf2]/10 transition-colors"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Default compliant demo GSTIN used if left blank.</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Primary Industrial Sector
                </label>
                <select
                  value={newCompanyForm.industry}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0c6cf2] focus:ring-2 focus:ring-[#0c6cf2]/10 transition-colors"
                >
                  <option value="CNC Machining & Precision Turning">CNC Machining & Precision Turning</option>
                  <option value="Automotive Components & Ancillaries">Automotive Components & Ancillaries</option>
                  <option value="Sheet Metal & Laser Fabrication">Sheet Metal & Laser Fabrication</option>
                  <option value="Trading, Wholesale & Distribution">Trading, Wholesale & Distribution</option>
                  <option value="Tool, Die & Mold Making">Tool, Die & Mold Making</option>
                  <option value="General Engineering & Job Shop">General Engineering & Job Shop</option>
                </select>
              </div>

              {/* Module Suite Allocation for this Company */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Allocated Module Suite
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${newCompanyForm.moduleSuite === 'manufacturing' ? 'border-[#0c6cf2] bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="moduleSuite"
                      value="manufacturing"
                      checked={newCompanyForm.moduleSuite === 'manufacturing'}
                      onChange={() => setNewCompanyForm({ ...newCompanyForm, moduleSuite: 'manufacturing' })}
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-900 text-xs">Full Manufacturing</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">14 Apps (BOM, Shopfloor, QC, Stores, Sales)</div>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${newCompanyForm.moduleSuite === 'trading' ? 'border-[#0c6cf2] bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="moduleSuite"
                      value="trading"
                      checked={newCompanyForm.moduleSuite === 'trading'}
                      onChange={() => setNewCompanyForm({ ...newCompanyForm, moduleSuite: 'trading' })}
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-900 text-xs">Trading & Distribution</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">10 Apps (CRM, Sales, POS, Khata, GST)</div>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer transition-all ${newCompanyForm.moduleSuite === 'finance' ? 'border-[#0c6cf2] bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="moduleSuite"
                      value="finance"
                      checked={newCompanyForm.moduleSuite === 'finance'}
                      onChange={() => setNewCompanyForm({ ...newCompanyForm, moduleSuite: 'finance' })}
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-900 text-xs">Finance & CA Desk</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">7 Apps (Invoicing, Ledger, GST, Audit)</div>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCompany}
                  className="px-4 py-2 rounded-lg bg-[#0c6cf2] hover:bg-[#0052cc] disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  {isCreatingCompany ? (
                    <span>Creating workspace...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create & Enter</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
