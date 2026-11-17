// ==============================================================================
// FACTORYFLOW ERP - UNIFIED REST API CLIENT
// Connects React Frontend to Backend Server on Unified Port
// ==============================================================================

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('factoryflow_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('factoryflow_token', token);
    } else {
      localStorage.removeItem('factoryflow_token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const json = await response.json();

    if (!response.ok || json.success === false) {
      const errMsg = json.error?.message || `API request failed with status ${response.status}`;
      const err: any = new Error(errMsg);
      err.code = json.error?.code;
      err.status = response.status;
      err.requiresOnboarding = json.requiresOnboarding;
      err.googleProfile = json.googleProfile;
      throw err;
    }

    return json.data as T;
  }

  // Auth endpoints
  public auth = {
    login: (credentials: { email: string; password?: string }) =>
      this.request<{ token: string; user: any; activeCompany: any; companies: any[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (data: { name: string; email: string; password: string; companyName: string; gstin?: string; city?: string; role?: string }) =>
      this.request<{ token: string; user: any; activeCompany: any; companies: any[] }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    googleOAuth: (data: { email: string; name?: string; avatarUrl?: string; supabaseToken?: string }) =>
      this.request<{ token: string; user: any; activeCompany: any; companies: any[] }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onboard: (data: any) =>
      this.request<{ token: string; user: any; activeCompany: any; companies: any[] }>('/auth/onboard', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    selectCompany: (companyId: string) =>
      this.request<{ token: string; activeCompany: any; companies: any[] }>('/auth/select-company', {
        method: 'POST',
        body: JSON.stringify({ companyId })
      }),
    getMe: () => this.request<{ user: any; activeCompany: any; companies: any[] }>('/auth/me'),
    logout: () => this.request<any>('/auth/logout', { method: 'POST' })
  };

  // Company management
  public companies = {
    list: () => this.request<any[]>('/companies'),
    get: (id: string) => this.request<any>(`/companies/${id}`),
    create: (data: any) => this.request<any>('/companies', { method: 'POST', body: JSON.stringify(data) })
  };

  // Modules & Plug-and-Play Architecture
  public modules = {
    list: (companyId: string) => this.request<any[]>(`/companies/${companyId}/modules`),
    enable: (companyId: string, moduleId: string, settings?: any) =>
      this.request<any>(`/companies/${companyId}/modules/${moduleId}/enable`, {
        method: 'POST',
        body: JSON.stringify({ settings })
      }),
    disable: (companyId: string, moduleId: string) =>
      this.request<any>(`/companies/${companyId}/modules/${moduleId}/disable`, {
        method: 'POST'
      }),
    updateSettings: (companyId: string, moduleId: string, settings: any) =>
      this.request<any>(`/companies/${companyId}/modules/${moduleId}/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
      })
  };

  // Access & RBAC
  public access = {
    listUsers: (companyId: string) => this.request<any[]>(`/companies/${companyId}/access/users`),
    allotRole: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/access/users/allot`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    verifyUser: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/access/users/verify`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    listRoles: (companyId: string) => this.request<any>(`/companies/${companyId}/access/roles`),
    createRole: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/access/roles`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  };

  // Branches
  public branches = {
    list: (companyId: string) => this.request<any[]>(`/companies/${companyId}/branches`),
    create: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/branches`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  };

  // Customers
  public customers = {
    list: (companyId: string) => this.request<any[]>(`/companies/${companyId}/customers`),
    create: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/customers`, { method: 'POST', body: JSON.stringify(data) }),
    update: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/customers/${id}`, { method: 'DELETE' })
  };

  // Suppliers
  public suppliers = {
    list: (companyId: string) => this.request<any[]>(`/companies/${companyId}/suppliers`),
    create: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/suppliers`, { method: 'POST', body: JSON.stringify(data) }),
    update: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/suppliers/${id}`, { method: 'DELETE' })
  };

  // Items / Catalog
  public items = {
    list: (companyId: string) => this.request<any[]>(`/companies/${companyId}/items`),
    create: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/items`, { method: 'POST', body: JSON.stringify(data) }),
    update: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/items/${id}`, { method: 'DELETE' })
  };

  // BOMs
  public boms = {
    list: (companyId: string) => this.request<any[]>(`/companies/${companyId}/boms`),
    create: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/boms`, { method: 'POST', body: JSON.stringify(data) })
  };

  // Quotations & Sales
  public sales = {
    listQuotations: (companyId: string, params?: { search?: string; status?: string; customerId?: string; page?: number; limit?: number }) => {
      let query = '';
      if (params) {
        const q = new URLSearchParams();
        if (params.search) q.append('search', params.search);
        if (params.status) q.append('status', params.status);
        if (params.customerId) q.append('customerId', params.customerId);
        if (params.page) q.append('page', String(params.page));
        if (params.limit) q.append('limit', String(params.limit));
        query = `?${q.toString()}`;
      }
      return this.request<any>(`/companies/${companyId}/quotations${query}`);
    },
    getQuotation: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}`),
    createQuotation: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/quotations`, { method: 'POST', body: JSON.stringify(data) }),
    updateQuotation: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    createRevision: (companyId: string, id: string, reason: string, updates: any = {}) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/revisions`, { method: 'POST', body: JSON.stringify({ reason, updates }) }),
    updateStatus: (companyId: string, id: string, status: string, metadata: any = {}) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/status`, { method: 'POST', body: JSON.stringify({ status, ...metadata }) }),
    submitApproval: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/submit-approval`, { method: 'POST' }),
    approveQuotation: (companyId: string, id: string, comments?: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/approve`, { method: 'POST', body: JSON.stringify({ comments }) }),
    rejectQuotation: (companyId: string, id: string, reason?: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    sendQuotation: (companyId: string, id: string, sentVia: 'email' | 'whatsapp' | 'manual' = 'email', comments?: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/send`, { method: 'POST', body: JSON.stringify({ sentVia, comments }) }),
    recordCustomerResponse: (companyId: string, id: string, response: 'accepted' | 'rejected' | 'revision_requested', reason?: string, comments?: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/customer-response`, { method: 'POST', body: JSON.stringify({ response, reason, comments }) }),
    duplicateQuotation: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/duplicate`, { method: 'POST' }),
    convertToOrder: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/convert-to-order`, { method: 'POST' }),
    addAttachment: (companyId: string, id: string, attachment: any) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}/attachments`, { method: 'POST', body: JSON.stringify(attachment) }),
    deleteQuotation: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/quotations/${id}`, { method: 'DELETE' }),
    listOrders: (companyId: string, params?: { search?: string; status?: string; customerId?: string }) => {
      let query = '';
      if (params) {
        const q = new URLSearchParams();
        if (params.search) q.append('search', params.search);
        if (params.status) q.append('status', params.status);
        if (params.customerId) q.append('customerId', params.customerId);
        query = `?${q.toString()}`;
      }
      return this.request<any[]>(`/companies/${companyId}/sales-orders${query}`);
    },
    getOrder: (companyId: string, id: string) => this.request<any>(`/companies/${companyId}/sales-orders/${id}`),
    createOrder: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/sales-orders`, { method: 'POST', body: JSON.stringify(data) }),
    updateOrderStatus: (companyId: string, id: string, status: string, reason?: string) =>
      this.request<any>(`/companies/${companyId}/sales-orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status, reason }) }),
    cancelOrder: (companyId: string, id: string, reason: string) =>
      this.request<any>(`/companies/${companyId}/sales-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    getDashboard: (companyId: string) => this.request<any>(`/companies/${companyId}/sales-dashboard`),
    raiseProforma: (companyId: string, id: string, advancePercentage?: number) =>
      this.request<any>(`/companies/${companyId}/sales-orders/${id}/proforma`, { method: 'POST', body: JSON.stringify({ advancePercentage }) }),
    recordAdvancePayment: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/sales-orders/${id}/advance-payment`, { method: 'POST', body: JSON.stringify(data) }),
    dispatchOrder: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/sales-orders/${id}/dispatch`, { method: 'POST', body: JSON.stringify(data) }),
    generateInvoice: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/sales-orders/${id}/invoice`, { method: 'POST' }),
    listChallans: (companyId: string) => this.request<any[]>(`/companies/${companyId}/challans`),
    listInvoices: (companyId: string) => this.request<any[]>(`/companies/${companyId}/invoices`)
  };

  // Purchase & MRP
  public purchase = {
    getDashboard: (companyId: string) => this.request<any>(`/companies/${companyId}/purchase-dashboard`),
    listOrders: (companyId: string, params?: { search?: string; status?: string; supplierId?: string }) => {
      let query = '';
      if (params) {
        const q = new URLSearchParams();
        if (params.search) q.append('search', params.search);
        if (params.status) q.append('status', params.status);
        if (params.supplierId) q.append('supplierId', params.supplierId);
        query = `?${q.toString()}`;
      }
      return this.request<any[]>(`/companies/${companyId}/purchase-orders${query}`);
    },
    getOrder: (companyId: string, id: string) => this.request<any>(`/companies/${companyId}/purchase-orders/${id}`),
    createOrder: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/purchase-orders`, { method: 'POST', body: JSON.stringify(data) }),
    updateOrderStatus: (companyId: string, id: string, status: string, reason?: string) =>
      this.request<any>(`/companies/${companyId}/purchase-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
    cancelOrder: (companyId: string, id: string, reason: string) =>
      this.request<any>(`/companies/${companyId}/purchase-orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    receiveGRN: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/purchase-orders/${id}/grn`, { method: 'POST', body: JSON.stringify(data) }),
    listGRNs: (companyId: string) => this.request<any[]>(`/companies/${companyId}/grns`),
    listRFQs: (companyId: string) => this.request<any[]>(`/companies/${companyId}/rfqs`),
    createRFQ: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/rfqs`, { method: 'POST', body: JSON.stringify(data) }),
    addQuoteToRFQ: (companyId: string, id: string, quote: any) =>
      this.request<any>(`/companies/${companyId}/rfqs/${id}/quote`, { method: 'POST', body: JSON.stringify(quote) }),
    awardRFQ: (companyId: string, id: string, quoteId: string) =>
      this.request<any>(`/companies/${companyId}/rfqs/${id}/award`, { method: 'POST', body: JSON.stringify({ quoteId }) }),
    listRequisitions: (companyId: string) => this.request<any[]>(`/companies/${companyId}/requisitions`),
    createRequisition: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/requisitions`, { method: 'POST', body: JSON.stringify(data) }),
    updateRequisitionStatus: (companyId: string, id: string, status: string, remarks?: string) =>
      this.request<any>(`/companies/${companyId}/requisitions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, remarks }) }),
    listVendorQuotes: (companyId: string, rfqId?: string) => {
      const query = rfqId ? `?rfqId=${rfqId}` : '';
      return this.request<any[]>(`/companies/${companyId}/vendor-quotes${query}`);
    },
    createVendorQuote: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/vendor-quotes`, { method: 'POST', body: JSON.stringify(data) }),
    listBills: (companyId: string) => this.request<any[]>(`/companies/${companyId}/bills`),
    createBill: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/bills`, { method: 'POST', body: JSON.stringify(data) }),
    getMRP: (companyId: string) => this.request<any[]>(`/companies/${companyId}/mrp`)
  };

  // Manufacturing & Shopfloor
  public manufacturing = {
    listWorkOrders: (companyId: string) => this.request<any[]>(`/companies/${companyId}/work-orders`),
    createWorkOrder: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/work-orders`, { method: 'POST', body: JSON.stringify(data) }),
    startJob: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/work-orders/${id}/start-job`, { method: 'POST' }),
    logProduction: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/work-orders/${id}/production-entries`, { method: 'POST', body: JSON.stringify(data) }),
    listProductionEntries: (companyId: string) => this.request<any[]>(`/companies/${companyId}/reports/production`),
    listWorkCenters: (companyId: string) => this.request<any[]>(`/companies/${companyId}/work-centers`),
    createWorkCenter: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/work-centers`, { method: 'POST', body: JSON.stringify(data) }),
    updateWorkCenter: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/work-centers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteWorkCenter: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/work-centers/${id}`, { method: 'DELETE' }),
    getWhatToBuy: (companyId: string) => this.request<any[]>(`/companies/${companyId}/what-to-buy`)
  };

  // Quality Control
  public quality = {
    listInspections: (companyId: string) => this.request<any[]>(`/companies/${companyId}/inspections`),
    createInspection: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/inspections`, { method: 'POST', body: JSON.stringify(data) })
  };

  // Inventory & Stores
  public inventory = {
    getTransactions: (companyId: string) => this.request<any[]>(`/companies/${companyId}/stock-transactions`),
    getBalances: (companyId: string) => this.request<any[]>(`/companies/${companyId}/stock-balances`),
    getWarehouses: (companyId: string) => this.request<any[]>(`/companies/${companyId}/warehouses`),
    adjustStock: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/stock-adjustment`, { method: 'POST', body: JSON.stringify(data) })
  };

  // Finance & GST
  public finance = {
    getChartOfAccounts: (companyId: string) => this.request<any[]>(`/companies/${companyId}/chart-of-accounts`),
    getLedgerEntries: (companyId: string) => this.request<any[]>(`/companies/${companyId}/ledger-entries`),
    getPayments: (companyId: string) => this.request<any[]>(`/companies/${companyId}/payments`),
    recordPayment: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/payments`, { method: 'POST', body: JSON.stringify(data) }),
    getGSTSummary: (companyId: string) => this.request<any>(`/companies/${companyId}/gst-summary`)
  };

  // Reports
  public reports = {
    getProduction: (companyId: string) => this.request<any>(`/companies/${companyId}/reports/production`),
    getStockValuation: (companyId: string) => this.request<any>(`/companies/${companyId}/reports/stock-valuation`),
    getSalesRegister: (companyId: string) => this.request<any>(`/companies/${companyId}/reports/sales-register`)
  };

  // Seed & Reset
  public admin = {
    clearData: (companyId: string) => this.request<any>(`/companies/${companyId}/clear-data`, { method: 'POST' })
  };

  // --- CRM & Leads (Codozent One CRM Engine) ---
  public crm = {
    listLeads: (companyId: string, params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/companies/${companyId}/crm/leads${q}`);
    },
    getLead: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/crm/leads/${id}`),
    createLead: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/crm/leads`, { method: 'POST', body: JSON.stringify(data) }),
    updateLead: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/crm/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteLead: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/crm/leads/${id}`, { method: 'DELETE' }),
    checkDuplicate: (companyId: string, data: { phone?: string; email?: string; companyName?: string; excludeId?: string }) =>
      this.request<{ hasDuplicates: boolean; duplicates: any[] }>(`/companies/${companyId}/crm/leads/check-duplicate`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getStats: (companyId: string) =>
      this.request<any>(`/companies/${companyId}/crm/stats`),
    listActivities: (companyId: string, leadId: string) =>
      this.request<any[]>(`/companies/${companyId}/crm/leads/${leadId}/activities`),
    createActivity: (companyId: string, leadId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/crm/leads/${leadId}/activities`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    listFollowups: (companyId: string, params?: { leadId?: string; filter?: string }) => {
      const q = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return this.request<any[]>(`/companies/${companyId}/crm/followups${q}`);
    },
    createFollowup: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/crm/followups`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateFollowup: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/crm/followups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    listDocuments: (companyId: string, leadId: string) =>
      this.request<any[]>(`/companies/${companyId}/crm/leads/${leadId}/documents`),
    createDocument: (companyId: string, leadId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/crm/leads/${leadId}/documents`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteDocument: (companyId: string, docId: string) =>
      this.request<any>(`/companies/${companyId}/crm/documents/${docId}`, {
        method: 'DELETE'
      }),
    convertToQuotation: (companyId: string, leadId: string) =>
      this.request<{ success: boolean; message: string; data: { quotation: any; customer: any; lead: any } }>(
        `/companies/${companyId}/crm/leads/${leadId}/convert-to-quotation`,
        { method: 'POST' }
      ),
    importLeads: (companyId: string, rows: any[], skipDuplicates = true) =>
      this.request<any>(`/companies/${companyId}/crm/leads/import`, {
        method: 'POST',
        body: JSON.stringify({ rows, skipDuplicates })
      })
  };

  // --- Work & Projects ---
  public work = {
    listProjects: (companyId: string) => this.request<any[]>(`/companies/${companyId}/work/projects`),
    createProject: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/work/projects`, { method: 'POST', body: JSON.stringify(data) }),
    listTasks: (companyId: string) => this.request<any[]>(`/companies/${companyId}/work/tasks`),
    createTask: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/work/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    updateTask: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/work/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  };

  // --- Khatabook (Jama / Udhar) ---
  public khatabook = {
    listEntries: (companyId: string, party?: string) =>
      this.request<any[]>(`/companies/${companyId}/khatabook/entries${party ? `?party=${encodeURIComponent(party)}` : ''}`),
    createEntry: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/khatabook/entries`, { method: 'POST', body: JSON.stringify(data) }),
    sendWhatsAppReminder: (companyId: string, id: string) =>
      this.request<any>(`/companies/${companyId}/khatabook/entries/${id}/send-whatsapp`, { method: 'POST' })
  };

  // --- GST Returns & 2B ---
  public gst = {
    getSummary: (companyId: string) => this.request<any>(`/companies/${companyId}/gst/summary`),
    list2BMatches: (companyId: string) => this.request<any[]>(`/companies/${companyId}/gst/2b-match`),
    update2BAction: (companyId: string, id: string, action: string) =>
      this.request<any>(`/companies/${companyId}/gst/2b-match/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) })
  };

  // --- CA Desk ---
  public caDesk = {
    listQueries: (companyId: string) => this.request<any[]>(`/companies/${companyId}/ca-desk/queries`),
    createQuery: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/ca-desk/queries`, { method: 'POST', body: JSON.stringify(data) }),
    answerQuery: (companyId: string, id: string, clientResponse: string) =>
      this.request<any>(`/companies/${companyId}/ca-desk/queries/${id}/answer`, { method: 'POST', body: JSON.stringify({ clientResponse }) }),
    getMsmeScrutiny: (companyId: string) => this.request<any[]>(`/companies/${companyId}/ca-desk/msme-scrutiny`),
    getScheduleIII: (companyId: string) => this.request<any>(`/companies/${companyId}/ca-desk/schedule-iii`)
  };

  // --- Counter / Point of Sale ---
  public counter = {
    listSales: (companyId: string) => this.request<any[]>(`/companies/${companyId}/counter/sales`),
    checkout: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/counter/checkout`, { method: 'POST', body: JSON.stringify(data) })
  };

  // --- HRMS & Payroll ---
  public hrms = {
    listEmployees: (companyId: string) => this.request<any[]>(`/companies/${companyId}/hrms/employees`),
    createEmployee: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/hrms/employees`, { method: 'POST', body: JSON.stringify(data) }),
    getAttendance: (companyId: string, date?: string) =>
      this.request<any[]>(`/companies/${companyId}/hrms/attendance${date ? `?date=${date}` : ''}`),
    recordAttendance: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/hrms/attendance`, { method: 'POST', body: JSON.stringify(data) }),
    getPayroll: (companyId: string, month?: string) =>
      this.request<any[]>(`/companies/${companyId}/hrms/payroll${month ? `?month=${encodeURIComponent(month)}` : ''}`),
    runPayroll: (companyId: string, month?: string) =>
      this.request<any>(`/companies/${companyId}/hrms/payroll/run`, { method: 'POST', body: JSON.stringify({ month }) })
  };

  // --- Customer Support Desk ---
  public support = {
    listTickets: (companyId: string) => this.request<any[]>(`/companies/${companyId}/support/tickets`),
    createTicket: (companyId: string, data: any) =>
      this.request<any>(`/companies/${companyId}/support/tickets`, { method: 'POST', body: JSON.stringify(data) }),
    replyTicket: (companyId: string, id: string, data: any) =>
      this.request<any>(`/companies/${companyId}/support/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (companyId: string, id: string, status: string) =>
      this.request<any>(`/companies/${companyId}/support/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  };

  // --- AI Copilot Assistant ---
  public assistant = {
    chat: (companyId: string, message: string) =>
      this.request<any>(`/companies/${companyId}/assistant/chat`, { method: 'POST', body: JSON.stringify({ message }) })
  };
}

export const api = new ApiClient();

