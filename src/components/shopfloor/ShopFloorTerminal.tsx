import React, { useState } from 'react';
import { 
  HardHat, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertOctagon, 
  RefreshCw, 
  Clock, 
  User, 
  Layers, 
  ShieldAlert,
  ThumbsUp,
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import confetti from 'canvas-confetti';

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

  // Touch counter state
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

    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 }
    });

    setSuccessToast(`Recorded ${goodQty} Good parts & ${rejectedQty} Rejects for ${activeWO.woNumber}`);
    setGoodQty(25);
    setRejectedQty(0);
    setReworkQty(0);

    setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
  };

  const handleStartActiveJob = () => {
    if (!activeWO) return;
    const res = startWorkOrder(activeWO.id);
    if (res.success) {
      setSuccessToast(`Job Started: ${activeWO.woNumber}`);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Worker Banner / Shop Floor Header */}
      <div className="bg-ink text-white p-5 rounded-2xl shadow-lift flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-fin-orange text-white flex items-center justify-center font-bold shadow-sm">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider text-fin-orange font-bold">Shop Floor Operator Mode</span>
              <span className="w-2 h-2 rounded-full bg-report-green animate-pulse" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">CNC Machining Cell 01 - Touch Terminal</h1>
            <p className="text-xs text-white/60">No financial data visible · High-contrast physical entry</p>
          </div>
        </div>

        {/* Worker Selector */}
        <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
          <User className="w-4 h-4 text-white/80" />
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="Vikram Jadhav" className="text-ink">Vikram Jadhav (Operator)</option>
            <option value="Suresh More" className="text-ink">Suresh More (Operator)</option>
            <option value="Dnyaneshwar Shinde" className="text-ink">Dnyaneshwar Shinde (Machinist)</option>
          </select>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-green-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center space-x-2">
            <ThumbsUp className="w-5 h-5" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Work Order Selector Pills */}
      <div className="bg-surface-1 p-3.5 rounded-xl border border-hairline shadow-card space-y-2">
        <div className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
          Active Production Jobs On Floor
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {workOrders.map((wo) => {
            const isSelected = wo.id === selectedWOId;
            return (
              <button
                key={wo.id}
                onClick={() => setSelectedWOId(wo.id)}
                className={`px-3.5 py-2.5 rounded-lg text-left text-xs shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-ink text-white border-ink shadow-sm'
                    : 'bg-canvas text-ink border-hairline hover:border-ink'
                }`}
              >
                <div className="font-mono font-bold">{wo.woNumber}</div>
                <div className="text-[11px] truncate max-w-[180px] opacity-90">{wo.productName}</div>
                <div className="text-[10px] mt-1 opacity-70 flex items-center justify-between">
                  <span>{wo.producedQuantity}/{wo.plannedQuantity} pcs</span>
                  <span className="uppercase font-semibold">{wo.status.replace('_', ' ')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Touch Interaction Card */}
      {activeWO ? (
        <div className="bg-surface-1 rounded-2xl border border-hairline shadow-card overflow-hidden">
          {/* Top Info Strip */}
          <div className="p-5 border-b border-hairline bg-surface-2/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-fin-orange">{activeWO.woNumber}</span>
              <h2 className="text-base font-bold text-ink">{activeWO.productName}</h2>
              <div className="text-xs text-ink-muted">
                Drawing Part Code: <span className="font-mono font-semibold text-ink">{activeWO.productCode}</span> · BOM {activeWO.bomRevision}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {activeWO.status === 'scheduled' ? (
                <button
                  onClick={handleStartActiveJob}
                  className="px-5 py-3 bg-report-green hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START OPERATION
                </button>
              ) : (
                <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-report-blue border border-blue-200">
                  <Clock className="w-4 h-4" />
                  <span>RUNNING IN CELL</span>
                </div>
              )}
            </div>
          </div>

          {/* Form with Large Tactile Keypad */}
          <form onSubmit={handleSaveOutput} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* GOOD QUANTITY TOUCH COUNTER */}
              <div className="bg-canvas p-4 rounded-xl border border-hairline flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-report-green" /> Good Quantity
                  </span>
                  <span className="text-[10px] text-ink-subtle">Passes visual check</span>
                </div>

                <div className="text-center py-2">
                  <span className="text-4xl font-black font-mono text-ink">{goodQty}</span>
                  <span className="text-xs text-ink-subtle ml-1 font-semibold">pcs</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 5, 10, 25].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleIncrement('good', amt)}
                      className="py-2.5 bg-surface-1 hover:bg-white text-ink font-bold text-xs rounded-lg border border-hairline shadow-sm active:bg-ink active:text-white transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleIncrement('good', -5)}
                    className="py-1.5 bg-surface-1 text-ink text-xs font-semibold rounded-lg border border-hairline"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoodQty(0)}
                    className="py-1.5 bg-surface-1 text-ink-subtle text-xs rounded-lg border border-hairline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* REJECT QUANTITY TOUCH COUNTER */}
              <div className="bg-canvas p-4 rounded-xl border border-hairline flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-semantic-error uppercase tracking-wider flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-semantic-error" /> Rejections (Scrap)
                  </span>
                </div>

                <div className="text-center py-2">
                  <span className="text-4xl font-black font-mono text-semantic-error">{rejectedQty}</span>
                  <span className="text-xs text-ink-subtle ml-1 font-semibold">pcs</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 5, 10].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleIncrement('rej', amt)}
                      className="py-2.5 bg-surface-1 hover:bg-white text-semantic-error font-bold text-xs rounded-lg border border-hairline shadow-sm active:bg-semantic-error active:text-white transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleIncrement('rej', -1)}
                    className="py-1.5 bg-surface-1 text-ink text-xs font-semibold rounded-lg border border-hairline"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectedQty(0)}
                    className="py-1.5 bg-surface-1 text-ink-subtle text-xs rounded-lg border border-hairline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* REWORK QUANTITY TOUCH COUNTER */}
              <div className="bg-canvas p-4 rounded-xl border border-hairline flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-600" /> Rework
                  </span>
                  <span className="text-[10px] text-ink-subtle">Salvageable</span>
                </div>

                <div className="text-center py-2">
                  <span className="text-4xl font-black font-mono text-amber-700">{reworkQty}</span>
                  <span className="text-xs text-ink-subtle ml-1 font-semibold">pcs</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 5, 10].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleIncrement('rework', amt)}
                      className="py-2.5 bg-surface-1 hover:bg-white text-amber-700 font-bold text-xs rounded-lg border border-hairline shadow-sm active:bg-amber-600 active:text-white transition-colors"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleIncrement('rework', -1)}
                    className="py-1.5 bg-surface-1 text-ink text-xs font-semibold rounded-lg border border-hairline"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setReworkQty(0)}
                    className="py-1.5 bg-surface-1 text-ink-subtle text-xs rounded-lg border border-hairline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Rejection Reason selector if rejected > 0 */}
            {rejectedQty > 0 && (
              <div className="p-4 bg-red-50/60 rounded-xl border border-red-200 space-y-2">
                <label className="block text-xs font-bold text-semantic-error">
                  Select Defect / Rejection Reason (Mandatory for Root Cause):
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg bg-surface-1 border border-hairline text-ink font-medium"
                >
                  <option value="Tool insert wear - diameter oversize">Tool insert wear - outer diameter oversize</option>
                  <option value="Severe chatter vibration marks on finish">Severe chatter vibration marks on finish</option>
                  <option value="Burr on lead chamfer requiring deburring">Burr on lead chamfer requiring deburring</option>
                  <option value="Raw material internal porosity / blowhole">Raw material internal porosity / blowhole</option>
                  <option value="Spline pitch angle mismatch on gear hobber">Spline pitch angle mismatch on gear hobber</option>
                </select>
              </div>
            )}

            {/* Station and Big Submit Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-hairline">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-ink">Machine Station:</span>
                <select
                  value={currentStation}
                  onChange={(e) => setCurrentStation(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-medium"
                >
                  <option value="CNC Turning Lathe 01">CNC Turning Lathe 01</option>
                  <option value="CNC Spline Milling Station 02">CNC Spline Milling Station 02</option>
                  <option value="Induction Hardening Furnace">Induction Hardening Furnace</option>
                  <option value="Final Deburring & Washing Bench">Final Deburring & Washing Bench</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-ink hover:bg-black text-white font-bold text-sm rounded-xl shadow-lift transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-report-green" />
                <span>CONFIRM & RECORD BATCH OUTPUT</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-surface-1 p-8 rounded-xl border border-hairline text-center">
          <p className="text-xs text-ink-muted">No active work orders found.</p>
        </div>
      )}

      {/* Recent Production Entries Log for this Cell */}
      <div className="bg-surface-1 rounded-xl border border-hairline p-5 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
            Today's Logged Shifts at this Cell
          </h3>
          <span className="text-[11px] font-mono text-ink-subtle">{productionEntries.length} Records</span>
        </div>

        <div className="divide-y divide-hairline-soft">
          {productionEntries.slice(0, 3).map((pe) => (
            <div key={pe.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-semibold text-ink">{pe.woNumber}</span>
                <span className="text-ink-subtle ml-2">by {pe.operatorName} ({pe.operationStation})</span>
              </div>
              <div className="font-mono space-x-3">
                <span className="text-report-green font-bold">+{pe.goodQuantity} Good</span>
                {pe.rejectedQuantity > 0 && (
                  <span className="text-semantic-error font-bold">-{pe.rejectedQuantity} Rej</span>
                )}
                <span className="text-[10px] text-ink-muted">{pe.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
