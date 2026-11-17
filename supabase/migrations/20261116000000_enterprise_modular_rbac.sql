-- ==============================================================================
-- CODOZENT ENTERPRISE MODULAR ARCHITECTURE & RBAC SCHEMA MIGRATION
-- Multi-Tenant, Multi-Company, Granular Scoped RBAC & Verification Lifecycles
-- ==============================================================================

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'enterprise',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link companies to tenants if column doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE companies ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. BRANCHES TABLE (Plant & Location-level Segregation)
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

-- 3. CENTRALIZED MODULE REGISTRY (Authoritative Catalog)
CREATE TABLE IF NOT EXISTS module_registry (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'crm', 'sales', 'purchase', 'inventory'
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    is_core BOOLEAN DEFAULT FALSE,
    capabilities JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPANY MODULE ACTIVATIONS & ENTITLEMENTS
CREATE TABLE IF NOT EXISTS company_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL REFERENCES module_registry(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'enabled', -- 'enabled', 'disabled', 'suspended'
    settings JSONB DEFAULT '{}'::jsonb,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, module_id)
);

-- 5. PERMISSION DEFINITIONS
CREATE TABLE IF NOT EXISTS permission_definitions (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'sales.orders.create'
    module_id VARCHAR(50) NOT NULL REFERENCES module_registry(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPANY CUSTOM ROLES
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

-- 7. ROLE PERMISSIONS MATRIX
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permission_definitions(id) ON DELETE CASCADE,
    scope VARCHAR(50) NOT NULL DEFAULT 'company', -- 'own', 'team', 'branch', 'company'
    conditions JSONB DEFAULT '{}'::jsonb,
    UNIQUE(role_id, permission_id)
);

-- 8. ENHANCE COMPANY_USERS WITH PHONE & VERIFICATION LIFECYCLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_users' AND column_name = 'phone'
    ) THEN
        ALTER TABLE company_users ADD COLUMN phone VARCHAR(20);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_users' AND column_name = 'is_email_verified'
    ) THEN
        ALTER TABLE company_users ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_users' AND column_name = 'is_phone_verified'
    ) THEN
        ALTER TABLE company_users ADD COLUMN is_phone_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_users' AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE company_users ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending_verification';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_users' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE company_users ADD COLUMN branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 9. USER ROLE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references company_users(id)
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES company_roles(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    scope VARCHAR(50) NOT NULL DEFAULT 'company',
    assigned_by UUID,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company_id, role_id)
);

-- ==============================================================================
-- ROW-LEVEL SECURITY & HELPER FUNCTIONS
-- ==============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Helper: Get user's verified companies
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

-- RLS: Company Isolation for Branches
DROP POLICY IF EXISTS company_isolation_branches ON branches;
CREATE POLICY company_isolation_branches ON branches
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

-- RLS: Company Isolation for Modules
DROP POLICY IF EXISTS company_isolation_modules ON company_modules;
CREATE POLICY company_isolation_modules ON company_modules
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));

-- RLS: Company Isolation for Roles
DROP POLICY IF EXISTS company_isolation_roles ON company_roles;
CREATE POLICY company_isolation_roles ON company_roles
    FOR ALL
    USING (company_id IN (SELECT public.get_user_verified_companies()))
    WITH CHECK (company_id IN (SELECT public.get_user_verified_companies()));
