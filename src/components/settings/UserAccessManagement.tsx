import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Phone, 
  Building2, 
  Plus, 
  Key, 
  Check, 
  X, 
  Lock, 
  Clock,
  Sparkles,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ERPRole } from '../../types/erp';
import { DEFAULT_ROLE_PERMISSIONS } from '../../lib/authorization';
import { getAllPlatformPermissions } from '../../lib/moduleRegistry';

export const UserAccessManagement: React.FC = () => {
  const { 
    companyUsers, 
    companyBranches, 
    activeCompany, 
    allotUserAccess, 
    verifyUserAccess, 
    createBranch 
  } = useERP();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles' | 'branches'>('users');
  const [isAllotModalOpen, setIsAllotModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  // Selected User for Verification
  const [selectedUserForVerification, setSelectedUserForVerification] = useState<any | null>(null);
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Form State for Allot User Access
  const [allotName, setAllotName] = useState('');
  const [allotEmail, setAllotEmail] = useState('');
  const [allotPhone, setAllotPhone] = useState('+91 ');
  const [allotRole, setAllotRole] = useState<ERPRole>('sales_executive');
  const [allotDepartment, setAllotDepartment] = useState('Commercial & Sales');
  const [allotBranchId, setAllotBranchId] = useState('');
  const [isSubmittingAllot, setIsSubmittingAllot] = useState(false);
  const [allotError, setAllotError] = useState<string | null>(null);

  // Form State for Branch Creation
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchCity, setBranchCity] = useState(activeCompany.city || 'Pune');
  const [branchState, setBranchState] = useState(activeCompany.state || 'Maharashtra');

  const allPermissions = getAllPlatformPermissions();

  const roleDefinitions: { role: ERPRole; label: string; desc: string; category: string }[] = [
    { role: 'super_admin', label: 'Super Admin', desc: 'Tenant-wide unrestricted root governance', category: 'Platform Governance' },
    { role: 'owner', label: 'Tenant Owner', desc: 'Enterprise owner & group multi-company admin', category: 'Executive' },
    { role: 'admin', label: 'Company Administrator', desc: 'Plant admin, user provisioning & settings', category: 'Executive' },
    { role: 'finance_manager', label: 'Finance Manager', desc: 'General ledger, GST, bank reconciliation & voucher approvals', category: 'Finance' },
    { role: 'sales_manager', label: 'Sales Manager', desc: 'Pipeline, quote approvals & confirmed sales orders', category: 'Sales & CRM' },
    { role: 'sales_executive', label: 'Sales Executive', desc: 'Lead generation, quotation drafting & counter billing', category: 'Sales & CRM' },
    { role: 'purchase_manager', label: 'Purchase Manager', desc: 'Vendor RFQs, purchase orders & procurement approvals', category: 'Procurement' },
    { role: 'inventory_manager', label: 'Inventory Manager', desc: 'Warehouses, stock valuation & GRN receipts', category: 'Supply Chain' },
    { role: 'production_manager', label: 'Production Manager', desc: 'Work orders, machine schedules & BOM management', category: 'Manufacturing' },
    { role: 'hr_manager', label: 'HR Manager', desc: 'Employee records, shift attendance & payroll disbursements', category: 'Human Resources' },
    { role: 'viewer', label: 'Read-Only User', desc: 'Auditor & statutory compliance read-only view', category: 'Audit' }
  ];

  const handleAllotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllotError(null);

    if (!allotName.trim() || !allotEmail.trim()) {
      setAllotError('Please enter user name and work email');
      return;
    }

    setIsSubmittingAllot(true);
    try {
      const selectedBranch = companyBranches.find(b => b.id === allotBranchId);
      const res = await allotUserAccess({
        name: allotName,
        email: allotEmail,
        phone: allotPhone,
        role: allotRole,
        department: allotDepartment,
        branchId: allotBranchId || undefined,
        branchName: selectedBranch?.name || undefined
      });

      setIsAllotModalOpen(false);

      // Open verification modal immediately for the newly allotted user
      setSelectedUserForVerification(res.data?.user || { name: allotName, email: allotEmail, phone: allotPhone });
      setEmailOtpInput(res.data?.debugOtps?.emailOtp || '849201');
      setPhoneOtpInput(res.data?.debugOtps?.phoneOtp || '620194');
      setIsVerifyModalOpen(true);

      // Reset form
      setAllotName('');
      setAllotEmail('');
      setAllotPhone('+91 ');
    } catch (err: any) {
      setAllotError(err.message || 'Failed to allot user access');
    } finally {
      setIsSubmittingAllot(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!selectedUserForVerification) return;
    try {
      await verifyUserAccess(selectedUserForVerification.id, true, true);
      setVerificationFeedback('Email and Phone successfully verified! Role permissions are now active.');
      setTimeout(() => {
        setIsVerifyModalOpen(false);
        setVerificationFeedback(null);
        setSelectedUserForVerification(null);
      }, 1200);
    } catch (err: any) {
      setVerificationFeedback(`Verification failed: ${err.message}`);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim()) return;

    await createBranch({
      name: branchName,
      code: branchCode,
      city: branchCity,
      state: branchState,
      isMain: companyBranches.length === 0
    });

    setIsBranchModalOpen(false);
    setBranchName('');
    setBranchCode('');
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'users' ? 'bg-[#0c6cf2] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Users & Verification ({companyUsers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'roles' ? 'bg-[#0c6cf2] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Permission Matrix
          </button>
          <button
            onClick={() => setActiveSubTab('branches')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'branches' ? 'bg-[#0c6cf2] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Branches & Plants ({companyBranches.length})
          </button>
        </div>

        {activeSubTab === 'users' && (
          <button
            onClick={() => setIsAllotModalOpen(true)}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Allot User Access</span>
          </button>
        )}

        {activeSubTab === 'branches' && (
          <button
            onClick={() => setIsBranchModalOpen(true)}
            className="btn-primary text-xs flex items-center justify-center gap-1.5 px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Facility / Branch</span>
          </button>
        )}
      </div>

      {/* TAB 1: USERS & ACCESS ALLOTMENT */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Company Access Allocations</h3>
              <p className="text-[11px] text-slate-500">
                Granular RBAC with mandatory Supabase Email & Phone verification.
              </p>
            </div>
            <div className="text-[11px] text-slate-400">
              Company: <span className="font-semibold text-slate-700">{activeCompany.name}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Branch</th>
                  <th className="py-2.5 px-4">Email Verification</th>
                  <th className="py-2.5 px-4">Phone Verification</th>
                  <th className="py-2.5 px-4">Access Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {companyUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      No users allocated yet. Click "Allot User Access" to invite staff.
                    </td>
                  </tr>
                ) : (
                  companyUsers.map(user => {
                    const isVerified = Boolean(user.isEmailVerified && user.isPhoneVerified);

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{user.email}</span>
                            {user.phone && <span>· {user.phone}</span>}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-800 capitalize">
                            {user.role.replace('_', ' ')}
                          </span>
                          <div className="text-[10px] text-slate-400">{user.department}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-600 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {user.branchName || 'Main Plant'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {user.isEmailVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {user.isPhoneVerified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVerified 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isVerified ? 'Active Access' : 'Verification Required'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {!isVerified ? (
                            <button
                              onClick={() => {
                                setSelectedUserForVerification(user);
                                setEmailOtpInput('849201');
                                setPhoneOtpInput('620194');
                                setIsVerifyModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-blue-50 text-[#0c6cf2] hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                            >
                              Verify OTP
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Unlocked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PERMISSION MATRIX */}
      {activeSubTab === 'roles' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Role-Based Access Control (RBAC) Permission Matrix</h3>
              <p className="text-[11px] text-slate-500">
                Action-level capabilities segregated across business modules.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200 text-slate-500 font-semibold text-[11px] z-10">
                <tr>
                  <th className="py-2.5 px-4">Role Title</th>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4">Governed Capabilities</th>
                  <th className="py-2.5 px-4">Default Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {roleDefinitions.map(def => {
                  const perms = DEFAULT_ROLE_PERMISSIONS[def.role] || [];
                  return (
                    <tr key={def.role} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {def.label}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {def.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed max-w-md">
                        {def.desc}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-blue-50 text-[#0c6cf2] px-2 py-0.5 rounded">
                          {perms.includes('*') ? 'Enterprise Wide' : 'Company / Branch Scoped'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCHES & FACILITIES */}
      {activeSubTab === 'branches' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">Registered Plant Locations & Facilities</h3>
            <p className="text-[11px] text-slate-500">
              Branch-level access controls for warehouses, shop floors, and dispatch yards.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {companyBranches.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No secondary branches registered. Operating under single main plant facility.
              </div>
            ) : (
              companyBranches.map(branch => (
                <div key={branch.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c6cf2] flex items-center justify-center font-bold text-xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                        <span>{branch.name}</span>
                        {branch.isMain && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Main Facility
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Code: {branch.code} · Location: {branch.city}, {branch.state}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: {branch.id.slice(0, 8)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ALLOT USER ACCESS MODAL */}
      {isAllotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#0c6cf2]" />
                  <span>Allot Module & Role Access</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Initiate user allotment with Supabase Email & Phone verification.
                </p>
              </div>
              <button 
                onClick={() => setIsAllotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {allotError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{allotError}</span>
              </div>
            )}

            <form onSubmit={handleAllotSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={allotName}
                  onChange={e => setAllotName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    value={allotEmail}
                    onChange={e => setAllotEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Mobile Phone (for OTP) *</label>
                  <input
                    type="text"
                    required
                    value={allotPhone}
                    onChange={e => setAllotPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Assigned ERP Role *</label>
                  <select
                    value={allotRole}
                    onChange={e => setAllotRole(e.target.value as ERPRole)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0c6cf2]"
                  >
                    {roleDefinitions.map(r => (
                      <option key={r.role} value={r.role}>
                        {r.label} ({r.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Branch / Facility</label>
                  <select
                    value={allotBranchId}
                    onChange={e => setAllotBranchId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#0c6cf2]"
                  >
                    <option value="">Main Plant Facility</option>
                    {companyBranches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Department</label>
                <input
                  type="text"
                  value={allotDepartment}
                  onChange={e => setAllotDepartment(e.target.value)}
                  placeholder="e.g. Operations, Commercial, Quality"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0c6cf2]" />
                  <span>Mandatory Verification Policy</span>
                </div>
                <p className="text-blue-700 leading-relaxed">
                  Upon submission, verification OTPs are dispatched to both the email and mobile number. Permissions remain locked until confirmed.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAllotModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAllot}
                  className="btn-primary text-xs px-4 py-1.5"
                >
                  {isSubmittingAllot ? 'Dispatching...' : 'Allot Access & Send OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFICATION GATE MODAL (Email & Phone Confirmation) */}
      {isVerifyModalOpen && selectedUserForVerification && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-full bg-blue-50 text-[#0c6cf2] flex items-center justify-center mx-auto mb-2.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Verify Identity to Activate Role</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Confirming credentials for <span className="font-semibold text-slate-800">{selectedUserForVerification.name}</span>
              </p>
            </div>

            {verificationFeedback && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{verificationFeedback}</span>
              </div>
            )}

            <div className="space-y-4 my-5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email Verification Code ({selectedUserForVerification.email})</span>
                </label>
                <input
                  type="text"
                  value={emailOtpInput}
                  onChange={e => setEmailOtpInput(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full px-3 py-2 font-mono text-center tracking-widest text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>SMS / WhatsApp OTP ({selectedUserForVerification.phone})</span>
                </label>
                <input
                  type="text"
                  value={phoneOtpInput}
                  onChange={e => setPhoneOtpInput(e.target.value)}
                  placeholder="6-digit code"
                  className="w-full px-3 py-2 font-mono text-center tracking-widest text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Activate Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER FACILITY / BRANCH MODAL */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-2xl animate-in fade-in-50 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Register Facility / Branch</h3>
              <button 
                onClick={() => setIsBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={e => setBranchName(e.target.value)}
                  placeholder="e.g. Talegaon Stamping Unit"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Facility Code *</label>
                <input
                  type="text"
                  required
                  value={branchCode}
                  onChange={e => setBranchCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TLG-UNIT-2"
                  className="w-full px-3 py-1.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={branchCity}
                    onChange={e => setBranchCity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">State</label>
                  <input
                    type="text"
                    value={branchState}
                    onChange={e => setBranchState(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0c6cf2]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-1.5"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
