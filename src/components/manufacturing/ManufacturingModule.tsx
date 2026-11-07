import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Play, 
  X,
  ArrowRight
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface ManufacturingModuleProps {
  onNavigateToShopfloor: () => void;
}

export const ManufacturingModule: React.FC<ManufacturingModuleProps> = ({ onNavigateToShopfloor }) => {
  const { 
    workOrders, 
    boms, 
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Shop-floor execution & bills of materials</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Manufacturing & routing
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="pill-container">
            <button
              onClick={() => setActiveTab('workorders')}
              className={`pill-item ${activeTab === 'workorders' ? 'pill-item-active' : ''}`}
            >
              Work orders
            </button>
            <button
              onClick={() => setActiveTab('boms')}
              className={`pill-item ${activeTab === 'boms' ? 'pill-item-active' : ''}`}
            >
              Bills of materials (BOM)
            </button>
          </div>

          <button
            onClick={onNavigateToShopfloor}
            className="btn-secondary text-xs"
          >
            <span>Operator terminal</span>
          </button>

          <button
            onClick={() => setIsCreateWOOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule job</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="bg-surface-1 border border-hairline p-3.5 rounded-lg flex items-start justify-between text-xs text-ink">
          <div>
            <span className="font-medium text-ink">Issue blocked: </span>
            <span className="text-ink-muted">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-ink-subtle hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'workorders' ? (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by WO #, part or machinist..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Work order #</th>
                    <th className="px-4 py-3">Part description</th>
                    <th className="px-3 py-3">BOM rev</th>
                    <th className="px-3 py-3">Assigned worker</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-4 py-3 text-right">Output</th>
                    <th className="px-3 py-3 text-right">Scrap</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {filteredOrders.map((wo) => {
                    const progress = Math.round((wo.producedQuantity / wo.plannedQuantity) * 100);
                    return (
                      <tr key={wo.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-ink">
                          {wo.woNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{wo.productName}</div>
                          <div className="text-[10px] font-mono text-ink-subtle">{wo.productCode}</div>
                        </td>
                        <td className="px-3 py-3 font-mono text-ink-muted">
                          {wo.bomRevision}
                        </td>
                        <td className="px-3 py-3 text-ink-muted">
                          <div>{wo.assignedWorker}</div>
                          <div className="text-[10px] text-ink-subtle">{wo.assignedSupervisor}</div>
                        </td>
                        <td className="px-3 py-3 capitalize text-ink-muted">
                          {wo.priority}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono font-medium text-ink">
                            {wo.producedQuantity} / {wo.plannedQuantity}
                          </div>
                          <div className="text-[10px] text-ink-subtle">{progress}%</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-muted">
                          {wo.rejectedQuantity}
                        </td>
                        <td className="px-3 py-3 capitalize text-ink-muted">
                          {wo.status.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {wo.status === 'scheduled' && (
                            <button
                              onClick={() => handleStartJob(wo.id)}
                              className="px-2 py-1 bg-ink text-white text-[11px] font-medium rounded hover:bg-black transition-colors inline-flex items-center gap-1"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Issue materials & start</span>
                            </button>
                          )}
                          {wo.status === 'in_progress' && (
                            <button
                              onClick={onNavigateToShopfloor}
                              className="px-2 py-1 bg-surface-1 border border-hairline hover:border-ink text-ink text-[11px] font-medium rounded transition-colors"
                            >
                              Log output
                            </button>
                          )}
                          {wo.status === 'qc_pending' && (
                            <span className="text-[11px] text-ink-muted font-medium">
                              QC review
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
        /* Bills of Materials */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boms.map((bom) => (
            <div key={bom.id} className="bg-surface-1 rounded-lg border border-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                <div>
                  <span className="font-mono text-xs text-ink-muted">{bom.bomNumber}</span>
                  <h3 className="text-sm font-medium text-ink">{bom.productName}</h3>
                </div>
                <span className="font-mono text-xs text-ink-muted bg-canvas px-2 py-0.5 rounded border border-hairline">
                  {bom.revision}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="text-ink-muted font-medium">Components & routing:</div>
                <div className="divide-y divide-hairline-soft bg-canvas rounded p-2 border border-hairline">
                  {bom.items.map((bi) => (
                    <div key={bi.id} className="py-1.5 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-ink">{bi.itemName}</div>
                        <div className="text-[10px] text-ink-subtle">Station: {bi.operationStation}</div>
                      </div>
                      <div className="font-mono font-medium text-ink">
                        {bi.quantityRequired} {bi.uom}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-ink-subtle pt-1 flex justify-between">
                <span>Approved: {bom.approvedBy}</span>
                <span>{bom.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {isCreateWOOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Schedule production work order
              </h2>
              <button
                onClick={() => setIsCreateWOOpen(false)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Product & BOM revision</label>
                <select
                  required
                  value={selectedBOMId}
                  onChange={(e) => setSelectedBOMId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                >
                  <option value="">Select BOM...</option>
                  {boms.map(b => (
                    <option key={b.id} value={b.id}>{b.productName} ({b.revision})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Planned lot quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Target completion date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreateWOOpen(false)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Schedule job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
