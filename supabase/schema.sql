-- ==============================================================================
-- CODOZENT ENTERPRISE ERP - COMPLETE MASTER DATABASE SCHEMA
-- Multi-Tenant, Multi-Company, Granular RBAC, Full S2C & P2P Pipelines
-- Run this complete script in Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TENANTS & MULTI-ORGANIZATION GOVERNANCE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'enterprise',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMPANIES (Legal Entities)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Pune',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    state_code VARCHAR(2) DEFAULT '27',
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'INR',
    fiscal_year_start VARCHAR(10) DEFAULT '04-01',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BRANCHES & PLANT FACILITIES
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    phone VARCHAR(20),
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 4. CENTRALIZED MODULE REGISTRY
CREATE TABLE IF NOT EXISTS module_registry (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    is_core BOOLEAN DEFAULT FALSE,
    capabilities JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPANY MODULE ACTIVATIONS
CREATE TABLE IF NOT EXISTS company_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL REFERENCES module_registry(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'enabled',
    settings JSONB DEFAULT '{}'::jsonb,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, module_id)
);

-- 6. PERMISSION DEFINITIONS
CREATE TABLE IF NOT EXISTS permission_definitions (
    id VARCHAR(100) PRIMARY KEY,
    module_id VARCHAR(50) NOT NULL REFERENCES module_registry(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPANY CUSTOM ROLES & RBAC
CREATE TABLE IF NOT EXISTS company_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permission_definitions(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL DEFAULT 'company',
    conditions JSONB DEFAULT '{}'::jsonb,
    UNIQUE(role_id, permission_id)
);

-- 8. COMPANY USERS WITH SUPABASE AUTH & VERIFICATION GATE
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    user_id UUID, -- Supabase auth.users reference
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    department VARCHAR(100),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(50) DEFAULT 'pending_verification',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, email)
);

CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    scope VARCHAR(50) NOT NULL DEFAULT 'company',
    assigned_by UUID,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id, role_id)
);

-- 9. CONCURRENCY-SAFE DOCUMENT SEQUENCES
CREATE TABLE IF NOT EXISTS document_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    doc_type VARCHAR(20) NOT NULL,
    prefix VARCHAR(20) NOT NULL,
    fiscal_year VARCHAR(10) NOT NULL,
    current_val INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, doc_type, fiscal_year)
);

-- Concurrency-Safe Number Generation Function
CREATE OR REPLACE FUNCTION get_next_doc_number(
    p_company_id UUID, 
    p_doc_type VARCHAR, 
    p_fiscal_year VARCHAR, 
    p_prefix VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    next_val INT;
    result_str VARCHAR;
BEGIN
    INSERT INTO document_sequences (company_id, doc_type, fiscal_year, prefix, current_val)
    VALUES (p_company_id, p_doc_type, p_fiscal_year, p_prefix, 1)
    ON CONFLICT (company_id, doc_type, fiscal_year)
    DO UPDATE SET current_val = document_sequences.current_val + 1, updated_at = NOW()
    RETURNING current_val INTO next_val;

    result_str := p_prefix || '-' || p_fiscal_year || '-' || LPAD(next_val::TEXT, 5, '0');
    RETURN result_str;
END;
$$ LANGUAGE plpgsql;

-- 10. CUSTOMERS (B2B Accounts & GST)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    billing_address TEXT,
    shipping_address TEXT,
    city VARCHAR(100) DEFAULT 'Pune',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    state_code VARCHAR(2) DEFAULT '27',
    pincode VARCHAR(10),
    payment_terms VARCHAR(50) DEFAULT '30 Days Net',
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    current_balance NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, customer_code)
);

-- 11. SUPPLIERS (Vendors & Subcontractors)
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Pune',
    state VARCHAR(100) DEFAULT 'Maharashtra',
    state_code VARCHAR(2) DEFAULT '27',
    pincode VARCHAR(10),
    msme_type VARCHAR(20) DEFAULT 'None',
    msme_reg_number VARCHAR(50),
    payment_terms VARCHAR(50) DEFAULT '30 Days Net',
    credit_period_days INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, supplier_code)
);

