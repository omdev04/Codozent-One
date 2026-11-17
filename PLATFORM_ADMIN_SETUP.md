# Platform Super Admin setup

The Super Admin is part of this application but uses a dedicated protected route and a platform-only identity. Tenant roles do not grant access.

## Required server configuration

Set these variables only in the server environment (never as `VITE_` variables):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — kept server-side; the platform API does not fall back to the anon key
- `PLATFORM_JWT_SECRET` — a new random secret of at least 32 characters, separate from `JWT_SECRET`
- `PLATFORM_BOOTSTRAP_TOKEN` — a one-time random secret of at least 32 characters

Apply `supabase/migrations/20261116010000_platform_super_admin.sql` to the connected Supabase project before opening `/platform-admin`. This migration creates platform-only tables with RLS enabled, denies direct `anon`/`authenticated` access, grants database API access to `service_role`, and protects audit immutability and the last active Super Admin.

Open `/platform-admin` and use the one-time bootstrap token to provision the first Super Admin. Bootstrap is atomically claimed in the database and cannot be repeated after it is claimed. If the operator insert fails after the claim, a database administrator must review and reset the bootstrap state deliberately; the application does not reopen bootstrap automatically.

After successful bootstrap, remove `PLATFORM_BOOTSTRAP_TOKEN` from the server environment and restart/redeploy. `PLATFORM_JWT_SECRET` and the Supabase service-role key remain required. Platform sessions expire after 30 minutes and are held in browser memory only; signing out revokes the operator token version in the database.

## Current integration limits

- No payment provider is configured, and this change does not add a payment webhook. Payment/revenue figures remain empty until verified real platform payment records are integrated.
- MFA is not implemented by the current custom platform password/JWT flow. Do not represent the platform account as MFA-protected; deploy behind HTTPS and use a strong unique password until a supported MFA identity provider is connected.
- No fake plans, subscriptions, companies, invoices, payments, or expenses are inserted.
- Existing tenant API authorization behavior is outside this isolated panel change and is not claimed to be fixed here.
