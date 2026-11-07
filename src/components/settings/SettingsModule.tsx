import React, { useState } from 'react';
import { 
  Building2, 
  Database, 
  RotateCcw
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { isSupabaseConfigured } from '../../lib/supabase';

interface SettingsModuleProps {
  onOpenSupabaseModal: () => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onOpenSupabaseModal }) => {
  const { 
    activeCompany, 
    auditLogs, 
    resetToDemoData 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'company' | 'sequences' | 'rbac' | 'audit'>('company');

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
    { role: 'Owner / Managing Director', perm: 'Unrestricted full access across all operations, financial ledgers & tenancy' },
    { role: 'Admin', perm: 'System parameters, master catalogs, user provisioning & sequence rules' },
    { role: 'Production Manager', perm: 'Work orders, bills of materials (BOM), MRP requirements & job release' },
    { role: 'Purchase User', perm: 'Vendor quotes, purchase orders, supplier evaluation & order releases' },
    { role: 'Storekeeper', perm: 'Dock receipts (GRN), shop-floor material issues, stock ledger & physical counts' },
    { role: 'Shop-Floor Worker', perm: 'Touch terminal: My assigned jobs, Start/Pause, good & rejection counts' },
    { role: 'QC Inspector', perm: 'Dock receipt audits, in-process tolerances, finished release & scrap hold' },
    { role: 'Accountant', perm: 'GST tax invoices, GSTR-1/3B summaries, payments & General Ledger' },
    { role: 'Viewer / Auditor', perm: 'Read-only access to records, compliance reports & audit logs' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Tenancy & system configuration</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Settings & database
          </h1>
        </div>

        <button
          onClick={onOpenSupabaseModal}
          className="btn-primary text-xs"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase database</span>
        </button>
      </div>

      {/* Pill Toggle */}
      <div className="pill-container">
        <button
          onClick={() => setActiveTab('company')}
          className={`pill-item ${activeTab === 'company' ? 'pill-item-active' : ''}`}
        >
          Company profile
        </button>
        <button
          onClick={() => setActiveTab('sequences')}
          className={`pill-item ${activeTab === 'sequences' ? 'pill-item-active' : ''}`}
        >
          Document sequences
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={`pill-item ${activeTab === 'rbac' ? 'pill-item-active' : ''}`}
        >
          Role permissions
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pill-item ${activeTab === 'audit' ? 'pill-item-active' : ''}`}
        >
          Audit log
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'company' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-1 p-6 rounded-lg border border-hairline space-y-4">
            <h3 className="text-sm font-medium text-ink border-b border-hairline pb-2">
              Active company legal entity
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-ink-muted">Company name:</label>
                <div className="font-medium text-ink text-sm mt-0.5">{activeCompany.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-ink-muted">Company code:</label>
                  <div className="font-mono text-ink mt-0.5">{activeCompany.code}</div>
                </div>
                <div>
                  <label className="text-ink-muted">Currency:</label>
                  <div className="text-ink mt-0.5">INR (₹)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-ink-muted">GSTIN:</label>
                  <div className="font-mono text-ink mt-0.5">{activeCompany.gstin}</div>
                </div>
                <div>
                  <label className="text-ink-muted">PAN:</label>
                  <div className="font-mono text-ink mt-0.5">{activeCompany.pan}</div>
                </div>
              </div>

              <div>
                <label className="text-ink-muted">Registered factory address:</label>
                <div className="text-ink mt-0.5">{activeCompany.address}, {activeCompany.city}, {activeCompany.state} - {activeCompany.pincode}</div>
              </div>
            </div>
          </div>

          <div className="bg-surface-1 p-6 rounded-lg border border-hairline space-y-4">
            <h3 className="text-sm font-medium text-ink border-b border-hairline pb-2">
              Database backend status
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Active storage engine:</span>
                <span className="font-medium text-ink">
                  {isSupabaseConfigured ? 'Supabase PostgreSQL Cloud' : 'Local Enterprise Reactive Store'}
                </span>
              </div>
              <p className="text-ink-muted">
                The application operates offline/online with zero latency. You can attach any Supabase PostgreSQL instance using the modal above.
              </p>
            </div>

            <div className="pt-4 border-t border-hairline">
              <button
                onClick={resetToDemoData}
                className="btn-secondary text-xs w-full"
              >
                <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
                <span>Reset demo dataset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sequences' && (
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="p-4 border-b border-hairline">
            <h3 className="text-xs font-medium text-ink">Document numbering & sequencing</h3>
            <p className="text-[11px] text-ink-muted">
              Concurrency-safe unique sequence generation per company and fiscal year
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Prefix</th>
                  <th className="p-3 font-mono">Format</th>
                  <th className="p-3 font-mono">Example</th>
                  <th className="p-3 text-right">Reset interval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {documentSequences.map((seq, idx) => (
                  <tr key={idx} className="hover:bg-canvas/40">
                    <td className="p-3 font-medium text-ink">{seq.type}</td>
                    <td className="p-3 font-mono text-ink">{seq.prefix}</td>
                    <td className="p-3 font-mono text-ink-muted">{seq.format}</td>
                    <td className="p-3 font-mono text-ink">{seq.sample}</td>
                    <td className="p-3 text-right text-ink-muted">Fiscal Year</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rbac' && (
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="p-4 border-b border-hairline">
            <h3 className="text-xs font-medium text-ink">Role-based access control (RBAC)</h3>
            <p className="text-[11px] text-ink-muted">
              Compartmentalization ensuring shop-floor workers only see operational screens
            </p>
          </div>
          <div className="divide-y divide-hairline-soft">
            {rbacRoles.map((r, idx) => (
              <div key={idx} className="p-3.5 flex items-start justify-between text-xs hover:bg-canvas/30">
                <div className="font-medium text-ink w-48 shrink-0">{r.role}</div>
                <div className="text-ink-muted flex-1 pl-4">{r.perm}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="p-4 border-b border-hairline flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-ink">Audit log</h3>
              <p className="text-[11px] text-ink-muted">Audit trail of creates, updates and stock adjustments</p>
            </div>
            <span className="font-mono text-xs text-ink-muted">{auditLogs.length} events</span>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              No new transactions logged in this session yet.
            </div>
          ) : (
            <div className="divide-y divide-hairline-soft max-h-96 overflow-y-auto font-normal">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 flex items-center justify-between text-xs hover:bg-canvas/40">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-ink-muted uppercase">
                        {log.action}
                      </span>
                      <span className="font-medium text-ink">{log.entityName}</span>
                      <span className="text-ink-muted text-[11px]">{log.details}</span>
                    </div>
                    <div className="text-[10px] text-ink-subtle">By: {log.userName}</div>
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
