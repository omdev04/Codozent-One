import React, { useState } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  History, 
  Warehouse as WarehouseIcon, 
  AlertTriangle, 
  ArrowDownRight, 
  ArrowUpRight,
  SlidersHorizontal,
  X,
  FileSpreadsheet
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
  const [adjustReason, setAdjustReason] = useState('Quarterly Physical Verification Audit');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Boxes className="w-5 h-5 text-fin-orange" />
            Inventory & Stores Control
          </h1>
          <p className="text-xs text-ink-muted">
            Master item catalog, perpetual stock ledger, multi-warehouse buffers & physical audit reconciliation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-surface-1 border border-hairline rounded-lg p-0.5 shadow-card">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'items' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Item Master
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'ledger' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Stock Ledger Audit
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'warehouses' ? 'bg-canvas text-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Warehouses
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Strip */}
      {lowStockItems.length > 0 && (
        <div className="bg-fin-orangeLight border border-fin-orange/30 p-3.5 rounded-xl flex items-center justify-between text-xs text-ink">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-fin-orange shrink-0" />
            <span>
              <strong>{lowStockItems.length} item(s) below reorder threshold:</strong>{' '}
              {lowStockItems.map(i => `${i.name} (${i.currentStock} ${i.uom})`).join(', ')}
            </span>
          </div>
          <span className="font-semibold text-fin-orange hover:underline cursor-pointer">
            Trigger Reorder
          </span>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Controls: Search and Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-muted" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code, item description, HSN..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-surface-1 border border-hairline text-ink placeholder:text-ink-subtle focus:outline-none focus:border-ink"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'raw_material', 'wip', 'finished_goods', 'consumable'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-ink text-white font-semibold'
                      : 'bg-surface-1 border border-hairline text-ink-muted hover:text-ink'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                  <tr>
                    <th className="px-4 py-3">Item Code</th>
                    <th className="px-4 py-3">Name & Description</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">HSN/SAC</th>
                    <th className="px-4 py-3 text-right">Standard Cost</th>
                    <th className="px-4 py-3 text-right">Current On-Hand</th>
                    <th className="px-3 py-3 text-right">Reorder Min</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {filteredItems.map((itm) => {
                    const isLow = itm.currentStock <= itm.reorderLevel;
                    return (
                      <tr key={itm.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-ink">
                          {itm.itemCode}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-ink">{itm.name}</div>
                          <div className="text-[11px] text-ink-subtle truncate max-w-sm">
                            {itm.description}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-ink uppercase">
                            {itm.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-ink-muted">
                          {itm.hsnSacCode}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-ink">
                          ₹{itm.standardCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          <span className={isLow ? 'text-fin-orange' : 'text-ink'}>
                            {itm.currentStock} {itm.uom}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-ink-muted">
                          {itm.reorderLevel} {itm.uom}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setAdjustModalItem(itm)}
                            className="px-2.5 py-1 text-[11px] font-medium text-ink bg-surface-1 border border-hairline hover:border-ink rounded transition-colors"
                          >
                            Adjust Stock
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
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>Audit Trail: Every inward, outward, issue and return is recorded cryptographically with timestamps.</span>
            <span className="font-mono">{stockTransactions.length} Total Ledger Records</span>
          </div>

          <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2/40 border-b border-hairline text-ink font-semibold">
                  <tr>
                    <th className="px-4 py-3">Transaction #</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Item & Code</th>
                    <th className="px-3 py-3">Movement Type</th>
                    <th className="px-4 py-3 text-right">Qty (+ / -)</th>
                    <th className="px-4 py-3 text-right">Balance After</th>
                    <th className="px-4 py-3">Reference / Notes</th>
                    <th className="px-3 py-3">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {stockTransactions.map((st) => (
                    <tr key={st.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">
                        {st.transactionNumber}
                      </td>
                      <td className="px-4 py-3 text-ink-muted font-mono text-[11px]">
                        {st.createdAt.slice(0, 16)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink">{st.itemName}</div>
                        <div className="text-[11px] font-mono text-ink-subtle">{st.itemCode}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          st.quantity > 0
                            ? 'bg-green-100 text-report-green'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {st.transactionType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${
                        st.quantity > 0 ? 'text-report-green' : 'text-ink'
                      }`}>
                        {st.quantity > 0 ? `+${st.quantity}` : st.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-ink">
                        {st.runningBalance}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{st.referenceNumber}</div>
                        <div className="text-[11px] text-ink-subtle truncate max-w-xs">{st.notes}</div>
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
            <div key={wh.id} className="bg-surface-1 p-5 rounded-xl border border-hairline shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <WarehouseIcon className="w-5 h-5 text-fin-orange" />
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{wh.name}</h3>
                    <span className="font-mono text-xs text-ink-muted">Code: {wh.code}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-surface-2 text-ink">
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
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-lift">
            <div className="px-6 py-4 bg-surface-1 border-b border-hairline flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-fin-orange" />
                Physical Stock Count Adjustment
              </h2>
              <button
                onClick={() => setAdjustModalItem(null)}
                className="p-1 rounded-md text-ink-subtle hover:text-ink hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-6 space-y-4">
              <div className="p-3 bg-surface-1 rounded-lg border border-hairline text-xs space-y-1">
                <div className="font-semibold text-ink">{adjustModalItem.name}</div>
                <div className="text-ink-muted">Current System Stock: {adjustModalItem.currentStock} {adjustModalItem.uom}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Quantity Difference (+ for surplus, - for shortage)
                </label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  placeholder="e.g. -15 or +20"
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Audit Reconciliation Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-md bg-surface-1 border border-hairline text-ink"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setAdjustModalItem(null)}
                  className="px-4 py-2 text-xs text-ink-muted hover:bg-surface-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Post Adjustment to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
