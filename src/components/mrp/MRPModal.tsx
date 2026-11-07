import React, { useState } from 'react';
import { 
  X, 
  CheckCircle, 
  Layers
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface MRPModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MRPModal: React.FC<MRPModalProps> = ({ isOpen, onClose }) => {
  const { calculateMRP, generatePOsFromMRP, salesOrders } = useERP();
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const shortages = calculateMRP();
  const openOrdersCount = salesOrders.filter(so => ['confirmed', 'in_production'].includes(so.status)).length;
  const totalEstimatedCost = shortages.reduce((acc, s) => acc + s.estimatedCost, 0);

  const handleGenerateOrders = () => {
    const count = generatePOsFromMRP(shortages);
    setGeneratedCount(count);
    setTimeout(() => {
      setGeneratedCount(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-ink flex items-center gap-2">
              Material Requirement Planning (MRP)
            </h2>
            <p className="text-xs text-ink-muted">
              Calculated across {openOrdersCount} active customer orders minus available stock and pending purchase orders
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-ink-subtle hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortage Summary Cards */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-canvas p-3 rounded border border-hairline">
              <div className="text-xs text-ink-muted">Shortage items</div>
              <div className="text-xl font-medium text-ink mt-0.5">
                {shortages.length}
              </div>
            </div>
            <div className="bg-canvas p-3 rounded border border-hairline">
              <div className="text-xs text-ink-muted">Active order lots</div>
              <div className="text-xl font-medium text-ink mt-0.5">
                {openOrdersCount}
              </div>
            </div>
            <div className="bg-canvas p-3 rounded border border-hairline">
              <div className="text-xs text-ink-muted">Estimated purchase value</div>
              <div className="text-xl font-medium text-ink mt-0.5 font-mono">
                ₹{totalEstimatedCost.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Shortage Table */}
          {shortages.length === 0 ? (
            <div className="bg-canvas p-8 rounded border border-hairline text-center space-y-1.5">
              <div className="text-xs font-medium text-ink">Zero material shortages detected</div>
              <p className="text-xs text-ink-muted max-w-sm mx-auto">
                Current stores inventory and pipeline purchase orders satisfy all active shop-floor lots.
              </p>
            </div>
          ) : (
            <div className="rounded border border-hairline overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                    <tr>
                      <th className="px-3 py-2.5">Item & code</th>
                      <th className="px-3 py-2.5 text-right">Gross needed</th>
                      <th className="px-3 py-2.5 text-right">Free stock</th>
                      <th className="px-3 py-2.5 text-right">Net shortage</th>
                      <th className="px-3 py-2.5 text-right font-medium text-ink">Recommended PO</th>
                      <th className="px-3 py-2.5 text-right">Est. cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft font-normal">
                    {shortages.map((s) => (
                      <tr key={s.itemId} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-ink">{s.itemName}</div>
                          <div className="text-[10px] text-ink-subtle font-mono">{s.itemCode}</div>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink-muted">
                          {s.grossRequired.toFixed(1)} {s.uom}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink-muted">
                          {s.currentStock} {s.uom}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-fin-orange font-medium">
                          {s.netShortage > 0 ? `${s.netShortage.toFixed(1)} ${s.uom}` : 'Reorder level'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-medium text-ink">
                          {s.recommendedOrderQuantity} {s.uom}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-ink-muted">
                          ₹{s.estimatedCost.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-hairline flex items-center justify-between">
          <div className="text-xs text-ink-subtle">
            Calculated via deterministic MRP logic.
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="btn-tertiary text-xs"
            >
              Close
            </button>
            {shortages.length > 0 && (
              <button
                onClick={handleGenerateOrders}
                disabled={generatedCount !== null}
                className="btn-fin text-xs"
              >
                {generatedCount !== null ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Created {generatedCount} purchase orders</span>
                  </>
                ) : (
                  <span>Auto-generate purchase orders</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
