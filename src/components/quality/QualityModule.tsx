import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const QualityModule: React.FC = () => {
  const { 
    qualityInspections, 
    workOrders, 
    grns, 
    items, 
    createQualityInspection 
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);

  // New Inspection State
  const [refType, setRefType] = useState<'work_order' | 'grn'>('work_order');
  const [selectedRefId, setSelectedRefId] = useState('');
  const [sampleSize, setSampleSize] = useState(15);
  const [overallStatus, setOverallStatus] = useState<'passed' | 'failed' | 'conditional_pass'>('passed');
  const [rootCause, setRootCause] = useState('');
  
  // Checkpoints
  const [checkpoints, setCheckpoints] = useState([
    { parameterName: 'Outer Bearing Diameter (OD)', specification: '25.000 mm', tolerance: '± 0.010 mm', observedValue: '25.004 mm', result: 'pass' as 'pass' | 'fail' },
    { parameterName: 'Concentricity & Runout', specification: '< 0.015 mm', tolerance: 'Max 0.015 mm', observedValue: '0.008 mm', result: 'pass' as 'pass' | 'fail' },
    { parameterName: 'Surface Roughness Ra', specification: '0.80 µm', tolerance: 'Max 0.80 µm', observedValue: '0.55 µm', result: 'pass' as 'pass' | 'fail' },
    { parameterName: 'Core Hardness', specification: '50 - 55 HRC', tolerance: '± 2 HRC', observedValue: '53 HRC', result: 'pass' as 'pass' | 'fail' },
  ]);

  const filteredInspections = qualityInspections.filter(qi => 
    qi.inspectionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qi.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qi.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWOs = workOrders.filter(w => w.status === 'qc_pending' || w.status === 'in_progress');
  const pendingGRNs = grns.filter(g => g.qcStatus === 'pending_inspection');

  const handleCreateInspection = (e: React.FormEvent) => {
    e.preventDefault();
    let itemId = items[0].id;
    if (refType === 'work_order') {
      const wo = workOrders.find(w => w.id === selectedRefId);
      if (wo) itemId = wo.productId;
    } else {
      const grn = grns.find(g => g.id === selectedRefId);
      if (grn && grn.items[0]) itemId = grn.items[0].itemId;
    }

    createQualityInspection(
      refType,
      selectedRefId,
      itemId,
      overallStatus,
      sampleSize,
      checkpoints,
      rootCause
    );

    setIsInspectModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Quality assurance & inspection</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Incoming & final quality control
          </h1>
        </div>

        <button
          onClick={() => setIsInspectModalOpen(true)}
          className="btn-primary text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New inspection</span>
        </button>
      </div>

      {/* Quality Gate Rule Callout */}
      <div className="bg-surface-1 p-4 rounded-lg border border-hairline flex items-center justify-between text-xs text-ink">
        <div className="space-y-0.5">
          <div className="font-medium text-ink">Quality lock active</div>
          <p className="text-ink-muted">
            Finished components cannot be dispatched, and incoming supplier materials cannot be issued to work orders, without an approved QC report.
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-3 text-ink-muted font-mono">
          <span>Pending work orders: {pendingWOs.length}</span>
          <span>Pending receipts: {pendingGRNs.length}</span>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by QC #, part, reference..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Inspection #</th>
                  <th className="px-4 py-3">Reference lot</th>
                  <th className="px-4 py-3">Part inspected</th>
                  <th className="px-3 py-3">Inspector</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-center">Sample size</th>
                  <th className="px-3 py-3">Verdict</th>
                  <th className="px-4 py-3">Disposition / Checkpoints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {filteredInspections.map((qi) => (
                  <tr key={qi.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-ink">
                      {qi.inspectionNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-ink">{qi.referenceNumber}</span>
                      <div className="text-[10px] uppercase text-ink-subtle">
                        {qi.referenceType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {qi.itemName}
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{qi.inspectorName}</td>
                    <td className="px-3 py-3 text-ink-muted">{qi.inspectionDate}</td>
                    <td className="px-3 py-3 text-center font-mono text-ink-muted">{qi.sampleSize} nos</td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] font-medium capitalize text-ink">
                        {qi.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-ink">{qi.correctiveAction}</div>
                      <div className="text-[10px] text-ink-subtle">
                        {qi.checkpoints.map(cp => `${cp.parameterName}: ${cp.observedValue}`).join(' · ')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NEW INSPECTION MODAL */}
      {isInspectModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Record quality inspection
              </h2>
              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Inspection type</label>
                  <select
                    value={refType}
                    onChange={(e) => {
                      setRefType(e.target.value as any);
                      setSelectedRefId('');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="work_order">Production work order lot</option>
                    <option value="grn">Supplier dock receipt (GRN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Select lot</label>
                  <select
                    required
                    value={selectedRefId}
                    onChange={(e) => setSelectedRefId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="">Select lot...</option>
                    {refType === 'work_order' ? (
                      workOrders.map(wo => (
                        <option key={wo.id} value={wo.id}>{wo.woNumber} - {wo.productName}</option>
                      ))
                    ) : (
                      grns.map(g => (
                        <option key={g.id} value={g.id}>{g.grnNumber} - {g.supplierName}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Checkpoints */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-medium text-ink">Gauge & dimension checkpoints</span>
                <div className="space-y-2">
                  {checkpoints.map((cp, idx) => (
                    <div key={idx} className="bg-canvas p-2.5 rounded border border-hairline grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5 text-ink">
                        <div className="font-medium">{cp.parameterName}</div>
                        <div className="text-[10px] text-ink-subtle">Spec: {cp.specification} ({cp.tolerance})</div>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={cp.observedValue}
                          onChange={(e) => {
                            const updated = [...checkpoints];
                            updated[idx].observedValue = e.target.value;
                            setCheckpoints(updated);
                          }}
                          placeholder="Observed Value"
                          className="w-full px-2 py-1 text-xs rounded bg-surface-1 border border-hairline font-mono"
                        />
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...checkpoints];
                            updated[idx].result = updated[idx].result === 'pass' ? 'fail' : 'pass';
                            setCheckpoints(updated);
                          }}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded capitalize ${
                            cp.result === 'pass' ? 'bg-surface-1 text-ink border border-hairline' : 'bg-ink text-white'
                          }`}
                        >
                          {cp.result}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Verdict</label>
                  <select
                    value={overallStatus}
                    onChange={(e) => setOverallStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-medium"
                  >
                    <option value="passed">PASS (Release lot)</option>
                    <option value="failed">FAIL (Hold / quarantine)</option>
                    <option value="conditional_pass">CONDITIONAL PASS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Sample size tested</label>
                  <input
                    type="number"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
              </div>

              {overallStatus === 'failed' && (
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Root cause analysis</label>
                  <textarea
                    required
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Describe defect reason and rework disposition..."
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsInspectModalOpen(false)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Record verdict & update lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
