import React, { useState } from 'react';
import { 
  Download
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const ReportsModule: React.FC = () => {
  const { 
    items, 
    salesOrders, 
    workOrders, 
    qualityInspections, 
    activeCompany 
  } = useERP();

  const [reportType, setReportType] = useState<'production' | 'stock' | 'sales' | 'quality'>('production');

  const totalStockValuation = items.reduce((acc, itm) => acc + (itm.currentStock * itm.standardCost), 0);
  const totalSalesVal = salesOrders.reduce((acc, so) => acc + so.grandTotal, 0);

  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${activeCompany.code}_${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    if (reportType === 'production') {
      const headers = ['Work Order #', 'Product', 'Planned Qty', 'Produced Qty', 'Rejections', 'Status', 'Worker'];
      const rows = workOrders.map(w => [w.woNumber, w.productName, w.plannedQuantity, w.producedQuantity, w.rejectedQuantity, w.status, w.assignedWorker]);
      exportToCSV('Production_Report', headers, rows);
    } else if (reportType === 'stock') {
      const headers = ['Item Code', 'Item Name', 'Category', 'Current Stock', 'UOM', 'Unit Cost', 'Inventory Value'];
      const rows = items.map(i => [i.itemCode, i.name, i.category, i.currentStock, i.uom, i.standardCost, i.currentStock * i.standardCost]);
      exportToCSV('Stock_Valuation_Report', headers, rows);
    } else if (reportType === 'sales') {
      const headers = ['Order #', 'Customer', 'Customer PO', 'Due Date', 'Status', 'Taxable Val', 'Grand Total'];
      const rows = salesOrders.map(s => [s.soNumber, s.customerName, s.customerPoNumber, s.deliveryDate, s.status, s.subtotal, s.grandTotal]);
      exportToCSV('Sales_Register', headers, rows);
    } else {
      const headers = ['QC #', 'Reference', 'Item Inspected', 'Inspector', 'Sample Size', 'Verdict', 'Corrective Action'];
      const rows = qualityInspections.map(q => [q.inspectionNumber, q.referenceNumber, q.itemName, q.inspectorName, q.sampleSize, q.status, q.correctiveAction || 'Approved']);
      exportToCSV('Quality_Inspection_Report', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-ink-muted">Audit & operational data export</div>
          <h1 className="text-2xl font-medium text-ink tracking-tight mt-0.5">
            Reports & intelligence
          </h1>
        </div>

        <button
          onClick={handleExport}
          className="btn-secondary text-xs"
        >
          <Download className="w-3.5 h-3.5 text-ink-muted" />
          <span>Export report (.csv)</span>
        </button>
      </div>

      {/* Pill Toggle */}
      <div className="pill-container bg-surface-2 p-1 rounded-lg border border-hairline inline-flex items-center gap-1">
        <button
          onClick={() => setReportType('production')}
          className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            reportType === 'production' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
          }`}
        >
          Production output
        </button>
        <button
          onClick={() => setReportType('stock')}
          className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            reportType === 'stock' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
          }`}
        >
          Stock valuation
        </button>
        <button
          onClick={() => setReportType('sales')}
          className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            reportType === 'sales' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
          }`}
        >
          Sales register
        </button>
        <button
          onClick={() => setReportType('quality')}
          className={`pill-item px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            reportType === 'quality' ? 'pill-item-active bg-white shadow-xs text-primary font-bold border border-hairline' : 'text-ink-muted hover:text-ink hover:bg-white/60'
          }`}
        >
          QC logs
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-1 p-4 rounded-lg border border-hairline">
          <div className="text-xs text-ink-muted">Total inventory valuation</div>
          <div className="text-xl font-mono font-medium text-ink mt-1">
            ₹{totalStockValuation.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-surface-1 p-4 rounded-lg border border-hairline">
          <div className="text-xs text-ink-muted">Active order pipeline</div>
          <div className="text-xl font-mono font-medium text-ink mt-1">
            ₹{totalSalesVal.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-surface-1 p-4 rounded-lg border border-hairline">
          <div className="text-xs text-ink-muted">Total output produced</div>
          <div className="text-xl font-mono font-medium text-ink mt-1">
            {workOrders.reduce((a, b) => a + b.producedQuantity, 0)} nos
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-surface-1 rounded-lg border border-hairline overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'production' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="p-3">Work order #</th>
                  <th className="p-3">Part description</th>
                  <th className="p-3">Machinist</th>
                  <th className="p-3 text-right">Planned</th>
                  <th className="p-3 text-right">Produced</th>
                  <th className="p-3 text-right">Scrap</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {workOrders.map(w => (
                  <tr key={w.id} className="hover:bg-canvas/40">
                    <td className="p-3 font-mono text-ink">{w.woNumber}</td>
                    <td className="p-3 font-medium text-ink">{w.productName}</td>
                    <td className="p-3 text-ink-muted">{w.assignedWorker}</td>
                    <td className="p-3 text-right font-mono text-ink-muted">{w.plannedQuantity}</td>
                    <td className="p-3 text-right font-mono font-medium text-ink">{w.producedQuantity}</td>
                    <td className="p-3 text-right font-mono text-ink-muted">{w.rejectedQuantity}</td>
                    <td className="p-3 capitalize text-ink-muted">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'stock' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Part description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">On hand</th>
                  <th className="p-3 text-right">Cost (₹)</th>
                  <th className="p-3 text-right font-medium text-ink">Total value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-canvas/40">
                    <td className="p-3 font-mono text-ink">{i.itemCode}</td>
                    <td className="p-3 font-medium text-ink">{i.name}</td>
                    <td className="p-3 capitalize text-ink-muted">{i.category}</td>
                    <td className="p-3 text-right font-mono text-ink">{i.currentStock} {i.uom}</td>
                    <td className="p-3 text-right font-mono text-ink-muted">₹{i.standardCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-medium text-ink">₹{(i.currentStock * i.standardCost).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="p-3">SO #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Due date</th>
                  <th className="p-3 text-right">Taxable</th>
                  <th className="p-3 text-right font-medium text-ink">Total (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {salesOrders.map(s => (
                  <tr key={s.id} className="hover:bg-canvas/40">
                    <td className="p-3 font-mono text-ink">{s.soNumber}</td>
                    <td className="p-3 font-medium text-ink">{s.customerName}</td>
                    <td className="p-3 text-ink-muted">{s.deliveryDate}</td>
                    <td className="p-3 text-right font-mono text-ink-muted">₹{s.subtotal.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-medium text-ink">₹{s.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="p-3 capitalize text-ink-muted">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'quality' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas border-b border-hairline text-ink-muted font-medium">
                <tr>
                  <th className="p-3">QC #</th>
                  <th className="p-3">Reference lot</th>
                  <th className="p-3">Part inspected</th>
                  <th className="p-3 text-center">Sample size</th>
                  <th className="p-3">Verdict</th>
                  <th className="p-3">Disposition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-normal">
                {qualityInspections.map(qi => (
                  <tr key={qi.id} className="hover:bg-canvas/40">
                    <td className="p-3 font-mono text-ink">{qi.inspectionNumber}</td>
                    <td className="p-3 font-mono text-ink-muted">{qi.referenceNumber}</td>
                    <td className="p-3 font-medium text-ink">{qi.itemName}</td>
                    <td className="p-3 text-center font-mono text-ink-muted">{qi.sampleSize} nos</td>
                    <td className="p-3 capitalize font-medium text-ink">
                      {qi.status}
                    </td>
                    <td className="p-3 text-ink-muted">{qi.correctiveAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
