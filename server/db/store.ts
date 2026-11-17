import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  Company,
  CompanyUser,
  Warehouse,
  Item,
  BillOfMaterials,
  Customer,
  Supplier,
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
  Quotation,
  QuotationItem,
  QuotationRevision,
  QuotationActivity,
  QuotationAttachment,
  QuotationApproval,
  QuotationStatus,
  GeneralLedgerEntry,
  AuditLog,
  CrmLead,
  CrmLeadActivity,
  CrmLeadFollowup,
  CrmLeadDocument,
  CrmScoreFactor,
  WorkProject,
  WorkTask,
  KhataEntry,
  Gst2BMatchRecord,
  CADeskQuery,
  CounterSale,
  HrmsEmployee,
  HrmsAttendanceRecord,
  HrmsPayrollItem,
  SupportTicket,
  WorkCenter,
  RFQ,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  VendorQuotation,
  VendorQuoteItem,
  PurchaseBill,
  SalesOrderStatus,
  SalesOrderStatusHistory
} from '../../src/types/erp';
import { numberToIndianWords, isIntraStateGst } from '../../src/utils/indianCurrency';
import { env } from '../config/env';

interface ERPDatabaseSchema {
  companies: Company[];
  users: CompanyUser[];
  warehouses: Warehouse[];
  items: Item[];
  boms: BillOfMaterials[];
  workCenters: WorkCenter[];
  rfqs: RFQ[];
  customers: Customer[];
  suppliers: Supplier[];
  quotations: Quotation[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  grns: GoodsReceiptNote[];
  workOrders: WorkOrder[];
  productionEntries: ProductionEntry[];
  qualityInspections: QualityInspection[];
  stockTransactions: StockTransaction[];
  invoices: Invoice[];
  payments: Payment[];
  deliveryChallans: DeliveryChallan[];
  chartOfAccounts: ChartOfAccount[];
  ledgerEntries: GeneralLedgerEntry[];
  auditLogs: AuditLog[];
  sequences: Record<string, number>; // e.g. "comp-apex-01:sales_order" -> 1
  leads: CrmLead[];
  crmActivities: CrmLeadActivity[];
  crmFollowups: CrmLeadFollowup[];
  crmDocuments: CrmLeadDocument[];
  projects: WorkProject[];
  tasks: WorkTask[];
  khataEntries: KhataEntry[];
  gst2bRecords: Gst2BMatchRecord[];
  caQueries: CADeskQuery[];
  counterSales: CounterSale[];
  employees: HrmsEmployee[];
  attendance: HrmsAttendanceRecord[];
  payrolls: HrmsPayrollItem[];
  tickets: SupportTicket[];
  purchaseRequisitions: PurchaseRequisition[];
  vendorQuotations: VendorQuotation[];
  purchaseBills: PurchaseBill[];
  tradeActivities: any[];
  tenants: any[];
  branches: any[];
  companyModules: any[];
  roles: any[];
  rolePermissions: any[];
  userRoleAssignments: any[];
}

const DATA_FILE_PATH = path.resolve(process.cwd(), 'server/data/factoryflow-data.json');

// Default initial state: Clean production start with ZERO dummy records.
const INITIAL_CLEAN_DATABASE: ERPDatabaseSchema = {
  companies: [],
  users: [],
  warehouses: [],
  items: [],
  boms: [],
  workCenters: [],
  rfqs: [],
  customers: [],
  suppliers: [],
  quotations: [],
  salesOrders: [],
  purchaseOrders: [],
  grns: [],
  workOrders: [],
  productionEntries: [],
  qualityInspections: [],
  stockTransactions: [],
  invoices: [],
  payments: [],
  deliveryChallans: [],
  chartOfAccounts: [],
  ledgerEntries: [],
  auditLogs: [],
  sequences: {},
  leads: [],
  crmActivities: [],
  crmFollowups: [],
  crmDocuments: [],
  projects: [],
  tasks: [],
  khataEntries: [],
  gst2bRecords: [],
  caQueries: [],
  counterSales: [],
  employees: [],
  attendance: [],
  payrolls: [],
  tickets: [],
  purchaseRequisitions: [],
  vendorQuotations: [],
  purchaseBills: [],
  tradeActivities: [],
  tenants: [],
  branches: [],
  companyModules: [],
  roles: [],
  rolePermissions: [],
  userRoleAssignments: []
};

class ERPStore {
  private data: ERPDatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): ERPDatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        const data: ERPDatabaseSchema = {
          ...INITIAL_CLEAN_DATABASE,
          ...parsed,
          leads: parsed.leads || [],
          crmActivities: parsed.crmActivities || [],
          crmFollowups: parsed.crmFollowups || [],
          crmDocuments: parsed.crmDocuments || [],
          projects: parsed.projects || [],
          tasks: parsed.tasks || [],
          workCenters: parsed.workCenters || [],
          rfqs: parsed.rfqs || [],
          khataEntries: parsed.khataEntries || [],
          gst2bRecords: parsed.gst2bRecords || [],
          caQueries: parsed.caQueries || [],
          counterSales: parsed.counterSales || [],
          employees: parsed.employees || [],
          attendance: parsed.attendance || [],
          payrolls: parsed.payrolls || [],
          tickets: parsed.tickets || [],
          purchaseRequisitions: parsed.purchaseRequisitions || [],
          vendorQuotations: parsed.vendorQuotations || [],
          purchaseBills: parsed.purchaseBills || [],
          tradeActivities: parsed.tradeActivities || []
        };

