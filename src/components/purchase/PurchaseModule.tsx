import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  PackageCheck,
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PurchaseOrder } from '../../types/erp';

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Procure-to-pay workflow</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Procurement & vendor orders
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <div className="pill-container">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pill-item ${activeTab === 'orders' ? 'pill-item-active' : ''}`}
            >
              Purchase orders
            </button>
            <button
              onClick={() => setActiveTab('grn')}
              className={`pill-item ${activeTab === 'grn' ? 'pill-item-active' : ''}`}
            >
              Dock receipts (GRN)
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`pill-item ${activeTab === 'suppliers' ? 'pill-item-active' : ''}`}
            >
              Suppliers
            </button>
          </div>

          <button
            onClick={onOpenMRP}
            className="btn-secondary text-xs"
          >
            <span>Scan MRP</span>
          </button>

          <button
            onClick={() => setIsCreatePOOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create PO</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by PO # or supplier..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">PO #</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-3 py-3">Order date</th>
                    <th className="px-3 py-3">Expected date</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right font-medium text-ink">Total</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-ink">
                        {po.poNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{po.supplierName}</div>
                        <div className="text-[11px] text-ink-muted">
                          {po.items.map(i => `${i.itemName} (${i.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{po.orderDate}</td>
                      <td className="px-3 py-3 text-ink-muted">{po.expectedDate}</td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] font-medium text-ink-muted capitalize">
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-muted">
                        ₹{po.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-ink">
                        ₹{po.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {po.status !== 'received' && (
                          <button
                            onClick={() => handleOpenGRNModal(po)}
                            className="px-2 py-1 bg-surface-1 border border-hairline hover:border-ink text-ink text-[11px] font-medium rounded transition-colors flex items-center gap-1 mx-auto"
                          >
                            <PackageCheck className="w-3 h-3 text-ink-muted" />
                            <span>Dock receipt</span>
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
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="px-4 py-3">GRN #</th>
                  <th className="px-4 py-3">PO #</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-3 py-3">Receipt date</th>
                  <th className="px-3 py-3">Invoice #</th>
                  <th className="px-4 py-3">Material & batch</th>
                  <th className="px-3 py-3">QC status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {grns.map((g) => (
                  <tr key={g.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-ink">{g.grnNumber}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{g.poNumber}</td>
                    <td className="px-4 py-3 font-medium text-ink">{g.supplierName}</td>
                    <td className="px-3 py-3 text-ink-muted">{g.receiptDate}</td>
                    <td className="px-3 py-3 font-mono text-ink-muted">{g.supplierInvoiceNo}</td>
                    <td className="px-4 py-3">
                      {g.items.map((gi, idx) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium text-ink">{gi.itemName}</span>: {gi.receivedQuantity} units
                          <span className="text-[10px] text-ink-subtle ml-1 font-mono">[{gi.batchNumber}]</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[11px] font-medium text-ink-muted capitalize">
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
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Supplier name</th>
                  <th className="px-4 py-3">GSTIN</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Payment terms</th>
                  <th className="px-3 py-3 text-center">Quality score</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-ink">{s.supplierCode}</td>
                    <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-ink-muted">{s.gstin}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      <div>{s.contactPerson}</div>
                      <div className="text-[10px] text-ink-subtle">{s.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{s.paymentTerms}</td>
                    <td className="px-3 py-3 text-center font-medium text-ink">
                      {s.rating} / 5.0
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-ink">
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
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Issue purchase order
              </h2>
              <button
                onClick={() => setIsCreatePOOpen(false)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Supplier</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Expected delivery date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink">Raw materials list</span>
                  <button
                    type="button"
                    onClick={() => setPoItems([...poItems, { itemId: '', quantity: 500, unitPrice: 0 }])}
                    className="text-xs text-ink-muted hover:text-ink font-medium"
                  >
                    + Add line
                  </button>
                </div>

                {poItems.map((pi, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-canvas p-2 rounded border border-hairline">
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
                        className="w-full px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink"
                      >
                        <option value="">Select material...</option>
                        {rawMaterials.map(rm => (
                          <option key={rm.id} value={rm.id}>{rm.name}</option>
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
                        className="w-full px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Rate (₹)"
                        value={pi.unitPrice}
                        onChange={(e) => {
                          const updated = [...poItems];
                          updated[idx].unitPrice = Number(e.target.value);
                          setPoItems(updated);
                        }}
                        className="w-full px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Notes</label>
                <textarea
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Material test certificates, physical hardness tolerance..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreatePOOpen(false)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Issue purchase order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCK GRN MODAL */}
      {selectedPOForGRN && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Goods receipt note (GRN)
              </h2>
              <button
                onClick={() => setSelectedPOForGRN(null)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGRN} className="p-6 space-y-4">
              <div className="p-3 bg-canvas rounded border border-hairline text-xs space-y-1">
                <div className="font-medium text-ink">PO reference: {selectedPOForGRN.poNumber}</div>
                <div className="text-ink-muted">Supplier: {selectedPOForGRN.supplierName}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Supplier invoice #</label>
                  <input
                    type="text"
                    required
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Heat / batch #</label>
                  <input
                    type="text"
                    required
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-ink">Material count</span>
                {selectedPOForGRN.items.map(itm => (
                  <div key={itm.id} className="bg-canvas p-2 rounded border border-hairline flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-ink">{itm.itemName}</div>
                      <div className="text-[10px] text-ink-subtle">Ordered: {itm.quantity}</div>
                    </div>
                    <div className="w-24">
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

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedPOForGRN(null)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Record GRN & place on hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
