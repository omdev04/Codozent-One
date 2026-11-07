import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Layers, 
  CheckCircle2, 
  FileCheck, 
  Building2, 
  AlertCircle,
  X,
  PackageCheck
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PurchaseOrder, Supplier } from '../../types/erp';

interface PurchaseModuleProps {
  onOpenMRP: () => void;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ onOpenMRP }) => {
  const { 
    purchaseOrders, 
    suppliers, 
    items, 
    warehouses,
    createPurchaseOrder, 
    createGRN,
    grns 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'orders' | 'grn' | 'suppliers'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<PurchaseOrder | null>(null);

  // New PO State
  const [supplierId, setSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [poItems, setPoItems] = useState<{ itemId: string; quantity: number; unitPrice: number }[]>([
    { itemId: '', quantity: 500, unitPrice: 0 }
  ]);
  const [poNotes, setPoNotes] = useState('');

  // GRN Form State
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});

  const rawMaterials = items.filter(i => i.category === 'raw_material');

  const filteredPOs = purchaseOrders.filter(po => 
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find(s => s.id === supplierId);
    if (!supp) return;

    const formattedItems = poItems
      .filter(pi => pi.itemId && pi.quantity > 0)
      .map(pi => {
        const itm = items.find(i => i.id === pi.itemId)!;
        const total = pi.quantity * pi.unitPrice;
        const tax = total * 0.18;
        return {
          id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          quantity: pi.quantity,
          unitPrice: pi.unitPrice,
          gstRate: 18,
          taxAmount: tax,
          totalAmount: total + tax,
          receivedQuantity: 0
        };
      });

    const subtotal = formattedItems.reduce((acc, itm) => acc + (itm.quantity * itm.unitPrice), 0);

    createPurchaseOrder({
      supplierId: supp.id,
      supplierName: supp.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: expectedDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      subtotal,
      items: formattedItems,
      notes: poNotes
    });

    setIsCreatePOOpen(false);
    setSupplierId('');
    setPoItems([{ itemId: '', quantity: 500, unitPrice: 0 }]);
  };

  const handleOpenGRNModal = (po: PurchaseOrder) => {
    setSelectedPOForGRN(po);
    const initialQtys: Record<string, number> = {};
    po.items.forEach(itm => {
      initialQtys[itm.itemId] = itm.quantity - itm.receivedQuantity;
    });
    setReceivedQtys(initialQtys);
    setSupplierInvoiceNo(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
    setBatchNumber(`HEAT-${Date.now().toString().slice(-4)}`);
  };

  const handleSubmitGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForGRN) return;

    const grnItems = selectedPOForGRN.items.map(itm => ({
      itemId: itm.itemId,
      receivedQty: receivedQtys[itm.itemId] || 0,
      batchNo: batchNumber
    })).filter(g => g.receivedQty > 0);

    createGRN(
      selectedPOForGRN.id, 
      supplierInvoiceNo, 
      warehouses[0]?.id || 'wh-rms-01', 
      grnItems
    );

    setSelectedPOForGRN(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Truck className="w-5 h-5 text-report-orange" />
            Procure-to-Pay & Supplier Management
          </h1>
          <p className="text-xs text-ink-muted">
            Manage raw material vendors, purchase orders, dock receipts (GRN) & quality quarantine
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-surface-1 border border-hairline rounded-lg p-0.5 shadow-card">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'orders' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('grn')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'grn' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Goods Receipt (GRN)
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'suppliers' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Suppliers
            </button>
          </div>

          <button
            onClick={onOpenMRP}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-fin-orange hover:bg-fin-orangeHover text-white text-xs font-semibold rounded-md transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>MRP Engine</span>
          </button>

          <button
            onClick={() => setIsCreatePOOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New PO</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PO # or supplier name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                  <tr>
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-3 py-3">Order Date</th>
                    <th className="px-3 py-3">Expected Date</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right">Grand Total (GST)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">
                        {po.poNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{po.supplierName}</div>
                        <div className="text-[11px] text-ink-subtle">
                          {po.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{po.orderDate}</td>
                      <td className="px-3 py-3 text-ink-muted">{po.expectedDate}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          po.status === 'received'
                            ? 'bg-green-100 text-report-green'
                            : po.status === 'partially_received'
                            ? 'bg-blue-100 text-report-blue'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink">
                        ₹{po.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                        ₹{po.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {po.status !== 'received' && (
                          <button
                            onClick={() => handleOpenGRNModal(po)}
                            className="px-2.5 py-1 bg-report-blue hover:bg-blue-700 text-white text-[11px] font-medium rounded transition-colors flex items-center gap-1 mx-auto"
                            title="Record Goods Receipt at Dock"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Dock GRN</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'grn' && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                <tr>
                  <th className="px-4 py-3">GRN Number</th>
                  <th className="px-4 py-3">Purchase Order</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-3 py-3">Receipt Date</th>
                  <th className="px-3 py-3">Supplier Inv #</th>
                  <th className="px-4 py-3">Material & Batch</th>
                  <th className="px-3 py-3">QC Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {grns.map((g) => (
                  <tr key={g.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">{g.grnNumber}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{g.poNumber}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{g.supplierName}</td>
                    <td className="px-3 py-3 text-ink-muted">{g.receiptDate}</td>
                    <td className="px-3 py-3 font-mono text-ink-muted">{g.supplierInvoiceNo}</td>
                    <td className="px-4 py-3">
                      {g.items.map((gi, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-semibold text-ink">{gi.itemName}</span>: {gi.receivedQuantity} units
                          <span className="text-[10px] text-ink-subtle ml-1 font-mono">[{gi.batchNumber}]</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        g.qcStatus === 'inspected_passed'
                          ? 'bg-green-100 text-report-green'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {g.qcStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                <tr>
                  <th className="px-4 py-3">Supplier Code</th>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3">GSTIN</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3">Payment Terms</th>
                  <th className="px-3 py-3 text-center">Quality Rating</th>
                  <th className="px-4 py-3 text-right">Outstanding Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">{s.supplierCode}</td>
                    <td className="px-4 py-3 font-semibold text-ink">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{s.gstin}</td>
                    <td className="px-4 py-3">
                      <div>{s.contactPerson}</div>
                      <div className="text-[10px] text-ink-subtle">{s.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{s.paymentTerms}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-report-green bg-green-50 px-2 py-0.5 rounded">
                        ★ {s.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                      ₹{s.outstandingPayable.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {isCreatePOOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <Truck className="w-4 h-4 text-report-orange" />
                Issue New Purchase Order (PO)
              </h2>
              <button
                onClick={() => setIsCreatePOOpen(false)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Select Supplier</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.supplierCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Raw Materials to Procure</span>
                  <button
                    type="button"
                    onClick={() => setPoItems([...poItems, { itemId: '', quantity: 500, unitPrice: 0 }])}
                    className="text-xs text-fin-orange font-semibold hover:underline"
                  >
                    + Add Material Row
                  </button>
                </div>

                {poItems.map((pi, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-surface-1 p-2.5 rounded-lg border border-hairline">
                    <div className="col-span-6">
                      <select
                        required
                        value={pi.itemId}
                        onChange={(e) => {
                          const itm = items.find(i => i.id === e.target.value);
                          const updated = [...poItems];
                          updated[idx].itemId = e.target.value;
                          updated[idx].unitPrice = itm?.standardCost || 0;
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                      >
                        <option value="">Select raw material...</option>
                        {rawMaterials.map(rm => (
                          <option key={rm.id} value={rm.id}>{rm.name} ({rm.itemCode})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={pi.quantity}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].quantity = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Unit Rate (₹)"
                        value={pi.unitPrice}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].unitPrice = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Procurement Notes</label>
                <textarea
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Material test cert requirements, delivery location dock..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreatePOOpen(false)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCK GRN MODAL */}
      {selectedPOForGRN && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-report-blue" />
                Goods Receipt Note (GRN) Dock Inward
              </h2>
              <button
                onClick={() => setSelectedPOForGRN(null)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitGRN} className="p-6 space-y-4">
              <div className="p-3 bg-surface-1 rounded-lg border border-hairline text-xs space-y-1">
                <div className="font-semibold text-ink">Against PO: {selectedPOForGRN.poNumber}</div>
                <div className="text-ink-muted">Supplier: {selectedPOForGRN.supplierName}</div>
                <div className="text-fin-orange font-medium">
                  Material will be held in Quarantine for incoming QC inspection before release to production.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Supplier Invoice No.</label>
                  <input
                    type="text"
                    required
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Heat / Batch Lot No.</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-ink">Receiving Quantities</span>
                {selectedPOForGRN.items.map(itm => (
                  <div key={itm.id} className="bg-surface-1 p-2.5 rounded-lg border border-hairline flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-ink">{itm.itemName}</div>
                      <div className="text-[10px] text-ink-subtle">Ordered: {itm.quantity} · Already Recd: {itm.receivedQuantity}</div>
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        required
                        value={receivedQtys[itm.itemId] || 0}
                        onChange={(e) => setReceivedQtys({ ...receivedQtys, [itm.itemId]: Number(e.target.value) })}
                        className="w-full px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedPOForGRN(null)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-report-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Accept Delivery & Post GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
