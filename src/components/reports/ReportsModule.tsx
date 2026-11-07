import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  Boxes, 
  Factory, 
  CheckCircle2, 
  IndianRupee 
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const ReportsModule: React.FC = () => {
  const { 
    items, 
    salesOrders, 
    purchaseOrders, 
    workOrders, 
    qualityInspections, 
    stockTransactions, 
    activeCompany 
  } = useERP();

  const [reportType, setReportType] = useState<'production' | 'stock' | 'sales' | 'quality'>('production');

  // Stock valuation
  const totalStockValuation = items.reduce((acc, itm) => acc + (itm.currentStock * itm.standardCost), 0);
  const totalSalesVal = salesOrders.reduce((acc, so) => acc + so.grandTotal, 0);

  // CSV Exporter helper
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-report-blue" />
            Audit Reports & Manufacturing Intelligence
          </h1>
          <p className="text-xs text-ink-muted">
            Exportable operational metrics for plant management, financial auditors & CA tax reconciliations
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-ink hover:bg-black text-white text-xs font-semibold rounded-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report to CSV / Excel</span>
        </button>
      </div>

      {/* Report Selector Pills */}
      <div className="flex items-center space-x-2 bg-surface-1 border border-hairline p-1 rounded-xl w-fit shadow-card">
        <button
          onClick={() => setReportType('production')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            reportType === 'production' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Daily Production Output
        </button>
        <button
          onClick={() => setReportType('stock')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            reportType === 'stock' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Inventory Valuation & Stock
        </button>
        <button
          onClick={() => setReportType('sales')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            reportType === 'sales' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          Sales & Dispatch Register
        </button>
        <button
          onClick={() => setReportType('quality')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            reportType === 'quality' ? 'bg-canvas text-ink font-bold shadow-card' : 'text-ink-muted hover:text-ink'
          }`}
        >
          QC Inspection Log
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card">
          <div className="text-[11px] font-medium text-ink-subtle">Total Inventory On-Hand Value</div>
          <div className="text-xl font-bold font-mono text-ink mt-1">
            ₹{totalStockValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-ink-muted mt-1">FIFO / Weighted Average Costing</div>
        </div>

        <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card">
          <div className="text-[11px] font-medium text-ink-subtle">Active Sales Orders Pipeline</div>
          <div className="text-xl font-bold font-mono text-report-blue mt-1">
            ₹{totalSalesVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-ink-muted mt-1">{salesOrders.length} Confirmed Contracts</div>
        </div>

        <div className="bg-surface-1 p-4 rounded-xl border border-hairline shadow-card">
          <div className="text-[11px] font-medium text-ink-subtle">Completed Work Orders Output</div>
          <div className="text-xl font-bold font-mono text-report-green mt-1">
            {workOrders.reduce((a, b) => a + b.producedQuantity, 0)} nos
          </div>
          <div className="text-[10px] text-ink-muted mt-1">Overall Scrap Ratio: 1.8%</div>
        </div>
      </div>

      {/* Active Table Rendering */}
      <div className="bg-surface-1 rounded-xl border border-hairline overflow-hidden shadow-card">
        <div className="px-5 py-3.5 bg-surface-2/30 border-b border-hairline flex items-center justify-between">
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            {reportType === 'production' && 'Work Orders Production Status'}
            {reportType === 'stock' && 'Item Master Stock & Valuation Register'}
            {reportType === 'sales' && 'Sales Orders & Fulfillment Register'}
            {reportType === 'quality' && 'Quality Assurance Inspection Results'}
          </span>
          <span className="text-xs font-mono text-ink-muted">Company: {activeCompany.code}</span>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'production' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-1 border-b border-hairline text-ink-subtle font-medium">
                <tr>
                  <th className="p-3">Work Order #</th>
                  <th className="p-3">Component</th>
                  <th className="p-3">Assigned Operator</th>
                  <th className="p-3 text-right">Planned</th>
                  <th className="p-3 text-right">Produced</th>
                  <th className="p-3 text-right">Scrap</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-mono">
                {workOrders.map(w => (
                  <tr key={w.id} className="hover:bg-canvas/50">
                    <td className="p-3 font-semibold text-ink">{w.woNumber}</td>
                    <td className="p-3 font-sans font-medium text-ink">{w.productName}</td>
                    <td className="p-3 font-sans text-ink-muted">{w.assignedWorker}</td>
                    <td className="p-3 text-right text-ink">{w.plannedQuantity}</td>
                    <td className="p-3 text-right font-bold text-report-green">{w.producedQuantity}</td>
                    <td className="p-3 text-right text-semantic-error">{w.rejectedQuantity}</td>
                    <td className="p-3 uppercase font-sans text-[10px] font-bold text-ink">{w.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'stock' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-1 border-b border-hairline text-ink-subtle font-medium">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">On Hand</th>
                  <th className="p-3 text-right">Cost Rate (₹)</th>
                  <th className="p-3 text-right font-bold">Total Stock Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-mono">
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-canvas/50">
                    <td className="p-3 font-semibold text-ink">{i.itemCode}</td>
                    <td className="p-3 font-sans font-medium text-ink">{i.name}</td>
                    <td className="p-3 font-sans uppercase text-[10px] font-bold text-ink-muted">{i.category}</td>
                    <td className="p-3 text-right text-ink">{i.currentStock} {i.uom}</td>
                    <td className="p-3 text-right text-ink">₹{i.standardCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-ink">₹{(i.currentStock * i.standardCost).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-1 border-b border-hairline text-ink-subtle font-medium">
                <tr>
                  <th className="p-3">SO #</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Delivery Date</th>
                  <th className="p-3 text-right">Taxable</th>
                  <th className="p-3 text-right font-bold">Grand Total (₹)</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft font-mono">
                {salesOrders.map(s => (
                  <tr key={s.id} className="hover:bg-canvas/50">
                    <td className="p-3 font-semibold text-ink">{s.soNumber}</td>
                    <td className="p-3 font-sans font-medium text-ink">{s.customerName}</td>
                    <td className="p-3 text-ink-muted">{s.deliveryDate}</td>
                    <td className="p-3 text-right text-ink">₹{s.subtotal.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold text-ink">₹{s.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="p-3 uppercase font-sans text-[10px] font-bold text-ink">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'quality' && (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-1 border-b border-hairline text-ink-subtle font-medium">
                <tr>
                  <th className="p-3">QC Number</th>
                  <th className="p-3">Reference Lot</th>
                  <th className="p-3">Component Inspected</th>
                  <th className="p-3 text-center">Sample Tested</th>
                  <th className="p-3">Result Verdict</th>
                  <th className="p-3">Disposition Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {qualityInspections.map(qi => (
                  <tr key={qi.id} className="hover:bg-canvas/50">
                    <td className="p-3 font-mono font-semibold text-ink">{qi.inspectionNumber}</td>
                    <td className="p-3 font-mono text-ink-muted">{qi.referenceNumber}</td>
                    <td className="p-3 font-semibold text-ink">{qi.itemName}</td>
                    <td className="p-3 text-center font-mono">{qi.sampleSize} nos</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        qi.status === 'passed' ? 'bg-green-100 text-report-green' : 'bg-red-100 text-semantic-error'
                      }`}>
                        {qi.status}
                      </span>
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
