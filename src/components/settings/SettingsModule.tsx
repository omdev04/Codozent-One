import React, { useState, useEffect } from 'react';
import {
  Building2,
  Layers,
  Users,
  FileText,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Hash,
  X,
  Search,
  FileCheck
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleManagement } from './ModuleManagement';
import { UserAccessManagement } from './UserAccessManagement';

export type SettingsTab = 'company' | 'branches' | 'modules' | 'users' | 'sequences' | 'audit';

interface SettingsModuleProps {
  initialTab?: SettingsTab;
  onTabChange?: (tab: string) => void;
}

const INDIAN_STATES = [
  { name: 'Maharashtra', code: '27' },
  { name: 'Gujarat', code: '24' },
  { name: 'Karnataka', code: '29' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Haryana', code: '06' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Delhi', code: '07' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Telangana', code: '36' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Punjab', code: '03' },
  { name: 'West Bengal', code: '19' }
];

const MANUFACTURING_SECTORS = [
  'Precision Engineering & CNC Machining',
  'Automotive Components & Ancillaries',
  'Sheet Metal & Laser Fabrication',
  'Tool, Die & Mold Making',
  'Plastics & Polymer Injection Molding',
  'Electrical & Electronic Assemblies',
  'Heavy Fabrication & Job Shop Operations',
  'General Manufacturing'
];

interface DocumentSequenceConfig {
  id: string;
  type: string;
  prefix: string;
  yearFormat: 'YYYY' | 'YY-YY' | 'NONE';
  separator: string;
  padding: number;
  currentNumber: number;
  sample: string;
}

