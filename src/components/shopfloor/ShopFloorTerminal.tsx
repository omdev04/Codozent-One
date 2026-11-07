import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  User, 
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const ShopFloorTerminal: React.FC = () => {
  const { 
    workOrders, 
    recordProductionOutput, 
    startWorkOrder,
    productionEntries 
  } = useERP();

  const [selectedWorker, setSelectedWorker] = useState('Vikram Jadhav');
  const [selectedWOId, setSelectedWOId] = useState<string>(() => {
    const firstActive = workOrders.find(w => ['in_progress', 'scheduled'].includes(w.status));
    return firstActive?.id || workOrders[0]?.id || '';
  });

  const [goodQty, setGoodQty] = useState(25);
  const [rejectedQty, setRejectedQty] = useState(0);
  const [reworkQty, setReworkQty] = useState(0);
  const [rejectionReason, setRejectionReason] = useState('Tool insert wear - diameter oversize');
  const [currentStation, setCurrentStation] = useState('CNC Turning Lathe 01');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const activeWO = workOrders.find(w => w.id === selectedWOId);

  const handleIncrement = (type: 'good' | 'rej' | 'rework', amount: number) => {
    if (type === 'good') setGoodQty(prev => Math.max(0, prev + amount));
    if (type === 'rej') setRejectedQty(prev => Math.max(0, prev + amount));
    if (type === 'rework') setReworkQty(prev => Math.max(0, prev + amount));
  };

  const handleSaveOutput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWO) return;

    recordProductionOutput(
      activeWO.id, 
      currentStation, 
      goodQty, 
      rejectedQty, 
      reworkQty, 
      rejectedQty > 0 ? rejectionReason : undefined
    );

    setSuccessToast(`Logged ${goodQty} units output for ${activeWO.woNumber}`);
    setGoodQty(25);
    setRejectedQty(0);
    setReworkQty(0);

    setTimeout(() => {
      setSuccessToast(null);
    }, 2500);
  };

  const handleStartActiveJob = () => {
    if (!activeWO) return;
    const res = startWorkOrder(activeWO.id);
    if (res.success) {
      setSuccessToast(`Job started: ${activeWO.woNumber}`);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <div className="text-sm font-medium text-ink-muted">Shop-floor station mode</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Operator touch terminal
          </h1>
        </div>

        {/* Worker Selector */}
        <div className="flex items-center space-x-2 bg-surface-1 px-3 py-1.5 rounded-md border border-hairline text-xs">
          <User className="w-3.5 h-3.5 text-ink-muted" />
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="bg-transparent text-ink text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="Vikram Jadhav">Vikram Jadhav (CNC Operator)</option>
            <option value="Suresh More">Suresh More (Operator)</option>
            <option value="Dnyaneshwar Shinde">Dnyaneshwar Shinde (Machinist)</option>
          </select>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-surface-1 border border-hairline rounded-lg text-xs font-medium flex items-center justify-between text-ink shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-report-green" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-ink-subtle hover:text-ink">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Work Order Selector Tabs */}
      <div className="space-y-1.5">
        <div className="text-xs font-medium text-ink-muted">Active shop-floor jobs</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {workOrders.map((wo) => {
            const isSelected = wo.id === selectedWOId;
            return (
              <button
                key={wo.id}
                onClick={() => setSelectedWOId(wo.id)}
                className={`px-3.5 py-2 rounded-lg text-left text-xs shrink-0 transition-colors border ${
                  isSelected
                    ? 'bg-surface-1 text-ink border-ink font-medium shadow-sm'
                    : 'bg-canvas text-ink-muted border-hairline hover:border-ink/50'
                }`}
              >
                <div className="font-mono text-ink">{wo.woNumber}</div>
                <div className="text-[11px] truncate max-w-[160px]">{wo.productName}</div>
                <div className="text-[10px] text-ink-subtle mt-0.5">
                  {wo.producedQuantity}/{wo.plannedQuantity} pcs
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Touch Interaction Card */}
      {activeWO && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-sm">
          {/* Top Info */}
          <div className="p-5 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-xs text-ink-muted">{activeWO.woNumber}</span>
              <h2 className="text-base font-medium text-ink">{activeWO.productName}</h2>
              <div className="text-xs text-ink-muted">
                Part code: {activeWO.productCode} · Rev {activeWO.bomRevision}
              </div>
            </div>

            <div>
              {activeWO.status === 'scheduled' ? (
                <button
                  onClick={handleStartActiveJob}
                  className="btn-primary text-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start operation</span>
                </button>
              ) : (
                <div className="text-xs font-medium text-ink-muted bg-canvas px-3 py-1.5 rounded border border-hairline">
                  Operation in progress
                </div>
              )}
            </div>
          </div>

          {/* Large Tactile Counters */}
          <form onSubmit={handleSaveOutput} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* GOOD QUANTITY */}
              <div className="bg-canvas p-4 rounded-lg border border-hairline flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-ink">
                  <span>Good parts</span>
                  <span className="text-[10px] text-ink-subtle">Passes checks</span>
                </div>

                <div className="text-center py-2">
                  <span className="text-3xl font-mono font-medium text-ink">{goodQty}</span>
                  <span className="text-xs text-ink-muted ml-1">pcs</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 5, 10, 25].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleIncrement('good', amt)}
                      className="py-2 bg-surface-1 text-ink text-xs font-medium rounded border border-hairline hover:border-ink transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleIncrement('good', -5)}
                    className="py-1 bg-surface-1 text-ink-muted text-xs rounded border border-hairline"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoodQty(0)}
                    className="py-1 bg-surface-1 text-ink-subtle text-xs rounded border border-hairline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* REJECTIONS */}
              <div className="bg-canvas p-4 rounded-lg border border-hairline flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-ink">
                  <span>Rejections</span>
                  <span className="text-[10px] text-ink-subtle">Scrap</span>
                </div>

                <div className="text-center py-2">
                  <span className="text-3xl font-mono font-medium text-ink">{rejectedQty}</span>
                  <span className="text-xs text-ink-muted ml-1">pcs</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 5, 10].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleIncrement('rej', amt)}
                      className="py-2 bg-surface-1 text-ink text-xs font-medium rounded border border-hairline hover:border-ink transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleIncrement('rej', -1)}
                    className="py-1 bg-surface-1 text-ink-muted text-xs rounded border border-hairline"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectedQty(0)}
                    className="py-1 bg-surface-1 text-ink-subtle text-xs rounded border border-hairline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* REWORK */}
              <div className="bg-canvas p-4 rounded-lg border border-hairline flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-ink">
                  <span>Rework</span>
                  <span className="text-[10px] text-ink-subtle">Salvageable</span>
                </div>

                <div className="text-center py-2">
                  <span className="text-3xl font-mono font-medium text-ink">{reworkQty}</span>
                  <span className="text-xs text-ink-muted ml-1">pcs</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 5, 10].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleIncrement('rework', amt)}
                      className="py-2 bg-surface-1 text-ink text-xs font-medium rounded border border-hairline hover:border-ink transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleIncrement('rework', -1)}
                    className="py-1 bg-surface-1 text-ink-muted text-xs rounded border border-hairline"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setReworkQty(0)}
                    className="py-1 bg-surface-1 text-ink-subtle text-xs rounded border border-hairline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Defect Reason if rejected > 0 */}
            {rejectedQty > 0 && (
              <div className="p-3 bg-canvas rounded border border-hairline space-y-1">
                <label className="block text-xs font-medium text-ink">
                  Defect cause:
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2 text-xs rounded bg-surface-1 border border-hairline text-ink"
                >
                  <option value="Tool insert wear - diameter oversize">Tool insert wear - diameter oversize</option>
                  <option value="Severe chatter vibration marks on finish">Severe chatter vibration marks on finish</option>
                  <option value="Burr on lead chamfer requiring deburring">Burr on lead chamfer requiring deburring</option>
                  <option value="Raw material internal blowhole">Raw material internal blowhole</option>
                </select>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-hairline">
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-ink-muted">Station:</span>
                <select
                  value={currentStation}
                  onChange={(e) => setCurrentStation(e.target.value)}
                  className="px-2 py-1 rounded bg-surface-1 border border-hairline text-ink"
                >
                  <option value="CNC Turning Lathe 01">CNC Turning Lathe 01</option>
                  <option value="CNC Spline Milling Station 02">CNC Spline Milling Station 02</option>
                  <option value="Final Deburring & Washing Bench">Final Deburring Bench</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-primary text-xs"
              >
                Confirm & save batch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent shift logs */}
      <div className="bg-surface-1 rounded-lg border border-hairline p-4 space-y-2">
        <div className="text-xs font-medium text-ink">Recent production logs</div>
        <div className="divide-y divide-hairline-soft">
          {productionEntries.slice(0, 3).map((pe) => (
            <div key={pe.id} className="py-2 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono text-ink">{pe.woNumber}</span>
                <span className="text-ink-muted ml-2">{pe.operatorName} · {pe.operationStation}</span>
              </div>
              <div className="font-mono text-ink">
                +{pe.goodQuantity} good {pe.rejectedQuantity > 0 && <span className="text-ink-muted">(-{pe.rejectedQuantity} rej)</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
