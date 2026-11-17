import React, { useState } from 'react';
import {
  Truck,
  Plus,
  FileCheck2,
  FileSpreadsheet,
  PackageCheck,
  Receipt,
  BarChart3,
  Layers
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PurchaseOrder, RFQ } from '../../types/erp';
import { PurchaseDashboard } from '../trade/purchase/PurchaseDashboard';
import { PurchaseOrderList } from '../trade/purchase/PurchaseOrderList';
import { PurchaseOrderFormModal } from '../trade/purchase/PurchaseOrderFormModal';
import { PurchaseOrderDetailDrawer } from '../trade/purchase/PurchaseOrderDetailDrawer';
import { PurchaseOrderPrintView } from '../trade/purchase/PurchaseOrderPrintView';
import { PurchaseRequisitionList } from '../trade/purchase/PurchaseRequisitionList';
import { PurchaseRequisitionModal } from '../trade/purchase/PurchaseRequisitionModal';
import { RFQList } from '../trade/purchase/RFQList';
import { RFQFormModal } from '../trade/purchase/RFQFormModal';
import { VendorComparisonMatrix } from '../trade/purchase/VendorComparisonMatrix';
import { VendorQuoteModal } from '../trade/purchase/VendorQuoteModal';
import { GRNList } from '../trade/purchase/GRNList';
import { GRNFormModal } from '../trade/purchase/GRNFormModal';
import { PurchaseBillList } from '../trade/purchase/PurchaseBillList';
import { PurchaseBillModal } from '../trade/purchase/PurchaseBillModal';

interface PurchaseModuleProps {
  onOpenMRP?: () => void;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({ onOpenMRP }) => {
  const { purchaseOrders, purchaseRequisitions, rfqs, grns, purchaseBills } = useERP();

  const [activeTab, setActiveTab] = useState<'orders' | 'requisitions' | 'rfqs' | 'grns' | 'bills' | 'dashboard'>('orders');

  // Modals & Drawers state
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState<PurchaseOrder | null>(null);
  const [selectedPOForPrint, setSelectedPOForPrint] = useState<PurchaseOrder | null>(null);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<PurchaseOrder | null>(null);
  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);

