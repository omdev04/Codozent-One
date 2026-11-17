-- Isolated platform-operator and SaaS billing records. Tenant users receive no direct access.
CREATE TABLE IF NOT EXISTS public.platform_bootstrap_state (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
  claimed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  operator_id UUID
);
INSERT INTO public.platform_bootstrap_state(singleton) VALUES (TRUE) ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.platform_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','platform_admin','billing_admin','support_admin','read_only')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  token_version BIGINT NOT NULL DEFAULT 1,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  currency CHAR(3) NOT NULL,
  monthly_price NUMERIC(14,2) NOT NULL CHECK (monthly_price >= 0),
  annual_price NUMERIC(14,2) NOT NULL CHECK (annual_price >= 0),
  seat_limit INTEGER CHECK (seat_limit IS NULL OR seat_limit > 0),
  module_entitlements JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES public.platform_operators(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  plan_id UUID REFERENCES public.platform_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','paused','cancelled','expired')),
  currency CHAR(3) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  interval TEXT NOT NULL CHECK (interval IN ('monthly','annual')),
  seat_count INTEGER NOT NULL DEFAULT 1 CHECK (seat_count > 0),
  trial_ends_at TIMESTAMPTZ,
  period_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  subscription_id UUID REFERENCES public.platform_subscriptions(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('draft','open','paid','void','uncollectible')),
  currency CHAR(3) NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.platform_billing_invoices(id) ON DELETE RESTRICT,
  provider TEXT,
  provider_reference TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending','succeeded','failed','refunded','partially_refunded')),
  currency CHAR(3) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  refunded_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (refunded_amount >= 0 AND refunded_amount <= amount),
  provider_fee NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (provider_fee >= 0),
  tax_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  paid_at TIMESTAMPTZ,
  verified_webhook_event_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date DATE NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected','archived')) DEFAULT 'pending',
  attachment_reference TEXT,
  created_by UUID NOT NULL REFERENCES public.platform_operators(id),
  reviewed_by UUID REFERENCES public.platform_operators(id),
  reviewed_at TIMESTAMPTZ,
  review_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.platform_operators(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  reason TEXT,
  before_state JSONB,
  after_state JSONB,
  request_id TEXT,
  actor_ip INET,
  user_agent TEXT,
  outcome TEXT NOT NULL DEFAULT 'succeeded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DO $$ BEGIN
  ALTER TABLE public.platform_bootstrap_state ADD CONSTRAINT platform_bootstrap_operator_fk
    FOREIGN KEY (operator_id) REFERENCES public.platform_operators(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_company ON public.platform_subscriptions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_invoices_status_due ON public.platform_billing_invoices(status, due_at);
CREATE INDEX IF NOT EXISTS idx_platform_payments_status_date ON public.platform_billing_payments(status, paid_at);
CREATE INDEX IF NOT EXISTS idx_platform_expenses_status_date ON public.platform_expenses(status, expense_date);
CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON public.platform_audit_log(created_at DESC);

-- Exact unbounded aggregates; currency stays grouped and tenant ERP finance is excluded.
CREATE OR REPLACE FUNCTION public.platform_admin_overview()
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  SELECT jsonb_build_object(
    'companies', (SELECT count(*) FROM public.companies),
    'active_subscriptions', (SELECT count(*) FROM public.platform_subscriptions WHERE status = 'active'),
    'trials', (SELECT count(*) FROM public.platform_subscriptions WHERE status = 'trialing'),
    'overdue_invoices', (SELECT count(*) FROM public.platform_billing_invoices WHERE status = 'open' AND due_at < now()),
    'enabled_module_assignments', (SELECT count(*) FROM public.company_modules WHERE status = 'enabled'),
    'payments_by_currency', COALESCE((
      SELECT jsonb_object_agg(currency, net_amount) FROM (
        SELECT currency, sum(amount - refunded_amount) AS net_amount
        FROM public.platform_billing_payments
        WHERE status IN ('succeeded','partially_refunded','refunded')
        GROUP BY currency
      ) p
    ), '{}'::jsonb),
    'approved_expenses_by_currency', COALESCE((
      SELECT jsonb_object_agg(currency, total_amount) FROM (
        SELECT currency, sum(amount) AS total_amount FROM public.platform_expenses
        WHERE status = 'approved' GROUP BY currency
      ) e
    ), '{}'::jsonb),
    'approved_expense_count', (SELECT count(*) FROM public.platform_expenses WHERE status = 'approved'),
    'payment_count', (SELECT count(*) FROM public.platform_billing_payments WHERE status IN ('succeeded','partially_refunded','refunded'))
  );
$$;
REVOKE ALL ON FUNCTION public.platform_admin_overview() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_admin_overview() TO service_role;

ALTER TABLE public.platform_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_bootstrap_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.platform_operators, public.platform_plans, public.platform_subscriptions,
  public.platform_billing_invoices, public.platform_billing_payments, public.platform_expenses,
  public.platform_audit_log, public.platform_bootstrap_state FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.platform_operators, public.platform_plans, public.platform_subscriptions,
  public.platform_billing_invoices, public.platform_billing_payments, public.platform_expenses,
  public.platform_audit_log, public.platform_bootstrap_state TO service_role;

CREATE OR REPLACE FUNCTION public.reject_platform_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Platform audit records are append-only';
END;
$$;
DROP TRIGGER IF EXISTS platform_audit_immutable ON public.platform_audit_log;
CREATE TRIGGER platform_audit_immutable
  BEFORE UPDATE OR DELETE ON public.platform_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.reject_platform_audit_mutation();

CREATE OR REPLACE FUNCTION public.protect_last_platform_super_admin()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE active_owners BIGINT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'super_admin' AND OLD.is_active THEN
      PERFORM pg_advisory_xact_lock(hashtext('platform_last_super_admin'));
      SELECT count(*) INTO active_owners FROM public.platform_operators
        WHERE role = 'super_admin' AND is_active AND id <> OLD.id;
      IF active_owners = 0 THEN
        RAISE EXCEPTION 'The last active platform Super Admin cannot be removed or deactivated';
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.role = 'super_admin' AND OLD.is_active AND (NEW.role <> 'super_admin' OR NOT NEW.is_active) THEN
    PERFORM pg_advisory_xact_lock(hashtext('platform_last_super_admin'));
    SELECT count(*) INTO active_owners FROM public.platform_operators
      WHERE role = 'super_admin' AND is_active AND id <> OLD.id;
    IF active_owners = 0 THEN
      RAISE EXCEPTION 'The last active platform Super Admin cannot be removed or deactivated';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_last_platform_super_admin ON public.platform_operators;
CREATE TRIGGER protect_last_platform_super_admin
  BEFORE UPDATE OR DELETE ON public.platform_operators
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_platform_super_admin();
