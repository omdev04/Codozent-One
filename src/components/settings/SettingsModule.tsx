import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  ShieldCheck, 
  Database, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Download, 
  RotateCcw,
  History,
  Key
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { isSupabaseConfigured } from '../../lib/supabase';

interface SettingsModuleProps {
  onOpenSupabaseModal: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onOpenSupabaseModal }) => {
  const { 
    companies, 
    activeCompany, 
    currentRole, 
    auditLogs, 
    resetToDemoData 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'company' | 'sequences' | 'rbac' | 'audit'>('company');
  const [copied, setCopied] = useState(false);

  const documentSequences = [
    { type: 'Sales Orders', prefix: 'SO', format: 'SO-YYYY-#####', sample: 'SO-2026-00044' },
    { type: 'Purchase Orders', prefix: 'PO', format: 'PO-YYYY-#####', sample: 'PO-2026-00090' },
    { type: 'Work Orders', prefix: 'WO', format: 'WO-YYYY-#####', sample: 'WO-2026-00017' },
    { type: 'GST Tax Invoices', prefix: 'INV', format: 'INV-YYYY-#####', sample: 'INV-2026-00089' },
    { type: 'Goods Receipt (GRN)', prefix: 'GRN', format: 'GRN-YYYY-#####', sample: 'GRN-2026-00032' },
    { type: 'Delivery Challans', prefix: 'DC', format: 'DC-YYYY-#####', sample: 'DC-2026-00020' },
    { type: 'Quality Inspections', prefix: 'QC', format: 'QC-YYYY-#####', sample: 'QC-2026-00055' },
    { type: 'Payment Receipts', prefix: 'PAY', format: 'PAY-YYYY-#####', sample: 'PAY-2026-00023' }
  ];

  const rbacRoles = [
    { role: 'Owner / Managing Director', perm: 'Unrestricted full access across all modules, accounting & multi-company settings' },
    { role: 'Admin', perm: 'System configuration, master data, user provisioning & numbering sequences' },
    { role: 'Production Manager', perm: 'Work orders, bills of materials (BOM), MRP planning, routing & job dispatch' },
    { role: 'Purchase User', perm: 'Supplier quotes, purchase orders, vendor performance & MRP requisition' },
    { role: 'Storekeeper', perm: 'Dock receipts (GRN), raw material issues, stock ledger, transfers & physical counts' },
    { role: 'Shop-Floor Worker', perm: 'Simplified tactile terminal: My assigned jobs, Start/Pause, good/rejects output' },
    { role: 'QC Inspector', perm: 'Incoming GRN inspection, in-process tolerances, finished goods release & scrap lock' },
    { role: 'Accountant', perm: 'GST tax invoices, GSTR-1/3B returns, payments, chart of accounts & General Ledger' },
    { role: 'Viewer / Auditor', perm: 'Read-only access to records, compliance reports & audit logs' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Settings className="w-5 h-5 text-ink" />
            System Administration & Tenancy Settings
          </h1>
          <p className="text-xs text-ink-muted">
            Configure multi-company parameters, document sequencing, role permissions & Supabase PostgreSQL backend
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSupabaseModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-report-green" />
            <span>Supabase Cloud Integration</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 bg-surface-1 border border-hairline p-1 rounded-xl w-fit shadow-card">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'company' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Company Profile
        </button>
        <button
          onClick={() => setActiveTab('sequences')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'sequences' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Document Sequences
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'rbac' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          RBAC Permissions Matrix
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'audit' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Live Audit Log
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-1 p-6 rounded-xl border border-hairline shadow-card space-y-4">
            <h3 className="text-sm font-bold text-ink border-b border-hairline pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-fin-orange" />
              Active Manufacturing Legal Entity
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-ink-subtle">Company Name:</label>
                <div className="font-bold text-ink text-sm mt-0.5">{activeCompany.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-ink-subtle">Company Code:</label>
                  <div className="font-mono font-semibold text-ink">{activeCompany.code}</div>
                </div>
                <div>
                  <label className="text-ink-subtle">Currency:</label>
                  <div className="font-semibold text-ink">INR (₹ Indian Rupee)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-ink-subtle">GSTIN Number:</label>
                  <div className="font-mono font-bold text-ink">{activeCompany.gstin}</div>
                </div>
                <div>
                  <label className="text-ink-subtle">Permanent Account (PAN):</label>
                  <div className="font-mono font-bold text-ink">{activeCompany.pan}</div>
                </div>
              </div>

              <div>
                <label className="text-ink-subtle">Registered Factory Address:</label>
                <div className="text-ink">{activeCompany.address}, {activeCompany.city}, {activeCompany.state} - {activeCompany.pincode}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-hairline-soft">
                <div>
                  <label className="text-ink-subtle">Fiscal Year:</label>
                  <div className="font-semibold text-ink">01 April – 31 March</div>
                </div>
                <div>
                  <label className="text-ink-subtle">State Code (GST):</label>
                  <div className="font-mono font-semibold text-ink">{activeCompany.stateCode} (Maharashtra)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Reset Demo Data & Supabase Status */}
          <div className="bg-surface-1 p-6 rounded-xl border border-hairline shadow-card space-y-5">
            <h3 className="text-sm font-bold text-ink border-b border-hairline pb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-report-blue" />
              PostgreSQL & Storage Backend
            </h3>

            <div className="p-4 rounded-lg bg-surface-2/40 border border-hairline-soft text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Engine Mode:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isSupabaseConfigured ? 'bg-green-100 text-report-green' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isSupabaseConfigured ? 'Live Supabase Cloud' : 'Local Enterprise Store'}
                </span>
              </div>
              <p className="text-ink-muted">
                Enterprise local state engine stores perpetual records locally with zero latency. You can attach any Supabase PostgreSQL instance at any time.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={resetToDemoData}
                className="w-full py-2.5 px-4 bg-surface-1 border border-red-300 text-semantic-error hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Application to Fresh Demo State</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sequences' && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="p-4 border-b border-hairline bg-surface-2/30">
            <h3 className="text-xs font-bold text-ink">Document Numbering & Auto-Sequencing</h3>
            <p className="text-[11px] text-ink-muted">
              Concurrency-safe unique sequence generation per company and fiscal year, preventing numbering collisions
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-1 border-b border-hairline text-ink-subtle font-medium">
                <tr>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Prefix</th>
                  <th className="p-3 font-mono">Format Pattern</th>
                  <th className="p-3 font-mono">Generated Example</th>
                  <th className="p-3 text-right">Reset Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {documentSequences.map((seq, idx) => (
                  <tr key={idx} className="hover:bg-canvas/50">
                    <td className="p-3 font-semibold text-ink">{seq.type}</td>
                    <td className="p-3 font-mono font-bold text-fin-orange">{seq.prefix}</td>
                    <td className="p-3 font-mono text-ink-muted">{seq.format}</td>
                    <td className="p-3 font-mono font-semibold text-ink">{seq.sample}</td>
                    <td className="p-3 text-right text-ink-subtle">Annual (Fiscal Year)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rbac' && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="p-4 border-b border-hairline bg-surface-2/30">
            <h3 className="text-xs font-bold text-ink">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-[11px] text-ink-muted">
              Strict compartmentalization ensuring workers only see operational screens and finance remains restricted
            </p>
          </div>
          <div className="divide-y divide-hairline-soft">
            {rbacRoles.map((r, idx) => (
              <div key={idx} className="p-3.5 flex items-start justify-between text-xs hover:bg-canvas/40">
                <div className="font-semibold text-ink w-48 shrink-0">{r.role}</div>
                <div className="text-ink-muted flex-1 pl-4">{r.perm}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="p-4 border-b border-hairline bg-surface-2/30 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-ink">Tamper-Proof Audit Trail</h3>
              <p className="text-[11px] text-ink-muted">Cryptographic log of all creations, status changes and stock movements</p>
            </div>
            <span className="font-mono text-xs text-ink-subtle">{auditLogs.length} Events Logged</span>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              No new manual actions logged in this session yet. Create an order or post an output to see events appear.
            </div>
          ) : (
            <div className="divide-y divide-hairline-soft max-h-96 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between text-xs hover:bg-canvas/50">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[10px] px-1.5 py-0.2 rounded bg-surface-2 text-ink uppercase">
                        {log.action}
                      </span>
                      <span className="font-semibold text-ink">{log.entityName}</span>
                      <span className="text-ink-subtle text-[11px]">{log.details}</span>
                    </div>
                    <div className="text-[10px] text-ink-subtle">by {log.userName}</div>
                  </div>
                  <div className="text-[10px] font-mono text-ink-subtle">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