-- 12. WAREHOUSES & LOCATIONS
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    warehouse_type VARCHAR(50) DEFAULT 'raw_materials',
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 13. ITEM MASTER & STOCK
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    item_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'raw_material',
    uom VARCHAR(20) DEFAULT 'nos',
    hsn_sac_code VARCHAR(20) NOT NULL,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    standard_cost NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) DEFAULT 0.00,
    reorder_level NUMERIC(12, 2) DEFAULT 0.00,
    reorder_quantity NUMERIC(12, 2) DEFAULT 0.00,
    current_stock NUMERIC(12, 2) DEFAULT 0.00,
    allocated_stock NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, item_code)
);

-- 14. BILL OF MATERIALS (BOM)
CREATE TABLE IF NOT EXISTS bills_of_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    finished_good_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    bom_number VARCHAR(50) NOT NULL,
    version VARCHAR(20) DEFAULT 'v1.0',
    description TEXT,
    total_material_cost NUMERIC(12, 2) DEFAULT 0.00,
    scrap_allowance_percent NUMERIC(5, 2) DEFAULT 2.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, bom_number)
);

CREATE TABLE IF NOT EXISTS bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES bills_of_materials(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity_required NUMERIC(12, 4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    total_cost NUMERIC(12, 2) DEFAULT 0.00
);

-- 15. SALES ORDERS
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    so_number VARCHAR(50) NOT NULL,
    po_reference VARCHAR(100),
    po_date DATE,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, so_number)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    delivered_quantity NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS sales_order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- 16. DELIVERY CHALLANS
CREATE TABLE IF NOT EXISTS delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
    challan_number VARCHAR(50) NOT NULL,
    challan_date DATE DEFAULT CURRENT_DATE,
    transporter_name VARCHAR(100),
    vehicle_number VARCHAR(50),
    eway_bill_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'dispatched',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, challan_number)
);

CREATE TABLE IF NOT EXISTS delivery_challan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    dispatch_quantity NUMERIC(12, 2) NOT NULL,
    uom VARCHAR(20) NOT NULL
);

-- 17. PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    po_number VARCHAR(50) NOT NULL,
    po_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, po_number)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    received_quantity NUMERIC(12, 2) DEFAULT 0.00
);

-- 18. GOODS RECEIPT NOTES (GRN)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    grn_number VARCHAR(50) NOT NULL,
    grn_date DATE DEFAULT CURRENT_DATE,
    delivery_challan_no VARCHAR(100),
    transporter VARCHAR(100),
    vehicle_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'inspected',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, grn_number)
);

CREATE TABLE IF NOT EXISTS grn_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    received_quantity NUMERIC(12, 2) NOT NULL,
    accepted_quantity NUMERIC(12, 2) NOT NULL,
    rejected_quantity NUMERIC(12, 2) DEFAULT 0.00,
    rejection_reason TEXT,
    uom VARCHAR(20) NOT NULL
);

-- 19. WORK ORDERS & MANUFACTURING
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    finished_good_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    bom_id UUID NOT NULL REFERENCES bills_of_materials(id) ON DELETE RESTRICT,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
    wo_number VARCHAR(50) NOT NULL,
    planned_quantity NUMERIC(12, 2) NOT NULL,
    completed_quantity NUMERIC(12, 2) DEFAULT 0.00,
    rejected_quantity NUMERIC(12, 2) DEFAULT 0.00,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, wo_number)
);

CREATE TABLE IF NOT EXISTS production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    entry_date DATE DEFAULT CURRENT_DATE,
    shift VARCHAR(20) DEFAULT 'General',
    produced_quantity NUMERIC(12, 2) NOT NULL,
    rejected_quantity NUMERIC(12, 2) DEFAULT 0.00,
    operator_name VARCHAR(100),
    machine_id VARCHAR(50),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. QUALITY INSPECTIONS
CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    qc_number VARCHAR(50) NOT NULL,
    sample_size INT NOT NULL,
    inspected_quantity INT NOT NULL,
    passed_quantity INT NOT NULL,
    rejected_quantity INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'passed',
    inspector_name VARCHAR(100),
    inspection_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, qc_number)
);

