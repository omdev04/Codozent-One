import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Play, 
  X, 
  ArrowRight,
  Printer,
  QrCode,
  Wrench,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Edit2,
  RefreshCw,
  Layers,
  Eye,
  Check,
  ShoppingCart
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { WorkCenter, BillOfMaterials, WorkOrder, RoutingStage } from '../../types/erp';

interface ManufacturingModuleProps {
  onNavigateToShopfloor: () => void;
  onNavigateToPurchase?: () => void;
}

export const ManufacturingModule: React.FC<ManufacturingModuleProps> = ({ 
  onNavigateToShopfloor, 
  onNavigateToPurchase 
}) => {
  const { 
    workOrders, 
    boms, 
    items,
    workCenters,
    createWorkCenter,
    updateWorkCenter,
    deleteWorkCenter,
    createBOM,
    createWorkOrder, 
    startWorkOrder,
    getWhatToBuy,
    createRFQ
  } = useERP();

  const [activeTab, setActiveTab] = useState<'workorders' | 'boms' | 'workcenters' | 'whattobuy'>('workorders');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isCreateWOOpen, setIsCreateWOOpen] = useState(false);
  const [isCreateBOMOpen, setIsCreateBOMOpen] = useState(false);
  const [isCreateWCOpen, setIsCreateWCOpen] = useState(false);
  const [editingWC, setEditingWC] = useState<WorkCenter | null>(null);
  const [selectedTravelerWO, setSelectedTravelerWO] = useState<WorkOrder | null>(null);
  const [isPrintMachineQRsOpen, setIsPrintMachineQRsOpen] = useState(false);
  const [selectedDrawingBOM, setSelectedDrawingBOM] = useState<BillOfMaterials | null>(null);

  // MRP Shortage Data
  const [mrpShortages, setMrpShortages] = useState<any[]>([]);
  const [isLoadingMRP, setIsLoadingMRP] = useState(false);

  // New Work Order Form State
  const [selectedBOMId, setSelectedBOMId] = useState('');
  const [woQuantity, setWoQuantity] = useState(200);
  const [priority, setPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  const [dueDate, setDueDate] = useState('');

  // New Work Centre Form State
  const [wcCode, setWcCode] = useState('');
  const [wcName, setWcName] = useState('');
  const [wcHourlyRate, setWcHourlyRate] = useState<number>(800);
  const [wcCapacityHours, setWcCapacityHours] = useState<number>(16);
  const [wcLocation, setWcLocation] = useState('Bay A - Production Floor');

  // New BOM Form State
  const [bomProductId, setBomProductId] = useState('');
  const [bomDirectLabour, setBomDirectLabour] = useState<number>(450);
  const [bomDirectOverhead, setBomDirectOverhead] = useState<number>(250);
  const [bomDrawingName, setBomDrawingName] = useState('APEX-DWG-ENG-001.pdf');
  const [bomRows, setBomRows] = useState<Array<{ itemId: string; quantity: number; scrapPercentage: number; station: string }>>([
    { itemId: '', quantity: 1, scrapPercentage: 2, station: 'Laser Cutting' }
  ]);

  // Load What To Buy shortages when tab is opened
  useEffect(() => {
    if (activeTab === 'whattobuy') {
      loadMRPShortages();
    }
  }, [activeTab]);

  const loadMRPShortages = async () => {
    setIsLoadingMRP(true);
    try {
      const shortages = await getWhatToBuy();
      setMrpShortages(shortages);
    } catch (err) {
      console.error('Failed to load shortages', err);
    } finally {
      setIsLoadingMRP(false);
    }
  };

  const handleStartJob = (woId: string) => {
    setErrorMessage(null);
    const result = startWorkOrder(woId);
    if (!result.success) {
      setErrorMessage(result.message);
    } else {
      setSuccessMessage('Materials issued and Job Card released to shopfloor!');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handleCreateWO = (e: React.FormEvent) => {
    e.preventDefault();
    const bom = boms.find(b => b.id === selectedBOMId);
    if (!bom) return;

    createWorkOrder(
      bom.productId, 
      bom.id, 
      woQuantity, 
      priority, 
      dueDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
    );

    setIsCreateWOOpen(false);
    setSelectedBOMId('');
    setWoQuantity(200);
    setSuccessMessage('Production Work Order scheduled with Job Card Routing Stages.');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleSaveWorkCenter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWC) {
        await updateWorkCenter(editingWC.id, {
          code: wcCode,
          name: wcName,
          hourlyRate: Number(wcHourlyRate),
          capacityHoursPerDay: Number(wcCapacityHours),
          location: wcLocation
        });
        setSuccessMessage(`Updated Work Centre ${wcName}`);
      } else {
        await createWorkCenter({
          code: wcCode || `WC-${Date.now().toString().slice(-4)}`,
          name: wcName,
          hourlyRate: Number(wcHourlyRate),
          capacityHoursPerDay: Number(wcCapacityHours),
          location: wcLocation,
          status: 'active',
          qrCode: `QR-WC-${wcCode || Date.now()}`
        });
        setSuccessMessage(`Created Work Centre ${wcName} with machine QR label`);
      }
      setIsCreateWCOpen(false);
      setEditingWC(null);
      setWcCode('');
      setWcName('');
      setWcHourlyRate(800);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save Work Centre');
    }
  };

  const handleOpenEditWC = (wc: WorkCenter) => {
    setEditingWC(wc);
    setWcCode(wc.code);
    setWcName(wc.name);
    setWcHourlyRate(wc.hourlyRate);
    setWcCapacityHours(wc.capacityHoursPerDay);
    setWcLocation(wc.location || '');
    setIsCreateWCOpen(true);
  };

  const handleDeleteWC = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete Work Centre "${name}"?`)) {
      await deleteWorkCenter(id);
      setSuccessMessage(`Deleted Work Centre ${name}`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const handleCreateOrderBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = items.find(i => i.id === bomProductId);
    if (!targetProduct) {
      setErrorMessage('Please select a finished goods product.');
      return;
    }

    const bomItems = bomRows.map(row => {
      const itm = items.find(i => i.id === row.itemId);
      const unitCost = itm?.standardCost || 0;
      return {
        id: `bom-item-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        bomId: `bom-${Date.now()}`,
        itemId: row.itemId,
        itemCode: itm?.itemCode || 'RAW-001',
        itemName: itm?.name || 'Raw Material',
        quantityRequired: Number(row.quantity),
        scrapPercentage: Number(row.scrapPercentage || 0),
        uom: (itm?.uom || 'Nos') as any,
        operationStation: row.station,
        unitCost: unitCost,
        totalCost: Number(row.quantity) * unitCost * (1 + (Number(row.scrapPercentage || 0) / 100))
      };
    });

    const materialCost = bomItems.reduce((sum, item) => sum + item.totalCost, 0);
    const totalPlannedUnitCost = materialCost + Number(bomDirectLabour) + Number(bomDirectOverhead);

    await createBOM({
      productId: targetProduct.id,
      productCode: targetProduct.itemCode,
      productName: targetProduct.name,
      revision: `Rev-${Date.now().toString().slice(-4)}`,
      description: `Production BOM for ${targetProduct.name} with direct floor costs`,
      outputQuantity: 1,
      isActive: true,
      items: bomItems,
      directLabourCost: Number(bomDirectLabour),
      overheadCost: Number(bomDirectOverhead),
      totalPlannedUnitCost: totalPlannedUnitCost,
      drawingUrl: `/drawings/${bomDrawingName}`,
      drawingName: bomDrawingName,
      approvedBy: 'Production Head & Lead Engineer'
    });

    setIsCreateBOMOpen(false);
    setSuccessMessage(`Order BOM created with floor labor and overhead breakdown.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCreateRFQFromShortage = async (shortage: any) => {
    try {
      const created = await createRFQ({
        items: [{
          itemId: shortage.itemId,
          itemCode: shortage.itemCode,
          itemName: shortage.itemName,
          quantity: shortage.suggestedOrderQty,
          uom: shortage.uom,
          targetRate: shortage.standardCost || 500
        }],
        targetDeliveryDate: shortage.targetBuyByDate,
        notes: `Auto-generated from Material Shortage Analysis (Gross Demand: ${shortage.grossDemand} ${shortage.uom})`
      });
      setSuccessMessage(`RFQ ${created.rfqNumber} generated for ${shortage.itemName}!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      if (onNavigateToPurchase) {
        onNavigateToPurchase();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate RFQ');
    }
  };

  const filteredOrders = workOrders.filter(w => 
    w.woNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.assignedWorker && w.assignedWorker.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">Manufacturing & Shop Floor Execution</div>
          <h1 className="text-2xl font-bold text-ink tracking-tight mt-0.5">
            Production, Work Centres & MRP Shortage
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="pill-container bg-surface-2 p-1 rounded-lg border border-hairline inline-flex items-center gap-1">
            <button
              onClick={() => setActiveTab('workorders')}
              className={`pill-item px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'workorders' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              Work orders
            </button>
            <button
              onClick={() => setActiveTab('boms')}
              className={`pill-item px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'boms' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              Bills of materials (BOM)
            </button>
            <button
              onClick={() => setActiveTab('workcenters')}
              className={`pill-item px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'workcenters' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              Work centres & machines
            </button>
            <button
              onClick={() => setActiveTab('whattobuy')}
              className={`pill-item px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'whattobuy' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              What to buy (MRP Shortage)
            </button>
          </div>

          <button
            onClick={onNavigateToShopfloor}
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 border border-hairline rounded-md hover:bg-canvas"
          >
            <Wrench className="w-3.5 h-3.5 text-primary" />
            <span>Operator terminal</span>
          </button>

          {activeTab === 'workorders' && (
            <button
              onClick={() => setIsCreateWOOpen(true)}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule job</span>
            </button>
          )}

          {activeTab === 'boms' && (
            <button
              onClick={() => setIsCreateBOMOpen(true)}
              className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Order BOM</span>
            </button>
          )}

          {activeTab === 'workcenters' && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsPrintMachineQRsOpen(true)}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 border border-hairline rounded-md hover:bg-canvas"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print machine QRs</span>
              </button>
              <button
                onClick={() => {
                  setEditingWC(null);
                  setWcCode(`WC-MACH-${String(workCenters.length + 1).padStart(2, '0')}`);
                  setWcName('');
                  setWcHourlyRate(800);
                  setIsCreateWCOpen(true);
                }}
                className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add work centre</span>
              </button>
            </div>
          )}

          {activeTab === 'whattobuy' && (
            <button
              onClick={loadMRPShortages}
              disabled={isLoadingMRP}
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 border border-hairline rounded-md hover:bg-canvas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMRP ? 'animate-spin' : ''}`} />
              <span>Re-run Shortage Engine</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 p-3.5 rounded-lg flex items-start justify-between text-xs text-red-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <span className="font-semibold">Action blocked: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 p-3.5 rounded-lg flex items-start justify-between text-xs text-green-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: WORK ORDERS & ROUTING STAGES */}
      {activeTab === 'workorders' && (
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

          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Work order #</th>
                    <th className="px-4 py-3">Part description</th>
                    <th className="px-3 py-3">Routing stages & QC</th>
                    <th className="px-3 py-3">Assigned worker</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-4 py-3 text-right">Output</th>
                    <th className="px-3 py-3 text-right">Scrap</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action / Job traveler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-ink-muted">
                        No production work orders found. Click "+ Schedule job" above to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((wo) => {
                      const progress = Math.round((wo.producedQuantity / wo.plannedQuantity) * 100);
                      const stages = wo.routingStages || [
                        { stageNumber: 1, stageName: 'Laser Cutting', isQcCompulsory: true, qcPassed: true, status: 'completed' },
                        { stageNumber: 2, stageName: 'MIG Welding', isQcCompulsory: true, qcPassed: false, status: 'in_progress' },
                        { stageNumber: 3, stageName: 'Powder Painting', isQcCompulsory: true, qcPassed: false, status: 'pending' }
                      ];

                      return (
                        <tr key={wo.id} className="hover:bg-canvas/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-medium text-ink">
                            <div className="flex items-center gap-1.5">
                              <QrCode className="w-3.5 h-3.5 text-ink-subtle" />
                              <span>{wo.woNumber}</span>
                            </div>
                            {wo.salesOrderId && (
                              <span className="text-[10px] text-primary font-sans font-medium">Linked to Sales Order</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-ink">{wo.productName}</div>
                            <div className="text-[10px] font-mono text-ink-subtle">{wo.productCode}</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 flex-wrap max-w-xs">
                              {stages.map((stg, idx) => (
                                <span 
                                  key={idx} 
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                    stg.status === 'completed'
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : stg.status === 'in_progress'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-canvas text-ink-muted border-hairline'
                                  }`}
                                >
                                  {stg.stageName}
                                  {stg.isQcCompulsory && (
                                    <ShieldCheck className={`w-2.5 h-2.5 ${stg.qcPassed ? 'text-green-600' : 'text-amber-500'}`} />
                                  )}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-ink-muted">
                            <div>{wo.assignedWorker || 'Operator Ganesh'}</div>
                            <div className="text-[10px] text-ink-subtle">{wo.assignedSupervisor || 'Sup. Anand'}</div>
                          </td>
                          <td className="px-3 py-3 capitalize text-ink-muted">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              wo.priority === 'urgent' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-canvas text-ink-muted'
                            }`}>
                              {wo.priority}
                            </span>
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
                            <span className="capitalize">{wo.status.replace('_', ' ')}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {wo.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStartJob(wo.id)}
                                  className="px-2 py-1 bg-ink text-white text-[11px] font-medium rounded hover:bg-black transition-colors inline-flex items-center gap-1 shadow-xs"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  <span>Issue & Start</span>
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
                              <button
                                onClick={() => setSelectedTravelerWO(wo)}
                                title="Print Job Card Route Traveler (E-017)"
                                className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-canvas border border-transparent hover:border-hairline"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BILLS OF MATERIALS (BOM) */}
      {activeTab === 'boms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boms.map((bom) => {
              const materialCost = bom.items.reduce((acc, itm) => acc + (itm.totalCost || (itm.quantityRequired * (itm.unitCost || 0))), 0);
              const labour = bom.directLabourCost || 450;
              const overhead = bom.overheadCost || 250;
              const totalPlannedCost = bom.totalPlannedUnitCost || (materialCost + labour + overhead);

              return (
                <div key={bom.id} className="bg-surface-1 rounded-lg border border-hairline p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-hairline pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">{bom.bomNumber}</span>
                        <span className="font-mono text-[10px] text-ink-muted bg-canvas px-1.5 py-0.5 rounded border border-hairline">
                          {bom.revision}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-ink mt-0.5">{bom.productName}</h3>
                    </div>

                    {bom.drawingName && (
                      <button
                        onClick={() => setSelectedDrawingBOM(bom)}
                        className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded border border-primary/20 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>CAD Drawing</span>
                      </button>
                    )}
                  </div>

                  {/* Components Table */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-ink-muted font-medium flex justify-between">
                      <span>BOM Components & Scrap Allowance:</span>
                      <span className="font-mono text-ink">Material: ₹{materialCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="divide-y divide-hairline-soft bg-canvas rounded p-2 border border-hairline max-h-40 overflow-y-auto">
                      {bom.items.map((bi) => (
                        <div key={bi.id} className="py-1.5 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-ink">{bi.itemName}</div>
                            <div className="text-[10px] text-ink-subtle">
                              Station: {bi.operationStation} | Scrap: {bi.scrapPercentage || 2}%
                            </div>
                          </div>
                          <div className="font-mono text-right">
                            <div className="font-medium text-ink">{bi.quantityRequired} {bi.uom}</div>
                            <div className="text-[10px] text-ink-muted">₹{(bi.totalCost || 0).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Cost Breakdown (E-016) */}
                  <div className="bg-surface-2 p-2.5 rounded border border-hairline text-xs space-y-1">
                    <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                      Floor Direct Costs & Unit Cost Breakdown (SOP E-016)
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                      <div>
                        <span className="text-ink-subtle block text-[10px]">Direct Labour:</span>
                        <span className="font-semibold text-ink">₹{labour.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-ink-subtle block text-[10px]">Direct Overhead:</span>
                        <span className="font-semibold text-ink">₹{overhead.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-ink-subtle block text-[10px]">Total Unit Planned:</span>
                        <span className="font-bold text-primary">₹{totalPlannedCost.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-ink-subtle pt-1 flex justify-between">
                    <span>Approved by: {bom.approvedBy}</span>
                    <span>Created: {new Date(bom.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: WORK CENTRES & MACHINES (E-005) */}
      {activeTab === 'workcenters' && (
        <div className="space-y-4">
          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden shadow-xs">
            <div className="p-4 border-b border-hairline bg-canvas flex justify-between items-center">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Plant Work Centres, Machines & Hourly Rates (SOP E-005)
                </h3>
                <p className="text-xs text-ink-subtle mt-0.5">
                  Standard setup: Laser Cutting (₹1,200/hr), MIG Welding (₹600/hr), Powder Painting (₹800/hr) with scannable machine QR codes.
                </p>
              </div>
              <button
                onClick={() => setIsPrintMachineQRsOpen(true)}
                className="btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5 border border-hairline rounded hover:bg-canvas"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All QR Labels</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas/50 border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Machine / Work centre code</th>
                    <th className="px-4 py-3">Station name</th>
                    <th className="px-3 py-3">Location / Bay</th>
                    <th className="px-3 py-3 text-right">Hourly rate (INR)</th>
                    <th className="px-3 py-3 text-right">Daily capacity</th>
                    <th className="px-3 py-3">Machine QR identifier</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {workCenters.map((wc) => (
                    <tr key={wc.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-ink">
                        {wc.code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {wc.name}
                      </td>
                      <td className="px-3 py-3 text-ink-muted">
                        {wc.location || 'Bay 1 - Main Floor'}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-ink">
                        ₹{wc.hourlyRate.toLocaleString('en-IN')} / hr
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-ink-muted">
                        {wc.capacityHoursPerDay || 16} hrs/day
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-ink-subtle">
                        <div className="flex items-center gap-1.5">
                          <QrCode className="w-3.5 h-3.5 text-primary" />
                          <span>{wc.qrCode || `QR-${wc.code}`}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 capitalize">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                          {wc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditWC(wc)}
                            className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-canvas"
                            title="Edit hourly rate & capacity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWC(wc.id, wc.name)}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete work centre"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WHAT TO BUY (MRP SHORTAGE) (E-018) */}
      {activeTab === 'whattobuy' && (
        <div className="space-y-4">
          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden shadow-xs">
            <div className="p-4 border-b border-hairline bg-canvas flex justify-between items-center">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Material Shortage Analysis & What to Buy MRP Engine (SOP E-018)
                </h3>
                <p className="text-xs text-ink-subtle mt-0.5">
                  Calculates Net Shortage = Gross Demand (active work orders) - On Hand Stock - On Order Stock, applying minimum pack sizing and lead times.
                </p>
              </div>
              <button
                onClick={loadMRPShortages}
                className="btn-secondary text-xs flex items-center gap-1 py-1 px-2.5 border border-hairline rounded hover:bg-canvas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMRP ? 'animate-spin' : ''}`} />
                <span>Recalculate</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas/50 border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Raw material / Item</th>
                    <th className="px-3 py-3 text-right">Gross demand (WOs)</th>
                    <th className="px-3 py-3 text-right">Current on-hand</th>
                    <th className="px-3 py-3 text-right">Open on-order</th>
                    <th className="px-3 py-3 text-right">Net shortfall</th>
                    <th className="px-3 py-3 text-right">Suggested pack order</th>
                    <th className="px-3 py-3">Target buy-by date</th>
                    <th className="px-4 py-3 text-right">Procure action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {mrpShortages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                        No critical shortages detected. All scheduled production is covered by warehouse stock or open purchase orders.
                      </td>
                    </tr>
                  ) : (
                    mrpShortages.map((item, idx) => (
                      <tr key={idx} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{item.itemName}</div>
                          <div className="text-[10px] font-mono text-ink-subtle">{item.itemCode}</div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-medium text-ink">
                          {item.grossDemand} {item.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-muted">
                          {item.onHandStock} {item.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-muted">
                          {item.onOrderStock} {item.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-red-600">
                          {item.netShortage > 0 ? `-${item.netShortage}` : '0'} {item.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-primary">
                          {item.suggestedOrderQty} {item.uom}
                        </td>
                        <td className="px-3 py-3 font-mono text-ink-muted">
                          {item.targetBuyByDate || new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleCreateRFQFromShortage(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary text-white text-[11px] font-medium rounded hover:bg-primary-dark transition-colors shadow-xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>1-Click RFQ</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT MACHINE QR LABELS (E-005) */}
      {isPrintMachineQRsOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-canvas">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-ink">Print Machine QR Identification Labels (SOP E-005)</h3>
              </div>
              <button onClick={() => setIsPrintMachineQRsOpen(false)} className="text-ink-subtle hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-xs text-ink-muted mb-2">
                Thermal QR Label Sheet format (100mm x 50mm). Ready to print on Zebra / TSC label printers:
              </div>

              <div className="grid grid-cols-2 gap-4">
                {workCenters.map((wc) => (
                  <div key={wc.id} className="border-2 border-black rounded-lg p-4 bg-white space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">APEX PRECISION FABRICATION</div>
                        <div className="font-extrabold text-sm text-black">{wc.name}</div>
                        <div className="font-mono text-xs text-gray-700">{wc.code}</div>
                      </div>
                      <div className="w-16 h-16 bg-black flex items-center justify-center rounded">
                        <QrCode className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-400 pt-2 text-[10px] space-y-0.5 font-mono">
                      <div>RATE: ₹{wc.hourlyRate}/hr | CAPACITY: {wc.capacityHoursPerDay || 16} hrs</div>
                      <div>LOC: {wc.location || 'Bay 1 - Main Floor'}</div>
                      <div className="text-[9px] text-gray-600">SCAN VIA FACTORYFLOW OPERATOR APP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-hairline flex justify-end gap-2 bg-canvas">
              <button
                onClick={() => setIsPrintMachineQRsOpen(false)}
                className="btn-tertiary text-xs"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Send to Label Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT JOB CARD ROUTE TRAVELER (E-017) */}
      {selectedTravelerWO && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full border border-hairline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-canvas">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-ink">Shop Floor Job Card Route Traveler (SOP E-017)</h3>
              </div>
              <button onClick={() => setSelectedTravelerWO(null)} className="text-ink-subtle hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Traveler Header */}
              <div className="border border-black p-4 rounded space-y-3">
                <div className="flex items-center justify-between border-b border-black pb-3">
                  <div>
                    <h2 className="text-base font-bold text-black uppercase">APEX PRECISION INDUSTRIAL ERP</h2>
                    <div className="text-xs font-semibold text-gray-700">JOB CARD & ROUTING TRAVELER SHEET</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-black">{selectedTravelerWO.woNumber}</div>
                    <div className="text-[10px] text-gray-600 font-mono">Date: {new Date(selectedTravelerWO.startDate || Date.now()).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600 block text-[10px]">FINISHED PRODUCT:</span>
                    <span className="font-bold text-black">{selectedTravelerWO.productName}</span>
                    <span className="block font-mono text-[11px] text-gray-700">{selectedTravelerWO.productCode}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-600 block text-[10px]">BATCH RUN QUANTITY:</span>
                    <span className="font-mono font-bold text-sm text-black">{selectedTravelerWO.plannedQuantity} Nos</span>
                    <span className="block text-[10px] text-gray-600">BOM: {selectedTravelerWO.bomRevision}</span>
                  </div>
                </div>

                {/* Dynamic QR Box */}
                <div className="bg-gray-50 border border-gray-300 p-3 rounded flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-gray-800">DYNAMIC DIGITAL TRAVELER QR</div>
                    <div className="text-[10px] text-gray-600">Scan at each Work Centre station to log start & completion</div>
                    <div className="font-mono text-[10px] text-primary mt-1">{selectedTravelerWO.masterQrCode || `QR-WO-${selectedTravelerWO.woNumber}`}</div>
                  </div>
                  <div className="w-14 h-14 bg-black flex items-center justify-center rounded">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Routing Stages Table */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-black uppercase mb-1">
                    Compulsory Routing Stages & QC Gate (SOP E-017)
                  </div>
                  <table className="w-full text-left text-xs border border-black">
                    <thead className="bg-gray-100 border-b border-black text-[10px] font-bold">
                      <tr>
                        <th className="p-1.5 border-r border-black">Seq</th>
                        <th className="p-1.5 border-r border-black">Operation Stage</th>
                        <th className="p-1.5 border-r border-black">QC Compulsory?</th>
                        <th className="p-1.5 border-r border-black">Operator Sign</th>
                        <th className="p-1.5">QC Inspector Sign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black text-[11px]">
                      {(selectedTravelerWO.routingStages || [
                        { stageNumber: 1, stageName: 'Laser Cutting', isQcCompulsory: true },
                        { stageNumber: 2, stageName: 'MIG Welding', isQcCompulsory: true },
                        { stageNumber: 3, stageName: 'Powder Painting', isQcCompulsory: true }
                      ]).map((stage, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono font-bold border-r border-black">{stage.stageNumber}</td>
                          <td className="p-2 font-semibold border-r border-black">{stage.stageName}</td>
                          <td className="p-2 border-r border-black text-center">
                            {stage.isQcCompulsory ? (
                              <span className="font-bold text-red-600">YES (GATE)</span>
                            ) : (
                              <span>No</span>
                            )}
                          </td>
                          <td className="p-2 border-r border-black text-gray-400 font-mono text-[10px]">[ Sign & Date ]</td>
                          <td className="p-2 text-gray-400 font-mono text-[10px]">[ Stamp Passed ]</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-hairline flex justify-end gap-2 bg-canvas">
              <button onClick={() => setSelectedTravelerWO(null)} className="btn-tertiary text-xs">
                Close
              </button>
              <button onClick={() => window.print()} className="btn-primary text-xs flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" />
                <span>Print Job Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW CAD DRAWING (E-016) */}
      {selectedDrawingBOM && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-hairline shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-hairline flex items-center justify-between bg-canvas">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-ink">Engineering CAD Drawing (SOP E-016)</h3>
              </div>
              <button onClick={() => setSelectedDrawingBOM(null)} className="text-ink-subtle hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 space-y-3">
                <FileText className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <div className="font-bold text-ink text-sm">{selectedDrawingBOM.drawingName}</div>
                  <div className="text-xs text-ink-muted mt-1">Part: {selectedDrawingBOM.productName} ({selectedDrawingBOM.revision})</div>
                </div>
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded text-xs font-mono">
                  Vector Blueprint Loaded • Revision Validated
                </div>
              </div>

              <div className="text-xs text-ink-muted">
                Drawing file is attached to the BOM and embedded dynamically in the shop floor operator tablets at Laser Cutting & MIG Welding stations.
              </div>
            </div>

            <div className="p-4 border-t border-hairline flex justify-end gap-2 bg-canvas">
              <button onClick={() => setSelectedDrawingBOM(null)} className="btn-tertiary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE WORK CENTRE (E-005) */}
      {isCreateWCOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">
                {editingWC ? 'Edit Work Centre / Machine' : 'Add Work Centre / Machine (SOP E-005)'}
              </h2>
              <button
                onClick={() => {
                  setIsCreateWCOpen(false);
                  setEditingWC(null);
                }}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkCenter} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Work Centre Code *</label>
                <input
                  type="text"
                  required
                  value={wcCode}
                  onChange={(e) => setWcCode(e.target.value)}
                  placeholder="e.g. WC-LASER-01"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Station / Machine Name *</label>
                <input
                  type="text"
                  required
                  value={wcName}
                  onChange={(e) => setWcName(e.target.value)}
                  placeholder="e.g. Laser Cutting Station"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Hourly Cost Rate (INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={wcHourlyRate}
                    onChange={(e) => setWcHourlyRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                  />
                  <span className="text-[10px] text-ink-subtle">e.g. ₹1,200/hr, ₹600/hr</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Capacity (Hrs/Day)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={wcCapacityHours}
                    onChange={(e) => setWcCapacityHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                  />
                  <span className="text-[10px] text-ink-subtle">Typically 16 hrs (2 shifts)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Plant Location / Bay</label>
                <input
                  type="text"
                  value={wcLocation}
                  onChange={(e) => setWcLocation(e.target.value)}
                  placeholder="e.g. Bay A - Heavy Fabrication"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateWCOpen(false);
                    setEditingWC(null);
                  }}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  {editingWC ? 'Save changes' : 'Add Work Centre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE ORDER BOM (E-016) */}
      {isCreateBOMOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-xl overflow-hidden flex flex-col shadow-lift max-h-[90vh]">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  Create Order BOM with Direct Floor Costs (SOP E-016)
                </h2>
                <p className="text-[11px] text-ink-subtle">
                  Itemised component list with scrap %, floor direct labour & direct overhead costing.
                </p>
              </div>
              <button
                onClick={() => setIsCreateBOMOpen(false)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrderBOM} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">Finished Goods Product *</label>
                <select
                  required
                  value={bomProductId}
                  onChange={(e) => setBomProductId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                >
                  <option value="">Select Finished Product...</option>
                  {items.filter(i => i.category === 'finished_goods').map(i => (
                    <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>
                  ))}
                </select>
              </div>

              {/* Direct Floor Costs */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface-2 rounded-lg border border-hairline">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Direct Labour Cost (₹ / unit)</label>
                  <input
                    type="number"
                    min="0"
                    value={bomDirectLabour}
                    onChange={(e) => setBomDirectLabour(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Direct Overhead Cost (₹ / unit)</label>
                  <input
                    type="number"
                    min="0"
                    value={bomDirectOverhead}
                    onChange={(e) => setBomDirectOverhead(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Engineering CAD Drawing Attachment Name</label>
                <input
                  type="text"
                  value={bomDrawingName}
                  onChange={(e) => setBomDrawingName(e.target.value)}
                  placeholder="e.g. APEX-ENG-DWG-001.pdf"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              {/* Raw Materials / Components List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-ink">Bill of Materials Components</label>
                  <button
                    type="button"
                    onClick={() => setBomRows([...bomRows, { itemId: '', quantity: 1, scrapPercentage: 2, station: 'Laser Cutting' }])}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {bomRows.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-canvas p-2 rounded border border-hairline text-xs">
                      <select
                        required
                        value={row.itemId}
                        onChange={(e) => {
                          const updated = [...bomRows];
                          updated[idx].itemId = e.target.value;
                          setBomRows(updated);
                        }}
                        className="flex-1 px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink"
                      >
                        <option value="">Select Material...</option>
                        {items.filter(i => i.category === 'raw_material').map(i => (
                          <option key={i.id} value={i.id}>{i.name} ({i.itemCode})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) => {
                          const updated = [...bomRows];
                          updated[idx].quantity = Number(e.target.value);
                          setBomRows(updated);
                        }}
                        className="w-16 px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />

                      <input
                        type="number"
                        min="0"
                        placeholder="Scrap %"
                        value={row.scrapPercentage}
                        onChange={(e) => {
                          const updated = [...bomRows];
                          updated[idx].scrapPercentage = Number(e.target.value);
                          setBomRows(updated);
                        }}
                        className="w-16 px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />

                      <select
                        value={row.station}
                        onChange={(e) => {
                          const updated = [...bomRows];
                          updated[idx].station = e.target.value;
                          setBomRows(updated);
                        }}
                        className="w-28 px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink"
                      >
                        <option value="Laser Cutting">Cutting</option>
                        <option value="MIG Welding">Welding</option>
                        <option value="Powder Painting">Painting</option>
                      </select>

                      {bomRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBomRows(bomRows.filter((_, i) => i !== idx))}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreateBOMOpen(false)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Create Order BOM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WORK ORDER MODAL */}
      {isCreateWOOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">
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
                  value={woQuantity}
                  onChange={(e) => setWoQuantity(Number(e.target.value))}
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
