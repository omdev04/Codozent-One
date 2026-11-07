-- ==============================================================================
-- FACTORYFLOW ERP - ENTERPRISE MULTI-TENANT SUPABASE POSTGRESQL SCHEMA
-- Designed for Indian SME Manufacturing Units (Auto Components, Machining, Fabrication)
-- Full Order-to-Cash, Procure-to-Pay, MRP, Shop-Floor Execution, QC & GST Accounting
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANIES & MULTI-TENANCY
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 2. COMPANY USERS & ROLE-BASED ACCESS CONTROL (RBAC)
CREATE TYPE user_erp_role AS ENUM (
    'owner',
    'admin',
    'production_manager',
    'purchase_user',
    'storekeeper',
    'supervisor',
    'worker',
    'qc_inspector',
    'accountant',
    'viewer'
);

CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID, -- Supabase auth.users reference
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role user_erp_role NOT NULL DEFAULT 'viewer',
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, email)
);

-- 3. CONCURRENCY-SAFE DOCUMENT SEQUENCES
CREATE TABLE IF NOT EXISTS document_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    doc_type VARCHAR(20) NOT NULL, -- 'SO', 'PO', 'WO', 'INV', 'GRN', 'DC', 'QC', 'PAY'
    prefix VARCHAR(20) NOT NULL,
    fiscal_year VARCHAR(10) NOT NULL,
    current_val INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, doc_type, fiscal_year)
);

-- Concurrency-safe number generation function
CREATE OR REPLACE FUNCTION get_next_doc_number(p_company_id UUID, p_doc_type VARCHAR, p_fiscal_year VARCHAR, p_prefix VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    next_val INT;
    result_str VARCHAR;
BEGIN
    INSERT INTO document_sequences (company_id, doc_type, fiscal_year, prefix, current_val)
    VALUES (p_company_id, p_doc_type, p_fiscal_year, p_prefix, 1)
    ON CONFLICT (company_id, doc_type, fiscal_year)
    DO UPDATE SET current_val = document_sequences.current_val + 1
    RETURNING current_val INTO next_val;

    result_str := p_prefix || '-' || p_fiscal_year || '-' || LPAD(next_val::TEXT, 5, '0');
    RETURN result_str;
END;
$$ LANGUAGE plpgsql;

-- 4. CUSTOMERS & SUPPLIERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(50),
    gstin VARCHAR(15),
    pan VARCHAR(10),
    billing_address TEXT,
    shipping_address TEXT,
    credit_limit NUMERIC(15,2) DEFAULT 0.00,
    credit_days INT DEFAULT 30,
    outstanding_balance NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, customer_code)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(50),
    gstin VARCHAR(15),
    address TEXT,
    payment_terms VARCHAR(100) DEFAULT 'Net 30 Days',
    rating NUMERIC(3,2) DEFAULT 5.0,
    outstanding_payable NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, supplier_code)
);

-- 5. WAREHOUSES & LOCATIONS
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    warehouse_type VARCHAR(50) DEFAULT 'raw_materials', -- 'raw_materials', 'wip_floor', 'finished_goods', 'scrap_quarantine'
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- 6. ITEM MASTER (Raw Materials, WIP, Finished Goods, Consumables)
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'raw_material', 'wip', 'finished_goods', 'consumable'
    uom VARCHAR(20) NOT NULL DEFAULT 'nos', -- 'nos', 'kg', 'mtr', 'litres', 'pcs', 'sets'
    hsn_sac_code VARCHAR(20) DEFAULT '8483',
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    standard_cost NUMERIC(15,2) DEFAULT 0.00,
    selling_price NUMERIC(15,2) DEFAULT 0.00,
    reorder_level NUMERIC(15,2) DEFAULT 100.00,
    reorder_quantity NUMERIC(15,2) DEFAULT 500.00,
    current_stock NUMERIC(15,2) DEFAULT 0.00,
    allocated_stock NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, item_code)
);