CREATE TABLE IF NOT EXISTS inspection_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
    parameter_name VARCHAR(150) NOT NULL,
    specification VARCHAR(100) NOT NULL,
    tolerance VARCHAR(50),
    observed_value VARCHAR(100) NOT NULL,
    result VARCHAR(20) DEFAULT 'pass'
);

-- 21. STOCK TRANSACTIONS
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(50) NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    quantity NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    total_cost NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Ledger Update Trigger
CREATE OR REPLACE FUNCTION update_item_current_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE items
    SET current_stock = current_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.item_id AND company_id = NEW.company_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_stock_trans ON stock_transactions;
CREATE TRIGGER trg_after_stock_trans
AFTER INSERT ON stock_transactions
FOR EACH ROW EXECUTE FUNCTION update_item_current_stock();

-- 22. FINANCIALS & GST INVOICES
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, account_code)
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'unpaid',
    irn_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'Bank Transfer (NEFT/RTGS)',
    reference_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, payment_number)
);

CREATE TABLE IF NOT EXISTS general_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    entry_date DATE DEFAULT CURRENT_DATE,
    voucher_type VARCHAR(50) NOT NULL,
    voucher_no VARCHAR(50) NOT NULL,
    debit_amount NUMERIC(12, 2) DEFAULT 0.00,
    credit_amount NUMERIC(12, 2) DEFAULT 0.00,
    narration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 24. CRM & LEADS
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lead_number VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    source VARCHAR(50) DEFAULT 'Direct Inquiry',
    status VARCHAR(50) DEFAULT 'new',
    stage VARCHAR(50) DEFAULT 'inquiry',
    estimated_value NUMERIC(12, 2) DEFAULT 0.00,
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to VARCHAR(100),
    requirement_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, lead_number)
);

CREATE TABLE IF NOT EXISTS crm_lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    summary VARCHAR(255) NOT NULL,
    notes TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_lead_followups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    due_date TIMESTAMPTZ NOT NULL,
    followup_type VARCHAR(50) NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_lead_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT DEFAULT 0,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION generate_crm_lead_number(p_company_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    cur_year VARCHAR(4);
    next_val INT;
    res_num VARCHAR(50);
BEGIN
    cur_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    INSERT INTO document_sequences (company_id, doc_type, fiscal_year, prefix, current_val)
    VALUES (p_company_id, 'LEAD', cur_year, 'LEAD', 1)
    ON CONFLICT (company_id, doc_type, fiscal_year)
    DO UPDATE SET current_val = document_sequences.current_val + 1
    RETURNING current_val INTO next_val;

    res_num := 'LEAD-' || cur_year || '-' || LPAD(next_val::TEXT, 4, '0');
    RETURN res_num;
END;
$$ LANGUAGE plpgsql;

-- 25. QUOTATIONS & ESTIMATIONS
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    quotation_number VARCHAR(50) NOT NULL,
    revision_number VARCHAR(20) DEFAULT 'Rev-0',
    lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) DEFAULT 0.00,
    valid_until DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, quotation_number)
);

CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    gst_rate NUMERIC(5, 2) DEFAULT 18.00,
    gst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS quotation_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    revision_number VARCHAR(20) NOT NULL,
    reason TEXT,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT DEFAULT 0,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    approver_id UUID,
    approver_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26. TRADE & PROCUREMENT EXTENSIONS
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pr_number VARCHAR(50) NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    required_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, pr_number)
);

CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pr_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    estimated_rate NUMERIC(12, 2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS purchase_rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rfq_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    target_delivery_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, rfq_number)
);

