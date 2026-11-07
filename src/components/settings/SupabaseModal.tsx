import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy
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
    setStatusMessage({ success: true, message: 'Supabase credentials cleared. Using local offline store.' });
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
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-ink flex items-center gap-2">
              Supabase PostgreSQL database
            </h2>
            <p className="text-xs text-ink-muted">
              Connect external Supabase project for real-time cloud multi-tenancy
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-subtle hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-hairline bg-canvas px-6">
          <button
            onClick={() => setActiveTab('connect')}
            className={`py-2 text-xs font-medium mr-6 border-b-2 transition-colors ${
              activeTab === 'connect'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            Connection settings
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            SQL schema & RLS policies
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === 'connect' ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded bg-canvas border border-hairline text-xs space-y-1">
                <div className="font-medium text-ink">Architecture</div>
                <p className="text-ink-muted">
                  FactoryFlow runs on an in-memory/localStorage reactive engine by default. Connecting your Supabase PostgreSQL project enables cloud sync, multi-user concurrency, and database-level Row Level Security (RLS).
                </p>
              </div>

              <form onSubmit={handleSaveAndTest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono focus:outline-none focus:border-ink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Supabase Anon API Key
                  </label>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono focus:outline-none focus:border-ink"
                  />
                </div>

                {statusMessage && (
                  <div className={`p-3 rounded text-xs flex items-start space-x-2 ${
                    statusMessage.success ? 'bg-canvas text-ink border border-hairline' : 'bg-canvas text-ink border border-hairline'
                  }`}>
                    {statusMessage.success ? (
                      <CheckCircle2 className="w-4 h-4 text-report-green shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                    )}
                    <span>{statusMessage.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-hairline">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-ink-muted hover:text-ink transition-colors"
                  >
                    Disconnect
                  </button>

                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={isTesting}
                      className="btn-primary text-xs"
                    >
                      {isTesting ? 'Verifying connection...' : 'Save & test connection'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-ink">PostgreSQL Schema (supabase/schema.sql)</h3>
                  <p className="text-[11px] text-ink-muted">
                    Tables, foreign keys, stored procedures, and Row Level Security policies
                  </p>
                </div>
                <button
                  onClick={copySchemaToClipboard}
                  className="btn-secondary text-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-ink-muted" />
                  <span>{copied ? 'Copied' : 'Copy schema'}</span>
                </button>
              </div>

              <div className="bg-canvas p-3 rounded border border-hairline font-mono text-[11px] text-ink-muted max-h-72 overflow-y-auto space-y-1">
                <div className="text-ink">-- PostgreSQL Schema: supabase/schema.sql</div>
                <div>CREATE EXTENSION IF NOT EXISTS "uuid-ossp";</div>
                <div>CREATE TABLE companies (id UUID PRIMARY KEY, name VARCHAR, gstin VARCHAR...);</div>
                <div>CREATE TYPE user_erp_role AS ENUM ('owner', 'admin', 'production_manager', 'worker', 'qc_inspector'...);</div>
                <div>CREATE TABLE items (id UUID, item_code VARCHAR, current_stock NUMERIC...);</div>
                <div>CREATE TABLE bills_of_materials (...);</div>
                <div>CREATE TABLE work_orders (...);</div>
                <div>CREATE TABLE stock_transactions (...);</div>
                <div>ALTER TABLE companies ENABLE ROW LEVEL SECURITY;</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
