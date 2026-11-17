import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Truck, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Layers, 
  Send, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  Award, 
  Package, 
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SalesOrder, PurchaseOrder, Quotation, PurchaseRequisition, RFQ } from '../../types/erp';

// Reused Existing Modules (Zero Duplication!)
import { CrmModule } from '../crm/CrmModule';
import { QuotationsModule } from '../quotations/QuotationsModule';

// Sales Sub-Components
import { SalesDashboard } from './sales/SalesDashboard';
import { SalesOrderList } from './sales/SalesOrderList';
import { SalesOrderFormModal } from './sales/SalesOrderFormModal';
import { SalesOrderDetailDrawer } from './sales/SalesOrderDetailDrawer';
import { SalesOrderPrintView } from './sales/SalesOrderPrintView';
import { DeliveryDispatchList } from './sales/DeliveryDispatchList';
import { DeliveryDispatchModal } from './sales/DeliveryDispatchModal';
import { SalesInvoiceList } from './sales/SalesInvoiceList';

// Purchase Sub-Components
import { PurchaseDashboard } from './purchase/PurchaseDashboard';
import { PurchaseRequisitionList } from './purchase/PurchaseRequisitionList';
import { PurchaseRequisitionModal } from './purchase/PurchaseRequisitionModal';
import { RFQList } from './purchase/RFQList';
import { RFQFormModal } from './purchase/RFQFormModal';
import { VendorComparisonMatrix } from './purchase/VendorComparisonMatrix';
import { PurchaseOrderList } from './purchase/PurchaseOrderList';
import { PurchaseOrderFormModal } from './purchase/PurchaseOrderFormModal';
import { PurchaseOrderDetailDrawer } from './purchase/PurchaseOrderDetailDrawer';
import { PurchaseOrderPrintView } from './purchase/PurchaseOrderPrintView';
import { GRNList } from './purchase/GRNList';
import { GRNFormModal } from './purchase/GRNFormModal';
import { PurchaseBillList } from './purchase/PurchaseBillList';
import { PurchaseBillModal } from './purchase/PurchaseBillModal';

interface TradeModuleProps {
  initialSection?: 'sales' | 'purchase';
  initialTab?: string;
  onNavigateToManufacturing?: () => void;
  onOpenMRP?: () => void;
}

