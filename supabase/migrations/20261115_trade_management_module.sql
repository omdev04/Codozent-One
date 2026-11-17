-- =============================================================================
-- HOUSE OF MSME MANUFACTURING ERP
-- TRADE MANAGEMENT MODULE (SALES + PURCHASE UNIFIED WORKFLOWS)
-- Migration: 20261115_trade_management_module.sql
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENRICH EXISTING SALES TABLES
-- -----------------------------------------------------------------------------
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS quotation_id UUID;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS quotation_number VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS quotation_revision VARCHAR(20);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_po_date DATE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS salesperson_name VARCHAR(150);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS delivery_terms VARCHAR(255);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS freight_terms VARCHAR(255);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS packing_terms VARCHAR(255);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS customer_gstin VARCHAR(20);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS contact_person VARCHAR(150);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS email VARCHAR(150);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS advance_percentage NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS advance_paid BOOLEAN DEFAULT false;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS advance_utr_ref VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS proforma_number VARCHAR(100);
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS work_released BOOLEAN DEFAULT false;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Custom made-to-order line item fields (custom items, drawings, tolerances)
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS item_code VARCHAR(100);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS technical_specs TEXT;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS drawing_ref VARCHAR(150);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS material_grade VARCHAR(100);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS tolerance VARCHAR(100);
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS uom VARCHAR(50) DEFAULT 'Nos';
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE sales_order_items ADD COLUMN IF NOT EXISTS hsn_sac_code VARCHAR(20);

-- Status history table for Sales Orders
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

-- -----------------------------------------------------------------------------
-- 2. PURCHASE REQUISITIONS (PR)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    pr_number VARCHAR(100) NOT NULL,
    requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_by_date DATE NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'urgent'
    purpose TEXT NOT NULL,
    total_estimated_amount NUMERIC(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'converted_to_rfq', 'converted_to_po', 'cancelled'
    preferred_vendor_id UUID REFERENCES suppliers(id),
    preferred_vendor_name VARCHAR(255),
    approval_remarks TEXT,
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    rejected_by VARCHAR(100),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    converted_rfq_id UUID,
    converted_po_id UUID,
    notes TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, pr_number)
);

CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    requisition_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    item_id UUID,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    specifications TEXT,
    quantity NUMERIC(12,2) NOT NULL,
    uom VARCHAR(50) NOT NULL DEFAULT 'Nos',
    estimated_unit_rate NUMERIC(15,2) DEFAULT 0.00,
    estimated_total NUMERIC(15,2) DEFAULT 0.00,
    notes TEXT
);

-- -----------------------------------------------------------------------------
-- 3. REQUEST FOR QUOTATION (RFQ) & VENDOR QUOTATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rfq_number VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    rfq_date DATE NOT NULL DEFAULT CURRENT_DATE,
    closing_date DATE,
    target_delivery_date DATE,
    requisition_id UUID REFERENCES purchase_requisitions(id),
    requisition_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'open', 'sent', 'quotes_received', 'awarded', 'closed', 'cancelled'
    awarded_quote_id UUID,
    awarded_po_id UUID,
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, rfq_number)
);

CREATE TABLE IF NOT EXISTS purchase_rfq_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rfq_id UUID NOT NULL REFERENCES purchase_rfqs(id) ON DELETE CASCADE,
    item_id UUID,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    uom VARCHAR(50) NOT NULL DEFAULT 'Nos',
    target_rate NUMERIC(15,2) DEFAULT 0.00,
    specifications TEXT
);

CREATE TABLE IF NOT EXISTS purchase_rfq_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rfq_id UUID NOT NULL REFERENCES purchase_rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    supplier_name VARCHAR(255) NOT NULL,
    sent_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'submitted', 'declined'
);

CREATE TABLE IF NOT EXISTS vendor_quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    rfq_id UUID NOT NULL REFERENCES purchase_rfqs(id) ON DELETE CASCADE,
    rfq_number VARCHAR(100) NOT NULL,
    quote_number VARCHAR(100) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    supplier_name VARCHAR(255) NOT NULL,
    supplier_quote_ref VARCHAR(100) NOT NULL,
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    delivery_days INTEGER DEFAULT 7,
    payment_terms VARCHAR(255),
    subtotal NUMERIC(15,2) DEFAULT 0.00,
    taxable_amount NUMERIC(15,2) DEFAULT 0.00,
    gst_amount NUMERIC(15,2) DEFAULT 0.00,
    freight_amount NUMERIC(15,2) DEFAULT 0.00,
    other_charges NUMERIC(15,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) DEFAULT 0.00,
    is_winning_quote BOOLEAN DEFAULT false,
    selection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, quote_number)
);

