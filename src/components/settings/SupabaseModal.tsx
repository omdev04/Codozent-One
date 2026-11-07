import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Download, 
  ExternalLink,
  Key,
  Globe,
  Shield,
  Layers
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  updateSupabaseCredentials, 
  clearSupabaseCredentials,
  isSupabaseConfigured 
} from '../../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(() => localStorage.getItem('factoryflow_VITE_SUPABASE_URL') || '');
  const [key, setKey] = useState(() => localStorage.getItem('factoryflow_VITE_SUPABASE_ANON_KEY') || '');
  const [statusMessage, setStatusMessage] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'connect' | 'schema'>('connect');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setStatusMessage(null);

    const saved = updateSupabaseCredentials(url, key);
    if (!saved && (!url || !key)) {
      setStatusMessage({ success: false, message: 'Please provide both Supabase Project URL and Anon API Key.' });
      setIsTesting(false);
      return;
    }

    const res = await testSupabaseConnection();
    setStatusMessage(res);
    setIsTesting(false);
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setKey('');
    setStatusMessage({ success: true, message: 'Supabase credentials cleared. Using local enterprise offline store.' });
  };

  const copySchemaToClipboard = () => {
    fetch('/supabase/schema.sql')
      .then(res => res.text())
      .catch(() => `-- Supabase Schema is available in supabase/schema.sql in workspace`)
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-green-50 text-report-green flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                Supabase Backend Configuration
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isSupabaseConfigured ? 'bg-green-100 text-report-green' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL REACTIVE ENGINE'}
                </span>
              </h2>
              <p className="text-xs text-ink-muted">
                PostgreSQL schema, Row Level Security (RLS) multi-tenancy & stored procedures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-surface-1 px-6">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-2.5 text-xs font-semibold mr-6 border-b-2 transition-all ${
              activeTab === 'connect'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'schema'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            PostgreSQL SQL Schema & RLS
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'connect' ? (
            <div className="space-y-5">
              <div className="bg-surface-1 p-4 rounded-xl border border-hairline text-xs text-ink space-y-2">
                <div className="font-semibold text-ink flex items-center gap-2">
                  <Shield className="w-4 h-4 text-fin-orange" />
                  Dual Backend Architecture
                </div>
                <p className="text-ink-muted">
                  FactoryFlow runs with high-speed in-memory state persistence for instant factory response. You can connect any Supabase PostgreSQL instance by pasting your credentials below. The app will sync multi-tenant tables, orders, and documents seamlessly.
                </p>
              </div>

              <form onSubmit={handleSaveAndTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-ink-muted" />
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-ink-muted" />
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink font-mono"
                  />
                </div>

                {statusMessage && (
                  <div className={`p-3 rounded-lg text-xs flex items-start space-x-2.5 ${
                    statusMessage.success ? 'bg-green-50 text-report-green border border-green-200' : 'bg-red-50 text-semantic-error border border-red-200'
                  }`}>
                    {statusMessage.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{statusMessage.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-ink-subtle hover:text-red-600 transition-colors"
                  >
                    Disconnect / Reset to Offline Store
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="px-4 py-2 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      {isTesting ? 'Verifying Supabase Connection...' : 'Save & Test Connection'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-ink">PostgreSQL Schema (supabase/schema.sql)</h3>
                  <p className="text-[11px] text-ink-muted">
                    Includes companies, RBAC roles, items, BOM, stock transactions, orders & RLS policies
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copySchemaToClipboard}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-surface-1 border border-hairline hover:border-ink text-xs font-medium text-ink transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Schema'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-surface-1 p-3.5 rounded-xl border border-hairline font-mono text-[11px] text-ink-muted max-h-80 overflow-y-auto space-y-1">
                <div className="text-ink font-semibold">-- File: supabase/schema.sql (Ready for execution in Supabase SQL Editor)</div>
                <div>CREATE EXTENSION IF NOT EXISTS "uuid-ossp";</div>
                <div>CREATE TABLE companies (id UUID PRIMARY KEY, name VARCHAR, gstin VARCHAR...);</div>
                <div>CREATE TYPE user_erp_role AS ENUM ('owner', 'admin', 'production_manager', 'worker', 'qc_inspector'...);</div>
                <div>CREATE TABLE items (id UUID, item_code VARCHAR, current_stock NUMERIC...);</div>
                <div>CREATE TABLE bills_of_materials (...);</div>
                <div>CREATE TABLE work_orders (...);</div>
                <div>CREATE TABLE stock_transactions (...);</div>
                <div>ALTER TABLE companies ENABLE ROW LEVEL SECURITY;</div>
                <div className="text-fin-orange">-- (Full schema is saved in /supabase/schema.sql in the project root)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
