import React, { useState } from 'react';
import { 
  Factory, 
  Plus, 
  Search, 
  Play, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  HardHat,
  ChevronRight,
  ArrowRight,
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { WorkOrder, BillOfMaterials } from '../../types/erp';
import { NavTab } from '../layout/Sidebar';

interface ManufacturingModuleProps {
  onNavigateToShopfloor: () => void;
}

export const ManufacturingModule: React.FC<ManufacturingModuleProps> = ({ onNavigateToShopfloor }) => {
  const { 
    workOrders, 
    boms, 
    items, 
    createWorkOrder, 
    startWorkOrder 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'workorders' | 'boms'>('workorders');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateWOOpen, setIsCreateWOOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Work Order Form State
  const [selectedBOMId, setSelectedBOMId] = useState('');
  const [quantity, setQuantity] = useState(200);
  const [priority, setPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [dueDate, setDueDate] = useState('');

  const filteredOrders = workOrders.filter(w => 
    w.woNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.assignedWorker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartJob = (woId: string) => {
    setErrorMessage(null);
    const result = startWorkOrder(woId);
    if (!result.success) {
      setErrorMessage(result.message);
    }
  };

  const handleCreateWO = (e: React.FormEvent) => {
    e.preventDefault();
    const bom = boms.find(b => b.id === selectedBOMId);
    if (!bom) return;

    createWorkOrder(
      bom.productId, 
      bom.id, 
      quantity, 
      priority, 
      dueDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
    );

    setIsCreateWOOpen(false);
    setSelectedBOMId('');
    setQuantity(200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Factory className="w-5 h-5 text-ink" />
            Manufacturing, BOM & Routing
          </h1>
          <p className="text-xs text-ink-muted">
            Manage Bills of Materials (BOM), production planning, material issue & shop-floor work orders
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-surface-1 border border-hairline rounded-lg p-0.5 shadow-card">
            <button
              onClick={() => setActiveTab('workorders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'workorders' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Work Orders
            </button>
            <button
              onClick={() => setActiveTab('boms')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'boms' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Bills of Materials (BOM)
            </button>
          </div>

          <button
            onClick={onNavigateToShopfloor}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-fin-orange hover:bg-fin-orangeHover text-white text-xs font-semibold rounded-md transition-all shadow-sm"
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Launch Operator Terminal</span>
          </button>

          <button
            onClick={() => setIsCreateWOOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Work Order</span>
          </button>
        </div>
      </div>

      {/* Error Alert if material shortage blocks starting a job */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start justify-between text-xs text-semantic-error">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Production Issue Blocked (Quality & Stock Lock):</div>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-ink-muted hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'workorders' ? (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by WO #, product or operator..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink"
            />
          </div>

          {/* Work Orders Table */}
          <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                  <tr>
                    <th className="px-4 py-3">Work Order #</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-3 py-3">BOM Revision</th>
                    <th className="px-3 py-3">Assigned Cell / Worker</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-4 py-3 text-right">Output Progress</th>
                    <th className="px-3 py-3 text-right">Rejects / Rework</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {filteredOrders.map((wo) => {
                    const progress = Math.round((wo.producedQuantity / wo.plannedQuantity) * 100);
                    return (
                      <tr key={wo.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-ink">
                          {wo.woNumber}
                          {wo.soNumber && (
                            <div className="text-[10px] text-ink-subtle">SO: {wo.soNumber}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{wo.productName}</div>
                          <div className="text-[11px] font-mono text-ink-subtle">{wo.productCode}</div>
                        </td>
                        <td className="px-3 py-3 font-mono text-ink-muted">
                          {wo.bomRevision}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-ink font-medium">{wo.assignedWorker}</div>
                          <div className="text-[10px] text-ink-subtle">Sup: {wo.assignedSupervisor}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            wo.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-surface-2 text-ink-muted'
                          }`}>
                            {wo.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono font-bold text-ink">
                            {wo.producedQuantity} / {wo.plannedQuantity}
                          </div>
                          <div className="text-[10px] text-ink-subtle">{progress}%</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono">
                          <span className={wo.rejectedQuantity > 0 ? 'text-semantic-error font-bold' : 'text-ink-muted'}>
                            {wo.rejectedQuantity} rej
                          </span>
                          {wo.reworkQuantity > 0 && (
                            <span className="text-amber-600 ml-1">({wo.reworkQuantity} rw)</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            wo.status === 'completed'
                              ? 'bg-green-100 text-report-green'
                              : wo.status === 'in_progress'
                              ? 'bg-blue-100 text-report-blue'
                              : wo.status === 'qc_pending'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-surface-2 text-ink-muted'
                          }`}>
                            {wo.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {wo.status === 'scheduled' && (
                            <button
                              onClick={() => handleStartJob(wo.id)}
                              className="px-2.5 py-1 bg-ink hover:bg-black text-white text-[11px] font-medium rounded transition-colors flex items-center gap-1 mx-auto"
                              title="Start job & deduct raw materials from store"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Issue & Start</span>
                            </button>
                          )}
                          {wo.status === 'in_progress' && (
                            <button
                              onClick={onNavigateToShopfloor}
                              className="px-2.5 py-1 bg-fin-orange hover:bg-fin-orangeHover text-white text-[11px] font-medium rounded transition-colors flex items-center gap-1 mx-auto"
                            >
                              <HardHat className="w-3 h-3" />
                              <span>Log Output</span>
                            </button>
                          )}
                          {wo.status === 'qc_pending' && (
                            <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              QC In Queue
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Bills of Materials (BOM) View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boms.map((bom) => (
              <div key={bom.id} className="bg-surface-1 rounded-xl border border-hairline shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-hairline pb-3">
                  <div>
                    <span className="font-mono text-xs font-semibold text-fin-orange">{bom.bomNumber}</span>
                    <h3 className="text-sm font-bold text-ink mt-0.5">{bom.productName}</h3>
                    <div className="text-[11px] text-ink-muted">Code: {bom.productCode}</div>
                  </div>
                  <span className="font-mono text-xs font-semibold bg-surface-2 px-2.5 py-1 rounded">
                    {bom.revision}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-ink">Exploded Component Routing:</div>
                  <div className="divide-y divide-hairline-soft bg-surface-2/30 rounded-lg p-2.5">
                    {bom.items.map((bi) => (
                      <div key={bi.id} className="py-2 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-ink">{bi.itemName}</div>
                          <div className="text-[10px] text-ink-subtle">
                            Station: {bi.operationStation} · Scrap: {bi.scrapPercentage}%
                          </div>
                        </div>
                        <div className="font-mono font-bold text-ink">
                          {bi.quantityRequired} {bi.uom} / unit
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-ink-subtle pt-1 flex justify-between">
                  <span>Approved By: {bom.approvedBy}</span>
                  <span>Created: {bom.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {isCreateWOOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <Factory className="w-4 h-4 text-fin-orange" />
                Schedule Production Work Order
              </h2>
              <button
                onClick={() => setIsCreateWOOpen(false)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Select Product & BOM</label>
                <select
                  required
                  value={selectedBOMId}
                  onChange={(e) => setSelectedBOMId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                >
                  <option value="">Select BOM...</option>
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.productName} ({b.bomNumber} - {b.revision})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Planned Quantity (Units)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreateWOOpen(false)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Schedule Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
