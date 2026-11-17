-- ============================================================================
-- SUPABASE MIGRATION: Quotation Management Module for House of MSME ERP
-- Date: 2026-11-15
-- Multi-Tenant Isolation, Revision Snapshotting, Indian GST Statutory Precision
-- ============================================================================

-- 1. Main Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    quotation_number VARCHAR(100) NOT NULL,
    quotation_family_id VARCHAR(100),
    revision_number INT DEFAULT 0,
    revision VARCHAR(50) DEFAULT 'Rev 0',
    
    -- Lead & Customer Associations
    lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
    lead_number VARCHAR(100),
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    gstin VARCHAR(50),
    
    -- Dates & Basic Info
    quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    subject VARCHAR(255),
    reference_number VARCHAR(100),
    salesperson_id VARCHAR(100),
    salesperson_name VARCHAR(150),
    place_of_supply VARCHAR(100),
    
    -- Address Snapshots (JSONB)
    billing_address_snapshot JSONB DEFAULT '{}'::jsonb,
    shipping_address_snapshot JSONB DEFAULT '{}'::jsonb,
    
    -- Commercial Totals & Indian GST Breakdown
    subtotal NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT 'percentage',
    discount_value NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    freight_amount NUMERIC(15,2) DEFAULT 0.00,
    packing_amount NUMERIC(15,2) DEFAULT 0.00,
    other_charges NUMERIC(15,2) DEFAULT 0.00,
    round_off NUMERIC(10,2) DEFAULT 0.00,
    grand_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    amount_in_words TEXT,
    currency VARCHAR(10) DEFAULT 'INR',
    
    -- Manufacturing Terms & Conditions
    payment_terms TEXT,
    delivery_period VARCHAR(100),
    delivery_location VARCHAR(200),
    transportation_terms VARCHAR(200),
    packing_terms VARCHAR(200),
    warranty_terms VARCHAR(200),
    validity_terms VARCHAR(100),
    taxes_and_duties VARCHAR(200),
    terms_and_conditions JSONB DEFAULT '[]'::jsonb,
    
    -- Internal vs Customer Notes
    internal_notes TEXT, -- Strictly internal, never exposed to customer
    customer_notes TEXT,
    
    -- Workflow & Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- 'draft', 'pending_approval', 'approved', 'sent', 'viewed', 'under_negotiation',
    -- 'revision_requested', 'accepted', 'rejected', 'expired', 'cancelled', 'converted_to_order', 'superseded'
    
    approval_status VARCHAR(50) DEFAULT 'not_required', -- 'not_required', 'pending', 'approved', 'rejected'
    approved_by VARCHAR(150),
    approved_at TIMESTAMPTZ,
    approval_comments TEXT,
    
    sent_at TIMESTAMPTZ,
    sent_via VARCHAR(50),
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    superseded_by UUID REFERENCES quotations(id) ON DELETE SET NULL,
    
    -- Sales Order Conversion Reference
    converted_sales_order_id UUID,
    converted_sales_order_number VARCHAR(100),
    
    -- Audit Tracking
    created_by VARCHAR(150) NOT NULL,
    updated_by VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(company_id, quotation_number, revision_number)
);

-- 2. Quotation Line Items Table (with Precision Manufacturing Specs)
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    item_code VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    technical_specifications TEXT,
    dimensions VARCHAR(150),
    material_grade VARCHAR(150),
    drawing_reference VARCHAR(150),
    tolerance_details VARCHAR(150),
    manufacturing_notes TEXT,
    hsn_sac VARCHAR(50),
    uom VARCHAR(30) NOT NULL DEFAULT 'Nos',
    quantity NUMERIC(12,4) NOT NULL DEFAULT 1.0000,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    discount_type VARCHAR(20) DEFAULT 'percentage',
    discount_value NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(15,2) DEFAULT 0.00,
    taxable_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    cgst_rate NUMERIC(5,2) DEFAULT 9.00,
    sgst_rate NUMERIC(5,2) DEFAULT 9.00,
    igst_rate NUMERIC(5,2) DEFAULT 0.00,
    cgst_amount NUMERIC(15,2) DEFAULT 0.00,
    sgst_amount NUMERIC(15,2) DEFAULT 0.00,
    igst_amount NUMERIC(15,2) DEFAULT 0.00,
    line_total NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quotation Revisions History Table
CREATE TABLE IF NOT EXISTS quotation_revisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_family_id VARCHAR(100) NOT NULL,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    revision_number INT NOT NULL,
    previous_quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    revision_reason TEXT NOT NULL,
    changed_fields_summary TEXT,
    snapshot_data JSONB NOT NULL,
    created_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Quotation Activity Audit Timeline
CREATE TABLE IF NOT EXISTS quotation_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    performed_by VARCHAR(150) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Quotation Attachments & Engineering Drawings
CREATE TABLE IF NOT EXISTS quotation_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    category VARCHAR(50) DEFAULT 'drawing', -- 'drawing', 'spec_sheet', 'po', 'other'
    uploaded_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Quotation Approvals
CREATE TABLE IF NOT EXISTS quotation_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    requested_by VARCHAR(150) NOT NULL,
    approver_name VARCHAR(150),
    approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    comments TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_family ON quotations(quotation_family_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(company_id, status);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(company_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_lead ON quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quote ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_activities_quote ON quotation_activities(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_revisions_family ON quotation_revisions(quotation_family_id);

-- 8. Row-Level Security (RLS) Multi-Tenant Policies
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_approvals ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'quotations_company_isolation'
    ) THEN
        CREATE POLICY quotations_company_isolation ON quotations
            FOR ALL USING (company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid);
    END IF;
END $$;
