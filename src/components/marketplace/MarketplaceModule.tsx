import React, { useState } from 'react';
import {
  Search,
  Check,
  Download,
  Trash2,
  ExternalLink,
  Layers,
  ShoppingBag,
  Users,
  FileText,
  ShoppingCart,
  Store,
  Truck,
  Package,
  HardHat,
  CheckCircle2,
  Briefcase,
  BookOpen,
  FileSpreadsheet,
  Receipt,
  Scale,
  BarChart3,
  LifeBuoy,
  Bot,
  Sliders,
  Filter,
  CheckCircle
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { NavTab } from '../layout/Sidebar';

interface MarketplaceModuleProps {
  onNavigateTab?: (tab: NavTab) => void;
}

export interface AppDefinition {
  id: NavTab;
  name: string;
  category: 'Sales & CRM' | 'Supply Chain' | 'Manufacturing' | 'Finance & Tax' | 'HR & Operations';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgLight: string;
  badge?: string;
  isCore?: boolean;
  tagline: string;
  description: string;
  features: string[];
  version: string;
}

export const ERP_APPS: AppDefinition[] = [
  {
    id: 'crm',
    name: 'CRM & Lead Management',
    category: 'Sales & CRM',
    icon: Users,
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    badge: 'Popular',
    tagline: 'B2B Sales pipeline, follow-ups, and auto-conversion',
    description: 'Track industrial inquiries, lead stages, requirement drawings, follow-up scheduler, and one-click quotation drafts.',
    features: ['7-Stage industrial pipeline', 'Automated follow-up reminders', 'Instant quote generation'],
    version: 'v2.4'
  },
  {
    id: 'quotations',
    name: 'Quotations & Estimation',
    category: 'Sales & CRM',
    icon: FileText,
    color: 'text-indigo-600',
    bgLight: 'bg-indigo-50',
    badge: 'Essential',
    tagline: 'Itemized costing, GST slabs, and PDF proposals',
    description: 'Create professional manufacturing quotes with material costing, revision tracking, multi-tier approvals, and WhatsApp export.',
    features: ['Auto CGST/SGST/IGST split', 'Version revision history', 'PDF & WhatsApp sharing'],
    version: 'v2.1'
  },
  {
    id: 'sales',
    name: 'Sales Orders & Invoicing',
    category: 'Sales & CRM',
    icon: ShoppingCart,
    color: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
    badge: 'Core S2C',
    tagline: 'Order-to-Cash, delivery dispatch & E-Way bills',
    description: 'Manage confirmed customer orders, work order conversion, advance payments, delivery challans, and GST tax invoices.',
    features: ['Order-to-Work-Order pipeline', 'Delivery Challans & Transporter', 'Tax Invoices with GSTR-1'],
    version: 'v2.5'
  },
  {
    id: 'counter',
    name: 'Counter Sales POS',
    category: 'Sales & CRM',
    icon: Store,
    color: 'text-teal-600',
    bgLight: 'bg-teal-50',
    tagline: 'Fast over-the-counter billing and cash receipts',
    description: 'Rapid walk-in retail and wholesale point of sale counter with barcode scan, instant cash/UPI/credit billing, and thermal slip print.',
    features: ['Barcode scanning & instant lookup', 'UPI QR & cash receipts', 'Thermal 3-inch slip format'],
    version: 'v1.8'
  },
  {
    id: 'purchase',
    name: 'Procurement & Vendor Portal',
    category: 'Supply Chain',
    icon: Truck,
    color: 'text-amber-600',
    bgLight: 'bg-amber-50',
    badge: 'Essential',
    tagline: 'Requisitions, RFQs, POs, GRN & 3-Way Matching',
    description: 'End-to-end purchasing workflow from purchase requisition (PR) to RFQ comparison matrix (L1/L2), PO generation, GRN inspection, and vendor bills.',
    features: ['L1/L2 RFQ comparison matrix', 'Central stock ledger GRN posting', '3-Way matching (PO-GRN-Bill)'],
    version: 'v2.4'
  },
  {
    id: 'inventory',
    name: 'Inventory & Warehousing',
    category: 'Supply Chain',
    icon: Package,
    color: 'text-orange-600',
    bgLight: 'bg-orange-50',
    badge: 'Core',
    isCore: true,
    tagline: 'Multi-bin storage, batches, min-max reordering',
    description: 'Centralized stock management across raw material, finished goods, and consumable stores with real-time stock valuation and reorder alerts.',
    features: ['Multi-warehouse & bin locations', 'Batch number & expiry tracking', 'Low-stock auto reorder triggers'],
    version: 'v2.3'
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & BOM Engine',
    category: 'Manufacturing',
    icon: Layers,
    color: 'text-purple-600',
    bgLight: 'bg-purple-50',
    badge: 'Industry-Std',
    tagline: 'Multi-level BOMs, work orders & routing',
    description: 'Define bill of materials, stage-wise operations, production work orders, raw material issue slips, and scrap calculations.',
    features: ['Multi-level engineering BOM', 'Routing & machine work centers', 'Material issue & scrap tracking'],
    version: 'v2.2'
  },
  {
    id: 'shopfloor',
    name: 'Shop-Floor Terminal',
    category: 'Manufacturing',
    icon: HardHat,
    color: 'text-cyan-600',
    bgLight: 'bg-cyan-50',
    tagline: 'Touchscreen kiosk for machine operators',
    description: 'Operator execution terminal to start/pause production jobs, log completed pieces, report machine downtime, and view component drawings.',
    features: ['Operator login with 1-click start', 'Job timers & pieces counter', 'Machine breakdown alerts'],
    version: 'v2.0'
  },
  {
    id: 'quality',
    name: 'Quality Assurance & QC',
    category: 'Manufacturing',
    icon: CheckCircle2,
    color: 'text-rose-600',
    bgLight: 'bg-rose-50',
    tagline: 'Inward, in-process & final inspection certificates',
    description: 'Manage quality checklists, tolerance limits, CAPA reports, rejection slips, and generate signed Pre-Dispatch Inspection Certificates (PDIR).',
    features: ['Inward & PDIR inspections', 'Rejection analysis & scrap log', 'CAPA audit trail'],
    version: 'v1.9'
  },
  {
    id: 'work',
    name: 'Project & Milestone Tracking',
    category: 'Manufacturing',
    icon: Briefcase,
    color: 'text-sky-600',
    bgLight: 'bg-sky-50',
    tagline: 'Made-to-order custom tooling & engineering milestones',
    description: 'Track custom manufacturing projects, customer approvals, tooling trials, delivery commitments, and engineering deliverables.',
    features: ['Milestone timeline charts', 'Customer sign-off logs', 'Deliverable checklist'],
    version: 'v1.7'
  },
  {
    id: 'khatabook',
    name: 'Bahi Khata & Daybook',
    category: 'Finance & Tax',
    icon: BookOpen,
    color: 'text-violet-600',
    bgLight: 'bg-violet-50',
    badge: 'Bharat MSME',
    tagline: 'Customer & vendor credit balance ledger with WhatsApp',
    description: 'Simple Udhar-Jama ledger designed for Indian factory owners to track party-wise dues, payment history, and send instant WhatsApp payment reminders.',
    features: ['Party-wise outstanding ledger', 'WhatsApp payment reminder links', 'Cash & bank daily summary'],
    version: 'v2.2'
  },
  {
    id: 'finance',
    name: 'Finance & Accounting Ledger',
    category: 'Finance & Tax',
    icon: FileSpreadsheet,
    color: 'text-green-600',
    bgLight: 'bg-green-50',
    tagline: 'Double-entry accounting, P&L, balance sheet',
    description: 'Chart of accounts, journal vouchers, bank reconciliation, debtor/creditor aging, and instant Profit & Loss and Balance Sheet statements.',
    features: ['Double-entry journal vouchers', 'Aging analysis (30/60/90 days)', 'Instant P&L & Balance Sheet'],
    version: 'v2.3'
  },
  {
    id: 'gstReturns',
    name: 'GST Tax Center & GSTR-2B',
    category: 'Finance & Tax',
    icon: Receipt,
    color: 'text-blue-700',
    bgLight: 'bg-blue-50',
    badge: 'Compliance',
    tagline: 'GSTR-1 JSON generator, GSTR-2B reconciliation & ITC',
    description: 'Reconcile purchase invoices against GSTR-2B auto-drafted ITC, identify missing vendor filings, and export 1-click GSTR-1 JSON for portal filing.',
    features: ['GSTR-2B 1-click ITC match', 'Missing vendor filing detector', 'Direct GSTR-1 JSON export'],
    version: 'v2.4'
  },
  {
    id: 'caDesk',
    name: 'Chartered Accountant & Audit Desk',
    category: 'Finance & Tax',
    icon: Scale,
    color: 'text-amber-700',
    bgLight: 'bg-amber-50',
    tagline: 'Direct portal for external auditor, Schedule III & MSME 45-day',
    description: 'Dedicated portal for external auditors to inspect financial books, review MSME 45-day payment compliance, download Schedule III balance sheets, and post audit queries.',
    features: ['MSME 45-day non-compliance monitor', 'Schedule III MCA reports', 'Auditor query ticketing portal'],
    version: 'v2.0'
  },
  {
    id: 'hrms',
    name: 'HRMS, Payroll & Biometrics',
    category: 'HR & Operations',
    icon: Users,
    color: 'text-pink-600',
    bgLight: 'bg-pink-50',
    tagline: 'Employee master, biometric attendance & salary slips',
    description: 'Manage factory workforce, shift rosters, biometric device sync, PF/ESIC deductions, monthly payroll generation, and printable salary slips.',
    features: ['Daily biometric attendance sync', 'PF, ESIC & PT salary engine', 'PDF payslip generator'],
    version: 'v2.1'
  },
  {
    id: 'reports',
    name: 'Executive Reports & Analytics',
    category: 'HR & Operations',
    icon: BarChart3,
    color: 'text-slate-700',
    bgLight: 'bg-slate-100',
    tagline: 'Business intelligence, production OEE & cost margins',
    description: 'High-level executive metrics covering revenue vs expenses, gross manufacturing margin, machine OEE, on-time delivery rates, and PDF board packs.',
    features: ['Real-time factory gross margins', 'Machine OEE & downtime trends', 'Automated monthly board packs'],
    version: 'v2.2'
  },
  {
    id: 'support',
    name: 'Helpdesk & Support Desk',
    category: 'HR & Operations',
    icon: LifeBuoy,
    color: 'text-orange-700',
    bgLight: 'bg-orange-50',
    tagline: 'Customer complaints, RMA warranty & factory tickets',
    description: 'Log and track customer complaints, internal factory maintenance tickets, machine breakdown alerts, and service level agreements (SLAs).',
    features: ['Ticket assignment & SLA timers', 'Customer complaint tracking', 'RMA & warranty repair log'],
    version: 'v1.6'
  }
];

export const MarketplaceModule: React.FC<MarketplaceModuleProps> = ({ onNavigateTab }) => {
  const {
    installedModules,
    installModule,
    uninstallModule,
    isModuleInstalled,
    resetModulesToDefault
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const categories = ['All', 'Sales & CRM', 'Supply Chain', 'Manufacturing', 'Finance & Tax', 'HR & Operations'];

  const filteredApps = ERP_APPS.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalInstalled = ERP_APPS.filter(app => isModuleInstalled(app.id)).length;
  const totalApps = ERP_APPS.length;

  const handleInstall = (app: AppDefinition) => {
    installModule(app.id);
    showNotice(`"${app.name}" installed successfully. Added to your navigation.`, 'success');
  };

  const handleUninstall = (app: AppDefinition) => {
    if (app.isCore) return;
    uninstallModule(app.id);
    showNotice(`"${app.name}" disabled. Removed from navigation.`, 'info');
  };

  const showNotice = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm font-medium shadow-sm transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-800 border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-4 h-4 ${notification.type === 'success' ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-75 hover:opacity-100 transition-opacity"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search and Category Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search apps by keyword, feature (e.g. GST, RFQ, Shopfloor, Quotes)..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Showing {filteredApps.length} modules</span>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map(app => {
          const Icon = app.icon;
          const installed = isModuleInstalled(app.id);

          return (
            <div
              key={app.id}
              className={`flex flex-col justify-between bg-white rounded-xl border transition-all duration-200 hover:shadow-md ${
                installed ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-90'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header Row: Icon, Title, Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${app.bgLight}`}>
                      <Icon className={`w-5 h-5 ${app.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        {app.name}
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">{app.category}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {app.isCore ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        Core System
                      </span>
                    ) : app.badge ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {app.badge}
                      </span>
                    ) : null}

                    {installed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <Check className="w-3 h-3 stroke-[3]" /> Installed
                      </span>
                    )}
                  </div>
                </div>

                {/* Tagline & Description */}
                <div>
                  <p className="text-xs font-medium text-slate-700 leading-snug">{app.tagline}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{app.description}</p>
                </div>

                {/* Key Features Bullets */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  {app.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/70" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">{app.version}</span>

                <div className="flex items-center gap-2">
                  {installed ? (
                    <>
                      {!app.isCore && (
                        <button
                          onClick={() => handleUninstall(app)}
                          title="Disable this module"
                          className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                        >
                          Disable
                        </button>
                      )}
                      <button
                        onClick={() => onNavigateTab && onNavigateTab(app.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200/60 shadow-xs"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInstall(app)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install App</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