CREATE TABLE IF NOT EXISTS vendor_quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    vendor_quotation_id UUID NOT NULL REFERENCES vendor_quotations(id) ON DELETE CASCADE,
    item_id UUID,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_rate NUMERIC(15,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0.00,
    taxable_amount NUMERIC(15,2) NOT NULL,
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    gst_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    lead_time_days INTEGER DEFAULT 7
);

-- -----------------------------------------------------------------------------
-- 4. ENRICH EXISTING PURCHASE ORDERS & GRN
-- -----------------------------------------------------------------------------
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_reference VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requisition_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requisition_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rfq_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rfq_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_quote_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_quote_ref VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_location VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS assigned_buyer VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tolerance_percentage NUMERIC(5,2) DEFAULT 5.00;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_terms VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS freight_terms VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS packing_terms VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS specs TEXT;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS hsn_sac VARCHAR(20);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC(15,2) DEFAULT 0.00;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS tolerance_percentage NUMERIC(5,2) DEFAULT 5.00;

ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS delivery_challan_no VARCHAR(100);
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS received_by VARCHAR(100);
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS is_stock_posted BOOLEAN DEFAULT false;

ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS uom VARCHAR(50) DEFAULT 'Nos';
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS ordered_quantity NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS previously_received_quantity NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS current_received_quantity NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- -----------------------------------------------------------------------------
-- 5. PURCHASE BILLS (INTEGRATION-READY 3-WAY MATCHING)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) NOT NULL,
    supplier_invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    supplier_name VARCHAR(255) NOT NULL,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    po_number VARCHAR(100),
    grn_id UUID REFERENCES goods_receipt_notes(id),
    grn_number VARCHAR(100),
    taxable_amount NUMERIC(15,2) DEFAULT 0.00,
    cgst_amount NUMERIC(15,2) DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    total_amount NUMERIC(15,2) NOT NULL,
    due_date DATE,
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid'
    match_status VARCHAR(50) DEFAULT 'matched', -- 'matched', 'variance_detected', 'pending_match'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, bill_number)
);

-- -----------------------------------------------------------------------------
-- 6. UNIFIED TRADE ACTIVITIES & AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trade_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'sales_order', 'purchase_requisition', 'rfq', 'vendor_quote', 'purchase_order', 'grn', 'purchase_bill'
    entity_id UUID NOT NULL,
    entity_number VARCHAR(100) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    performed_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. PERFORMANCE INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sales_orders_company_status ON sales_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_so_items_order ON sales_order_items(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_so_history ON sales_order_status_history(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_pr_company_status ON purchase_requisitions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_pr_items ON purchase_requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_company ON purchase_rfqs(company_id, status);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes ON vendor_quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_po_company_status ON purchase_orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(company_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_items ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_company ON goods_receipt_notes(company_id);
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipt_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_pb_company ON purchase_bills(company_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_trade_activities ON trade_activities(company_id, entity_id);

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE sales_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_rfq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_rfq_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_activities ENABLE ROW LEVEL SECURITY;

-- Multi-tenant Company Isolation Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trade_so_history_company_isolation') THEN
        CREATE POLICY trade_so_history_company_isolation ON sales_order_status_history
            FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trade_pr_company_isolation') THEN
        CREATE POLICY trade_pr_company_isolation ON purchase_requisitions
            FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trade_pr_items_company_isolation') THEN
        CREATE POLICY trade_pr_items_company_isolation ON purchase_requisition_items
            FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trade_rfqs_company_isolation') THEN
        CREATE POLICY trade_rfqs_company_isolation ON purchase_rfqs
            FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trade_quotes_company_isolation') THEN
        CREATE POLICY trade_quotes_company_isolation ON vendor_quotations
            FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trade_bills_company_isolation') THEN
        CREATE POLICY trade_bills_company_isolation ON purchase_bills
            FOR ALL USING (company_id IN (SELECT company_id FROM company_users WHERE user_id = auth.uid()));
    END IF;
END $$;