-- 7. BILL OF MATERIALS (BOM) & MULTI-LEVEL STRUCTURE
CREATE TABLE IF NOT EXISTS bills_of_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    bom_number VARCHAR(100) NOT NULL,
    revision VARCHAR(20) DEFAULT 'Rev 1.0',
    description TEXT,
    output_quantity NUMERIC(12,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, bom_number, revision)
);

CREATE TABLE IF NOT EXISTS bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES bills_of_materials(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity_required NUMERIC(12,4) NOT NULL,
    scrap_percentage NUMERIC(5,2) DEFAULT 0.00,
    operation_station VARCHAR(100),
    notes TEXT
);

-- 8. SALES & CRM (Order-to-Cash)
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    so_number VARCHAR(100) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    customer_po_number VARCHAR(100),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'confirmed', 'in_production', 'ready_for_dispatch', 'partially_shipped', 'completed', 'cancelled'
    subtotal NUMERIC(15,2) DEFAULT 0.00,
    cgst_amount NUMERIC(15,2) DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, so_number)
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    shipped_quantity NUMERIC(12,2) DEFAULT 0.00
);

-- Delivery Challans for physical dispatch
CREATE TABLE IF NOT EXISTS delivery_challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    challan_number VARCHAR(100) NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transporter_name VARCHAR(150),
    vehicle_number VARCHAR(50),
    e_way_bill_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'dispatched',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, challan_number)
);

CREATE TABLE IF NOT EXISTS delivery_challan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID NOT NULL REFERENCES delivery_challans(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    quantity NUMERIC(12,2) NOT NULL
);

-- 9. PURCHASE & PROCUREMENT (Procure-to-Pay)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    po_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'ordered', 'partially_received', 'received', 'cancelled'
    subtotal NUMERIC(15,2) DEFAULT 0.00,
    cgst_amount NUMERIC(15,2) DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, po_number)
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    received_quantity NUMERIC(12,2) DEFAULT 0.00
);

-- Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    grn_number VARCHAR(100) NOT NULL,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    warehouse_id UUID REFERENCES warehouses(id),
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_invoice_number VARCHAR(100),
    qc_status VARCHAR(50) DEFAULT 'pending_inspection', -- 'pending_inspection', 'inspected_passed', 'quarantine_failed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, grn_number)
);

CREATE TABLE IF NOT EXISTS grn_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    received_quantity NUMERIC(12,2) NOT NULL,
    accepted_quantity NUMERIC(12,2) DEFAULT 0.00,
    rejected_quantity NUMERIC(12,2) DEFAULT 0.00,
    batch_number VARCHAR(100)
);

-- 10. MANUFACTURING & SHOP-FLOOR PRODUCTION
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    wo_number VARCHAR(100) NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id),
    product_id UUID NOT NULL REFERENCES items(id),
    bom_id UUID REFERENCES bills_of_materials(id),
    planned_quantity NUMERIC(12,2) NOT NULL,
    produced_quantity NUMERIC(12,2) DEFAULT 0.00,
    rejected_quantity NUMERIC(12,2) DEFAULT 0.00,
    rework_quantity NUMERIC(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'draft', 'scheduled', 'in_progress', 'qc_pending', 'completed', 'cancelled'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'urgent'
    assigned_supervisor VARCHAR(100),
    assigned_worker VARCHAR(100),
    target_warehouse_id UUID REFERENCES warehouses(id),
    start_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, wo_number)
);

-- Shop-Floor Real-Time Execution Entries (Mobile/Tablet logging)
CREATE TABLE IF NOT EXISTS production_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    operator_name VARCHAR(150) NOT NULL,
    operation_station VARCHAR(100) NOT NULL, -- 'CNC Turning', 'Milling', 'Stamping', 'Welding', 'Assembly'
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    good_quantity NUMERIC(12,2) DEFAULT 0.00,
    rejected_quantity NUMERIC(12,2) DEFAULT 0.00,
    rework_quantity NUMERIC(12,2) DEFAULT 0.00,
    rejection_reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. QUALITY CONTROL & INSPECTION
CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    inspection_number VARCHAR(100) NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- 'grn', 'work_order', 'final_dispatch'
    reference_id UUID,
    item_id UUID NOT NULL REFERENCES items(id),
    inspector_name VARCHAR(150) NOT NULL,
    inspection_date DATE DEFAULT CURRENT_DATE,
    sample_size NUMERIC(10,2) DEFAULT 10.00,
    status VARCHAR(50) DEFAULT 'passed', -- 'passed', 'failed', 'rework_required'
    defects_found INT DEFAULT 0,
    root_cause_analysis TEXT,
    corrective_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, inspection_number)
);

CREATE TABLE IF NOT EXISTS inspection_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE,
    parameter_name VARCHAR(150) NOT NULL, -- 'Outer Diameter (OD)', 'Concentricity', 'Surface Finish Ra', 'Hardness HRC'
    specification VARCHAR(100) NOT NULL,
    tolerance VARCHAR(50),
    observed_value VARCHAR(100) NOT NULL,
    result VARCHAR(20) DEFAULT 'pass' -- 'pass', 'fail'
);

-- 12. INVENTORY LEDGER & STOCK MOVEMENTS
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    transaction_number VARCHAR(100) NOT NULL,
    item_id UUID NOT NULL REFERENCES items(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'receipt_grn', 'issue_production', 'production_finish', 'sales_dispatch', 'adjustment', 'rejection_scrap'
    quantity NUMERIC(12,2) NOT NULL, -- Positive for addition, negative for deduction
    unit_cost NUMERIC(15,2) DEFAULT 0.00,
    running_balance NUMERIC(15,2) NOT NULL,
    batch_number VARCHAR(100),
    reference_type VARCHAR(50), -- 'grn', 'work_order', 'challan', 'manual'
    reference_id UUID,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to maintain live stock count on item master
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

-- 13. FINANCE, GST & INVOICING
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'asset', 'liability', 'equity', 'revenue', 'expense'
    balance NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, account_code)
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type VARCHAR(50) NOT NULL, -- 'sales_tax_invoice', 'purchase_bill'
    partner_type VARCHAR(20) NOT NULL, -- 'customer', 'supplier'
    partner_id UUID NOT NULL,
    sales_order_id UUID REFERENCES sales_orders(id),
    purchase_order_id UUID REFERENCES purchase_orders(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(15,2) DEFAULT 0.00,
    cgst_amount NUMERIC(15,2) DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) DEFAULT 0.00,
    paid_amount NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'unpaid', -- 'draft', 'unpaid', 'partially_paid', 'paid', 'cancelled'
    gst_irn VARCHAR(100), -- E-Invoice IRN
    gst_ack_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id),
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    tax_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'customer_receipt', 'supplier_payment'
    partner_id UUID NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(15,2) NOT NULL,
    payment_mode VARCHAR(50) DEFAULT 'bank_transfer_neft_rtgs', -- 'bank_transfer_neft_rtgs', 'upi', 'cheque', 'cash'
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, payment_number)
);

CREATE TABLE IF NOT EXISTS general_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number VARCHAR(100) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    account_id UUID REFERENCES chart_of_accounts(id),
    debit NUMERIC(15,2) DEFAULT 0.00,
    credit NUMERIC(15,2) DEFAULT 0.00,
    reference_type VARCHAR(50),
    reference_id UUID,
    narration TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS FOR TAMPER-PROOF HISTORY
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_name VARCHAR(150),
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic Tenant Isolation Policy Example (for authenticated Supabase users):
-- CREATE POLICY tenant_isolation_policy ON customers
--     FOR ALL USING (company_id IN (
--         SELECT company_id FROM company_users WHERE user_id = auth.uid()
--     ));

