import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShoppingCart, 
  CheckCircle, 
  ArrowRight, 
  Sparkles,
  Layers,
  Calendar,
  IndianRupee
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import confetti from 'canvas-confetti';

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
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      setGeneratedCount(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-fin-orangeLight text-fin-orange flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                Material Requirement Planning (MRP) Engine
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-surface-2 text-ink-muted">
                  Rule-Based Engine
                </span>
              </h2>
              <p className="text-xs text-ink-muted">
                Calculated from {openOrdersCount} Confirmed Sales Orders × Multi-level BOMs minus Free Stock & Active POs
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

        {/* Shortage Summary Cards */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-surface-1 p-3.5 rounded-xl border border-hairline shadow-card">
              <div className="text-[11px] font-medium text-ink-subtle">Shortage Items Count</div>
              <div className="text-xl font-bold text-ink mt-0.5 flex items-baseline gap-2">
                {shortages.length}
                <span className="text-xs font-normal text-fin-orange font-medium">Critical</span>
              </div>
            </div>
            <div className="bg-surface-1 p-3.5 rounded-xl border border-hairline shadow-card">
              <div className="text-[11px] font-medium text-ink-subtle">Exploded Orders</div>
              <div className="text-xl font-bold text-ink mt-0.5">
                {openOrdersCount} Sales Lots
              </div>
            </div>
            <div className="bg-surface-1 p-3.5 rounded-xl border border-hairline shadow-card">
              <div className="text-[11px] font-medium text-ink-subtle">Estimated Procurement Value</div>
              <div className="text-xl font-bold text-ink mt-0.5 flex items-center">
                ₹{totalEstimatedCost.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Shortage Table */}
          {shortages.length === 0 ? (
            <div className="bg-surface-1 p-8 rounded-xl border border-hairline text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-report-green mx-auto" />
              <div className="text-sm font-semibold text-ink">Zero Material Shortages Detected</div>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                Current inventory levels and pipeline purchase orders satisfy all active production orders.
              </p>
            </div>
          ) : (
            <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
              <div className="px-4 py-3 bg-surface-2/40 border-b border-hairline text-xs font-semibold text-ink flex items-center justify-between">
                <span>Required Raw Materials & Recommended Order Quantities</span>
                <span className="text-fin-orange font-normal text-[11px]">Directly ties to vendor catalogs</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-1 border-b border-hairline text-ink-subtle font-medium">
                    <tr>
                      <th className="px-4 py-2.5">Item & Code</th>
                      <th className="px-3 py-2.5 text-right">Gross Needed</th>
                      <th className="px-3 py-2.5 text-right">Free Stock</th>
                      <th className="px-3 py-2.5 text-right">Pipeline PO</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-fin-orange">Net Shortage</th>
                      <th className="px-3 py-2.5 text-right font-semibold">Recommended PO</th>
                      <th className="px-4 py-2.5">Suggested Supplier</th>
                      <th className="px-4 py-2.5 text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {shortages.map((s) => (
                      <tr key={s.itemId} className="hover:bg-canvas/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{s.itemName}</div>
                          <div className="text-[11px] text-ink-subtle font-mono">{s.itemCode}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink">
                          {s.grossRequired.toFixed(1)} {s.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-muted">
                          {s.currentStock} {s.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-subtle">
                          {s.pendingPOQuantity} {s.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-fin-orange">
                          {s.netShortage > 0 ? `${s.netShortage.toFixed(1)} ${s.uom}` : 'Reorder Pkg'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-semibold text-ink bg-surface-2/30">
                          {s.recommendedOrderQuantity} {s.uom}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {s.suggestedSupplierName || 'Primary Mill Vendor'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-ink">
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
        <div className="px-6 py-3.5 bg-surface-1 border-t border-hairline flex items-center justify-between">
          <div className="text-xs text-ink-subtle">
            Calculated instantly via deterministic MRP formula. No hidden delays.
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-ink hover:bg-surface-2 rounded-md transition-colors"
            >
              Close
            </button>
            {shortages.length > 0 && (
              <button
                onClick={handleGenerateOrders}
                disabled={generatedCount !== null}
                className="flex items-center space-x-1.5 px-4 py-2 bg-fin-orange hover:bg-fin-orangeHover text-white text-xs font-semibold rounded-md transition-all shadow-sm"
              >
                {generatedCount !== null ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Created {generatedCount} POs Successfully!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Generate Purchase Orders (1-Click)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
