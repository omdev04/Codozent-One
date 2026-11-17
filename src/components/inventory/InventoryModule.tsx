import React, { useState } from 'react';
import { 
  Search, 
  Warehouse as WarehouseIcon, 
  X
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Item, ItemCategory } from '../../types/erp';

export const InventoryModule: React.FC = () => {
  const { 
    items, 
    warehouses, 
    stockTransactions, 
    adjustStock 
  } = useERP();

  const [activeTab, setActiveTab] = useState<'items' | 'ledger' | 'warehouses'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [adjustModalItem, setAdjustModalItem] = useState<Item | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Physical audit count verification');

  const filteredItems = items.filter(itm => {
    const matchesSearch = itm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itm.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itm.hsnSacCode.includes(searchTerm);
    const matchesCat = selectedCategory === 'all' || itm.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const lowStockItems = items.filter(i => i.currentStock <= i.reorderLevel);

  const handleStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    adjustStock(adjustModalItem.id, adjustModalItem.warehouseId, adjustQty, adjustReason);
    setAdjustModalItem(null);
    setAdjustQty(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Perpetual stock & stores control</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Inventory & warehouse stock
          </h1>
        </div>

        <div className="pill-container bg-surface-2 p-1 rounded-lg border border-hairline inline-flex items-center gap-1">
          <button
            onClick={() => setActiveTab('items')}
            className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'items'
                ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline'
                : 'text-ink-muted hover:text-ink hover:bg-white/60'
            }`}
          >
            Item master
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline'
                : 'text-ink-muted hover:text-ink hover:bg-white/60'
            }`}
          >
            Stock ledger
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              activeTab === 'warehouses'
                ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline'
                : 'text-ink-muted hover:text-ink hover:bg-white/60'
            }`}
          >
            Locations
          </button>
        </div>
      </div>

      {/* Subtle Low Stock Strip */}
      {lowStockItems.length > 0 && (
        <div className="bg-surface-1 border border-hairline p-3 rounded-lg flex items-center justify-between text-xs text-ink">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-fin-orange" />
            <span className="text-ink-muted">
              {lowStockItems.length} item(s) below reorder threshold: {lowStockItems.map(i => `${i.name} (${i.currentStock} ${i.uom})`).join(', ')}
            </span>
          </div>
          <span className="text-xs font-medium text-fin-orange">Reorder needed</span>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Controls: Search and Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-ink-subtle" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by part number, name, HSN..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-tertiary focus:outline-none focus:border-ink transition-colors"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'raw_material', 'wip', 'finished_goods', 'consumable'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                    selectedCategory === cat
                      ? 'bg-ink text-white font-medium'
                      : 'text-ink-muted hover:text-ink hover:bg-surface-2'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Part description</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">HSN/SAC</th>
                    <th className="px-4 py-3 text-right">Standard cost</th>
                    <th className="px-4 py-3 text-right font-medium text-ink">On hand</th>
                    <th className="px-3 py-3 text-right">Reorder level</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {filteredItems.map((itm) => {
                    const isLow = itm.currentStock <= itm.reorderLevel;
                    return (
                      <tr key={itm.id} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-ink">
                          {itm.itemCode}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{itm.name}</div>
                          <div className="text-[11px] text-ink-muted truncate max-w-sm">
                            {itm.description}
                          </div>
                        </td>
                        <td className="px-3 py-3 capitalize text-ink-muted">
                          {itm.category.replace('_', ' ')}
                        </td>
                        <td className="px-3 py-3 font-mono text-ink-muted">
                          {itm.hsnSacCode}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink-muted">
                          ₹{itm.standardCost.toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-medium ${isLow ? 'text-fin-orange' : 'text-ink'}`}>
                          {itm.currentStock} {itm.uom}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-muted">
                          {itm.reorderLevel} {itm.uom}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setAdjustModalItem(itm)}
                            className="px-2 py-1 text-[11px] font-medium text-ink bg-surface-1 border border-hairline hover:border-ink rounded transition-colors"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                  <tr>
                    <th className="px-4 py-3">Transaction #</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-3 py-3">Movement</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-3 py-3">Logged by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft font-normal">
                  {stockTransactions.map((st) => (
                    <tr key={st.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-ink">
                        {st.transactionNumber}
                      </td>
                      <td className="px-4 py-3 text-ink-muted font-mono text-[11px]">
                        {st.createdAt.slice(0, 16)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{st.itemName}</div>
                        <div className="text-[10px] font-mono text-ink-subtle">{st.itemCode}</div>
                      </td>
                      <td className="px-3 py-3 capitalize text-ink-muted">
                        {st.transactionType.replace('_', ' ')}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${
                        st.quantity > 0 ? 'text-ink' : 'text-ink-muted'
                      }`}>
                        {st.quantity > 0 ? `+${st.quantity}` : st.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-ink">
                        {st.runningBalance}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        <div>{st.referenceNumber}</div>
                        <div className="text-[10px] text-ink-subtle">{st.notes}</div>
                      </td>
                      <td className="px-3 py-3 text-ink-muted">{st.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warehouses.map(wh => (
            <div key={wh.id} className="bg-surface-1 p-5 rounded-lg border border-hairline space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-ink">{wh.name}</h3>
                  <span className="font-mono text-xs text-ink-muted">Code: {wh.code}</span>
                </div>
                <span className="text-[11px] text-ink-muted capitalize">
                  {wh.warehouseType.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-ink-muted">{wh.location}</p>
            </div>
          ))}
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustModalItem && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-1 border border-hairline rounded-xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 border-b border-hairline flex items-center justify-between">
              <h2 className="text-sm font-medium text-ink">
                Stock reconciliation adjustment
              </h2>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="p-1 rounded text-ink-subtle hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-6 space-y-4">
              <div className="p-3 bg-canvas rounded border border-hairline text-xs space-y-1">
                <div className="font-medium text-ink">{adjustModalItem.name}</div>
                <div className="text-ink-muted">Current balance: {adjustModalItem.currentStock} {adjustModalItem.uom}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Quantity variance (+ for surplus, - for deficit)
                </label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="e.g. -5 or +10"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Audit reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="btn-tertiary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  Post adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