export const TradeModule: React.FC<TradeModuleProps> = ({
  initialSection = 'sales',
  initialTab,
  onNavigateToManufacturing,
  onOpenMRP
}) => {
  const { 
    salesOrders, 
    purchaseOrders, 
    purchaseRequisitions, 
    quotations, 
    leads, 
    recordAdvancePayment,
    cancelSalesOrder,
    cancelPurchaseOrder
  } = useERP();

  // Primary Section: Sales vs Purchase
  const [section, setSection] = useState<'sales' | 'purchase'>(initialSection);

  // Sub-tabs
  const [salesTab, setSalesTab] = useState<'dashboard' | 'crm' | 'quotations' | 'orders' | 'dispatch' | 'invoices'>('dashboard');
  const [purchaseTab, setPurchaseTab] = useState<'dashboard' | 'requisitions' | 'rfq' | 'orders' | 'grn' | 'bills'>('dashboard');

  // Sales Modals / Drawers State
  const [isNewSOOpen, setIsNewSOOpen] = useState(false);
  const [selectedSOForDrawer, setSelectedSOForDrawer] = useState<SalesOrder | null>(null);
  const [selectedSOForPrint, setSelectedSOForPrint] = useState<SalesOrder | null>(null);
  const [selectedSOForDispatch, setSelectedSOForDispatch] = useState<SalesOrder | null>(null);
  const [selectedSOForAdvance, setSelectedSOForAdvance] = useState<SalesOrder | null>(null);
  const [selectedSOForCancel, setSelectedSOForCancel] = useState<SalesOrder | null>(null);
  const [advanceAmountInput, setAdvanceAmountInput] = useState<number>(0);
  const [advanceUtrInput, setAdvanceUtrInput] = useState<string>('');
  const [soCancelReason, setSoCancelReason] = useState<string>('');

  // Purchase Modals / Drawers State
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [initialPRForPO, setInitialPRForPO] = useState<PurchaseRequisition | null>(null);
  const [isNewPROpen, setIsNewPROpen] = useState(false);
  const [isNewRFQOpen, setIsNewRFQOpen] = useState(false);
  const [selectedRFQForMatrix, setSelectedRFQForMatrix] = useState<RFQ | null>(null);
  const [selectedPOForDrawer, setSelectedPOForDrawer] = useState<PurchaseOrder | null>(null);
  const [selectedPOForPrint, setSelectedPOForPrint] = useState<PurchaseOrder | null>(null);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<PurchaseOrder | null>(null);
  const [isNewGRNOpen, setIsNewGRNOpen] = useState(false);
  const [selectedPOForCancel, setSelectedPOForCancel] = useState<PurchaseOrder | null>(null);
  const [poCancelReason, setPoCancelReason] = useState<string>('');
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);

  // Counts for Badges
  const pendingSalesCount = salesOrders.filter(s => ['confirmed', 'in_production'].includes(s.status)).length;
  const pendingOrdersCount = purchaseOrders.filter(p => ['ordered', 'partially_received'].includes(p.status)).length;
  const pendingPRCount = purchaseRequisitions.filter(pr => ['pending_approval', 'submitted'].includes(pr.status)).length;

  const handleConfirmAdvance = async () => {
    if (!selectedSOForAdvance || advanceAmountInput <= 0) return;
    try {
      await recordAdvancePayment(selectedSOForAdvance.id, advanceAmountInput, 'NEFT / RTGS', advanceUtrInput || 'UTR-ADV-REC');
      setSelectedSOForAdvance(null);
      setAdvanceAmountInput(0);
      setAdvanceUtrInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to record advance');
    }
  };

  const handleConfirmCancelSO = async () => {
    if (!selectedSOForCancel || !soCancelReason.trim()) return;
    try {
      await cancelSalesOrder(selectedSOForCancel.id, soCancelReason);
      setSelectedSOForCancel(null);
      setSoCancelReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel sales order');
    }
  };

  const handleConfirmCancelPO = async () => {
    if (!selectedPOForCancel || !poCancelReason.trim()) return;
    try {
      await cancelPurchaseOrder(selectedPOForCancel.id, poCancelReason);
      setSelectedPOForCancel(null);
      setPoCancelReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel purchase order');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & High-Density Segmented Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trade Management</h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Unified Commercial Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Seamless integration of customer sales commitments, quotations, procurement requisitions, vendor comparison, and store inwarding.
          </p>
        </div>

        {/* Sales vs Purchase Segmented Control */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setSection('sales')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              section === 'sales'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sales Management</span>
            {pendingSalesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                section === 'sales' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingSalesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSection('purchase')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              section === 'purchase'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Purchase Management</span>
            {(pendingOrdersCount + pendingPRCount) > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                section === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingOrdersCount + pendingPRCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SECTION A: SALES */}
      {section === 'sales' && (
        <div className="space-y-4">
          {/* Sales Sub-navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
            <button
              onClick={() => setSalesTab('dashboard')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                salesTab === 'dashboard'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Sales Dashboard
            </button>
            <button
              onClick={() => setSalesTab('crm')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                salesTab === 'crm'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Leads / CRM
              {leads.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                  {leads.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSalesTab('quotations')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                salesTab === 'quotations'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Quotations
              {quotations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600">
                  {quotations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSalesTab('orders')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                salesTab === 'orders'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Sales Orders ({salesOrders.length})
            </button>
            <button
              onClick={() => setSalesTab('dispatch')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                salesTab === 'dispatch'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Dispatch & Challans
            </button>
            <button
              onClick={() => setSalesTab('invoices')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                salesTab === 'invoices'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Sales Invoices
            </button>
          </div>

          {/* Active Sales Sub-tab Content */}
          {salesTab === 'dashboard' && (
            <SalesDashboard
              onNewOrder={() => setIsNewSOOpen(true)}
              onViewOrders={() => setSalesTab('orders')}
              onSelectOrder={(order) => setSelectedSOForDrawer(order)}
            />
          )}

          {salesTab === 'crm' && (
            <div className="bg-white rounded-xl border border-slate-200 p-2">
              <CrmModule />
            </div>
          )}

          {salesTab === 'quotations' && (
            <div className="bg-white rounded-xl border border-slate-200 p-2">
              <QuotationsModule />
            </div>
          )}

          {salesTab === 'orders' && (
            <SalesOrderList
              onNewOrder={() => setIsNewSOOpen(true)}
              onSelectOrder={(order) => setSelectedSOForDrawer(order)}
              onPrintOrder={(order) => setSelectedSOForPrint(order)}
              onDispatchOrder={(order) => setSelectedSOForDispatch(order)}
              onAdvancePayment={(order) => {
                setSelectedSOForAdvance(order);
                setAdvanceAmountInput(order.advanceAmount || Math.round((order.grandTotal * (order.advancePercentage || 20)) / 100));
              }}
              onCancelOrder={(order) => setSelectedSOForCancel(order)}
            />
          )}

          {salesTab === 'dispatch' && (
            <DeliveryDispatchList
              onNewDispatch={() => setSelectedSOForDispatch(salesOrders[0] || null)}
            />
          )}

          {salesTab === 'invoices' && (
            <SalesInvoiceList />
          )}
        </div>
      )}

      {/* SECTION B: PURCHASE */}
      {section === 'purchase' && (
        <div className="space-y-4">
          {/* Purchase Sub-navigation Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
            <button
              onClick={() => setPurchaseTab('dashboard')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                purchaseTab === 'dashboard'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Purchase Dashboard
            </button>
            <button
              onClick={() => setPurchaseTab('requisitions')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                purchaseTab === 'requisitions'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Requisitions (PR)
              {pendingPRCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-700 font-bold">
                  {pendingPRCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setPurchaseTab('rfq')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                purchaseTab === 'rfq'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              RFQ / Tenders
            </button>
            <button
              onClick={() => setPurchaseTab('orders')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                purchaseTab === 'orders'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              onClick={() => setPurchaseTab('grn')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                purchaseTab === 'grn'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              GRN & Store Inward
            </button>
            <button
              onClick={() => setPurchaseTab('bills')}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                purchaseTab === 'bills'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Purchase Bills
            </button>
          </div>

          {/* Active Purchase Sub-tab Content */}
          {purchaseTab === 'dashboard' && (
            <PurchaseDashboard
              onNewPO={() => {
                setInitialPRForPO(null);
                setIsNewPOOpen(true);
              }}
              onNewPR={() => setIsNewPROpen(true)}
              onViewPOs={() => setPurchaseTab('orders')}
              onSelectPO={(po) => setSelectedPOForDrawer(po)}
            />
          )}

          {purchaseTab === 'requisitions' && (
            <PurchaseRequisitionList
              onNewPR={() => setIsNewPROpen(true)}
              onConvertToPO={(pr) => {
                setInitialPRForPO(pr);
                setIsNewPOOpen(true);
              }}
            />
          )}

          {purchaseTab === 'rfq' && (
            <RFQList
              onNewRFQ={() => setIsNewRFQOpen(true)}
              onOpenMatrix={(rfq) => setSelectedRFQForMatrix(rfq)}
            />
          )}

          {purchaseTab === 'orders' && (
            <PurchaseOrderList
              onNewPO={() => {
                setInitialPRForPO(null);
                setIsNewPOOpen(true);
              }}
              onSelectPO={(po) => setSelectedPOForDrawer(po)}
              onPrintPO={(po) => setSelectedPOForPrint(po)}
              onReceiveGRN={(po) => {
                setSelectedPOForGRN(po);
                setIsNewGRNOpen(true);
              }}
              onCancelPO={(po) => setSelectedPOForCancel(po)}
            />
          )}

          {purchaseTab === 'grn' && (
            <GRNList
              onNewGRN={() => {
                setSelectedPOForGRN(purchaseOrders[0] || null);
                setIsNewGRNOpen(true);
              }}
            />
          )}

          {purchaseTab === 'bills' && (
            <PurchaseBillList
              onNewBill={() => setIsNewBillOpen(true)}
            />
          )}
        </div>
      )}

      {/* GLOBAL SALES MODALS */}
      <SalesOrderFormModal
        isOpen={isNewSOOpen}
        onClose={() => setIsNewSOOpen(false)}
        onSuccess={(so) => {
          setSelectedSOForDrawer(so);
          setSalesTab('orders');
        }}
      />

      <SalesOrderDetailDrawer
        order={selectedSOForDrawer}
        isOpen={!!selectedSOForDrawer}
        onClose={() => setSelectedSOForDrawer(null)}
        onPrint={(so) => setSelectedSOForPrint(so)}
        onDispatch={(so) => setSelectedSOForDispatch(so)}
        onAdvancePayment={(so) => {
          setSelectedSOForAdvance(so);
          setAdvanceAmountInput(so.advanceAmount || Math.round((so.grandTotal * (so.advancePercentage || 20)) / 100));
        }}
        onCancel={(so) => setSelectedSOForCancel(so)}
      />

      <SalesOrderPrintView
        order={selectedSOForPrint}
        isOpen={!!selectedSOForPrint}
        onClose={() => setSelectedSOForPrint(null)}
      />

      <DeliveryDispatchModal
        order={selectedSOForDispatch}
        isOpen={!!selectedSOForDispatch}
        onClose={() => setSelectedSOForDispatch(null)}
        onSuccess={() => setSalesTab('dispatch')}
      />

      {/* Record Advance Payment Modal */}
      {selectedSOForAdvance && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Record Advance Payment</h4>
            <p className="text-slate-500">
              Order: {selectedSOForAdvance.soNumber} • {selectedSOForAdvance.customerName}
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Advance Amount Received (₹)</label>
              <input
                type="number"
                min="0"
                value={advanceAmountInput}
                onChange={(e) => setAdvanceAmountInput(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-bold text-amber-700"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bank UTR / Ref No.</label>
              <input
                type="text"
                placeholder="e.g. UTR-HDFC-9921448"
                value={advanceUtrInput}
                onChange={(e) => setAdvanceUtrInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSOForAdvance(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdvance}
                className="px-4 py-1.5 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Order Cancellation Modal */}
      {selectedSOForCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-rose-600 text-sm">Cancel Sales Order</h4>
            <p className="text-slate-500">
              Order: {selectedSOForCancel.soNumber} • {selectedSOForCancel.customerName}
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason <span className="text-rose-500">*</span></label>
              <textarea
                rows={3}
                required
                value={soCancelReason}
                onChange={(e) => setSoCancelReason(e.target.value)}
                placeholder="Explain why this order is being cancelled..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSOForCancel(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCancelSO}
                disabled={!soCancelReason.trim()}
                className="px-4 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL PURCHASE MODALS */}
      <PurchaseOrderFormModal
        isOpen={isNewPOOpen}
        onClose={() => {
          setIsNewPOOpen(false);
          setInitialPRForPO(null);
        }}
        initialPR={initialPRForPO}
        onSuccess={(po) => {
          setSelectedPOForDrawer(po);
          setPurchaseTab('orders');
        }}
      />

      <PurchaseOrderDetailDrawer
        po={selectedPOForDrawer}
        isOpen={!!selectedPOForDrawer}
        onClose={() => setSelectedPOForDrawer(null)}
        onPrint={(po) => setSelectedPOForPrint(po)}
        onReceiveGRN={(po) => {
          setSelectedPOForGRN(po);
          setIsNewGRNOpen(true);
        }}
        onCancel={(po) => setSelectedPOForCancel(po)}
      />

      <PurchaseOrderPrintView
        po={selectedPOForPrint}
        isOpen={!!selectedPOForPrint}
        onClose={() => setSelectedPOForPrint(null)}
      />

      <PurchaseRequisitionModal
        isOpen={isNewPROpen}
        onClose={() => setIsNewPROpen(false)}
        onSuccess={() => setPurchaseTab('requisitions')}
      />

      <RFQFormModal
        isOpen={isNewRFQOpen}
        onClose={() => setIsNewRFQOpen(false)}
        onSuccess={() => setPurchaseTab('rfq')}
      />

      <VendorComparisonMatrix
        rfq={selectedRFQForMatrix}
        isOpen={!!selectedRFQForMatrix}
        onClose={() => setSelectedRFQForMatrix(null)}
        onAwardSuccess={(po) => {
          setSelectedPOForDrawer(po);
          setPurchaseTab('orders');
        }}
      />

      <GRNFormModal
        po={selectedPOForGRN}
        isOpen={isNewGRNOpen}
        onClose={() => {
          setIsNewGRNOpen(false);
          setSelectedPOForGRN(null);
        }}
        onSuccess={() => setPurchaseTab('grn')}
      />

      <PurchaseBillModal
        isOpen={isNewBillOpen}
        onClose={() => setIsNewBillOpen(false)}
        onSuccess={() => setPurchaseTab('bills')}
      />

      {/* PO Cancellation Modal */}
      {selectedPOForCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-rose-600 text-sm">Cancel Purchase Order</h4>
            <p className="text-slate-500">
              PO: {selectedPOForCancel.poNumber} • {selectedPOForCancel.supplierName}
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cancellation Reason <span className="text-rose-500">*</span></label>
              <textarea
                rows={3}
                required
                value={poCancelReason}
                onChange={(e) => setPoCancelReason(e.target.value)}
                placeholder="Explain why this PO is being cancelled..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPOForCancel(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handleConfirmCancelPO}
                disabled={!poCancelReason.trim()}
                className="px-4 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