const DEFAULT_SEQUENCES: DocumentSequenceConfig[] = [
  { id: 'so', type: 'Sales Orders', prefix: 'SO', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 44, sample: 'SO-2026-00044' },
  { id: 'po', type: 'Purchase Orders', prefix: 'PO', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 90, sample: 'PO-2026-00090' },
  { id: 'wo', type: 'Work Orders', prefix: 'WO', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 17, sample: 'WO-2026-00017' },
  { id: 'inv', type: 'GST Tax Invoices', prefix: 'INV', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 89, sample: 'INV-2026-00089' },
  { id: 'grn', type: 'Goods Receipt Note (GRN)', prefix: 'GRN', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 32, sample: 'GRN-2026-00032' },
  { id: 'dc', type: 'Delivery Challans', prefix: 'DC', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 20, sample: 'DC-2026-00020' },
  { id: 'qc', type: 'Quality Inspections', prefix: 'QC', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 55, sample: 'QC-2026-00055' },
  { id: 'pay', type: 'Payment Receipts', prefix: 'PAY', yearFormat: 'YYYY', separator: '-', padding: 5, currentNumber: 23, sample: 'PAY-2026-00023' }
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  initialTab = 'company',
  onTabChange
}) => {
  const {
    activeCompany,
    updateCompany,
    companyBranches,
    createBranch,
    auditLogs
  } = useERP();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    if (initialTab && initialTab !== 'database' as any) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabClick = (tab: SettingsTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Company Profile Form
  const [compForm, setCompForm] = useState({
    name: activeCompany.name || '',
    code: activeCompany.code || 'PLNT',
    industry: activeCompany.industry || 'Precision Engineering & CNC Machining',
    gstin: activeCompany.gstin || '',
    pan: activeCompany.pan || '',
    udyamNo: 'UDYAM-MH-26-0038921',
    cin: 'U29299MH2020PTC192834',
    address: activeCompany.address || '',
    city: activeCompany.city || 'Pune',
    state: activeCompany.state || 'Maharashtra',
    stateCode: activeCompany.stateCode || '27',
    pincode: activeCompany.pincode || '411001',
    phone: activeCompany.phone || '+91 20 0000 0000',
    email: activeCompany.email || 'billing@company.com',
    currency: activeCompany.currency || 'INR'
  });

  const [isSavingComp, setIsSavingComp] = useState(false);
  const [compFeedback, setCompFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    setCompForm(prev => ({
      ...prev,
      name: activeCompany.name || '',
      code: activeCompany.code || 'PLNT',
      industry: activeCompany.industry || 'Precision Engineering & CNC Machining',
      gstin: activeCompany.gstin || '',
      pan: activeCompany.pan || '',
      address: activeCompany.address || '',
      city: activeCompany.city || 'Pune',
      state: activeCompany.state || 'Maharashtra',
      stateCode: activeCompany.stateCode || '27',
      pincode: activeCompany.pincode || '411001',
      phone: activeCompany.phone || '+91 20 0000 0000',
      email: activeCompany.email || 'billing@company.com',
      currency: activeCompany.currency || 'INR'
    }));
  }, [activeCompany]);

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    let stateCode = compForm.stateCode;
    let stateName = compForm.state;
    let pan = compForm.pan;

    if (clean.length >= 2) {
      const code = clean.slice(0, 2);
      const matched = INDIAN_STATES.find(s => s.code === code);
      if (matched) {
        stateCode = matched.code;
        stateName = matched.name;
      }
    }
    if (clean.length >= 12) {
      pan = clean.slice(2, 12);
    }

    setCompForm(prev => ({
      ...prev,
      gstin: clean,
      stateCode,
      state: stateName,
      pan
    }));
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompFeedback(null);

    if (!compForm.name.trim()) {
      setCompFeedback({ type: 'error', msg: 'Company legal name is required.' });
      return;
    }
    if (compForm.gstin.trim() && compForm.gstin.trim().length !== 15) {
      setCompFeedback({ type: 'error', msg: 'GSTIN must be exactly 15 characters.' });
      return;
    }

    setIsSavingComp(true);
    try {
      await updateCompany(activeCompany.id, {
        name: compForm.name.trim(),
        code: compForm.code.trim().toUpperCase(),
        industry: compForm.industry,
        gstin: compForm.gstin.trim().toUpperCase(),
        pan: compForm.pan.trim().toUpperCase(),
        address: compForm.address.trim(),
        city: compForm.city.trim(),
        state: compForm.state.trim(),
        stateCode: compForm.stateCode.trim(),
        pincode: compForm.pincode.trim(),
        phone: compForm.phone.trim(),
        email: compForm.email.trim(),
        currency: compForm.currency
      });

      setCompFeedback({
        type: 'success',
        msg: 'Company profile updated successfully.'
      });
      setTimeout(() => setCompFeedback(null), 3000);
    } catch (err: any) {
      setCompFeedback({
        type: 'error',
        msg: err.message || 'Failed to save changes.'
      });
    } finally {
      setIsSavingComp(false);
    }
  };

  // Branch Facilities Modal & State
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchCity, setNewBranchCity] = useState(activeCompany.city || 'Pune');
  const [newBranchState, setNewBranchState] = useState(activeCompany.state || 'Maharashtra');
  const [isMainBranch, setIsMainBranch] = useState(false);
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const [branchFeedback, setBranchFeedback] = useState<string | null>(null);

  const handleCreateBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCode.trim()) return;
    setIsSubmittingBranch(true);
    try {
      await createBranch({
        name: newBranchName.trim(),
        code: newBranchCode.trim().toUpperCase(),
        city: newBranchCity.trim(),
        state: newBranchState.trim(),
        isMain: isMainBranch
      });
      setBranchFeedback(`Facility "${newBranchName}" added successfully.`);
      setIsAddBranchModalOpen(false);
      setNewBranchName('');
      setNewBranchCode('');
      setTimeout(() => setBranchFeedback(null), 3000);
    } catch (err: any) {
      console.warn('Branch error', err);
    } finally {
      setIsSubmittingBranch(false);
    }
  };

  // Document Sequences
  const [sequences, setSequences] = useState<DocumentSequenceConfig[]>(() => {
    const saved = localStorage.getItem('marketoo_doc_sequences');
    return saved ? JSON.parse(saved) : DEFAULT_SEQUENCES;
  });
  const [seqFeedback, setSeqFeedback] = useState<string | null>(null);

  const handlePrefixChange = (id: string, newPrefix: string) => {
    const cleanPrefix = newPrefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setSequences(prev =>
      prev.map(seq => {
        if (seq.id === id) {
          const sample = `${cleanPrefix}${seq.separator}2026${seq.separator}${String(seq.currentNumber).padStart(seq.padding, '0')}`;
          return { ...seq, prefix: cleanPrefix, sample };
        }
        return seq;
      })
    );
  };

  const handleSaveSequences = () => {
    localStorage.setItem('marketoo_doc_sequences', JSON.stringify(sequences));
    setSeqFeedback('Sequences saved successfully.');
    setTimeout(() => setSeqFeedback(null), 2500);
  };

  // Audit Logs
  const [auditFilter, setAuditFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesAction = auditFilter === 'ALL' || log.action === auditFilter;
    const matchesSearch =
      auditSearch === '' ||
      log.entityName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* ── CLEAN TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage company profile, facilities, modules, user permissions, and document numbering.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md font-semibold">
            {compForm.code} · {compForm.name}
          </span>
        </div>
      </div>

      {/* ── CRISP MINIMAL TAB RAIL ── */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        {[
          { id: 'company', label: 'Company Profile', icon: Building2 },
          { id: 'branches', label: 'Facilities', icon: MapPin },
          { id: 'modules', label: 'Installed Modules', icon: Layers },
          { id: 'users', label: 'Team & Permissions', icon: Users },
          { id: 'sequences', label: 'Document Numbering', icon: Hash },
          { id: 'audit', label: 'Audit Log', icon: FileCheck }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id as SettingsTab)}
              className={`
                pb-2.5 px-3 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap
                ${isActive
                  ? 'border-[#0057d2] text-[#0057d2]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: COMPANY PROFILE                                                */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          {compFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                compFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {compFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{compFeedback.msg}</span>
            </div>
          )}

          <form onSubmit={handleSaveCompany} className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100 shadow-2xs">
            {/* Section 1: General Details */}
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Company Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Company Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={compForm.name}
                    onChange={e => setCompForm({ ...compForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Short Plant Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={compForm.code}
                    onChange={e => setCompForm({ ...compForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Manufacturing Sector
                  </label>
                  <select
                    value={compForm.industry}
                    onChange={e => setCompForm({ ...compForm, industry: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  >
                    {MANUFACTURING_SECTORS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Statutory & Tax Identifiers */}
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Statutory Identifiers
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AAACA1234A1Z5"
                    value={compForm.gstin}
                    onChange={e => handleGstinChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Income Tax PAN
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="AAACA1234A"
                    value={compForm.pan}
                    onChange={e => setCompForm({ ...compForm, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    MSME Udyam Number
                  </label>
                  <input
                    type="text"
                    placeholder="UDYAM-MH-26-0000000"
                    value={compForm.udyamNo}
                    onChange={e => setCompForm({ ...compForm, udyamNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CIN Number
                  </label>
                  <input
                    type="text"
                    placeholder="U29299MH2020PTC192834"
                    value={compForm.cin}
                    onChange={e => setCompForm({ ...compForm, cin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Registered Address & Contact */}
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Address & Contact
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Registered Street Address
                  </label>
                  <input
                    type="text"
                    value={compForm.address}
                    onChange={e => setCompForm({ ...compForm, address: e.target.value })}
                    placeholder="Plot No. E-24, Phase 2, Chakan Industrial Area"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={compForm.city}
                    onChange={e => setCompForm({ ...compForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    value={compForm.state}
                    onChange={e => {
                      const matched = INDIAN_STATES.find(s => s.name === e.target.value);
                      setCompForm({
                        ...compForm,
                        state: e.target.value,
                        stateCode: matched?.code || '27'
                      });
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  >
                    {INDIAN_STATES.map(s => (
                      <option key={s.code} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={compForm.pincode}
                    onChange={e => setCompForm({ ...compForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Official Phone
                  </label>
                  <input
                    type="text"
                    value={compForm.phone}
                    onChange={e => setCompForm({ ...compForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={compForm.email}
                    onChange={e => setCompForm({ ...compForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 flex items-center justify-end rounded-b-lg">
              <button
                type="submit"
                disabled={isSavingComp}
                className="px-4 py-2 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingComp ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: FACILITIES                                                     */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Manufacturing & Warehouse Facilities
            </h3>

            <button
              type="button"
              onClick={() => setIsAddBranchModalOpen(true)}
              className="px-3 py-1.5 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Facility</span>
            </button>
          </div>

          {branchFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{branchFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Primary Main Plant Card */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#0057d2] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  MAIN
                </span>
                <span className="text-[11px] font-semibold text-emerald-600">
                  Main Facility
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-900">
                Main Plant
              </div>
              <div className="text-xs text-slate-500">
                {compForm.city}, {compForm.state}
              </div>
            </div>

            {/* Additional Branches */}
            {companyBranches.map((b: any) => (
              <div key={b.id} className="bg-white p-4 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {b.code || 'PLNT'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {b.isMain ? 'Main Facility' : 'Branch'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {b.name}
                </div>
                <div className="text-xs text-slate-500">
                  {b.city}, {b.state}
                </div>
              </div>
            ))}
          </div>

          {/* Add Branch Modal */}
          {isAddBranchModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-lg border border-slate-200 shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    Add Facility
                  </h3>
                  <button
                    onClick={() => setIsAddBranchModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateBranchSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Facility Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bhosari Plant 2"
                      value={newBranchName}
                      onChange={e => setNewBranchName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="BHS"
                        value={newBranchCode}
                        onChange={e => setNewBranchCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-1.5 text-xs font-mono uppercase bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newBranchCity}
                        onChange={e => setNewBranchCity(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddBranchModalOpen(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBranch}
                      className="px-3.5 py-1.5 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-semibold rounded-md cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingBranch ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: INSTALLED MODULES                                              */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'modules' && (
        <ModuleManagement />
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: TEAM & PERMISSIONS                                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <UserAccessManagement />
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: DOCUMENT SEQUENCES                                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'sequences' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Document Numbering Rules
            </h3>

            <button
              type="button"
              onClick={handleSaveSequences}
              className="px-3 py-1.5 bg-[#0057d2] hover:bg-[#0040b0] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules</span>
            </button>
          </div>

          {seqFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{seqFeedback}</span>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="p-3">Document</th>
                  <th className="p-3">Prefix</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Next Number Preview</th>
                  <th className="p-3 text-right">Reset Interval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sequences.map(seq => (
                  <tr key={seq.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">
                      {seq.type}
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        maxLength={8}
                        value={seq.prefix}
                        onChange={e => handlePrefixChange(seq.id, e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-mono uppercase bg-white border border-slate-200 rounded text-slate-900 focus:outline-none focus:border-[#0057d2]"
                      />
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">
                      {seq.prefix}-YYYY-#####
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-xs font-semibold text-[#0057d2] bg-blue-50 px-2 py-0.5 rounded">
                        {seq.sample}
                      </span>
                    </td>
                    <td className="p-3 text-right text-slate-500">
                      Annual
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* TAB 6: AUDIT LOG                                                      */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Activity & Audit Trail
            </h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:border-[#0057d2] w-44"
                />
              </div>

              <select
                value={auditFilter}
                onChange={e => setAuditFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-[#0057d2]"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
                <option value="PAYMENT">PAYMENT</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
            {filteredAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No events recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredAuditLogs.map(log => (
                  <div key={log.id} className="p-3 flex items-start justify-between gap-4 hover:bg-slate-50/50 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-900">{log.entityName}</span>
                        <span className="text-slate-600">{log.details}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        By: <span className="text-slate-600">{log.userName}</span>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