CREATE TABLE IF NOT EXISTS purchase_rfq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES purchase_rfqs(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    item_code VARCHAR(50),
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    uom VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES purchase_rfqs(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    quote_reference VARCHAR(100),
    unit_rate NUMERIC(12, 2) NOT NULL,
    delivery_days INT DEFAULT 7,
    payment_terms VARCHAR(100),
    is_awarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
    igst_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_approval',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, bill_number)
);

CREATE TABLE IF NOT EXISTS trade_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    document_ref VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 27. PLATFORM MODULE REGISTRY INITIAL SEED
INSERT INTO module_registry (id, name, version, description, category, is_core, capabilities, dependencies) VALUES
('crm', 'CRM & Lead Management', '2.4.0', 'B2B inquiry tracking, lead stages, follow-up scheduling, and customer interaction logs.', 'Sales & CRM', false, '["lead-capture", "pipeline-stages", "followup-reminders"]'::jsonb, '[]'::jsonb),
('quotations', 'Quotations & Estimations', '2.1.0', 'Custom manufacturing quotes, revision histories, multi-tier approvals, and PDF proposals.', 'Sales & CRM', false, '["costing-breakdown", "gst-tax-calculation", "revision-versioning", "pdf-proposal-generation"]'::jsonb, '[]'::jsonb),
('sales', 'Sales Orders & Invoicing', '2.5.0', 'Customer order-to-cash pipeline, delivery dispatch, e-way bills, and GST tax invoicing.', 'Sales & CRM', true, '["order-confirmation", "delivery-challans", "advance-payment-receipts", "gst-tax-invoicing"]'::jsonb, '[]'::jsonb),
('counter', 'Counter Sales POS', '1.8.0', 'Rapid walk-in retail & wholesale billing with thermal slip print and instant UPI/cash capture.', 'Sales & CRM', false, '["pos-billing", "barcode-scan", "upi-qr-receipts"]'::jsonb, '[]'::jsonb),
('purchase', 'Procurement & Vendor Portal', '2.4.0', 'Purchase requisitions, RFQ comparison (L1/L2), purchase orders, and goods receipts (GRN).', 'Supply Chain', true, '["purchase-requisitions", "rfq-negotiation", "vendor-po-issuance", "grn-dock-receiving"]'::jsonb, '[]'::jsonb),
('inventory', 'Inventory & Warehousing', '2.3.0', 'Raw materials, WIP stock, bin locations, reorder level alerts, and FIFO stock movements.', 'Supply Chain', true, '["stock-ledger", "multi-warehouse-transfer", "stock-reconciliation"]'::jsonb, '[]'::jsonb),
('manufacturing', 'Manufacturing & BOM Engine', '2.2.0', 'Multi-level bills of materials, work order routing, job card release, and machine capacity planning.', 'Manufacturing', false, '["bom-engineering", "work-order-scheduling", "mrp-shortage-calculation"]'::jsonb, '[{"moduleId": "inventory", "isRequired": true, "purpose": "Raw material stock checks"}]'::jsonb),
('shopfloor', 'Shop-Floor Terminal', '2.0.0', 'Touch-optimized machine terminal for job card tracking, shift output logs, and machine downtime.', 'Manufacturing', false, '["touch-terminal", "worker-clock-in", "good-rejection-counts"]'::jsonb, '[{"moduleId": "manufacturing", "isRequired": true, "purpose": "Active work orders"}]'::jsonb),
('quality', 'Quality Assurance & QC', '1.9.0', 'Inward dock audits, in-process dimension checks, finished goods release, and non-conformance reports.', 'Manufacturing', false, '["checkpoint-inspections", "tolerance-recording", "ncr-tracking"]'::jsonb, '[]'::jsonb),
('work', 'Work & Project Management', '1.5.0', 'Tooling design projects, client milestones, job cards, and engineering task tracking.', 'Operations & Services', false, '["project-milestones", "kanban-task-board", "time-tracking"]'::jsonb, '[]'::jsonb),
('khatabook', 'Khatabook (Daybook & Udhar)', '2.1.0', 'Daily cash in/out, customer credit (udhar) tracking, payment reminders, and WhatsApp balance slips.', 'Finance & Tax', false, '["daily-cash-register", "customer-credit-ledger", "whatsapp-payment-reminders"]'::jsonb, '[]'::jsonb),
('finance', 'Finance & General Ledger', '2.6.0', 'Double-entry bookkeeping, chart of accounts, bank reconciliation, trial balance, and P&L.', 'Finance & Tax', true, '["double-entry-ledger", "chart-of-accounts", "bank-reconciliation", "financial-statements"]'::jsonb, '[]'::jsonb),
('gstReturns', 'GST Returns & 2B Auto-Recon', '2.0.0', 'Automated GSTR-1, GSTR-3B monthly filing summaries, and 2B purchase ITC reconciliation.', 'Finance & Tax', false, '["gstr1-summary", "gstr3b-calculation", "gstr2b-itc-reconciliation"]'::jsonb, '[]'::jsonb),
('caDesk', 'CA & Auditor Collaboration Desk', '1.8.0', 'Secure, read-only chartered accountant portal for tax audits, schedule exports, and compliance review.', 'Finance & Tax', false, '["audit-trail-export", "depreciation-schedules", "statutory-compliance-check"]'::jsonb, '[{"moduleId": "finance", "isRequired": true, "purpose": "Trial balance access"}]'::jsonb),
('hrms', 'HRMS, Attendance & Payroll', '2.1.0', 'Employee profiles, biometric/mobile attendance, leave workflows, and Indian statutory payroll (PF/ESI/TDS).', 'Human Capital', false, '["employee-master", "shift-attendance", "leave-approvals", "statutory-payroll-pf-esi"]'::jsonb, '[]'::jsonb),
('support', 'Helpdesk & Support Desk', '1.4.0', 'Machine breakdown reports, customer warranty claims, internal IT tickets, and SLA escalations.', 'Operations & Services', false, '["ticket-queues", "sla-tracking", "breakdown-reporting"]'::jsonb, '[]'::jsonb),
('reports', 'Analytics & Management Reports', '2.5.0', 'Multi-dimensional plant metrics: Sales registers, purchase spend, inventory aging, and worker efficiency.', 'Core Platform', true, '["sales-performance", "purchase-cost-analysis", "inventory-aging"]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 28. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_company_modules_company ON company_modules(company_id, status);
CREATE INDEX IF NOT EXISTS idx_company_users_lookup ON company_users(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_items_company ON items(company_id, category);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company ON sales_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company ON purchase_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_company ON crm_leads(company_id, status);
CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_trans_item ON stock_transactions(company_id, item_id);

-- 29. ROW LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_bills ENABLE ROW LEVEL SECURITY;

-- Helper Function: Extract companies the authenticated user is verified to access (Declared in public schema)
CREATE OR REPLACE FUNCTION public.get_user_verified_companies()
RETURNS SETOF UUID AS $$
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid() 
      AND is_active = TRUE
      AND (is_email_verified = TRUE OR role IN ('owner', 'super_admin'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_verified_companies() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_verified_companies() TO anon;

-- RLS Isolation Policies
-- Public Read for Platform Module Registry & Permission Catalog
ALTER TABLE module_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS module_registry_read ON module_registry;
CREATE POLICY module_registry_read ON module_registry FOR SELECT USING (true);

ALTER TABLE permission_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS permission_definitions_read ON permission_definitions;
CREATE POLICY permission_definitions_read ON permission_definitions FOR SELECT USING (true);

DROP POLICY IF EXISTS company_isolation_companies ON companies;
CREATE POLICY company_isolation_companies ON companies
    FOR ALL
    USING (id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_branches ON branches;
CREATE POLICY company_isolation_branches ON branches
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_modules ON company_modules;
CREATE POLICY company_isolation_modules ON company_modules
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_roles ON company_roles;
CREATE POLICY company_isolation_roles ON company_roles
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_users_isolation ON company_users;
CREATE POLICY company_users_isolation ON company_users
    FOR SELECT
    USING (user_id = auth.uid() OR company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_customers ON customers;
CREATE POLICY company_isolation_customers ON customers
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_suppliers ON suppliers;
CREATE POLICY company_isolation_suppliers ON suppliers
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_items ON items;
CREATE POLICY company_isolation_items ON items
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_sales ON sales_orders;
CREATE POLICY company_isolation_sales ON sales_orders
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_purchase ON purchase_orders;
CREATE POLICY company_isolation_purchase ON purchase_orders
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_quotes ON quotations;
CREATE POLICY company_isolation_quotes ON quotations
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

DROP POLICY IF EXISTS company_isolation_crm ON crm_leads;
CREATE POLICY company_isolation_crm ON crm_leads
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));
