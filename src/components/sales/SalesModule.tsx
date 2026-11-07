import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  FileText, 
  Truck, 
  Printer, 
  CheckCircle, 
  Eye, 
  Calendar,
  Building,
  ArrowRight,
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SalesOrder, Customer } from '../../types/erp';

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
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<SalesOrder | null>(null);

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

  // Filter finished products only
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
    // For each item in SO, check if BOM exists and trigger work order
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-report-blue" />
            Sales & Order-to-Cash
          </h1>
          <p className="text-xs text-ink-muted">
            Manage customer master, quotations, confirmed orders, dispatch challans & GST invoices
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
              Sales Orders
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'customers' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Customer Master
            </button>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by SO #, customer, customer PO..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink transition-colors"
            />
          </div>

          {/* Orders Table */}
          <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                  <tr>
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-3 py-3">Customer PO #</th>
                    <th className="px-3 py-3">Due Date</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Taxable</th>
                    <th className="px-4 py-3 text-right">Grand Total (GST)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {filteredOrders.map((so) => (
                    <tr key={so.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">
                        {so.soNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{so.customerName}</div>
                        <div className="text-[11px] text-ink-subtle">
                          {so.items.length} component line(s)
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-ink-muted">
                        {so.customerPoNumber}
                      </td>
                      <td className="px-3 py-3 text-ink-muted">
                        {so.deliveryDate}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          so.status === 'completed'
                            ? 'bg-green-100 text-report-green'
                            : so.status === 'in_production'
                            ? 'bg-blue-100 text-report-blue'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {so.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ink">
                        ₹{so.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-ink">
                        ₹{so.grandTotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          {/* 1-Click Send to Production */}
                          {so.status === 'confirmed' && (
                            <button
                              onClick={() => handleMakeWorkOrder(so)}
                              className="px-2.5 py-1 bg-ink hover:bg-black text-white text-[11px] font-medium rounded transition-colors"
                              title="Create Production Work Order from BOM"
                            >
                              Release to Production
                            </button>
                          )}

                          {/* Generate Delivery Challan */}
                          {['in_production', 'ready_for_dispatch'].includes(so.status) && (
                            <button
                              onClick={() => setSelectedOrderForChallan(so)}
                              className="px-2.5 py-1 bg-report-blue hover:bg-blue-700 text-white text-[11px] font-medium rounded transition-colors flex items-center gap-1"
                              title="Create Dispatch Challan"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* Generate GST Tax Invoice */}
                          {so.status === 'completed' && (
                            <button
                              onClick={() => createSalesInvoiceFromOrder(so.id)}
                              className="px-2.5 py-1 bg-report-green hover:bg-green-700 text-white text-[11px] font-medium rounded transition-colors flex items-center gap-1"
                              title="Generate GST Tax Invoice"
                            >
                              <FileText className="w-3 h-3" />
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
        <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                <tr>
                  <th className="px-4 py-3">Customer Code</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">GSTIN & PAN</th>
                  <th className="px-4 py-3">Contact Person</th>
                  <th className="px-4 py-3 text-right">Credit Limit</th>
                  <th className="px-4 py-3 text-right">Outstanding</th>
                  <th className="px-4 py-3">Payment Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-ink">
                      {c.customerCode}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {c.name}
                      <div className="text-[11px] text-ink-subtle font-normal">{c.city || 'Pune'}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-ink-muted">
                      <div>GST: {c.gstin}</div>
                      <div className="text-[10px] text-ink-subtle">PAN: {c.pan}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-ink">{c.contactPerson}</div>
                      <div className="text-[11px] text-ink-subtle">{c.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink">
                      ₹{c.creditLimit.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-600">
                      ₹{c.outstandingBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {c.creditDays} Days Net
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SALES ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-fin-orange" />
                Create New Sales Order
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Customer</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink"
                  >
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.customerCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Customer PO Number</label>
                  <input
                    type="text"
                    required
                    value={customerPoNo}
                    onChange={(e) => setCustomerPoNo(e.target.value)}
                    placeholder="e.g. TML/CVBU/2026/894"
                    className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink"
                />
              </div>

              {/* Order Items */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">Finished Goods Components</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-fin-orange font-semibold hover:underline"
                  >
                    + Add Item Row
                  </button>
                </div>

                {orderItems.map((oi, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-surface-1 p-2.5 rounded-lg border border-hairline">
                    <div className="col-span-6">
                      <select
                        required
                        value={oi.itemId}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                      >
                        <option value="">Select component...</option>
                        {finishedGoods.map(fg => (
                          <option key={fg.id} value={fg.id}>{fg.name} ({fg.itemCode})</option>
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
                        className="w-full px-2 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Unit Price (₹)"
                        value={oi.unitPrice}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[index].unitPrice = Number(e.target.value);
                          setOrderItems(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Notes / Instructions</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Special packaging, drawing revision note..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Save & Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH CHALLAN MODAL */}
      {selectedOrderForChallan && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <Truck className="w-4 h-4 text-report-blue" />
                Dispatch Delivery Challan
              </h2>
              <button
                onClick={() => setSelectedOrderForChallan(null)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateChallan} className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-surface-1 border border-hairline text-xs space-y-1">
                <div className="font-semibold text-ink">Order: {selectedOrderForChallan.soNumber}</div>
                <div className="text-ink-muted">Customer: {selectedOrderForChallan.customerName}</div>
                <div className="text-fin-orange font-medium mt-1">
                  Will decrement {selectedOrderForChallan.items.reduce((a, b) => a + b.quantity, 0)} units from Finished Goods store.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Transporter Name</label>
                <input
                  type="text"
                  required
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Vehicle Number</label>
                <input
                  type="text"
                  required
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH 12 RN 8845"
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">E-Way Bill Number</label>
                <input
                  type="text"
                  required
                  value={eWayBill}
                  onChange={(e) => setEWayBill(e.target.value)}
                  placeholder="12-digit GST e-Way Bill"
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForChallan(null)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-report-blue hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Confirm Dispatch & Challan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
