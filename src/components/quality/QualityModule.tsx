import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  FileCheck2, 
  Sliders,
  Check,
  X,
  Lock
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { QualityInspection } from '../../types/erp';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-report-pink" />
            Quality Assurance & Inspection Lock
          </h1>
          <p className="text-xs text-ink-muted">
            Incoming vendor receipt audits, in-process routing checks, finished product release & rework disposition
          </p>
        </div>

        <button
          onClick={() => setIsInspectModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New QC Inspection</span>
        </button>
      </div>

      {/* Quality Gate Rule Callout */}
      <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card flex items-center justify-between text-xs text-ink">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-pink-50 text-report-pink flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-ink">Quality Lock System Active:</span>
            <p className="text-ink-muted">
              Finished Goods cannot be dispatched on delivery challans, and raw materials cannot be issued to work orders, without an approved QC Inspection record.
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4 font-mono text-xs">
          <span>Pending WO: <strong className="text-report-pink">{pendingWOs.length}</strong></span>
          <span>Pending GRN: <strong className="text-report-orange">{pendingGRNs.length}</strong></span>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by QC #, item name, reference..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink"
          />
        </div>

        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                <tr>
                  <th className="px-4 py-3">Inspection #</th>
                  <th className="px-4 py-3">Reference Lot</th>
                  <th className="px-4 py-3">Component Inspected</th>
                  <th className="px-3 py-3">Inspector</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 text-center">Sample Size</th>
                  <th className="px-3 py-3">Verdict</th>
                  <th className="px-4 py-3">Disposition / Checkpoints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {filteredInspections.map((qi) => (
                  <tr key={qi.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">
                      {qi.inspectionNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-ink">{qi.referenceNumber}</span>
                      <div className="text-[10px] uppercase font-bold text-ink-subtle">
                        {qi.referenceType.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {qi.itemName}
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{qi.inspectorName}</td>
                    <td className="px-3 py-3 text-ink-muted">{qi.inspectionDate}</td>
                    <td className="px-3 py-3 text-center font-mono">{qi.sampleSize} nos</td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center w-max gap-1 ${
                        qi.status === 'passed'
                          ? 'bg-green-100 text-report-green'
                          : 'bg-red-100 text-semantic-error'
                      }`}>
                        {qi.status === 'passed' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {qi.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-ink font-medium">{qi.correctiveAction}</div>
                      <div className="text-[10px] text-ink-subtle">
                        {qi.checkpoints.map(cp => `${cp.parameterName}: ${cp.observedValue} (${cp.result.toUpperCase()})`).join(' · ')}
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
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-report-pink" />
                Record Quality Inspection
              </h2>
              <button
                onClick={() => setIsInspectModalOpen(false)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Inspection Type</label>
                  <select
                    value={refType}
                    onChange={(e) => {
                      setRefType(e.target.value as any);
                      setSelectedRefId('');
                    }}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="work_order">Production Work Order (Final/In-Process)</option>
                    <option value="grn">Supplier Dock Goods Receipt (Incoming)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Select Lot / Order</label>
                  <select
                    required
                    value={selectedRefId}
                    onChange={(e) => setSelectedRefId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="">Select lot...</option>
                    {refType === 'work_order' ? (
                      workOrders.map(wo => (
                        <option key={wo.id} value={wo.id}>{wo.woNumber} - {wo.productName} ({wo.status})</option>
                      ))
                    ) : (
                      grns.map(g => (
                        <option key={g.id} value={g.id}>{g.grnNumber} - {g.supplierName}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Checkpoints List */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-ink">Micrometer & Gauge Parameter Checkpoints</span>
                <div className="space-y-2">
                  {checkpoints.map((cp, idx) => (
                    <div key={idx} className="bg-surface-1 p-2.5 rounded-lg border border-hairline grid grid-cols-12 gap-2 items-center text-xs">
                      <div className="col-span-5 font-medium text-ink">
                        {cp.parameterName}
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
                          className={`px-3 py-1 text-[11px] font-bold rounded uppercase ${
                            cp.result === 'pass' ? 'bg-green-100 text-report-green' : 'bg-red-100 text-semantic-error'
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
                  <label className="block text-xs font-semibold text-ink mb-1">Final Verdict</label>
                  <select
                    value={overallStatus}
                    onChange={(e) => setOverallStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-bold"
                  >
                    <option value="passed">PASS (Release Lot)</option>
                    <option value="failed">FAIL (Hold / Quarantine)</option>
                    <option value="conditional_pass">CONDITIONAL PASS (Deviated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Sample Size Tested</label>
                  <input
                    type="number"
                    value={sampleSize}
                    onChange={(e) => setSampleSize(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
              </div>

              {overallStatus === 'failed' && (
                <div>
                  <label className="block text-xs font-bold text-semantic-error mb-1">Root Cause & Defect Analysis</label>
                  <textarea
                    required
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Describe failure reason, scrap disposition or rework route..."
                    rows={2}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-red-300 text-ink"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsInspectModalOpen(false)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Post Quality Record & Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
