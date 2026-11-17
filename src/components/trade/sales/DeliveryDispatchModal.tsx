import React, { useState } from 'react';
import { X, Truck, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { SalesOrder, DeliveryChallan } from '../../../types/erp';

interface DeliveryDispatchModalProps {
  order: SalesOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (challan: DeliveryChallan) => void;
}

export const DeliveryDispatchModal: React.FC<DeliveryDispatchModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { salesOrders, createDeliveryChallan } = useERP();

  const [selectedOrderId, setSelectedOrderId] = useState<string>(order?.id || '');
  const [transporter, setTransporter] = useState('VRL Logistics Ltd.');
  const [vehicleNo, setVehicleNo] = useState('MH 12 RN 8845');
  const [eWayBill, setEWayBill] = useState('241188339901');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selected order if order prop changes
  React.useEffect(() => {
    if (order) setSelectedOrderId(order.id);
  }, [order]);

  if (!isOpen) return null;

  const currentOrder = order || salesOrders.find(s => s.id === selectedOrderId);
  const eligibleOrders = salesOrders.filter(s => 
    ['confirmed', 'in_production', 'ready_for_dispatch'].includes(s.status)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setErrorMessage('Please select a sales order to dispatch.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const challan = await createDeliveryChallan(selectedOrderId, transporter, vehicleNo, eWayBill);
      onSuccess(challan);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate delivery challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Generate Delivery Challan</h3>
              <p className="text-[11px] text-slate-500">Dispatch finished goods to customer with e-way bill</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!order && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Ready Sales Order <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose order...</option>
                {eligibleOrders.map(so => (
                  <option key={so.id} value={so.id}>
                    {so.soNumber} - {so.customerName} ({so.items.length} items)
                  </option>
                ))}
              </select>
            </div>
          )}

          {currentOrder && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="font-semibold text-slate-900 text-xs">
                {currentOrder.soNumber} • {currentOrder.customerName}
              </div>
              <div className="text-slate-500 text-[11px]">
                Items to dispatch: {currentOrder.items.map(i => `${i.itemName} (${i.quantity} ${i.uom || 'Nos'})`).join(', ')}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transporter / Logistics Partner</label>
            <input
              type="text"
              required
              value={transporter}
              onChange={(e) => setTransporter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vehicle Number</label>
            <input
              type="text"
              required
              placeholder="e.g. MH 12 RN 8845"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">E-Way Bill Number</label>
            <input
              type="text"
              required
              placeholder="12-digit e-way bill number"
              value={eWayBill}
              onChange={(e) => setEWayBill(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Creating Challan...' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
