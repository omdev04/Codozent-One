import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Truck,
  Receipt,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { SalesOrder } from '../../types/erp';
import { SalesDashboard } from '../trade/sales/SalesDashboard';
import { SalesOrderList } from '../trade/sales/SalesOrderList';
import { SalesOrderFormModal } from '../trade/sales/SalesOrderFormModal';
import { SalesOrderDetailDrawer } from '../trade/sales/SalesOrderDetailDrawer';
import { SalesOrderPrintView } from '../trade/sales/SalesOrderPrintView';
import { DeliveryDispatchList } from '../trade/sales/DeliveryDispatchList';
import { DeliveryDispatchModal } from '../trade/sales/DeliveryDispatchModal';
import { SalesInvoiceList } from '../trade/sales/SalesInvoiceList';

interface SalesModuleProps {
  onNavigateToManufacturing?: () => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({ onNavigateToManufacturing }) => {
  const { salesOrders, invoices, updateSalesOrderStatus } = useERP();

  const [activeTab, setActiveTab] = useState<'orders' | 'dispatch' | 'invoices' | 'dashboard'>('orders');

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SalesOrder | null>(null);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<SalesOrder | null>(null);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<SalesOrder | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const pendingSalesCount = salesOrders.filter(s => ['confirmed', 'in_production'].includes(s.status)).length;
  const readyDispatchCount = salesOrders.filter(s => s.status === 'ready_for_dispatch').length;

  const handleOpenCreate = () => {
    setIsCreateModalOpen(true);
  };

  const handleSelectOrder = (order: SalesOrder) => {
    setSelectedOrderForDetail(order);
  };

  const handlePrintOrder = (order: SalesOrder) => {
    setSelectedOrderForPrint(order);
  };

  const handleDispatchOrder = (order: SalesOrder) => {
    setSelectedOrderForDispatch(order);
    setIsDispatchModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Module Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Sales Orders & Invoicing</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Order to Cash
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer Purchase Orders, Work Order generation, Delivery Challans, and GST Tax Invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Sales Order</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Sales Orders</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {salesOrders.length}
          </span>
          {pendingSalesCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title={`${pendingSalesCount} active orders`} />
          )}
        </button>

        <button
          onClick={() => setActiveTab('dispatch')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'dispatch'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery & Dispatch</span>
          {readyDispatchCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {readyDispatchCount} Ready
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'invoices'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Tax Invoices</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'dashboard'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Sales Analytics</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div>
        {activeTab === 'orders' && (
          <SalesOrderList
            onNewOrder={handleOpenCreate}
            onSelectOrder={handleSelectOrder}
            onPrintOrder={handlePrintOrder}
            onDispatchOrder={handleDispatchOrder}
            onAdvancePayment={(order) => setSelectedOrderForDetail(order)}
            onCancelOrder={(order) => updateSalesOrderStatus(order.id, 'cancelled')}
          />
        )}

        {activeTab === 'dispatch' && (
          <DeliveryDispatchList
            onNewDispatch={() => {
              setSelectedOrderForDispatch(null);
              setIsDispatchModalOpen(true);
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <SalesInvoiceList />
        )}

        {activeTab === 'dashboard' && (
          <SalesDashboard
            onNewOrder={handleOpenCreate}
            onViewOrders={() => setActiveTab('orders')}
            onSelectOrder={handleSelectOrder}
          />
        )}
      </div>

      {/* Sales Order Modal */}
      <SalesOrderFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(order) => {
          setIsCreateModalOpen(false);
          setSelectedOrderForDetail(order);
        }}
      />

      {/* Sales Order Drawer */}
      <SalesOrderDetailDrawer
        order={selectedOrderForDetail}
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        onPrint={handlePrintOrder}
        onDispatch={handleDispatchOrder}
        onAdvancePayment={(order) => {
          // Keep drawer open or handle advance modal
        }}
        onCancel={(order) => {
          updateSalesOrderStatus(order.id, 'cancelled');
          setSelectedOrderForDetail(null);
        }}
      />

      {/* Print View Modal */}
      <SalesOrderPrintView
        order={selectedOrderForPrint}
        isOpen={!!selectedOrderForPrint}
        onClose={() => setSelectedOrderForPrint(null)}
      />

      {/* Dispatch Modal */}
      <DeliveryDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setSelectedOrderForDispatch(null);
        }}
        order={selectedOrderForDispatch}
        onSuccess={() => {
          setIsDispatchModalOpen(false);
          setSelectedOrderForDispatch(null);
          setActiveTab('dispatch');
        }}
      />
    </div>
  );
};