  // PR Modal
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);

  // RFQ Modals
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
  const [selectedRFQForMatrix, setSelectedRFQForMatrix] = useState<RFQ | null>(null);
  const [selectedRFQForQuote, setSelectedRFQForQuote] = useState<RFQ | null>(null);

  // Bill Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);

  const pendingPOCount = purchaseOrders.filter(p => p.status === 'ordered').length;
  const pendingPRCount = purchaseRequisitions.filter(pr => pr.status === 'pending_approval').length;

  const handleOpenCreatePO = () => {
    setIsCreatePOOpen(true);
  };

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPOForDetail(po);
  };

  const handlePrintPO = (po: PurchaseOrder) => {
    setSelectedPOForPrint(po);
  };

  const handleReceivePO = (po: PurchaseOrder) => {
    setSelectedPOForGRN(po);
    setIsGRNModalOpen(true);
  };

  const handleOpenMatrix = (rfq: RFQ) => {
    setSelectedRFQForMatrix(rfq);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Module Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Procurement & Sourcing</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Procure to Pay
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Requisitions, Vendor Quotation Comparison (L1/L2), Purchase Orders, GRN Inward & 3-Way Matching.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenMRP && (
            <button
              onClick={onOpenMRP}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Run MRP Engine</span>
            </button>
          )}

          <button
            onClick={handleOpenCreatePO}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'orders'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Purchase Orders</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {purchaseOrders.length}
          </span>
          {pendingPOCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title={`${pendingPOCount} pending delivery`} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('requisitions')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'requisitions'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Requisitions (PR)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {purchaseRequisitions.length}
          </span>
          {pendingPRCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {pendingPRCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rfqs')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'rfqs'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>RFQs & Quotes</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {rfqs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('grns')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'grns'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Goods Receipts (GRN)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {grns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'bills'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Vendor Bills (3-Way)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {purchaseBills.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Procurement Analytics</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div>
        {activeTab === 'orders' && (
          <PurchaseOrderList
            onNewPO={handleOpenCreatePO}
            onSelectPO={handleSelectPO}
            onPrintPO={handlePrintPO}
            onReceiveGRN={handleReceivePO}
            onCancelPO={() => {}}
          />
        )}

        {activeTab === 'requisitions' && (
          <PurchaseRequisitionList
            onNewPR={() => setIsPRModalOpen(true)}
            onConvertToPO={() => {
              handleOpenCreatePO();
            }}
          />
        )}

        {activeTab === 'rfqs' && (
          <RFQList
            onNewRFQ={() => setIsRFQModalOpen(true)}
            onOpenMatrix={handleOpenMatrix}
          />
        )}

        {activeTab === 'grns' && (
          <GRNList
            onNewGRN={() => {
              setSelectedPOForGRN(null);
              setIsGRNModalOpen(true);
            }}
          />
        )}

        {activeTab === 'bills' && (
          <PurchaseBillList
            onNewBill={() => setIsBillModalOpen(true)}
          />
        )}

        {activeTab === 'dashboard' && (
          <PurchaseDashboard
            onNewPO={handleOpenCreatePO}
            onNewPR={() => setIsPRModalOpen(true)}
            onViewPOs={() => setActiveTab('orders')}
            onSelectPO={handleSelectPO}
          />
        )}
      </div>

      {/* PO Create / Edit Modal */}
      <PurchaseOrderFormModal
        isOpen={isCreatePOOpen}
        onClose={() => setIsCreatePOOpen(false)}
        onSuccess={(po) => {
          setIsCreatePOOpen(false);
          setSelectedPOForDetail(po);
        }}
      />

      {/* PO Detail Drawer */}
      <PurchaseOrderDetailDrawer
        po={selectedPOForDetail}
        isOpen={!!selectedPOForDetail}
        onClose={() => setSelectedPOForDetail(null)}
        onPrint={handlePrintPO}
        onReceiveGRN={handleReceivePO}
        onCancel={() => setSelectedPOForDetail(null)}
      />

      {/* PO Print View Modal */}
      <PurchaseOrderPrintView
        po={selectedPOForPrint}
        isOpen={!!selectedPOForPrint}
        onClose={() => setSelectedPOForPrint(null)}
      />

      {/* PR Create Modal */}
      <PurchaseRequisitionModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        onSuccess={() => {
          setIsPRModalOpen(false);
          setActiveTab('requisitions');
        }}
      />

      {/* RFQ Create Modal */}
      <RFQFormModal
        isOpen={isRFQModalOpen}
        onClose={() => setIsRFQModalOpen(false)}
        onSuccess={() => {
          setIsRFQModalOpen(false);
          setActiveTab('rfqs');
        }}
      />

      {/* Vendor Quote Matrix */}
      <VendorComparisonMatrix
        rfq={selectedRFQForMatrix}
        isOpen={!!selectedRFQForMatrix}
        onClose={() => setSelectedRFQForMatrix(null)}
        onAwardSuccess={(po) => {
          setSelectedRFQForMatrix(null);
          setSelectedPOForDetail(po);
          setActiveTab('orders');
        }}
      />

      {/* Add Vendor Quote to RFQ Modal */}
      <VendorQuoteModal
        rfq={selectedRFQForQuote}
        isOpen={!!selectedRFQForQuote}
        onClose={() => setSelectedRFQForQuote(null)}
        onSuccess={() => {
          setSelectedRFQForQuote(null);
        }}
      />

      {/* GRN Create Modal */}
      <GRNFormModal
        isOpen={isGRNModalOpen}
        onClose={() => {
          setIsGRNModalOpen(false);
          setSelectedPOForGRN(null);
        }}
        po={selectedPOForGRN}
        onSuccess={() => {
          setIsGRNModalOpen(false);
          setSelectedPOForGRN(null);
          setActiveTab('grns');
        }}
      />

      {/* Purchase Bill Modal */}
      <PurchaseBillModal
        isOpen={isBillModalOpen}
        onClose={() => setIsBillModalOpen(false)}
        onSuccess={() => {
          setIsBillModalOpen(false);
          setActiveTab('bills');
        }}
      />
    </div>
  );
};
