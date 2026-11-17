import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Company,
  CompanyUser,
  Item,
  Warehouse,
  Customer,
  Supplier,
  BillOfMaterials,
  SalesOrder,
  PurchaseOrder,
  GoodsReceiptNote,
  WorkOrder,
  ProductionEntry,
  QualityInspection,
  StockTransaction,
  Invoice,
  Payment,
  ChartOfAccount,
  DeliveryChallan,
  ERPRole,
  MRPRequirement,
  AuditLog,
  Quotation,
  QuotationStatus,
  CrmLead,
  CrmLeadActivity,
  CrmLeadFollowup,
  CrmLeadDocument,
  WorkProject,
  WorkTask,
  KhataEntry,
  GstSummary,
  Gst2BMatchRecord,
  CADeskQuery,
  CounterSale,
  HrmsEmployee,
  HrmsAttendanceRecord,
  HrmsPayrollItem,
  SupportTicket,
  AiAssistantMessage,
  WorkCenter,
  RFQ,
  RFQQuote,
  RoutingStage,
  PurchaseRequisition,
  PurchaseRequisitionStatus,
  VendorQuotation,
  PurchaseBill,
  SalesOrderStatus,
  PurchaseOrderStatus
} from '../types/erp';
import { supabase, isSupabaseConfigured, getIsSupabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';
import { evaluateAccess, isUserVerified } from '../lib/authorization';

const EMPTY_COMPANY: Company = {
  id: 'comp-main',
  name: 'Codozent One Plant',
  code: 'HOM',
  gstin: '27AAACH0000A1Z5',
  pan: 'AAACH0000A',
  address: 'MIDC Industrial Area',
  city: 'Pune',
  state: 'Maharashtra',
  stateCode: '27',
  pincode: '410501',
  phone: '+91 20 0000 0000',
  email: 'admin@plant.in',
  currency: 'INR',
  industry: 'Precision Engineering & Manufacturing'
};

const EMPTY_USER: CompanyUser = {
  id: '',
  companyId: '',
  name: 'Plant Administrator',
  email: '',
  role: 'owner',
  department: 'Operations',
  isActive: true
};

interface ERPContextType {
  // Tenancy & RBAC
  companies: Company[];
  activeCompany: Company;
  setActiveCompanyId: (id: string) => void;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  currentUser: CompanyUser;
  currentRole: ERPRole;
  setCurrentRole: (role: ERPRole) => void;
  canAccess: (module: string) => boolean;

  // Master Data
  items: Item[];
  warehouses: Warehouse[];
  customers: Customer[];
  suppliers: Supplier[];
  boms: BillOfMaterials[];
  createCustomer: (c: Omit<Customer, 'id' | 'companyId' | 'customerCode'>) => Promise<Customer>;
  createSupplier: (s: Omit<Supplier, 'id' | 'companyId' | 'supplierCode'>) => Promise<Supplier>;
  createItem: (i: Omit<Item, 'id' | 'companyId' | 'itemCode'>) => Promise<Item>;
  createBOM: (b: Omit<BillOfMaterials, 'id' | 'companyId' | 'bomNumber' | 'createdAt'>) => Promise<BillOfMaterials>;

  // Transactional Data
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  purchaseRequisitions: PurchaseRequisition[];
  vendorQuotations: VendorQuotation[];
  purchaseBills: PurchaseBill[];
  grns: GoodsReceiptNote[];
  workOrders: WorkOrder[];
  productionEntries: ProductionEntry[];
  qualityInspections: QualityInspection[];
  stockTransactions: StockTransaction[];
  invoices: Invoice[];
  payments: Payment[];
  deliveryChallans: DeliveryChallan[];
  chartOfAccounts: ChartOfAccount[];
  auditLogs: AuditLog[];

  // Business Action Methods
  createSalesOrder: (so: any) => Promise<SalesOrder>;
  updateSalesOrderStatus: (id: string, status: SalesOrder['status'], reason?: string) => Promise<void> | void;
  cancelSalesOrder: (id: string, reason: string) => Promise<SalesOrder>;
  createDeliveryChallan: (salesOrderId: string, transporter: string, vehicleNo: string, eWayBill: string) => Promise<DeliveryChallan> | DeliveryChallan;
  createSalesInvoiceFromOrder: (salesOrderId: string) => Promise<Invoice> | Invoice;

  createPurchaseOrder: (po: any) => Promise<PurchaseOrder>;
  updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status'], reason?: string) => Promise<void> | void;
  cancelPurchaseOrder: (id: string, reason: string) => Promise<PurchaseOrder>;
  createPurchaseRequisition: (pr: any) => Promise<PurchaseRequisition>;
  updatePurchaseRequisitionStatus: (id: string, status: PurchaseRequisitionStatus, remarks?: string) => Promise<PurchaseRequisition>;
  createVendorQuotation: (vq: any) => Promise<VendorQuotation>;
  createPurchaseBill: (bill: any) => Promise<PurchaseBill>;
  createGRN: (poId: string, supplierInvoiceNo: string, warehouseId: string, items: { itemId: string; receivedQty: number; batchNo: string; acceptedQuantity?: number; rejectedQuantity?: number; rejectionReason?: string }[]) => Promise<GoodsReceiptNote> | GoodsReceiptNote;

  createWorkOrder: (productId: string, bomId: string, quantity: number, priority: 'low' | 'normal' | 'urgent', dueDate: string, salesOrderId?: string) => Promise<WorkOrder> | WorkOrder;
  startWorkOrder: (workOrderId: string) => { success: boolean; message: string };
  recordProductionOutput: (workOrderId: string, station: string, goodQty: number, rejectedQty: number, reworkQty: number, rejectionReason?: string) => void | Promise<void>;

  createQualityInspection: (refType: 'work_order' | 'grn', refId: string, itemId: string, status: 'passed' | 'failed' | 'conditional_pass', sampleSize: number, checkpoints: any[], rootCause?: string) => Promise<QualityInspection> | QualityInspection;

  adjustStock: (itemId: string, warehouseId: string, quantityChange: number, reason: string) => void | Promise<void>;
  recordPayment: (type: 'customer_receipt' | 'supplier_payment', partnerId: string, partnerName: string, amount: number, mode: string, refNo: string, invoiceId?: string) => Promise<Payment> | Payment;

  // MRP Engine
  calculateMRP: () => MRPRequirement[];
  generatePOsFromMRP: (shortages: MRPRequirement[]) => number;

  // Supabase State
  isCloudConnected: boolean;
  syncWithSupabase: () => Promise<void>;
  resetToDemoData: () => void;

  // Authentication & Session Management
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; companyName: string; gstin?: string; city?: string; role?: string }) => Promise<{ success: boolean; error?: string }>;
  onboard: (data: any) => Promise<{ success: boolean; error?: string }>;
  pendingGoogleProfile: { email: string; name: string; avatarUrl?: string } | null;
  clearPendingGoogleProfile: () => void;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  selectCompany: (companyId: string) => Promise<void>;
  createCompany: (companyData: Partial<Company>) => Promise<Company>;
  logout: () => void | Promise<void>;

  // --- Codozent One CRM Engine ---
  leads: CrmLead[];
  crmFollowups: CrmLeadFollowup[];
  createLead: (lead: Partial<CrmLead>) => Promise<CrmLead>;
  updateLead: (id: string, updates: Partial<CrmLead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  checkLeadDuplicate: (data: { phone?: string; email?: string; companyName?: string; excludeId?: string }) => Promise<{ hasDuplicates: boolean; duplicates: any[] }>;
  createLeadFollowup: (followup: Partial<CrmLeadFollowup>) => Promise<CrmLeadFollowup>;
  updateLeadFollowup: (id: string, updates: Partial<CrmLeadFollowup>) => Promise<void>;
  addLeadActivity: (leadId: string, activity: Partial<CrmLeadActivity>) => Promise<void>;
  convertLeadToQuotationDraft: (leadId: string) => Promise<{ quotation: Quotation; customer: any; lead: CrmLead } | null>;
  importLeadsBatch: (rows: any[], skipDuplicates?: boolean) => Promise<any>;
  refreshCrm: () => Promise<void>;

  // Master SOP Manufacturing & Purchase Extensions
  workCenters: WorkCenter[];
  createWorkCenter: (wc: Omit<WorkCenter, 'id' | 'companyId'>) => Promise<WorkCenter>;
  updateWorkCenter: (id: string, updates: Partial<WorkCenter>) => Promise<WorkCenter>;
  deleteWorkCenter: (id: string) => Promise<void>;

  rfqs: RFQ[];
  createRFQ: (rfq: { items: any[]; targetDeliveryDate?: string; notes?: string }) => Promise<RFQ>;
  addQuoteToRFQ: (rfqId: string, quote: Omit<RFQQuote, 'id' | 'receivedAt'>) => Promise<RFQ>;
  awardRFQ: (rfqId: string, quoteId: string) => Promise<{ rfq: RFQ; po: PurchaseOrder }>;

  raiseProforma: (salesOrderId: string, advancePercentage?: number) => Promise<SalesOrder>;
  recordAdvancePayment: (salesOrderId: string, amount: number, paymentMode: string, utrRef: string) => Promise<SalesOrder>;
  getWhatToBuy: () => Promise<any[]>;

  projects: WorkProject[];
  createProject: (project: Omit<WorkProject, 'id' | 'companyId' | 'progressPercentage'>) => Promise<WorkProject>;
  tasks: WorkTask[];
  createTask: (task: Omit<WorkTask, 'id' | 'companyId' | 'loggedHours'>) => Promise<WorkTask>;
  updateTask: (id: string, updates: Partial<WorkTask>) => Promise<void>;

  quotations: Quotation[];
  createQuotation: (quo: any) => Promise<Quotation>;
  updateQuotation: (id: string, updates: any) => Promise<Quotation>;
  createQuotationRevision: (id: string, reason: string, updates?: any) => Promise<Quotation>;
  updateQuotationStatus: (id: string, status: QuotationStatus, metadata?: any) => Promise<Quotation>;
  approveQuotation: (id: string, comments?: string) => Promise<Quotation>;
  rejectQuotation: (id: string, reason?: string) => Promise<Quotation>;
  sendQuotation: (id: string, sentVia?: 'email' | 'whatsapp' | 'manual', comments?: string) => Promise<Quotation>;
  recordCustomerResponse: (id: string, response: 'accepted' | 'rejected' | 'revision_requested', reason?: string, comments?: string) => Promise<Quotation>;
  duplicateQuotation: (id: string) => Promise<Quotation>;
  convertQuotationToOrder: (quotationId: string) => Promise<SalesOrder>;
  addQuotationAttachment: (quotationId: string, attachment: any) => Promise<any>;
  deleteQuotation: (id: string) => Promise<void>;
  refreshQuotations: () => Promise<void>;

  khataEntries: KhataEntry[];
  createKhataEntry: (entry: Omit<KhataEntry, 'id' | 'companyId' | 'entryDate'>) => Promise<KhataEntry>;
  sendKhataWhatsApp: (id: string) => Promise<{ success: boolean; message: string }>;

  gstSummary: GstSummary | null;
  gst2bRecords: Gst2BMatchRecord[];
  update2BAction: (id: string, action: 'claim' | 'hold' | 'reverse') => Promise<void>;

  caQueries: CADeskQuery[];
  createCAQuery: (query: Omit<CADeskQuery, 'id' | 'companyId' | 'status' | 'createdAt'>) => Promise<CADeskQuery>;
  answerCAQuery: (id: string, response: string) => Promise<void>;
  msmeScrutiny: any[];
  scheduleIII: any | null;

  counterSales: CounterSale[];
  checkoutCounter: (sale: any) => Promise<CounterSale>;

  employees: HrmsEmployee[];
  createEmployee: (emp: Omit<HrmsEmployee, 'id' | 'companyId' | 'employeeCode' | 'status' | 'joiningDate'>) => Promise<HrmsEmployee>;
  attendance: HrmsAttendanceRecord[];
  recordAttendance: (att: Omit<HrmsAttendanceRecord, 'id' | 'companyId'>) => Promise<void>;
  payrolls: HrmsPayrollItem[];
  runPayroll: (month?: string) => Promise<void>;

  supportTickets: SupportTicket[];
  createSupportTicket: (ticket: any) => Promise<SupportTicket>;
  replySupportTicket: (id: string, message: string) => Promise<void>;
  updateTicketStatus: (id: string, status: string) => Promise<void>;

  askAssistant: (query: string) => Promise<{ reply: string; actionSuggested?: any }>;

  // Marketplace & Module Management
  installedModules: string[];
  installModule: (moduleId: string) => Promise<void>;
  uninstallModule: (moduleId: string) => Promise<void>;
  isModuleInstalled: (moduleId: string) => boolean;
  resetModulesToDefault: () => void;

  // Enterprise Access, RBAC & Multi-Branch
  companyUsers: CompanyUser[];
  companyBranches: any[];
  loadAccessData: () => Promise<void>;
  allotUserAccess: (data: any) => Promise<any>;
  verifyUserAccess: (userId: string, emailVerified?: boolean, phoneVerified?: boolean) => Promise<any>;
  createBranch: (data: any) => Promise<any>;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Session State
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('factoryflow_token'));
  const [currentUser, setCurrentUser] = useState<CompanyUser>(() => {
    const saved = localStorage.getItem('factoryflow_user');
    return saved ? JSON.parse(saved) : EMPTY_USER;
  });
  const [currentRole, setCurrentRole] = useState<ERPRole>(() => {
    const saved = localStorage.getItem('factoryflow_user');
    return saved ? JSON.parse(saved).role : 'owner';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('factoryflow_token');
  });
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<{ email: string; name: string; avatarUrl?: string } | null>(null);

  const isLoggingOutRef = useRef(false);
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const clearPendingGoogleProfile = () => {
    setPendingGoogleProfile(null);
  };

  // Multi-Company State (Strictly filtered by current user's authorized company associations)
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('ff_companies');
    const parsed: Company[] = saved ? JSON.parse(saved) : [];
    const savedUser = localStorage.getItem('factoryflow_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u.companyId) {
          const allowedIds = new Set([u.companyId, ...(u.companyIds || [])]);
          const filtered = parsed.filter(c => allowedIds.has(c.id));
          if (filtered.length > 0) return filtered;
        }
      } catch {}
    }
    return parsed;
  });
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    return localStorage.getItem('ff_active_comp') || '';
  });

  const activeCompany = companies.find(c => c.id === activeCompanyId) || companies[0] || EMPTY_COMPANY;

  useEffect(() => {
    if (activeCompanyId) {
      localStorage.setItem('ff_active_comp', activeCompanyId);
    }
  }, [activeCompanyId]);

  // Sync session & authorized company roster from backend on boot
  useEffect(() => {
    const token = localStorage.getItem('factoryflow_token');
    if (!token) return;

    api.setToken(token);
    api.auth.getMe().then(res => {
      if (res) {
        if (res.user) {
          setCurrentUser(res.user);
          setCurrentRole(res.user.role as ERPRole);
          localStorage.setItem('factoryflow_user', JSON.stringify(res.user));
        }
        if (res.companies && res.companies.length > 0) {
          setCompanies(res.companies);
          localStorage.setItem('ff_companies', JSON.stringify(res.companies));
        }
        if (res.activeCompany) {
          setActiveCompanyId(res.activeCompany.id);
        } else if (res.user?.companyId) {
          setActiveCompanyId(res.user.companyId);
        }
      }
    }).catch(err => {
      console.warn('[Session Verification Notice]', err);
    });
  }, []);

  // Marketplace & Installed Modules (Persistent per company)
  const DEFAULT_MODULE_IDS = [
    'dashboard',
    'crm',
    'quotations',
    'sales',
    'purchase',
    'inventory',
    'manufacturing',
    'work',
    'finance',
    'khatabook',
    'gst',
    'cadesk',
    'hrms',
    'reports',
    'assistant',
    'marketplace',
    'settings',
  ];

  const [installedModules, setInstalledModules] = useState<string[]>(() => {
    try {
      const savedKey = activeCompanyId ? `Codozent One_modules_${activeCompanyId}` : 'Codozent One_modules_default';
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_MODULE_IDS;
  });

  useEffect(() => {
    if (!activeCompanyId) return;
    const key = `Codozent One_modules_${activeCompanyId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInstalledModules(parsed);
          return;
        }
      } catch { }
    }
    localStorage.setItem(key, JSON.stringify(DEFAULT_MODULE_IDS));
    setInstalledModules(DEFAULT_MODULE_IDS);

    // Also sync from backend
    api.modules.list(activeCompanyId).then(mods => {
      if (Array.isArray(mods) && mods.length > 0) {
        const activeIds = mods.filter(m => m.status === 'enabled').map(m => m.manifest?.id || m.moduleId);
        if (activeIds.length > 0) {
          setInstalledModules(activeIds);
          localStorage.setItem(key, JSON.stringify(activeIds));
        }
      }
    }).catch(() => { });
  }, [activeCompanyId]);

  const installModule = async (moduleId: string) => {
    setInstalledModules(prev => {
      if (prev.includes(moduleId)) return prev;
      const next = [...prev, moduleId];
      const key = activeCompanyId ? `Codozent One_modules_${activeCompanyId}` : 'Codozent One_modules_default';
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
    try {
      if (activeCompanyId) {
        await api.modules.enable(activeCompanyId, moduleId);
      }
    } catch { }
  };

  const uninstallModule = async (moduleId: string) => {
    if (moduleId === 'dashboard' || moduleId === 'marketplace' || moduleId === 'settings') return;
    setInstalledModules(prev => {
      const next = prev.filter(m => m !== moduleId);
      const key = activeCompanyId ? `Codozent One_modules_${activeCompanyId}` : 'Codozent One_modules_default';
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
    try {
      if (activeCompanyId) {
        await api.modules.disable(activeCompanyId, moduleId);
      }
    } catch { }
  };

  const isModuleInstalled = (moduleId: string) => {
    if (moduleId === 'dashboard' || moduleId === 'marketplace' || moduleId === 'settings') return true;
    return installedModules.includes(moduleId);
  };

  const resetModulesToDefault = () => {
    setInstalledModules(DEFAULT_MODULE_IDS);
    const key = activeCompanyId ? `Codozent One_modules_${activeCompanyId}` : 'Codozent One_modules_default';
    localStorage.setItem(key, JSON.stringify(DEFAULT_MODULE_IDS));
  };

  // Auth Action Methods
  const login = async (email: string, password: string) => {
    const isCloud = getIsSupabaseConfigured();

    // 1. Live Supabase Authentication
    if (isCloud && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (authError) {
          return { success: false, error: authError.message };
        }
        if (authData.session) {
          const token = authData.session.access_token;
          api.setToken(token);
          setAuthToken(token);

          // Query user profile & company from Supabase
          const { data: profile } = await supabase
            .from('company_users')
            .select('*, company:companies(*)')
            .eq('email', email.trim())
            .maybeSingle();

          let userComp: Company | null = profile?.company || null;
          let userRole: ERPRole = (profile?.role as ERPRole) || (authData.user.user_metadata?.role as ERPRole) || 'owner';

          if (!userComp) {
            const { data: firstComp } = await supabase.from('companies').select('*').limit(1).maybeSingle();
            userComp = firstComp;
          }

          const resolvedUser: CompanyUser = {
            id: authData.user.id,
            companyId: userComp?.id || 'comp-main',
            name: profile?.name || authData.user.user_metadata?.name || email.split('@')[0],
            email: authData.user.email || email,
            role: userRole,
            department: profile?.department || 'Executive Management',
            isActive: true
          };

          setCurrentUser(resolvedUser);
          setCurrentRole(resolvedUser.role);
          localStorage.setItem('factoryflow_user', JSON.stringify(resolvedUser));

          if (userComp) {
            setCompanies([userComp]);
            setActiveCompanyId(userComp.id);
            localStorage.setItem('ff_companies', JSON.stringify([userComp]));
          }

          setIsAuthenticated(true);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Supabase authentication failed' };
      }
    }

    // 2. If Supabase is NOT configured, check backend or alert user
    try {
      const res = await api.auth.login({ email, password });
      api.setToken(res.token);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      localStorage.setItem('factoryflow_user', JSON.stringify(res.user));
      if (res.companies && res.companies.length > 0) {
        setCompanies(res.companies);
        localStorage.setItem('ff_companies', JSON.stringify(res.companies));
      }
      if (res.activeCompany) {
        setActiveCompanyId(res.activeCompany.id);
      } else if (res.user.companyId) {
        setActiveCompanyId(res.user.companyId);
      }
      setIsAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      if (!isCloud) {
        return {
          success: false,
          error: 'Supabase credentials are not configured in .env. Please click "Configure Supabase" to connect your live database.'
        };
      }
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (data: { name: string; email: string; password: string; companyName: string; gstin?: string; city?: string; role?: string }) => {
    const isCloud = getIsSupabaseConfigured();

    // 1. Live Supabase Registration
    if (isCloud && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email.trim(),
          password: data.password,
          options: {
            data: {
              name: data.name.trim(),
              company_name: data.companyName.trim(),
              role: data.role || 'owner'
            }
          }
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        if (authData.user) {
          const compCode = data.companyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'COMP';
          const { data: createdComp } = await supabase
            .from('companies')
            .insert({
              name: data.companyName.trim(),
              code: `${compCode}-${Date.now().toString().slice(-4)}`,
              gstin: data.gstin || null,
              city: data.city || 'Pune',
              currency: 'INR'
            })
            .select()
            .single();

          const companyId = createdComp?.id || authData.user.id;

          await supabase.from('company_users').insert({
            company_id: companyId,
            user_id: authData.user.id,
            name: data.name.trim(),
            email: data.email.trim(),
            role: (data.role as ERPRole) || 'owner'
          });

          if (authData.session) {
            api.setToken(authData.session.access_token);
            setAuthToken(authData.session.access_token);
          }

          const newUser: CompanyUser = {
            id: authData.user.id,
            companyId,
            name: data.name.trim(),
            email: data.email.trim(),
            role: (data.role as ERPRole) || 'owner',
            department: 'Executive Management',
            isActive: true
          };

          setCurrentUser(newUser);
          setCurrentRole(newUser.role);
          localStorage.setItem('factoryflow_user', JSON.stringify(newUser));

          if (createdComp) {
            setCompanies([createdComp]);
            setActiveCompanyId(createdComp.id);
            localStorage.setItem('ff_companies', JSON.stringify([createdComp]));
          }

          setIsAuthenticated(true);
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Supabase registration failed' };
      }
    }

    // 2. If Supabase is NOT configured
    try {
      const res = await api.auth.register(data);
      api.setToken(res.token);
      setAuthToken(res.token);
      setCurrentUser(res.user);
      setCurrentRole(res.user.role as ERPRole);
      localStorage.setItem('factoryflow_user', JSON.stringify(res.user));
      if (res.companies && res.companies.length > 0) {
        setCompanies(res.companies);
        localStorage.setItem('ff_companies', JSON.stringify(res.companies));
      }
      if (res.activeCompany) setActiveCompanyId(res.activeCompany.id);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      if (!isCloud) {
        return {
          success: false,
          error: 'Supabase credentials are not configured in .env. Please click "Configure Supabase" to connect your live database.'
        };
      }
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const onboard = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.onboard(data);
      if (res.token) {
        api.setToken(res.token);
        setAuthToken(res.token);
        setCurrentUser(res.user);
        setCurrentRole(res.user.role as ERPRole);
        localStorage.setItem('factoryflow_user', JSON.stringify(res.user));
        if (res.companies && res.companies.length > 0) {
          setCompanies(res.companies);
          localStorage.setItem('ff_companies', JSON.stringify(res.companies));
        }
        if (res.activeCompany) setActiveCompanyId(res.activeCompany.id);
        setIsAuthenticated(true);
        setPendingGoogleProfile(null);
        return { success: true };
      }
      return { success: false, error: 'Failed to obtain session token' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Onboarding failed' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured && supabase) {
        const callbackUrl = ((import.meta as any).env?.VITE_AUTH_CALLBACK_URL as string) || window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });
        if (error) throw error;
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Google OAuth requires Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
        };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Google authentication failed' };
    }
  };

  // Supabase Google OAuth Session Listener (Registered once per configuration lifecycle)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const syncSession = async (session: any) => {
      // Abort immediately if logging out or user is already authenticated
      if (isLoggingOutRef.current || isAuthenticatedRef.current) return;
      if (!session?.user?.email) return;

      try {
        const res = await api.auth.googleOAuth({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          avatarUrl: session.user.user_metadata?.avatar_url,
          supabaseToken: session.access_token
        });
        if (res.token && !isLoggingOutRef.current) {
          api.setToken(res.token);
          setAuthToken(res.token);
          setCurrentUser(res.user);
          setCurrentRole(res.user.role as ERPRole);
          localStorage.setItem('factoryflow_user', JSON.stringify(res.user));
          if (res.companies && res.companies.length > 0) {
            setCompanies(res.companies);
            localStorage.setItem('ff_companies', JSON.stringify(res.companies));
          }
          if (res.activeCompany) setActiveCompanyId(res.activeCompany.id);
          setIsAuthenticated(true);
          setPendingGoogleProfile(null);
        }
      } catch (e: any) {
        if (isLoggingOutRef.current) return;
        console.warn('[Supabase Google Auth Sync Notice]', e);
        if (e.requiresOnboarding || e.code === 'USER_NOT_REGISTERED' || e.message?.includes('not registered') || e.message?.includes('register')) {
          setPendingGoogleProfile({
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            avatarUrl: session.user.user_metadata?.avatar_url
          });
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isLoggingOutRef.current && !isAuthenticatedRef.current) {
        syncSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isLoggingOutRef.current || event === 'SIGNED_OUT') return;
      if (session && !isAuthenticatedRef.current) {
        syncSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  const selectCompany = async (companyId: string) => {
    try {
      const res = await api.auth.selectCompany(companyId);
      api.setToken(res.token);
      setAuthToken(res.token);
      if (res.companies && res.companies.length > 0) {
        setCompanies(res.companies);
        localStorage.setItem('ff_companies', JSON.stringify(res.companies));
      }
      if (res.activeCompany) setActiveCompanyId(res.activeCompany.id);
      else setActiveCompanyId(companyId);
    } catch {
      setActiveCompanyId(companyId);
    }
  };

  const createCompany = async (companyData: Partial<Company>): Promise<Company> => {
    const compCode = (companyData.code || companyData.name?.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'COMP').toUpperCase();
    const payload: Partial<Company> = {
      name: companyData.name || 'New Enterprise Workspace',
      code: compCode,
      gstin: companyData.gstin || '27AAACP0123M1Z5',
      pan: companyData.pan || (companyData.gstin ? companyData.gstin.slice(2, 12) : 'AAACP0123M'),
      address: companyData.address || 'Industrial Estate, Phase II',
      city: companyData.city || 'Pune',
      state: companyData.state || 'Maharashtra',
      stateCode: companyData.stateCode || '27',
      pincode: companyData.pincode || '411019',
      phone: companyData.phone || '+91 9876543210',
      email: companyData.email || currentUser.email || 'admin@codozent.com',
      currency: 'INR',
      industry: companyData.industry || 'Manufacturing'
    };

    let created: Company | null = null;

    if (supabase) {
      try {
        const { data: sCompany } = await supabase
          .from('companies')
          .insert(payload)
          .select()
          .single();
        if (sCompany) {
          created = sCompany;
          if (currentUser.id) {
            await supabase.from('company_users').insert({
              company_id: sCompany.id,
              user_id: currentUser.id,
              email: currentUser.email,
              name: currentUser.name,
              role: 'owner'
            });
          }
        }
      } catch (e) {
        console.warn('[Supabase Create Company]', e);
      }
    }

    if (!created) {
      try {
        const res = await api.companies.create(payload);
        created = res.data || res;
      } catch {
        created = {
          ...payload,
          id: `comp-${Date.now().toString(36)}`
        } as Company;
      }
    }

    if (created) {
      setCompanies(prev => {
        const exists = prev.some(c => c.id === created!.id);
        const next = exists ? prev : [...prev, created!];
        try {
          localStorage.setItem('ff_companies', JSON.stringify(next));
        } catch {}
        return next;
      });
      setActiveCompanyId(created.id);
      try {
        localStorage.setItem('ff_active_comp', created.id);
      } catch {}
      addAuditLog('CREATE', 'Company', created.id, `Created new company workspace: ${created.name}`);
    }

    return created!;
  };

  const updateCompany = async (id: string, updates: Partial<Company>) => {
    setCompanies(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      try {
        localStorage.setItem('ff_companies', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save updated companies to localStorage', e);
      }
      return updated;
    });

    if (supabase) {
      try {
        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.code !== undefined) payload.code = updates.code;
        if (updates.gstin !== undefined) payload.gstin = updates.gstin;
        if (updates.pan !== undefined) payload.pan = updates.pan;
        if (updates.address !== undefined) payload.address = updates.address;
        if (updates.city !== undefined) payload.city = updates.city;
        if (updates.state !== undefined) payload.state = updates.state;
        if (updates.stateCode !== undefined) payload.state_code = updates.stateCode;
        if (updates.pincode !== undefined) payload.pincode = updates.pincode;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.currency !== undefined) payload.currency = updates.currency;
        if (updates.industry !== undefined) payload.industry = updates.industry;

        if (Object.keys(payload).length > 0) {
          await supabase.from('companies').update(payload).eq('id', id);
        }
      } catch (err) {
        console.warn('[Supabase Company Update Warning]', err);
      }
    }

    addAuditLog('UPDATE', 'Company', id, `Updated legal entity profile for ${updates.name || 'company'}`);
  };

  const logout = async () => {
    isLoggingOutRef.current = true;

    // 1. Terminate Supabase Auth session if configured
    if (supabase) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e) {
        console.warn('[Logout] Supabase signOut notice:', e);
      }
    }

    // 2. Call backend logout endpoint
    try {
      await api.auth.logout();
    } catch {
      // Backend may be offline or unauthenticated, ignore safely
    }

    // 3. Purge API client token
    api.setToken(null);

    // 4. Purge all local storage tokens & cached credentials
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('factoryflow') ||
            key.startsWith('ff_') ||
            key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('token') ||
            key === 'house_msme_email')
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('[Logout] Storage cleanup notice:', e);
    }

    // 5. Reset authentication & user profile state
    setAuthToken(null);
    setIsAuthenticated(false);
    setCurrentUser(EMPTY_USER);
    setCurrentRole('owner');
    setCompanies([]);
    setActiveCompanyId('');
    setPendingGoogleProfile(null);

    // 6. Purge in-memory entity arrays to prevent data retention
    setItems([]);
    setSalesOrders([]);
    setPurchaseOrders([]);
    setWorkOrders([]);
    setStockTransactions([]);
    setCustomers([]);
    setSuppliers([]);
    setBoms([]);
    setInvoices([]);
    setDeliveryChallans([]);
    setQualityInspections([]);
    setPayments([]);

    // 7. Clear URL hash fragments that might contain OAuth tokens
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 8. Gracefully reset the logout lock after state has fully transitioned
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 800);
  };

  // Master Data Creators
  const createCustomer = async (c: Omit<Customer, 'id' | 'companyId' | 'customerCode'>): Promise<Customer> => {
    try {
      const created = await api.customers.create(activeCompanyId, c);
      setCustomers(prev => [created, ...prev]);
      addAuditLog('CREATE', 'Customer', created.id, `Created customer ${created.name}`);
      return created;
    } catch {
      const customerCode = `CUST-${String(customers.length + 1).padStart(4, '0')}`;
      const newCust: Customer = {
        ...c,
        id: `cust-${Date.now()}`,
        companyId: activeCompanyId,
        customerCode
      };
      setCustomers(prev => [newCust, ...prev]);
      addAuditLog('CREATE', 'Customer', newCust.id, `Created customer ${newCust.name} (local)`);
      return newCust;
    }
  };

  const createSupplier = async (s: Omit<Supplier, 'id' | 'companyId' | 'supplierCode'>): Promise<Supplier> => {
    try {
      const created = await api.suppliers.create(activeCompanyId, s);
      setSuppliers(prev => [created, ...prev]);
      addAuditLog('CREATE', 'Supplier', created.id, `Created supplier ${created.name}`);
      return created;
    } catch {
      const supplierCode = `SUPP-${String(suppliers.length + 1).padStart(4, '0')}`;
      const newSupp: Supplier = {
        ...s,
        id: `supp-${Date.now()}`,
        companyId: activeCompanyId,
        supplierCode
      };
      setSuppliers(prev => [newSupp, ...prev]);
      addAuditLog('CREATE', 'Supplier', newSupp.id, `Created supplier ${newSupp.name} (local)`);
      return newSupp;
    }
  };

  const createItem = async (i: Omit<Item, 'id' | 'companyId' | 'itemCode'>): Promise<Item> => {
    try {
      const created = await api.items.create(activeCompanyId, i);
      setItems(prev => [created, ...prev]);
      addAuditLog('CREATE', 'Item', created.id, `Created item ${created.name}`);
      return created;
    } catch {
      const prefix = i.category === 'raw_material' ? 'RAW' : i.category === 'finished_goods' ? 'FG' : 'COMP';
      const itemCode = `${prefix}-${String(items.length + 1).padStart(4, '0')}`;
      const newItem: Item = {
        ...i,
        id: `item-${Date.now()}`,
        companyId: activeCompanyId,
        itemCode
      };
      setItems(prev => [newItem, ...prev]);
      addAuditLog('CREATE', 'Item', newItem.id, `Created item ${newItem.name} (local)`);
      return newItem;
    }
  };

  const createBOM = async (b: Omit<BillOfMaterials, 'id' | 'companyId' | 'bomNumber' | 'createdAt'>): Promise<BillOfMaterials> => {
    try {
      const created = await api.boms.create(activeCompanyId, b);
      setBoms(prev => [created, ...prev]);
      addAuditLog('CREATE', 'BOM', created.id, `Created BOM ${created.bomNumber}`);
      return created;
    } catch {
      const bomNumber = `BOM-${String(boms.length + 1).padStart(4, '0')}`;
      const newBOM: BillOfMaterials = {
        ...b,
        id: `bom-${Date.now()}`,
        companyId: activeCompanyId,
        bomNumber,
        createdAt: new Date().toISOString()
      };
      setBoms(prev => [newBOM, ...prev]);
      addAuditLog('CREATE', 'BOM', newBOM.id, `Created BOM ${bomNumber} (local)`);
      return newBOM;
    }
  };

  // Main Collections State - 100% dynamically loaded from Backend Server & Supabase (0 dummy records)
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [boms, setBoms] = useState<BillOfMaterials[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<PurchaseRequisition[]>([]);
  const [vendorQuotations, setVendorQuotations] = useState<VendorQuotation[]>([]);
  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>([]);
  const [grns, setGrns] = useState<GoodsReceiptNote[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([]);
  const [qualityInspections, setQualityInspections] = useState<QualityInspection[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Codozent One Modular Collections
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [crmFollowups, setCrmFollowups] = useState<CrmLeadFollowup[]>([]);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [khataEntries, setKhataEntries] = useState<KhataEntry[]>([]);
  const [gstSummary, setGstSummary] = useState<GstSummary | null>(null);
  const [gst2bRecords, setGst2bRecords] = useState<Gst2BMatchRecord[]>([]);
  const [caQueries, setCaQueries] = useState<CADeskQuery[]>([]);
  const [msmeScrutiny, setMsmeScrutiny] = useState<any[]>([]);
  const [scheduleIII, setScheduleIII] = useState<any | null>(null);
  const [counterSales, setCounterSales] = useState<CounterSale[]>([]);
  const [employees, setEmployees] = useState<HrmsEmployee[]>([]);
  const [attendance, setAttendance] = useState<HrmsAttendanceRecord[]>([]);
  const [payrolls, setPayrolls] = useState<HrmsPayrollItem[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Cloud status
  const [isCloudConnected] = useState<boolean>(isSupabaseConfigured);

  // Synchronize state with Backend REST API on activeCompanyId change
  useEffect(() => {
    let isSubscribed = true;
    if (!activeCompanyId) return;

    const fetchBackendData = async () => {
      try {
        const results = await Promise.allSettled([
          api.customers.list(activeCompanyId),
          api.suppliers.list(activeCompanyId),
          api.items.list(activeCompanyId),
          api.boms.list(activeCompanyId),
          api.sales.listOrders(activeCompanyId),
          api.purchase.listOrders(activeCompanyId),
          api.manufacturing.listWorkOrders(activeCompanyId),
          api.inventory.getTransactions(activeCompanyId),
          api.quality.listInspections(activeCompanyId),
          api.sales.listInvoices(activeCompanyId),
          api.sales.listChallans(activeCompanyId),
          api.sales.listQuotations(activeCompanyId),
          api.crm.listLeads(activeCompanyId),
          api.crm.listFollowups(activeCompanyId),
          api.work.listProjects(activeCompanyId),
          api.work.listTasks(activeCompanyId),
          api.khatabook.listEntries(activeCompanyId),
          api.gst.getSummary(activeCompanyId),
          api.gst.list2BMatches(activeCompanyId),
          api.caDesk.listQueries(activeCompanyId),
          api.caDesk.getMsmeScrutiny(activeCompanyId),
          api.caDesk.getScheduleIII(activeCompanyId),
          api.counter.listSales(activeCompanyId),
          api.hrms.listEmployees(activeCompanyId),
          api.hrms.getAttendance(activeCompanyId),
          api.hrms.getPayroll(activeCompanyId),
          api.support.listTickets(activeCompanyId),
          api.inventory.getWarehouses(activeCompanyId),
          api.finance.getChartOfAccounts(activeCompanyId),
          api.finance.getPayments(activeCompanyId),
          api.manufacturing.listWorkCenters(activeCompanyId),
          api.purchase.listRFQs(activeCompanyId),
          api.purchase.listRequisitions(activeCompanyId),
          api.purchase.listVendorQuotes(activeCompanyId),
          api.purchase.listBills(activeCompanyId)
        ]);

        if (!isSubscribed) return;

        const [
          custs, supps, itms, bms, sos, pos, wos, txs, qcs, invs, dcs, quos,
          crmLeads, crmFlws, workProjs, workTsks, khataList, gstSumm, gst2bList,
          caQList, caMsme, caSched3, posSales, hrmsEmps, hrmsAtt, hrmsPay, suppTcks,
          whs, coas, pmts, wcs, rfqList, prList, vqList, pbList
        ] = results;

        if (custs.status === 'fulfilled' && custs.value) setCustomers(custs.value);
        if (supps.status === 'fulfilled' && supps.value) setSuppliers(supps.value);
        if (itms.status === 'fulfilled' && itms.value) setItems(itms.value);
        if (bms.status === 'fulfilled' && bms.value) setBoms(bms.value);
        if (sos.status === 'fulfilled' && sos.value) setSalesOrders(sos.value);
        if (pos.status === 'fulfilled' && pos.value) setPurchaseOrders(pos.value);
        if (wos.status === 'fulfilled' && wos.value) setWorkOrders(wos.value);
        if (txs.status === 'fulfilled' && txs.value) setStockTransactions(txs.value);
        if (qcs.status === 'fulfilled' && qcs.value) setQualityInspections(qcs.value);
        if (invs.status === 'fulfilled' && invs.value) setInvoices(invs.value);
        if (dcs.status === 'fulfilled' && dcs.value) setDeliveryChallans(dcs.value);
        if (quos.status === 'fulfilled' && quos.value) setQuotations(quos.value);
        if (crmLeads.status === 'fulfilled' && crmLeads.value) setLeads(crmLeads.value);
        if (crmFlws.status === 'fulfilled' && crmFlws.value) setCrmFollowups(crmFlws.value);
        if (workProjs.status === 'fulfilled' && workProjs.value) setProjects(workProjs.value);
        if (workTsks.status === 'fulfilled' && workTsks.value) setTasks(workTsks.value);
        if (khataList.status === 'fulfilled' && khataList.value) setKhataEntries(khataList.value);
        if (gstSumm.status === 'fulfilled' && gstSumm.value) setGstSummary(gstSumm.value);
        if (gst2bList.status === 'fulfilled' && gst2bList.value) setGst2bRecords(gst2bList.value);
        if (caQList.status === 'fulfilled' && caQList.value) setCaQueries(caQList.value);
        if (caMsme.status === 'fulfilled' && caMsme.value) setMsmeScrutiny(caMsme.value);
        if (caSched3.status === 'fulfilled' && caSched3.value) setScheduleIII(caSched3.value);
        if (posSales.status === 'fulfilled' && posSales.value) setCounterSales(posSales.value);
        if (hrmsEmps.status === 'fulfilled' && hrmsEmps.value) setEmployees(hrmsEmps.value);
        if (hrmsAtt.status === 'fulfilled' && hrmsAtt.value) setAttendance(hrmsAtt.value);
        if (hrmsPay.status === 'fulfilled' && hrmsPay.value) setPayrolls(hrmsPay.value);
        if (suppTcks.status === 'fulfilled' && suppTcks.value) setSupportTickets(suppTcks.value);
        if (whs.status === 'fulfilled' && whs.value) setWarehouses(whs.value);
        if (coas.status === 'fulfilled' && coas.value) setChartOfAccounts(coas.value);
        if (pmts.status === 'fulfilled' && pmts.value) setPayments(pmts.value);
        if (wcs.status === 'fulfilled' && wcs.value) setWorkCenters(wcs.value);
        if (rfqList.status === 'fulfilled' && rfqList.value) setRfqs(rfqList.value);
        if (prList?.status === 'fulfilled' && prList.value) setPurchaseRequisitions(prList.value);
        if (vqList?.status === 'fulfilled' && vqList.value) setVendorQuotations(vqList.value);
        if (pbList?.status === 'fulfilled' && pbList.value) setPurchaseBills(pbList.value);
      } catch (err) {
        console.warn('[ERPContext] Backend connection notice:', err);
      }
    };

    fetchBackendData();

    return () => {
      isSubscribed = false;
    };
  }, [activeCompanyId]);

  // Document Number Generator Helper
  const getNextNumber = (prefix: string, list: { id: string }[]): string => {
    const year = new Date().getFullYear();
    const count = list.length + 1;
    return `${prefix}-${year}-${String(count).padStart(5, '0')}`;
  };

  const addAuditLog = (action: AuditLog['action'], entityName: string, entityId: string, details: string) => {
    const log: AuditLog = {
      id: `audit-${Date.now()}`,
      companyId: activeCompany.id,
      userName: currentUser.name,
      action,
      entityName,
      entityId,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [companyBranches, setCompanyBranches] = useState<any[]>([]);

  const loadAccessData = async () => {
    if (!activeCompanyId) return;
    try {
      const [uRes, bRes] = await Promise.allSettled([
        api.access.listUsers(activeCompanyId),
        api.branches.list(activeCompanyId)
      ]);
      if (uRes.status === 'fulfilled') setCompanyUsers(uRes.value);
      if (bRes.status === 'fulfilled') setCompanyBranches(bRes.value);
    } catch { }
  };

  useEffect(() => {
    if (activeCompanyId) {
      loadAccessData();
    }
  }, [activeCompanyId]);

  const allotUserAccess = async (userData: any) => {
    if (!activeCompanyId) throw new Error('No active company');
    const res = await api.access.allotRole(activeCompanyId, userData);
    await loadAccessData();
    addAuditLog('CREATE', 'UserAccess', res.user?.id || 'new', `Allotted role ${userData.role} to ${userData.email}`);
    return res;
  };

  const verifyUserAccess = async (userId: string, emailVerified: boolean = true, phoneVerified: boolean = true) => {
    if (!activeCompanyId) throw new Error('No active company');
    const res = await api.access.verifyUser(activeCompanyId, { userId, emailVerified, phoneVerified });
    await loadAccessData();
    addAuditLog('UPDATE', 'UserAccess', userId, `Verified email & phone credentials for user`);
    return res;
  };

  const createBranch = async (branchData: any) => {
    if (!activeCompanyId) throw new Error('No active company');
    const res = await api.branches.create(activeCompanyId, branchData);
    await loadAccessData();
    addAuditLog('CREATE', 'Branch', res.id, `Created branch ${branchData.name} (${branchData.code})`);
    return res;
  };

  // Centralized Granular RBAC & Module Activation Check
  const canAccess = (moduleOrPerm: string): boolean => {
    // 1. Mandatory verification check: Unverified users cannot execute privileged actions
    if (currentUser && !isUserVerified(currentUser)) {
      return false;
    }

    // 2. Platform governance root bypass
    if (currentRole === 'super_admin' || currentRole === 'owner') return true;

    // 3. Module activation check
    const knownModules = [
      'crm', 'quotations', 'sales', 'counter', 'purchase', 'inventory',
      'manufacturing', 'shopfloor', 'quality', 'work', 'finance',
      'khatabook', 'gstReturns', 'caDesk', 'hrms', 'support'
    ];
    if (knownModules.includes(moduleOrPerm)) {
      if (installedModules && installedModules.length > 0 && !installedModules.includes(moduleOrPerm)) {
        return false;
      }
    }

    // 4. Centralized Authorization Engine
    const decision = evaluateAccess(
      {
        user: currentUser,
        activeCompanyId,
        enabledModules: installedModules
      },
      {
        permissionId: moduleOrPerm.includes('.') ? moduleOrPerm : `${moduleOrPerm}.read`
      }
    );

    return decision.allowed;
  };

  // 1. ORDER-TO-CASH: Create Sales Order
  const createSalesOrder = async (soData: any): Promise<SalesOrder> => {
    try {
      const created = await api.sales.createOrder(activeCompanyId, soData);
      setSalesOrders(prev => [created, ...prev]);
      addAuditLog('CREATE', 'SalesOrder', created.id, `Created sales order ${created.soNumber} for ${soData.customerName}`);
      return created;
    } catch {
      const subtotal = soData.items.reduce((acc: number, itm: any) => acc + (itm.quantity * itm.unitPrice), 0);
      const cgst = subtotal * 0.09;
      const sgst = subtotal * 0.09;
      const grandTotal = subtotal + cgst + sgst;

      const soNumber = getNextNumber('SO', salesOrders);
      const newSO: SalesOrder = {
        ...soData,
        id: `so-${Date.now()}`,
        companyId: activeCompany.id,
        soNumber,
        status: soData.status || 'confirmed',
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: 0,
        grandTotal,
        createdBy: currentUser.name
      };

      setSalesOrders(prev => [newSO, ...prev]);
      addAuditLog('CREATE', 'SalesOrder', newSO.id, `Created sales order ${soNumber} for ${soData.customerName}`);
      return newSO;
    }
  };

  const updateSalesOrderStatus = async (id: string, status: SalesOrder['status'], reason?: string) => {
    try {
      const updated = await api.sales.updateOrderStatus(activeCompanyId, id, status, reason);
      setSalesOrders(prev => prev.map(so => so.id === id ? updated : so));
    } catch {
      setSalesOrders(prev => prev.map(so => so.id === id ? { ...so, status } : so));
    }
    addAuditLog('STATUS_CHANGE', 'SalesOrder', id, `Updated sales order status to ${status}`);
  };

  const cancelSalesOrder = async (id: string, reason: string): Promise<SalesOrder> => {
    try {
      const cancelled = await api.sales.cancelOrder(activeCompanyId, id, reason);
      setSalesOrders(prev => prev.map(so => so.id === id ? cancelled : so));
      addAuditLog('STATUS_CHANGE', 'SalesOrder', id, `Cancelled sales order: ${reason}`);
      return cancelled;
    } catch {
      const order = salesOrders.find(s => s.id === id);
      const updated = { ...order!, status: 'cancelled' as SalesOrderStatus, cancellationReason: reason };
      setSalesOrders(prev => prev.map(so => so.id === id ? updated : so));
      addAuditLog('STATUS_CHANGE', 'SalesOrder', id, `Cancelled sales order: ${reason}`);
      return updated;
    }
  };

  // 2. DISPATCH & CHALLAN
  const createDeliveryChallan = async (salesOrderId: string, transporter: string, vehicleNo: string, eWayBill: string): Promise<DeliveryChallan> => {
    try {
      const res = await api.sales.dispatchOrder(activeCompanyId, salesOrderId, { transporter, vehicleNo, eWayBill });
      const challan = res.challan || res;
      setDeliveryChallans(prev => [challan, ...prev]);
      if (res.stockTransaction) {
        setStockTransactions(prev => [res.stockTransaction, ...prev]);
      }
      setSalesOrders(prev => prev.map(s => s.id === salesOrderId ? { ...s, status: 'completed' } : s));
      addAuditLog('CREATE', 'DeliveryChallan', challan.id, `Dispatched Challan ${challan.challanNumber || challan.id}`);
      return challan;
    } catch {
      const so = salesOrders.find(s => s.id === salesOrderId);
      if (!so) throw new Error('Sales order not found');

      const challanNumber = getNextNumber('DC', deliveryChallans);
      const challanItems = so.items.map(itm => {
        const itmMaster = items.find(i => i.id === itm.itemId);
        return {
          itemId: itm.itemId,
          itemName: itm.itemName,
          itemCode: itm.itemCode,
          quantity: itm.quantity,
          uom: itmMaster?.uom || 'nos'
        };
      });

      const newChallan: DeliveryChallan = {
        id: `dc-${Date.now()}`,
        companyId: activeCompany.id,
        challanNumber,
        salesOrderId: so.id,
        soNumber: so.soNumber,
        customerId: so.customerId,
        customerName: so.customerName,
        dispatchDate: new Date().toISOString().split('T')[0],
        transporterName: transporter,
        vehicleNumber: vehicleNo,
        eWayBillNumber: eWayBill,
        items: challanItems,
        status: 'dispatched'
      };

      setDeliveryChallans(prev => [newChallan, ...prev]);
      updateSalesOrderStatus(so.id, 'completed');
      addAuditLog('CREATE', 'DeliveryChallan', newChallan.id, `Dispatched Challan ${challanNumber} for ${so.soNumber}`);
      return newChallan;
    }
  };

  // 3. GST TAX INVOICE
  const createSalesInvoiceFromOrder = async (salesOrderId: string): Promise<Invoice> => {
    try {
      const inv = await api.sales.generateInvoice(activeCompanyId, salesOrderId);
      setInvoices(prev => [inv, ...prev]);
      setSalesOrders(prev => prev.map(s => s.id === salesOrderId ? { ...s, status: 'completed' } : s));
      addAuditLog('CREATE', 'Invoice', inv.id, `Generated GST Tax Invoice ${inv.invoiceNumber}`);
      return inv;
    } catch {
      const so = salesOrders.find(s => s.id === salesOrderId);
      if (!so) throw new Error('Sales order not found');

      const invNumber = getNextNumber('INV', invoices);
      const invoiceItems = so.items.map(itm => {
        const itmMaster = items.find(i => i.id === itm.itemId);
        return {
          itemId: itm.itemId,
          itemName: itm.itemName,
          hsnSac: itmMaster?.hsnSacCode || '8483',
          quantity: itm.quantity,
          unitPrice: itm.unitPrice,
          gstRate: itm.gstRate,
          taxAmount: itm.taxAmount,
          totalAmount: itm.totalAmount
        };
      });

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        companyId: activeCompany.id,
        invoiceNumber: invNumber,
        invoiceType: 'sales_tax_invoice',
        partnerType: 'customer',
        partnerId: so.customerId,
        partnerName: so.customerName,
        partnerGstin: '27AAACT2727Q1ZT',
        orderNumber: so.soNumber,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'unpaid',
        subtotal: so.subtotal,
        cgstAmount: so.cgstAmount,
        sgstAmount: so.sgstAmount,
        igstAmount: so.igstAmount,
        totalAmount: so.grandTotal,
        paidAmount: 0,
        gstIrn: `98d3c${Math.random().toString(16).substring(2, 10)}${Date.now()}`,
        gstAckNumber: `1126${Math.floor(100000000 + Math.random() * 900000000)}`,
        items: invoiceItems
      };

      setInvoices(prev => [newInvoice, ...prev]);
      addAuditLog('CREATE', 'Invoice', newInvoice.id, `Generated GST Tax Invoice ${invNumber}`);
      return newInvoice;
    }
  };

  // 4. PROCURE-TO-PAY: Create Purchase Order
  const createPurchaseOrder = async (poData: any): Promise<PurchaseOrder> => {
    try {
      const created = await api.purchase.createOrder(activeCompanyId, poData);
      setPurchaseOrders(prev => [created, ...prev]);
      addAuditLog('CREATE', 'PurchaseOrder', created.id, `Issued purchase order ${created.poNumber}`);
      return created;
    } catch {
      const subtotal = poData.items.reduce((acc: number, itm: any) => acc + (itm.quantity * (itm.unitPrice || itm.unitCost || 0)), 0);
      const cgst = subtotal * 0.09;
      const sgst = subtotal * 0.09;
      const grandTotal = subtotal + cgst + sgst;

      const poNumber = getNextNumber('PO', purchaseOrders);
      const newPO: PurchaseOrder = {
        ...poData,
        id: `po-${Date.now()}`,
        companyId: activeCompany.id,
        poNumber,
        status: poData.status || 'ordered',
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: 0,
        grandTotal
      };

      setPurchaseOrders(prev => [newPO, ...prev]);
      addAuditLog('CREATE', 'PurchaseOrder', newPO.id, `Issued purchase order ${poNumber}`);
      return newPO;
    }
  };

  const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrder['status'], reason?: string) => {
    try {
      const updated = await api.purchase.updateOrderStatus(activeCompanyId, id, status, reason);
      setPurchaseOrders(prev => prev.map(po => po.id === id ? updated : po));
    } catch {
      setPurchaseOrders(prev => prev.map(po => po.id === id ? { ...po, status } : po));
    }
    addAuditLog('STATUS_CHANGE', 'PurchaseOrder', id, `Updated purchase order status to ${status}`);
  };

  const cancelPurchaseOrder = async (id: string, reason: string): Promise<PurchaseOrder> => {
    try {
      const cancelled = await api.purchase.cancelOrder(activeCompanyId, id, reason);
      setPurchaseOrders(prev => prev.map(po => po.id === id ? cancelled : po));
      addAuditLog('STATUS_CHANGE', 'PurchaseOrder', id, `Cancelled purchase order: ${reason}`);
      return cancelled;
    } catch {
      const order = purchaseOrders.find(p => p.id === id);
      const updated = { ...order!, status: 'cancelled' as PurchaseOrderStatus, cancellationReason: reason };
      setPurchaseOrders(prev => prev.map(po => po.id === id ? updated : po));
      addAuditLog('STATUS_CHANGE', 'PurchaseOrder', id, `Cancelled purchase order: ${reason}`);
      return updated;
    }
  };

  const createPurchaseRequisition = async (prData: any): Promise<PurchaseRequisition> => {
    try {
      const created = await api.purchase.createRequisition(activeCompanyId, prData);
      setPurchaseRequisitions(prev => [created, ...prev]);
      addAuditLog('CREATE', 'PurchaseRequisition', created.id, `Created purchase requisition ${created.prNumber}`);
      return created;
    } catch (err: any) {
      console.error('Failed to create purchase requisition:', err);
      throw err;
    }
  };

  const updatePurchaseRequisitionStatus = async (id: string, status: PurchaseRequisitionStatus, remarks?: string): Promise<PurchaseRequisition> => {
    try {
      const updated = await api.purchase.updateRequisitionStatus(activeCompanyId, id, status, remarks);
      setPurchaseRequisitions(prev => prev.map(p => p.id === id ? updated : p));
      addAuditLog('STATUS_CHANGE', 'PurchaseRequisition', id, `Updated requisition status to ${status}`);
      return updated;
    } catch (err: any) {
      console.error('Failed to update requisition status:', err);
      throw err;
    }
  };

  const createVendorQuotation = async (vqData: any): Promise<VendorQuotation> => {
    try {
      const created = await api.purchase.createVendorQuote(activeCompanyId, vqData);
      setVendorQuotations(prev => [created, ...prev]);
      addAuditLog('CREATE', 'VendorQuotation', created.id, `Recorded vendor quote ${created.quoteNumber}`);
      return created;
    } catch (err: any) {
      console.error('Failed to create vendor quote:', err);
      throw err;
    }
  };

  const createPurchaseBill = async (billData: any): Promise<PurchaseBill> => {
    try {
      const created = await api.purchase.createBill(activeCompanyId, billData);
      setPurchaseBills(prev => [created, ...prev]);
      addAuditLog('CREATE', 'PurchaseBill', created.id, `Created purchase bill ${created.billNumber}`);
      return created;
    } catch (err: any) {
      console.error('Failed to create purchase bill:', err);
      throw err;
    }
  };

  // 5. GOODS RECEIPT NOTE (GRN)
  const createGRN = async (poId: string, supplierInvoiceNo: string, warehouseId: string, itemsList: { itemId: string; receivedQty: number; batchNo: string }[]): Promise<GoodsReceiptNote> => {
    try {
      const grn = await api.purchase.receiveGRN(activeCompanyId, poId, {
        supplierInvoiceNo,
        warehouseId,
        items: itemsList
      });
      setGrns(prev => [grn, ...prev]);
      const updatedPOs = await api.purchase.listOrders(activeCompanyId);
      setPurchaseOrders(updatedPOs);
      const txs = await api.inventory.getTransactions(activeCompanyId);
      setStockTransactions(txs);
      addAuditLog('CREATE', 'GoodsReceiptNote', grn.id, `Recorded GRN ${grn.grnNumber}`);
      return grn;
    } catch {
      const po = purchaseOrders.find(p => p.id === poId);
      if (!po) throw new Error('Purchase order not found');

      const grnNumber = getNextNumber('GRN', grns);
      const wh = warehouses.find(w => w.id === warehouseId) || warehouses[0];

      const grnItems = itemsList.map(il => {
        const itm = items.find(i => i.id === il.itemId);
        return {
          itemId: il.itemId,
          itemCode: itm?.itemCode || 'UNKNOWN',
          itemName: itm?.name || 'Raw Material',
          receivedQuantity: il.receivedQty,
          acceptedQuantity: il.receivedQty,
          rejectedQuantity: 0,
          batchNumber: il.batchNo || `BATCH-${Date.now()}`
        };
      });

      const newGRN: GoodsReceiptNote = {
        id: `grn-${Date.now()}`,
        companyId: activeCompany.id,
        grnNumber,
        purchaseOrderId: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        warehouseId: wh?.id || warehouseId || 'wh-rms-01',
        warehouseName: wh?.name || 'Raw Materials Main Store',
        receiptDate: new Date().toISOString().split('T')[0],
        supplierInvoiceNo,
        qcStatus: 'pending_inspection',
        items: grnItems,
        notes: `Received at dock under Challan ${supplierInvoiceNo}`
      };

      setGrns(prev => [newGRN, ...prev]);
      addAuditLog('CREATE', 'GoodsReceiptNote', newGRN.id, `Recorded GRN ${grnNumber}`);
      return newGRN;
    }
  };

  // 6. MANUFACTURING: Work Orders & Material Issue
  const createWorkOrder = async (productId: string, bomId: string, quantity: number, priority: 'low' | 'normal' | 'urgent', dueDate: string, salesOrderId?: string): Promise<WorkOrder> => {
    try {
      const wo = await api.manufacturing.createWorkOrder(activeCompanyId, {
        productId,
        bomId,
        quantity,
        priority,
        dueDate,
        salesOrderId
      });
      setWorkOrders(prev => [wo, ...prev]);
      addAuditLog('CREATE', 'WorkOrder', wo.id, `Created Work Order ${wo.woNumber}`);
      return wo;
    } catch {
      const prod = items.find(i => i.id === productId);
      const bom = boms.find(b => b.id === bomId);
      const woNumber = getNextNumber('WO', workOrders);
      const so = salesOrders.find(s => s.id === salesOrderId);

      const newWO: WorkOrder = {
        id: `wo-${Date.now()}`,
        companyId: activeCompany.id,
        woNumber,
        salesOrderId,
        soNumber: so?.soNumber,
        productId: prod?.id || productId,
        productCode: prod?.itemCode || 'PROD',
        productName: prod?.name || 'Manufactured Item',
        bomId: bom?.id || bomId,
        bomRevision: bom?.revision || 'Rev A',
        plannedQuantity: quantity,
        producedQuantity: 0,
        rejectedQuantity: 0,
        reworkQuantity: 0,
        status: 'scheduled',
        priority,
        assignedSupervisor: 'Plant Supervisor',
        assignedWorker: 'Shop Floor Worker',
        startDate: new Date().toISOString().split('T')[0],
        dueDate,
        notes: `Production lot for ${prod?.name || 'Item'}`
      };

      setWorkOrders(prev => [newWO, ...prev]);
      addAuditLog('CREATE', 'WorkOrder', newWO.id, `Created Work Order ${woNumber}`);
      return newWO;
    }
  };

  // Start Job / Issue Raw Materials
  const startWorkOrder = (workOrderId: string): { success: boolean; message: string } => {
    const wo = workOrders.find(w => w.id === workOrderId);
    if (!wo) {
      return { success: false, message: 'Work order not found' };
    }

    // Call backend API asynchronously
    api.manufacturing.startJob(activeCompanyId, workOrderId).then(res => {
      if (res?.workOrder) {
        setWorkOrders(prev => prev.map(w => w.id === workOrderId ? res.workOrder : w));
      }
    }).catch(err => {
      console.warn('Backend startJob error:', err);
    });

    setWorkOrders(prev => prev.map(w => w.id === workOrderId ? { ...w, status: 'in_progress' } : w));
    addAuditLog('STATUS_CHANGE', 'WorkOrder', workOrderId, `Started Work Order ${wo.woNumber}`);
    return { success: true, message: `Work Order ${wo.woNumber} released to shop floor.` };
  };

  // Record Operator Output
  const recordProductionOutput = async (workOrderId: string, station: string, goodQty: number, rejectedQty: number, reworkQty: number, rejectionReason?: string) => {
    try {
      const res = await api.manufacturing.logProduction(activeCompanyId, workOrderId, {
        station,
        goodQty,
        rejectedQty,
        reworkQty,
        rejectionReason
      });
      if (res.workOrder) {
        setWorkOrders(prev => prev.map(w => w.id === workOrderId ? res.workOrder : w));
      }
      if (res.productionEntry) {
        setProductionEntries(prev => [res.productionEntry, ...prev]);
      }
    } catch (err) {
      console.error('Failed to log production', err);
    }
  };

  // 7. QUALITY INSPECTION
  const createQualityInspection = async (
    refType: 'work_order' | 'grn',
    refId: string,
    itemId: string,
    status: 'passed' | 'failed' | 'conditional_pass',
    sampleSize: number,
    checkpoints: any[],
    rootCause?: string
  ): Promise<QualityInspection> => {
    try {
      const qc = await api.quality.createInspection(activeCompanyId, {
        refType,
        refId,
        itemId,
        status,
        sampleSize,
        checkpoints,
        rootCause
      });
      setQualityInspections(prev => [qc, ...prev]);
      return qc;
    } catch {
      const itm = items.find(i => i.id === itemId);
      const inspNumber = getNextNumber('QC', qualityInspections);

      const newQI: QualityInspection = {
        id: `qc-${Date.now()}`,
        companyId: activeCompany.id,
        inspectionNumber: inspNumber,
        referenceType: refType,
        referenceId: refId,
        referenceNumber: refId,
        itemId,
        itemName: itm?.name || 'Inspected Item',
        inspectorName: currentUser.name,
        inspectionDate: new Date().toISOString().split('T')[0],
        sampleSize,
        status,
        defectsFound: status === 'failed' ? 1 : 0,
        rootCauseAnalysis: rootCause,
        correctiveAction: status === 'passed' ? 'Approved for warehouse transfer' : 'Quarantine inspection lock engaged',
        checkpoints
      };

      setQualityInspections(prev => [newQI, ...prev]);
      return newQI;
    }
  };

  // 8. STOCK ADJUSTMENT (Physical counts)
  const adjustStock = async (itemId: string, warehouseId: string, quantityChange: number, reason: string) => {
    try {
      const res = await api.inventory.adjustStock(activeCompanyId, {
        itemId,
        warehouseId,
        quantityChange,
        reason
      });
      if (res.transaction) {
        setStockTransactions(prev => [res.transaction, ...prev]);
      }
      const updatedItems = await api.items.list(activeCompanyId);
      setItems(updatedItems);
    } catch (err) {
      console.error(err);
    }
  };

  // 9. PAYMENTS (Customer receipts & vendor payments)
  const recordPayment = async (type: 'customer_receipt' | 'supplier_payment', partnerId: string, partnerName: string, amount: number, mode: string, refNo: string, invoiceId?: string): Promise<Payment> => {
    try {
      const pay = await api.finance.recordPayment(activeCompanyId, {
        type,
        partnerId,
        partnerName,
        amount,
        mode,
        refNo,
        invoiceId
      });
      setPayments(prev => [pay, ...prev]);
      return pay;
    } catch {
      const payNumber = getNextNumber('PAY', payments);
      const newPay: Payment = {
        id: `pay-${Date.now()}`,
        companyId: activeCompany.id,
        paymentNumber: payNumber,
        paymentType: type,
        partnerId,
        partnerName,
        invoiceId,
        invoiceNumber: invoices.find(i => i.id === invoiceId)?.invoiceNumber,
        paymentDate: new Date().toISOString().split('T')[0],
        amount,
        paymentMode: mode as any,
        referenceNumber: refNo,
        status: 'completed'
      };
      setPayments(prev => [newPay, ...prev]);
      return newPay;
    }
  };

  // 10. MRP ENGINE (Rule-based material requirement planning)
  const calculateMRP = (): MRPRequirement[] => {
    const requirementsMap: Record<string, { grossRequired: number; uom: Item['uom'] }> = {};

    // Explode confirmed sales orders using BOM
    salesOrders
      .filter(so => ['confirmed', 'in_production'].includes(so.status))
      .forEach(so => {
        so.items.forEach(soItem => {
          const bom = boms.find(b => b.productId === soItem.itemId && b.isActive);
          if (bom) {
            bom.items.forEach(bItem => {
              const reqQty = bItem.quantityRequired * soItem.quantity * (1 + bItem.scrapPercentage / 100);
              if (!requirementsMap[bItem.itemId]) {
                requirementsMap[bItem.itemId] = { grossRequired: 0, uom: bItem.uom };
              }
              requirementsMap[bItem.itemId].grossRequired += reqQty;
            });
          }
        });
      });

    // Compute pending PO quantity
    const pendingPOMap: Record<string, number> = {};
    purchaseOrders
      .filter(po => ['ordered', 'partially_received'].includes(po.status))
      .forEach(po => {
        po.items.forEach(pItem => {
          const remaining = pItem.quantity - pItem.receivedQuantity;
          pendingPOMap[pItem.itemId] = (pendingPOMap[pItem.itemId] || 0) + remaining;
        });
      });

    const results: MRPRequirement[] = [];

    // Check all raw materials
    items.filter(itm => itm.category === 'raw_material').forEach(itm => {
      const grossReq = requirementsMap[itm.id]?.grossRequired || 0;
      const pendingPO = pendingPOMap[itm.id] || 0;
      const effectiveStock = itm.currentStock + pendingPO;
      const netShortage = Math.max(0, grossReq - effectiveStock);

      if (netShortage > 0 || itm.currentStock <= itm.reorderLevel) {
        const orderQty = Math.max(netShortage, itm.reorderQuantity);
        const supplier = suppliers[0]; // Primary preferred vendor

        results.push({
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          uom: itm.uom,
          grossRequired: grossReq,
          currentStock: itm.currentStock,
          pendingPOQuantity: pendingPO,
          netShortage,
          recommendedOrderQuantity: orderQty,
          suggestedSupplierId: supplier?.id,
          suggestedSupplierName: supplier?.name,
          estimatedCost: orderQty * itm.standardCost
        });
      }
    });

    return results;
  };

  // Convert MRP Shortages into Purchase Orders in 1-Click
  const generatePOsFromMRP = (shortages: MRPRequirement[]): number => {
    let createdCount = 0;
    shortages.forEach(sh => {
      if (sh.recommendedOrderQuantity > 0) {
        createPurchaseOrder({
          supplierId: sh.suggestedSupplierId || suppliers[0].id,
          supplierName: sh.suggestedSupplierName || suppliers[0].name,
          orderDate: new Date().toISOString().split('T')[0],
          expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          subtotal: sh.estimatedCost,
          notes: `Automated Purchase Order generated via FactoryFlow MRP Engine for shortage of ${sh.netShortage.toFixed(1)} ${sh.uom}`,
          items: [
            {
              id: `po-itm-${Date.now()}`,
              itemId: sh.itemId,
              itemCode: sh.itemCode,
              itemName: sh.itemName,
              quantity: sh.recommendedOrderQuantity,
              unitPrice: sh.estimatedCost / sh.recommendedOrderQuantity,
              gstRate: 18,
              taxAmount: sh.estimatedCost * 0.18,
              totalAmount: sh.estimatedCost * 1.18,
              receivedQuantity: 0
            }
          ]
        });
        createdCount++;
      }
    });
    return createdCount;
  };

  // Sync state with Supabase
  const syncWithSupabase = async () => {
    if (!supabase) return;
    try {
      // Upsert companies and items into live Supabase
      await supabase.from('companies').upsert({
        id: activeCompany.id,
        name: activeCompany.name,
        code: activeCompany.code,
        gstin: activeCompany.gstin,
        pan: activeCompany.pan,
        address: activeCompany.address
      });
      addAuditLog('UPDATE', 'SupabaseSync', activeCompany.id, 'Synced active company state to Supabase PostgreSQL');
    } catch (err) {
      console.error('Supabase sync error', err);
    }
  };

  const resetToDemoData = async () => {
    try {
      await api.admin.clearData(activeCompanyId);
    } catch {
      // ignore
    }
    localStorage.clear();
    setItems([]);
    setSalesOrders([]);
    setPurchaseOrders([]);
    setWorkOrders([]);
    setStockTransactions([]);
    setCustomers([]);
    setSuppliers([]);
    setBoms([]);
    setInvoices([]);
    setDeliveryChallans([]);
    setQualityInspections([]);
    window.location.reload();
  };

  // ---------------------------------------------------------------------------
  // Codozent One CRM Engine Actions
  // ---------------------------------------------------------------------------
  const refreshCrm = async () => {
    try {
      const [crmLds, flws] = await Promise.all([
        api.crm.listLeads(activeCompanyId),
        api.crm.listFollowups(activeCompanyId)
      ]);
      if (crmLds) setLeads(crmLds);
      if (flws) setCrmFollowups(flws);
    } catch (err) {
      console.error('Failed to refresh CRM', err);
    }
  };

  const createLead = async (lead: Partial<CrmLead>): Promise<CrmLead> => {
    try {
      const res = await api.crm.createLead(activeCompanyId, lead);
      setLeads(prev => [res, ...prev.filter(l => l.id !== res.id)]);
      if (res.nextFollowupDate) {
        api.crm.listFollowups(activeCompanyId).then(flws => setCrmFollowups(flws)).catch(() => { });
      }
      return res;
    } catch (err) {
      console.error('API createLead failed, local fallback used', err);
      const newLead: CrmLead = {
        id: `lead-${Date.now()}`,
        companyId: activeCompanyId,
        leadNumber: `LEAD-${new Date().getFullYear()}-${String(leads.length + 1).padStart(4, '0')}`,
        title: lead.title || `${lead.companyName || lead.contactName} - Inquiry`,
        contactName: lead.contactName || '',
        companyName: lead.companyName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || 'direct',
        dealValue: Number(lead.dealValue) || 0,
        winProbability: Number(lead.winProbability) || 30,
        priority: lead.priority || 'medium',
        status: lead.status || 'new',
        assignedTo: lead.assignedTo || 'Sales Head',
        consentGranted: lead.consentGranted ?? true,
        createdAt: new Date().toISOString(),
        ...lead
      } as CrmLead;
      setLeads(prev => [newLead, ...prev]);
      return newLead;
    }
  };

  const updateLead = async (id: string, updates: Partial<CrmLead>) => {
    try {
      await api.crm.updateLead(activeCompanyId, id, updates);
    } catch (err) {
      console.error('API updateLead error:', err);
    }
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
  };

  const deleteLead = async (id: string) => {
    try {
      await api.crm.deleteLead(activeCompanyId, id);
    } catch (err) {
      console.error('API deleteLead error:', err);
    }
    setLeads(prev => prev.filter(l => l.id !== id));
    setCrmFollowups(prev => prev.filter(f => f.leadId !== id));
  };

  const checkLeadDuplicate = async (data: { phone?: string; email?: string; companyName?: string; excludeId?: string }) => {
    try {
      return await api.crm.checkDuplicate(activeCompanyId, data);
    } catch {
      const normPhone = data.phone?.replace(/[^0-9]/g, '').slice(-10);
      const normEmail = data.email?.trim().toLowerCase();
      const normCompany = data.companyName?.trim().toLowerCase();
      const matches = leads.filter(l => {
        if (data.excludeId && l.id === data.excludeId) return false;
        const pMatch = normPhone && l.phone?.replace(/[^0-9]/g, '').slice(-10) === normPhone;
        const eMatch = normEmail && l.email && l.email.trim().toLowerCase() === normEmail;
        const cMatch = normCompany && l.companyName && l.companyName.trim().toLowerCase() === normCompany;
        return pMatch || eMatch || cMatch;
      });
      return { hasDuplicates: matches.length > 0, duplicates: matches };
    }
  };

  const createLeadFollowup = async (followup: Partial<CrmLeadFollowup>): Promise<CrmLeadFollowup> => {
    try {
      const res = await api.crm.createFollowup(activeCompanyId, followup);
      setCrmFollowups(prev => [res, ...prev]);
      if (followup.leadId && followup.scheduledDate) {
        setLeads(prev => prev.map(l => l.id === followup.leadId ? {
          ...l,
          nextFollowupDate: followup.scheduledDate,
          nextFollowupTime: followup.scheduledTime,
          nextFollowupType: followup.type
        } : l));
      }
      return res;
    } catch {
      const newFlw: CrmLeadFollowup = {
        id: `flw-${Date.now()}`,
        companyId: activeCompanyId,
        leadId: followup.leadId || '',
        scheduledDate: followup.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: followup.scheduledTime || '11:00',
        type: followup.type || 'call',
        assignedTo: followup.assignedTo || 'Sales Staff',
        title: followup.title || 'Follow-up',
        notes: followup.notes || '',
        isCompleted: false,
        createdAt: new Date().toISOString()
      };
      setCrmFollowups(prev => [newFlw, ...prev]);
      return newFlw;
    }
  };

  const updateLeadFollowup = async (id: string, updates: Partial<CrmLeadFollowup>) => {
    try {
      await api.crm.updateFollowup(activeCompanyId, id, updates);
    } catch { }
    setCrmFollowups(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addLeadActivity = async (leadId: string, activity: Partial<CrmLeadActivity>) => {
    try {
      await api.crm.createActivity(activeCompanyId, leadId, activity);
    } catch { }
  };

  const convertLeadToQuotationDraft = async (leadId: string): Promise<{ quotation: Quotation; customer: any; lead: CrmLead } | null> => {
    try {
      const res = await api.crm.convertToQuotation(activeCompanyId, leadId);
      if (res?.data) {
        setQuotations(prev => [res.data.quotation, ...prev]);
        setCustomers(prev => {
          if (!prev.some(c => c.id === res.data.customer.id)) {
            return [res.data.customer, ...prev];
          }
          return prev;
        });
        setLeads(prev => prev.map(l => l.id === leadId ? res.data.lead : l));
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Error converting lead to quotation draft:', err);
      return null;
    }
  };

  const importLeadsBatch = async (rows: any[], skipDuplicates = true) => {
    const res = await api.crm.importLeads(activeCompanyId, rows, skipDuplicates);
    await refreshCrm();
    return res;
  };

  // Work Actions
  const createProject = async (project: Omit<WorkProject, 'id' | 'companyId' | 'progressPercentage'>): Promise<WorkProject> => {
    try {
      const res = await api.work.createProject(activeCompanyId, project);
      setProjects(prev => [res, ...prev]);
      return res;
    } catch {
      const newProj: WorkProject = {
        ...project,
        id: `proj-${Date.now()}`,
        companyId: activeCompanyId,
        progressPercentage: 0
      };
      setProjects(prev => [newProj, ...prev]);
      return newProj;
    }
  };

  const createTask = async (task: Omit<WorkTask, 'id' | 'companyId' | 'loggedHours'>): Promise<WorkTask> => {
    try {
      const res = await api.work.createTask(activeCompanyId, task);
      setTasks(prev => [res, ...prev]);
      return res;
    } catch {
      const newTask: WorkTask = {
        ...task,
        id: `task-${Date.now()}`,
        companyId: activeCompanyId,
        loggedHours: 0
      };
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    }
  };

  const updateTask = async (id: string, updates: Partial<WorkTask>) => {
    try {
      await api.work.updateTask(activeCompanyId, id, updates);
    } catch { }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Quotations Actions (Full Lifecycle, Revision, Approval & SO Conversion)
  const refreshQuotations = async () => {
    try {
      const res = await api.sales.listQuotations(activeCompanyId);
      if (res && Array.isArray(res)) {
        setQuotations(res);
      } else if (res && res.data && Array.isArray(res.data)) {
        setQuotations(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh quotations:', err);
    }
  };

  const createQuotation = async (quo: any): Promise<Quotation> => {
    try {
      const res = await api.sales.createQuotation(activeCompanyId, quo);
      const created = res.data || res;
      setQuotations(prev => [created, ...prev]);
      addAuditLog('CREATE', 'Quotation', created.id, `Created quotation ${created.quotationNumber} (${created.revision})`);
      return created;
    } catch {
      const newQuo: Quotation = {
        ...quo,
        id: `quo-${Date.now()}`,
        companyId: activeCompanyId,
        quotationNumber: `QT-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(5, '0')}`,
        quotationFamilyId: `QT-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(5, '0')}`,
        revisionNumber: 0,
        revision: 'Rev 0',
        quoteDate: new Date().toISOString().split('T')[0],
        status: quo.status || 'draft',
        createdBy: currentUser.name
      };
      setQuotations(prev => [newQuo, ...prev]);
      return newQuo;
    }
  };

  const updateQuotation = async (id: string, updates: any): Promise<Quotation> => {
    try {
      const res = await api.sales.updateQuotation(activeCompanyId, id, updates);
      const updated = res.data || res;
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      addAuditLog('UPDATE', 'Quotation', id, `Updated quotation ${updated.quotationNumber}`);
      return updated;
    } catch (err: any) {
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q));
      const found = quotations.find(q => q.id === id);
      return { ...found, ...updates } as Quotation;
    }
  };

  const createQuotationRevision = async (id: string, reason: string, updates: any = {}): Promise<Quotation> => {
    try {
      const res = await api.sales.createRevision(activeCompanyId, id, reason, updates);
      const newRev = res.data || res;
      if (res.previous) {
        setQuotations(prev => [newRev, ...prev.map(q => q.id === res.previous.id ? res.previous : q)]);
      } else {
        setQuotations(prev => [newRev, ...prev.map(q => q.id === id ? { ...q, status: 'superseded' } : q)]);
      }
      addAuditLog('CREATE', 'QuotationRevision', newRev.id, `Created revision ${newRev.revision} for ${newRev.quotationNumber}. Reason: ${reason}`);
      return newRev;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create quotation revision');
    }
  };

  const updateQuotationStatus = async (id: string, status: QuotationStatus, metadata: any = {}): Promise<Quotation> => {
    try {
      const res = await api.sales.updateStatus(activeCompanyId, id, status, metadata);
      const updated = res.data || res;
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      addAuditLog('UPDATE', 'Quotation', id, `Changed quotation status to ${status}`);
      return updated;
    } catch (err: any) {
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, status, updatedAt: new Date().toISOString() } : q));
      const found = quotations.find(q => q.id === id);
      return { ...found, status } as Quotation;
    }
  };

  const approveQuotation = async (id: string, comments?: string): Promise<Quotation> => {
    try {
      const res = await api.sales.approveQuotation(activeCompanyId, id, comments);
      const updated = res.data || res;
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      addAuditLog('UPDATE', 'Quotation', id, `Approved quotation ${updated.quotationNumber}`);
      return updated;
    } catch (err: any) {
      return updateQuotationStatus(id, 'approved', { comments });
    }
  };

  const rejectQuotation = async (id: string, reason?: string): Promise<Quotation> => {
    try {
      const res = await api.sales.rejectQuotation(activeCompanyId, id, reason);
      const updated = res.data || res;
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      addAuditLog('UPDATE', 'Quotation', id, `Rejected quotation ${updated.quotationNumber}. Reason: ${reason}`);
      return updated;
    } catch (err: any) {
      return updateQuotationStatus(id, 'rejected', { reason });
    }
  };

  const sendQuotation = async (id: string, sentVia: 'email' | 'whatsapp' | 'manual' = 'email', comments?: string): Promise<Quotation> => {
    try {
      const res = await api.sales.sendQuotation(activeCompanyId, id, sentVia, comments);
      const updated = res.data || res;
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      addAuditLog('UPDATE', 'Quotation', id, `Dispatched quotation ${updated.quotationNumber} via ${sentVia}`);
      return updated;
    } catch (err: any) {
      return updateQuotationStatus(id, 'sent', { sentVia, comments });
    }
  };

  const recordCustomerResponse = async (id: string, response: 'accepted' | 'rejected' | 'revision_requested', reason?: string, comments?: string): Promise<Quotation> => {
    try {
      const res = await api.sales.recordCustomerResponse(activeCompanyId, id, response, reason, comments);
      const updated = res.data || res;
      setQuotations(prev => prev.map(q => q.id === id ? updated : q));
      addAuditLog('UPDATE', 'Quotation', id, `Customer response: ${response} for ${updated.quotationNumber}`);
      return updated;
    } catch (err: any) {
      return updateQuotationStatus(id, response as QuotationStatus, { reason, comments });
    }
  };

  const duplicateQuotation = async (id: string): Promise<Quotation> => {
    try {
      const res = await api.sales.duplicateQuotation(activeCompanyId, id);
      const duplicated = res.data || res;
      setQuotations(prev => [duplicated, ...prev]);
      addAuditLog('CREATE', 'Quotation', duplicated.id, `Duplicated quotation to ${duplicated.quotationNumber}`);
      return duplicated;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to duplicate quotation');
    }
  };

  const convertQuotationToOrder = async (quotationId: string): Promise<SalesOrder> => {
    try {
      const res = await api.sales.convertToOrder(activeCompanyId, quotationId);
      if (res && res.data) {
        const { order, quotation } = res.data;
        setQuotations(prev => prev.map(q => q.id === quotationId ? quotation : q));
        setSalesOrders(prev => [order, ...prev]);
        addAuditLog('CREATE', 'SalesOrder', order.id, `Converted quotation ${quotation.quotationNumber} to Sales Order ${order.soNumber}`);
        return order;
      }
    } catch (apiErr) {
      console.warn('API convert to order failed, using fallback:', apiErr);
    }

    const quo = quotations.find(q => q.id === quotationId);
    if (!quo) throw new Error('Quotation not found');

    const newSO = await createSalesOrder({
      customerId: quo.customerId,
      customerName: quo.customerName,
      customerPoNumber: quo.referenceNumber || quo.quotationNumber,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: quo.validUntil,
      subtotal: quo.taxableAmount || quo.subtotal,
      notes: `Converted from Quotation ${quo.quotationNumber} (${quo.revision}). Terms: ${quo.paymentTerms || ''}`,
      items: quo.items.map(it => ({
        id: `so-itm-${Date.now()}-${it.itemId || 'part'}`,
        itemId: it.itemId || 'custom-mfg',
        itemCode: it.itemCode,
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        gstRate: it.gstRate,
        taxAmount: it.taxAmount,
        totalAmount: it.totalAmount,
        shippedQuantity: 0
      }))
    });

    setQuotations(prev => prev.map(q => q.id === quotationId ? {
      ...q,
      status: 'converted_to_order',
      convertedSalesOrderId: newSO.id,
      convertedSalesOrderNumber: newSO.soNumber
    } : q));
    return newSO;
  };

  const addQuotationAttachment = async (quotationId: string, attachment: any): Promise<any> => {
    try {
      const res = await api.sales.addAttachment(activeCompanyId, quotationId, attachment);
      const added = res.data || res;
      setQuotations(prev => prev.map(q => {
        if (q.id === quotationId) {
          const currentAtts = q.attachments || [];
          return { ...q, attachments: [...currentAtts, added] };
        }
        return q;
      }));
      return added;
    } catch (err: any) {
      throw new Error(err.message || 'Failed to add attachment');
    }
  };

  const deleteQuotation = async (id: string): Promise<void> => {
    try {
      await api.sales.deleteQuotation(activeCompanyId, id);
    } catch { }
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: 'cancelled' } : q));
    addAuditLog('DELETE', 'Quotation', id, 'Cancelled quotation');
  };

  // Khatabook Actions
  const createKhataEntry = async (entry: Omit<KhataEntry, 'id' | 'companyId' | 'entryDate'>): Promise<KhataEntry> => {
    try {
      const res = await api.khatabook.createEntry(activeCompanyId, entry);
      setKhataEntries(prev => [res, ...prev]);
      return res;
    } catch {
      const newEntry: KhataEntry = {
        ...entry,
        id: `khata-${Date.now()}`,
        companyId: activeCompanyId,
        entryDate: new Date().toISOString().split('T')[0]
      };
      setKhataEntries(prev => [newEntry, ...prev]);
      return newEntry;
    }
  };

  const sendKhataWhatsApp = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.khatabook.sendWhatsAppReminder(activeCompanyId, id);
      setKhataEntries(prev => prev.map(e => e.id === id ? { ...e, whatsappSent: true } : e));
      return { success: true, message: res.message || 'WhatsApp reminder sent' };
    } catch (err: any) {
      setKhataEntries(prev => prev.map(e => e.id === id ? { ...e, whatsappSent: true } : e));
      return { success: true, message: 'WhatsApp reminder queued with UPI payment link.' };
    }
  };

  // GST 2B Action
  const update2BAction = async (id: string, action: 'claim' | 'hold' | 'reverse') => {
    try {
      await api.gst.update2BAction(activeCompanyId, id, action);
    } catch { }
    setGst2bRecords(prev => prev.map(r => r.id === id ? { ...r, itcAction: action } : r));
  };

  // CA Desk Actions
  const createCAQuery = async (query: Omit<CADeskQuery, 'id' | 'companyId' | 'status' | 'createdAt'>): Promise<CADeskQuery> => {
    try {
      const res = await api.caDesk.createQuery(activeCompanyId, query);
      setCaQueries(prev => [res, ...prev]);
      return res;
    } catch {
      const newQ: CADeskQuery = {
        ...query,
        id: `ca-q-${Date.now()}`,
        companyId: activeCompanyId,
        status: 'open',
        createdAt: new Date().toISOString()
      };
      setCaQueries(prev => [newQ, ...prev]);
      return newQ;
    }
  };

  const answerCAQuery = async (id: string, clientResponse: string) => {
    try {
      await api.caDesk.answerQuery(activeCompanyId, id, clientResponse);
    } catch { }
    setCaQueries(prev => prev.map(q => q.id === id ? { ...q, clientResponse, status: 'answered' } : q));
  };

  // Counter POS Actions
  const checkoutCounter = async (sale: any): Promise<CounterSale> => {
    try {
      const res = await api.counter.checkout(activeCompanyId, sale);
      setCounterSales(prev => [res, ...prev]);
      return res;
    } catch {
      const newSale: CounterSale = {
        ...sale,
        id: `sale-${Date.now()}`,
        companyId: activeCompanyId,
        receiptNumber: `POS-${new Date().getFullYear()}-${String(counterSales.length + 1).padStart(5, '0')}`,
        timestamp: new Date().toISOString()
      };
      setCounterSales(prev => [newSale, ...prev]);
      return newSale;
    }
  };

  // HRMS Actions
  const createEmployee = async (emp: Omit<HrmsEmployee, 'id' | 'companyId' | 'employeeCode' | 'status' | 'joiningDate'>): Promise<HrmsEmployee> => {
    try {
      const res = await api.hrms.createEmployee(activeCompanyId, emp);
      setEmployees(prev => [res, ...prev]);
      return res;
    } catch {
      const newEmp: HrmsEmployee = {
        ...emp,
        id: `emp-${Date.now()}`,
        companyId: activeCompanyId,
        employeeCode: `EMP-${String(employees.length + 1).padStart(4, '0')}`,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      setEmployees(prev => [newEmp, ...prev]);
      return newEmp;
    }
  };

  const recordAttendance = async (att: Omit<HrmsAttendanceRecord, 'id' | 'companyId'>) => {
    try {
      await api.hrms.recordAttendance(activeCompanyId, att);
    } catch { }
    const newRecord: HrmsAttendanceRecord = {
      ...att,
      id: `att-${Date.now()}-${att.employeeId}`,
      companyId: activeCompanyId
    };
    setAttendance(prev => {
      const idx = prev.findIndex(a => a.employeeId === att.employeeId && a.date === att.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRecord;
        return copy;
      }
      return [newRecord, ...prev];
    });
  };

  const runPayroll = async (month?: string) => {
    const runMonth = month || 'March 2026';
    try {
      const res = await api.hrms.runPayroll(activeCompanyId, runMonth);
      if (res.data) setPayrolls(res.data);
    } catch {
      const mockPayrolls: HrmsPayrollItem[] = employees.map(emp => {
        const basic = emp.basicPay;
        const pf = Math.round(basic * 0.12);
        const esi = Math.round(emp.monthlyGrossSalary * 0.0075);
        const pt = 200;
        return {
          id: `pay-${Date.now()}-${emp.id}`,
          employeeId: emp.id,
          employeeName: emp.name,
          employeeCode: emp.employeeCode,
          month: runMonth,
          workingDays: 26,
          daysPresent: 26,
          grossSalary: emp.monthlyGrossSalary,
          basic,
          hra: emp.hra,
          pfDeduction: pf,
          esiDeduction: esi,
          professionalTax: pt,
          salaryAdvanceDeduction: 0,
          netPayable: emp.monthlyGrossSalary - pf - esi - pt,
          status: 'processed'
        };
      });
      setPayrolls(mockPayrolls);
    }
  };

  // Support Actions
  const createSupportTicket = async (ticket: any): Promise<SupportTicket> => {
    try {
      const res = await api.support.createTicket(activeCompanyId, ticket);
      setSupportTickets(prev => [res, ...prev]);
      return res;
    } catch {
      const newTck: SupportTicket = {
        ...ticket,
        id: `tck-${Date.now()}`,
        companyId: activeCompanyId,
        ticketNumber: `TCK-${new Date().getFullYear()}-${String(supportTickets.length + 1).padStart(4, '0')}`,
        status: 'open',
        createdAt: new Date().toISOString(),
        slaHoursRemaining: 24,
        messages: [{ id: `msg-${Date.now()}`, sender: ticket.customerName, senderType: 'customer', message: ticket.subject, timestamp: new Date().toISOString() }]
      };
      setSupportTickets(prev => [newTck, ...prev]);
      return newTck;
    }
  };

  const replySupportTicket = async (id: string, message: string) => {
    try {
      await api.support.replyTicket(activeCompanyId, id, { sender: currentUser.name, senderType: 'staff', message });
    } catch { }
    setSupportTickets(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          messages: [...t.messages, { id: `msg-${Date.now()}`, sender: currentUser.name, senderType: 'staff', message, timestamp: new Date().toISOString() }]
        };
      }
      return t;
    }));
  };

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      await api.support.updateStatus(activeCompanyId, id, status);
    } catch { }
    setSupportTickets(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
  };

  // AI Assistant Copilot
  const askAssistant = async (query: string): Promise<{ reply: string; actionSuggested?: any }> => {
    try {
      const res = await api.assistant.chat(activeCompanyId, query);
      return res;
    } catch (err: any) {
      return {
        reply: `Codozent One AI Copilot: Query processed locally. Found active tenant workspace '${activeCompany.name}' with ISO/GST statutory verification enabled.`,
        actionSuggested: { title: 'Open Overview', module: 'dashboard' }
      };
    }
  };

  // Master SOP Actions
  const createWorkCenter = async (wc: Omit<WorkCenter, 'id' | 'companyId'>): Promise<WorkCenter> => {
    try {
      const created = await api.manufacturing.createWorkCenter(activeCompanyId, wc);
      setWorkCenters(prev => [...prev, created]);
      addAuditLog('CREATE', 'WorkCenter', created.id, `Created work center ${created.name} (${created.code})`);
      return created;
    } catch {
      const newWc: WorkCenter = {
        ...wc,
        id: `wc-${Date.now()}`,
        companyId: activeCompanyId,
        qrCode: `QR-WC-${wc.code || Date.now()}`
      };
      setWorkCenters(prev => [...prev, newWc]);
      addAuditLog('CREATE', 'WorkCenter', newWc.id, `Created work center ${newWc.name} (local)`);
      return newWc;
    }
  };

  const updateWorkCenter = async (id: string, updates: Partial<WorkCenter>): Promise<WorkCenter> => {
    try {
      const updated = await api.manufacturing.updateWorkCenter(activeCompanyId, id, updates);
      setWorkCenters(prev => prev.map(w => w.id === id ? updated : w));
      addAuditLog('UPDATE', 'WorkCenter', id, `Updated work center`);
      return updated;
    } catch {
      let updatedWc: WorkCenter = {} as any;
      setWorkCenters(prev => prev.map(w => {
        if (w.id === id) {
          updatedWc = { ...w, ...updates };
          return updatedWc;
        }
        return w;
      }));
      return updatedWc;
    }
  };

  const deleteWorkCenter = async (id: string): Promise<void> => {
    try {
      await api.manufacturing.deleteWorkCenter(activeCompanyId, id);
    } catch { }
    setWorkCenters(prev => prev.filter(w => w.id !== id));
    addAuditLog('DELETE', 'WorkCenter', id, `Deleted work center`);
  };

  const createRFQ = async (rfqData: { items: any[]; targetDeliveryDate?: string; notes?: string }): Promise<RFQ> => {
    try {
      const created = await api.purchase.createRFQ(activeCompanyId, rfqData);
      setRfqs(prev => [created, ...prev]);
      addAuditLog('CREATE', 'RFQ', created.id, `Created RFQ ${created.rfqNumber}`);
      return created;
    } catch {
      const newRfq: RFQ = {
        id: `rfq-${Date.now()}`,
        companyId: activeCompanyId,
        rfqNumber: `RFQ-${String(rfqs.length + 1).padStart(4, '0')}`,
        status: 'open',
        items: rfqData.items,
        quotes: [],
        targetDeliveryDate: rfqData.targetDeliveryDate,
        notes: rfqData.notes,
        createdAt: new Date().toISOString()
      };
      setRfqs(prev => [newRfq, ...prev]);
      return newRfq;
    }
  };

  const addQuoteToRFQ = async (rfqId: string, quote: Omit<RFQQuote, 'id' | 'receivedAt'>): Promise<RFQ> => {
    try {
      const updated = await api.purchase.addQuoteToRFQ(activeCompanyId, rfqId, quote);
      setRfqs(prev => prev.map(r => r.id === rfqId ? updated : r));
      addAuditLog('UPDATE', 'RFQ', rfqId, `Added quote from ${quote.supplierName}`);
      return updated;
    } catch {
      let updatedRfq: RFQ = {} as any;
      setRfqs(prev => prev.map(r => {
        if (r.id === rfqId) {
          const quotes = [...r.quotes, { ...quote, id: `quote-${Date.now()}`, receivedAt: new Date().toISOString() }];
          updatedRfq = { ...r, quotes, status: 'quotes_received' };
          return updatedRfq;
        }
        return r;
      }));
      return updatedRfq;
    }
  };

  const awardRFQ = async (rfqId: string, quoteId: string): Promise<{ rfq: RFQ; po: PurchaseOrder }> => {
    const res = await api.purchase.awardRFQ(activeCompanyId, rfqId, quoteId);
    setRfqs(prev => prev.map(r => r.id === rfqId ? res.rfq : r));
    setPurchaseOrders(prev => [res.po, ...prev]);
    addAuditLog('AWARD', 'RFQ', rfqId, `Awarded RFQ to PO ${res.po.poNumber}`);
    return res;
  };

  const raiseProforma = async (salesOrderId: string, advancePercentage: number = 20): Promise<SalesOrder> => {
    const updated = await api.sales.raiseProforma(activeCompanyId, salesOrderId, advancePercentage);
    setSalesOrders(prev => prev.map(s => s.id === salesOrderId ? updated : s));
    addAuditLog('PROFORMA', 'SalesOrder', salesOrderId, `Raised Proforma Invoice ${updated.proformaNumber} (${advancePercentage}% advance)`);
    return updated;
  };

  const recordAdvancePayment = async (salesOrderId: string, amount: number, paymentMode: string, utrRef: string): Promise<SalesOrder> => {
    const updated = await api.sales.recordAdvancePayment(activeCompanyId, salesOrderId, { amount, paymentMode, utrRef });
    setSalesOrders(prev => prev.map(s => s.id === salesOrderId ? updated : s));
    addAuditLog('PAYMENT', 'SalesOrder', salesOrderId, `Recorded advance payment ₹${amount.toLocaleString('en-IN')} (UTR: ${utrRef})`);
    return updated;
  };

  const getWhatToBuy = async (): Promise<any[]> => {
    try {
      return await api.manufacturing.getWhatToBuy(activeCompanyId);
    } catch {
      return [];
    }
  };

  return (
    <ERPContext.Provider
      value={{
        isAuthenticated,
        login,
        register,
        onboard,
        pendingGoogleProfile,
        clearPendingGoogleProfile,
        loginWithGoogle,
        selectCompany,
        createCompany,
        logout,
        companies,
        activeCompany,
        setActiveCompanyId,
        updateCompany,
        currentUser,
        currentRole,
        setCurrentRole,
        canAccess,
        items,
        warehouses,
        customers,
        suppliers,
        boms,
        createCustomer,
        createSupplier,
        createItem,
        createBOM,
        salesOrders,
        purchaseOrders,
        purchaseRequisitions,
        vendorQuotations,
        purchaseBills,
        grns,
        workOrders,
        productionEntries,
        qualityInspections,
        stockTransactions,
        invoices,
        payments,
        deliveryChallans,
        chartOfAccounts,
        auditLogs,
        createSalesOrder,
        updateSalesOrderStatus,
        cancelSalesOrder,
        createDeliveryChallan,
        createSalesInvoiceFromOrder,
        createPurchaseOrder,
        updatePurchaseOrderStatus,
        cancelPurchaseOrder,
        createPurchaseRequisition,
        updatePurchaseRequisitionStatus,
        createVendorQuotation,
        createPurchaseBill,
        createGRN,
        createWorkOrder,
        startWorkOrder,
        recordProductionOutput,
        createQualityInspection,
        adjustStock,
        recordPayment,
        calculateMRP,
        generatePOsFromMRP,
        isCloudConnected,
        syncWithSupabase,
        resetToDemoData,
        // Master SOP Additions
        workCenters,
        createWorkCenter,
        updateWorkCenter,
        deleteWorkCenter,
        rfqs,
        createRFQ,
        addQuoteToRFQ,
        awardRFQ,
        raiseProforma,
        recordAdvancePayment,
        getWhatToBuy,
        // Codozent One CRM Engine
        leads,
        crmFollowups,
        createLead,
        updateLead,
        deleteLead,
        checkLeadDuplicate,
        createLeadFollowup,
        updateLeadFollowup,
        addLeadActivity,
        convertLeadToQuotationDraft,
        importLeadsBatch,
        refreshCrm,
        projects,
        createProject,
        tasks,
        createTask,
        updateTask,
        quotations,
        createQuotation,
        updateQuotation,
        createQuotationRevision,
        updateQuotationStatus,
        approveQuotation,
        rejectQuotation,
        sendQuotation,
        recordCustomerResponse,
        duplicateQuotation,
        convertQuotationToOrder,
        addQuotationAttachment,
        deleteQuotation,
        refreshQuotations,
        khataEntries,
        createKhataEntry,
        sendKhataWhatsApp,
        gstSummary,
        gst2bRecords,
        update2BAction,
        caQueries,
        createCAQuery,
        answerCAQuery,
        msmeScrutiny,
        scheduleIII,
        counterSales,
        checkoutCounter,
        employees,
        createEmployee,
        attendance,
        recordAttendance,
        payrolls,
        runPayroll,
        supportTickets,
        createSupportTicket,
        replySupportTicket,
        updateTicketStatus,
        askAssistant,
        installedModules,
        installModule,
        uninstallModule,
        isModuleInstalled,
        resetModulesToDefault,
        companyUsers,
        companyBranches,
        loadAccessData,
        allotUserAccess,
        verifyUserAccess,
        createBranch
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used within an ERPProvider');
  return context;
};
