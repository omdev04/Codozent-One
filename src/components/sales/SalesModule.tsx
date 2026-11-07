import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  FileText, 
  Truck, 
  Printer, 
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SalesOrder } from '../../types/erp';

export const SalesModule: React.FC = () => {
  const { 
    salesOrders, 
    customers, 
    items, 
    boms,
    createSalesOrder, 
    updateSalesOrderStatus, 
    createDeliveryChallan, 
    createSalesInvoiceFromOrder,
    createWorkOrder
  } = useERP();

  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderForChallan, setSelectedOrderForChallan] = useState<SalesOrder | null>(null);

  // New Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerPoNo, setCustomerPoNo] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderItems, setOrderItems] = useState<{ itemId: string; quantity: number; unitPrice: number }[]>([
    { itemId: '', quantity: 100, unitPrice: 0 }
  ]);
  const [orderNotes, setOrderNotes] = useState('');

  // Dispatch Form State
  const [transporter, setTransporter] = useState('VRL Logistics Ltd.');
  const [vehicleNo, setVehicleNo] = useState('MH 12 RN 8845');
  const [eWayBill, setEWayBill] = useState('241188339901');

  const finishedGoods = items.filter(i => i.category === 'finished_goods');

  const filteredOrders = salesOrders.filter(so => 
    so.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    so.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    so.customerPoNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItemRow = () => {
    setOrderItems([...orderItems, { itemId: '', quantity: 100, unitPrice: 0 }]);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const itm = items.find(i => i.id === itemId);
    const updated = [...orderItems];
    updated[index].itemId = itemId;
    updated[index].unitPrice = itm?.sellingPrice || 0;
    setOrderItems(updated);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    const formattedItems = orderItems
      .filter(oi => oi.itemId && oi.quantity > 0)
      .map(oi => {
        const itm = items.find(i => i.id === oi.itemId)!;
        const total = oi.quantity * oi.unitPrice;
        const tax = total * 0.18;
        return {
          id: `soi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          itemId: itm.id,
          itemCode: itm.itemCode,
          itemName: itm.name,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice,
          gstRate: 18,
          taxAmount: tax,
          totalAmount: total + tax,
          shippedQuantity: 0
        };
      });

    const subtotal = formattedItems.reduce((acc, itm) => acc + (itm.quantity * itm.unitPrice), 0);

    createSalesOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerPoNumber: customerPoNo || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      subtotal,
      items: formattedItems,
      notes: orderNotes
    });

    setIsCreateModalOpen(false);
    setSelectedCustomerId('');
    setOrderItems([{ itemId: '', quantity: 100, unitPrice: 0 }]);
  };

  const handleGenerateChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForChallan) return;
    createDeliveryChallan(selectedOrderForChallan.id, transporter, vehicleNo, eWayBill);
    setSelectedOrderForChallan(null);
  };

  const handleMakeWorkOrder = (so: SalesOrder) => {
    so.items.forEach(itm => {
      const bom = boms.find(b => b.productId === itm.itemId);
      if (bom) {
        createWorkOrder(itm.itemId, bom.id, itm.quantity, 'urgent', so.deliveryDate, so.id);
      }
    });
    updateSalesOrderStatus(so.id, 'in_production');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Order-to-cash workflow</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Sales & customer orders
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Pill Toggle */}
          <div className="pill-container">
            <button
              onClick={() => setActiveTab('orders')}
              className={`pill-item ${activeTab === 'orders' ? 'pill-item-active' : ''}`}
            >
              Sales orders
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`pill-item ${activeTab === 'customers' ? 'pill-item-active' : ''}`}
            >
              Customer master
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create order</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SO #, customer, PO..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          {/* Orders Table */}
          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-3 py-3">Customer PO #</th>
                    <th className="px-3 py-3">Due date</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right font-medium text-ink">Total</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {filteredOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-ink">
                        {so.soNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{so.customerName}</div>
                        <div className="text-[11px] text-ink-muted">
                          {so.items.length} line item(s)
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-ink-muted">
                        {so.customerPoNumber}
                      </td>
                      <td className="px-3 py-3 text-ink-muted">
                        {so.deliveryDate}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] font-medium text-ink-muted capitalize">
                          {so.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink-muted">
                        ₹{so.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-ink">
                        ₹{so.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {so.status === 'confirmed' && (
                            <button
                              onClick={() => handleMakeWorkOrder(so)}
                              className="px-2 py-1 bg-ink text-white text-[11px] font-medium rounded hover:bg-black transition-colors"
                            >
                              Release to shop-floor
                            </button>
                          )}

                          {['in_production', 'ready_for_dispatch'].includes(so.status) && (
                            <button
                              onClick={() => setSelectedOrderForChallan(so)}
                              className="px-2 py-1 bg-surface-1 border border-hairline hover:border-ink text-ink text-[11px] font-medium rounded transition-colors flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3 text-ink-muted" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {so.status === 'completed' && (
                            <button
                              onClick={() => createSalesInvoiceFromOrder(so.id)}
                              className="px-2 py-1 bg-surface-1 border border-hairline hover:border-ink text-ink text-[11px] font-medium rounded transition-colors flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-ink-muted" />
                              <span>Invoice</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Customers Master Table */
        <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Customer name</th>
                  <th className="px-4 py-3">GSTIN & PAN</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-right">Credit limit</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3">Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-canvas/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-ink">
                      {c.customerCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-muted">
                      <div>GST: {c.gstin}</div>
                      <div className="text-[10px] text-ink-subtle">PAN: {c.pan}</div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      <div>{c.contactPerson}</div>
                      <div className="text-[10px] text-ink-subtle">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink-muted">
                      ₹{c.creditLimit.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-ink">
                      ₹{c.outstandingBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {c.creditDays} days
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Create sales order
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Customer</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Customer PO number</label>
                  <input
                    type="text"
                    required
                    value={customerPoNo}
                    onChange={(e) => setCustomerPoNo(e.target.value)}
                    placeholder="e.g. TML/CVBU/882"
                    className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Target delivery date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink"
                />
              </div>

              {/* Order Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink">Manufactured parts</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-ink-muted hover:text-ink font-medium"
                  >
                    + Add line
                  </button>
                </div>

                {orderItems.map((oi, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-canvas p-2 rounded border border-hairline">
                    <div className="col-span-6">
                      <select
                        required
                        value={oi.itemId}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink"
                      >
                        <option value="">Select part...</option>
                        {finishedGoods.map(fg => (
                          <option key={fg.id} value={fg.id}>{fg.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={oi.quantity}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[index].quantity = Number(e.target.value);
                          setOrderItems(updated);
                        }}
                        className="w-full px-2 py-1 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        value={oi.unitPrice}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[index].unitPrice = Number(e.target.value);
                          setOrderItems(updated);
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
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Packaging specifications or heat treatment instructions..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Confirm order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH CHALLAN MODAL */}
      {selectedOrderForChallan && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Dispatch delivery challan
              </h2>
              <button
                onClick={() => setSelectedOrderForChallan(null)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateChallan} className="p-6 space-y-4">
              <div className="p-3 rounded bg-canvas border border-hairline text-xs space-y-1">
                <div className="font-medium text-ink">Order: {selectedOrderForChallan.soNumber}</div>
                <div className="text-ink-muted">Recipient: {selectedOrderForChallan.customerName}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Transporter</label>
                <input
                  type="text"
                  required
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Vehicle number</label>
                <input
                  type="text"
                  required
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="MH 12 RN 8845"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">E-Way bill number</label>
                <input
                  type="text"
                  required
                  value={eWayBill}
                  onChange={(e) => setEWayBill(e.target.value)}
                  placeholder="12-digit number"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForChallan(null)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Generate challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
