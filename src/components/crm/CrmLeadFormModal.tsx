import React, { useState, useEffect } from 'react';
import {
  X, Building2, User, Target, Calendar, FileText,
  AlertTriangle, ShieldCheck, Check, Sparkles
} from 'lucide-react';
import { CrmLead, CrmLeadPriority, CrmLeadSource, CrmLeadStatus } from '../../types/erp';

interface CrmLeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CrmLead>) => Promise<void>;
  leadToEdit?: CrmLead | null;
  checkDuplicate?: (data: { phone?: string; email?: string; companyName?: string; excludeId?: string }) => Promise<{ hasDuplicates: boolean; duplicates: any[] }>;
  activeEmployees?: string[];
}

const SOURCES: { id: CrmLeadSource; label: string }[] = [
  { id: 'indiamart', label: 'IndiaMART Verified Buyer' },
  { id: 'justdial', label: 'JustDial Commercial Lead' },
  { id: 'trade_fair', label: 'Trade Fair / Expo (IMTEX / Auto Expo)' },
  { id: 'website', label: 'Website Contact Inquiry' },
  { id: 'referral', label: 'Customer / Vendor Referral' },
  { id: 'phone', label: 'Inbound Phone Call' },
  { id: 'email', label: 'Direct Email RFP' },
  { id: 'whatsapp', label: 'WhatsApp Direct Chat' },
  { id: 'meta_ads', label: 'Meta / Facebook Ads' },
  { id: 'google', label: 'Google Search Campaign' },
  { id: 'direct', label: 'Direct Walk-in / MIDC Plant Visit' },
  { id: 'other', label: 'Other Industrial Source' }
];

const INDUSTRIES = [
  'Automobile Component Manufacturing',
  'CNC Machining & Precision Turned Parts',
  'Sheet Metal Fabrication & Stamping',
  'Forging & Foundry',
  'Tool & Die / Mold Making',
  'Heavy Engineering & Plant Equipment',
  'Aerospace & Defense Subcontracting',
  'Electrical & Switchgear Components',
  'Pumps, Valves & Hydraulics',
  'General Industrial Manufacturing'
];