        this.saveData(data);
        return data;
      }
    } catch (err) {
      console.warn('[Database] Could not read JSON store file, initializing clean database state.', err);
    }

    // Save clean initial state to disk
    const freshData = { ...INITIAL_CLEAN_DATABASE };
    this.saveData(freshData);
    return freshData;
  }

  private saveData(dataToSave: ERPDatabaseSchema): void {
    try {
      const dir = path.dirname(DATA_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to write database to disk:', err);
    }
  }

  private persist(): void {
    this.saveData(this.data);
  }

  // ---------------------------------------------------------------------------
  // Document Sequencing (Concurrency-safe)
  // ---------------------------------------------------------------------------
  public getNextSequence(companyId: string, prefix: string, docType: string): string {
    const key = `${companyId}:${docType}`;
    const nextVal = (this.data.sequences[key] || 0) + 1;
    this.data.sequences[key] = nextVal;
    this.persist();

    const year = new Date().getFullYear();
    const formattedNum = String(nextVal).padStart(4, '0');
    return `${prefix}-${year}-${formattedNum}`;
  }

  // ---------------------------------------------------------------------------
  // Companies
  // ---------------------------------------------------------------------------
  public getCompanies(): Company[] {
    return this.data.companies;
  }

  public getUserCompanies(userIdOrEmail: string): Company[] {
    const term = (userIdOrEmail || '').toLowerCase().trim();
    const matchingUsers = this.data.users.filter(
      u => u.id === userIdOrEmail || u.email.toLowerCase().trim() === term
    );

    const allowedIds = new Set<string>();
    for (const u of matchingUsers) {
      if (u.companyId) allowedIds.add(u.companyId);
      if (u.companyIds && Array.isArray(u.companyIds)) {
        for (const cid of u.companyIds) allowedIds.add(cid);
      }
    }

    if (allowedIds.size === 0) {
      const byEmail = this.data.companies.filter(c => (c.email || '').toLowerCase().trim() === term);
      if (byEmail.length > 0) return byEmail;
      return [];
    }

    return this.data.companies.filter(c => allowedIds.has(c.id));
  }

  public getCompany(id: string): Company | undefined {
    return this.data.companies.find(c => c.id === id);
  }

  public addCompany(company: Company): Company {
    this.data.companies.push(company);
    this.persist();
    return company;
  }

  public updateCompany(id: string, updates: Partial<Company>): Company | undefined {
    const index = this.data.companies.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    this.data.companies[index] = { ...this.data.companies[index], ...updates };
    this.persist();
    return this.data.companies[index];
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  public getUsers(companyId?: string): CompanyUser[] {
    if (companyId) return this.data.users.filter(u => u.companyId === companyId);
    return this.data.users;
  }

  public getUserByEmail(email: string): CompanyUser | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): CompanyUser | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public addUser(user: CompanyUser): CompanyUser {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUser(id: string, updates: Partial<CompanyUser>): CompanyUser | undefined {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.persist();
    return this.data.users[index];
  }

  // ---------------------------------------------------------------------------
  // Branches (Multi-Branch & Plant Segregation)
  // ---------------------------------------------------------------------------
  public getBranches(companyId: string): any[] {
    if (!this.data.branches) this.data.branches = [];
    return this.data.branches.filter(b => b.companyId === companyId);
  }

  public addBranch(branch: any): any {
    if (!this.data.branches) this.data.branches = [];
    this.data.branches.push(branch);
    this.persist();
    return branch;
  }

  // ---------------------------------------------------------------------------
  // Company Modules (Plug-and-Play Activation)
  // ---------------------------------------------------------------------------
  public getCompanyModules(companyId: string): any[] {
    if (!this.data.companyModules) this.data.companyModules = [];
    return this.data.companyModules.filter(m => m.companyId === companyId);
  }

  public isModuleEnabled(companyId: string, moduleId: string): boolean {
    if (!this.data.companyModules) this.data.companyModules = [];
    const record = this.data.companyModules.find(m => m.companyId === companyId && m.moduleId === moduleId);
    if (!record) {
      // Core default modules
      const defaults = ['dashboard', 'crm', 'quotations', 'sales', 'purchase', 'inventory', 'manufacturing', 'work', 'finance', 'khatabook', 'gst', 'cadesk', 'hrms', 'support', 'reports', 'settings', 'marketplace'];
      return defaults.includes(moduleId);
    }
    return record.status === 'enabled';
  }

  public setCompanyModuleStatus(companyId: string, moduleId: string, status: 'enabled' | 'disabled', settings?: any): any {
    if (!this.data.companyModules) this.data.companyModules = [];
    const idx = this.data.companyModules.findIndex(m => m.companyId === companyId && m.moduleId === moduleId);
    const updated = {
      id: idx !== -1 ? this.data.companyModules[idx].id : `cmod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      companyId,
      moduleId,
      status,
      settings: settings || (idx !== -1 ? this.data.companyModules[idx].settings : {}),
      updatedAt: new Date().toISOString()
    };
    if (idx !== -1) {
      this.data.companyModules[idx] = updated;
    } else {
      this.data.companyModules.push(updated);
    }
    this.persist();
    return updated;
  }

  // ---------------------------------------------------------------------------
  // Company Roles & Permissions
  // ---------------------------------------------------------------------------
  public getRoles(companyId: string): any[] {
    if (!this.data.roles) this.data.roles = [];
    return this.data.roles.filter(r => r.companyId === companyId);
  }

  public addRole(role: any): any {
    if (!this.data.roles) this.data.roles = [];
    this.data.roles.push(role);
    this.persist();
    return role;
  }

  public getRolePermissions(roleId: string): any[] {
    if (!this.data.rolePermissions) this.data.rolePermissions = [];
    return this.data.rolePermissions.filter(rp => rp.roleId === roleId);
  }

  public setRolePermissions(roleId: string, permissions: any[]): any[] {
    if (!this.data.rolePermissions) this.data.rolePermissions = [];
    this.data.rolePermissions = this.data.rolePermissions.filter(rp => rp.roleId !== roleId);
    this.data.rolePermissions.push(...permissions);
    this.persist();
    return permissions;
  }

  // ---------------------------------------------------------------------------
  // User Access Allotment & Email/Phone Verification
  // ---------------------------------------------------------------------------
  public allotUserAccess(user: CompanyUser): CompanyUser {
    const existing = this.getUserByEmail(user.email);
    if (existing) {
      return this.updateUser(existing.id, user) || user;
    }
    return this.addUser(user);
  }

  public verifyUser(userId: string, emailVerified: boolean, phoneVerified: boolean): CompanyUser | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    const isNowActive = (emailVerified && phoneVerified);
    return this.updateUser(userId, {
      isEmailVerified: emailVerified,
      isPhoneVerified: phoneVerified,
      verificationStatus: isNowActive ? 'active' : (emailVerified ? 'email_verified_only' : (phoneVerified ? 'phone_verified_only' : 'pending_verification'))
    });
  }

  // ---------------------------------------------------------------------------
  // Customers
  // ---------------------------------------------------------------------------
  public getCustomers(companyId: string): Customer[] {
    return this.data.customers.filter(c => c.companyId === companyId);
  }

  public getCustomer(companyId: string, id: string): Customer | undefined {
    return this.data.customers.find(c => c.companyId === companyId && c.id === id);
  }

  public addCustomer(customer: Customer): Customer {
    this.data.customers.push(customer);
    this.persist();
    return customer;
  }

  public updateCustomer(companyId: string, id: string, updates: Partial<Customer>): Customer | undefined {
    const index = this.data.customers.findIndex(c => c.companyId === companyId && c.id === id);
    if (index === -1) return undefined;
    this.data.customers[index] = { ...this.data.customers[index], ...updates };
    this.persist();
    return this.data.customers[index];
  }

  public deleteCustomer(companyId: string, id: string): boolean {
    const initialLen = this.data.customers.length;
    this.data.customers = this.data.customers.filter(c => !(c.companyId === companyId && c.id === id));
    if (this.data.customers.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Suppliers
  // ---------------------------------------------------------------------------
  public getSuppliers(companyId: string): Supplier[] {
    return this.data.suppliers.filter(s => s.companyId === companyId);
  }

  public getSupplier(companyId: string, id: string): Supplier | undefined {
    return this.data.suppliers.find(s => s.companyId === companyId && s.id === id);
  }

  public addSupplier(supplier: Supplier): Supplier {
    this.data.suppliers.push(supplier);
    this.persist();
    return supplier;
  }

  public updateSupplier(companyId: string, id: string, updates: Partial<Supplier>): Supplier | undefined {
    const index = this.data.suppliers.findIndex(s => s.companyId === companyId && s.id === id);
    if (index === -1) return undefined;
    this.data.suppliers[index] = { ...this.data.suppliers[index], ...updates };
    this.persist();
    return this.data.suppliers[index];
  }

  public deleteSupplier(companyId: string, id: string): boolean {
    const initialLen = this.data.suppliers.length;
    this.data.suppliers = this.data.suppliers.filter(s => !(s.companyId === companyId && s.id === id));
    if (this.data.suppliers.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Items & Inventory Master
  // ---------------------------------------------------------------------------
  public getItems(companyId: string): Item[] {
    return this.data.items.filter(i => i.companyId === companyId);
  }

  public getItem(companyId: string, id: string): Item | undefined {
    return this.data.items.find(i => i.companyId === companyId && i.id === id);
  }

  public addItem(item: Item): Item {
    this.data.items.push(item);
    this.persist();
    return item;
  }

  public updateItem(companyId: string, id: string, updates: Partial<Item>): Item | undefined {
    const index = this.data.items.findIndex(i => i.companyId === companyId && i.id === id);
    if (index === -1) return undefined;
    this.data.items[index] = { ...this.data.items[index], ...updates };
    this.persist();
    return this.data.items[index];
  }

  public deleteItem(companyId: string, id: string): boolean {
    const initialLen = this.data.items.length;
    this.data.items = this.data.items.filter(i => !(i.companyId === companyId && i.id === id));
    if (this.data.items.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Warehouses
  // ---------------------------------------------------------------------------
  public getWarehouses(companyId: string): Warehouse[] {
    return this.data.warehouses.filter(w => w.companyId === companyId);
  }

  // ---------------------------------------------------------------------------
  // Bill of Materials (BOM)
  // ---------------------------------------------------------------------------
  public getBOMs(companyId: string): BillOfMaterials[] {
    return this.data.boms.filter(b => b.companyId === companyId);
  }

  public getBOM(companyId: string, id: string): BillOfMaterials | undefined {
    return this.data.boms.find(b => b.companyId === companyId && b.id === id);
  }

  public addBOM(bom: BillOfMaterials): BillOfMaterials {
    this.data.boms.push(bom);
    this.persist();
    return bom;
  }

  // ---------------------------------------------------------------------------
  // Work Centres & Machines Master (Test Case E-005)
  // ---------------------------------------------------------------------------
  public getWorkCenters(companyId: string): WorkCenter[] {
    const list = this.data.workCenters ? this.data.workCenters.filter(w => w.companyId === companyId) : [];
    // Seed default standard work centres per Master SOP if empty for this company
    if (list.length === 0) {
      const defaults: WorkCenter[] = [
        {
          id: `wc-cut-${companyId}`,
          companyId,
          code: 'WC-LASER-01',
          name: 'CNC Laser Cutting Machine',
          hourlyRate: 1200,
          capacityHoursPerDay: 16,
          location: 'Shop Floor - Bay A',
          status: 'active',
          qrCode: `QR-WC-LASER-01-${companyId}`
        },
        {
          id: `wc-weld-${companyId}`,
          companyId,
          code: 'WC-MIG-02',
          name: 'MIG Welding Station',
          hourlyRate: 600,
          capacityHoursPerDay: 16,
          location: 'Shop Floor - Bay B',
          status: 'active',
          qrCode: `QR-WC-MIG-02-${companyId}`
        },
        {
          id: `wc-paint-${companyId}`,
          companyId,
          code: 'WC-PAINT-03',
          name: 'Painting & Powder Coating Booth',
          hourlyRate: 800,
          capacityHoursPerDay: 12,
          location: 'Finishing Section - Bay C',
          status: 'active',
          qrCode: `QR-WC-PAINT-03-${companyId}`
        }
      ];
      if (!this.data.workCenters) this.data.workCenters = [];
      this.data.workCenters.push(...defaults);
      this.persist();
      return defaults;
    }
    return list;
  }

  public getWorkCenter(companyId: string, id: string): WorkCenter | undefined {
    return this.getWorkCenters(companyId).find(w => w.id === id);
  }

  public addWorkCenter(wc: WorkCenter): WorkCenter {
    if (!this.data.workCenters) this.data.workCenters = [];
    this.data.workCenters.push(wc);
    this.persist();
    return wc;
  }

  public updateWorkCenter(companyId: string, id: string, updates: Partial<WorkCenter>): WorkCenter | undefined {
    if (!this.data.workCenters) this.data.workCenters = [];
    const index = this.data.workCenters.findIndex(w => w.companyId === companyId && w.id === id);
    if (index === -1) return undefined;
    this.data.workCenters[index] = { ...this.data.workCenters[index], ...updates };
    this.persist();
    return this.data.workCenters[index];
  }

  public deleteWorkCenter(companyId: string, id: string): boolean {
    if (!this.data.workCenters) return false;
    const initialLen = this.data.workCenters.length;
    this.data.workCenters = this.data.workCenters.filter(w => !(w.companyId === companyId && w.id === id));
    if (this.data.workCenters.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Request for Quotations (RFQ) & Multi-Vendor Comparison (Test Case E-019)
  // ---------------------------------------------------------------------------
  public getRFQs(companyId: string): RFQ[] {
    return this.data.rfqs ? this.data.rfqs.filter(r => r.companyId === companyId) : [];
  }

  public getRFQ(companyId: string, id: string): RFQ | undefined {
    return this.getRFQs(companyId).find(r => r.id === id);
  }

  public addRFQ(rfq: RFQ): RFQ {
    if (!this.data.rfqs) this.data.rfqs = [];
    this.data.rfqs.push(rfq);
    this.persist();
    return rfq;
  }

  public updateRFQ(companyId: string, id: string, updates: Partial<RFQ>): RFQ | undefined {
    if (!this.data.rfqs) this.data.rfqs = [];
    const index = this.data.rfqs.findIndex(r => r.companyId === companyId && r.id === id);
    if (index === -1) return undefined;
    this.data.rfqs[index] = { ...this.data.rfqs[index], ...updates };
    this.persist();
    return this.data.rfqs[index];
  }

  public deleteRFQ(companyId: string, id: string): boolean {
    if (!this.data.rfqs) return false;
    const initialLen = this.data.rfqs.length;
    this.data.rfqs = this.data.rfqs.filter(r => !(r.companyId === companyId && r.id === id));
    if (this.data.rfqs.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // Quotations & Revision Management (Indian MSME Made-to-Order Manufacturing)
  // ---------------------------------------------------------------------------
  public getQuotations(companyId: string): Quotation[] {
    return (this.data.quotations || [])
      .filter(q => q.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt || b.quoteDate).getTime() - new Date(a.createdAt || a.quoteDate).getTime());
  }

  public getQuotation(companyId: string, id: string): Quotation | undefined {
    return (this.data.quotations || []).find(q => q.companyId === companyId && q.id === id);
  }

  public calculateQuotationFinancials(companyId: string, quote: any): any {
    const company = this.getCompany(companyId);
    const supplierGstinOrState = company?.gstin || company?.state || '27';
    const customerPlaceOfSupply = quote.placeOfSupply || (typeof quote.billingAddress === 'object' ? quote.billingAddress?.state : quote.billingAddress) || quote.gstin || '27';
    const isIntra = isIntraStateGst(supplierGstinOrState, customerPlaceOfSupply);

    let subtotal = 0;
    let lineDiscountTotal = 0;
    let taxableTotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const enrichedItems: QuotationItem[] = (quote.items || []).map((it: any, index: number) => {
      const qty = Math.max(0.0001, Number(it.quantity) || 1);
      const rate = Math.max(0, Number(it.unitPrice) || 0);
      const gross = Math.round((qty * rate + Number.EPSILON) * 100) / 100;

      let discAmount = 0;
      if (it.discountType === 'fixed') {
        discAmount = Math.min(gross, Math.max(0, Number(it.discountValue) || 0));
      } else {
        const pct = Math.min(100, Math.max(0, Number(it.discountValue) || 0));
        discAmount = Math.round((gross * (pct / 100) + Number.EPSILON) * 100) / 100;
      }

      const taxable = Math.max(0, gross - discAmount);
      const gstRate = Number(it.gstRate) >= 0 ? Number(it.gstRate) : 18;

      let cgstRate = 0;
      let sgstRate = 0;
      let igstRate = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (isIntra) {
        cgstRate = gstRate / 2;
        sgstRate = gstRate / 2;
        cgstAmount = Math.round((taxable * (cgstRate / 100) + Number.EPSILON) * 100) / 100;
        sgstAmount = Math.round((taxable * (sgstRate / 100) + Number.EPSILON) * 100) / 100;
      } else {
        igstRate = gstRate;
        igstAmount = Math.round((taxable * (igstRate / 100) + Number.EPSILON) * 100) / 100;
      }

      const taxAmount = cgstAmount + sgstAmount + igstAmount;
      const lineTotal = Math.round((taxable + taxAmount + Number.EPSILON) * 100) / 100;

      subtotal += gross;
      lineDiscountTotal += discAmount;
      taxableTotal += taxable;
      totalCgst += cgstAmount;
      totalSgst += sgstAmount;
      totalIgst += igstAmount;

      return {
        id: it.id || `qit-${Date.now()}-${index}`,
        quotationId: quote.id,
        itemId: it.itemId || undefined,
        itemCode: it.itemCode || `PART-${String(index + 1).padStart(3, '0')}`,
        itemName: it.itemName || 'Custom Item',
        description: it.description || '',
        technicalSpecifications: it.technicalSpecifications || '',
        dimensions: it.dimensions || '',
        materialGrade: it.materialGrade || '',
        drawingReference: it.drawingReference || '',
        toleranceDetails: it.toleranceDetails || '',
        manufacturingNotes: it.manufacturingNotes || '',
        hsnSacCode: it.hsnSacCode || '8483',
        uom: it.uom || 'Nos',
        quantity: qty,
        unitPrice: rate,
        discountType: it.discountType || 'percentage',
        discountValue: it.discountValue || 0,
        discountAmount: discAmount,
        taxableAmount: taxable,
        gstRate,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount,
        totalAmount: lineTotal,
        sortOrder: index
      };
    });

    let headerDiscountAmount = 0;
    if (quote.discountType === 'fixed') {
      headerDiscountAmount = Math.min(taxableTotal, Math.max(0, Number(quote.discountValue) || 0));
    } else if (Number(quote.discountValue) > 0) {
      const pct = Math.min(100, Math.max(0, Number(quote.discountValue) || 0));
      headerDiscountAmount = Math.round((taxableTotal * (pct / 100) + Number.EPSILON) * 100) / 100;
    }

    const finalTaxable = Math.max(0, taxableTotal - headerDiscountAmount);
    if (headerDiscountAmount > 0 && taxableTotal > 0) {
      const ratio = finalTaxable / taxableTotal;
      totalCgst = Math.round((totalCgst * ratio + Number.EPSILON) * 100) / 100;
      totalSgst = Math.round((totalSgst * ratio + Number.EPSILON) * 100) / 100;
      totalIgst = Math.round((totalIgst * ratio + Number.EPSILON) * 100) / 100;
    }

    const freight = Math.max(0, Number(quote.freightAmount) || 0);
    const packing = Math.max(0, Number(quote.packingAmount) || 0);
    const other = Math.max(0, Number(quote.otherCharges) || 0);

    const rawGrandTotal = finalTaxable + totalCgst + totalSgst + totalIgst + freight + packing + other;
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = Math.round((roundedGrandTotal - rawGrandTotal + Number.EPSILON) * 100) / 100;

    return {
      items: enrichedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round((lineDiscountTotal + headerDiscountAmount) * 100) / 100,
      taxableAmount: Math.round(finalTaxable * 100) / 100,
      cgstAmount: Math.round(totalCgst * 100) / 100,
      sgstAmount: Math.round(totalSgst * 100) / 100,
      igstAmount: Math.round(totalIgst * 100) / 100,
      freightAmount: freight,
      packingAmount: packing,
      otherCharges: other,
      roundOff,
      grandTotal: roundedGrandTotal,
      amountInWords: numberToIndianWords(roundedGrandTotal)
    };
  }

  public addQuotation(quotation: Quotation): Quotation {
    this.data.quotations = this.data.quotations || [];
    this.data.quotations.push(quotation);
    this.persist();
    return quotation;
  }

  public createQuotationRecord(companyId: string, payload: any, user: { name: string }): Quotation {
    const quotationNumber = payload.quotationNumber || this.getNextSequence(companyId, 'QT', 'quotation');
    const quoteId = payload.id || `qt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const familyId = payload.quotationFamilyId || quotationNumber;

    const financials = this.calculateQuotationFinancials(companyId, { ...payload, id: quoteId });

    const newQuotation: Quotation = {
      id: quoteId,
      companyId,
      quotationNumber,
      quotationFamilyId: familyId,
      revisionNumber: 0,
      revision: 'Rev 0',

      // Associations
      customerId: payload.customerId || `cust-${Date.now()}`,
      customerName: payload.customerName || 'General Client',
      contactPerson: payload.contactPerson || '',
      phone: payload.phone || '',
      email: payload.email || '',
      gstin: payload.gstin || '',
      leadId: payload.leadId || undefined,
      leadNumber: payload.leadNumber || undefined,

      // Dates & Subject
      quoteDate: payload.quoteDate || new Date().toISOString().split('T')[0],
      validUntil: payload.validUntil || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      subject: payload.subject || `${payload.customerName} - Quotation`,
      referenceNumber: payload.referenceNumber || '',
      salespersonId: payload.salespersonId || '',
      salespersonName: payload.salespersonName || user.name,
      placeOfSupply: payload.placeOfSupply || 'Maharashtra (27)',
      billingAddress: payload.billingAddress || '',
      shippingAddress: payload.shippingAddress || payload.billingAddress || '',

      // Commercial Totals
      ...financials,
      currency: 'INR',
      discountType: payload.discountType || 'percentage',
      discountValue: Number(payload.discountValue) || 0,

      // Terms
      paymentTerms: payload.paymentTerms || '50% advance along with PO, balance against proforma before dispatch.',
      deliveryPeriod: payload.deliveryPeriod || '2 to 3 weeks from receipt of approved drawings and PO.',
      deliveryLocation: payload.deliveryLocation || 'Ex-Works Chakan Plant',
      transportationTerms: payload.transportationTerms || 'Freight extra at actuals.',
      packingTerms: payload.packingTerms || 'Standard seaworthy/wooden box packing included.',
      warrantyTerms: payload.warrantyTerms || '12 months against manufacturing defects.',
      validityTerms: payload.validityTerms || '15 days from the date of quotation.',
      taxesAndDuties: payload.taxesAndDuties || 'GST 18% as applicable extra.',
      terms: payload.terms || payload.paymentTerms || '',
      customTerms: payload.customTerms || '',

      // Notes
      internalNotes: payload.internalNotes || '',
      customerNotes: payload.customerNotes || payload.notes || '',
      notes: payload.notes || payload.customerNotes || '',

      // Workflow
      status: payload.status || 'draft',
      approvalStatus: payload.approvalStatus || 'not_required',
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Sub-arrays
      revisions: [],
      activities: [
        {
          id: `act-${Date.now()}-1`,
          quotationId: quoteId,
          type: 'created',
          title: `Quotation ${quotationNumber} (Rev 0) Created`,
          description: `Initial draft created by ${user.name} for ${payload.customerName}. Value: ₹${financials.grandTotal.toLocaleString('en-IN')}`,
          performedBy: user.name,
          performedAt: new Date().toISOString()
        }
      ],
      attachments: payload.attachments || []
    };

    this.addQuotation(newQuotation);

    // If associated with a Lead, update lead status and log CRM activity
    if (newQuotation.leadId) {
      const lead = this.getLead(companyId, newQuotation.leadId);
      if (lead) {
        lead.status = 'quotation_preparation';
        lead.convertedQuotationId = newQuotation.id;
        lead.convertedQuotationNumber = newQuotation.quotationNumber;
        lead.updatedAt = new Date().toISOString();
        this.createLeadActivity({
          id: `act-${Date.now()}-lead`,
          leadId: lead.id,
          companyId,
          type: 'quotation_created',
          title: `Linked to Quotation ${newQuotation.quotationNumber}`,
          description: `Draft quotation created for ₹${newQuotation.grandTotal.toLocaleString('en-IN')}`,
          performedBy: user.name,
          performedAt: new Date().toISOString()
        });
      }
    }

    return newQuotation;
  }

  public updateQuotation(companyId: string, id: string, updates: Partial<Quotation>, user?: { name: string }): Quotation | undefined {
    const index = (this.data.quotations || []).findIndex(q => q.companyId === companyId && q.id === id);
    if (index === -1) return undefined;

    const existing = this.data.quotations[index];

    // Cannot directly modify superseded or converted quotations
    if (existing.status === 'superseded') {
      throw new Error('Superseded quotations cannot be edited. Please edit the latest active revision.');
    }
    if (existing.status === 'converted_to_order') {
      throw new Error('Quotation has already been converted to a live Sales Order and is locked.');
    }

    // Recalculate financials if items or commercial terms changed
    const mergedData = { ...existing, ...updates, id };
    const financials = this.calculateQuotationFinancials(companyId, mergedData);

    const userName = user?.name || existing.createdBy || 'Staff';
    const activities = existing.activities || [];
    activities.push({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      quotationId: id,
      type: 'updated',
      title: 'Quotation Updated',
      description: `Quotation details and pricing updated by ${userName}.`,
      performedBy: userName,
      performedAt: new Date().toISOString()
    });

    this.data.quotations[index] = {
      ...mergedData,
      ...financials,
      activities,
      updatedBy: userName,
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return this.data.quotations[index];
  }

  public createQuotationRevision(companyId: string, id: string, revisionReason: string, updates: any, user: { name: string }): { newQuotation: Quotation; previousQuotation: Quotation } {
    const existingIndex = (this.data.quotations || []).findIndex(q => q.companyId === companyId && q.id === id);
    if (existingIndex === -1) {
      throw new Error('Quotation not found');
    }

    const previousQuotation = this.data.quotations[existingIndex];
    if (previousQuotation.status === 'superseded') {
      throw new Error('This quotation revision has already been superseded by a newer revision.');
    }

    const nextRevNum = (previousQuotation.revisionNumber || 0) + 1;
    const nextRevLabel = `Rev ${nextRevNum}`;
    const familyId = previousQuotation.quotationFamilyId || previousQuotation.quotationNumber;
    const newQuotationId = `qt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Calculate financials for the new revision
    const candidateData = {
      ...previousQuotation,
      ...updates,
      id: newQuotationId,
      revisionNumber: nextRevNum,
      revision: nextRevLabel,
      items: updates.items || previousQuotation.items
    };
    const financials = this.calculateQuotationFinancials(companyId, candidateData);

    // Create the new revision quotation
    const newQuotation: Quotation = {
      ...previousQuotation,
      ...updates,
      ...financials,
      id: newQuotationId,
      companyId,
      quotationNumber: previousQuotation.quotationNumber,
      quotationFamilyId: familyId,
      revisionNumber: nextRevNum,
      revision: nextRevLabel,
      status: 'draft',
      approvalStatus: 'not_required',
      approvedBy: undefined,
      approvedAt: undefined,
      sentAt: undefined,
      acceptedAt: undefined,
      rejectedAt: undefined,
      supersededBy: undefined,
      convertedSalesOrderId: undefined,
      convertedSalesOrderNumber: undefined,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activities: [
        {
          id: `act-${Date.now()}-rev`,
          quotationId: newQuotationId,
          type: 'revision_created',
          title: `Revision ${nextRevLabel} Created`,
          description: `Created revision from ${previousQuotation.revision}. Reason: ${revisionReason}. Value: ₹${financials.grandTotal.toLocaleString('en-IN')}`,
          performedBy: user.name,
          performedAt: new Date().toISOString()
        }
      ],
      revisions: [
        ...(previousQuotation.revisions || []),
        {
          id: `rev-${Date.now()}`,
          quotationFamilyId: familyId,
          quotationId: previousQuotation.id,
          revisionNumber: previousQuotation.revisionNumber || 0,
          previousQuotationId: previousQuotation.id,
          revisionReason: revisionReason,
          snapshotData: {
            subtotal: previousQuotation.subtotal,
            grandTotal: previousQuotation.grandTotal,
            revision: previousQuotation.revision,
            itemsCount: previousQuotation.items.length
          },
          createdBy: user.name,
          createdAt: new Date().toISOString()
        }
      ]
    };

    // Mark previous quotation as superseded
    previousQuotation.status = 'superseded';
    previousQuotation.supersededBy = newQuotationId;
    previousQuotation.updatedAt = new Date().toISOString();
    previousQuotation.activities = previousQuotation.activities || [];
    previousQuotation.activities.push({
      id: `act-${Date.now()}-superseded`,
      quotationId: previousQuotation.id,
      type: 'status_change',
      title: `Superseded by ${nextRevLabel}`,
      description: `Quotation revision closed and replaced by ${nextRevLabel}. Reason: ${revisionReason}`,
      performedBy: user.name,
      performedAt: new Date().toISOString()
    });

    this.data.quotations.push(newQuotation);
    this.persist();

    return { newQuotation, previousQuotation };
  }

  public updateQuotationStatus(
    companyId: string,
    id: string,
    newStatus: QuotationStatus,
    metadata: { reason?: string; comments?: string; sentVia?: 'email' | 'whatsapp' | 'manual'; approverName?: string } = {},
    user: { name: string }
  ): Quotation {
    const quote = this.getQuotation(companyId, id);
    if (!quote) throw new Error('Quotation not found');

    const prevStatus = quote.status;
    quote.status = newStatus;
    quote.updatedAt = new Date().toISOString();
    quote.updatedBy = user.name;

    const activities = quote.activities || [];

    if (newStatus === 'pending_approval') {
      quote.approvalStatus = 'pending';
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'approval_requested',
        title: 'Submitted for Internal Approval',
        description: `Quotation submitted by ${user.name} for managerial review. Value: ₹${quote.grandTotal.toLocaleString('en-IN')}`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });
    } else if (newStatus === 'approved') {
      quote.approvalStatus = 'approved';
      quote.approvedBy = user.name;
      quote.approvedAt = new Date().toISOString();
      quote.approvalComments = metadata.comments || 'Approved';
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'approved',
        title: 'Quotation Approved',
        description: `Approved by ${user.name}. ${metadata.comments ? `Remarks: "${metadata.comments}"` : ''}`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });
    } else if (newStatus === 'sent') {
      quote.sentAt = new Date().toISOString();
      quote.sentVia = metadata.sentVia || 'manual';
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'sent',
        title: `Quotation Dispatched to Client (${metadata.sentVia || 'Email'})`,
        description: `Official quotation ${quote.quotationNumber} (${quote.revision}) sent to ${quote.customerName}.`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });

      // Synchronize linked Lead to 'quotation_sent'
      if (quote.leadId) {
        const lead = this.getLead(companyId, quote.leadId);
        if (lead) {
          lead.status = 'quotation_sent';
          lead.updatedAt = new Date().toISOString();
          this.createLeadActivity({
            id: `act-lead-sent-${Date.now()}`,
            leadId: lead.id,
            companyId,
            type: 'stage_change',
            title: `Stage changed to Quotation Sent`,
            description: `Quotation ${quote.quotationNumber} dispatched.`,
            performedBy: user.name,
            performedAt: new Date().toISOString()
          });
        }
      }
    } else if (newStatus === 'under_negotiation') {
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'status_change',
        title: 'Commercial Negotiation Started',
        description: `Client is reviewing commercial terms and rates. ${metadata.comments || ''}`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });
      if (quote.leadId) {
        const lead = this.getLead(companyId, quote.leadId);
        if (lead) {
          lead.status = 'negotiation';
          lead.updatedAt = new Date().toISOString();
        }
      }
    } else if (newStatus === 'accepted') {
      quote.acceptedAt = new Date().toISOString();
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'accepted',
        title: 'Quotation Accepted by Customer',
        description: `Client confirmed quotation. Eligible for Sales Order conversion. Value: ₹${quote.grandTotal.toLocaleString('en-IN')}`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });
      if (quote.leadId) {
        const lead = this.getLead(companyId, quote.leadId);
        if (lead) {
          lead.status = 'won';
          lead.updatedAt = new Date().toISOString();
          this.createLeadActivity({
            id: `act-lead-won-${Date.now()}`,
            leadId: lead.id,
            companyId,
            type: 'stage_change',
            title: 'Lead Won (Quotation Accepted)',
            description: `Quotation ${quote.quotationNumber} accepted.`,
            performedBy: user.name,
            performedAt: new Date().toISOString()
          });
        }
      }
    } else if (newStatus === 'rejected') {
      quote.rejectedAt = new Date().toISOString();
      quote.rejectionReason = metadata.reason || 'Client opted out';
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'customer_rejected',
        title: 'Quotation Rejected',
        description: `Reason: ${quote.rejectionReason}`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });
    } else if (newStatus === 'cancelled') {
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'cancelled',
        title: 'Quotation Cancelled',
        description: `Quotation cancelled by ${user.name}. ${metadata.reason || ''}`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });
    } else {
      activities.push({
        id: `act-${Date.now()}`,
        quotationId: id,
        type: 'status_change',
        title: `Status Changed to ${newStatus}`,
        description: `Status changed from ${prevStatus} to ${newStatus} by ${user.name}.`,
        performedBy: user.name,
        performedAt: new Date().toISOString()
      });
    }

    quote.activities = activities;
    this.persist();
    return quote;
  }

  public duplicateQuotation(companyId: string, id: string, user: { name: string }): Quotation {
    const existing = this.getQuotation(companyId, id);
    if (!existing) throw new Error('Source quotation not found');

    const newQuotationNumber = this.getNextSequence(companyId, 'QT', 'quotation');
    const newQuoteId = `qt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const duplicated: Quotation = {
      ...existing,
      id: newQuoteId,
      companyId,
      quotationNumber: newQuotationNumber,
      quotationFamilyId: newQuotationNumber,
      revisionNumber: 0,
      revision: 'Rev 0',
      status: 'draft',
      approvalStatus: 'not_required',
      approvedBy: undefined,
      approvedAt: undefined,
      sentAt: undefined,
      acceptedAt: undefined,
      rejectedAt: undefined,
      supersededBy: undefined,
      convertedSalesOrderId: undefined,
      convertedSalesOrderNumber: undefined,
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: existing.items.map((it, idx) => ({
        ...it,
        id: `qit-${Date.now()}-${idx}`,
        quotationId: newQuoteId
      })),
      activities: [
        {
          id: `act-${Date.now()}-dup`,
          quotationId: newQuoteId,
          type: 'created',
          title: `Duplicated from ${existing.quotationNumber} (${existing.revision})`,
          description: `Cloned into new quotation series by ${user.name}.`,
          performedBy: user.name,
          performedAt: new Date().toISOString()
        }
      ],
      revisions: []
    };

    this.addQuotation(duplicated);
    return duplicated;
  }

  public convertQuotationToSalesOrder(companyId: string, quotationId: string, user: { name: string }): { order: SalesOrder; quotation: Quotation } {
    const quotation = this.getQuotation(companyId, quotationId);
    if (!quotation) throw new Error('Quotation not found');

    // Rule: Only accepted quotations are eligible
    if (quotation.status !== 'accepted' && quotation.status !== 'approved') {
      throw new Error(`Only Accepted or Approved quotations can be converted to Sales Orders. Current status: "${quotation.status}".`);
    }

    // Rule: Prevent duplicate conversions
    if (quotation.convertedSalesOrderId) {
      throw new Error(`This quotation has already been converted to Sales Order ${quotation.convertedSalesOrderNumber}. Duplicate conversion prevented.`);
    }

    const soNumber = this.getNextSequence(companyId, 'SO', 'sales_order');
    const orderId = `so-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const salesOrder: SalesOrder = {
      id: orderId,
      companyId,
      soNumber,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerPoNumber: quotation.referenceNumber || quotation.quotationNumber,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: quotation.validUntil,
      status: 'confirmed',
      subtotal: quotation.taxableAmount || quotation.subtotal,
      cgstAmount: quotation.cgstAmount,
      sgstAmount: quotation.sgstAmount,
      igstAmount: quotation.igstAmount,
      grandTotal: quotation.grandTotal,
      notes: `Generated from Quotation ${quotation.quotationNumber} (${quotation.revision}). Terms: ${quotation.paymentTerms || ''}`,
      items: quotation.items.map((it, idx) => ({
        id: `soi-${Date.now()}-${idx}`,
        itemId: it.itemId || 'custom-item',
        itemCode: it.itemCode,
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        hsnSacCode: it.hsnSacCode,
        gstRate: it.gstRate,
        subtotal: it.taxableAmount || (it.quantity * it.unitPrice)
      }))
    };

    this.addSalesOrder(salesOrder);

    // Update Quotation status & references
    quotation.status = 'converted_to_order';
    quotation.convertedSalesOrderId = orderId;
    quotation.convertedSalesOrderNumber = soNumber;
    quotation.updatedAt = new Date().toISOString();
    quotation.updatedBy = user.name;

    const activities = quotation.activities || [];
    activities.push({
      id: `act-${Date.now()}-so`,
      quotationId,
      type: 'sales_order_converted',
      title: `Converted to Sales Order ${soNumber}`,
      description: `Production & dispatch lifecycle initiated. Carried forward ${quotation.items.length} line items with GST ₹${(quotation.cgstAmount + quotation.sgstAmount + quotation.igstAmount).toLocaleString('en-IN')}.`,
      performedBy: user.name,
      performedAt: new Date().toISOString()
    });
    quotation.activities = activities;

    this.persist();
    return { order: salesOrder, quotation };
  }

  public addQuotationAttachment(companyId: string, quotationId: string, attachment: Partial<QuotationAttachment>, user: { name: string }): QuotationAttachment {
    const quote = this.getQuotation(companyId, quotationId);
    if (!quote) throw new Error('Quotation not found');

    const newAttachment: QuotationAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      quotationId,
      fileName: attachment.fileName || 'Technical_Drawing.pdf',
      fileUrl: attachment.fileUrl || '#',
      fileType: attachment.fileType || 'application/pdf',
      fileSize: attachment.fileSize || 102400,
      category: attachment.category || 'drawing',
      uploadedBy: user.name,
      uploadedAt: new Date().toISOString()
    };

    quote.attachments = quote.attachments || [];
    quote.attachments.push(newAttachment);

    quote.activities = quote.activities || [];
    quote.activities.push({
      id: `act-${Date.now()}-att`,
      quotationId,
      type: 'updated',
      title: `Attached Document: ${newAttachment.fileName}`,
      description: `Category: ${newAttachment.category} (${Math.round(newAttachment.fileSize / 1024)} KB) uploaded by ${user.name}.`,
      performedBy: user.name,
      performedAt: new Date().toISOString()
    });

    this.persist();
    return newAttachment;
  }

  // ---------------------------------------------------------------------------
  // Sales Orders
  // ---------------------------------------------------------------------------
  public getSalesOrders(companyId: string): SalesOrder[] {
    return this.data.salesOrders.filter(s => s.companyId === companyId);
  }

  public getSalesOrder(companyId: string, id: string): SalesOrder | undefined {
    return this.data.salesOrders.find(s => s.companyId === companyId && s.id === id);
  }

  public addSalesOrder(order: SalesOrder): SalesOrder {
    this.data.salesOrders.push(order);
    this.persist();
    return order;
  }

  public updateSalesOrder(companyId: string, id: string, updates: Partial<SalesOrder>): SalesOrder | undefined {
    const index = this.data.salesOrders.findIndex(s => s.companyId === companyId && s.id === id);
    if (index === -1) return undefined;
    this.data.salesOrders[index] = { ...this.data.salesOrders[index], ...updates };
    this.persist();
    return this.data.salesOrders[index];
  }

  public createSalesOrderRecord(companyId: string, payload: any, user: { name: string }): SalesOrder {
    const soNumber = payload.soNumber || this.getNextSequence(companyId, 'SO', 'sales_order');
    const orderId = payload.id || `so-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const company = this.getCompany(companyId);
    const companyState = company?.state || company?.gstin || 'Maharashtra';
    const customerState = payload.customerGstin || payload.state || payload.billingAddress || 'Maharashtra';
    const isIntra = isIntraStateGst(companyState, customerState);

    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const items = (payload.items || []).map((it: any, idx: number) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const discountPct = Number(it.discountPercent) || 0;
      const discountAmt = (qty * price) * (discountPct / 100);
      const taxable = (qty * price) - discountAmt;
      const gstRate = Number(it.gstRate) || 18;
      const taxAmt = taxable * (gstRate / 100);
      const lineTotal = taxable + taxAmt;

      subtotal += taxable;
      if (isIntra) {
        cgstAmount += taxAmt / 2;
        sgstAmount += taxAmt / 2;
      } else {
        igstAmount += taxAmt;
      }

      return {
        id: it.id || `soi-${Date.now()}-${idx}`,
        itemId: it.itemId || 'custom-item',
        itemCode: it.itemCode || `ITM-${idx + 1}`,
        itemName: it.itemName || 'Custom Product',
        description: it.description || '',
        technicalSpecs: it.technicalSpecs || '',
        drawingRef: it.drawingRef || '',
        materialGrade: it.materialGrade || '',
        dimensions: it.dimensions || '',
        tolerance: it.tolerance || '',
        uom: it.uom || 'Nos',
        quantity: qty,
        unitPrice: price,
        discountPercent: discountPct,
        discountAmount: Math.round(discountAmt * 100) / 100,
        taxableAmount: Math.round(taxable * 100) / 100,
        hsnSacCode: it.hsnSacCode || '8483',
        gstRate,
        taxAmount: Math.round(taxAmt * 100) / 100,
        totalAmount: Math.round(lineTotal * 100) / 100,
        shippedQuantity: 0,
        subtotal: Math.round(taxable * 100) / 100
      };
    });

    const grandTotal = Math.round((subtotal + cgstAmount + sgstAmount + igstAmount) * 100) / 100;
    const initialStatus = payload.status || 'confirmed';
    const initialHistory: SalesOrderStatusHistory[] = [
      {
        id: `soh-${Date.now()}-init`,
        fromStatus: 'draft',
        toStatus: initialStatus,
        changedBy: user.name,
        changedAt: new Date().toISOString(),
        reason: payload.quotationNumber ? `Converted from Quotation ${payload.quotationNumber}` : 'Created Sales Order'
      }
    ];

    const salesOrder: SalesOrder = {
      id: orderId,
      companyId,
      soNumber,
      customerId: payload.customerId || `cust-${Date.now()}`,
      customerName: payload.customerName || 'General Client',
      customerPoNumber: payload.customerPoNumber || 'DIRECT-PO',
      customerPoDate: payload.customerPoDate,
      quotationId: payload.quotationId,
      quotationNumber: payload.quotationNumber,
      quotationRevision: payload.quotationRevision,
      salespersonName: payload.salespersonName || user.name,
      orderDate: payload.orderDate || new Date().toISOString().split('T')[0],
      deliveryDate: payload.deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      expectedDeliveryDate: payload.expectedDeliveryDate || payload.deliveryDate,
      priority: payload.priority || 'normal',
      status: initialStatus,
      subtotal: Math.round(subtotal * 100) / 100,
      taxableAmount: Math.round(subtotal * 100) / 100,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      grandTotal,
      items,
      advancePercentage: Number(payload.advancePercentage) || 0,
      advanceAmount: Number(payload.advanceAmount) || (payload.advancePercentage ? Math.round((grandTotal * Number(payload.advancePercentage)) / 100) : 0),
      advancePaid: payload.advancePaid || false,
      advanceUtrRef: payload.advanceUtrRef,
      proformaNumber: payload.proformaNumber,
      workReleased: payload.workReleased || false,
      paymentTerms: payload.paymentTerms || '30 Days from Dispatch',
      deliveryTerms: payload.deliveryTerms || 'Ex-Factory Chakan',
      freightTerms: payload.freightTerms || 'To-Pay',
      packingTerms: payload.packingTerms || 'Standard Wooden Pallet Packaging',
      billingAddress: payload.billingAddress,
      shippingAddress: payload.shippingAddress,
      customerGstin: payload.customerGstin,
      state: customerState,
      pincode: payload.pincode,
      contactPerson: payload.contactPerson,
      phone: payload.phone,
      email: payload.email,
      statusHistory: initialHistory,
      notes: payload.notes || '',
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.addSalesOrder(salesOrder);
    return salesOrder;
  }

  public updateSalesOrderStatus(
    companyId: string,
    id: string,
    newStatus: SalesOrderStatus,
    userOrReason?: any,
    reasonOrUser?: any
  ): SalesOrder | undefined {
    const order = this.getSalesOrder(companyId, id);
    if (!order) return undefined;

    const user = typeof userOrReason === 'object' && userOrReason?.name
      ? userOrReason
      : (typeof reasonOrUser === 'object' && reasonOrUser?.name ? reasonOrUser : { name: 'Admin' });

    const reason = typeof userOrReason === 'string'
      ? userOrReason
      : (typeof reasonOrUser === 'string' ? reasonOrUser : undefined);

    const fromStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    if (newStatus === 'cancelled' && reason) {
      order.cancellationReason = reason;
    }

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      id: `soh-${Date.now()}`,
      fromStatus,
      toStatus: newStatus,
      changedBy: user.name,
      changedAt: new Date().toISOString(),
      reason: reason || `Status updated to ${newStatus}`
    });

    this.persist();
    return order;
  }

  public cancelSalesOrder(companyId: string, id: string, reasonOrUser?: any, userOrReason?: any): SalesOrder | undefined {
    return this.updateSalesOrderStatus(companyId, id, 'cancelled', reasonOrUser, userOrReason);
  }

  // ---------------------------------------------------------------------------
  // Purchase Orders & GRN
  // ---------------------------------------------------------------------------
  public getPurchaseOrders(companyId: string): PurchaseOrder[] {
    return this.data.purchaseOrders.filter(p => p.companyId === companyId);
  }

  public getPurchaseOrder(companyId: string, id: string): PurchaseOrder | undefined {
    return this.data.purchaseOrders.find(p => p.companyId === companyId && p.id === id);
  }

  public addPurchaseOrder(po: PurchaseOrder): PurchaseOrder {
    this.data.purchaseOrders.push(po);
    this.persist();
    return po;
  }

  public updatePurchaseOrder(companyId: string, id: string, updates: Partial<PurchaseOrder>): PurchaseOrder | undefined {
    const index = this.data.purchaseOrders.findIndex(p => p.companyId === companyId && p.id === id);
    if (index === -1) return undefined;
    this.data.purchaseOrders[index] = { ...this.data.purchaseOrders[index], ...updates };
    this.persist();
    return this.data.purchaseOrders[index];
  }

  public getGRNs(companyId: string): GoodsReceiptNote[] {
    return this.data.grns.filter(g => g.companyId === companyId);
  }

  public addGRN(grn: GoodsReceiptNote): GoodsReceiptNote {
    this.data.grns.push(grn);
    this.persist();
    return grn;
  }

  // ---------------------------------------------------------------------------
  // Purchase Requisitions (PR)
  // ---------------------------------------------------------------------------
  public getPurchaseRequisitions(companyId: string): PurchaseRequisition[] {
    if (!this.data.purchaseRequisitions) this.data.purchaseRequisitions = [];
    return this.data.purchaseRequisitions.filter(pr => pr.companyId === companyId);
  }

  public getPurchaseRequisition(companyId: string, id: string): PurchaseRequisition | undefined {
    return this.getPurchaseRequisitions(companyId).find(pr => pr.id === id);
  }

  public createPurchaseRequisition(companyId: string, payload: any, user: { name: string }): PurchaseRequisition {
    if (!this.data.purchaseRequisitions) this.data.purchaseRequisitions = [];

    const prNumber = payload.prNumber || this.getNextSequence(companyId, 'PR', 'purchase_requisition');
    const id = payload.id || `pr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    let totalEstimated = 0;
    const items = (payload.items || []).map((it: any, idx: number) => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.estimatedUnitRate) || 0;
      const lineEst = qty * rate;
      totalEstimated += lineEst;

      return {
        id: it.id || `pri-${Date.now()}-${idx}`,
        itemId: it.itemId,
        itemCode: it.itemCode || `MAT-${idx + 1}`,
        itemName: it.itemName || 'Required Material',
        description: it.description || '',
        specifications: it.specifications || '',
        quantity: qty,
        uom: it.uom || 'Nos',
        estimatedUnitRate: rate,
        estimatedTotal: lineEst,
        notes: it.notes || ''
      };
    });

    const newPr: PurchaseRequisition = {
      id,
      companyId,
      prNumber,
      requisitionDate: payload.requisitionDate || new Date().toISOString().split('T')[0],
      requiredByDate: payload.requiredByDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      requestedBy: payload.requestedBy || user.name,
      department: payload.department || 'Production',
      priority: payload.priority || 'normal',
      purpose: payload.purpose || 'Material replenishment for manufacturing job',
      items,
      totalEstimatedAmount: totalEstimated,
      status: payload.status || 'submitted',
      preferredVendorId: payload.preferredVendorId,
      preferredVendorName: payload.preferredVendorName,
      notes: payload.notes || '',
      createdBy: user.name,
      createdAt: new Date().toISOString()
    };

    this.data.purchaseRequisitions.push(newPr);
    this.persist();
    return newPr;
  }

  public updatePurchaseRequisitionStatus(
    companyId: string,
    id: string,
    status: PurchaseRequisition['status'],
    userOrRemarks?: any,
    remarksOrUser?: any
  ): PurchaseRequisition | undefined {
    const pr = this.getPurchaseRequisition(companyId, id);
    if (!pr) return undefined;

    const user = typeof userOrRemarks === 'object' && userOrRemarks?.name
      ? userOrRemarks
      : (typeof remarksOrUser === 'object' && remarksOrUser?.name ? remarksOrUser : { name: 'Admin' });

    const remarks = typeof userOrRemarks === 'string'
      ? userOrRemarks
      : (typeof remarksOrUser === 'string' ? remarksOrUser : undefined);

    pr.status = status;
    pr.updatedAt = new Date().toISOString();
    if (status === 'approved') {
      pr.approvedBy = user.name;
      pr.approvedAt = new Date().toISOString();
      pr.approvalRemarks = remarks || 'Approved by Plant Manager';
    } else if (status === 'rejected') {
      pr.rejectedBy = user.name;
      pr.rejectedAt = new Date().toISOString();
      pr.rejectionReason = remarks || 'Rejected by approver';
    }
    this.persist();
    return pr;
  }

  // ---------------------------------------------------------------------------
  // Vendor Quotations & RFQ Awarding
  // ---------------------------------------------------------------------------
  public getVendorQuotations(companyId: string, rfqId?: string): VendorQuotation[] {
    if (!this.data.vendorQuotations) this.data.vendorQuotations = [];
    let list = this.data.vendorQuotations.filter(vq => vq.companyId === companyId);
    if (rfqId) list = list.filter(vq => vq.rfqId === rfqId);
    return list;
  }

  public addVendorQuotation(companyId: string, payload: any, user: { name: string }): VendorQuotation {
    if (!this.data.vendorQuotations) this.data.vendorQuotations = [];

    const quoteNumber = payload.quoteNumber || this.getNextSequence(companyId, 'VQ', 'vendor_quote');
    const id = payload.id || `vq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    let subtotal = 0;
    let gstAmount = 0;

    const items = (payload.items || []).map((it: any, idx: number) => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.unitRate) || 0;
      const discPct = Number(it.discountPercent) || 0;
      const taxable = (qty * rate) - (qty * rate * (discPct / 100));
      const gstRate = Number(it.gstRate) || 18;
      const tax = taxable * (gstRate / 100);
      const total = taxable + tax;

      subtotal += taxable;
      gstAmount += tax;

      return {
        id: it.id || `vqi-${Date.now()}-${idx}`,
        itemId: it.itemId || 'mat-item',
        itemCode: it.itemCode || `MAT-${idx + 1}`,
        itemName: it.itemName || 'Material',
        quantity: qty,
        unitRate: rate,
        discountPercent: discPct,
        taxableAmount: taxable,
        gstRate,
        gstAmount: tax,
        totalAmount: total,
        leadTimeDays: it.leadTimeDays || 7
      };
    });

    const freight = Number(payload.freightAmount) || 0;
    const other = Number(payload.otherCharges) || 0;
    const grandTotal = subtotal + gstAmount + freight + other;

    const newQuote: VendorQuotation = {
      id,
      companyId,
      rfqId: payload.rfqId,
      rfqNumber: payload.rfqNumber || 'RFQ-GENERAL',
      quoteNumber,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      supplierQuoteRef: payload.supplierQuoteRef || 'REF-SUPPLIER',
      quoteDate: payload.quoteDate || new Date().toISOString().split('T')[0],
      validUntil: payload.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      deliveryDays: Number(payload.deliveryDays) || 7,
      paymentTerms: payload.paymentTerms || '30 Days Net',
      subtotal,
      taxableAmount: subtotal,
      gstAmount,
      freightAmount: freight,
      otherCharges: other,
      grandTotal,
      isWinningQuote: false,
      selectionReason: '',
      notes: payload.notes || '',
      items,
      createdAt: new Date().toISOString()
    };

    this.data.vendorQuotations.push(newQuote);

    // Also attach to RFQ if found
    if (payload.rfqId) {
      const rfq = this.getRFQ(companyId, payload.rfqId);
      if (rfq) {
        if (!rfq.quotes) rfq.quotes = [];
        rfq.quotes.push({
          id,
          supplierId: newQuote.supplierId,
          supplierName: newQuote.supplierName,
          unitRate: items[0]?.unitRate || 0,
          gstRate: items[0]?.gstRate || 18,
          freightAmount: freight,
          deliveryDays: newQuote.deliveryDays,
          totalLandedCost: grandTotal,
          paymentTerms: newQuote.paymentTerms,
          notes: newQuote.notes,
          receivedAt: new Date().toISOString()
        });
        rfq.status = 'quotes_received';
      }
    }

    this.persist();
    return newQuote;
  }

  // ---------------------------------------------------------------------------
  // Purchase Order Record Creation & GRN Stock Ledger Posting
  // ---------------------------------------------------------------------------
  public createPurchaseOrderRecord(companyId: string, payload: any, user: { name: string }): PurchaseOrder {
    const poNumber = payload.poNumber || this.getNextSequence(companyId, 'PO', 'purchase_order');
    const id = payload.id || `po-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const company = this.getCompany(companyId);
    const companyState = company?.state || 'Maharashtra';
    const supplier = this.getSuppliers(companyId).find(s => s.id === payload.supplierId);
    const supplierState = supplier?.state || 'Maharashtra';
    const isIntra = isIntraStateGst(companyState, supplierState);

    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const items = (payload.items || []).map((it: any, idx: number) => {
      const qty = Number(it.quantity) || 1;
      const price = Number(it.unitPrice) || 0;
      const discPct = Number(it.discountPercent) || 0;
      const taxable = (qty * price) - (qty * price * (discPct / 100));
      const gstRate = Number(it.gstRate) || 18;
      const taxAmt = taxable * (gstRate / 100);
      const lineTotal = taxable + taxAmt;

      subtotal += taxable;
      if (isIntra) {
        cgstAmount += taxAmt / 2;
        sgstAmount += taxAmt / 2;
      } else {
        igstAmount += taxAmt;
      }

      return {
        id: it.id || `poi-${Date.now()}-${idx}`,
        itemId: it.itemId || 'item-raw',
        itemCode: it.itemCode || `RAW-${idx + 1}`,
        itemName: it.itemName || 'Raw Material',
        description: it.description || '',
        specs: it.specs || '',
        hsnSac: it.hsnSac || '7208',
        quantity: qty,
        unitPrice: price,
        discountPercent: discPct,
        taxableAmount: Math.round(taxable * 100) / 100,
        gstRate,
        taxAmount: Math.round(taxAmt * 100) / 100,
        totalAmount: Math.round(lineTotal * 100) / 100,
        receivedQuantity: 0,
        tolerancePercentage: Number(it.tolerancePercentage) || 5
      };
    });

    const grandTotal = Math.round((subtotal + cgstAmount + sgstAmount + igstAmount) * 100) / 100;

    const po: PurchaseOrder = {
      id,
      companyId,
      poNumber,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName || supplier?.name || 'Authorized Vendor',
      supplierReference: payload.supplierReference,
      requisitionId: payload.requisitionId,
      requisitionNumber: payload.requisitionNumber,
      rfqId: payload.rfqId,
      rfqNumber: payload.rfqNumber,
      vendorQuoteId: payload.vendorQuoteId,
      vendorQuoteRef: payload.vendorQuoteRef,
      orderDate: payload.orderDate || new Date().toISOString().split('T')[0],
      expectedDate: payload.expectedDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      deliveryLocation: payload.deliveryLocation || 'Plant Main Godown - Chakan',
      assignedBuyer: payload.assignedBuyer || user.name,
      priority: payload.priority || 'normal',
      status: payload.status || 'ordered',
      subtotal: Math.round(subtotal * 100) / 100,
      taxableAmount: Math.round(subtotal * 100) / 100,
      cgstAmount: Math.round(cgstAmount * 100) / 100,
      sgstAmount: Math.round(sgstAmount * 100) / 100,
      igstAmount: Math.round(igstAmount * 100) / 100,
      grandTotal,
      items,
      tolerancePercentage: Number(payload.tolerancePercentage) || 5,
      deliveryTerms: payload.deliveryTerms || 'Door Delivery Freight Pre-Paid',
      paymentTerms: payload.paymentTerms || '30 Days Net from GRN',
      freightTerms: payload.freightTerms || 'Included',
      packingTerms: payload.packingTerms || 'Standard Industrial Pallet',
      notes: payload.notes || '',
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.addPurchaseOrder(po);
    return po;
  }

  public updatePurchaseOrderStatus(
    companyId: string,
    id: string,
    status: PurchaseOrder['status'],
    user: { name: string },
    reason?: string
  ): PurchaseOrder | undefined {
    const po = this.getPurchaseOrder(companyId, id);
    if (!po) return undefined;
    po.status = status;
    po.updatedAt = new Date().toISOString();
    if (status === 'cancelled' && reason) {
      po.cancellationReason = reason;
    }
    this.persist();
    return po;
  }

  public createGRNRecord(companyId: string, poId: string, payload: any, user: { name: string }): GoodsReceiptNote {
    const po = this.getPurchaseOrder(companyId, poId);
    if (!po) throw new Error('Purchase order not found');

    const grnNumber = payload.grnNumber || this.getNextSequence(companyId, 'GRN', 'grn');
    const grnId = payload.id || `grn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const grnItems: any[] = [];
    let allFullyReceived = true;
    let anyReceived = false;

    for (const poItem of po.items) {
      const receivedInfo = payload.items?.find((i: any) => i.itemId === poItem.itemId || i.itemCode === poItem.itemCode);
      const currentReceived = receivedInfo ? Number(receivedInfo.currentReceivedQuantity || receivedInfo.receivedQuantity || receivedInfo.receivedQty || 0) : 0;
      const accepted = receivedInfo ? Number(receivedInfo.acceptedQuantity ?? currentReceived) : currentReceived;
      const rejected = receivedInfo ? Number(receivedInfo.rejectedQuantity || 0) : 0;
      const batchNo = receivedInfo?.batchNumber || receivedInfo?.batchNo || payload.batchNumber || `BAT-${Date.now().toString().slice(-6)}`;

      if (currentReceived > 0) anyReceived = true;

      const prevReceived = Number(poItem.receivedQuantity) || 0;
      const newTotalReceived = prevReceived + currentReceived;
      poItem.receivedQuantity = newTotalReceived;

      grnItems.push({
        itemId: poItem.itemId,
        itemCode: poItem.itemCode,
        itemName: poItem.itemName,
        uom: (poItem as any).uom || 'Nos',
        orderedQuantity: poItem.quantity,
        previouslyReceivedQuantity: prevReceived,
        currentReceivedQuantity: currentReceived,
        acceptedQuantity: accepted,
        rejectedQuantity: rejected,
        rejectionReason: receivedInfo?.rejectionReason,
        batchNumber: batchNo
      });

      if (poItem.receivedQuantity < poItem.quantity) {
        allFullyReceived = false;
      }

      // CENTRAL STOCK LEDGER INTEGRATION:
      // Post inventory movement for accepted goods
      if (accepted > 0) {
        const itemRecord = this.data.items.find(it => it.companyId === companyId && (it.id === poItem.itemId || it.itemCode === poItem.itemCode));
        if (itemRecord) {
          itemRecord.currentStock = (itemRecord.currentStock || 0) + accepted;
        }

        const stockTx: StockTransaction = {
          id: `stx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          companyId,
          transactionNumber: this.getNextSequence(companyId, 'STX', 'stock_tx'),
          itemId: poItem.itemId,
          itemCode: poItem.itemCode,
          itemName: poItem.itemName,
          warehouseId: payload.warehouseId || 'wh-main',
          warehouseName: payload.warehouseName || 'Plant Central Warehouse',
          transactionType: 'receipt_grn',
          quantity: accepted,
          unitCost: poItem.unitPrice,
          runningBalance: itemRecord ? itemRecord.currentStock : accepted,
          batchNumber: batchNo,
          referenceType: 'grn',
          referenceId: grnId,
          referenceNumber: grnNumber,
          notes: `GRN ${grnNumber} against PO ${po.poNumber}. Supplier: ${po.supplierName}`,
          createdBy: user.name,
          createdAt: new Date().toISOString()
        };
        this.data.stockTransactions.push(stockTx);
      }
    }

    // Update PO status
    if (allFullyReceived) {
      po.status = 'received';
    } else if (anyReceived) {
      po.status = 'partially_received';
    }
    po.updatedAt = new Date().toISOString();

    const grn: GoodsReceiptNote = {
      id: grnId,
      companyId,
      grnNumber,
      purchaseOrderId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      warehouseId: payload.warehouseId || 'wh-main',
      warehouseName: payload.warehouseName || 'Plant Central Warehouse',
      receiptDate: payload.receiptDate || new Date().toISOString().split('T')[0],
      supplierInvoiceNo: payload.supplierInvoiceNo || payload.supplierInvoiceNumber || 'INV-NA',
      deliveryChallanNo: payload.deliveryChallanNo,
      vehicleNumber: payload.vehicleNumber || 'MH 12 QW 4401',
      receivedBy: user.name,
      qcStatus: payload.qcStatus || 'inspected_passed',
      isStockPosted: true,
      items: grnItems,
      notes: payload.notes || '',
      createdAt: new Date().toISOString()
    };

    this.addGRN(grn);
    return grn;
  }

  // ---------------------------------------------------------------------------
  // Purchase Bills (3-Way Matching: PO - GRN - Bill)
  // ---------------------------------------------------------------------------
  public getPurchaseBills(companyId: string): PurchaseBill[] {
    if (!this.data.purchaseBills) this.data.purchaseBills = [];
    return this.data.purchaseBills.filter(pb => pb.companyId === companyId);
  }

  public createPurchaseBillRecord(companyId: string, payload: any, user: { name: string }): PurchaseBill {
    if (!this.data.purchaseBills) this.data.purchaseBills = [];

    const billNumber = payload.billNumber || this.getNextSequence(companyId, 'PB', 'purchase_bill');
    const id = payload.id || `pb-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const taxable = Number(payload.taxableAmount) || 0;
    const cgst = Number(payload.cgstAmount) || 0;
    const sgst = Number(payload.sgstAmount) || 0;
    const igst = Number(payload.igstAmount) || 0;
    const total = Number(payload.totalAmount) || (taxable + cgst + sgst + igst);

    const bill: PurchaseBill = {
      id,
      companyId,
      billNumber,
      supplierInvoiceNumber: payload.supplierInvoiceNumber || `INV-${Date.now()}`,
      invoiceDate: payload.invoiceDate || new Date().toISOString().split('T')[0],
      supplierId: payload.supplierId,
      supplierName: payload.supplierName,
      purchaseOrderId: payload.purchaseOrderId,
      poNumber: payload.poNumber,
      grnId: payload.grnId,
      grnNumber: payload.grnNumber,
      taxableAmount: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      totalAmount: total,
      dueDate: payload.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentStatus: payload.paymentStatus || 'unpaid',
      matchStatus: payload.matchStatus || 'matched',
      notes: payload.notes || '',
      createdAt: new Date().toISOString()
    };

    this.data.purchaseBills.push(bill);
    this.persist();
    return bill;
  }

  // ---------------------------------------------------------------------------
  // Work Orders & Shop Floor
  // ---------------------------------------------------------------------------
  public getWorkOrders(companyId: string): WorkOrder[] {
    return this.data.workOrders.filter(w => w.companyId === companyId);
  }

  public getWorkOrder(companyId: string, id: string): WorkOrder | undefined {
    return this.data.workOrders.find(w => w.companyId === companyId && w.id === id);
  }

  public addWorkOrder(wo: WorkOrder): WorkOrder {
    this.data.workOrders.push(wo);
    this.persist();
    return wo;
  }

  public updateWorkOrder(companyId: string, id: string, updates: Partial<WorkOrder>): WorkOrder | undefined {
    const index = this.data.workOrders.findIndex(w => w.companyId === companyId && w.id === id);
    if (index === -1) return undefined;
    this.data.workOrders[index] = { ...this.data.workOrders[index], ...updates };
    this.persist();
    return this.data.workOrders[index];
  }

  public getProductionEntries(companyId: string): ProductionEntry[] {
    return this.data.productionEntries.filter(p => p.companyId === companyId);
  }

  public addProductionEntry(entry: ProductionEntry): ProductionEntry {
    this.data.productionEntries.push(entry);
    this.persist();
    return entry;
  }

  // ---------------------------------------------------------------------------
  // Quality Inspections
  // ---------------------------------------------------------------------------
  public getQualityInspections(companyId: string): QualityInspection[] {
    return this.data.qualityInspections.filter(q => q.companyId === companyId);
  }

  public addQualityInspection(qi: QualityInspection): QualityInspection {
    this.data.qualityInspections.push(qi);
    this.persist();
    return qi;
  }

  // ---------------------------------------------------------------------------
  // Stock Transactions & Balances
  // ---------------------------------------------------------------------------
  public getStockTransactions(companyId: string): StockTransaction[] {
    return this.data.stockTransactions.filter(t => t.companyId === companyId);
  }

  public addStockTransaction(tx: StockTransaction): StockTransaction {
    this.data.stockTransactions.push(tx);

    // Automatically update the item's current stock
    const item = this.data.items.find(i => i.companyId === tx.companyId && i.id === tx.itemId);
    if (item) {
      if (['receipt_po', 'production_receipt', 'audit_adjustment_pos', 'transfer_in'].includes(tx.transactionType)) {
        item.currentStock += tx.quantity;
      } else if (['issue_production', 'dispatch_sales', 'audit_adjustment_neg', 'scrap', 'transfer_out'].includes(tx.transactionType)) {
        item.currentStock = Math.max(0, item.currentStock - tx.quantity);
      }
    }

    this.persist();
    return tx;
  }

  // ---------------------------------------------------------------------------
  // Invoices, Challans & Payments
  // ---------------------------------------------------------------------------
  public getInvoices(companyId: string): Invoice[] {
    return this.data.invoices.filter(i => i.companyId === companyId);
  }

  public addInvoice(inv: Invoice): Invoice {
    this.data.invoices.push(inv);
    this.persist();
    return inv;
  }

  public getDeliveryChallans(companyId: string): DeliveryChallan[] {
    return this.data.deliveryChallans.filter(d => d.companyId === companyId);
  }

  public addDeliveryChallan(dc: DeliveryChallan): DeliveryChallan {
    this.data.deliveryChallans.push(dc);
    this.persist();
    return dc;
  }

  public getPayments(companyId: string): Payment[] {
    return this.data.payments.filter(p => p.companyId === companyId);
  }

  public addPayment(payment: Payment): Payment {
    this.data.payments.push(payment);
    this.persist();
    return payment;
  }

  // ---------------------------------------------------------------------------
  // Accounting Ledger & Chart of Accounts
  // ---------------------------------------------------------------------------
  public getChartOfAccounts(companyId: string): ChartOfAccount[] {
    return this.data.chartOfAccounts.filter(c => c.companyId === companyId);
  }

  public getLedgerEntries(companyId: string): GeneralLedgerEntry[] {
    return this.data.ledgerEntries.filter(l => l.companyId === companyId);
  }

  public addLedgerEntry(entry: GeneralLedgerEntry): GeneralLedgerEntry {
    this.data.ledgerEntries.push(entry);
    this.persist();
    return entry;
  }

  // ---------------------------------------------------------------------------
  // Audit Logs
  // ---------------------------------------------------------------------------
  public logAudit(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    this.data.auditLogs.push({
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString()
    });
    this.persist();
  }

  // ---------------------------------------------------------------------------
  // CRM & Lead Management (Codozent One CRM Engine)
  // ---------------------------------------------------------------------------
  public calculateLeadScore(lead: Partial<CrmLead>): { score: number; breakdown: CrmScoreFactor[] } {
    let score = 20; // baseline for inbound inquiry
    const breakdown: CrmScoreFactor[] = [
      { factor: 'Initial Inquiry Baseline', points: 20, maxPoints: 20, reason: 'Inbound lead recorded' }
    ];

    if (lead.phone && lead.contactName) {
      score += 20;
      breakdown.push({ factor: 'Direct Contact Details', points: 20, maxPoints: 20, reason: 'Valid contact person and phone number provided' });
    } else {
      breakdown.push({ factor: 'Direct Contact Details', points: 0, maxPoints: 20, reason: 'Contact person or phone missing' });
    }

    if (lead.companyName && (lead.gstin || lead.address || lead.city)) {
      score += 20;
      breakdown.push({ factor: 'Verified Company Profile', points: 20, maxPoints: 20, reason: 'Company identity & address/GSTIN present' });
    } else {
      breakdown.push({ factor: 'Verified Company Profile', points: 0, maxPoints: 20, reason: 'Company registration details incomplete' });
    }

    if (lead.requirementDescription || lead.productInterest) {
      score += 20;
      breakdown.push({ factor: 'Clear Technical Requirement', points: 20, maxPoints: 20, reason: 'Product specification or scope defined' });
    } else {
      breakdown.push({ factor: 'Clear Technical Requirement', points: 0, maxPoints: 20, reason: 'Requirement or scope not yet captured' });
    }

    if (Number(lead.dealValue) > 0) {
      score += 10;
      breakdown.push({ factor: 'Budget / Deal Value Known', points: 10, maxPoints: 10, reason: `Estimated value: ₹${Number(lead.dealValue).toLocaleString('en-IN')}` });
    } else {
      breakdown.push({ factor: 'Budget / Deal Value Known', points: 0, maxPoints: 10, reason: 'Deal value unspecified' });
    }

    if (lead.nextFollowupDate) {
      score += 10;
      breakdown.push({ factor: 'Follow-up Scheduled', points: 10, maxPoints: 10, reason: `Next follow-up on ${lead.nextFollowupDate}` });
    } else {
      breakdown.push({ factor: 'Follow-up Scheduled', points: 0, maxPoints: 10, reason: 'No upcoming follow-up booked' });
    }

    return { score: Math.min(score, 100), breakdown };
  }

  public getLeads(companyId: string): CrmLead[] {
    return (this.data.leads || []).filter(l => l.companyId === companyId);
  }

  public getLead(companyId: string, id: string): CrmLead | null {
    return (this.data.leads || []).find(l => l.companyId === companyId && (l.id === id || l.leadNumber === id)) || null;
  }

  public createLead(leadData: Partial<CrmLead> & { companyId: string; contactName: string }): CrmLead {
    if (!this.data.leads) this.data.leads = [];
    if (!this.data.crmActivities) this.data.crmActivities = [];
    if (!this.data.crmFollowups) this.data.crmFollowups = [];

    const leadNumber = leadData.leadNumber || this.getNextSequence(leadData.companyId, 'LEAD', 'lead');
    const { score, breakdown } = this.calculateLeadScore(leadData);

    const newLead: CrmLead = {
      id: leadData.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      companyId: leadData.companyId,
      leadNumber,
      title: leadData.title || `${leadData.companyName || leadData.contactName} - Inquiry`,
      contactName: leadData.contactName,
      designation: leadData.designation || '',
      companyName: leadData.companyName || '',
      email: leadData.email || '',
      phone: leadData.phone || '',
      alternatePhone: leadData.alternatePhone || '',
      preferredContactMethod: leadData.preferredContactMethod || 'phone',
      website: leadData.website || '',
      industry: leadData.industry || 'Manufacturing & Engineering',
      companyType: leadData.companyType || 'Private Limited',
      companySize: leadData.companySize || '10-50 employees',
      gstin: leadData.gstin || '',
      address: leadData.address || '',
      city: leadData.city || 'Pune',
      state: leadData.state || 'Maharashtra',
      country: leadData.country || 'India',
      pincode: leadData.pincode || '',
      source: leadData.source || 'direct',
      sourceDetails: leadData.sourceDetails || '',
      productInterest: leadData.productInterest || '',
      requirementDescription: leadData.requirementDescription || '',
      targetQuantity: leadData.targetQuantity,
      targetDeliveryDate: leadData.targetDeliveryDate,
      dealValue: Number(leadData.dealValue) || 0,
      winProbability: Number(leadData.winProbability) || 30,
      expectedClosingDate: leadData.expectedClosingDate,
      priority: leadData.priority || 'medium',
      status: leadData.status || 'new',
      assignedTo: leadData.assignedTo || 'Sales Head',
      assignedToName: leadData.assignedToName || 'Sales Head',
      lostReason: leadData.lostReason,
      lostNotes: leadData.lostNotes,
      onHoldReason: leadData.onHoldReason,
      score,
      scoreBreakdown: breakdown,
      nextFollowupDate: leadData.nextFollowupDate,
      nextFollowupTime: leadData.nextFollowupTime,
      nextFollowupType: leadData.nextFollowupType,
      nextFollowupNotes: leadData.nextFollowupNotes,
      notes: leadData.notes || '',
      internalNotes: leadData.internalNotes || '',
      tags: leadData.tags || [],
      consentGranted: leadData.consentGranted ?? true,
      createdAt: leadData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastContactDate: new Date().toISOString()
    };

    this.data.leads.unshift(newLead);

    // Initial Creation Activity
    this.createLeadActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      leadId: newLead.id,
      companyId: newLead.companyId,
      type: 'lead_created',
      title: 'Lead Intake Created',
      description: `Lead ${newLead.leadNumber} created via channel "${newLead.source}". Deal value: ₹${newLead.dealValue.toLocaleString('en-IN')}`,
      performedBy: leadData.createdBy || 'Sales Executive',
      performedAt: new Date().toISOString()
    });

    // If nextFollowupDate is defined, schedule follow-up
    if (newLead.nextFollowupDate) {
      this.createLeadFollowup({
        id: `flw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        leadId: newLead.id,
        companyId: newLead.companyId,
        scheduledDate: newLead.nextFollowupDate,
        scheduledTime: newLead.nextFollowupTime || '11:00',
        type: newLead.nextFollowupType || 'call',
        assignedTo: newLead.assignedTo,
        assignedToName: newLead.assignedToName || newLead.assignedTo,
        title: `Follow-up on Requirement`,
        notes: newLead.nextFollowupNotes || 'Follow-up regarding manufacturing requirements and quotation',
        isCompleted: false,
        createdAt: new Date().toISOString()
      }, false);
    }

    this.persist();
    return newLead;
  }

  public updateLead(companyId: string, id: string, updates: Partial<CrmLead>, performerName: string = 'User'): CrmLead | null {
    const lead = (this.data.leads || []).find(l => l.companyId === companyId && l.id === id);
    if (!lead) return null;

    const previousStatus = lead.status;
    const previousAssignee = lead.assignedTo;

    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });

    // Recalculate score
    const { score, breakdown } = this.calculateLeadScore(lead);
    lead.score = score;
    lead.scoreBreakdown = breakdown;

    // Track stage change activity
    if (updates.status && updates.status !== previousStatus) {
      this.createLeadActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        leadId: lead.id,
        companyId,
        type: 'stage_change',
        title: `Stage changed to ${updates.status.replace(/_/g, ' ').toUpperCase()}`,
        description: `Lead moved from "${previousStatus.replace(/_/g, ' ')}" to "${updates.status.replace(/_/g, ' ')}"${updates.lostReason ? ` (Reason: ${updates.lostReason})` : ''}`,
        performedBy: performerName,
        performedAt: new Date().toISOString(),
        metadata: { fromStage: previousStatus, toStage: updates.status, lostReason: updates.lostReason }
      });
    }

    // Track assignment activity
    if (updates.assignedTo && updates.assignedTo !== previousAssignee) {
      this.createLeadActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        leadId: lead.id,
        companyId,
        type: 'assignment',
        title: `Lead Reassigned`,
        description: `Lead reassigned from ${previousAssignee} to ${updates.assignedTo}`,
        performedBy: performerName,
        performedAt: new Date().toISOString()
      });
    }

    this.persist();
    return lead;
  }

  public deleteLead(companyId: string, id: string): boolean {
    const initialLen = (this.data.leads || []).length;
    this.data.leads = (this.data.leads || []).filter(l => !(l.companyId === companyId && l.id === id));
    if (this.data.leads.length !== initialLen) {
      // Also clean up activities, followups, documents
      this.data.crmActivities = (this.data.crmActivities || []).filter(a => !(a.companyId === companyId && a.leadId === id));
      this.data.crmFollowups = (this.data.crmFollowups || []).filter(f => !(f.companyId === companyId && f.leadId === id));
      this.data.crmDocuments = (this.data.crmDocuments || []).filter(d => !(d.companyId === companyId && d.leadId === id));
      this.persist();
      return true;
    }
    return false;
  }

  // --- CRM Activities ---
  public getLeadActivities(companyId: string, leadId: string): CrmLeadActivity[] {
    return (this.data.crmActivities || [])
      .filter(a => a.companyId === companyId && a.leadId === leadId)
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  }

  public createLeadActivity(activity: CrmLeadActivity): CrmLeadActivity {
    if (!this.data.crmActivities) this.data.crmActivities = [];
    this.data.crmActivities.unshift(activity);
    this.persist();
    return activity;
  }

  // --- CRM Followups ---
  public getLeadFollowups(companyId: string, leadId?: string): CrmLeadFollowup[] {
    let list = (this.data.crmFollowups || []).filter(f => f.companyId === companyId);
    if (leadId) {
      list = list.filter(f => f.leadId === leadId);
    }
    return list.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  public createLeadFollowup(followup: CrmLeadFollowup, updateLeadRecord: boolean = true): CrmLeadFollowup {
    if (!this.data.crmFollowups) this.data.crmFollowups = [];
    this.data.crmFollowups.push(followup);

    if (updateLeadRecord) {
      const lead = (this.data.leads || []).find(l => l.companyId === followup.companyId && l.id === followup.leadId);
      if (lead) {
        lead.nextFollowupDate = followup.scheduledDate;
        lead.nextFollowupTime = followup.scheduledTime;
        lead.nextFollowupType = followup.type;
        lead.nextFollowupNotes = followup.notes;
        lead.updatedAt = new Date().toISOString();
      }

      this.createLeadActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        leadId: followup.leadId,
        companyId: followup.companyId,
        type: 'followup_created',
        title: `Follow-up Scheduled: ${followup.title}`,
        description: `${followup.type.toUpperCase()} scheduled on ${followup.scheduledDate} ${followup.scheduledTime || ''}. Notes: ${followup.notes || 'None'}`,
        performedBy: followup.assignedToName || followup.assignedTo || 'Sales',
        performedAt: new Date().toISOString()
      });
    }

    this.persist();
    return followup;
  }

  public updateLeadFollowup(companyId: string, id: string, updates: Partial<CrmLeadFollowup>, performerName: string = 'User'): CrmLeadFollowup | null {
    const flw = (this.data.crmFollowups || []).find(f => f.companyId === companyId && f.id === id);
    if (!flw) return null;

    const wasCompleted = flw.isCompleted;
    Object.assign(flw, updates, { updatedAt: new Date().toISOString() });

    if (!wasCompleted && flw.isCompleted) {
      flw.completedAt = new Date().toISOString();
      flw.completedBy = performerName;

      this.createLeadActivity({
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        leadId: flw.leadId,
        companyId,
        type: 'followup_completed',
        title: `Follow-up Completed (${flw.outcome ? flw.outcome.replace(/_/g, ' ') : 'Done'})`,
        description: `Follow-up completed. Outcome: ${flw.outcome || 'Connected'}.${flw.outcomeNotes ? ` Notes: ${flw.outcomeNotes}` : ''}`,
        performedBy: performerName,
        performedAt: new Date().toISOString()
      });

      // Update lead's lastContactDate
      const lead = (this.data.leads || []).find(l => l.companyId === companyId && l.id === flw.leadId);
      if (lead) {
        lead.lastContactDate = new Date().toISOString();
      }
    }

    this.persist();
    return flw;
  }

  // --- CRM Documents ---
  public getLeadDocuments(companyId: string, leadId: string): CrmLeadDocument[] {
    return (this.data.crmDocuments || [])
      .filter(d => d.companyId === companyId && d.leadId === leadId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public createLeadDocument(doc: CrmLeadDocument): CrmLeadDocument {
    if (!this.data.crmDocuments) this.data.crmDocuments = [];
    this.data.crmDocuments.unshift(doc);

    this.createLeadActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      leadId: doc.leadId,
      companyId: doc.companyId,
      type: 'document_uploaded',
      title: `Document Uploaded: ${doc.fileName}`,
      description: `File "${doc.fileName}" (${Math.round(doc.fileSize / 1024)} KB) uploaded.`,
      performedBy: doc.uploadedBy,
      performedAt: new Date().toISOString()
    });

    this.persist();
    return doc;
  }

  public deleteLeadDocument(companyId: string, id: string): boolean {
    const initialLen = (this.data.crmDocuments || []).length;
    this.data.crmDocuments = (this.data.crmDocuments || []).filter(d => !(d.companyId === companyId && d.id === id));
    if (this.data.crmDocuments.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Convert Lead to Quotation Draft ---
  public convertLeadToQuotation(companyId: string, leadId: string, user: { name: string } = { name: 'Sales Executive' }): { quotation: Quotation; customer: Customer; lead: CrmLead } | null {
    const lead = this.getLead(companyId, leadId);
    if (!lead) return null;

    // 1. Find or create matching Customer
    let customer = (this.data.customers || []).find(c =>
      c.companyId === companyId && (
        (lead.gstin && c.gstin && c.gstin.trim().toUpperCase() === lead.gstin.trim().toUpperCase()) ||
        (lead.phone && c.phone && c.phone.trim() === lead.phone.trim()) ||
        (lead.email && c.email && c.email.trim().toLowerCase() === lead.email.trim().toLowerCase()) ||
        (c.name.trim().toLowerCase() === (lead.companyName || lead.contactName).trim().toLowerCase())
      )
    );

    if (!customer) {
      const nextCustNum = this.getNextSequence(companyId, 'CUST', 'customer');
      customer = {
        id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        companyId,
        customerCode: nextCustNum,
        name: lead.companyName || lead.contactName,
        contactPerson: lead.contactName,
        email: lead.email || '',
        phone: lead.phone || '',
        gstin: lead.gstin || '',
        billingAddress: lead.address || `${lead.city || 'Pune'}, ${lead.state || 'Maharashtra'}`,
        shippingAddress: lead.address || `${lead.city || 'Pune'}, ${lead.state || 'Maharashtra'}`,
        creditLimit: 200000,
        paymentTermsDays: 30,
        currency: 'INR',
        isActive: true,
        outstandingBalance: 0
      };
      this.addCustomer(customer);
    }

    // 2. Create Draft Quotation
    const quoteNumber = this.getNextSequence(companyId, 'QUO', 'quotation');
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);

    const subtotal = Number(lead.dealValue) || 10000;
    const cgst = Math.round(subtotal * 0.09);
    const sgst = Math.round(subtotal * 0.09);
    const grandTotal = subtotal + cgst + sgst;

    const newQuotation: Quotation = {
      id: `quo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      companyId,
      quotationNumber: quoteNumber,
      revision: 'Rev A',
      customerId: customer.id,
      customerName: customer.name,
      quoteDate: new Date().toISOString().split('T')[0],
      validUntil: validUntilDate.toISOString().split('T')[0],
      status: 'draft',
      subtotal,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: 0,
      grandTotal,
      items: [
        {
          id: `item-${Date.now()}-1`,
          itemId: 'item-custom-req',
          itemCode: 'CUSTOM-MFG',
          itemName: lead.productInterest || lead.title || 'Precision Engineering Component',
          quantity: lead.targetQuantity || 1,
          unitPrice: subtotal / (lead.targetQuantity || 1),
          gstRate: 18,
          taxAmount: cgst + sgst,
          totalAmount: grandTotal
        }
      ],
      notes: `Generated from CRM Lead ${lead.leadNumber}. Requirement: ${lead.requirementDescription || 'Custom manufacturing as per drawing spec'}`,
      createdBy: user.name,
      leadId: lead.id,
      leadNumber: lead.leadNumber
    };

    this.addQuotation(newQuotation);

    // 3. Update Lead Status & Links
    lead.status = 'quotation_preparation';
    lead.convertedCustomerId = customer.id;
    lead.convertedCustomerName = customer.name;
    lead.convertedQuotationId = newQuotation.id;
    lead.convertedQuotationNumber = newQuotation.quotationNumber;
    lead.updatedAt = new Date().toISOString();

    // 4. Log conversion activity
    this.createLeadActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      leadId: lead.id,
      companyId,
      type: 'quotation_created',
      title: `Converted to Quotation Draft ${newQuotation.quotationNumber}`,
      description: `Draft Quotation ${newQuotation.quotationNumber} (₹${newQuotation.grandTotal.toLocaleString('en-IN')}) created. Linked to customer account ${customer.name}.`,
      performedBy: user.name,
      performedAt: new Date().toISOString(),
      metadata: { quotationId: newQuotation.id, customerId: customer.id }
    });

    this.persist();
    return { quotation: newQuotation, customer, lead };
  }

  // ---------------------------------------------------------------------------
  // Work & Project Management
  // ---------------------------------------------------------------------------
  public getProjects(companyId: string): WorkProject[] {
    return (this.data.projects || []).filter(p => p.companyId === companyId);
  }

  public createProject(project: WorkProject): WorkProject {
    if (!this.data.projects) this.data.projects = [];
    this.data.projects.push(project);
    this.persist();
    return project;
  }

  public getTasks(companyId: string): WorkTask[] {
    return (this.data.tasks || []).filter(t => t.companyId === companyId);
  }

  public createTask(task: WorkTask): WorkTask {
    if (!this.data.tasks) this.data.tasks = [];
    this.data.tasks.push(task);
    this.persist();
    return task;
  }

  public updateTask(companyId: string, id: string, updates: Partial<WorkTask>): WorkTask | null {
    const task = (this.data.tasks || []).find(t => t.companyId === companyId && t.id === id);
    if (!task) return null;
    Object.assign(task, updates);
    this.persist();
    return task;
  }

  // ---------------------------------------------------------------------------
  // Khatabook (Jama / Udhar)
  // ---------------------------------------------------------------------------
  public getKhataEntries(companyId: string, partyName?: string): KhataEntry[] {
    let entries = (this.data.khataEntries || []).filter(e => e.companyId === companyId);
    if (partyName) {
      entries = entries.filter(e => e.partyName.toLowerCase().includes(partyName.toLowerCase()));
    }
    return entries.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }

  public createKhataEntry(entry: KhataEntry): KhataEntry {
    if (!this.data.khataEntries) this.data.khataEntries = [];
    this.data.khataEntries.push(entry);
    this.persist();
    return entry;
  }

  // ---------------------------------------------------------------------------
  // GST Returns & 2B Matching
  // ---------------------------------------------------------------------------
  public getGstSummary(companyId: string): any {
    const invs = this.getInvoices(companyId);
    const pos = this.getPurchaseOrders(companyId);

    const outwardTaxable = invs.reduce((sum, i) => sum + (i.subtotal || 0), 0);
    const outputCgst = invs.reduce((sum, i) => sum + (i.cgstAmount || 0), 0);
    const outputSgst = invs.reduce((sum, i) => sum + (i.sgstAmount || 0), 0);
    const outputIgst = invs.reduce((sum, i) => sum + (i.igstAmount || 0), 0);
    const totalOutputTax = outputCgst + outputSgst + outputIgst;

    const inwardTaxable = pos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    const itcCgst = pos.reduce((sum, p) => sum + (p.cgstAmount || 0), 0);
    const itcSgst = pos.reduce((sum, p) => sum + (p.sgstAmount || 0), 0);
    const itcIgst = pos.reduce((sum, p) => sum + (p.igstAmount || 0), 0);
    const totalItc = itcCgst + itcSgst + itcIgst;

    const netTaxPayable = Math.max(0, totalOutputTax - totalItc);

    return {
      financialYear: '2025-26',
      returnPeriod: 'March 2026',
      grossB2BSales: outwardTaxable,
      b2bCount: invs.length,
      outwardTaxableValue: outwardTaxable,
      outputCgst,
      outputSgst,
      outputIgst,
      totalOutputTax,
      inwardTaxableValue: inwardTaxable,
      itcEligibleCgst: itcCgst,
      itcEligibleSgst: itcSgst,
      itcEligibleIgst: itcIgst,
      totalItc,
      itcReversal180Days: 0,
      netTaxPayable,
      challanStatus: netTaxPayable === 0 ? 'paid' : 'pending'
    };
  }

  public getGst2BRecords(companyId: string): Gst2BMatchRecord[] {
    return (this.data.gst2bRecords || []).filter(g => g.companyId === companyId);
  }

  public updateGst2BAction(companyId: string, id: string, action: 'claim' | 'hold' | 'reverse'): Gst2BMatchRecord | null {
    const record = (this.data.gst2bRecords || []).find(g => g.companyId === companyId && g.id === id);
    if (!record) return null;
    record.itcAction = action;
    this.persist();
    return record;
  }

  // ---------------------------------------------------------------------------
  // CA Desk & Statutory Scrutiny
  // ---------------------------------------------------------------------------
  public getCADeskQueries(companyId: string): CADeskQuery[] {
    return (this.data.caQueries || []).filter(q => q.companyId === companyId);
  }

  public createCADeskQuery(query: CADeskQuery): CADeskQuery {
    if (!this.data.caQueries) this.data.caQueries = [];
    this.data.caQueries.push(query);
    this.persist();
    return query;
  }

  public answerCADeskQuery(companyId: string, id: string, clientResponse: string): CADeskQuery | null {
    const query = (this.data.caQueries || []).find(q => q.companyId === companyId && q.id === id);
    if (!query) return null;
    query.clientResponse = clientResponse;
    query.status = 'answered';
    this.persist();
    return query;
  }

  public getMsmeScrutiny(companyId: string): any[] {
    const supps = this.getSuppliers(companyId);
    const pos = this.getPurchaseOrders(companyId);

    return supps.map(s => {
      const supplierPOs = pos.filter(p => p.supplierId === s.id);
      const totalPayable = s.outstandingPayable || supplierPOs.reduce((acc, p) => acc + p.grandTotal, 0);
      const overdueDays = totalPayable > 0 ? 32 : 0;
      const isBreach = overdueDays > 45;

      return {
        id: `msme-${s.id}`,
        supplierName: s.name,
        gstin: s.gstin,
        msmeRegistrationNo: `UDYAM-MH-12-00${s.id.slice(-4)}`,
        invoiceNumber: supplierPOs[0]?.poNumber || 'PO-2026-0001',
        invoiceDate: supplierPOs[0]?.orderDate || '2026-02-15',
        billAmount: totalPayable,
        dueDate: '2026-03-31',
        overdueDays,
        isSection43BhBreach: isBreach,
        riskLevel: isBreach ? 'breach' : overdueDays > 30 ? 'warning' : 'safe'
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Counter / Point of Sale
  // ---------------------------------------------------------------------------
  public getCounterSales(companyId: string): CounterSale[] {
    return (this.data.counterSales || []).filter(s => s.companyId === companyId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public createCounterSale(sale: CounterSale): CounterSale {
    if (!this.data.counterSales) this.data.counterSales = [];
    this.data.counterSales.push(sale);

    // Auto deduct inventory
    sale.items.forEach(item => {
      const dbItem = this.getItemById(item.itemId);
      if (dbItem) {
        dbItem.currentStock = Math.max(0, dbItem.currentStock - item.quantity);
      }
    });

    this.persist();
    return sale;
  }

  // ---------------------------------------------------------------------------
  // HRMS & Payroll
  // ---------------------------------------------------------------------------
  public getEmployees(companyId: string): HrmsEmployee[] {
    return (this.data.employees || []).filter(e => e.companyId === companyId);
  }

  public createEmployee(employee: HrmsEmployee): HrmsEmployee {
    if (!this.data.employees) this.data.employees = [];
    this.data.employees.push(employee);
    this.persist();
    return employee;
  }

  public getAttendance(companyId: string, date?: string): HrmsAttendanceRecord[] {
    let list = (this.data.attendance || []).filter(a => a.companyId === companyId);
    if (date) list = list.filter(a => a.date === date);
    return list;
  }

  public recordAttendance(record: HrmsAttendanceRecord): HrmsAttendanceRecord {
    if (!this.data.attendance) this.data.attendance = [];
    const existingIdx = this.data.attendance.findIndex(a => a.companyId === record.companyId && a.employeeId === record.employeeId && a.date === record.date);
    if (existingIdx >= 0) {
      this.data.attendance[existingIdx] = record;
    } else {
      this.data.attendance.push(record);
    }
    this.persist();
    return record;
  }

  public getPayrolls(companyId: string, month?: string): HrmsPayrollItem[] {
    let list = (this.data.payrolls || []).filter(p => (p as any).companyId === companyId || true);
    if (month) list = list.filter(p => p.month === month);
    return list;
  }

  public generatePayrollRun(companyId: string, month: string): HrmsPayrollItem[] {
    const emps = this.getEmployees(companyId);
    const newItems: HrmsPayrollItem[] = emps.map(emp => {
      const basic = emp.basicPay || Math.round(emp.monthlyGrossSalary * 0.5);
      const hra = emp.hra || Math.round(emp.monthlyGrossSalary * 0.3);
      const pf = Math.round(basic * 0.12);
      const esi = Math.round(emp.monthlyGrossSalary * 0.0075);
      const pt = 200;
      const netPayable = emp.monthlyGrossSalary - pf - esi - pt;

      return {
        id: `pay-${Date.now()}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode,
        month,
        workingDays: 26,
        daysPresent: 26,
        grossSalary: emp.monthlyGrossSalary,
        basic,
        hra,
        pfDeduction: pf,
        esiDeduction: esi,
        professionalTax: pt,
        salaryAdvanceDeduction: 0,
        netPayable,
        status: 'processed'
      };
    });

    if (!this.data.payrolls) this.data.payrolls = [];
    this.data.payrolls = this.data.payrolls.filter(p => p.month !== month);
    this.data.payrolls.push(...newItems);
    this.persist();
    return newItems;
  }

  // ---------------------------------------------------------------------------
  // Customer Support Desk
  // ---------------------------------------------------------------------------
  public getSupportTickets(companyId: string): SupportTicket[] {
    return (this.data.tickets || []).filter(t => t.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createSupportTicket(ticket: SupportTicket): SupportTicket {
    if (!this.data.tickets) this.data.tickets = [];
    this.data.tickets.push(ticket);
    this.persist();
    return ticket;
  }

  public addTicketMessage(companyId: string, id: string, sender: string, senderType: 'staff' | 'customer', message: string): SupportTicket | null {
    const ticket = (this.data.tickets || []).find(t => t.companyId === companyId && t.id === id);
    if (!ticket) return null;
    ticket.messages.push({
      id: `msg-${Date.now()}`,
      sender,
      senderType,
      message,
      timestamp: new Date().toISOString()
    });
    this.persist();
    return ticket;
  }

  public updateTicketStatus(companyId: string, id: string, status: SupportTicket['status']): SupportTicket | null {
    const ticket = (this.data.tickets || []).find(t => t.companyId === companyId && t.id === id);
    if (!ticket) return null;
    ticket.status = status;
    this.persist();
    return ticket;
  }

  // ---------------------------------------------------------------------------
  // AI Copilot Query Processing
  // ---------------------------------------------------------------------------
  public askAssistant(companyId: string, query: string): { reply: string; action?: any } {
    const q = query.toLowerCase();
    const invs = this.getInvoices(companyId);
    const custs = this.getCustomers(companyId);
    const supps = this.getSuppliers(companyId);
    const items = this.getItems(companyId);

    if (q.includes('payment') || q.includes('baki') || q.includes('outstanding') || q.includes('udhar')) {
      const pendingInvs = invs.filter(i => i.status !== 'paid');
      const totalPending = pendingInvs.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
      const topCustomer = custs.sort((a, b) => (b.outstandingBalance || 0) - (a.outstandingBalance || 0))[0];

      return {
        reply: `Iss mahine kul ₹${totalPending.toLocaleString('en-IN')} ka payment pending hai across ${pendingInvs.length} invoices. Sabse zyada pending ${topCustomer ? `${topCustomer.name} (₹${topCustomer.outstandingBalance.toLocaleString('en-IN')})` : 'Apex Components'} se lena hai.`,
        action: { title: 'Open Khatabook / Receivables', module: 'khatabook' }
      };
    }

    if (q.includes('quote') || q.includes('quotation') || q.includes('estimate')) {
      return {
        reply: `Maine Quotations module me naya estimate draft taiyyar kiya hai. HSN aur 18% GST auto-calculate kar diya gaya hai. Kya aap isse WhatsApp par bhejkar client approval lena chahte hain?`,
        action: { title: 'Create / View Quotation', module: 'quotations' }
      };
    }

    if (q.includes('stock') || q.includes('inventory') || q.includes('shortage') || q.includes('mrp')) {
      const lowStock = items.filter(i => i.currentStock <= i.reorderLevel);
      return {
        reply: `Plant me ${lowStock.length} items low stock alert par hain. Reorder level touch ho chuka hai. Ek click me vendor ko Purchase Order (PO) dispatch kar sakte hain.`,
        action: { title: 'Check Inventory & MRP', module: 'inventory' }
      };
    }

    if (q.includes('gst') || q.includes('tax') || q.includes('challan') || q.includes('return')) {
      const gst = this.getGstSummary(companyId);
      return {
        reply: `Current filing period (${gst.returnPeriod}) ke liye Outward Tax ₹${gst.totalOutputTax.toLocaleString('en-IN')} aur Input Tax Credit (ITC) ₹${gst.totalItc.toLocaleString('en-IN')} hai. Net tax payable: ₹${gst.netTaxPayable.toLocaleString('en-IN')}.`,
        action: { title: 'Open GST Compliance Desk', module: 'gstReturns' }
      };
    }

    return {
      reply: `Codozent One AI Copilot active hai. Aap natural language me leads, billing, GST, factory stock, ya worker attendance ki jankari maang sakte hain.`,
      action: { title: 'View Executive Dashboard', module: 'dashboard' }
    };
  }

  // ---------------------------------------------------------------------------
  // Clear Data (Factory Reset to Clean State)
  // ---------------------------------------------------------------------------
  public clearCompanyData(companyId: string): void {
    this.data.items = this.data.items.filter(i => i.companyId !== companyId);
    this.data.boms = this.data.boms.filter(b => b.companyId !== companyId);
    this.data.customers = this.data.customers.filter(c => c.companyId !== companyId);
    this.data.suppliers = this.data.suppliers.filter(s => s.companyId !== companyId);
    this.data.quotations = this.data.quotations.filter(q => q.companyId !== companyId);
    this.data.salesOrders = this.data.salesOrders.filter(s => s.companyId !== companyId);
    this.data.purchaseOrders = this.data.purchaseOrders.filter(p => p.companyId !== companyId);
    this.data.grns = this.data.grns.filter(g => g.companyId !== companyId);
    this.data.workOrders = this.data.workOrders.filter(w => w.companyId !== companyId);
    this.data.productionEntries = this.data.productionEntries.filter(p => p.companyId !== companyId);
    this.data.qualityInspections = this.data.qualityInspections.filter(q => q.companyId !== companyId);
    this.data.stockTransactions = this.data.stockTransactions.filter(t => t.companyId !== companyId);
    this.data.invoices = this.data.invoices.filter(i => i.companyId !== companyId);
    this.data.payments = this.data.payments.filter(p => p.companyId !== companyId);
    this.data.deliveryChallans = this.data.deliveryChallans.filter(d => d.companyId !== companyId);
    this.data.ledgerEntries = this.data.ledgerEntries.filter(l => l.companyId !== companyId);
    this.data.leads = (this.data.leads || []).filter(l => l.companyId !== companyId);
    this.data.crmActivities = (this.data.crmActivities || []).filter(a => a.companyId !== companyId);
    this.data.crmFollowups = (this.data.crmFollowups || []).filter(f => f.companyId !== companyId);
    this.data.crmDocuments = (this.data.crmDocuments || []).filter(d => d.companyId !== companyId);
    this.data.projects = (this.data.projects || []).filter(p => p.companyId !== companyId);
    this.data.tasks = (this.data.tasks || []).filter(t => t.companyId !== companyId);
    this.data.khataEntries = (this.data.khataEntries || []).filter(k => k.companyId !== companyId);
    this.data.gst2bRecords = (this.data.gst2bRecords || []).filter(g => g.companyId !== companyId);
    this.data.caQueries = (this.data.caQueries || []).filter(c => c.companyId !== companyId);
    this.data.counterSales = (this.data.counterSales || []).filter(s => s.companyId !== companyId);
    this.data.employees = (this.data.employees || []).filter(e => e.companyId !== companyId);
    this.data.attendance = (this.data.attendance || []).filter(a => a.companyId !== companyId);
    this.data.payrolls = (this.data.payrolls || []).filter(p => (p as any).companyId !== companyId);
    this.data.tickets = (this.data.tickets || []).filter(t => t.companyId !== companyId);
    this.persist();
  }

  // ---------------------------------------------------------------------------
  // Optional Seed Demo Data (Only when user explicitly asks for sample data)
  // ---------------------------------------------------------------------------
  public seedDemoData(companyId: string, demoData: Partial<ERPDatabaseSchema>): void {
    if (demoData.items) this.data.items.push(...demoData.items);
    if (demoData.customers) this.data.customers.push(...demoData.customers);
    if (demoData.suppliers) this.data.suppliers.push(...demoData.suppliers);
    if (demoData.boms) this.data.boms.push(...demoData.boms);
    if (demoData.salesOrders) this.data.salesOrders.push(...demoData.salesOrders);
    if (demoData.purchaseOrders) this.data.purchaseOrders.push(...demoData.purchaseOrders);
    if (demoData.workOrders) this.data.workOrders.push(...demoData.workOrders);
    if (demoData.stockTransactions) this.data.stockTransactions.push(...demoData.stockTransactions);
    if (demoData.qualityInspections) this.data.qualityInspections.push(...demoData.qualityInspections);
    if (demoData.invoices) this.data.invoices.push(...demoData.invoices);
    this.persist();
  }
}

export const db = new ERPStore();

