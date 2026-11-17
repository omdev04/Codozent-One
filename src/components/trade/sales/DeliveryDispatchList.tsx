import React, { useState } from 'react';
import { Truck, Search, Plus, Printer, FileText, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { DeliveryChallan } from '../../../types/erp';

interface DeliveryDispatchListProps {
  onNewDispatch: () => void;
}

export const DeliveryDispatchList: React.FC<DeliveryDispatchListProps> = ({ onNewDispatch }) => {
  const { deliveryChallans } = useERP();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredChallans = deliveryChallans.filter(dc => 
    dc.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dc.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dc.soNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dc.vehicleNumber && dc.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search challan #, SO #, customer, vehicle..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={onNewDispatch}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Delivery Challan
        </button>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredChallans.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No delivery challans recorded. Ready sales orders can be dispatched here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Challan Number</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Order Ref</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Transporter</th>
                  <th className="px-4 py-3">Vehicle & E-Way Bill</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChallans.map((dc) => (
                  <tr key={dc.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {dc.challanNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{dc.dispatchDate}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{dc.soNumber}</td>
                    <td className="px-4 py-3 text-slate-700">{dc.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{dc.transporterName}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      <div>{dc.vehicleNumber}</div>
                      <div className="text-[10px] text-slate-400">EWB: {dc.eWayBillNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 capitalize">
                        {dc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