export const CrmLeadFormModal: React.FC<CrmLeadFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leadToEdit,
  checkDuplicate,
  activeEmployees = ['Sales Head', 'Pradeep Sharma (BDM)', 'Rajesh Patil (Sr Engineer)', 'Factory Admin']
}) => {
  const [activeSection, setActiveSection] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [gstinError, setGstinError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<CrmLead>>({
    companyName: '',
    website: '',
    industry: 'Automobile Component Manufacturing',
    companyType: 'Private Limited',
    gstin: '',
    companySize: '20-50 employees',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    address: '',
    pincode: '',
    contactName: '',
    designation: 'Purchase / Technical Manager',
    phone: '',
    alternatePhone: '',
    email: '',
    preferredContactMethod: 'phone',
    title: '',
    source: 'indiamart',
    sourceDetails: '',
    productInterest: '',
    requirementDescription: '',
    targetQuantity: 1000,
    dealValue: 150000,
    expectedClosingDate: '',
    priority: 'medium' as CrmLeadPriority,
    status: 'new' as CrmLeadStatus,
    assignedTo: activeEmployees[0],
    winProbability: 35,
    nextFollowupDate: '',
    nextFollowupTime: '11:00',
    nextFollowupType: 'call',
    nextFollowupNotes: '',
    internalNotes: '',
    consentGranted: true
  });

  useEffect(() => {
    if (leadToEdit) {
      setFormData({ ...leadToEdit });
    } else {
      // Defaults for new lead
      const defaultFollowup = new Date();
      defaultFollowup.setDate(defaultFollowup.getDate() + 2);

      setFormData({
        companyName: '',
        website: '',
        industry: 'Automobile Component Manufacturing',
        companyType: 'Private Limited',
        gstin: '',
        companySize: '20-50 employees',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        address: '',
        pincode: '',
        contactName: '',
        designation: 'Purchase / Technical Manager',
        phone: '',
        alternatePhone: '',
        email: '',
        preferredContactMethod: 'phone',
        title: '',
        source: 'indiamart',
        sourceDetails: '',
        productInterest: '',
        requirementDescription: '',
        targetQuantity: 1000,
        dealValue: 150000,
        expectedClosingDate: '',
        priority: 'medium',
        status: 'new',
        assignedTo: activeEmployees[0],
        winProbability: 35,
        nextFollowupDate: defaultFollowup.toISOString().split('T')[0],
        nextFollowupTime: '11:00',
        nextFollowupType: 'call',
        nextFollowupNotes: 'Initial requirement discussion and drawing review',
        internalNotes: '',
        consentGranted: true
      });
    }
    setActiveSection(1);
    setDuplicateWarning(null);
    setGstinError(null);
  }, [leadToEdit, isOpen]);

  // Real-time Duplicate Check
  useEffect(() => {
    if (!checkDuplicate || !isOpen) return;
    const timer = setTimeout(async () => {
      const phone = formData.phone?.trim();
      const email = formData.email?.trim();
      const company = formData.companyName?.trim();

      if (phone && phone.length >= 8) {
        try {
          const res = await checkDuplicate({
            phone,
            email,
            companyName: company,
            excludeId: leadToEdit?.id
          });
          if (res.hasDuplicates && res.duplicates.length > 0) {
            const first = res.duplicates[0];
            setDuplicateWarning(
              `⚠️ Potential duplicate: Found matching lead #${first.leadNumber || first.id} for "${first.companyName || first.contactName}" (${first.phone})`
            );
          } else {
            setDuplicateWarning(null);
          }
        } catch { }
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.phone, formData.email, formData.companyName, checkDuplicate, isOpen, leadToEdit]);

  // GSTIN Validation
  const validateGstin = (gst: string) => {
    if (!gst.trim()) {
      setGstinError(null);
      return true;
    }
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstinRegex.test(gst.trim().toUpperCase())) {
      setGstinError('Invalid GSTIN format (Expected 15 chars: 27AAAAA0000A1Z5)');
      return false;
    }
    setGstinError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName?.trim()) {
      setActiveSection(1);
      return alert('Company Name is required.');
    }
    if (!formData.contactName?.trim() || !formData.phone?.trim()) {
      setActiveSection(2);
      return alert('Contact Person and Mobile Number are required.');
    }
    if (formData.gstin && !validateGstin(formData.gstin)) {
      setActiveSection(1);
      return alert('Please correct the GSTIN number.');
    }

    setIsSubmitting(true);
    try {
      const finalTitle = formData.title?.trim() || `${formData.companyName} - ${formData.productInterest || 'Manufacturing Requirement'}`;
      await onSubmit({
        ...formData,
        title: finalTitle,
        dealValue: Number(formData.dealValue) || 0
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl sm:max-w-3xl w-full flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div>
            <div className="text-[10px] font-bold text-[#0c6cf2] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0c6cf2]" />
              {leadToEdit ? `Edit Lead · ${leadToEdit.leadNumber || leadToEdit.id}` : 'Codozent One · CRM Intake'}
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mt-0.5">
              {leadToEdit ? `Update Lead: ${leadToEdit.companyName}` : 'Register New Manufacturing Lead'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Duplicate Warning */}
        {duplicateWarning && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-800 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-medium">{duplicateWarning}</span>
          </div>
        )}

        {/* Section Tabs (Progressive Disclosure) */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-4 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 1, label: '1. Company', icon: Building2 },
            { id: 2, label: '2. Contact', icon: User },
            { id: 3, label: '3. Opportunity', icon: Target },
            { id: 4, label: '4. Follow-up', icon: Calendar },
            { id: 5, label: '5. Additional', icon: FileText }
          ].map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1.5 py-2 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${isActive
                  ? 'border-[#0c6cf2] text-[#0c6cf2] bg-white shadow-2xs font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/40'
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0c6cf2]' : 'text-slate-400'}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
          {/* SECTION 1: Company Information */}
          {activeSection === 1 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Company / Firm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bharat Forge Tier 2 Unit / Apex Auto"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Company Website / Profile
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.company.in"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Industry Sector
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full h-8 text-xs px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  >
                    {INDUSTRIES.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Company Constitution
                  </label>
                  <select
                    value={formData.companyType}
                    onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                    className="w-full h-8 text-xs px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  >
                    <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                    <option value="Proprietorship">Proprietorship Firm</option>
                    <option value="Partnership">Partnership Firm</option>
                    <option value="LLP">Limited Liability Partnership (LLP)</option>
                    <option value="Public Limited">Public Limited Ltd</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    GSTIN (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27AAAAA0000A1Z5"
                    value={formData.gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setFormData({ ...formData, gstin: val });
                      validateGstin(val);
                    }}
                    className={`w-full h-8 text-xs font-mono uppercase px-2.5 py-1 border rounded-md focus:outline-none transition-all ${gstinError ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20'
                      }`}
                  />
                  {gstinError && <span className="text-[10px] text-red-600 block mt-0.5">{gstinError}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Full Plant / Office Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot B-22, Phase II, Chakan MIDC"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    City / MIDC Zone
                  </label>
                  <input
                    type="text"
                    placeholder="Pune / Chakan / Bhosari"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="410501"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full h-8 text-xs font-mono px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Contact Information */}
          {activeSection === 2 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Contact Person Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Kulkarni"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Designation / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Purchase Head / Plant GM"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Mobile Number (Primary) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="9822012345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-8 text-xs font-mono px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Alternate Number / Landline
                  </label>
                  <input
                    type="tel"
                    placeholder="020 2712 3456"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    className="w-full h-8 text-xs font-mono px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="suresh@bharatforge.co.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Preferred Communication Channel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['phone', 'whatsapp', 'email', 'visit'] as const).map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setFormData({ ...formData, preferredContactMethod: ch })}
                      className={`h-7.5 py-1 px-2.5 text-xs font-medium rounded-md border text-center capitalize transition-colors cursor-pointer ${formData.preferredContactMethod === ch
                        ? 'bg-blue-50 border-[#0c6cf2] text-[#0c6cf2] font-semibold ring-1 ring-[#0c6cf2]/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {ch === 'phone' ? 'Phone Call' : ch === 'whatsapp' ? 'WhatsApp' : ch === 'email' ? 'Email RFQ' : 'Plant Visit'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Business Opportunity */}
          {activeSection === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Deal / Requirement Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5000 Pcs EN8 Precision Turned Shafts"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Inbound Lead Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as any })}
                    className="w-full h-8 text-xs px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  >
                    {SOURCES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Product / Part Interested In
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CNC Turned Bushes, Flanges, Bracket Assembly"
                    value={formData.productInterest}
                    onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Target Batch Quantity (Pcs)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={formData.targetQuantity}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: Number(e.target.value) })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] text-slate-800 font-mono transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Manufacturing Requirement Details & Drawing Specs
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Raw material EN19 hardening 45-50 HRC, tolerance +/- 0.02mm, surface finish Ra 0.8, sample required within 10 days."
                  value={formData.requirementDescription}
                  onChange={(e) => setFormData({ ...formData, requirementDescription: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Estimated Deal Value (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: Number(e.target.value) })}
                    className="w-full h-8 text-xs font-mono px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full h-8 text-xs px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">🔥 Urgent / Hot Deal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Assigned Salesperson
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full h-8 text-xs px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  >
                    {activeEmployees.map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: Follow-up Scheduling */}
          {activeSection === 4 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="p-2.5 bg-blue-50/50 border border-blue-200/80 rounded-md text-[11px] text-blue-900 flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#0c6cf2] shrink-0 mt-0.5" />
                <div>
                  <strong>Proactive Follow-up Automation:</strong> Indian manufacturing RFQs convert 4x higher when first follow-up is booked within 48 hours of intake.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextFollowupDate}
                    onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={formData.nextFollowupTime}
                    onChange={(e) => setFormData({ ...formData, nextFollowupTime: e.target.value })}
                    className="w-full h-8 text-xs px-2.5 py-1 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Follow-up Action Type
                  </label>
                  <select
                    value={formData.nextFollowupType}
                    onChange={(e) => setFormData({ ...formData, nextFollowupType: e.target.value as any })}
                    className="w-full h-8 text-xs px-2 border border-slate-300 rounded-md bg-white text-slate-800 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                  >
                    <option value="call">Phone Call Discussion</option>
                    <option value="meeting">In-Person MIDC Plant Meeting</option>
                    <option value="whatsapp">WhatsApp Quotation Check</option>
                    <option value="email">Email Technical Spec Follow-up</option>
                    <option value="other">Other Action</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Follow-up Notes / Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Call client to verify drawing revision and confirm target pricing before releasing formal quote draft."
                  value={formData.nextFollowupNotes}
                  onChange={(e) => setFormData({ ...formData, nextFollowupNotes: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* SECTION 5: Additional Information */}
          {activeSection === 5 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                  Confidential Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Recommended by Suresh from shop floor. Good payment track record. Potential 3-year recurring order."
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0c6cf2] focus:ring-1 focus:ring-[#0c6cf2]/20 transition-all"
                />
              </div>

              {/* DPDP Statutory Compliance */}
              <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-md flex items-start gap-2">
                <input
                  type="checkbox"
                  id="dpdpCheck"
                  checked={formData.consentGranted}
                  onChange={(e) => setFormData({ ...formData, consentGranted: e.target.checked })}
                  className="mt-0.5 accent-[#0c6cf2] cursor-pointer"
                />
                <label htmlFor="dpdpCheck" className="text-[11px] text-slate-600 leading-relaxed cursor-pointer">
                  <strong className="text-slate-800">Digital Personal Data Protection (DPDP) Act Compliance:</strong> Lead has provided commercial opt-in consent to receive manufacturing proposals, GST invoice estimates, and quotation notifications via WhatsApp and email.
                </label>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer with Step Controls */}
        <div className="px-5 py-2.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {activeSection > 1 && (
              <button
                type="button"
                onClick={() => setActiveSection(prev => prev - 1)}
                className="px-3 py-1.5 h-8 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              >
                Previous Section
              </button>
            )}
            {activeSection < 5 && (
              <button
                type="button"
                onClick={() => setActiveSection(prev => prev + 1)}
                className="px-3 py-1.5 h-8 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              >
                Next Section
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 h-8 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded-md border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-1.5 h-8 text-xs font-semibold text-white bg-[#0c6cf2] hover:bg-blue-600 rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Lead...' : leadToEdit ? 'Save Changes' : 'Save & Register Lead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
